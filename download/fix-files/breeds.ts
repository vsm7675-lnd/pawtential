// Breed data types and utilities
export interface Breed {
  breed_name: string;
  species: string;
  alt_names: string;
  origin_country: string;
  height: string;
  weight: string;
  life_span: string;
  personality_traits: string;
  description: string;
  adaptability: number;
  affection_level: number;
  child_friendly: number;
  dog_friendly: number;
  energy_level: number;
  grooming: number;
  health_issues: number;
  intelligence: number;
  shedding_level: number;
  social_needs: number;
  stranger_friendly: number;
  vocalisation: number;
  hypoallergenic: number;
  wikipedia_url: string;
  senior_friendly: number;
  urban_friendly: number;
  family_compatibility_score: number;
  social_environment_score: number;
  child_friendly_norm: number;
  stranger_friendly_norm: number;
  dog_friendly_norm: number;
  energy_level_norm: number;
  vocalisation_norm: number;
  affection_level_norm: number;
  intelligence_norm: number;
  adaptability_norm: number;
  senior_friendly_norm: number;
  urban_friendly_norm: number;
  senior_friendly_label: string;
  urban_friendly_label: string;
  family_compatibility_label: string;
  social_environment_label: string;
  breed_cluster: string;
  recommendation: string;
  recommendation_confidence: number;
  multi_cluster_membership: string;
  persona_match: string;
  persona_explainability_text: string;
  heat_tolerance: number;
  cold_tolerance: number;
  humidity_tolerance: number;
  all_weather_adaptability: number;
  recommended_climate_types: string;
  dietary_sensitivity_level: number;
  common_food_allergies: string;
  digestion_robustness: number;
  obesity_prone: number;
  recommended_diet_type: string;
  climate_data_source: string;
  diet_data_source: string;
  guardian_note: string;
  avg_monthly_food_cost_inr: number;
  avg_exercise_minutes_daily: number;
  avg_grooming_hours_monthly: number;
  avg_social_interaction_hours_daily: number;
  avg_total_daily_time_hours: number;
  avg_professional_grooming_cost_monthly: number;
  avg_vet_cost_monthly_avg: number;
  avg_total_monthly_cost_inr: number;
  // Computed fields
  id: string;
  images: string[];
  // Raw fields for display
  [key: string]: string | number | string[];
}

export interface QuizAnswers {
  livingSituation: 'apartment' | 'house' | 'farm' | '';
  squareFeet: number;
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'very_active' | '';
  experienceLevel: 'first_time' | 'experienced' | 'expert' | '';
  timeAvailability: number; // hours per day
  budget: number; // monthly budget in INR
  climate: 'hot' | 'moderate' | 'cold' | 'tropical' | '';
  hasKids: boolean;
  kidAges: string;
  hasOtherPets: boolean;
  otherPetTypes: string;
  groomingPreference: 'low' | 'medium' | 'high' | '';
  purpose: 'companion' | 'guard' | 'active' | 'show' | '';
  dealBreakers: string[];
  petType: 'dog' | 'cat' | 'both' | '';
}

export interface MatchResult {
  breed: Breed;
  score: number;
  matchLabel: string;
  matchReasons: string[];
  potentialConcerns: string[];
}

// Parse CSV string to array of objects
export function parseCSV(csvText: string): Breed[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const breeds: Breed[] = [];

  // Normalize header names: lowercase, replace spaces with underscores, remove "avg " prefix
  const normalizeHeader = (h: string): string => {
    let normalized = h.trim().toLowerCase().replace(/\s+/g, '_');
    // Remove "avg_" prefix if present
    if (normalized.startsWith('avg_')) {
      normalized = 'avg_' + normalized.substring(4);
    }
    return normalized;
  };

  const headers = rawHeaders.map(normalizeHeader);

  // Fields that should remain as strings (contain units or ranges)
  const stringFields = ['height', 'weight', 'life_span', 'personality_traits', 'description', 
                        'alt_names', 'origin_country', 'wikipedia_url', 'recommended_climate_types',
                        'common_food_allergies', 'recommended_diet_type', 'guardian_note',
                        'senior_friendly_label', 'urban_friendly_label', 'family_compatibility_label',
                        'social_environment_label', 'breed_cluster', 'recommendation', 
                        'multi_cluster_membership', 'persona_match', 'persona_explainability_text',
                        'climate_data_source', 'diet_data_source'];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    const breed: Record<string, string | number> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Keep certain fields as strings
      if (stringFields.includes(header)) {
        breed[header] = value;
      } else {
        // Try to convert to number if possible
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && value.trim() !== '') {
          breed[header] = numValue;
        } else {
          breed[header] = value;
        }
      }
    });

    // Add computed fields
    breed.id = slugify(breed.breed_name as string);
    breed.images = [];

    breeds.push(breed as unknown as Breed);
  }

  return breeds;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Create URL-friendly ID from breed name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Calculate match score between quiz answers and breed
export function calculateMatchScore(answers: QuizAnswers, breed: Breed): MatchResult {
  let score = 0;
  const matchReasons: string[] = [];
  const potentialConcerns: string[] = [];

  // 1. Living Situation & Urban Friendliness (15 points)
  if (answers.livingSituation === 'apartment') {
    score += breed.urban_friendly_norm * 15;
    if (breed.urban_friendly_norm >= 0.5) {
      matchReasons.push(`Well-suited for ${answers.livingSituation} living`);
    } else {
      potentialConcerns.push('May struggle in apartment settings');
    }
  } else if (answers.livingSituation === 'house') {
    score += 12; // Most breeds work in houses
    if (breed.urban_friendly_norm >= 0.3) {
      matchReasons.push('Good for house living');
    }
  } else if (answers.livingSituation === 'farm') {
    score += breed.energy_level_norm * 10 + 5;
    matchReasons.push('Farm environment provides space to roam');
  }

  // 2. Activity Level Match (15 points)
  const activityScore = getActivityMatchScore(answers.activityLevel, breed);
  score += activityScore.score;
  if (activityScore.positive) matchReasons.push(activityScore.positive);
  if (activityScore.negative) potentialConcerns.push(activityScore.negative);

  // 3. Experience Level (10 points)
  const experienceScore = getExperienceMatchScore(answers.experienceLevel, breed);
  score += experienceScore.score;
  if (experienceScore.positive) matchReasons.push(experienceScore.positive);
  if (experienceScore.negative) potentialConcerns.push(experienceScore.negative);

  // 4. Time Availability vs Needs (15 points)
  const dailyTimeNeeded = breed.avg_total_daily_time_hours;
  if (answers.timeAvailability >= dailyTimeNeeded) {
    score += 15;
    matchReasons.push(`Your schedule fits this breed's needs`);
  } else if (answers.timeAvailability >= dailyTimeNeeded * 0.7) {
    score += 10;
    potentialConcerns.push('May need slightly more time than available');
  } else {
    score += 5;
    potentialConcerns.push('This breed needs more time than you can provide');
  }

  // 5. Budget Match (15 points)
  const monthlyCost = breed.avg_total_monthly_cost_inr;
  if (answers.budget >= monthlyCost) {
    score += 15;
    matchReasons.push('Fits within your budget');
  } else if (answers.budget >= monthlyCost * 0.8) {
    score += 10;
    potentialConcerns.push('Close to budget limit');
  } else {
    score += 3;
    potentialConcerns.push('May exceed your budget');
  }

  // 6. Climate Match (10 points)
  const climateScore = getClimateMatchScore(answers.climate, breed);
  score += climateScore.score;
  if (climateScore.positive) matchReasons.push(climateScore.positive);
  if (climateScore.negative) potentialConcerns.push(climateScore.negative);

  // 7. Family Situation (10 points)
  if (answers.hasKids) {
    score += breed.child_friendly_norm * 10;
    if (breed.child_friendly_norm >= 0.6) {
      matchReasons.push('Great with children');
    } else if (breed.child_friendly_norm < 0.3) {
      potentialConcerns.push('May not be ideal for families with children');
    }
  } else {
    score += 7; // Neutral
  }

  // 8. Grooming Preference (5 points)
  const groomingLevel = breed.grooming;
  if (answers.groomingPreference === 'low' && groomingLevel <= 2) {
    score += 5;
    matchReasons.push('Low grooming needs match your preference');
  } else if (answers.groomingPreference === 'high' && groomingLevel >= 4) {
    score += 5;
    matchReasons.push('You enjoy the grooming this breed needs');
  } else if (answers.groomingPreference === 'medium' && groomingLevel >= 2 && groomingLevel <= 4) {
    score += 5;
  } else if (answers.groomingPreference) {
    score += 2;
    if (groomingLevel >= 4 && answers.groomingPreference === 'low') {
      potentialConcerns.push('High grooming needs');
    }
  } else {
    score += 3;
  }

  // 9. Purpose Match (5 points)
  const purposeScore = getPurposeMatchScore(answers.purpose, breed);
  score += purposeScore.score;
  if (purposeScore.positive) matchReasons.push(purposeScore.positive);

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine label
  let matchLabel: string;
  if (normalizedScore >= 90) matchLabel = 'Perfect Match';
  else if (normalizedScore >= 75) matchLabel = 'Great Match';
  else if (normalizedScore >= 60) matchLabel = 'Good Match';
  else if (normalizedScore >= 50) matchLabel = 'Challenging Match';
  else matchLabel = 'Not Recommended';

  return {
    breed,
    score: Math.round(normalizedScore),
    matchLabel,
    matchReasons,
    potentialConcerns
  };
}

function getActivityMatchScore(activityLevel: string, breed: Breed): { score: number; positive?: string; negative?: string } {
  const energy = breed.energy_level_norm;
  
  switch (activityLevel) {
    case 'sedentary':
      if (energy <= 0.3) return { score: 15, positive: 'Low energy needs match your lifestyle' };
      if (energy <= 0.5) return { score: 8, negative: 'This breed may need more activity than you prefer' };
      return { score: 2, negative: 'High energy breed - needs significant exercise' };
    
    case 'moderate':
      if (energy >= 0.3 && energy <= 0.7) return { score: 15, positive: 'Activity levels well-matched' };
      if (energy < 0.3) return { score: 10, positive: 'This breed is happy with moderate activity' };
      return { score: 8, negative: 'May need extra exercise' };
    
    case 'active':
    case 'very_active':
      if (energy >= 0.6) return { score: 15, positive: 'Perfect for your active lifestyle' };
      if (energy >= 0.4) return { score: 12, positive: 'Good match for active owners' };
      return { score: 8, negative: 'This breed may not keep up with your activity level' };
    
    default:
      return { score: 7 };
  }
}

function getExperienceMatchScore(experience: string, breed: Breed): { score: number; positive?: string; negative?: string } {
  const difficulty = (breed.health_issues + (5 - breed.intelligence_norm * 5) + breed.grooming / 5) / 3;
  
  switch (experience) {
    case 'first_time':
      if (breed.recommendation.toLowerCase().includes('first-time') || difficulty <= 2.5) {
        return { score: 10, positive: 'Suitable for first-time owners' };
      }
      if (difficulty <= 3.5) return { score: 6, negative: 'May need extra research and patience' };
      return { score: 2, negative: 'Not recommended for first-time owners' };
    
    case 'experienced':
      return { score: 8, positive: 'Your experience will help with this breed' };
    
    case 'expert':
      return { score: 10, positive: 'Your expertise opens up all breed options' };
    
    default:
      return { score: 5 };
  }
}

function getClimateMatchScore(climate: string, breed: Breed): { score: number; positive?: string; negative?: string } {
  switch (climate) {
    case 'hot':
      if (breed.heat_tolerance >= 4) return { score: 10, positive: 'Handles hot weather well' };
      if (breed.heat_tolerance >= 3) return { score: 7 };
      return { score: 3, negative: 'May struggle in hot climate' };
    
    case 'cold':
      if (breed.cold_tolerance >= 4) return { score: 10, positive: 'Thrives in cold weather' };
      if (breed.cold_tolerance >= 3) return { score: 7 };
      return { score: 3, negative: 'May need protection in cold climate' };
    
    case 'tropical':
      if (breed.humidity_tolerance >= 4) return { score: 10, positive: 'Handles humidity well' };
      if (breed.humidity_tolerance >= 3) return { score: 7 };
      return { score: 4, negative: 'May struggle in humid conditions' };
    
    case 'moderate':
      return { score: 9, positive: 'Moderate climate suits most breeds' };
    
    default:
      return { score: 5 };
  }
}

function getPurposeMatchScore(purpose: string, breed: Breed): { score: number; positive?: string } {
  if (!purpose) return { score: 3 };
  
  const rec = breed.recommendation.toLowerCase();
  const cluster = breed.breed_cluster.toLowerCase();
  
  switch (purpose) {
    case 'companion':
      if (cluster.includes('family') || rec.includes('companion')) {
        return { score: 5, positive: 'Excellent companion breed' };
      }
      return { score: 3 };
    
    case 'guard':
      if (cluster.includes('guard') || rec.includes('guard')) {
        return { score: 5, positive: 'Natural guardian instincts' };
      }
      return { score: 2 };
    
    case 'active':
      if (cluster.includes('active') || breed.energy_level >= 4) {
        return { score: 5, positive: 'Great for active lifestyles' };
      }
      return { score: 3 };
    
    case 'show':
      return { score: 3 };
    
    default:
      return { score: 3 };
  }
}

// Get top matching breeds
export function getTopMatches(answers: QuizAnswers, breeds: Breed[], limit: number = 5): MatchResult[] {
  // Filter by pet type first
  const filteredBreeds = breeds.filter(breed => {
    if (answers.petType === 'dog') return breed.species === 'Dog';
    if (answers.petType === 'cat') return breed.species === 'Cat';
    return true;
  });

  // Calculate scores for all breeds
  const matches = filteredBreeds
    .map(breed => calculateMatchScore(answers, breed))
    .sort((a, b) => b.score - a.score);

  // First try to get matches with 50%+ score
  let goodMatches = matches.filter(match => match.score >= 50).slice(0, limit);
  
  // If not enough good matches, include lower scored ones (min 30%)
  if (goodMatches.length < 3) {
    goodMatches = matches.filter(match => match.score >= 30).slice(0, limit);
  }
  
  // If still not enough, just return top matches regardless of score
  if (goodMatches.length === 0) {
    goodMatches = matches.slice(0, limit);
  }

  return goodMatches;
}

// Get size category from height
export function getSizeCategory(breed: Breed): 'Small' | 'Medium' | 'Large' | 'Giant' {
  const heightStr = String(breed.height || '');
  const match = heightStr.match(/(\d+)/);
  if (!match) return 'Medium';
  
  const height = parseInt(match[1]);
  if (height < 35) return 'Small';
  if (height < 55) return 'Medium';
  if (height < 70) return 'Large';
  return 'Giant';
}

// Get energy level description
export function getEnergyLevel(breed: Breed): 'Low' | 'Moderate' | 'High' | 'Very High' {
  const energy = breed.energy_level;
  if (energy <= 2) return 'Low';
  if (energy <= 3) return 'Moderate';
  if (energy <= 4) return 'High';
  return 'Very High';
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Get breed image from Wikipedia URL
export function getBreedImageFromWikipedia(breed: Breed): string {
  const wikiUrl = breed.wikipedia_url;
  if (!wikiUrl) {
    return getPlaceholderImage(breed);
  }
  
  // Extract page title from Wikipedia URL
  let title = '';
  if (wikiUrl.includes('wikipedia.org')) {
    const match = wikiUrl.match(/\/wiki\/(.+)$/);
    if (match) {
      title = decodeURIComponent(match[1]);
    }
  }
  
  if (!title) {
    return getPlaceholderImage(breed);
  }
  
  // Use Wikipedia's REST API to get the image
  // Return a URL that points to Wikipedia's thumbnail service
  return `https://en.wikipedia.org/api/rest_v1/page/thumbnail/${encodeURIComponent(title)}`;
}

// Fallback placeholder based on breed name hash
function getPlaceholderImage(breed: Breed): string {
  const hash = breed.breed_name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const placeholders = [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
  ];
  return placeholders[Math.abs(hash) % placeholders.length];
}

export async function loadBreedImageMap(): Promise<Record<string, string>> {
  // No longer needed - images fetched directly from Wikipedia
  return {};
}

export function getBreedImagePath(breed: Breed): string {
  // Generate path from breed name (matches the download script's naming)
  const safeName = breed.breed_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  
  return `/breeds/${safeName}.jpg`;
}

// Get image with fallback support
export function getBreedImageWithFallback(breed: Breed, imageMap: Record<string, string>): string {
  // Check mapping first
  if (imageMap[breed.breed_name]) {
    return imageMap[breed.breed_name];
  }
  
  // Fall back to generated path
  return getBreedImagePath(breed);
}
