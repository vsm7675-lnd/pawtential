import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const species = searchParams.get('species') || 'Dog'
  
  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }
  
  try {
    // First try Wikipedia REST API
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'Accept': 'application/json' } }
    )
    
    if (wikiRes.ok) {
      const data = await wikiRes.json()
      const imageUrl = data.originalimage?.source || data.thumbnail?.source || null
      
      if (imageUrl) {
        return NextResponse.json({ image: imageUrl, title: data.title })
      }
    }
    
    // Fallback: Search Wikimedia Commons directly
    const searchTerm = species === 'Cat' ? `${title} cat` : `${title} dog`
    const commonsRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=5&format=json&origin=*`
    )
    
    if (commonsRes.ok) {
      const commonsData = await commonsRes.json()
      const results = commonsData.query?.search || []
      
      if (results.length > 0) {
        // Get image info for the first result
        const imageTitle = results[0].title
        const imageInfoRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`
        )
        
        if (imageInfoRes.ok) {
          const imageInfoData = await imageInfoRes.json()
          const pages = imageInfoData.query?.pages || {}
          const page = Object.values(pages)[0] as any
          const thumbUrl = page?.imageinfo?.[0]?.thumburl
          
          if (thumbUrl) {
            return NextResponse.json({ image: thumbUrl, title })
          }
        }
      }
    }
    
    return NextResponse.json({ image: null })
  } catch (error) {
    return NextResponse.json({ image: null }, { status: 500 })
  }
}
