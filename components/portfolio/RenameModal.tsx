"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function RenameModal({
  open,
  onClose,
  currentName,
  portfolioId,
  onRenamed,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  portfolioId: number | null;
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!portfolioId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) onRenamed();
      else setError(json?.error?.message ?? "Failed to rename");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!portfolioId) return;
    setBusy(true);
    try {
      await fetch(`/api/portfolio/${portfolioId}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Portfolio settings">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="pf-rename">Name</Label>
          <Input
            id="pf-rename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
          />
        </div>
        <FieldError message={error} />
        <div className="flex items-center justify-between gap-3">
          {confirm ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={del}
              disabled={busy}
            >
              Confirm delete
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setConfirm(true)}
            >
              Delete portfolio
            </Button>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "SAVE"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
