/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AppRole, Driver, RideOrder 
} from './types';
import { INITIAL_DRIVERS } from './services/mockData';
import { CustomerApp } from './components/CustomerApp';
import { CaptainApp } from './components/CaptainApp';
import { AdminApp } from './components/AdminApp';
import { sounds } from './services/audio';
import { 
  Smartphone, UserCheck, Shield, Sparkles, 
  Volume2, Car, Bell, ExternalLink, KeyRound, LogOut, ArrowLeft
} from 'lucide-react';
import { PartnerAuthModal } from './components/PartnerAuthModal';

export default function App() {
  const [activeApp, setActiveApp] = useState<AppRole>('CUSTOMER_APP');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authenticatedRole, setAuthenticatedRole] = useState<AppRole | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('cap-ravi-001');

  // Initial order for demonstration
  const [orders, setOrders] = useState<RideOrder[]>([
    {
      id: "TRP-8F29A1",
      customerName: "Akhil Nalla",
      customerPhone: "+91 98480-12345",
      pickup: "Warangal Railway Station",
      drop: "Clock Tower Center, Hanamkonda",
      distanceKm: 6.2,
      fare: 120,
      discount: 0,
      finalFare: 120,
      vehicleTier: "Auto 3W",
      vehicleIcon: "🛺",
      driverId: "cap-vikram-002",
      riderPin: "4921",
      status: "COMPLETED",
      paymentMethod: "UPI",
      createdAt: "09:12 AM",
      progressPercent: 100
    }
  ]);

  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  const handleNewOrder = (order: RideOrder) => {
    setOrders(prev => [order, ...prev]);
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<RideOrder>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  };

  const handleUpdateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updates } : d));
  };

  const handleSimulateIncomingRide = () => {
    sounds.playAlert();
    const mockOrder: RideOrder = {
      id: "TRP-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      customerName: "Kavya Patel",
      customerPhone: "+91 98112-99882",
      pickup: "Cyber Towers, Hitec City",
      drop: "Inorbit Mall, Durgam Cheruvu",
      distanceKm: 4.8,
      fare: 75,
      discount: 0,
      finalFare: 75,
      vehicleTier: activeDriver.vehicle,
      vehicleIcon: "🏍️",
      driverId: activeDriver.id,
      riderPin: String(Math.floor(1000 + Math.random() * 9000)),
      status: "SEARCHING",
      paymentMethod: "WALLET",
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progressPercent: 0
    };
    setOrders(prev => [mockOrder, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-blue selection:text-white">
      
      {/* Top Universal App Navigation Header */}
      <header className="sticky top-0 z-[120] bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Branding - Direct Zaldi Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveApp('CUSTOMER_APP')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-blue to-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/30 font-black text-white text-base">
              Z
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white">Zaldi</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                  MOBILITY
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 -mt-0.5">Hyderabad & Warangal City Network</p>
            </div>
          </div>

          {/* Header Actions: Live Status, Audio Mute, and Discreet Partner Portal */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">Live Fleet Active</span>
            </div>

            <button
              onClick={() => {
                const muted = sounds.toggleMute();
                if (!muted) sounds.playPing();
              }}
              title="Toggle Audio Feedback"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Discreet Captain & Ops Access (Protected behind Authentication) */}
            <button
              onClick={() => {
                sounds.playPop();
                setShowAuthModal(true);
              }}
              title="Partner Portal (Captain & Operations Access)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 text-xs font-bold transition hover:text-white"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Partner Portal</span>
            </button>
          </div>

        </div>
      </header>

      {/* Authenticated Mode Banner (Only shown when captain/admin is logged in) */}
      {activeApp !== 'CUSTOMER_APP' && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-800/50 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>
              {activeApp === 'DRIVER_APP' 
                ? `Captain Portal Active • ${activeDriver.name} (${activeDriver.vehicle})`
                : 'Ops Command Center Active • Dispatch & Heatmaps'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveApp('CUSTOMER_APP');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Customer Booking</span>
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setAuthenticatedRole(null);
                setActiveApp('CUSTOMER_APP');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center">
        {activeApp === 'CUSTOMER_APP' && (
          <CustomerApp
            activeDriver={activeDriver}
            orders={orders}
            onNewOrder={handleNewOrder}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {activeApp === 'DRIVER_APP' && (
          <CaptainApp
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            onSelectDriver={setSelectedDriverId}
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            onSimulateIncomingRide={handleSimulateIncomingRide}
          />
        )}

        {activeApp === 'ADMIN_APP' && (
          <AdminApp
            drivers={drivers}
            orders={orders}
            onUpdateDriver={handleUpdateDriver}
            onUpdateOrder={handleUpdateOrder}
          />
        )}
      </main>

      {/* Partner Authentication Modal */}
      <PartnerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticate={(role) => {
          setAuthenticatedRole(role);
          setActiveApp(role);
        }}
      />

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">Zaldi Logistics & Mobility Platform</span>
          <span>•</span>
          <span>Hyderabad & Warangal City Network</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Fast Pickup</span>
          <span>•</span>
          <span>Verified Captains</span>
          <span>•</span>
          <span>24x7 Safety Shield</span>
        </div>
      </footer>

    </div>
  );
}
