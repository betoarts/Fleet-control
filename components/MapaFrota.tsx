import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  VehiclePosition, 
  StopNotification,
  subscribeToPositions, 
  subscribeToStopNotifications,
  getLatestPositions,
  getStopNotifications,
  markNotificationRead,
  subscribeToReservations,
  getActiveReservationIds
} from '../services/trackingService';
import { ToastContainer, useToast, Toast } from './ToastNotification';

// Fix Leaflet default marker icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom vehicle icons
const vehicleMovingIcon = new L.Icon({
  iconUrl: '/markers/vehicle-moving.svg',
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

const vehicleStoppedIcon = new L.Icon({
  iconUrl: '/markers/vehicle-stopped.svg',
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

interface MapaFrotaProps {
  onExit: () => void;
}

// Component to auto-fit bounds to markers
const MapBoundsHandler: React.FC<{ positions: VehiclePosition[] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(
        positions.map(p => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);

  return null;
};

export const MapaFrota: React.FC<MapaFrotaProps> = ({ onExit }) => {
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [activeReservationIds, setActiveReservationIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<StopNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Default center (Gramado, RS)
  const defaultCenter: [number, number] = [-29.3746, -50.8764];

  // Add toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Use ref for active IDs to ensure real-time callbacks read the latest state without re-subscribing
  const activeReservationIdsRef = useRef<Set<string>>(new Set());
  const filterVisiblePositions = useCallback(
    (allPositions: VehiclePosition[], activeIds: Set<string>) => {
      // Fail-open: if active reservations cannot be loaded, keep positions visible.
      if (activeIds.size === 0) {
        return allPositions;
      }
      return allPositions.filter((p) => activeIds.has(p.reservation_id));
    },
    []
  );

  const syncActiveReservations = useCallback(async () => {
    try {
      const [activeIds, latestPositions] = await Promise.all([
        getActiveReservationIds(),
        getLatestPositions()
      ]);

      const nextActiveSet = new Set(activeIds);
      activeReservationIdsRef.current = nextActiveSet;
      setActiveReservationIds(nextActiveSet);

      const validPositions = filterVisiblePositions(latestPositions, nextActiveSet);
      setPositions(validPositions);
    } catch (error) {
      console.error('Error syncing active reservations:', error);
    }
  }, [filterVisiblePositions]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [positionsData, notificationsData, activeIds] = await Promise.all([
          getLatestPositions(),
          getStopNotifications(false),
          getActiveReservationIds()
        ]);
        
        const activeIdsSet = new Set(activeIds);
        activeReservationIdsRef.current = activeIdsSet;
        setActiveReservationIds(activeIdsSet);
        
        const validPositions = filterVisiblePositions(positionsData, activeIdsSet);
        setPositions(validPositions);
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filterVisiblePositions]);

  // Fallback sync in case realtime subscriptions are delayed/unavailable.
  useEffect(() => {
    const interval = setInterval(() => {
      syncActiveReservations();
    }, 10000);

    return () => clearInterval(interval);
  }, [syncActiveReservations]);

  // Subscribe to real-time updates
  useEffect(() => {
    // 1. Listen for Reservation Updates (Start/End)
    const unsubscribeReservations = subscribeToReservations((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
        const completedId = payload.new.id;
        
        // Remove from ref immediately
        const next = new Set(activeReservationIdsRef.current);
        next.delete(completedId);
        activeReservationIdsRef.current = next;
        
        // Update state mainly for UI consistency if used elsewhere, but data flow relies on ref for filtering
        setActiveReservationIds(next);

        // Remove from positions immediately
        setPositions(prev => prev.filter(p => p.reservation_id !== completedId));
        
        addToast({
          type: 'info',
          title: 'Viagem Finalizada',
          message: `O veículo ${payload.new.vehicle} encerrou a viagem.`,
          duration: 5000
        });
      } else if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
        // Add to active set
        const next = new Set(activeReservationIdsRef.current);
        next.add(payload.new.id);
        activeReservationIdsRef.current = next;
        setActiveReservationIds(next);
      }
    });

    // 2. Listen for Positions
    const unsubscribePositions = subscribeToPositions((newPosition) => {
      // STRICT CHECK: Only process position if reservation is currently active in our Ref
      if (
        activeReservationIdsRef.current.size > 0 &&
        !activeReservationIdsRef.current.has(newPosition.reservation_id)
      ) {
        console.debug('Ignoring position for inactive/completed reservation:', newPosition.reservation_id);
        return;
      }

      setPositions(prev => {
        const existing = prev.findIndex(p => p.veiculo_id === newPosition.veiculo_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newPosition;
          return updated;
        }
        return [...prev, newPosition];
      });
    });

    const unsubscribeNotifications = subscribeToStopNotifications((notification) => {
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast
      const time = new Date(notification.parado_em).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      addToast({
        type: 'warning',
        title: 'Veículo Parado',
        message: `${notification.motorista_nome || notification.veiculo_id} parou às ${time}`,
        duration: 8000
      });
    });

    return () => {
      unsubscribeReservations();
      unsubscribePositions();
      unsubscribeNotifications();
    };
  }, [addToast]);

  // Handle notification read
  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, visualizada: true } : n)
    );
  };

  // Center map on vehicle
  const centerOnVehicle = (vehicleId: string) => {
    const position = positions.find(p => p.veiculo_id === vehicleId);
    if (position && mapRef.current) {
      mapRef.current.setView([position.lat, position.lng], 16);
      setSelectedVehicle(vehicleId);
    }
  };

  const formatSpeed = (speed: number | null | undefined) => {
    if (speed == null) return '0.0 km/h';
    return `${speed.toFixed(1)} km/h`;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s atrás`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min atrás`;
    return `${Math.floor(diffSec / 3600)}h atrás`;
  };

  const unreadCount = notifications.filter(n => !n.visualizada).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <i className="fas fa-map-marked-alt text-6xl text-blue-400 mb-6 animate-pulse"></i>
          <p className="text-white font-bold uppercase tracking-widest">Carregando Mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Sidebar */}
      <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <i className="fas fa-map-marked-alt text-blue-400"></i>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg uppercase tracking-wide">Mapa da Frota</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-green-400 font-bold uppercase">Live</span>
                </div>
              </div>
            </div>
            <button
              onClick={onExit}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Voltar ao Dashboard"
            >
              <i className="fas fa-times text-white"></i>
            </button>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            <i className="fas fa-car mr-2"></i>
            Veículos Ativos ({positions.length})
          </h3>
          
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-car text-4xl text-gray-600 mb-3"></i>
              <p className="text-gray-500 text-sm">Nenhum veículo ativo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map(position => (
                <button
                  key={position.veiculo_id}
                  onClick={() => centerOnVehicle(position.veiculo_id)}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedVehicle === position.veiculo_id
                      ? 'bg-blue-500/20 border-blue-500/40'
                      : position.parado
                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      position.parado ? 'bg-red-500/30' : 'bg-green-500/30'
                    }`}>
                      <i className={`fas ${position.parado ? 'fa-stop' : 'fa-car'} text-sm ${
                        position.parado ? 'text-red-400' : 'text-green-400'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">
                        {position.motorista_nome || position.veiculo_id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatSpeed(position.velocidade)} • {formatTimeAgo(position.timestamp)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      position.parado 
                        ? 'bg-red-500/30 text-red-400' 
                        : 'bg-green-500/30 text-green-400'
                    }`}>
                      {position.parado ? 'Parado' : 'Movendo'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel Toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-bell text-yellow-400"></i>
              <span className="text-white font-bold text-sm">Alertas de Parada</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={positions.length > 0 ? [positions[0].lat, positions[0].lng] : defaultCenter}
          zoom={13}
          className="w-full h-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {positions.length > 0 && <MapBoundsHandler positions={positions} />}
          
          {positions.map(position => (
            <Marker
              key={position.veiculo_id}
              position={[position.lat, position.lng]}
              icon={position.parado ? vehicleStoppedIcon : vehicleMovingIcon}
            >
              <Popup className="vehicle-marker-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      position.parado ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      <i className={`fas ${position.parado ? 'fa-stop' : 'fa-car'} text-white text-sm`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{position.motorista_nome || 'Motorista'}</p>
                      <p className="text-xs text-gray-400">{position.veiculo_id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Velocidade</p>
                      <p className="font-bold text-blue-400">{formatSpeed(position.velocidade)}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className={`font-bold ${position.parado ? 'text-red-400' : 'text-green-400'}`}>
                        {position.parado ? 'Parado' : 'Em movimento'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <i className="fas fa-clock mr-1"></i>
                    Atualizado: {formatTimeAgo(position.timestamp)}
                  </div>
                  
                  {position.parado && position.parado_desde && (
                    <div className="mt-2 bg-red-500/20 rounded-lg p-2 text-xs">
                      <i className="fas fa-exclamation-triangle text-red-400 mr-1"></i>
                      Parado desde: {new Date(position.parado_desde).toLocaleTimeString('pt-BR')}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-xl rounded-xl p-3 border border-white/10">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Legenda</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-white">Em movimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-white">Parado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Slide Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col z-10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold uppercase tracking-wide">
              <i className="fas fa-bell text-yellow-400 mr-2"></i>
              Alertas de Parada
            </h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-white"></i>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-4xl text-green-500/50 mb-3"></i>
                <p className="text-gray-500 text-sm">Nenhum alerta de parada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl border transition-all ${
                      notification.visualizada
                        ? 'bg-white/5 border-white/10'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-stop text-red-400 text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {notification.motorista_nome || notification.veiculo_id}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Parou às {new Date(notification.parado_em).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {!notification.visualizada && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="Marcar como lido"
                        >
                          <i className="fas fa-check text-green-400 text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaFrota;
