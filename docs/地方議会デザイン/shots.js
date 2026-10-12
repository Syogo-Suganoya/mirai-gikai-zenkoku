/**
 * 使い方ガイド（mocks/guide.html）に載せる画面の写しを撮る。
 *
 *   cd 地方議会デザイン && npm install && npm run shots
 *
 * モックは静的HTMLなので、サーバーを立てずに file:// で開いて撮る。
 * モックを直したら撮り直すだけでガイドの画像が追随する。
 * Chrome は手元のものを使う。場所が違うときは CHROME_BIN で指定する。
 */

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const puppeteer = require("puppeteer-core");

const MOCKS = path.join(__dirname, "mocks");
const OUT = process.env.OUT_DIR || path.join(MOCKS, "shots");
const CHROME =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 公開サイトはスマホ、管理画面はPCで見る前提なので、幅を分ける。
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 撮るもの。clip を指定したものは、その要素（複数なら全体を囲む範囲）だけを切り抜く。
// 使い方ガイドでは、フローチャートの各手順の中にこれらを置く。
const SHOTS = [
  { name: "w1-select", file: "web-01-select.html", size: PHONE },
  { name: "w2-assembly", file: "web-02-assembly.html", size: PHONE },
  { name: "w3-bill", file: "web-03-bill.html", size: PHONE },
  { name: "w5-not-yet", file: "web-05-not-yet.html", size: PHONE },
  {
    name: "w5-notify",
    file: "web-05-not-yet.html",
    size: PHONE,
    clip: ["#notify"],
  },
  { name: "a1-assemblies", file: "admin-01-assemblies.html", size: DESKTOP },
  {
    name: "a2-head",
    file: "admin-02-dashboard.html",
    size: DESKTOP,
    clip: ["#dash-head"],
  },
  {
    name: "a2-notice",
    file: "admin-02-dashboard.html",
    size: DESKTOP,
    clip: ["#dash-notice"],
  },
  {
    name: "a2-bills",
    file: "admin-02-dashboard.html",
    size: DESKTOP,
    clip: ["#dash-bills"],
  },
  {
    name: "a3-upload",
    file: "admin-03-upload.html",
    size: { ...DESKTOP, height: 900 },
  },
  {
    name: "a3-session",
    file: "admin-03-upload.html",
    size: DESKTOP,
    clip: ["#session-label", "#session-select"],
  },
  {
    name: "a3-files",
    file: "admin-03-upload.html",
    size: DESKTOP,
    clip: ["#import-files h2", "#import-files-end"],
  },
  {
    name: "a3-split",
    file: "admin-03-upload.html",
    size: DESKTOP,
    clip: ["#import-split"],
  },
  {
    name: "a4-review",
    file: "admin-04-review.html",
    size: { ...DESKTOP, height: 960 },
  },
  {
    name: "a4-actions",
    file: "admin-04-review.html",
    size: { ...DESKTOP, height: 960 },
    clip: ["#review-actions"],
  },
  {
    name: "a5-urls",
    file: "admin-05-sources.html",
    size: DESKTOP,
    clip: ["#source-urls"],
  },
  {
    name: "a5-test",
    file: "admin-05-sources.html",
    size: DESKTOP,
    clip: ["#source-test"],
  },
  {
    name: "a5-history",
    file: "admin-05-sources.html",
    size: DESKTOP,
    clip: ["#source-history"],
  },
  {
    name: "a6-members",
    file: "admin-06-members.html",
    size: DESKTOP,
    clip: ["#members-head", "#members-list"],
  },
];

// 切り抜くときに要素のまわりに残す余白（px）
const PAD = 8;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ["--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log(`[画面] ${e.message}`));

  for (const s of SHOTS) {
    await page.setViewport({ ...s.size, deviceScaleFactor: 2 });
    const url = pathToFileURL(path.join(MOCKS, s.file)).href;
    await page.goto(url, { waitUntil: "load" });
    // モック上部の注記バーと設計メモは実際の画面には出ないので消してから撮る。
    await page.addStyleTag({
      content: ".mock-bar, .note { display: none !important; }",
    });
    let clip;
    if (s.clip) {
      clip = await page.evaluate(
        (sels, pad) => {
          const rects = sels.map((sel) =>
            document.querySelector(sel)?.getBoundingClientRect()
          );
          if (rects.some((r) => !r)) return null;
          const x = Math.min(...rects.map((r) => r.left)) - pad;
          const y = Math.min(...rects.map((r) => r.top)) - pad + window.scrollY;
          return {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.max(...rects.map((r) => r.right)) + pad - Math.max(0, x),
            height:
              Math.max(...rects.map((r) => r.bottom)) +
              pad +
              window.scrollY -
              Math.max(0, y),
          };
        },
        s.clip,
        PAD
      );
      // 目印が無いまま撮ると、ガイドの説明と違う所が載ってしまう。
      if (!clip) throw new Error(`${s.file} に ${s.clip.join(", ")} が無い`);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await page.screenshot({
      path: path.join(OUT, `${s.name}.png`),
      ...(clip && { clip, captureBeyondViewport: true }),
    });
    console.log(`撮影: ${s.name}.png`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
