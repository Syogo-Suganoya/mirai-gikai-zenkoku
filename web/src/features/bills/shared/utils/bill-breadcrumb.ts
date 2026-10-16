import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";

/** 議案の詳細のパン屑（議会 > 会期 > 議案番号）。会期が見つからなければ会期を飛ばす */
export function billBreadcrumbItems(
  assembly: { slug: string; name: string },
  sessions: readonly {
    id: string;
    name: string;
    slug: string | null;
    session_key: string;
  }[],
  bill: { session_id: string; bill_number: string }
): BreadcrumbItem[] {
  const session = sessions.find((s) => s.id === bill.session_id);
  return [
    { label: assembly.name, href: routes.assemblyTop(assembly.slug) },
    ...(session
      ? [
          {
            label: session.name,
            href: routes.sessionBills(
              assembly.slug,
              session.slug ?? session.session_key
            ),
          },
        ]
      : []),
    { label: bill.bill_number },
  ];
}
