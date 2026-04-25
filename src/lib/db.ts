import { createClient, type Client } from "@libsql/client";

let _client: Client | undefined;

function getClient(): Client {
  if (!_client) {
    const url = import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    _client = createClient({ url, authToken });
  }
  return _client;
}

export const db = new Proxy({} as Client, {
  get(_t, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type KbDocument = {
  id: number;
  title: string;
  content: string;
  created_at: number;
};

export type KbChunk = {
  id: number;
  document_id: number;
  content: string;
  similarity: number;
};

export type VisitorProfile = {
  id: number;
  name: string;
  relationship: string;
  notes: string;
  known_visitors?: string; // comma-separated list of visitor names they know
  created_at: number;
  updated_at: number;
};
