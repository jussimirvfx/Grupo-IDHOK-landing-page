import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface EmptyImageSlotProps {
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'hero' | 'auto';
  label?: string;
  sublabel?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'bordered';
}

export const EmptyImageSlot: React.FC<EmptyImageSlotProps> = ({
  aspectRatio = 'portrait',
  label = 'SLOT DE IMAGEM',
  sublabel = 'Espaço reservado para foto da coleção',
  className = '',
  variant = 'light',
}) => {
  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[16/10]';
      case 'square':
        return 'aspect-square';
      case 'hero':
        return 'aspect-[16/9]';
      case 'auto':
      default:
        return 'h-full min-h-[220px]';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'dark':
        return 'bg-neutral-900 border-neutral-800 text-neutral-400';
      case 'bordered':
        return 'bg-neutral-50/70 border-dashed border-2 border-neutral-300 text-neutral-500';
      case 'light':
      default:
        return 'bg-neutral-100 border-neutral-200/80 text-neutral-400';
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border transition-all duration-300 flex flex-col items-center justify-center p-6 select-none group ${getAspectClass()} ${getVariantClass()} ${className}`}
    >
      {/* Subtle architectural grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-[200px]">
        <div className="w-12 h-12 rounded-full border border-current/20 flex items-center justify-center mb-3 bg-white/40 shadow-xs group-hover:scale-105 transition-transform">
          <ImageIcon className="w-5 h-5 stroke-[1.5]" />
        </div>
        <span className="text-[11px] font-semibold tracking-widest uppercase">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] mt-1 opacity-60 leading-tight">
            {sublabel}
          </span>
        )}
      </div>

      {/* Aesthetic corner accents */}
      <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-current/25" />
      <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-current/25" />
      <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-current/25" />
      <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-current/25" />
    </div>
  );
};
