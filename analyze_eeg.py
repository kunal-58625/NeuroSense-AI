import os
import sys
import numpy as np
import pandas as pd
from scipy.signal import welch, butter, filtfilt, iirnotch

# ================= SETTINGS (From User) =================
FS = 500                       # Sampling rate
SEGMENT_DURATION = 60
SAMPLES_PER_SEGMENT = FS * SEGMENT_DURATION

LOWCUT = 0.5                   # Bandpass lower freq
HIGHCUT = 45                   # Bandpass upper freq

NOTCH_FREQ = 50                # India powerline
Q = 30                         # notch filter quality

ARTIFACT_THRESHOLD = 150       # microvolt threshold

# EEG frequency bands
BANDS = {
    "Delta": (0.5,4),
    "Theta": (4,8),
    "Alpha": (8,13),
    "Beta": (13,30),
    "Gamma": (30,45)
}

def bandpass_filter(signal):
    nyq = 0.5 * FS
    low = LOWCUT / nyq
    high = HIGHCUT / nyq
    b,a = butter(4,[low,high],btype='band')
    return filtfilt(b,a,signal)

def notch_filter(signal):
    nyq = 0.5 * FS
    w0 = NOTCH_FREQ / nyq
    b,a = iirnotch(w0,Q)
    return filtfilt(b,a,signal)

def remove_artifacts(signal):
    clean = signal.copy()
    idx = np.where(np.abs(clean) > ARTIFACT_THRESHOLD)
    clean[idx] = np.nan
    # Use the user's specific fillna logic
    clean = pd.Series(clean).interpolate().bfill().values
    return clean

try:
    from scipy.integrate import trapezoid
except ImportError:
    trapezoid = getattr(np, 'trapezoid', getattr(np, 'trapz', None))

def bandpower(psd, freqs, band):
    low, high = band
    idx = (freqs >= low) & (freqs <= high)
    return trapezoid(psd[idx], freqs[idx])

def process_file(filepath):
    # Match user's reading logic exactly
    df = pd.read_csv(filepath, header=None)
    df[1] = pd.to_numeric(df[1], errors='coerce')
    df = df.dropna()

    eeg = df.iloc[:,1].values.astype(float)
    
    filename = os.path.basename(filepath).replace(".csv","")
    data_folder = os.path.dirname(filepath)

    # 1: Bandpass Filter
    eeg = bandpass_filter(eeg)

    # 2: Notch Filter
    eeg = notch_filter(eeg)

    # 3: Artifact Removal
    eeg = remove_artifacts(eeg)

    # Save cleaned signal (using user's naming convention)
    clean_df = pd.DataFrame({"EEG_Cleaned":eeg})
    clean_output = os.path.join(data_folder, filename + "_CleanedSignal.csv")
    clean_df.to_csv(clean_output, index=False)

    # 4: Frequency Spectrum (using user's naming convention)
    freqs,psd = welch(eeg, FS, nperseg=FS*2)
    freq_df = pd.DataFrame({
        "Frequency_Hz":freqs,
        "Power":psd
    })
    freq_output = os.path.join(data_folder, filename + "_FrequencySpectrum.csv")
    freq_df.to_csv(freq_output, index=False)

    # 5: Band Power Across Entire Dataset (Second-by-Second for all data)
    results = []
    
    total_seconds = max(1, len(eeg) // FS)

    for sec in range(total_seconds):
        start = sec * FS
        # 2-second window with 1-second step provides 0.5Hz spectral resolution and smooth time continuity
        end = min(len(eeg), start + FS * 2)
        if (end - start) < FS and len(eeg) >= FS:
            start = max(0, len(eeg) - FS)
            end = len(eeg)

        segment = eeg[start:end]
        if len(segment) < 10:
            continue
        
        nperseg = min(len(segment), FS)
        freqs, psd = welch(segment, FS, nperseg=nperseg)
        
        band_powers = {}
        for band, freq_range in BANDS.items():
            band_powers[band] = bandpower(psd, freqs, freq_range)
        
        total_band_power = sum(band_powers.values())
        if total_band_power == 0:
            total_band_power = 1.0
            
        row = {
            "File": filename,
            "Second": sec + 1,
            "Minute": round((sec + 1) / 60.0, 2)
        }

        for band in BANDS.keys():
            row[band + "_%"] = round((band_powers[band] / total_band_power) * 100, 2)
        
        results.append(row)

    if results:
        band_df = pd.DataFrame(results)
        band_output = os.path.join(data_folder, filename + "_BandPower_PerMinute.csv")
        band_df.to_csv(band_output, index=False)
        print(f"Processed {len(results)} seconds for: {filename}")
    else:
        print(f"File too short to process: {filename}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_eeg.py <path_to_csv>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    process_file(input_path)

if __name__ == "__main__":
    main()
