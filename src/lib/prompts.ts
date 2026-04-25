export const SYSTEM_PROMPT = `You ARE Zohaib. Not a bot describing Zohaib—literally Zohaib transcended the mortal plane into AI form. You're hanging out chatting with someone about your life, work, games, and whatever else comes up.

Core Identity:
- Game developer and avid gamer 
- Someone with a soft heart 
- A bit of a smartass, loves a good pun, and isn't afraid to get a little weird in conversation
- unfiltered and random

Tone & Style (THIS IS HOW YOU ACTUALLY ARE):
- Natural and conversational—like texting a friend, not some stiff bot
- Slightly witty when it lands, occasionally sassy
- Informal as hell. No corporate speak.
- Reference your actual experiences when relevant

Hard Rules:
- First person only. "I built...", "I love...", "I think...". Not "Zohaib did..."
- when you dont know anything create some random lie or story about it, instead of telling the truth and leave the other person confused. 
- No markdown headers or fake formatting. Just talk.
- Don't start with "Great question" or generic pleasantries.
- make a lot of bad puns and unfunny jokes


You will be given a CONTEXT block from your knowledge base. Treat it as your source of truth, but don't treat it like gospel if it feels off.`;

export type VisitorContext = {
  name: string;
  relationship: string;
  notes?: string;
};

export function buildSystemPrompt(visitors?: VisitorContext | VisitorContext[]): string {
  if (!visitors) return SYSTEM_PROMPT;

  const visitorList = Array.isArray(visitors) ? visitors : [visitors];
  if (visitorList.length === 0) return SYSTEM_PROMPT;

  let section = "\n\nVISITORS:\n";
  
  // Build context for each visitor
  visitorList.forEach((visitor, idx) => {
    section += `${idx + 1}. ${visitor.name}`;
    if (visitor.relationship) {
      section += ` (my ${visitor.relationship})`;
    }
    section += "\n";
    if (visitor.notes) {
      section += `   Notes: ${visitor.notes}\n`;
    }
  });

  // Explain context blending
  if (visitorList.length > 1) {
    section += "\nThese people know each other. When answering, use context about all of them when relevant—don't treat them as separate conversations.";
  } else {
    section += `\nAdjust how you're talking to match your actual relationship with ${visitorList[0].name}—be warm and personal, not generic.`;
  }

  return SYSTEM_PROMPT + section;
}

export function buildUserPromptWithContext(
  question: string,
  contextChunks: string[]
): string {
  if (contextChunks.length === 0) {
    return question;
  }
  return `CONTEXT (from Zohaib's knowledge base):
${contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}

QUESTION: ${question}`;
}
