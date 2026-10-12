"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AssemblyKindNav } from "@/features/assemblies/client/components/assembly-kind-nav";
import { FuriganaToggle } from "@/lib/furigana/furigana-toggle";

export function HamburgerMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50" align="end">
        {/* 広い画面ではヘッダーに出している */}
        <AssemblyKindNav className="mb-3 flex-col border-b pb-3 sm:hidden" />
        <FuriganaToggle />
      </PopoverContent>
    </Popover>
  );
}
