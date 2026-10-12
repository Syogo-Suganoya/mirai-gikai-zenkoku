import type { Metadata } from "next";
import { AssemblyKindComingSoonPage } from "@/features/assemblies/server/components/assembly-kind-coming-soon-page";

export const metadata: Metadata = { title: "区町村の議会" };

export default function TownAssembliesPage() {
  return <AssemblyKindComingSoonPage label="区町村" />;
}
