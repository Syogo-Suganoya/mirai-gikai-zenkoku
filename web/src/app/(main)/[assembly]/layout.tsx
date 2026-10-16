import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DummyDataBanner } from "@/features/assemblies/server/components/dummy-data-banner";
import { requireAssembly } from "@/features/assemblies/server/loaders/get-assembly";

type Props = {
  children: ReactNode;
  params: Promise<{ assembly: string }>;
};

/** ダミーの議案がある議会は検索エンジンに載せない */
export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const assembly = await requireAssembly((await params).assembly);
  return assembly.hasDummy ? { robots: { index: false, follow: false } } : {};
}

export default async function AssemblyLayout({ children, params }: Props) {
  const assembly = await requireAssembly((await params).assembly);
  return (
    <>
      {assembly.hasDummy && <DummyDataBanner />}
      {children}
    </>
  );
}
