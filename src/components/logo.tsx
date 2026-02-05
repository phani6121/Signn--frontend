import { ShieldCheck } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground">
        Signn <span className="font-light">Gatekeeper</span>
      </h1>
    </div>
  );
}
