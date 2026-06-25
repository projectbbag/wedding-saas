import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Send, Download } from "lucide-react";
import { useInvitation } from "@/lib/InvitationContext";

export default function Guests() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", category: "Keluarga" });
  const [bulkText, setBulkText] = useState("");

  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listGuests(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);

  const add = async () => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    if (!form.name) return toast.error("Nama wajib");
    await adminApi.createGuest({ invitation_slug: selectedSlug, ...form });
    setForm({ name: "", phone: "", category: "Keluarga" });
    toast.success("Tamu ditambahkan"); load();
  };

  const bulkAdd = async () => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const data = lines.map((n) => ({ invitation_slug: selectedSlug, name: n, phone: "", category: "Keluarga", checked_in: false }));
    await adminApi.bulkGuests(data);
    setBulkText("");
    toast.success(`${lines.length} tamu ditambahkan`); load();
  };

  const remove = async (id) => { await adminApi.deleteGuest(id); load(); };

  const sendWA = (g) => {
    const url = `${window.location.origin}/${g.invitation_slug}?untuk=${encodeURIComponent(g.name)}`;
    const text = `Assalamu'alaikum ${g.name},\n\nDengan penuh sukacita, kami mengundang Anda untuk menghadiri pernikahan kami.\n\nSilakan buka undangan digital berikut: ${url}\n\nKami menanti kehadiran dan doa restu Anda. Terima kasih.`;
    const wa = g.phone ? `https://wa.me/${g.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  };

  const exportCsv = () => {
    const csv = ["Nama,Telepon,Kategori,Link"].concat(items.map((g) => `"${g.name}","${g.phone}","${g.category}","${window.location.origin}/${g.invitation_slug}?untuk=${encodeURIComponent(g.name)}"`)).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tamu-${selectedSlug}.csv`; a.click();
  };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-guests">
      <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Tamu</h2>
          <p className="text-gray-500 text-sm">Daftar tamu untuk: <span className="text-amber-700 font-medium">{selected.groom_name} & {selected.bride_name}</span></p>
        </div>
        <button onClick={exportCsv} className="px-3 py-2 border border-gray-300 text-sm rounded flex items-center gap-2" data-testid="export-guests">
          <Download size={14}/> Export CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Tambah Tamu</h3>
          <div className="space-y-2">
            <input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" data-testid="guest-name"/>
            <input placeholder="No. WhatsApp (62...)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" data-testid="guest-phone"/>
            <input placeholder="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm"/>
            <button onClick={add} className="px-4 py-2 bg-gray-900 text-white rounded text-sm flex items-center gap-2" data-testid="add-guest"><Plus size={14}/> Tambah</button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Tambah Massal (1 nama per baris)</h3>
          <textarea rows={5} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Bpk. Ahmad&#10;Ibu Siti&#10;Sahabat Andi" className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono" data-testid="bulk-guests"/>
          <button onClick={bulkAdd} className="mt-2 px-4 py-2 bg-amber-500 text-white rounded text-sm" data-testid="bulk-add-guests">Import Massal</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Telepon</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">QR</th><th className="px-4 py-3 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {items.map((g) => {
              const link = `${window.location.origin}/${g.invitation_slug}?untuk=${encodeURIComponent(g.name)}`;
              const qr = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(link)}`;
              return (
                <tr key={g.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{g.name}</td>
                  <td className="px-4 py-3 text-xs">{g.phone || "-"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{g.category}</span></td>
                  <td className="px-4 py-3"><img src={qr} alt="" className="w-10 h-10"/></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => sendWA(g)} className="p-2 hover:bg-green-50 text-green-600 rounded" data-testid={`wa-${g.id}`} title="Kirim WhatsApp"><Send size={14}/></button>
                      <button onClick={() => remove(g.id)} className="p-2 hover:bg-red-50 text-red-600 rounded" data-testid={`del-guest-${g.id}`}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10">Belum ada tamu untuk undangan ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
