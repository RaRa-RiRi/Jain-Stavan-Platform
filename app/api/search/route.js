import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'No query provided' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY
  const searchQuery = `${query} jain stavan`

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=20&key=${apiKey}`
  )

  const data = await res.json()

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

  return NextResponse.json({ results })
}