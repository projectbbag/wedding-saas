# Ringvitation Premium — Product Requirements (PRD)

## Original Problem Statement
Build a Premium Digital Wedding Invitation Web App (Ringvitation-equivalent) using React + FastAPI + MongoDB. Must support 4 design templates (Elegant / Luxury / Modern / Minimalist), dynamic guest name from URL, full admin panel, RSVP, wishes wall, gallery, gift QRIS/transfer, visitor counter, WhatsApp invitation generator, and analytics dashboard.

Default seeded couple:
- **Groom**: Ahnaf Zainul Muttaqin
- **Bride**: Nabilla Devinda Putri
- **Date**: Jumat, 17 Juli 2026
- **Venue**: Masjid Ash Shomad Citra Raya — Jl. Citra Raya Boulevard Timur, Ciakar, Kec. Panongan, Kabupaten Tangerang, Banten
- **URL**: `/ahnaf-nabilla?untuk=Bpk.%20Rizky`

## Architecture
- **Backend**: FastAPI + Motor (MongoDB async). JWT-protected admin endpoints. Auto-seeding on startup. Static music files served from `/api/static/music/`.
- **Frontend**: React 19 + React Router 7 + Framer Motion + Tailwind + Recharts + Sonner.
- **4 Templates**: Implemented via `theme-{elegant|luxury|modern|minimalist}` CSS class swapping CSS variables for color palette, typography, ornaments.

## Implemented (as of 2026-01-19)
- ✅ Full backend: auth (register/login/me), public invitation fetch, RSVP, paginated wishes, visit counter; admin dashboard + full CRUD for invitations/stories/gallery/gifts/guests + RSVP & wishes moderation; auto-seed on startup; **static music file hosting at `/api/static/music/wedding-default.mp3` (FastAPI StaticFiles)**.
- ✅ 4 visual templates with distinct color/typography/ornament systems.
- ✅ Landing page with template gallery.
- ✅ Public Invitation page (all sections + floating music & WA share + lightbox + countdown).
- ✅ Admin Login + Layout (sidebar nav, logout, mobile drawer).
- ✅ Admin Dashboard with stat cards + BarChart + PieChart + recent activity feed.
- ✅ Admin CRUD: Invitations (tabbed modal: Dasar/Pria/Wanita/Acara/Media), Guests (single + bulk + WA generator + CSV export + per-guest QR), RSVPs (filter + CSV), Wishes (moderation), Gallery, Stories, Gifts, Templates.

### Iteration 2 — Photoless mode (2026-01-19)
- ✅ Added `hide_photos` field — public renders elegant monogram initials instead of photos (Cover, Hero, Couple).
- ✅ Admin row-level quick toggle + Dasar-tab toggle.
- ✅ Edit modal refactored to 5 tabs for easier editing.
- ✅ Module-scoped `Field` component to avoid input focus loss regression.

### Iteration 3 — Hide Gallery/Video + Music Fix (2026-01-19)
- ✅ Added `hide_gallery` and `hide_video` boolean fields.
- ✅ Public InvitationPage conditionally renders GallerySection & VideoSection.
- ✅ Admin Dasar tab now has 3 toggles (Tanpa Foto / Sembunyikan Galeri / Sembunyikan Video).
- ✅ **Music fix**: Pixabay URL returned 403; replaced with backend-hosted static MP3 at `/api/static/music/wedding-default.mp3` (7.4 MB sample track). Verified audio plays in browser (`paused:false`, `currentTime>0`, `readyState:4`, no error). Toggle button pauses/resumes correctly.
- ✅ Music URL resolution: relative URLs (starting with `/`) are prefixed with `REACT_APP_BACKEND_URL` automatically.

## Test Credentials
- Admin: `admin@ringvitation.com` / `admin123`
- See `/app/memory/test_credentials.md`.

## Backlog
- **P1**: PWA installable manifest + offline-cache, Open Graph dynamic per invitation, full SEO meta-tag injection, Excel (XLSX) import/export.
- **P2**: Multi-user account isolation (currently any admin sees all invitations), role-based access, music file upload from admin (currently URL only).
- **P3**: Live QR scanner for check-in, theme builder, gift money via payment gateway.
