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

export const JAPAN_MAP_VIEWBOX = japanMap.viewBox;

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
    return prefecture
      ? [{ code: prefecture.code, name: prefecture.name, path: location.path }]
      : [];
  });

export const JAPAN_MAP_ATTRIBUTION = {
  author: "Victor Cazanave",
  title: "svg-maps/japan",
  url: "https://github.com/VictorCazanave/svg-maps/tree/master/packages/japan",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.ja",
} as const;
