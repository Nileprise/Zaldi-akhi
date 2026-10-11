import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, X, MessageSquare, Check, CheckCheck, 
  Sparkles, Phone, Shield, ArrowUpDown, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { Driver, RideOrder, TripMessage } from '../types';
import { sounds } from '../services/audio';
import { 
  PASSENGER_QUICK_REPLIES, 
  DRIVER_QUICK_REPLIES, 
  tripChatBroadcaster 
} from '../services/tripChatService';
import { Vehicle3dIcon } from './Vehicle3dIcon';

interface TripCockpitChatProps {
  order: RideOrder;
  driver: Driver;
  currentRole: 'PASSENGER' | 'DRIVER';
  onSendMessage: (orderId: string, sender: 'PASSENGER' | 'DRIVER', text: string) => void;
  onClose?: () => void;
  isModal?: boolean;
  onSwitchCockpitRole?: () => void;
}

export const TripCockpitChat: React.FC<TripCockpitChatProps> = ({
  order,
  driver,
  currentRole,
  onSendMessage,
  onClose,
  isModal = false,
  onSwitchCockpitRole
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isModal ? true : true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = order.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isExpanded]);

  const handleSend = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    sounds.playPop();
    onSendMessage(order.id, currentRole, content);
    setInputText('');

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const quickReplies = currentRole === 'PASSENGER' 
    ? PASSENGER_QUICK_REPLIES 
    : DRIVER_QUICK_REPLIES;

  const counterpartyName = currentRole === 'PASSENGER' ? driver.name : order.customerName;
  const counterpartyRole = currentRole === 'PASSENGER' ? 'Assigned Captain' : 'Passenger';
  const unreadCount = messages.filter(m => 
    currentRole === 'PASSENGER' ? (!m.readByPassenger && m.sender === 'DRIVER') : (!m.readByDriver && m.sender === 'PASSENGER')
  ).length;

  const content = (
    <div className={`flex flex-col h-full bg-slate-900 border border-slate-800 text-slate-100 ${
      isModal 
        ? 'w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden' 
        : 'w-full rounded-2xl overflow-hidden shadow-lg'
    }`}>
      {/* Header */}
      <div className="p-3.5 bg-slate-800/95 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-black text-white text-sm shadow-sm flex-shrink-0">
              {currentRole === 'PASSENGER' ? (
                <Vehicle3dIcon type={driver.vehicle} size={28} />
              ) : (
                <span className="text-blue-400">{counterpartyName.charAt(0)}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white truncate">{counterpartyName}</h4>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {currentRole === 'PASSENGER' 
                ? `${driver.vehicle} • ${driver.plate}` 
                : `Trip ${order.id} • ${order.pickup}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onSwitchCockpitRole && (
            <button
              onClick={onSwitchCockpitRole}
              title={`Switch view to ${currentRole === 'PASSENGER' ? 'Captain Cockpit' : 'Passenger Cockpit'}`}
              className="px-2 py-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition border border-slate-600/60"
            >
              <ArrowUpDown className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">
                {currentRole === 'PASSENGER' ? 'Captain View' : 'Passenger View'}
              </span>
            </button>
          )}

          {!isModal && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:bg-slate-700/60 text-slate-400 hover:text-white transition"
              title={isExpanded ? 'Collapse chat' : 'Expand chat'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-700/80 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Body */}
      {isExpanded && (
        <>
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[190px] max-h-[340px] bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Trip Cockpit Direct Messaging</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live connection open between {order.customerName} & Captain {driver.name}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = (currentRole === 'PASSENGER' && m.sender === 'PASSENGER') ||
                             (currentRole === 'DRIVER' && m.sender === 'DRIVER');

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isMe ? 'You' : m.senderName}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-[13px] leading-relaxed font-medium break-words shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none shadow-blue-600/20'
                          : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {m.text}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1">
                      <span>{m.timestamp}</span>
                      {isMe && (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chip Actions */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSend(reply)}
                className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition active:scale-95"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Interactive Input Bar */}
          <div className="p-3 bg-slate-850 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${counterpartyRole}...`}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-md transition flex items-center justify-center active:scale-95"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md h-[520px] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
