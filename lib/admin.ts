import { currentUser } from "@/lib/auth";
export function adminAddresses() { return new Set((process.env.ADMIN_WALLET_ADDRESSES || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)); }
export async function currentAdmin() { const user = await currentUser(); return user && adminAddresses().has(user.address.toLowerCase()) ? user : null; }
