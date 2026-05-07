import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DeviceList from './components/DeviceList';
import DeviceDetails from './components/DeviceDetails';
import AX820Dashboard from './components/AX820Dashboard';
import { Device } from './types';
import { X, ChevronRight, Wifi } from 'lucide-react';
import { cn, formatDisplayName } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [cpeDevices, setCpeDevices] = React.useState<Device[]>([]);
  const [baicellDevices, setBaicellDevices] = React.useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);
  const [modalList, setModalList] = React.useState<{ devices: Device[], title: string } | null>(null);

  React.useEffect(() => {
    const fetchDevices = async () => {
      try {
        const [cpeRes, baicellRes] = await Promise.all([
          fetch('/api/devices?type=CPE200'),
          fetch('/api/devices?type=Baicell')
        ]);
        const cpeData = await cpeRes.json();
        const baicellData = await baicellRes.json();
        setCpeDevices(cpeData);
        setBaicellDevices(baicellData);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      }
    };

    fetchDevices();
  }, []);

  const handleViewBaicell = (mac: string) => {
    const normalized = mac.toLowerCase().replace(/[^a-f0-9]/g, "");
    const found = baicellDevices.find(b => b.mac.toLowerCase().replace(/[^a-f0-9]/g, "") === normalized);
    if (found) {
      setSelectedDevice(found);
    } else {
      alert(`Baicell with MAC ${mac} not found in current list.`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          {activeTab === 'dashboard' && (
            <Dashboard 
              cpeDevices={cpeDevices} 
              baicellDevices={baicellDevices} 
              onViewList={(devices, title) => setModalList({ devices, title })}
              onSelectDevice={setSelectedDevice}
            />
          )}
          {activeTab === 'cpe200' && (
            <DeviceList 
              type="CPE200" 
              devices={cpeDevices} 
              onSelectDevice={setSelectedDevice} 
            />
          )}
          {activeTab === 'baicell' && (
            <DeviceList 
              type="Baicell" 
              devices={baicellDevices} 
              onSelectDevice={setSelectedDevice} 
            />
          )}
          {activeTab === 'ax820' && (
            <AX820Dashboard />
          )}
        </div>
      </main>

      {/* Device Details Slide-over */}
      {selectedDevice && (
        <DeviceDetails 
          device={selectedDevice} 
          onClose={() => setSelectedDevice(null)} 
          onViewBaicell={handleViewBaicell}
        />
      )}

      {/* Modal for Dashboard Stat Lists */}
      {modalList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalList(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{modalList.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {modalList.devices.length} {modalList.devices.length === 1 ? 'Device' : 'Devices'} Total
                </p>
              </div>
              <button onClick={() => setModalList(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {modalList.devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => {
                    setSelectedDevice(device);
                    setModalList(null);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      device.monitoringStatus === 'ok' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      <Wifi size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{formatDisplayName(device.name)}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{device.mac}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
