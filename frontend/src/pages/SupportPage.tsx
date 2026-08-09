import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';

interface SupportPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

const HELPLINES = [
  { name: 'iCall', number: '9152987821', desc: 'TISS counselling helpline', type: '📞' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7 mental health support', type: '📞' },
  { name: 'AASRA', number: '9820466627', desc: 'Crisis intervention', type: '📞' },
  { name: 'Snehi', number: '044-24640050', desc: 'Emotional support helpline', type: '📞' },
  { name: 'iCall Email', number: 'icall@tiss.edu', desc: 'Email counselling', type: '✉️' },
  { name: 'Fortis Stress Helpline', number: '8376804102', desc: 'Mental health support', type: '📞' },
];

const NGOS = [
  { name: 'The Live Love Laugh Foundation', url: 'thelivelovelaughfoundation.org', desc: 'Mental health awareness' },
  { name: 'Sangath', url: 'sangath.in', desc: 'Free mental health resources & community care' },
  { name: 'White Swan Foundation', url: 'whiteswanfoundation.org', desc: 'Information on mental health conditions' },
  { name: 'iCall', url: 'icallhelpline.org', desc: 'Online & telephone counselling by TISS' },
];

// Primary crisis line, surfaced most prominently in the SOS card.
const PRIMARY_CRISIS_LINE = HELPLINES[0];

export default function SupportPage({ onNavigate, page, dark }: SupportPageProps) {
  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${dark ? 'bg-[#1a1830]' : ''}`}
      style={!dark ? { background: 'linear-gradient(180deg, #f8f6ff 0%, #f2eeff 100%)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-28">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 text-center"
        >
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            Support
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            Reaching out is a sign of strength, not a last resort.
          </p>
        </motion.div>

        {/* Emergency SOS */}
        <motion.a
          href={`tel:${PRIMARY_CRISIS_LINE.number}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          className="block rounded-3xl p-6 mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #e07060, #d45c4c)',
            boxShadow: '0 10px 30px rgba(224,112,96,0.35)',
          }}
        >
          <div className="text-3xl mb-2">🆘</div>
          <div className="text-white text-base font-medium mb-1">In crisis right now? Call for help.</div>
          <div className="text-white/85 text-sm">
            Tap to call {PRIMARY_CRISIS_LINE.name} · {PRIMARY_CRISIS_LINE.number}
          </div>
        </motion.a>

        <div
          className={`text-xs text-center mb-8 rounded-2xl px-4 py-3 ${
            dark ? 'bg-white/[0.06] text-white/50 border border-white/10' : 'bg-white/60 text-[#8a84b0] border border-white/50'
          }`}
        >
          🔒 Your data is never used to train AI models.
        </div>

        {/* Helplines */}
        <div className="mb-8">
          <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
            Helplines
          </h2>
          <p className={`text-xs mb-4 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
            Real, verified Indian helplines. You are not alone.
          </p>
          <div className="flex flex-col gap-3">
            {HELPLINES.map((h, i) => (
              <motion.a
                key={h.name}
                href={h.type === '✉️' ? `mailto:${h.number}` : `tel:${h.number}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                whileHover={{ y: -2 }}
                className={`rounded-2xl px-4 py-3 flex items-center justify-between ${
                  dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
                }`}
              >
                <div>
                  <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>{h.name}</div>
                  <div className={`text-xs mt-0.5 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{h.desc}</div>
                </div>
                <div className="text-primary text-sm font-medium shrink-0 ml-3">
                  {h.type} {h.number}
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* NGOs */}
        <div>
          <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
            Organisations
          </h2>
          <p className={`text-xs mb-4 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
            Offering free or affordable support.
          </p>
          <div className="flex flex-col gap-3">
            {NGOS.map((n, i) => (
              <motion.a
                key={n.name}
                href={`https://${n.url}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                whileHover={{ y: -2 }}
                className={`rounded-2xl px-4 py-3 ${
                  dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
                }`}
              >
                <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>🤝 {n.name}</div>
                <div className={`text-xs mt-0.5 mb-1 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{n.desc}</div>
                <div className="text-primary text-xs">{n.url}</div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}
