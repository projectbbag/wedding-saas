import { useEffect, useState, useRef } from "react";
import { adminApi } from "@/lib/api";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit3, ImageIcon, Calendar, Music, Heart, User, Upload } from "lucide-react";
import { useInvitation } from "@/lib/InvitationContext";

const empty = {
  slug: "", template: "elegant", hide_photos: false, hide_gallery: false, hide_video: false,
  groom_name: "", groom_full_name: "", groom_father: "", groom_mother: "", groom_instagram: "", groom_photo: "",
  bride_name: "", bride_full_name: "", bride_father: "", bride_mother: "", bride_instagram: "", bride_photo: "",
  wedding_date: "2026-07-17T08:00:00+07:00",
  akad_date: "", akad_time: "", akad_location: "", akad_address: "",
  resepsi_date: "", resepsi_time: "", resepsi_location: "", resepsi_address: "",
  maps_embed: "", maps_link: "", cover_photo: "", music_url: "", video_url: "",
  quote_text: "", quote_source: "", qris_image: ""
};

function Field({ label, k, type = "text", textarea, editing, setEditing, placeholder, hint }) {
  return (
    <div>
      <label className="text-xs text-gray-600 mb-1 block font-medium">{label}</label>
      {textarea ? (
        <textarea rows={2} value={editing[k] || ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
          placeholder={placeholder} data-testid={`inv-${k}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"/>
      ) : (
        <input type={type} value={editing[k] || ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
          placeholder={placeholder} data-testid={`inv-${k}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"/>
      )}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ToggleField({ label, k, hint, editing, setEditing }) {
  const v = !!editing[k];
  return (
    <button type="button" onClick={() => setEditing({ ...editing, [k]: !v })} data-testid={`inv-${k}`}
      className={`w-full text-left flex items-center justify-between gap-3 p-4 border rounded-lg transition ${v ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
      <div>
        <p className="font-medium text-sm">{label}</p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <span className={`relative w-11 h-6 rounded-full transition ${v ? "bg-amber-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${v ? "right-0.5" : "left-0.5"}`}/>
      </span>
    </button>
  );
}

const TABS = [
  { id: "basic", label: "Dasar", icon: Heart },
  { id: "groom", label: "Mempelai Pria", icon: User },
  { id: "bride", label: "Mempelai Wanita", icon: User },
  { id: "events", label: "Acara", icon: Calendar },
  { id: "media", label: "Media", icon: ImageIcon },
];

export default function Invitations() {
  const { reload: reloadCtx, setSelectedSlug } = useInvitation();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("basic");
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const musicFileRef = useRef(null);
  const coverFileRef = useRef(null);
  const groomFileRef = useRef(null);
  const brideFileRef = useRef(null);
  const qrisFileRef = useRef(null);

  const load = () => adminApi.listInvitations().then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openEdit = (it) => {
    setEditing({ ...empty, ...it, _originalSlug: it.slug });
    setTab("basic");
    setShowForm(true);
  };
  const openNew = () => {
    setEditing({ ...empty, _isNew: true });
    setTab("basic");
    setShowForm(true);
  };

  const save = async () => {
    try {
      const payload = { ...editing };
      delete payload._isNew; delete payload._originalSlug; delete payload.id; delete payload.owner_id; delete payload.created_at;
      if (editing._isNew) {
        await adminApi.createInvitation(payload);
        toast.success("Undangan dibuat");
        setSelectedSlug(payload.slug);
      } else {
        await adminApi.updateInvitation(editing._originalSlug || editing.slug, payload);
        toast.success("Undangan diperbarui");
      }
      setShowForm(false); setEditing(null); load(); reloadCtx();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal menyimpan");
    }
  };

  const remove = async (slug) => {
    if (!window.confirm("Hapus undangan ini? Semua data terkait (tamu, RSVP, ucapan, galeri, stories, gifts) akan ikut terhapus.")) return;
    await adminApi.deleteInvitation(slug);
    toast.success("Dihapus"); load(); reloadCtx();
  };

  const uploadMusic = async (file) => {
    setUploadingMusic(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/admin/upload/music", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditing({ ...editing, music_url: r.data.url });
      toast.success(`Musik diupload (${(r.data.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal upload musik");
    } finally { setUploadingMusic(false); }
  };

  const uploadImage = async (file, key) => {
    if (key === "cover_photo") setUploadingCover(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/admin/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditing({ ...editing, [key]: r.data.url });
      toast.success(`Gambar diupload`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal upload gambar");
    } finally { if (key === "cover_photo") setUploadingCover(false); }
  };

  // Quick toggle for hide_photos directly from row
  const quickTogglePhotos = async (it) => {
    const payload = { ...it, hide_photos: !it.hide_photos };
    delete payload.id; delete payload.owner_id; delete payload.created_at;
    await adminApi.updateInvitation(it.slug, payload);
    toast.success(payload.hide_photos ? "Foto mempelai disembunyikan" : "Foto mempelai ditampilkan");
    load(); reloadCtx();
  };

  return (
    <div data-testid="admin-invitations">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Undangan</h2>
          <p className="text-gray-500 text-sm">Kelola semua undangan pernikahan. Edit cepat lewat tab.</p>
        </div>
        <button onClick={openNew} data-testid="add-invitation"
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
              <th className="px-4 py-3">Tanpa Foto</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.slug} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">/{it.slug}</td>
                <td className="px-4 py-3">{it.groom_name} & {it.bride_name}</td>
                <td className="px-4 py-3 text-xs">{new Date(it.wedding_date).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs capitalize">{it.template}</span></td>
                <td className="px-4 py-3">
                  <button onClick={() => quickTogglePhotos(it)} data-testid={`toggle-photos-${it.slug}`}
                    className={`relative w-10 h-5 rounded-full transition ${it.hide_photos ? "bg-amber-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${it.hide_photos ? "right-0.5" : "left-0.5"}`}/>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <a href={`/${it.slug}?untuk=Demo`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded" data-testid={`invitation-view-${it.slug}`}><ExternalLink size={14}/></a>
                    <button onClick={() => openEdit(it)} className="p-2 hover:bg-gray-100 rounded" data-testid={`invitation-edit-${it.slug}`}><Edit3 size={14}/></button>
                    <button onClick={() => remove(it.slug)} className="p-2 hover:bg-red-50 text-red-600 rounded" data-testid={`invitation-delete-${it.slug}`}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Belum ada undangan.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden" data-testid="invitation-form">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{editing._isNew ? "Tambah" : "Edit"} Undangan</h3>
                <p className="text-xs text-gray-500">Edit cepat per bagian — gunakan tab untuk navigasi.</p>
              </div>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-800 text-xl px-2" data-testid="close-form">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-gray-50">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
                  className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${tab === t.id ? "border-amber-500 text-amber-700 bg-white" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                  <t.icon size={14}/> {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {tab === "basic" && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field editing={editing} setEditing={setEditing} label="Slug URL" k="slug" placeholder="ahnaf-nabilla" hint="Akan jadi: /slug-anda"/>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block font-medium">Template Visual</label>
                      <select value={editing.template} onChange={(e) => setEditing({ ...editing, template: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="inv-template">
                        <option value="elegant">Elegant — Cream & Gold</option>
                        <option value="luxury">Luxury — Black & Gold</option>
                        <option value="modern">Modern — Clean Editorial</option>
                        <option value="minimalist">Minimalist — White Pure</option>
                      </select>
                    </div>
                  </div>
                  <ToggleField editing={editing} setEditing={setEditing} k="hide_photos"
                    label="Sembunyikan Foto Mempelai (Pria & Wanita)"
                    hint="Hanya foto profil mempelai di section 'Mempelai Berbahagia' yang disembunyikan & diganti monogram. Cover dan Galeri tidak terpengaruh."/>
                  <ToggleField editing={editing} setEditing={setEditing} k="hide_gallery"
                    label="Sembunyikan Galeri Foto"
                    hint="Sembunyikan seluruh section galeri foto dari undangan publik."/>
                  <ToggleField editing={editing} setEditing={setEditing} k="hide_video"
                    label="Sembunyikan Video Prewedding"
                    hint="Sembunyikan section video prewedding dari undangan publik."/>
                  <Field editing={editing} setEditing={setEditing} label="Tanggal Pernikahan (ISO)" k="wedding_date" placeholder="2026-07-17T08:00:00+07:00"/>
                  <Field editing={editing} setEditing={setEditing} label="Quote / Ayat" k="quote_text" textarea placeholder="Ayat / kutipan favorit..."/>
                  <Field editing={editing} setEditing={setEditing} label="Sumber Quote" k="quote_source" placeholder="QS. Ar-Rum: 21"/>
                </>
              )}

              {tab === "groom" && (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field editing={editing} setEditing={setEditing} label="Panggilan" k="groom_name" placeholder="Ahnaf"/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Lengkap" k="groom_full_name" placeholder="Ahnaf Zainul Muttaqin"/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Ayah" k="groom_father" placeholder="Bapak ..."/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Ibu" k="groom_mother" placeholder="Ibu ..."/>
                    <Field editing={editing} setEditing={setEditing} label="Instagram URL" k="groom_instagram" placeholder="https://instagram.com/..."/>
                  </div>
                  <div>
                    <Field editing={editing} setEditing={setEditing} label="Foto URL" k="groom_photo" placeholder="https://..." hint="Otomatis diabaikan jika 'Sembunyikan Foto Mempelai' aktif"/>
                    <input ref={groomFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "groom_photo")} data-testid="upload-groom-input"/>
                    <button type="button" onClick={() => groomFileRef.current?.click()} className="mt-2 px-3 py-2 border border-amber-500 text-amber-700 rounded text-xs flex items-center gap-2 hover:bg-amber-50" data-testid="upload-groom-btn">
                      <Upload size={12}/> Upload Foto Mempelai Pria
                    </button>
                    {editing.groom_photo && <img src={editing.groom_photo.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${editing.groom_photo}` : editing.groom_photo} alt="" className="mt-3 w-24 h-32 object-cover rounded border border-gray-200"/>}
                  </div>
                </div>
              )}

              {tab === "bride" && (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field editing={editing} setEditing={setEditing} label="Panggilan" k="bride_name" placeholder="Nabilla"/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Lengkap" k="bride_full_name" placeholder="Nabilla Devinda Putri"/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Ayah" k="bride_father" placeholder="Bapak ..."/>
                    <Field editing={editing} setEditing={setEditing} label="Nama Ibu" k="bride_mother" placeholder="Ibu ..."/>
                    <Field editing={editing} setEditing={setEditing} label="Instagram URL" k="bride_instagram" placeholder="https://instagram.com/..."/>
                  </div>
                  <div>
                    <Field editing={editing} setEditing={setEditing} label="Foto URL" k="bride_photo" placeholder="https://..." hint="Otomatis diabaikan jika 'Sembunyikan Foto Mempelai' aktif"/>
                    <input ref={brideFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "bride_photo")} data-testid="upload-bride-input"/>
                    <button type="button" onClick={() => brideFileRef.current?.click()} className="mt-2 px-3 py-2 border border-amber-500 text-amber-700 rounded text-xs flex items-center gap-2 hover:bg-amber-50" data-testid="upload-bride-btn">
                      <Upload size={12}/> Upload Foto Mempelai Wanita
                    </button>
                    {editing.bride_photo && <img src={editing.bride_photo.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${editing.bride_photo}` : editing.bride_photo} alt="" className="mt-3 w-24 h-32 object-cover rounded border border-gray-200"/>}
                  </div>
                </div>
              )}

              {tab === "events" && (
                <>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Akad Nikah</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field editing={editing} setEditing={setEditing} label="Tanggal Akad" k="akad_date" placeholder="2026-07-17"/>
                    <Field editing={editing} setEditing={setEditing} label="Waktu Akad" k="akad_time" placeholder="08:00 - 10:00 WIB"/>
                    <Field editing={editing} setEditing={setEditing} label="Lokasi Akad" k="akad_location"/>
                  </div>
                  <Field editing={editing} setEditing={setEditing} label="Alamat Akad" k="akad_address" textarea/>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mt-6">Resepsi</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field editing={editing} setEditing={setEditing} label="Tanggal Resepsi" k="resepsi_date"/>
                    <Field editing={editing} setEditing={setEditing} label="Waktu Resepsi" k="resepsi_time"/>
                    <Field editing={editing} setEditing={setEditing} label="Lokasi Resepsi" k="resepsi_location"/>
                  </div>
                  <Field editing={editing} setEditing={setEditing} label="Alamat Resepsi" k="resepsi_address" textarea/>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mt-6">Lokasi (Maps)</p>
                  <Field editing={editing} setEditing={setEditing} label="Maps Embed URL" k="maps_embed" placeholder="https://www.google.com/maps?q=...&output=embed"/>
                  <Field editing={editing} setEditing={setEditing} label="Maps Link (Buka di Maps)" k="maps_link"/>
                </>
              )}

              {tab === "media" && (
                <div className="space-y-5">
                  <div>
                    <Field editing={editing} setEditing={setEditing} label="Cover Photo URL" k="cover_photo" placeholder="https://..." hint="Foto utama pada cover screen. Selalu dipakai (tidak terpengaruh opsi 'sembunyikan foto mempelai'). Kosongkan untuk pakai monogram inisial."/>
                    <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover_photo")} data-testid="upload-cover-input"/>
                    <button type="button" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover} className="mt-2 px-3 py-2 border border-amber-500 text-amber-700 rounded text-xs flex items-center gap-2 hover:bg-amber-50" data-testid="upload-cover-btn">
                      <Upload size={12}/> {uploadingCover ? "Mengupload..." : "Upload Cover Photo"}
                    </button>
                    {editing.cover_photo && <img src={editing.cover_photo.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${editing.cover_photo}` : editing.cover_photo} alt="" className="mt-3 w-48 h-28 object-cover rounded border border-gray-200"/>}
                  </div>

                  <div>
                    <Field editing={editing} setEditing={setEditing} label="Background Music URL" k="music_url" placeholder="https://...mp3 atau /api/static/music/..."/>
                    <input ref={musicFileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMusic(e.target.files[0])} data-testid="upload-music-input"/>
                    <button type="button" onClick={() => musicFileRef.current?.click()} disabled={uploadingMusic} className="mt-2 px-3 py-2 border border-amber-500 text-amber-700 rounded text-xs flex items-center gap-2 hover:bg-amber-50" data-testid="upload-music-btn">
                      <Upload size={12}/> {uploadingMusic ? "Mengupload musik..." : "Upload File Musik (MP3, max 20MB)"}
                    </button>
                    {editing.music_url && (
                      <audio controls className="mt-3 w-full max-w-md h-9" src={editing.music_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${editing.music_url}` : editing.music_url}/>
                    )}
                  </div>

                  <Field editing={editing} setEditing={setEditing} label="Video Prewedding (YouTube embed)" k="video_url" placeholder="https://www.youtube.com/embed/VIDEO_ID"/>

                  <div>
                    <Field editing={editing} setEditing={setEditing} label="QRIS Image URL" k="qris_image" placeholder="https://..."/>
                    <input ref={qrisFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "qris_image")} data-testid="upload-qris-input"/>
                    <button type="button" onClick={() => qrisFileRef.current?.click()} className="mt-2 px-3 py-2 border border-amber-500 text-amber-700 rounded text-xs flex items-center gap-2 hover:bg-amber-50" data-testid="upload-qris-btn">
                      <Upload size={12}/> Upload QRIS Image
                    </button>
                    {editing.qris_image && <img src={editing.qris_image.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${editing.qris_image}` : editing.qris_image} alt="" className="mt-3 w-32 h-32 object-contain rounded border border-gray-200 bg-white"/>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <p className="text-xs text-gray-500">Tab aktif: <strong className="text-gray-700 capitalize">{tab}</strong></p>
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white">Batal</button>
                <button onClick={save} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium" data-testid="save-invitation">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
