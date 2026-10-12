-- 0000 で正規表現のバックスラッシュが落ちていたのを直す（\s が s、\d が d になっていた）。
-- メールアドレスに s を含むユーザーを作れず、内容の充実度の合計（total_content_richness）が常に null になっていた。

ALTER TABLE "users" DROP CONSTRAINT "users_email_check";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_check" CHECK (email ~ '^[^@\s]+@[^@\s]+$'::text);--> statement-breakpoint
ALTER TABLE "interview_report" DROP COLUMN "total_content_richness";--> statement-breakpoint
ALTER TABLE "interview_report" ADD COLUMN "total_content_richness" integer GENERATED ALWAYS AS (
CASE
    WHEN ((content_richness IS NOT NULL) AND ((content_richness ->> 'total'::text) IS NOT NULL) AND ((content_richness ->> 'total'::text) ~ '^\d+$'::text)) THEN ((content_richness ->> 'total'::text))::integer
    ELSE NULL::integer
END) STORED;
--> statement-breakpoint
CREATE INDEX "idx_interview_report_total_content_richness" ON "interview_report" USING btree ("total_content_richness" DESC NULLS LAST);
