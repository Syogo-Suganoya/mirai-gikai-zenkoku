import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import {
  getBillDetailLink,
  getInterviewLPLink,
} from "../utils/interview-links";

interface DisclosureBreadcrumbProps {
  assemblySlug: string;
  billId: string;
  previewToken?: string;
}

export function DisclosureBreadcrumb({
  assemblySlug,
  billId,
  previewToken,
}: DisclosureBreadcrumbProps) {
  const items = [
    { label: "TOP", href: routes.home() },
    {
      label: "法案詳細",
      href: getBillDetailLink(assemblySlug, billId, previewToken),
    },
    {
      label: "AIインタビュー",
      href: getInterviewLPLink(assemblySlug, billId, previewToken),
    },
    { label: "情報開示" },
  ];

  return <Breadcrumb items={items} />;
}
