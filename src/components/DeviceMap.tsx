import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Device } from '../types';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Component to handle map resizing when container size changes
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure the DOM has updated before resizing
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Component to handle map background clicks
const MapEvents = ({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

const getStatusColor = (status?: string) => {
  if (status === 'ok') return '#22c55e'; // emerald-500
  if (status === 'critical') return '#ef4444'; // rose-500
  return '#6366f1'; // indigo-500
};

const createDeviceIcon = (device: Device) => {
  const color = getStatusColor(device.monitoringStatus);
  const isCPE = device.type === 'CPE200';

  if (isCPE) {
    // Dot for CPE200
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  } else {
    // Pin for Baicell
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0ZM12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18Z" fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="4" fill="white" />
        </svg>
      `,
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      popupAnchor: [0, -32],
    });
  }
};

interface DeviceMapProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
}

const DeviceMap: React.FC<DeviceMapProps> = ({ devices, onSelectDevice }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeConnections, setActiveConnections] = useState<{ start: [number, number], end: [number, number], color: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const devicesWithCoords = devices.filter(d => d.coordinates);

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Default to a central point if no devices have coords, or use the first device's coords
  const center: [number, number] = devicesWithCoords.length > 0 
    ? [devicesWithCoords[0].coordinates!.lat, devicesWithCoords[0].coordinates!.lng]
    : [-26.2041, 28.0473]; // Johannesburg as fallback

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0 bg-white",
        isFullScreen && "rounded-none border-none"
      )}
    >
      <button
        onClick={toggleFullScreen}
        className="absolute top-3 right-3 z-[1000] p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white transition-all"
        title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <MapResizer />
        <MapEvents onMapClick={() => setActiveConnections([])} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activeConnections.map((conn, idx) => (
          <Polyline 
            key={idx}
            positions={[conn.start, conn.end]} 
            color={conn.color} 
            weight={4} 
            dashArray="10, 10" 
            opacity={0.9}
          />
        ))}
        {devicesWithCoords.map((device) => (
          <Marker 
            key={device.id} 
            position={[device.coordinates!.lat, device.coordinates!.lng]}
            icon={createDeviceIcon(device)}
            eventHandlers={{
              click: (e) => {
                console.log('Marker clicked:', device.name, 'Type:', device.type, 'ConnectedTo:', device.connectedTo);
                
                // Prevent map click from firing when clicking marker
                if (e.originalEvent) {
                  L.DomEvent.stopPropagation(e.originalEvent);
                }
                
                if (device.type === 'CPE200' && device.connectedTo) {
                  const targetMatch = device.connectedTo.toString().trim().toLowerCase();
                  console.log('Searching for AP matching:', targetMatch);
                  
                  const ap = devices.find(d => 
                    d.type === 'Baicell' && 
                    (d.name.trim().toLowerCase() === targetMatch || 
                     d.id.toString().trim().toLowerCase() === targetMatch ||
                     d.mac?.trim().toLowerCase().replace(/:/g, '') === targetMatch.replace(/:/g, ''))
                  );
                  
                  if (ap && ap.coordinates) {
                    console.log('AP found:', ap.name, 'at', ap.coordinates);
                    setActiveConnections([{
                      start: [device.coordinates!.lat, device.coordinates!.lng],
                      end: [ap.coordinates.lat, ap.coordinates.lng],
                      color: getStatusColor(device.monitoringStatus)
                    }]);
                  } else {
                    console.warn('AP not found or has no coordinates for CPE:', device.name);
                    setActiveConnections([]);
                  }
                } else if (device.type === 'Baicell' && device.coordinates) {
                  const apMatch = device.name.trim().toLowerCase();
                  const apIdMatch = device.id.toString().trim().toLowerCase();
                  const apMacMatch = device.mac?.trim().toLowerCase().replace(/:/g, '') || '';
                  
                  console.log('Searching for CPEs connected to AP:', device.name);
                  
                  const connections = devices
                    .filter(d => {
                      if (d.type !== 'CPE200' || !d.coordinates || !d.connectedTo) return false;
                      const conn = d.connectedTo.toString().trim().toLowerCase();
                      return conn === apMatch || conn === apIdMatch || conn.replace(/:/g, '') === apMacMatch;
                    })
                    .map(d => ({
                      start: [device.coordinates!.lat, device.coordinates!.lng] as [number, number],
                      end: [d.coordinates!.lat, d.coordinates!.lng] as [number, number],
                      color: getStatusColor(d.monitoringStatus)
                    }));
                  
                  console.log(`Found ${connections.length} connections for AP`);
                  setActiveConnections(connections);
                }
              }
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-slate-900 mb-1">{device.name}</h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{device.mac}</p>
                {device.type === 'CPE200' && device.connectedTo && (
                  <p className="text-[10px] text-indigo-600 font-medium mb-2">Connected to: {device.connectedTo}</p>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    device.monitoringStatus === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {device.monitoringStatus}
                  </span>
                  <button 
                    onClick={() => onSelectDevice(device)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DeviceMap;
