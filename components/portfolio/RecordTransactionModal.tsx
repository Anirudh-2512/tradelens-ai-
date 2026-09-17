"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function RecordTransactionModal({
  open,
  loading,
  onClose,
  portfolioId,
  onDone,
  error,
  setError,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  portfolioId: number | null;
  onDone: () => void;
  error: string | null;
  setError: (msg: string | null) => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!portfolioId) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        symbol: symbol.trim().toUpperCase(),
        type,
        quantity: Number(quantity),
        price: Number(price),
        fees: fees ? Number(fees) : 0,
      };
      const res = await fetch(`/api/portfolio/${portfolioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setSymbol("");
        setQuantity("");
        setPrice("");
        setFees("");
        onDone();
      } else {
        setError(json?.error?.message ?? "Transaction failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record transaction">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="txn-symbol">Symbol</Label>
          <Input
            id="txn-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            required
            placeholder="AAPL"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="txn-type">Type</Label>
            <select
              id="txn-type"
              value={type}
              onChange={(e) => setType(e.target.value as "buy" | "sell")}
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-sm focus:border-[var(--gold)]/60 focus:outline-none"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <Label htmlFor="txn-qty">Quantity</Label>
            <Input
              id="txn-qty"
              type="number"
              min="0.000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="txn-price">Price per share</Label>
            <Input
              id="txn-price"
              type="number"
              min="0.0001"
              step="0.0001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="txn-fees">Fees</Label>
            <Input
              id="txn-fees"
              type="number"
              min="0"
              step="0.01"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <FieldError message={error} />
        <Button type="submit" disabled={busy || !portfolioId} className="w-full">
          {busy ? "Recording…" : "RECORD TRANSACTION"}
        </Button>
        {loading ? (
          <p className="text-center text-[11px] text-[var(--muted)]">Re-valuing against live prices…</p>
        ) : null}
      </form>
    </Modal>
  );
}
