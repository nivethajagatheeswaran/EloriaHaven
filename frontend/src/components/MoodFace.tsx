import React from 'react'

interface Props { index: number; size?: number; selected?: boolean }

export default function MoodFace({ index, size = 32, selected = false }: Props) {
  const configs = [
    { fill: '#ffded6', stroke: '#e07060', dash: '2 1.5',
      eyes: <><ellipse cx="14" cy="16" rx="2.5" ry="3" fill="#e07060" opacity="0.7"/><ellipse cx="26" cy="16" rx="2.5" ry="3" fill="#e07060" opacity="0.7"/></>,
      mouth: <path d="M13 28 Q16 24 20 25 Q24 24 27 28" stroke="#e07060" strokeWidth="1.8" strokeLinecap="round" fill="none"/>,
      extra: <><path d="M11 12 Q13 10 15 12" stroke="#e07060" strokeWidth="1.1" strokeLinecap="round" fill="none"/><path d="M25 12 Q27 10 29 12" stroke="#e07060" strokeWidth="1.1" strokeLinecap="round" fill="none"/></> },
    { fill: '#ffecd6', stroke: '#d09060', dash: '3 1.5',
      eyes: <><ellipse cx="14" cy="17" rx="2.2" ry="2.8" fill="#d09060" opacity="0.7"/><ellipse cx="26" cy="17" rx="2.2" ry="2.8" fill="#d09060" opacity="0.7"/></>,
      mouth: <path d="M13 27 Q20 24 27 27" stroke="#d09060" strokeWidth="1.8" strokeLinecap="round" fill="none"/>,
      extra: null },
    { fill: '#eeecff', stroke: '#7c6fff', dash: '',
      eyes: <><circle cx="14" cy="17" r="2.4" fill="#7c6fff" opacity="0.65"/><circle cx="26" cy="17" r="2.4" fill="#7c6fff" opacity="0.65"/></>,
      mouth: <line x1="13" y1="27" x2="27" y2="27" stroke="#7c6fff" strokeWidth="1.8" strokeLinecap="round"/>,
      extra: <><circle cx="8" cy="9" r="1.2" fill="#7c6fff" opacity="0.25"/><circle cx="32" cy="9" r="1.2" fill="#7c6fff" opacity="0.25"/></> },
    { fill: '#e8f5e9', stroke: '#5a9e6f', dash: '4 1.5',
      eyes: <><circle cx="14" cy="16" r="2.5" fill="#5a9e6f" opacity="0.75"/><circle cx="26" cy="16" r="2.5" fill="#5a9e6f" opacity="0.75"/></>,
      mouth: <path d="M12 25 Q16 31 20 29 Q24 31 28 25" stroke="#5a9e6f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>,
      extra: <path d="M17 13 Q20 11 23 13" stroke="#5a9e6f" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/> },
    { fill: '#fff8e1', stroke: '#c9a227', dash: '2 0.8',
      eyes: <><circle cx="14" cy="15" r="3" fill="#c9a227" opacity="0.85"/><circle cx="26" cy="15" r="3" fill="#c9a227" opacity="0.85"/></>,
      mouth: <path d="M11 25 Q15 33 20 31 Q25 33 29 25" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" fill="none"/>,
      extra: <><circle cx="33" cy="8" r="2" fill="#c9a227" opacity="0.3"/><circle cx="7" cy="10" r="1.5" fill="#c9a227" opacity="0.3"/></> },
  ]
  const c = configs[Math.min(index, 4)]
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      style={{ filter: selected ? `drop-shadow(0 2px 8px ${c.stroke}44)` : 'none', transition: 'filter 0.2s' }}>
      <circle cx="20" cy="20" r="17" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" strokeDasharray={c.dash}/>
      {c.eyes}{c.mouth}{c.extra}
    </svg>
  )
}