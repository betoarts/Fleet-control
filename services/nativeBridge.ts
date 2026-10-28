import { isTauri } from '@tauri-apps/api/core';
import {
  isPermissionGranted as isTauriNotificationGranted,
  requestPermission as requestTauriNotificationPermission,
  sendNotification as sendTauriNotification,
} from '@tauri-apps/plugin-notification';
import {
  getCurrentPosition as getTauriCurrentPosition,
  watchPosition as watchTauriPosition,
  clearWatch as clearTauriWatch,
  checkPermissions as checkTauriGeoPermissions,
  requestPermissions as requestTauriGeoPermissions,
  PositionOptions as TauriPositionOptions,
  Position as TauriPosition,
} from '@tauri-apps/plugin-geolocation';

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
}

export interface NativePosition {
  coords: GeoLocationCoordinates;
  timestamp: number;
}

class NativeBridgeService {
  private _isTauriApp: boolean = false;

  constructor() {
    this._isTauriApp = typeof window !== 'undefined' && isTauri();
    if (this._isTauriApp) {
      console.log('🚀 [NativeBridge] Executando dentro do ambiente nativo Tauri v2 Android');
    } else {
      console.log('🌐 [NativeBridge] Executando em ambiente Web / PWA');
    }
  }

  public get isTauriApp(): boolean {
    return this._isTauriApp;
  }

  /**
   * Solicita e verifica permissões de notificação (Android 13+ POST_NOTIFICATIONS ou Web)
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (this._isTauriApp) {
      try {
        let granted = await isTauriNotificationGranted();
        if (!granted) {
          const permission = await requestTauriNotificationPermission();
          granted = permission === 'granted';
        }
        return granted;
      } catch (err) {
        console.warn('[NativeBridge] Erro ao solicitar permissão de notificação nativa:', err);
        return false;
      }
    }

    // Fallback Web / PWA
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') return true;
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (err) {
        console.warn('[NativeBridge] Erro ao solicitar notificação Web:', err);
        return false;
      }
    }

    return false;
  }

  /**
   * Envia uma notificação nativa ou web para o motorista/usuário
   */
  public async sendNotification(title: string, body: string): Promise<void> {
    if (this._isTauriApp) {
      try {
        await sendTauriNotification({
          title,
          body,
          icon: 'icon-512',
        });
        return;
      } catch (err) {
        console.warn('[NativeBridge] Falha ao enviar notificação Tauri:', err);
      }
    }

    // Fallback Web / PWA
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });
      } catch (err) {
        console.warn('[NativeBridge] Falha na notificação Web:', err);
      }
    }
  }

  /**
   * Solicita permissões de geolocalização no Android nativo ou navegador
   */
  public async requestLocationPermissions(): Promise<boolean> {
    if (this._isTauriApp) {
      try {
        const status = await checkTauriGeoPermissions();
        if (status.location === 'granted') {
          return true;
        }
        const requested = await requestTauriGeoPermissions(['location']);
        return requested.location === 'granted';
      } catch (err) {
        console.warn('[NativeBridge] Erro ao solicitar permissões de GPS nativas:', err);
        return false;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }

    return false;
  }

  /**
   * Obtém a posição GPS atual com alta precisão
   */
  public async getCurrentPosition(options?: TauriPositionOptions): Promise<NativePosition | null> {
    const opts = options || { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    if (this._isTauriApp) {
      try {
        const pos: TauriPosition = await getTauriCurrentPosition(opts);
        return {
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            altitude: pos.coords.altitude,
          },
          timestamp: pos.timestamp,
        };
      } catch (err) {
        console.warn('[NativeBridge] Erro ao obter GPS nativo via Tauri:', err);
      }
    }

    // Fallback Browser
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
                altitude: pos.coords.altitude,
              },
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            console.warn('[NativeBridge] Erro no GPS Web:', err.message);
            resolve(null);
          },
          opts
        );
      });
    }

    return null;
  }

  /**
   * Inicia o monitoramento contínuo de coordenadas GPS
   */
  public async watchPosition(
    onSuccess: (position: NativePosition) => void,
    onError?: (error: any) => void,
    options?: TauriPositionOptions
  ): Promise<number | string> {
    const opts = options || { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 };

    if (this._isTauriApp) {
      try {
        const watchId = await watchTauriPosition(
          opts,
          (pos) => {
            if (pos) {
              onSuccess({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  speed: pos.coords.speed,
                  heading: pos.coords.heading,
                  altitude: pos.coords.altitude,
                },
                timestamp: pos.timestamp,
              });
            }
          }
        );
        return watchId;
      } catch (err) {
        console.warn('[NativeBridge] Erro ao iniciar watch nativo via Tauri:', err);
        if (onError) onError(err);
      }
    }

    // Fallback Web
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          onSuccess({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              altitude: pos.coords.altitude,
            },
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          if (onError) onError(err);
        },
        opts
      );
      return id;
    }

    throw new Error('Geolocalização não suportada neste dispositivo.');
  }

  /**
   * Finaliza o monitoramento de GPS
   */
  public async clearWatch(watchId: number | string): Promise<void> {
    if (this._isTauriApp) {
      try {
        await clearTauriWatch(Number(watchId));
        return;
      } catch (err) {
        console.warn('[NativeBridge] Erro ao limpar watch nativo:', err);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation && typeof watchId === 'number') {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch (e) {
        console.warn('[NativeBridge] Erro ao limpar watch Web:', e);
      }
    }
  }
}

export const nativeBridge = new NativeBridgeService();
