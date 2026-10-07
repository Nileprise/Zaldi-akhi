import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radio, Navigation, Zap, Gauge, AlertTriangle, ShieldCheck, 
  MapPin, Filter, Search, ChevronRight, Activity, ArrowUpRight, 
  BatteryCharging, Clock, Layers, Car, RefreshCw, Eye, Sparkles,
  Compass, Play, Pause
} from 'lucide-react';
import { 
  FLEET_TELEMATICS_UNITS, 
  GEOFENCE_ZONES, 
  FleetVehicleTelematics, 
  TelematicsVehicleType, 
  VehicleEngineStatus 
} from '../services/telematicsData';
import { Vehicle5dIcon, LiveMap5dVehicleMarker, getVehicleTheme } from './Vehicle5dIcon';
import { sounds } from '../services/audio';

interface FleetTelematicsGISProps {
  onSelectVehicleForDispatch?: (vehicle: FleetVehicleTelematics) => void;
}

export const FleetTelematicsGIS: React.FC<FleetTelematicsGISProps> = ({
  onSelectVehicleForDispatch
}) => {
  const [fleetUnits, setFleetUnits] = useState<FleetVehicleTelematics[]>(FLEET_TELEMATICS_UNITS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(FLEET_TELEMATICS_UNITS[0].id);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [engineStatusFilter, setEngineStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);
  const [gisViewMode, setGisViewMode] = useState<'NIGHT_TELEMATICS' | 'DAY_SATELLITE'>('NIGHT_TELEMATICS');

  // Selected vehicle object
  const selectedVehicle = useMemo(() => {
    return fleetUnits.find(v => v.id === selectedVehicleId) || fleetUnits[0];
  }, [fleetUnits, selectedVehicleId]);

  // Subtle real-time GPS drift & telematics stream simulation
  useEffect(() => {
    if (!isLiveStreamActive) return;
    const interval = setInterval(() => {
      setFleetUnits(prev => prev.map(v => {
        if (v.engineStatus === 'IN_TRANSIT' || v.engineStatus === 'DISPATCHED') {
          const deltaX = (Math.random() - 0.48) * 0.4;
          const deltaY = (Math.random() - 0.48) * 0.4;
          const newX = Math.max(10, Math.min(90, +(v.coords.x + deltaX).toFixed(2)));
          const newY = Math.max(12, Math.min(88, +(v.coords.y + deltaY).toFixed(2)));
          const speedVariation = Math.max(15, Math.min(v.speedLimit + 5, v.speedKmh + Math.round((Math.random() - 0.5) * 4)));
          
          return {
            ...v,
            coords: { x: newX, y: newY },
            speedKmh: speedVariation,
            lastPingSecondsAgo: 1,
            routeTrail: [...v.routeTrail.slice(-4), { x: newX, y: newY }]
          };
        }
        return {
          ...v,
          lastPingSecondsAgo: v.lastPingSecondsAgo + 1
        };
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return fleetUnits.filter(v => {
      if (vehicleTypeFilter !== 'ALL' && v.vehicleType !== vehicleTypeFilter) return false;
      if (engineStatusFilter !== 'ALL' && v.engineStatus !== engineStatusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.id.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          v.plateNumber.toLowerCase().includes(q) ||
          v.modelName.toLowerCase().includes(q) ||
          v.currentGeofence.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fleetUnits, vehicleTypeFilter, engineStatusFilter, searchQuery]);

  // Telemetry Aggregates
  const totalFleetCount = fleetUnits.length;
  const inTransitCount = fleetUnits.filter(v => v.engineStatus === 'IN_TRANSIT').length;
  const avgEcoScore = Math.round(fleetUnits.reduce((acc, v) => acc + v.ecoScore, 0) / totalFleetCount);
  const avgBatteryOrFuel = Math.round(fleetUnits.reduce((acc, v) => acc + v.fuelOrBatteryPercent, 0) / totalFleetCount);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* Top Banner: Telematics & GIS Command Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 font-black text-[10px] uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>GIS Telematics & Fleet Tracking</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs text-slate-400 font-semibold">Active Frequency: 433 MHz / 5G Mesh</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2.5">
            <span>Real-Time Fleet GIS Operations Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time GPS coordinates, vehicle engine telemetry, dynamic 5D map markers, and route tracking.
          </p>
        </div>

        {/* Global Controls & Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              sounds.playPop();
              setIsLiveStreamActive(!isLiveStreamActive);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              isLiveStreamActive 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isLiveStreamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveStreamActive ? 'Live GPS Stream' : 'Stream Paused'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              setGisViewMode(gisViewMode === 'NIGHT_TELEMATICS' ? 'DAY_SATELLITE' : 'NIGHT_TELEMATICS');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{gisViewMode === 'NIGHT_TELEMATICS' ? 'Dark Vector GIS' : 'Light Cartography'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Telematics KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Fleet Tracked</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{filteredVehicles.length} <span className="text-xs text-slate-500 font-normal">/ {totalFleetCount}</span></div>
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{inTransitCount} In Transit Active</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Avg Fleet Power</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{avgBatteryOrFuel}%</div>
          <div className="text-[11px] font-semibold text-slate-400">Zero Critical Depletions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Eco-Drive Score</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{avgEcoScore} / 100</div>
          <div className="text-[11px] font-semibold text-emerald-400">98.2% Speed Compliance</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Active Geofences</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{GEOFENCE_ZONES.length} Zones</div>
          <div className="text-[11px] font-semibold text-slate-400">Hyderabad & Warangal</div>
        </div>
      </div>

      {/* Main Dual-Panel Workspace: GIS Map & Telematics Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive GIS Map Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col space-y-3">
          
          {/* Map Layer Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                GIS Live Vector Grid
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                EPSG:3857 (Web Mercator)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGeofences(!showGeofences)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  showGeofences 
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Geofence Zones
              </button>
              <button
                onClick={() => setShowTrails(!showTrails)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  showTrails 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Route Trails
              </button>
            </div>
          </div>

          {/* GIS SVG Map Viewer */}
          <div className={`relative w-full h-[460px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner select-none ${
            gisViewMode === 'NIGHT_TELEMATICS' ? 'bg-[#0b1329]' : 'bg-[#e2e8f0]'
          }`}>
            
            {/* SVG Base Road Grid & Geofence Polygons */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="gisGridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke={gisViewMode === 'NIGHT_TELEMATICS' ? '#14203d' : '#cbd5e1'} strokeWidth="0.5" />
                </pattern>
                <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <rect width="100" height="100" fill="url(#gisGridPattern)" />

              {/* River / Water body */}
              <path
                d="M -5 32 Q 25 38 45 28 T 95 36 T 110 32 L 110 40 Q 95 44 45 36 T -5 40 Z"
                fill={gisViewMode === 'NIGHT_TELEMATICS' ? '#1e293b' : '#bfdbfe'}
                opacity={gisViewMode === 'NIGHT_TELEMATICS' ? 0.35 : 0.6}
              />

              {/* Major Arterial Highway Network */}
              <g stroke={gisViewMode === 'NIGHT_TELEMATICS' ? '#1f2e4d' : '#94a3b8'} strokeWidth="1.8">
                <line x1="10" y1="46" x2="90" y2="46" />
                <line x1="28" y1="10" x2="28" y2="90" />
                <line x1="48" y1="15" x2="48" y2="85" />
                <line x1="68" y1="10" x2="68" y2="90" />
                <line x1="15" y1="35" x2="85" y2="75" />
              </g>

              {/* Outer Ring Road (ORR Expressway Arc) */}
              <path
                d="M 5 85 Q 20 40 50 18 T 95 15"
                fill="none"
                stroke={gisViewMode === 'NIGHT_TELEMATICS' ? '#334155' : '#64748b'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Geofence Polygons */}
              {showGeofences && GEOFENCE_ZONES.map(geo => {
                const pointsStr = geo.polygonPoints.map(p => `${p.x},${p.y}`).join(' ');
                return (
                  <polygon
                    key={geo.id}
                    points={pointsStr}
                    fill="#a855f7"
                    fillOpacity="0.12"
                    stroke="#a855f7"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Vehicle Route Trails */}
              {showTrails && filteredVehicles.map(v => {
                if (!v.routeTrail || v.routeTrail.length < 2) return null;
                const pathD = v.routeTrail.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                return (
                  <path
                    key={`trail-${v.id}`}
                    d={pathD}
                    fill="none"
                    stroke="url(#trailGrad)"
                    strokeWidth="1.2"
                    strokeDasharray="1.5 1.5"
                  />
                );
              })}
            </svg>

            {/* Geofence Zone Labels */}
            {showGeofences && GEOFENCE_ZONES.map(geo => {
              const center = geo.polygonPoints[0];
              return (
                <div
                  key={`lbl-${geo.id}`}
                  style={{ left: `${center.x + 2}%`, top: `${center.y + 2}%` }}
                  className="absolute pointer-events-none z-10"
                >
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-[8px] font-black text-purple-300 shadow">
                    {geo.name}
                  </span>
                </div>
              );
            })}

            {/* Live 5D/3D Vehicle Markers on GIS Map */}
            {filteredVehicles.map(vehicle => {
              const isSelected = vehicle.id === selectedVehicleId;
              const theme = getVehicleTheme(vehicle.vehicleType);

              return (
                <div
                  key={vehicle.id}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedVehicleId(vehicle.id);
                  }}
                  style={{
                    left: `${vehicle.coords.x}%`,
                    top: `${vehicle.coords.y}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-700 ease-out group ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                  }`}
                >
                  {/* Selected Target Radar Pulse Ring */}
                  {isSelected && (
                    <div 
                      className="absolute -inset-3 rounded-full border-2 border-cyan-400 animate-ping opacity-60 pointer-events-none"
                    />
                  )}

                  {/* Telematics Speed & Status Bubble */}
                  <div className={`mb-1 px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-lg backdrop-blur-md transition whitespace-nowrap ${
                    isSelected 
                      ? 'bg-slate-900 border border-cyan-400 text-white' 
                      : 'bg-slate-900/80 border border-slate-700 text-slate-300'
                  }`}>
                    <span 
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: vehicle.engineStatus === 'IN_TRANSIT' ? '#10b981' : vehicle.engineStatus === 'CHARGING' ? '#3b82f6' : '#f59e0b' }}
                    />
                    <span className="text-[8px] font-black">
                      {vehicle.speedKmh} km/h
                    </span>
                  </div>

                  {/* 5D Live Map Vehicle Icon with Headlights and Road Contact */}
                  <LiveMap5dVehicleMarker
                    type={vehicle.vehicleType}
                    heading={vehicle.headingDeg}
                    size={isSelected ? 42 : 36}
                  />

                  {/* Vehicle Unit ID Tag */}
                  <div className="mt-0.5 text-center">
                    <span className={`px-1 py-0.2 rounded text-[7px] font-black font-mono shadow ${
                      isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-black/75 text-slate-300'
                    }`}>
                      {vehicle.id.split('-').slice(1).join('-')}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Map Legend */}
            <div className="absolute bottom-2 left-3 z-30 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[9px] font-bold text-slate-300 backdrop-blur-md">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Transit</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Idling</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Charging</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Geofence</span>
              </span>
            </div>

          </div>

          {/* Vehicle Type Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3 h-3 text-cyan-400" />
              <span>Type:</span>
            </span>
            {(['ALL', 'SEDAN', 'AUTO', 'BIKE', 'TRUCK', 'PREMIUM', 'PARCEL'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  sounds.playPop();
                  setVehicleTypeFilter(type);
                }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition ${
                  vehicleTypeFilter === type
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'All Units' : type}
              </button>
            ))}
          </div>

        </div>

        {/* Right Column: Deep Vehicle Telematics & Diagnostics Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          
          {/* Header of Inspector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Vehicle5dIcon type={selectedVehicle.vehicleType} size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">{selectedVehicle.id}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    selectedVehicle.engineStatus === 'IN_TRANSIT' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedVehicle.engineStatus === 'CHARGING'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedVehicle.engineStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">{selectedVehicle.modelName}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-black text-slate-200 block">{selectedVehicle.plateNumber}</span>
              <span className="text-[9px] text-emerald-400 font-bold">Ping: {selectedVehicle.lastPingSecondsAgo}s ago</span>
            </div>
          </div>

          {/* Driver & Assignment Details */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-xs text-blue-400">
                {selectedVehicle.driverAvatar}
              </div>
              <div>
                <div className="text-xs font-black text-white">{selectedVehicle.driverName}</div>
                <div className="text-[10px] text-slate-400">{selectedVehicle.driverPhone}</div>
              </div>
            </div>

            {selectedVehicle.assignedOrder && (
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Trip Order</span>
                <span className="text-xs font-mono font-black text-cyan-400">{selectedVehicle.assignedOrder}</span>
              </div>
            )}
          </div>

          {/* Telemetry Gauge Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Speed & Compliance */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Telemetry Speed</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {selectedVehicle.speedKmh} <span className="text-xs text-slate-500 font-normal">km/h</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                Limit: {selectedVehicle.speedLimit} km/h • <span className={selectedVehicle.speedKmh > selectedVehicle.speedLimit ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {selectedVehicle.speedKmh > selectedVehicle.speedLimit ? 'Speed Alert' : 'Compliant'}
                </span>
              </div>
            </div>

            {/* Battery / Fuel & Remaining Range */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>{selectedVehicle.powerType} Level</span>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {selectedVehicle.fuelOrBatteryPercent}%
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                Range: ~{selectedVehicle.rangeRemainingKm} km remaining
              </div>
            </div>

            {/* Eco-Driving Score & Safety */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Eco Score</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {selectedVehicle.ecoScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                Harsh Braking: {selectedVehicle.harshBrakingEvents} events
              </div>
            </div>

            {/* Engine Temp & Odometer */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>Diagnostics</span>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {selectedVehicle.engineTempC}°C
              </div>
              <div className="text-[10px] font-semibold text-slate-400 truncate">
                Odo: {selectedVehicle.odometerKm.toLocaleString()} km
              </div>
            </div>

          </div>

          {/* Current Geofence & Location */}
          <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Geofence Zone</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[9px] border border-purple-500/30">
                {selectedVehicle.currentGeofence}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="font-semibold truncate">{selectedVehicle.currentAddress}</span>
            </div>
            {selectedVehicle.destinationAddress && (
              <div className="flex items-center gap-2 text-slate-400">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Dest: {selectedVehicle.destinationAddress}</span>
              </div>
            )}
          </div>

          {/* Direct Dispatch & Fleet Action Button */}
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => {
                sounds.playSuccess();
                onSelectVehicleForDispatch?.(selectedVehicle);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Dispatch Order to Unit</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
