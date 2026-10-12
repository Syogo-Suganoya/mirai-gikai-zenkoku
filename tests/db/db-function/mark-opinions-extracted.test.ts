import { uuidArray } from "@mirai-gikai/db";
import { inArray, sql } from "@mirai-gikai/db/orm";
import { interview_opinion } from "@mirai-gikai/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestInterviewData,
  createTestInterviewReport,
  createTestUser,
  db,
  type TestUser,
} from "../utils";

let user: TestUser;
let billId: string;
let reportId: string;
const opinionIds: string[] = [];

async function insertOpinion(index: number): Promise<string> {
  const [row] = await db
    .insert(interview_opinion)
    .values({
      interview_report_id: reportId,
      opinion_index: index,
      title: `意見${index}`,
      content: `内容${index}`,
    })
    .returning({ id: interview_opinion.id });
  return row.id;
}

async function extractedAtById(): Promise<Map<string, string | null>> {
  const data = await db
    .select({
      id: interview_opinion.id,
      topic_extracted_at: interview_opinion.topic_extracted_at,
    })
    .from(interview_opinion)
    .where(inArray(interview_opinion.id, opinionIds));
  return new Map(data.map((r) => [r.id, r.topic_extracted_at]));
}

function markExtracted(ids: string[], at: string) {
  return db.execute(
    sql`select mark_opinions_extracted(${uuidArray(ids)}, ${at}::timestamptz)`
  );
}

describe("mark_opinions_extracted()", () => {
  beforeAll(async () => {
    user = await createTestUser();
    const { bill, session } = await createTestInterviewData(user.id);
    billId = bill.id;
    reportId = (await createTestInterviewReport(session.id)).id;
    opinionIds.push(await insertOpinion(0));
    opinionIds.push(await insertOpinion(1));
    opinionIds.push(await insertOpinion(2));
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(user.id);
  });

  it("指定した意見だけ topic_extracted_at を一括更新し、他は触らない", async () => {
    const at = "2026-06-16T00:00:00Z";
    await markExtracted([opinionIds[0], opinionIds[1]], at);

    const map = await extractedAtById();
    // 指定した2件は更新される
    expect(new Date(map.get(opinionIds[0]) ?? 0).getTime()).toBe(
      new Date(at).getTime()
    );
    expect(new Date(map.get(opinionIds[1]) ?? 0).getTime()).toBe(
      new Date(at).getTime()
    );
    // 指定していない1件は null のまま
    expect(map.get(opinionIds[2])).toBeNull();
  });

  it("空配列では何も更新しない", async () => {
    await markExtracted([], "2026-06-16T01:00:00Z");
    const map = await extractedAtById();
    // 3件目は依然 null（影響を受けない）
    expect(map.get(opinionIds[2])).toBeNull();
  });
});
