import { db, type VisitorProfile } from "./db";

export async function listVisitors(): Promise<VisitorProfile[]> {
  const result = await db.execute(
    "SELECT id, name, relationship, notes, known_visitors, created_at, updated_at FROM visitor_profiles ORDER BY name COLLATE NOCASE ASC"
  );
  return result.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    relationship: r.relationship as string,
    notes: r.notes as string,
    known_visitors: r.known_visitors as string | undefined,
    created_at: r.created_at as number,
    updated_at: r.updated_at as number,
  }));
}

export async function upsertVisitor(
  name: string,
  relationship: string,
  notes: string,
  known_visitors?: string
): Promise<VisitorProfile> {
  const now = Date.now();
  await db.execute({
    sql: `
      INSERT INTO visitor_profiles (name, relationship, notes, known_visitors, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        relationship = excluded.relationship,
        notes = excluded.notes,
        known_visitors = excluded.known_visitors,
        updated_at = excluded.updated_at
    `,
    args: [name, relationship, notes, known_visitors || "", now, now],
  });

  const result = await db.execute({
    sql: "SELECT id, name, relationship, notes, known_visitors, created_at, updated_at FROM visitor_profiles WHERE name = ? COLLATE NOCASE",
    args: [name],
  });
  const r = result.rows[0];
  return {
    id: r.id as number,
    name: r.name as string,
    relationship: r.relationship as string,
    notes: r.notes as string,
    known_visitors: r.known_visitors as string | undefined,
    created_at: r.created_at as number,
    updated_at: r.updated_at as number,
  };
}

export async function deleteVisitor(id: number): Promise<void> {
  await db.execute({
    sql: "DELETE FROM visitor_profiles WHERE id = ?",
    args: [id],
  });
}

export async function lookupVisitorByName(
  name: string
): Promise<VisitorProfile | null> {
  const result = await db.execute({
    sql: "SELECT id, name, relationship, notes, known_visitors, created_at, updated_at FROM visitor_profiles WHERE name = ? COLLATE NOCASE LIMIT 1",
    args: [name],
  });
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id as number,
    name: r.name as string,
    relationship: r.relationship as string,
    notes: r.notes as string,
    known_visitors: r.known_visitors as string | undefined,
    created_at: r.created_at as number,
    updated_at: r.updated_at as number,
  };
}

/**
 * Fetch all visitors that a given person knows.
 * known_visitors is a comma-separated list of names.
 */
export async function getRelatedVisitors(
  visitorProfile: VisitorProfile
): Promise<VisitorProfile[]> {
  if (!visitorProfile.known_visitors || visitorProfile.known_visitors.trim() === "") {
    return [];
  }

  const names = visitorProfile.known_visitors
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (names.length === 0) return [];

  const placeholders = names.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT id, name, relationship, notes, known_visitors, created_at, updated_at FROM visitor_profiles WHERE name COLLATE NOCASE IN (${placeholders})`,
    args: names,
  });

  return result.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    relationship: r.relationship as string,
    notes: r.notes as string,
    known_visitors: r.known_visitors as string | undefined,
    created_at: r.created_at as number,
    updated_at: r.updated_at as number,
  }));
}
