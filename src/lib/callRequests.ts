// src/lib/callRequests.ts

export interface CallRequest {
  id: string;
  requesterName: string;     // ← matches your UI
  criteria: string;
  timestamp: number;
}

const REQUESTS_KEY = 'healing_shoulder_call_requests';
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Broadcast channel to sync across tabs
const broadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('call_requests') : null;

// Notify other tabs when a request is added/removed
function notifyChange() {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'REFRESH' });
  }
}

// Add a new request
export function createCallRequest(request: Omit<CallRequest, 'id' | 'timestamp'>): CallRequest {
  const newRequest: CallRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    ...request,
    timestamp: Date.now(),
  };

  const all = getActiveCallRequests();
  localStorage.setItem(REQUESTS_KEY, JSON.stringify([...all, newRequest]));
  notifyChange(); // trigger other tabs to reload
  return newRequest;
}

// Get active (non-expired) requests
export function getActiveCallRequests(): CallRequest[] {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(REQUESTS_KEY);
  if (!raw) return [];

  const all = JSON.parse(raw) as CallRequest[];
  const now = Date.now();
  const active = all.filter(req => now - req.timestamp < EXPIRY_MS);

  if (active.length !== all.length) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(active));
  }

  return active;
}

// Remove a request (when accepted)
export function removeCallRequest(id: string): void {
  const all = getActiveCallRequests().filter(req => req.id !== id);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  notifyChange();
}

// Simulate a request from another user (for demo)
export function simulateIncomingRequest(): CallRequest {
  const testUsers = [
    { name: 'Alex', criteria: 'Lost a sibling to an accident in the last year' },
    { name: 'Taylor', criteria: 'Grieving a partner during the holidays' },
    { name: 'Jordan', criteria: 'First holiday season without my mom' },
  ];
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  return createCallRequest({
    requesterName: user.name,
    criteria: user.criteria,
  });
}