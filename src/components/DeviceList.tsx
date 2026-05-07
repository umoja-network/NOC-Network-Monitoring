import React from 'react';
import { Device } from '../types';
import { cn, normalizeMac, formatDisplayName } from '../lib/utils';
import { Search, Filter, Wifi, WifiOff, ChevronRight } from 'lucide-react';

interface DeviceListProps {
  type: 'CPE200' | 'Baicell';
  devices: Device[];
  onSelectDevice: (device: Device) => void;
}

export default function DeviceList({ type, devices, onSelectDevice }: DeviceListProps) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'ok' | 'critical'>('all');

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                         d.mac.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || d.monitoringStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const okCount = devices.filter(d => d.monitoringStatus === 'ok').length;
  const criticalCount = devices.filter(d => d.monitoringStatus === 'critical').length;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{type} Devices</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your {type} units</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full lg:w-64"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setFilter('ok')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                filter === 'ok' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              OK ({okCount})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                filter === 'critical' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-rose-600"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Critical ({criticalCount})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDevices.length > 0 ? (
          filteredDevices.map((device) => (
            <button
              key={device.id}
              onClick={() => onSelectDevice(device)}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  device.monitoringStatus === 'ok' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {device.monitoringStatus === 'ok' ? <Wifi size={20} /> : <WifiOff size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{formatDisplayName(device.name)}</h3>
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">{device.mac}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</span>
                  <span className={cn(
                    "text-xs font-bold uppercase",
                    device.monitoringStatus === 'ok' ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {device.monitoringStatus}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No devices found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
