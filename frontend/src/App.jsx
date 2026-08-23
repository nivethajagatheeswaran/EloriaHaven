import { useState, useEffect, useRef } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import * as faceapi from "face-api.js"
import logo from "./assets/logo.png"
import NewHomePage from './pages/HomePage'
import NewNavBar from './components/NavBar'
import RelaxPage    from './pages/RelaxPage'
import BreathingPage from './pages/BreathingPage'
import KolamPage    from './pages/KolamPage'
import ScribblePage from './pages/ScribblePage'
import BubblePage   from './pages/BubblePage'
import MusicPage    from './pages/MusicPage'
import FocusPage    from './pages/FocusPage'
import SchedulerPage from './pages/SchedulerPage'
import GradesPage   from './pages/GradesPage'
import PomodoroPage from './pages/PomodoroPage'
import SupportPage  from './pages/SupportPage'
import LibraryPage  from './pages/LibraryPage'
import StoriesPage  from './pages/StoriesPage'
import HavenTreePage from './pages/HavenTreePage'

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000")

const QUOTES = [
  "🌿 Every feeling is valid.",
  "✨ Small steps count.",
  "💜 You showed up today. That matters.",
  "🌱 Healing is not linear.",
  "☁️ It's okay to not be okay.",
  "🌸 Be gentle with yourself.",
  "⭐ You are doing better than you think.",
  "🕊️ Rest is also progress.",
  "🌊 Emotions are waves — they rise and fall.",
]

const AMBIENCE = {
  1: { bg: "radial-gradient(ellipse at 60% 0%, #ffe8d6 0%, #ffd6e7 40%, #f0e6ff 100%)", particle: "🌸", accent: "#e07060", message: "Wrapping you in warmth 🌸" },
  2: { bg: "radial-gradient(ellipse at 80% 10%, #fff3e0 0%, #ffe0b2 30%, #f3e5f5 100%)", particle: "🌤️", accent: "#d09060", message: "The sun is still there 🌤️" },
  3: { bg: "radial-gradient(ellipse at 50% 0%, #f0eeff 0%, #e8f4ff 50%, #f8f7ff 100%)", particle: "✦", accent: "#7c6fff", message: "A steady, peaceful moment ✦" },
  4: { bg: "radial-gradient(ellipse at 30% 0%, #e8f5e9 0%, #f0fff4 40%, #e8f4ff 100%)", particle: "🌿", accent: "#5a9e6f", message: "Something's blooming 🌿" },
  5: { bg: "radial-gradient(ellipse at 50% 0%, #fff8e1 0%, #fffde7 40%, #f0fff4 100%)", particle: "✨", accent: "#c9a227", message: "You're glowing today ✨" },
}

const TIME_AMBIENCE = {
  night:   { bg: "radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0d0826 50%, #160d2e 100%)", stars: true },
  dawn:    { bg: "radial-gradient(ellipse at 40% 0%, #ff9a6c 0%, #ffd194 30%, #1a1040 100%)", stars: false },
  morning: { bg: "radial-gradient(ellipse at 60% 0%, #87ceeb 0%, #b8e4f9 40%, #e8f4ff 100%)", stars: false },
  noon:    { bg: "radial-gradient(ellipse at 50% 0%, #ffd700 0%, #fff8dc 30%, #e8f9ff 100%)", stars: false },
  evening: { bg: "radial-gradient(ellipse at 30% 0%, #ff7043 0%, #ff8a65 30%, #ce93d8 60%, #1a0533 100%)", stars: true },
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 0  && h < 5)  return "night"
  if (h >= 5  && h < 8)  return "dawn"
  if (h >= 8  && h < 12) return "morning"
  if (h >= 12 && h < 17) return "noon"
  if (h >= 17 && h < 21) return "evening"
  return "night"
}

function getGreeting(t) {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { text: t.goodMorning,   emoji: "🌤️" }
  if (h >= 12 && h < 17) return { text: t.goodAfternoon, emoji: "☀️" }
  if (h >= 17 && h < 21) return { text: t.goodEvening,   emoji: "🌙" }
  if (h >= 21)            return { text: t.goodNight,     emoji: "🌟" }
  return { text: t.nightOwl, emoji: "🦉" }
}

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

const MOOD_FACES = {
  1: (size = 32) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#ffded6" stroke="#e07060" strokeWidth="1.5" strokeDasharray="2 1"/>
      <ellipse cx="14" cy="16" rx="2.5" ry="3" fill="#e07060" opacity="0.7"/>
      <ellipse cx="26" cy="16" rx="2.5" ry="3" fill="#e07060" opacity="0.7"/>
      <path d="M13 28 Q17 24 20 25 Q23 24 27 28" stroke="#e07060" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M11 12 Q13 10 15 12" stroke="#e07060" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M25 12 Q27 10 29 12" stroke="#e07060" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  2: (size = 32) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#ffecd6" stroke="#d09060" strokeWidth="1.5" strokeDasharray="3 1"/>
      <ellipse cx="14" cy="17" rx="2.2" ry="2.8" fill="#d09060" opacity="0.7"/>
      <ellipse cx="26" cy="17" rx="2.2" ry="2.8" fill="#d09060" opacity="0.7"/>
      <path d="M13 27 Q20 24 27 27" stroke="#d09060" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  3: (size = 32) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#eeecff" stroke="#7c6fff" strokeWidth="1.5"/>
      <circle cx="14" cy="17" r="2.5" fill="#7c6fff" opacity="0.6"/>
      <circle cx="26" cy="17" r="2.5" fill="#7c6fff" opacity="0.6"/>
      <line x1="13" y1="27" x2="27" y2="27" stroke="#7c6fff" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 8 Q10 6 12 8" stroke="#7c6fff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M28 8 Q30 6 32 8" stroke="#7c6fff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  ),
  4: (size = 32) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#e8f5e9" stroke="#5a9e6f" strokeWidth="1.5" strokeDasharray="4 1"/>
      <circle cx="14" cy="16" r="2.5" fill="#5a9e6f" opacity="0.7"/>
      <circle cx="26" cy="16" r="2.5" fill="#5a9e6f" opacity="0.7"/>
      <path d="M12 25 Q16 30 20 29 Q24 30 28 25" stroke="#5a9e6f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M17 13 Q20 11 23 13" stroke="#5a9e6f" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  ),
  5: (size = 32) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#fff8e1" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="2 0.5"/>
      <circle cx="14" cy="15" r="3" fill="#c9a227" opacity="0.8"/>
      <circle cx="26" cy="15" r="3" fill="#c9a227" opacity="0.8"/>
      <path d="M11 25 Q15 32 20 31 Q25 32 29 25" stroke="#c9a227" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M16 32 Q20 35 24 32" stroke="#c9a227" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
      <circle cx="32" cy="8" r="2" fill="#c9a227" opacity="0.3"/>
      <circle cx="8" cy="10" r="1.5" fill="#c9a227" opacity="0.3"/>
    </svg>
  ),
}

const MOOD_CONFIG = [
  { label: "Very Low", color: "#e07060", bg: "#ffded6" },
  { label: "Low",      color: "#d09060", bg: "#ffecd6" },
  { label: "Neutral",  color: "#7c6fff", bg: "#eeecff" },
  { label: "Good",     color: "#5a9e6f", bg: "#e8f5e9" },
  { label: "Great",    color: "#c9a227", bg: "#fff8e1" },
]

const LANGUAGES = [
  { code: "English",   label: "English",   native: "English"   },
  { code: "Tamil",     label: "Tamil",     native: "தமிழ்"     },
  { code: "Telugu",    label: "Telugu",    native: "తెలుగు"    },
  { code: "Malayalam", label: "Malayalam", native: "മലയാളം"    },
  { code: "Kannada",   label: "Kannada",   native: "ಕನ್ನಡ"     },
  { code: "Hindi",     label: "Hindi",     native: "हिंदी"     },
]

const T = {
  English: {
    tagline: "your haven of healing",
    login: "Login", signup: "Create account",
    nickname: "Nickname (3–20 characters)",
    password: "Password", passwordHint: "Password (min 6 characters)",
    alreadyHave: "Already have an account? Login",
    newHere: "New here? Create account",
    privacy: "🔒 Your identity stays private, always",
    howFeeling: "How are you feeling today?",
    whatsOnMind: "What's on your mind? (optional)",
    saveCheckin: "Save check-in",
    checkInSaved: "Check-in saved!",
    youreDoingGreat: "You're doing great by showing up for yourself.",
    backHome: "Back to home", backToHome: "Back to home",
    talkToEloria: "💜 Talk to Eloria",
    goodMorning: "Good morning", goodAfternoon: "Good afternoon",
    goodEvening: "Good evening", goodNight: "Good night",
    nightOwl: "Hey, night owl",
    howHasToday: "How has today been?",
    whatWouldYouLike: "What would you like to do?",
    checkIn: "Check in", talkToMe: "Talk to me",
    myTrends: "My trends", history: "History",
    logMood: "Log today's mood", hereToListen: "I'm here to listen",
    seeMoodPatterns: "See mood patterns", pastCheckins: "Past check-ins",
    typeMessage: "Type a message… (Enter to send)",
    send: "Send", journalPrompt: "Today I felt…",
    getReflection: "Get reflection 💜", writeAnother: "Write another entry",
    noticedLow: "I've noticed you've been feeling low lately.",
    gentleSuggestion: "Would you like to try something gentle?",
    breathe: "🌬️ Breathe", journal: "Journal", talk: "💜 Talk",
    moodHistory: "Your mood history", noCheckins: "No check-ins yet!",
    weeklyAvg: "7-day", monthlyAvg: "30-day",
    moodOverTime: "Mood over time", moodBreakdown: "Mood breakdown",
    insights: "Insights", logout: "Logout",
    chatGreeting: "Hi! I'm Eloria 💜 I'm here to listen. How are you feeling today?",
    writeFreely: "Write freely — this is just for you.",
    whatsOnYourMind: "What's on your mind?",
    pastEntries: "Past entries", write: "Write",
    yourMoodHistory: "Your mood history", noCheckInsYet: "No check-ins yet!",
    soulmateHelper: "Help & Resources",
    selectLanguage: "Language",
  },
  Tamil: {
    tagline: "உங்கள் குணமடையும் இடம்",
    login: "உள்நுழை", signup: "கணக்கு உருவாக்கு",
    nickname: "புனைப்பெயர் (3–20 எழுத்துகள்)",
    password: "கடவுச்சொல்", passwordHint: "கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்)",
    alreadyHave: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழை",
    newHere: "புதியவரா? கணக்கு உருவாக்கு",
    privacy: "🔒 உங்கள் அடையாளம் எப்போதும் தனிப்பட்டது",
    howFeeling: "இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
    whatsOnMind: "மனதில் என்ன இருக்கிறது? (விரும்பினால்)",
    saveCheckin: "சேமி", checkInSaved: "பதிவு சேமிக்கப்பட்டது!",
    youreDoingGreat: "நீங்கள் சிறப்பாக செய்கிறீர்கள்.",
    backHome: "முகப்புக்கு திரும்பு", backToHome: "முகப்புக்கு திரும்பு",
    talkToEloria: "💜 Eloria உடன் பேசு",
    goodMorning: "காலை வணக்கம்", goodAfternoon: "மதிய வணக்கம்",
    goodEvening: "மாலை வணக்கம்", goodNight: "இரவு வணக்கம்",
    nightOwl: "வணக்கம்",
    howHasToday: "இன்று எப்படி இருந்தது?",
    whatWouldYouLike: "என்ன செய்ய விரும்புகிறீர்கள்?",
    checkIn: "உணர்வு பதிவு", talkToMe: "என்னிடம் பேசு",
    myTrends: "என் போக்குகள்", history: "வரலாறு",
    logMood: "இன்றைய மனநிலை பதிவு", hereToListen: "நான் கேட்கிறேன்",
    seeMoodPatterns: "மனநிலை வடிவங்கள்", pastCheckins: "முந்தைய பதிவுகள்",
    typeMessage: "செய்தி தட்டச்சு செய்யுங்கள்…",
    send: "அனுப்பு", journalPrompt: "இன்று நான் உணர்ந்தது…",
    getReflection: "பிரதிபலிப்பு பெறு 💜", writeAnother: "மற்றொரு பதிவு எழுது",
    noticedLow: "நீங்கள் சில நாட்களாக சோர்வாக உணர்கிறீர்கள்.",
    gentleSuggestion: "ஏதாவது மென்மையான முயற்சி செய்ய விரும்புகிறீர்களா?",
    breathe: "🌬️ மூச்சு", journal: "நாட்குறிப்பு", talk: "💜 பேசு",
    moodHistory: "உங்கள் மனநிலை வரலாறு", noCheckins: "இன்னும் பதிவுகள் இல்லை!",
    weeklyAvg: "7-நாள்", monthlyAvg: "30-நாள்",
    moodOverTime: "காலப்போக்கில் மனநிலை", moodBreakdown: "மனநிலை பிரிவு",
    insights: "நுண்ணறிவுகள்", logout: "வெளியேறு",
    chatGreeting: "வணக்கம்! நான் Eloria 💜 இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
    writeFreely: "சுதந்திரமாக எழுதுங்கள் — இது உங்களுக்காக மட்டுமே.",
    whatsOnYourMind: "மனதில் என்ன இருக்கிறது?",
    pastEntries: "முந்தைய பதிவுகள்", write: "எழுது",
    yourMoodHistory: "உங்கள் மனநிலை வரலாறு", noCheckInsYet: "இன்னும் பதிவுகள் இல்லை!",
    soulmateHelper: "உதவி & வளங்கள்",
    selectLanguage: "மொழி",
  },
  Telugu: {
    tagline: "మీ స్వస్థత స్థలం",
    login: "లాగిన్", signup: "ఖాతా సృష్టించు",
    nickname: "మారుపేరు (3–20 అక్షరాలు)",
    password: "పాస్‌వర్డ్", passwordHint: "పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)",
    alreadyHave: "ఇప్పటికే ఖాతా ఉందా? లాగిన్",
    newHere: "కొత్తవారా? ఖాతా సృష్టించు",
    privacy: "🔒 మీ గుర్తింపు ఎల్లప్పుడూ ప్రైవేట్",
    howFeeling: "ఈరోజు మీరు ఎలా అనుభవిస్తున్నారు?",
    whatsOnMind: "మనసులో ఏముంది? (ఐచ్ఛికం)",
    saveCheckin: "సేవ్ చేయి", checkInSaved: "చెక్-ఇన్ సేవ్ అయింది!",
    youreDoingGreat: "మీరు చాలా బాగా చేస్తున్నారు.",
    backHome: "హోమ్‌కు వెళ్ళు", backToHome: "హోమ్‌కు వెళ్ళు",
    talkToEloria: "💜 Eloria తో మాట్లాడు",
    goodMorning: "శుభోదయం", goodAfternoon: "శుభ మధ్యాహ్నం",
    goodEvening: "శుభ సాయంత్రం", goodNight: "శుభ రాత్రి",
    nightOwl: "హలో",
    howHasToday: "ఈరోజు ఎలా గడిచింది?",
    whatWouldYouLike: "మీరు ఏమి చేయాలనుకుంటున్నారు?",
    checkIn: "చెక్-ఇన్", talkToMe: "నాతో మాట్లాడు",
    myTrends: "నా ట్రెండ్స్", history: "చరిత్ర",
    logMood: "ఈరోజు మూడ్ నమోదు", hereToListen: "నేను వింటున్నాను",
    seeMoodPatterns: "మూడ్ నమూనాలు", pastCheckins: "గత చెక్-ఇన్లు",
    typeMessage: "సందేశం టైప్ చేయండి…",
    send: "పంపు", journalPrompt: "ఈరోజు నేను అనుభవించింది…",
    getReflection: "రిఫ్లెక్షన్ పొందు 💜", writeAnother: "మరొక నమోదు రాయి",
    noticedLow: "మీరు కొన్ని రోజులుగా తక్కువగా అనుభవిస్తున్నారు.",
    gentleSuggestion: "మెత్తగా ఏదైనా ప్రయత్నించాలనుకుంటున్నారా?",
    breathe: "🌬️ శ్వాస", journal: "జర్నల్", talk: "💜 మాట్లాడు",
    moodHistory: "మీ మూడ్ చరిత్ర", noCheckins: "ఇంకా నమోదులు లేవు!",
    weeklyAvg: "7-రోజులు", monthlyAvg: "30-రోజులు",
    moodOverTime: "కాలక్రమేణా మూడ్", moodBreakdown: "మూడ్ విభజన",
    insights: "అంతర్దృష్టులు", logout: "లాగ్అవుట్",
    chatGreeting: "నమస్కారం! నేను Eloria 💜 ఈరోజు మీరు ఎలా అనుభవిస్తున్నారు?",
    writeFreely: "స్వేచ్ఛగా రాయండి — ఇది మీ కోసం మాత్రమే.",
    whatsOnYourMind: "మనసులో ఏముంది?",
    pastEntries: "గత నమోదులు", write: "రాయి",
    yourMoodHistory: "మీ మూడ్ చరిత్ర", noCheckInsYet: "ఇంకా నమోదులు లేవు!",
    soulmateHelper: "సహాయం & వనరులు",
    selectLanguage: "భాష",
  },
  Malayalam: {
    tagline: "നിങ്ങളുടെ സൗഖ്യത്തിന്റെ ഇടം",
    login: "ലോഗിൻ", signup: "അക്കൗണ്ട് ഉണ്ടാക്കൂ",
    nickname: "വിളിപ്പേര് (3–20 അക്ഷരങ്ങൾ)",
    password: "പാസ്‌വേഡ്", passwordHint: "പാസ്‌വേഡ് (കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ)",
    alreadyHave: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ",
    newHere: "പുതിയതാണോ? അക്കൗണ്ട് ഉണ്ടാക്കൂ",
    privacy: "🔒 നിങ്ങളുടെ ഐഡന്റിറ്റി എല്ലായ്പ്പോഴും സ്വകാര്യം",
    howFeeling: "ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",
    whatsOnMind: "മനസ്സിൽ എന്തുണ്ട്? (ഐച്ഛികം)",
    saveCheckin: "സേവ് ചെയ്യൂ", checkInSaved: "ചെക്ക്-ഇൻ സേവ് ആയി!",
    youreDoingGreat: "നിങ്ങൾ വളരെ നന്നായി ചെയ്യുന്നു.",
    backHome: "ഹോമിലേക്ക് മടങ്ങൂ", backToHome: "ഹോമിലേക്ക് മടങ്ങൂ",
    talkToEloria: "💜 Eloria-മായി സംസാരിക്കൂ",
    goodMorning: "സുപ്രഭാതം", goodAfternoon: "ഉച്ച വന്ദനം",
    goodEvening: "സന്ധ്യാ വന്ദനം", goodNight: "ശുഭ രാത്രി",
    nightOwl: "ഹലോ",
    howHasToday: "ഇന്ന് എങ്ങനെ ഉണ്ടായിരുന്നു?",
    whatWouldYouLike: "നിങ്ങൾ എന്ത് ചെയ്യാൻ ആഗ്രഹിക്കുന്നു?",
    checkIn: "ചെക്ക്-ഇൻ", talkToMe: "എന്നോട് സംസാരിക്കൂ",
    myTrends: "എന്റെ ട്രെൻഡുകൾ", history: "ചരിത്രം",
    logMood: "ഇന്നത്തെ മൂഡ് രേഖപ്പെടുത്തൂ", hereToListen: "ഞാൻ കേൾക്കുന്നു",
    seeMoodPatterns: "മൂഡ് പാറ്റേണുകൾ", pastCheckins: "മുൻ ചെക്ക്-ഇന്നുകൾ",
    typeMessage: "സന്ദേശം ടൈപ്പ് ചെയ്യൂ…",
    send: "അയക്കൂ", journalPrompt: "ഇന്ന് ഞാൻ അനുഭവിച്ചത്…",
    getReflection: "റിഫ്ലക്ഷൻ നേടൂ 💜", writeAnother: "മറ്റൊരു എൻട്രി എഴുതൂ",
    noticedLow: "നിങ്ങൾ കുറച്ച് ദിവസങ്ങളായി തളർന്നു കാണുന്നു.",
    gentleSuggestion: "എന്തെങ്കിലും മൃദുവായി പരീക്ഷിക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
    breathe: "🌬️ ശ്വാസം", journal: "ജേർണൽ", talk: "💜 സംസാരിക്കൂ",
    moodHistory: "നിങ്ങളുടെ മൂഡ് ചരിത്രം", noCheckins: "ഇതുവരെ ചെക്ക്-ഇന്നുകൾ ഇല്ല!",
    weeklyAvg: "7-ദിവസം", monthlyAvg: "30-ദിവസം",
    moodOverTime: "സമയക്രമത്തിൽ മൂഡ്", moodBreakdown: "മൂഡ് വിഭജനം",
    insights: "ഉൾക്കാഴ്ചകൾ", logout: "ലോഗ്ഔട്ട്",
    chatGreeting: "നമസ്കാരം! ഞാൻ Eloria 💜 ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",
    writeFreely: "സ്വതന്ത്രമായി എഴുതൂ — ഇത് നിങ്ങൾക്ക് മാത്രമുള്ളതാണ്.",
    whatsOnYourMind: "മനസ്സിൽ എന്തുണ്ട്?",
    pastEntries: "മുൻ എൻട്രികൾ", write: "എഴുതൂ",
    yourMoodHistory: "നിങ്ങളുടെ മൂഡ് ചരിത്രം", noCheckInsYet: "ഇതുവരെ ചെക്ക്-ഇന്നുകൾ ഇല്ല!",
    soulmateHelper: "സഹായം & വിഭവങ്ങൾ",
    selectLanguage: "ഭാഷ",
  },
  Kannada: {
    tagline: "ನಿಮ್ಮ ಗುಣಮುಖದ ಸ್ಥಳ",
    login: "ಲಾಗಿನ್", signup: "ಖಾತೆ ರಚಿಸಿ",
    nickname: "ಅಡ್ಡಹೆಸರು (3–20 ಅಕ್ಷರಗಳು)",
    password: "ಪಾಸ್‌ವರ್ಡ್", passwordHint: "ಪಾಸ್‌ವರ್ಡ್ (ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು)",
    alreadyHave: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್",
    newHere: "ಹೊಸಬರೇ? ಖಾತೆ ರಚಿಸಿ",
    privacy: "🔒 ನಿಮ್ಮ ಗುರುತು ಯಾವಾಗಲೂ ಖಾಸಗಿ",
    howFeeling: "ಇಂದು ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?",
    whatsOnMind: "ಮನಸ್ಸಿನಲ್ಲಿ ಏನಿದೆ? (ಐಚ್ಛಿಕ)",
    saveCheckin: "ಉಳಿಸಿ", checkInSaved: "ಚೆಕ್-ಇನ್ ಉಳಿಸಲಾಗಿದೆ!",
    youreDoingGreat: "ನೀವು ತುಂಬಾ ಚೆನ್ನಾಗಿ ಮಾಡುತ್ತಿದ್ದೀರಿ.",
    backHome: "ಮನೆಗೆ ಹಿಂತಿರುಗಿ", backToHome: "ಮನೆಗೆ ಹಿಂತಿರುಗಿ",
    talkToEloria: "💜 Eloria ನೊಂದಿಗೆ ಮಾತನಾಡಿ",
    goodMorning: "ಶುಭೋದಯ", goodAfternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ",
    goodEvening: "ಶುಭ ಸಂಜೆ", goodNight: "ಶುಭ ರಾತ್ರಿ",
    nightOwl: "ಹಲೋ",
    howHasToday: "ಇಂದು ಹೇಗೆ ಕಳೆಯಿತು?",
    whatWouldYouLike: "ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
    checkIn: "ಚೆಕ್-ಇನ್", talkToMe: "ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಿ",
    myTrends: "ನನ್ನ ಟ್ರೆಂಡ್‌ಗಳು", history: "ಇತಿಹಾಸ",
    logMood: "ಇಂದಿನ ಮನಸ್ಥಿತಿ ದಾಖಲಿಸಿ", hereToListen: "ನಾನು ಕೇಳುತ್ತೇನೆ",
    seeMoodPatterns: "ಮನಸ್ಥಿತಿ ಮಾದರಿಗಳು", pastCheckins: "ಹಿಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು",
    typeMessage: "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ…",
    send: "ಕಳುಹಿಸಿ", journalPrompt: "ಇಂದು ನಾನು ಅನುಭವಿಸಿದ್ದು…",
    getReflection: "ಪ್ರತಿಫಲನ ಪಡೆಯಿರಿ 💜", writeAnother: "ಮತ್ತೊಂದು ನಮೂದು ಬರೆಯಿರಿ",
    noticedLow: "ನೀವು ಕೆಲವು ದಿನಗಳಿಂದ ಕಡಿಮೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ.",
    gentleSuggestion: "ಏನಾದರೂ ಮೃದುವಾಗಿ ಪ್ರಯತ್ನಿಸಲು ಬಯಸುತ್ತೀರಾ?",
    breathe: "🌬️ ಉಸಿರು", journal: "ಜರ್ನಲ್", talk: "💜 ಮಾತನಾಡಿ",
    moodHistory: "ನಿಮ್ಮ ಮನಸ್ಥಿತಿ ಇತಿಹಾಸ", noCheckins: "ಇನ್ನೂ ಚೆಕ್-ಇನ್‌ಗಳಿಲ್ಲ!",
    weeklyAvg: "7-ದಿನ", monthlyAvg: "30-ದಿನ",
    moodOverTime: "ಕಾಲಾನಂತರದಲ್ಲಿ ಮನಸ್ಥಿತಿ", moodBreakdown: "ಮನಸ್ಥಿತಿ ವಿಭಜನೆ",
    insights: "ಒಳನೋಟಗಳು", logout: "ಲಾಗ್‌ಔಟ್",
    chatGreeting: "ನಮಸ್ಕಾರ! ನಾನು Eloria 💜 ಇಂದು ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?",
    writeFreely: "ಸ್ವತಂತ್ರವಾಗಿ ಬರೆಯಿರಿ — ಇದು ನಿಮಗಾಗಿ ಮಾತ್ರ.",
    whatsOnYourMind: "ಮನಸ್ಸಿನಲ್ಲಿ ಏನಿದೆ?",
    pastEntries: "ಹಿಂದಿನ ನಮೂದುಗಳು", write: "ಬರೆಯಿರಿ",
    yourMoodHistory: "ನಿಮ್ಮ ಮನಸ್ಥಿತಿ ಇತಿಹಾಸ", noCheckInsYet: "ಇನ್ನೂ ಚೆಕ್-ಇನ್‌ಗಳಿಲ್ಲ!",
    soulmateHelper: "ಸಹಾಯ & ಸಂಪನ್ಮೂಲಗಳು",
    selectLanguage: "ಭಾಷೆ",
  },
  Hindi: {
    tagline: "आपका उपचार का ठिकाना",
    login: "लॉगिन", signup: "खाता बनाएं",
    nickname: "उपनाम (3–20 अक्षर)",
    password: "पासवर्ड", passwordHint: "पासवर्ड (कम से कम 6 अक्षर)",
    alreadyHave: "पहले से खाता है? लॉगिन करें",
    newHere: "नए हैं? खाता बनाएं",
    privacy: "🔒 आपकी पहचान हमेशा निजी रहती है",
    howFeeling: "आज आप कैसा महसूस कर रहे हैं?",
    whatsOnMind: "मन में क्या है? (वैकल्पिक)",
    saveCheckin: "सहेजें", checkInSaved: "चेक-इन सहेजा गया!",
    youreDoingGreat: "आप बहुत अच्छा कर रहे हैं।",
    backHome: "होम पर वापस जाएं", backToHome: "होम पर वापस जाएं",
    talkToEloria: "💜 Eloria से बात करें",
    goodMorning: "सुप्रभात", goodAfternoon: "नमस्ते",
    goodEvening: "शुभ संध्या", goodNight: "शुभ रात्रि",
    nightOwl: "हेलो",
    howHasToday: "आज कैसा रहा?",
    whatWouldYouLike: "आप क्या करना चाहेंगे?",
    checkIn: "चेक-इन", talkToMe: "मुझसे बात करें",
    myTrends: "मेरे ट्रेंड्स", history: "इतिहास",
    logMood: "आज का मूड दर्ज करें", hereToListen: "मैं सुन रहा हूं",
    seeMoodPatterns: "मूड पैटर्न देखें", pastCheckins: "पिछले चेक-इन",
    typeMessage: "संदेश टाइप करें…",
    send: "भेजें", journalPrompt: "आज मैंने महसूस किया…",
    getReflection: "प्रतिबिंब पाएं 💜", writeAnother: "एक और लिखें",
    noticedLow: "मैंने देखा है कि आप कुछ दिनों से उदास हैं।",
    gentleSuggestion: "क्या आप कुछ हल्का आजमाना चाहेंगे?",
    breathe: "🌬️ सांस लें", journal: "जर्नल", talk: "💜 बात करें",
    moodHistory: "आपका मूड इतिहास", noCheckins: "अभी तक कोई चेक-इन नहीं!",
    weeklyAvg: "7-दिन", monthlyAvg: "30-दिन",
    moodOverTime: "समय के साथ मूड", moodBreakdown: "मूड विभाजन",
    insights: "अंतर्दृष्टि", logout: "लॉगआउट",
    chatGreeting: "नमस्ते! मैं Eloria हूं 💜 आज आप कैसा महसूस कर रहे हैं?",
    writeFreely: "स्वतंत्र रूप से लिखें — यह सिर्फ आपके लिए है।",
    whatsOnYourMind: "मन में क्या है?",
    pastEntries: "पिछली प्रविष्टियां", write: "लिखें",
    yourMoodHistory: "आपका मूड इतिहास", noCheckInsYet: "अभी तक कोई चेक-इन नहीं!",
    soulmateHelper: "सहायता और संसाधन",
    selectLanguage: "भाषा",
  },
}

const HELPLINES = [
  { name: "iCall", number: "9152987821", desc: "TISS counselling helpline", type: "📞" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7 mental health support", type: "📞" },
  { name: "AASRA", number: "9820466627", desc: "Crisis intervention", type: "📞" },
  { name: "Snehi", number: "044-24640050", desc: "Emotional support helpline", type: "📞" },
  { name: "iCall Email", number: "icall@tiss.edu", desc: "Email counselling", type: "✉️" },
  { name: "Fortis Stress Helpline", number: "8376804102", desc: "Mental health support", type: "📞" },
]

const NGOS = [
  { name: "The Live Love Laugh Foundation", url: "thelivelovelaughfoundation.org", desc: "Mental health awareness" },
  { name: "Sangath", url: "sangath.in", desc: "Free mental health resources & community care" },
  { name: "White Swan Foundation", url: "whiteswanfoundation.org", desc: "Information on mental health conditions" },
  { name: "iCall", url: "icallhelpline.org", desc: "Online & telephone counselling by TISS" },
]

const BOOKS = [
  { title: "The Body Keeps the Score", author: "Bessel van der Kolk", emoji: "📖" },
  { title: "Feeling Good", author: "David D. Burns", emoji: "📗" },
  { title: "Lost Connections", author: "Johann Hari", emoji: "📘" },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", emoji: "📙" },
  { title: "The Midnight Library", author: "Matt Haig", emoji: "📕" },
  { title: "Maybe You Should Talk to Someone", author: "Lori Gottlieb", emoji: "📔" },
]

function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const call = async (fn) => {
    setLoading(true); setError("")
    try { return await fn() }
    catch (e) { setError(e.message || "Something went wrong."); return null }
    finally { setLoading(false) }
  }
  return { loading, error, call, setError }
}

function ErrorBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="fade-up" style={{ background: "#fff0f0", border: "0.5px solid #ffb3b3", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#c0392b" }}>
      <span>⚠️ {message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 16 }}>✕</button>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-sub)", fontSize: 13 }}>
      <div style={{ width: 22, height: 22, border: "2px solid var(--border)", borderTop: "2px solid var(--primary)", borderRadius: "50%", margin: "0 auto 8px", animation: "spin 0.8s linear infinite" }} />
    </div>
  )
}

function Stars() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 60}%`,
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0.4 + Math.random() * 0.4,
          animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
        }} />
      ))}
    </div>
  )
}

function Logo({ size = "sm" }) {
  const lg = size === "lg"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={logo} alt="EloriaHaven Logo" style={{ width: lg ? 44 : 32, height: lg ? 44 : 32, objectFit: "contain", flexShrink: 0 }} />
      <span style={{ fontSize: lg ? 20 : 14, fontWeight: 600, color: "var(--primary)", letterSpacing: "-0.01em" }}>EloriaHaven</span>
    </div>
  )
}

function LangDropdown({ lang, onLangChange, t }) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === lang)
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "var(--text-sub)", cursor: "pointer", fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 6 }}>
        🌐 {current?.native} ▾
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden", zIndex: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160 }}>
          {LANGUAGES.map(l => (
            <div key={l.code} onClick={() => { onLangChange(l.code); setOpen(false) }} style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: lang === l.code ? "var(--primary)" : "var(--text)", background: lang === l.code ? "var(--bg-quote)" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{l.label}</span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>{l.native}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }} aria-label="Toggle theme">
      {dark ? "☀️" : "🌙"}
    </button>
  )
}

function HelperPanel({ onClose, t }) {
  const [tab, setTab] = useState("helplines")
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 420, margin: "0 auto", padding: "20px 20px 32px", maxHeight: "80vh", overflowY: "auto", animation: "slideUp 0.3s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>🆘 {t.soulmateHelper}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-sub)" }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-sub)", background: "var(--bg-quote)", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
          🔒 Your data is never used to train AI models.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["helplines", "ngos", "books"].map(tab_ => (
            <button key={tab_} onClick={() => setTab(tab_)} style={{ flex: 1, padding: "6px 4px", borderRadius: 20, fontSize: 11, border: "0.5px solid", borderColor: tab === tab_ ? "var(--primary)" : "var(--border)", background: tab === tab_ ? "var(--bg-quote)" : "transparent", color: tab === tab_ ? "var(--primary)" : "var(--text-sub)", cursor: "pointer", fontFamily: "var(--font)" }}>
              {tab_ === "helplines" ? "📞 Helplines" : tab_ === "ngos" ? "🤝 NGOs" : "📚 Books"}
            </button>
          ))}
        </div>
        {tab === "helplines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 4 }}>Real, verified Indian helplines. You are not alone. 💜</div>
            {HELPLINES.map((h, i) => (
              <div key={i} style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 6 }}>{h.desc}</div>
                <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}>{h.type} {h.number}</div>
              </div>
            ))}
          </div>
        )}
        {tab === "ngos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 4 }}>Organisations offering free or affordable support. 🤝</div>
            {NGOS.map((n, i) => (
              <div key={i} style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>🤝 {n.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 4 }}>{n.desc}</div>
                <div style={{ fontSize: 11, color: "var(--primary)" }}>{n.url}</div>
              </div>
            ))}
          </div>
        )}
        {tab === "books" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 4 }}>Hand-picked books for mental wellbeing. 📚</div>
            {BOOKS.map((b, i) => (
              <div key={i} style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{b.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-sub)" }}>by {b.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardPage({ onDone }) {
  const [step, setStep] = useState(0)
  const tod = getTimeOfDay()
  const ta = TIME_AMBIENCE[tod]
  const steps = [
    { icon: "💜", title: "Welcome to EloriaHaven", body: "A safe, private place to heal, reflect and feel heard — every day." },
    { icon: "🌿", title: "Meet Eloria", body: "Your empathetic AI companion. She listens, reflects, and gently guides you — no judgement, ever." },
    { icon: "🎋", title: "Your haven awaits", body: "Track your mood, journal your thoughts, and grow your Haven Tree as you heal." },
  ]
  const s = steps[step]
  return (
    <div style={{ minHeight: "100vh", background: ta.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative", transition: "background 1s ease" }}>
      {ta.stars && <Stars />}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 60, marginBottom: 20, animation: "bounceIn 0.6s cubic-bezier(.4,0,.2,1)" }}>{s.icon}</div>
        <Logo size="lg" />
        <div style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(14px)", borderRadius: 20, padding: "24px 22px", border: "0.5px solid rgba(255,255,255,0.3)", marginBottom: 22, marginTop: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: "var(--text)", marginBottom: 10 }}>{s.title}</div>
          <div style={{ fontSize: 14, color: "var(--text-sub)", lineHeight: 1.7 }}>{s.body}</div>
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ height: 6, borderRadius: 3, background: i === step ? "var(--primary)" : "rgba(124,111,255,0.25)", width: i === step ? 20 : 8, transition: "all 0.3s" }} />
          ))}
        </div>
        {step < steps.length - 1
          ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
          : <button className="btn btn-primary" onClick={onDone}>Enter EloriaHaven 💜</button>
        }
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-sub)" }}>🔒 Anonymous. Private. Always.</div>
      </div>
    </div>
  )
}

function AuthPage({ onLogin, t, lang, onLangChange }) {
  const [isSignup, setIsSignup] = useState(false)
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const { loading, error, call, setError } = useApi()
  const quote = getRandomQuote()
  const tod = getTimeOfDay()
  const ta = TIME_AMBIENCE[tod]

  const validate = () => {
    if (!nickname.trim()) return "Please enter a nickname"
    if (nickname.trim().length < 3) return "Nickname must be at least 3 characters"
    if (nickname.trim().length > 20) return "Nickname must be under 20 characters"
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname.trim())) return "Nickname: letters, numbers, - and _ only"
    if (!password) return "Please enter a password"
    if (isSignup && password.length < 6) return "Password must be at least 6 characters"
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    const result = await call(async () => {
      const res = await fetch(`${API}/${isSignup ? "signup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Something went wrong")
      return data
    })
    if (result) {
      localStorage.setItem("token", result.token)
      localStorage.setItem("nickname", result.nickname)
      onLogin(result.nickname)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: ta.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", transition: "background 1s ease" }}>
      {ta.stars && <Stars />}
      <div className="fade-up" style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(16px)", borderRadius: 20, padding: 24, border: "0.5px solid rgba(255,255,255,0.28)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo size="lg" />
          <LangDropdown lang={lang} onLangChange={onLangChange} t={t} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sub)" }}>{t.tagline}</div>
        <div className="quote-card">{quote}</div>
        <ErrorBanner message={error} onClose={() => setError("")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder={t.nickname} value={nickname} onChange={e => setNickname(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} maxLength={20} />
          <input placeholder={isSignup ? t.passwordHint : t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? <Spinner /> : isSignup ? t.signup : t.login}</button>
        <button className="btn btn-ghost" onClick={() => { setIsSignup(v => !v); setError("") }}>{isSignup ? t.alreadyHave : t.newHere}</button>
        <div style={{ fontSize: 11, color: "var(--text-sub)", textAlign: "center" }}>{t.privacy}</div>
      </div>
    </div>
  )
}

function CheckInPage({ onNavigate, t, onMoodSet }) {
  const [mood, setMood] = useState(null)
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [recentLow, setRecentLow] = useState(false)

  useEffect(() => {
    fetch(`${API}/checkins`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json())
      .then(data => {
        const recent = data.slice(-3)
        if (recent.length >= 2 && recent.every(c => c.mood <= 2)) setRecentLow(true)
      })
  }, [])

  const handleSubmit = async () => {
    if (mood === null) return
    await fetch(`${API}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ mood: mood + 1, note })
    })
    onMoodSet(mood + 1)
    setSubmitted(true)
  }

  const amb = mood !== null ? AMBIENCE[mood + 1] : null

  if (submitted) return (
    <div className="app fade-up" style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 16 }}>
      <div style={{ animation: "bounceIn 0.5s cubic-bezier(.4,0,.2,1)" }}>{MOOD_FACES[mood + 1](64)}</div>
      <div className="section-title" style={{ fontSize: 18 }}>{t.checkInSaved}</div>
      <div style={{ fontSize: 14, color: "var(--text-sub)", lineHeight: 1.7 }}>{t.youreDoingGreat}</div>
      {amb && <div style={{ fontSize: 13, color: amb.accent, fontStyle: "italic" }}>{amb.message}</div>}
      <button className="btn btn-primary" onClick={() => onNavigate("home")}>{t.backToHome}</button>
      <button className="btn btn-ghost" onClick={() => onNavigate("chat")}>{t.talkToEloria}</button>
    </div>
  )

  return (
    <div className="app fade-up pb-nav">
      <div style={{ marginBottom: 20 }}><Logo /></div>
      <div className="section-title" style={{ fontSize: 18 }}>{t.howFeeling}</div>
      {recentLow && (
        <div className="nudge-card mb-12">
          <div className="nudge-title">💜 {t.noticedLow}</div>
          <div className="nudge-sub">{t.gentleSuggestion}</div>
          <div className="nudge-options">
            <button className="nudge-btn" onClick={() => onNavigate("chat")}>{t.breathe}</button>
            <button className="nudge-btn" onClick={() => onNavigate("journal")}>{t.journal}</button>
            <button className="nudge-btn" onClick={() => onNavigate("chat")}>{t.talk}</button>
          </div>
        </div>
      )}
      {amb && <div className="fade-up" style={{ fontSize: 12, color: amb.accent, fontStyle: "italic", marginBottom: 10, textAlign: "center" }}>{amb.message}</div>}
      <div className="mood-grid">
        {MOOD_CONFIG.map((m, i) => (
          <div key={i} className={`mood-opt ${mood === i ? "selected" : ""}`}
            onClick={() => setMood(i)}
            style={{ borderColor: mood === i ? m.color : undefined, background: mood === i ? m.bg : undefined, transition: "all 0.25s" }}>
            <div style={{ transition: "transform 0.2s", transform: mood === i ? "scale(1.15)" : "scale(1)" }}>
              {MOOD_FACES[i + 1](mood === i ? 34 : 28)}
            </div>
            <span style={{ color: mood === i ? m.color : undefined, fontSize: 10 }}>{m.label}</span>
          </div>
        ))}
      </div>
      <textarea placeholder={t.whatsOnMind} value={note} onChange={e => setNote(e.target.value)} rows={4} style={{ marginTop: 8, marginBottom: 16, resize: "none" }} />
      <button className="btn btn-primary" onClick={handleSubmit} disabled={mood === null} style={{ opacity: mood === null ? 0.5 : 1, background: amb ? `linear-gradient(135deg, ${amb.accent}cc, ${amb.accent})` : undefined, transition: "background 0.4s" }}>
        {t.saveCheckin}
      </button>
    </div>
  )
}

function HistoryPage({ t }) {
  const [checkins, setCheckins] = useState([])
  useEffect(() => {
    fetch(`${API}/checkins`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(data => setCheckins([...data].reverse()))
  }, [])
  const formatDate = iso => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  return (
    <div className="app fade-up pb-nav">
      <div style={{ marginBottom: 20 }}><Logo /></div>
      <div className="section-title">{t.yourMoodHistory}</div>
      {checkins.length === 0 && <div className="text-sub">{t.noCheckInsYet}</div>}
      {checkins.map((c, i) => {
        const m = MOOD_CONFIG[c.mood - 1]
        return (
          <div key={i} className="history-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ flexShrink: 0 }}>{MOOD_FACES[c.mood](32)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: m?.color }}>{m?.label}</div>
                <div className="text-sub" style={{ fontSize: 11 }}>📅 {formatDate(c.timestamp)}</div>
              </div>
            </div>
            {c.note && <div style={{ fontSize: 13, color: "var(--text-sub)", paddingLeft: 42 }}>💬 {c.note}</div>}
          </div>
        )
      })}
    </div>
  )
}

function ChatPage({ t, lang }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: t.chatGreeting }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionSaved, setSessionSaved] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    const saveSession = async () => {
      const userMessages = messages.filter(m => m.role === "user")
      if (userMessages.length === 0 || sessionSaved) return
      await fetch(`${API}/chat/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ messages })
      })
      setSessionSaved(true)
    }
    window.addEventListener("beforeunload", saveSession)
    return () => { window.removeEventListener("beforeunload", saveSession); saveSession() }
  }, [messages, sessionSaved])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", text: input }
    const updated = [...messages, userMsg]
    setMessages(updated); setInput(""); setLoading(true)
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ message: input, history: messages, language: lang })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: "assistant", text: data.reply, crisis: data.crisis }])
    setLoading(false); setSessionSaved(false)
  }

  return (
    <div className="app pb-nav" style={{ gap: 0 }}>
      <div style={{ marginBottom: 16 }}><Logo /></div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} className="fade-up" style={{ display: "flex", flexDirection: "column", animationDelay: `${i * 0.03}s` }}>
            {m.crisis && (
              <div style={{ background: "#fff3cd", border: "0.5px solid #ffc107", borderRadius: 10, padding: "10px 13px", marginBottom: 8, fontSize: 12, color: "#7a4900" }}>
                🆘 You're not alone. Help is always available.
              </div>
            )}
            <div className={m.role === "user" ? "bubble-user" : "bubble-ai"} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", whiteSpace: "pre-wrap" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="bubble-ai" style={{ alignSelf: "flex-start" }}><span style={{ opacity: 0.6, animation: "pulse 1.2s ease-in-out infinite" }}>Eloria is typing…</span></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
        <textarea rows={2} placeholder={t.typeMessage} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          style={{ resize: "none", flex: 1 }} />
        <button className="btn btn-primary" style={{ width: "auto", padding: "0 16px" }} onClick={sendMessage} disabled={!input.trim() || loading}>
          {loading ? "…" : t.send}
        </button>
      </div>
    </div>
  )
}

function TrendsPage({ t }) {
  const [allData, setAllData] = useState([])
  const [view, setView] = useState("weekly")

  useEffect(() => {
    fetch(`${API}/checkins`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(data => setAllData(data))
  }, [])

  const weeklyData = allData.slice(-7).map(c => ({ date: new Date(c.timestamp).toLocaleDateString("en-IN", { weekday: "short" }), mood: c.mood, full: new Date(c.timestamp).toLocaleDateString("en-IN", { dateStyle: "medium" }) }))
  const monthlyData = allData.slice(-30).map(c => ({ date: new Date(c.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), mood: c.mood, full: new Date(c.timestamp).toLocaleDateString("en-IN", { dateStyle: "medium" }) }))
  const activeData = view === "weekly" ? weeklyData : monthlyData
  const distribution = [1,2,3,4,5].map(v => ({ label: MOOD_CONFIG[v-1].label, count: activeData.filter(d => d.mood === v).length, color: MOOD_CONFIG[v-1].color })).filter(d => d.count > 0)
  const avg = activeData.length ? (activeData.reduce((s,c) => s+c.mood, 0) / activeData.length).toFixed(1) : null
  const avgMood = avg ? MOOD_CONFIG[Math.round(avg) - 1] : null
  const streak = (() => {
    if (!allData.length) return 0
    let count = 0
    const dates = [...new Set(allData.map(c => new Date(c.timestamp).toDateString()))].reverse()
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(); expected.setDate(expected.getDate() - i)
      if (new Date(dates[i]).toDateString() === expected.toDateString()) count++
      else break
    }
    return count
  })()
  const getInsights = () => {
    const ins = []
    if (activeData.length < 2) return ins
    const vals = activeData.map(d => d.mood)
    const a = vals.reduce((a,b) => a+b,0) / vals.length
    const half = Math.floor(vals.length/2)
    const f = vals.slice(0,half).reduce((a,b) => a+b,0)/half
    const s = vals.slice(half).reduce((a,b) => a+b,0)/(vals.length-half)
    if (s > f + 0.4) ins.push({ icon: "📈", text: "Your mood has been improving lately. Keep going 💜" })
    else if (s < f - 0.4) ins.push({ icon: "💜", text: "You've had some tough days recently. That's okay — you're still showing up." })
    else ins.push({ icon: "🌿", text: "Your mood has been steady. Consistency is its own kind of strength." })
    const best = activeData.reduce((a,b) => a.mood > b.mood ? a : b)
    ins.push({ icon: "🌟", text: `Your best day recently was ${best.full} — a ${MOOD_CONFIG[best.mood-1].label} day.` })
    if (activeData.filter(d => d.mood <= 2).length >= 3) ins.push({ icon: "🫂", text: "You've had several low days. Consider talking to Eloria or a trusted person." })
    if (a >= 4) ins.push({ icon: "✨", text: "You've been doing really well this period. Celebrate that!" })
    return ins
  }
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const m = MOOD_CONFIG[payload[0].value - 1]
    return (<div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}><div style={{ color: m?.color, fontWeight: 500 }}>{m?.label}</div><div style={{ color: "var(--text-sub)" }}>{payload[0].payload.full}</div></div>)
  }

  return (
    <div className="app fade-up pb-nav">
      <div style={{ marginBottom: 20 }}><Logo /></div>
      {streak >= 7 && (
        <div className="streak-badge mb-12">
          <span style={{ fontSize: 20 }}>🌱</span>
          <span>{streak >= 30 ? "You've been taking care of yourself for a month. That's something to be proud of. 💜" : `${streak} days of checking in! You're building a great habit. 💜`}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn btn-sm ${view === "weekly" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("weekly")}>📅 {t.weeklyAvg}</button>
        <button className={`btn btn-sm ${view === "monthly" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("monthly")}>🗓️ {t.monthlyAvg}</button>
      </div>
      {allData.length === 0 ? <div className="text-sub">{t.noCheckins}</div> : (
        <>
          {avgMood && (
            <div className="card mb-16" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flexShrink: 0 }}>{MOOD_FACES[Math.round(avg)](48)}</div>
              <div>
                <div className="text-sub" style={{ fontSize: 11, marginBottom: 2 }}>{view === "weekly" ? t.weeklyAvg : t.monthlyAvg} average</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: avgMood.color }}>{avgMood.label}</div>
                <div className="text-sub" style={{ fontSize: 11 }}>{avg} / 5 · {activeData.length} check-in{activeData.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
          )}
          <div className="section-title">{t.moodOverTime}</div>
          <ResponsiveContainer width="100%" height={180}>
            {view === "weekly" ? (
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mood" radius={[6,6,0,0]}>{weeklyData.map((e,i) => <Cell key={i} fill={MOOD_CONFIG[e.mood-1]?.color || "var(--primary)"} fillOpacity={0.8} />)}</Bar>
              </BarChart>
            ) : (
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "var(--text-sub)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mood" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 7 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
          {distribution.length > 0 && (
            <>
              <div className="section-title mt-16">{t.moodBreakdown}</div>
              <div className="card mb-16">
                {distribution.map((d,i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < distribution.length - 1 ? 10 : 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "var(--text)", flex: 1 }}>{d.label}</div>
                    <div style={{ display: "flex", gap: 3 }}>{Array.from({ length: d.count }).map((_,j) => (<div key={j} style={{ width: 8, height: 8, borderRadius: 2, background: d.color, opacity: 0.7 }} />))}</div>
                    <div style={{ fontSize: 11, color: "var(--text-sub)", minWidth: 24, textAlign: "right" }}>{d.count}d</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {getInsights().length > 0 && (
            <>
              <div className="section-title">{t.insights}</div>
              {getInsights().map((ins,i) => (
                <div key={i} className="insight-card fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ fontSize: 18 }}>{ins.icon}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{ins.text}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

const EMOTION_EMOJI = { happy: "😊", sad: "😔", angry: "😠", surprised: "😲", fearful: "😨", disgusted: "😖", neutral: "😌" }

function FaceCheckIn() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const openCamera = async () => {
    setOpen(true); setResult(null); setError(null)
    try {
      if (!modelsLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
        await faceapi.nets.faceExpressionNet.loadFromUri("/models")
        setModelsLoaded(true)
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) {
    console.error("Face check-in error:", e)
    setError("Couldn't access your camera, or the detection models aren't loaded yet.")
  }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setOpen(false); setResult(null); setError(null)
  }

  const detect = async () => {
    if (!videoRef.current) return
    setDetecting(true)
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
      if (!detection) {
        setResult({ emotion: null })
      } else {
        const top = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1])[0][0]
        setResult({ emotion: top })
      }
    } catch {
      setError("Something went wrong reading your expression. You can still write freely.")
    }
    setDetecting(false)
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), [])

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={openCamera}>
        📷 Check in with your face (optional)
      </button>
    )
  }

  return (
    <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", maxWidth: 280, borderRadius: 12, marginBottom: 12, transform: "scaleX(-1)" }} />
      {error && <div className="text-sub" style={{ fontSize: 11, marginBottom: 12, color: "var(--danger, #e07060)" }}>{error}</div>}
      {result && (
        result.emotion ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 32 }}>{EMOTION_EMOJI[result.emotion] || "🙂"}</div>
            <div className="text-sub" style={{ fontSize: 12, textTransform: "capitalize" }}>Looking {result.emotion}</div>
          </div>
        ) : (
          <div className="text-sub" style={{ fontSize: 12, marginBottom: 12 }}>Couldn't detect a face clearly — try better lighting.</div>
        )
      )}
      {!result && !error && (
        <div className="text-sub" style={{ fontSize: 11, marginBottom: 12 }}>This stays on your device only — nothing is uploaded, ever.</div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {!result && <button className="btn btn-primary btn-sm" onClick={detect} disabled={detecting}>{detecting ? "Looking…" : "Detect"}</button>}
        <button className="btn btn-ghost btn-sm" onClick={closeCamera}>Close</button>
      </div>
    </div>
  )
}

function JournalPage({ onNavigate, t, lang }) {
  const [content, setContent] = useState("")
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [view, setView] = useState("write")
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef(null)

  const SPEECH_LANG = { English: "en-IN", Tamil: "ta-IN", Telugu: "te-IN", Malayalam: "ml-IN", Kannada: "kn-IN", Hindi: "hi-IN" }
  const voiceSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop()
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG[lang] || "en-IN"
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscript = content ? content.trim() + " " : ""

    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += transcript + " "
        else interim += transcript
      }
      setContent((finalTranscript + interim).slice(0, 5000))
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  useEffect(() => () => recognitionRef.current?.stop(), [])

  useEffect(() => {
    fetch(`${API}/journal`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(data => setEntries([...data].reverse()))
  }, [])

  const handleSubmit = async () => {
    if (content.trim().length < 10) return
    setLoading(true)
    const res = await fetch(`${API}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    setReflection(data.reflection); setLoading(false)
  }

  const formatDate = iso => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })

  if (reflection) return (
    <div className="app fade-up" style={{ gap: 16 }}>
      <div style={{ marginBottom: 4 }}><Logo /></div>
      <div className="section-title" style={{ fontSize: 18 }}>Eloria reflects 💜</div>
      <div className="card" style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-sub)", fontStyle: "italic" }}>"{content}"</div>
      <div className="quote-card" style={{ fontSize: 13, lineHeight: 1.8, fontStyle: "normal" }}>💜 {reflection}</div>
      <button className="btn btn-primary" onClick={() => {
        setContent(""); setReflection(null)
        fetch(`${API}/journal`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
          .then(r => r.json()).then(data => setEntries([...data].reverse()))
      }}>{t.writeAnother}</button>
      <button className="btn btn-ghost" onClick={() => onNavigate("home")}>{t.backHome}</button>
    </div>
  )

  return (
    <div className="app fade-up pb-nav">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Logo />
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn btn-sm ${view === "write" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("write")}>{t.write}</button>
          <button className={`btn btn-sm ${view === "history" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("history")}>{t.pastEntries}</button>
        </div>
      </div>
      {view === "write" ? (
        <>
          <div className="section-title">{t.whatsOnYourMind}</div>
          <div className="text-sub mb-12">{t.writeFreely}</div>
          <FaceCheckIn />
          <div style={{ position: "relative", marginBottom: 8 }}>
            <textarea placeholder={t.journalPrompt} value={content} onChange={e => setContent(e.target.value)} rows={10} style={{ resize: "none", lineHeight: 1.8, fontSize: 14 }} />
            {voiceSupported && (
              <button
                onClick={toggleRecording}
                className="btn btn-sm"
                style={{
                  position: "absolute", bottom: 10, right: 10,
                  background: recording ? "var(--danger, #e07060)" : "var(--primary, #7c6fff)",
                  color: "#fff", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11,
                }}
              >
                {recording ? "⏹ Stop" : "🎤 Speak"}
              </button>
            )}
          </div>
          {recording && <div className="text-sub" style={{ fontSize: 11, marginBottom: 8, color: "var(--danger, #e07060)" }}>● Listening…</div>}
          <div className="text-sub" style={{ fontSize: 11, textAlign: "right", marginBottom: 16 }}>
            {content.trim().length < 10 ? `${10 - content.trim().length} more characters needed` : `${content.trim().length} / 5000`}
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={content.trim().length < 10 || loading} style={{ opacity: content.trim().length < 10 || loading ? 0.5 : 1 }}>
            {loading ? "Eloria is reflecting…" : t.getReflection}
          </button>
        </>
      ) : (
        <>
          <div className="section-title">{t.moodHistory}</div>
          {entries.length === 0 && <div className="text-sub">No entries yet. Start writing!</div>}
          {entries.map((e, i) => (
            <div key={i} className="history-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-sub mb-8" style={{ fontSize: 11 }}>📅 {formatDate(e.timestamp)}</div>
              <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 10, lineHeight: 1.7 }}>
                {e.content.length > 120 ? e.content.slice(0, 120) + "…" : e.content}
              </div>
              <div className="quote-card" style={{ fontSize: 12, fontStyle: "normal" }}>
                💜 {e.reflection.length > 150 ? e.reflection.slice(0, 150) + "…" : e.reflection}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function ReminderBanner({ onCheckIn }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    fetch(`${API}/checkins/today`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(data => { if (!data.checked_in_today) setShow(true) })
  }, [])
  if (!show) return null
  return (
    <div className="fade-up" style={{ position: "fixed", top: 0, left: 0, right: 0, background: "linear-gradient(135deg, #9b8fff, #7c6fff)", color: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 300, fontSize: 13, boxShadow: "0 2px 12px rgba(124,111,255,0.3)" }}>
      <span>💜 You haven't checked in today yet</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => { setShow(false); onCheckIn() }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}>Check in →</button>
        <button onClick={() => setShow(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
    </div>
  )
}


function SmartBreakReminder({ nickname }) {
  const [nudge, setNudge] = useState(null) // 'midnight' | 'longuse' | null
  const [dismissedMidnightToday, setDismissedMidnightToday] = useState(false)
  const sessionStartRef = useRef(Date.now())
  const lastLongUseNudgeRef = useRef(Date.now())

  const LONG_USE_MS = 45 * 60 * 1000 // 45 minutes

  useEffect(() => {
    if (!nickname) return

    const checkTime = () => {
      const now = Date.now()
      const hour = new Date().getHours()

      // Midnight sleep nudge — once per calendar day, only between 12am–4am
      const todayKey = `midnightNudgeSeen:${nickname}:${new Date().toDateString()}`
      const alreadySeenToday = localStorage.getItem(todayKey)
      if (hour >= 0 && hour < 5 && !alreadySeenToday && !dismissedMidnightToday && nudge === null) {
        setNudge("midnight")
        return
      }

      // Long continuous use nudge — every 45 minutes of the app staying open
      if (nudge === null && now - lastLongUseNudgeRef.current >= LONG_USE_MS) {
        setNudge("longuse")
      }
    }

    const interval = setInterval(checkTime, 60 * 1000) // check once a minute
    checkTime()
    return () => clearInterval(interval)
  }, [nickname, nudge, dismissedMidnightToday])

  const dismiss = () => {
    if (nudge === "midnight") {
      const todayKey = `midnightNudgeSeen:${nickname}:${new Date().toDateString()}`
      localStorage.setItem(todayKey, "1")
      setDismissedMidnightToday(true)
    }
    if (nudge === "longuse") {
      lastLongUseNudgeRef.current = Date.now()
    }
    setNudge(null)
  }

  if (!nudge) return null

  const content = nudge === "midnight"
    ? { emoji: "🌙", text: "It's getting late. Your mind (and body) will thank you for some rest.", action: null }
    : { emoji: "🌿", text: "You've been here a while. A short break might help you come back clearer.", action: null }

  return (
    <div className="fade-up" style={{
      position: "fixed", bottom: 88, left: 16, right: 16, maxWidth: 420, margin: "0 auto",
      background: "rgba(45, 42, 74, 0.92)", backdropFilter: "blur(10px)",
      color: "#fff", padding: "14px 16px", borderRadius: 16,
      display: "flex", alignItems: "center", gap: 12, zIndex: 250,
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
    }}>
      <span style={{ fontSize: 20 }}>{content.emoji}</span>
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{content.text}</span>
      <button onClick={dismiss} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "var(--font)" }}>
        Got it
      </button>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState("onboard")
  const [nickname, setNickname] = useState("")
  const [dark, setDark] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "English")
  const [moodAmbience, setMoodAmbience] = useState(() => {
    const saved = localStorage.getItem("moodAmbience")
    return saved ? parseInt(saved) : null
  })
  const [showHelper, setShowHelper] = useState(false)

  const t = T[lang] || T.English
  const amb = moodAmbience ? AMBIENCE[moodAmbience] : null

  const handleLangChange = (code) => { setLang(code); localStorage.setItem("lang", code) }
  const handleMoodSet = (mood) => { setMoodAmbience(mood); localStorage.setItem("moodAmbience", mood) }

  useEffect(() => {
    const token = localStorage.getItem("token")
    const saved = localStorage.getItem("nickname")
    const seenOnboard = localStorage.getItem("onboarded")
    if (token && saved) { setNickname(saved); setPage("home") }
    else if (seenOnboard) setPage("auth")
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
  }, [dark])

  useEffect(() => {
    fetch(`${API}/`).catch(() => console.warn("Backend not reachable"))
  }, [])

  const handleLogin = nick => { setNickname(nick); setPage("home") }
  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("nickname")
    setNickname(""); setPage("auth")
  }
  const navigate = p => setPage(p)

  // Pages that show the OLD nav (not home — home has its own new nav)
  const showOldNav = ["checkin", "chat", "trends", "history", "journal"].includes(page)
  // Pages that show the old top bar (not home, not onboard, not auth)
  const showTopBar = !["onboard", "auth", "home"].includes(page)

  const bodyBg = amb && !dark && page !== "home"
    ? amb.bg
    : dark ? "#1a1730" : "var(--bg)"

  return (
    <div style={{ background: page === "home" ? "transparent" : bodyBg, minHeight: "100vh", transition: "background 0.8s ease", position: "relative" }}>

      {/* Top bar — hidden on home (home has its own) */}
      {showTopBar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", pointerEvents: "none" }}>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-sub)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)", pointerEvents: "all" }}>
            {t.logout}
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center", pointerEvents: "all" }}>
            <button onClick={() => navigate("support")} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }} title={t.soulmateHelper}>🆘</button>
            <LangDropdown lang={lang} onLangChange={handleLangChange} t={t} />
            <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
          </div>
        </div>
      )}

      {/* Reminder banner only on non-home pages */}
      {showOldNav && <ReminderBanner onCheckIn={() => navigate("checkin")} />}

      {/* Smart break reminders — midnight nudge + 45-min long-use nudge, app-wide */}
      {nickname && <SmartBreakReminder nickname={nickname} />}

      {/* Pages */}
      {page === "onboard"  && <OnboardPage onDone={() => { localStorage.setItem("onboarded","1"); setPage("auth") }} />}
      {page === "auth"     && <AuthPage onLogin={handleLogin} t={t} lang={lang} onLangChange={handleLangChange} />}
      {page === "home" && (
        <NewHomePage
          onNavigate={navigate}
          onLogout={handleLogout}
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          page={page}
        />
      )}
      {page === "checkin"  && <CheckInPage onNavigate={navigate} t={t} onMoodSet={handleMoodSet} />}
      {page === "history"  && <HistoryPage t={t} />}
      {page === "chat"     && <ChatPage t={t} lang={lang} />}
      {page === "support"  && <SupportPage onNavigate={navigate} page={page} dark={dark} />}
      {page === "library"  && <LibraryPage onNavigate={navigate} page={page} dark={dark} />}
      {page === "stories"  && <StoriesPage onNavigate={navigate} page={page} dark={dark} lang={lang} />}
      {page === "tree"     && <HavenTreePage onNavigate={navigate} page={page} dark={dark} />}
      {page === "trends"   && <TrendsPage t={t} />}
      {page === "journal"  && <JournalPage onNavigate={navigate} t={t} lang={lang} />}
      {page === "relax"     && <RelaxPage     onNavigate={navigate} page={page} dark={dark} />}
      {page === "breathing" && <BreathingPage onNavigate={navigate} dark={dark} />}
      {page === "kolam"     && <KolamPage     onNavigate={navigate} dark={dark} />}
      {page === "scribble"  && <ScribblePage  onNavigate={navigate} dark={dark} />}
      {page === "bubbles"   && <BubblePage    onNavigate={navigate} dark={dark} />}
      {page === "music"     && <MusicPage     onNavigate={navigate} dark={dark} />}
      {page === "focus" && <FocusPage onNavigate={navigate} page={page} dark={dark} />}
      {page === "scheduler" && <SchedulerPage onNavigate={navigate} page={page} dark={dark} />}
      {page === "grades" && <GradesPage onNavigate={navigate} page={page} dark={dark} />}
      {page === "pomodoro" && <PomodoroPage onNavigate={navigate} page={page} dark={dark} />}
      {/* Old nav bar only for non-home pages */}
      {showOldNav && <NewNavBar page={page} onNavigate={navigate} />}

      {showHelper && <HelperPanel onClose={() => setShowHelper(false)} t={t} />}
    </div>
  )
}