import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Lock, Loader2, LogOut, LayoutDashboard, Package, CreditCard,
  Key, Users, Settings, FileText, Headphones, CheckCircle, XCircle,
  Plus, Trash2, Ban, Eye, TrendingUp, DollarSign, ShoppingCart,
  Clock, AlertCircle, ArrowLeft, Save, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { callAdminAction } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

type Tab = 'overview' | 'orders' | 'payments' | 'proofs' | 'codes' | 'users' | 'plans' | 'settings' | 'logs' | 'support';

export default function AdminPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  // Data
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(false);

  // Action states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newCodes, setNewCodes] = useState('');
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const res = await callAdminAction('login', { password });
      if (res.success) {
        setAuthed(true);
        sessionStorage.setItem('pry_admin', res.token);
        notify('success', 'Login administrativo realizado!');
        loadAllData();
      } else {
        notify('error', res.error || 'Senha incorreta');
      }
    } catch (err: any) {
      notify('error', err.message);
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pry_admin');
    setAuthed(false);
    navigate('/');
  };

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const results = await Promise.allSettled([
        callAdminAction('stats'),
        callAdminAction('list_orders'),
        callAdminAction('list_codes'),
        callAdminAction('list_plans'),
        callAdminAction('list_users'),
        callAdminAction('list_logs'),
        callAdminAction('get_settings'),
      ]);
      const [statsRes, ordersRes, codesRes, plansRes, usersRes, logsRes, settingsRes] = results.map(
        (result) => result.status === 'fulfilled' ? result.value : null
      );
      if (results.some((result) => result.status === 'rejected')) {
        notify('error', 'Algumas informações não puderam ser carregadas. Tente atualizar.');
      }
      if (statsRes) setStats(statsRes);
      if (ordersRes) setOrders(ordersRes.data || []);
      if (codesRes) setCodes(codesRes.data || []);
      if (plansRes) setPlans(plansRes.data || []);
      if (usersRes) setUsers(usersRes.data || []);
      if (logsRes) setLogs(logsRes.data || []);
      if (settingsRes) setSettings(settingsRes.settings || {});
    } catch (err: any) {
      notify('error', 'Erro ao carregar dados');
    }
    setDataLoading(false);
  }, [notify]);

  useEffect(() => {
    const token = sessionStorage.getItem('pry_admin');
    if (token) {
      callAdminAction('verify', { token }).then((res) => {
        if (res.success) {
          setAuthed(true);
          loadAllData();
        } else {
          sessionStorage.removeItem('pry_admin');
        }
      });
    }
  }, [loadAllData]);

  const handleApprove = async (orderId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await callAdminAction('approve_order', { order_id: orderId });
      if (res.success) {
        notify('success', `Pagamento aprovado! Código ${res.code} liberado.`);
        setSelectedOrder(null);
        loadAllData();
      } else {
        notify('error', res.error || 'Erro ao aprovar pagamento');
      }
    } catch (err: any) {
      notify('error', err.message);
    }
    setActionLoading(false);
  };

  const handleReject = async (orderId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await callAdminAction('reject_order', { order_id: orderId });
      if (res.success) {
        notify('info', 'Pagamento recusado.');
        setSelectedOrder(null);
        loadAllData();
      } else {
        notify('error', res.error || 'Erro ao recusar');
      }
    } catch (err: any) {
      notify('error', err.message);
    }
    setActionLoading(false);
  };

  const handleAddCodes = async () => {
    if (!newCodes.trim()) return;
    try {
      const res = await callAdminAction('add_codes', { codes: newCodes });
      if (res.success) {
        notify('success', `${res.added} código(s) adicionado(s)!`);
        setNewCodes('');
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const res = await callAdminAction('delete_code', { code_id: codeId });
      if (res.success) {
        notify('success', 'Código excluído.');
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleBlockCode = async (codeId: string) => {
    try {
      const res = await callAdminAction('block_code', { code_id: codeId });
      if (res.success) {
        notify('success', 'Código bloqueado.');
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await callAdminAction('save_plan', editingPlan);
      if (res.success) {
        notify('success', 'Plano salvo com sucesso!');
        setEditingPlan(null);
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const res = await callAdminAction('delete_plan', { plan_id: planId });
      if (res.success) {
        notify('success', 'Plano excluído.');
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await callAdminAction('save_settings', { settings });
      if (res.success) {
        notify('success', 'Configurações salvas!');
        loadAllData();
      } else {
        notify('error', res.error);
      }
    } catch (err: any) {
      notify('error', err.message);
    }
  };

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-pry-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pry-400 to-pry-700 flex items-center justify-center shadow-lg shadow-pry-500/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">PRY Admin</span>
          </div>
          <div className="card animate-slide-up">
            <h1 className="text-xl font-bold mb-1">Área administrativa</h1>
            <p className="text-zinc-400 text-sm mb-6">Acesso restrito</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Senha administrativa"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
              </button>
            </form>
            <button onClick={() => navigate('/')} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao site
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { key: 'orders', label: 'Pedidos', icon: Package },
    { key: 'payments', label: 'Pagamentos', icon: CreditCard },
    { key: 'proofs', label: 'Comprovantes', icon: FileText },
    { key: 'codes', label: 'Códigos', icon: Key },
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'plans', label: 'Planos', icon: Settings },
    { key: 'settings', label: 'Configurações', icon: Settings },
    { key: 'logs', label: 'Logs', icon: FileText },
    { key: 'support', label: 'Suporte', icon: Headphones },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 glass lg:min-h-screen lg:fixed lg:left-0 lg:top-0 border-r border-white/5 z-40">
        <div className="p-4 flex items-center justify-between lg:block">
          <div className="flex items-center gap-2 mb-0 lg:mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pry-400 to-pry-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold">PRY Admin</span>
          </div>
        </div>

        <nav className="px-2 pb-4 lg:pb-0 flex lg:flex-col gap-1 overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSelectedOrder(null); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                tab === item.key ? 'bg-pry-500/20 text-pry-300 border border-pry-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400/80 hover:bg-red-500/10 transition-all whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Sair
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 pt-6">
        {dataLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-pry-400 animate-spin" />
          </div>
        )}

        {!dataLoading && (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && stats && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Visão geral</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={ShoppingCart} label="Total de pedidos" value={stats.totalOrders} color="text-pry-400" />
                  <StatCard icon={Clock} label="Pendentes" value={stats.pendingOrders} color="text-amber-400" />
                  <StatCard icon={CheckCircle} label="Aprovados" value={stats.approvedOrders} color="text-emerald-400" />
                  <StatCard icon={XCircle} label="Recusados" value={stats.rejectedOrders} color="text-red-400" />
                  <StatCard icon={Key} label="Códigos disponíveis" value={stats.availableCodes} color="text-pry-400" />
                  <StatCard icon={Key} label="Códigos usados" value={stats.usedCodes} color="text-zinc-400" />
                  <StatCard icon={Users} label="Usuários" value={stats.totalUsers} color="text-pry-400" />
                  <StatCard icon={CheckCircle} label="Acessos ativos" value={stats.activeAccess} color="text-emerald-400" />
                  <StatCard icon={XCircle} label="Acessos expirados" value={stats.expiredAccess} color="text-zinc-500" />
                  <StatCard icon={DollarSign} label="Receita total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} color="text-emerald-400" />
                </div>

                {/* Sales chart */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-pry-400" />
                    <h3 className="font-semibold">Vendas dos últimos 7 dias</h3>
                  </div>
                  <div className="flex items-end gap-2 h-40">
                    {stats.salesChart?.map((day: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-pry-500/20 rounded-t-lg flex items-end" style={{ height: '100%' }}>
                          <div
                            className="w-full bg-gradient-to-t from-pry-600 to-pry-400 rounded-t-lg transition-all"
                            style={{ height: `${Math.max((day.orders / Math.max(...stats.salesChart.map((d: any) => d.orders), 1)) * 100, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">{day.date.split('-').slice(2).join('/')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {tab === 'orders' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
                {selectedOrder ? (
                  <OrderDetail
                    order={selectedOrder}
                    onBack={() => setSelectedOrder(null)}
                    onApprove={() => handleApprove(selectedOrder.id)}
                    onReject={() => handleReject(selectedOrder.id)}
                    actionLoading={actionLoading}
                  />
                ) : orders.length === 0 ? (
                  <EmptyState icon={Package} text="Nenhum pedido encontrado." />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="card w-full text-left hover:border-pry-500/20 transition-all"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                            <p className="text-xs text-zinc-500">{order.plans?.name} — R$ {Number(order.amount).toFixed(2)}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS */}
            {tab === 'payments' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Pagamentos</h1>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={Clock} label="Aguardando" value={orders.filter(o => o.status === 'awaiting_payment').length} color="text-amber-400" />
                    <StatCard icon={FileText} label="Em análise" value={orders.filter(o => ['proof_sent', 'under_review'].includes(o.status)).length} color="text-blue-400" />
                    <StatCard icon={CheckCircle} label="Aprovados" value={orders.filter(o => o.status === 'code_delivered').length} color="text-emerald-400" />
                  </div>
                  {orders.filter(o => ['proof_sent', 'under_review'].includes(o.status)).map((order) => (
                    <div key={order.id} className="card">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                          <p className="text-xs text-zinc-500">{order.plans?.name} — R$ {Number(order.amount).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(order.id)} disabled={actionLoading} className="btn-primary text-xs py-2 flex items-center gap-1">
                            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Aprovar
                          </button>
                          <button onClick={() => handleReject(order.id)} disabled={actionLoading} className="btn-ghost text-xs py-2 text-red-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Recusar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => ['proof_sent', 'under_review'].includes(o.status)).length === 0 && (
                    <EmptyState icon={CheckCircle} text="Nenhum pagamento pendente." />
                  )}
                </div>
              </div>
            )}

            {/* PROOFS */}
            {tab === 'proofs' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Comprovantes</h1>
                {orders.filter(o => o.payment_proof_url).length === 0 ? (
                  <EmptyState icon={FileText} text="Nenhum comprovante enviado." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.filter(o => o.payment_proof_url).map((order) => (
                      <div key={order.id} className="card">
                        <p className="font-mono text-sm font-semibold mb-2">{order.order_number}</p>
                        <StatusBadge status={order.status} />
                        <div className="mt-3">
                          {order.payment_proof_url.endsWith('.pdf') ? (
                            <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs w-full text-center flex items-center justify-center gap-2">
                              <Eye className="w-3.5 h-3.5" /> Ver comprovante
                            </a>
                          ) : (
                            <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              <img src={order.payment_proof_url} alt="Comprovante" className="rounded-lg max-h-40 w-full object-cover border border-white/10" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CODES */}
            {tab === 'codes' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Códigos</h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={Key} label="Disponíveis" value={codes.filter(c => c.status === 'available').length} color="text-emerald-400" />
                  <StatCard icon={Key} label="Entregues" value={codes.filter(c => c.status === 'delivered').length} color="text-pry-400" />
                  <StatCard icon={Ban} label="Bloqueados" value={codes.filter(c => c.status === 'blocked').length} color="text-red-400" />
                  <StatCard icon={Key} label="Total" value={codes.length} color="text-zinc-400" />
                </div>

                {/* Add codes */}
                <div className="card mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-pry-400" /> Adicionar códigos</h3>
                  <textarea
                    value={newCodes}
                    onChange={(e) => setNewCodes(e.target.value)}
                    className="input-field mb-3 min-h-[100px] font-mono text-sm"
                    placeholder="Um código por linha..."
                  />
                  <button onClick={handleAddCodes} className="btn-primary text-sm">Adicionar códigos</button>
                </div>

                {/* Code list */}
                {codes.length === 0 ? (
                  <EmptyState icon={Key} text="Nenhum código disponível." />
                ) : (
                  <div className="space-y-2">
                    {codes.map((code) => (
                      <div key={code.id} className="card flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <code className="font-mono text-sm font-semibold">{code.code}</code>
                          <CodeStatusBadge status={code.status} />
                          {code.orders?.order_number && (
                            <span className="text-xs text-zinc-500">{code.orders.order_number}</span>
                          )}
                        </div>
                        {code.status === 'available' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleBlockCode(code.id)} className="btn-ghost text-xs py-1.5 px-3 text-amber-400 flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Bloquear
                            </button>
                            <button onClick={() => handleDeleteCode(code.id)} className="btn-ghost text-xs py-1.5 px-3 text-red-400 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Usuários</h1>
                {users.length === 0 ? (
                  <EmptyState icon={Users} text="Nenhum usuário encontrado." />
                ) : (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="card flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-semibold text-sm">{u.name || 'Sem nome'}</p>
                          <p className="text-xs text-zinc-500">{new Date(u.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-zinc-400">{u.orders} pedido(s)</span>
                          <span className="text-emerald-400">R$ {Number(u.spent).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PLANS */}
            {tab === 'plans' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold">Planos</h1>
                  <button
                    onClick={() => setEditingPlan({ name: '', description: '', price: 0, duration_hours: 24, is_active: true, is_featured: false, sort_order: 0 })}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Novo plano
                  </button>
                </div>

                {editingPlan && (
                  <form onSubmit={handleSavePlan} className="card mb-6 animate-slide-down">
                    <h3 className="font-semibold mb-4">{editingPlan.id ? 'Editar plano' : 'Novo plano'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-zinc-400 mb-1.5 block">Nome</label>
                        <input type="text" required value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} className="input-field" placeholder="Ex: 1 Dia" />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1.5 block">Preço (R$)</label>
                        <input type="number" step="0.01" required value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })} className="input-field" placeholder="19.99" />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1.5 block">Duração (horas)</label>
                        <input type="number" required value={editingPlan.duration_hours} onChange={(e) => setEditingPlan({ ...editingPlan, duration_hours: e.target.value })} className="input-field" placeholder="24" />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1.5 block">Ordem</label>
                        <input type="number" value={editingPlan.sort_order} onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: e.target.value })} className="input-field" placeholder="1" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-zinc-400 mb-1.5 block">Descrição</label>
                        <input type="text" value={editingPlan.description || ''} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} className="input-field" placeholder="Acesso completo por 24 horas" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-zinc-400 mb-1.5 block flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-pry-400" /> Link do Pix (QR Code)</label>
                        <input type="text" value={editingPlan.pix_url || ''} onChange={(e) => setEditingPlan({ ...editingPlan, pix_url: e.target.value })} className="input-field" placeholder="https://nubank.com.br/cobrar/..." />
                        <p className="text-xs text-zinc-500 mt-1">Cole o link de cobrança Pix. O QR code sera gerado automaticamente na pagina de pagamento.</p>
                      </div>
                      {editingPlan.pix_url && (
                        <div className="sm:col-span-2 flex flex-col items-center gap-2">
                          <div className="bg-white p-3 rounded-xl">
                            <QRCodeSVG value={editingPlan.pix_url} size={120} level="M" bgColor="#ffffff" fgColor="#0a0a0f" />
                          </div>
                          <span className="text-xs text-zinc-500">Preview do QR Code</span>
                        </div>
                      )}
                      <div className="flex gap-6 items-center">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={editingPlan.is_active} onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })} className="w-4 h-4 accent-pry-500" />
                          Ativo
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={editingPlan.is_featured} onChange={(e) => setEditingPlan({ ...editingPlan, is_featured: e.target.checked })} className="w-4 h-4 accent-pry-500" />
                          Destaque
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button type="submit" className="btn-primary text-sm flex items-center gap-2">
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                      <button type="button" onClick={() => setEditingPlan(null)} className="btn-ghost text-sm">Cancelar</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="card flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">{plan.name} {plan.is_featured && <span className="text-xs text-pry-400 ml-2">★ Destaque</span>}</p>
                        <p className="text-xs text-zinc-500">{plan.description} — R$ {Number(plan.price).toFixed(2)} — {plan.duration_hours}h {plan.is_active ? '✓' : '✗'}</p>
                        {plan.pix_url && <p className="text-xs text-pry-400 mt-0.5 flex items-center gap-1"><QrCode className="w-3 h-3" /> Pix configurado</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPlan(plan)} className="btn-ghost text-xs py-1.5 px-3">Editar</button>
                        <button onClick={() => handleDeletePlan(plan.id)} className="btn-ghost text-xs py-1.5 px-3 text-red-400 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab === 'settings' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Configurações</h1>
                <div className="card space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Nome da plataforma</label>
                    <input type="text" value={settings.platform_name || ''} onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Chave PIX</label>
                    <input type="text" value={settings.pix_key || ''} onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">URL do Discord</label>
                    <input type="text" value={settings.discord_url || ''} onChange={(e) => setSettings({ ...settings, discord_url: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Email de suporte</label>
                    <input type="text" value={settings.support_email || ''} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} className="input-field" />
                  </div>
                  <button onClick={handleSaveSettings} className="btn-primary text-sm flex items-center gap-2">
                    <Save className="w-4 h-4" /> Salvar configurações
                  </button>
                </div>
              </div>
            )}

            {/* LOGS */}
            {tab === 'logs' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Logs de auditoria</h1>
                {logs.length === 0 ? (
                  <EmptyState icon={FileText} text="Nenhum log encontrado." />
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="card flex items-center justify-between flex-wrap gap-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                            log.actor_type === 'admin' ? 'bg-pry-500/20 text-pry-300' : 'bg-zinc-700 text-zinc-300'
                          }`}>{log.actor_type}</span>
                          <span className="text-zinc-300">{log.action}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUPPORT */}
            {tab === 'support' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold mb-6">Suporte</h1>
                <div className="card max-w-lg text-center">
                  <div className="w-16 h-16 rounded-2xl bg-pry-500/10 border border-pry-500/20 flex items-center justify-center mx-auto mb-4">
                    <Headphones className="w-8 h-8 text-pry-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Discord de suporte</h3>
                  <p className="text-zinc-400 text-sm mb-4">Canal oficial de atendimento</p>
                  <a href={settings.discord_url || 'https://discord.gg/e2pArCHT4P'} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 text-sm">
                    <Headphones className="w-4 h-4" /> Abrir Discord
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    awaiting_payment: 'Aguardando pagamento', proof_sent: 'Comprovante enviado', under_review: 'Em análise',
    approved: 'Aprovado', rejected: 'Recusado', code_delivered: 'Código liberado', expired: 'Expirado', cancelled: 'Cancelado',
  };
  const colors: Record<string, string> = {
    awaiting_payment: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    proof_sent: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    under_review: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    approved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
    code_delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    expired: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
    cancelled: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
  };
  return <span className={`px-3 py-1 rounded-full text-xs border ${colors[status] || 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30'}`}>{labels[status] || status}</span>;
}

function CodeStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    available: 'Disponível', reserved: 'Reservado', delivered: 'Entregue', used: 'Utilizado', expired: 'Expirado', blocked: 'Bloqueado',
  };
  const colors: Record<string, string> = {
    available: 'text-emerald-400', reserved: 'text-amber-400', delivered: 'text-pry-400',
    used: 'text-zinc-400', expired: 'text-zinc-500', blocked: 'text-red-400',
  };
  return <span className={`text-xs font-medium ${colors[status] || 'text-zinc-400'}`}>{labels[status] || status}</span>;
}

function OrderDetail({ order, onBack, onApprove, onReject, actionLoading }: any) {
  return (
    <div className="animate-slide-up">
      <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label="Número" value={order.order_number} mono />
          <div><span className="text-xs text-zinc-500 block mb-1">Status</span><StatusBadge status={order.status} /></div>
          <Detail label="Plano" value={order.plans?.name || '—'} />
          <Detail label="Valor" value={`R$ ${Number(order.amount).toFixed(2)}`} />
          <Detail label="Data" value={new Date(order.created_at).toLocaleString('pt-BR')} />
          {order.expires_at && <Detail label="Expira em" value={new Date(order.expires_at).toLocaleString('pt-BR')} />}
        </div>

        {order.payment_proof_url && (
          <div>
            <span className="text-xs text-zinc-500 block mb-2">Comprovante</span>
            {order.payment_proof_url.endsWith('.pdf') ? (
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm flex items-center gap-2 w-fit">
                <Eye className="w-4 h-4" /> Ver comprovante (PDF)
              </a>
            ) : (
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                <img src={order.payment_proof_url} alt="Comprovante" className="rounded-xl max-h-64 border border-white/10" />
              </a>
            )}
          </div>
        )}

        {['proof_sent', 'under_review'].includes(order.status) && (
          <div className="flex gap-2 pt-4 border-t border-white/5">
            <button onClick={onApprove} disabled={actionLoading} className="btn-primary flex items-center gap-2">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aprovar pagamento
            </button>
            <button onClick={onReject} disabled={actionLoading} className="btn-ghost text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Recusar pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-zinc-500 block mb-1">{label}</span>
      <span className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
      <p className="text-zinc-500 text-sm">{text}</p>
    </div>
  );
}
