'use client'
import { useState } from 'react'
import styles from './page.module.css'

const FEATURED_SONGS = [
  { id: '1', title: 'Navkar Mantra', singer: 'Hemant Chauhan', videoId: 'pMGIE7ggWaM', category: 'Mantra' },
  { id: '2', title: 'Jai Jinendra', singer: 'Shailendra Bhartti', videoId: 'FRY4bMkDjYs', category: 'Stavan' },
  { id: '3', title: 'Mahavir Swami Stavan', singer: 'Hemant Chauhan', videoId: '0DeGNcpNMH8', category: 'Stavan' },
  { id: '4', title: 'Parshwanath Stavan', singer: 'Falguni Pathak', videoId: 'JtDNOJrMBmw', category: 'Stavan' },
  { id: '5', title: 'Samedo Shikhar', singer: 'Hemant Chauhan', videoId: 'CqBFkSGCCBk', category: 'Tirth' },
  { id: '6', title: 'Adinath Bhagwan', singer: 'Shailendra Bhartti', videoId: 'v6yjYMWqvSk', category: 'Stavan' },
]

const CATEGORIES = ['All', 'Stavan', 'Bhajan', 'Mantra', 'Aarti', 'Tirth']

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [playlist, setPlaylist] = useState([])
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  const filteredSongs = FEATURED_SONGS.filter(song => {
    const matchSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.singer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = activeCategory === 'All' || song.category === activeCategory
    return matchSearch && matchCategory
  })

  const playSong = (song) => {
    setCurrentSong(song)
    setIsPlaying(true)
    setPlayerReady(false)
  }

  const togglePlay = () => setIsPlaying(!isPlaying)

  const playNext = () => {
    if (!currentSong) return
    const idx = FEATURED_SONGS.findIndex(s => s.id === currentSong.id)
    const next = FEATURED_SONGS[(idx + 1) % FEATURED_SONGS.length]
    playSong(next)
  }

  const playPrev = () => {
    if (!currentSong) return
    const idx = FEATURED_SONGS.findIndex(s => s.id === currentSong.id)
    const prev = FEATURED_SONGS[(idx - 1 + FEATURED_SONGS.length) % FEATURED_SONGS.length]
    playSong(prev)
  }

  const addToPlaylist = (song) => {
    if (!playlist.find(s => s.id === song.id)) {
      setPlaylist([...playlist, song])
    }
  }

  const removeFromPlaylist = (songId) => {
    setPlaylist(playlist.filter(s => s.id !== songId))
  }

  const getYouTubeSrc = (videoId, playing) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${playing ? 1 : 0}&enablejsapi=1&controls=0&modestbranding=1`
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🕉️</span>
          <span className={styles.logoText}>Jain Stavan</span>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.active}`}>🏠 Home</button>
          <button className={styles.navItem} onClick={() => setShowPlaylist(false)}>🔍 Search</button>
          <button className={styles.navItem} onClick={() => setShowPlaylist(true)}>
            📋 My Playlist ({playlist.length})
          </button>
        </nav>

        <div className={styles.categories}>
          <p className={styles.sectionLabel}>CATEGORIES</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        <div className={styles.topBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="🔍  Search stavans, bhajans, singers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {showPlaylist ? (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>My Playlist</h2>
            {playlist.length === 0 ? (
              <p className={styles.emptyMsg}>Your playlist is empty. Add songs using the + button.</p>
            ) : (
              <div className={styles.songList}>
                {playlist.map((song, i) => (
                  <div key={song.id} className={`${styles.songCard} ${currentSong?.id === song.id ? styles.playing : ''}`}>
                    <div className={styles.songNum}>{i + 1}</div>
                    <div className={styles.songThumb}>🎵</div>
                    <div className={styles.songInfo} onClick={() => playSong(song)}>
                      <p className={styles.songTitle}>{song.title}</p>
                      <p className={styles.songSinger}>{song.singer}</p>
                    </div>
                    <span className={styles.songCategory}>{song.category}</span>
                    <button className={styles.removeBtn} onClick={() => removeFromPlaylist(song.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.content}>
            <h2 className={styles.sectionTitle}>
              {searchQuery ? `Results for "${searchQuery}"` : activeCategory === 'All' ? 'Featured Stavans' : activeCategory}
            </h2>
            <div className={styles.songList}>
              {filteredSongs.length === 0 ? (
                <p className={styles.emptyMsg}>No songs found. Try a different search.</p>
              ) : (
                filteredSongs.map((song, i) => (
                  <div key={song.id} className={`${styles.songCard} ${currentSong?.id === song.id ? styles.playing : ''}`}>
                    <div className={styles.songNum}>{currentSong?.id === song.id && isPlaying ? '▶' : i + 1}</div>
                    <div className={styles.songThumb}>🎵</div>
                    <div className={styles.songInfo} onClick={() => playSong(song)}>
                      <p className={styles.songTitle}>{song.title}</p>
                      <p className={styles.songSinger}>{song.singer}</p>
                    </div>
                    <span className={styles.songCategory}>{song.category}</span>
                    <button className={styles.addBtn} onClick={() => addToPlaylist(song)} title="Add to playlist">+</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Player Bar */}
      {currentSong && (
        <div className={styles.player}>
          <div className={styles.playerLeft}>
            <div className={styles.playerThumb}>🎵</div>
            <div>
              <p className={styles.playerTitle}>{currentSong.title}</p>
              <p className={styles.playerSinger}>{currentSong.singer}</p>
            </div>
          </div>

          <div className={styles.playerCenter}>
            <button className={styles.controlBtn} onClick={playPrev}>⏮</button>
            <button className={styles.playBtn} onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className={styles.controlBtn} onClick={playNext}>⏭</button>
          </div>

          <div className={styles.playerRight}>
            <span className={styles.categoryBadge}>{currentSong.category}</span>
          </div>

          {/* Hidden YouTube Player */}
          <iframe
            key={currentSong.videoId}
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