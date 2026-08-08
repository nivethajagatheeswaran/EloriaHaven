import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../components/NavBar';

const API = 'http://localhost:8000';

const FOCUS_SECONDS = 25 * 60;
const REST_SECONDS = 5 * 60;

type Mode = 'focus' | 'rest';
type Sound = 'none' | 'rain' | 'forest' | 'ocean' | 'wind' | 'waves';
const TRACKS_PER_CATEGORY = 10;

interface PomodoroPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

export default function PomodoroPage({ onNavigate, page, dark }: PomodoroPageProps) {
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sound, setSound] = useState<Sound>('none');
  const [checkIn, setCheckIn] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attemptsRef = useRef<number>(0);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  // ── Timer ──────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleSessionEnd();
            return s;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleSessionEnd = useCallback(() => {
    setRunning(false);
    const finishedMode = mode;
    const nextMode: Mode = finishedMode === 'focus' ? 'rest' : 'focus';
    const newCount = finishedMode === 'focus' ? sessionsCompleted + 1 : sessionsCompleted;

    setSessionsCompleted(newCount);
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_SECONDS : REST_SECONDS);

    fetch(`${API}/focus/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ sessions_completed: newCount || 1, just_finished: finishedMode }),
    })
      .then((r) => r.json())
      .then((data) => setCheckIn(data.message))
      .catch(() => setCheckIn(finishedMode === 'focus' ? "Nice work — take your rest." : "Ready when you are."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionsCompleted]);

  // ── Controls ───────────────────────────────────────
  const toggleRunning = () => setRunning((r) => !r);

  const reset = () => {
    setRunning(false);
    setMode('focus');
    setSecondsLeft(FOCUS_SECONDS);
  };

  const skip = () => handleSessionEnd();

  // ── Ambient sound (procedural, no audio files) ─────
  useEffect(() => {
    stopSound();
    if (sound !== 'none') startSound(sound);
    return () => stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  useEffect(() => stopSound, []);

  const startSound = (kind: Sound) => {
    if (kind === 'none') return;
    attemptsRef.current = 0;
    const startIndex = Math.floor(Math.random() * TRACKS_PER_CATEGORY) + 1;
    tryPlay(kind, startIndex);
  };

  const tryPlay = (kind: Sound, index: number) => {
    const src = `/sounds/${kind}/${index}.mp3`;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;

    audio.addEventListener('canplay', () => {
      attemptsRef.current = 0;
      audio.play().catch(() => {});
      let v = 0;
      const fade = setInterval(() => {
        v += 0.05;
        if (v >= 0.5 || audioRef.current !== audio) {
          audio.volume = 0.5;
          clearInterval(fade);
        } else {
          audio.volume = v;
        }
      }, 80);
    });

    audio.addEventListener('error', () => {
      attemptsRef.current += 1;
      if (attemptsRef.current < TRACKS_PER_CATEGORY) {
        tryPlay(kind, (index % TRACKS_PER_CATEGORY) + 1);
      }
    });

    audioRef.current = audio;
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // ── Display ────────────────────────────────────────
  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : REST_SECONDS;
  const progress = 1 - secondsLeft / totalSeconds;
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');

  const radius = 110;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${dark ? 'bg-[#1a1830]' : ''}`}
      style={!dark ? { background: 'linear-gradient(180deg, #f2f0ff 0%, #ebe8ff 100%)' } : undefined}
    >
      <div className="max-w-lg mx-auto px-6 pt-10 pb-28 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full mb-6"
        >
          <button
            onClick={() => onNavigate('focus')}
            className={`text-sm mb-3 ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
          >
            ← Focus
          </button>
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            Pomodoro Timer
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            {mode === 'focus' ? 'Twenty-five minutes, one thing at a time.' : 'A short rest. No screens if you can help it.'}
          </p>
        </motion.div>

        {/* Timer ring */}
        <div className="relative w-64 h-64 my-6">
          <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(124,111,255,0.1)'}
              strokeWidth="10"
            />
            <motion.circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={mode === 'focus' ? '#7c6fff' : '#4fc3f7'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.6, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-light tabular-nums ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
              {mins}:{secs}
            </span>
            <span className={`mt-2 text-xs uppercase tracking-wide ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
              {mode === 'focus' ? 'Focus' : 'Rest'} · Session {sessionsCompleted + 1}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={reset}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm ${
              dark ? 'bg-white/[0.06] text-white/60 border border-white/10' : 'bg-white/60 text-[#6b6690] border border-white/50'
            }`}
            aria-label="Reset"
          >
            ↺
          </button>
          <button
            onClick={toggleRunning}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium shadow-[0_8px_24px_rgba(124,111,255,0.35)]"
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={skip}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm ${
              dark ? 'bg-white/[0.06] text-white/60 border border-white/10' : 'bg-white/60 text-[#6b6690] border border-white/50'
            }`}
            aria-label="Skip to next session"
          >
            ⏭
          </button>
        </div>

        {/* Ambient sound picker */}
        <div className="flex items-center gap-2 mb-6">
          {(['none', 'rain', 'wind', 'waves'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSound(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sound === s
                  ? 'bg-primary text-white'
                  : dark
                  ? 'bg-white/[0.06] text-white/50 border border-white/10'
                  : 'bg-white/60 text-[#6b6690] border border-white/50'
              }`}
            >
              {s === 'none' ? 'Silence' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Eloria check-in */}
        <AnimatePresence>
          {checkIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`w-full rounded-2xl px-5 py-4 text-center text-sm ${
                dark ? 'bg-white/[0.06] border border-white/10 text-white/80' : 'bg-white/70 border border-white/60 text-[#4a4570]'
              }`}
            >
              {checkIn}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}