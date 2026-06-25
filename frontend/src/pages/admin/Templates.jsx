import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { useInvitation } from "@/lib/InvitationContext";

const templates = [
  { id: "elegant", name: "Elegant", desc: "Cream • Gold • Klasik mewah", bg: "linear-gradient(135deg,#fdfbf7,#e6d599)", text: "#2C2A25" },
  { id: "luxury", name: "Luxury", desc: "Black • Gold • Eksklusif", bg: "linear-gradient(135deg,#0a0a0a,#C5A059)", text: "#F5F5F5" },
  { id: "modern", name: "Modern", desc: "Clean • Editorial", bg: "linear-gradient(135deg,#f9fafb,#9CA3AF)", text: "#111827" },
  { id: "minimalist", name: "Minimalist", desc: "White • Typography", bg: "linear-gradient(135deg,#ffffff,#e5e5e5)", text: "#000000" },
];

export default function Templates() {
  const { selected, reload } = useInvitation();

  const setTemplate = async (templateId) => {
    if (!selected) return;
    const payload = { ...selected, template: templateId };
    delete payload.id; delete payload.owner_id; delete payload.created_at;
    await adminApi.updateInvitation(selected.slug, payload);
    toast.success(`Template ${templateId} diaktifkan`);
    reload();
  };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-templates">
      <h2 className="text-2xl font-semibold mb-1">Template</h2>
      <p className="text-gray-500 text-sm mb-1">Pilih tampilan visual untuk:</p>
      <p className="text-amber-700 font-medium mb-2">{selected.groom_name} & {selected.bride_name}</p>
      <p className="text-xs text-gray-500 mb-6">Template aktif: <strong className="capitalize">{selected.template}</strong></p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((t) => {
          const active = selected.template === t.id;
          return (
            <div key={t.id} className={`rounded-xl border-2 overflow-hidden transition ${active ? "border-amber-500 ring-2 ring-amber-200" : "border-gray-200"}`} data-testid={`tpl-${t.id}`}>
              <div className="aspect-[3/4] flex flex-col justify-end p-4" style={{ background: t.bg, color: t.text }}>
                <p className="text-xs uppercase tracking-[0.3em] mb-1">Template</p>
                <h3 style={{ fontFamily: t.id === "modern" ? "Outfit" : t.id === "minimalist" ? "Marcellus" : t.id === "luxury" ? "Cormorant Garamond" : "Italiana" }} className="text-2xl mb-1">{t.name}</h3>
                <p className="text-xs opacity-80">{t.desc}</p>
              </div>
              <div className="p-3 bg-white flex gap-2">
                <button onClick={() => setTemplate(t.id)} className={`flex-1 px-3 py-2 rounded text-xs ${active ? "bg-amber-500 text-white" : "border border-gray-300"}`} data-testid={`use-${t.id}`}>{active ? "Aktif" : "Gunakan"}</button>
                <Link to={`/${selected.slug}?untuk=Preview&template=${t.id}`} target="_blank" className="px-3 py-2 border border-gray-300 rounded text-xs">Preview</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
