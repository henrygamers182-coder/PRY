import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap, Mail, Lock, ArrowRight, Loader2, KeyRound, ArrowLeft,
  Eye, EyeOff, Shield, Clock, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const { signIn, resetPassword, signInWithGoogle } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      notify('error', error);
    } else {
      notify('success', 'Login realizado com sucesso!');
      const redirect = params.get('redirect');
      if (redirect?.startsWith('checkout-')) {
        navigate('/checkout/' + redirect.replace('checkout-', ''));
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      notify('error', error);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetLoading) return;
    setResetLoading(true);
    const { error } = await resetPassword(resetEmail);
    setResetLoading(false);
    if (error) {
      notify('error', error);
    } else {
      notify('success', 'Email de recuperação enviado!');
      setShowReset(false);
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Aurora boreal green ribbons background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep green base glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a] via-[#0a120f] to-[#0a0a0f]" />

        {/* Ribbon 1 - tall, left-leaning */}
        <div
          className="absolute top-[-30%] left-[5%] w-[30%] h-[160%] rounded-[50%] blur-[80px] animate-aurora-ribbon-1"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(52,211,153,0.45), rgba(16,185,129,0.3), transparent)' }}
        />
        {/* Ribbon 2 - tall, right-leaning */}
        <div
          className="absolute top-[-20%] right-[8%] w-[25%] h-[150%] rounded-[50%] blur-[90px] animate-aurora-ribbon-2"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.4), rgba(52,211,153,0.25), transparent)' }}
        />
        {/* Ribbon 3 - center, wide */}
        <div
          className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[40%] h-[170%] rounded-[50%] blur-[100px] animate-aurora-ribbon-3"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.35), rgba(4,120,87,0.2), transparent)' }}
        />
        {/* Ribbon 4 - far left, subtle */}
        <div
          className="absolute top-[-15%] left-[-5%] w-[20%] h-[140%] rounded-[50%] blur-[70px] animate-aurora-ribbon-4"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(52,211,153,0.3), transparent)' }}
        />

        {/* Floating glow orbs */}
        <div className="absolute top-[20%] left-[30%] w-72 h-72 bg-emerald-500/15 rounded-full blur-[100px] animate-aurora-glow" />
        <div className="absolute bottom-[15%] right-[25%] w-80 h-80 bg-green-500/12 rounded-full blur-[120px] animate-aurora-glow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[50%] left-[60%] w-64 h-64 bg-teal-500/10 rounded-full blur-[90px] animate-aurora-glow" style={{ animationDelay: '5s' }} />

        {/* Stars / particles */}
        <div className="absolute inset-0">
          {[
            { top: '12%', left: '15%', size: '2px', delay: '0s' },
            { top: '25%', left: '80%', size: '1px', delay: '1s' },
            { top: '40%', left: '45%', size: '2px', delay: '2s' },
            { top: '65%', left: '20%', size: '1px', delay: '0.5s' },
            { top: '75%', left: '70%', size: '2px', delay: '1.5s' },
            { top: '15%', left: '55%', size: '1px', delay: '3s' },
            { top: '55%', left: '88%', size: '2px', delay: '2.5s' },
            { top: '85%', left: '40%', size: '1px', delay: '4s' },
            { top: '35%', left: '10%', size: '2px', delay: '1s' },
            { top: '90%', left: '85%', size: '1px', delay: '0s' },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-emerald-200/60 animate-glow"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Left side - branding */}
      <div className={`hidden lg:flex w-1/2 flex-col justify-between p-12 relative transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:shadow-emerald-500/60 transition-shadow relative overflow-hidden">
            <Zap className="w-6 h-6 text-white fill-white animate-logo-zap" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gradient">PRY</span>
        </Link>

        {/* Hero text */}
        <div className="relative">
          <div className={`inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs text-zinc-300 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Acesso digital temporário
          </div>

          <h1 className={`text-5xl font-extrabold tracking-tight mb-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Bem-vindo<br />de volta.
          </h1>
          <p className={`text-lg text-zinc-400 max-w-md leading-relaxed mb-10 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Acesse sua conta para gerenciar seus pedidos, pagamentos e códigos de acesso em um só lugar.
          </p>

          {/* Feature list */}
          <div className={`space-y-4 transition-all duration-700 delay-[900ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {[
              { icon: Shield, text: 'Pagamento seguro via PIX com verificação manual' },
              { icon: Clock, text: 'Ativação rápida assim que o pagamento é confirmado' },
              { icon: Zap, text: 'Tudo organizado em um único painel' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-300">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-zinc-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`text-xs text-zinc-600 transition-all duration-700 delay-[1100ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          © {new Date().getFullYear()} PRY. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - login card */}
      <div className={`flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 justify-center mb-8 lg:hidden group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white animate-logo-zap" />
            </div>
            <span className="text-2xl font-bold text-gradient">PRY</span>
          </Link>

          <div className="glass rounded-3xl p-8 sm:p-10 border border-white/[0.08] shadow-2xl shadow-emerald-500/10">
            {!showReset ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta</h2>
                  <p className="text-zinc-400 text-sm">Entre na sua conta para continuar.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-11 h-12"
                        placeholder="seu@email.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-zinc-400">Senha</label>
                      <button type="button" onClick={() => setShowReset(true)} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                        <KeyRound className="w-3 h-3" /> Esqueceu sua senha?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pl-11 pr-11 h-12"
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 h-12">
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</>
                      : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-zinc-500 font-medium">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full h-12 flex items-center justify-center gap-3 glass rounded-xl text-zinc-200 font-medium hover:bg-white/[0.08] hover:border-white/[0.14] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </button>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-center text-sm text-zinc-500">
                    Ainda não tem conta?{' '}
                    <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Criar conta
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Reset password */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Recuperar senha</h2>
                  <p className="text-zinc-400 text-sm">Enviaremos um email de recuperação</p>
                </div>

                <form onSubmit={handleReset} className="space-y-5">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="input-field pl-11 h-12"
                        placeholder="seu@email.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={resetLoading} className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 h-12">
                    {resetLoading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                      : <>Enviar email de recuperação <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <button onClick={() => setShowReset(false)} className="mt-6 text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1.5 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar para login
                </button>
              </>
            )}
          </div>

          <Link to="/" className="mt-6 text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1.5 justify-center transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
