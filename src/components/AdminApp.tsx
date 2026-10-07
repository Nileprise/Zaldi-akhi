import React, { useState } from 'react';
import { 
  Activity, Users, DollarSign, TrendingUp, ShieldCheck, 
  MapPin, CheckCircle, Clock, AlertTriangle, RefreshCw,
  Search, Filter, ChevronRight
} from 'lucide-react';
import { Driver, RideOrder } from '../types';
import { sounds } from '../services/audio';
import { DemandHeatmap } from './DemandHeatmap';
import { CaptainDensityMap } from './CaptainDensityMap';
import { FleetTelematicsGIS } from './FleetTelematicsGIS';
import { ArchitecturalDepotViewer } from './ArchitecturalDepotViewer';
import { Radio, Building2 } from 'lucide-react';

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
  const [activeSpatialView, setActiveSpatialView] = useState<'FLEET_TELEMATICS' | 'CAPTAIN_DENSITY' | 'DEMAND_HEATMAP' | 'VIRTUAL_DEPOTS'>('FLEET_TELEMATICS');

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

      {/* Spatial Map Visualization Switcher & Views */}
      <div className="space-y-4">
        {/* Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider px-2">
              Operations Telematics & Maps:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveSpatialView('FLEET_TELEMATICS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                activeSpatialView === 'FLEET_TELEMATICS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Fleet Telematics & GIS</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveSpatialView('VIRTUAL_DEPOTS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                activeSpatialView === 'VIRTUAL_DEPOTS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>3D Virtual Depots & Hubs</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveSpatialView('CAPTAIN_DENSITY');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                activeSpatialView === 'CAPTAIN_DENSITY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Captain Density Grid</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveSpatialView('DEMAND_HEATMAP');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                activeSpatialView === 'DEMAND_HEATMAP'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Demand Heatmap</span>
            </button>
          </div>
        </div>

        {/* Dynamic Map Component */}
        {activeSpatialView === 'FLEET_TELEMATICS' ? (
          <FleetTelematicsGIS />
        ) : activeSpatialView === 'VIRTUAL_DEPOTS' ? (
          <ArchitecturalDepotViewer />
        ) : activeSpatialView === 'CAPTAIN_DENSITY' ? (
          <CaptainDensityMap 
            drivers={drivers}
            onToggleDriverStatus={(driverId) => {
              const d = drivers.find(drv => drv.id === driverId);
              if (d) onUpdateDriver(driverId, { isOnline: !d.isOnline });
            }}
            onDispatchToZone={() => {
              sounds.playSuccess();
            }}
          />
        ) : (
          <DemandHeatmap 
            onDispatchIncentive={() => {
              sounds.playAlert();
            }}
          />
        )}
      </div>

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
