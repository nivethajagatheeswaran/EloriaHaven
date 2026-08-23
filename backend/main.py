from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from groq import Groq
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from pydantic import BaseModel, validator
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Literal
from pydantic import BaseModel, field_validator
from fastapi import HTTPException
import json
import pdfplumber
import io
from fastapi import UploadFile, File

load_dotenv()

app = FastAPI()
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    message = errors[0]['msg'] if errors else 'Invalid input'
    return JSONResponse(status_code=422, content={"detail": message})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        *[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()],
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

# Auth config
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ── Models ──────────────────────────────────────────
class AuthUser(BaseModel):
    nickname: str
    password: str

    @validator('nickname')
    def nickname_valid(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Nickname must be at least 3 characters')
        if len(v) > 20:
            raise ValueError('Nickname must be under 20 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Nickname can only contain letters, numbers, - and _')
        return v

    @validator('password')
    def password_valid(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class MoodCheckIn(BaseModel):
    mood: int
    note: str

    @validator('mood')
    def mood_valid(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Mood must be between 1 and 5')
        return v

    @validator('note')
    def note_valid(cls, v):
        return v.strip()[:500]  # max 500 chars

class ChatMessage(BaseModel):
    message: str
    history: list = []
    language: str = "English"

    @validator('message')
    def message_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Message cannot be empty')
        if len(v) > 2000:
            raise ValueError('Message too long')
        return v
    
# ── Auth Helpers ─────────────────────────────────────
def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(nickname: str):
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": nickname, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        nickname = payload.get("sub")
        if nickname is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return nickname
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Routes ───────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "EloriaHaven backend is running!"}

@app.post("/signup")
async def signup(data: AuthUser):
    existing = await db.users.find_one({"nickname": data.nickname})
    if existing:
        raise HTTPException(status_code=400, detail="Nickname already taken")
    await db.users.insert_one({
        "nickname": data.nickname,
        "password": hash_password(data.password),
        "created_at": datetime.now().isoformat()
    })
    token = create_token(data.nickname)
    return {"token": token, "nickname": data.nickname}

@app.post("/login")
async def login(data: AuthUser):
    user = await db.users.find_one({"nickname": data.nickname})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid nickname or password")
    token = create_token(data.nickname)
    return {"token": token, "nickname": data.nickname}

@app.post("/checkin")
async def submit_checkin(data: MoodCheckIn, nickname: str = Depends(get_current_user)):
    entry = {
        "nickname": nickname,
        "mood": data.mood,
        "note": data.note,
        "timestamp": datetime.now().isoformat()
    }
    await db.checkins.insert_one(entry)
    return {"message": "Check-in saved!"}

@app.get("/checkins")
async def get_checkins(nickname: str = Depends(get_current_user)):
    checkins = []
    async for doc in db.checkins.find({"nickname": nickname}, {"_id": 0}):
        checkins.append(doc)
    return checkins

CRISIS_KEYWORDS = [
    "kill myself", "want to die", "end my life", "suicide", "hurt myself",
    "self harm", "don't want to live", "give up on life", "no reason to live",
    "better off dead", "can't go on", "ending it all", "harm myself"
]

HELPLINES = """
If you or someone you know is in crisis, please reach out immediately:
- iCall (India): 9152987821
- Vandrevala Foundation: 1860-2662-345
- AASRA: 9820466627
- iCall Email: icall@tiss.edu
"""

def is_crisis(message: str) -> bool:
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in CRISIS_KEYWORDS)

@app.post("/chat")
async def chat(data: ChatMessage, nickname: str = Depends(get_current_user)):
    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))
    crisis = is_crisis(data.message)

    # Fetch last 2 sessions for cross-session memory
    past_context = ""
    sessions = []
    async for doc in db.chat_sessions.find(
        {"nickname": nickname},
        {"_id": 0}
    ).sort("timestamp", -1).limit(2):
        sessions.append(doc)

    if sessions:
        summary_parts = []
        for s in reversed(sessions):
            msgs = s.get("messages", [])
            user_msgs = [m["text"] for m in msgs if m["role"] == "user"]
            if user_msgs:
                summary_parts.append("- " + " | ".join(user_msgs[:3]))
        if summary_parts:
            past_context = "\n\nPrevious conversations with this user:\n" + "\n".join(summary_parts)
            past_context += "\n\nUse this context naturally and compassionately — only reference past topics if genuinely relevant."

    language_instruction = f"Always respond in {data.language} language only, regardless of what language the user writes in. If the language is Tamil, use Tamil script. If Telugu, use Telugu script. If Malayalam, use Malayalam script. If Kannada, use Kannada script. If Hindi, use Hindi script. If English, use English."

    system_prompt = f"""You are Eloria, a warm and empathetic mental health 
    companion for college students. You listen carefully, respond with 
    kindness, and gently encourage professional help when needed. 
    Keep responses concise and supportive. Never diagnose.
    {language_instruction}{past_context}"""

    if crisis:
        system_prompt += """

    IMPORTANT: The user may be in crisis.
    - Respond with deep empathy and care
    - Do NOT minimize their feelings
    - Gently encourage them to reach out to a professional or helpline
    - Keep your tone calm, warm and non-judgmental"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in data.history:
        messages.append({"role": msg["role"], "content": msg["text"]})
    messages.append({"role": "user", "content": data.message})

    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages
    )
    reply = response.choices[0].message.content
    if crisis:
        reply += f"\n\n🆘 **If you're in crisis, please reach out:**\n{HELPLINES}"

    return {"reply": reply, "crisis": crisis}

class JournalEntry(BaseModel):
    content: str

    @validator('content')
    def content_valid(cls, v):
        v = v.strip()
        if len(v) < 10:
            raise ValueError('Journal entry too short')
        if len(v) > 5000:
            raise ValueError('Journal entry too long (max 5000 characters)')
        return v
    
@app.post("/journal")
async def save_journal(data: JournalEntry, nickname: str = Depends(get_current_user)):
    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """You are Eloria, a warm and empathetic journal companion. 
                The user has just written a journal entry. Respond with a short, 
                thoughtful reflection (3-5 sentences). Acknowledge their feelings, 
                find something meaningful in what they shared, and leave them with 
                one gentle, encouraging thought. Never diagnose or give medical advice."""
            },
            {
                "role": "user",
                "content": f"Here is my journal entry:\n\n{data.content}"
            }
        ]
    )
    
    reflection = response.choices[0].message.content
    
    entry = {
        "nickname": nickname,
        "content": data.content,
        "reflection": reflection,
        "timestamp": datetime.now().isoformat()
    }
    await db.journal.insert_one(entry)
    return {"reflection": reflection}

@app.get("/journal")
async def get_journal(nickname: str = Depends(get_current_user)):
    entries = []
    async for doc in db.journal.find({"nickname": nickname}, {"_id": 0}):
        entries.append(doc)
    return entries

class ChatSession(BaseModel):
    messages: list
    
@app.post("/chat/save")
async def save_chat(data: ChatSession, nickname: str = Depends(get_current_user)):
    session = {
        "nickname": nickname,
        "messages": data.messages,
        "timestamp": datetime.now().isoformat()
    }
    await db.chat_sessions.insert_one(session)
    return {"message": "Chat session saved!"}

@app.get("/chat/history")
async def get_chat_history(nickname: str = Depends(get_current_user)):
    sessions = []
    async for doc in db.chat_sessions.find(
        {"nickname": nickname},
        {"_id": 0}
    ):
        sessions.append(doc)
    return sessions

@app.get("/checkins/today")
async def get_today_checkin(nickname: str = Depends(get_current_user)):
    from datetime import date
    today = date.today().isoformat()
    count = await db.checkins.count_documents({
        "nickname": nickname,
        "timestamp": {"$regex": f"^{today}"}
    })
    return {"checked_in_today": count > 0}

# ============================================================
# ADD TO main.py — Task Scheduler endpoints
# Paste this block at the end of the file, after /checkins/today.
# Your imports for this (uuid, Literal, field_validator, etc.) are
# already at the top of your file, so nothing to add there.
# ============================================================

class TaskCreate(BaseModel):
    text: str
    priority: Optional[Literal["high", "medium", "low"]] = None

    @validator('text')
    def text_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Task text cannot be empty')
        if len(v) > 200:
            raise ValueError('Task text too long (max 200 characters)')
        return v


class TaskUpdate(BaseModel):
    text: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    completed: Optional[bool] = None


class ReorderRequest(BaseModel):
    order: List[str]  # task ids in new order


async def suggest_priority(text: str) -> str:
    """Ask Eloria (Groq) to classify a task's urgency. Falls back to 'medium' on any failure."""
    try:
        client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client_ai.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": "Classify the urgency of a college student's task. "
                                "Reply with exactly one word: high, medium, or low. Nothing else."
                },
                {"role": "user", "content": text}
            ],
            max_tokens=5,
            temperature=0,
        )
        result = response.choices[0].message.content.strip().lower()
        if result in ("high", "medium", "low"):
            return result
        return "medium"
    except Exception:
        return "medium"


@app.post("/tasks")
async def create_task(data: TaskCreate, nickname: str = Depends(get_current_user)):
    ai_suggested = data.priority is None
    priority = data.priority or await suggest_priority(data.text)

    count = await db.tasks.count_documents({"nickname": nickname})

    doc = {
        "id": str(uuid.uuid4()),
        "nickname": nickname,
        "text": data.text,
        "priority": priority,
        "ai_suggested": ai_suggested,
        "completed": False,
        "order": count,
        "timestamp": datetime.now().isoformat(),
    }
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.get("/tasks")
async def list_tasks(nickname: str = Depends(get_current_user)):
    tasks = []
    async for doc in db.tasks.find({"nickname": nickname}, {"_id": 0}).sort("order", 1):
        tasks.append(doc)
    return tasks


@app.put("/tasks/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, nickname: str = Depends(get_current_user)):
    existing = await db.tasks.find_one({"id": task_id, "nickname": nickname})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    fields = {k: v for k, v in data.dict(exclude_unset=True).items()}
    if "priority" in fields:
        fields["ai_suggested"] = False  # manual override clears the AI flag

    if fields:
        await db.tasks.update_one({"id": task_id, "nickname": nickname}, {"$set": fields})

    updated = await db.tasks.find_one({"id": task_id, "nickname": nickname}, {"_id": 0})
    return updated


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, nickname: str = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "nickname": nickname})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


@app.post("/tasks/reorder")
async def reorder_tasks(data: ReorderRequest, nickname: str = Depends(get_current_user)):
    for index, task_id in enumerate(data.order):
        await db.tasks.update_one(
            {"id": task_id, "nickname": nickname},
            {"$set": {"order": index}},
        )
    return {"message": "Order updated"}


class Subject(BaseModel):
    name: str
    marks: float
    max_marks: float

    @validator('name')
    def name_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Subject name cannot be empty')
        return v

    @validator('marks')
    def marks_valid(cls, v):
        if v < 0:
            raise ValueError('Marks cannot be negative')
        return v

    @validator('max_marks')
    def max_marks_valid(cls, v):
        if v <= 0:
            raise ValueError('Max marks must be greater than 0')
        return v


class GradeSubmission(BaseModel):
    subjects: List[Subject]

    @validator('subjects')
    def subjects_not_empty(cls, v):
        if not v:
            raise ValueError('Add at least one subject')
        if len(v) > 20:
            raise ValueError('Too many subjects in one entry')
        return v


def _match_previous(name: str, previous_subjects: List[dict]) -> Optional[dict]:
    """Find the same subject in a previous entry, matching loosely on name."""
    target = name.strip().lower()
    for p in previous_subjects:
        if p["name"].strip().lower() == target:
            return p
    return None


async def analyze_grades(subjects: List[dict], previous_subjects: Optional[List[dict]] = None) -> str:
    """Send subject/marks breakdown to Eloria (Groq) for warm, non-judgmental feedback.
    If previous_subjects is provided, includes per-subject comparison so Eloria can
    celebrate improvement and be gentle about drops, instead of judging scores in isolation.
    """
    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))

    lines = []
    for s in subjects:
        pct = (s["marks"] / s["max_marks"]) * 100
        prev = _match_previous(s["name"], previous_subjects) if previous_subjects else None
        if prev:
            prev_pct = (prev["marks"] / prev["max_marks"]) * 100
            delta = pct - prev_pct
            direction = "up" if delta > 0.5 else "down" if delta < -0.5 else "about the same as"
            lines.append(
                f"{s['name']}: {s['marks']}/{s['max_marks']} ({pct:.0f}%) — "
                f"{direction} {abs(delta):.0f} points vs last time ({prev['marks']}/{prev['max_marks']})"
            )
        else:
            lines.append(f"{s['name']}: {s['marks']}/{s['max_marks']} ({pct:.0f}%) — first entry for this subject")
    breakdown = "\n".join(lines)

    comparison_note = (
        "Some subjects include a comparison with the user's previous entry for that subject. "
        "Where a subject improved, genuinely celebrate the specific improvement (name the subject "
        "and the change). Where a subject dropped, be gentle and encouraging, not alarmed — frame "
        "it as normal variation, not failure. Where it's a first entry, just comment on the score itself."
        if previous_subjects else ""
    )

    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": f"""You are Eloria, a warm and empathetic companion for college students.
                The user has just shared their grades. Respond with short, thoughtful feedback
                (3-5 sentences). Never shame or lecture about low scores. Notice genuine strengths
                first, be honest but gentle about subjects that need attention, and end with one
                encouraging, practical thought. Never diagnose or moralize. {comparison_note}"""
            },
            {
                "role": "user",
                "content": f"Here are my grades:\n\n{breakdown}"
            }
        ]
    )
    return response.choices[0].message.content


async def extract_grades_from_pdf(file_bytes: bytes) -> List[dict]:
    """Extract raw text from a PDF, then ask Groq to structure it into subject/marks pairs."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not read any text from this PDF")

    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """Extract subject names and marks from a student's marksheet text.
                Reply with ONLY a JSON array, no other text, in this exact format:
                [{"name": "Subject Name", "marks": 85, "max_marks": 100}]
                If max marks aren't stated, assume 100. Skip rows that aren't actual subjects
                (e.g. totals, percentages, headers)."""
            },
            {"role": "user", "content": text[:4000]}
        ]
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Couldn't parse marks from this PDF. Try manual entry instead.")

    if not parsed:
        raise HTTPException(status_code=422, detail="No subjects found in this PDF. Try manual entry instead.")

    return parsed


@app.post("/grades")
async def submit_grades(data: GradeSubmission, nickname: str = Depends(get_current_user)):
    subjects = [s.dict() for s in data.subjects]

    previous = await db.grades.find_one({"nickname": nickname}, sort=[("timestamp", -1)])
    previous_subjects = previous["subjects"] if previous else None

    total_pct = sum((s["marks"] / s["max_marks"]) * 100 for s in subjects) / len(subjects)
    feedback = await analyze_grades(subjects, previous_subjects)

    entry = {
        "id": str(uuid.uuid4()),
        "nickname": nickname,
        "subjects": subjects,
        "average_percent": round(total_pct, 1),
        "feedback": feedback,
        "timestamp": datetime.now().isoformat(),
    }
    await db.grades.insert_one(entry)
    entry.pop("_id", None)
    return entry


@app.post("/grades/upload")
async def upload_grades(file: UploadFile = File(...), nickname: str = Depends(get_current_user)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    file_bytes = await file.read()
    subjects = await extract_grades_from_pdf(file_bytes)

    # validate/clean what the AI extracted
    clean_subjects = []
    for s in subjects:
        try:
            clean_subjects.append({
                "name": str(s["name"]).strip(),
                "marks": float(s["marks"]),
                "max_marks": float(s.get("max_marks", 100)),
            })
        except (KeyError, ValueError, TypeError):
            continue

    if not clean_subjects:
        raise HTTPException(status_code=422, detail="No valid subjects found. Try manual entry instead.")

    previous = await db.grades.find_one({"nickname": nickname}, sort=[("timestamp", -1)])
    previous_subjects = previous["subjects"] if previous else None

    total_pct = sum((s["marks"] / s["max_marks"]) * 100 for s in clean_subjects) / len(clean_subjects)
    feedback = await analyze_grades(clean_subjects, previous_subjects)

    entry = {
        "id": str(uuid.uuid4()),
        "nickname": nickname,
        "subjects": clean_subjects,
        "average_percent": round(total_pct, 1),
        "feedback": feedback,
        "timestamp": datetime.now().isoformat(),
    }
    await db.grades.insert_one(entry)
    entry.pop("_id", None)
    return entry


@app.get("/grades")
async def get_grades(nickname: str = Depends(get_current_user)):
    entries = []
    async for doc in db.grades.find({"nickname": nickname}, {"_id": 0}).sort("timestamp", -1):
        entries.append(doc)
    return entries

class PomodoroCheckIn(BaseModel):
    sessions_completed: int
    just_finished: Literal["focus", "rest"]


@app.post("/focus/checkin")
async def pomodoro_checkin(data: PomodoroCheckIn, nickname: str = Depends(get_current_user)):
    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))

    context = (
        f"The user just finished a {data.just_finished} session on their "
        f"{data.sessions_completed} pomodoro of the day."
    )

    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """You are Eloria, a warm companion for college students doing focused
                study sessions. Give ONE short sentence (max 20 words) of gentle encouragement
                between pomodoro sessions. Vary your phrasing each time. Never generic corporate
                motivation, never repeat the same sentence structure. Just one genuine warm line."""
            },
            {"role": "user", "content": context}
        ],
        max_tokens=40,
    )

    message = response.choices[0].message.content.strip()

    await db.pomodoro_sessions.insert_one({
        "nickname": nickname,
        "type": data.just_finished,
        "session_number": data.sessions_completed,
        "timestamp": datetime.now().isoformat(),
    })

    return {"message": message}

# ============================================================
# ADD TO main.py — Stories endpoint
# Paste after the /focus/checkin route.
# ============================================================

class StoryRequest(BaseModel):
    theme: str
    language: str = "English"

    @validator('theme')
    def theme_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Please choose or describe a theme')
        if len(v) > 100:
            raise ValueError('Theme too long')
        return v


@app.post("/stories")
async def generate_story(data: StoryRequest, nickname: str = Depends(get_current_user)):
    client_ai = Groq(api_key=os.getenv("GROQ_API_KEY"))

    language_instruction = (
        f"Write the entire story in {data.language} language only. "
        f"If Tamil, use Tamil script. If Telugu, use Telugu script. If Malayalam, use Malayalam script. "
        f"If Kannada, use Kannada script. If Hindi, use Hindi script. If English, use English."
    )

    response = client_ai.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": f"""You are Eloria, a warm storyteller for a mental wellness app used by
                Indian college students winding down at night. Write a short, gentle, calming story
                (250-350 words) built around the theme the user gives you. The story should be slow,
                sensory, and soothing — like a bedtime story for an adult. No conflict, no tension,
                no jump scares, no sad endings. It should feel safe to fall asleep to. Do not include
                a title, just the story text. {language_instruction}"""
            },
            {
                "role": "user",
                "content": f"Theme: {data.theme}"
            }
        ]
    )

    story_text = response.choices[0].message.content.strip()

    await db.stories.insert_one({
        "nickname": nickname,
        "theme": data.theme,
        "language": data.language,
        "story": story_text,
        "timestamp": datetime.now().isoformat(),
    })

    return {"story": story_text}


@app.get("/stories")
async def get_stories(nickname: str = Depends(get_current_user)):
    stories = []
    async for doc in db.stories.find({"nickname": nickname}, {"_id": 0}).sort("timestamp", -1).limit(20):
        stories.append(doc)
    return stories
