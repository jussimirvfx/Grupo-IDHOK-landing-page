import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { EmptyImageSlot } from './EmptyImageSlot';

interface CollectionItem {
  id: number;
  lookNumber: string;
  category: string;
  line: 'Idhok' | 'Essence All Curves';
}

const collectionItems: CollectionItem[] = [
  { id: 1, lookNumber: 'Look 01', category: 'Alfaiataria Urbana & Sobretudo', line: 'Idhok' },
  { id: 2, lookNumber: 'Look 02', category: 'Tricot Premium Estruturado', line: 'Idhok' },
  { id: 3, lookNumber: 'Look 03', category: 'Blazer Oversized All Curves', line: 'Essence All Curves' },
  { id: 4, lookNumber: 'Look 04', category: 'Vestido Fluido Inverno', line: 'Essence All Curves' },
  { id: 5, lookNumber: 'Look 05', category: 'Denim Acetinado & Camisaria', line: 'Idhok' },
  { id: 6, lookNumber: 'Look 06', category: 'Conjunto Monocromático Plus', line: 'Essence All Curves' },
  { id: 7, lookNumber: 'Look 07', category: 'Casaco Teddy & Pesponto', line: 'Idhok' },
  { id: 8, lookNumber: 'Look 08', category: 'Macacão Alfaiataria Curvas', line: 'Essence All Curves' },
];

interface CollectionCarouselProps {
  onCtaClick: () => void;
}

export const CollectionCarousel: React.FC<CollectionCarouselProps> = ({ onCtaClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-play interval: slow rotation (4.5s)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % collectionItems.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % collectionItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + collectionItems.length) % collectionItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  // Visible items based on current index (window of 4 items for desktop, 2 for tablet, 1 for mobile)
  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < 4; i++) {
      items.push(collectionItems[(currentIndex + i) % collectionItems.length]);
    }
    return items;
  };

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-50/70 border-y border-neutral-200/80">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-900 font-normal tracking-tight text-balance">
            Conheça Urban Habitat, a nova coleção de inverno do Grupo IDHOK
          </h2>
        </div>

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center justify-between absolute -top-14 right-0 gap-2 z-20">
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Continuar reprodução' : 'Pausar carrossel'}
              aria-label={isPaused ? 'Continuar reprodução' : 'Pausar carrossel'}
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-200/60"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={handlePrev}
              aria-label="Look anterior"
              className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Próximo look"
              className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cards Grid / Track */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {getVisibleItems().map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="transition-all duration-500 ease-out flex flex-col"
              >
                {/* Empty Image Slot per user instruction */}
                <EmptyImageSlot
                  aspectRatio="portrait"
                  label="IMAGEM"
                  sublabel=""
                  className="bg-neutral-200/70 border-neutral-300/80 hover:border-neutral-400/90 shadow-sm transition-transform hover:-translate-y-1"
                />
              </div>
            ))}
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex sm:hidden items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {collectionItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex ? 'w-6 bg-neutral-900' : 'w-1.5 bg-neutral-300'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop indicators */}
          <div className="hidden sm:flex justify-center items-center gap-2 mt-8">
            {collectionItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-8 bg-neutral-900' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Ir para look ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Section CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={onCtaClick}
            type="button"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            QUERO SER UM LOJISTA PARCEIRO
          </button>
        </div>
      </div>
    </section>
  );
};
