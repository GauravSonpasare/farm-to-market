import { motion } from "framer-motion";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-7xl"
        >
          🌾
        </motion.div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-amber-500 bg-clip-text text-transparent">
          Farm to Market
        </h1>

        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Connecting farmers directly with buyers. Fresh produce, fair prices.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center pt-4"
        >
          <Link href="/auth">
            <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25">
              Get Started
            </button>
          </Link>
          <button className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors">
            Learn More
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
