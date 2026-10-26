import { useEffect, type ReactNode } from 'react';
import { configureMetaPixel, MetaPixelProvider, useMetaPixel } from 'scoretrack';
import { LeadTrackingContext, pixelId } from './metaTracking';
import { SCROLL_MILESTONES } from '../lib/meta-events.js';

configureMetaPixel({
  PIXEL_ID: pixelId,
  // Required by the package; the actual access token exists only on the server.
  ACCESS_TOKEN: 'server-side-only',
  VERBOSE: import.meta.env?.DEV === true,
});

function TrackingBridge({ children }: { children: ReactNode }) {
  const tracking = useMetaPixel();
  useEffect(() => {
    if (!tracking.isInitialized) return;
    const page = window as Window & { __idhokMetaScrollDepths?: Set<number> };
    const sent = page.__idhokMetaScrollDepths ??= new Set<number>();
    let frame: number | null = null;
    const measure = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
      // Avoid rounding 99.5% up to 100%; allow one pixel for fractional layouts.
      const percentage = maxScroll <= 0 ? 0 : maxScroll - window.scrollY <= 1 ? 100 : Math.max(0, window.scrollY / maxScroll * 100);
      for (const depth of SCROLL_MILESTONES) {
        if (percentage < depth || sent.has(depth)) continue;
        sent.add(depth);
        void tracking.trackEvent('Scroll', {
          scroll_depth: depth, scroll_percentage: depth, page_path: window.location.pathname,
        }).catch(() => console.warn('[META PIXEL] Falha ao registrar Scroll:', depth));
      }
    };
    const schedule = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => { frame = null; measure(); });
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [tracking.isInitialized, tracking.trackEvent]);
  return <LeadTrackingContext.Provider value={tracking}>{children}</LeadTrackingContext.Provider>;
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  // Only an explicit dry-run disables browser events, including on localhost.
  if (new URLSearchParams(window.location.search).get('dry_run') === '1') return children;
  // MetaPixelProvider already sends PageView; mounting MetaPixel would duplicate it.
  return <MetaPixelProvider><TrackingBridge>{children}</TrackingBridge></MetaPixelProvider>;
}
