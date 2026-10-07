import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Flame, Radio, Eye, Layers, Sliders, RefreshCw, 
  TrendingUp, Users, Clock, AlertTriangle, ArrowUpRight,
  Zap, MapPin, Sparkles, Filter, Navigation
} from 'lucide-react';
import { HeatmapDemandPoint } from '../types';
import { HEATMAP_INITIAL_POINTS } from '../services/mockData';
import { sounds } from '../services/audio';

interface DemandHeatmapProps {
  onDispatchIncentive?: (zoneName: string, incentiveAmt: number) => void;
}

export const DemandHeatmap: React.FC<DemandHeatmapProps> = ({
  onDispatchIncentive
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Heatmap State
  const [dataPoints, setDataPoints] = useState<HeatmapDemandPoint[]>(HEATMAP_INITIAL_POINTS);
  const [selectedCity, setSelectedCity] = useState<'ALL' | 'Hyderabad' | 'Warangal'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [timePreset, setTimePreset] = useState<'LIVE' | 'MORNING_RUSH' | 'EVENING_PEAK' | 'NIGHT'>('LIVE');
  const [selectedPoint, setSelectedPoint] = useState<HeatmapDemandPoint | null>(null);

  // Display toggles
  const [showThermalGlow, setShowThermalGlow] = useState(true);
  const [showHotspotCentroids, setShowHotspotCentroids] = useState(true);
  const [showCaptainsSupply, setShowCaptainsSupply] = useState(true);
  const [showSurgeContours, setShowSurgeContours] = useState(true);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Sliders
  const [heatRadius, setHeatRadius] = useState<number>(36);
  const [heatIntensityMultiplier, setHeatIntensityMultiplier] = useState<number>(1.2);
  const [recentPingId, setRecentPingId] = useState<string | null>(null);
  const [incentiveAlert, setIncentiveAlert] = useState<string | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return dataPoints.filter(p => {
      if (selectedCity !== 'ALL' && p.city !== selectedCity) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [dataPoints, selectedCity, selectedCategory]);

  // Real-time simulated demand stream
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const target = prev[randomIndex];
        setRecentPingId(target.id);
        
        // Random demand spike (+1 to +4 requests)
        const updated = prev.map((p, idx) => {
          if (idx === randomIndex) {
            const newRequests = p.activeRequests + Math.floor(Math.random() * 3) + 1;
            const newIntensity = Math.min(0.98, p.intensity + 0.02);
            const newSurge = +(Math.min(2.4, p.surgeMultiplier + 0.05).toFixed(1));
            return {
              ...p,
              activeRequests: newRequests,
              intensity: newIntensity,
              surgeMultiplier: newSurge,
              lastPingTime: 'Just now'
            };
          }
          return p;
        });
        return updated;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Adjust data when time preset switches
  const handleTimePresetChange = (preset: 'LIVE' | 'MORNING_RUSH' | 'EVENING_PEAK' | 'NIGHT') => {
    sounds.playPop();
    setTimePreset(preset);
    setDataPoints(prev => prev.map(p => {
      let multiplier = 1;
      if (preset === 'MORNING_RUSH') {
        multiplier = p.category === 'office' || p.category === 'station' ? 1.4 : 0.8;
      } else if (preset === 'EVENING_PEAK') {
        multiplier = p.category === 'office' || p.category === 'commercial' ? 1.5 : 0.9;
      } else if (preset === 'NIGHT') {
        multiplier = p.category === 'airport' || p.name.includes('Jubilee') ? 1.6 : 0.4;
      }
      return {
        ...p,
        activeRequests: Math.round(p.activeRequests * multiplier),
        surgeMultiplier: +(Math.min(2.5, Math.max(1.0, p.surgeMultiplier * (multiplier > 1 ? 1.2 : 0.85))).toFixed(1)),
        intensity: Math.min(0.98, Math.max(0.3, p.intensity * multiplier))
      };
    }));
  };

  // D3 Heatmap Rendering Engine
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 500;

    svg.selectAll('*').remove();

    // Definitions: Gradients and Glow Filters
    const defs = svg.append('defs');

    // Gaussian blur filter for smooth thermal dissipation
    const filter = defs.append('filter')
      .attr('id', 'heat-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', 14)
      .attr('result', 'blur');

    // D3 Color Interpolator for Thermal Heatmap (Indigo -> Cyan -> Emerald -> Amber -> Red/Crimson)
    const colorScale = d3.scaleSequential()
      .domain([0.2, 1.0])
      .interpolator(d3.interpolateTurbo);

    // Map Background Container
    const mapG = svg.append('g').attr('class', 'map-layer');

    // Grid coordinates representation
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([0, height]);

    // Draw expressway corridors between Hyderabad and Warangal (NH 163 Highway)
    mapG.append('path')
      .attr('d', `M ${xScale(32)} ${yScale(42)} Q ${xScale(52)} ${yScale(46)} ${xScale(72)} ${yScale(44)}`)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '6 4')
      .attr('opacity', 0.5)
      .attr('fill', 'none');

    // Label NH 163 Corridor
    mapG.append('text')
      .attr('x', xScale(50))
      .attr('y', yScale(44))
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .text('NH 163 Super Highway (Hyd ⇄ Wgl)');

    // Zone Dividers / Background boundary rectangles
    // Hyderabad Zone
    mapG.append('rect')
      .attr('x', xScale(12))
      .attr('y', yScale(18))
      .attr('width', xScale(44) - xScale(12))
      .attr('height', yScale(90) - yScale(18))
      .attr('rx', 16)
      .attr('fill', '#1e293b')
      .attr('opacity', 0.25)
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '4 3');

    mapG.append('text')
      .attr('x', xScale(15))
      .attr('y', yScale(24))
      .attr('fill', '#38bdf8')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.05em')
      .text('HYDERABAD METRO ZONE');

    // Warangal Zone
    mapG.append('rect')
      .attr('x', xScale(60))
      .attr('y', yScale(15))
      .attr('width', xScale(85) - xScale(60))
      .attr('height', yScale(65) - yScale(15))
      .attr('rx', 16)
      .attr('fill', '#1e293b')
      .attr('opacity', 0.25)
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '4 3');

    mapG.append('text')
      .attr('x', xScale(62))
      .attr('y', yScale(21))
      .attr('fill', '#a855f7')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.05em')
      .text('WARANGAL TRI-CITIES ZONE');

    // 1. LAYER: THERMAL GLOW (D3 Radial Density Blurs)
    if (showThermalGlow) {
      const heatG = svg.append('g')
        .attr('class', 'heat-layer')
        .attr('filter', 'url(#heat-blur)')
        .attr('opacity', 0.85);

      filteredData.forEach(p => {
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        const r = heatRadius * (0.8 + p.intensity * 0.7) * heatIntensityMultiplier;
        const color = colorScale(p.intensity);

        heatG.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', color)
          .attr('opacity', Math.min(0.85, p.intensity * 0.9));
      });
    }

    // 2. LAYER: SURGE CONTOUR RINGS (Surge Multiplier Isoline representation)
    if (showSurgeContours) {
      const contourG = svg.append('g').attr('class', 'contour-layer');

      filteredData.filter(p => p.surgeMultiplier >= 1.3).forEach(p => {
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        const r = (p.surgeMultiplier - 1.0) * 35;

        contourG.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', 'none')
          .attr('stroke', p.surgeMultiplier >= 1.6 ? '#f43f5e' : '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 3')
          .attr('opacity', 0.7);

        // Surge multiplier tag
        contourG.append('text')
          .attr('x', cx + r + 4)
          .attr('y', cy - 2)
          .attr('fill', p.surgeMultiplier >= 1.6 ? '#fb7185' : '#fcd34d')
          .attr('font-size', '9px')
          .attr('font-weight', '800')
          .text(`${p.surgeMultiplier}x`);
      });
    }

    // 3. LAYER: FLEET SUPPLY DOTS (Captains Available Nearby)
    if (showCaptainsSupply) {
      const supplyG = svg.append('g').attr('class', 'supply-layer');

      filteredData.forEach(p => {
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        const dotCount = Math.min(Math.round(p.captainsNearby / 4), 6);

        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * 2 * Math.PI;
          const dist = 18 + (i % 2) * 6;
          const sx = cx + Math.cos(angle) * dist;
          const sy = cy + Math.sin(angle) * dist;

          supplyG.append('circle')
            .attr('cx', sx)
            .attr('cy', sy)
            .attr('r', 2)
            .attr('fill', '#38bdf8')
            .attr('opacity', 0.85);
        }
      });
    }

    // 4. LAYER: HOTSPOT CENTROIDS & INTERACTIVE HOVER/CLICK
    if (showHotspotCentroids) {
      const centroidsG = svg.append('g').attr('class', 'centroids-layer');

      filteredData.forEach(p => {
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        const isRecent = recentPingId === p.id;
        const isSelected = selectedPoint?.id === p.id;

        const nodeG = centroidsG.append('g')
          .attr('class', 'hotspot-node')
          .attr('cursor', 'pointer')
          .on('click', () => {
            sounds.playPop();
            setSelectedPoint(p);
          });

        // Pulsing radar ring on recent demand ping
        if (isRecent) {
          nodeG.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 16)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 2)
            .attr('opacity', 0.9)
            .transition()
            .duration(1200)
            .attr('r', 38)
            .attr('opacity', 0)
            .remove();
        }

        // Selection ring
        if (isSelected) {
          nodeG.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 14)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 2.5);
        }

        // Core marker
        nodeG.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', p.intensity >= 0.85 ? 7 : 5)
          .attr('fill', colorScale(p.intensity))
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))');

        // Location label
        const textNode = nodeG.append('text')
          .attr('x', cx)
          .attr('y', cy + 16)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9.5px')
          .attr('font-weight', '700')
          .attr('paint-order', 'stroke')
          .attr('stroke', '#090d16')
          .attr('stroke-width', '3px')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .text(p.name.split(' ')[0]);

        // Demand request badge
        nodeG.append('text')
          .attr('x', cx)
          .attr('y', cy - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e2e8f0')
          .attr('font-size', '8.5px')
          .attr('font-weight', '800')
          .text(`${p.activeRequests} req`);
      });
    }

  }, [
    filteredData, 
    showThermalGlow, 
    showSurgeContours, 
    showCaptainsSupply, 
    showHotspotCentroids, 
    heatRadius, 
    heatIntensityMultiplier, 
    recentPingId, 
    selectedPoint
  ]);

  const handleDispatchIncentive = (point: HeatmapDemandPoint) => {
    sounds.playAlert();
    setIncentiveAlert(`⚡ Surge Incentive Broadcasted: +₹50 per trip to Captains in ${point.name}!`);
    onDispatchIncentive?.(point.name, 50);

    // Simulated boost to supply after 2s
    setTimeout(() => {
      setDataPoints(prev => prev.map(p => p.id === point.id ? {
        ...p,
        captainsNearby: p.captainsNearby + 8,
        surgeMultiplier: Math.max(1.1, +(p.surgeMultiplier - 0.2).toFixed(1))
      } : p));
    }, 2200);

    setTimeout(() => setIncentiveAlert(null), 4000);
  };

  // Top stats
  const topDemandSpot = [...dataPoints].sort((a, b) => b.activeRequests - a.activeRequests)[0];
  const peakSurgeSpot = [...dataPoints].sort((a, b) => b.surgeMultiplier - a.surgeMultiplier)[0];
  const totalLiveRequests = dataPoints.reduce((acc, p) => acc + p.activeRequests, 0);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-slate-100">
      
      {/* Heatmap Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-4 h-4 fill-rose-500/30" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
              D3 Real-Time Heatmap Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs text-slate-400 font-semibold">Corridor: Hyderabad ⇄ Warangal</span>
          </div>
          <h3 className="text-2xl font-black text-white mt-1">High-Demand Pickup Heatmap</h3>
          <p className="text-xs text-slate-400 font-medium">
            Dynamic passenger density kernel interpolation across major commercial & transit corridors
          </p>
        </div>

        {/* Live Stream & Time Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Ping toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              isLiveStreaming
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-rose-400' : ''}`} />
            <span>{isLiveStreaming ? 'LIVE STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Time Presets */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {(['LIVE', 'MORNING_RUSH', 'EVENING_PEAK', 'NIGHT'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => handleTimePresetChange(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                  timePreset === preset
                    ? 'bg-brand-blue text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset === 'LIVE' ? 'Now' : preset === 'MORNING_RUSH' ? 'Morning 8-11am' : preset === 'EVENING_PEAK' ? 'Evening 5-9pm' : 'Night'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Live In-Flight Demand</span>
          <div className="text-2xl font-black text-white mt-0.5">{totalLiveRequests} <span className="text-xs font-semibold text-rose-400">rides/hr</span></div>
          <span className="text-[10px] text-emerald-400 font-semibold">+18% above median baseline</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Hottest Demand Cluster</span>
          <div className="text-base font-black text-rose-400 mt-0.5 truncate">{topDemandSpot.name}</div>
          <span className="text-[10px] text-slate-400 font-semibold">{topDemandSpot.activeRequests} req • {topDemandSpot.area}</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Highest Surge Multiplier</span>
          <div className="text-2xl font-black text-amber-400 mt-0.5">{peakSurgeSpot.surgeMultiplier}x <span className="text-xs font-bold text-amber-500">SURGE</span></div>
          <span className="text-[10px] text-amber-300 font-semibold">{peakSurgeSpot.name.split(' ')[0]} zone</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Supply Deficit</span>
          <div className="text-2xl font-black text-blue-400 mt-0.5">38 Captains</div>
          <span className="text-[10px] text-blue-300 font-semibold">Immediate rebalancing recommended</span>
        </div>
      </div>

      {/* Incentive Alert Banner */}
      {incentiveAlert && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{incentiveAlert}</span>
          </div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">Dispatched</span>
        </div>
      )}

      {/* Main Heatmap Visualization Canvas & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* D3 Heatmap SVG Canvas (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          
          {/* Filter Pill Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            {/* City Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Zone:</span>
              {(['ALL', 'Hyderabad', 'Warangal'] as const).map(city => (
                <button
                  key={city}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedCity(city);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    selectedCity === city
                      ? 'bg-brand-blue text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {city === 'ALL' ? 'All Corridors' : city}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setShowThermalGlow(!showThermalGlow)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                  showThermalGlow ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                Glow {showThermalGlow ? '✓' : '✕'}
              </button>

              <button
                onClick={() => setShowSurgeContours(!showSurgeContours)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                  showSurgeContours ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                Surge Rings {showSurgeContours ? '✓' : '✕'}
              </button>

              <button
                onClick={() => setShowCaptainsSupply(!showCaptainsSupply)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                  showCaptainsSupply ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                Captains {showCaptainsSupply ? '✓' : '✕'}
              </button>
            </div>
          </div>

          {/* SVG Canvas Map Box */}
          <div 
            ref={containerRef}
            className="relative w-full h-[480px] bg-[#070b14] border border-slate-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center"
          >
            <svg 
              ref={svgRef}
              viewBox="0 0 800 500" 
              className="w-full h-full select-none"
            />

            {/* Thermal Gradient Legend */}
            <div className="absolute bottom-3 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-[10px] space-y-1 shadow-lg">
              <div className="font-extrabold text-slate-300 flex items-center justify-between gap-4">
                <span>Demand Density Scale</span>
                <span className="text-rose-400 font-mono">D3 Turbo</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-600"></div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Low (&lt;0.3)</span>
                <span>Moderate</span>
                <span>Critical (&gt;0.9)</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute top-3 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400">
              Click any hotspot centroid to inspect & dispatch
            </div>
          </div>

          {/* Heat Radius & Intensity Tuning Slider Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold">Heat Radius:</span>
              <input
                type="range"
                min="20"
                max="60"
                value={heatRadius}
                onChange={(e) => setHeatRadius(Number(e.target.value))}
                className="w-24 accent-rose-500 cursor-pointer"
              />
              <span className="font-mono text-slate-300 font-bold">{heatRadius}px</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold">Intensity Gain:</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={heatIntensityMultiplier}
                onChange={(e) => setHeatIntensityMultiplier(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="font-mono text-slate-300 font-bold">{heatIntensityMultiplier}x</span>
            </div>

            <button
              onClick={() => {
                setHeatRadius(36);
                setHeatIntensityMultiplier(1.2);
                sounds.playPop();
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Optics</span>
            </button>
          </div>

        </div>

        {/* Selected Hotspot Deep-Dive Drawer (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Cluster Inspector
                </span>
                {selectedPoint && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    selectedPoint.city === 'Hyderabad' ? 'bg-sky-500/20 text-sky-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {selectedPoint.city}
                  </span>
                )}
              </div>

              {selectedPoint ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="text-lg font-black text-white">{selectedPoint.name}</h4>
                    <p className="text-xs text-slate-400 font-semibold">{selectedPoint.area}</p>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Requests</span>
                      <div className="text-xl font-black text-rose-400">{selectedPoint.activeRequests}</div>
                      <span className="text-[9px] text-slate-400 font-semibold">Active riders</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Surge</span>
                      <div className="text-xl font-black text-amber-400">{selectedPoint.surgeMultiplier}x</div>
                      <span className="text-[9px] text-amber-500 font-semibold">Dynamic fare</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Supply</span>
                      <div className="text-xl font-black text-blue-400">{selectedPoint.captainsNearby}</div>
                      <span className="text-[9px] text-blue-300 font-semibold">Captains online</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Avg Wait</span>
                      <div className="text-xl font-black text-emerald-400">{selectedPoint.avgWaitMin}m</div>
                      <span className="text-[9px] text-emerald-300 font-semibold">Pickup ETA</span>
                    </div>
                  </div>

                  {/* Demand vs Supply Deficit meter */}
                  <div className="space-y-1.5 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Demand Stress Index</span>
                      <span className="text-rose-400">{Math.round(selectedPoint.intensity * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500 transition-all duration-500"
                        style={{ width: `${selectedPoint.intensity * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {selectedPoint.activeRequests > selectedPoint.captainsNearby * 3
                        ? '⚠️ Critical Deficit: Demand exceeds supply by 3.4x'
                        : 'Optimal supply buffer currently maintained'}
                    </span>
                  </div>

                  {/* Operational Dispatch Action */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleDispatchIncentive(selectedPoint)}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition active:scale-98"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>DISPATCH +₹50 SURGE INCENTIVE</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playPop();
                        alert(`📢 Driver Rebalance Push Notification sent to all idling Captains within 5km of ${selectedPoint.name}!`);
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Broadcast Rebalance Route
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold px-4">
                    Click any heatmap marker on Hyderabad or Warangal to inspect real-time metrics and broadcast surge incentives.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Hotspot list */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Fast Hotspot Select:</span>
              <div className="flex flex-wrap gap-1.5">
                {filteredData.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedPoint(p);
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      selectedPoint?.id === p.id 
                        ? 'bg-brand-blue text-white border-blue-400' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {p.name.split(' ')[0]} ({p.surgeMultiplier}x)
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
