"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { webBillPath } from "@/lib/utils/web-bill-paths";

interface ViewButtonProps {
  assemblySlug: string;
  /** 議案の slug（無ければ id） */
  billKey: string;
}

export function ViewButton({ assemblySlug, billKey }: ViewButtonProps) {
  const billUrl = `${env.webUrl}${webBillPath(assemblySlug, billKey)}`;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(billUrl, "_blank")}
    >
      <ExternalLink className="h-4 w-4" />
      公開ページ
    </Button>
  );
}
