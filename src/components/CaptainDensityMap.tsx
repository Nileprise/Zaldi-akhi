import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Users, Navigation, Filter, Layers, Zap, Eye, Compass, 
  MapPin, RefreshCw, Activity, ArrowUpRight, ShieldCheck,
  ChevronRight, Bike, Car, Truck, Sparkles, CheckCircle2
} from 'lucide-react';
import { Driver } from '../types';
import { sounds } from '../services/audio';

interface CaptainGridCell {
  row: number;
  col: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  label: string;
  zone: 'Hyderabad' | 'Warangal' | 'Corridor';
  districtName: string;
  captainCount: number;
  activeCaptains: Driver[];
  idleCaptains: number;
  busyCaptains: number;
  densityScore: number; // 0 to 1
  vehicleMix: {
    bike: number;
    auto: number;
    cab: number;
    truck: number;
  };
}

interface CaptainDensityMapProps {
  drivers: Driver[];
  onToggleDriverStatus?: (driverId: string) => void;
  onDispatchToZone?: (zoneName: string) => void;
}

export const CaptainDensityMap: React.FC<CaptainDensityMapProps> = ({
  drivers,
  onToggleDriverStatus,
  onDispatchToZone
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter and display states
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'Hyderabad' | 'Warangal'>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'BIKE' | 'AUTO' | 'CAB' | 'TRUCK'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE_ONLY' | 'ALL_REGISTERED'>('ONLINE_ONLY');
  const [viewMode, setViewMode] = useState<'HEX_HEAT' | 'GRID_CELLS' | 'ISOLINE_CONTOUR'>('GRID_CELLS');
  
  // Interactive inspection
  const [selectedCell, setSelectedCell] = useState<CaptainGridCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CaptainGridCell | null>(null);
  const [showDriverPointers, setShowDriverPointers] = useState<boolean>(true);
  const [showDensityGlow, setShowDensityGlow] = useState<boolean>(true);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Generate synthetic expanded fleet for realistic city-wide density modeling
  // anchored by real prop drivers
  const fleetDrivers = useMemo(() => {
    // Base drivers passed in props
    const baseList = [...drivers];
    
    // Supplementary simulated fleet distributed realistically across Hyderabad & Warangal city grids
    const extraFleet: Driver[] = [
      { id: 'f-1', name: 'Karthik Varma', phone: '+91 98481-22311', vehicle: 'Bike Moto', vehicleModel: 'Hero Splendor', plate: 'TS 09 XY 4411', rating: 4.9, totalTrips: 820, isOnline: true, avatarSeed: 'Karthik', lat: 17.443, lng: 78.377, earningsToday: 890 },
      { id: 'f-2', name: 'Mohammed Ali', phone: '+91 97001-55219', vehicle: 'Auto 3W', vehicleModel: 'Bajaj RE', plate: 'TS 08 TC 2102', rating: 4.86, totalTrips: 1140, isOnline: true, avatarSeed: 'Ali', lat: 17.447, lng: 78.382, earningsToday: 1120 },
      { id: 'f-3', name: 'Naveen Rao', phone: '+91 94405-33291', vehicle: 'Cab Prime', vehicleModel: 'Swift Dzire', plate: 'TS 07 CD 9012', rating: 4.95, totalTrips: 1980, isOnline: true, avatarSeed: 'Naveen', lat: 17.439, lng: 78.389, earningsToday: 1540 },
      { id: 'f-4', name: 'Srikanth G', phone: '+91 98850-44123', vehicle: 'Bike Moto', vehicleModel: 'Honda Shine', plate: 'TS 09 EF 3321', rating: 4.88, totalTrips: 640, isOnline: true, avatarSeed: 'Srikanth', lat: 17.435, lng: 78.368, earningsToday: 740 },
      { id: 'f-5', name: 'Venkat Reddy', phone: '+91 98499-11223', vehicle: 'Mini Truck', vehicleModel: 'Tata Ace', plate: 'TS 03 LK 8821', rating: 4.82, totalTrips: 410, isOnline: true, avatarSeed: 'Venkat', lat: 17.448, lng: 78.362, earningsToday: 1250 },
      { id: 'f-6', name: 'Manish Kumar', phone: '+91 93901-77211', vehicle: 'Cab Prime', vehicleModel: 'Toyota Etios', plate: 'TS 07 FA 1129', rating: 4.91, totalTrips: 1420, isOnline: true, avatarSeed: 'Manish', lat: 17.430, lng: 78.398, earningsToday: 1840 },
      { id: 'f-7', name: 'Rajesh Naidu', phone: '+91 99881-22345', vehicle: 'Auto 3W', vehicleModel: 'Piaggio Ape', plate: 'TS 08 AB 5543', rating: 4.87, totalTrips: 980, isOnline: true, avatarSeed: 'Rajesh', lat: 17.452, lng: 78.371, earningsToday: 980 },
      { id: 'f-8', name: 'Sambaiah B', phone: '+91 98490-66771', vehicle: 'Auto 3W', vehicleModel: 'Bajaj Compact', plate: 'TS 03 TA 1199', rating: 4.93, totalTrips: 1720, isOnline: true, avatarSeed: 'Sambaiah', lat: 17.985, lng: 79.598, earningsToday: 1180 },
      { id: 'f-9', name: 'Prashanth M', phone: '+91 98661-44321', vehicle: 'Bike Moto', vehicleModel: 'TVS Raider', plate: 'TS 03 BK 9021', rating: 4.89, totalTrips: 590, isOnline: true, avatarSeed: 'Prashanth', lat: 17.992, lng: 79.605, earningsToday: 680 },
      { id: 'f-10', name: 'Thirupathi K', phone: '+91 97010-88214', vehicle: 'Cab Prime', vehicleModel: 'Hyundai Xcent', plate: 'TS 03 CR 4511', rating: 4.94, totalTrips: 1280, isOnline: true, avatarSeed: 'Thirupathi', lat: 17.978, lng: 79.590, earningsToday: 1420 },
      { id: 'f-11', name: 'Anil Chary', phone: '+91 94901-22901', vehicle: 'Bike Moto', vehicleModel: 'Bajaj Pulsar', plate: 'TS 03 BK 4402', rating: 4.81, totalTrips: 430, isOnline: true, avatarSeed: 'Anil', lat: 17.998, lng: 79.582, earningsToday: 510 },
      { id: 'f-12', name: 'Ramesh Goud', phone: '+91 98492-33901', vehicle: 'Auto 3W', vehicleModel: 'Bajaj RE', plate: 'TS 03 TA 7891', rating: 4.9, totalTrips: 1350, isOnline: true, avatarSeed: 'Ramesh', lat: 17.972, lng: 79.585, earningsToday: 920 },
      { id: 'f-13', name: 'Deepak Jha', phone: '+91 98112-99881', vehicle: 'Cab Prime', vehicleModel: 'Maruti Dzire', plate: 'TS 07 ER 6655', rating: 4.96, totalTrips: 2210, isOnline: true, avatarSeed: 'Deepak', lat: 17.420, lng: 78.435, earningsToday: 2150 },
      { id: 'f-14', name: 'Ashok V', phone: '+91 94411-55099', vehicle: 'Bike Moto', vehicleModel: 'Hero Splendor', plate: 'TS 09 QP 1123', rating: 4.84, totalTrips: 760, isOnline: true, avatarSeed: 'Ashok', lat: 17.428, lng: 78.448, earningsToday: 790 },
      { id: 'f-15', name: 'Govind Rao', phone: '+91 98855-33211', vehicle: 'Mini Truck', vehicleModel: 'Tata Ace', plate: 'TS 09 TR 3301', rating: 4.79, totalTrips: 340, isOnline: true, avatarSeed: 'Govind', lat: 17.410, lng: 78.420, earningsToday: 1100 }
    ];

    return [...baseList, ...extraFleet];
  }, [drivers]);

  // City Grid definition (8 columns x 5 rows = 40 city blocks)
  const gridCells = useMemo<CaptainGridCell[]>(() => {
    const cols = 8;
    const rows = 5;
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const districtNamesMatrix: { [key: string]: { name: string; zone: 'Hyderabad' | 'Warangal' | 'Corridor' } } = {
      // Hyderabad Zone (Cols 0 to 3)
      '0,0': { name: 'Miyapur Hub', zone: 'Hyderabad' },
      '1,0': { name: 'KPHB Colony', zone: 'Hyderabad' },
      '2,0': { name: 'Kukatpally Y-Junction', zone: 'Hyderabad' },
      '3,0': { name: 'Balanagar Industrial', zone: 'Hyderabad' },

      '0,1': { name: 'Kondapur Bot. Garden', zone: 'Hyderabad' },
      '1,1': { name: 'Hitec City / Mindspace', zone: 'Hyderabad' },
      '2,1': { name: 'Madhapur / Durgam Cheruvu', zone: 'Hyderabad' },
      '3,1': { name: 'Jubilee Hills Checkpost', zone: 'Hyderabad' },

      '0,2': { name: 'Financial District SEZ', zone: 'Hyderabad' },
      '1,2': { name: 'Gachibowli Stadium', zone: 'Hyderabad' },
      '2,2': { name: 'Banjara Hills Rd 12', zone: 'Hyderabad' },
      '3,2': { name: 'Punjagutta Central', zone: 'Hyderabad' },

      '0,3': { name: 'Nanakramguda Wipro Circle', zone: 'Hyderabad' },
      '1,3': { name: 'Mehdipatnam Hub', zone: 'Hyderabad' },
      '2,3': { name: 'Charminar Heritage', zone: 'Hyderabad' },
      '3,3': { name: 'Secunderabad Junction', zone: 'Hyderabad' },

      '0,4': { name: 'Shamshabad Airport Outer', zone: 'Hyderabad' },
      '1,4': { name: 'RGIA Terminal 1 Hub', zone: 'Hyderabad' },
      '2,4': { name: 'Aramghar Junction', zone: 'Hyderabad' },
      '3,4': { name: 'LB Nagar Ring Road', zone: 'Hyderabad' },

      // NH 163 Corridor / Outer Grid (Cols 4 to 5)
      '4,0': { name: 'Medchal Corridor', zone: 'Corridor' },
      '5,0': { name: 'Alwal Express Hub', zone: 'Corridor' },
      '4,1': { name: 'Uppal Ring Road', zone: 'Corridor' },
      '5,1': { name: 'Ghatkesar NH 163', zone: 'Corridor' },
      '4,2': { name: 'Bhongir Fort Interchange', zone: 'Corridor' },
      '5,2': { name: 'Aler Highway Junction', zone: 'Corridor' },
      '4,3': { name: 'Jangaon Toll Plaza', zone: 'Corridor' },
      '5,3': { name: 'Pembarti Heritage Link', zone: 'Corridor' },
      '4,4': { name: 'Station Ghanpur', zone: 'Corridor' },
      '5,4': { name: 'Madikonda Tech Park', zone: 'Corridor' },

      // Warangal Tri-Cities Zone (Cols 6 to 7)
      '6,0': { name: 'Kakatiya University North', zone: 'Warangal' },
      '7,0': { name: 'Hanamkonda Collectorate', zone: 'Warangal' },
      '6,1': { name: 'Subedari Court Circle', zone: 'Warangal' },
      '7,1': { name: 'Lashkar Bazaar Center', zone: 'Warangal' },
      '6,2': { name: 'Kazipet Diesel Colony', zone: 'Warangal' },
      '7,2': { name: 'Warangal Stn Chowrasta', zone: 'Warangal' },
      '6,3': { name: 'Kazipet Junction Stn', zone: 'Warangal' },
      '7,3': { name: 'MGM Hospital Center', zone: 'Warangal' },
      '6,4': { name: 'Waddepally Lake Hub', zone: 'Warangal' },
      '7,4': { name: 'Enumamula Agro Market', zone: 'Warangal' }
    };

    const cells: CaptainGridCell[] = [];

    // Base captain distribution weights according to demand corridors
    const densityWeights: { [key: string]: number } = {
      '1,1': 9, // Hitec City
      '2,1': 8, // Madhapur
      '0,2': 7, // Financial District
      '1,2': 7, // Gachibowli
      '1,4': 8, // RGIA Airport
      '3,3': 7, // Secunderabad
      '7,2': 6, // Warangal Station
      '7,1': 5, // Lashkar Bazaar
      '6,3': 5, // Kazipet Junction
      '3,1': 6, // Jubilee Hills
      '2,2': 5  // Banjara Hills
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${c},${r}`;
        const meta = districtNamesMatrix[key] || { 
          name: `Sector [${c + 1}-${r + 1}]`, 
          zone: c < 4 ? 'Hyderabad' : c > 5 ? 'Warangal' : 'Corridor' 
        };

        const weight = densityWeights[key] || Math.floor(Math.sin(c * 1.5 + r * 2.1) * 2 + 3);
        const cellCaptainsCount = Math.max(1, Math.min(14, weight + (c % 2 === 0 ? 1 : 0)));

        // Sample drivers from fleet associated with this cell
        const matchingDrivers = fleetDrivers.slice((r * cols + c) % fleetDrivers.length, ((r * cols + c) % fleetDrivers.length) + cellCaptainsCount);

        const bikes = Math.max(1, Math.round(cellCaptainsCount * 0.45));
        const autos = Math.max(1, Math.round(cellCaptainsCount * 0.25));
        const cabs = Math.max(0, Math.round(cellCaptainsCount * 0.22));
        const trucks = Math.max(0, cellCaptainsCount - bikes - autos - cabs);

        cells.push({
          row: r,
          col: c,
          x: c * cellW,
          y: r * cellH,
          width: cellW,
          height: cellH,
          label: `${String.fromCharCode(65 + r)}${c + 1}`,
          zone: meta.zone,
          districtName: meta.name,
          captainCount: cellCaptainsCount,
          activeCaptains: matchingDrivers,
          idleCaptains: Math.max(1, Math.round(cellCaptainsCount * 0.65)),
          busyCaptains: Math.max(0, Math.round(cellCaptainsCount * 0.35)),
          densityScore: Math.min(1, +(cellCaptainsCount / 10).toFixed(2)),
          vehicleMix: { bike: bikes, auto: autos, cab: cabs, truck: trucks }
        });
      }
    }

    return cells;
  }, [fleetDrivers]);

  // Filtered cells based on zone selector
  const visibleCells = useMemo(() => {
    return gridCells.filter(cell => {
      if (selectedZone !== 'ALL' && cell.zone !== selectedZone) return false;
      return true;
    });
  }, [gridCells, selectedZone]);

  // Aggregate Metrics
  const totalFleetCaptains = visibleCells.reduce((acc, c) => acc + c.captainCount, 0);
  const totalIdleCaptains = visibleCells.reduce((acc, c) => acc + c.idleCaptains, 0);
  const totalBusyCaptains = visibleCells.reduce((acc, c) => acc + c.busyCaptains, 0);
  const peakDensityCell = [...visibleCells].sort((a, b) => b.captainCount - a.captainCount)[0] || visibleCells[0];

  // D3 Visualization Engine
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 840;
    const height = 480;

    svg.selectAll('*').remove();

    // Scale mappings
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([0, height]);

    // Color Interpolators
    // D3 Chromatic Density Ramp (Navy -> Emerald -> Cyan -> Amber -> Flame Red)
    const densityColorScale = d3.scaleSequential()
      .domain([0.1, 1.0])
      .interpolator(d3.interpolateViridis);

    const defs = svg.append('defs');

    // Glow filter
    const glowFilter = defs.append('filter')
      .attr('id', 'captain-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 6)
      .attr('result', 'blur');
    glowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Pattern for grid cell textured hatch
    const pattern = defs.append('pattern')
      .attr('id', 'grid-dots')
      .attr('width', 10)
      .attr('height', 10)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 0.8)
      .attr('fill', '#334155')
      .attr('opacity', 0.6);

    const mainG = svg.append('g').attr('class', 'main-layer');

    // NH-163 Super Expressway Corridor Line
    mainG.append('path')
      .attr('d', `M ${xScale(15)} ${yScale(32)} Q ${xScale(48)} ${yScale(42)} ${xScale(82)} ${yScale(36)}`)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '8 4')
      .attr('opacity', 0.4)
      .attr('fill', 'none');

    // Outer Ring Road (ORR) Arterial Belt
    mainG.append('ellipse')
      .attr('cx', xScale(22))
      .attr('cy', yScale(48))
      .attr('rx', xScale(22))
      .attr('ry', yScale(36))
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 6')
      .attr('opacity', 0.3)
      .attr('fill', 'none');

    // Render Grid Cells
    const cellsG = mainG.append('g').attr('class', 'cells-group');

    visibleCells.forEach(cell => {
      const x = xScale(cell.x);
      const y = yScale(cell.y);
      const w = xScale(cell.width);
      const h = yScale(cell.height);
      const isSelected = selectedCell?.districtName === cell.districtName;
      const isHovered = hoveredCell?.districtName === cell.districtName;

      const cellG = cellsG.append('g')
        .attr('class', `grid-cell-${cell.label}`)
        .attr('cursor', 'pointer')
        .on('mouseenter', () => {
          setHoveredCell(cell);
        })
        .on('mouseleave', () => {
          setHoveredCell(null);
        })
        .on('click', () => {
          sounds.playPop();
          setSelectedCell(cell);
        });

      // Density background fill
      const fillColor = densityColorScale(cell.densityScore);

      cellG.append('rect')
        .attr('x', x + 2)
        .attr('y', y + 2)
        .attr('width', w - 4)
        .attr('height', h - 4)
        .attr('rx', 8)
        .attr('fill', fillColor)
        .attr('opacity', isSelected ? 0.9 : isHovered ? 0.75 : 0.45)
        .attr('stroke', isSelected ? '#38bdf8' : isHovered ? '#60a5fa' : '#1e293b')
        .attr('stroke-width', isSelected ? 2.5 : isHovered ? 1.5 : 1)
        .attr('filter', isSelected && showDensityGlow ? 'url(#captain-glow)' : 'none')
        .transition()
        .duration(300);

      // Grid coordinate badge (e.g. B2)
      cellG.append('text')
        .attr('x', x + 8)
        .attr('y', y + 16)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-weight', '800')
        .attr('font-family', 'monospace')
        .text(cell.label);

      // District Name
      cellG.append('text')
        .attr('x', x + 8)
        .attr('y', y + 30)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('paint-order', 'stroke')
        .attr('stroke', '#020617')
        .attr('stroke-width', '2px')
        .text(cell.districtName.length > 15 ? cell.districtName.substring(0, 14) + '…' : cell.districtName);

      // Captain count pill badge
      const badgeW = 42;
      const badgeH = 18;
      const badgeX = x + w - badgeW - 8;
      const badgeY = y + 8;

      cellG.append('rect')
        .attr('x', badgeX)
        .attr('y', badgeY)
        .attr('width', badgeW)
        .attr('height', badgeH)
        .attr('rx', 6)
        .attr('fill', cell.captainCount >= 7 ? '#059669' : cell.captainCount >= 4 ? '#2563eb' : '#475569')
        .attr('opacity', 0.95);

      cellG.append('text')
        .attr('x', badgeX + badgeW / 2)
        .attr('y', badgeY + 12)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '9.5px')
        .attr('font-weight', '900')
        .text(`${cell.captainCount} cap`);

      // Vehicle mini icons indicators inside cell
      if (showDriverPointers) {
        const iconsY = y + h - 14;
        
        // Bike dot
        cellG.append('circle')
          .attr('cx', x + 12)
          .attr('cy', iconsY)
          .attr('r', 3)
          .attr('fill', '#38bdf8')
          .attr('title', `${cell.vehicleMix.bike} Bikes`);

        cellG.append('text')
          .attr('x', x + 18)
          .attr('y', iconsY + 3)
          .attr('fill', '#cbd5e1')
          .attr('font-size', '8px')
          .attr('font-weight', '700')
          .text(cell.vehicleMix.bike);

        // Auto dot
        cellG.append('circle')
          .attr('cx', x + 34)
          .attr('cy', iconsY)
          .attr('r', 3)
          .attr('fill', '#fbbf24')
          .attr('title', `${cell.vehicleMix.auto} Autos`);

        cellG.append('text')
          .attr('x', x + 40)
          .attr('y', iconsY + 3)
          .attr('fill', '#cbd5e1')
          .attr('font-size', '8px')
          .attr('font-weight', '700')
          .text(cell.vehicleMix.auto);

        // Cab dot
        cellG.append('circle')
          .attr('cx', x + 56)
          .attr('cy', iconsY)
          .attr('r', 3)
          .attr('fill', '#34d399')
          .attr('title', `${cell.vehicleMix.cab} Cabs`);

        cellG.append('text')
          .attr('x', x + 62)
          .attr('y', iconsY + 3)
          .attr('fill', '#cbd5e1')
          .attr('font-size', '8px')
          .attr('font-weight', '700')
          .text(cell.vehicleMix.cab);
      }

      // Live pulse radar on peak cells
      if (cell.captainCount >= 8) {
        cellG.append('circle')
          .attr('cx', x + w - 16)
          .attr('cy', y + h - 14)
          .attr('r', 3)
          .attr('fill', '#10b981')
          .attr('class', 'animate-ping')
          .attr('opacity', 0.7);

        cellG.append('circle')
          .attr('cx', x + w - 16)
          .attr('cy', y + h - 14)
          .attr('r', 2)
          .attr('fill', '#34d399');
      }
    });

  }, [visibleCells, selectedCell, hoveredCell, showDriverPointers, showDensityGlow]);

  const handleBroadcastDispatch = (cell: CaptainGridCell) => {
    sounds.playAlert();
    setBroadcastNotice(`📢 Fleet Rebalance Dispatched: Notified 8 nearby Captains to converge on ${cell.districtName}!`);
    onDispatchToZone?.(cell.districtName);
    setTimeout(() => setBroadcastNotice(null), 4500);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-slate-100">
      
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Navigation className="w-4 h-4 fill-blue-500/30" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
              D3 Spatial Fleet Intelligence
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold">Active City Grid Dispatches</span>
          </div>
          <h3 className="text-2xl font-black text-white mt-1">Captain Fleet Density Grid</h3>
          <p className="text-xs text-slate-400 font-medium">
            Hexagonal and cell-level online driver concentration across Hyderabad, NH 163 Corridor, and Warangal
          </p>
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {(['ALL', 'Hyderabad', 'Warangal'] as const).map(zone => (
              <button
                key={zone}
                onClick={() => {
                  sounds.playPop();
                  setSelectedZone(zone);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] transition ${
                  selectedZone === zone
                    ? 'bg-brand-blue text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {zone === 'ALL' ? 'All Metros' : zone}
              </button>
            ))}
          </div>

          {/* Toggle Driver Icons */}
          <button
            onClick={() => setShowDriverPointers(!showDriverPointers)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              showDriverPointers
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span>Vehicle Mix {showDriverPointers ? '✓' : '✕'}</span>
          </button>

          {/* Toggle Density Glow */}
          <button
            onClick={() => setShowDensityGlow(!showDensityGlow)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              showDensityGlow
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <span>Neon Glow {showDensityGlow ? '✓' : '✕'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Density KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Fleet Density</span>
          <div className="text-2xl font-black text-white mt-0.5">{totalFleetCaptains} <span className="text-xs font-semibold text-emerald-400">Captains Online</span></div>
          <span className="text-[10px] text-emerald-400 font-semibold">{totalIdleCaptains} Available • {totalBusyCaptains} In-Trip</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Dense Cluster Anchor</span>
          <div className="text-base font-black text-blue-400 mt-0.5 truncate">{peakDensityCell.districtName}</div>
          <span className="text-[10px] text-slate-400 font-semibold">{peakDensityCell.captainCount} Captains in cell {peakDensityCell.label}</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fleet Vehicle Distribution</span>
          <div className="flex items-center gap-2 mt-1 text-xs font-black text-white">
            <span className="text-sky-400">🏍️ 48%</span>
            <span className="text-amber-400">🛺 28%</span>
            <span className="text-emerald-400">🚕 20%</span>
            <span className="text-rose-400">🚚 4%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Tri-modal multimodal fleet</span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Median Dispatch Speed</span>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">2.4 <span className="text-xs font-bold text-slate-400">min</span></div>
          <span className="text-[10px] text-emerald-300 font-semibold">Sub-3 minute arrival SLA</span>
        </div>
      </div>

      {/* Broadcast Alert Banner */}
      {broadcastNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400 animate-bounce" />
            <span>{broadcastNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500 text-slate-950">Active Broadcast</span>
        </div>
      )}

      {/* Map Layout: D3 Canvas (3 cols) + Inspection Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* D3 Canvas Container */}
        <div className="lg:col-span-3 space-y-3">
          
          <div 
            ref={containerRef}
            className="relative w-full h-[480px] bg-[#050811] border border-slate-800 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center"
          >
            <svg 
              ref={svgRef}
              viewBox="0 0 840 480"
              className="w-full h-full select-none"
            />

            {/* Viridis Density Scale Legend */}
            <div className="absolute bottom-3 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-[10px] space-y-1 shadow-lg">
              <div className="font-extrabold text-slate-300 flex items-center justify-between gap-4">
                <span>Captain Density Index</span>
                <span className="text-emerald-400 font-mono">D3 Viridis</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-gradient-to-r from-[#440154] via-[#21918c] to-[#fde725]"></div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>Low (1-2)</span>
                <span>Medium (4-6)</span>
                <span>Peak (8-14)</span>
              </div>
            </div>

            {/* Vehicle legend */}
            <div className="absolute top-3 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Bike</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Auto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Cab</span>
            </div>

            {/* Instruction tooltip */}
            <div className="absolute top-3 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400">
              Click any grid block to inspect available Captains & dispatch
            </div>
          </div>

          {/* Quick Zone Jump Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-bold">Hot Corridor Sectors:</span>
            <div className="flex flex-wrap gap-2">
              {visibleCells
                .filter(c => c.captainCount >= 7)
                .slice(0, 5)
                .map(cell => (
                  <button
                    key={cell.label}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedCell(cell);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      selectedCell?.label === cell.label
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {cell.districtName.split(' ')[0]} ({cell.captainCount} cap)
                  </button>
                ))}
            </div>
          </div>

        </div>

        {/* Selected Sector Inspector Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Sector Fleet Telemetry
                </span>
                {selectedCell && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold">
                    Sector {selectedCell.label}
                  </span>
                )}
              </div>

              {selectedCell ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="text-lg font-black text-white">{selectedCell.districtName}</h4>
                    <p className="text-xs text-slate-400 font-semibold">{selectedCell.zone} Zone</p>
                  </div>

                  {/* Grid telemetry metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Captains in Block</span>
                      <div className="text-xl font-black text-emerald-400">{selectedCell.captainCount}</div>
                      <span className="text-[9px] text-emerald-300 font-semibold">Online & ready</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Density Index</span>
                      <div className="text-xl font-black text-blue-400">{Math.round(selectedCell.densityScore * 100)}%</div>
                      <span className="text-[9px] text-slate-400 font-semibold">Grid saturation</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Idle / Free</span>
                      <div className="text-xl font-black text-white">{selectedCell.idleCaptains}</div>
                      <span className="text-[9px] text-slate-400 font-semibold">Zero pickup wait</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Currently On-Trip</span>
                      <div className="text-xl font-black text-amber-400">{selectedCell.busyCaptains}</div>
                      <span className="text-[9px] text-amber-500 font-semibold">Active delivery</span>
                    </div>
                  </div>

                  {/* Vehicle mix breakdown in sector */}
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle Fleet Breakdown</span>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div className="p-1.5 bg-slate-950 rounded-xl">
                        <span className="text-xs">🏍️</span>
                        <div className="text-xs font-black text-white">{selectedCell.vehicleMix.bike}</div>
                        <span className="text-[8px] text-slate-400">Bikes</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded-xl">
                        <span className="text-xs">🛺</span>
                        <div className="text-xs font-black text-white">{selectedCell.vehicleMix.auto}</div>
                        <span className="text-[8px] text-slate-400">Autos</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded-xl">
                        <span className="text-xs">🚕</span>
                        <div className="text-xs font-black text-white">{selectedCell.vehicleMix.cab}</div>
                        <span className="text-[8px] text-slate-400">Cabs</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded-xl">
                        <span className="text-xs">🚚</span>
                        <div className="text-xs font-black text-white">{selectedCell.vehicleMix.truck}</div>
                        <span className="text-[8px] text-slate-400">Trucks</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleBroadcastDispatch(selectedCell)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition active:scale-98"
                    >
                      <Navigation className="w-4 h-4 fill-white" />
                      <span>DISPATCH FLEET REBALANCE TO SECTOR</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playPop();
                        alert(`📡 Geo-fenced perimeter alert enabled for Sector ${selectedCell.label} (${selectedCell.districtName})!`);
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Set Sector Auto-Alert Threshold
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Compass className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold px-4">
                    Click any sector on the spatial grid map to view active captain telemetry, vehicle breakdown, and dispatch fleet rebalances.
                  </p>
                </div>
              )}
            </div>

            {/* Quick sector shortcuts */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">High Demand Hubs:</span>
              <div className="flex flex-wrap gap-1.5">
                {visibleCells.slice(0, 4).map(c => (
                  <button
                    key={c.label}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedCell(c);
                    }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                      selectedCell?.label === c.label
                        ? 'bg-brand-blue text-white border-blue-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {c.districtName.split(' ')[0]}
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
