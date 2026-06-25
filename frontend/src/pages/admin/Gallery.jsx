import { useEffect, useState, useRef } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { useInvitation } from "@/lib/InvitationContext";
import api from "@/lib/api";

export default function Gallery() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ image: "", caption: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listGallery(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);

  const add = async () => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    if (!form.image) return toast.error("URL gambar wajib");
    await adminApi.createGallery({ invitation_slug: selectedSlug, ...form });
    setForm({ image: "", caption: "" });
    toast.success("Foto ditambahkan"); load();
  };

  const uploadFile = async (file) => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/admin/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await adminApi.createGallery({ invitation_slug: selectedSlug, image: r.data.url, caption: "" });
      toast.success("Foto berhasil diupload");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal upload");
    } finally { setUploading(false); }
  };

  const remove = async (id) => { await adminApi.deleteGallery(id); load(); };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-gallery">
      <h2 className="text-2xl font-semibold mb-1">Galeri Foto</h2>
      <p className="text-gray-500 text-sm mb-1">Foto prewedding untuk:</p>
      <p className="text-amber-700 font-medium mb-6">{selected.groom_name} & {selected.bride_name}</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">Tambah Foto</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input placeholder="URL Gambar" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm md:col-span-2" data-testid="gallery-url"/>
          <input placeholder="Caption (opsional)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"/>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button onClick={add} className="px-4 py-2 bg-gray-900 text-white rounded text-sm flex items-center gap-2" data-testid="add-gallery"><Plus size={14}/> Tambah dari URL</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} data-testid="gallery-upload-input"/>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 border border-amber-500 text-amber-700 rounded text-sm flex items-center gap-2 hover:bg-amber-50" data-testid="gallery-upload-btn">
            <Upload size={14}/> {uploading ? "Mengupload..." : "Upload Foto"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((g) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden relative group">
            <img src={g.image.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${g.image}` : g.image} alt="" className="w-full h-40 object-cover"/>
            <button onClick={() => remove(g.id)} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100" data-testid={`del-gallery-${g.id}`}><Trash2 size={14}/></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8 col-span-full">Belum ada foto untuk undangan ini.</p>}
      </div>
    </div>
  );
}
