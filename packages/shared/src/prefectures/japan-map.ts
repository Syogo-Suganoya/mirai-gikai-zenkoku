/**
 * 日本地図の形（都道府県ごとの SVG パス）。公開サイトのトップと管理画面の議会一覧で使う。
 * 地図データ: Victor Cazanave「svg-maps/japan」（CC BY 4.0）。表示する画面に出典を書くこと。
 */
import japanMapData from "@svg-maps/japan";
import { findPrefectureByRomaji } from "./prefectures";

/** @svg-maps/japan の形（型定義が参照する svg-maps__common が公開されていないため自前で書く） */
type SvgMap = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};
const japanMap = japanMapData as unknown as SvgMap;

/**
 * 沖縄県は元の地図では左下の離れた位置（横 0〜126・縦 421〜516）にあり、地図の下半分が空く。
 * 左上の日本海側（何も無い範囲）へ移し、区切り線で囲んで差し込みの地図にする。
 * 島が小さく押しにくいので、差し込みの中では 1.5 倍に拡大する（本土との縮尺は合わない）。
 * 移したぶん地図の高さが縮む（元は 0 0 438 516）。
 */
export const OKINAWA_CODE = "47";
const OKINAWA_TRANSFORM = { scale: 1.5, dx: 11.5, dy: -620 };

export const JAPAN_MAP_VIEWBOX = "0 0 438 390";

/** 沖縄県の差し込みと本土を分ける区切り線（沖縄の右と下を囲む L 字） */
export const JAPAN_MAP_OKINAWA_DIVIDER = "M 0 166 H 214 V 0";

/**
 * SVG のパスを拡大（原点基準）してから平行移動する。地図データのパスは先頭の移動（m）だけが
 * 絶対位置で、以降はすべて相対の指定なので、数値をすべて scale 倍し、先頭の座標だけ dx・dy ずらせばよい。
 */
export function transformSvgPath(
  path: string,
  { scale = 1, dx = 0, dy = 0 }: { scale?: number; dx?: number; dy?: number }
): string {
  const trimmed = path.trim();
  if (!/^m/i.test(trimmed)) {
    throw new Error("先頭が移動（m）ではないパスは動かせません");
  }
  // 先頭以外に絶対指定（大文字）があると、拡大・移動がずれる
  if (/[A-Z]/.test(trimmed.slice(1).replace(/Z/g, ""))) {
    throw new Error("相対指定（小文字）だけのパスにしか使えません");
  }
  let index = 0;
  return trimmed.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (value) => {
    const scaled = Number(value) * scale;
    const offset = index === 0 ? dx : index === 1 ? dy : 0;
    index++;
    return String(Math.round((scaled + offset) * 1000) / 1000);
  });
}

export type JapanMapShape = {
  /** 都道府県コード（'23' など） */
  code: string;
  /** 都道府県名（'愛知県' など） */
  name: string;
  path: string;
};

/** 都道府県ごとの形（地図データの並び順） */
export const JAPAN_MAP_SHAPES: readonly JapanMapShape[] =
  japanMap.locations.flatMap((location) => {
    const prefecture = findPrefectureByRomaji(location.id);
    if (!prefecture) return [];
    const path =
      prefecture.code === OKINAWA_CODE
        ? transformSvgPath(location.path, OKINAWA_TRANSFORM)
        : location.path;
    return [{ code: prefecture.code, name: prefecture.name, path }];
  });

export const JAPAN_MAP_ATTRIBUTION = {
  author: "Victor Cazanave",
  title: "svg-maps/japan",
  url: "https://github.com/VictorCazanave/svg-maps/tree/master/packages/japan",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.ja",
} as const;
