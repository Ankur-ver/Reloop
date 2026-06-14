import { Hono } from "hono";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "../auth";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = () => process.env.S3_BUCKET!;

export const upload = new Hono()
  // POST /api/upload/presign  — body: { filename, contentType }
  .post("/presign", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ message: "Unauthorized" }, 401);

    const { filename, contentType } = await c.req.json<{ filename: string; contentType: string }>();
    if (!filename || !contentType) return c.json({ message: "filename and contentType required" }, 400);

    const ext = filename.split(".").pop() ?? "jpg";
    const key = `p2p/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Store key directly in the URL — no encodeURIComponent, slashes stay as slashes
    // The proxy route handles decoding via the Hono wildcard param
    const publicUrl = `${process.env.PUBLIC_API_URL}/api/upload/img/${key}`;

    return c.json({ uploadUrl, publicUrl });
  })

  // GET /api/upload/img/:key  — server-side S3 proxy, no auth required
  // Works on any domain (local, preview, deployed) since it's a relative path
  .get("/img/*", async (c) => {
    // Grab the full path after /img/ including all slashes
    const raw = c.req.path; // e.g. /upload/img/p2p/userId/filename.jpg  (within basePath /api)
    // Extract key: everything after "/img/"
    const imgIdx = raw.indexOf("/img/");
    if (imgIdx === -1) return c.json({ error: "Invalid path" }, 400);
    const key = decodeURIComponent(raw.slice(imgIdx + 5)); // +5 = length of "/img/"

    if (!key) return c.json({ error: "Missing key" }, 400);

    try {
      const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
      const result = await s3.send(command);

      const contentType = result.ContentType || "image/jpeg";
      const bytes = await result.Body!.transformToByteArray();

      return new Response(
        new Uint8Array(bytes),
        {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Length": String(bytes.byteLength),
          },
        }
      );
    } catch (err: any) {
      console.error("S3 proxy error:", err.message, "key:", key);
      return c.json({ error: "Image not found" }, 404);
    }
  });
