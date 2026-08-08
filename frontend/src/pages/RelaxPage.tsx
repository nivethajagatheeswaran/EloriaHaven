import React from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'

interface Props {
  onNavigate: (page: string) => void
  page: string
  dark: boolean
}

const therapies = [
  { id: 'breathing', icon: '🌬️', name: 'Breathing',    sub: '4-7-8 guided exercise',      color: '#7c6fff', bg: 'rgba(124,111,255,0.08)' },
  { id: 'music',     icon: '🎵', name: 'Calm Music',   sub: 'Rain · Forest · Ocean',       color: '#5a9e6f', bg: 'rgba(90,158,111,0.08)'  },
  { id: 'stories',   icon: '📖', name: 'Stories',      sub: 'Eloria narrates for you',      color: '#d09060', bg: 'rgba(208,144,96,0.08)'  },
  { id: 'kolam',     icon: '🔯', name: 'Kolam',        sub: 'Trace the pattern · Unique',   color: '#c9a227', bg: 'rgba(201,162,39,0.08)'  },
  { id: 'scribble',  icon: '🎨', name: 'Scribble',     sub: 'Express freely on canvas',     color: '#e07060', bg: 'rgba(224,112,96,0.08)'  },
  { id: 'bubbles',   icon: '🫧', name: 'Bubble Pop',   sub: 'Pop bubbles to release stress', color: '#4fc3f7', bg: 'rgba(79,195,247,0.08)' },
]

export default function RelaxPage({ onNavigate, page, dark }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(175deg,#0d1f0d 0%,#0a1a0a 100%)'
        : 'linear-gradient(175deg,#eef7f0 0%,#e4f4e8 55%,#f4fbf5 100%)',
      transition: 'background 0.8s ease',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '72px 20px 100px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: dark ? '#e8f5e9' : '#1a2e1a', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Relax
          </div>
          <div style={{ fontSize: 13, color: dark ? '#81c784' : '#5a9e6f' }}>
            Choose what your mind needs right now
          </div>
        </motion.div>

        {/* Therapy grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {therapies.map((therapy, i) => (
            <motion.button
              key={therapy.id}
              onClick={() => onNavigate(therapy.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              whileHover={{ y: -3, boxShadow: `0 8px 24px ${therapy.color}22` }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                border: `0.5px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}`,
                borderRadius: 16,
                padding: '18px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: therapy.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 10,
              }}>
                {therapy.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: dark ? '#e8f5e9' : '#1a2e1a', marginBottom: 3, letterSpacing: '-0.01em' }}>
                {therapy.name}
              </div>
              <div style={{ fontSize: 10, color: dark ? '#81c784' : '#7a9e7a', lineHeight: 1.4 }}>
                {therapy.sub}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Gentle note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 20,
            background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 12,
            color: dark ? '#81c784' : '#5a9e6f',
            lineHeight: 1.6,
            border: `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(90,158,111,0.2)'}`,
          }}>
          💜 Each activity you complete grows your Haven Tree
        </motion.div>

      </div>
      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  )
}