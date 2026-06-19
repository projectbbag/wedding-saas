import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Mail, Users, Calendar, MessageSquare, Eye, TrendingUp, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { adminApi.dashboard().then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-gray-500">Memuat...</div>;
  const s = data.stats;
  const cards = [
    { label: "Total Undangan", value: s.invitations, icon: Mail, color: "bg-amber-100 text-amber-800" },
    { label: "Total Tamu", value: s.guests, icon: Users, color: "bg-blue-100 text-blue-800" },
    { label: "Total RSVP", value: s.rsvps, icon: Calendar, color: "bg-green-100 text-green-800" },
    { label: "Total Ucapan", value: s.wishes, icon: MessageSquare, color: "bg-purple-100 text-purple-800" },
    { label: "Pengunjung", value: s.visitors, icon: Eye, color: "bg-pink-100 text-pink-800" },
  ];
  const rsvpData = [
    { name: "Hadir", value: s.hadir, fill: "#10b981" },
    { name: "Tidak Hadir", value: s.tidak, fill: "#ef4444" },
    { name: "Ragu", value: s.ragu, fill: "#f59e0b" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h2 className="text-2xl font-semibold mb-1">Dashboard</h2>
      <p className="text-gray-500 text-sm mb-6">Ringkasan statistik undangan Anda.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={18}/>
            </div>
            <p className="text-2xl font-bold" data-testid={`stat-${c.label}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16}/> Statistik RSVP</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rsvpData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
              <YAxis tick={{ fontSize: 12 }}/>
              <Tooltip/>
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {rsvpData.map((d, i) => <Cell key={i} fill={d.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Proporsi Kehadiran</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={rsvpData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                {rsvpData.map((d, i) => <Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Ucapan Terbaru</h3>
          <div className="space-y-3">
            {data.recent_wishes.length === 0 && <p className="text-sm text-gray-500">Belum ada ucapan.</p>}
            {data.recent_wishes.map((w) => (
              <div key={w.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xs font-semibold">{w.guest_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{w.guest_name}</p>
                  <p className="text-xs text-gray-600 truncate">{w.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">RSVP Terbaru</h3>
          <div className="space-y-3">
            {data.recent_rsvps.length === 0 && <p className="text-sm text-gray-500">Belum ada RSVP.</p>}
            {data.recent_rsvps.map((r) => {
              const Icon = r.attendance === "hadir" ? CheckCircle2 : r.attendance === "tidak" ? XCircle : HelpCircle;
              const color = r.attendance === "hadir" ? "text-green-600" : r.attendance === "tidak" ? "text-red-600" : "text-amber-600";
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon size={16} className={color}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.guest_name}</p>
                    <p className="text-xs text-gray-500">{r.guest_count} tamu • {r.attendance}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
