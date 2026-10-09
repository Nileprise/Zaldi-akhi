import React, { useState } from 'react';
import { 
  Building2, Warehouse, Truck, Zap, Sun, Moon, Sparkles, 
  Layers, CheckCircle, Clock, BatteryCharging, AlertCircle, 
  ShieldCheck, ArrowUpRight, Maximize2, Compass, Box, Download
} from 'lucide-react';
import { 
  ARCHITECTURAL_FACILITIES, 
  ArchitecturalFacility, 
  DepotBay 
} from '../services/telematicsData';
import { Vehicle5dIcon } from './Vehicle5dIcon';
import { LowPolyVehicleStudio } from './LowPolyVehicleStudio';
import { sounds } from '../services/audio';

export const ArchitecturalDepotViewer: React.FC = () => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(ARCHITECTURAL_FACILITIES[0].id);
  const [selectedBayId, setSelectedBayId] = useState<string>(ARCHITECTURAL_FACILITIES[0].bays[0].id);
  const [lightingMode, setLightingMode] = useState<'DAY_SUNLIGHT' | 'TWILIGHT' | 'NIGHT_FLOODLIGHTS'>('NIGHT_FLOODLIGHTS');
  const [viewPerspective, setViewPerspective] = useState<'ISOMETRIC_3D' | 'TOP_BLUEPRINT' | 'CROSS_SECTION'>('ISOMETRIC_3D');
  const [showStudio, setShowStudio] = useState(false);

  const facility = ARCHITECTURAL_FACILITIES.find(f => f.id === selectedFacilityId) || ARCHITECTURAL_FACILITIES[0];
  const selectedBay = facility.bays.find(b => b.id === selectedBayId) || facility.bays[0];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* Top Banner: Architectural & Virtual Concept Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-black text-[10px] uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>Concept & Architectural Renderings</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-semibold">3D Virtual Streets, Depots & Hubs</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
            Virtual Depots, Streetscapes & Shipping Hubs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed 3D & isometric architectural models populating autonomous staging bays, EV chargers, and urban corridors.
          </p>
        </div>

        {/* View Mode & Lighting Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lighting Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sounds.playPop();
                setLightingMode('DAY_SUNLIGHT');
              }}
              title="Day Sunlight"
              className={`p-1.5 rounded-lg transition ${lightingMode === 'DAY_SUNLIGHT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setLightingMode('TWILIGHT');
              }}
              title="Twilight Golden Hour"
              className={`p-1.5 rounded-lg transition ${lightingMode === 'TWILIGHT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setLightingMode('NIGHT_FLOODLIGHTS');
              }}
              title="Night Depot Floodlights"
              className={`p-1.5 rounded-lg transition ${lightingMode === 'NIGHT_FLOODLIGHTS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Perspective Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sounds.playPop();
                setViewPerspective('ISOMETRIC_3D');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewPerspective === 'ISOMETRIC_3D' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Isometric 3D
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setViewPerspective('TOP_BLUEPRINT');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewPerspective === 'TOP_BLUEPRINT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Blueprint Plan
            </button>
          </div>

          {/* 3D Asset Studio & GLB Downloader Button */}
          <button
            onClick={() => {
              sounds.playPop();
              setShowStudio(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition shadow-md"
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Low-Poly Hub & GLB</span>
          </button>
        </div>
      </div>

      {/* Facility Switcher Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ARCHITECTURAL_FACILITIES.map(fac => {
          const isSelected = fac.id === selectedFacilityId;
          return (
            <div
              key={fac.id}
              onClick={() => {
                sounds.playPop();
                setSelectedFacilityId(fac.id);
                setSelectedBayId(fac.bays[0].id);
              }}
              className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden select-none ${
                isSelected 
                  ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  fac.category === 'LOGISTICS_DEPOT'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : fac.category === 'URBAN_STREET'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {fac.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{fac.bays.length} Bays</span>
              </div>
              <h4 className="text-sm font-black text-white mt-2 leading-snug">{fac.title}</h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{fac.location}</p>
              
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>{fac.throughputPerHour} units/hr</span>
                <span className="text-indigo-400 font-bold">{fac.avgTurnaroundMin} min turnaround</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Architectural Visualizer Canvas & Bay Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: 3D Render / Isometric Interactive Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
          
          {/* Canvas Title & Environment Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{facility.title}</span>
                <span className="text-xs text-indigo-400 font-normal">({viewPerspective === 'ISOMETRIC_3D' ? 'Isometric 30° Camera' : 'Top-down Plan'})</span>
              </h3>
              <p className="text-xs text-slate-400">{facility.tagline}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold">
                EV: {facility.evChargingCapacityKw} kW
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                Solar: {facility.solarEfficiencyPercent}%
              </span>
            </div>
          </div>

          {/* Interactive 3D Architectural Isometric Canvas */}
          <div className={`relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none ${
            lightingMode === 'DAY_SUNLIGHT' 
              ? 'bg-gradient-to-b from-[#87CEEB] to-[#cbd5e1]'
              : lightingMode === 'TWILIGHT'
              ? 'bg-gradient-to-b from-[#2e1065] via-[#3b0764] to-[#1e1b4b]'
              : 'bg-gradient-to-b from-[#090d1a] to-[#04060c]'
          }`}>
            
            {/* Ambient Lighting & Floodlight Cones */}
            {lightingMode === 'NIGHT_FLOODLIGHTS' && (
              <>
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* Isometric 3D Scene Wrapper */}
            <div 
              className="relative w-[92%] h-[92%] transition-all duration-700 ease-out flex items-center justify-center"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Floor Plane Grid */}
              <div 
                className="absolute inset-0 rounded-3xl border border-slate-700/50 shadow-2xl transition-all duration-700"
                style={{
                  backgroundColor: lightingMode === 'DAY_SUNLIGHT' ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.95)',
                  transform: viewPerspective === 'ISOMETRIC_3D' 
                    ? 'rotateX(58deg) rotateZ(-36deg) scale(0.92)' 
                    : 'rotateX(0deg) rotateZ(0deg) scale(1)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)'
                }}
              >
                {/* Floor Lane Markings & Staging Striping */}
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                  <defs>
                    <pattern id="depotTile" width="10" height="10" patternUnits="userSpaceOnUse">
                      <rect width="10" height="10" fill="none" stroke={lightingMode === 'DAY_SUNLIGHT' ? '#cbd5e1' : '#1e293b'} strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#depotTile)" />

                  {/* Asphalt Staging Runway */}
                  <rect x="15" y="25" width="70" height="50" rx="3" fill={lightingMode === 'DAY_SUNLIGHT' ? '#94a3b8' : '#0f172a'} />
                  
                  {/* Yellow Hazard Stripes on Docks */}
                  <line x1="20" y1="28" x2="80" y2="28" stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="20" y1="72" x2="80" y2="72" stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="50" y1="28" x2="50" y2="72" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 3" />
                </svg>

                {/* Staging Dock Bays with Low-Poly / 3D Assets */}
                <div className="absolute inset-x-4 inset-y-6 grid grid-cols-2 gap-4 p-4">
                  {facility.bays.map((bay, idx) => {
                    const isBaySelected = bay.id === selectedBayId;
                    const isOccupied = bay.status === 'OCCUPIED';

                    return (
                      <div
                        key={bay.id}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedBayId(bay.id);
                        }}
                        className={`relative rounded-2xl p-3 border-2 transition-all duration-300 cursor-pointer flex items-center justify-between ${
                          isBaySelected
                            ? 'bg-indigo-600/25 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-105 z-30'
                            : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 hover:scale-102'
                        }`}
                      >
                        {/* Bay Label & Status Indicator */}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-white">{bay.bayNumber}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              bay.status === 'OCCUPIED' ? 'bg-emerald-400' : bay.status === 'AVAILABLE' ? 'bg-cyan-400' : 'bg-amber-400'
                            }`} />
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {bay.bayType.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* 3D Asset Render for Bay */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          {isOccupied ? (
                            <Vehicle5dIcon
                              type={idx % 2 === 0 ? 'TRUCK' : 'CAB'}
                              size={44}
                              isSelected={isBaySelected}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-500 font-black">
                              EMPTY
                            </div>
                          )}
                        </div>

                        {/* Progress Bar if Active */}
                        {isOccupied && (
                          <div className="absolute bottom-1.5 left-3 right-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" 
                              style={{ width: `${bay.progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Floating Environment Tag */}
            <div className="absolute top-3 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[10px] font-bold text-slate-300">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Solar Roof Array • 1,200 kW Inverter Network</span>
            </div>

            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[10px] font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Autonomous Staging</span>
            </div>

          </div>

        </div>

        {/* Right Column: Architectural Bay Diagnostics & Manifest Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                Bay Diagnostics
              </span>
              <h3 className="text-lg font-black text-white">{selectedBay.bayNumber}</h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              selectedBay.status === 'OCCUPIED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : selectedBay.status === 'AVAILABLE'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {selectedBay.status}
            </span>
          </div>

          {/* Occupied Vehicle Telemetry */}
          {selectedBay.status === 'OCCUPIED' ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <Vehicle5dIcon type="TRUCK" size={40} isSelected={true} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{selectedBay.occupiedVehicleModel}</h4>
                  <div className="text-[10px] font-mono text-cyan-400">{selectedBay.occupiedVehicleId}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">High-Speed CCS2 Telematics Attached</div>
                </div>
              </div>

              {/* Progress & Turnaround ETA */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Turnaround Progress</span>
                  <span className="font-mono text-emerald-400">{selectedBay.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" 
                    style={{ width: `${selectedBay.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>ETA Completion: {selectedBay.etaCompletionMin} min</span>
                  </span>
                  <span className="text-emerald-400 font-bold">On Schedule</span>
                </div>
              </div>

              {/* Bay Specifications */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-[10px] font-black uppercase text-slate-400">Bay Engineering Specs</div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Power Delivery:</span>
                  <span className="font-bold">240 kW DC Ultra-Fast</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Dock Height:</span>
                  <span className="font-bold">1.2m Hydraulic Adjustable</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Telemetry Link:</span>
                  <span className="font-bold text-emerald-400">5G Dedicated Sub-Band</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-sm font-black text-white">Dock Bay Available</h4>
              <p className="text-xs text-slate-400">Ready for incoming automated logistics dispatch or fleet maintenance assignment.</p>
            </div>
          )}

          {/* Quick Action */}
          <div className="space-y-2">
            <button
              onClick={() => {
                sounds.playPop();
                setShowStudio(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Box className="w-4 h-4 text-amber-400" />
              <span>Inspect Low-Poly 3D Assets (GLB / PNG)</span>
            </button>

            <button
              onClick={() => sounds.playSuccess()}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Assign Staging Sequence</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3D Low-Poly Vehicle Studio Modal */}
      {showStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar">
            <LowPolyVehicleStudio
              initialVehicle="truck"
              onClose={() => setShowStudio(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
