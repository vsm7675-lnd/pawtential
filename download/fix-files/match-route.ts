import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCSV, getTopMatches, QuizAnswers, Breed } from '@/lib/breeds';

let cachedBreeds: Breed[] | null = null;

async function loadBreeds(): Promise<Breed[]> {
  if (cachedBreeds) return cachedBreeds;

  // Try multiple possible locations for the breeds.csv file
  const possiblePaths = [
    path.join(process.cwd(), 'upload', 'breeds.csv'),
    path.join(process.cwd(), 'data', 'breeds.csv'),
    path.join(process.cwd(), 'public', 'breeds.csv'),
  ];

  for (const csvPath of possiblePaths) {
    try {
      const csvText = await fs.readFile(csvPath, 'utf-8');
      if (csvText && csvText.length > 0) {
        console.log(`Match API: Loaded breeds from: ${csvPath}`);
        cachedBreeds = parseCSV(csvText);
        return cachedBreeds;
      }
    } catch (e) {
      console.log(`Match API: Could not load from ${csvPath}, trying next...`);
    }
  }

  console.error('Match API: Could not find breeds.csv in any location!');
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const breeds = await loadBreeds();
    const body = await request.json();
    
    const answers: QuizAnswers = {
      livingSituation: body.livingSituation || '',
      squareFeet: body.squareFeet || 1000,
      activityLevel: body.activityLevel || '',
      experienceLevel: body.experienceLevel || '',
      timeAvailability: body.timeAvailability || 2,
      budget: body.budget || 5000,
      climate: body.climate || '',
      hasKids: body.hasKids || false,
      kidAges: body.kidAges || '',
      hasOtherPets: body.hasOtherPets || false,
      otherPetTypes: body.otherPetTypes || '',
      groomingPreference: body.groomingPreference || '',
      purpose: body.purpose || '',
      dealBreakers: body.dealBreakers || [],
      petType: body.petType || 'dog'
    };

    const matches = getTopMatches(answers, breeds, 10);

    return NextResponse.json({ 
      matches,
      totalBreedsAnalyzed: breeds.length
    });
  } catch (error) {
    console.error('Error matching breeds:', error);
    return NextResponse.json({ error: 'Failed to match breeds' }, { status: 500 });
  }
}
