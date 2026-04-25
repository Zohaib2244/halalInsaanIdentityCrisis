import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, ChevronDown } from "lucide-react";

export type VisitorInfo = {
  name: string;
  relationship: string;
};

const STORAGE_KEY = "zohaib_visitor";

type Props = {
  onIdentify: (info: VisitorInfo | null) => void;
};

export default function VisitorIdentity({ onIdentify }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saved, setSaved] = useState<VisitorInfo | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: VisitorInfo = JSON.parse(raw);
        if (parsed.name && parsed.relationship) {
          setSaved(parsed);
          onIdentify(parsed);
        }
      }
    } catch {}
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRel = relationship.trim();
    if (!trimmedName || !trimmedRel) return;
    const info: VisitorInfo = { name: trimmedName, relationship: trimmedRel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch {}
    setSaved(info);
    onIdentify(info);
    setExpanded(false);
    setName("");
    setRelationship("");
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSaved(null);
    onIdentify(null);
    setExpanded(false);
  }

  if (saved && !expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-fg-subtle mb-4"
      >
        <User size={12} className="shrink-0" />
        <span>
          chatting as <span className="text-fg font-medium">{saved.name}</span>
          {" "}({saved.relationship})
        </span>
        <button
          onClick={() => setExpanded(true)}
          className="text-fg-subtle hover:text-fg transition-colors inline-flex items-center gap-0.5"
          aria-label="Change identity"
        >
          <ChevronDown size={12} />
          <span className="sr-only">change</span>
        </button>
        <button
          onClick={clear}
          className="text-fg-subtle hover:text-fg transition-colors"
          aria-label="Clear identity"
        >
          <X size={12} />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {(expanded || !saved) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden mb-4"
        >
          <form
            onSubmit={save}
            className="rounded-2xl bg-bg-elevated border border-border-subtle p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-fg font-medium flex items-center gap-2">
                <User size={14} className="text-fg-muted" />
                who are you?
              </p>
              {saved && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-fg-subtle hover:text-fg transition-colors"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-fg-subtle">
              Tell me who you are and I'll make this conversation feel more personal.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name"
                maxLength={60}
                className="flex-1 px-3 py-2 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
              />
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. friend, mom, colleague"
                maxLength={80}
                className="flex-1 px-3 py-2 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-fg-subtle italic">optional — skip if you prefer</p>
              <div className="flex gap-2">
                {saved && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs text-fg-subtle hover:text-fg-muted px-3 py-1.5 rounded-xl border border-border-subtle transition-colors"
                  >
                    clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!name.trim() || !relationship.trim()}
                  className="text-xs px-3 py-1.5 rounded-xl bg-fg text-bg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-fg-muted transition-colors"
                >
                  save
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
