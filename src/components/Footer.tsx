import { Link } from 'react-router-dom';
import {
  Zap, Shield, Lock, Clock, Headphones, MessageCircle, Mail,
  ArrowRight, CreditCard, CheckCircle
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-pry-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo size="sm" />
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Acesso digital temporário. Escolha seu período, pague via PIX e receba seu código na hora.
            </p>
            <div className="flex gap-2">
              <a
                href="https://discord.gg/e2pArCHT4P"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-pry-500/10 hover:border-pry-500/30 transition-all"
                aria-label="Discord"
              >
                <MessageCircle className="w-4 h-4 text-zinc-400" />
              </a>
              <a
                href="mailto:suporte@pry.com"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:bg-pry-500/10 hover:border-pry-500/30 transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-300">Navegação</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Início</Link></li>
              <li><a href="#plans" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Planos</a></li>
              <li><a href="#how" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Como funciona</a></li>
              <li><Link to="/dashboard" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Meu painel</Link></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-300">Conta</h4>
            <ul className="space-y-2.5">
              <li><Link to="/login" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Entrar</Link></li>
              <li><Link to="/signup" className="text-sm text-zinc-500 hover:text-pry-400 transition-colors">Criar conta</Link></li>
            </ul>
          </div>

          {/* Confiança */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-300">Confiança</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <Shield className="w-4 h-4 text-neon-green shrink-0" /> Pagamento seguro
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <Lock className="w-4 h-4 text-neon-cyan shrink-0" /> Dados protegidos
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4 text-neon-amber shrink-0" /> Ativação rápida
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-500">
                <CreditCard className="w-4 h-4 text-neon-pink shrink-0" /> PIX instantâneo
              </li>
            </ul>
          </div>
        </div>

        {/* Support banner */}
        <div className="glass rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pry-500/10 border border-pry-500/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-pry-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Precisa de ajuda?</p>
              <p className="text-xs text-zinc-500">Entre no nosso suporte e tire suas dúvidas</p>
            </div>
          </div>
          <a
            href="https://discord.gg/e2pArCHT4P"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center gap-2"
          >
            Entrar no suporte <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pry-400 to-pry-700 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" fill="white" />
            </div>
            <span>© {new Date().getFullYear()} PRY. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-neon-green" /> 100% seguro</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-neon-cyan" /> Criptografado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
