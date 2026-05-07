import React from 'react';
import { Device, MonitoringData } from '../types';
import { X, Activity, Info, BarChart3, ExternalLink, Wifi } from 'lucide-react';
import { cn, rateToColor, formatDisplayName } from '../lib/utils';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DeviceDetailsProps {
  device: Device;
  onClose: () => void;
  onViewBaicell: (mac: string) => void;
}

export default function DeviceDetails({ device, onClose, onViewBaicell }: DeviceDetailsProps) {
  const [range, setRange] = React.useState('1d');
  const [monitoring, setMonitoring] = React.useState<MonitoringData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMonitoring = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/monitoring/${device.id}?range=${range}`);
        const data = await res.json();
        setMonitoring(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoring();
  }, [device.id, range]);

  const trafficData = monitoring?.charts.find(c => c.title.toLowerCase().includes('traffic'));
  const pingData = monitoring?.charts.find(c => c.title.toLowerCase().includes('ping') || c.title.toLowerCase().includes('wifi clients'));

  const chartData = monitoring?.x.map((time, i) => {
    const d = new Date(time);
    let timeLabel = '';
    
    if (range === '1d') {
      timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '3d' || range === '7d') {
      timeLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      timeLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return {
      time: timeLabel,
      traffic: trafficData?.traces[0][1][i] || 0,
      ping: pingData?.traces[0][1][i] || 0,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              device.monitoringStatus === 'ok' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              <Wifi size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{formatDisplayName(device.name)}</h2>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{device.mac}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monitoring</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", device.monitoringStatus === 'ok' ? "bg-emerald-500" : "bg-rose-500")} />
                <span className={cn("text-sm font-bold uppercase", device.monitoringStatus === 'ok' ? "text-emerald-600" : "text-rose-600")}>
                  {device.monitoringStatus}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Config Status</span>
              <span className="text-sm font-bold text-slate-700 uppercase">{device.configStatus}</span>
            </div>
          </div>

          {/* Connection Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Device Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              {device.type === 'CPE200' ? (
                <>
                  <div>
                    <span className="text-xs text-slate-400 block">Connected To</span>
                    <button 
                      onClick={() => device.connectedTo && onViewBaicell(device.connectedTo)}
                      className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {device.connectedTo || 'N/A'} <ExternalLink size={12} />
                    </button>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">SSID</span>
                    <span className="text-sm font-bold text-slate-700">{device.ssid || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Signal</span>
                    <span className="text-sm font-bold text-slate-700">{device.signal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Noise</span>
                    <span className="text-sm font-bold text-slate-700">{device.noise || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-xs text-slate-400 block">Total Connected CPEs</span>
                  <span className="text-sm font-bold text-slate-700">{device.totalConnected || 0}</span>
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={14} /> Monitoring Data
              </h3>
              <select 
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="3d">Last 3 Days</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-tighter">Reachability %</h4>
                <div className="h-48">
                  {loading ? (
                    <div className="h-full flex items-center justify-center"><Activity className="animate-pulse text-slate-300" /></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          dy={5}
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{payload[0].payload.time}</p>
                                  <p className="text-sm font-bold text-slate-900">{payload[0].value}% Reachability</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="ping" radius={[2, 2, 0, 0]}>
                          {chartData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={rateToColor(entry.ping)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
