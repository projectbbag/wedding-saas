import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import InvitationPage from "@/pages/InvitationPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminInvitations from "@/pages/admin/Invitations";
import AdminGuests from "@/pages/admin/Guests";
import AdminRsvps from "@/pages/admin/Rsvps";
import AdminWishes from "@/pages/admin/Wishes";
import AdminGallery from "@/pages/admin/Gallery";
import AdminStories from "@/pages/admin/Stories";
import AdminGifts from "@/pages/admin/Gifts";
import AdminTemplates from "@/pages/admin/Templates";

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="invitations" element={<AdminInvitations />} />
            <Route path="guests" element={<AdminGuests />} />
            <Route path="rsvps" element={<AdminRsvps />} />
            <Route path="wishes" element={<AdminWishes />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="stories" element={<AdminStories />} />
            <Route path="gifts" element={<AdminGifts />} />
            <Route path="templates" element={<AdminTemplates />} />
          </Route>
          <Route path="/:slug" element={<InvitationPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
