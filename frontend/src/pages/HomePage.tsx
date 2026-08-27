import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import MoodFace from '../components/MoodFace'
import HavenTree from '../components/HavenTree'
import NavBar from '../components/NavBar'

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000")

const MOOD_CONFIG = (t: any) => [
  { label: t.moodVeryLow, color: '#e07060', bg: '#ffded6' },
  { label: t.moodLow,      color: '#d09060', bg: '#ffecd6' },
  { label: t.moodNeutral,  color: '#7c6fff', bg: '#eeecff' },
  { label: t.moodGood,     color: '#5a9e6f', bg: '#e8f5e9' },
  { label: t.moodGreat,    color: '#c9a227', bg: '#fff8e1' },
]

const AMBIENCE = [
  { bg: 'linear-gradient(160deg,#ffe8d6 0%,#ffd6e7 50%,#f0e6ff 100%)', greeting: 'linear-gradient(135deg,#e07060aa,#e07060ee)' },
  { bg: 'linear-gradient(160deg,#fff3e0 0%,#ffe0b2 40%,#f3e5f5 100%)', greeting: 'linear-gradient(135deg,#d09060aa,#d09060ee)' },
  { bg: 'linear-gradient(160deg,#f2f0ff 0%,#ebe8ff 50%,#f8f7ff 100%)', greeting: 'linear-gradient(135deg,#a99fff,#7c6fff)' },
  { bg: 'linear-gradient(160deg,#eef7f0 0%,#e4f4e8 55%,#f4fbf5 100%)', greeting: 'linear-gradient(135deg,#5a9e6faa,#5a9e6fee)' },
  { bg: 'linear-gradient(160deg,#fffbee 0%,#fdf5d8 55%,#fffdf5 100%)', greeting: 'linear-gradient(135deg,#c9a227aa,#c9a227ee)' },
]

const TIME_BG: Record<string, string> = {
  night:   'linear-gradient(175deg,#080520 0%,#12103a 55%,#1a1050 100%)',
  dawn:    'linear-gradient(175deg,#1a1040 0%,#ff6b35 40%,#ffd194 75%,#ffe8d0 100%)',
  morning: 'linear-gradient(175deg,#c9e8f5 0%,#ddf0fa 45%,#eef7ff 100%)',
  noon:    'linear-gradient(175deg,#e0f0ff 0%,#c8e8ff 45%,#eef7ff 100%)',
  evening: 'linear-gradient(175deg,#1a0533 0%,#5c1a45 35%,#c85c38 65%,#f4c97a 100%)',
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 0  && h < 5)  return 'night'
  if (h >= 5  && h < 8)  return 'dawn'
  if (h >= 8  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'noon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

function getGreeting(t: any) {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { text: t.goodMorning,   emoji: '🌤️' }
  if (h >= 12 && h < 17) return { text: t.goodAfternoon, emoji: '☀️' }
  if (h >= 17 && h < 21) return { text: t.goodEvening,   emoji: '🌙' }
  return { text: t.goodNight, emoji: '🌟' }
}


const QUICK_ACTIONS = (t: any) => [
  { label: t.relaxLabel,   sub: t.relaxSub,   page: 'relax'   },
  { label: t.focusLabel,   sub: t.focusSub,   page: 'focus'   },
  { label: t.journalLabel, sub: t.journalSub, page: 'journal' },
  { label: t.talkLabel,    sub: t.talkSub,    page: 'chat'    },
]

const LANGUAGES = [
  { code: 'English',   label: 'English',   native: 'English'   },
  { code: 'Tamil',     label: 'Tamil',     native: 'தமிழ்'     },
  { code: 'Telugu',    label: 'Telugu',    native: 'తెలుగు'    },
  { code: 'Malayalam', label: 'Malayalam', native: 'മലയാളം'    },
  { code: 'Kannada',   label: 'Kannada',   native: 'ಕನ್ನಡ'     },
  { code: 'Hindi',     label: 'Hindi',     native: 'हिंदी'     },
]

interface HomePageProps {
  onNavigate: (page: string) => void
  onLogout: () => void
  dark: boolean
  onToggleDark: () => void
  page: string
  lang: string
  onLangChange: (code: string) => void
  t: any
}

export default function HomePage({ onNavigate, onLogout, dark, onToggleDark, page, lang, onLangChange, t }: HomePageProps) {
  const { nickname, moodAmbience, setMoodAmbience, treeStats, addTreeAction } = useStore()
  const [selectedMood, setSelectedMood] = useState<number | null>(moodAmbience ? moodAmbience - 1 : null)
  const [moodSaved, setMoodSaved] = useState(false)
  const [showTree, setShowTree] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const timeOfDay = getTimeOfDay()
  const amb = selectedMood !== null ? AMBIENCE[selectedMood] : null
  const bg = dark
    ? 'linear-gradient(175deg,#080520 0%,#12103a 55%,#1a1050 100%)'
    : amb ? amb.bg : TIME_BG[timeOfDay]

  const greetingBg = amb ? amb.greeting : 'linear-gradient(135deg,#a99fff,#7c6fff)'

  const handleMoodSelect = async (index: number) => {
    setSelectedMood(index)
    setMoodAmbience(index + 1)
    if (!moodSaved) {
      try {
        await fetch(`${API}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ mood: index + 1, note: '' })
        })
        addTreeAction('checkin')
        setMoodSaved(true)
      } catch (e) { console.error(e) }
    }
  }

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden"
      animate={{ background: bg }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      style={{ background: bg }}>

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-5 pt-4 pb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="text-xs font-medium px-3 py-1.5 rounded-full
            bg-white/20 backdrop-blur-md border border-white/30
            text-white/70 hover:text-white/90 transition-colors">
          {t.logout}
        </motion.button>
        <div className="flex gap-2 items-center">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('support')}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30
              flex items-center justify-center text-sm">
            🆘
          </motion.button>
          <div className="relative">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setShowLangMenu(v => !v)}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30
                flex items-center justify-center text-sm">
              🌐
            </motion.button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 rounded-xl bg-white/95 backdrop-blur-md
                    border border-white/50 shadow-lg overflow-hidden z-50 min-w-[150px]">
                  {LANGUAGES.map(l => (
                    <div
                      key={l.code}
                      onClick={() => { onLangChange(l.code); setShowLangMenu(false) }}
                      className={`px-4 py-2.5 text-xs cursor-pointer flex justify-between items-center
                        ${lang === l.code ? 'bg-primary/10 text-primary font-medium' : 'text-[#1a1a2e] hover:bg-black/5'}`}>
                      <span>{l.label}</span>
                      <span className="opacity-60">{l.native}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => onToggleDark()}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30
              flex items-center justify-center text-sm">
            {dark ? '☀️' : '🌙'}
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 pt-20 pb-28 px-5 max-w-md mx-auto overflow-y-auto min-h-screen no-scrollbar">

        {/* Greeting card */}
        <motion.div
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{ background: greetingBg }}
          animate={{ background: greetingBg }}
          transition={{ duration: 0.8 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}>
          <div className="text-white/70 text-xs mb-1 font-medium">
            {getGreeting(t).text} {getGreeting(t).emoji}
          </div>
          <div className="text-white text-lg font-semibold tracking-tight mb-0.5">
            {nickname}
          </div>
          <div className="text-white/70 text-xs">{t.howFeeling}</div>
          {/* Decorative shine */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8"/>
        </motion.div>

        {/* Mood selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}>
          <div className="text-sm font-semibold text-[#1a1a2e] mb-3 tracking-tight">{t.homeMoodLabel}</div>
          <div className="flex gap-2 mb-5">
            {MOOD_CONFIG(t).map((m, i) => (
              <motion.button
                key={i}
                onClick={() => handleMoodSelect(i)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -2 }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all duration-200
                  ${selectedMood === i
                    ? 'border-primary/60 shadow-md'
                    : 'border-white/40 bg-white/60 backdrop-blur-sm'}`}
                style={{
                  background: selectedMood === i ? m.bg : 'rgba(255,255,255,0.6)',
                  boxShadow: selectedMood === i ? `0 4px 14px ${m.color}33` : undefined
                }}>
                <motion.div
                  animate={{ scale: selectedMood === i ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <MoodFace index={i} size={selectedMood === i ? 34 : 28} selected={selectedMood === i}/>
                </motion.div>
                <span className="text-[9px] font-medium leading-none"
                  style={{ color: selectedMood === i ? m.color : '#a09ec0' }}>
                  {m.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Mood saved confirmation */}
        <AnimatePresence>
          {moodSaved && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm
                border border-white/50 text-xs text-[#5a9e6f] font-medium">
              {t.checkinSavedMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Haven Tree preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowTree(v => !v)}
          className="mb-5 p-4 rounded-2xl bg-white/72 backdrop-blur-md
            border border-white/50 cursor-pointer"
          whileTap={{ scale: 0.98 }}>
          <div className="flex items-center gap-3">
            <HavenTree
              leaves={treeStats.leaves}
              flowers={treeStats.flowers}
              birds={treeStats.birds}
              fireflies={treeStats.fireflies}
              size={48}/>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1a1a2e] mb-0.5"> {t.yourHavenTree}</div>
              <div className="text-xs text-success">{t.dayLabel} {treeStats.day} · {treeStats.leaves} {t.leavesGrowing}</div>
            </div>
            <motion.span
              animate={{ rotate: showTree ? 90 : 0 }}
              className="text-[#c8c4f0] text-sm">›</motion.span>
          </div>

          {/* Expanded tree stats */}
          <AnimatePresence>
            {showTree && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden">
                <div className="pt-4 flex justify-center mb-3">
                  <HavenTree
                    leaves={treeStats.leaves}
                    flowers={treeStats.flowers}
                    birds={treeStats.birds}
                    fireflies={treeStats.fireflies}
                    size={140}/>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { val: treeStats.leaves,    lbl: 'Leaves',    color: '#5a9e6f' },
                    { val: treeStats.flowers,   lbl: 'Flowers',   color: '#e07060' },
                    { val: treeStats.birds,     lbl: 'Birds',     color: '#7c6fff' },
                    { val: treeStats.fireflies, lbl: 'Fireflies', color: '#c9a227' },
                  ].map(s => (
                    <div key={s.lbl} className="text-center py-2 rounded-xl bg-white/50">
                      <div className="text-base font-semibold" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[9px] text-[#a09ec0]">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('tree') }}
                  className="w-full text-center text-xs font-medium text-primary py-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
                  {t.seeFullTree}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}>
          <div className="text-sm font-semibold text-[#1a1a2e] mb-3 tracking-tight">{t.whatWouldYouLikeShort}</div>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS(t).map((q, i) => (
              <motion.button
                key={q.page}
                onClick={() => onNavigate(q.page)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(124,111,255,0.18)' }}
                whileTap={{ scale: 0.97 }}
                className="text-left p-4 rounded-2xl bg-white/75 backdrop-blur-sm
                  border border-white/50 cursor-pointer transition-all">
                <div className="text-sm font-semibold text-[#1a1a2e] mb-1">{q.label}</div>
                <div className="text-[10px] text-[#a09ec0] leading-relaxed">{q.sub}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </motion.div>
  )
}