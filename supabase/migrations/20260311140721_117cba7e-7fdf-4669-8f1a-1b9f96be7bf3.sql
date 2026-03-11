-- Allow saas team to read all credit_transactions for billing dashboard
CREATE POLICY "Saas team can view all transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (is_saas_team(auth.uid()));

-- Allow saas team to insert transactions (for manual credit adjustments)
CREATE POLICY "Saas team can insert transactions"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (is_saas_team(auth.uid()));