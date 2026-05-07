import React, { useEffect, useState } from 'react';
import { DashboardStats, RegionStats } from '../types';
import { BarChart3, Activity, Wifi, WifiOff, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const AX820Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withSwaps, setWithSwaps] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?withSwaps=${withSwaps}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 20 * 60 * 1000); // 20 minutes
    return () => clearInterval(interval);
  }, [withSwaps]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading Hotspot Stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <WifiOff className="w-12 h-12 mb-4 text-rose-500 opacity-50" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Data</h3>
        <p className="text-sm max-w-xs">{error || 'Something went wrong while fetching statistics.'}</p>
        <button 
          onClick={() => { setLoading(true); fetchStats(); }}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const calculateRegionTotals = (rs: RegionStats) => {
    const totalOnline = rs.ax820Online + rs.baicellsOnline;
    const totalOffline = rs.ax820Offline + rs.baicellsOffline;
    const grandTotal = totalOnline + totalOffline;
    const onlinePerc = grandTotal ? ((totalOnline / grandTotal) * 100).toFixed(1) : "0";
    const offlinePerc = grandTotal ? ((totalOffline / grandTotal) * 100).toFixed(1) : "0";
    return { totalOnline, totalOffline, grandTotal, onlinePerc, offlinePerc };
  };

  const gStats = calculateRegionTotals(stats.gauteng);
  const lStats = calculateRegionTotals(stats.limpopo);

  const overallOnline = gStats.totalOnline + lStats.totalOnline;
  const overallOffline = gStats.totalOffline + lStats.totalOffline;
  const overallTotal = overallOnline + overallOffline;
  const overallOnlinePerc = overallTotal ? ((overallOnline / overallTotal) * 100).toFixed(1) : "0";
  const overallOfflinePerc = overallTotal ? ((overallOffline / overallTotal) * 100).toFixed(1) : "0";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 md:p-8 overflow-y-auto h-full max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="text-indigo-600" />
            BBI 306 Hotspot Stats {withSwaps && <span className="text-sm font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">(With Swaps)</span>}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time network visibility across regions</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setLoading(true); setWithSwaps(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !withSwaps 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => { setLoading(true); setWithSwaps(true); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                withSwaps 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              With Swaps
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
            <p className="text-xs font-mono text-slate-600">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Gauteng Card */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 px-6 py-4 border-bottom border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Gauteng
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <StatRow label="AX820 Online" value={stats.gauteng.ax820Online} type="online" />
            <StatRow label="AX820 Offline" value={stats.gauteng.ax820Offline} type="offline" />
            <StatRow label="Baicells Online" value={stats.gauteng.baicellsOnline} type="online" />
            <StatRow label="Baicells Offline" value={stats.gauteng.baicellsOffline} type="offline" />
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Online</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{gStats.totalOnline}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Offline</span>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">{gStats.totalOffline}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-indigo-900">Grand Total</span>
                <span className="text-sm font-bold text-indigo-600">{gStats.grandTotal}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Online %</p>
                <p className="text-sm font-bold text-emerald-700">{gStats.onlinePerc}%</p>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Offline %</p>
                <p className="text-sm font-bold text-rose-700">{gStats.offlinePerc}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Limpopo Card */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-slate-50 px-6 py-4 border-bottom border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Limpopo
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <StatRow label="AX820 Online" value={stats.limpopo.ax820Online} type="online" />
            <StatRow label="AX820 Offline" value={stats.limpopo.ax820Offline} type="offline" />
            <StatRow label="Baicells Online" value={stats.limpopo.baicellsOnline} type="online" />
            <StatRow label="Baicells Offline" value={stats.limpopo.baicellsOffline} type="offline" />
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Online</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{lStats.totalOnline}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Offline</span>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">{lStats.totalOffline}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-indigo-900">Grand Total</span>
                <span className="text-sm font-bold text-indigo-600">{lStats.grandTotal}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Online %</p>
                <p className="text-sm font-bold text-emerald-700">{lStats.onlinePerc}%</p>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Offline %</p>
                <p className="text-sm font-bold text-rose-700">{lStats.offlinePerc}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overall Percentages */}
        <motion.div variants={item} className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl shadow-lg border border-indigo-500 overflow-hidden p-6 text-white h-[calc(50%-12px)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">Overall Online</h2>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{overallOnlinePerc}%</p>
                <p className="text-indigo-100 text-xs mt-1">Percentage of all devices online</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono opacity-80">{overallOnline} / {overallTotal}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Devices</p>
              </div>
            </div>
            <div className="mt-6 h-2 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-400" style={{ width: `${overallOnlinePerc}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 h-[calc(50%-12px)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <WifiOff className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Overall Offline</h2>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{overallOfflinePerc}%</p>
                <p className="text-slate-500 text-xs mt-1">Percentage of all devices offline</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-slate-600">{overallOffline} / {overallTotal}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Devices</p>
              </div>
            </div>
            <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-rose-500" style={{ width: `${overallOfflinePerc}%` }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const StatRow: React.FC<{ label: string, value: number, type: 'online' | 'offline' }> = ({ label, value, type }) => (
  <div className="flex justify-between items-center group">
    <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold leading-none ${
      type === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
    }`}>
      {value}
    </span>
  </div>
);

export default AX820Dashboard;
