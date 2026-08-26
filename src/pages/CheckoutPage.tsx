import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Zap, Clock, CreditCard, Upload, CheckCircle, Key, Copy, Loader2,
  ArrowLeft, FileImage, AlertCircle, ArrowRight, ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, Plan, Order, STATUS_LABELS, STATUS_COLORS, callCreateOrder } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const STEPS = [
  { key: 'plan', label: 'Plano', icon: Clock },
  { key: 'payment', label: 'Pagamento', icon: CreditCard },
  { key: 'proof', label: 'Comprovante', icon: Upload },
  { key: 'review', label: 'Análise', icon: CheckCircle },
  { key: 'delivered', label: 'Liberado', icon: Key },
];

export default function CheckoutPage() {
  const { packageId } = useParams<{ packageId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=checkout-' + packageId);
      return;
    }
    if (!user) return;

    supabase.from('plans').select('*').eq('id', packageId).maybeSingle()
      .then(({ data }) => {
        if (!data || !data.is_active) {
          notify('error', 'Plano indisponível');
          navigate('/');
          return;
        }
        setPlan(data);
        setLoading(false);
      });

    // Check if there's already a pending order for this plan
    supabase
      .from('orders')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .eq('plan_id', packageId)
      .in('status', ['awaiting_payment', 'proof_sent', 'under_review'])
      .order('created_at', { ascending: false })
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOrder(data);
      });
  }, [packageId, user, authLoading, navigate, notify]);

  const handleCreateOrder = async () => {
    if (creating || !user) return;
    setCreating(true);
    try {
      const result = await callCreateOrder(packageId!, user.id);
      if (result.success) {
        notify('success', 'Pedido criado com sucesso!');
        const { data: fullOrder } = await supabase
          .from('orders')
          .select('*, plans(*)')
          .eq('id', result.order.id)
          .single();
        setOrder(fullOrder);
      } else {
        notify('error', result.error || 'Erro ao criar pedido');
      }
    } catch (err: any) {
      notify('error', err.message || 'Erro de conexão');
    }
    setCreating(false);
  };

  const handleCopyPix = () => {
    if (!plan?.pix_url) return;
    navigator.clipboard.writeText(plan.pix_url).then(() => {
      setCopied(true);
      notify('success', 'Link PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order || !user) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      notify('error', 'Formato inválido. Use PNG, JPG, JPEG ou PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('error', 'Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${order.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      const proofUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from('orders')
        .update({ payment_proof_url: proofUrl, status: 'proof_sent', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (updateErr) throw updateErr;

      setOrder({ ...order, payment_proof_url: proofUrl, status: 'proof_sent' });
      notify('success', 'Comprovante enviado com sucesso! Aguarde a análise.');
    } catch (err: any) {
      notify('error', 'Erro ao enviar comprovante. Tente novamente.');
    }
    setUploading(false);
  };

  const currentStep = order
    ? order.status === 'awaiting_payment'
      ? 1
      : ['proof_sent', 'under_review'].includes(order.status)
      ? 3
      : order.status === 'code_delivered'
      ? 4
      : 1
    : 0;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pry-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className={`flex flex-col items-center gap-1.5 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < currentStep ? 'bg-pry-500 border-pry-500' :
                  i === currentStep ? 'border-pry-400 bg-pry-500/10' : 'border-zinc-700 bg-white/[0.02]'
                }`}>
                  {i < currentStep ? <CheckCircle className="w-5 h-5 text-white" /> :
                  <step.icon className={`w-5 h-5 ${i === currentStep ? 'text-pry-400' : 'text-zinc-600'}`} />}
                </div>
                <span className={`text-xs ${i <= currentStep ? 'text-zinc-300' : 'text-zinc-600'}`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 ${i < currentStep ? 'bg-pry-500' : 'bg-zinc-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Plan info */}
        {plan && (
          <div className="card mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-sm text-zinc-400">{plan.description}</p>
                <p className="text-sm text-pry-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {plan.duration_hours >= 24
                    ? `${plan.duration_hours / 24} ${plan.duration_hours / 24 === 1 ? 'dia' : 'dias'} de acesso`
                    : `${plan.duration_hours} horas de acesso`}
                </p>
              </div>
              <div className="text-3xl font-extrabold">
                R$ {Number(plan.price).toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        )}

        {/* Create order */}
        {!order && (
          <div className="card text-center">
            <p className="text-zinc-400 mb-6">Confirme o plano para gerar seu pedido.</p>
            <button onClick={handleCreateOrder} disabled={creating} className="btn-primary inline-flex items-center gap-2">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando pedido...</> : <>Criar pedido <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* Payment + Proof */}
        {order && (
          <div className="space-y-6">
            {/* PIX payment */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-pry-400" />
                <h3 className="font-semibold">Pagamento via PIX</h3>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-zinc-400">Valor a pagar</span>
                  <span className="text-2xl font-bold text-pry-400">
                    R$ {Number(order.amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {plan?.pix_url && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                      <QRCodeSVG
                        value={plan.pix_url}
                        size={200}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0a0a0f"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 text-center">Escaneie o QR code com o app do seu banco</p>

                    <div className="w-full border-t border-white/5 pt-3">
                      <span className="text-sm text-zinc-400 block mb-2">Ou copie o link PIX</span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/30 rounded-lg px-3 py-2.5 text-pry-300 font-mono text-xs overflow-x-auto">
                          {plan.pix_url}
                        </code>
                        <button onClick={handleCopyPix} className="btn-ghost px-4 py-2.5 flex items-center gap-2 text-sm shrink-0">
                          {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    <a href={plan.pix_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm flex items-center gap-2 w-full justify-center">
                      <ExternalLink className="w-4 h-4" /> Abrir link de pagamento
                    </a>
                  </div>
                )}

                {!plan?.pix_url && (
                  <div className="flex items-start gap-2 text-xs text-zinc-500">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Chave PIX não configurada para este plano. Entre em contato com o suporte.</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-zinc-500">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Escaneie o QR code ou abra o link de pagamento. Após pagar, envie o comprovante abaixo. O acesso só é liberado após a confirmação do pagamento pela nossa equipe.</p>
              </div>
            </div>

            {/* Proof upload */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-pry-400" />
                <h3 className="font-semibold">Envie o comprovante</h3>
              </div>

              {order.payment_proof_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Comprovante enviado com sucesso
                  </div>
                  {order.payment_proof_url.endsWith('.pdf') ? (
                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm flex items-center gap-2 w-fit">
                      <FileImage className="w-4 h-4" /> Ver comprovante (PDF)
                    </a>
                  ) : (
                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={order.payment_proof_url} alt="Comprovante" className="rounded-xl max-h-48 border border-white/10" />
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className={`px-3 py-1 rounded-full text-xs border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span>Aguarde a análise do pagamento.</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block">
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-pry-500/30 hover:bg-pry-500/5 transition-all">
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-pry-400 animate-spin" />
                          <p className="text-sm text-zinc-400">Enviando comprovante...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-pry-500/10 border border-pry-500/20 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-pry-400" />
                          </div>
                          <p className="text-sm text-zinc-300 font-medium">Clique para enviar</p>
                          <p className="text-xs text-zinc-500">PNG, JPG, JPEG ou PDF — máx 5MB</p>
                        </div>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              )}
            </div>

            {/* Order info */}
            <div className="card">
              <h3 className="font-semibold mb-3">Detalhes do pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Número</span><span className="font-mono">{order.order_number}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Status</span>
                  <span className={`px-3 py-0.5 rounded-full text-xs border ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="flex justify-between"><span className="text-zinc-500">Valor</span><span>R$ {Number(order.amount).toFixed(2).replace('.', ',')}</span></div>
              </div>
              <Link to="/dashboard" className="btn-ghost w-full mt-4 text-center text-sm">
                Acompanhar no painel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
