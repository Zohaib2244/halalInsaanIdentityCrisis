import type { APIRoute } from "astro";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { retrieve } from "@/lib/rag";
import { buildSystemPrompt, buildUserPromptWithContext } from "@/lib/prompts";
import { lookupVisitorByName } from "@/lib/visitors";

export const prerender = false;

type IncomingMessage = { role: "user" | "assistant"; content: string };

export const POST: APIRoute = async ({ request }) => {
  let body: { messages: IncomingMessage[]; visitorName?: string; visitorRelationship?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const messages = body.messages?.filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  if (!messages || messages.length === 0) {
    return new Response("no messages", { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return new Response("no user message", { status: 400 });
  }

  // Resolve visitor context: look up pre-loaded notes by name, fall back to
  // the name/relationship the visitor provided themselves.
  let visitorContext: { name: string; relationship: string; notes?: string } | undefined;
  const visitorName = body.visitorName?.trim();
  const visitorRelationship = body.visitorRelationship?.trim();
  if (visitorName) {
    try {
      const profile = await lookupVisitorByName(visitorName);
      if (profile) {
        visitorContext = {
          name: profile.name,
          relationship: profile.relationship,
          notes: profile.notes || undefined,
        };
      } else {
        visitorContext = {
          name: visitorName,
          relationship: visitorRelationship ?? "visitor",
        };
      }
    } catch (e) {
      console.warn("[chat] visitor lookup failed:", e);
      visitorContext = {
        name: visitorName,
        relationship: visitorRelationship ?? "visitor",
      };
    }
  }

  // Retrieve context (best-effort; if DB/embeddings fail we continue without it)
  let contextChunks: string[] = [];
  try {
    const results = await retrieve(lastUser.content, 5);
    contextChunks = results.map((r) => r.content);
  } catch (e) {
    console.warn("[chat] retrieve failed:", e);
  }

  // Build Groq messages. We rewrite the *last* user message to include context,
  // and keep prior turns untouched so history stays clean.
  const augmentedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildSystemPrompt(visitorContext) },
    ...messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user",
      content: buildUserPromptWithContext(lastUser.content, contextChunks),
    },
  ];

  let stream: Awaited<ReturnType<typeof groq.chat.completions.create>>;
  try {
    stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: augmentedMessages,
      temperature: 0.4,
      max_tokens: 512,
      stream: true,
    });
  } catch (err) {
    console.error("[chat] groq create failed:", err);
    return new Response("chat unavailable", { status: 500 });
  }

  const encoder = new TextEncoder();
  const body$ = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        console.error("[chat] stream error:", err);
        try {
          controller.enqueue(encoder.encode("\n\n[error]"));
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(body$, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
};
