import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, PackageCheck, CreditCard,
  MessageCircle, Star, LogOut, Menu, X, User,
} from "lucide-react";
import { NotificationBell } from "../../../components/layout/notification-bell";

const navItems = [
  { href: "/buyer",          label: "Home",         icon: LayoutDashboard },
  { href: "/buyer/browse",   label: "Browse Crops", icon: Search          },
  { href: "/buyer/orders",   label: "My Orders",    icon: PackageCheck    },
  { href: "/buyer/payments", label: "Payments",     icon: CreditCard      },
  { href: "/buyer/chat",     label: "Chat",         icon: MessageCircle   },
  { href: "/buyer/ratings",  label: "Ratings",      icon: Star            },
  { href: "/buyer/profile",  label: "My Profile",   icon: User            },
];

export function BuyerLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const initial = ((user as any)?.email?.charAt(0) || "B").toUpperCase();
  const name    = (user as any)?.name || (user as any)?.email?.split("@")[0] || "Buyer";
  const email   = (user as any)?.email || "";

  const SidebarContent = () => (
    <div className="ag-sidebar w-64 flex-shrink-0 flex flex-col" style={{ height: "100vh" }}>
      {/* Brand */}
      <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(233,196,106,0.2)", border: "1px solid rgba(233,196,106,0.35)" }}>
            🧺
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-none">Farm to Market</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#e9c46a" }}>Buyer Panel</span>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="ag-avatar-ring w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1b4332, #2d6a4f)" }}>
            {initial}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-white truncate">{name}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{email}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block"
              style={{ background: "rgba(233,196,106,0.2)", color: "#e9c46a" }}>🧺 Buyer</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Navigation</p>
        {navItems.map((item, i) => {
          const isActive = item.href === "/buyer" ? location === "/buyer" : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a className={`ag-nav-item ag-slide-left ${isActive ? "active" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <Icon size={17} style={{ color: isActive ? "#e9c46a" : "rgba(255,255,255,0.55)", flexShrink: 0 }} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => logout()} className="ag-nav-item w-full" style={{ color: "#fca5a5" }}>
          <LogOut size={17} /> Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="ag-page">
      <div className="hidden md:block sticky top-0 flex-shrink-0" style={{ height: "100vh" }}>
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#1b4332", borderBottom: "1px solid rgba(255,255,255,0.08)", height: 56 }}>
        <span className="font-black text-white text-lg">🧺 <span style={{ color: "#e9c46a" }}>Farm to Market</span></span>
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
        <header className="hidden md:flex sticky top-0 z-10 items-center justify-between px-8 py-3"
          style={{ background: "rgba(250,247,242,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8e0d0" }}>
          <h1 className="font-bold text-sm capitalize" style={{ color: "#1b2e1e" }}>
            {navItems.find(n => n.href === location)?.label || "Buyer Dashboard"}
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
