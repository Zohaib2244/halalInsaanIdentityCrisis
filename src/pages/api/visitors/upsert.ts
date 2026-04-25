import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { upsertVisitor } from "@/lib/visitors";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: { name?: string; relationship?: string; notes?: string; known_visitors?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const name = body.name?.trim();
  const relationship = body.relationship?.trim();
  const notes = body.notes?.trim() ?? "";
  const known_visitors = body.known_visitors?.trim() ?? "";

  if (!name || !relationship) {
    return new Response("name and relationship are required", { status: 400 });
  }

  try {
    const visitor = await upsertVisitor(name, relationship, notes, known_visitors);
    return new Response(JSON.stringify(visitor), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[visitors/upsert]", err);
    return new Response(
      err instanceof Error ? err.message : "upsert failed",
      { status: 500 }
    );
  }
};
