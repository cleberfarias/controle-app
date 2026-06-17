import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PiggyBank } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { fmt } from '../hooks/useFinanceData';

interface Props {
  entrada: number;
  invest: number;
  totFix: number;
  totParc: number;
  poupanca: number;
  poupancaTotal: number;
  passar: number;
  saudePct: number;
}

export const Investimento: React.FC<Props> = ({ entrada, invest, totFix, totParc, poupanca, poupancaTotal, passar, saudePct }) => {
  const barColor = saudePct >= 30 ? '#10b981' : saudePct >= 10 ? '#f59e0b' : '#ef4444';
  const msgs = [
    'Atencao: sobra muito pouca margem!',
    'Financas apertadas, mas controladas.',
    'Boa margem de folga no mes.',
    'Excelente! Voce tem otima sobra mensal.',
  ];
  const msg = saudePct >= 40 ? msgs[3] : saudePct >= 20 ? msgs[2] : saudePct >= 5 ? msgs[1] : msgs[0];

  return (
    <div>
      <div className="invest-grid">
        <GlassCard delay={0.1} className="invest-card">
          <div className="invest-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <TrendingUp size={24} color="#8b5cf6" />
          </div>
          <div className="invest-label">Guardar no mes</div>
          <div className="invest-value" style={{ color: '#8b5cf6' }}>{fmt(invest)}</div>
        </GlassCard>

        <GlassCard delay={0.2} className="invest-card">
          <div className="invest-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <PiggyBank size={24} color="#3b82f6" />
          </div>
          <div className="invest-label">Poupanca atual</div>
          <div className="invest-value" style={{ color: '#3b82f6' }}>{fmt(poupanca)}</div>
        </GlassCard>

        <GlassCard delay={0.3} className="invest-card">
          <div className="invest-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <PiggyBank size={24} color="#10b981" />
          </div>
          <div className="invest-label">Poupanca + investimento</div>
          <div className="invest-value" style={{ color: '#10b981' }}>{fmt(poupancaTotal)}</div>
        </GlassCard>
      </div>

      <GlassCard delay={0.4} hover3d={false} className="resumo-section">
        <div className="section-header">
          <div className="section-title">
            <TrendingUp size={18} /> Resumo financeiro
          </div>
        </div>

        <div className="resumo-table">
          <div className="resumo-row">
            <span>Salario + beneficio + comissao</span>
            <span className="val-green">{fmt(entrada)}</span>
          </div>
          <div className="resumo-row">
            <span>(-) Contas fixas</span>
            <span className="val-red">{fmt(totFix)}</span>
          </div>
          <div className="resumo-row">
            <span>(-) Parceladas/divididas</span>
            <span className="val-red">{fmt(totParc)}</span>
          </div>
          <div className="resumo-row">
            <span>(-) Guardar no mes</span>
            <span className="val-purple">{fmt(invest)}</span>
          </div>
          <div className="resumo-row resumo-total">
            <span>Para passar o mes</span>
            <motion.span
              className="val-amber total-big"
              key={passar}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {fmt(passar)}
            </motion.span>
          </div>
        </div>

        <div className="resumo-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Poupanca atual (isolado)</span>
          <span className="val-blue">{fmt(poupanca)}</span>
        </div>

        <div className="health-section">
          <div className="health-header">
            <span>Saude financeira</span>
            <motion.span
              key={saudePct}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              style={{ fontWeight: 600, color: barColor }}
            >
              {saudePct}%
            </motion.span>
          </div>
          <div className="health-bar-bg">
            <motion.div
              className="health-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${saudePct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: `linear-gradient(90deg, ${barColor}, ${barColor}88)` }}
            />
          </div>
          <motion.p
            className="health-msg"
            key={msg}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {msg}
          </motion.p>
        </div>
      </GlassCard>
    </div>
  );
};
