import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

const templates = [
  { id: "elegant", name: "Elegant", desc: "Cream • Gold • Klasik mewah", bg: "linear-gradient(135deg,#fdfbf7,#e6d599)", text: "#2C2A25" },
  { id: "luxury", name: "Luxury", desc: "Black • Gold • Eksklusif", bg: "linear-gradient(135deg,#0a0a0a,#C5A059)", text: "#F5F5F5" },
  { id: "modern", name: "Modern", desc: "Clean • Editorial", bg: "linear-gradient(135deg,#f9fafb,#9CA3AF)", text: "#111827" },
  { id: "minimalist", name: "Minimalist", desc: "White • Typography", bg: "linear-gradient(135deg,#ffffff,#e5e5e5)", text: "#000000" },
];

export default function Templates() {
  const [invitations, setInvitations] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("ahnaf-nabilla");
  const current = invitations.find((i) => i.slug === selectedSlug);

  const load = () => adminApi.listInvitations().then((r) => setInvitations(r.data));
  useEffect(() => { load(); }, []);

  const setTemplate = async (templateId) => {
    if (!current) return;
    await adminApi.updateInvitation(current.slug, { ...current, template: templateId });
    toast.success(`Template ${templateId} aktif`);
    load();
  };

  return (
    <div data-testid="admin-templates">
      <h2 className="text-2xl font-semibold mb-1">Template</h2>
      <p className="text-gray-500 text-sm mb-6">Pilih template visual untuk undangan Anda.</p>

      <div className="mb-5">
        <label className="text-xs text-gray-600 mb-1 block">Undangan</label>
        <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm">
          {invitations.map((i) => <option key={i.slug} value={i.slug}>{`/${i.slug} — ${i.groom_name} & ${i.bride_name}`}</option>)}
        </select>
        {current && <p className="text-xs text-gray-500 mt-2">Template aktif: <strong>{current.template}</strong></p>}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((t) => {
          const active = current?.template === t.id;
          return (
            <div key={t.id} className={`rounded-xl border-2 overflow-hidden transition ${active ? "border-amber-500" : "border-gray-200"}`} data-testid={`tpl-${t.id}`}>
              <div className="aspect-[3/4] flex flex-col justify-end p-4" style={{ background: t.bg, color: t.text }}>
                <p className="text-xs uppercase tracking-[0.3em] mb-1">Template</p>
                <h3 style={{ fontFamily: t.id === "modern" ? "Outfit" : t.id === "minimalist" ? "Marcellus" : t.id === "luxury" ? "Cormorant Garamond" : "Italiana" }} className="text-2xl mb-1">{t.name}</h3>
                <p className="text-xs opacity-80">{t.desc}</p>
              </div>
              <div className="p-3 bg-white flex gap-2">
                <button onClick={() => setTemplate(t.id)} className={`flex-1 px-3 py-2 rounded text-xs ${active ? "bg-amber-500 text-white" : "border border-gray-300"}`} data-testid={`use-${t.id}`}>{active ? "Aktif" : "Gunakan"}</button>
                {current && <Link to={`/${current.slug}?untuk=Preview&template=${t.id}`} target="_blank" className="px-3 py-2 border border-gray-300 rounded text-xs">Preview</Link>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
