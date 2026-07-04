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

load_dotenv()

app = FastAPI()
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    message = errors[0]['msg'] if errors else 'Invalid input'
    return JSONResponse(status_code=422, content={"detail": message})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
        model="llama-3.3-70b-versatile",
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
        model="llama-3.3-70b-versatile",
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