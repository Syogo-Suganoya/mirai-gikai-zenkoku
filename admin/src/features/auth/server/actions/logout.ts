"use server";

import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { endSession } from "../lib/session";

export async function logout() {
  await endSession();
  redirect(routes.login());
}
