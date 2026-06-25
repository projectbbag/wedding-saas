import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";

const InvitationContext = createContext(null);

const STORAGE_KEY = "ringv_selected_slug";

export function InvitationProvider({ children }) {
  const [invitations, setInvitations] = useState([]);
  const [selectedSlug, setSelectedSlugState] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [loading, setLoading] = useState(true);

  const setSelectedSlug = useCallback((slug) => {
    setSelectedSlugState(slug);
    if (slug) localStorage.setItem(STORAGE_KEY, slug);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listInvitations();
      setInvitations(res.data);
      // Auto-select first invitation if none selected or selected one no longer exists
      const exists = res.data.find((i) => i.slug === selectedSlug);
      if (!exists && res.data.length > 0) {
        setSelectedSlug(res.data[0].slug);
      } else if (res.data.length === 0) {
        setSelectedSlug("");
      }
    } finally { setLoading(false); }
  }, [selectedSlug, setSelectedSlug]);

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const selected = invitations.find((i) => i.slug === selectedSlug) || null;

  return (
    <InvitationContext.Provider value={{ invitations, selectedSlug, setSelectedSlug, selected, reload, loading }}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitation() {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation must be used inside InvitationProvider");
  return ctx;
}
