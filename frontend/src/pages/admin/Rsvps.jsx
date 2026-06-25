import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useInvitation } from "@/lib/InvitationContext";

export default function Rsvps() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listRsvps(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);

  const filtered = filter === "all" ? items : items.filter((i) => i.attendance === filter);

  const exportCsv = () => {
    const csv = ["Nama,Telepon,Kehadiran,Jumlah,Pesan,Tanggal"].concat(
      filtered.map((r) => `"${r.guest_name}","${r.phone}","${r.attendance}","${r.guest_count}","${(r.message || "").replace(/"/g, "'")}","${r.created_at}"`)
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rsvp-${selectedSlug}.csv`; a.click();
  };

  const remove = async (id) => { await adminApi.deleteRsvp(id); toast.success("Dihapus"); load(); };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-rsvps">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-semibold mb-1">RSVP</h2>
          <p className="text-gray-500 text-sm">Konfirmasi untuk: <span className="text-amber-700 font-medium">{selected.groom_name} & {selected.bride_name}</span></p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm" data-testid="rsvp-filter">
            <option value="all">Semua</option>
            <option value="hadir">Hadir</option>
            <option value="tidak">Tidak Hadir</option>
            <option value="ragu">Ragu</option>
          </select>
          <button onClick={exportCsv} className="px-3 py-2 border border-gray-300 text-sm rounded flex items-center gap-2" data-testid="export-rsvp"><Download size={14}/> Export</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Telepon</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Pesan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{r.guest_name}</td>
                <td className="px-4 py-3 text-xs">{r.phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${r.attendance === "hadir" ? "bg-green-100 text-green-800" : r.attendance === "tidak" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                    {r.attendance}
                  </span>
                </td>
                <td className="px-4 py-3">{r.guest_count}</td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-600">{r.message || "-"}</td>
                <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(r.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-10">Belum ada RSVP untuk undangan ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
