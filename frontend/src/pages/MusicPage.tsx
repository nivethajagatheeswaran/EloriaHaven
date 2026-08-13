import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props { onNavigate: (page: string) => void; dark: boolean }

const TRACKS = [
  { id: 'rain',       name: 'Rain',          icon: '🌧️', desc: 'Soft rainfall on leaves',      color: '#4fc3f7' },
  { id: 'forest',     name: 'Forest',        icon: '🌲', desc: 'Birds and wind in trees',       color: '#5a9e6f' },
  { id: 'ocean',      name: 'Ocean',         icon: '🌊', desc: 'Gentle waves on the shore',     color: '#0288d1' },
  { id: 'fire',       name: 'Fireplace',     icon: '🔥', desc: 'Crackling cosy fire',           color: '#e07060' },
  { id: 'binaural',   name: 'Binaural',      icon: '🎧', desc: 'Focus and calm tones',          color: '#7c6fff' },
  { id: 'piano',      name: 'Piano',         icon: '🎹', desc: 'Gentle instrumental music',     color: '#c9a227' },
]

const TIMERS = [10, 20, 30, 60]
const TRACKS_PER_CATEGORY = 10

// Picks a random starting track index (1-based, matching /sounds/<cat>/N.mp3)
function randomStart(): number {
  return Math.floor(Math.random() * TRACKS_PER_CATEGORY) + 1
}

export default function MusicPage({ onNavigate, dark }: Props) {
  const [playing, setPlaying] = useState<string | null>(null)
  const [trackIndex, setTrackIndex] = useState<number>(1)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [timer, setTimer] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef<number>(0)

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(null)
    setRemaining(0)
  }

  // Tries to load & play a track; on error, tries the next index (up to
  // TRACKS_PER_CATEGORY attempts) so missing files in a partially-filled
  // category don't break playback.
  const tryPlay = (categoryId: string, index: number) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    const src = `/sounds/${categoryId}/${index}.mp3`
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = 0

    audio.addEventListener('canplay', () => {
      attemptsRef.current = 0
      setUnavailable(null)
      audio.play().catch(() => {})
      // gentle fade-in
      let v = 0
      const fade = setInterval(() => {
        v += 0.05
        if (v >= 0.6 || !audioRef.current) {
          audio.volume = 0.6
          clearInterval(fade)
        } else {
          audio.volume = v
        }
      }, 80)
    })

    audio.addEventListener('error', () => {
      attemptsRef.current += 1
      if (attemptsRef.current < TRACKS_PER_CATEGORY) {
        const nextIndex = (index % TRACKS_PER_CATEGORY) + 1
        tryPlay(categoryId, nextIndex)
      } else {
        setUnavailable(categoryId)
        setPlaying(null)
      }
    })

    audioRef.current = audio
    setTrackIndex(index)
  }

  const play = (categoryId: string) => {
    if (playing === categoryId) {
      stopAudio()
      return
    }
    stopAudio()
    attemptsRef.current = 0
    setPlaying(categoryId)
    setUnavailable(null)
    const startIndex = randomStart()
    tryPlay(categoryId, startIndex)

    if (timer) {
      setRemaining(timer * 60)
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            stopAudio()
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
  }

  const shuffleTrack = () => {
    if (!playing) return
    attemptsRef.current = 0
    const nextIndex = ((trackIndex) % TRACKS_PER_CATEGORY) + 1
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    tryPlay(playing, nextIndex)
  }

  useEffect(() => () => stopAudio(), [])

  const track = TRACKS.find(t => t.id === playing)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div style={{ minHeight:'100vh', background:dark?'linear-gradient(175deg,#0a0a0a,#111118)':'linear-gradient(175deg,#eef4f7,#e4eef5,#f4f8fb)', transition:'background 0.8s ease' }}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'72px 20px 32px'}}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>{stopAudio();onNavigate('relax')}} style={{background:'none',border:'none',fontSize:14,color:dark?'#a09ec0':'#8880c0',cursor:'pointer',fontWeight:500,marginBottom:20,display:'block'}}>‹ Relax</motion.button>

        <div style={{fontSize:22,fontWeight:700,color:dark?'#e3f2fd':'#0d1b2e',marginBottom:4,letterSpacing:'-0.02em'}}>Calm Music</div>
        <div style={{fontSize:13,color:dark?'#90caf9':'#1565c0',marginBottom:20}}>Tap a sound to play · Tap again to stop</div>

        {/* Now playing */}
        {playing && track && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} style={{background:dark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.85)',borderRadius:14,padding:'14px 16px',marginBottom:16,border:`0.5px solid ${track.color}44`,display:'flex',alignItems:'center',gap:12}}>
            <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:1.5,repeat:Infinity}} style={{fontSize:28}}>{track.icon}</motion.div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:dark?'#e3f2fd':'#0d1b2e'}}>{track.name}</div>
              <div style={{fontSize:10,color:track.color}}>● Playing {remaining>0?`· ${mins}:${secs.toString().padStart(2,'0')} left`:''}</div>
            </div>
            <button onClick={shuffleTrack} style={{background:'none',border:'none',cursor:'pointer',fontSize:11,color:dark?'#90caf9':'#1565c0',fontWeight:500}}>⤭ Shuffle</button>
          </motion.div>
        )}

        {unavailable && (
          <div style={{fontSize:11,color:'#e07060',marginBottom:16,textAlign:'center'}}>
            No tracks found for this category yet — add mp3s to /public/sounds/{unavailable}/
          </div>
        )}

        {/* Timer */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:dark?'#a09ec0':'#5d5d8d',marginBottom:8}}>Auto-stop timer</div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setTimer(null)} style={{flex:1,padding:'7px 4px',borderRadius:20,fontSize:11,fontWeight:timer===null?600:400,border:'0.5px solid',borderColor:timer===null?'#7c6fff':'rgba(200,196,240,0.4)',background:timer===null?'rgba(124,111,255,0.12)':'transparent',color:timer===null?'#7c6fff':dark?'#a09ec0':'#8880c0',cursor:'pointer'}}>None</button>
            {TIMERS.map(t => (
              <button key={t} onClick={()=>setTimer(t)} style={{flex:1,padding:'7px 4px',borderRadius:20,fontSize:11,fontWeight:timer===t?600:400,border:'0.5px solid',borderColor:timer===t?'#7c6fff':'rgba(200,196,240,0.4)',background:timer===t?'rgba(124,111,255,0.12)':'transparent',color:timer===t?'#7c6fff':dark?'#a09ec0':'#8880c0',cursor:'pointer'}}>{t}m</button>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {TRACKS.map((track,i) => (
            <motion.button key={track.id} onClick={()=>play(track.id)} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} whileHover={{y:-2}} whileTap={{scale:0.97}}
              style={{
                background: playing===track.id ? `${track.color.replace(')',',0.15)').replace('rgb','rgba')}` : dark?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.85)',
                border:`0.5px solid ${playing===track.id?track.color+'66':dark?'rgba(255,255,255,0.1)':'rgba(200,196,240,0.4)'}`,
                borderRadius:14, padding:'16px 12px', textAlign:'left', cursor:'pointer',
                boxShadow: playing===track.id ? `0 4px 16px ${track.color}33` : 'none',
                transition:'all 0.2s',
              }}>
              <div style={{fontSize:24,marginBottom:6}}>{track.icon}</div>
              <div style={{fontSize:12,fontWeight:600,color:dark?'#e3f2fd':'#0d1b2e',marginBottom:2}}>{track.name}</div>
              <div style={{fontSize:9,color:dark?'#90caf9':'#5d7d9d',lineHeight:1.4}}>{track.desc}</div>
              {playing===track.id && <div style={{marginTop:6,fontSize:9,color:track.color,fontWeight:600}}>● PLAYING</div>}
            </motion.button>
          ))}
        </div>

        <div style={{marginTop:16,fontSize:11,color:dark?'#a09ec0':'#a09ec0',textAlign:'center',lineHeight:1.6}}>
          Curated ambient tracks · Tap Shuffle to try another in this category
        </div>
      </div>
    </div>
  )
}