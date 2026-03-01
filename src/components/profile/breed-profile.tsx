'use client';

import { motion } from 'framer-motion';
import { 
  ChevronLeft, Heart, Share2, BookmarkPlus, 
  Ruler, Scale, Clock, MapPin, Calendar,
  IndianRupee, Utensils, AlertTriangle, Info,
  Activity, Scissors, Brain, Users, Volume2, Wind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Breed } from '@/lib/breeds';
import { useAppStore } from '@/hooks/use-app-store';

interface BreedProfileProps {
  breed: Breed;
  onBack: () => void;
}

function getTraitColor(value: number): string {
  if (value >= 4) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  if (value >= 3) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  return 'text-red-600 bg-red-100 dark:bg-red-900/30';
}

function getTraitBg(value: number): string {
  if (value >= 4) return 'bg-green-500';
  if (value >= 3) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function BreedProfile({ breed, onBack }: BreedProfileProps) {
  const { addFavorite, removeFavorite, isFavorite, addToCompare, compareList, removeFromCompare } = useAppStore();
  const isFav = isFavorite(breed.id);
  const inCompare = compareList.includes(breed.id);

  const handleFavoriteClick = () => {
    if (isFav) {
      removeFavorite(breed.id);
    } else {
      addFavorite(breed.id);
    }
  };

  const handleCompareClick = () => {
    if (inCompare) {
      removeFromCompare(breed.id);
    } else {
      addToCompare(breed.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://source.unsplash.com/600x400/?${encodeURIComponent(breed.breed_name)},dog')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "bg-background/80 backdrop-blur-sm",
              isFav && "text-red-500"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleCompareClick}
          >
            <BookmarkPlus className={cn("w-5 h-5", inCompare && "text-primary")} />
          </Button>
        </div>
        
        {/* Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{breed.breed_name}</h1>
            {breed.hypoallergenic && (
              <Badge className="bg-green-500 text-white">Hypoallergenic</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {breed.origin_country || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {breed.life_span}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem icon={<Ruler className="w-4 h-4" />} label="Height" value={breed.height} />
                <StatItem icon={<Scale className="w-4 h-4" />} label="Weight" value={breed.weight} />
                <StatItem icon={<Activity className="w-4 h-4" />} label="Energy" value={getEnergyLabel(breed.energy_level)} />
                <StatItem icon={<Scissors className="w-4 h-4" />} label="Grooming" value={getGroomingLabel(breed.grooming)} />
                <StatItem icon={<Brain className="w-4 h-4" />} label="Intelligence" value={getIntelligenceLabel(breed.intelligence)} />
                <StatItem icon={<Users className="w-4 h-4" />} label="Social Needs" value={getSocialLabel(breed.social_needs)} />
              </div>
            </CardContent>
          </Card>
          
          {/* Description */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                {breed.description}
              </p>
              
              {breed.personality_traits && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {breed.personality_traits.split(',').map((trait, i) => (
                    <Badge key={i} variant="secondary">
                      {trait.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <CostRow label="Monthly Food" value={breed.monthly_food_cost_inr} />
                <CostRow label="Grooming" value={breed.professional_grooming_cost_monthly} />
                <CostRow label="Vet Care" value={breed.vet_cost_monthly} />
                <Separator />
                <CostRow 
                  label="Total Monthly" 
                  value={breed.total_monthly_cost_inr} 
                  highlight 
                />
                <CostRow 
                  label="Annual Estimate" 
                  value={breed.total_monthly_cost_inr * 12} 
                  highlight 
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Time Commitment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Time Commitment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimeRow label="Daily Exercise" value={`${breed.exercise_minutes_daily} min`} />
                <TimeRow label="Social Interaction" value={`${breed.social_interaction_hours_daily} hrs`} />
                <TimeRow label="Monthly Grooming" value={`${breed.grooming_hours_monthly} hrs`} />
                <Separator />
                <TimeRow 
                  label="Total Daily Time" 
                  value={`${breed.total_daily_time_hours} hrs`}
                  highlight 
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Personality Traits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Personality & Traits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TraitBar label="Adaptability" value={breed.adaptability} max={5} />
                <TraitBar label="Affection Level" value={breed.affection_level} max={5} />
                <TraitBar label="Child Friendly" value={breed.child_friendly} max={5} />
                <TraitBar label="Dog Friendly" value={breed.dog_friendly} max={5} />
                <TraitBar label="Energy Level" value={breed.energy_level} max={5} />
                <TraitBar label="Intelligence" value={breed.intelligence} max={5} />
                <TraitBar label="Shedding" value={breed.shedding_level} max={5} />
                <TraitBar label="Vocalisation" value={breed.vocalisation} max={5} />
              </div>
            </CardContent>
          </Card>
          
          {/* Climate Tolerance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                Climate Tolerance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <ClimateBadge label="Heat" value={breed.heat_tolerance} icon="☀️" />
                <ClimateBadge label="Cold" value={breed.cold_tolerance} icon="❄️" />
                <ClimateBadge label="Humidity" value={breed.humidity_tolerance} icon="💧" />
              </div>
            </CardContent>
          </Card>
          
          {/* Dietary Needs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Dietary Needs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sensitivity Level</span>
                  <Badge className={getTraitColor(6 - breed.dietary_sensitivity_level)}>
                    {getSensitivityLabel(breed.dietary_sensitivity_level)}
                  </Badge>
                </div>
                {breed.common_food_allergies && breed.common_food_allergies !== 'Minimal (Generally robust)' && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Common Allergies</span>
                    <span className="text-sm text-right max-w-[60%]">{breed.common_food_allergies}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Obesity Risk</span>
                  <Badge className={getTraitColor(6 - breed.obesity_prone)}>
                    {getObesityLabel(breed.obesity_prone)}
                  </Badge>
                </div>
                {breed.recommended_diet_type && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Recommended Diet</span>
                    <span className="text-sm text-right">{breed.recommended_diet_type}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Guardian Warnings */}
          {breed.guardian_note && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Important Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">
                  {breed.guardian_note.replace(/\\n/g, '\n').replace(/\?\?/g, '⚠️')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function CostRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center", highlight && "font-bold")}>
      <span className={cn(highlight ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn(highlight && "text-primary")}>₹{value?.toLocaleString() || '0'}</span>
    </div>
  );
}

function TimeRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center", highlight && "font-bold")}>
      <span className={cn(highlight ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn(highlight && "text-primary")}>{value}</span>
    </div>
  );
}

function TraitBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full",
            value >= 4 ? "bg-green-500" : value >= 3 ? "bg-yellow-500" : "bg-red-500"
          )}
        />
      </div>
    </div>
  );
}

function ClimateBadge({ label, value, icon }: { label: string; value: number; icon: string }) {
  const colorClass = value >= 3 
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
    : value >= 2 
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  
  return (
    <div className={cn("rounded-lg p-3", colorClass)}>
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-medium mt-1">{label}</p>
      <p className="text-sm font-bold">{value >= 3 ? 'Good' : value >= 2 ? 'Moderate' : 'Poor'}</p>
    </div>
  );
}

function getEnergyLabel(value: number): string {
  if (value <= 2) return 'Low';
  if (value <= 3.5) return 'Moderate';
  if (value <= 4.5) return 'High';
  return 'Very High';
}

function getGroomingLabel(value: number): string {
  if (value >= 4) return 'Low';
  if (value >= 2.5) return 'Moderate';
  return 'High';
}

function getIntelligenceLabel(value: number): string {
  if (value >= 4.5) return 'Very High';
  if (value >= 3.5) return 'High';
  if (value >= 2.5) return 'Average';
  return 'Below Average';
}

function getSocialLabel(value: number): string {
  if (value >= 4.5) return 'Very High';
  if (value >= 3.5) return 'High';
  if (value >= 2.5) return 'Average';
  return 'Low';
}

function getSensitivityLabel(value: number): string {
  if (value <= 2) return 'Low';
  if (value <= 3) return 'Moderate';
  return 'High';
}

function getObesityLabel(value: number): string {
  if (value <= 2) return 'Low';
  if (value <= 3) return 'Moderate';
  return 'High';
}
