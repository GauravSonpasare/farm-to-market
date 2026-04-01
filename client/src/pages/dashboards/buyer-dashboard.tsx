import { Route, Switch, Redirect } from "wouter";
import { BuyerLayout } from "./buyer/layout";
import BuyerHome from "./buyer/home";
import BrowseCrops from "./buyer/browse-crops";
import CropDetail from "./buyer/crop-detail";
import MyOrders from "./buyer/my-orders";
import BuyerPaymentHistory from "./buyer/payment-history";

export default function BuyerDashboard() {
  return (
    <BuyerLayout>
      <Switch>
        <Route path="/buyer" component={BuyerHome} />
        <Route path="/buyer/browse" component={BrowseCrops} />
        <Route path="/buyer/crops/:id" component={CropDetail} />
        <Route path="/buyer/orders" component={MyOrders} />
        <Route path="/buyer/payments" component={BuyerPaymentHistory} />

        {/* Redirect standalone chat requests to the Orders tab where Chat is integrated */}
        <Route path="/buyer/chat">
          <Redirect to="/buyer/orders" />
        </Route>
        <Route path="/buyer/ratings">
          <div className="p-8"><h1 className="text-2xl font-bold">My Ratings & Feedback (Working in Progress)</h1></div>
        </Route>
      </Switch>
    </BuyerLayout>
  );
}
