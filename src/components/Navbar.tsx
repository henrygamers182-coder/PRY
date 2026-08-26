import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, LayoutDashboard, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg shadow-pry-500/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo size="md" />

        <div className="hidden md:flex items-center gap-3">
          <a href="#plans" className="text-zinc-400 hover:text-neon-cyan transition-colors px-3 text-sm font-medium">
            Planos
          </a>
          <a href="#how" className="text-zinc-400 hover:text-neon-cyan transition-colors px-3 text-sm font-medium">
            Como funciona
          </a>
          <a
            href="https://discord.gg/e2pArCHT4P"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-neon-green transition-colors px-3 text-sm font-medium flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" /> Suporte
          </a>
          {user ? (
            <>
              <Link to="/dashboard" className="btn-ghost text-sm py-2 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Painel
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm py-2 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm py-2">Entrar</Link>
              <Link to="/signup" className="btn-primary text-sm py-2">Criar conta</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-zinc-300" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/5 animate-slide-down">
          <div className="px-4 py-4 flex flex-col gap-3">
            <a href="#plans" onClick={() => setOpen(false)} className="text-zinc-300 hover:text-neon-cyan py-2">Planos</a>
            <a href="#how" onClick={() => setOpen(false)} className="text-zinc-300 hover:text-neon-cyan py-2">Como funciona</a>
            <a href="https://discord.gg/e2pArCHT4P" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-neon-green py-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Suporte
            </a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-ghost text-sm flex items-center gap-2 justify-center">
                  <LayoutDashboard className="w-4 h-4" /> Painel
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-2 justify-center">
                  <LogOut className="w-4 h-4" /> Sair da conta
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost text-sm text-center">Entrar</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm text-center">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
