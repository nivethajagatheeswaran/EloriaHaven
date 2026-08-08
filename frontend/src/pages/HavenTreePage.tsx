import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import HavenTree from '../components/HavenTree';
import { useStore } from '../store';

interface HavenTreePageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

function getStage(day: number): { name: string; blurb: string } {
  if (day <= 3) return { name: 'Seedling', blurb: 'Just getting started. Every small action counts.' };
  if (day <= 7) return { name: 'Sapling', blurb: 'Putting down roots. Keep showing up for yourself.' };
  if (day <= 21) return { name: 'Growing', blurb: 'Steady progress. The tree is starting to take shape.' };
  return { name: 'Magical', blurb: 'A month of care, reflected in every branch.' };
}

const STAT_META = [
  { key: 'leaves', label: 'Leaves', icon: '🍃', color: '#c9a227', desc: 'From journaling & check-ins' },
  { key: 'flowers', label: 'Flowers', icon: '🌸', color: '#e07060', desc: 'From breathing, Kolam & Scribble' },
  { key: 'fireflies', label: 'Fireflies', icon: '✨', color: '#7c6fff', desc: 'From completed tasks' },
  { key: 'birds', label: 'Birds', icon: '🐦', color: '#4fc3f7', desc: 'From reaching out for support' },
] as const;

const GROWS_LIST = [
  { action: 'Writing a journal entry', grows: 'a leaf', icon: '🍃' },
  { action: 'Completing a daily check-in', grows: 'a leaf', icon: '🍃' },
  { action: 'Finishing a breathing exercise', grows: 'a flower', icon: '🌸' },
  { action: 'Completing a Kolam pattern', grows: 'a flower', icon: '🌸' },
  { action: 'Finishing a Scribble session', grows: 'a flower', icon: '🌸' },
  { action: 'Checking off a task', grows: 'a firefly', icon: '✨' },
  { action: 'Reaching out via Support', grows: 'a bird', icon: '🐦' },
];

export default function HavenTreePage({ onNavigate, page, dark }: HavenTreePageProps) {
  const treeStats = useStore((s) => s.treeStats);
  const stage = getStage(treeStats.day);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${dark ? 'bg-[#1a1830]' : ''}`}
      style={!dark ? { background: 'linear-gradient(180deg, #f2f0ff 0%, #ebe8ff 100%)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4"
        >
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm mb-3 ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
          >
            ← Home
          </button>
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            Haven Tree
          </h1>
        </motion.div>

        {/* Tree hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative flex flex-col items-center justify-center py-8 mb-6"
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: dark
                ? 'radial-gradient(circle at center, rgba(124,111,255,0.15), transparent 70%)'
                : 'radial-gradient(circle at center, rgba(124,111,255,0.12), transparent 70%)',
            }}
          />
          <HavenTree
            leaves={treeStats.leaves}
            flowers={treeStats.flowers}
            birds={treeStats.birds}
            fireflies={treeStats.fireflies}
            size={240}
          />
          <div
            className={`mt-2 px-4 py-1.5 rounded-full text-xs font-medium ${
              dark ? 'bg-white/10 text-white/80' : 'bg-white/70 text-[#4a4570]'
            }`}
          >
            {stage.name} · Day {treeStats.day}
          </div>
          <p className={`mt-3 text-sm text-center max-w-xs ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            {stage.blurb}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {STAT_META.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              className={`rounded-2xl px-4 py-4 ${
                dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-xl font-medium" style={{ color: stat.color }}>
                  {treeStats[stat.key]}
                </span>
              </div>
              <div className={`text-xs font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>{stat.label}</div>
              <div className={`text-[11px] mt-0.5 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>{stat.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* What grows the tree */}
        <div>
          <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
            What grows the tree
          </h2>
          <div className="flex flex-col gap-2">
            {GROWS_LIST.map((item, i) => (
              <motion.div
                key={item.action}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                  dark ? 'bg-white/[0.05] border border-white/10' : 'bg-white/60 border border-white/50'
                }`}
              >
                <span className={`text-sm ${dark ? 'text-white/80' : 'text-[#4a4570]'}`}>{item.action}</span>
                <span className={`text-xs shrink-0 ml-3 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>
                  {item.icon} grows {item.grows}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}