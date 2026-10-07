import React, { useState } from 'react';
import { 
  X, Send, Phone, PhoneOff, Mic, MicOff, Volume2, 
  ShieldCheck, Share2, AlertTriangle, CheckCircle2,
  Wallet, CreditCard, ArrowRight, Download
} from 'lucide-react';
import { Driver, RideOrder } from '../types';
import { sounds } from '../services/audio';

interface ChatModalProps {
  driver: Driver;
  order: RideOrder | null;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ driver, order, onClose }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'driver'; text: string; time: string }>>([
    { sender: 'driver', text: `Hi! I am on my way to ${order?.pickup || 'your pickup'}. ETA 3 mins.`, time: 'Just now' }
  ]);
  const [inputText, setInputText] = useState('');

  const quickReplies = [
    "I am near the main gate",
    "Please wait 2 minutes",
    "Reached pickup location",
    "Which vehicle color?"
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;
    sounds.playPop();
    const newMsg = { sender: 'user' as const, text, time: 'Just now' };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulated driver response after 1.2s
    setTimeout(() => {
      sounds.playPing();
      const driverReplies = [
        "Sure, turning into the lane now!",
        "Understood, waiting right there.",
        "Got it! White helmet and hazard lights on.",
        "Okay, almost there in 60 seconds."
      ];
      const randomReply = driverReplies[Math.floor(Math.random() * driverReplies.length)];
      setMessages(prev => [...prev, { sender: 'driver', text: randomReply, time: 'Just now' }]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-sm font-black text-blue-300">
              {driver.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{driver.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-xs text-slate-400">{driver.vehicle} • {driver.plate}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium ${
                m.sender === 'user'
                  ? 'bg-brand-blue text-white rounded-br-none shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
              }`}>
                {m.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick chip responses */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 bg-slate-900/60">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              onClick={() => handleSend(qr)}
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-slate-800/60 border-t border-slate-700/60 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message to Captain..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 bg-brand-blue text-white rounded-xl shadow-lg hover:bg-blue-600 transition disabled:opacity-50"
            disabled={!inputText.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

interface CallModalProps {
  driver: Driver;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ driver, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(12);

  React.useEffect(() => {
    sounds.playPing();
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSec = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100">
        
        <div className="relative mt-4 mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-brand-blue/50 flex items-center justify-center animate-pulse">
            <div className="w-18 h-18 rounded-full bg-brand-blue text-white font-black text-2xl flex items-center justify-center shadow-lg">
              {driver.name.charAt(0)}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900">
            <Phone className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg font-black text-white">{driver.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{driver.vehicle} • {driver.plate}</p>
        
        <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
          Encrypted VoIP Call • {formatSec(callDuration)}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 w-full mt-8 mb-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1 transition ${
              isMuted ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-bold">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1 transition ${
              isSpeaker ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">{isSpeaker ? 'Speaker On' : 'Speaker'}</span>
          </button>
        </div>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};

interface WalletModalProps {
  currentBalance: number;
  onAddFunds: (amount: number) => void;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ currentBalance, onAddFunds, onClose }) => {
  const [selectedAmt, setSelectedAmt] = useState<number>(200);

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-brand-blue border border-blue-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Zaldi Cash Wallet</h3>
              <p className="text-xs text-slate-400">One-tap instant checkout</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Current Balance</span>
            <div className="text-2xl font-black text-white mt-0.5">₹{currentBalance.toFixed(2)}</div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 mb-2 block">Choose Top-up Amount</label>
          <div className="grid grid-cols-3 gap-2.5">
            {[100, 200, 500].map(amt => (
              <button
                key={amt}
                onClick={() => setSelectedAmt(amt)}
                className={`py-3 rounded-xl border text-sm font-black transition ${
                  selectedAmt === amt
                    ? 'border-brand-blue bg-blue-600/20 text-blue-400'
                    : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero payment gateway transaction fee</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant refunds on trip cancellations</span>
          </div>
        </div>

        <button
          onClick={() => {
            onAddFunds(selectedAmt);
            sounds.playSuccess();
            onClose();
          }}
          className="w-full py-3.5 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
        >
          <span>Pay & Add ₹{selectedAmt}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface SafetyModalProps {
  order: RideOrder | null;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ order, onClose }) => {
  const [shared, setShared] = useState(false);

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-blue" />
            <h3 className="font-black text-lg text-white">Zaldi Safety Shield</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Your safety is our utmost priority. Every trip is live GPS tracked by our 24x7 Safety Response Center.
        </p>

        <div className="space-y-3 pt-1">
          <button 
            onClick={() => {
              setShared(true);
              sounds.playPop();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 flex items-center justify-between transition text-left"
          >
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold text-xs text-white">Share Live Trip Status</div>
                <div className="text-[11px] text-slate-400">Send WhatsApp tracking link to family</div>
              </div>
            </div>
            {shared && <span className="text-[10px] font-black text-emerald-400">Shared ✓</span>}
          </button>

          <button 
            onClick={() => {
              sounds.playAlert();
              alert("🚨 Emergency SOS Triggered: Police Control (112) and Zaldi Incident Response dispatched with your real-time GPS location.");
            }}
            className="w-full p-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 flex items-center justify-between transition text-left"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <div className="font-bold text-xs text-rose-300">Emergency SOS Alert</div>
                <div className="text-[11px] text-rose-400/80">Connect immediately to 112 Emergency</div>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded bg-rose-500 text-white">SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
