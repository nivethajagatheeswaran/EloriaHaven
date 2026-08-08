import { motion } from 'framer-motion';
import type { ReactElement } from 'react';
import NavBar from '../components/NavBar';

interface FocusPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

interface FocusCard {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: ReactElement;
}

const cards: FocusCard[] = [
  {
    id: 'scheduler',
    title: 'Task Scheduler',
    subtitle: 'Plan your day, one gentle step at a time',
    route: 'scheduler',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="32" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M8 18H40" stroke="currentColor" strokeWidth="2" />
        <path d="M16 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 26L20 31L33 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'grades',
    title: 'Grade Analysis',
    subtitle: 'Understand your progress, no judgment',
    route: 'grades',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 38V22L24 14L38 22V38" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 38V26H30V38" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 22L24 26L30 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    subtitle: 'Focus in gentle bursts, rest in between',
    route: 'pomodoro',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M24 18V26L29 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 8H29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function FocusPage({ onNavigate, page, dark }: FocusPageProps) {
  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${
        dark ? 'bg-[#1a1830]' : ''
      }`}
      style={
        !dark
          ? { background: 'linear-gradient(180deg, #f2f0ff 0%, #ebe8ff 100%)' }
          : undefined
      }
    >
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-10 text-center"
        >
          <h1
            className={`text-2xl font-medium tracking-tight ${
              dark ? 'text-white' : 'text-[#2d2a4a]'
            }`}
          >
            Focus
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            Small, steady steps carry you further than pressure ever will.
          </p>
        </motion.div>

        <div className="flex flex-col gap-5">
          {cards.map((card, i) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.route)}
              className={`w-full text-left rounded-3xl p-6 flex items-center gap-5 backdrop-blur-md transition-shadow ${
                dark
                  ? 'bg-white/[0.06] border border-white/10 hover:bg-white/[0.09]'
                  : 'bg-white/70 border border-white/60 hover:shadow-[0_8px_30px_rgba(124,111,255,0.15)]'
              }`}
            >
              <div
                className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
                  dark ? 'bg-primary/20 text-primary-light' : 'bg-primary/10 text-primary'
                }`}
              >
                {card.icon}
              </div>
              <div>
                <h2
                  className={`text-base font-medium ${
                    dark ? 'text-white' : 'text-[#2d2a4a]'
                  }`}
                >
                  {card.title}
                </h2>
                <p
                  className={`mt-1 text-sm ${
                    dark ? 'text-white/50' : 'text-[#6b6690]'
                  }`}
                >
                  {card.subtitle}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}