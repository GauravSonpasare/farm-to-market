import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { CloudSun, CloudRain, Sun, Wind, Droplets, Thermometer, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  iconUrl?: string;
  windSpeed: number;
  description: string;
}

export default function FarmerWeather() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const userLocation = user?.location || "Pune, Maharashtra"; // Default if not filled

  useEffect(() => {
    async function fetchWeather() {
      setIsLoading(true);
      setError("");

      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

      if (!apiKey || apiKey === "your_openweathermap_key_here") {
        // Fallback to mocked data if API key is not configured
        setTimeout(() => {
          setWeather({
            temp: 28,
            humidity: 65,
            condition: "Partly Cloudy",
            windSpeed: 12,
            description: "moderate breeze",
          });
          setIsLoading(false);
        }, 800);
        return;
      }

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            userLocation
          )}&appid=${apiKey}&units=metric`
        );
        if (!res.ok) throw new Error("Weather data unavilable");
        
        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main,
          description: data.weather[0].description,
          windSpeed: data.wind.speed,
          iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch weather data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
  }, [userLocation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Local Weather</h1>
        <p className="text-slate-500 text-sm">Real-time localized forecasts to help you plan harvests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 overflow-hidden border-0 shadow-lg relative bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 text-white/10">
            <CloudSun size={300} />
          </div>
          
          <CardHeader className="relative z-10 pb-0">
            <CardTitle className="text-blue-50 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} /> {userLocation}
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 pt-6 pb-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
                <p>Loading forecast...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-white/20 rounded-xl text-center backdrop-blur-sm">
                <p>{error}</p>
                <p className="text-xs mt-2 opacity-80">Make sure your profile location is valid.</p>
              </div>
            ) : weather ? (
              <div>
                <div className="flex justify-between items-center mb-10 mt-4">
                  <div className="flex flex-col">
                    <span className="text-7xl font-light">{weather.temp}°<span className="text-5xl">C</span></span>
                    <span className="text-xl mt-2 font-medium capitalize">{weather.condition}</span>
                    <span className="text-blue-100 text-sm capitalize">{weather.description}</span>
                  </div>
                  {weather.iconUrl ? (
                    <img src={weather.iconUrl} alt="Weather icon" className="w-24 h-24 drop-shadow-lg" />
                  ) : (
                    weather.condition.includes("Rain") ? <CloudRain size={80} className="drop-shadow-lg opacity-90" /> :
                    weather.condition.includes("Clear") ? <Sun size={80} className="drop-shadow-lg opacity-90 text-yellow-300" /> :
                    <CloudSun size={80} className="drop-shadow-lg opacity-90" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Droplets size={20} className="text-blue-100" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100 uppercase tracking-wide">Humidity</p>
                      <p className="font-semibold text-lg">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Wind size={20} className="text-blue-100" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-100 uppercase tracking-wide">Wind Speed</p>
                      <p className="font-semibold text-lg">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-none border border-slate-200">
          <CardHeader>
            <CardTitle>Crop Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h4 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                <Thermometer size={16} /> Condition Analysis
              </h4>
              <p className="text-sm text-green-700">
                {weather?.temp && weather.temp > 30 
                  ? "Temperatures are high. Ensure adequate irrigation for sensitive crops like leafy greens."
                  : weather?.temp && weather.temp < 15
                  ? "Temperatures are low. Consider protective measures for frost-sensitive plants."
                  : "Current conditions are highly favorable for most standard crops."}
              </p>
            </div>
            
            <div className="p-4 rounded-xl border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-2">Ideal planting right now:</h4>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Wheat</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Mustard</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Chickpeas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
