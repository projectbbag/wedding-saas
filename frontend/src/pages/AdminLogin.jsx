import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { auth } from "@/lib/api";
import { Heart, LogIn } from "lucide-react";

export default function AdminLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "admin@ringvitation.com", password: "admin123" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.login(form.email, form.password);
      localStorage.setItem("ringv_token", res.data.token);
      localStorage.setItem("ringv_user", JSON.stringify(res.data.user));
      toast.success("Login berhasil");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login gagal");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0e0d0b] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="relative w-full max-w-md bg-[#161513] border border-amber-400/20 rounded-2xl p-8 md:p-10">
        <Link to="/" className="flex items-center gap-2 mb-8" data-testid="login-brand">
          <div className="w-10 h-10 rounded-full border border-amber-400/60 flex items-center justify-center">
            <Heart size={16} className="text-amber-400"/>
          </div>
          <span style={{ fontFamily: "Italiana, serif" }} className="text-2xl text-white">Ringvitation</span>
        </Link>
        <p className="text-amber-400 uppercase tracking-[0.3em] text-xs mb-2">Admin Panel</p>
        <h1 className="text-white text-3xl mb-1" style={{ fontFamily: "Italiana, serif" }}>Selamat Datang</h1>
        <p className="text-white/50 text-sm mb-8">Masuk untuk mengelola undangan Anda.</p>

        <form onSubmit={submit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2 block">Email</label>
            <input data-testid="login-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email" required className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-amber-400 outline-none"/>
          </div>
          <div>
            <label className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2 block">Password</label>
            <input data-testid="login-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password" required className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-amber-400 outline-none"/>
          </div>
          <button type="submit" disabled={loading} data-testid="login-submit"
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-medium uppercase tracking-[0.3em] text-xs rounded-lg hover:scale-[1.01] transition flex items-center justify-center gap-2">
            <LogIn size={14}/> {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/5">
          <p className="text-white/40 text-xs">Default credentials:</p>
          <p className="text-white/70 text-xs mt-1">admin@ringvitation.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
