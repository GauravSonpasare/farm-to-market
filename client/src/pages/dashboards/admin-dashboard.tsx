import { Route, Switch } from "wouter";
import { AdminLayout } from "./admin/layout";
import AdminUsers from "./admin/users";
import AdminCrops from "./admin/crops";
import AdminComplaints from "./admin/complaints";
import AdminAnalytics from "./admin/analytics";
import AdminMarketPrices from "./admin/market-prices";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminAnalytics} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/crops" component={AdminCrops} />
        <Route path="/admin/complaints" component={AdminComplaints} />
        <Route path="/admin/market" component={AdminMarketPrices} />
        
        {/* Fallbacks */}
        <Route path="/admin/orders">
          <div className="p-8"><h1 className="text-2xl font-bold">Orders (Coming Soon)</h1></div>
        </Route>
        <Route path="/admin/payments">
          <div className="p-8"><h1 className="text-2xl font-bold">Payments (Coming Soon)</h1></div>
        </Route>
        <Route path="/admin/notifications">
          <div className="p-8"><h1 className="text-2xl font-bold">Notifications (Coming Soon)</h1></div>
        </Route>
      </Switch>
    </AdminLayout>
  );
}
