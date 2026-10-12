"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export function ConsentCheckListItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Image
        src="/icons/check-circle.svg"
        alt=""
        width={20}
        height={20}
        className="flex-shrink-0 mt-1"
      />
      <p className="text-sm font-medium leading-relaxed">{children}</p>
    </div>
  );
}
