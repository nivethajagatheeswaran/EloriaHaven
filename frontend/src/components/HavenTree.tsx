import React from 'react'
import { motion } from 'framer-motion'

interface Props {
  leaves: number
  flowers: number
  birds: number
  fireflies: number
  size?: number
}

export default function HavenTree({ leaves, flowers, birds, fireflies, size = 160 }: Props) {
  const scale = size / 160

  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      {/* Trunk */}
      <motion.rect x="74" y="118" width="12" height="32" rx="4"
        fill="#8B6914" opacity="0.75"
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}/>

      {/* Base canopy */}
      <motion.ellipse cx="80" cy="102" rx="34" ry="28"
        fill="#4CAF50" opacity="0.8"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'backOut' }}/>

      {/* Mid canopy */}
      <motion.ellipse cx="80" cy="84" rx="26" ry="24"
        fill="#66BB6A" opacity="0.85"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: 'backOut' }}/>

      {/* Top canopy */}
      <motion.ellipse cx="80" cy="68" rx="18" ry="18"
        fill="#81C784" opacity="0.88"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7, ease: 'backOut' }}/>

      {/* Leaves */}
      {leaves > 0 && <motion.circle cx="62" cy="94" r="4.5" fill="#FFEB3B" opacity="0.75"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 }}/>}
      {leaves > 1 && <motion.circle cx="96" cy="98" r="4.5" fill="#FF8A65" opacity="0.75"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0 }}/>}
      {leaves > 2 && <motion.circle cx="74" cy="80" r="3.5" fill="#CE93D8" opacity="0.75"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }}/>}
      {leaves > 3 && <motion.circle cx="90" cy="84" r="3.5" fill="#FFEB3B" opacity="0.65"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}/>}

      {/* Flowers */}
      {flowers > 0 && <motion.text x="52" y="115" fontSize="14"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>🌸</motion.text>}
      {flowers > 1 && <motion.text x="98" y="112" fontSize="11"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>🌸</motion.text>}

      {/* Birds */}
      {birds > 0 && <motion.text x="46" y="138" fontSize="14"
        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.3 }}>🐦</motion.text>}
      {birds > 1 && <motion.text x="92" y="134" fontSize="11"
        initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.4 }}>🐦</motion.text>}

      {/* Fireflies */}
      {fireflies > 0 && (
        <motion.circle cx="36" cy="116" r="2.5" fill="#FFFF88" opacity="0.5"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}/>
      )}
      {fireflies > 1 && (
        <motion.circle cx="126" cy="108" r="2" fill="#FFFF88" opacity="0.45"
          animate={{ opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}/>
      )}
      {fireflies > 2 && (
        <motion.circle cx="28" cy="128" r="1.8" fill="#FFFF88" opacity="0.4"
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}/>
      )}
      {fireflies > 3 && (
        <motion.circle cx="130" cy="126" r="2.2" fill="#FFFF88" opacity="0.35"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}/>
      )}
    </svg>
  )
}