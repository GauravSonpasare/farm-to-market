import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../../lib/api";
import type { Crop } from "@shared/schema";
import { Search, MapPin, Loader2, Sparkles, Filter, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

interface ExtendedCrop extends Crop {
  farmerName: string;
  farmerLocation: string;
}

export default function BrowseCrops() {
  const [crops, setCrops] = useState<ExtendedCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchCrops() {
      try {
        const res = await apiRequest("GET", "/api/crops");
        const data = await res.json();
        setCrops(data.crops || []);
      } catch (err: any) {
        setError("Failed to load crops from marketplace.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCrops();
  }, []);

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = locationFilter ? crop.farmerLocation?.toLowerCase().includes(locationFilter.toLowerCase()) : true;
    const matchesMin = minPrice ? crop.price >= parseFloat(minPrice) : true;
    const matchesMax = maxPrice ? crop.price <= parseFloat(maxPrice) : true;
    return matchesSearch && matchesLocation && matchesMin && matchesMax;
  });

  const getPseudoRating = (id: number) => {
    // Deterministic mock AI rating
    const score = 6 + ((id * 3) % 4) + (id % 2 === 0 ? 0.5 : 0);
    return score > 9.5 ? 9.5 : score;
  };

  const getQualityLabel = (score: number) => {
    if (score >= 8.5) return { label: "Recommended", color: "text-emerald-700 bg-emerald-100 border-emerald-200" };
    if (score >= 7.0) return { label: "Average", color: "text-blue-700 bg-blue-100 border-blue-200" };
    return { label: "Risky", color: "text-amber-700 bg-amber-100 border-amber-200" };
  };

  // Stagger animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Browse Crops</h1>
          <p className="text-slate-500 mt-1">Discover fresh, high-quality produce from local farmers.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="md:w-auto w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <Filter size={18} className="mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-emerald-100 shadow-sm bg-emerald-50/30">
              <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                    <Input 
                      placeholder="e.g., Organic Apples" 
                      className="pl-9 bg-white border-emerald-100 focus-visible:ring-emerald-500"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                    <Input 
                      placeholder="e.g., Nashik" 
                      className="pl-9 bg-white border-emerald-100 focus-visible:ring-emerald-500"
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Min Price (₹)</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    className="bg-white border-emerald-100 focus-visible:ring-emerald-500"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Max Price (₹)</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      className="bg-white border-emerald-100 focus-visible:ring-emerald-500"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    />
                    {(search || locationFilter || minPrice || maxPrice) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSearch(""); setLocationFilter(""); setMinPrice(""); setMaxPrice(""); }}
                        className="shrink-0 text-slate-400 hover:text-red-500"
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-slate-500">Harvesting the best crops for you...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No crops found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVars} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredCrops.map(crop => {
            const score = getPseudoRating(crop.id);
            const quality = getQualityLabel(score);

            return (
              <motion.div key={crop.id} variants={itemVars}>
                <Link href={`/buyer/crops/${crop.id}`}>
                  <a className="block group">
                    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 h-full cursor-pointer bg-white">
                      <div className="h-48 relative overflow-hidden bg-slate-100">
                        <img 
                          src={crop.image || "https://images.unsplash.com/photo-1595856407062-817ab0ecdf35"} 
                          alt={crop.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm backdrop-blur-md ${quality.color}`}>
                            <Sparkles size={12} />
                            {quality.label} ({score})
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{crop.name}</h3>
                          <span className="font-bold text-emerald-600 text-lg ml-2 shrink-0">₹{crop.price}<span className="text-xs text-slate-500 font-normal">/kg</span></span>
                        </div>
                        <p className="text-sm text-slate-500 mb-3 flex items-center gap-1 line-clamp-1">
                          <MapPin size={12} /> {crop.farmerLocation || "Location N/A"} • By {crop.farmerName}
                        </p>
                        <div className="flex justify-between items-center text-sm font-medium pt-3 border-t border-slate-100">
                          <span className="text-slate-600">Stock: <span className="text-slate-900">{crop.quantity} kg</span></span>
                          <span className="text-emerald-600 group-hover:underline">View Details</span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
