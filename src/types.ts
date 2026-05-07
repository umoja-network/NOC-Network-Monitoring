export interface Device {
  type: "CPE200" | "Baicell";
  id: string;
  name: string;
  mac: string;
  configStatus: string;
  monitoringStatus: string;
  // CPE200 specific
  connectedTo?: string;
  ssid?: string;
  signal?: string;
  noise?: string;
  // Baicell specific
  totalConnected?: number;
  // Common
  gps?: string;
  coordinates?: { lat: number; lng: number };
}

export interface MonitoringData {
  x: string[];
  charts: {
    title: string;
    traces: [string, number[]][];
  }[];
}

export interface RegionStats {
  ax820Online: number;
  ax820Offline: number;
  baicellsOnline: number;
  baicellsOffline: number;
}

export interface DashboardStats {
  gauteng: RegionStats;
  limpopo: RegionStats;
}
