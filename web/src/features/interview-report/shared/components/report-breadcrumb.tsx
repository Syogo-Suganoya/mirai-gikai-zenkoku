import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";

interface ReportBreadcrumbProps {
  assemblySlug: string;
  billKey: string;
  reportHref?: string;
  additionalItems?: BreadcrumbItem[];
}

export function ReportBreadcrumb({
  assemblySlug,
  billKey,
  reportHref,
  additionalItems = [],
}: ReportBreadcrumbProps) {
  const baseItems: BreadcrumbItem[] = [
    { label: "TOP", href: routes.home() },
    { label: "法案詳細", href: getBillDetailLink(assemblySlug, billKey) },
    { label: "レポート一覧", href: routes.billOpinions(assemblySlug, billKey) },
    {
      label: "レポート",
      href: reportHref,
    },
  ];

  return <Breadcrumb items={[...baseItems, ...additionalItems]} />;
}
