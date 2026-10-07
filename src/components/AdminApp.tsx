import React, { useState } from 'react';
import { 
  Activity, Users, DollarSign, TrendingUp, ShieldCheck, 
  MapPin, CheckCircle, Clock, AlertTriangle, RefreshCw,
  Search, Filter, ChevronRight
} from 'lucide-react';
import { Driver, RideOrder } from '../types';
import { sounds } from '../services/audio';
import { DemandHeatmap } from './DemandHeatmap';

interface AdminAppProps {
  drivers: Driver[];
  orders: RideOrder[];
  onUpdateDriver: (driverId: string, updates: Partial<Driver>) => void;
  onUpdateOrder: (orderId: string, updates: Partial<RideOrder>) => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({
  drivers,
  orders,
  onUpdateDriver,
  onUpdateOrder
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Financial and operational KPI computations
  const totalGMV = orders.reduce((acc, o) => acc + (o.status !== 'CANCELLED' ? o.finalFare : 0), 0) + 14850;
  const activeCaptainsOnline = drivers.filter(d => d.isOnline).length;
  const ongoingTrips = orders.filter(o => ['ARRIVING', 'IN_PROGRESS'].includes(o.status)).length;
  const completedTrips = orders.filter(o => o.status === 'COMPLETED').length + 84;

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.pickup.toLowerCase().includes(q) ||
        o.drop.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pt-2 pb-16 text-slate-100">
      
      {/* Hub Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Operations Control
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold">City Grid: Hyderabad & Warangal</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Live Fleet Command Hub</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Platform GMV</span>
            <span className="text-xl font-black text-emerald-400">₹{totalGMV.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Captains Online</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-3xl font-black text-white">{activeCaptainsOnline} / {drivers.length}</div>
          <span className="text-[11px] font-semibold text-emerald-400">92% Dispatch Coverage</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Trips In-Flight</span>
            <Activity className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-3xl font-black text-blue-400">{ongoingTrips}</div>
          <span className="text-[11px] font-semibold text-slate-400">Avg pickup ETA: 3.2 min</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Completed Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{completedTrips}</div>
          <span className="text-[11px] font-semibold text-emerald-500">Zero safety incidents</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">CSAT Rating</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">4.92 ★</div>
          <span className="text-[11px] font-semibold text-slate-400">From 1,240 reviews</span>
        </div>

      </div>

      {/* Real-time D3 Heatmap Overlay for Hyderabad and Warangal */}
      <DemandHeatmap 
        onDispatchIncentive={(zoneName, amt) => {
          sounds.playAlert();
        }}
      />

      {/* Active Captains Fleet Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">Registered Captains & Fleet Status</h3>
          <span className="text-xs text-slate-400 font-semibold">{drivers.length} Verified Drivers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {drivers.map(driver => (
            <div 
              key={driver.id}
              className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400">
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{driver.name}</span>
                    <span className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  </div>
                  <div className="text-xs text-slate-400">{driver.vehicle} • {driver.plate}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{driver.phone}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-amber-400">{driver.rating} ★</span>
                <div className="text-[11px] text-slate-400 mt-0.5">{driver.totalTrips} trips</div>
                <button 
                  onClick={() => {
                    sounds.playPop();
                    onUpdateDriver(driver.id, { isOnline: !driver.isOnline });
                  }}
                  className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                    driver.isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {driver.isOnline ? 'Active' : 'Offline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Orders Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">Live Ride & Logistics Bookings</h3>
            <p className="text-xs text-slate-400">Real-time status updates and trip records</p>
          </div>

          <div className="flex gap-2">
            {['ALL', 'SEARCHING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStatus === status
                    ? 'bg-brand-blue text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No orders found under current filter. Book a ride in the Customer App to view live dispatching.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Trip ID</th>
                  <th className="py-3 px-3">Passenger</th>
                  <th className="py-3 px-3">Route</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Fare</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono text-blue-400 font-bold">{order.id}</td>
                    <td className="py-3 px-3 text-white font-bold">{order.customerName}</td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                      {order.pickup} → {order.drop}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{order.vehicleTier}</td>
                    <td className="py-3 px-3 font-black text-emerald-400">₹{order.finalFare}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'SEARCHING' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            sounds.playSuccess();
                            onUpdateOrder(order.id, { status: 'COMPLETED', progressPercent: 100 });
                          }}
                          className="text-xs font-bold text-brand-blue hover:underline"
                        >
                          Fast-Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
