import type { Metadata } from "next";
import { SITE_NAME } from "@/config/site";
import { PrivacyPolicyPage } from "@/features/legal/server/components/privacy-policy-page";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシー`,
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
