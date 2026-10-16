/**
 * 愛知県以外の46都道府県議会のダミーデータの題材。
 * 観光名所と特産品は実在するが、これを題材にした議案はすべて架空のもの。
 */
export type DummyTheme = {
  prefecture: string;
  landmark: string;
  specialty: string;
};

export const DUMMY_THEMES: readonly DummyTheme[] = [
  { prefecture: "北海道", landmark: "小樽運河", specialty: "夕張メロン" },
  { prefecture: "青森県", landmark: "奥入瀬渓流", specialty: "りんご" },
  { prefecture: "岩手県", landmark: "中尊寺", specialty: "南部鉄器" },
  { prefecture: "宮城県", landmark: "松島", specialty: "牛たん" },
  { prefecture: "秋田県", landmark: "角館の武家屋敷", specialty: "きりたんぽ" },
  { prefecture: "山形県", landmark: "山寺（立石寺）", specialty: "さくらんぼ" },
  { prefecture: "福島県", landmark: "鶴ヶ城", specialty: "桃" },
  { prefecture: "茨城県", landmark: "偕楽園", specialty: "納豆" },
  { prefecture: "栃木県", landmark: "日光東照宮", specialty: "いちご" },
  { prefecture: "群馬県", landmark: "草津温泉", specialty: "こんにゃく" },
  { prefecture: "埼玉県", landmark: "川越の蔵造りの町並み", specialty: "草加せんべい" },
  { prefecture: "千葉県", landmark: "成田山新勝寺", specialty: "落花生" },
  { prefecture: "東京都", landmark: "浅草寺", specialty: "江戸切子" },
  { prefecture: "神奈川県", landmark: "鎌倉の大仏", specialty: "小田原かまぼこ" },
  { prefecture: "新潟県", landmark: "佐渡島", specialty: "米" },
  { prefecture: "富山県", landmark: "黒部峡谷", specialty: "ます寿し" },
  { prefecture: "石川県", landmark: "兼六園", specialty: "九谷焼" },
  { prefecture: "福井県", landmark: "東尋坊", specialty: "越前がに" },
  { prefecture: "山梨県", landmark: "富士五湖", specialty: "ぶどう" },
  { prefecture: "長野県", landmark: "善光寺", specialty: "そば" },
  { prefecture: "岐阜県", landmark: "白川郷", specialty: "関の刃物" },
  { prefecture: "静岡県", landmark: "三保の松原", specialty: "緑茶" },
  { prefecture: "三重県", landmark: "伊勢神宮", specialty: "松阪牛" },
  { prefecture: "滋賀県", landmark: "琵琶湖", specialty: "信楽焼" },
  { prefecture: "京都府", landmark: "清水寺", specialty: "宇治茶" },
  { prefecture: "大阪府", landmark: "大阪城", specialty: "たこ焼き" },
  { prefecture: "兵庫県", landmark: "姫路城", specialty: "灘の酒" },
  { prefecture: "奈良県", landmark: "東大寺", specialty: "柿の葉寿司" },
  { prefecture: "和歌山県", landmark: "熊野古道", specialty: "梅干し" },
  { prefecture: "鳥取県", landmark: "鳥取砂丘", specialty: "二十世紀梨" },
  { prefecture: "島根県", landmark: "出雲大社", specialty: "しじみ" },
  { prefecture: "岡山県", landmark: "後楽園", specialty: "白桃" },
  { prefecture: "広島県", landmark: "厳島神社", specialty: "牡蠣" },
  { prefecture: "山口県", landmark: "秋吉台", specialty: "ふぐ" },
  { prefecture: "徳島県", landmark: "鳴門の渦潮", specialty: "すだち" },
  { prefecture: "香川県", landmark: "金刀比羅宮", specialty: "讃岐うどん" },
  { prefecture: "愛媛県", landmark: "道後温泉", specialty: "みかん" },
  { prefecture: "高知県", landmark: "桂浜", specialty: "かつお" },
  { prefecture: "福岡県", landmark: "太宰府天満宮", specialty: "明太子" },
  { prefecture: "佐賀県", landmark: "吉野ヶ里遺跡", specialty: "有田焼" },
  { prefecture: "長崎県", landmark: "グラバー園", specialty: "カステラ" },
  { prefecture: "熊本県", landmark: "熊本城", specialty: "からし蓮根" },
  { prefecture: "大分県", landmark: "別府温泉", specialty: "かぼす" },
  { prefecture: "宮崎県", landmark: "高千穂峡", specialty: "マンゴー" },
  { prefecture: "鹿児島県", landmark: "桜島", specialty: "黒豚" },
  { prefecture: "沖縄県", landmark: "首里城", specialty: "ゴーヤー" },
];
