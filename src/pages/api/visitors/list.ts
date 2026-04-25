import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { listVisitors } from "@/lib/visitors";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const visitors = await listVisitors();
    return new Response(JSON.stringify({ visitors }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[visitors/list]", err);
    return new Response("failed to list", { status: 500 });
  }
};
