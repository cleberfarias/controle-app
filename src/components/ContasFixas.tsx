import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ListChecks } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ContaFixa } from '../types';
import { fmt, isPago } from '../hooks/useFinanceData';

interface Props {
  fixas: ContaFixa[];
  mes: string;
  addFixa: () => void;
  removeFixa: (id: number) => void;
  updateFixa: (id: number, field: string, value: any) => void;
  toggleFixaPago: (id: number, checked: boolean) => void;
}

export const ContasFixas: React.FC<Props> = ({ fixas, mes, addFixa, removeFixa, updateFixa, toggleFixaPago }) => {
  const total = fixas.reduce((s, c) => s + c.valor, 0);
  const pm = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  return (
    <GlassCard hover3d={false} delay={0.1}>
      <div className="section-header">
        <div className="section-title">
          <ListChecks size={18} />
          Contas fixas
          <span className="badge-3d">{fixas.length}</span>
        </div>
        <motion.button
          className="btn-add-3d"
          onClick={addFixa}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} /> Adicionar
        </motion.button>
      </div>

      {fixas.length === 0 ? (
        <div className="empty-state">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <ListChecks size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
          </motion.div>
          <p>Nenhuma conta fixa cadastrada.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valor (R$)</th>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th>Pago?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {fixas.map(c => {
                  const pago = isPago(c, mes);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={pago ? 'row-paid' : ''}
                    >
                      <td>
                        <input type="text" value={c.nome} placeholder="Ex: Internet, Agua..." onChange={e => updateFixa(c.id, 'nome', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" value={c.valor || ''} placeholder="0,00" onChange={e => updateFixa(c.id, 'valor', pm(e.target.value))} />
                      </td>
                      <td>
                        <select value={c.tipo} onChange={e => updateFixa(c.id, 'tipo', e.target.value)}>
                          <option value="fixa">Fixa</option>
                          <option value="variavel">Variavel</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" value={c.venc} placeholder="dia 10" style={{ maxWidth: 90 }} onChange={e => updateFixa(c.id, 'venc', e.target.value)} />
                      </td>
                      <td className="center">
                        <label className="checkbox-3d">
                          <input type="checkbox" checked={pago} onChange={e => toggleFixaPago(c.id, e.target.checked)} />
                          <span className="checkmark" />
                        </label>
                      </td>
                      <td>
                        <motion.button className="btn-del-3d" onClick={() => removeFixa(c.id)} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                          <X size={14} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>Total</strong></td>
                <td colSpan={4} className="total-value">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
};
