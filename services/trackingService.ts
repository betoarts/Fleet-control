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

interface TrackingState {
  isTracking: boolean;
  watchId: number | null;
  reservationId: string | null;
  vehicleId: string | null;
  driverName: string | null;
  lastPosition: GeolocationPosition | null;
  sendInterval: ReturnType<typeof setInterval> | null;
}

// Tracking state
const state: TrackingState = {
  isTracking: false,
  watchId: null,
  reservationId: null,
  vehicleId: null,
  driverName: null,
  lastPosition: null,
  sendInterval: null
};

// Configuration
const SEND_INTERVAL_MS = 15000; // Send position every 15 seconds

/**
 * Send position to Edge Function
 */
async function sendPositionToServer(position: GeolocationPosition): Promise<void> {
  if (!state.reservationId || !state.vehicleId) return;

  try {
    const payload = {
      reservation_id: state.reservationId,
      veiculo_id: state.vehicleId,
      motorista_nome: state.driverName,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      velocidade: position.coords.speed !== null ? position.coords.speed * 3.6 : undefined, // m/s to km/h
      precisao: position.coords.accuracy,
      heading: position.coords.heading,
      timestamp: new Date(position.timestamp).toISOString()
    };

    // Use standard invoke (API configured locally)
    const { data, error } = await supabase.functions.invoke('receive-position', {
      body: payload
    });

    if (error) {
      console.error('Error sending position:', error);
    }
  } catch (error) {
    console.error('Failed to send position:', error);
  }
}

export async function startTracking(
  reservationId: string,
  vehicleId: string,
  driverName?: string
): Promise<boolean> {
  if (state.isTracking) return true;

  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser');
    return false;
  }

  try {
    state.isTracking = true;
    state.reservationId = reservationId;
    state.vehicleId = vehicleId;
    state.driverName = driverName || null;

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.lastPosition = pos;
        sendPositionToServer(pos);
      },
      (err) => console.error('Initial GPS error:', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position
    state.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        state.lastPosition = pos;
      },
      (err) => console.error('GPS Watch error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Send positions periodically
    state.sendInterval = setInterval(() => {
      if (state.lastPosition) {
        sendPositionToServer(state.lastPosition);
      }
    }, SEND_INTERVAL_MS);

    return true;
  } catch (error) {
    console.error('Failed to start tracking:', error);
    return false;
  }
}

export function stopTracking(): void {
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  if (state.sendInterval !== null) {
    clearInterval(state.sendInterval);
    state.sendInterval = null;
  }

  state.isTracking = false;
  state.reservationId = null;
  state.vehicleId = null;
  state.driverName = null;
  state.lastPosition = null;
}

export function isTrackingActive(): boolean {
  return state.isTracking;
}

export function getTrackingState() {
  return {
    isTracking: state.isTracking,
    reservationId: state.reservationId,
    vehicleId: state.vehicleId,
    driverName: state.driverName,
    lastPosition: state.lastPosition ? {
      lat: state.lastPosition.coords.latitude,
      lng: state.lastPosition.coords.longitude,
      speed: state.lastPosition.coords.speed,
      accuracy: state.lastPosition.coords.accuracy
    } : null
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
  _onNotification: (notification: StopNotification) => void
): () => void {
  // Realtime stubs for local PostgREST (not supported out of the box)
  return () => {};
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
  _onReservationUpdate: (payload: any) => void
): () => void {
  // Realtime stub
  return () => {};
}

export async function getActiveReservationIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('status', 'active');

  if (error) return [];
  return data.map(r => r.id);
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
  if (!navigator.geolocation) return 'denied';
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      () => resolve('denied'),
      { timeout: 5000 }
    );
  });
}
