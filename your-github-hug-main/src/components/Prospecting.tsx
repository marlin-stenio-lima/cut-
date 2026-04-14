import React from 'react';
import { Lock, Crosshair, Search, UserPlus, Filter, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Search, label: 'Busca inteligente de leads' },
  { icon: UserPlus, label: 'Captura automática de contatos' },
  { icon: Filter, label: 'Filtros avançados por segmento' },
  { icon: BarChart3, label: 'Métricas de conversão' },
];

const Prospecting: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Crosshair className="w-10 h-10 text-primary/40" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Prospecção</h1>
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          Em breve
        </span>
        <p className="text-muted-foreground text-sm mb-8">
          Estamos desenvolvendo ferramentas poderosas de prospecção para você encontrar e conquistar novos clientes de forma automatizada.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border text-left"
            >
              <f.icon className="w-4 h-4 text-primary/50 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Prospecting;
