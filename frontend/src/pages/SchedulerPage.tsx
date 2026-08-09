import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import NavBar from '../components/NavBar';
import { useStore } from '../store';

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000");

type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  text: string;
  priority: Priority;
  ai_suggested: boolean;
  completed: boolean;
  order: number;
}

interface SchedulerPageProps {
  onNavigate: (page: string) => void;
  page: string;
  dark: boolean;
}

const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#e07060', bg: 'rgba(224,112,96,0.12)' },
  medium: { label: 'Medium', color: '#c9a227', bg: 'rgba(201,162,39,0.12)' },
  low: { label: 'Low', color: '#5a9e6f', bg: 'rgba(90,158,111,0.12)' },
};

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function SchedulerPage({ onNavigate, page, dark }: SchedulerPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [choice, setChoice] = useState<Priority | 'ai'>('ai');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTreeAction = useStore((s) => s.addTreeAction);

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const loadTasks = () => {
    fetch(`${API}/tasks`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data: Task[]) => {
        setTasks(data.sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async () => {
    if (!text.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          text: text.trim(),
          priority: choice === 'ai' ? null : choice,
        }),
      });
      const newTask: Task = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setText('');
      inputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    const next = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));
    await fetch(`${API}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ completed: next }),
    });
    if (next) addTreeAction('task');
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: authHeaders });
  };

  const handleReorder = (newOrder: Task[]) => {
    setTasks(newOrder);
    fetch(`${API}/tasks/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ order: newOrder.map((t) => t.id) }),
    });
  };

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const todaysFocus = [...incomplete]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.order - b.order)
    .slice(0, 3);

  const focusIds = new Set(todaysFocus.map((t) => t.id));
  const remaining = incomplete.filter((t) => !focusIds.has(t.id));

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
            Task Scheduler
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-white/50' : 'text-[#6b6690]'}`}>
            Add what's on your mind. Eloria will help you find what matters most.
          </p>
        </motion.div>

        {/* Add task */}
        <div
          className={`rounded-3xl p-4 mb-8 backdrop-blur-md ${
            dark ? 'bg-white/[0.06] border border-white/10' : 'bg-white/70 border border-white/60'
          }`}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="What do you need to do?"
            className={`w-full bg-transparent outline-none text-sm mb-3 ${
              dark ? 'text-white placeholder-white/30' : 'text-[#2d2a4a] placeholder-[#a29dc4]'
            }`}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {(['ai', 'high', 'medium', 'low'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setChoice(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  choice === opt
                    ? 'bg-primary text-white'
                    : dark
                    ? 'bg-white/10 text-white/60'
                    : 'bg-[#eeecff] text-[#6b6690]'
                }`}
              >
                {opt === 'ai' ? 'AI pick' : PRIORITY_META[opt].label}
              </button>
            ))}
            <button
              onClick={handleAdd}
              disabled={!text.trim() || adding}
              className="ml-auto px-4 py-1.5 rounded-full text-xs font-medium bg-primary text-white disabled:opacity-40"
            >
              {adding ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className={`text-sm text-center ${dark ? 'text-white/40' : 'text-[#a29dc4]'}`}>Loading…</p>
        ) : tasks.length === 0 ? (
          <p className={`text-sm text-center ${dark ? 'text-white/40' : 'text-[#a29dc4]'}`}>
            Nothing on your list yet. One small task is a good place to start.
          </p>
        ) : (
          <>
            {todaysFocus.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
                  Today's Focus
                </h2>
                <div className="flex flex-col gap-2">
                  {todaysFocus.map((task) => (
                    <TaskRow key={task.id} task={task} dark={dark} onToggle={toggleComplete} onDelete={deleteTask} />
                  ))}
                </div>
              </div>
            )}

            {remaining.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
                  Everything else — drag to reorder
                </h2>
                <Reorder.Group axis="y" values={remaining} onReorder={(newRemaining) => handleReorder([...todaysFocus, ...newRemaining])} className="flex flex-col gap-2">
                  {remaining.map((task) => (
                    <Reorder.Item key={task.id} value={task} className="list-none">
                      <TaskRow task={task} dark={dark} onToggle={toggleComplete} onDelete={deleteTask} draggable />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className={`text-xs font-medium uppercase tracking-wide mb-3 ${dark ? 'text-white/40' : 'text-[#8a84b0]'}`}>
                  Completed
                </h2>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {completed.map((task) => (
                      <TaskRow key={task.id} task={task} dark={dark} onToggle={toggleComplete} onDelete={deleteTask} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NavBar page={page} onNavigate={onNavigate} />
    </div>
  );
}

function TaskRow({
  task,
  dark,
  onToggle,
  onDelete,
  draggable,
}: {
  task: Task;
  dark: boolean;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
}) {
  const meta = PRIORITY_META[task.priority];
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
        dark ? 'bg-white/[0.05] border border-white/10' : 'bg-white/60 border border-white/50'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <button
        onClick={() => onToggle(task)}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.completed ? 'bg-success border-success' : dark ? 'border-white/30' : 'border-[#c4bfe0]'
        }`}
      >
        {task.completed && (
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 text-sm ${task.completed ? 'line-through opacity-40' : ''} ${
          dark ? 'text-white' : 'text-[#2d2a4a]'
        }`}
      >
        {task.text}
      </span>

      <span
        className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ color: meta.color, background: meta.bg }}
        title={task.ai_suggested ? 'Suggested by Eloria' : undefined}
      >
        {meta.label}
        {task.ai_suggested ? ' · AI' : ''}
      </span>

      <button
        onClick={() => onDelete(task.id)}
        className={`shrink-0 text-xs ${dark ? 'text-white/30 hover:text-white/60' : 'text-[#c4bfe0] hover:text-[#8a84b0]'}`}
        aria-label="Delete task"
      >
        ✕
      </button>
    </motion.div>
  );
}