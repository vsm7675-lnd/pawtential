import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCSV, Breed } from '@/lib/breeds';

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
        console.log(`Loaded breeds from: ${csvPath}`);
        cachedBreeds = parseCSV(csvText);
        return cachedBreeds;
      }
    } catch (e) {
      console.log(`Could not load from ${csvPath}, trying next...`);
    }
  }

  console.error('Could not find breeds.csv in any location!');
  return [];
}

// Minimal breed data for initial load (reduces payload size)
function toMinimalBreed(breed: Breed) {
  return {
    id: breed.id,
    breed_name: breed.breed_name,
    species: breed.species,
    origin_country: breed.origin_country,
    height: breed.height,
    child_friendly: breed.child_friendly,
    energy_level: breed.energy_level,
    grooming: breed.grooming,
    health_issues: breed.health_issues,
    shedding_level: breed.shedding_level,
    adaptability: breed.adaptability,
    heat_tolerance: breed.heat_tolerance,
    avg_total_monthly_cost_inr: breed.avg_total_monthly_cost_inr,
    avg_total_daily_time_hours: breed.avg_total_daily_time_hours,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const breeds = await loadBreeds();

    // Get specific breed by ID - return FULL data
    const id = searchParams.get('id');
    if (id) {
      const breed = breeds.find(b => b.id === id);
      if (breed) {
        return NextResponse.json({ breed });
      }
      return NextResponse.json({ error: 'Breed not found' }, { status: 404 });
    }

    // Check if minimal data requested
    const minimal = searchParams.get('minimal');
    
    // Filter by species
    const species = searchParams.get('species');
    let filtered = breeds;
    if (species) {
      filtered = breeds.filter(b => b.species.toLowerCase() === species.toLowerCase());
    }

    // Search by name
    const search = searchParams.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b => 
        b.breed_name.toLowerCase().includes(searchLower) ||
        b.alt_names.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    const limit = searchParams.get('limit');
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    // Return minimal or full data
    const data = minimal ? filtered.map(toMinimalBreed) : filtered;

    return NextResponse.json({ 
      breeds: data,
      total: breeds.length,
      filtered: filtered.length 
    });
  } catch (error) {
    console.error('Error loading breeds:', error);
    return NextResponse.json({ error: 'Failed to load breeds' }, { status: 500 });
  }
}
