import type { Bill, BillInsert } from "../types";

/**
 * 議案データから複製用のinsertデータを生成する
 * ID・タイムスタンプ・生成列を除去し、名前と議案番号に「(複製)」を付与、公開状態をdraftに設定。
 * 議案番号は会期内で一意なので、そのままでは同じ会期に複製できない。
 * 確認者・公開日時・ダミーの目印は引き継がない。
 */
export function prepareBillForDuplication(originalBill: Bill): BillInsert {
  const {
    id: _,
    created_at: __,
    updated_at: ___,
    status_order: ____,
    publish_status_order: _____,
    slug: ______,
    ...billWithoutId
  } = originalBill;

  return {
    ...billWithoutId,
    slug: null,
    name: `${originalBill.name} (複製)`,
    bill_number: `${originalBill.bill_number} (複製)`,
    publish_status: "draft",
    published_at: null,
    is_review_completed: false,
    reviewed_by: null,
    reviewed_at: null,
    is_dummy: false,
  };
}

/**
 * 議案コンテンツ配列から複製用のデータを生成する
 * IDを除去し、新しいbill_idを設定
 */
export function prepareBillContentsForDuplication<
  T extends { id: string; bill_id: string },
>(
  contents: T[],
  newBillId: string
): (Omit<T, "id" | "bill_id"> & { bill_id: string })[] {
  return contents.map((content) => {
    const { id: _, bill_id: __, ...contentData } = content;
    return {
      ...contentData,
      bill_id: newBillId,
    };
  });
}
