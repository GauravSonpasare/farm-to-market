import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useLocation } from "wouter"
import { useAuth } from "../hooks/use-auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Wheat, Loader2, Clock, AlertTriangle } from "lucide-react"

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const [, setLocation] = useLocation()

  // Form states
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegLoading, setIsRegLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginIsPending, setLoginIsPending] = useState(false)
  const [regMessage, setRegMessage] = useState("")
  const [regIsSuccess, setRegIsSuccess] = useState(false)
  const [regIsPending, setRegIsPending] = useState(false)

  const PENDING_KEYWORD = "pending admin approval"

  const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoginLoading(true)
    setLoginError("")
    setLoginIsPending(false)
    const fd = new FormData(e.currentTarget)
    try {
      await login({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      })
      // Redirect handled by useEffect watching user
    } catch (err: any) {
      const msg: string = err.message || "Failed to login"
      if (msg.toLowerCase().includes(PENDING_KEYWORD)) {
        setLoginIsPending(true)
      }
      setLoginError(msg)
    } finally {
      setIsLoginLoading(false)
    }
  }

  const onRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsRegLoading(true)
    setRegMessage("")
    setRegIsSuccess(false)
    setRegIsPending(false)
    const fd = new FormData(e.currentTarget)
    const role = fd.get("role") as string
    try {
      await register({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        role: role as "farmer" | "buyer",
        phone: fd.get("phone") as string,
        location: fd.get("location") as string,
      })
      // Buyer is auto-logged in (useEffect below will redirect)
      // Farmer is pending — show clear message
      if (role === "farmer") {
        setRegIsPending(true)
        setRegMessage(
          "Your farmer account has been created! It is currently pending admin approval. You will be able to login once an admin reviews and approves your account."
        )
      } else {
        setRegIsSuccess(true)
        setRegMessage("Account created! Logging you in…")
      }
    } catch (err: any) {
      setRegMessage(err.message || "Failed to register")
    } finally {
      setIsRegLoading(false)
    }
  }

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === "admin") setLocation("/admin")
      else if (user.role === "farmer") setLocation("/farmer")
      else if (user.role === "buyer") setLocation("/buyer")
    }
  }, [user, setLocation])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background Decorative */}
      <div className="absolute inset-0 bg-green-50/50 clip-path-slant pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden relative z-10"
      >
        {/* Left Side: Branding / Info */}
        <div className="bg-green-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <Wheat className="h-16 w-16 mb-6 text-green-200" />
            <h1 className="text-4xl font-bold mb-4">Farm to Market.</h1>
            <p className="text-green-100 text-lg">
              Fresh produce directly from the source. Transparent pricing, fair
              trade, and local connections.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="p-8 md:p-12">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* ── Login Form ── */}
              <TabsContent value="login">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle>Welcome back</CardTitle>
                      <CardDescription>
                        Enter your credentials to access your dashboard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={onLoginSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                          />
                        </div>

                        {/* ── Pending approval banner ── */}
                        {loginIsPending && (
                          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                            <Clock className="mt-0.5 shrink-0 text-amber-500" size={18} />
                            <p className="text-sm text-amber-800 font-medium">
                              {loginError}
                            </p>
                          </div>
                        )}

                        {/* ── Generic error ── */}
                        {loginError && !loginIsPending && (
                          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
                            <p className="text-sm text-red-700">{loginError}</p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoginLoading}
                        >
                          {isLoginLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Sign In
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ── Register Form ── */}
              <TabsContent value="register">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle>Create an account</CardTitle>
                      <CardDescription>
                        Join the community as a buyer or sell your produce.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <form onSubmit={onRegisterSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-name">Full Name</Label>
                          <Input id="reg-name" name="name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Email</Label>
                          <Input id="reg-email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-password">Password</Label>
                          <Input
                            id="reg-password"
                            name="password"
                            type="password"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">I want to...</Label>
                          <select
                            id="role"
                            name="role"
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                            required
                          >
                            <option value="buyer">Buy farm-fresh produce</option>
                            <option value="farmer">Sell my crops</option>
                          </select>
                        </div>

                        {/* ── Pending registration message ── */}
                        {regIsPending && regMessage && (
                          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                            <Clock className="mt-0.5 shrink-0 text-amber-500" size={18} />
                            <p className="text-sm text-amber-800 font-medium">{regMessage}</p>
                          </div>
                        )}

                        {/* ── Success message (buyer auto-login) ── */}
                        {regIsSuccess && regMessage && (
                          <p className="text-sm font-medium text-green-600">{regMessage}</p>
                        )}

                        {/* ── Generic error message ── */}
                        {regMessage && !regIsPending && !regIsSuccess && (
                          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
                            <p className="text-sm text-red-700">{regMessage}</p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isRegLoading || regIsPending}
                        >
                          {isRegLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Create Account
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}
