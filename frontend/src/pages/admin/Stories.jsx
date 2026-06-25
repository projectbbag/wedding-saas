import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useInvitation } from "@/lib/InvitationContext";

export default function Stories() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", icon: "heart" });

  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listStories(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);

  const add = async () => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    if (!form.title) return toast.error("Judul wajib");
    await adminApi.createStory({ invitation_slug: selectedSlug, ...form });
    setForm({ title: "", description: "", date: "", icon: "heart" });
    toast.success("Cerita ditambahkan"); load();
  };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-stories">
      <h2 className="text-2xl font-semibold mb-1">Love Story Timeline</h2>
      <p className="text-gray-500 text-sm mb-1">Cerita perjalanan cinta untuk:</p>
      <p className="text-amber-700 font-medium mb-6">{selected.groom_name} & {selected.bride_name}</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="grid md:grid-cols-2 gap-2">
          <input placeholder="Judul (mis: Pertemuan Pertama)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" data-testid="story-title"/>
          <input placeholder="Tanggal (mis: Des 2021)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"/>
        </div>
        <textarea rows={2} placeholder="Deskripsi cerita..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"/>
        <button onClick={add} className="mt-3 px-4 py-2 bg-gray-900 text-white rounded text-sm flex items-center gap-2" data-testid="add-story"><Plus size={14}/> Tambah</button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-700 mb-1">{s.date}</p>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.description}</p>
            </div>
            <button onClick={() => adminApi.deleteStory(s.id).then(load)} className="p-2 text-red-600 hover:bg-red-50 rounded h-fit" data-testid={`del-story-${s.id}`}><Trash2 size={14}/></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Belum ada cerita untuk undangan ini.</p>}
      </div>
    </div>
  );
}
