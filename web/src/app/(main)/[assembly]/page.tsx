import type { Metadata } from "next";
import { AssemblyTopPage } from "@/features/assemblies/server/components/assembly-top-page";
import { requireAssembly } from "@/features/assemblies/server/loaders/get-assembly";

type Props = {
  params: Promise<{ assembly: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const assembly = await requireAssembly((await params).assembly);
  return {
    title: assembly.name,
    description: `${assembly.name}で審議されている議案を、わかりやすく紹介します。`,
  };
}

export default async function AssemblyPage({ params }: Props) {
  const assembly = await requireAssembly((await params).assembly);
  return <AssemblyTopPage assembly={assembly} />;
}
