import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Heart, MapPin, Calendar, Clock, Instagram, MessageCircle,
  Send, Copy, Download, Share2, Volume2, VolumeX, X, Sparkles, BookHeart,
  Coffee, ChevronDown, Mail, Users
} from "lucide-react";
import { publicApi } from "@/lib/api";

const iconMap = { sparkles: Sparkles, coffee: Coffee, ring: Heart, heart: Heart };

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

export default function InvitationPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get("untuk") || "Tamu Undangan";
  const templateOverride = searchParams.get("template");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [wishes, setWishes] = useState([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    publicApi.getInvitation(slug)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Undangan tidak ditemukan"))
      .finally(() => setLoading(false));
    publicApi.listWishes(slug, 1).then((r) => setWishes(r.data.items)).catch(() => {});
  }, [slug]);

  // Countdown
  useEffect(() => {
    if (!data?.invitation?.wedding_date) return;
    const target = new Date(data.invitation.wedding_date).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  const handleOpen = () => {
    setOpened(true);
    publicApi.trackVisit(slug).then((r) => setVisitorCount(r.data.visitor_count)).catch(() => {});
    if (audioRef.current) {
      audioRef.current.volume = 0.45;
      audioRef.current.play()
        .then(() => setMusicOn(true))
        .catch((err) => { console.warn("Autoplay blocked or audio error:", err); setMusicOn(false); });
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) {
      audioRef.current.pause();
      setMusicOn(false);
    } else {
      audioRef.current.play()
        .then(() => setMusicOn(true))
        .catch((err) => { console.warn("Music play failed:", err); toast.error("Tidak dapat memutar musik. Coba klik tombol musik sekali lagi."); });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
      <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] text-stone-700">
      <p>Undangan tidak ditemukan.</p>
    </div>;
  }

  const inv = data.invitation;
  const template = templateOverride || inv.template || "elegant";
  const themeClass = `theme-${template}`;
  // Resolve music URL — support both absolute and backend-relative paths like /api/static/...
  const musicSrc = inv.music_url
    ? (inv.music_url.startsWith("http") ? inv.music_url : `${process.env.REACT_APP_BACKEND_URL}${inv.music_url}`)
    : "";

  return (
    <div className={themeClass} style={{ minHeight: "100vh" }}>
      <audio ref={audioRef} src={musicSrc} loop preload="auto" crossOrigin="anonymous" data-testid="bg-audio"/>

      <AnimatePresence>
        {!opened && <CoverScreen inv={inv} guestName={guestName} onOpen={handleOpen} template={template} />}
      </AnimatePresence>

      {opened && (
        <main data-testid="invitation-content">
          <HeroBanner inv={inv} guestName={guestName} countdown={countdown} template={template} />
          <QuoteSection inv={inv} />
          <CoupleSection inv={inv} />
          <EventsSection inv={inv} />
          <MapsSection inv={inv} />
          <LoveStorySection stories={data.stories} />
          {!inv.hide_gallery && <GallerySection gallery={data.gallery} setLightbox={setLightbox} />}
          {!inv.hide_video && <VideoSection inv={inv} />}
          <RsvpSection slug={slug} guestName={guestName} onSubmit={() => {
            publicApi.listWishes(slug, 1).then((r) => setWishes(r.data.items));
          }} />
          <WishesSection slug={slug} wishes={wishes} setWishes={setWishes} guestName={guestName} />
          <GiftSection gifts={data.gifts} inv={inv} />
          <ProtocolSection />
          <FooterSection inv={inv} visitorCount={visitorCount} />

          {/* Floating buttons */}
          <button onClick={toggleMusic} data-testid="music-toggle"
            className="floating-btn bg-primary-c text-white" style={{ bottom: 24, right: 24 }} aria-label="Toggle music">
            {musicOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
          </button>
          <button onClick={() => {
            const url = window.location.href;
            const text = `Undangan Pernikahan ${inv.groom_name} & ${inv.bride_name}: ${url}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          }} data-testid="share-whatsapp" className="floating-btn" style={{ bottom: 86, right: 24, background: "#25D366", color: "white" }} aria-label="Share WhatsApp">
            <Share2 size={18}/>
          </button>
        </main>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lightbox-bg flex items-center justify-center p-4"
            onClick={() => setLightbox(null)} data-testid="lightbox">
            <button className="absolute top-6 right-6 text-white" aria-label="Close"><X size={28}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={lightbox} alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============= Sections ============= */
function CoverScreen({ inv, guestName, onOpen, template }) {
  // Cover always uses cover_photo (independent from hide_photos). Falls back to monogram if no photo set.
  const hasCover = !!inv.cover_photo;
  return (
    <motion.div exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 overflow-hidden" data-testid="cover-screen">
      {hasCover ? (
        <>
          <img
  src={
    inv.cover_photo?.startsWith("/")
      ? `${process.env.REACT_APP_BACKEND_URL}${inv.cover_photo}`
      : inv.cover_photo
  }
  alt=""
  className="absolute inset-0 w-full h-full object-cover"
/>
<div className="absolute inset-0 cover-overlay" />
</>
      ) : (
        <div className="absolute inset-0" style={{
          background: template === "luxury"
            ? "radial-gradient(ellipse at center, #1a1410 0%, #050505 70%)"
            : template === "minimalist"
              ? "radial-gradient(ellipse at center, #ffffff 0%, #f5f5f5 70%)"
              : template === "modern"
                ? "radial-gradient(ellipse at center, #f9fafb 0%, #d1d5db 70%)"
                : "radial-gradient(ellipse at center, #fdfbf7 0%, #e6d599 70%)"
        }}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='currentColor' stroke-width='0.6' opacity='0.5'%3E%3Cpath d='M40 10 Q50 25 40 40 Q30 25 40 10'/%3E%3Cpath d='M40 40 Q50 55 40 70 Q30 55 40 40'/%3E%3Cpath d='M10 40 Q25 30 40 40 Q25 50 10 40'/%3E%3Cpath d='M40 40 Q55 30 70 40 Q55 50 40 40'/%3E%3C/g%3E%3C/svg%3E\")",
            color: "var(--primary, #B8923A)"
          }} aria-hidden="true"/>
        </div>
      )}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center text-center px-6 ${hasCover ? "text-white" : (template === "luxury" ? "text-white" : "text-current")}`}>
        {!hasCover && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 1 }}
            className="mb-8 flex items-center justify-center" data-testid="cover-monogram">
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 anim-ring" style={{ borderColor: "var(--primary)" }}/>
              <div className="absolute inset-3 rounded-full border opacity-60" style={{ borderColor: "var(--primary)" }}/>
              <span style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }} className="text-5xl md:text-6xl">
                {inv.groom_name?.[0]}<span className="italic mx-1">&</span>{inv.bride_name?.[0]}
              </span>
            </div>
          </motion.div>
        )}
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
          className="uppercase text-xs tracking-[0.5em] mb-6 opacity-80">The Wedding Of</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }}
          className="h-display text-5xl md:text-7xl mb-4">
          {inv.groom_name} <span className="italic" style={{ color: !hasCover ? "var(--primary)" : "#fcd34d" }}>&</span> {inv.bride_name}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-sm tracking-[0.3em] uppercase mb-12 opacity-80">17 • Juli • 2026</motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          className={`border rounded-2xl px-8 py-6 backdrop-blur max-w-md mb-10 ${hasCover ? "border-white/30 bg-black/30" : "border-current/30 bg-current/5"}`}>
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: hasCover ? "#fcd34d" : "var(--primary)" }}>Kepada Yth.</p>
          <p className="text-xs opacity-70 mb-2">Bpk/Ibu/Saudara/i</p>
          <p data-testid="guest-name-display" style={{ fontFamily: "var(--font-heading)" }} className="text-3xl">{decodeURIComponent(guestName)}</p>
        </motion.div>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
          onClick={onOpen} data-testid="open-invitation-btn"
          className="btn-gold inline-flex items-center gap-2">
          <Mail size={14}/> Buka Undangan
        </motion.button>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-12 opacity-60">
          <ChevronDown size={20} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function HeroBanner({ inv, guestName, countdown }) {
  // Hero uses cover_photo when available, independently from hide_photos
  const hasCover = !!inv.cover_photo;
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {hasCover ? (
        <>
         <img
  src={
    inv.cover_photo?.startsWith("/")
      ? `${process.env.REACT_APP_BACKEND_URL}${inv.cover_photo}`
      : inv.cover_photo
  }
  alt=""
  className="absolute inset-0 w-full h-full object-cover"
/>
<div className="absolute inset-0 cover-overlay" />
</>
      ) : (
        <div className="absolute inset-0 bg-surface-c" />
      )}
      <motion.div {...fadeUp} className={`relative z-10 text-center px-6 max-w-3xl ${hasCover ? "text-white" : ""}`}>
        {!hasCover && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary-c"/>
              <Heart size={28} className="text-primary-c"/>
            </div>
          </div>
        )}
        <p className="uppercase text-xs tracking-[0.5em] mb-6" style={{ color: hasCover ? "#fcd34d" : "var(--primary)" }}>Save The Date</p>
        <h2 className="h-display text-5xl md:text-7xl mb-6">{inv.groom_name} & {inv.bride_name}</h2>
        <p className="text-sm tracking-[0.3em] uppercase mb-10 opacity-80">Jumat, 17 Juli 2026</p>
        <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto" data-testid="countdown">
          {[
            { l: "Hari", v: countdown.d },
            { l: "Jam", v: countdown.h },
            { l: "Menit", v: countdown.m },
            { l: "Detik", v: countdown.s },
          ].map((c) => (
            <div key={c.l} className={`border rounded-xl py-4 ${hasCover ? "border-white/30 backdrop-blur bg-black/20" : "border-line-c bg-surface-c"}`}>
              <div className="h-display text-3xl md:text-4xl" style={{ color: hasCover ? "#fcd34d" : "var(--primary)" }}>{String(c.v).padStart(2, "0")}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] mt-1 opacity-70">{c.l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function QuoteSection({ inv }) {
  return (
    <section className="section text-center">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto">
        <div className="ornament-divider mb-8"><Heart size={14}/></div>
        <p className="h-display text-2xl md:text-3xl leading-relaxed italic text-muted-c">&ldquo;{inv.quote_text}&rdquo;</p>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-primary-c">— {inv.quote_source}</p>
      </motion.div>
    </section>
  );
}

function CoupleSection({ inv }) {
  const hide = inv.hide_photos;
  return (
    <section className="section">
      <motion.div {...fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Bismillahirrahmanirrahim</p>
        <h2 className="h-display text-4xl md:text-5xl mb-4">Mempelai Berbahagia</h2>
        <div className="ornament-divider"><Heart size={14}/></div>
      </motion.div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-start">
        {[{ tag: "Mempelai Pria", initial: inv.groom_name?.[0], full: inv.groom_full_name, photo: inv.groom_photo, father: inv.groom_father, mother: inv.groom_mother, ig: inv.groom_instagram },
          { tag: "Mempelai Wanita", initial: inv.bride_name?.[0], full: inv.bride_full_name, photo: inv.bride_photo, father: inv.bride_father, mother: inv.bride_mother, ig: inv.bride_instagram }
        ].map((p, i) => (
          <motion.div key={i} {...fadeUp} transition={{ duration: 0.8, delay: i * 0.15 }} className="text-center">
            {hide ? (
              <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary-c anim-ring"/>
                <div className="absolute inset-3 rounded-full border border-primary-c/40"/>
                <span style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }} className="text-6xl md:text-7xl">{p.initial}</span>
              </div>
            ) : (
              <div className="relative w-48 h-60 md:w-64 md:h-80 mx-auto mb-8 overflow-hidden rounded-t-full border-4 border-primary-c/30">
                <img src={p.photo} alt={p.full} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">{p.tag}</p>
            <h3 className="h-display text-3xl md:text-4xl mb-4">{p.full}</h3>
            <p className="text-sm text-muted-c leading-relaxed">Putra/Putri dari<br/><strong className="text-current">{p.father}</strong><br/>&<br/><strong>{p.mother}</strong></p>
            {p.ig && (
              <a href={p.ig} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-xs uppercase tracking-[0.2em] text-primary-c hover:underline">
                <Instagram size={14}/> Instagram
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EventsSection({ inv }) {
  const events = [
    { label: "Akad Nikah", date: inv.akad_date, time: inv.akad_time, location: inv.akad_location, address: inv.akad_address, icon: BookHeart },
    { label: "Resepsi", date: inv.resepsi_date, time: inv.resepsi_time, location: inv.resepsi_location, address: inv.resepsi_address, icon: Heart },
  ];
  return (
    <section className="section bg-surface-c">
      <motion.div {...fadeUp} className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Save The Date</p>
        <h2 className="h-display text-4xl md:text-5xl">Rangkaian Acara</h2>
        <div className="ornament-divider mt-4"><Calendar size={14}/></div>
      </motion.div>
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {events.map((e) => (
          <motion.div key={e.label} {...fadeUp} className="border border-line-c rounded-2xl p-8 bg-surface-c text-center">
            <e.icon size={28} className="text-primary-c mx-auto mb-4" />
            <h3 className="h-display text-3xl mb-4">{e.label}</h3>
            <div className="ornament-divider mb-4" />
            <div className="space-y-2 text-sm text-muted-c">
              <p><Calendar size={14} className="inline mr-2 text-primary-c"/>Jumat, 17 Juli 2026</p>
              <p><Clock size={14} className="inline mr-2 text-primary-c"/>{e.time}</p>
              <p className="font-semibold pt-2 text-current">{e.location}</p>
              <p className="text-xs">{e.address}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MapsSection({ inv }) {
  return (
    <section className="section">
      <motion.div {...fadeUp} className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Lokasi Acara</p>
        <h2 className="h-display text-4xl md:text-5xl mb-8">{inv.akad_location}</h2>
        <div className="rounded-2xl overflow-hidden border border-line-c shadow-lg aspect-[16/10]">
          <iframe src={inv.maps_embed} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi"/>
        </div>
        <a href={inv.maps_link} target="_blank" rel="noopener noreferrer" data-testid="open-maps-btn" className="btn-gold inline-flex items-center gap-2 mt-8">
          <MapPin size={14}/> Buka di Google Maps
        </a>
      </motion.div>
    </section>
  );
}

function LoveStorySection({ stories }) {
  return (
    <section className="section bg-surface-c">
      <motion.div {...fadeUp} className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Our Journey</p>
        <h2 className="h-display text-4xl md:text-5xl">Cerita Kami</h2>
        <div className="ornament-divider mt-4"><Heart size={14}/></div>
      </motion.div>
      <div className="max-w-3xl mx-auto relative">
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-primary-c/30 -translate-x-1/2" />
        {stories.map((s, i) => {
          const Icon = iconMap[s.icon] || Heart;
          const left = i % 2 === 0;
          return (
            <motion.div key={s.id} {...fadeUp} className={`relative mb-12 flex ${left ? "md:flex-row" : "md:flex-row-reverse"} items-start gap-6`}>
              <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-primary-c -translate-x-1/2 mt-2 ring-4 ring-bg" style={{boxShadow: "0 0 0 4px var(--bg)"}}/>
              <div className="ml-16 md:ml-0 md:w-1/2 md:px-8">
                <div className="border border-line-c rounded-xl p-6 bg-surface-c">
                  <Icon size={20} className="text-primary-c mb-3"/>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary-c mb-2">{s.date}</p>
                  <h3 className="h-display text-2xl mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-c leading-relaxed">{s.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function GallerySection({ gallery, setLightbox }) {
  return (
    <section className="section">
      <motion.div {...fadeUp} className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Moments</p>
        <h2 className="h-display text-4xl md:text-5xl">Galeri Foto</h2>
        <div className="ornament-divider mt-4"><Sparkles size={14}/></div>
      </motion.div>
      <div className="max-w-6xl mx-auto px-2">
        <div className="masonry">
          {gallery.map((g, i) => (
            <motion.div key={g.id} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.05 }} className="masonry-item cursor-pointer"
              onClick={() => setLightbox(g.image)} data-testid={`gallery-item-${i}`}>
              <img src={g.image} alt="" className="w-full hover:scale-105 transition duration-500"/>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection({ inv }) {
  if (!inv.video_url) return null;
  return (
    <section className="section bg-surface-c">
      <motion.div {...fadeUp} className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Cinematic Wedding</p>
        <h2 className="h-display text-4xl md:text-5xl mb-10">Video Prewedding</h2>
        <div className="aspect-video rounded-2xl overflow-hidden border border-line-c shadow-xl">
          <iframe src={inv.video_url} title="Prewedding Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"/>
        </div>
      </motion.div>
    </section>
  );
}

function RsvpSection({ slug, guestName, onSubmit }) {
  const [form, setForm] = useState({ guest_name: decodeURIComponent(guestName), phone: "", attendance: "hadir", guest_count: 1, message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicApi.postRsvp(slug, form);
      if (form.message) {
        await publicApi.postWish(slug, { guest_name: form.guest_name, message: form.message, attendance: form.attendance });
      }
      toast.success("Terima kasih! Konfirmasi kehadiran Anda telah terkirim.");
      onSubmit?.();
      setForm({ ...form, message: "" });
    } catch (err) {
      toast.error("Gagal mengirim. Coba lagi.");
    } finally { setSubmitting(false); }
  };

  return (
    <section className="section">
      <motion.div {...fadeUp} className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Konfirmasi Kehadiran</p>
          <h2 className="h-display text-4xl md:text-5xl">RSVP</h2>
          <div className="ornament-divider mt-4"><Send size={14}/></div>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-surface-c border border-line-c rounded-2xl p-6 md:p-10" data-testid="rsvp-form">
          <input data-testid="rsvp-name" required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            placeholder="Nama Lengkap" className="w-full px-4 py-3 rounded-lg border border-line-c bg-transparent focus:border-primary-c focus:outline-none"/>
          <input data-testid="rsvp-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Nomor WhatsApp (opsional)" className="w-full px-4 py-3 rounded-lg border border-line-c bg-transparent focus:border-primary-c focus:outline-none"/>
          <div className="grid grid-cols-2 gap-3">
            <select data-testid="rsvp-attendance" value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value })}
              className="px-4 py-3 rounded-lg border border-line-c bg-transparent focus:border-primary-c focus:outline-none">
              <option value="hadir">Hadir</option>
              <option value="tidak">Tidak Hadir</option>
              <option value="ragu">Masih Ragu</option>
            </select>
            <input data-testid="rsvp-count" type="number" min={1} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: Number(e.target.value) })}
              placeholder="Jumlah Tamu" className="px-4 py-3 rounded-lg border border-line-c bg-transparent focus:border-primary-c focus:outline-none"/>
          </div>
          <textarea data-testid="rsvp-message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Pesan & Doa untuk mempelai" className="w-full px-4 py-3 rounded-lg border border-line-c bg-transparent focus:border-primary-c focus:outline-none"/>
          <button type="submit" disabled={submitting} data-testid="rsvp-submit" className="btn-gold w-full">
            {submitting ? "Mengirim..." : "Kirim Konfirmasi"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}

function WishesSection({ slug, wishes, setWishes, guestName }) {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    publicApi.listWishes(slug, page).then((r) => { setWishes(r.data.items); setTotal(r.data.total); });
  }, [page, slug, setWishes]);

  return (
    <section className="section bg-surface-c">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Doa & Harapan</p>
          <h2 className="h-display text-4xl md:text-5xl">Ucapan Tamu</h2>
          <div className="ornament-divider mt-4"><MessageCircle size={14}/></div>
        </div>
        <div className="space-y-4" data-testid="wishes-list">
          {wishes.length === 0 && <p className="text-center text-muted-c py-8">Belum ada ucapan. Jadilah yang pertama!</p>}
          {wishes.map((w) => (
            <div key={w.id} className="border border-line-c rounded-xl p-5 bg-bg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-c/20 flex items-center justify-center text-primary-c font-semibold">
                  {w.guest_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{w.guest_name}</p>
                  <p className="text-xs text-muted-c">{new Date(w.created_at).toLocaleString("id-ID")}</p>
                </div>
              </div>
              <p className="text-sm text-current leading-relaxed">{w.message}</p>
            </div>
          ))}
        </div>
        {total > 6 && (
          <div className="flex justify-center gap-3 mt-6">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border border-line-c rounded-full text-xs disabled:opacity-50" data-testid="wishes-prev">‹ Prev</button>
            <span className="text-xs self-center text-muted-c">Hal. {page}</span>
            <button disabled={page * 6 >= total} onClick={() => setPage(page + 1)} className="px-4 py-2 border border-line-c rounded-full text-xs disabled:opacity-50" data-testid="wishes-next">Next ›</button>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function GiftSection({ gifts, inv }) {
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Nomor rekening berhasil disalin");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success("Nomor rekening berhasil disalin");
      } catch {
        toast.error("Tidak bisa menyalin. Silakan salin manual.");
      }
    }
  };
  return (
    <section className="section">
      <motion.div {...fadeUp} className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Tanda Kasih</p>
          <h2 className="h-display text-4xl md:text-5xl">Wedding Gift</h2>
          <p className="text-sm text-muted-c mt-4 max-w-md mx-auto">Doa restu Anda sudah lebih dari cukup. Namun jika ingin memberi tanda kasih, silakan melalui:</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {gifts.map((g) => (
            <div key={g.id} className="border border-line-c rounded-xl p-6 bg-surface-c">
              <div className="flex items-center gap-3 mb-4">
                {g.logo && <img src={g.logo} alt={g.bank_name} className="h-8 object-contain"/>}
                <span className="font-semibold">{g.bank_name}</span>
              </div>
              <p className="h-display text-2xl mb-1">{g.account_number}</p>
              <p className="text-sm text-muted-c mb-4">a.n. {g.account_holder}</p>
              <button onClick={() => copy(g.account_number)} data-testid={`copy-${g.bank_name}`} className="text-xs uppercase tracking-[0.2em] px-4 py-2 border border-primary-c text-primary-c rounded-full hover:bg-primary-c hover:text-white transition flex items-center gap-2">
                <Copy size={12}/> Salin Nomor
              </button>
            </div>
          ))}
          {inv.qris_image && (
            <div className="border border-line-c rounded-xl p-6 bg-surface-c md:col-span-2 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-4">QRIS</p>
              <img src={inv.qris_image} alt="QRIS" className="mx-auto h-48 mb-4"/>
              <a href={inv.qris_image} download className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-c hover:underline" data-testid="download-qris">
                <Download size={12}/> Download QRIS
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function ProtocolSection() {
  const items = [
    { icon: "🤝", title: "Sopan Santun", desc: "Mohon menjaga ketertiban selama acara berlangsung." },
    { icon: "👔", title: "Dress Code", desc: "Smart casual dengan warna lembut, hindari putih." },
    { icon: "📸", title: "Foto Bersama", desc: "Sesi foto bersama mempelai pada waktu yang ditentukan." },
    { icon: "🍽️", title: "Hidangan", desc: "Hidangan tersedia di area resepsi setelah akad." },
  ];
  return (
    <section className="section bg-surface-c">
      <motion.div {...fadeUp} className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-c mb-3">Tata Tertib</p>
          <h2 className="h-display text-4xl md:text-5xl">Protokol Acara</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.title} className="text-center p-6 border border-line-c rounded-xl bg-bg">
              <div className="text-3xl mb-3">{it.icon}</div>
              <h4 className="font-semibold mb-2">{it.title}</h4>
              <p className="text-xs text-muted-c leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FooterSection({ inv, visitorCount }) {
  return (
    <footer className="section text-center relative overflow-hidden">
      <motion.div {...fadeUp} className="max-w-2xl mx-auto">
        <div className="ornament-divider mb-6"><Heart size={16}/></div>
        <h2 className="h-display text-4xl md:text-5xl mb-6">Terima Kasih</h2>
        <p className="text-muted-c leading-relaxed mb-8">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
          berkenan hadir untuk memberikan doa restu kepada kami.
        </p>
        <p className="h-display text-3xl">{inv.groom_name} & {inv.bride_name}</p>
        <div className="mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-c">
          <Users size={12}/> {visitorCount} Pengunjung
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-muted-c">Powered by BbagProject • 2026</p>
      </motion.div>
    </footer>
  );
}
