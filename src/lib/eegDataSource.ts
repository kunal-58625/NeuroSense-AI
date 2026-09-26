/**
 * EEG Data Source Abstraction Layer
 * Supports CSV File Uploads, Demo Datasets, and Future ESP32 BLE Live Streaming
 */

export type DataSourceType = "CSV" | "DEMO" | "BLE";

export interface EEGDataSource {
  type: DataSourceType;
  name: string;
  getData(): Promise<string>;
}

export const DEMO_EEG_CSV = `File,Second,Delta_%,Theta_%,Alpha_%,Beta_%,Gamma_%
Demo-EEG-Recording,1,38.2,14.5,12.8,24.1,10.4
Demo-EEG-Recording,2,36.5,15.2,13.4,24.8,10.1
Demo-EEG-Recording,3,34.8,16.0,14.2,25.3,9.7
Demo-EEG-Recording,4,33.1,16.5,15.0,26.0,9.4
Demo-EEG-Recording,5,31.4,17.1,16.2,26.5,8.8
Demo-EEG-Recording,6,29.8,17.8,17.5,26.9,8.0
Demo-EEG-Recording,7,28.2,18.4,19.0,27.1,7.3
Demo-EEG-Recording,8,26.5,19.0,20.8,26.8,6.9
Demo-EEG-Recording,9,25.0,19.5,22.5,26.4,6.6
Demo-EEG-Recording,10,23.8,19.8,24.2,25.8,6.4
Demo-EEG-Recording,11,22.5,20.1,26.0,25.2,6.2
Demo-EEG-Recording,12,21.4,20.3,28.1,24.3,5.9
Demo-EEG-Recording,13,20.5,20.4,30.2,23.4,5.5
Demo-EEG-Recording,14,19.8,20.5,32.4,22.2,5.1
Demo-EEG-Recording,15,19.2,20.2,34.5,21.3,4.8
Demo-EEG-Recording,16,18.8,19.8,36.2,20.6,4.6
Demo-EEG-Recording,17,18.5,19.4,38.0,19.8,4.3
Demo-EEG-Recording,18,18.2,18.9,39.5,19.2,4.2
Demo-EEG-Recording,19,18.0,18.4,41.2,18.5,3.9
Demo-EEG-Recording,20,18.1,17.8,42.8,17.6,3.7
Demo-EEG-Recording,21,18.4,17.1,44.2,16.8,3.5
Demo-EEG-Recording,22,18.9,16.5,45.1,16.2,3.3
Demo-EEG-Recording,23,19.5,15.8,45.8,15.7,3.2
Demo-EEG-Recording,24,20.2,15.2,46.0,15.4,3.2
Demo-EEG-Recording,25,21.0,14.8,45.5,15.5,3.2
Demo-EEG-Recording,26,22.1,14.5,44.2,15.9,3.3
Demo-EEG-Recording,27,23.5,14.2,42.4,16.5,3.4
Demo-EEG-Recording,28,25.0,14.1,40.1,17.2,3.6
Demo-EEG-Recording,29,26.8,14.0,37.5,17.9,3.8
Demo-EEG-Recording,30,28.5,14.2,34.8,18.5,4.0
Demo-EEG-Recording,31,29.9,14.5,32.0,19.2,4.4
Demo-EEG-Recording,32,31.0,15.0,29.5,19.8,4.7
Demo-EEG-Recording,33,31.8,15.6,27.2,20.4,5.0
Demo-EEG-Recording,34,32.2,16.2,25.1,21.1,5.4
Demo-EEG-Recording,35,32.0,16.8,23.4,22.0,5.8
Demo-EEG-Recording,36,31.5,17.4,21.8,23.0,6.3
Demo-EEG-Recording,37,30.6,17.9,20.5,24.1,6.9
Demo-EEG-Recording,38,29.4,18.2,19.4,25.3,7.7
Demo-EEG-Recording,39,28.0,18.4,18.5,26.6,8.5
Demo-EEG-Recording,40,26.5,18.4,17.8,27.8,9.5
Demo-EEG-Recording,41,25.0,18.2,17.2,29.0,10.6
Demo-EEG-Recording,42,23.6,17.8,16.8,30.1,11.7
Demo-EEG-Recording,43,22.4,17.2,16.5,31.2,12.7
Demo-EEG-Recording,44,21.5,16.5,16.3,32.1,13.6
Demo-EEG-Recording,45,20.8,15.8,16.2,32.8,14.4
Demo-EEG-Recording,46,20.4,15.1,16.2,33.3,15.0
Demo-EEG-Recording,47,20.2,14.5,16.3,33.5,15.5
Demo-EEG-Recording,48,20.3,14.0,16.5,33.4,15.8
Demo-EEG-Recording,49,20.7,13.6,16.8,33.0,15.9
Demo-EEG-Recording,50,21.4,13.3,17.2,32.2,15.9
Demo-EEG-Recording,51,22.4,13.1,17.7,31.2,15.6
Demo-EEG-Recording,52,23.7,13.0,18.3,29.9,15.1
Demo-EEG-Recording,53,25.2,13.0,19.0,28.5,14.3
Demo-EEG-Recording,54,26.9,13.2,19.8,26.9,13.2
Demo-EEG-Recording,55,28.8,13.5,20.6,25.2,11.9
Demo-EEG-Recording,56,30.8,13.9,21.5,23.5,10.3
Demo-EEG-Recording,57,32.9,14.4,22.4,21.8,8.5
Demo-EEG-Recording,58,35.0,14.9,23.2,20.2,6.7
Demo-EEG-Recording,59,37.0,15.5,24.0,18.6,4.9
Demo-EEG-Recording,60,38.8,16.0,24.7,17.2,3.3`;

export class CSVFileDataSource implements EEGDataSource {
  type: DataSourceType = "CSV";
  name: string;
  private csvText: string;

  constructor(filename: string, csvText: string) {
    this.name = filename;
    this.csvText = csvText;
  }

  async getData(): Promise<string> {
    return this.csvText;
  }
}

export class DemoEEGDataSource implements EEGDataSource {
  type: DataSourceType = "DEMO";
  name = "Demo-EEG-Recording.csv";

  async getData(): Promise<string> {
    return DEMO_EEG_CSV;
  }
}

export class BLEStreamDataSource implements EEGDataSource {
  type: DataSourceType = "BLE";
  name = "ESP32 Live BLE Stream";

  async getData(): Promise<string> {
    throw new Error("ESP32 BLE live streaming hardware connection pending pairing.");
  }
}
