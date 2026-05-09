import { NextResponse } from 'next/server'

// ── In-memory cache ──────────────────────────────────────────────────────────
// Each entry: { results: [...], timestamp: Date.now() }
// Lives as long as the server process is alive (Vercel keeps functions warm for
// a while, so repeat searches within a session almost never hit the API again).
const cache = new Map()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.results
}

function setCache(key, results) {
  // Keep the map from growing forever — evict oldest entry if > 500 keys
  if (cache.size >= 500) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, { results, timestamp: Date.now() })
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'No query provided' }, { status: 400 })
  }

  const cacheKey = query.trim().toLowerCase()

  // 1. Return cached result if available
  const cached = getCached(cacheKey)
  if (cached) {
    return NextResponse.json({ results: cached, fromCache: true })
  }

  // 2. Hit YouTube API
  const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY
  const searchQuery = `${query} jain stavan`

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=20&key=${apiKey}`
    )

    const data = await res.json()

    // Handle quota exceeded or API errors gracefully
    if (data.error) {
      console.error('YouTube API error:', data.error.message)
      return NextResponse.json(
        { error: 'YouTube API error: ' + data.error.message, results: [] },
        { status: 200 }  // Return 200 so the UI shows "no results" not a crash
      )
    }

    if (!data.items) {
      return NextResponse.json({ results: [] })
    }

    const results = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      singer: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      videoId: item.id.videoId,
      category: 'Stavan'
    }))

    // 3. Save to cache before returning
    setCache(cacheKey, results)

    return NextResponse.json({ results })

  } catch (err) {
    console.error('Search fetch failed:', err)
    return NextResponse.json({ error: 'Failed to fetch', results: [] }, { status: 200 })
  }
}