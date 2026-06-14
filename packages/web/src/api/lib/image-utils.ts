import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = () => process.env.S3_BUCKET!;

/**
 * Fetch an image and return base64 + mimeType for AI vision calls.
 * - If URL is a relative /api/upload/img/<key> path → fetch directly from S3 (avoids self-HTTP loop)
 * - If URL is a data: URL → parse inline
 * - Otherwise → fetch over HTTP
 */
export async function fetchUrlAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  // data: URL — parse inline
  if (url.startsWith("data:")) {
    const [meta, data] = url.split(",");
    const mimeType = meta.split(":")[1].split(";")[0];
    return { base64: data, mimeType };
  }

  // Relative proxy path /api/upload/img/<key> — go straight to S3
  const imgPrefix = "/api/upload/img/";
  if (url.startsWith(imgPrefix) || url.includes("/api/upload/img/")) {
    const idx = url.indexOf(imgPrefix);
    const key = decodeURIComponent(url.slice(idx + imgPrefix.length));
    const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
    const result = await s3.send(command);
    const contentType = result.ContentType || "image/jpeg";
    const bytes = await result.Body!.transformToByteArray();
    const base64 = Buffer.from(bytes).toString("base64");
    return { base64, mimeType: contentType };
  }

  // Regular HTTP URL
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType };
}
