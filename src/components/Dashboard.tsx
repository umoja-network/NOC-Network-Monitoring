import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Device, MonitoringData } from '../types';
import { rateToColor, cn } from '../lib/utils';
import { Activity, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';

import DeviceMap from './DeviceMap';

interface DashboardProps {
  cpeDevices: Device[];
  baicellDevices: Device[];
  onViewList: (devices: Device[], title: string) => void;
  onSelectDevice: (device: Device) => void;
}

export default function Dashboard({ cpeDevices, baicellDevices, onViewList, onSelectDevice }: DashboardProps) {
  const [loading, setLoading] = React.useState(true);
  const [dailyAverages, setDailyAverages] = React.useState<{ day: string; avg: number }[]>([]);

  React.useEffect(() => {
    const fetchAverages = async () => {
      try {
        const days = 30;
        const currentOnlineDevices = cpeDevices.filter(d => d.monitoringStatus === 'ok');
        const currentOnlineCount = currentOnlineDevices.length;
        const currentAvg = Math.round((currentOnlineCount / cpeDevices.length) * 100);

        const mockData = Array.from({ length: days }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          
          const isToday = i === days - 1;
          
          if (isToday) {
            return {
              day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              avg: currentAvg,
              count: currentOnlineCount,
              onlineDevices: currentOnlineDevices
            };
          }

          const avg = Math.floor(Math.random() * 40) + 60;
          
          // Simulate which devices were online that day based on the average
          // We use the current devices as a base and randomly pick a subset
          const onlineCount = Math.max(1, Math.floor((avg / 100) * cpeDevices.length));
          const dayDevices = [...cpeDevices]
            .sort(() => Math.random() - 0.5)
            .slice(0, onlineCount)
            .map(dev => ({ ...dev, monitoringStatus: 'ok' as const })); // Mark them as online for this view

          return {
            day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            avg,
            count: onlineCount,
            onlineDevices: dayDevices
          };
        });
        setDailyAverages(mockData as any);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    if (cpeDevices.length > 0) {
      fetchAverages();
    }
  }, [cpeDevices]);

  const onlineCPE = cpeDevices.filter(d => d.monitoringStatus === 'ok').length;
  const criticalCPE = cpeDevices.filter(d => d.monitoringStatus === 'critical').length;
  const onlineBaicell = baicellDevices.filter(d => d.monitoringStatus === 'ok').length;
  const criticalBaicell = baicellDevices.filter(d => d.monitoringStatus === 'critical').length;

  const stats = [
    { 
      label: 'Online CPE200', 
      value: onlineCPE, 
      total: cpeDevices.length, 
      icon: Wifi, 
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      onClick: () => onViewList(cpeDevices.filter(d => d.monitoringStatus === 'ok'), 'Online CPE200')
    },
    { 
      label: 'Critical CPE200', 
      value: criticalCPE, 
      total: cpeDevices.length, 
      icon: AlertTriangle, 
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      onClick: () => onViewList(cpeDevices.filter(d => d.monitoringStatus === 'critical'), 'Critical CPE200')
    },
    { 
      label: 'Online Baicells', 
      value: onlineBaicell, 
      total: baicellDevices.length, 
      icon: Activity, 
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      onClick: () => onViewList(baicellDevices.filter(d => d.monitoringStatus === 'ok'), 'Online Baicells')
    },
    { 
      label: 'Critical Baicells', 
      value: criticalBaicell, 
      total: baicellDevices.length, 
      icon: AlertTriangle, 
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      onClick: () => onViewList(baicellDevices.filter(d => d.monitoringStatus === 'critical'), 'Critical Baicells')
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Network Overview</h1>
        <p className="text-slate-500 mt-1">Real-time status of your infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            className="flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-sm text-slate-400">/ {stat.total}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Device Location Map</h3>
            <p className="text-sm text-slate-500">Geographic distribution of network assets</p>
          </div>
        </div>
        <div className="h-[500px] w-full">
          <DeviceMap 
            devices={[...cpeDevices, ...baicellDevices]} 
            onSelectDevice={onSelectDevice} 
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">30-Day Avg Reachability (CPE200)</h3>
            <p className="text-sm text-slate-500">Average ping success across all CPE200 devices</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs font-medium text-slate-600">Critical</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyAverages} 
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{payload[0].payload.day}</p>
                          <p className="text-lg font-bold text-slate-900">{payload[0].value}% Reachability</p>
                          <p className="text-[10px] text-indigo-500 font-bold mt-2 uppercase tracking-tighter">Click bar to view devices</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="avg" 
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => {
                    if (data && data.onlineDevices) {
                      onViewList(data.onlineDevices, `Online Devices - ${data.day}`);
                    }
                  }}
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fill="#64748b" 
                    fontSize={10} 
                    fontWeight="bold"
                    offset={8}
                  />
                  {dailyAverages.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={rateToColor(entry.avg)}
                      className="transition-opacity hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
