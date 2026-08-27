import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../components/NavBar';

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");

interface StoriesPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
  lang: string;
  t: any;
}

const THEMES = (t: any) => [
  { id: 'forest', label: t.themeForest, apiLabel: 'A quiet forest', emoji: '🌲' },
  { id: 'rain', label: t.themeRain, apiLabel: 'Rain on a rooftop', emoji: '🌧️' },
  { id: 'ocean', label: t.themeOcean, apiLabel: 'A calm shore', emoji: '🌊' },
  { id: 'village', label: t.themeVillage, apiLabel: 'An old village at night', emoji: '🏮' },
  { id: 'train', label: t.themeTrain, apiLabel: 'A slow train journey', emoji: '🚂' },
  { id: 'garden', label: t.themeGarden, apiLabel: 'A garden at dusk', emoji: '🌿' },
];

const SPEECH_LANG: Record<string, string> = {
  English: 'en-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Malayalam: 'ml-IN',
  Kannada: 'kn-IN',
  Hindi: 'hi-IN',
};

export default function StoriesPage({ onNavigate, page, dark, lang, t }: StoriesPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceWarning, setVoiceWarning] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const themes = THEMES(t);
  // Voices load asynchronously in most browsers — cache them once ready.
  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) voicesRef.current = v;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const WARM_VOICE_HINTS = [
    'male', 'david', 'daniel', 'mark', 'george', 'fred',
    'ravi', 'rishi', 'prabhat', 'hemant', 'madhur', 'ajit',
    'female', 'zira', 'susan', 'samantha', 'heera', 'lekha', 'veena', 'kalpana', 'raveena',
  ];
  const pickVoice = (targetLangCode: string): { voice: SpeechSynthesisVoice | null; matchedLanguage: boolean } => {
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
    const langPrefix = targetLangCode.split('-')[0];

    const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    const pool = candidates.length ? candidates : voices.filter((v) => v.lang.toLowerCase().startsWith('en'));

    if (!pool.length) return { voice: null, matchedLanguage: false };

    const warm = pool.find((v) => WARM_VOICE_HINTS.some((hint) => v.name.toLowerCase().includes(hint)));
    return { voice: warm || pool[0], matchedLanguage: candidates.length > 0 };
  };

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  useEffect(() => stopSpeaking, []);

  const generate = async (themeLabel: string) => {
    stopSpeaking();
    setError('');
    setLoading(true);
    setStory(null);
    try {
      const res = await fetch(`${API}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ theme: themeLabel, language: lang || 'English' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t.storiesErrorFallback);
      }
      const data = await res.json();
      setStory(data.story);
    } catch (e: any) {
      setError(e.message || t.storiesErrorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (theme: ReturnType<typeof THEMES>[number]) => {
    setSelected(theme.id);
    setCustomTheme('');
    generate(theme.apiLabel);
  };

  const handleCustomSubmit = () => {
    if (!customTheme.trim()) return;
    setSelected('custom');
    generate(customTheme.trim());
  };

  const speak = () => {
    if (!story || !speechSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setVoiceWarning('');

    const targetLangCode = SPEECH_LANG[lang] || 'en-IN';
    const { voice, matchedLanguage } = pickVoice(targetLangCode);

    const utterance = new SpeechSynthesisUtterance(story);
    utterance.lang = voice?.lang || targetLangCode;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.7;
    utterance.pitch = 0.86;

    if (!matchedLanguage && targetLangCode !== 'en-IN') {
      setVoiceWarning(t.storiesNoVoiceWarning.replace('{lang}', lang));
    }

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;

    // Chrome silently drops speak() if fired in the same tick right after
    // cancel() — a small delay avoids that race.
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
      setPaused(false);
    }, 60);
  };

  const togglePause = () => {
    if (!speaking) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const reset = () => {
    stopSpeaking();
    setStory(null);
    setSelected(null);
    setCustomTheme('');
    setError('');
  };

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
          <button
            onClick={() => { stopSpeaking(); onNavigate('relax'); }}
            className={`text-sm mb-3 ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
          >
            ← {t.relaxNavBtn}
          </button>
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            {t.storiesTitle}
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            {t.storiesSubtitle}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!story && !loading && (
            <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handlePresetClick(theme)}
                    className={`rounded-2xl px-4 py-5 text-left transition-colors ${
                      dark
                        ? 'bg-white/[0.06] border border-white/10 hover:bg-white/[0.09]'
                        : 'bg-white/70 border border-white/60 hover:shadow-[0_8px_24px_rgba(124,111,255,0.12)]'
                    }`}
                  >
                    <div className="text-2xl mb-2">{theme.emoji}</div>
                    <div className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
                      {theme.label}
                    </div>
                  </button>
                ))}
              </div>
 
              <div className={`rounded-2xl p-4 ${dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'}`}>
                <p className={`text-xs mb-2 ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{t.storiesOwnTheme}</p>
                <div className="flex gap-2">
                  <input
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                    placeholder={t.storiesCustomPlaceholder}
                    className={`flex-1 bg-transparent outline-none text-sm px-3 py-2 rounded-xl ${
                      dark ? 'bg-white/[0.05] text-white placeholder-white/30' : 'bg-white/60 text-[#2d2a4a] placeholder-[#a29dc4]'
                    }`}
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customTheme.trim()}
                    className="px-4 py-2 rounded-full text-xs font-medium bg-primary text-white disabled:opacity-40"
                  >
                    {t.storiesTellIt}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
 
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className={`text-sm ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>{t.storiesThinking}</p>
            </motion.div>
          )}
 
          {story && !loading && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 ${dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'}`}
            >
              <p className={`text-sm leading-relaxed whitespace-pre-line mb-6 ${dark ? 'text-white/80' : 'text-[#3d3866]'}`}>
                {story}
              </p>
 
              {speechSupported && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {!speaking ? (
                    <button onClick={speak} className="px-4 py-2 rounded-full text-xs font-medium bg-primary text-white">
                      {t.storiesReadAloud}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePause}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${dark ? 'bg-white/10 text-white' : 'bg-[#eeecff] text-[#4a4570]'}`}
                      >
                        {paused ? t.storiesResume : t.storiesPause}
                      </button>
                      <button
                        onClick={stopSpeaking}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${dark ? 'bg-white/10 text-white' : 'bg-[#eeecff] text-[#4a4570]'}`}
                      >
                        {t.storiesStop}
                      </button>
                    </>
                  )}
                </div>
              )}
              {voiceWarning && (
                <p className={`text-xs mb-4 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>{voiceWarning}</p>
              )}
 
              <button onClick={reset} className={`text-xs font-medium ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
                {t.storiesAnother}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
 
        {error && <p className="mt-4 text-xs text-center text-danger">{error}</p>}
      </div>
 
      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}