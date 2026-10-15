import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, Shield, KeyRound, Sparkles, Check, 
  CheckCircle2, AlertCircle, Fingerprint, Lock, ArrowRight,
  RefreshCw, Building2, Smartphone, ShieldCheck, HeartHandshake,
  LogOut, Car
} from 'lucide-react';
import { sounds } from '../services/audio';
import { AppRole } from '../types';

export interface UserAuthData {
  name: string;
  phone: string;
  email: string;
  emergencyContact: string;
  avatarSeed: string;
  tier: 'Gold' | 'Platinum' | 'Silver';
  securityPin: string;
  biometricsEnabled: boolean;
  accountType: 'PERSONAL' | 'BUSINESS' | 'STUDENT';
  isPhoneVerified: boolean;
}

interface ModifyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAuthData;
  onUpdateUser: (updates: Partial<UserAuthData>) => void;
  onSwitchAppRole?: (role: AppRole) => void;
}

const AVATAR_OPTIONS = [
  { seed: 'AN', bg: 'from-blue-600 to-indigo-600', label: 'Akhil Nalla' },
  { seed: '⚡', bg: 'from-amber-500 to-orange-600', label: 'Speed Commuter' },
  { seed: '🚀', bg: 'from-cyan-500 to-blue-600', label: 'Tech Pro' },
  { seed: '💼', bg: 'from-emerald-600 to-teal-600', label: 'Corporate Pass' },
  { seed: '🌟', bg: 'from-purple-600 to-pink-600', label: 'VIP Rider' },
  { seed: '🛡️', bg: 'from-slate-700 to-slate-900', label: 'Safety First' }
];

export const ModifyAuthModal: React.FC<ModifyAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSwitchAppRole
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'OTP' | 'SECURITY' | 'ACCOUNT'>('PROFILE');
  
  // Profile form state
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact);
  const [avatarSeed, setAvatarSeed] = useState(currentUser.avatarSeed);
  const [accountType, setAccountType] = useState(currentUser.accountType);

  // OTP state
  const [otpPhoneInput, setOtpPhoneInput] = useState(currentUser.phone);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Security PIN state
  const [pin, setPin] = useState(currentUser.securityPin || '1234');
  const [biometrics, setBiometrics] = useState(currentUser.biometricsEnabled);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    onUpdateUser({
      name,
      phone,
      email,
      emergencyContact,
      avatarSeed,
      accountType
    });
    showToast('Profile & contact details updated!');
  };

  const handleSendOtp = () => {
    if (!otpPhoneInput || otpPhoneInput.length < 8) {
      sounds.playAlert();
      setOtpError('Please enter a valid mobile number');
      return;
    }
    sounds.playPing();
    setOtpSent(true);
    setOtpError(null);
    setOtpSuccess(false);
    setResendTimer(30);
  };

  const handleVerifyOtp = () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp === '482910' || fullOtp.length === 6) {
      sounds.playSuccess();
      setOtpSuccess(true);
      setOtpError(null);
      setPhone(otpPhoneInput);
      onUpdateUser({
        phone: otpPhoneInput,
        isPhoneVerified: true
      });
      showToast('Phone number successfully verified & linked!');
    } else {
      sounds.playAlert();
      setOtpError('Invalid OTP. Use Demo Code 482910.');
    }
  };

  const handleAutoFillDemoOtp = () => {
    sounds.playPop();
    setOtpDigits(['4', '8', '2', '9', '1', '0']);
    setOtpError(null);
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);

    // Auto advance
    if (char && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSaveSecurity = () => {
    sounds.playSuccess();
    onUpdateUser({
      securityPin: pin,
      biometricsEnabled: biometrics
    });
    showToast('Security PIN and passkey settings saved!');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[92dvh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-blue to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Modify Auth & Profile</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {currentUser.tier} Tier
                </span>
              </div>
              <p className="text-xs text-slate-400">Security credentials, OTP verification & preferences</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modern Tabs Bar */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold my-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => { sounds.playTap(); setActiveTab('PROFILE'); }}
            className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'PROFILE'
                ? 'bg-brand-blue text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playTap(); setActiveTab('OTP'); }}
            className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'OTP'
                ? 'bg-brand-blue text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">OTP Auth</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playTap(); setActiveTab('SECURITY'); }}
            className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'SECURITY'
                ? 'bg-brand-blue text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">Security</span>
          </button>

          <button
            type="button"
            onClick={() => { sounds.playTap(); setActiveTab('ACCOUNT'); }}
            className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'ACCOUNT'
                ? 'bg-brand-blue text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">Account</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Toast feedback pill */}
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* =========================================
              TAB 1: PROFILE & PERSONAL DETAILS
             ========================================= */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in">
              
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Choose Avatar / Icon</label>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.seed}
                      type="button"
                      onClick={() => { sounds.playTap(); setAvatarSeed(opt.seed); }}
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${opt.bg} flex items-center justify-center text-lg font-black text-white transition-all transform flex-shrink-0 ${
                        avatarSeed === opt.seed
                          ? 'ring-4 ring-blue-500 scale-105 shadow-lg shadow-blue-500/40'
                          : 'opacity-70 hover:opacity-100 hover:scale-100'
                      }`}
                    >
                      {opt.seed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency SOS Contact</span>
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="+91 98480-99999"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Account Profile Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PERSONAL', 'BUSINESS', 'STUDENT'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { sounds.playTap(); setAccountType(type); }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                        accountType === type
                          ? 'border-brand-blue bg-blue-600/20 text-white shadow-xs'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type === 'PERSONAL' && '👤 Personal'}
                      {type === 'BUSINESS' && '🏢 Corporate'}
                      {type === 'STUDENT' && '🎓 Student'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-brand-blue hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Save Profile Changes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* =========================================
              TAB 2: PHONE OTP AUTHENTICATION
             ========================================= */}
          {activeTab === 'OTP' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-blue-300">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Phone Authentication & OTP Login</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Verify or update your phone number for secure authentication and real-time ride tracking SMS.
                </p>
              </div>

              {/* Step 1: Mobile Number Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Registered Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={otpPhoneInput}
                    onChange={(e) => setOtpPhoneInput(e.target.value)}
                    placeholder="+91 98480-12345"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: 6-Digit OTP Boxes (Visible after Send OTP) */}
              {otpSent && (
                <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Enter 6-Digit OTP</span>
                    <button
                      type="button"
                      onClick={handleAutoFillDemoOtp}
                      className="text-[11px] font-black text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Demo Auto-fill (482910)</span>
                    </button>
                  </div>

                  <div className="flex justify-between gap-1.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        className="w-11 h-12 rounded-xl bg-slate-950 border-2 border-slate-800 text-center font-mono text-lg font-black text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {otpSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Mobile authenticated & updated successfully!</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <span>Verify & Link Phone</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* Status info */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Authentication State:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  256-Bit Encrypted Mobile Link
                </span>
              </div>
            </div>
          )}

          {/* =========================================
              TAB 3: SECURITY PIN & PASSKEY
             ========================================= */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security PIN & Biometric Passkey</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fast 1-tap checkout and sensitive ride authorization protection.
                </p>
              </div>

              {/* 4-digit PIN setup */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xl tracking-[0.5em] text-white outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500">
                  Required when deducting more than ₹500 from Zaldi Cash Wallet.
                </p>
              </div>

              {/* Biometric Toggle */}
              <div 
                onClick={() => { sounds.playTap(); setBiometrics(!biometrics); }}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Biometric Face ID / Fingerprint</div>
                    <div className="text-[10px] text-slate-400">Instant unlock without entering PIN</div>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors p-0.5 ${biometrics ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${biometrics ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSecurity}
                className="w-full py-3 rounded-2xl bg-brand-blue hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Save Security Settings</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================
              TAB 4: SWITCH ACCOUNT & PORTAL ROLES
             ========================================= */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Switch Connected Profiles</label>
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-950 border-2 border-brand-blue flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-blue text-white font-black flex items-center justify-center text-xs">
                        AN
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{name} (Personal)</div>
                        <div className="text-[10px] text-slate-400">{phone} • Active</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-400">Current</span>
                  </div>

                  <div 
                    onClick={() => {
                      sounds.playPop();
                      setName('Zaldi Corporate Fleet');
                      setAccountType('BUSINESS');
                      showToast('Switched to Corporate Profile!');
                    }}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 font-black flex items-center justify-center text-xs">
                        💼
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-300">Zaldi Enterprise Account</div>
                        <div className="text-[10px] text-slate-500">Corporate Billing Enabled</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 hover:text-white">Switch →</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump to Partner Portals */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400">Switch to Partner Apps</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSuccess();
                      onSwitchAppRole?.('DRIVER_APP');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Car className="w-3.5 h-3.5 text-blue-400" />
                      <span>Captain Portal</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Driver cockpit & trip accept</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSuccess();
                      onSwitchAppRole?.('ADMIN_APP');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fleet Ops Admin</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Heatmaps & dispatch GIS</div>
                  </button>
                </div>
              </div>

              {/* Log out simulation */}
              <button
                type="button"
                onClick={() => {
                  sounds.playAlert();
                  showToast('Session refreshed. Re-authenticated as Akhil Nalla.');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Local Session & Re-authenticate</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
