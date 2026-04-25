import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, UserPlus, Users, Loader2, Pencil } from "lucide-react";

type Visitor = {
  id: number;
  name: string;
  relationship: string;
  notes: string;
  updated_at: number;
};

export default function VisitorManager() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/visitors/list");
      if (!res.ok) throw new Error("failed to load");
      const json = await res.json();
      setVisitors(json.visitors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(v: Visitor) {
    setEditingId(v.id);
    setName(v.name);
    setRelationship(v.relationship);
    setNotes(v.notes);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setRelationship("");
    setNotes("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !relationship.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/visitors/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.trim(),
          notes: notes.trim(),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "save failed");
      }
      cancelEdit();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, visitorName: string) {
    if (!confirm(`Remove ${visitorName} from your visitor profiles?`)) return;
    const res = await fetch(`/api/visitors/delete?id=${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isEditing = editingId !== null;

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={save}
        className="rounded-2xl border border-border-subtle bg-bg-elevated p-5 space-y-3"
      >
        <h2 className="font-serif text-lg tracking-tight">
          {isEditing ? "edit person" : "add person"}
        </h2>
        <p className="text-xs text-fg-subtle">
          When someone identifies themselves by this name, the chatbot will use your notes to
          personalize replies — like talking to a friend vs. a colleague.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name (e.g. Umais, Mom, Sarah)"
            maxLength={60}
            className="flex-1 px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
          />
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="relationship (e.g. best friend, mother)"
            maxLength={80}
            className="flex-1 px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
          />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`your personal notes about this person — inside jokes, shared interests, how you normally talk to them, things they care about, etc.`}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm resize-y"
        />

        <div className="flex items-center justify-end gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-fg-subtle hover:text-fg-muted px-4 py-2 rounded-xl border border-border-subtle transition-colors"
            >
              cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!name.trim() || !relationship.trim() || saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fg text-bg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-fg-muted transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> saving...
              </>
            ) : (
              <>
                <UserPlus size={14} /> {isEditing ? "update" : "add person"}
              </>
            )}
          </button>
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>

      {/* List */}
      <div>
        <h2 className="font-serif text-lg tracking-tight mb-4 flex items-center gap-2">
          <Users size={16} className="text-fg-muted" />
          people
        </h2>
        {loading ? (
          <p className="text-sm text-fg-subtle flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> loading...
          </p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-fg-subtle">
            no people added yet. add one above — when they identify themselves the chatbot will personalize its tone.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle overflow-hidden">
            <AnimatePresence initial={false}>
              {visitors.map((v) => (
                <motion.li
                  key={v.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-3 bg-bg-elevated"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-fg font-medium">
                        {v.name}{" "}
                        <span className="text-fg-subtle font-normal">· {v.relationship}</span>
                      </p>
                      {v.notes && (
                        <p className="text-xs text-fg-subtle mt-0.5 line-clamp-2">{v.notes}</p>
                      )}
                      <p className="text-xs text-fg-subtle font-mono mt-1">
                        updated {fmt.format(v.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(v)}
                        className="text-fg-subtle hover:text-fg transition-colors p-1"
                        aria-label="edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(v.id, v.name)}
                        className="text-fg-subtle hover:text-red-300 transition-colors p-1"
                        aria-label="delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
