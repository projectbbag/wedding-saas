import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit3 } from "lucide-react";

const empty = {
  slug: "", template: "elegant",
  groom_name: "", groom_full_name: "", groom_father: "", groom_mother: "", groom_instagram: "", groom_photo: "",
  bride_name: "", bride_full_name: "", bride_father: "", bride_mother: "", bride_instagram: "", bride_photo: "",
  wedding_date: "2026-07-17T08:00:00+07:00",
  akad_date: "", akad_time: "", akad_location: "", akad_address: "",
  resepsi_date: "", resepsi_time: "", resepsi_location: "", resepsi_address: "",
  maps_embed: "", maps_link: "", cover_photo: "", music_url: "", video_url: "",
  quote_text: "", quote_source: "", qris_image: ""
};

function Field({ label, k, type = "text", textarea, editing, setEditing }) {
  return (
    <div>
      <label className="text-xs text-gray-600 mb-1 block">{label}</label>
      {textarea ? (
        <textarea rows={2} value={editing[k] || ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
          data-testid={`inv-${k}`} className="w-full px-3 py-2 border border-gray-300 rounded text-sm"/>
      ) : (
        <input type={type} value={editing[k] || ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
          data-testid={`inv-${k}`} className="w-full px-3 py-2 border border-gray-300 rounded text-sm"/>
      )}
    </div>
  );
}

export default function Invitations() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => adminApi.listInvitations().then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing._isNew) {
        await adminApi.createInvitation(editing);
        toast.success("Undangan dibuat");
      } else {
        await adminApi.updateInvitation(editing._originalSlug || editing.slug, editing);
        toast.success("Undangan diperbarui");
      }
      setShowForm(false); setEditing(null); load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal menyimpan");
    }
  };

  const remove = async (slug) => {
    if (!window.confirm("Hapus undangan ini? Semua data terkait akan dihapus.")) return;
    await adminApi.deleteInvitation(slug);
    toast.success("Dihapus"); load();
  };

  const F = (props) => <Field editing={editing} setEditing={setEditing} {...props} editing={editing} setEditing={setEditing} />;

  return (
    <div data-testid="admin-invitations">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Undangan</h2>
          <p className="text-gray-500 text-sm">Kelola semua undangan pernikahan.</p>
        </div>
        <button onClick={() => { setEditing({ ...empty, _isNew: true }); setShowForm(true); }} data-testid="add-invitation"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-gray-800">
          <Plus size={14}/> Tambah Undangan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Mempelai</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.slug} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs">/{it.slug}</td>
                <td className="px-4 py-3">{it.groom_name} & {it.bride_name}</td>
                <td className="px-4 py-3 text-xs">{new Date(it.wedding_date).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">{it.template}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <a href={`/${it.slug}?untuk=Demo`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded" data-testid={`view-${it.slug}`}><ExternalLink size={14}/></a>
                    <button onClick={() => { setEditing({ ...it, _originalSlug: it.slug }); setShowForm(true); }} className="p-2 hover:bg-gray-100 rounded" data-testid={`edit-${it.slug}`}><Edit3 size={14}/></button>
                    <button onClick={() => remove(it.slug)} className="p-2 hover:bg-red-50 text-red-600 rounded" data-testid={`delete-${it.slug}`}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Belum ada undangan.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" data-testid="invitation-form">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-semibold">{editing._isNew ? "Tambah" : "Edit"} Undangan</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field editing={editing} setEditing={setEditing} label="Slug URL" k="slug"/>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Template</label>
                  <select value={editing.template} onChange={(e) => setEditing({ ...editing, template: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" data-testid="inv-template">
                    <option value="elegant">Elegant</option>
                    <option value="luxury">Luxury</option>
                    <option value="modern">Modern</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-4">Mempelai Pria</p>
              <div className="grid md:grid-cols-2 gap-3">
                <Field editing={editing} setEditing={setEditing} label="Panggilan" k="groom_name"/>
                <Field editing={editing} setEditing={setEditing} label="Nama Lengkap" k="groom_full_name"/>
                <Field editing={editing} setEditing={setEditing} label="Ayah" k="groom_father"/>
                <Field editing={editing} setEditing={setEditing} label="Ibu" k="groom_mother"/>
                <Field editing={editing} setEditing={setEditing} label="Instagram URL" k="groom_instagram"/>
                <Field editing={editing} setEditing={setEditing} label="Foto URL" k="groom_photo"/>
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-4">Mempelai Wanita</p>
              <div className="grid md:grid-cols-2 gap-3">
                <Field editing={editing} setEditing={setEditing} label="Panggilan" k="bride_name"/>
                <Field editing={editing} setEditing={setEditing} label="Nama Lengkap" k="bride_full_name"/>
                <Field editing={editing} setEditing={setEditing} label="Ayah" k="bride_father"/>
                <Field editing={editing} setEditing={setEditing} label="Ibu" k="bride_mother"/>
                <Field editing={editing} setEditing={setEditing} label="Instagram URL" k="bride_instagram"/>
                <Field editing={editing} setEditing={setEditing} label="Foto URL" k="bride_photo"/>
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-4">Acara</p>
              <Field editing={editing} setEditing={setEditing} label="Wedding Date (ISO)" k="wedding_date"/>
              <div className="grid md:grid-cols-2 gap-3">
                <Field editing={editing} setEditing={setEditing} label="Akad Waktu" k="akad_time"/>
                <Field editing={editing} setEditing={setEditing} label="Resepsi Waktu" k="resepsi_time"/>
                <Field editing={editing} setEditing={setEditing} label="Akad Lokasi" k="akad_location"/>
                <Field editing={editing} setEditing={setEditing} label="Resepsi Lokasi" k="resepsi_location"/>
              </div>
              <Field editing={editing} setEditing={setEditing} label="Akad Alamat" k="akad_address" textarea/>
              <Field editing={editing} setEditing={setEditing} label="Resepsi Alamat" k="resepsi_address" textarea/>
              <p className="text-xs font-semibold text-gray-700 mt-4">Media & Lainnya</p>
              <Field editing={editing} setEditing={setEditing} label="Cover Photo URL" k="cover_photo"/>
              <Field editing={editing} setEditing={setEditing} label="Music URL" k="music_url"/>
              <Field editing={editing} setEditing={setEditing} label="Video URL (YouTube embed)" k="video_url"/>
              <Field editing={editing} setEditing={setEditing} label="Maps Embed URL" k="maps_embed"/>
              <Field editing={editing} setEditing={setEditing} label="Maps Link" k="maps_link"/>
              <Field editing={editing} setEditing={setEditing} label="QRIS Image URL" k="qris_image"/>
              <Field editing={editing} setEditing={setEditing} label="Quote Text" k="quote_text" textarea/>
              <Field editing={editing} setEditing={setEditing} label="Quote Source" k="quote_source"/>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-gray-300 rounded">Batal</button>
              <button onClick={save} className="px-4 py-2 bg-gray-900 text-white rounded" data-testid="save-invitation">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
