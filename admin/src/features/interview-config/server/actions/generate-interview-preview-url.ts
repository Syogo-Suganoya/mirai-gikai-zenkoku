"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getBillPreviewUrl } from "@/features/bills/server/services/bill-preview-url";

interface GenerateInterviewPreviewUrlResult {
  success: boolean;
  url?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export async function generateInterviewPreviewUrl(
  billId: string
): Promise<GenerateInterviewPreviewUrlResult> {
  await requireAdmin();

  try {
    return {
      success: true,
      ...(await getBillPreviewUrl(billId, "/interview")),
    };
  } catch (error) {
    console.error("Error generating interview preview URL:", error);
    return {
      success: false,
      error: "予期しないエラーが発生しました",
    };
  }
}
