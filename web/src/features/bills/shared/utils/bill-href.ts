import type { Route } from "next";
import { routes } from "@/lib/routes";
import { billKey } from "../types";

type BillRef = { id: string; slug: string | null; assembly_slug: string };

/** 議案詳細ページの URL（議会のスラッグ＋議案の slug か id） */
export function billDetailHref(bill: BillRef): Route {
  return routes.billDetail(bill.assembly_slug, billKey(bill)) as Route;
}
