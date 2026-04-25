import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { deleteVisitor } from "@/lib/visitors";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, url }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  const id = Number(url.searchParams.get("id"));
  if (!id || !Number.isFinite(id)) {
    return new Response("invalid id", { status: 400 });
  }

  try {
    await deleteVisitor(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[visitors/delete]", err);
    return new Response("delete failed", { status: 500 });
  }
};
