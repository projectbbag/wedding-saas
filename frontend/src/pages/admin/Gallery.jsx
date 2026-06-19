import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ invitation_slug: "ahnaf-nabilla", image: "", caption: "" });

  const load = () => adminApi.listGallery().then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.image) return toast.error("URL gambar wajib");
    await adminApi.createGallery(form);
    setForm({ ...form, image: "", caption: "" });
    toast.success("Ditambahkan"); load();
  };

  const remove = async (id) => { await adminApi.deleteGallery(id); load(); };

  return (
    <div data-testid="admin-gallery">
      <h2 className="text-2xl font-semibold mb-1">Galeri Foto</h2>
      <p className="text-gray-500 text-sm mb-6">Kelola foto prewedding & gallery.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">Tambah Foto</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input placeholder="URL Gambar" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm md:col-span-2" data-testid="gallery-url"/>
          <input placeholder="Caption (opsional)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"/>
        </div>
        <button onClick={add} className="mt-3 px-4 py-2 bg-gray-900 text-white rounded text-sm flex items-center gap-2" data-testid="add-gallery"><Plus size={14}/> Tambah</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((g) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden relative group">
            <img src={g.image} alt="" className="w-full h-40 object-cover"/>
            <button onClick={() => remove(g.id)} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100" data-testid={`del-gallery-${g.id}`}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
