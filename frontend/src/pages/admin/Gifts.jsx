import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useInvitation } from "@/lib/InvitationContext";

export default function Gifts() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ bank_name: "", account_number: "", account_holder: "", logo: "" });

  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listGifts(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);

  const add = async () => {
    if (!selectedSlug) return toast.error("Pilih undangan terlebih dahulu");
    if (!form.bank_name || !form.account_number) return toast.error("Lengkapi data");
    await adminApi.createGift({ invitation_slug: selectedSlug, ...form });
    setForm({ bank_name: "", account_number: "", account_holder: "", logo: "" });
    toast.success("Rekening ditambahkan"); load();
  };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-gifts">
      <h2 className="text-2xl font-semibold mb-1">Wedding Gift</h2>
      <p className="text-gray-500 text-sm mb-1">Rekening transfer untuk:</p>
      <p className="text-amber-700 font-medium mb-6">{selected.groom_name} & {selected.bride_name}</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="grid md:grid-cols-2 gap-2">
          <input placeholder="Nama Bank (mis: BCA)" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" data-testid="gift-bank"/>
          <input placeholder="Nomor Rekening" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" data-testid="gift-account"/>
          <input placeholder="Nama Pemilik" value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"/>
          <input placeholder="Logo URL (opsional)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"/>
        </div>
        <button onClick={add} className="mt-3 px-4 py-2 bg-gray-900 text-white rounded text-sm flex items-center gap-2" data-testid="add-gift"><Plus size={14}/> Tambah</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {items.map((g) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-start">
            <div>
              <p className="font-semibold">{g.bank_name}</p>
              <p className="text-lg font-mono">{g.account_number}</p>
              <p className="text-xs text-gray-500">a.n. {g.account_holder}</p>
            </div>
            <button onClick={() => adminApi.deleteGift(g.id).then(load)} className="p-2 text-red-600 hover:bg-red-50 rounded" data-testid={`del-gift-${g.id}`}><Trash2 size={14}/></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8 col-span-full">Belum ada rekening untuk undangan ini.</p>}
      </div>
    </div>
  );
}
