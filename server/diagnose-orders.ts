import { db } from "./db";
import { orders, crops, users } from "./shim-schema";

async function diagnose() {
    const allOrders = await db.select().from(orders);
    const allCrops = await db.select().from(crops);
    const allUsers = await db.select().from(users);

    console.log("DIAGNOSTIC_START");
    
    console.log(`Total Orders: ${allOrders.length}`);
    allOrders.forEach(o => {
        console.log(`Order ID: ${o.id}, FarmerID (in Order): ${o.farmerId}, BuyerID: ${o.buyerId}, Status: ${o.status}`);
    });

    console.log(`Total Crops: ${allCrops.length}`);
    allCrops.forEach(c => {
        console.log(`Crop ID: ${c.id}, FarmerID (in Crop): ${c.farmerId}, Name: ${c.name}, Status: ${c.status}`);
    });

    console.log(`Total Users: ${allUsers.length}`);
    allUsers.forEach(u => {
        console.log(`User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
    });

    console.log("DIAGNOSTIC_END");
    process.exit(0);
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
