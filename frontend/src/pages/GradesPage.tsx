import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../components/NavBar';

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");

interface Subject {
  name: string;
  marks: string;
  max_marks: string;
}

interface GradeEntry {
  id: string;
  subjects: { name: string; marks: number; max_marks: number }[];
  average_percent: number;
  feedback: string;
  timestamp: string;
}

interface GradesPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

export default function GradesPage({ onNavigate, page, dark }: GradesPageProps) {
  const [mode, setMode] = useState<'manual' | 'upload'>('manual');
  const [subjects, setSubjects] = useState<Subject[]>([{ name: '', marks: '', max_marks: '100' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeEntry | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<GradeEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    fetch(`${API}/grades`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data: GradeEntry[]) => setHistory(data))
      .finally(() => setLoadingHistory(false));
  }, []);

  const updateSubject = (i: number, field: keyof Subject, value: string) => {
    setSubjects((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSubjectRow = () => {
    setSubjects((prev) => [...prev, { name: '', marks: '', max_marks: '100' }]);
  };

  const removeSubjectRow = (i: number) => {
    setSubjects((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submitManual = async () => {
    setError('');
    const valid = subjects.filter((s) => s.name.trim() && s.marks !== '' && s.max_marks !== '');
    if (valid.length === 0) {
      setError('Add at least one subject with marks.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          subjects: valid.map((s) => ({
            name: s.name.trim(),
            marks: parseFloat(s.marks),
            max_marks: parseFloat(s.max_marks),
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Something went wrong');
      }
      const entry: GradeEntry = await res.json();
      setResult(entry);
      setHistory((prev) => [entry, ...prev]);
      setSubjects([{ name: '', marks: '', max_marks: '100' }]);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpload = async (file: File) => {
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/grades/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Could not read this PDF');
      }
      const entry: GradeEntry = await res.json();
      setResult(entry);
      setHistory((prev) => [entry, ...prev]);
    } catch (e: any) {
      setError(e.message || 'Could not read this PDF');
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const trend =
    history.length >= 2 ? history[0].average_percent - history[1].average_percent : null;

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
            onClick={() => onNavigate('focus')}
            className={`text-sm mb-3 ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
          >
            ← Focus
          </button>
          <h1 className={`text-2xl font-medium tracking-tight ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
            Grade Analysis
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            Share your marks. Eloria looks for what's working, not what's wrong.
          </p>
        </motion.div>

        {!result && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              {(['manual', 'upload'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    mode === m
                      ? 'bg-primary text-white'
                      : dark
                      ? 'bg-white/[0.06] text-white/60 border border-white/10'
                      : 'bg-white/60 text-[#6b6690] border border-white/50'
                  }`}
                >
                  {m === 'manual' ? 'Enter marks' : 'Upload PDF'}
                </button>
              ))}
            </div>

            <div
              className={`rounded-3xl p-5 backdrop-blur-md ${
                dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
              }`}
            >
              {mode === 'manual' ? (
                <>
                  <div className="flex flex-col gap-3 mb-4">
                    {subjects.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={s.name}
                          onChange={(e) => updateSubject(i, 'name', e.target.value)}
                          placeholder="Subject"
                          className={`flex-1 min-w-0 bg-transparent outline-none text-sm px-3 py-2 rounded-xl ${
                            dark ? 'bg-white/[0.05] text-white placeholder-white/30' : 'bg-white/60 text-[#2d2a4a] placeholder-[#a29dc4]'
                          }`}
                        />
                        <input
                          value={s.marks}
                          onChange={(e) => updateSubject(i, 'marks', e.target.value)}
                          placeholder="Marks"
                          type="number"
                          className={`w-20 bg-transparent outline-none text-sm px-3 py-2 rounded-xl ${
                            dark ? 'bg-white/[0.05] text-white placeholder-white/30' : 'bg-white/60 text-[#2d2a4a] placeholder-[#a29dc4]'
                          }`}
                        />
                        <span className={`text-sm ${dark ? 'text-white/30' : 'text-[#c4bfe0]'}`}>/</span>
                        <input
                          value={s.max_marks}
                          onChange={(e) => updateSubject(i, 'max_marks', e.target.value)}
                          placeholder="Max"
                          type="number"
                          className={`w-16 bg-transparent outline-none text-sm px-3 py-2 rounded-xl ${
                            dark ? 'bg-white/[0.05] text-white placeholder-white/30' : 'bg-white/60 text-[#2d2a4a] placeholder-[#a29dc4]'
                          }`}
                        />
                        {subjects.length > 1 && (
                          <button
                            onClick={() => removeSubjectRow(i)}
                            className={`text-xs shrink-0 ${dark ? 'text-white/30' : 'text-[#c4bfe0]'}`}
                            aria-label="Remove subject"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addSubjectRow}
                      className={`text-xs font-medium ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
                    >
                      + Add subject
                    </button>
                    <button
                      onClick={submitManual}
                      disabled={submitting}
                      className="ml-auto px-4 py-2 rounded-full text-xs font-medium bg-primary text-white disabled:opacity-40"
                    >
                      {submitting ? 'Analyzing…' : 'Get feedback'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <p className={`text-sm text-center ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
                    Upload a marksheet or report card as a PDF. Eloria will read it and pull out your subjects.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => e.target.files?.[0] && submitUpload(e.target.files[0])}
                    disabled={submitting}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer ${
                      submitting ? 'opacity-40 pointer-events-none' : ''
                    } bg-primary text-white`}
                  >
                    {submitting ? 'Reading PDF…' : 'Choose PDF'}
                  </label>
                </div>
              )}
              {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            </div>
          </>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 mb-6 ${
                dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
              }`}
            >
              <div className="flex items-baseline justify-between mb-4">
                <h2 className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
                  Eloria's take
                </h2>
                <span className="text-2xl font-medium text-primary">{result.average_percent}%</span>
              </div>
              <p className={`text-sm leading-relaxed mb-5 ${dark ? 'text-white/70' : 'text-[#4a4570]'}`}>
                {result.feedback}
              </p>
              <div className="flex flex-col gap-2 mb-5">
                {result.subjects.map((s, i) => {
                  const pct = (s.marks / s.max_marks) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-xs w-24 shrink-0 truncate ${dark ? 'text-white/60' : 'text-[#6b6690]'}`}>
                        {s.name}
                      </span>
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-[#eeecff]'}`}>
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs w-10 text-right ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setResult(null)}
                className={`text-xs font-medium ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}
              >
                ← Add another entry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress history */}
        {!loadingHistory && history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-xs font-medium uppercase tracking-wide ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
                Progress
              </h2>
              {trend !== null && (
                <span className={`text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% since last time
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {history.slice(0, 6).map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                    dark ? 'bg-white/[0.05] border border-white/10' : 'bg-white/60 border border-white/50'
                  }`}
                >
                  <span className={`text-xs ${dark ? 'text-white/50' : 'text-[#8a84b0]'}`}>
                    {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#2d2a4a]'}`}>
                    {entry.average_percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}