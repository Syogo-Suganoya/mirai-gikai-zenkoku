/**
 * 都道府県のマスタ（JIS X 0401 の都道府県コード順）。
 * romaji は地図（@svg-maps/japan）の id と、都道府県議会のスラッグ（`aichi-pref` など）に使う。
 */

export const REGIONS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州・沖縄",
] as const;

export type Region = (typeof REGIONS)[number];

export type Prefecture = {
  /** 都道府県コード（2桁） */
  code: string;
  name: string;
  romaji: string;
  region: Region;
};

export const PREFECTURES: readonly Prefecture[] = [
  { code: "01", name: "北海道", romaji: "hokkaido", region: "北海道" },
  { code: "02", name: "青森県", romaji: "aomori", region: "東北" },
  { code: "03", name: "岩手県", romaji: "iwate", region: "東北" },
  { code: "04", name: "宮城県", romaji: "miyagi", region: "東北" },
  { code: "05", name: "秋田県", romaji: "akita", region: "東北" },
  { code: "06", name: "山形県", romaji: "yamagata", region: "東北" },
  { code: "07", name: "福島県", romaji: "fukushima", region: "東北" },
  { code: "08", name: "茨城県", romaji: "ibaraki", region: "関東" },
  { code: "09", name: "栃木県", romaji: "tochigi", region: "関東" },
  { code: "10", name: "群馬県", romaji: "gunma", region: "関東" },
  { code: "11", name: "埼玉県", romaji: "saitama", region: "関東" },
  { code: "12", name: "千葉県", romaji: "chiba", region: "関東" },
  { code: "13", name: "東京都", romaji: "tokyo", region: "関東" },
  { code: "14", name: "神奈川県", romaji: "kanagawa", region: "関東" },
  { code: "15", name: "新潟県", romaji: "niigata", region: "中部" },
  { code: "16", name: "富山県", romaji: "toyama", region: "中部" },
  { code: "17", name: "石川県", romaji: "ishikawa", region: "中部" },
  { code: "18", name: "福井県", romaji: "fukui", region: "中部" },
  { code: "19", name: "山梨県", romaji: "yamanashi", region: "中部" },
  { code: "20", name: "長野県", romaji: "nagano", region: "中部" },
  { code: "21", name: "岐阜県", romaji: "gifu", region: "中部" },
  { code: "22", name: "静岡県", romaji: "shizuoka", region: "中部" },
  { code: "23", name: "愛知県", romaji: "aichi", region: "中部" },
  { code: "24", name: "三重県", romaji: "mie", region: "近畿" },
  { code: "25", name: "滋賀県", romaji: "shiga", region: "近畿" },
  { code: "26", name: "京都府", romaji: "kyoto", region: "近畿" },
  { code: "27", name: "大阪府", romaji: "osaka", region: "近畿" },
  { code: "28", name: "兵庫県", romaji: "hyogo", region: "近畿" },
  { code: "29", name: "奈良県", romaji: "nara", region: "近畿" },
  { code: "30", name: "和歌山県", romaji: "wakayama", region: "近畿" },
  { code: "31", name: "鳥取県", romaji: "tottori", region: "中国" },
  { code: "32", name: "島根県", romaji: "shimane", region: "中国" },
  { code: "33", name: "岡山県", romaji: "okayama", region: "中国" },
  { code: "34", name: "広島県", romaji: "hiroshima", region: "中国" },
  { code: "35", name: "山口県", romaji: "yamaguchi", region: "中国" },
  { code: "36", name: "徳島県", romaji: "tokushima", region: "四国" },
  { code: "37", name: "香川県", romaji: "kagawa", region: "四国" },
  { code: "38", name: "愛媛県", romaji: "ehime", region: "四国" },
  { code: "39", name: "高知県", romaji: "kochi", region: "四国" },
  { code: "40", name: "福岡県", romaji: "fukuoka", region: "九州・沖縄" },
  { code: "41", name: "佐賀県", romaji: "saga", region: "九州・沖縄" },
  { code: "42", name: "長崎県", romaji: "nagasaki", region: "九州・沖縄" },
  { code: "43", name: "熊本県", romaji: "kumamoto", region: "九州・沖縄" },
  { code: "44", name: "大分県", romaji: "oita", region: "九州・沖縄" },
  { code: "45", name: "宮崎県", romaji: "miyazaki", region: "九州・沖縄" },
  { code: "46", name: "鹿児島県", romaji: "kagoshima", region: "九州・沖縄" },
  { code: "47", name: "沖縄県", romaji: "okinawa", region: "九州・沖縄" },
];

const BY_CODE = new Map(PREFECTURES.map((p) => [p.code, p]));
const BY_ROMAJI = new Map(PREFECTURES.map((p) => [p.romaji, p]));

export function findPrefectureByCode(code: string): Prefecture | undefined {
  return BY_CODE.get(code.padStart(2, "0"));
}

export function findPrefectureByRomaji(romaji: string): Prefecture | undefined {
  return BY_ROMAJI.get(romaji);
}

/** 「愛知県」→「愛知」。北海道はそのまま */
export function shortPrefectureName(name: string): string {
  return name === "北海道" ? name : name.replace(/[都府県]$/, "");
}

/**
 * 全国地方公共団体コード（6桁）の検査数字を付ける。
 * 5桁の各桁に 6,5,4,3,2 を掛けた和を 11 で割った余りを 11 から引き、その下1桁を検査数字とする。
 */
export function withCheckDigit(code5: string): string {
  if (!/^\d{5}$/.test(code5)) {
    throw new Error(`団体コードは5桁の数字で指定してください: ${code5}`);
  }
  const weights = [6, 5, 4, 3, 2];
  const sum = [...code5].reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  return `${code5}${(11 - (sum % 11)) % 10}`;
}

/** 都道府県の団体コード（愛知県なら 230006） */
export function prefectureLocalGovCode(prefectureCode: string): string {
  return withCheckDigit(`${prefectureCode.padStart(2, "0")}000`);
}

/** 都道府県議会のスラッグ（愛知県なら aichi-pref） */
export function prefectureAssemblySlug(prefecture: Prefecture): string {
  return `${prefecture.romaji}-pref`;
}

/** 都道府県議会の名前（愛知県なら 愛知県議会） */
export function prefectureAssemblyName(prefecture: Prefecture): string {
  return `${prefecture.name}議会`;
}

/**
 * 都道府県コード → 都道府県議会。地図・地方ボタンは都道府県議会だけを扱う（市区町村議会は含めない）。
 */
export function prefectureAssemblyByCode<
  T extends { type: string; prefecture_code: string },
>(items: readonly T[]): Record<string, T> {
  return Object.fromEntries(
    items
      .filter((item) => item.type === "prefecture")
      .map((item) => [item.prefecture_code, item])
  );
}
