import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "tutubr123";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "login": {
        if (body.password === ADMIN_PASSWORD) {
          await supabase.from("audit_logs").insert({
            actor_type: "admin",
            action: "admin_login",
            metadata: { timestamp: new Date().toISOString() },
          });
          return json({ success: true, token: "admin-" + btoa(ADMIN_PASSWORD) });
        }
        return json({ success: false, error: "Senha incorreta" }, 401);
      }

      case "verify": {
        const valid = body.token === "admin-" + btoa(ADMIN_PASSWORD);
        return json({ success: valid });
      }

      case "stats": {
        const [orders, codes, users, activeOrders] = await Promise.all([
          supabase.from("orders").select("id, status, amount, created_at"),
          supabase.from("access_codes").select("id, status"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id, status, expires_at").eq("status", "code_delivered"),
        ]);

        const allOrders = orders.data || [];
        const allCodes = codes.data || [];
        const totalRevenue = allOrders
          .filter((o: any) => ["code_delivered"].includes(o.status))
          .reduce((sum: number, o: any) => sum + Number(o.amount), 0);

        const now = new Date().toISOString();
        const activeAccess = (activeOrders.data || []).filter(
          (o: any) => o.expires_at && o.expires_at > now
        );
        const expiredAccess = (activeOrders.data || []).filter(
          (o: any) => o.expires_at && o.expires_at <= now
        );

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);
          const dayOrders = allOrders.filter((o: any) => {
            const od = new Date(o.created_at);
            return od >= dayStart && od <= dayEnd;
          });
          return {
            date: dayStart.toISOString().split("T")[0],
            orders: dayOrders.length,
            revenue: dayOrders
              .filter((o: any) => o.status === "code_delivered")
              .reduce((s: number, o: any) => s + Number(o.amount), 0),
          };
        });

        return json({
          totalOrders: allOrders.length,
          pendingOrders: allOrders.filter((o: any) =>
            ["awaiting_payment", "proof_sent", "under_review"].includes(o.status)
          ).length,
          approvedOrders: allOrders.filter((o: any) =>
            ["code_delivered"].includes(o.status)
          ).length,
          rejectedOrders: allOrders.filter((o: any) =>
            ["rejected"].includes(o.status)
          ).length,
          availableCodes: allCodes.filter((c: any) => c.status === "available").length,
          usedCodes: allCodes.filter((c: any) =>
            ["delivered", "used", "expired"].includes(c.status)
          ).length,
          totalUsers: users.count || 0,
          activeAccess: activeAccess.length,
          expiredAccess: expiredAccess.length,
          totalRevenue,
          salesChart: last7Days,
        });
      }

      case "list_orders": {
        const { data, error } = await supabase
          .from("orders")
          .select("*, plans(*)")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }

      case "approve_order": {
        const { data, error } = await supabase.rpc("approve_order", {
          p_order_id: body.order_id,
          p_admin_id: "admin",
        });
        if (error) return json({ error: error.message }, 500);
        return json(data);
      }

      case "reject_order": {
        const { error } = await supabase
          .from("orders")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", body.order_id);
        if (error) return json({ error: error.message }, 500);
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "order_rejected",
          metadata: { order_id: body.order_id },
        });
        return json({ success: true });
      }

      case "list_codes": {
        const { data: codes, error } = await supabase
          .from("access_codes")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return json({ error: "Não foi possível carregar os códigos" }, 500);

        const orderIds = (codes || []).map((code: any) => code.order_id).filter(Boolean);
        const { data: linkedOrders } = orderIds.length
          ? await supabase.from("orders").select("id, order_number").in("id", orderIds)
          : { data: [] };
        const orderMap = Object.fromEntries((linkedOrders || []).map((order: any) => [order.id, order.order_number]));
        return json({ data: (codes || []).map((code: any) => ({
          ...code,
          orders: code.order_id ? { order_number: orderMap[code.order_id] } : null,
        })) });
      }

      case "add_codes": {
        const codes: string[] = body.codes
          .split("\n")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);
        if (codes.length === 0) return json({ error: "Nenhum código válido" }, 400);
        const rows = codes.map((c) => ({ code: c, status: "available" }));
        const { data, error } = await supabase
          .from("access_codes")
          .insert(rows)
          .select("code");
        if (error) return json({ error: error.message }, 500);
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "codes_added",
          metadata: { count: rows.length },
        });
        return json({ success: true, added: data?.length || rows.length });
      }

      case "delete_code": {
        const { error } = await supabase
          .from("access_codes")
          .delete()
          .eq("id", body.code_id)
          .eq("status", "available");
        if (error) return json({ error: error.message }, 500);
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "code_deleted",
          metadata: { code_id: body.code_id },
        });
        return json({ success: true });
      }

      case "block_code": {
        const { error } = await supabase
          .from("access_codes")
          .update({ status: "blocked" })
          .eq("id", body.code_id)
          .in("status", ["available"]);
        if (error) return json({ error: error.message }, 500);
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "code_blocked",
          metadata: { code_id: body.code_id },
        });
        return json({ success: true });
      }

      case "list_plans": {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }

      case "save_plan": {
        const plan = {
          name: body.name,
          description: body.description || null,
          price: Number(body.price),
          duration_hours: Number(body.duration_hours),
          is_active: body.is_active ?? true,
          is_featured: body.is_featured ?? false,
          sort_order: Number(body.sort_order) || 0,
          pix_url: body.pix_url || null,
        };
        if (body.id) {
          const { error } = await supabase.from("plans").update(plan).eq("id", body.id);
          if (error) return json({ error: error.message }, 500);
          await supabase.from("audit_logs").insert({
            actor_type: "admin",
            action: "plan_updated",
            metadata: { plan_id: body.id, name: plan.name },
          });
        } else {
          const { error } = await supabase.from("plans").insert(plan);
          if (error) return json({ error: error.message }, 500);
          await supabase.from("audit_logs").insert({
            actor_type: "admin",
            action: "plan_created",
            metadata: { name: plan.name },
          });
        }
        return json({ success: true });
      }

      case "delete_plan": {
        const { error } = await supabase.from("plans").delete().eq("id", body.plan_id);
        if (error) return json({ error: error.message }, 500);
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "plan_deleted",
          metadata: { plan_id: body.plan_id },
        });
        return json({ success: true });
      }

      case "get_settings": {
        const { data, error } = await supabase.from("settings").select("key, value");
        if (error) return json({ error: error.message }, 500);
        const settings: Record<string, string> = {};
        (data || []).forEach((s: any) => (settings[s.key] = s.value));
        return json({ settings });
      }

      case "save_settings": {
        const entries = Object.entries(body.settings || {});
        for (const [key, value] of entries) {
          const { error } = await supabase
            .from("settings")
            .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: "key" });
          if (error) return json({ error: error.message }, 500);
        }
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          action: "settings_updated",
          metadata: { keys: entries.map(([k]) => k) },
        });
        return json({ success: true });
      }

      case "list_logs": {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }

      case "list_users": {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, created_at")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        const userIds = (data || []).map((u: any) => u.id);
        const { data: userOrders } = userIds.length
          ? await supabase
              .from("orders")
              .select("user_id, status, amount")
              .in("user_id", userIds)
          : { data: [] };
        const userMap: Record<string, any> = {};
        (data || []).forEach((u: any) => {
          userMap[u.id] = { ...u, orders: 0, spent: 0 };
        });
        (userOrders || []).forEach((o: any) => {
          if (userMap[o.user_id]) {
            userMap[o.user_id].orders++;
            if (o.status === "code_delivered") userMap[o.user_id].spent += Number(o.amount);
          }
        });
        return json({ data: Object.values(userMap) });
      }

      default:
        return json({ error: "Ação não reconhecida" }, 400);
    }
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
