import { resetCommerceDb } from "../commerce/store.js";

const dbPath = await resetCommerceDb();
console.log(`Reset commerce database at ${dbPath}`);
