import "server-only";

// The storefront's identity seam. Auth has shipped: identity now comes from the
// logged-in session (a "web"-channel username), resolved through the SAME
// resolveLinkedCustomer path every channel uses — there is no parallel identity
// logic. This replaced the hardcoded single-customer DEMO_IDENTITY that existed
// while login was deferred (ARCHITECTURE §5).
//
// session username  →  web account-link  →  customerId
export { getIdentity, requireIdentity, type WebIdentity } from "../auth/session";
