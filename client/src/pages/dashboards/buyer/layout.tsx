import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  PackageCheck,
  CreditCard,
  MessageCircle,
  Star,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../../hooks/use-auth";
import { NotificationBell } from "../../../components/layout/notification-bell";

const navItems = [
  { href: "/buyer", label: "Home", icon: LayoutDashboard },
  { href: "/buyer/browse", label: "Browse Crops", icon: Search },
  { href: "/buyer/orders", label: "My Orders", icon: PackageCheck },
  { href: "/buyer/payments", label: "Payments", icon: CreditCard },
  { href: "/buyer/chat", label: "Chat", icon: MessageCircle },
  { href: "/buyer/ratings", label: "Ratings", icon: Star },
  { href: "/buyer/complaints", label: "Complaint Box", icon: AlertTriangle },
];

export function BuyerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : 0 }} // Managed responsively by CSS classes
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-emerald-50 shadow-2xl transition-transform transform lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between xl:justify-center border-b border-emerald-800">
          <Link href="/buyer">
            <span className="text-2xl font-bold flex items-center gap-2 cursor-pointer">
              <ShoppingBag className="h-6 w-6 text-emerald-400" />
              <span className="hidden lg:block">Buyer Panel</span>
              <span className="lg:hidden">F2M</span>
            </span>
          </Link>
          <button
            className="lg:hidden text-emerald-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match or partial match (e.g., /buyer/browse matches /buyer/crops/123 if logic dictates, but we keep it simple)
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/buyer");
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-700/50 text-white font-medium shadow-inner"
                      : "text-emerald-200 hover:bg-emerald-800/50 hover:text-emerald-50"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-emerald-300" : ""} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-800 mt-auto">
          <div className="mb-4 px-4 hidden lg:flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-emerald-300 truncate">{user?.email}</p>
            </div>
            <div className="shrink-0 bg-white/10 rounded-full">
              <NotificationBell />
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-all font-medium"
          >
            <LogOut size={20} />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm h-16 flex justify-between items-center px-4 shrink-0 z-30 relative">
          <div className="flex items-center">
            <button
              className="p-2 -ml-2 text-slate-600 rounded-md hover:bg-slate-100 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <span className="ml-4 font-semibold text-lg text-slate-800 truncate">
              {navItems.find((n) => location === n.href || (location.startsWith(n.href) && n.href !== "/buyer"))?.label || "Buyer Dashboard"}
            </span>
          </div>
          <NotificationBell />
        </header>

        {/* Page Content with Framer Motion Transitions */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50/50 backdrop-blur-sm relative z-10 w-full h-full">
          <motion.div
            key={location.split('/')[2] || "home"} // Animate key correctly handling nested sub-IDs
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
