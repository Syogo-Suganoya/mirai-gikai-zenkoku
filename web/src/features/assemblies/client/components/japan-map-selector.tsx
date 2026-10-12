"use client";

import { PREFECTURES, REGIONS } from "@mirai-gikai/shared/prefectures";
import {
  JAPAN_MAP_ATTRIBUTION,
  JAPAN_MAP_SHAPES,
  JAPAN_MAP_VIEWBOX,
} from "@mirai-gikai/shared/prefectures/japan-map";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type { AssemblySummary } from "../../shared/types";
import {
  type PrefectureMapState,
  toPrefectureMapState,
} from "../../shared/utils/prefecture-map-state";

/** 地図の塗り */
const FILL_CLASSES: Record<PrefectureMapState, string> = {
  real: "fill-primary hover:fill-primary-accent cursor-pointer",
  dummy: "fill-mirai-dummy-border hover:fill-primary-accent cursor-pointer",
  none: "fill-mirai-surface-muted",
};

type Props = {
  /** 都道府県コードごとの都道府県議会（公開中の議案がある議会だけ） */
  assemblyByPrefecture: Record<string, AssemblySummary>;
};

type Tooltip = { name: string; x: number; y: number };

/**
 * 日本地図・地方ごとのボタンから、都道府県議会のページを開く。
 * 地図は細かくて押しにくい県もあるので、地方ごとのボタンでも開けるようにする。
 */
export function JapanMapSelector({ assemblyByPrefecture }: Props) {
  const router = useRouter();
  const figureRef = useRef<HTMLElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const open = (code: string) => {
    const assembly = assemblyByPrefecture[code];
    if (assembly) router.push(routes.assemblyTop(assembly.slug) as Route);
  };

  const onKeyDown = (code: string) => (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(code);
    }
  };

  const onMouseMove = (name: string) => (event: MouseEvent) => {
    const rect = figureRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      name,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <figure ref={figureRef} className="relative flex flex-col gap-2">
        <svg
          viewBox={JAPAN_MAP_VIEWBOX}
          role="group"
          aria-label="日本地図（議案のある都道府県を押すと、その議会のページを開きます）"
          className="h-auto w-full max-h-[560px]"
          onMouseLeave={() => setTooltip(null)}
        >
          {JAPAN_MAP_SHAPES.map((prefecture) => {
            const state = toPrefectureMapState(
              assemblyByPrefecture[prefecture.code]
            );
            const openable = state !== "none";
            return (
              <path
                key={prefecture.code}
                d={prefecture.path}
                role="link"
                tabIndex={openable ? 0 : -1}
                aria-label={
                  openable ? `${prefecture.name}議会を開く` : prefecture.name
                }
                aria-disabled={!openable}
                onClick={() => open(prefecture.code)}
                onKeyDown={onKeyDown(prefecture.code)}
                onMouseMove={onMouseMove(prefecture.name)}
                className={`stroke-white stroke-[0.6] outline-none transition-colors focus-visible:fill-primary-accent ${FILL_CLASSES[state]}`}
              />
            );
          })}
        </svg>
        {tooltip && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-mirai-text px-2 py-1 text-xs font-bold text-white shadow"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            {tooltip.name}
          </span>
        )}
        <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mirai-text-secondary">
          <Legend className="bg-primary" label="議案あり" />
          <Legend
            className="bg-mirai-dummy-border"
            label="表示確認用のダミーのみ"
          />
          <Legend className="bg-mirai-surface-muted" label="準備中" />
        </figcaption>
      </figure>

      {/* 地方ごとのボタン（地図で押しにくい県のため） */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-mirai-text">地方から選ぶ</h2>
        <dl className="flex flex-col gap-2">
          {REGIONS.map((region) => (
            <div key={region} className="flex flex-col gap-1.5 sm:flex-row">
              <dt className="w-24 shrink-0 pt-1 text-xs font-bold text-mirai-text-secondary">
                {region}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {PREFECTURES.filter((p) => p.region === region).map((p) => {
                  const assembly = assemblyByPrefecture[p.code];
                  const className = "h-8 rounded-full px-3 text-xs";
                  return assembly ? (
                    <Button
                      key={p.code}
                      variant="outline"
                      size="sm"
                      asChild
                      className={className}
                    >
                      <Link href={routes.assemblyTop(assembly.slug) as Route}>
                        {p.name}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      key={p.code}
                      variant="outline"
                      size="sm"
                      disabled
                      className={className}
                    >
                      {p.name}
                    </Button>
                  );
                })}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[11px] text-mirai-text-muted">
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
        ）。色分けを加えて使用しています。
      </p>
    </div>
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
