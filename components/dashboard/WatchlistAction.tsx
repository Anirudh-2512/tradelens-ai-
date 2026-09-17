"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Loader2, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Watchlist {
  id: number;
  name: string;
  symbols: string[];
}

export function WatchlistAction({ symbol }: { symbol: string }) {
  const [lists, setLists] = useState<Watchlist[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addedTo, setAddedTo] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/watchlists");
        const json = await res.json();
        if (json.success) {
          const wls: Watchlist[] = json.data.watchlists;
          setLists(wls);
          setAddedTo(wls.filter((w) => w.symbols.includes(symbol)).map((w) => w.id));
        }
      } catch {
        setLists([]);
      }
    })();
  }, [open, symbol]);

  async function toggle(listId: number, current: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const res = current
        ? await fetch(`/api/watchlists/${listId}/items?symbol=${symbol}`, {
            method: "DELETE",
          })
        : await fetch(`/api/watchlists/${listId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol }),
          });
      const json = await res.json();
      if (!json.success) {
        setMsg(json?.error?.message ?? "Failed to update watchlist");
      } else {
        setAddedTo((prev) => (current ? prev.filter((id) => id !== listId) : [...prev, listId]));
      }
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
        title="Add to watchlist"
      >
        <Star className="mr-1 inline h-3.5 w-3.5" />
        Watch
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Watchlists">
        {lists === null ? (
          <p className="py-6 text-center text-xs text-[var(--muted)]">Loading…</p>
        ) : lists.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--muted)]">
            No watchlists yet.{" "}
            <Link href="/dashboard/watchlists" className="text-[var(--gold)] hover:underline">
              Create one
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {lists.map((w) => {
              const added = addedTo.includes(w.id);
              return (
                <button
                  key={w.id}
                  disabled={busy}
                  onClick={() => toggle(w.id, added)}
                  className="flex w-full items-center justify-between rounded-md border border-[var(--border)] px-4 py-2.5 text-sm transition-colors hover:border-[var(--gold)]/40 disabled:opacity-50"
                >
                  {w.name}
                  {added ? (
                    <Check className="h-4 w-4 text-[var(--positive)]" />
                  ) : (
                    <Star className="h-4 w-4 text-[var(--muted)]" />
                  )}
                </button>
              );
            })}
            {msg ? <p className="mt-2 text-xs text-[var(--negative)]">{msg}</p> : null}
            {busy ? (
              <p className="mt-2 flex items-center justify-center text-xs text-[var(--muted)]">
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Updating…
              </p>
            ) : null}
          </div>
        )}
      </Modal>
    </>
  );
}
