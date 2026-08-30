// LibraryPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../components/NavBar';

interface LibraryPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
  t: any;
}

type Tab = 'books' | 'articles' | 'podcasts';

// Book/podcast links use platform search URLs rather than guessed direct
// product/show pages — this guarantees a working, correct destination
// instead of risking a stale or mistaken direct link.
const amazonSearch = (query: string) => `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
const spotifySearch = (query: string) => `https://open.spotify.com/search/${encodeURIComponent(query)}`;

const BOOKS = [
  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', emoji: '📖', desc: 'How trauma reshapes the body and mind' },
  { title: 'Feeling Good', author: 'David D. Burns', emoji: '📗', desc: 'A classic introduction to cognitive therapy' },
  { title: 'Lost Connections', author: 'Johann Hari', emoji: '📘', desc: 'Rethinking the causes of depression and anxiety' },
  { title: "Man's Search for Meaning", author: 'Viktor Frankl', emoji: '📙', desc: 'Finding purpose through survival and reflection' },
  { title: 'The Midnight Library', author: 'Matt Haig', emoji: '📕', desc: 'A gentle novel about regret and possibility' },
  { title: 'Maybe You Should Talk to Someone', author: 'Lori Gottlieb', emoji: '📔', desc: 'A therapist on therapy, from both sides of the couch' },
].map((b) => ({ ...b, url: amazonSearch(`${b.title} ${b.author} book`) }));

const ARTICLES = [
  {
    title: 'Sangath — Resources',
    source: 'sangath.in',
    desc: 'Free, research-backed mental health resources and community care programs across India.',
    url: 'https://www.sangath.in',
  },
  {
    title: 'The Live Love Laugh Foundation',
    source: 'thelivelovelaughfoundation.org',
    desc: 'Mental health awareness content aimed at reducing stigma in India.',
    url: 'https://www.thelivelovelaughfoundation.org',
  },
  {
    title: 'NIMHANS',
    source: 'nimhans.ac.in',
    desc: "India's apex institute for mental health — research, campus programs, and public resources.",
    url: 'https://www.nimhans.ac.in',
  },
  {
    title: 'Mind — Information & Support',
    source: 'mind.org.uk',
    desc: 'In-depth, accessible guides on specific mental health conditions and coping strategies.',
    url: 'https://www.mind.org.uk/information-support',
  },
  {
    title: 'WHO — Mental Health',
    source: 'who.int',
    desc: 'Global mental health guidance, facts, and campaigns from the World Health Organization.',
    url: 'https://www.who.int/health-topics/mental-health',
  },
];

const PODCASTS = [
  { title: 'The Happiness Lab', host: 'Dr. Laurie Santos, Yale', emoji: '🎧', desc: 'Research-backed strategies for wellbeing, explained simply' },
  { title: 'Therapy for Black Girls', host: 'Dr. Joy Harden Bradford', emoji: '🎙️', desc: 'Accessible conversations about therapy and mental wellness' },
  { title: 'HealthyGamerGG', host: 'Dr. Alok Kanojia', emoji: '🎮', desc: 'Mental health through the lens of student and gaming culture' },
  { title: 'Ten Percent Happier', host: 'Dan Harris', emoji: '🧘', desc: 'Meditation and mental health for skeptics' },
  { title: 'On Purpose', host: 'Jay Shetty', emoji: '💭', desc: 'Conversations on purpose, mindset, and emotional resilience' },
].map((p) => ({ ...p, url: spotifySearch(p.title) }));

export default function LibraryPage({ onNavigate, page, dark, t }: LibraryPageProps) {
  const [tab, setTab] = useState<Tab>('books');

  const cardBase = dark
    ? 'bg-white/[0.06] border border-white/10'
    : 'bg-white/70 border border-white/60';

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
          className="mb-8"
        >
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            {t.libraryTitle}
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            {t.librarySubtitle}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['books', 'articles', 'podcasts'] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-medium capitalize transition-colors ${
                tab === tb
                  ? 'bg-primary text-white'
                  : dark
                  ? 'bg-white/[0.06] text-white/60 border border-white/10'
                  : 'bg-white/60 text-[#6b6690] border border-white/50'
              }`}
            >
              {tb === 'books' ? t.tabBooks : tb === 'articles' ? t.tabArticles : t.tabPodcasts}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'books' && (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {BOOKS.map((b) => (
                <a
                  key={b.title}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-2xl px-4 py-3 flex gap-3 items-start ${cardBase}`}
                >
                  <span className="text-2xl shrink-0">{b.emoji}</span>
                  <div>
                    <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>{b.title}</div>
                    <div className={`text-xs mt-0.5 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{t.byAuthor} {b.author}</div>
                    <div className={`text-xs mt-1 ${dark ? 'text-white/60' : 'text-[#6b6690]'}`}>{b.desc}</div>
                  </div>
                </a>
              ))}
            </motion.div>
          )}

          {tab === 'articles' && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {ARTICLES.map((a) => (
                <a
                  key={a.title}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-2xl px-4 py-3 block ${cardBase}`}
                >
                  <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>{a.title}</div>
                  <div className={`text-xs mt-1 ${dark ? 'text-white/60' : 'text-[#6b6690]'}`}>{a.desc}</div>
                  <div className="text-primary text-xs mt-1.5">{a.source}</div>
                </a>
              ))}
            </motion.div>
          )}

          {tab === 'podcasts' && (
            <motion.div
              key="podcasts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {PODCASTS.map((p) => (
                <a
                  key={p.title}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-2xl px-4 py-3 flex gap-3 items-start ${cardBase}`}
                >
                  <span className="text-2xl shrink-0">{p.emoji}</span>
                  <div>
                    <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>{p.title}</div>
                    <div className={`text-xs mt-0.5 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{p.host}</div>
                    <div className={`text-xs mt-1 ${dark ? 'text-white/60' : 'text-[#6b6690]'}`}>{p.desc}</div>
                  </div>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}