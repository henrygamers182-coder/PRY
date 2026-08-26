import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Clock, CreditCard, Upload, CheckCircle, Key, ArrowRight, Sparkles, Shield, Headphones, Lock, Rocket, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Plan } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setPlans(data || []);
        setLoading(false);
      });
  }, []);

  const handleBuy = (planId: string) => {
    if (!user) {
      navigate('/login?redirect=checkout-' + planId);
    } else {
      navigate('/checkout/' + planId);
    }
  };

  const steps = [
    { icon: Clock, title: 'Escolha o período', desc: 'Selecione o plano ideal para você', color: 'from-pry-500 to-neon-cyan' },
    { icon: CreditCard, title: 'Realize o pagamento', desc: 'Pague via PIX de forma rápida', color: 'from-neon-green to-pry-400' },
    { icon: Upload, title: 'Envie o comprovante', desc: 'Anexe o comprovante do pagamento', color: 'from-neon-amber to-neon-pink' },
    { icon: CheckCircle, title: 'Aguarde a confirmação', desc: 'Nossa equipe verifica o pagamento', color: 'from-neon-pink to-pry-500' },
    { icon: Key, title: 'Receba seu código', desc: 'Acesso liberado na sua conta', color: 'from-neon-violet to-neon-cyan' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-pry-500/15 rounded-full blur-[120px] animate-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-neon-violet/15 rounded-full blur-[120px] animate-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-neon-cyan/10 rounded-full blur-[140px] animate-glow" style={{ animationDelay: '0.8s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs text-zinc-300 border-pry-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
            </span>
            <Sparkles className="w-3.5 h-3.5 text-pry-400" />
            Acesso digital temporário
          </div>

          <h1 className="text-6xl sm:text-8xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient animate-gradient-x bg-[length:200%_auto]">PRY</span>
          </h1>

          <p className="text-lg sm:text-2xl text-zinc-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Escolha seu período de acesso e tenha tudo organizado em um só lugar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#plans" className="btn-primary flex items-center gap-2 text-base">
              Comprar acesso <ArrowRight className="w-4 h-4" />
            </a>
            {user ? (
              <Link to="/dashboard" className="btn-ghost text-base">Ir para meu painel</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-base">Entrar</Link>
                <Link to="/signup" className="btn-ghost text-base">Criar conta</Link>
              </>
            )}
            <a href="https://discord.gg/e2pArCHT4P" target="_blank" rel="noopener noreferrer" className="btn-ghost flex items-center gap-2 text-base">
              <Headphones className="w-4 h-4" /> Suporte
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 sm:px-6 pb-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
          {[
            { value: '24/7', label: 'Acesso ao suporte', color: 'text-neon-cyan' },
            { value: 'PIX', label: 'Pagamento rápido', color: 'text-neon-green' },
            { value: '100%', label: 'Processo organizado', color: 'text-neon-pink' },
            { value: '1 painel', label: 'Tudo em um só lugar', color: 'text-neon-amber' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl px-4 py-5 text-center hover:bg-pry-500/[0.08] hover:border-pry-500/20 transition-all duration-300">
              <div className={`text-xl sm:text-2xl font-extrabold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-neon-cyan" />
            <Rocket className="w-5 h-5 text-neon-cyan" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-neon-cyan" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">Como funciona</h2>
          <p className="text-zinc-400 text-center mb-12">Simples, rápido e seguro</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="card text-center group hover:scale-[1.04] transition-transform duration-300 hover:border-pry-500/30">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-pry-400 font-semibold mb-1">Passo {i + 1}</div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-neon-pink" />
            <Sparkles className="w-4 h-4 text-neon-pink" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-neon-pink" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">Escolha seu plano</h2>
          <p className="text-zinc-400 text-center mb-12">Pague pelo tempo que precisa. Ative quando estiver pronto.</p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-64 skeleton" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">Nenhum plano disponível no momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`card relative group hover:scale-[1.03] transition-all duration-300 ${
                    plan.is_featured ? 'border-pry-500/50 shadow-lg shadow-pry-500/20 animate-pulse-glow' : ''
                  }`}
                >
                  {plan.is_featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pry-500 via-neon-cyan to-neon-pink text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg">
                      Mais popular
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>}

                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gradient">
                      R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-zinc-500 text-sm ml-1">
                      / {plan.duration_hours >= 24 ? `${plan.duration_hours / 24} ${plan.duration_hours / 24 === 1 ? 'dia' : 'dias'}` : `${plan.duration_hours}h`}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neon-cyan" />
                      {plan.duration_hours >= 24
                        ? `${plan.duration_hours / 24} ${plan.duration_hours / 24 === 1 ? 'dia' : 'dias'} de acesso`
                        : `${plan.duration_hours} horas de acesso`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-neon-green" />
                      Pagamento via PIX
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-neon-amber" />
                      Ativação rápida
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-neon-pink" />
                      Código exclusivo
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(plan.id)}
                    className={plan.is_featured ? 'btn-primary w-full' : 'btn-ghost w-full'}
                  >
                    Comprar agora
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature banner */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, title: 'Controle total', desc: 'Acompanhe pedidos, pagamentos e códigos em tempo real.', color: 'from-pry-500 to-neon-cyan' },
            { icon: Shield, title: 'Pagamento seguro', desc: 'PIX com verificação manual e proteção contra duplicidade.', color: 'from-neon-green to-neon-amber' },
            { icon: Rocket, title: 'Ativação imediata', desc: 'Assim que aprovado, seu código é liberado na hora.', color: 'from-neon-pink to-neon-violet' },
          ].map((f) => (
            <div key={f.title} className="card group hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto card text-center group relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-neon-violet/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pry-500/10 rounded-full blur-[100px]" />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pry-500 to-neon-violet flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pry-500/30">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Precisa de ajuda?</h2>
            <p className="text-zinc-400 mb-6">Entre no nosso suporte e tire suas dúvidas.</p>
            <a
              href="https://discord.gg/e2pArCHT4P"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Headphones className="w-4 h-4" /> Entrar no suporte
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
