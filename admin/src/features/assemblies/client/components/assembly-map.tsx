"use client";

import { prefectureAssemblyByCode } from "@mirai-gikai/shared/prefectures";
import {
  JAPAN_MAP_ATTRIBUTION,
  JAPAN_MAP_OKINAWA_DIVIDER,
  JAPAN_MAP_SHAPES,
  JAPAN_MAP_VIEWBOX,
} from "@mirai-gikai/shared/prefectures/japan-map";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, useRef, useState } from "react";
import { routes } from "@/lib/routes";
import type { AssemblyListItem } from "../../shared/types";
import {
  type AssemblyMapState,
  assemblyMapLabel,
  toAssemblyMapState,
} from "../../shared/utils/assembly-map-state";

const FILL_CLASSES: Record<AssemblyMapState, string> = {
  real: "fill-blue-600 hover:fill-blue-800 cursor-pointer",
  dummy: "fill-blue-200 hover:fill-blue-400 cursor-pointer",
  empty: "fill-gray-300 hover:fill-gray-400 cursor-pointer",
  none: "fill-gray-100",
};

const LEGENDS: { state: AssemblyMapState; className: string; label: string }[] =
  [
    { state: "real", className: "bg-blue-600", label: "実データあり" },
    { state: "dummy", className: "bg-blue-200", label: "ダミーのみ" },
    { state: "empty", className: "bg-gray-300", label: "議案なし" },
  ];

type Tooltip = { label: string; x: number; y: number };

/**
 * 都道府県議会の日本地図（議会一覧の上に出す）。都道府県を押すとその議会の議案一覧を開く。
 * 議会が登録されていない都道府県は押せない。
 */
export function AssemblyMap({
  assemblies,
}: {
  assemblies: AssemblyListItem[];
}) {
  const router = useRouter();
  const figureRef = useRef<HTMLElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const byCode = prefectureAssemblyByCode(assemblies);

  const open = (code: string) => {
    const assembly = byCode[code];
    if (assembly) router.push(routes.assemblyBills(assembly.slug) as Route);
  };

  const onKeyDown = (code: string) => (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(code);
    }
  };

  const onMouseMove = (label: string) => (event: MouseEvent) => {
    const rect = figureRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      label,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <figure
      ref={figureRef}
      className="relative space-y-2 rounded-md border bg-white p-4"
    >
      <svg
        viewBox={JAPAN_MAP_VIEWBOX}
        role="group"
        aria-label="日本地図（都道府県を押すと、その議会の議案一覧を開きます）"
        className="mx-auto h-auto w-full max-h-[480px]"
        onMouseLeave={() => setTooltip(null)}
      >
        {JAPAN_MAP_SHAPES.map((prefecture) => {
          const assembly = byCode[prefecture.code];
          const state = toAssemblyMapState(assembly);
          const label = assembly
            ? assemblyMapLabel(assembly)
            : `${prefecture.name}（議会なし）`;
          return (
            <path
              key={prefecture.code}
              d={prefecture.path}
              role="link"
              tabIndex={assembly ? 0 : -1}
              aria-label={assembly ? `${label}を開く` : label}
              aria-disabled={!assembly}
              onClick={() => open(prefecture.code)}
              onKeyDown={onKeyDown(prefecture.code)}
              onMouseMove={onMouseMove(label)}
              className={`stroke-white stroke-[0.6] outline-none transition-colors focus-visible:fill-blue-800 ${FILL_CLASSES[state]}`}
            />
          );
        })}
        {/* 沖縄県の差し込み（左上）と本土の区切り線 */}
        <path
          d={JAPAN_MAP_OKINAWA_DIVIDER}
          aria-hidden
          className="pointer-events-none fill-none stroke-gray-300 stroke-[1.2]"
        />
      </svg>
      {tooltip && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          {tooltip.label}
        </span>
      )}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGENDS.map((legend) => (
            <Legend key={legend.state} {...legend} />
          ))}
          <Legend className="bg-gray-100 border" label="議会なし" />
        </span>
        <span className="text-[11px] text-gray-400">
          地図: {JAPAN_MAP_ATTRIBUTION.author}「
          <a
            href={JAPAN_MAP_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {JAPAN_MAP_ATTRIBUTION.title}
          </a>
          」（
          <a
            href={JAPAN_MAP_ATTRIBUTION.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {JAPAN_MAP_ATTRIBUTION.license}
          </a>
          ）を加工
        </span>
      </figcaption>
    </figure>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${className}`} aria-hidden />
      {label}
    </span>
  );
}
