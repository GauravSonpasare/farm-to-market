import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sprout,
  ShoppingCart,
  IndianRupee,
  MessageSquareWarning,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { NotificationBell } from "../../../components/layout/notification-bell";

const NAV_LINKS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "User Management" },
  { href: "/admin/crops", icon: Sprout, label: "Crop Approvals" },
  { href: "/admin/market", icon: TrendingUp, label: "Market Price Tracker" },
  { href: "/admin/orders", icon: ShoppingCart, label: "All Orders" },
  { href: "/admin/payments", icon: IndianRupee, label: "Payments" },
  { href: "/admin/complaints", icon: MessageSquareWarning, label: "Complaints" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <ShieldCheck className="text-emerald-400" />
          F2M <span className="text-emerald-400 font-black">ADMIN</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-slate-300">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-40 border-r border-slate-800 shadow-2xl md:shadow-none"
          >
            {/* Logo area */}
            <div className="hidden md:flex items-center gap-3 px-6 py-8 border-b border-slate-800/60">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-emerald-500/20 shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight leading-none">F2M</h2>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Admin Portal</span>
              </div>
            </div>

            {/* Profile summary */}
            <div className="px-6 py-6 border-b border-slate-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 uppercase">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
              <div className="px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Menu</p>
              </div>
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href || (location.startsWith(link.href) && link.href !== "/admin");
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-emerald-400" : "opacity-70"} />
                      {link.label}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Logout button */}
            <div className="p-4 mt-auto border-t border-slate-800/60">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-[#f4f7f6]">
        {/* Top bar (desktop) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {location.split("/").pop() || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <motion.div
            key={location} // Re-animate on route change
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
