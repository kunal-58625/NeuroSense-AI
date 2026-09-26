/**
 * Web Bluetooth (BLE) EEG Streaming Service & Real-Time Band Power Processor
 * Supports:
 * 1. Physical BLE Hardware (ESP32, Arduino Uno R4 WiFi, BioAmp Candy/NPG)
 * 2. Sliding window FFT to calculate Delta, Theta, Alpha, Beta, Gamma percentages
 * 3. High-fidelity Live Simulation Mode for hackathon presentations
 */

export interface EEGBandPowers {
  delta: number; // 0.5 - 4 Hz
  theta: number; // 4 - 8 Hz
  alpha: number; // 8 - 13 Hz
  beta: number;  // 13 - 30 Hz
  gamma: number; // 30 - 45 Hz
  timestamp: number;
  dominantBand: "delta" | "theta" | "alpha" | "beta" | "gamma";
  signalQuality: "GOOD" | "FAIR" | "POOR";
}

export type BLEConnectionStatus = 
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "simulating"
  | "error";

export type SimulationMentalState = "focused" | "relaxed" | "meditative" | "drowsy" | "dynamic";

// Standard & custom EEG BLE UUIDs
const NPG_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const NPG_CONTROL_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const NPG_DATA_CHAR_UUID = "0000ff01-0000-1000-8000-00805f9b34fb";
const NORDIC_UART_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NORDIC_TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

class FastFFT {
  private size: number;
  private cosTable: Float32Array;
  private sinTable: Float32Array;

  constructor(size: number = 256) {
    this.size = size;
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);
    for (let i = 0; i < size / 2; i++) {
      this.cosTable[i] = Math.cos((-2 * Math.PI * i) / size);
      this.sinTable[i] = Math.sin((-2 * Math.PI * i) / size);
    }
  }

  computeMagnitudes(input: Float32Array): Float32Array {
    const real = new Float32Array(this.size);
    const imag = new Float32Array(this.size);
    for (let i = 0; i < input.length && i < this.size; i++) {
      real[i] = input[i];
    }
    this.fft(real, imag);
    const mags = new Float32Array(this.size / 2);
    for (let i = 0; i < this.size / 2; i++) {
      mags[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / (this.size / 2);
    }
    return mags;
  }

  private fft(real: Float32Array, imag: Float32Array): void {
    const n = this.size;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
      let k = n / 2;
      while (k <= j) {
        j -= k;
        k /= 2;
      }
      j += k;
    }
    for (let l = 2; l <= n; l *= 2) {
      const le2 = l / 2;
      for (let k = 0; k < le2; k++) {
        const kth = k * (n / l);
        const c = this.cosTable[kth],
          s = this.sinTable[kth];
        for (let i = k; i < n; i += l) {
          const i2 = i + le2;
          const tr = c * real[i2] - s * imag[i2];
          const ti = c * imag[i2] + s * real[i2];
          real[i2] = real[i] - tr;
          imag[i2] = imag[i] - ti;
          real[i] += tr;
          imag[i] += ti;
        }
      }
    }
  }
}

export class BLEEEGService {
  private status: BLEConnectionStatus = "disconnected";
  private device: any = null;
  private server: any = null;
  private dataCharacteristic: any = null;
  private simulationInterval: any = null;
  private sampleBuffer: number[] = [];
  private fftProcessor = new FastFFT(256);
  private samplingRate = 250; // Hz default for single-channel frontal EEG

  private statusListeners: ((status: BLEConnectionStatus, message?: string) => void)[] = [];
  private bandListeners: ((bands: EEGBandPowers) => void)[] = [];
  private rawListeners: ((sample: number) => void)[] = [];

  private currentSimulationState: SimulationMentalState = "focused";

  getStatus(): BLEConnectionStatus {
    return this.status;
  }

  onStatus(callback: (status: BLEConnectionStatus, message?: string) => void) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  onBands(callback: (bands: EEGBandPowers) => void) {
    this.bandListeners.push(callback);
    return () => {
      this.bandListeners = this.bandListeners.filter((cb) => cb !== callback);
    };
  }

  onRawSample(callback: (sample: number) => void) {
    this.rawListeners.push(callback);
    return () => {
      this.rawListeners = this.rawListeners.filter((cb) => cb !== callback);
    };
  }

  private setStatus(status: BLEConnectionStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status, message));
  }

  private emitBands(bands: EEGBandPowers) {
    this.bandListeners.forEach((cb) => cb(bands));
  }

  private emitRaw(sample: number) {
    this.rawListeners.forEach((cb) => cb(sample));
  }

  /**
   * Connect to real physical Bluetooth LE hardware
   */
  async connect(): Promise<boolean> {
    this.disconnect();

    if (typeof window === "undefined" || !(navigator as any).bluetooth) {
      this.setStatus("error", "Web Bluetooth API is not supported in this browser. Please use Google Chrome or MS Edge.");
      return false;
    }

    try {
      this.setStatus("scanning", "Searching for frontal EEG BLE devices...");

      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: "NPG" },
          { namePrefix: "ESP32" },
          { namePrefix: "BioAmp" },
          { namePrefix: "Neuro" },
          { namePrefix: "Chords" },
        ],
        optionalServices: [
          NPG_SERVICE_UUID,
          NORDIC_UART_SERVICE,
          "0000180d-0000-1000-8000-00805f9b34fb", // Heart/Biopotential standard fallback
        ],
      });

      this.setStatus("connecting", `Connecting to ${device.name || "EEG Device"}...`);
      this.device = device;

      device.addEventListener("gattserverdisconnected", () => {
        this.setStatus("disconnected", "Device disconnected");
        this.cleanup();
      });

      const server = await device.gatt.connect();
      this.server = server;

      // Try discovering primary service
      let service: any = null;
      let characteristic: any = null;

      try {
        service = await server.getPrimaryService(NPG_SERVICE_UUID);
        // Start streaming command if control char is present
        try {
          const controlChar = await service.getCharacteristic(NPG_CONTROL_CHAR_UUID);
          await controlChar.writeValue(new TextEncoder().encode("START"));
        } catch (_) {}
        characteristic = await service.getCharacteristic(NPG_DATA_CHAR_UUID);
      } catch (_) {
        // Fallback to Nordic UART
        try {
          service = await server.getPrimaryService(NORDIC_UART_SERVICE);
          characteristic = await service.getCharacteristic(NORDIC_TX_CHAR);
        } catch (err) {
          throw new Error("Connected, but could not find supported EEG streaming characteristics.");
        }
      }

      this.dataCharacteristic = characteristic;
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", this.handleBLEPacket);

      this.setStatus("connected", `Live connected to ${device.name || "Frontal EEG Headset"}`);
      return true;
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        this.setStatus("disconnected", "Bluetooth pairing cancelled by user.");
      } else {
        this.setStatus("error", err.message || "Failed to connect to Bluetooth device");
      }
      return false;
    }
  }

  private handleBLEPacket = (event: any) => {
    const value: DataView = event.target.value;
    if (!value || value.byteLength === 0) return;

    // Check if ASCII text formatted (e.g. CSV "alpha,beta,gamma...")
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(value.buffer).trim();
      if (text.includes(",")) {
        const parts = text.split(",").map(Number);
        if (parts.length >= 5 && parts.every((n) => !isNaN(n))) {
          // Direct band powers packet: [delta, theta, alpha, beta, gamma]
          this.calculateRelativeBands(parts[0], parts[1], parts[2], parts[3], parts[4]);
          return;
        }
      }
    } catch (_) {}

    // Process raw 16-bit or 12-bit ADC samples
    for (let i = 0; i < value.byteLength; i += 2) {
      if (i + 1 < value.byteLength) {
        const sample = value.getInt16(i, true);
        this.sampleBuffer.push(sample);
        this.emitRaw(sample);
      }
    }

    // When buffer reaches 256 samples (1 second at 250Hz), compute FFT
    if (this.sampleBuffer.length >= 256) {
      const windowSamples = new Float32Array(this.sampleBuffer.slice(0, 256));
      this.sampleBuffer = this.sampleBuffer.slice(64); // sliding 75% overlap
      this.processFFTWindow(windowSamples);
    }
  };

  private processFFTWindow(samples: Float32Array) {
    const mags = this.fftProcessor.computeMagnitudes(samples);
    const freqStep = this.samplingRate / 256;

    let deltaSum = 0;
    let thetaSum = 0;
    let alphaSum = 0;
    let betaSum = 0;
    let gammaSum = 0;

    for (let i = 0; i < mags.length; i++) {
      const freq = i * freqStep;
      const mag = mags[i];
      if (freq >= 0.5 && freq < 4) deltaSum += mag;
      else if (freq >= 4 && freq < 8) thetaSum += mag;
      else if (freq >= 8 && freq < 13) alphaSum += mag;
      else if (freq >= 13 && freq < 30) betaSum += mag;
      else if (freq >= 30 && freq <= 45) gammaSum += mag;
    }

    this.calculateRelativeBands(deltaSum, thetaSum, alphaSum, betaSum, gammaSum);
  }

  private calculateRelativeBands(d: number, t: number, a: number, b: number, g: number) {
    const total = Math.max(0.0001, d + t + a + b + g);
    const delta = (d / total) * 100;
    const theta = (t / total) * 100;
    const alpha = (a / total) * 100;
    const beta = (b / total) * 100;
    const gamma = (g / total) * 100;

    const bands = [
      { key: "delta" as const, val: delta },
      { key: "theta" as const, val: theta },
      { key: "alpha" as const, val: alpha },
      { key: "beta" as const, val: beta },
      { key: "gamma" as const, val: gamma },
    ];
    bands.sort((x, y) => y.val - x.val);

    const dominantBand = bands[0].key;
    const signalQuality: "GOOD" | "FAIR" | "POOR" =
      delta > 85 ? "POOR" : delta > 60 ? "FAIR" : "GOOD";

    this.emitBands({
      delta,
      theta,
      alpha,
      beta,
      gamma,
      timestamp: Date.now(),
      dominantBand,
      signalQuality,
    });
  }

  /**
   * Start Live Simulated Stream (Essential for Hackathon presentations)
   */
  startSimulation(state: SimulationMentalState = "focused") {
    this.disconnect();
    this.currentSimulationState = state;
    this.setStatus("simulating", `Live Frontal EEG Simulation: ${state.toUpperCase()} state`);

    let t = 0;
    this.simulationInterval = setInterval(() => {
      t += 0.15;
      const noise = () => (Math.random() - 0.5) * 4;

      let d = 15, th = 15, a = 20, b = 35, g = 15;

      switch (this.currentSimulationState) {
        case "focused": // High Beta & Gamma (Frontal problem solving / mental alertness)
          b = 48 + Math.sin(t * 1.5) * 8 + noise();
          g = 22 + Math.cos(t * 2.1) * 6 + noise();
          a = 14 + Math.sin(t * 0.8) * 3;
          th = 10 + noise();
          d = 6 + noise();
          break;

        case "relaxed": // High Alpha (Eyes closed, relaxed awareness)
          a = 52 + Math.sin(t * 1.1) * 10 + noise();
          th = 20 + Math.cos(t * 0.9) * 4 + noise();
          b = 14 + noise();
          g = 6 + noise();
          d = 8 + noise();
          break;

        case "meditative": // High Theta + Alpha (Deep stillness)
          th = 44 + Math.sin(t * 0.7) * 8 + noise();
          a = 34 + Math.cos(t * 0.9) * 6 + noise();
          d = 12 + noise();
          b = 7 + noise();
          g = 3 + noise();
          break;

        case "drowsy": // High Delta & Theta
          d = 55 + Math.sin(t * 0.5) * 10 + noise();
          th = 28 + Math.cos(t * 0.6) * 5 + noise();
          a = 9 + noise();
          b = 5 + noise();
          g = 3 + noise();
          break;

        case "dynamic": // Cycles through cognitive states automatically
          const cycle = (Math.sin(t * 0.2) + 1) / 2; // 0 to 1
          if (cycle < 0.33) {
            // Calm
            a = 45 + Math.sin(t) * 8;
            th = 25;
            b = 15;
            g = 8;
            d = 7;
          } else if (cycle < 0.66) {
            // Focus
            b = 48 + Math.sin(t * 1.8) * 9;
            g = 25 + Math.cos(t * 2) * 5;
            a = 15;
            th = 8;
            d = 4;
          } else {
            // Deep Theta
            th = 45 + Math.sin(t * 0.8) * 7;
            a = 30;
            d = 15;
            b = 6;
            g = 4;
          }
          break;
      }

      this.calculateRelativeBands(
        Math.max(1, d),
        Math.max(1, th),
        Math.max(1, a),
        Math.max(1, b),
        Math.max(1, g)
      );
    }, 180); // ~5-6 Hz update rate for silky smooth UI
  }

  setSimulationState(state: SimulationMentalState) {
    this.currentSimulationState = state;
    if (this.status === "simulating") {
      this.setStatus("simulating", `Live Frontal EEG Simulation: ${state.toUpperCase()} state`);
    }
  }

  disconnect() {
    this.cleanup();
    this.setStatus("disconnected", "EEG stream disconnected");
  }

  private cleanup() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.dataCharacteristic) {
      try {
        this.dataCharacteristic.removeEventListener("characteristicvaluechanged", this.handleBLEPacket);
        this.dataCharacteristic.stopNotifications().catch(() => {});
      } catch (_) {}
      this.dataCharacteristic = null;
    }
    if (this.device && this.device.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (_) {}
    }
    this.device = null;
    this.server = null;
    this.sampleBuffer = [];
  }
}

// Global Singleton Instance
export const bleEEGService = new BLEEEGService();
