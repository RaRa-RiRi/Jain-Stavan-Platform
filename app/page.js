'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'

const FEATURED_SONGS = [
  { id: '1', title: 'Navkar Mantra', singer: 'Hemant Chauhan', videoId: 'pMGIE7ggWaM', category: 'Mantra', thumbnail: null },
  { id: '2', title: 'Jai Jinendra', singer: 'Shailendra Bhartti', videoId: 'FRY4bMkDjYs', category: 'Stavan', thumbnail: null },
  { id: '3', title: 'Mahavir Swami Stavan', singer: 'Hemant Chauhan', videoId: '0DeGNcpNMH8', category: 'Stavan', thumbnail: null },
  { id: '4', title: 'Parshwanath Stavan', singer: 'Falguni Pathak', videoId: 'JtDNOJrMBmw', category: 'Stavan', thumbnail: null },
  { id: '5', title: 'Samedo Shikhar', singer: 'Hemant Chauhan', videoId: 'CqBFkSGCCBk', category: 'Tirth', thumbnail: null },
  { id: '6', title: 'Adinath Bhagwan', singer: 'Shailendra Bhartti', videoId: 'v6yjYMWqvSk', category: 'Stavan', thumbnail: null },
]

const CATEGORIES = ['All', 'Stavan', 'Bhajan', 'Mantra', 'Aarti', 'Tirth']

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [playlist, setPlaylist] = useState([])
  const [activeView, setActiveView] = useState('home')
  const searchTimeout = useRef(null)

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 600)

    return () => clearTimeout(searchTimeout.current)
  }, [searchQuery])

  const displaySongs = searchQuery.trim().length >= 2
    ? searchResults
    : FEATURED_SONGS.filter(s => activeCategory === 'All' || s.category === activeCategory)

  const playSong = (song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  const togglePlay = () => setIsPlaying(!isPlaying)

  const currentList = searchQuery.trim().length >= 2 ? searchResults : FEATURED_SONGS

  const playNext = () => {
    if (!currentSong) return
    const idx = currentList.findIndex(s => s.videoId === currentSong.videoId)
    const next = currentList[(idx + 1) % currentList.length]
    if (next) playSong(next)
  }

  const playPrev = () => {
    if (!currentSong) return
    const idx = currentList.findIndex(s => s.videoId === currentSong.videoId)
    const prev = currentList[(idx - 1 + currentList.length) % currentList.length]
    if (prev) playSong(prev)
  }

  const addToPlaylist = (song, e) => {
    e.stopPropagation()
    if (!playlist.find(s => s.videoId === song.videoId)) {
      setPlaylist([...playlist, song])
    }
  }

  const removeFromPlaylist = (videoId, e) => {
    e.stopPropagation()
    setPlaylist(playlist.filter(s => s.videoId !== videoId))
  }

  const getYouTubeSrc = (videoId, playing) =>
    `https://www.youtube.com/embed/${videoId}?autoplay=${playing ? 1 : 0}&enablejsapi=1&controls=0&modestbranding=1`

  const SongCard = ({ song, index, showRemove }) => (
    <div
      className={`${styles.songCard} ${currentSong?.videoId === song.videoId ? styles.playing : ''}`}
      onClick={() => playSong(song)}
    >
      <div className={styles.songNum}>
        {currentSong?.videoId === song.videoId && isPlaying ? '▶' : index + 1}
      </div>
      <div className={styles.songThumb}>
        {song.thumbnail
          ? <img src={song.thumbnail} alt={song.title} className={styles.thumbImg} />
          : '🎵'}
      </div>
      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{song.title}</p>
        <p className={styles.songSinger}>{song.singer}</p>
      </div>
      <span className={styles.songCategory}>{song.category}</span>
      {showRemove
        ? <button className={styles.removeBtn} onClick={(e) => removeFromPlaylist(song.videoId, e)}>✕</button>
        : <button className={styles.addBtn} onClick={(e) => addToPlaylist(song, e)} title="Add to playlist">+</button>
      }
    </div>
  )

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🕉️</span>
          <span className={styles.logoText}>Jain Stavan</span>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${activeView === 'home' ? styles.active : ''}`} onClick={() => { setActiveView('home'); setSearchQuery('') }}>🏠 Home</button>
          <button className={`${styles.navItem} ${activeView === 'playlist' ? styles.active : ''}`} onClick={() => setActiveView('playlist')}>
            📋 My Playlist {playlist.length > 0 && <span className={styles.badge}>{playlist.length}</span>}
          </button>
        </nav>

        <div className={styles.categories}>
          <p className={styles.sectionLabel}>CATEGORIES</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => { setActiveCategory(cat); setActiveView('home'); setSearchQuery('') }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="🔍  Search any stavan, bhajan, singer..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveView('home') }}
          />
        </div>

        <div className={styles.content}>
          {activeView === 'playlist' ? (
            <>
              <h2 className={styles.sectionTitle}>My Playlist</h2>
              {playlist.length === 0
                ? <p className={styles.emptyMsg}>Your playlist is empty. Add songs using the + button.</p>
                : playlist.map((song, i) => <SongCard key={song.videoId} song={song} index={i} showRemove />)
              }
            </>
          ) : (
            <>
              <h2 className={styles.sectionTitle}>
                {isSearching ? 'Searching...' : searchQuery.trim().length >= 2 ? `Results for "${searchQuery}"` : activeCategory === 'All' ? '🎵 Featured Stavans' : activeCategory}
              </h2>
              {isSearching
                ? <div className={styles.loadingWrap}><div className={styles.spinner} /><p>Finding stavans on YouTube...</p></div>
                : displaySongs.length === 0
                  ? <p className={styles.emptyMsg}>No results found. Try a different search.</p>
                  : displaySongs.map((song, i) => <SongCard key={song.videoId || song.id} song={song} index={i} showRemove={false} />)
              }
            </>
          )}
        </div>
      </div>

      {/* Player */}
      {currentSong && (
        <div className={styles.player}>
          <div className={styles.playerLeft}>
            <div className={styles.playerThumb}>
              {currentSong.thumbnail
                ? <img src={currentSong.thumbnail} alt={currentSong.title} className={styles.thumbImg} />
                : '🎵'}
            </div>
            <div>
              <p className={styles.playerTitle}>{currentSong.title}</p>
              <p className={styles.playerSinger}>{currentSong.singer}</p>
            </div>
          </div>

          <div className={styles.playerCenter}>
            <button className={styles.controlBtn} onClick={playPrev}>⏮</button>
            <button className={styles.playBtn} onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
            <button className={styles.controlBtn} onClick={playNext}>⏭</button>
          </div>

          <div className={styles.playerRight}>
            <span className={styles.categoryBadge}>{currentSong.category}</span>
          </div>

          <iframe
            key={currentSong.videoId + isPlaying}
            src={getYouTubeSrc(currentSong.videoId, isPlaying)}
            style={{ display: 'none' }}
            allow="autoplay"
            title="player"
          />
        </div>
      )}
    </div>
  )
}