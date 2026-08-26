import { Loader2 } from 'lucide-react';

export default function Loading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-pry-400 animate-spin" />
      <p className="text-zinc-400 text-sm">{text}</p>
    </div>
  );
}
