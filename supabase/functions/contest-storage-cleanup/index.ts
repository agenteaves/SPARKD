import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CLEANUP_KEY_SHA256 = "1bed37c68829a9990a8b635d91479683d0bac3e3289f4f4d130c125c2dcb81cc";
const BUCKET = "sparkd-contest-submissions";
const MIN_AGE_HOURS = 6;
const LIST_PAGE_SIZE = 100;
const REFERENCE_PAGE_SIZE = 500;
const MAX_DELETE_PER_RUN = 100;

type StorageEntry = {
  name: string;
  id: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

type StoredObject = { path: string; createdAt: number };

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function normalizeReference(value: unknown, projectUrl: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let path = value.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      const parsed = new URL(path);
      if (parsed.origin !== new URL(projectUrl).origin) return null;
      path = decodeURIComponent(parsed.pathname);
      const publicPrefix = `/storage/v1/object/public/${BUCKET}/`;
      if (!path.startsWith(publicPrefix)) return null;
      return path.slice(publicPrefix.length);
    }
    path = decodeURIComponent(path.replace(/^\/+/, ""));
  } catch {
    return null;
  }
  const apiPrefix = `storage/v1/object/public/${BUCKET}/`;
  if (path.startsWith(apiPrefix)) path = path.slice(apiPrefix.length);
  if (path.startsWith(`${BUCKET}/`)) path = path.slice(BUCKET.length + 1);
  return path || null;
}

async function listObjects(storage: any, prefix = "", output: StoredObject[] = []): Promise<StoredObject[]> {
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await storage.list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    const entries = (data || []) as StorageEntry[];
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        await listObjects(storage, path, output);
      } else if (entry.created_at) {
        const createdAt = Date.parse(entry.created_at);
        if (Number.isFinite(createdAt)) output.push({ path, createdAt });
      }
    }
    if (entries.length < LIST_PAGE_SIZE) break;
  }
  return output;
}

async function getReferencedPaths(db: any, projectUrl: string): Promise<Set<string>> {
  const referenced = new Set<string>();
  for (let offset = 0; ; offset += REFERENCE_PAGE_SIZE) {
    const { data, error } = await db
      .from("meme_week_submissions")
      .select("meme_image_url")
      .not("meme_image_url", "is", null)
      .range(offset, offset + REFERENCE_PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data || [];
    for (const row of rows) {
      const path = normalizeReference(row.meme_image_url, projectUrl);
      if (path) referenced.add(path);
    }
    if (rows.length < REFERENCE_PAGE_SIZE) break;
  }
  return referenced;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const supplied = req.headers.get("x-sparkd-cleanup-key") || "";
  if (!supplied || (await sha256Hex(supplied)) !== CLEANUP_KEY_SHA256) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) throw new Error("Server configuration unavailable");

    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const storage = db.storage.from(BUCKET);
    const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;

    const objects = await listObjects(storage);
    const eligible = objects
      .filter(object => object.createdAt < cutoff)
      .sort((a, b) => a.createdAt - b.createdAt);
    const referenced = await getReferencedPaths(db, url);
    const orphanPaths = eligible
      .filter(object => !referenced.has(object.path))
      .slice(0, MAX_DELETE_PER_RUN)
      .map(object => object.path);

    let deleted = 0;
    for (let offset = 0; offset < orphanPaths.length; offset += MAX_DELETE_PER_RUN) {
      const batch = orphanPaths.slice(offset, offset + MAX_DELETE_PER_RUN);
      const { error } = await storage.remove(batch);
      if (error) throw error;
      deleted += batch.length;
    }

    return json({
      success: true,
      scanned: objects.length,
      old: eligible.length,
      deleted,
    });
  } catch (error) {
    console.error("contest-storage-cleanup failed", error);
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
