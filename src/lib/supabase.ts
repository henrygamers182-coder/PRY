import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  pix_url: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  status: "awaiting_payment" | "proof_sent" | "under_review" | "approved" | "rejected" | "code_delivered" | "expired" | "cancelled";
  payment_proof_url: string | null;
  access_code_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  plans?: Plan;
}

export interface AccessCode {
  id: string;
  code: string;
  status: "available" | "reserved" | "delivered" | "used" | "expired" | "blocked";
  order_id: string | null;
  user_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  proof_sent: "Comprovante enviado",
  under_review: "Em análise",
  approved: "Pagamento aprovado",
  rejected: "Pagamento recusado",
  code_delivered: "Código liberado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  proof_sent: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  under_review: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  rejected: "text-red-400 bg-red-400/10 border-red-400/30",
  code_delivered: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  expired: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
  cancelled: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
};

export async function callAdminAction(action: string, body: any = {}) {
  const url = `${supabaseUrl}/functions/v1/admin-action`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro de conexão" }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export async function callCreateOrder(planId: string, userId: string) {
  const url = `${supabaseUrl}/functions/v1/create-order`;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || supabaseAnonKey}`,
    },
    body: JSON.stringify({ plan_id: planId, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro de conexão" }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}
