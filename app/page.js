'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const JainLogo = () => (
  <svg viewBox="0 0 680 520" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="340" cy="255" r="240" fill="white" stroke="#111" strokeWidth="8"/>
    <polygon points="240,400 440,400 430,420 250,420" fill="#111"/>
    <polygon points="232,375 448,375 440,400 240,400" fill="#2a9d2a"/>
    <polygon points="210,180 470,180 448,375 232,375" fill="white"/>
    <polygon points="220,155 460,155 470,180 210,180" fill="#f5c800"/>
    <polygon points="250,110 430,110 460,155 220,155" fill="#cc1111"/>
    <polygon points="270,90 410,90 430,110 250,110" fill="#111"/>
    <polygon points="270,90 410,90 430,110 460,155 470,180 448,375 440,400 430,420 250,420 240,400 232,375 210,180 220,155 250,110" fill="none" stroke="#1a1acc" strokeWidth="5"/>
    <circle cx="340" cy="95" r="5" fill="white"/>
    <g transform="translate(340,167)">
      <rect x="-4" y="-22" width="8" height="44" fill="#cc1111"/>
      <rect x="-22" y="-4" width="44" height="8" fill="#cc1111"/>
      <rect x="4" y="-22" width="14" height="8" fill="#cc1111"/>
      <rect x="14" y="4" width="8" height="14" fill="#cc1111"/>
      <rect x="-18" y="14" width="14" height="8" fill="#cc1111"/>
      <rect x="-22" y="-18" width="8" height="14" fill="#cc1111"/>
    </g>
    <ellipse cx="340" cy="305" rx="38" ry="48" fill="#f4a460"/>
    <ellipse cx="302" cy="288" rx="10" ry="20" fill="#f4a460" transform="rotate(-20,302,288)"/>
    <ellipse cx="318" cy="258" rx="8" ry="22" fill="#f4a460" transform="rotate(-5,318,258)"/>
    <ellipse cx="334" cy="252" rx="8" ry="24" fill="#f4a460"/>
    <ellipse cx="350" cy="255" rx="8" ry="22" fill="#f4a460" transform="rotate(5,350,255)"/>
    <ellipse cx="365" cy="262" rx="7" ry="18" fill="#f4a460" transform="rotate(12,365,262)"/>
    <rect x="302" y="340" width="76" height="20" rx="8" fill="#f4a460"/>
    <circle cx="340" cy="312" r="20" fill="white" stroke="#2a9d2a" strokeWidth="2.5"/>
    <text x="340" y="317" textAnchor="middle" fontSize="11" fill="#2a9d2a" fontWeight="bold">अहिंसा</text>
    <text x="340" y="414" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">परस्परोपग्रहो जीवानाम्</text>
    <rect x="252" y="420" width="176" height="28" fill="#cc1111" stroke="#1a1acc" strokeWidth="3"/>
    <text x="340" y="439" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">॥ जय जिनेन्द्र ॥</text>
  </svg>
)

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [playlist, setPlaylist] = useState([])
  const [activeView, setActiveView] = useState('home')
  const [volume, setVolume] = useState(80)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const playerRef = useRef(null)
  const progressInterval = useRef(null)
  const searchTimeout = useRef(null)

  useEffect(() => {
    if (window.YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  }, [])

  const startProgressTracking = () => {
    clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const cur = playerRef.current.getCurrentTime()
        const dur = playerRef.current.getDuration()
        setCurrentTime(cur)
        setDuration(dur)
        setProgress(dur > 0 ? (cur / dur) * 100 : 0)
      }
    }, 500)
  }

  const currentList = searchQuery.trim().length >= 2 ? searchResults : FEATURED_SONGS

  const playSong = useCallback((song) => {
    setCurrentSong(song)
    setIsPlaying(true)
    setProgress(0)
    setCurrentTime(0)

    const tryInit = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(tryInit, 300)
        return
      }
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(song.videoId)
        playerRef.current.setVolume(volume)
        startProgressTracking()
        return
      }
      playerRef.current = new window.YT.Player('yt-player', {
        height: '0',
        width: '0',
        videoId: song.videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume)
            e.target.playVideo()
            startProgressTracking()
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (repeat) {
                playerRef.current.seekTo(0)
                playerRef.current.playVideo()
              } else {
                setCurrentSong(prev => {
                  const list = currentList
                  const idx = list.findIndex(s => s.videoId === prev?.videoId)
                  const next = list[(idx + 1) % list.length]
                  if (next) setTimeout(() => playSong(next), 100)
                  return prev
                })
              }
            }
          }
        }
      })
    }
    tryInit()
  }, [volume, repeat])

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
      clearInterval(progressInterval.current)
    } else {
      playerRef.current.playVideo()
      startProgressTracking()
    }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  const playNext = useCallback(() => {
    if (!currentSong || currentList.length === 0) return
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * currentList.length)
      playSong(currentList[randomIdx])
    } else {
      const idx = currentList.findIndex(s => s.videoId === currentSong.videoId)
      playSong(currentList[(idx + 1) % currentList.length])
    }
  }, [currentSong, shuffle, currentList, playSong])

  const playPrev = useCallback(() => {
    if (!currentSong || currentList.length === 0) return
    const idx = currentList.findIndex(s => s.videoId === currentSong.videoId)
    playSong(currentList[(idx - 1 + currentList.length) % currentList.length])
  }, [currentSong, currentList, playSong])

  const handleSeek = (e) => {
    if (!playerRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const pct = Math.min(Math.max(x / rect.width, 0), 1)
    const seekTo = pct * duration
    playerRef.current.seekTo(seekTo, true)
    setProgress(pct * 100)
    setCurrentTime(seekTo)
  }

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 600)
    return () => clearTimeout(searchTimeout.current)
  }, [searchQuery])

  const displaySongs = searchQuery.trim().length >= 2
    ? searchResults
    : FEATURED_SONGS.filter(s => activeCategory === 'All' || s.category === activeCategory)

  const addToPlaylist = (song, e) => {
    e.stopPropagation()
    if (!playlist.find(s => s.videoId === song.videoId)) setPlaylist([...playlist, song])
  }

  const removeFromPlaylist = (videoId, e) => {
    e.stopPropagation()
    setPlaylist(playlist.filter(s => s.videoId !== videoId))
  }

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
        : <button className={styles.addBtn} onClick={(e) => addToPlaylist(song, e)}>+</button>
      }
    </div>
  )

  return (
    <div className={styles.container}>
      <div id="yt-player" style={{ display: 'none' }} />

      {/* Sidebar — desktop only */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <JainLogo />
          <span className={styles.logoText}>Jain Stavan</span>
        </div>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeView === 'home' ? styles.active : ''}`}
            onClick={() => { setActiveView('home'); setSearchQuery('') }}
          >🏠 Home</button>
          <button
            className={`${styles.navItem} ${activeView === 'playlist' ? styles.active : ''}`}
            onClick={() => setActiveView('playlist')}
          >
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
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Main content */}
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
                {isSearching
                  ? 'Searching...'
                  : searchQuery.trim().length >= 2
                    ? `Results for "${searchQuery}"`
                    : activeCategory === 'All' ? '🎵 Featured Stavans' : activeCategory}
              </h2>
              {isSearching
                ? <div className={styles.loadingWrap}><div className={styles.spinner} /><p>Finding stavans on YouTube...</p></div>
                : displaySongs.length === 0
                  ? <p className={styles.emptyMsg}>No results found. Try a different search.</p>
                  : displaySongs.map((song, i) =>
                    <SongCard key={song.videoId || song.id} song={song} index={i} showRemove={false} />
                  )
              }
            </>
          )}
        </div>
      </div>

      {/* Player bar */}
      {currentSong && (
        <div className={styles.player}>
          <div className={styles.playerLeft}>
            <div className={styles.playerThumb}>
              {currentSong.thumbnail
                ? <img src={currentSong.thumbnail} alt={currentSong.title} className={styles.thumbImg} />
                : '🎵'}
            </div>
            <div className={styles.playerInfo}>
              <p className={styles.playerTitle}>{currentSong.title}</p>
              <p className={styles.playerSinger}>{currentSong.singer}</p>
            </div>
          </div>

          <div className={styles.playerCenter}>
            <div className={styles.progressWrap}>
              <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
              <div
                className={styles.progressBar}
                onClick={handleSeek}
                onTouchStart={handleSeek}
                onTouchMove={handleSeek}
              >
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
              </div>
              <span className={styles.timeLabel}>{formatTime(duration)}</span>
            </div>

            <div className={styles.controlBtnRow}>
              <button
                className={`${styles.controlBtn} ${shuffle ? styles.activeControl : ''}`}
                onClick={() => setShuffle(!shuffle)}
                title="Shuffle"
              >⇄</button>
              <button className={styles.controlBtn} onClick={playPrev}>⏮</button>
              <button className={styles.playBtn} onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className={styles.controlBtn} onClick={playNext}>⏭</button>
              <button
                className={`${styles.controlBtn} ${repeat ? styles.activeControl : ''}`}
                onClick={() => setRepeat(!repeat)}
                title="Repeat"
              >🔁</button>
            </div>
          </div>

          <div className={styles.playerRight}>
            <span className={styles.volIcon}>🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className={styles.volumeSlider}
            />
          </div>
        </div>
      )}

      {/* Bottom Nav — mobile only */}
      <div className={styles.bottomNav}>
        <button
          className={`${styles.bottomNavItem} ${activeView === 'home' ? styles.active : ''}`}
          onClick={() => { setActiveView('home'); setSearchQuery('') }}
        >
          <span className={styles.bottomNavIcon}>🏠</span>
          Home
        </button>
        <button
          className={styles.bottomNavItem}
          onClick={() => { setActiveView('home'); setTimeout(() => document.querySelector('input')?.focus(), 100) }}
        >
          <span className={styles.bottomNavIcon}>🔍</span>
          Search
        </button>
        <button
          className={`${styles.bottomNavItem} ${activeView === 'playlist' ? styles.active : ''}`}
          onClick={() => setActiveView('playlist')}
        >
          <span className={styles.bottomNavIcon}>📋</span>
          Playlist {playlist.length > 0 && `(${playlist.length})`}
        </button>
      </div>

    </div>
  )
}