import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

export default function SignupPage() {
  const { signUp } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      notify('error', 'As senhas não coincidem');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      notify('error', error);
    } else {
      notify('success', 'Conta criada com sucesso! Bem-vindo à PRY.');
      const redirect = params.get('redirect');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        notify('info', 'Confirme seu email para entrar na conta.');
        navigate('/login' + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''));
      } else if (redirect?.startsWith('checkout-')) {
        navigate('/checkout/' + redirect.replace('checkout-', ''));
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-pry-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <Logo size="md" />

        <div className="card animate-slide-up">
          <h1 className="text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-zinc-400 text-sm mb-6">Comece agora e organize seus acessos</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Link>
            <Link to="/login" className="text-pry-400 hover:text-pry-300">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
