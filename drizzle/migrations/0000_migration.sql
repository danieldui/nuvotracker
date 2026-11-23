CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  expense_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON public.expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON public.expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.expenses FOR DELETE TO anon, authenticated USING (true);