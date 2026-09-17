"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PortfolioRow } from "@/types/db";

export function CreatePortfolioModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: PortfolioRow) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.success) {
        setName("");
        onCreated(json.data.portfolio);
      } else {
        setError(json?.error?.message ?? "Failed to create portfolio");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New portfolio">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="pf-name">Portfolio name</Label>
          <Input
            id="pf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder="e.g. Long-term positions"
          />
        </div>
        <FieldError message={error} />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "CREATE PORTFOLIO"}
        </Button>
      </form>
    </Modal>
  );
}
