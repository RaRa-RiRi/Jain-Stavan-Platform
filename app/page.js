'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { auth, db, googleProvider } from '../lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp
} from 'firebase/firestore'
import styles from './page.module.css'

// ── Song Database ────────────────────────────────────────────────────────────
const FEATURED_SONGS = [
  { id: '1', title: 'Navkar Mantra - Om Namo Arihantanam', singer: 'Hemina Shah', videoId: '1H-IU9lN9cI', category: 'Mantra', thumbnail: 'https://img.youtube.com/vi/1H-IU9lN9cI/mqdefault.jpg' },
  { id: '2', title: 'Mane Vahalu Lage Paras Naam', singer: 'Jai Jinendra', videoId: 'bHa8XVvwB4M', category: 'Stavan', thumbnail: 'https://img.youtube.com/vi/bHa8XVvwB4M/mqdefault.jpg' },
  { id: '3', title: 'He Shankheshwar Swami - Parshwanath Aarti', singer: 'Gunjan', videoId: '3UcwaE5IRH0', category: 'Aarti', thumbnail: 'https://img.youtube.com/vi/3UcwaE5IRH0/mqdefault.jpg' },
  { id: '4', title: 'Jena Smaran Thi Jivan Na Sankat', singer: 'Shemaroo Jai Jinendra', videoId: '9s22z0p0334', category: 'Stavan', thumbnail: 'https://img.youtube.com/vi/9s22z0p0334/mqdefault.jpg' },
  { id: '5', title: 'Aankh Mari Ugade To Shankheshwar', singer: 'Kishore Manraja', videoId: 'rIgRNtEcT-M', category: 'Stavan', thumbnail: 'https://img.youtube.com/vi/rIgRNtEcT-M/mqdefault.jpg' },
  { id: '6', title: 'Navkar Mantra with Meaning & Lyrics', singer: 'Divine India', videoId: '-0RjpDXUNmg', category: 'Mantra', thumbnail: 'https://img.youtube.com/vi/-0RjpDXUNmg/mqdefault.jpg' },
  { id: '7', title: 'Sodhile Jivan No Saar O Maanavi', singer: 'Jainsite.com', videoId: 'Bbo3uVhYO8c', category: 'Bhajan', thumbnail: 'https://img.youtube.com/vi/Bbo3uVhYO8c/mqdefault.jpg' },
  { id: '8', title: 'Navkar Mantra - Most Powerful (Nonstop)', singer: 'Parthiv Gohil', videoId: 'kESQAwjusbE', category: 'Mantra', thumbnail: 'https://img.youtube.com/vi/kESQAwjusbE/mqdefault.jpg' },
  { id: '9', title: 'Jena Smaran Thi - with English Lyrics', singer: 'Jai Jinendra', videoId: 'ijKNwkxRJT0', category: 'Stavan', thumbnail: 'https://img.youtube.com/vi/ijKNwkxRJT0/mqdefault.jpg' },
  { id: '10', title: 'Popular Jain Bhajans - Shankheshwar Parshwanath', singer: 'Jai Jinendra', videoId: 'oT7aadd9nUY', category: 'Stavan', thumbnail: 'https://img.youtube.com/vi/oT7aadd9nUY/mqdefault.jpg' },
  { id: '11', title: 'Navkar Mantra - Tina Kundalia (T-Series)', singer: 'Tina Kundalia', videoId: 'nzfdIYccQwM', category: 'Mantra', thumbnail: 'https://img.youtube.com/vi/nzfdIYccQwM/mqdefault.jpg' },
  { id: '12', title: '108 Navkar Mantra - Original Tune', singer: 'CA Anjali Jain', videoId: 'CtTMILyOtNo', category: 'Mantra', thumbnail: 'https://img.youtube.com/vi/CtTMILyOtNo/mqdefault.jpg' },
]

const CATEGORIES = ['All', 'Stavan', 'Bhajan', 'Mantra', 'Aarti', 'Tirth']
const MAX_RECENT = 30

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
    <circle cx="340" cy="312" r="20" fill="white" stroke="#2a9d2a" strokeWidth="2.5"/>
    <text x="340" y="317" textAnchor="middle" fontSize="11" fill="#2a9d2a" fontWeight="bold">अहिंसा</text>
    <rect x="252" y="420" width="176" height="28" fill="#cc1111" stroke="#1a1acc" strokeWidth="3"/>
    <text x="340" y="439" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">॥ जय जिनेन्द्र ॥</text>
  </svg>
)

function MarqueeText({ text, className }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [overflowPx, setOverflowPx] = useState(0)

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        const overflow = textRef.current.scrollWidth - containerRef.current.clientWidth
        setOverflowPx(overflow > 2 ? overflow + 24 : 0)
      }
    }
    check()
    const t = setTimeout(check, 200)
    window.addEventListener('resize', check)
    return () => { clearTimeout(t); window.removeEventListener('resize', check) }
  }, [text])

  return (
    <div ref={containerRef} className={styles.marqueeContainer}>
      <span
        ref={textRef}
        className={`${className} ${overflowPx > 0 ? styles.marqueeScroll : ''}`}
        style={overflowPx > 0 ? { '--scroll-px': `-${overflowPx}px` } : {}}
      >{text}</span>
    </div>
  )
}

// ── Firestore helpers ─────────────────────────────────────────────────────────
async function getUserDoc(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { playlist: [], likedSongs: [], recentlyPlayed: [], createdAt: serverTimestamp() })
    return { playlist: [], likedSongs: [], recentlyPlayed: [] }
  }
  return snap.data()
}

async function saveRecentlyPlayed(uid, song) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const data = snap.data() || {}
  const recent = (data.recentlyPlayed || []).filter(s => s.videoId !== song.videoId)
  const updated = [song, ...recent].slice(0, MAX_RECENT)
  await updateDoc(ref, { recentlyPlayed: updated })
  return updated
}

async function toggleLikeInDB(uid, song, isLiked) {
  const ref = doc(db, 'users', uid)
  if (isLiked) {
    await updateDoc(ref, { likedSongs: arrayRemove(song) })
  } else {
    await updateDoc(ref, { likedSongs: arrayUnion(song) })
  }
}

async function savePlaylistToDB(uid, playlist) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { playlist })
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  // Auth
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Player
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // UI
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeView, setActiveView] = useState('home') // home | playlist | liked | recent

  // User data
  const [playlist, setPlaylist] = useState([])
  const [likedSongs, setLikedSongs] = useState([])
  const [recentlyPlayed, setRecentlyPlayed] = useState([])

  const playerRef = useRef(null)
  const progressInterval = useRef(null)
  const searchTimeout = useRef(null)

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setAuthLoading(false)
      if (u) {
        const data = await getUserDoc(u.uid)
        setPlaylist(data.playlist || [])
        setLikedSongs(data.likedSongs || [])
        setRecentlyPlayed(data.recentlyPlayed || [])
      } else {
        setPlaylist([])
        setLikedSongs([])
        setRecentlyPlayed([])
      }
    })
    return unsub
  }, [])

  // ── YouTube IFrame API ─────────────────────────────────────────────────────
  useEffect(() => {
    if (window.YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  }, [])

  const startProgressTracking = () => {
    clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
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

    // Save to recently played
    if (user) {
      saveRecentlyPlayed(user.uid, {
        id: song.id || song.videoId,
        title: song.title,
        singer: song.singer,
        videoId: song.videoId,
        category: song.category || 'Stavan',
        thumbnail: song.thumbnail || null,
      }).then(updated => setRecentlyPlayed(updated))
    }

    const tryInit = () => {
      if (!window.YT || !window.YT.Player) { setTimeout(tryInit, 300); return }
      if (playerRef.current?.loadVideoById) {
        playerRef.current.loadVideoById(song.videoId)
        playerRef.current.setVolume(volume)
        startProgressTracking()
        return
      }
      playerRef.current = new window.YT.Player('yt-player', {
        height: '1', width: '1',
        videoId: song.videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: (e) => { e.target.setVolume(volume); e.target.playVideo(); startProgressTracking() },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              if (repeat) { playerRef.current.seekTo(0); playerRef.current.playVideo() }
              else {
                setCurrentSong(prev => {
                  const idx = currentList.findIndex(s => s.videoId === prev?.videoId)
                  const next = currentList[(idx + 1) % currentList.length]
                  if (next) setTimeout(() => playSong(next), 100)
                  return prev
                })
              }
            }
          },
          onAutoplayBlocked: () => setIsPlaying(false),
        }
      })
    }
    tryInit()
  }, [volume, repeat, user])

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) { playerRef.current.pauseVideo(); clearInterval(progressInterval.current) }
    else { playerRef.current.playVideo(); startProgressTracking() }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    if (playerRef.current?.setVolume) playerRef.current.setVolume(volume)
  }, [volume])

  const playNext = useCallback(() => {
    if (!currentSong || currentList.length === 0) return
    if (shuffle) { playSong(currentList[Math.floor(Math.random() * currentList.length)]) }
    else {
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
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    playerRef.current.seekTo(pct * duration, true)
    setProgress(pct * 100)
    setCurrentTime(pct * duration)
  }

  // ── Search ─────────────────────────────────────────────────────────────────
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

  // ── Playlist ───────────────────────────────────────────────────────────────
  const addToPlaylist = async (song, e) => {
    e.stopPropagation()
    if (playlist.find(s => s.videoId === song.videoId)) return
    const newPlaylist = [...playlist, { id: song.id || song.videoId, title: song.title, singer: song.singer, videoId: song.videoId, category: song.category || 'Stavan', thumbnail: song.thumbnail || null }]
    setPlaylist(newPlaylist)
    if (user) await savePlaylistToDB(user.uid, newPlaylist)
  }

  const removeFromPlaylist = async (videoId, e) => {
    e.stopPropagation()
    const newPlaylist = playlist.filter(s => s.videoId !== videoId)
    setPlaylist(newPlaylist)
    if (user) await savePlaylistToDB(user.uid, newPlaylist)
  }

  // ── Like ───────────────────────────────────────────────────────────────────
  const toggleLike = async (song, e) => {
    e.stopPropagation()
    if (!user) { alert('Please sign in to like songs!'); return }
    const songData = { id: song.id || song.videoId, title: song.title, singer: song.singer, videoId: song.videoId, category: song.category || 'Stavan', thumbnail: song.thumbnail || null }
    const isLiked = likedSongs.some(s => s.videoId === song.videoId)
    const updated = isLiked
      ? likedSongs.filter(s => s.videoId !== song.videoId)
      : [...likedSongs, songData]
    setLikedSongs(updated)
    await toggleLikeInDB(user.uid, songData, isLiked)
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider) }
    catch (err) { console.error('Login failed:', err) }
  }
  const handleLogout = async () => {
    await signOut(auth)
  }

  // ── Display logic ──────────────────────────────────────────────────────────
  const displaySongs = (() => {
    if (activeView === 'playlist') return playlist
    if (activeView === 'liked') return likedSongs
    if (activeView === 'recent') return recentlyPlayed
    if (searchQuery.trim().length >= 2) return searchResults
    return FEATURED_SONGS.filter(s => activeCategory === 'All' || s.category === activeCategory)
  })()

  const sectionTitle = (() => {
    if (activeView === 'playlist') return '📋 My Playlist'
    if (activeView === 'liked') return '❤️ Liked Songs'
    if (activeView === 'recent') return '🕐 Recently Played'
    if (isSearching) return 'Searching...'
    if (searchQuery.trim().length >= 2) return `Results for "${searchQuery}"`
    if (activeCategory !== 'All') return activeCategory
    return '🎵 Popular Stavans'
  })()

  const emptyMsg = (() => {
    if (activeView === 'playlist') return user ? 'Your playlist is empty. Add songs using the + button.' : 'Sign in to save your playlist!'
    if (activeView === 'liked') return user ? 'No liked songs yet. Tap ♡ on any song!' : 'Sign in to like songs!'
    if (activeView === 'recent') return user ? 'No songs played yet. Start listening!' : 'Sign in to see your history!'
    return 'No results found. Try a different search.'
  })()

  // ── Song Card ──────────────────────────────────────────────────────────────
  const SongCard = ({ song, index, showRemove }) => {
    const isLiked = likedSongs.some(s => s.videoId === song.videoId)
    const inPlaylist = playlist.some(s => s.videoId === song.videoId)
    return (
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

        {/* Like button */}
        <button
          className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
          onClick={(e) => toggleLike(song, e)}
          title={isLiked ? 'Unlike' : 'Like'}
        >{isLiked ? '❤️' : '🤍'}</button>

        {/* Playlist button */}
        {showRemove
          ? <button className={styles.removeBtn} onClick={(e) => removeFromPlaylist(song.videoId, e)}>✕</button>
          : <button
              className={`${styles.addBtn} ${inPlaylist ? styles.inPlaylist : ''}`}
              onClick={(e) => inPlaylist ? removeFromPlaylist(song.videoId, e) : addToPlaylist(song, e)}
              title={inPlaylist ? 'Remove from playlist' : 'Add to playlist'}
            >{inPlaylist ? '✓' : '+'}</button>
        }
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div id="yt-player" className={styles.ytPlayerHidden} />

      {/* ── Sidebar ── */}
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <JainLogo />
          <span className={styles.logoText}>JinDhara</span>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${activeView === 'home' ? styles.active : ''}`}
            onClick={() => { setActiveView('home'); setSearchQuery('') }}>🏠 Home</button>
          <button className={`${styles.navItem} ${activeView === 'playlist' ? styles.active : ''}`}
            onClick={() => setActiveView('playlist')}>
            📋 My Playlist {playlist.length > 0 && <span className={styles.badge}>{playlist.length}</span>}
          </button>
          <button className={`${styles.navItem} ${activeView === 'liked' ? styles.active : ''}`}
            onClick={() => setActiveView('liked')}>
            ❤️ Liked Songs {likedSongs.length > 0 && <span className={styles.badge}>{likedSongs.length}</span>}
          </button>
          <button className={`${styles.navItem} ${activeView === 'recent' ? styles.active : ''}`}
            onClick={() => setActiveView('recent')}>🕐 Recently Played</button>
        </nav>

        <div className={styles.categories}>
          <p className={styles.sectionLabel}>CATEGORIES</p>
          {CATEGORIES.map(cat => (
            <button key={cat}
              className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => { setActiveCategory(cat); setActiveView('home'); setSearchQuery('') }}
            >{cat}</button>
          ))}
        </div>

        {/* Auth section at bottom of sidebar */}
        <div className={styles.authSection}>
          {authLoading ? null : user ? (
            <div className={styles.userInfo}>
              <img src={user.photoURL} alt={user.displayName} className={styles.userAvatar} />
              <div className={styles.userDetails}>
                <p className={styles.userName}>{user.displayName}</p>
                <button className={styles.signOutBtn} onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          ) : (
            <button className={styles.signInBtn} onClick={handleLogin}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className={styles.main}>
        <div className={styles.topBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="🔍  Search any stavan, bhajan, singer..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveView('home') }}
          />
          {/* Mobile auth button */}
          <div className={styles.mobileAuth}>
            {!authLoading && (user
              ? <img src={user.photoURL} alt={user.displayName} className={styles.userAvatar} onClick={handleLogout} title="Sign out" />
              : <button className={styles.signInBtnMobile} onClick={handleLogin}>Sign in</button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{isSearching ? 'Searching...' : sectionTitle}</h2>
          {isSearching
            ? <div className={styles.loadingWrap}><div className={styles.spinner} /><p>Finding stavans on YouTube...</p></div>
            : displaySongs.length === 0
              ? <p className={styles.emptyMsg}>{emptyMsg}</p>
              : displaySongs.map((song, i) =>
                  <SongCard key={song.videoId || song.id} song={song} index={i} showRemove={activeView === 'playlist'} />
                )
          }
        </div>
      </div>

      {/* ── Player bar ── */}
      {currentSong && (
        <div className={styles.player}>
          <div className={styles.playerLeft}>
            <div className={styles.playerThumb}>
              {currentSong.thumbnail
                ? <img src={currentSong.thumbnail} alt={currentSong.title} className={styles.thumbImg} />
                : '🎵'}
            </div>
            <div className={styles.playerInfo}>
              <MarqueeText text={currentSong.title} className={styles.playerTitle} />
              <MarqueeText text={currentSong.singer} className={styles.playerSinger} />
            </div>
            <button
              className={`${styles.playerLikeBtn} ${likedSongs.some(s => s.videoId === currentSong.videoId) ? styles.liked : ''}`}
              onClick={(e) => toggleLike(currentSong, e)}
            >{likedSongs.some(s => s.videoId === currentSong.videoId) ? '❤️' : '🤍'}</button>
          </div>

          <div className={styles.playerCenter}>
            <div className={styles.controlBtnRow}>
              <button className={`${styles.controlBtn} ${shuffle ? styles.activeControl : ''}`} onClick={() => setShuffle(!shuffle)}>⇄</button>
              <button className={styles.controlBtn} onClick={playPrev}>⏮</button>
              <button className={styles.playBtn} onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
              <button className={styles.controlBtn} onClick={playNext}>⏭</button>
              <button className={`${styles.controlBtn} ${repeat ? styles.activeControl : ''}`} onClick={() => setRepeat(!repeat)}>🔁</button>
            </div>
            <div className={styles.progressWrap}>
              <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
              <div className={styles.progressBar} onClick={handleSeek} onTouchStart={handleSeek} onTouchMove={handleSeek}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
              </div>
              <span className={styles.timeLabel}>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.playerRight}>
            <span className={styles.volIcon}>🔊</span>
            <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className={styles.volumeSlider} />
          </div>
        </div>
      )}

      {/* ── Bottom Nav mobile ── */}
      <div className={styles.bottomNav}>
        <button className={`${styles.bottomNavItem} ${activeView === 'home' ? styles.active : ''}`}
          onClick={() => { setActiveView('home'); setSearchQuery('') }}>
          <span className={styles.bottomNavIcon}>🏠</span>Home
        </button>
        <button className={styles.bottomNavItem}
          onClick={() => { setActiveView('home'); setTimeout(() => document.querySelector('input')?.focus(), 100) }}>
          <span className={styles.bottomNavIcon}>🔍</span>Search
        </button>
        <button className={`${styles.bottomNavItem} ${activeView === 'liked' ? styles.active : ''}`}
          onClick={() => setActiveView('liked')}>
          <span className={styles.bottomNavIcon}>❤️</span>Liked
        </button>
        <button className={`${styles.bottomNavItem} ${activeView === 'playlist' ? styles.active : ''}`}
          onClick={() => setActiveView('playlist')}>
          <span className={styles.bottomNavIcon}>📋</span>Playlist
        </button>
        <button className={`${styles.bottomNavItem} ${activeView === 'recent' ? styles.active : ''}`}
          onClick={() => setActiveView('recent')}>
          <span className={styles.bottomNavIcon}>🕐</span>History
        </button>
      </div>
    </div>
  )
}