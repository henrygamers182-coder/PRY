import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  showText?: boolean;
}

export default function Logo({ size = 'md', to = '/', showText = true }: LogoProps) {
  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-base' },
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { box: 'w-11 h-11', icon: 'w-6 h-6', text: 'text-2xl' },
  }[size];

  return (
    <Link to={to} className="flex items-center gap-2 group w-fit">
      <div className={`${dimensions.box} rounded-xl bg-gradient-to-br from-pry-400 via-pry-500 to-neon-cyan flex items-center justify-center shadow-lg shadow-pry-500/40 group-hover:shadow-pry-500/60 transition-shadow relative overflow-hidden`}>
        <Zap className={`${dimensions.icon} text-white fill-white animate-logo-zap`} />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      {showText && <span className={`${dimensions.text} font-bold tracking-tight text-gradient`}>PRY</span>}
    </Link>
  );
}
