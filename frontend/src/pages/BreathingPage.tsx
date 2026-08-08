import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

interface Props {
  onNavigate: (page: string) => void
  dark: boolean
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest'

interface PhaseConfig {
  label: string
  sublabel: string
  duration: number
  scale: number
  color: string
}

const PHASES: PhaseConfig[] = [
  { label: 'Breathe In',  sublabel: 'Through your nose',  duration: 4, scale: 1.3,  color: '#7c6fff' },
  { label: 'Hold',        sublabel: 'Gently hold',         duration: 7, scale: 1.3,  color: '#5a9e6f' },
  { label: 'Breathe Out', sublabel: 'Slowly through mouth',duration: 8, scale: 0.85, color: '#4fc3f7' },
  { label: 'Rest',        sublabel: 'Natural pause',        duration: 2, scale: 0.85, color: '#c9a227' },
]

const TOTAL_ROUNDS = 3

export default function BreathingPage({ onNavigate, dark }: Props) {
  const { addTreeAction } = useStore()
  const [started, setStarted] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [countdown, setCountdown] = useState(PHASES[0].duration)
  const [completed, setCompleted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phase = PHASES[phaseIndex]

  useEffect(() => {
    if (!started || completed) return
    setCountdown(phase.duration)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          const nextPhase = (phaseIndex + 1) % PHASES.length
          if (nextPhase === 0) {
            if (round >= TOTAL_ROUNDS) {
              setCompleted(true)
              addTreeAction('breathing')
              return 0
            }
            setRound(r => r + 1)
          }
          setPhaseIndex(nextPhase)
          return PHASES[nextPhase].duration
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [started, phaseIndex, round, completed])

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStarted(false)
    setPhaseIndex(0)
    setRound(1)
    setCountdown(PHASES[0].duration)
    setCompleted(false)
  }

  const totalProgress = ((round - 1) * PHASES.length + phaseIndex) / (TOTAL_ROUNDS * PHASES.length)

  if (completed) return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(175deg,#0a0a20 0%,#0d0d2e 100%)'
        : 'linear-gradient(175deg,#f2f0ff 0%,#ebe8ff 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ fontSize: 72, marginBottom: 20 }}>
        🌸
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: 22, fontWeight: 700, color: dark ? '#e8e4ff' : '#1a1a2e', marginBottom: 8 }}>
        Well done
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: 14, color: dark ? '#a09ec0' : '#5d5d8d', marginBottom: 8, lineHeight: 1.7 }}>
        You completed {TOTAL_ROUNDS} rounds of 4-7-8 breathing.
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ fontSize: 13, color: '#5a9e6f', marginBottom: 32 }}>
        🌳 A flower just bloomed on your Haven Tree
      </motion.div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onNavigate('relax')}
        style={{
          background: 'linear-gradient(135deg,#9b8fff,#7c6fff)',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '13px 32px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 12,
          boxShadow: '0 4px 14px rgba(124,111,255,0.3)',
        }}>
        Back to Relax
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setCompleted(false); setStarted(false); setPhaseIndex(0); setRound(1) }}
        style={{
          background: 'transparent', color: '#7c6fff',
          border: '0.5px solid #7c6fff', borderRadius: 12,
          padding: '12px 32px', fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
        }}>
        Go again
      </motion.button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(175deg,#0a0a20 0%,#0d0d2e 100%)'
        : 'linear-gradient(175deg,#f2f0ff 0%,#ebe8ff 50%,#f8f7ff 100%)',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.8s ease',
    }}>

      {/* Back button */}
      <div style={{ padding: '56px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { stop(); onNavigate('relax') }}
          style={{ background: 'none', border: 'none', fontSize: 14, color: dark ? '#a09ec0' : '#8880c0', cursor: 'pointer', fontWeight: 500 }}>
          ‹ Relax
        </motion.button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        {!started ? (
          // Start screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🌬️</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: dark ? '#e8e4ff' : '#1a1a2e', marginBottom: 8, letterSpacing: '-0.02em' }}>
              4-7-8 Breathing
            </div>
            <div style={{ fontSize: 13, color: dark ? '#a09ec0' : '#5d5d8d', lineHeight: 1.7, marginBottom: 12 }}>
              A calming technique that activates your body's natural relaxation response.
            </div>
            <div style={{
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 28, textAlign: 'left',
              border: `0.5px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(200,196,240,0.4)'}`,
            }}>
              {PHASES.filter(p => p.label !== 'Rest').map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 10 : 0, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: p.color, flexShrink: 0 }}>
                    {p.duration}s
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: dark ? '#e8e4ff' : '#1a1a2e' }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: dark ? '#a09ec0' : '#8880c0' }}>{p.sublabel}</div>
                  </div>
                </div>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStarted(true)}
              style={{
                width: '100%', background: 'linear-gradient(135deg,#9b8fff,#7c6fff)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: 14, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,111,255,0.3)',
              }}>
              Begin
            </motion.button>
          </motion.div>
        ) : (
          // Active breathing
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>

            {/* Round indicator */}
            <div style={{ fontSize: 12, color: dark ? '#a09ec0' : '#8880c0', marginBottom: 32, fontWeight: 500 }}>
              Round {round} of {TOTAL_ROUNDS}
            </div>

            {/* Breathing circle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              {/* Outer ring */}
              <motion.div
                animate={{ scale: phase.scale, opacity: started ? 0.3 : 0 }}
                transition={{ duration: phase.duration, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: 200, height: 200, borderRadius: '50%',
                  border: `1.5px solid ${phase.color}`,
                }}/>
              {/* Middle ring */}
              <motion.div
                animate={{ scale: phase.scale * 0.85 }}
                transition={{ duration: phase.duration, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: 200, height: 200, borderRadius: '50%',
                  border: `1px solid ${phase.color}44`,
                }}/>
              {/* Main circle */}
              <motion.div
                animate={{
                  scale: phase.scale,
                  background: [
                    `radial-gradient(circle, ${phase.color}55, ${phase.color}22)`,
                  ],
                }}
                transition={{ duration: phase.duration, ease: 'easeInOut' }}
                style={{
                  width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, ${phase.color}44, ${phase.color}11)`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  zIndex: 1,
                }}>
                {/* Phase text */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phaseIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: phase.color, marginBottom: 4 }}>
                      {phase.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: phase.color, lineHeight: 1 }}>
                      {countdown}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Phase sublabel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIndex + '-sub'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: 13, color: dark ? '#a09ec0' : '#8880c0', marginBottom: 32 }}>
                {phase.sublabel}
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 4, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(200,196,240,0.3)', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${totalProgress * 100}%` }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: `linear-gradient(90deg, #9b8fff, #7c6fff)`, borderRadius: 3 }}/>
            </div>

            {/* Stop button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={stop}
              style={{
                background: 'transparent',
                border: `0.5px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(200,196,240,0.5)'}`,
                color: dark ? '#a09ec0' : '#8880c0',
                borderRadius: 20, padding: '8px 24px',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}>
              Stop
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}