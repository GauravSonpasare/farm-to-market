import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Sprout, ShoppingCart, IndianRupee,
  MessageSquareWarning, TrendingUp, LogOut, Menu, X, Shield,
} from "lucide-react";
import { NotificationBell } from "../../../components/layout/notification-bell";

const NAV_LINKS = [
  { href: "/admin",            icon: LayoutDashboard,      label: "Dashboard"      },
  { href: "/admin/users",      icon: Users,                label: "User Management"},
  { href: "/admin/crops",      icon: Sprout,               label: "Crop Approvals" },
  { href: "/admin/market",     icon: TrendingUp,           label: "Market Prices"  },
  { href: "/admin/orders",     icon: ShoppingCart,         label: "All Orders"     },
  { href: "/admin/payments",   icon: IndianRupee,          label: "Payments"       },
  { href: "/admin/complaints", icon: MessageSquareWarning, label: "Complaints"     },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const initial = ((user as any)?.email?.charAt(0) || "A").toUpperCase();
  const name    = (user as any)?.email?.split("@")[0] || "Admin";
  const email   = (user as any)?.email || "admin@farm.com";

  const SidebarContent = () => (
    <div className="ag-sidebar w-64 flex-shrink-0 flex flex-col" style={{ height: "100vh" }}>
      {/* Brand */}
      <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(233,196,106,0.2)", border: "1px solid rgba(233,196,106,0.4)" }}>
            <Shield size={22} style={{ color: "#e9c46a" }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-none">F2M</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#e9c46a" }}>Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="ag-avatar-ring w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2d6a4f, #40916c)" }}>
            {initial}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-white truncate">{name}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Menu</p>
        {NAV_LINKS.map((link, i) => {
          const isActive = link.href === "/admin" ? location === "/admin" : location.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <a className={`ag-nav-item ag-slide-left ${isActive ? "active" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <Icon size={17} style={{ color: isActive ? "#e9c46a" : "rgba(255,255,255,0.6)", flexShrink: 0 }} />
                {link.label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => logout()} className="ag-nav-item w-full" style={{ color: "#fca5a5" }}>
          <LogOut size={17} /> Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="ag-page">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 flex-shrink-0" style={{ height: "100vh" }}>
        <SidebarContent />
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#1b4332", borderBottom: "1px solid rgba(255,255,255,0.08)", height: 56 }}>
        <span className="font-black text-white text-lg">🛡️ F2M <span style={{ color: "#e9c46a" }}>Admin</span></span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex md:hidden" onClick={() => setMobileOpen(false)}>
            <div onClick={e => e.stopPropagation()}><SidebarContent /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="ag-main flex-1">
        {/* Top bar */}
        <header className="hidden md:flex sticky top-0 z-10 items-center justify-between px-8 py-3"
          style={{ background: "rgba(250,247,242,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8e0d0" }}>
          <h1 className="font-bold text-sm capitalize" style={{ color: "#1b2e1e" }}>
            {location.split("/").filter(Boolean).pop() || "Dashboard"}
          </h1>
          <NotificationBell />
        </header>

        <motion.div key={location}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }} className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
