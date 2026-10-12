import { unstable_noStore as noStore } from "next/cache";
import type { Admin } from "../../shared/types";
import { findAdminUsers } from "../repositories/admin-repository";

export async function loadAdmins(): Promise<Admin[]> {
  noStore();
  return findAdminUsers();
}
