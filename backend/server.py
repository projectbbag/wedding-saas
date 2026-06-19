from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'ringvitation-super-secret-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

app = FastAPI(title="Ringvitation API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ============ Helpers ============
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "email": email, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ============ Models ============
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class InvitationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slug: str
    template: str = "elegant"  # elegant, luxury, modern, minimalist
    hide_photos: bool = False
    hide_gallery: bool = False
    hide_video: bool = False
    groom_name: str
    groom_full_name: str
    groom_father: str
    groom_mother: str
    groom_instagram: Optional[str] = ""
    groom_photo: Optional[str] = ""
    bride_name: str
    bride_full_name: str
    bride_father: str
    bride_mother: str
    bride_instagram: Optional[str] = ""
    bride_photo: Optional[str] = ""
    wedding_date: str  # ISO date string
    akad_date: Optional[str] = ""
    akad_time: Optional[str] = ""
    akad_location: Optional[str] = ""
    akad_address: Optional[str] = ""
    resepsi_date: Optional[str] = ""
    resepsi_time: Optional[str] = ""
    resepsi_location: Optional[str] = ""
    resepsi_address: Optional[str] = ""
    maps_embed: Optional[str] = ""
    maps_link: Optional[str] = ""
    cover_photo: Optional[str] = ""
    music_url: Optional[str] = ""
    video_url: Optional[str] = ""
    quote_text: Optional[str] = ""
    quote_source: Optional[str] = ""
    qris_image: Optional[str] = ""

class Invitation(InvitationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class StoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    title: str
    description: str
    date: str
    icon: Optional[str] = "heart"

class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    image: str
    caption: Optional[str] = ""

class GiftItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    bank_name: str
    account_number: str
    account_holder: str
    logo: Optional[str] = ""

class GuestItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    name: str
    phone: Optional[str] = ""
    category: Optional[str] = "Keluarga"
    checked_in: bool = False

class RsvpInput(BaseModel):
    guest_name: str
    phone: Optional[str] = ""
    attendance: str  # hadir / tidak / ragu
    guest_count: int = 1
    message: Optional[str] = ""

class RsvpItem(RsvpInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    created_at: str = Field(default_factory=now_iso)

class WishInput(BaseModel):
    guest_name: str
    message: str
    attendance: Optional[str] = "hadir"

class WishItem(WishInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invitation_slug: str
    created_at: str = Field(default_factory=now_iso)


# ============ Public endpoints ============
@api_router.get("/")
async def root():
    return {"app": "Ringvitation Premium", "version": "1.0"}

@api_router.get("/invitations/{slug}")
async def get_invitation(slug: str):
    inv = await db.invitations.find_one({"slug": slug}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invitation not found")
    stories = await db.stories.find({"invitation_slug": slug}, {"_id": 0}).to_list(50)
    gallery = await db.gallery.find({"invitation_slug": slug}, {"_id": 0}).to_list(100)
    gifts = await db.gifts.find({"invitation_slug": slug}, {"_id": 0}).to_list(20)
    return {"invitation": inv, "stories": stories, "gallery": gallery, "gifts": gifts}

@api_router.get("/invitations/{slug}/wishes")
async def list_wishes(slug: str, page: int = 1, per_page: int = 10):
    skip = (page - 1) * per_page
    total = await db.wishes.count_documents({"invitation_slug": slug})
    items = await db.wishes.find({"invitation_slug": slug}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
    return {"items": items, "total": total, "page": page, "per_page": per_page}

@api_router.post("/invitations/{slug}/wishes")
async def create_wish(slug: str, payload: WishInput):
    if not await db.invitations.find_one({"slug": slug}):
        raise HTTPException(404, "Invitation not found")
    wish = WishItem(invitation_slug=slug, **payload.model_dump())
    await db.wishes.insert_one(wish.model_dump())
    return wish

@api_router.post("/invitations/{slug}/rsvp")
async def create_rsvp(slug: str, payload: RsvpInput):
    if not await db.invitations.find_one({"slug": slug}):
        raise HTTPException(404, "Invitation not found")
    rsvp = RsvpItem(invitation_slug=slug, **payload.model_dump())
    await db.rsvps.insert_one(rsvp.model_dump())
    return rsvp

@api_router.post("/invitations/{slug}/visit")
async def track_visit(slug: str, request: Request):
    if not await db.invitations.find_one({"slug": slug}):
        raise HTTPException(404, "Invitation not found")
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    await db.visitors.insert_one({
        "id": str(uuid.uuid4()),
        "invitation_slug": slug,
        "ip_address": ip,
        "user_agent": ua,
        "visit_time": now_iso(),
    })
    count = await db.visitors.count_documents({"invitation_slug": slug})
    return {"visitor_count": count}

@api_router.get("/invitations/{slug}/visitors")
async def get_visitors(slug: str):
    count = await db.visitors.count_documents({"invitation_slug": slug})
    return {"count": count}


# ============ Auth endpoints ============
@api_router.post("/auth/register")
async def register(payload: UserCreate):
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": "admin",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@api_router.post("/auth/login")
async def login(payload: LoginInput):
    user = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user.get("role", "admin")}}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user.get("role", "admin")}


# ============ Admin endpoints ============
@api_router.get("/admin/dashboard")
async def admin_dashboard(user=Depends(get_current_user)):
    total_invitations = await db.invitations.count_documents({})
    total_guests = await db.guests.count_documents({})
    total_rsvps = await db.rsvps.count_documents({})
    total_wishes = await db.wishes.count_documents({})
    total_visitors = await db.visitors.count_documents({})
    hadir = await db.rsvps.count_documents({"attendance": "hadir"})
    tidak = await db.rsvps.count_documents({"attendance": "tidak"})
    ragu = await db.rsvps.count_documents({"attendance": "ragu"})
    recent_wishes = await db.wishes.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_rsvps = await db.rsvps.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "stats": {
            "invitations": total_invitations,
            "guests": total_guests,
            "rsvps": total_rsvps,
            "wishes": total_wishes,
            "visitors": total_visitors,
            "hadir": hadir,
            "tidak": tidak,
            "ragu": ragu,
        },
        "recent_wishes": recent_wishes,
        "recent_rsvps": recent_rsvps,
    }

@api_router.get("/admin/invitations")
async def admin_list_invitations(user=Depends(get_current_user)):
    items = await db.invitations.find({}, {"_id": 0}).to_list(500)
    return items

@api_router.post("/admin/invitations")
async def admin_create_invitation(payload: InvitationBase, user=Depends(get_current_user)):
    if await db.invitations.find_one({"slug": payload.slug}):
        raise HTTPException(400, "Slug already exists")
    inv = Invitation(owner_id=user["id"], **payload.model_dump())
    await db.invitations.insert_one(inv.model_dump())
    return inv

@api_router.put("/admin/invitations/{slug}")
async def admin_update_invitation(slug: str, payload: InvitationBase, user=Depends(get_current_user)):
    inv = await db.invitations.find_one({"slug": slug})
    if not inv:
        raise HTTPException(404, "Not found")
    update_data = payload.model_dump()
    await db.invitations.update_one({"slug": slug}, {"$set": update_data})
    updated = await db.invitations.find_one({"slug": payload.slug}, {"_id": 0})
    return updated

@api_router.delete("/admin/invitations/{slug}")
async def admin_delete_invitation(slug: str, user=Depends(get_current_user)):
    await db.invitations.delete_one({"slug": slug})
    await db.stories.delete_many({"invitation_slug": slug})
    await db.gallery.delete_many({"invitation_slug": slug})
    await db.gifts.delete_many({"invitation_slug": slug})
    await db.guests.delete_many({"invitation_slug": slug})
    await db.rsvps.delete_many({"invitation_slug": slug})
    await db.wishes.delete_many({"invitation_slug": slug})
    return {"ok": True}

# Stories
@api_router.get("/admin/stories")
async def admin_list_stories(slug: Optional[str] = None, user=Depends(get_current_user)):
    q = {"invitation_slug": slug} if slug else {}
    return await db.stories.find(q, {"_id": 0}).to_list(200)

@api_router.post("/admin/stories")
async def admin_create_story(payload: StoryItem, user=Depends(get_current_user)):
    await db.stories.insert_one(payload.model_dump())
    return payload

@api_router.delete("/admin/stories/{story_id}")
async def admin_delete_story(story_id: str, user=Depends(get_current_user)):
    await db.stories.delete_one({"id": story_id})
    return {"ok": True}

# Gallery
@api_router.get("/admin/gallery")
async def admin_list_gallery(slug: Optional[str] = None, user=Depends(get_current_user)):
    q = {"invitation_slug": slug} if slug else {}
    return await db.gallery.find(q, {"_id": 0}).to_list(500)

@api_router.post("/admin/gallery")
async def admin_create_gallery(payload: GalleryItem, user=Depends(get_current_user)):
    await db.gallery.insert_one(payload.model_dump())
    return payload

@api_router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery(item_id: str, user=Depends(get_current_user)):
    await db.gallery.delete_one({"id": item_id})
    return {"ok": True}

# Gifts
@api_router.get("/admin/gifts")
async def admin_list_gifts(slug: Optional[str] = None, user=Depends(get_current_user)):
    q = {"invitation_slug": slug} if slug else {}
    return await db.gifts.find(q, {"_id": 0}).to_list(50)

@api_router.post("/admin/gifts")
async def admin_create_gift(payload: GiftItem, user=Depends(get_current_user)):
    await db.gifts.insert_one(payload.model_dump())
    return payload

@api_router.delete("/admin/gifts/{item_id}")
async def admin_delete_gift(item_id: str, user=Depends(get_current_user)):
    await db.gifts.delete_one({"id": item_id})
    return {"ok": True}

# Guests
@api_router.get("/admin/guests")
async def admin_list_guests(slug: Optional[str] = None, user=Depends(get_current_user)):
    q = {"invitation_slug": slug} if slug else {}
    return await db.guests.find(q, {"_id": 0}).to_list(2000)

@api_router.post("/admin/guests")
async def admin_create_guest(payload: GuestItem, user=Depends(get_current_user)):
    await db.guests.insert_one(payload.model_dump())
    return payload

@api_router.post("/admin/guests/bulk")
async def admin_create_guests_bulk(payload: List[GuestItem], user=Depends(get_current_user)):
    if payload:
        await db.guests.insert_many([g.model_dump() for g in payload])
    return {"inserted": len(payload)}

@api_router.put("/admin/guests/{guest_id}")
async def admin_update_guest(guest_id: str, payload: GuestItem, user=Depends(get_current_user)):
    await db.guests.update_one({"id": guest_id}, {"$set": payload.model_dump()})
    return payload

@api_router.delete("/admin/guests/{guest_id}")
async def admin_delete_guest(guest_id: str, user=Depends(get_current_user)):
    await db.guests.delete_one({"id": guest_id})
    return {"ok": True}

@api_router.post("/admin/guests/{guest_id}/checkin")
async def admin_checkin_guest(guest_id: str, user=Depends(get_current_user)):
    await db.guests.update_one({"id": guest_id}, {"$set": {"checked_in": True}})
    return {"ok": True}

# RSVPs admin
@api_router.get("/admin/rsvps")
async def admin_list_rsvps(slug: Optional[str] = None, attendance: Optional[str] = None, user=Depends(get_current_user)):
    q = {}
    if slug:
        q["invitation_slug"] = slug
    if attendance:
        q["attendance"] = attendance
    return await db.rsvps.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api_router.delete("/admin/rsvps/{rsvp_id}")
async def admin_delete_rsvp(rsvp_id: str, user=Depends(get_current_user)):
    await db.rsvps.delete_one({"id": rsvp_id})
    return {"ok": True}

# Wishes admin
@api_router.get("/admin/wishes")
async def admin_list_wishes(slug: Optional[str] = None, user=Depends(get_current_user)):
    q = {"invitation_slug": slug} if slug else {}
    return await db.wishes.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api_router.delete("/admin/wishes/{wish_id}")
async def admin_delete_wish(wish_id: str, user=Depends(get_current_user)):
    await db.wishes.delete_one({"id": wish_id})
    return {"ok": True}


# ============ Seeder ============
@api_router.post("/seed")
async def seed_data():
    """Idempotent seeder to populate default data."""
    # Admin user
    admin_email = "admin@ringvitation.com"
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin Ringvitation",
            "email": admin_email,
            "password": hash_password("admin123"),
            "role": "admin",
            "created_at": now_iso(),
        })
    admin = await db.users.find_one({"email": admin_email})

    # Default invitation
    slug = "ahnaf-nabilla"
    existing = await db.invitations.find_one({"slug": slug})
    inv_data = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "slug": slug,
        "template": "elegant",
        "hide_photos": existing.get("hide_photos", False) if existing else False,
        "hide_gallery": existing.get("hide_gallery", False) if existing else False,
        "hide_video": existing.get("hide_video", False) if existing else False,
        "owner_id": admin["id"],
        "groom_name": "Ahnaf",
        "groom_full_name": "Ahnaf Zainul Muttaqin",
        "groom_father": "Bapak Muhammad Zainul",
        "groom_mother": "Ibu Siti Aminah",
        "groom_instagram": "https://instagram.com/ahnaf",
        "groom_photo": "https://images.unsplash.com/photo-1591954426313-5e47d525428d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGdyb29tJTIwcG9ydHJhaXQlMjBlbGVnYW50JTIwc3VpdHxlbnwwfHx8fDE3ODE4ODkyMDZ8MA&ixlib=rb-4.1.0&q=85",
        "bride_name": "Nabilla",
        "bride_full_name": "Nabilla Devinda Putri",
        "bride_father": "Bapak Devin Saputra",
        "bride_mother": "Ibu Rina Wulandari",
        "bride_instagram": "https://instagram.com/nabilla",
        "bride_photo": "https://images.pexels.com/photos/13632879/pexels-photo-13632879.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "wedding_date": "2026-07-17T08:00:00+07:00",
        "akad_date": "2026-07-17",
        "akad_time": "08:00 - 10:00 WIB",
        "akad_location": "Masjid Ash Shomad Citra Raya",
        "akad_address": "Jl. Citra Raya Boulevard Timur, Ciakar, Kec. Panongan, Kabupaten Tangerang, Banten",
        "resepsi_date": "2026-07-17",
        "resepsi_time": "11:00 - 14:00 WIB",
        "resepsi_location": "Masjid Ash Shomad Citra Raya",
        "resepsi_address": "Jl. Citra Raya Boulevard Timur, Ciakar, Kec. Panongan, Kabupaten Tangerang, Banten",
        "maps_embed": "https://www.google.com/maps?q=Masjid+Ash+Shomad+Citra+Raya+Tangerang&output=embed",
        "maps_link": "https://maps.google.com/?q=Masjid+Ash+Shomad+Citra+Raya+Tangerang",
        "cover_photo": "https://images.pexels.com/photos/32346176/pexels-photo-32346176.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "music_url": "/api/static/music/wedding-default.mp3",
        "video_url": "https://www.youtube.com/embed/d_HlPboLRL8",
        "quote_text": "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
        "quote_source": "QS. Ar-Rum: 21",
        "qris_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/320px-QR_code_for_mobile_English_Wikipedia.svg.png",
        "created_at": existing["created_at"] if existing else now_iso(),
    }
    if existing:
        await db.invitations.update_one({"slug": slug}, {"$set": inv_data})
    else:
        await db.invitations.insert_one(inv_data)

    # Stories
    await db.stories.delete_many({"invitation_slug": slug})
    stories = [
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "title": "Pertemuan Pertama", "description": "Kami pertama kali bertemu di sebuah acara komunitas pada akhir tahun 2021. Sebuah perkenalan singkat yang ternyata menjadi awal segalanya.", "date": "Desember 2021", "icon": "sparkles"},
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "title": "Masa Pendekatan", "description": "Saling mengenal lebih dekat melalui obrolan panjang, mimpi yang dibagi, dan kopi yang tidak pernah dingin.", "date": "2022 - 2023", "icon": "coffee"},
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "title": "Lamaran", "description": "Pada hari yang indah, kami sepakat untuk melangkah ke jenjang yang lebih serius. Disaksikan keluarga tercinta.", "date": "10 Desember 2025", "icon": "ring"},
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "title": "Hari Bahagia", "description": "Hari yang kami nantikan akhirnya tiba. Mengucap janji suci dan memulai babak baru sebagai suami istri.", "date": "17 Juli 2026", "icon": "heart"},
    ]
    await db.stories.insert_many(stories)

    # Gallery
    await db.gallery.delete_many({"invitation_slug": slug})
    gallery_urls = [
        "https://images.pexels.com/photos/35366670/pexels-photo-35366670.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "https://images.unsplash.com/photo-1744459451069-66e8cb7ef4d0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjB3ZWRkaW5nJTIwY2luZW1hdGljJTIwZGV0YWlscyUyMHJvbWFuY2V8ZW58MHx8fHwxNzgxODg5MjA2fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1759887244219-17c3d64a7f01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3ZWRkaW5nJTIwY2luZW1hdGljJTIwZGV0YWlscyUyMHJvbWFuY2V8ZW58MHx8fHwxNzgxODg5MjA2fDA&ixlib=rb-4.1.0&q=85",
        "https://images.pexels.com/photos/17984867/pexels-photo-17984867.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "https://images.pexels.com/photos/37524690/pexels-photo-37524690.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "https://images.unsplash.com/photo-1751428948382-84e8cb91c2bd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjB3ZWRkaW5nJTIwY2luZW1hdGljJTIwZGV0YWlscyUyMHJvbWFuY2V8ZW58MHx8fHwxNzgxODg5MjA2fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1541700513212-79f419c0221d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxpbmRvbmVzaWFuJTIwd2VkZGluZyUyMGNvdXBsZSUyMHRyYWRpdGlvbmFsJTIwZWxlZ2FudHxlbnwwfHx8fDE3ODE4ODkyMDZ8MA&ixlib=rb-4.1.0&q=85",
        "https://images.pexels.com/photos/13632879/pexels-photo-13632879.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ]
    await db.gallery.insert_many([{"id": str(uuid.uuid4()), "invitation_slug": slug, "image": u, "caption": ""} for u in gallery_urls])

    # Gifts
    await db.gifts.delete_many({"invitation_slug": slug})
    await db.gifts.insert_many([
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "bank_name": "BCA", "account_number": "8005123456", "account_holder": "Ahnaf Zainul Muttaqin", "logo": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg"},
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "bank_name": "Bank Mandiri", "account_number": "1370012345678", "account_holder": "Nabilla Devinda Putri", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg"},
    ])

    # Sample guests
    await db.guests.delete_many({"invitation_slug": slug})
    sample_guests = ["Bpk. Rizky", "Ibu Sari", "Saudara Andi", "Keluarga Bapak Hadi", "Sahabat Dewi"]
    await db.guests.insert_many([
        {"id": str(uuid.uuid4()), "invitation_slug": slug, "name": n, "phone": "", "category": "Keluarga", "checked_in": False}
        for n in sample_guests
    ])

    # Sample wishes
    if await db.wishes.count_documents({"invitation_slug": slug}) == 0:
        await db.wishes.insert_many([
            {"id": str(uuid.uuid4()), "invitation_slug": slug, "guest_name": "Keluarga Besar Hadi", "message": "Selamat menempuh hidup baru. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.", "attendance": "hadir", "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "invitation_slug": slug, "guest_name": "Sahabat Dewi", "message": "Akhirnya yaaa! Bahagia selalu untuk kalian berdua. Tidak sabar menanti hari bahagia kalian.", "attendance": "hadir", "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "invitation_slug": slug, "guest_name": "Bapak Hartono", "message": "Barakallahu laka wa baraka 'alaika wa jama'a bainakuma fi khair.", "attendance": "hadir", "created_at": now_iso()},
        ])

    return {"ok": True, "admin_email": admin_email, "admin_password": "admin123", "default_slug": slug}


app.include_router(api_router)

# Serve static music/assets — mounted at /api/static so it passes through Kubernetes ingress
static_dir = ROOT_DIR / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(static_dir)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Auto-seed on startup if no invitations exist
    if await db.invitations.count_documents({}) == 0:
        await seed_data()
        logger.info("Default data seeded.")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
