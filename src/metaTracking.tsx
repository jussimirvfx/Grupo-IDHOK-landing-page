import { createContext, useContext } from 'react';
import type { useMetaPixel } from 'scoretrack';

export const pixelId = import.meta.env?.VITE_META_PIXEL_ID || '2372940856574782';

export const isLocalPreview = () => import.meta.env?.PROD !== true
  && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

export const LeadTrackingContext = createContext<ReturnType<typeof useMetaPixel> | null>(null);
export const useLeadTracking = () => useContext(LeadTrackingContext);

export function updateAdvancedMatching(data: { name: string; email: string; phone: string; city?: string; state?: string; zip?: string }) {
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (!fbq) return;
  const names = data.name.trim().split(/\s+/);
  const normalize = (value = '') => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g, '');
  fbq('init', pixelId, {
    em: data.email.trim().toLowerCase(), ph: data.phone.replace(/\D/g, ''),
    fn: normalize(names[0]), ln: normalize(names.slice(1).join(' ')),
    ct: normalize(data.city), st: normalize(data.state), zp: data.zip?.replace(/\D/g, ''), country: 'br',
  });
}
