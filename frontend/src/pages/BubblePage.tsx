import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props { onNavigate: (page: string) => void; dark: boolean }

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  popped: boolean
}

const BUBBLE_COLORS = [
  'rgba(124,111,255,0.35)',
  'rgba(90,158,111,0.35)',
  'rgba(201,162,39,0.30)',
  'rgba(224,112,96,0.30)',
  'rgba(79,195,247,0.35)',
  'rgba(255,133,161,0.30)',
]

const POP_COLORS = ['#7c6fff','#5a9e6f','#c9a227','#e07060','#4fc3f7','#ff85a1']

function makeBubble(id: number): Bubble {
  return {
    id,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 75,
    size: 28 + Math.random() * 44,
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    duration: 5 + Math.random() * 6,
    delay: Math.random() * 3,
    popped: false,
  }
}

export default function BubblePage({ onNavigate, dark }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: 12 }, (_, i) => makeBubble(i))
  )
  const [popEffects, setPopEffects] = useState<{ id:number; x:number; y:number; color:string }[]>([])
  const [poppedCount, setPoppedCount] = useState(0)
  const nextId = useRef(20)

  // Respawn bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => {
        const alive = prev.filter(b => !b.popped)
        if (alive.length < 10) {
          return [...alive, makeBubble(nextId.current++)]
        }
        return prev
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const popBubble = useCallback((bubble: Bubble, e: React.MouseEvent | React.TouchEvent) => {
    if (bubble.popped) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const color = POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)]

    setBubbles(prev => prev.map(b => b.id === bubble.id ? {...b, popped: true} : b))
    setPoppedCount(c => c + 1)

    const effectId = Date.now()
    setPopEffects(prev => [...prev, { id: effectId, x, y, color }])
    setTimeout(() => {
      setPopEffects(prev => prev.filter(e => e.id !== effectId))
      setBubbles(prev => prev.filter(b => b.id !== bubble.id))
    }, 600)

    // Play pop sound via Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(400 + Math.random() * 300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start(); osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(175deg,#062020 0%,#041a1a 100%)'
        : 'linear-gradient(175deg,#e8f7f9 0%,#d4f0f4 55%,#edfbfc 100%)',
      position: 'relative', overflow: 'hidden',
      transition: 'background 0.8s ease',
    }}>

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '56px 20px 0', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.button whileTap={{scale:0.95}} onClick={()=>onNavigate('relax')} style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'0.5px solid rgba(255,255,255,0.4)',borderRadius:20,padding:'6px 14px',fontSize:13,color:dark?'#80deea':'#00838f',cursor:'pointer',fontWeight:500}}>‹ Relax</motion.button>
        <div style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'0.5px solid rgba(255,255,255,0.4)',borderRadius:20,padding:'6px 14px',fontSize:12,color:dark?'#80deea':'#006064',fontWeight:600}}>
          {poppedCount} popped
        </div>
      </div>

      {/* Hint */}
      <div style={{ position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: dark?'rgba(128,222,234,0.6)':'rgba(0,96,100,0.5)', fontWeight: 500, zIndex: 10 }}>
        Tap to pop
      </div>

      {/* Bubbles */}
      {bubbles.filter(b => !b.popped).map(bubble => (
        <motion.div
          key={bubble.id}
          style={{
            position: 'absolute',
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            background: bubble.color,
            border: `1px solid ${bubble.color.replace('0.35','0.6').replace('0.30','0.5')}`,
            cursor: 'pointer',
            zIndex: 5,
          }}
          animate={{ y: [0, -12, 5, -8, 0], x: [0, 5, -4, 3, 0] }}
          transition={{ duration: bubble.duration, delay: bubble.delay, repeat: Infinity, ease: 'easeInOut' }}
          onClick={(e) => popBubble(bubble, e)}
          onTouchStart={(e) => { e.preventDefault(); popBubble(bubble, e) }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.1 }}>
          {/* Shine effect */}
          <div style={{ width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', position: 'absolute', top: '15%', left: '15%' }}/>
        </motion.div>
      ))}

      {/* Pop effects */}
      <AnimatePresence>
        {popEffects.map(effect => (
          <motion.div
            key={effect.id}
            style={{ position: 'fixed', left: effect.x, top: effect.y, pointerEvents: 'none', zIndex: 50 }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}>
            {Array.from({length: 8}).map((_,i) => {
              const angle = (i / 8) * Math.PI * 2
              const dist = 30 + Math.random() * 20
              return (
                <motion.div key={i}
                  style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: effect.color, left: 0, top: 0 }}
                  animate={{ x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}/>
              )
            })}
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  )
}