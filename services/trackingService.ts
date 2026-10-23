import { supabase } from '../lib/supabase';

// Types
export interface VehiclePosition {
  id: string;
  reservation_id: string;
  veiculo_id: string;
  motorista_nome: string | null;
  lat: number;
  lng: number;
  velocidade: number;
  precisao: number | null;
  heading: number | null;
  timestamp: string;
  parado: boolean;
  parado_desde: string | null;
}

export interface StopNotification {
  id: string;
  reservation_id: string;
  veiculo_id: string;
  motorista_nome: string | null;
  lat: number | null;
  lng: number | null;
  parado_em: string;
  visualizada: boolean;
  created_at: string;
}

interface LastSentData {
  lat: number;
  lng: number;
  heading: number | null;
  timestamp: number;
}

interface TrackingState {
  isTracking: boolean;
  watchId: number | null;
  reservationId: string | null;
  vehicleId: string | null;
  driverName: string | null;
  lastPosition: GeolocationPosition | null;
  lastSent: LastSentData | null;
  stoppedSince: string | null;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  wakeLock: any | null;
  isSending: boolean;
}

// Tracking state
const state: TrackingState = {
  isTracking: false,
  watchId: null,
  reservationId: null,
  vehicleId: null,
  driverName: null,
  lastPosition: null,
  lastSent: null,
  stoppedSince: null,
  heartbeatInterval: null,
  wakeLock: null,
  isSending: false
};

// Accuracy and Throttling Configuration
const MAX_ACCURACY_METERS = 50;        // Discard GPS noise with accuracy > 50m
const MIN_DISTANCE_METERS = 10;        // Trigger immediate send if moved >= 10m
const MIN_HEADING_CHANGE_DEG = 25;     // Trigger send on significant turns
const MIN_THROTTLE_MS = 3000;          // Don't send more frequently than once every 3s
const HEARTBEAT_INTERVAL_MS = 25000;   // Keep-alive heartbeat when stationary (25s)
const STOP_SPEED_THRESHOLD_KMH = 3.0;  // Below 3 km/h considered stationary
const STORAGE_KEY = 'fleet_active_tracking';

/**
 * Calculate distance in meters between two coordinates (Haversine formula)
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate difference in degrees between two headings
 */
function getHeadingDifference(h1: number | null, h2: number | null): number {
  if (h1 === null || h2 === null || isNaN(h1) || isNaN(h2)) return 0;
  let diff = Math.abs(h1 - h2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Keep mobile screen awake to prevent browser from throttling GPS in the vehicle
 */
async function acquireWakeLock(): Promise<void> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !state.wakeLock) {
    try {
      state.wakeLock = await (navigator as any).wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => {
        state.wakeLock = null;
      });
      console.log('Screen Wake Lock acquired for vehicle tracking');
    } catch (err) {
      console.debug('Wake Lock not granted/supported:', err);
    }
  }
}

/**
 * Release wake lock when tracking stops
 */
async function releaseWakeLock(): Promise<void> {
  if (state.wakeLock) {
    try {
      await state.wakeLock.release();
    } catch {
      // ignore
    }
    state.wakeLock = null;
  }
}

/**
 * Send position to database with stop detection and deduplication
 */
async function sendPositionToServer(position: GeolocationPosition, force = false): Promise<void> {
  if (!state.isTracking || !state.reservationId || !state.vehicleId) return;
  if (state.isSending) return;

  const now = Date.now();
  const coords = position.coords;

  // Filter out noisy positions with high inaccuracy
  if (coords.accuracy && coords.accuracy > MAX_ACCURACY_METERS) {
    console.debug(`Skipping GPS position: accuracy ${coords.accuracy}m exceeds ${MAX_ACCURACY_METERS}m`);
    return;
  }

  // Throttle sends unless forced
  if (!force && state.lastSent && (now - state.lastSent.timestamp) < MIN_THROTTLE_MS) {
    return;
  }

  const speedKmH = coords.speed !== null && coords.speed >= 0 ? coords.speed * 3.6 : 0;
  let isStopped = speedKmH < STOP_SPEED_THRESHOLD_KMH;

  // If vehicle hasn't moved distance, consider stopped
  if (state.lastSent) {
    const dist = getDistanceMeters(state.lastSent.lat, state.lastSent.lng, coords.latitude, coords.longitude);
    if (dist < 4) {
      isStopped = true;
    }
  }

  if (isStopped) {
    if (!state.stoppedSince) {
      state.stoppedSince = new Date(position.timestamp).toISOString();
    }
  } else {
    state.stoppedSince = null;
  }

  state.isSending = true;

  try {
    const payload = {
      reservation_id: state.reservationId,
      veiculo_id: state.vehicleId,
      motorista_nome: state.driverName,
      lat: coords.latitude,
      lng: coords.longitude,
      velocidade: Math.round(speedKmH * 10) / 10,
      precisao: coords.accuracy !== null ? Math.round(coords.accuracy * 10) / 10 : null,
      heading: coords.heading !== null && !isNaN(coords.heading) ? Math.round(coords.heading) : null,
      parado: isStopped,
      parado_desde: state.stoppedSince,
      timestamp: new Date(position.timestamp).toISOString()
    };

    const { error } = await supabase
      .from('veiculos_posicoes')
      .insert([payload]);

    if (error) {
      console.error('Error sending vehicle position to database:', error);
    } else {
      state.lastSent = {
        lat: coords.latitude,
        lng: coords.longitude,
        heading: coords.heading,
        timestamp: now
      };
    }
  } catch (error) {
    console.error('Failed to send vehicle position:', error);
  } finally {
    state.isSending = false;
  }
}

/**
 * Evaluate incoming GPS watch position and send assertively
 */
function handlePositionUpdate(position: GeolocationPosition): void {
  if (!state.isTracking) return;

  state.lastPosition = position;
  const now = Date.now();
  const coords = position.coords;

  // Accuracy gate
  if (coords.accuracy && coords.accuracy > MAX_ACCURACY_METERS) {
    return;
  }

  // First point immediately
  if (!state.lastSent) {
    sendPositionToServer(position, true);
    return;
  }

  const distanceMoved = getDistanceMeters(
    state.lastSent.lat,
    state.lastSent.lng,
    coords.latitude,
    coords.longitude
  );

  const headingDiff = getHeadingDifference(state.lastSent.heading, coords.heading);
  const timeSinceLastSend = now - state.lastSent.timestamp;
  const speedKmH = coords.speed !== null && coords.speed >= 0 ? coords.speed * 3.6 : 0;

  // Criteria for assertive updates:
  // 1. Significant distance moved (>= 10m) and passed min throttle
  // 2. Significant heading change during movement (curve/turn) and passed min throttle
  // 3. Heartbeat elapsed (stationary keep-alive)
  const movedEnough = distanceMoved >= MIN_DISTANCE_METERS && timeSinceLastSend >= MIN_THROTTLE_MS;
  const turnedSignificantly = speedKmH >= 10 && headingDiff >= MIN_HEADING_CHANGE_DEG && distanceMoved >= 6 && timeSinceLastSend >= MIN_THROTTLE_MS;
  const heartbeatDue = timeSinceLastSend >= HEARTBEAT_INTERVAL_MS;

  if (movedEnough || turnedSignificantly || heartbeatDue) {
    sendPositionToServer(position, false);
  }
}

export async function startTracking(
  reservationId: string,
  vehicleId: string,
  driverName?: string
): Promise<boolean> {
  // If already tracking this exact reservation, ensure wake lock and return true
  if (state.isTracking && state.reservationId === reservationId) {
    acquireWakeLock();
    return true;
  }

  // If was tracking another reservation, stop first
  if (state.isTracking) {
    stopTracking();
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.error('Geolocation is not supported by this browser/environment');
    return false;
  }

  try {
    state.isTracking = true;
    state.reservationId = reservationId;
    state.vehicleId = vehicleId;
    state.driverName = driverName || null;
    state.lastPosition = null;
    state.lastSent = null;
    state.stoppedSince = null;

    // Persist tracking info so page reloads or brief backgrounding won't lose tracking
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ reservationId, vehicleId, driverName, startedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore storage errors in private mode
    }

    // Keep screen awake
    acquireWakeLock();

    // Query immediate position with high accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.lastPosition = pos;
        sendPositionToServer(pos, true);
      },
      (err) => console.warn('Initial GPS query warning:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position reactively
    state.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        handlePositionUpdate(pos);
      },
      (err) => {
        console.warn('GPS Watch warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );

    // Periodic heartbeat fallback to handle stationary vehicles or suspended watchPosition
    state.heartbeatInterval = setInterval(() => {
      if (state.isTracking && state.lastPosition) {
        const timeSinceLast = state.lastSent ? Date.now() - state.lastSent.timestamp : Infinity;
        if (timeSinceLast >= HEARTBEAT_INTERVAL_MS) {
          sendPositionToServer(state.lastPosition, false);
        }
      }
    }, 10000);

    return true;
  } catch (error) {
    console.error('Failed to start tracking:', error);
    stopTracking();
    return false;
  }
}

/**
 * Unconditionally stops all GPS hardware polling and releases screen lock
 */
export function stopTracking(): void {
  // 1. Immediately clear GPS hardware watch
  if (state.watchId !== null) {
    try {
      navigator.geolocation.clearWatch(state.watchId);
    } catch (e) {
      console.warn('Error clearing geolocation watch:', e);
    }
    state.watchId = null;
  }

  // 2. Clear heartbeat interval
  if (state.heartbeatInterval !== null) {
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = null;
  }

  // 3. Release screen wake lock
  releaseWakeLock();

  // 4. Clear storage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  // 5. Reset all state values
  state.isTracking = false;
  state.reservationId = null;
  state.vehicleId = null;
  state.driverName = null;
  state.lastPosition = null;
  state.lastSent = null;
  state.stoppedSince = null;
  state.isSending = false;

  console.log('GPS tracking completely stopped.');
}

export function isTrackingActive(): boolean {
  return state.isTracking;
}

export function getPersistedActiveTracking(): { reservationId: string; vehicleId: string; driverName?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getTrackingState() {
  return {
    isTracking: state.isTracking,
    reservationId: state.reservationId,
    vehicleId: state.vehicleId,
    driverName: state.driverName,
    lastPosition: state.lastPosition
      ? {
          lat: state.lastPosition.coords.latitude,
          lng: state.lastPosition.coords.longitude,
          speed: state.lastPosition.coords.speed,
          accuracy: state.lastPosition.coords.accuracy
        }
      : null
  };
}

export function subscribeToPositions(
  onPositionUpdate: (position: VehiclePosition) => void
): () => void {
  const channel = supabase
    .channel('vehicle-positions')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'veiculos_posicoes' }, (payload) => {
      onPositionUpdate(payload.new as VehiclePosition);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToStopNotifications(
  onNotification: (notification: StopNotification) => void
): () => void {
  const channel = supabase
    .channel('realtime-stop-notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes_parada' }, (payload) => {
      onNotification(payload.new as StopNotification);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getStopNotifications(_onlyUnread = false): Promise<StopNotification[]> {
  const { data, error } = await supabase
    .from('notificacoes_parada')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data as StopNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notificacoes_parada')
    .update({ visualizada: true })
    .eq('id', notificationId);

  return !error;
}

export function subscribeToReservations(
  onReservationUpdate: (payload: any) => void
): () => void {
  const channel = supabase
    .channel('realtime-reservations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
      onReservationUpdate(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getActiveReservationIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('status', 'active');

  if (error) return [];
  return data.map((r) => r.id);
}

export async function getLatestPositions(): Promise<VehiclePosition[]> {
  const { data, error } = await supabase
    .from('veiculos_posicoes_atual')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) return [];
  return data as VehiclePosition[];
}

export async function requestGeolocationPermission(): Promise<string> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'denied';

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      () => resolve('denied'),
      { timeout: 5000 }
    );
  });
}
