"""Backend API tests for Ringvitation Premium app."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://undangan-premium-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
SLUG = "ahnaf-nabilla"

ADMIN_EMAIL = "admin@ringvitation.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Public ----------
class TestPublic:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "app" in r.json()

    def test_get_invitation(self, session):
        r = session.get(f"{API}/invitations/{SLUG}")
        assert r.status_code == 200
        data = r.json()
        assert "invitation" in data and "stories" in data and "gallery" in data and "gifts" in data
        assert data["invitation"]["slug"] == SLUG
        assert data["invitation"]["groom_full_name"] == "Ahnaf Zainul Muttaqin"
        assert data["invitation"]["bride_full_name"] == "Nabilla Devinda Putri"
        assert len(data["stories"]) >= 1
        assert len(data["gallery"]) >= 1
        assert len(data["gifts"]) >= 1

    def test_get_invitation_404(self, session):
        r = session.get(f"{API}/invitations/does-not-exist-xyz")
        assert r.status_code == 404

    def test_create_rsvp_and_persist(self, session):
        payload = {"guest_name": "TEST_RSVP_User", "phone": "08123", "attendance": "hadir", "guest_count": 2, "message": "selamat"}
        r = session.post(f"{API}/invitations/{SLUG}/rsvp", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["guest_name"] == "TEST_RSVP_User"
        assert data["invitation_slug"] == SLUG
        assert "id" in data

    def test_create_wish_and_list(self, session):
        payload = {"guest_name": "TEST_Wish_User", "message": "Barakallah!", "attendance": "hadir"}
        r = session.post(f"{API}/invitations/{SLUG}/wishes", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["guest_name"] == "TEST_Wish_User"

        r2 = session.get(f"{API}/invitations/{SLUG}/wishes?page=1&per_page=20")
        assert r2.status_code == 200
        body = r2.json()
        assert "items" in body and "total" in body
        names = [w["guest_name"] for w in body["items"]]
        assert "TEST_Wish_User" in names

    def test_visit_counter(self, session):
        r = session.post(f"{API}/invitations/{SLUG}/visit")
        assert r.status_code == 200
        assert "visitor_count" in r.json()
        assert isinstance(r.json()["visitor_count"], int)

    def test_rsvp_invalid_slug(self, session):
        r = session.post(f"{API}/invitations/nope-xyz/rsvp", json={"guest_name": "x", "attendance": "hadir"})
        assert r.status_code == 404


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        j = r.json()
        assert "token" in j and "user" in j
        assert j["user"]["email"] == ADMIN_EMAIL

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_admin_without_token(self, session):
        r = session.get(f"{API}/admin/dashboard")
        assert r.status_code == 401

    def test_admin_invalid_token(self, session):
        r = session.get(f"{API}/admin/dashboard", headers={"Authorization": "Bearer bogus.bogus.bogus"})
        assert r.status_code == 401


# ---------- Admin Dashboard ----------
class TestDashboard:
    def test_dashboard_returns_stats(self, session, auth_headers):
        r = session.get(f"{API}/admin/dashboard", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "stats" in data
        for key in ["invitations", "guests", "rsvps", "wishes", "visitors", "hadir", "tidak", "ragu"]:
            assert key in data["stats"]
            assert isinstance(data["stats"][key], int)
        assert isinstance(data["recent_wishes"], list)
        assert isinstance(data["recent_rsvps"], list)


# ---------- Admin CRUD ----------
class TestAdminCRUD:
    def test_list_invitations(self, session, auth_headers):
        r = session.get(f"{API}/admin/invitations", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert any(i["slug"] == SLUG for i in r.json())

    def test_guest_create_delete(self, session, auth_headers):
        guest = {"invitation_slug": SLUG, "name": "TEST_Guest_X", "phone": "0811", "category": "Teman", "checked_in": False}
        r = session.post(f"{API}/admin/guests", json=guest, headers=auth_headers)
        assert r.status_code == 200
        gid = r.json()["id"]

        r2 = session.get(f"{API}/admin/guests?slug={SLUG}", headers=auth_headers)
        assert r2.status_code == 200
        assert any(g["id"] == gid for g in r2.json())

        r3 = session.delete(f"{API}/admin/guests/{gid}", headers=auth_headers)
        assert r3.status_code == 200

    def test_guest_bulk(self, session, auth_headers):
        bulk = [
            {"invitation_slug": SLUG, "name": "TEST_Bulk_1"},
            {"invitation_slug": SLUG, "name": "TEST_Bulk_2"},
        ]
        r = session.post(f"{API}/admin/guests/bulk", json=bulk, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["inserted"] == 2

    def test_story_create_delete(self, session, auth_headers):
        story = {"invitation_slug": SLUG, "title": "TEST_Story", "description": "x", "date": "2026", "icon": "heart"}
        r = session.post(f"{API}/admin/stories", json=story, headers=auth_headers)
        assert r.status_code == 200
        sid = r.json()["id"]
        r2 = session.delete(f"{API}/admin/stories/{sid}", headers=auth_headers)
        assert r2.status_code == 200

    def test_gallery_create_delete(self, session, auth_headers):
        item = {"invitation_slug": SLUG, "image": "https://example.com/x.jpg", "caption": "TEST"}
        r = session.post(f"{API}/admin/gallery", json=item, headers=auth_headers)
        assert r.status_code == 200
        iid = r.json()["id"]
        r2 = session.delete(f"{API}/admin/gallery/{iid}", headers=auth_headers)
        assert r2.status_code == 200

    def test_gift_create_delete(self, session, auth_headers):
        gift = {"invitation_slug": SLUG, "bank_name": "TEST_Bank", "account_number": "00", "account_holder": "TEST", "logo": ""}
        r = session.post(f"{API}/admin/gifts", json=gift, headers=auth_headers)
        assert r.status_code == 200
        iid = r.json()["id"]
        r2 = session.delete(f"{API}/admin/gifts/{iid}", headers=auth_headers)
        assert r2.status_code == 200

    def test_rsvps_admin(self, session, auth_headers):
        r = session.get(f"{API}/admin/rsvps", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_wishes_admin(self, session, auth_headers):
        r = session.get(f"{API}/admin/wishes", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_invitation_update(self, session, auth_headers):
        # Get current
        r = session.get(f"{API}/admin/invitations", headers=auth_headers)
        inv = next(i for i in r.json() if i["slug"] == SLUG)
        original_quote = inv.get("quote_source", "")
        # Update
        inv["quote_source"] = "QS. Ar-Rum: 21"
        r2 = session.put(f"{API}/admin/invitations/{SLUG}", json=inv, headers=auth_headers)
        assert r2.status_code == 200, r2.text
        assert r2.json()["quote_source"] == "QS. Ar-Rum: 21"
