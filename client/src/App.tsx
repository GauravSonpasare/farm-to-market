import { Route, Switch } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/protected-route";

// Pages
import LandingPage from "./pages/landing-page";
import AuthPage from "./pages/auth-page";
import AdminDashboard from "./pages/dashboards/admin-dashboard";
import FarmerDashboard from "./pages/dashboards/farmer-dashboard";
import BuyerDashboard from "./pages/dashboards/buyer-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />

      {/*
        Role-Protected Routes — use wildcard `:rest*` so that sub-paths like
        /admin/users, /buyer/orders, /farmer/listings etc. are all caught here
        and forwarded into the nested <Switch> inside each dashboard component.
      */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]} component={AdminDashboard} />
      </Route>
      <Route path="/admin/*">
        <ProtectedRoute allowedRoles={["admin"]} component={AdminDashboard} />
      </Route>

      <Route path="/farmer">
        <ProtectedRoute allowedRoles={["farmer"]} component={FarmerDashboard} />
      </Route>
      <Route path="/farmer/*">
        <ProtectedRoute allowedRoles={["farmer"]} component={FarmerDashboard} />
      </Route>

      <Route path="/buyer">
        <ProtectedRoute allowedRoles={["buyer"]} component={BuyerDashboard} />
      </Route>
      <Route path="/buyer/*">
        <ProtectedRoute allowedRoles={["buyer"]} component={BuyerDashboard} />
      </Route>

      <Route>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
          <h1 className="text-6xl font-black text-slate-300 mb-4">404</h1>
          <p className="text-xl font-semibold">Page Not Found</p>
          <a href="/" className="mt-6 text-green-600 underline underline-offset-4">Go back home</a>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
