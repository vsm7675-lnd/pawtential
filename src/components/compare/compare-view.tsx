'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, ChevronUp, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/use-app-store';
import { Breed } from '@/lib/breeds';

interface CompareViewProps {
  onViewProfile: (breed: Breed) => void;
}

const comparisonCategories = [
  { id: 'basics', label: 'Basic Info', icon: '📋' },
  { id: 'personality', label: 'Personality', icon: '🧠' },
  { id: 'care', label: 'Care Needs', icon: '🛁' },
  { id: 'cost', label: 'Cost', icon: '💰' },
  { id: 'climate', label: 'Climate', icon: '🌡️' },
];

export function CompareView({ onViewProfile }: CompareViewProps) {
  const { compareList, removeFromCompare, clearCompareList, favorites, removeFavorite, addFavorite } = useAppStore();
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string>('basics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBreeds = async () => {
      if (compareList.length === 0) {
        setBreeds([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/breeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'compare', breedIds: compareList }),
        });
        const data = await response.json();
        setBreeds(data);
      } catch (error) {
        console.error('Error fetching breeds for comparison:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreeds();
  }, [compareList]);

  const getBestValue = (values: number[], higherIsBetter = true): number => {
    if (higherIsBetter) {
      return Math.max(...values);
    }
    return Math.min(...values);
  };

  const isBest = (value: number, allValues: number[], higherIsBetter = true): boolean => {
    return value === getBestValue(allValues, higherIsBetter);
  };

  if (compareList.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Plus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Compare Breeds</h2>
          <p className="text-muted-foreground max-w-sm">
            Add breeds to compare them side-by-side. You can add up to 4 breeds at a time.
          </p>
          <p className="text-sm text-muted-foreground">
            Tap the <Heart className="w-4 h-4 inline mx-1" /> icon on breed cards to add them here
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between">
        <h2 className="text-xl font-bold">Compare {breeds.length} Breeds</h2>
        <Button variant="outline" size="sm" onClick={clearCompareList}>
          Clear All
        </Button>
      </div>

      {/* Breed Headers */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${breeds.length}, 1fr)` }}>
          {breeds.map((breed) => {
            const isFav = favorites.includes(breed.id);
            return (
              <motion.div
                key={breed.id}
                layoutId={`compare-${breed.id}`}
                className="relative"
              >
                <Card className="overflow-hidden">
                  <div 
                    className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={{
                      backgroundImage: `url('https://source.unsplash.com/200x100/?${encodeURIComponent(breed.breed_name)},dog')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <CardContent className="p-3 text-center">
                    <h3 className="font-semibold text-sm truncate">{breed.breed_name}</h3>
                    <p className="text-xs text-muted-foreground">{breed.origin_country}</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => isFav ? removeFavorite(breed.id) : addFavorite(breed.id)}
                      >
                        <Heart className={cn("h-4 w-4", isFav && "fill-red-500 text-red-500")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeFromCompare(breed.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {/* Add more slot */}
          {breeds.length < 4 && (
            <Card className="border-dashed flex items-center justify-center min-h-[180px]">
              <CardContent className="text-center p-4">
                <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Add breed</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comparison Categories */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {comparisonCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedCategory(expandedCategory === category.id ? '' : category.id)}
              >
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </span>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              
              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-4 pt-0">
                      {category.id === 'basics' && (
                        <ComparisonTable breeds={breeds} isBest={isBest} />
                      )}
                      {category.id === 'personality' && (
                        <PersonalityComparison breeds={breeds} isBest={isBest} />
                      )}
                      {category.id === 'care' && (
                        <CareComparison breeds={breeds} isBest={isBest} />
                      )}
                      {category.id === 'cost' && (
                        <CostComparison breeds={breeds} isBest={isBest} />
                      )}
                      {category.id === 'climate' && (
                        <ClimateComparison breeds={breeds} isBest={isBest} />
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ComparisonTable({ breeds, isBest }: { breeds: Breed[]; isBest: (value: number, all: number[], high?: boolean) => boolean }) {
  const rows = [
    { label: 'Species', key: 'species' },
    { label: 'Height', key: 'height' },
    { label: 'Weight', key: 'weight' },
    { label: 'Life Span', key: 'life_span' },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${breeds.length}, 1fr)` }}>
          <span className="text-sm text-muted-foreground">{row.label}</span>
          {breeds.map((breed) => (
            <span key={breed.id} className="text-sm font-medium text-center">
              {breed[row.key as keyof Breed] as string}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function PersonalityComparison({ breeds, isBest }: { breeds: Breed[]; isBest: (value: number, all: number[], high?: boolean) => boolean }) {
  const traits = [
    { label: 'Adaptability', key: 'adaptability', high: true },
    { label: 'Affection', key: 'affection_level', high: true },
    { label: 'Child Friendly', key: 'child_friendly', high: true },
    { label: 'Dog Friendly', key: 'dog_friendly', high: true },
    { label: 'Energy', key: 'energy_level', high: true },
    { label: 'Intelligence', key: 'intelligence', high: true },
    { label: 'Shedding', key: 'shedding_level', high: false },
    { label: 'Vocalisation', key: 'vocalisation', high: false },
  ];

  return (
    <div className="space-y-4">
      {traits.map((trait) => {
        const values = breeds.map(b => b[trait.key as keyof Breed] as number);
        return (
          <div key={trait.key} className="space-y-2">
            <span className="text-sm text-muted-foreground">{trait.label}</span>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${breeds.length}, 1fr)` }}>
              {breeds.map((breed) => {
                const value = breed[trait.key as keyof Breed] as number;
                const best = isBest(value, values, trait.high);
                return (
                  <div key={breed.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span>{value}/5</span>
                      {best && <Badge variant="secondary" className="text-xs py-0">Best</Badge>}
                    </div>
                    <Progress value={(value / 5) * 100} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CareComparison({ breeds, isBest }: { breeds: Breed[]; isBest: (value: number, all: number[], high?: boolean) => boolean }) {
  const items = [
    { label: 'Daily Exercise (min)', key: 'exercise_minutes_daily', high: false },
    { label: 'Daily Time (hrs)', key: 'total_daily_time_hours', high: false },
    { label: 'Monthly Grooming (hrs)', key: 'grooming_hours_monthly', high: false },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const values = breeds.map(b => b[item.key as keyof Breed] as number);
        return (
          <div key={item.key} className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${breeds.length}, 1fr)` }}>
            <span className="text-sm text-muted-foreground">{item.label}</span>
            {breeds.map((breed) => {
              const value = breed[item.key as keyof Breed] as number;
              const best = isBest(value, values, item.high);
              return (
                <span key={breed.id} className={cn(
                  "text-sm font-medium text-center",
                  best && "text-green-600 dark:text-green-400"
                )}>
                  {value}
                  {best && ' ✓'}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function CostComparison({ breeds, isBest }: { breeds: Breed[]; isBest: (value: number, all: number[], high?: boolean) => boolean }) {
  const costs = [
    { label: 'Monthly Food', key: 'monthly_food_cost_inr' },
    { label: 'Grooming', key: 'professional_grooming_cost_monthly' },
    { label: 'Vet Care', key: 'vet_cost_monthly' },
    { label: 'Total Monthly', key: 'total_monthly_cost_inr' },
  ];

  return (
    <div className="space-y-4">
      {costs.map((cost) => {
        const values = breeds.map(b => b[cost.key as keyof Breed] as number);
        return (
          <div key={cost.key} className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${breeds.length}, 1fr)` }}>
            <span className="text-sm text-muted-foreground">{cost.label}</span>
            {breeds.map((breed) => {
              const value = breed[cost.key as keyof Breed] as number;
              const best = isBest(value, values, false);
              return (
                <span key={breed.id} className={cn(
                  "text-sm font-medium text-center",
                  best && "text-green-600 dark:text-green-400"
                )}>
                  ₹{value?.toLocaleString()}
                  {best && ' ✓'}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ClimateComparison({ breeds, isBest }: { breeds: Breed[]; isBest: (value: number, all: number[], high?: boolean) => boolean }) {
  const climates = [
    { label: 'Heat Tolerance', key: 'heat_tolerance', icon: '☀️' },
    { label: 'Cold Tolerance', key: 'cold_tolerance', icon: '❄️' },
    { label: 'Humidity Tolerance', key: 'humidity_tolerance', icon: '💧' },
  ];

  return (
    <div className="space-y-4">
      {climates.map((climate) => {
        const values = breeds.map(b => b[climate.key as keyof Breed] as number);
        return (
          <div key={climate.key} className="space-y-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {climate.icon} {climate.label}
            </span>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${breeds.length}, 1fr)` }}>
              {breeds.map((breed) => {
                const value = breed[climate.key as keyof Breed] as number;
                const best = isBest(value, values, true);
                const label = value >= 3 ? 'Good' : value >= 2 ? 'Moderate' : 'Poor';
                return (
                  <div key={breed.id} className={cn(
                    "text-center p-2 rounded-lg",
                    value >= 3 ? "bg-green-100 dark:bg-green-900/30" : 
                    value >= 2 ? "bg-yellow-100 dark:bg-yellow-900/30" : 
                    "bg-red-100 dark:bg-red-900/30"
                  )}>
                    <span className="text-sm font-medium">{label}</span>
                    {best && <Badge variant="secondary" className="ml-1 text-xs">Best</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
