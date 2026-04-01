import { Route, Switch, Redirect } from "wouter";
import { FarmerLayout } from "./farmer/layout";
import FarmerHome from "./farmer/home";
// We'll build these placeholders next:
import FarmerUpload from "./farmer/upload-crop";
import FarmerListings from "./farmer/my-listings";
import FarmerWeather from "./farmer/weather";
import FarmerSchemes from "./farmer/schemes";
import FarmerOrders from "./farmer/orders";
import FarmerPaymentHistory from "./farmer/payment-history";
import FarmerMarketPrices from "./farmer/market-prices";

export default function FarmerDashboard() {
  return (
    <FarmerLayout>
      <Switch>
        <Route path="/farmer" component={FarmerHome} />
        <Route path="/farmer/upload" component={FarmerUpload} />
        <Route path="/farmer/listings" component={FarmerListings} />
        <Route path="/farmer/weather" component={FarmerWeather} />
        <Route path="/farmer/schemes" component={FarmerSchemes} />
        <Route path="/farmer/orders" component={FarmerOrders} />
        <Route path="/farmer/payments" component={FarmerPaymentHistory} />
        <Route path="/farmer/market" component={FarmerMarketPrices} />
        
        {/* Redirect standalone chat requests to the Orders tab where Chat is integrated */}
        <Route path="/farmer/chat">
          <Redirect to="/farmer/orders" />
        </Route>
      </Switch>
    </FarmerLayout>
  );
}
