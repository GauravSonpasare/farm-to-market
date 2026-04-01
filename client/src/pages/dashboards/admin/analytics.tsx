import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import { Loader2, TrendingUp, Users, Sprout, ShoppingCart, IndianRupee } from "lucide-react";
import { CountUp } from "../../../components/ui/count-up";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function AdminAnalytics() {
  const [range, setRange] = useState("all");
  const [overview, setOverview] = useState<any>(null);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [topCrops, setTopCrops] = useState<any[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<any[]>([]);
  const [farmerIncome, setFarmerIncome] = useState<any[]>([]);
  const [locationDemand, setLocationDemand] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const qs = `?range=${range}`;
      const [ovRes, msRes, tcRes, osRes, fiRes, ldRes] = await Promise.all([
        apiRequest("GET", `/api/admin/analytics/overview${qs}`),
        apiRequest("GET", `/api/admin/analytics/monthly-sales${qs}`),
        apiRequest("GET", `/api/admin/analytics/top-crops${qs}`),
        apiRequest("GET", `/api/admin/analytics/orders-by-status${qs}`),
        apiRequest("GET", `/api/admin/analytics/farmer-income${qs}`),
        apiRequest("GET", `/api/admin/analytics/location-demand${qs}`),
      ]);

      const [ovData, msData, tcData, osData, fiData, ldData] = await Promise.all([
        ovRes.json(), msRes.json(), tcRes.json(), osRes.json(), fiRes.json(), ldRes.json()
      ]);

      setOverview(ovData);
      setMonthlySales(msData.data || []);
      setTopCrops(tcData.data || []);
      setOrdersStatus(osData.data || []);
      setFarmerIncome(fiData.data || []);
      setLocationDemand(ldData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading && !overview) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics Overview</h1>
          <p className="text-slate-500 mt-1">Review key performance metrics and platform growth.</p>
        </div>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Time</option>
          <option value="year">This Year</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-medium text-sm">Total Farmers</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1"><CountUp end={overview.totalFarmers} /></h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><Users size={24}/></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-medium text-sm">Total Buyers</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1"><CountUp end={overview.totalBuyers} /></h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Users size={24}/></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-medium text-sm">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1"><CountUp end={overview.totalOrders} /></h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><ShoppingCart size={24}/></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl border border-emerald-700 shadow-lg flex items-center justify-between text-white">
            <div>
              <p className="text-emerald-100 font-medium text-sm">Total Revenue</p>
              <h3 className="text-3xl font-black mt-1"><CountUp end={overview.totalRevenue} prefix="₹" /></h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><IndianRupee size={24}/></div>
          </motion.div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Monthly Sales - Line Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Platform Revenue (Last 6 Months)</h3>
          <div className="h-72 w-full">
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No data available</p>}
          </div>
        </motion.div>

        {/* Most Demanded Crops - Pie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Sprout size={18} className="text-emerald-500"/> Top Demanded Crops</h3>
          <div className="h-64 w-full">
            {topCrops.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topCrops} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                    {topCrops.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No data available</p>}
          </div>
        </motion.div>

        {/* Orders by Status - Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Orders by Status</h3>
          <div className="h-64 w-full">
            {ordersStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No data available</p>}
          </div>
        </motion.div>

        {/* Farmer Income Growth - Area Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Farmer Income Growth</h3>
          <div className="h-64 w-full">
            {farmerIncome.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={farmerIncome}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Income']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No data available</p>}
          </div>
        </motion.div>

        {/* Demand by Location - Horizontal Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Demand by Location (Order Volume)</h3>
          <div className="h-64 w-full">
            {locationDemand.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationDemand} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#334155', fontWeight: 500}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="orders" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center pt-20">No data available</p>}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
