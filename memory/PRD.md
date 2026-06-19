# Ringvitation Premium — Product Requirements (PRD)

## Original Problem Statement
Build a Premium Digital Wedding Invitation Web App (Ringvitation-equivalent) using React + FastAPI + MongoDB (native Emergent stack). Must support 4 design templates (Elegant / Luxury / Modern / Minimalist), dynamic guest name from URL, full admin panel, RSVP, wishes wall, gallery, gift QRIS/transfer, visitor counter, WhatsApp invitation generator, and analytics dashboard.

Default seeded couple:
- **Groom**: Ahnaf Zainul Muttaqin
- **Bride**: Nabilla Devinda Putri
- **Date**: Jumat, 17 Juli 2026
- **Venue**: Masjid Ash Shomad Citra Raya — Jl. Citra Raya Boulevard Timur, Ciakar, Kec. Panongan, Kabupaten Tangerang, Banten
- **URL**: `/ahnaf-nabilla?untuk=Bpk.%20Rizky`

## Architecture
- **Backend**: FastAPI + Motor (MongoDB async) — JWT-protected admin endpoints, auto-seeding on startup.
- **Frontend**: React 19 + React Router 7 + Framer Motion + Tailwind + Recharts + Sonner (toasts).
- **4 Templates**: Implemented via `theme-{elegant|luxury|modern|minimalist}` CSS class swapping CSS variables for color palette, typography (Italiana / Cormorant Garamond / Outfit / Marcellus) and ornaments.

## Core Requirements (Static)
1. Public invitation with: Cover (guest name from `?untuk=`), Hero+Countdown, Quote, Couple, Events (Akad/Resepsi), Maps, Love Story Timeline, Gallery (masonry+lightbox), Video, RSVP, Wishes wall (AJAX, paginated), Gift cards (copy bank acct), QRIS download, Protocol, Footer, Floating Music + WhatsApp Share, Visitor counter.
2. Admin panel: Login, Dashboard with stats+charts, CRUD for Invitations, Guests (incl. bulk import + CSV export + WA send), RSVPs (filter + CSV), Wishes (moderation), Gallery, Stories, Gifts, Templates (per-invitation switcher).
3. Template override via `?template=` URL query.

## Implemented (2026-01-19)
- ✅ Full backend (Auth: register/login/me, public invitation fetch, RSVP, wishes paginated, visit counter; Admin dashboard + full CRUD for invitations/stories/gallery/gifts/guests; RSVP & wishes moderation; auto-seed on startup).
- ✅ 4 visual templates with distinct color/typography/ornament systems.
- ✅ Landing page with template gallery.
- ✅ Public Invitation page (all 14 sections + floating music & WA share + lightbox).
- ✅ Admin Login + Layout (sidebar nav, logout, mobile drawer).
- ✅ Admin Dashboard with stat cards + BarChart + PieChart + recent activity feed.
- ✅ Admin CRUD: Invitations (modal form), Guests (single + bulk + WA generator + CSV export + per-guest QR), RSVPs (filter + CSV export), Wishes (moderation), Gallery, Stories, Gifts, Templates (preview & set active).
- ✅ Test credentials: `admin@ringvitation.com / admin123` (auto-seeded).
- ✅ Backend test: 22/22 passing. Frontend tested manually + by testing agent.
- ✅ Fixes applied after iteration 1: clipboard try/catch, edit/delete/view data-testid on invitation rows, fixed `<option>` text content.

## Backlog / Future
- **P1**: PWA installable manifest + offline-cache, Open Graph dynamic per invitation, full SEO meta-tag injection, Excel (XLSX) import/export (currently CSV only), live QR scanner for check-in.
- **P2**: Multi-user account isolation (currently any admin sees all invitations), role-based access, custom subdomain support, in-page music player styling polish.
- **P3**: AI-generated love story drafts, photo upload via S3, payment gateway for gift money, theme builder.

## Test Credentials
See `/app/memory/test_credentials.md`.
