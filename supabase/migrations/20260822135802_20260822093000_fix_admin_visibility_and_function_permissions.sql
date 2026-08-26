/*
# Fix admin visibility and database function permissions

1. Data integrity
- Add the missing foreign key from access_codes.order_id to orders.id.
- Existing rows are preserved; null order references remain valid.

2. Admin visibility
- The administrative edge function can now safely associate each code with its order.
- This supports the admin code list without relying on a relationship that did not exist.

3. Security
- Remove public execution of server-only SECURITY DEFINER functions.
- Keep execution available to the service role used by the protected edge functions.

4. Important notes
- No user rows, orders, plans, or codes are deleted.
- Code assignment remains atomic inside approve_order with row locking.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_codes_order_id_fkey'
      AND conrelid = 'public.access_codes'::regclass
  ) THEN
    ALTER TABLE public.access_codes
      ADD CONSTRAINT access_codes_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.approve_order(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_order(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
