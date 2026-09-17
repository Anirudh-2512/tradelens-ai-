"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, ArrowDownUp } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { Metric, HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { TransactionsTable } from "@/components/portfolio/TransactionsTable";
import { CreatePortfolioModal } from "@/components/portfolio/CreatePortfolioModal";
import { RenameModal } from "@/components/portfolio/RenameModal";
import { RecordTransactionModal } from "@/components/portfolio/RecordTransactionModal";
import type { HoldingView } from "@/types";
import type { PortfolioRow } from "@/types/db";

interface Totals {
  investedCapital: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

interface PortfolioData {
  portfolio: { id: number; name: string; base_currency: string; created_at: number };
  holdings: HoldingView[];
  totals: Totals;
  currency: string;
  transactions: Array<{
    id: number;
    symbol: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
    fees: number;
    executed_at: number;
  }>;
}

export function PortfolioManager() {
  const [list, setList] = useState<PortfolioRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPortfolio, setBusyPortfolio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnError, setTxnError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      const json = await res.json();
      if (json.success) {
        const portfolios: PortfolioRow[] = json.data.portfolios;
        setList(portfolios);
        setSelectedId((prev) => prev ?? portfolios[0]?.id ?? null);
      } else {
        setError(json?.error?.message ?? "Failed to load portfolios");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPortfolio = useCallback(async (id: number) => {
    setBusyPortfolio(true);
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json?.error?.message ?? "Failed to load portfolio");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyPortfolio(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadPortfolio(selectedId);
    else setData(null);
  }, [selectedId, loadPortfolio]);

  const totals = data?.totals;
  const sign = (n: number) => (n >= 0 ? "+" : "−");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">PORTFOLIO</h1>
          <p className="text-xs text-[var(--muted)]">
            Valued against live market data — never user-entered prices
          </p>
        </div>
        <div className="flex gap-2">
          {list && list.length > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => setRenameOpen(true)}>
              Rename
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
      </div>

      {error ? <FieldError message={error} /> : null}

      {list && list.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              aria-pressed={selectedId === p.id}
              className={`shrink-0 rounded-md border px-4 py-2 text-sm transition-colors ${
                selectedId === p.id
                  ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : null}

      {loading && list === null ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {list !== null && list.length === 0 && !loading ? (
        <Card>
          <p className="py-10 text-center text-sm text-[var(--muted)]">
            No portfolios yet. Create your first portfolio to track positions.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create portfolio
            </Button>
          </div>
        </Card>
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader
              title={data.portfolio.name}
              subtitle={`Base currency: ${data.currency}`}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => selectedId && void loadPortfolio(selectedId)}
                  title="Re-value against live prices"
                  disabled={busyPortfolio}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busyPortfolio ? "animate-spin" : ""}`} />
                </Button>
              }
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Invested capital" value={formatCurrency(totals?.investedCapital)} />
              <Metric label="Current market value" value={formatCurrency(totals?.currentValue)} />
              <Metric
                label="Unrealized P/L"
                value={
                  totals != null
                    ? `${sign(totals.unrealizedPL)}${formatCurrency(Math.abs(totals.unrealizedPL))}`
                    : "N/A"
                }
                tone={
                  totals == null ? "neutral" : totals.unrealizedPL >= 0 ? "positive" : "negative"
                }
              />
              <Metric
                label="P/L %"
                value={totals != null ? formatPercent(totals.unrealizedPLPercent) : "N/A"}
                tone={
                  totals == null ? "neutral" : totals.unrealizedPLPercent >= 0 ? "positive" : "negative"
                }
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Holdings"
              subtitle="Valuations come straight from the market data provider"
              actions={
                <Button size="sm" variant="secondary" onClick={() => setTxnOpen(true)}>
                  <ArrowDownUp className="h-3.5 w-3.5" /> Record transaction
                </Button>
              }
            />
            <HoldingsTableWrapper
              holdings={data.holdings}
              currency={data.currency}
              portfolioId={data.portfolio.id}
              onChanged={() => selectedId && void loadPortfolio(selectedId)}
            />
          </Card>

          <Card>
            <CardHeader title="Transactions" subtitle="Most recent first" />
            <TransactionsTable transactions={data.transactions} />
          </Card>
        </>
      ) : null}

      <CreatePortfolioModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => {
          setSelectedId(p.id);
          setCreateOpen(false);
          void loadList();
        }}
      />

      <RenameModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        currentName={data?.portfolio.name ?? ""}
        portfolioId={selectedId}
        onRenamed={() => {
          setRenameOpen(false);
          if (selectedId) void loadPortfolio(selectedId);
          void loadList();
        }}
        onDeleted={() => {
          setRenameOpen(false);
          setSelectedId(null);
          setData(null);
          void loadList();
        }}
      />

      <RecordTransactionModal
        open={txnOpen}
        loading={busyPortfolio}
        onClose={() => setTxnOpen(false)}
        portfolioId={selectedId}
        onDone={() => {
          setTxnOpen(false);
          setTxnError(null);
          if (selectedId) void loadPortfolio(selectedId);
        }}
        error={txnError}
        setError={setTxnError}
      />
    </div>
  );
}

function HoldingsTableWrapper({
  holdings,
  currency,
  portfolioId,
  onChanged,
}: {
  holdings: HoldingView[];
  currency: string;
  portfolioId: number;
  onChanged: () => void;
}) {
  return (
    <HoldingsTable
      holdings={holdings}
      currency={currency}
      onRemove={async (holdingId) => {
        await fetch(`/api/portfolio/${portfolioId}?holdingId=${holdingId}`, {
          method: "DELETE",
        });
        onChanged();
      }}
    />
  );
}
