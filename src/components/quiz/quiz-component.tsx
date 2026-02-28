'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Sparkles, Heart, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/hooks/use-app-store';
import { QuizAnswers, Breed, MatchResult } from '@/lib/breeds';

interface Question {
  id: keyof QuizAnswers;
  title: string;
  subtitle: string;
  type: 'single' | 'multiple' | 'slider' | 'input';
  options?: { value: string; label: string; icon: string; description?: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const questions: Question[] = [
  {
    id: 'speciesPreference',
    title: "What pet are you looking for?",
    subtitle: "Let's start with the basics",
    type: 'single',
    options: [
      { value: 'Dog', label: 'Dog', icon: '🐕', description: 'Loyal companions' },
      { value: 'Cat', label: 'Cat', icon: '🐱', description: 'Independent friends' },
      { value: 'Both', label: 'Any', icon: '🐾', description: 'Open to both' },
    ],
  },
  {
    id: 'livingSituation',
    title: "Where do you live?",
    subtitle: "Your living space matters",
    type: 'single',
    options: [
      { value: 'apartment', label: 'Apartment', icon: '🏢', description: 'Multi-story building' },
      { value: 'house', label: 'House', icon: '🏠', description: 'With yard or garden' },
      { value: 'farm', label: 'Farm/Large Property', icon: '🌾', description: 'Plenty of open space' },
    ],
  },
  {
    id: 'squareFeet',
    title: "How big is your living space?",
    subtitle: "Space affects breed suitability",
    type: 'slider',
    min: 300,
    max: 5000,
    step: 100,
    suffix: ' sq ft',
  },
  {
    id: 'activityLevel',
    title: "How active is your lifestyle?",
    subtitle: "Match energy levels with your pet",
    type: 'single',
    options: [
      { value: 'sedentary', label: 'Sedentary', icon: '🛋️', description: 'Mostly relaxed at home' },
      { value: 'moderate', label: 'Moderate', icon: '🚶', description: 'Regular walks and activities' },
      { value: 'active', label: 'Very Active', icon: '🏃', description: 'Daily exercise & adventures' },
    ],
  },
  {
    id: 'experienceLevel',
    title: "Your pet ownership experience?",
    subtitle: "Some breeds need experienced owners",
    type: 'single',
    options: [
      { value: 'first-time', label: 'First-Time', icon: '🌱', description: 'New to pet ownership' },
      { value: 'experienced', label: 'Experienced', icon: '⭐', description: 'Had pets before' },
      { value: 'expert', label: 'Expert', icon: '🏆', description: 'Trained/owned many pets' },
    ],
  },
  {
    id: 'dailyHours',
    title: "Hours available daily?",
    subtitle: "For exercise, grooming & bonding",
    type: 'slider',
    min: 0.5,
    max: 8,
    step: 0.5,
    suffix: ' hours',
  },
  {
    id: 'monthlyBudget',
    title: "Monthly pet budget?",
    subtitle: "Including food, vet, grooming",
    type: 'slider',
    min: 1000,
    max: 30000,
    step: 500,
    suffix: ' ₹',
  },
  {
    id: 'climate',
    title: "What's your local climate?",
    subtitle: "Climate affects breed comfort",
    type: 'single',
    options: [
      { value: 'hot', label: 'Hot', icon: '☀️', description: 'Hot summers, mild winters' },
      { value: 'moderate', label: 'Moderate', icon: '🌤️', description: 'Balanced weather year-round' },
      { value: 'cold', label: 'Cold', icon: '❄️', description: 'Cold winters, cool summers' },
      { value: 'tropical', label: 'Tropical', icon: '🌴', description: 'Hot & humid' },
    ],
  },
  {
    id: 'purpose',
    title: "What's your main purpose?",
    subtitle: "Your primary reason for a pet",
    type: 'single',
    options: [
      { value: 'companion', label: 'Companion', icon: '💕', description: 'Loving family member' },
      { value: 'guard', label: 'Guard Dog', icon: '🛡️', description: 'Security & protection' },
      { value: 'active', label: 'Active Partner', icon: '🦮', description: 'Running, hiking buddy' },
      { value: 'show', label: 'Show/Competition', icon: '🏆', description: 'Breeding or showing' },
    ],
  },
  {
    id: 'groomingPreference',
    title: "Grooming preference?",
    subtitle: "Time & effort for coat care",
    type: 'single',
    options: [
      { value: 'low', label: 'Low', icon: '✨', description: 'Minimal grooming needed' },
      { value: 'medium', label: 'Medium', icon: '🧹', description: 'Regular brushing' },
      { value: 'high', label: 'High', icon: '👑', description: 'Enjoy grooming sessions' },
    ],
  },
];

const dealBreakerOptions = [
  { value: 'shedding', label: 'Excessive shedding', icon: '🧶' },
  { value: 'barking', label: 'Excessive barking', icon: '🔊' },
  { value: 'small-only', label: 'Must be small-sized', icon: '🐕' },
  { value: 'hypoallergenic-only', label: 'Must be hypoallergenic', icon: '🤧' },
];

export function QuizComponent() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    livingSituation: 'apartment',
    squareFeet: 1000,
    activityLevel: 'moderate',
    experienceLevel: 'first-time',
    dailyHours: 2,
    monthlyBudget: 5000,
    climate: 'moderate',
    hasKids: false,
    kidAges: '',
    hasOtherPets: false,
    otherPetTypes: '',
    groomingPreference: 'medium',
    purpose: 'companion',
    dealBreakers: [],
    speciesPreference: 'Dog',
  });
  const [showDealBreakers, setShowDealBreakers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const { setCurrentView, setSelectedBreed, setQuizResults } = useAppStore();

  const progress = ((currentQuestion + 1) / (questions.length + 1)) * 100;
  const currentQ = questions[currentQuestion];

  const handleSingleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQ.id]: value });
  };

  const handleSliderChange = (value: number[]) => {
    setAnswers({ ...answers, [currentQ.id]: value[0] });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setAnswers({ ...answers, [currentQ.id]: value });
  };

  const handleDealBreakerToggle = (value: string) => {
    const current = answers.dealBreakers || [];
    if (current.includes(value)) {
      setAnswers({ ...answers, dealBreakers: current.filter(v => v !== value) });
    } else {
      setAnswers({ ...answers, dealBreakers: [...current, value] });
    }
  };

  const handleNext = () => {
    if (showDealBreakers) {
      handleSubmitQuiz();
    } else if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowDealBreakers(true);
    }
  };

  const handleBack = () => {
    if (showDealBreakers) {
      setShowDealBreakers(false);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/breeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          answers,
          limit: 5,
        }),
      });
      
      const data = await response.json();
      setResults(data);
      setQuizResults(data);
    } catch (error) {
      console.error('Quiz submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewBreedProfile = (breed: Breed) => {
    setSelectedBreed(breed);
    setCurrentView('profile');
  };

  if (results.length > 0) {
    return (
      <div className="h-full overflow-y-auto pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center pt-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold">Your Perfect Matches!</h2>
            <p className="text-muted-foreground mt-1">
              Based on your preferences, here are the best breeds for you
            </p>
          </div>

          {/* Results */}
          <div className="space-y-4 px-4">
            {results.map((result, index) => (
              <motion.div
                key={result.breed.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => viewBreedProfile(result.breed)}
                className="cursor-pointer"
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-300 hover:shadow-lg",
                  result.score >= 95 && "ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20",
                  result.score >= 75 && result.score < 95 && "ring-2 ring-green-400",
                  result.score >= 50 && result.score < 75 && "ring-2 ring-blue-400"
                )}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Rank & Score */}
                      <div className="flex flex-col items-center justify-center">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                          index === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
                          index === 1 && "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
                          index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index === 0 ? <Star className="w-6 h-6" /> : index + 1}
                        </div>
                      </div>
                      
                      {/* Breed Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{result.breed.breed_name}</h3>
                            <p className="text-sm text-muted-foreground">{result.breed.origin_country}</p>
                          </div>
                          <Badge className={cn(
                            result.score >= 95 && "bg-yellow-500",
                            result.score >= 75 && result.score < 95 && "bg-green-500",
                            result.score >= 50 && result.score < 75 && "bg-blue-500"
                          )}>
                            {result.score}% Match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{result.matchLabel}</Badge>
                        </div>
                        
                        {/* Reasons */}
                        {result.reasons.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {result.reasons.slice(0, 2).map((reason, i) => (
                              <div key={i} className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 pb-8">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                setCurrentQuestion(0);
                setResults([]);
                setShowDealBreakers(false);
              }}
            >
              Retake Quiz
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length + 1}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!showDealBreakers ? (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{currentQ.title}</h2>
                <p className="text-muted-foreground mt-1">{currentQ.subtitle}</p>
              </div>

              {currentQ.type === 'single' && currentQ.options && (
                <div className="grid gap-3">
                  {currentQ.options.map((option) => (
                    <Card
                      key={option.value}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        answers[currentQ.id] === option.value
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleSingleAnswer(option.value)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          {option.description && (
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2",
                          answers[currentQ.id] === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}>
                          {answers[currentQ.id] === option.value && (
                            <Check className="w-full h-full text-primary-foreground p-0.5" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {currentQ.type === 'slider' && (
                <div className="pt-8 px-4">
                  <div className="text-center mb-8">
                    <span className="text-4xl font-bold text-primary">
                      {currentQ.suffix === ' ₹' 
                        ? (answers[currentQ.id] as number)?.toLocaleString()
                        : answers[currentQ.id]}
                      {currentQ.suffix}
                    </span>
                  </div>
                  <Slider
                    value={[answers[currentQ.id] as number]}
                    min={currentQ.min}
                    max={currentQ.max}
                    step={currentQ.step}
                    onValueChange={handleSliderChange}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>{currentQ.min}{currentQ.suffix}</span>
                    <span>{currentQ.max}{currentQ.suffix}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dealbreakers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Any deal breakers?</h2>
                <p className="text-muted-foreground mt-1">
                  Select traits you absolutely can&apos;t handle
                </p>
              </div>

              <div className="grid gap-3">
                {dealBreakerOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      answers.dealBreakers?.includes(option.value)
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleDealBreakerToggle(option.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="flex-1 font-medium">{option.label}</span>
                      <Checkbox
                        checked={answers.dealBreakers?.includes(option.value)}
                        onCheckedChange={() => handleDealBreakerToggle(option.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>None selected? No problem! We&apos;ll show all matching breeds.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 p-4 bg-background border-t border-border">
        <Button
          variant="outline"
          size="lg"
          onClick={handleBack}
          disabled={currentQuestion === 0 && !showDealBreakers}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex-1"
        >
          {showDealBreakers ? (
            isSubmitting ? (
              'Finding Matches...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Find Matches
              </>
            )
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
