declare module 'scoretrack' {
  import type { ReactNode } from 'react';
  export interface LeadData {
    name: string; email: string; phone: string; city?: string; state?: string; zip?: string; country?: string;
    value: number; currency: string; content_name: string; content_category: string; lead_score: number;
  }
  export function configureMetaPixel(config: { PIXEL_ID: string; ACCESS_TOKEN: string; VERBOSE?: boolean }): void;
  export function MetaPixelProvider(props: { children: ReactNode }): ReactNode;
  export function useMetaPixel(): {
    isInitialized: boolean;
    trackEvent(name: string, params?: Record<string, unknown>): Promise<void>;
    trackLead(data: LeadData): Promise<void>;
    trackLeadQualificado(data: LeadData): Promise<void>;
  };
}
