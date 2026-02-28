import { NextRequest, NextResponse } from 'next/server';

// Wikipedia API to get page images
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const breedName = searchParams.get('breed');
  const wikiUrl = searchParams.get('url');

  if (!breedName && !wikiUrl) {
    return NextResponse.json({ error: 'Missing breed name or url' }, { status: 400 });
  }

  try {
    // Try to get image from Wikipedia API
    let pageTitle: string = breedName || '';
    
    // If we have a Wikipedia URL, extract the page title
    if (wikiUrl && wikiUrl.includes('wikipedia.org')) {
      const urlParts = wikiUrl.split('/');
      pageTitle = decodeURIComponent(urlParts[urlParts.length - 1]).replace(/_/g, ' ');
    }

    // Use Wikipedia API to get page images
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'BreedFinderApp/1.0 (https://breedfinder.app)'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.originalimage?.source) {
        return NextResponse.json({ 
          image: data.originalimage.source,
          thumbnail: data.thumbnail?.source || data.originalimage.source,
          description: data.description,
          source: 'wikipedia'
        });
      }
      
      if (data.thumbnail?.source) {
        return NextResponse.json({ 
          image: data.thumbnail.source,
          thumbnail: data.thumbnail.source,
          description: data.description,
          source: 'wikipedia'
        });
      }
    }

    // Fallback: Try alternative breed name formats
    const altNames: string[] = [
      pageTitle,
      pageTitle.replace(' (dog)', '').replace(' (cat)', ''),
      `${pageTitle} dog`,
      `${pageTitle} (dog breed)`
    ];

    for (const name of altNames) {
      const altUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
      const altResponse = await fetch(altUrl, {
        headers: { 'User-Agent': 'BreedFinderApp/1.0' }
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData.originalimage?.source || altData.thumbnail?.source) {
          return NextResponse.json({ 
            image: altData.originalimage?.source || altData.thumbnail?.source,
            thumbnail: altData.thumbnail?.source,
            description: altData.description,
            source: 'wikipedia'
          });
        }
      }
    }

    return NextResponse.json({ 
      error: 'No image found',
      fallback: getFallbackImage(breedName || '')
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch image',
      fallback: getFallbackImage(breedName || '')
    });
  }
}

// Fallback to curated dog images
function getFallbackImage(breedName: string): string {
  const fallbackImages: Record<string, string> = {
    'labrador': 'https://images.unsplash.com/photo-1579213838058-fcc93cd8b003?w=800',
    'golden retriever': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
    'german shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800',
    'bulldog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
    'poodle': 'https://images.unsplash.com/photo-1614568151344-4ca2e8a7f6de?w=800',
    'beagle': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800',
    'rottweiler': 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=800',
    'yorkshire terrier': 'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800',
    'boxer': 'https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=800',
    'siberian husky': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800',
    'dachshund': 'https://images.unsplash.com/photo-1612195583950-b89e8e259b46?w=800',
    'great dane': 'https://images.unsplash.com/photo-1568607689150-17e625c1586e?w=800',
    'doberman': 'https://images.unsplash.com/photo-1554692901-e16f2046918a?w=800',
    'shih tzu': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    'chihuahua': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
    'border collie': 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=800',
    'maltese': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
    'akita': 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=800',
    'corgi': 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=800',
  };

  const lowerName = breedName.toLowerCase();
  for (const [key, url] of Object.entries(fallbackImages)) {
    if (lowerName.includes(key) || key.includes(lowerName.split(' ')[0])) {
      return url;
    }
  }

  // Default fallback images
  const defaults = [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
    'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=800',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
  ];
  
  const hash = breedName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return defaults[hash % defaults.length];
}
