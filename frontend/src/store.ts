import { create } from 'zustand'

interface TreeStats {
  leaves: number
  flowers: number
  birds: number
  fireflies: number
  day: number
}

interface AppState {
  nickname: string
  token: string | null
  dark: boolean
  lang: string
  moodAmbience: number | null
  page: string
  treeStats: TreeStats
  setAuth: (nickname: string, token: string) => void
  logout: () => void
  toggleDark: () => void
  setLang: (lang: string) => void
  setMoodAmbience: (mood: number) => void
  navigate: (page: string) => void
  addTreeAction: (action: 'journal' | 'breathing' | 'task' | 'help' | 'checkin' | 'kolam' | 'scribble') => void
}

const ZERO_TREE_STATS: TreeStats = { leaves: 0, flowers: 0, birds: 0, fireflies: 0, day: 1 }

// Per-account storage keys, so two accounts on the same browser never share
// tree progress or mood ambience. Falls back to a shared 'guest' bucket only
// before any nickname is known (e.g. on the onboarding/auth screens).
const treeStatsKey = (nickname: string) => `treeStats:${nickname || 'guest'}`
const moodAmbienceKey = (nickname: string) => `moodAmbience:${nickname || 'guest'}`

function loadTreeStats(nickname: string): TreeStats {
  const raw = localStorage.getItem(treeStatsKey(nickname))
  if (!raw) return { ...ZERO_TREE_STATS }
  try {
    return { ...ZERO_TREE_STATS, ...JSON.parse(raw) }
  } catch {
    return { ...ZERO_TREE_STATS }
  }
}

function loadMoodAmbience(nickname: string): number | null {
  const raw = localStorage.getItem(moodAmbienceKey(nickname))
  return raw ? parseInt(raw) : null
}

const initialNickname = localStorage.getItem('nickname') || ''

export const useStore = create<AppState>((set, get) => ({
  nickname: initialNickname,
  token: localStorage.getItem('token') || null,
  dark: false,
  lang: localStorage.getItem('lang') || 'English',
  moodAmbience: loadMoodAmbience(initialNickname),
  page: (() => {
    if (localStorage.getItem('token')) return 'home'
    if (localStorage.getItem('onboarded')) return 'auth'
    return 'onboard'
  })(),
  treeStats: loadTreeStats(initialNickname),

  setAuth: (nickname, token) => {
    localStorage.setItem('nickname', nickname)
    localStorage.setItem('token', token)
    // Load (or freshly seed) this specific account's tree + mood, never carrying
    // over whatever was previously in state from a different account.
    set({
      nickname,
      token,
      treeStats: loadTreeStats(nickname),
      moodAmbience: loadMoodAmbience(nickname),
    })
  },
  logout: () => {
    localStorage.removeItem('nickname')
    localStorage.removeItem('token')
    set({ nickname: '', token: null, page: 'auth', treeStats: { ...ZERO_TREE_STATS }, moodAmbience: null })
  },
  toggleDark: () => {
    const next = !get().dark
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    set({ dark: next })
  },
  setLang: (lang) => { localStorage.setItem('lang', lang); set({ lang }) },
  setMoodAmbience: (mood) => {
    localStorage.setItem(moodAmbienceKey(get().nickname), String(mood))
    set({ moodAmbience: mood })
  },
  navigate: (page) => set({ page }),
  addTreeAction: (action) => {
    const stats = { ...get().treeStats }
    const map: Record<string, keyof TreeStats> = {
      journal: 'leaves', checkin: 'leaves',
      breathing: 'flowers', kolam: 'flowers', scribble: 'flowers',
      task: 'fireflies', help: 'birds',
    }
    const key = map[action]
    if (key && key !== 'day') (stats[key] as number)++
    localStorage.setItem(treeStatsKey(get().nickname), JSON.stringify(stats))
    set({ treeStats: stats })
  },
}))