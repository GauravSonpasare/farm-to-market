import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "wouter"
import { useAuth } from "../hooks/use-auth"
import {
  Wheat, Loader2, Clock, AlertTriangle, Eye, EyeOff, Leaf, Upload,
} from "lucide-react"

// ─── Simple labeled input ───────────────────────────────────────────────────
function Field({
  id, name, label, type = "text", required = false,
}: {
  id: string; name: string; label: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>
        {label}{required && " *"}
      </label>
      <input
        id={id} name={name} type={type}
        required={required} placeholder=""
        className="ag-input"
      />
    </div>
  )
}

function SelectField({ id, name, label, children }: {
  id: string; name: string; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>{label}</label>
      <select id={id} name={name} className="ag-input">
        {children}
      </select>
    </div>
  )
}

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const [, setLocation] = useLocation()
  const [tab, setTab]   = useState<"login" | "register">("login")
  const [role, setRole] = useState<"farmer" | "buyer">("buyer")

  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegLoading,   setIsRegLoading]   = useState(false)
  const [loginError,     setLoginError]     = useState("")
  const [loginIsPending, setLoginIsPending] = useState(false)
  const [regMessage,     setRegMessage]     = useState("")
  const [regIsSuccess,   setRegIsSuccess]   = useState(false)
  const [regIsPending,   setRegIsPending]   = useState(false)
  const [showPassword,   setShowPassword]   = useState(false)

  React.useEffect(() => {
    if (user) {
      if ((user as any).role === "admin")  setLocation("/admin")
      else if ((user as any).role === "farmer") setLocation("/farmer")
      else setLocation("/buyer")
    }
  }, [user, setLocation])

  const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoginLoading(true)
    setLoginError("")
    setLoginIsPending(false)
    const fd = new FormData(e.currentTarget)
    try {
      await login({ email: fd.get("email") as string, password: fd.get("password") as string })
    } catch (err: any) {
      const msg: string = err.message || "Login failed"
      if (msg.toLowerCase().includes("pending admin approval")) setLoginIsPending(true)
      setLoginError(msg)
    } finally { setIsLoginLoading(false) }
  }

  const onRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsRegLoading(true)
    setRegMessage("")
    setRegIsSuccess(false)
    setRegIsPending(false)
    const fd = new FormData(e.currentTarget)

    const payload: Record<string, string> = {
      name:     fd.get("name") as string,
      email:    fd.get("email") as string,
      password: fd.get("password") as string,
      role,
      phone:    fd.get("phone") as string,
    }
    if (role === "farmer") {
      payload.phone2       = fd.get("phone2") as string
      payload.address      = fd.get("address") as string
      payload.village      = fd.get("village") as string
      payload.district     = fd.get("district") as string
      payload.state        = fd.get("state") as string
      payload.pincode      = fd.get("pincode") as string
      payload.yearsExp     = fd.get("yearsExp") as string
      payload.farmingType  = fd.get("farmingType") as string
      payload.primaryCrops = fd.get("primaryCrops") as string
      payload.farmSize     = fd.get("farmSize") as string
      payload.govtId       = fd.get("govtId") as string
    } else {
      payload.phone2 = fd.get("phone2") as string
      payload.city   = fd.get("city") as string
      payload.state  = fd.get("state") as string
    }

    try {
      await register(payload as any)
      if (role === "farmer") {
        setRegIsPending(true)
        setRegMessage("Your farmer account has been created! Pending admin approval. You can login once approved.")
      } else {
        setRegIsSuccess(true)
        setRegMessage("Account created! Logging you in…")
      }
    } catch (err: any) {
      setRegMessage(err.message || "Registration failed")
    } finally { setIsRegLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f5f0e8 0%, #faf7f2 60%, #f0ece2 100%)" }}>

      {/* Decorative elements */}
      <div className="fixed top-8 left-8 text-7xl opacity-[0.07] select-none pointer-events-none" style={{ transform: "rotate(-20deg)" }}>🌿</div>
      <div className="fixed bottom-12 right-12 text-7xl opacity-[0.07] select-none pointer-events-none" style={{ transform: "rotate(15deg)" }}>🌾</div>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden relative z-10"
        style={{ boxShadow: "0 24px 64px rgba(27,67,50,0.18)" }}>

        {/* ─── Left branding panel ─── */}
        <div className="hidden md:flex flex-col justify-between p-12 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #e9c46a 0%, transparent 50%)" }} />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center"
              style={{ background: "rgba(233,196,106,0.2)", border: "1px solid rgba(233,196,106,0.4)" }}>
              <Wheat size={32} style={{ color: "#e9c46a" }} />
            </div>
            <h1 className="text-4xl font-black mb-3 leading-tight">Farm to<br />Market.</h1>
            <p style={{ color: "rgba(255,255,255,0.8)" }} className="text-lg leading-relaxed">
              Fresh produce directly from verified Indian farmers. Transparent pricing, fair trade, and real connections.
            </p>
          </div>

          <div className="relative z-10 space-y-3 mt-8">
            {[
              { icon: "🌾", text: "Kisan-direct produce — no middlemen" },
              { icon: "💰", text: "Fair prices for farmers and buyers"  },
              { icon: "🤝", text: "Trusted platform for rural India"    },
              { icon: "🤖", text: "AI-powered price & demand insights"  },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right form panel ─── */}
        <div className="p-8 md:p-10 overflow-y-auto" style={{ background: "#fff", maxHeight: "95vh" }}>
          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: "#f5f0e8" }}>
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setRegMessage(""); }}
                className="flex-1 py-2.5 text-sm font-bold capitalize transition-all duration-200"
                style={tab === t
                  ? { background: "#2d6a4f", color: "#fff", borderRadius: 10 }
                  : { color: "#3d4f3e" }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ─── LOGIN ─── */}
            {tab === "login" && (
              <motion.div key="login"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-black mb-0.5" style={{ color: "#1b2e1e" }}>Welcome back 👋</h2>
                <p className="text-sm mb-5" style={{ color: "#3d4f3e" }}>Sign in to your account to continue.</p>
                <form onSubmit={onLoginSubmit} className="space-y-4">
                  <Field id="email"    name="email"    label="Email address" type="email" required />
                  <div className="flex flex-col gap-1 relative">
                    <label htmlFor="password" style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>Password *</label>
                    <input id="password" name="password" type={showPassword ? "text" : "password"}
                      required className="ag-input pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 bottom-3" style={{ color: "#7a8c7b" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {loginIsPending && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fef9c3", border: "1px solid #d4a017" }}>
                      <Clock size={18} style={{ color: "#854d0e", marginTop: 1 }} />
                      <p className="text-sm font-semibold" style={{ color: "#854d0e" }}>{loginError}</p>
                    </div>
                  )}
                  {loginError && !loginIsPending && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fee2e2", border: "1px solid #bc4749" }}>
                      <AlertTriangle size={18} style={{ color: "#991b1b", marginTop: 1 }} />
                      <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>{loginError}</p>
                    </div>
                  )}

                  <button type="submit" disabled={isLoginLoading} className="ag-btn w-full flex items-center justify-center gap-2">
                    {isLoginLoading && <Loader2 size={18} className="animate-spin" />}
                    {isLoginLoading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
                <p className="text-center text-sm mt-4" style={{ color: "#3d4f3e" }}>
                  No account?{" "}
                  <button onClick={() => setTab("register")} className="font-bold" style={{ color: "#2d6a4f" }}>Register here</button>
                </p>
              </motion.div>
            )}

            {/* ─── REGISTER ─── */}
            {tab === "register" && (
              <motion.div key="register"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                <h2 className="text-2xl font-black mb-0.5" style={{ color: "#1b2e1e" }}>Create Account</h2>
                <p className="text-sm mb-4" style={{ color: "#3d4f3e" }}>Join India's trusted farm marketplace.</p>

                {/* Role selector */}
                <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: "#f5f0e8" }}>
                  {(["buyer", "farmer"] as const).map(r => (
                    <button key={r} type="button" onClick={() => { setRole(r); setRegMessage(""); }}
                      className="flex-1 py-2 text-sm font-bold capitalize transition-all duration-200"
                      style={role === r
                        ? { background: "#e9c46a", color: "#1b2e1e", borderRadius: 10 }
                        : { color: "#3d4f3e" }}>
                      {r === "farmer" ? "🌾 I'm a Farmer" : "🧺 I'm a Buyer"}
                    </button>
                  ))}
                </div>

                <form onSubmit={onRegisterSubmit} className="space-y-3">
                  {/* ─── Common fields ─── */}
                  <Field id="reg-name"  name="name"     label="Full Name"      required />
                  <Field id="reg-email" name="email"    label="Email Address"   type="email" required />
                  <div className="flex flex-col gap-1 relative">
                    <label htmlFor="reg-pass" style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>Password *</label>
                    <input id="reg-pass" name="password" type={showPassword ? "text" : "password"}
                      required className="ag-input pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 bottom-3" style={{ color: "#7a8c7b" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <Field id="reg-phone"  name="phone"   label="Phone Number"    type="tel" required />
                  <Field id="reg-phone2" name="phone2"  label="Alternate Phone (optional)" type="tel" />

                  {/* ─── FARMER‑specific fields ─── */}
                  {role === "farmer" && (
                    <>
                      <hr style={{ borderColor: "#e8e0d0", margin: "4px 0" }} />
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2d6a4f" }}>Farm & Location Details</p>
                      <Field id="reg-address"  name="address"      label="Home Address"          required />
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="reg-village"  name="village"    label="Village / Town"         required />
                        <Field id="reg-district" name="district"   label="District"               required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="reg-state"    name="state"      label="State"                  required />
                        <Field id="reg-pincode"  name="pincode"    label="Pincode"                required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="reg-yrs"   name="yearsExp"   label="Years of Experience" type="number" />
                        <Field id="reg-size"  name="farmSize"   label="Farm Size (acres)"    type="number" />
                      </div>
                      <SelectField id="reg-type" name="farmingType" label="Type of Farming">
                        <option value="">Select type…</option>
                        <option value="organic">Organic Farming</option>
                        <option value="traditional">Traditional Farming</option>
                        <option value="mixed">Mixed Farming</option>
                        <option value="commercial">Commercial Farming</option>
                      </SelectField>
                      <Field id="reg-crops"  name="primaryCrops" label="Primary Crops (e.g. Rice, Wheat)" />
                      <Field id="reg-govtid" name="govtId"       label="Aadhaar / Govt ID Number" />
                      <div className="flex flex-col gap-1">
                        <label style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>Profile Photo (optional)</label>
                        <div className="ag-upload-zone p-4 text-center cursor-pointer">
                          <Upload size={20} className="mx-auto mb-1" style={{ color: "#2d6a4f" }} />
                          <p className="text-xs" style={{ color: "#7a8c7b" }}>Click to upload photo</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── BUYER‑specific fields ─── */}
                  {role === "buyer" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="buy-city"  name="city"  label="Your City"  required />
                        <Field id="buy-state" name="state" label="State"       required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label style={{ color: "#1b2e1e", fontSize: 13, fontWeight: 600 }}>Profile Photo (optional)</label>
                        <div className="ag-upload-zone p-4 text-center cursor-pointer">
                          <Upload size={20} className="mx-auto mb-1" style={{ color: "#2d6a4f" }} />
                          <p className="text-xs" style={{ color: "#7a8c7b" }}>Click to upload photo</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Messages */}
                  {regIsPending && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fef9c3", border: "1px solid #d4a017" }}>
                      <Clock size={18} style={{ color: "#854d0e", marginTop: 1 }} />
                      <p className="text-sm font-semibold" style={{ color: "#854d0e" }}>{regMessage}</p>
                    </div>
                  )}
                  {regIsSuccess && <p className="text-sm font-bold" style={{ color: "#2d6a4f" }}>{regMessage}</p>}
                  {regMessage && !regIsPending && !regIsSuccess && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fee2e2", border: "1px solid #bc4749" }}>
                      <AlertTriangle size={18} style={{ color: "#991b1b", marginTop: 1 }} />
                      <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>{regMessage}</p>
                    </div>
                  )}

                  <button type="submit" disabled={isRegLoading || regIsPending}
                    className="ag-btn w-full flex items-center justify-center gap-2 mt-1">
                    {isRegLoading && <Loader2 size={18} className="animate-spin" />}
                    {isRegLoading ? "Creating…" : role === "farmer" ? <><Leaf size={16} />Create Farmer Account</> : "🧺 Create Buyer Account"}
                  </button>
                </form>

                <p className="text-center text-sm mt-4" style={{ color: "#3d4f3e" }}>
                  Already have an account?{" "}
                  <button onClick={() => setTab("login")} className="font-bold" style={{ color: "#2d6a4f" }}>Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
