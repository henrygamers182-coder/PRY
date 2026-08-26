/*
# Add Pix payment URL to plans and update product catalog

1. Changes
- Add `pix_url` column to plans table (stores the Nubank Pix payment link per plan)
- Replace existing plans with the 5 new products at the requested prices
- Each plan has its own Pix payment link and QR code

2. Security
- pix_url is readable by anon + authenticated (already covered by existing plans SELECT policy)

3. Important notes
- No user data is deleted
- Existing orders keep their plan_id reference (plans are updated, not dropped)
*/

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS pix_url text;

-- Update existing plans and insert new ones
-- Delete old plans that don't match new prices (safe: orders reference plan_id with ON DELETE SET NULL, but we update instead)
INSERT INTO public.plans (name, description, price, duration_hours, is_active, is_featured, sort_order, pix_url)
VALUES
  ('Teste Grátis', 'Acesso gratuito para experimentar', 0.00, 1, true, false, 0, 'https://nubank.com.br/cobrar/f9ofdi/6a89a6eb-d879-4962-9176-50c6c702f2eb'),
  ('3 Dias', 'Acesso completo por 3 dias', 49.99, 72, true, true, 1, 'https://nubank.com.br/cobrar/f9ofdi/6a89a8fe-b8be-4987-8e0d-d348ea5b2a48'),
  ('7 Dias', 'Acesso completo por 7 dias', 69.99, 168, true, false, 2, 'https://nubank.com.br/cobrar/f9ofdi/6a89a8b4-f474-4a00-a195-a719671c6bc5'),
  ('15 Dias', 'Acesso completo por 15 dias', 149.99, 360, true, false, 3, 'https://nubank.com.br/cobrar/f9ofdi/6a89a8d4-a64a-4630-9705-0879b121557a'),
  ('30 Dias', 'Acesso completo por 30 dias', 279.99, 720, true, false, 4, 'https://nubank.com.br/cobrar/f9ofdi/6a89a8e8-0b7d-4aca-a142-50980942d4b9')
ON CONFLICT (id) DO NOTHING;

-- Deactivate old plans that don't match the new catalog
UPDATE public.plans SET is_active = false
WHERE pix_url IS NULL;

-- Update the 3 Dias plan if it already existed (price was 49.99, now keep 49.99 but add pix_url)
UPDATE public.plans SET pix_url = 'https://nubank.com.br/cobrar/f9ofdi/6a89a8fe-b8be-4987-8e0d-d348ea5b2a48'
WHERE name = '3 Dias' AND pix_url IS NULL;
