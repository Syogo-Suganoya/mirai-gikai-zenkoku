import "server-only";

import type { BillContent } from "../../shared/types/bill-contents";
import { findBillContentsByBillId } from "../repositories/bill-edit-repository";

/** 議案の解説（ふつう・くわしく）。権限はページ側（requireBillPage）で確かめる */
export async function getBillContents(billId: string): Promise<BillContent[]> {
  return findBillContentsByBillId(billId);
}
