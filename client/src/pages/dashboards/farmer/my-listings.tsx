import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import type { Crop } from "@shared/schema";
import { Loader2, Sprout, Filter, Edit, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FarmerListings() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCrops() {
      try {
        const res = await apiRequest("GET", "/api/crops/me");
        const data = await res.json();
        setCrops(data.crops || []);
      } catch (err: any) {
        setError(err.message || "Failed to load listings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCrops();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this crop listing? It will be removed immediately.")) return;
    
    setIsDeleting(id);
    try {
      const res = await apiRequest("DELETE", `/api/crops/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete crop");
      }
      setCrops((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete crop");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Listings</h1>
          <p className="text-slate-500 text-sm">Manage your uploaded crops and statuses.</p>
        </div>
        <Link href="/farmer/upload">
          <Button className="bg-green-600 hover:bg-green-700">
            <Sprout className="w-4 h-4 mr-2" /> New Listing
          </Button>
        </Link>
      </div>

      {crops.length === 0 ? (
        <Card className="shadow-none border-dashed bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-1">
              No crops listed yet
            </h3>
            <p className="text-slate-500 mb-4 text-sm max-w-sm">
              You haven't uploaded any products. Start adding crops to sell them on
              the marketplace.
            </p>
            <Link href="/farmer/upload">
              <Button variant="outline" className="border-green-600 text-green-600">
                Upload First Crop
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <Card key={crop.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div 
                className="h-48 bg-slate-200 relative bg-cover bg-center"
                style={{ backgroundImage: `url(${crop.image || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"})` }}
              >
                {/* Status Badge Overlays */}
                <div className="absolute top-4 right-4">
                  {crop.status === "pending" && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                      Pending Approval
                    </span>
                  )}
                  {crop.status === "approved" && (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-sm">
                      Active
                    </span>
                  )}
                  {crop.status === "rejected" && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                      Rejected
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{crop.name}</h3>
                  <span className="text-lg font-bold text-green-600">₹{crop.price}/kg</span>
                </div>
                
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {crop.description || "No description provided."}
                </p>

                <div className="flex justify-between items-center text-sm font-medium text-slate-600 pt-4 border-t border-slate-100">
                  <span>Stock: {crop.quantity} kg</span>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-blue-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(crop.id)}
                      disabled={isDeleting === crop.id}
                      className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-red-500 disabled:opacity-50"
                    >
                      {isDeleting === crop.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
