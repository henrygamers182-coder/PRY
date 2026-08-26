import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { plan_id } = await req.json();
    const authorization = req.headers.get("Authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "");

    if (!plan_id || !accessToken) {
      return json({ error: "Sessão inválida" }, 401);
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return json({ error: "Sessão inválida" }, 401);
    }
    const user_id = authData.user.id;

    // Look up the real plan price from the database (never trust client price)
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, price, duration_hours, is_active")
      .eq("id", plan_id)
      .maybeSingle();

    if (planError || !plan) {
      return json({ error: "Plano não encontrado" }, 404);
    }

    if (!plan.is_active) {
      return json({ error: "Este plano não está disponível" }, 400);
    }

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number, amount, status")
      .eq("user_id", user_id)
      .eq("plan_id", plan_id)
      .in("status", ["awaiting_payment", "proof_sent", "under_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOrder) {
      return json({ success: true, order: existingOrder, existing: true });
    }

    // Generate order number
    const { data: orderNumber, error: numberError } = await supabase.rpc("generate_order_number");
    if (numberError || !orderNumber) {
      return json({ error: "Não foi possível gerar o pedido" }, 500);
    }

    // Create the order with server-side price
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user_id,
        plan_id: plan_id,
        amount: plan.price,
        status: "awaiting_payment",
      })
      .select("id, order_number, amount, status")
      .single();

    if (orderError) {
      return json({ error: "Erro ao criar pedido" }, 500);
    }

    // Log it
    await supabase.from("audit_logs").insert({
      actor_type: "user",
      actor_id: user_id,
      action: "order_created",
      metadata: { order_id: order.id, order_number: order.order_number, plan: plan.name },
    });

    return json({ success: true, order });
  } catch (err) {
    return json({ error: "Erro interno do servidor" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
