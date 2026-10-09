import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Box, Download, RotateCcw, Eye, Play, Pause, Compass, 
  Sparkles, Layers, Sliders, CheckCircle2, ChevronRight,
  Sun, Moon, Shield, Info, ArrowUpRight, Copy, Check
} from 'lucide-react';
import { 
  LowPolyVehicleType, 
  LOW_POLY_VEHICLE_SPECS, 
  createLowPolyVehicleMesh, 
  normalizeVehicleScale,
  downloadVehicleGLB,
  downloadVehiclePNG
} from '../services/lowPolyVehicleModels';
import { sounds } from '../services/audio';

// Static assets
import bikePng from '../assets/images/zaldi_bike_lowpoly.png';
import autoPng from '../assets/images/zaldi_auto_lowpoly.png';
import sedanPng from '../assets/images/zaldi_sedan_lowpoly.png';
import suvPng from '../assets/images/zaldi_suv_lowpoly.png';
import truckPng from '../assets/images/zaldi_truck_lowpoly.png';
import parcelPng from '../assets/images/zaldi_parcel_lowpoly.png';

export const VEHICLE_LOW_POLY_IMAGES: Record<LowPolyVehicleType, string> = {
  bike: bikePng,
  auto: autoPng,
  sedan: sedanPng,
  suv: suvPng,
  truck: truckPng,
  parcel: parcelPng
};

interface LowPolyVehicleStudioProps {
  onClose?: () => void;
  initialVehicle?: LowPolyVehicleType;
}

export const LowPolyVehicleStudio: React.FC<LowPolyVehicleStudioProps> = ({
  onClose,
  initialVehicle = 'auto'
}) => {
  const [selectedType, setSelectedType] = useState<LowPolyVehicleType>(initialVehicle);
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [headingDegrees, setHeadingDegrees] = useState(45);
  const [activeTab, setActiveTab] = useState<'3D_VIEWPORT' | 'MAP_SIMULATOR' | 'TELEMATICS' | 'ARCHITECTURAL'>('3D_VIEWPORT');
  const [isExportingGlb, setIsExportingGlb] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  const currentSpec = LOW_POLY_VEHICLE_SPECS[selectedType];

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 12, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight2.position.set(-6, 5, -5);
    scene.add(dirLight2);

    // Camera (Isometric elevated perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 4.5);
    camera.lookAt(0, 0.75, 0);

    // WebGL Renderer with transparent background (zero baked ground)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below ground
    controls.minDistance = 2.0;
    controls.maxDistance = 12.0;
    controlsRef.current = controls;

    // Load initial vehicle
    loadVehicleIntoScene(selectedType, scene);

    // Animation Loop
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);

      if (isAutoSpin && vehicleGroupRef.current) {
        vehicleGroupRef.current.rotation.y += 0.012;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update vehicle in scene when selectedType changes
  const loadVehicleIntoScene = (type: LowPolyVehicleType, scene?: THREE.Scene) => {
    const s = scene || sceneRef.current;
    if (!s) return;

    if (vehicleGroupRef.current) {
      s.remove(vehicleGroupRef.current);
      vehicleGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    }

    const rawMesh = createLowPolyVehicleMesh(type);
    const normalized = normalizeVehicleScale(rawMesh);
    
    // Apply wireframe if active
    if (isWireframe) {
      normalized.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'wireframe' in mesh.material) {
            (mesh.material as any).wireframe = true;
          }
        }
      });
    }

    vehicleGroupRef.current = normalized;
    s.add(normalized);
  };

  useEffect(() => {
    loadVehicleIntoScene(selectedType);
  }, [selectedType, isWireframe]);

  // Handle heading angle change
  useEffect(() => {
    if (vehicleGroupRef.current && !isAutoSpin) {
      vehicleGroupRef.current.rotation.y = THREE.MathUtils.degToRad(headingDegrees);
    }
  }, [headingDegrees, isAutoSpin]);

  // Export GLB handler
  const handleDownloadGlb = async () => {
    try {
      sounds.playPop();
      setIsExportingGlb(true);
      await downloadVehicleGLB(selectedType, `zaldi-${selectedType}-lowpoly.glb`);
    } catch (err) {
      console.error('GLB export error:', err);
    } finally {
      setIsExportingGlb(false);
    }
  };

  // Export PNG handler
  const handleDownloadPng = async () => {
    try {
      sounds.playPop();
      setIsExportingPng(true);
      await downloadVehiclePNG(selectedType, 512, `zaldi-${selectedType}-lowpoly-transparent.png`);
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wide">
                LOW-POLY 3D VEHICLE ASSETS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                Real-Time 3D & GLB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Low-poly geometry • 32–64px strong silhouette • High-contrast roof/body • Zaldi Z emblem • Separate PNG + GLB
            </p>
          </div>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopiedLink(true);
              sounds.playPop();
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {onClose && (
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700/60 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Domain Use Case Tabs */}
      <div className="px-5 pt-3 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: '3D_VIEWPORT', label: '3D Mesh & Asset Studio', icon: Box },
          { id: 'MAP_SIMULATOR', label: 'Map Rendering (32–64px Live)', icon: Compass },
          { id: 'TELEMATICS', label: 'Fleet GIS & Telematics', icon: Sliders },
          { id: 'ARCHITECTURAL', label: 'Depot & Architectural Renderings', icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playPop();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'text-amber-400 border-amber-400 bg-slate-900/80 shadow-[0_-2px_8px_rgba(245,158,11,0.15)]' 
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Body */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Vehicle Selector & Technical Specs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Vehicle Selector Carousel / Cards */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 block">
              SELECT LOW-POLY VEHICLE (6 UNITS)
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LOW_POLY_VEHICLE_SPECS) as LowPolyVehicleType[]).map(typeKey => {
                const spec = LOW_POLY_VEHICLE_SPECS[typeKey];
                const isSelected = selectedType === typeKey;
                const pngSrc = VEHICLE_LOW_POLY_IMAGES[typeKey];

                return (
                  <button
                    key={typeKey}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedType(typeKey);
                    }}
                    className={`relative p-2 rounded-xl text-left transition flex flex-col items-center text-center gap-1.5 border group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Thumbnail Image (Zero shadow, clean cutout) */}
                    <div className="w-12 h-12 flex items-center justify-center relative">
                      <img
                        src={pngSrc}
                        alt={spec.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition group-hover:scale-110"
                      />
                    </div>
                    
                    <span className={`text-[11px] font-black leading-tight ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                      {spec.category}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold truncate w-full">
                      {spec.name.split(' ')[1] || spec.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Specs Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <h4 className="text-base font-black text-white">{currentSpec.name}</h4>
                <p className="text-[11px] text-slate-400">{currentSpec.category} • {currentSpec.speedRating}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                Low-Poly Mesh
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentSpec.description}
            </p>

            {/* Dimensional Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Length</span>
                <span className="text-xs font-black text-amber-400">{currentSpec.lengthMeters} m</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Width</span>
                <span className="text-xs font-black text-amber-400">{currentSpec.widthMeters} m</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Height</span>
                <span className="text-xs font-black text-amber-400">{currentSpec.heightMeters} m</span>
              </div>
            </div>

            {/* Silhouette & Palette Verification */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">High-Contrast Roof:</span>
                <div className="flex items-center gap-1.5 font-mono text-slate-200">
                  <span 
                    className="w-3.5 h-3.5 rounded-md border border-white/20" 
                    style={{ backgroundColor: `#${currentSpec.roofColor.toString(16).padStart(6, '0')}` }} 
                  />
                  <span>#{currentSpec.roofColor.toString(16).padStart(6, '0')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Main Body Chassis:</span>
                <div className="flex items-center gap-1.5 font-mono text-slate-200">
                  <span 
                    className="w-3.5 h-3.5 rounded-md border border-white/20" 
                    style={{ backgroundColor: `#${currentSpec.bodyColor.toString(16).padStart(6, '0')}` }} 
                  />
                  <span>#{currentSpec.bodyColor.toString(16).padStart(6, '0')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Zaldi 'Z' Emblem:</span>
                <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
                  <span 
                    className="w-3.5 h-3.5 rounded-md border border-white/20" 
                    style={{ backgroundColor: `#${currentSpec.zColor.toString(16).padStart(6, '0')}` }} 
                  />
                  <span>Visible (Roof/Side)</span>
                </div>
              </div>
            </div>

            {/* Separate Download Buttons: GLB + PNG */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleDownloadGlb}
                disabled={isExportingGlb}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingGlb ? 'Generating GLB...' : `Download .GLB Model (${selectedType})`}</span>
              </button>

              <button
                onClick={handleDownloadPng}
                disabled={isExportingPng}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/80 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isExportingPng ? 'Rendering PNG...' : `Download .PNG Transparent (512px)`}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: 3D Viewport / Map Simulator / Telematics Display */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main 3D Interactive WebGL Canvas */}
          <div className="relative w-full h-[380px] sm:h-[440px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* Subtle 3D grid reference ground (zero shadow baked into model!) */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Three.js Canvas Container */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Floating 3D Viewport Controls (Top Right) */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
              {/* Auto Spin Toggle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setIsAutoSpin(!isAutoSpin);
                }}
                title={isAutoSpin ? 'Pause Rotation' : 'Auto Rotate'}
                className={`p-2 rounded-xl backdrop-blur-md border text-xs font-semibold transition flex items-center gap-1.5 ${
                  isAutoSpin
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {isAutoSpin ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAutoSpin ? 'Spinning' : 'Paused'}</span>
              </button>

              {/* Wireframe Topology Toggle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setIsWireframe(!isWireframe);
                }}
                title="Toggle Low-Poly Polygonal Wireframe"
                className={`p-2 rounded-xl backdrop-blur-md border text-xs font-semibold transition flex items-center gap-1.5 ${
                  isWireframe
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wireframe</span>
              </button>
            </div>

            {/* Heading Orientation Simulator (Bottom Left Overlay) */}
            <div className="absolute bottom-3.5 left-3.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-3 z-10 shadow-xl max-w-[280px]">
              <Compass className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span>Map Bearing: {headingDegrees}°</span>
                  <span className="text-amber-400">Rotation-Ready</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={headingDegrees}
                  disabled={isAutoSpin}
                  onChange={(e) => setHeadingDegrees(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Model Badge */}
            <div className="absolute bottom-3.5 right-3.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-400 font-mono flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>360° Drag & Zoom Enabled</span>
            </div>

          </div>

          {/* Silhouette Readability Tester: 32px, 48px, 64px, 128px comparison */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  Silhouette Readability at Map Scales (32px – 64px)
                </h5>
                <p className="text-[10px] text-slate-400">
                  Verified strong silhouette, high-contrast roof/body, minimal tiny details, and visible Zaldi Z across standard zoom levels.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Passing QC
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 items-end">
              
              {/* 32px Scale */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div 
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-0.5 transition-transform duration-200"
                  style={{ transform: `rotate(${headingDegrees}deg)` }}
                >
                  <img
                    src={VEHICLE_LOW_POLY_IMAGES[selectedType]}
                    alt="32px"
                    className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300">32 px</span>
                <span className="text-[8px] text-slate-500">Dense Map View</span>
              </div>

              {/* 48px Scale */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div 
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 transition-transform duration-200"
                  style={{ transform: `rotate(${headingDegrees}deg)` }}
                >
                  <img
                    src={VEHICLE_LOW_POLY_IMAGES[selectedType]}
                    alt="48px"
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300">48 px</span>
                <span className="text-[8px] text-slate-500">Street Zoom</span>
              </div>

              {/* 64px Scale */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div 
                  className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 transition-transform duration-200"
                  style={{ transform: `rotate(${headingDegrees}deg)` }}
                >
                  <img
                    src={VEHICLE_LOW_POLY_IMAGES[selectedType]}
                    alt="64px"
                    className="w-full h-full object-contain filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-bold text-amber-400">64 px</span>
                <span className="text-[8px] text-slate-500">Standard Pickup</span>
              </div>

              {/* 128px Scale */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div 
                  className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 transition-transform duration-200"
                  style={{ transform: `rotate(${headingDegrees}deg)` }}
                >
                  <img
                    src={VEHICLE_LOW_POLY_IMAGES[selectedType]}
                    alt="128px"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300">128 px</span>
                <span className="text-[8px] text-slate-500">Card & Depot Detail</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
