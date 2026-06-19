import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Mail, Users, Calendar, MessageSquare,
  Image, BookOpen, Gift, Palette, LogOut, Heart, Menu, X
} from "lucide-react";
import { auth } from "@/lib/api";

const nav = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/invitations", icon: Mail, label: "Undangan" },
  { to: "/admin/guests", icon: Users, label: "Tamu" },
  { to: "/admin/rsvps", icon: Calendar, label: "RSVP" },
  { to: "/admin/wishes", icon: MessageSquare, label: "Ucapan" },
  { to: "/admin/gallery", icon: Image, label: "Galeri" },
  { to: "/admin/stories", icon: BookOpen, label: "Love Story" },
  { to: "/admin/gifts", icon: Gift, label: "Gift" },
  { to: "/admin/templates", icon: Palette, label: "Template" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ringv_token");
    if (!token) { navigate("/admin/login"); return; }
    auth.me().then((r) => setUser(r.data)).catch(() => { navigate("/admin/login"); });
  }, [navigate]);

  const logout = () => { auth.logout(); navigate("/admin/login"); };

  return (
    <div className="admin flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 z-40 w-64 bg-white border-r border-gray-200 h-screen flex-shrink-0 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="admin-brand">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Heart size={14} className="text-white"/>
            </div>
            <span style={{ fontFamily: "Italiana, serif" }} className="text-xl">Ringvitation</span>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-1"><X size={20}/></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <n.icon size={16}/>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          {user && (
            <div className="px-3 py-2 text-xs">
              <p className="text-gray-500">Masuk sebagai</p>
              <p className="font-semibold truncate" data-testid="admin-user-email">{user.email}</p>
            </div>
          )}
          <button onClick={logout} data-testid="admin-logout" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut size={16}/> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)}/>}

      {/* Content */}
      <main className="flex-1 md:ml-0 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="md:hidden p-1"><Menu size={20}/></button>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <Link to="/ahnaf-nabilla?untuk=Tamu" target="_blank" className="text-xs text-gray-600 hover:text-gray-900" data-testid="view-public">Lihat Undangan →</Link>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
