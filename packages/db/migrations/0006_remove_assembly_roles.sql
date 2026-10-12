DROP TABLE "assembly_members" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_super_admin";--> statement-breakpoint
DROP TYPE "public"."assembly_member_role_enum";