'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Breed, MatchResult, QuizAnswers, getSizeCategory, getEnergyLevel, formatCurrency } from '@/lib/breeds'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, X, RotateCcw, Home, Sparkles, GitCompare, Compass, ChevronLeft, ChevronRight,
  Wallet, Clock, Ruler, Zap, Thermometer, AlertTriangle, CheckCircle, Bookmark, Dog, Cat,
  Lightbulb, ArrowRight, Star
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import confetti from 'canvas-confetti'

// Types
type View = 'home' | 'quiz' | 'favorites' | 'compare' | 'explore' | 'profile' | 'results'
type SwipeDirection = 'left' | 'right' | null
type PetPreference = 'dog' | 'cat' | 'both' | null

// Convert breed name to slug (lowercase, spaces to dashes, remove special chars, normalize accents)
function breedToSlug(name: string): string {
  return name.toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove combining marks (accents)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
}

// Breed Image Component - uses local images from /public/images/breeds/
function BreedImage({ breed, className, style }: { breed: Breed; className?: string; style?: React.CSSProperties }) {
  const [imageError, setImageError] = useState(false)
  
  const slug = breedToSlug(breed.breed_name)
  const species = breed.species.toLowerCase() + 's' // 'dogs' or 'cats'
  
  // Try local image first, fallback to placeholder on error
  const localImageSrc = `/images/breeds/${species}/${slug}.jpg`
  
  // Placeholder for fallback
  const placeholderSrc = breed.species === 'Cat'
    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop'
    : 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'
  
  const imageSrc = imageError ? placeholderSrc : localImageSrc
  
  return (
    <img 
      src={imageSrc} 
      alt={breed.breed_name} 
      className={className}
      style={style}
      onError={() => setImageError(true)}
    />
  )
}

// Clean guardian notes - remove special symbols from CSV data
function cleanGuardianNote(note: string): string {
  if (!note) return 'No special warnings for this breed.'
  return note
    // Remove "?? " section markers (they appear at start of sections)
    .replace(/\?\?\s*/g, '')
    // Replace ? followed by digits (currency placeholder like ?1,500)
    .replace(/\?([\d,]+)/g, 'Rs.$1')
    // Remove any remaining stray ? symbols
    .replace(/\?/g, '')
    // Replace rupee symbol if present
    .replace(/[₹]/g, 'Rs.')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Fix double periods or colons
    .replace(/\.\s*\./g, '.')
    .replace(/:\s*:/g, ':')
    // Fix space before colon
    .replace(/\s+:/g, ':')
    // Clean leading/trailing whitespace
    .trim()
    // Capitalize first letter if needed
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase())
}

// Get match label and color
function getMatchInfo(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 90) return { label: 'Perfect Match', color: 'text-green-600', bgColor: 'bg-green-500' }
  if (score >= 75) return { label: 'Great Match', color: 'text-green-600', bgColor: 'bg-green-500' }
  if (score >= 60) return { label: 'Good Match', color: 'text-blue-600', bgColor: 'bg-blue-500' }
  if (score >= 50) return { label: 'Challenging', color: 'text-yellow-600', bgColor: 'bg-yellow-500' }
  return { label: 'Not Recommended', color: 'text-red-600', bgColor: 'bg-red-500' }
}

// Main App Component
export default function BreedFinderApp() {
  const [view, setView] = useState<View>('home')
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null)
  const [compareList, setCompareList] = useState<string[]>([])
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Partial<QuizAnswers>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [undoStack, setUndoStack] = useState<{ breed: Breed; direction: SwipeDirection }[]>([])
  const [petPreference, setPetPreference] = useState<PetPreference>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const { toast } = useToast()

  // Load data on mount
  useEffect(() => {
    // Fallback timeout - stop loading after 10 seconds max
    const timeout = setTimeout(() => {
      console.log('Timeout - forcing load')
      setLoading(false)
    }, 10000)
    
    // Request minimal data first for faster loading
    fetch('/api/breeds?minimal=true')
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeout)
        console.log('Loaded breeds:', data.breeds?.length)
        setBreeds(data.breeds || [])
        setLoading(false)
      })
      .catch(err => {
        clearTimeout(timeout)
        console.error('Fetch error:', err)
        setLoading(false)
      })
    
    // Load saved data from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const savedFavs = localStorage.getItem('breed-favorites')
        if (savedFavs) setFavorites(JSON.parse(savedFavs))
        const savedNotes = localStorage.getItem('breed-notes')
        if (savedNotes) setNotes(JSON.parse(savedNotes))
      } catch (e) {}
    }
    
    return () => clearTimeout(timeout)
  }, [])

  // Fetch full breed data when viewing profile
  useEffect(() => {
    if (!selectedBreed || view !== 'profile') return
    
    // Check if breed already has full data (has description field)
    if ((selectedBreed as any).description) return
    
    setLoadingProfile(true)
    fetch(`/api/breeds?id=${selectedBreed.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.breed) {
          setSelectedBreed(data.breed)
        }
      })
      .catch(err => console.error('Profile fetch error:', err))
      .finally(() => setLoadingProfile(false))
  }, [selectedBreed?.id, view])

  // Save favorites
  useEffect(() => {
    try { localStorage.setItem('breed-favorites', JSON.stringify(favorites)) } catch (e) {}
  }, [favorites])

  useEffect(() => {
    try { localStorage.setItem('breed-notes', JSON.stringify(notes)) } catch (e) {}
  }, [notes])

  // Swipe handlers
  const handleSwipe = (direction: 'left' | 'right') => {
    const currentBreed = getFilteredBreeds()[currentIndex]
    if (!currentBreed) return

    setSwipeDirection(direction)
    
    if (direction === 'right') {
      setFavorites(prev => {
        if (!prev.includes(currentBreed.id)) {
          toast({ title: 'Added to Favorites!', description: `${currentBreed.breed_name} saved` })
          return [...prev, currentBreed.id]
        }
        return prev
      })
      setUndoStack(prev => [...prev, { breed: currentBreed, direction: 'right' }])
    } else {
      setUndoStack(prev => [...prev, { breed: currentBreed, direction: 'left' }])
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handleUndo = () => {
    const lastAction = undoStack[undoStack.length - 1]
    if (!lastAction) return
    setUndoStack(prev => prev.slice(0, -1))
    setCurrentIndex(prev => prev - 1)
    if (lastAction.direction === 'right') {
      setFavorites(prev => prev.filter(id => id !== lastAction.breed.id))
    }
  }

  // Filter breeds by pet preference
  const getFilteredBreeds = () => {
    if (!petPreference || petPreference === 'both') return breeds
    return breeds.filter(b => b.species.toLowerCase() === petPreference)
  }

  const filteredBreeds = getFilteredBreeds()
  const favoriteBreeds = breeds.filter(b => favorites.includes(b.id))
  const currentBreed = filteredBreeds[currentIndex]

  // Quiz state
  const [quizPage, setQuizPage] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Partial<QuizAnswers>>({
    petType: 'dog'
  })
  const questionsPerPage = 4

  const quizQuestions = [
    { title: "Living situation?", subtitle: "This helps find breeds suited to your space", field: 'livingSituation', type: 'choice', options: [
      { value: 'apartment', label: 'Apartment', icon: '🏢' },
      { value: 'house', label: 'House with yard', icon: '🏠' },
      { value: 'farm', label: 'Farm/Large property', icon: '🌾' },
    ]},
    { title: "Activity level?", subtitle: "Some breeds need lots of exercise, others are couch potatoes", field: 'activityLevel', type: 'choice', options: [
      { value: 'sedentary', label: 'Sedentary', desc: 'Mostly indoors, light walks' },
      { value: 'moderate', label: 'Moderate', desc: 'Daily walks, occasional runs' },
      { value: 'active', label: 'Active', desc: 'Regular runs, hiking' },
      { value: 'very_active', label: 'Very Active', desc: 'Daily intense exercise' },
    ]},
    { title: "Experience with pets?", subtitle: "Some breeds need experienced handlers", field: 'experienceLevel', type: 'choice', options: [
      { value: 'first_time', label: 'First-time owner' },
      { value: 'experienced', label: 'Had pets before' },
      { value: 'expert', label: 'Expert/Professional' },
    ]},
    { title: "Daily hours for pet care?", subtitle: "Includes exercise, grooming, playtime", field: 'timeAvailability', type: 'slider', min: 0.5, max: 6, step: 0.5, unit: 'hrs' },
    { title: "Monthly budget?", subtitle: "Includes food, grooming, vet, supplies", field: 'budget', type: 'slider', min: 3000, max: 20000, step: 1000, unit: '₹' },
    { title: "Your climate?", subtitle: "Some breeds struggle in extreme weather", field: 'climate', type: 'choice', options: [
      { value: 'hot', label: 'Hot', desc: 'Summers above 40°C', icon: '☀️' },
      { value: 'moderate', label: 'Moderate', icon: '🌤️' },
      { value: 'cold', label: 'Cold', desc: 'Winters near freezing', icon: '❄️' },
      { value: 'tropical', label: 'Tropical', desc: 'Humid conditions', icon: '🌴' },
    ]},
    { title: "Have children?", subtitle: "Some breeds are better with kids", field: 'hasKids', type: 'boolean' },
    { title: "Grooming preference?", subtitle: "Some breeds need daily brushing, professional grooming", field: 'groomingPreference', type: 'choice', options: [
      { value: 'low', label: 'Low', desc: 'Minimal grooming' },
      { value: 'medium', label: 'Medium', desc: 'Weekly brushing' },
      { value: 'high', label: 'High', desc: 'Daily grooming OK' },
    ]},
    { title: "Primary purpose?", subtitle: "What role will your pet play?", field: 'purpose', type: 'choice', options: [
      { value: 'companion', label: 'Family Companion', icon: '❤️' },
      { value: 'guard', label: 'Guard Dog', icon: '🛡️' },
      { value: 'active', label: 'Active Partner', icon: '🏃' },
    ]},
    { title: "Deal-breakers?", subtitle: "Select all that apply", field: 'dealBreakers', type: 'multiselect', options: [
      { value: 'shedding', label: 'Excessive shedding' },
      { value: 'barking', label: 'Excessive barking' },
      { value: 'drooling', label: 'Drooling' },
      { value: 'health_issues', label: 'Known health issues' },
      { value: 'high_energy', label: 'High energy needs' },
    ]},
    { title: "Looking for?", subtitle: "Dog, cat, or both?", field: 'petType', type: 'choice', options: [
      { value: 'dog', label: 'Dog', icon: '🐕' },
      { value: 'cat', label: 'Cat', icon: '🐱' },
      { value: 'both', label: 'Open to both', icon: '🐾' },
    ]},
  ]

  const totalPages = Math.ceil(quizQuestions.length / questionsPerPage)
  const currentPageQuestions = quizQuestions.slice(quizPage * questionsPerPage, (quizPage + 1) * questionsPerPage)

  const handleQuizComplete = async () => {
    try {
      console.log('Quiz answers:', localAnswers)
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localAnswers)
      })
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('Match results:', data.matches?.length, 'total analyzed:', data.totalBreedsAnalyzed)
      
      if (!data.matches || data.matches.length === 0) {
        toast({ 
          title: 'No matches found', 
          description: 'Try adjusting your preferences in the quiz.',
          variant: 'destructive'
        })
      } else {
        setMatchResults(data.matches)
        setView('results')
        if (data.matches[0]?.score >= 90) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        }
      }
    } catch (error) {
      console.error('Match error:', error)
      toast({ 
        title: 'Error finding matches', 
        description: 'Please check your connection and try again.',
        variant: 'destructive'
      })
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading BreedFinder...</p>
          <p className="text-xs text-gray-400 mt-2">If stuck, check browser console (F12)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            
            {/* HOME VIEW - What are you looking for? */}
            {view === 'home' && !petPreference && (
              <div className="p-4 min-h-screen flex flex-col">
                <header className="text-center py-8">
                  <div className="text-6xl mb-4">🐾</div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">BreedFinder</h1>
                  <p className="text-gray-600">Find your perfect pet companion</p>
                </header>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                  <h2 className="text-xl font-semibold text-center mb-6">What are you looking for?</h2>
                  
                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => setPetPreference('dog')}
                      className="w-full p-6 rounded-2xl border-2 border-emerald-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4"
                    >
                      <span className="text-5xl">🐕</span>
                      <div className="text-left">
                        <div className="text-xl font-bold text-gray-800">Dog</div>
                        <div className="text-sm text-gray-500">Loyal companions & friends</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-emerald-500 ml-auto" />
                    </button>
                    
                    <button
                      onClick={() => setPetPreference('cat')}
                      className="w-full p-6 rounded-2xl border-2 border-emerald-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4"
                    >
                      <span className="text-5xl">🐱</span>
                      <div className="text-left">
                        <div className="text-xl font-bold text-gray-800">Cat</div>
                        <div className="text-sm text-gray-500">Independent & affectionate</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-emerald-500 ml-auto" />
                    </button>
                    
                    <button
                      onClick={() => setPetPreference('both')}
                      className="w-full p-6 rounded-2xl border-2 border-emerald-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4"
                    >
                      <span className="text-5xl">🐾</span>
                      <div className="text-left">
                        <div className="text-xl font-bold text-gray-800">Both</div>
                        <div className="text-sm text-gray-500">I'm open to either</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-emerald-500 ml-auto" />
                    </button>
                  </div>

                  <Button 
                    onClick={() => setView('quiz')} 
                    className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Take the Smart Quiz
                  </Button>
                </div>
              </div>
            )}

            {/* HOME VIEW - Swipeable Cards */}
            {view === 'home' && petPreference && (
              <div className="p-4">
                <header className="flex items-center justify-between mb-4">
                  <button onClick={() => setPetPreference(null)} className="text-gray-600 text-sm flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <h1 className="text-lg font-bold text-gray-800">
                    {petPreference === 'dog' ? '🐕 Dogs' : petPreference === 'cat' ? '🐱 Cats' : '🐾 All Pets'}
                  </h1>
                  <div className="w-16"></div>
                </header>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : currentIndex >= filteredBreeds.length ? (
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">🐾</div>
                    <h2 className="text-xl font-bold mb-2">You've seen all breeds!</h2>
                    <Button onClick={handleUndo} className="bg-emerald-600">Start Over</Button>
                  </div>
                ) : currentBreed && (
                  <div className="max-w-sm mx-auto">
                    {/* Card - simple border, no score shown in explore mode */}
                    <Card className="overflow-hidden shadow-xl border-2 border-emerald-200">
                      <div className="relative h-48">
                        <BreedImage breed={currentBreed} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-gray-800 px-3 py-1">
                            {getSizeCategory(currentBreed)}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h2 className="text-xl font-bold text-gray-800">{currentBreed.breed_name}</h2>
                            <p className="text-sm text-gray-500">{currentBreed.origin_country}</p>
                          </div>
                          <Badge variant="outline">{getSizeCategory(currentBreed)}</Badge>
                        </div>

                        {/* Pros */}
                        <div className="space-y-1 mb-3">
                          {currentBreed.child_friendly >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" /> Great with children
                            </div>
                          )}
                          {currentBreed.adaptability >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" /> Highly adaptable
                            </div>
                          )}
                          {currentBreed.heat_tolerance >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" /> Handles heat well
                            </div>
                          )}
                        </div>

                        {/* Cons */}
                        <div className="space-y-1 mb-4">
                          {currentBreed.energy_level >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertTriangle className="w-4 h-4" /> High exercise needs
                            </div>
                          )}
                          {currentBreed.shedding_level >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertTriangle className="w-4 h-4" /> Heavy shedding
                            </div>
                          )}
                          {currentBreed.health_issues >= 4 && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertTriangle className="w-4 h-4" /> Prone to health issues
                            </div>
                          )}
                        </div>

                        {/* Cost & Time */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xl font-bold text-emerald-700">{formatCurrency(currentBreed.avg_total_monthly_cost_inr)}</div>
                            <div className="text-xs text-gray-500">per month</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-emerald-700">{currentBreed.avg_total_daily_time_hours}h</div>
                            <div className="text-xs text-gray-500">per day</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => { setSelectedBreed(currentBreed); setView('profile') }}>
                            View Profile
                          </Button>
                          <Button 
                            variant="outline" 
                            className="px-3"
                            onClick={() => {
                              if (compareList.includes(currentBreed.id)) {
                                setCompareList(prev => prev.filter(id => id !== currentBreed.id))
                              } else if (compareList.length < 4) {
                                setCompareList(prev => [...prev, currentBreed.id])
                                toast({ title: 'Added to Compare' })
                              }
                            }}
                          >
                            <GitCompare className={`w-4 h-4 ${compareList.includes(currentBreed.id) ? 'text-emerald-600' : ''}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Swipe Buttons */}
                    <div className="flex justify-center items-center gap-6 py-4">
                      <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-2 border-red-300 text-red-500 hover:bg-red-50" onClick={() => handleSwipe('left')}>
                        <X className="w-7 h-7" />
                      </Button>
                      <Button variant="outline" size="icon" className={`w-12 h-12 rounded-full ${undoStack.length > 0 ? '' : 'opacity-30'}`} onClick={handleUndo} disabled={undoStack.length === 0}>
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-2 border-green-300 text-green-500 hover:bg-green-50" onClick={() => handleSwipe('right')}>
                        <Heart className="w-7 h-7" />
                      </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500">{currentIndex + 1} of {filteredBreeds.length}</div>
                  </div>
                )}

                {/* Compare Button */}
                {compareList.length >= 2 && (
                  <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto">
                    <Button 
                      onClick={() => setView('compare')} 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
                    >
                      <GitCompare className="w-5 h-5 mr-2" />
                      Compare {compareList.length} Breeds
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* QUIZ VIEW */}
            {view === 'quiz' && (
              <div className="p-4">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Page {quizPage + 1} of {totalPages}</span>
                    <span>{Math.round(((quizPage + 1) / totalPages) * 100)}%</span>
                  </div>
                  <Progress value={((quizPage + 1) / totalPages) * 100} className="h-2" />
                </div>

                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="space-y-6 pr-4">
                    {currentPageQuestions.map((q, idx) => (
                      <div key={q.field} className="bg-white rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-1">{q.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{q.subtitle}</p>

                        {q.type === 'choice' && (
                          <div className="space-y-2">
                            {q.options?.map((opt: any) => (
                              <button
                                key={opt.value}
                                onClick={() => setLocalAnswers(prev => ({ ...prev, [q.field]: opt.value }))}
                                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                                  localAnswers[q.field as keyof QuizAnswers] === opt.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {opt.icon && <span className="text-2xl">{opt.icon}</span>}
                                <div className="flex-1">
                                  <div className="font-medium">{opt.label}</div>
                                  {opt.desc && <div className="text-xs text-gray-500">{opt.desc}</div>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {q.type === 'slider' && (
                          <div className="px-2">
                            <div className="text-3xl font-bold text-emerald-600 text-center mb-4">
                              {q.unit === '₹' ? '₹' : ''}{localAnswers[q.field as keyof QuizAnswers] ?? q.min}{q.unit === 'hrs' ? ' hours' : ''}
                            </div>
                            <Slider
                              value={[(localAnswers[q.field as keyof QuizAnswers] as number) ?? (q.min || 0)]}
                              onValueChange={([v]) => setLocalAnswers(prev => ({ ...prev, [q.field]: v }))}
                              min={q.min || 0}
                              max={q.max || 100}
                              step={q.step || 1}
                            />
                          </div>
                        )}

                        {q.type === 'boolean' && (
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => setLocalAnswers(prev => ({ ...prev, [q.field]: true }))} 
                              className="flex-1" 
                              variant={localAnswers[q.field as keyof QuizAnswers] === true ? 'default' : 'outline'}
                            >
                              Yes
                            </Button>
                            <Button 
                              onClick={() => setLocalAnswers(prev => ({ ...prev, [q.field]: false }))} 
                              className="flex-1" 
                              variant={localAnswers[q.field as keyof QuizAnswers] === false ? 'default' : 'outline'}
                            >
                              No
                            </Button>
                          </div>
                        )}

                        {q.type === 'multiselect' && (
                          <div className="space-y-2">
                            {q.options?.map((opt: any) => {
                              const selected = ((localAnswers.dealBreakers as string[]) || []).includes(opt.value)
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    const current = (localAnswers.dealBreakers as string[]) || []
                                    setLocalAnswers(prev => ({
                                      ...prev,
                                      dealBreakers: selected ? current.filter(v => v !== opt.value) : [...current, opt.value]
                                    }))
                                  }}
                                  className={`w-full p-3 rounded-xl border-2 text-left flex justify-between ${
                                    selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                                  }`}
                                >
                                  {opt.label}
                                  <Checkbox checked={selected} />
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Navigation */}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => quizPage > 0 ? setQuizPage(quizPage - 1) : setView('home')} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> {quizPage > 0 ? 'Previous' : 'Back'}
                  </Button>
                  <Button
                    onClick={() => quizPage < totalPages - 1 ? setQuizPage(quizPage + 1) : handleQuizComplete()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {quizPage === totalPages - 1 ? 'Find My Matches' : 'Next'}
                    {quizPage < totalPages - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            )}

            {/* RESULTS VIEW */}
            {view === 'results' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold text-center mb-2">Your Perfect Matches!</h1>
                <p className="text-center text-gray-600 mb-4">Based on your answers</p>
                
                {matchResults.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">🐕</div>
                    <p className="text-gray-600 mb-2">No matches found with your criteria.</p>
                    <p className="text-gray-500 text-sm mb-4">Try adjusting your preferences in the quiz.</p>
                    <Button onClick={() => { setQuizPage(0); setView('quiz') }} className="bg-emerald-600">Retake Quiz</Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {matchResults.map((result, i) => {
                        const matchInfo = getMatchInfo(result.score)
                        return (
                          <Card 
                            key={result.breed.id} 
                            className={`overflow-hidden cursor-pointer border-2 ${
                              result.score >= 75 ? 'border-green-400 bg-green-50' :
                              result.score >= 50 ? 'border-yellow-400 bg-yellow-50' : 'border-orange-400 bg-orange-50'
                            }`}
                            onClick={() => { setSelectedBreed(result.breed); setView('profile') }}
                          >
                            <div className="flex">
                              <BreedImage breed={result.breed} className="w-24 h-24 object-cover" />
                              <div className="flex-1 p-3">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold">{result.breed.breed_name}</h3>
                                  <Badge className={matchInfo.bgColor}>{result.score}%</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{matchInfo.label}</p>
                                {result.matchReasons[0] && (
                                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> {result.matchReasons[0]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                    <Button onClick={() => { setQuizPage(0); setView('quiz') }} variant="outline" className="w-full mt-4">Retake Quiz</Button>
                  </>
                )}
              </div>
            )}

            {/* FAVORITES VIEW */}
            {view === 'favorites' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">My Favorites</h1>
                {favoriteBreeds.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">💔</div>
                    <p className="text-gray-600">No favorites yet. Swipe right to add!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {favoriteBreeds.map(breed => (
                        <Card key={breed.id} className="overflow-hidden cursor-pointer" onClick={() => { setSelectedBreed(breed); setView('profile') }}>
                          <BreedImage breed={breed} className="w-full h-32 object-cover" />
                          <CardContent className="p-2">
                            <h3 className="font-medium text-sm truncate">{breed.breed_name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="outline" className="text-xs">{getSizeCategory(breed)}</Badge>
                              <Checkbox 
                                checked={compareList.includes(breed.id)} 
                                onCheckedChange={(checked) => {
                                  if (checked && compareList.length < 4) {
                                    setCompareList(prev => [...prev, breed.id])
                                  } else {
                                    setCompareList(prev => prev.filter(id => id !== breed.id))
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {compareList.length >= 2 && (
                      <Button onClick={() => setView('compare')} className="w-full mt-4 bg-emerald-600">
                        Compare {compareList.length} Breeds
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* COMPARE VIEW */}
            {view === 'compare' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-emerald-600" />
                  Compare Breeds
                </h1>

                {compareList.length < 2 ? (
                  <div className="text-center p-6">
                    <p className="text-gray-600 mb-4">Select 2-4 breeds from Favorites to compare</p>
                    <Button onClick={() => setView('favorites')} variant="outline">Go to Favorites</Button>
                  </div>
                ) : (
                  <>
                    {/* Breed Headers */}
                    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `100px repeat(${compareList.length}, 1fr)` }}>
                      <div></div>
                      {compareList.map(id => {
                        const breed = breeds.find(b => b.id === id)
                        if (!breed) return null
                        return (
                          <div key={id} className="text-center">
                            <BreedImage breed={breed} className="w-full h-16 object-cover rounded-lg mb-1" />
                            <div className="text-xs font-medium truncate">{breed.breed_name}</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Comparison Grid */}
                    <div className="space-y-2">
                      {[
                        { label: 'Size', key: 'size', get: (b: Breed) => ({ value: getSizeCategory(b), color: 'text-gray-700' }) },
                        { label: 'Cost/mo', key: 'cost', get: (b: Breed) => ({ value: formatCurrency(b.avg_total_monthly_cost_inr), color: 'text-gray-700' }) },
                        { label: 'Time/day', key: 'time', get: (b: Breed) => ({ value: `${b.avg_total_daily_time_hours}h`, color: 'text-gray-700' }) },
                        { label: 'Climate', key: 'climate', get: (b: Breed) => ({ 
                          value: b.heat_tolerance >= 4 ? 'Great' : b.heat_tolerance >= 3 ? 'Good' : 'Poor',
                          color: b.heat_tolerance >= 4 ? 'text-green-600' : b.heat_tolerance >= 3 ? 'text-yellow-600' : 'text-red-600'
                        }) },
                        { label: 'Kid-Safe', key: 'kids', get: (b: Breed) => ({ 
                          value: '★'.repeat(b.child_friendly) + '☆'.repeat(5 - b.child_friendly),
                          color: b.child_friendly >= 4 ? 'text-green-600' : b.child_friendly >= 3 ? 'text-yellow-600' : 'text-red-600'
                        }) },
                        { label: 'Energy', key: 'energy', get: (b: Breed) => ({ value: `${b.energy_level}/5`, color: 'text-gray-700' }) },
                        { label: 'Grooming', key: 'grooming', get: (b: Breed) => ({ value: `${b.grooming}/5`, color: 'text-gray-700' }) },
                      ].map(metric => (
                        <div key={metric.key} className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${compareList.length}, 1fr)` }}>
                          <div className="bg-emerald-700 text-white p-2 rounded-lg text-sm font-medium">{metric.label}</div>
                          {compareList.map(id => {
                            const breed = breeds.find(b => b.id === id)
                            if (!breed) return <div key={id} className="bg-gray-100 p-2 rounded-lg">-</div>
                            const result = metric.get(breed)
                            return (
                              <div key={id} className="bg-gray-50 p-2 rounded-lg text-center">
                                <span className={`text-sm font-medium ${result.color}`}>{result.value}</span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Smart Insight */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-blue-800">Smart Insight</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {compareList.length >= 2 && (() => {
                          const b1 = breeds.find(b => b.id === compareList[0])
                          const b2 = breeds.find(b => b.id === compareList[1])
                          if (!b1 || !b2) return ''
                          const costDiff = Math.abs(b1.avg_total_monthly_cost_inr - b2.avg_total_monthly_cost_inr)
                          if (b1.avg_total_monthly_cost_inr < b2.avg_total_monthly_cost_inr) {
                            return `${b1.breed_name} is more budget-friendly at ${formatCurrency(b1.avg_total_monthly_cost_inr)}/mo compared to ${b2.breed_name} at ${formatCurrency(b2.avg_total_monthly_cost_inr)}/mo.`
                          }
                          return `${b1.breed_name} costs ${formatCurrency(b1.avg_total_monthly_cost_inr)}/mo while ${b2.breed_name} costs ${formatCurrency(b2.avg_total_monthly_cost_inr)}/mo. Consider your budget and lifestyle needs.`
                        })()}
                      </p>
                    </div>

                    <Button onClick={() => setCompareList([])} variant="outline" className="w-full mt-4">Clear Selection</Button>
                  </>
                )}
              </div>
            )}

            {/* EXPLORE VIEW */}
            {view === 'explore' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Explore Breeds</h1>
                <p className="text-gray-500 text-sm mb-4">Browse all {breeds.length} breeds. Take the Quiz to find your perfect match!</p>
                <Input placeholder="Search breeds..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mb-4" />
                
                {breeds.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-600 mb-2">Loading breeds...</p>
                    <Button onClick={() => {
                      setLoading(true)
                      fetch('/api/breeds?minimal=true')
                        .then(res => res.json())
                        .then(data => {
                          setBreeds(data.breeds || [])
                          setLoading(false)
                        })
                        .catch(err => {
                          console.error('Retry error:', err)
                          setLoading(false)
                        })
                    }} variant="outline">Retry Loading</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {breeds.filter(b => b.breed_name.toLowerCase().includes(searchQuery.toLowerCase())).map(breed => (
                      <Card key={breed.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedBreed(breed); setView('profile') }}>
                        <BreedImage breed={breed} className="w-full h-28 object-cover" />
                        <CardContent className="p-2">
                          <h3 className="font-medium text-sm truncate">{breed.breed_name}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">{getSizeCategory(breed)}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {breed.origin_country}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {breeds.length > 0 && breeds.filter(b => b.breed_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center p-6">
                    <p className="text-gray-500">No breeds found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE VIEW */}
            {view === 'profile' && selectedBreed && (
              <div>
                <div className="relative h-64">
                  <BreedImage breed={selectedBreed} className="w-full h-full object-cover" />
                  <button onClick={() => setView('home')} className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setFavorites(prev => prev.includes(selectedBreed.id) ? prev.filter(id => id !== selectedBreed.id) : [...prev, selectedBreed.id])} 
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow"
                  >
                    <Heart className={`w-6 h-6 ${favorites.includes(selectedBreed.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4">
                    <h1 className="text-2xl font-bold text-white">{selectedBreed.breed_name}</h1>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-white/90 text-gray-800">{getSizeCategory(selectedBreed)}</Badge>
                      <Badge className="bg-white/90 text-gray-800">{selectedBreed.origin_country}</Badge>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="p-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="diet">Diet</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <Card><CardContent className="p-4">
                      <h3 className="font-bold mb-2">About</h3>
                      <p className="text-gray-600 text-sm">{selectedBreed.description}</p>
                      <Separator className="my-4" />
                      <h3 className="font-bold mb-3">Traits</h3>
                      <div className="space-y-2">
                        {[
                          { label: 'Adaptability', value: selectedBreed.adaptability },
                          { label: 'Affection Level', value: selectedBreed.affection_level },
                          { label: 'Energy Level', value: selectedBreed.energy_level },
                          { label: 'Intelligence', value: selectedBreed.intelligence },
                          { label: 'Child Friendly', value: selectedBreed.child_friendly },
                        ].map(t => (
                          <div key={t.label}>
                            <div className="flex justify-between text-sm"><span>{t.label}</span><span>{t.value}/5</span></div>
                            <Progress value={t.value * 20} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent></Card>
                  </TabsContent>

                  <TabsContent value="costs" className="mt-4">
                    <Card><CardContent className="p-4">
                      <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-600" /> Monthly Costs</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">Food</span><span>{formatCurrency(selectedBreed.avg_monthly_food_cost_inr)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Grooming</span><span>{formatCurrency(selectedBreed.avg_professional_grooming_cost_monthly)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Vet (avg)</span><span>{formatCurrency(selectedBreed.avg_vet_cost_monthly_avg)}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg"><span>Total Monthly</span><span className="text-emerald-600">{formatCurrency(selectedBreed.avg_total_monthly_cost_inr)}</span></div>
                        <div className="flex justify-between text-sm text-gray-500"><span>Estimated Annual</span><span>{formatCurrency(selectedBreed.avg_total_monthly_cost_inr * 12)}</span></div>
                      </div>
                      <Separator className="my-4" />
                      <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" /> Time Commitment</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">Daily Exercise</span><span>{selectedBreed.avg_exercise_minutes_daily} min</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Daily Social Time</span><span>{selectedBreed.avg_social_interaction_hours_daily} hrs</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Monthly Grooming</span><span>{selectedBreed.avg_grooming_hours_monthly} hrs</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold"><span>Total Daily</span><span>{selectedBreed.avg_total_daily_time_hours} hrs</span></div>
                      </div>
                    </CardContent></Card>
                  </TabsContent>

                  <TabsContent value="diet" className="mt-4">
                    <Card><CardContent className="p-4">
                      <h3 className="font-bold mb-3">Dietary Information</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Sensitivity Level</div>
                          <Progress value={selectedBreed.dietary_sensitivity_level * 20} className="h-3" />
                          <div className="text-right text-sm mt-1">{selectedBreed.dietary_sensitivity_level}/5</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Obesity Risk</div>
                          <Progress value={selectedBreed.obesity_prone * 20} className="h-3" />
                          <div className="text-right text-sm mt-1">{selectedBreed.obesity_prone}/5</div>
                        </div>
                        {selectedBreed.common_food_allergies && (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Common Allergies</div>
                            <p className="text-gray-800">{selectedBreed.common_food_allergies}</p>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Recommended Diet</div>
                          <p className="text-gray-800">{selectedBreed.recommended_diet_type}</p>
                        </div>
                      </div>
                    </CardContent></Card>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4">
                    <Card className="border-yellow-200 bg-yellow-50"><CardContent className="p-4">
                      <h3 className="font-bold mb-2 flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="w-5 h-5" /> Guardian Notes
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{cleanGuardianNote(selectedBreed.guardian_note)}</p>
                    </CardContent></Card>
                    
                    <Card className="mt-4"><CardContent className="p-4">
                      <h3 className="font-bold mb-3">Climate Tolerance</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Thermometer className="w-5 h-5 mx-auto mb-1 text-red-500" />
                          <div className="text-xs text-gray-500">Heat</div>
                          <div className="font-medium">{selectedBreed.heat_tolerance}/5</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Thermometer className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-xs text-gray-500">Cold</div>
                          <div className="font-medium">{selectedBreed.cold_tolerance}/5</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Thermometer className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <div className="text-xs text-gray-500">Humidity</div>
                          <div className="font-medium">{selectedBreed.humidity_tolerance}/5</div>
                        </div>
                      </div>
                    </CardContent></Card>

                    <Card className="mt-4"><CardContent className="p-4">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-emerald-600" /> My Notes
                      </h3>
                      <textarea
                        value={notes[selectedBreed.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [selectedBreed.id]: e.target.value }))}
                        placeholder="Add your personal notes about this breed..."
                        className="w-full h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </CardContent></Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {[
            { id: 'home' as View, icon: Home, label: 'Home' },
            { id: 'quiz' as View, icon: Sparkles, label: 'Quiz' },
            { id: 'favorites' as View, icon: Heart, label: 'Favorites', count: favorites.length },
            { id: 'compare' as View, icon: GitCompare, label: 'Compare', count: compareList.length },
            { id: 'explore' as View, icon: Compass, label: 'Explore' },
          ].map(({ id, icon: Icon, label, count }) => (
            <button key={id} onClick={() => setView(id)} className={`flex flex-col items-center justify-center w-16 h-14 relative ${view === id ? 'text-emerald-600' : 'text-gray-500'}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{label}</span>
              {count && count > 0 && (
                <span className="absolute top-1 right-2 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
