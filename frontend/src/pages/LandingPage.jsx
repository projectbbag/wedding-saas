import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Heart, LayoutDashboard, Mail } from "lucide-react";

const templates = [
  { id: "elegant", name: "Elegant", desc: "Cream • Gold • Klasik mewah", color: "from-amber-100 to-amber-300", text: "text-amber-900" },
  { id: "luxury", name: "Luxury", desc: "Black • Gold • Eksklusif", color: "from-neutral-900 to-neutral-700", text: "text-amber-400" },
  { id: "modern", name: "Modern", desc: "Editorial • Contemporary", color: "from-gray-100 to-gray-300", text: "text-gray-900" },
  { id: "minimalist", name: "Minimalist", desc: "White • Tipografi murni", color: "from-white to-gray-100", text: "text-black" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e0d0b] text-white overflow-hidden relative">
      {/* Decorative grain */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2" data-testid="brand-logo">
          <div className="w-9 h-9 rounded-full border border-amber-400/60 flex items-center justify-center anim-ring">
            <Heart size={16} className="text-amber-400" />
          </div>
          <span style={{ fontFamily: "Italiana, serif" }} className="text-2xl tracking-wide">BbagProject</span>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/login" data-testid="nav-admin-login" className="px-5 py-2 text-xs uppercase tracking-[0.2em] border border-white/20 rounded-full hover:bg-white/5 transition">Admin</Link>
          <Link to="/ahnaf-nabilla?untuk=Bpk.%20Rizky" data-testid="nav-demo" className="px-5 py-2 text-xs uppercase tracking-[0.2em] bg-gradient-to-br from-amber-400 to-amber-700 text-black rounded-full">Lihat Demo</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-10 md:pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-7xl mx-auto">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="text-amber-400 uppercase tracking-[0.4em] text-xs mb-6 flex items-center gap-2"><Sparkles size={14}/> Undangan Pernikahan Digital Premium</p>
              <h1 style={{ fontFamily: "Italiana, serif" }} className="text-5xl md:text-7xl leading-[1.05] mb-8">
                Bagikan momen<br/> sakralmu dengan<br/>
                <span className="text-amber-400 italic">keanggunan</span>.
              </h1>
              <p className="text-white/70 text-lg max-w-md mb-10 leading-relaxed">
                Empat template eksklusif. Cover dengan nama tamu otomatis. RSVP, ucapan, hingga QR check-in — semua dalam satu tautan elegan.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/ahnaf-nabilla?untuk=Tamu%20Undangan" data-testid="hero-demo-btn" className="px-8 py-4 bg-amber-400 text-black uppercase tracking-[0.2em] text-xs font-medium rounded-full hover:bg-amber-300 transition">
                  Buka Demo Undangan
                </Link>
                <Link to="/admin/login" data-testid="hero-admin-btn" className="px-8 py-4 border border-white/30 uppercase tracking-[0.2em] text-xs font-medium rounded-full hover:bg-white/5 transition flex items-center gap-2">
                  <LayoutDashboard size={14}/> Masuk Dashboard
                </Link>
              </div>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-amber-400/20 shadow-2xl">
              <img src="https://images.pexels.com/photos/32346176/pexels-photo-32346176.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=700" alt="" className="w-full h-full object-cover"/>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#141414] border border-amber-400/30 px-6 py-4 rounded-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Save The Date</p>
              <p style={{ fontFamily: "Italiana, serif" }} className="text-2xl">17 • 07 • 2026</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Templates */}
      <section className="relative z-10 px-6 md:px-12 pb-32 max-w-7xl mx-auto">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-3">Pilihan Tema</p>
            <h2 style={{ fontFamily: "Italiana, serif" }} className="text-4xl md:text-5xl">Empat karakter, satu kesan: <span className="italic">istimewa</span>.</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((t) => (
            <Link key={t.id} to={`/ahnaf-nabilla?untuk=Tamu%20Undangan&template=${t.id}`} data-testid={`template-card-${t.id}`} className="group relative">
              <div className={`aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br ${t.color} relative border border-white/10`}>
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <p className={`text-xs uppercase tracking-[0.3em] mb-2 ${t.text}`}>Template</p>
                  <h3 style={{ fontFamily: t.id === "modern" ? "Outfit" : t.id === "minimalist" ? "Marcellus" : "Italiana" }} className={`text-3xl mb-1 ${t.text}`}>{t.name}</h3>
                  <p className={`text-xs ${t.text} opacity-80`}>{t.desc}</p>
                </div>
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Mail size={14} className="text-white"/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-white/40 text-xs uppercase tracking-[0.3em]">
        Made with <Heart size={10} className="inline text-amber-400 mx-1"/> BbagProject • 2026
      </footer>
    </div>
  );
}
