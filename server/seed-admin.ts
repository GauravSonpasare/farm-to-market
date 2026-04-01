import { db } from "./db";
import { users } from "./shim-schema";
import bcrypt from "bcryptjs";

async function seedAdmin() {
    const adminEmail = "admin@farm.com";
    const adminPassword = "adminpassword123";

    const hash = await bcrypt.hash(adminPassword, 12);

    await db.insert(users).values({
        name: "System Admin",
        email: adminEmail,
        password: hash,
        role: "admin",
        status: "approved",
    });

    console.log("ADMIN_SEEDED");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
