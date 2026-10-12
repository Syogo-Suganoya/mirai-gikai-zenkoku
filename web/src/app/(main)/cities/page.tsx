import type { Metadata } from "next";
import { AssemblyKindComingSoonPage } from "@/features/assemblies/server/components/assembly-kind-coming-soon-page";

export const metadata: Metadata = { title: "市の議会" };

export default function CityAssembliesPage() {
  return <AssemblyKindComingSoonPage label="市" />;
}
