import { resetShopDb } from "../shop/store.js";

const dbPath = await resetShopDb();
console.log(`Reset shop database at ${dbPath}`);
