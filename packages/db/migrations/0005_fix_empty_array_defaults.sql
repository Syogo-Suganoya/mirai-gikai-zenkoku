ALTER TABLE "interview_opinion" ALTER COLUMN "reasoning_types" SET DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "mirai_stances" ALTER COLUMN "reason_points" SET DEFAULT '{}'::text[];--> statement-breakpoint
-- 誤った既定値（空文字1つの配列）で入った行を空配列に戻す
UPDATE "interview_opinion" SET "reasoning_types" = '{}'::text[] WHERE "reasoning_types" = '{""}'::text[];--> statement-breakpoint
UPDATE "mirai_stances" SET "reason_points" = '{}'::text[] WHERE "reason_points" = '{""}'::text[];
