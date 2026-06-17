import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, TrendingUp, PiggyBank, Wallet, ArrowDownToLine } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { fmt } from '../hooks/useFinanceData';

interface Props {
  entrada: number;
  totGast: number;
  invest: number;
  passar: number;
  poupanca: number;
  totRec: number;
}

const cards = [
  { key: 'entrada', label: 'Salario + Beneficio', icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.08)', field: 'entrada' as const },
  { key: 'gastos', label: 'Total de Gastos', icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', field: 'totGast' as const },
  { key: 'invest', label: 'Plano Invest.', icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', field: 'invest' as const },
  { key: 'passar', label: 'Para o Mes', icon: Wallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', field: 'passar' as const },
  { key: 'poupanca', label: 'Poupanca Pessoal', icon: PiggyBank, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', field: 'poupanca' as const },
  { key: 'receber', label: 'A Receber', icon: ArrowDownToLine, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', field: 'totRec' as const },
];

export const SummaryCards: React.FC<Props> = (props) => {
  return (
    <div className="summary-grid">
      {cards.map((card, i) => (
        <GlassCard key={card.key} delay={i * 0.08} className="summary-card">
          <div className="summary-icon-wrap" style={{ background: card.bg }}>
            <card.icon size={22} color={card.color} />
          </div>
          <div className="summary-label">{card.label}</div>
          <motion.div
            className="summary-value"
            style={{ color: card.color }}
            key={props[card.field]}
            initial={{ scale: 1.15, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {fmt(props[card.field])}
          </motion.div>
        </GlassCard>
      ))}
    </div>
  );
};
