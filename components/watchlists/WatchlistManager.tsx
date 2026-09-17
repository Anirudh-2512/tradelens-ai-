"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatPercent, cn } from "@/lib/utils/format";
import type { WatchlistWithSymbols } from "@/types/db";

interface QuoteInfo {
  price: number | null;
  changePercent: number | null;
  state: string;
}

export function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<WatchlistWithSymbols[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteInfo>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WatchlistWithSymbols | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistWithSymbols | null>(null);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlists");
      const json = await res.json();
      if (json.success) {
        setWatchlists(json.data.watchlists);
      } else {
        setError(json?.error?.message ?? "Failed to load watchlists");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!watchlists) return;
    const symbols = [...new Set(watchlists.flatMap((w) => w.symbols))].slice(0, 12);
    if (symbols.length === 0) {
      setQuotes({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stocks/quotes?symbols=${symbols.join(",")}`);
        const json = await res.json();
        if (cancelled || !json.success) return;
        const map: Record<string, QuoteInfo> = {};
        for (const q of json.data.quotes) {
          map[q.symbol] = {
            price: q.price,
            changePercent: q.changePercent,
            state: q.state,
          };
        }
        setQuotes(map);
      } catch {
        // Quotes are optional enrichment for this view
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [watchlists]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewName("");
        setCreateOpen(false);
        await load();
      } else {
        setFormError(json?.error?.message ?? "Failed to create watchlist");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/watchlists/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json();
      if (json.success) {
        setRenameTarget(null);
        setNewName("");
        await load();
      } else {
        setFormError(json?.error?.message ?? "Failed to rename");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function del(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/watchlists/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await load();
    } catch {
      setFormError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function removeSymbol(watchlistId: number, symbol: string) {
    setBusyId(watchlistId);
    try {
      await fetch(`/api/watchlists/${watchlistId}/items?symbol=${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">WATCHLISTS</h1>
          <p className="text-xs text-[var(--muted)]">
            Group securities into tracked lists — duplicate symbols are prevented automatically
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New watchlist
        </Button>
      </div>

      {error ? <FieldError message={error} /> : null}

      {watchlists === null ? (
        <p className="py-6 text-center text-xs text-[var(--muted)]">
          <Loader2 className="mr-2 inline h-3 w-3 animate-spin" /> Loading watchlists…
        </p>
      ) : watchlists.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-[var(--muted)]">
            No watchlists yet. Create one to start tracking securities.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {watchlists.map((w) => (
            <Card key={w.id}>
              <CardHeader
                title={w.name}
                subtitle={`${w.symbols.length} symbols`}
                actions={
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setRenameTarget(w)}
                      aria-label={`Rename ${w.name}`}
                      className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      aria-label={`Delete ${w.name}`}
                      className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--negative)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                }
              />
              <div className="pt-4">
                {w.symbols.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    No symbols yet. Open a security and use “Watch” to add it here.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {w.symbols.map((sym) => {
                      const q = quotes[sym];
                      return (
                        <li key={sym} className="flex items-center justify-between py-2.5">
                          <Link
                            href={`/dashboard/markets/${sym}`}
                            className="group flex flex-1 items-baseline gap-3"
                          >
                            <span className="tl-numerical font-semibold group-hover:text-[var(--gold)]">
                              {sym}
                            </span>
                            <span className="tl-numerical text-xs">
                              {q?.price != null ? formatCurrency(q.price) : q?.state === "unavailable" ? "N/A" : "…"}
                            </span>
                            <span
                              className={cn(
                                "tl-numerical hidden text-[10px] sm:inline",
                                (q?.changePercent ?? 0) >= 0
                                  ? "text-[var(--positive)]"
                                  : "text-[var(--negative)]"
                              )}
                            >
                              {q?.changePercent != null ? formatPercent(q.changePercent) : "—"}
                            </span>
                          </Link>
                          <button
                            onClick={() => removeSymbol(w.id, sym)}
                            aria-label={`Remove ${sym} from ${w.name}`}
                            disabled={busyId === w.id}
                            className="rounded p-1.5 text-[var(--muted)] hover:text-[var(--negative)] disabled:opacity-40"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New watchlist">
        <form onSubmit={create} className="space-y-4">
          <div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              maxLength={60}
              placeholder="Watchlist name"
              aria-label="Watchlist name"
            />
          </div>
          <FieldError message={formError} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "CREATE"}
          </Button>
        </form>
      </Modal>

      <Modal open={renameTarget !== null} onClose={() => setRenameTarget(null)} title="Rename watchlist">
        <form onSubmit={rename} className="space-y-4">
          <div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              maxLength={60}
              aria-label="Watchlist name"
            />
          </div>
          <FieldError message={formError} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "SAVE"}
          </Button>
        </form>
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete watchlist">
        <p className="text-sm text-[var(--muted)]">
          Delete <strong>{deleteTarget?.name}</strong>? This removes the list and its symbols.
          This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={del} disabled={busy}>
            <Check className="h-3.5 w-3.5" /> {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
