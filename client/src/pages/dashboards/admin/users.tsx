import { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/api";
import { Loader2, MapPin, CheckCircle, XCircle, Ban, Eye } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  const pending = users.filter((u: any) => u.status === "pending");
  const farmers = users.filter((u: any) => u.role === "farmer" && u.status !== "pending");
  const buyers = users.filter((u: any) => u.role === "buyer" && u.status !== "pending");

  const UserTable = ({ data }: { data: any[] }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Name</th>
              <th className="p-4 font-semibold text-slate-600">Email</th>
              <th className="p-4 font-semibold text-slate-600">Status</th>
              <th className="p-4 font-semibold text-slate-600">Location</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  {user.name}
                </td>
                <td className="p-4 text-slate-500">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 flex w-max items-center gap-1 rounded-full text-[10px] font-bold uppercase ${
                    user.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    user.status === 'blocked' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500 flex items-center gap-1"><MapPin size={14}/> {user.location || "N/A"}</td>
                <td className="p-4 text-right space-x-2">
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button onClick={() => setSelectedUser(user)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm" />
                      <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl z-50 focus:outline-none border border-slate-100">
                        <Dialog.Title className="text-xl font-bold text-slate-800 mb-4">{selectedUser?.role === 'farmer' ? 'Farmer' : 'Buyer'} Profile</Dialog.Title>
                        {selectedUser && (
                           <div className="space-y-4">
                             <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                               <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold uppercase">
                                 {selectedUser.name.charAt(0)}
                               </div>
                               <div>
                                 <h3 className="text-lg font-bold text-slate-800">{selectedUser.name}</h3>
                                 <p className="text-slate-500 text-sm">{selectedUser.email}</p>
                                 <p className="text-slate-500 text-sm">{selectedUser.phone || "No phone provided"}</p>
                               </div>
                             </div>
                             <div className="py-2 space-y-2">
                               <div className="flex justify-between">
                                 <span className="text-slate-500 font-medium">Joined:</span>
                                 <span className="text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-500 font-medium">Location:</span>
                                 <span className="text-slate-800">{selectedUser.location || "N/A"}</span>
                               </div>
                               <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                  <span className="text-slate-500 font-medium">Account Status</span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    selectedUser.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    selectedUser.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>{selectedUser.status}</span>
                               </div>
                             </div>
                           </div>
                        )}
                        <Dialog.Close asChild>
                          <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                            <XCircle size={20} />
                          </button>
                        </Dialog.Close>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>

                  {user.status !== 'approved' && (
                    <button onClick={() => handleStatusUpdate(user.id, 'approved')} title="Approve" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {user.status !== 'blocked' && (
                    <button onClick={() => handleStatusUpdate(user.id, 'blocked')} title="Block" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Ban size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
        <p className="text-slate-500 mt-1">Review and manage farmer and buyer accounts across the platform.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="pending" className="px-6 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm transition-all">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="farmers" className="px-6 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all">Farmers</TabsTrigger>
          <TabsTrigger value="buyers" className="px-6 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all">Buyers</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-0">
          <UserTable data={pending} />
        </TabsContent>
        <TabsContent value="farmers" className="mt-0">
          <UserTable data={farmers} />
        </TabsContent>
        <TabsContent value="buyers" className="mt-0">
          <UserTable data={buyers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
