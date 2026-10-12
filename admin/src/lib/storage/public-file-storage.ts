import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

/**
 * 公開ファイル（サムネイルなど）の置き場所（設計 v3 2.5節）。
 * Cloudflare R2 が設定されていればそこに置く。ローカル開発で R2 が無いときは、
 * web の public/local-storage/ に置いて web から配信する（本番では使わない）。
 */
type PublicFileStorage = {
  baseUrl: string;
  put: (key: string, body: Uint8Array, contentType: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  get: (key: string) => Promise<Uint8Array>;
};

function r2Storage(): PublicFileStorage | null {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = env.r2;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return {
    baseUrl: publicUrl,
    put: async (key, body, contentType) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=3600",
        })
      );
    },
    remove: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    get: async (key) => {
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      if (!result.Body) throw new Error(`${key} がありません`);
      return result.Body.transformToByteArray();
    },
  };
}

/** web/public/local-storage（.gitignore 済み） */
const LOCAL_DIR = path.resolve(process.cwd(), "../web/public/local-storage");

function localStorage(): PublicFileStorage {
  return {
    baseUrl: `${env.webUrl}/local-storage`,
    put: async (key, body) => {
      const file = path.join(LOCAL_DIR, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
    },
    remove: async (key) => {
      await rm(path.join(LOCAL_DIR, key), { force: true });
    },
    get: async (key) =>
      new Uint8Array(await readFile(path.join(LOCAL_DIR, key))),
  };
}

export function getPublicFileStorage(): PublicFileStorage {
  const r2 = r2Storage();
  if (r2) return r2;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ファイルの置き場所（R2_ACCOUNT_ID など）が設定されていません"
    );
  }
  return localStorage();
}
