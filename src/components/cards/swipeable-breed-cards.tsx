'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { Heart, X, Undo2, Sparkles, MapPin, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breed } from '@/lib/breeds';
import { useAppStore } from '@/hooks/use-app-store';

interface SwipeableBreedCardsProps {
  breeds: Breed[];
  onSwipeRight: (breed: Breed) => void;
  onSwipeLeft: (breed: Breed) => void;
  onCardClick: (breed: Breed) => void;
}

function getSizeCategory(breed: Breed): string {
  const weight = breed.weight.toLowerCase();
  if (weight.includes('kg')) {
    const match = weight.match(/(\d+)/);
    if (match) {
      const kg = parseInt(match[1]);
      if (kg <= 10) return 'Small';
      if (kg <= 25) return 'Medium';
      if (kg <= 45) return 'Large';
      return 'Giant';
    }
  }
  return 'Medium';
}

function getEnergyLabel(level: number): string {
  if (level <= 2) return 'Low';
  if (level <= 3.5) return 'Moderate';
  if (level <= 4.5) return 'High';
  return 'Very High';
}

function getGroomingLabel(level: number): string {
  if (level >= 4) return 'Low';
  if (level >= 2.5) return 'Moderate';
  return 'High';
}

export function SwipeableBreedCards({ breeds, onSwipeRight, onSwipeLeft, onCardClick }: SwipeableBreedCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const { undoLastSwipe, swipedBreeds } = useAppStore();
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0.5, 1, 1, 1, 0.5]);
  
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);
  
  const currentBreed = breeds[currentIndex];
  const nextBreed = breeds[currentIndex + 1];
  
  const handleSwipe = useCallback((swipeDirection: 'left' | 'right') => {
    if (!currentBreed) return;
    
    setDirection(swipeDirection);
    
    setTimeout(() => {
      if (swipeDirection === 'right') {
        onSwipeRight(currentBreed);
      } else {
        onSwipeLeft(currentBreed);
      }
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
  }, [currentBreed, onSwipeRight, onSwipeLeft]);
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  };
  
  const handleUndo = () => {
    const lastSwipe = undoLastSwipe();
    if (lastSwipe) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };
  
  const handleManualSwipe = (swipeDirection: 'left' | 'right') => {
    animate(x, swipeDirection === 'right' ? 500 : -500, { duration: 0.3 });
    handleSwipe(swipeDirection);
  };
  
  if (!currentBreed) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">All breeds viewed!</h2>
          <p className="text-muted-foreground">
            You&apos;ve swiped through all available breeds. Check your favorites or take the quiz!
          </p>
          <Button onClick={handleUndo} disabled={swipedBreeds.length === 0}>
            <Undo2 className="w-4 h-4 mr-2" />
            Undo Last Swipe
          </Button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {/* Next card (behind) */}
      {nextBreed && (
        <div className="absolute inset-x-4 top-0 bottom-32 scale-95 opacity-50 pointer-events-none">
          <BreedCard breed={nextBreed} />
        </div>
      )}
      
      {/* Current card */}
      <motion.div
        className="absolute inset-x-4 top-0 bottom-32 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragEnd={handleDragEnd}
        onClick={() => onCardClick(currentBreed)}
        whileTap={{ scale: 0.98 }}
      >
        <BreedCard breed={currentBreed} />
        
        {/* Like indicator */}
        <motion.div
          className="absolute top-8 right-8 px-4 py-2 rounded-lg border-4 border-green-500 bg-green-500/20 rotate-12"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-2xl font-bold text-green-500">LIKE</span>
        </motion.div>
        
        {/* Nope indicator */}
        <motion.div
          className="absolute top-8 left-8 px-4 py-2 rounded-lg border-4 border-red-500 bg-red-500/20 -rotate-12"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-2xl font-bold text-red-500">NOPE</span>
        </motion.div>
      </motion.div>
      
      {/* Action buttons */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-4 pb-4">
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-2 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => handleManualSwipe('left')}
        >
          <X className="w-7 h-7" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-12 h-12 rounded-full border-2 border-amber-400 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
          onClick={handleUndo}
          disabled={swipedBreeds.length === 0}
        >
          <Undo2 className="w-5 h-5" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-14 h-14 rounded-full border-2 border-green-400 text-green-500 hover:bg-green-50 hover:text-green-600"
          onClick={() => handleManualSwipe('right')}
        >
          <Heart className="w-7 h-7" />
        </Button>
      </div>
    </div>
  );
}

function BreedCard({ breed }: { breed: Breed }) {
  const sizeCategory = getSizeCategory(breed);
  const energyLabel = getEnergyLabel(breed.energy_level);
  const groomingLabel = getGroomingLabel(breed.grooming);
  
  // Generate a placeholder image based on breed name
  const placeholderImage = `https://source.unsplash.com/400x500/?${encodeURIComponent(breed.breed_name)},dog`;
  
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl border border-border">
      {/* Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20"
          style={{
            backgroundImage: `url('${placeholderImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-3xl font-bold">{breed.breed_name}</h2>
            <div className="flex items-center gap-2 text-white/80 mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{breed.origin_country || 'Unknown'}</span>
            </div>
          </div>
          {breed.hypoallergenic && (
            <Badge className="bg-green-500/90 text-white border-0">
              Hypoallergenic
            </Badge>
          )}
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatBadge icon={<span className="text-lg">🐕</span>} label="Size" value={sizeCategory} />
          <StatBadge icon={<span className="text-lg">⚡</span>} label="Energy" value={energyLabel} />
          <StatBadge icon={<span className="text-lg">✂️</span>} label="Grooming" value={groomingLabel} />
          <StatBadge icon={<span className="text-lg"> lifespan" </span>} label="Life" value={breed.life_span?.split(' ')[0] || '10-12'} small />
        </div>
        
        {/* Description */}
        <p className="text-sm text-white/90 line-clamp-2 mb-3">
          {breed.description}
        </p>
        
        {/* Cost & Time */}
        <div className="flex items-center gap-4 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />
            <span>₹{breed.total_monthly_cost_inr?.toLocaleString() || '5,000'}/mo</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{breed.total_daily_time_hours || 2}hrs/day</span>
          </div>
        </div>
        
        {/* Personality traits */}
        <div className="flex flex-wrap gap-1 mt-3">
          {breed.personality_traits?.split(',').slice(0, 3).map((trait, i) => (
            <Badge key={i} variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              {trait.trim()}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value, small = false }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl p-2">
      {icon}
      <span className="text-xs text-white/60 mt-0.5">{label}</span>
      <span className={cn(
        "font-semibold text-white",
        small ? "text-xs" : "text-sm"
      )}>
        {value}
      </span>
    </div>
  );
}
