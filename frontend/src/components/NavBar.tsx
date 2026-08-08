import React from 'react'
import { motion } from 'framer-motion'

interface NavBarProps {
  page: string
  onNavigate: (page: string) => void
}

const items = [
  { icon: '🏠', label: 'Home',    page: 'home'    },
  { icon: '🌿', label: 'Relax',   page: 'relax'   },
  { icon: '🎯', label: 'Focus',   page: 'focus'   },
  { icon: '📓', label: 'Journal', page: 'journal' },
  { icon: '📚', label: 'Library', page: 'library' },
]

export default function NavBar({ page, onNavigate }: NavBarProps) {
  return (
    <nav style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 40px)', maxWidth: 380, zIndex: 100,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
      border: '0.5px solid rgba(255,255,255,0.6)',
      borderRadius: 16, padding: '10px 0 8px',
      boxShadow: '0 4px 24px rgba(124,111,255,0.12)',
    }}>
      {items.map(item => (
        <motion.button
          key={item.page}
          onClick={() => onNavigate(item.page)}
          whileTap={{ scale: 0.88 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '0 12px', background: 'none', border: 'none',
            cursor: 'pointer', color: page === item.page ? '#7c6fff' : '#b0aed0',
            transition: 'color 0.2s',
          }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1 }}>{item.label}</span>
          {page === item.page && (
            <motion.div
              layoutId="nav-dot"
              style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c6fff', marginTop: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </nav>
  )
}