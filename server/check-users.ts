import { db } from "./db";
import { users } from "./shim-schema";

async function checkUsers() {
    const allUsers = await db.select().from(users);
    console.log("USERS_START");
    console.log(JSON.stringify(allUsers, null, 2));
    console.log("USERS_END");
    process.exit(0);
}

checkUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
