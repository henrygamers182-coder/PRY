import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, Clock, Key, CreditCard, CheckCircle, XCircle, Loader2,
  LogOut, Package, Bell, AlertCircle, Calendar, Timer, ArrowRight
} from 'lucide-react';
import { supabase, Order, STATUS_LABELS, STATUS_COLORS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const hours = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hours}h ${mins}min ${secs}s`;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const ownOrders = data || [];
    const codeIds = ownOrders.map((order) => order.access_code_id).filter(Boolean) as string[];
    const { data: codes } = codeIds.length
      ? await supabase.from('access_codes').select('id, code').in('id', codeIds).eq('user_id', user.id)
      : { data: [] as { id: string; code: string }[] };
    setAccessCodes(Object.fromEntries((codes || []).map((code) => [code.id, code.code])));
    setOrders(ownOrders);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadOrders();
  }, [user, navigate, loadOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadOrders]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Find active order (code delivered and not expired)
  const activeOrder = orders.find(
    (o) => o.status === 'code_delivered' && o.expires_at && new Date(o.expires_at) > new Date()
  );
  const expiredOrder = orders.find(
    (o) => o.status === 'code_delivered' && o.expires_at && new Date(o.expires_at) <= new Date()
  );

  const remaining = useCountdown(activeOrder?.expires_at || null);
  const pendingOrders = orders.filter((o) =>
    ['awaiting_payment', 'proof_sent', 'under_review'].includes(o.status)
  );

  const notifications: { type: 'success' | 'info' | 'warning'; message: string }[] = [];
  if (activeOrder) notifications.push({ type: 'success', message: 'Seu código foi liberado!' });
  if (pendingOrders.length > 0) notifications.push({ type: 'info', message: `Você tem ${pendingOrders.length} pedido(s) em andamento.` });
  if (remaining !== null && remaining < 24 * 3600 * 1000 && remaining > 0) {
    notifications.push({ type: 'warning', message: 'Seu acesso está próximo de expirar.' });
  }
  if (expiredOrder) notifications.push({ type: 'warning', message: 'Seu acesso expirou.' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pry-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {user?.email}</h1>
            <p className="text-zinc-400 text-sm">Bem-vindo ao seu painel</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="btn-ghost text-sm flex items-center gap-2">
              <Package className="w-4 h-4" /> Ver planos
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sair da conta
            </button>
          </div>
        </div>

        {/* Active access card */}
        {activeOrder && remaining !== null && (
          <div className="card mb-6 border-pry-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pry-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold">Acesso ativo</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Plano</p>
                  <p className="font-semibold">{activeOrder.plans?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Status</p>
                  <span className={`px-3 py-0.5 rounded-full text-xs border ${STATUS_COLORS[activeOrder.status]}`}>
                    {STATUS_LABELS[activeOrder.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Ativado em</p>
                  <p className="text-sm">{activeOrder.activated_at ? new Date(activeOrder.activated_at).toLocaleString('pt-BR') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Expira em</p>
                  <p className="text-sm">{activeOrder.expires_at ? new Date(activeOrder.expires_at).toLocaleString('pt-BR') : '—'}</p>
                </div>
              </div>

              {/* Countdown */}
              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-pry-400" />
                  <span className="text-sm text-zinc-400">Acesso válido por</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-pry-300 tracking-tight">
                  {formatTime(remaining)}
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-pry-500 to-cyan-300 animate-pulse" style={{ width: '72%' }} />
                </div>
              </div>

              {/* Access code */}
              <div className="bg-gradient-to-r from-pry-500/10 to-pry-700/10 rounded-xl p-4 border border-pry-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-pry-400" />
                  <span className="text-sm text-zinc-400">Seu código de acesso</span>
                </div>
                <code className="text-lg font-mono font-bold text-white break-all">
                  {activeOrder.access_code_id ? accessCodes[activeOrder.access_code_id] || 'Carregando código...' : '—'}
                </code>
                <p className="text-xs text-zinc-500 mt-2">
                  O código foi associado ao seu pedido {activeOrder.order_number}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expired access */}
        {expiredOrder && !activeOrder && (
          <div className="card mb-6 border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-bold text-zinc-400">Acesso expirado</h2>
            </div>
            <p className="text-sm text-zinc-500">Seu acesso do plano {expiredOrder.plans?.name} expirou. Adquira um novo plano para continuar.</p>
            <Link to="/" className="btn-primary text-sm inline-flex items-center gap-2 mt-4">
              Comprar novo acesso <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-pry-400" />
              <h3 className="font-semibold text-sm">Notificações</h3>
            </div>
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {n.type === 'info' && <AlertCircle className="w-4 h-4 text-pry-400 shrink-0 mt-0.5" />}
                  {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  <span className="text-zinc-300">{n.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div className="card">
          <h3 className="font-semibold mb-4">Meus pedidos</h3>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-4">Você ainda não possui pedidos.</p>
              <Link to="/" className="btn-primary text-sm inline-flex items-center gap-2">
                Ver planos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pry-500/10 border border-pry-500/20 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-pry-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                        <p className="text-xs text-zinc-500">{order.plans?.name || '—'} — R$ {Number(order.amount).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.status === 'awaiting_payment' && (
                        <Link to={`/checkout/${order.plan_id}`} className="btn-ghost text-xs py-1.5 px-3">
                          Pagar
                        </Link>
                      )}
                      {['proof_sent', 'under_review'].includes(order.status) && (
                        <Link to={`/checkout/${order.plan_id}`} className="btn-ghost text-xs py-1.5 px-3">
                          Ver
                        </Link>
                      )}
                    </div>
                  </div>
                  {order.expires_at && (
                    <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {order.status === 'code_delivered' && new Date(order.expires_at) > new Date()
                        ? `Expira em ${new Date(order.expires_at).toLocaleString('pt-BR')}`
                        : order.status === 'code_delivered'
                        ? 'Expirado'
                        : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
