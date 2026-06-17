import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AppState } from '../types';

interface Props {
  state: AppState;
  updateConfig: (partial: Partial<AppState>) => void;
}

export const ConfigSection: React.FC<Props> = ({ state, updateConfig }) => {
  const pm = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  return (
    <GlassCard delay={0.5} hover3d={false} className="config-section">
      <div className="section-header">
        <div className="section-title">
          <motion.div
            className="section-icon"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Settings size={18} />
          </motion.div>
          Configuracao do mes
        </div>
      </div>
      <div className="config-grid">
        <div className="field-3d">
          <label>Mes/Ano</label>
          <input
            type="month"
            value={state.mes || new Date().toISOString().slice(0, 7)}
            onChange={e => updateConfig({ mes: e.target.value })}
          />
        </div>
        <div className="field-3d">
          <label>Salario base (R$)</label>
          <input
            type="number"
            placeholder="3000"
            value={state.salario || ''}
            onChange={e => updateConfig({ salario: pm(e.target.value) })}
          />
        </div>
        <div className="field-3d">
          <label>Beneficio (R$)</label>
          <input
            type="number"
            placeholder="636"
            value={state.beneficio || ''}
            onChange={e => updateConfig({ beneficio: pm(e.target.value) })}
          />
        </div>
        <div className="field-3d">
          <label>Comissao / bonus (R$)</label>
          <input
            type="number"
            placeholder="840"
            value={state.comissao || ''}
            onChange={e => updateConfig({ comissao: pm(e.target.value) })}
          />
        </div>
        <div className="field-3d">
          <label>Poupanca pessoal (R$)</label>
          <input
            type="number"
            placeholder="2000"
            value={state.poupanca || ''}
            onChange={e => updateConfig({ poupanca: pm(e.target.value) })}
          />
        </div>
        <div className="field-3d">
          <label>% Invest. (padrao 30%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={state.pctInvest || 30}
            onChange={e => updateConfig({ pctInvest: pm(e.target.value) || 30 })}
          />
        </div>
      </div>
    </GlassCard>
  );
};
