ALTER TABLE "topic" DROP CONSTRAINT "topic_parent_same_version_fkey";
--> statement-breakpoint
ALTER TABLE "topic" ADD CONSTRAINT "topic_parent_same_version_fkey" FOREIGN KEY ("version_id","parent_topic_id") REFERENCES "public"."topic"("version_id","id") ON DELETE cascade ON UPDATE no action;