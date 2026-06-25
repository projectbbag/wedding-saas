import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useInvitation } from "@/lib/InvitationContext";

export default function Wishes() {
  const { selectedSlug, selected } = useInvitation();
  const [items, setItems] = useState([]);
  const load = () => {
    if (!selectedSlug) { setItems([]); return; }
    adminApi.listWishes(selectedSlug).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedSlug]);
  const remove = async (id) => { await adminApi.deleteWish(id); toast.success("Dihapus"); load(); };

  if (!selected) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-sm">Pilih undangan terlebih dahulu dari selector di header.</div>;
  }

  return (
    <div data-testid="admin-wishes">
      <h2 className="text-2xl font-semibold mb-1">Ucapan & Doa</h2>
      <p className="text-gray-500 text-sm mb-6">Moderasi ucapan untuk: <span className="text-amber-700 font-medium">{selected.groom_name} & {selected.bride_name}</span></p>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((w) => (
          <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-semibold">{w.guest_name?.[0]}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{w.guest_name}</p>
                <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleString("id-ID")}</p>
              </div>
              <button onClick={() => remove(w.id)} className="p-2 hover:bg-red-50 text-red-600 rounded" data-testid={`del-wish-${w.id}`}><Trash2 size={14}/></button>
            </div>
            <p className="text-sm text-gray-700">{w.message}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm col-span-2 text-center py-10">Belum ada ucapan untuk undangan ini.</p>}
      </div>
    </div>
  );
}
