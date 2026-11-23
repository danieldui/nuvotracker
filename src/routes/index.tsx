import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledger — Simple Expense Tracker" },
      { name: "description", content: "Add, edit and delete expenses and see your total spending at a glance." },
      { property: "og:title", content: "Ledger — Simple Expense Tracker" },
      { property: "og:description", content: "Track expenses by description, amount, category and date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Expense = { id: string; description: string; amount: number; category: string; expense_date: string };
const CATEGORIES = ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Health", "Shopping", "Other"];
const today = () => new Date().toISOString().slice(0, 10);
const empty = { description: "", amount: "", category: "Food", expense_date: today() };
const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function Index() {
  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setItems((data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !(amount >= 0) || form.amount === "") { setError("Enter a description and a valid amount."); return; }
    const row = { description: form.description.trim(), amount, category: form.category, expense_date: form.expense_date };
    const { error } = editId
      ? await supabase.from("expenses").update(row).eq("id", editId)
      : await supabase.from("expenses").insert(row);
    if (error) { setError(error.message); return; }
    setError(null); setForm(empty); setEditId(null); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) setError(error.message); else load();
  };

  const total = items.reduce((s, e) => s + e.amount, 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <header className="mb-10 flex items-end justify-between border-b border-border pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ledger</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Expenses</h1>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total spent</p>
            <p className="font-mono text-4xl font-semibold tabular-nums">{fmt(total)}</p>
          </div>
        </header>

        <form onSubmit={submit} className="mb-10 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} aria-label="Description" />
          <Input type="number" step="0.01" min="0" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} aria-label="Amount" />
          <select aria-label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} aria-label="Date" />
          <div className="flex gap-2">
            <Button type="submit">{editId ? "Save" : "Add"}</Button>
            {editId && <Button type="button" variant="ghost" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</Button>}
          </div>
        </form>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No expenses yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((e) => (
              <li key={e.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{e.category} · {e.expense_date}</p>
                </div>
                <p className="font-mono tabular-nums">{fmt(e.amount)}</p>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditId(e.id); setForm({ description: e.description, amount: String(e.amount), category: e.category, expense_date: e.expense_date }); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
