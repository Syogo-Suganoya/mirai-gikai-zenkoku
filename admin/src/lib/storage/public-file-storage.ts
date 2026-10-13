import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { env } from "@/lib/env";
import {
  thumbnailKeyFromBlobUrl,
  thumbnailKeyFromUrl,
} from "./public-file-key";

/**
 * 公開ファイル（サムネイル・取り込んだ CSV）の置き場所（設計 v3 2.5節）。
 * Vercel Blob が設定されていればそこに置く。ローカル開発で Blob が無いときは、
 * web の public/local-storage/ に置いて web から配信する（本番では使わない）。
 */
type PublicFileStorage = {
  /** ファイルを置き、公開 URL を返す */
  put: (key: string, body: Uint8Array, contentType: string) => Promise<string>;
  /** この置き場所のサムネイルの URL ならキーを返す（他所の URL は null） */
  thumbnailKeyFromUrl: (url: string) => string | null;
  remove: (url: string) => Promise<void>;
};

function blobStorage(): PublicFileStorage | null {
  const token = env.blobReadWriteToken;
  if (!token) return null;
  return {
    put: async (key, body, contentType) => {
      const result = await put(key, Buffer.from(body), {
        access: "public",
        contentType,
        token,
        // キーに時刻・id が入っていて重ならないので、Blob の乱数の接尾辞は付けない
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
      });
      return result.url;
    },
    thumbnailKeyFromUrl: thumbnailKeyFromBlobUrl,
    remove: async (url) => {
      await del(url, { token });
    },
  };
}

/** web/public/local-storage（.gitignore 済み） */
const LOCAL_DIR = path.resolve(process.cwd(), "../web/public/local-storage");

function localStorage(): PublicFileStorage {
  const baseUrl = `${env.webUrl}/local-storage`;
  return {
    put: async (key, body) => {
      const file = path.join(LOCAL_DIR, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
      return `${baseUrl}/${key}`;
    },
    thumbnailKeyFromUrl: (url) => thumbnailKeyFromUrl(url, baseUrl),
    remove: async (url) => {
      const key = thumbnailKeyFromUrl(url, baseUrl);
      if (key) await rm(path.join(LOCAL_DIR, key), { force: true });
    },
  };
}

export function getPublicFileStorage(): PublicFileStorage {
  const blob = blobStorage();
  if (blob) return blob;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ファイルの置き場所（BLOB_READ_WRITE_TOKEN）が設定されていません"
    );
  }
  return localStorage();
}
