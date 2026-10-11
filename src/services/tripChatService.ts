import { TripMessage } from '../types';
import { sounds } from './audio';

export const PASSENGER_QUICK_REPLIES = [
  "I'm at the pickup point",
  "Waiting near the main entrance",
  "Please call when you reach",
  "Wearing a blue jacket",
  "Please turn on the AC",
  "Take your time, no rush"
];

export const DRIVER_QUICK_REPLIES = [
  "On my way! ETA 2-3 mins",
  "I have arrived at your pickup spot",
  "Hazard lights are ON, please look for vehicle",
  "Stuck in a small signal, moving now",
  "Waiting right in front of the gate",
  "Please share OTP upon boarding"
];

type MessageListener = (message: TripMessage) => void;

class TripChatBroadcaster {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MessageListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('zaldi_trip_realtime_chat');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_MESSAGE' && event.data.message) {
            this.notifyListeners(event.data.message);
          }
        };
      } catch {
        // Fallback gracefully
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'zaldi_latest_trip_message' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed);
          } catch {
            // Ignore malformed
          }
        }
      });
    }
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(message: TripMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('Chat listener error', err);
      }
    });
  }

  public broadcast(message: TripMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'NEW_MESSAGE', message });
      } catch (err) {
        console.warn('BroadcastChannel error', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('zaldi_latest_trip_message', JSON.stringify(message));
      } catch {
        // storage quota fallback
      }
    }
  }

  public createMessage(params: {
    orderId: string;
    sender: 'PASSENGER' | 'DRIVER';
    senderName: string;
    text: string;
  }): TripMessage {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: TripMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId: params.orderId,
      sender: params.sender,
      senderName: params.senderName,
      text: params.text.trim(),
      timestamp: timeStr,
      createdAtMs: Date.now(),
      readByPassenger: params.sender === 'PASSENGER',
      readByDriver: params.sender === 'DRIVER'
    };
    return msg;
  }
}

export const tripChatBroadcaster = new TripChatBroadcaster();
