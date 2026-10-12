"use server";

import { requireBillAction } from "../loaders/require-bill-access";
import { getBillPreviewUrl } from "../services/bill-preview-url";

interface GeneratePreviewUrlResult {
  success: boolean;
  url?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export async function generatePreviewUrl(
  billId: string
): Promise<GeneratePreviewUrlResult> {
  await requireBillAction(billId);

  try {
    return { success: true, ...(await getBillPreviewUrl(billId)) };
  } catch (error) {
    console.error("Error generating preview URL:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
