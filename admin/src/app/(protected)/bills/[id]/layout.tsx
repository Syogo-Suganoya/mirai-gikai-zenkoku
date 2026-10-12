import type { ReactNode } from "react";
import { requireBillPage } from "@/features/bills/server/loaders/require-bill-access";

/** 議案の画面は、議案の議会を担当している人だけが開ける */
export default async function BillLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireBillPage((await params).id);
  return children;
}
