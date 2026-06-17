import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Inbox } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Recebivel } from '../types';
import { fmt, isRecebido } from '../hooks/useFinanceData';

interface Props {
  recs: Recebivel[];
  mes: string;
  addRec: () => void;
  removeRec: (id: number) => void;
  updateRec: (id: number, field: string, value: any) => void;
  toggleRecRecebido: (id: number, checked: boolean) => void;
}

export const Recebiveis: React.FC<Props> = ({ recs, mes, addRec, removeRec, updateRec, toggleRecRecebido }) => {
  const pm = (v: string) => parseFloat(v.replace(',', '.')) || 0;
  const tAP = recs.reduce((s, c) => s + c.aPagar, 0);
  const tP1 = recs.reduce((s, c) => s + c.p1, 0);
  const tP2 = recs.reduce((s, c) => s + c.p2, 0);
  const tTot = recs.reduce((s, c) => s + c.p1 + c.p2, 0);

  return (
    <GlassCard hover3d={false} delay={0.1}>
      <div className="section-header">
        <div className="section-title">
          <Inbox size={18} />
          A receber
          <span className="badge-3d">{recs.length}</span>
        </div>
        <motion.button
          className="btn-add-3d"
          onClick={addRec}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} /> Adicionar
        </motion.button>
      </div>

      {recs.length === 0 ? (
        <div className="empty-state">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <Inbox size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
          </motion.div>
          <p>Nenhum item a receber.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente / descricao</th>
                <th>Total (R$)</th>
                <th>1a parcela</th>
                <th>2a parcela</th>
                <th>Recebido</th>
                <th>Ok?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {recs.map(c => {
                  const tot = c.p1 + c.p2;
                  const recebido = isRecebido(c, mes);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={recebido ? 'row-paid' : ''}
                    >
                      <td>
                        <input type="text" value={c.cliente} placeholder="Nome do cliente / venda" onChange={e => updateRec(c.id, 'cliente', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" value={c.aPagar || ''} placeholder="0,00" onChange={e => updateRec(c.id, 'aPagar', pm(e.target.value))} />
                      </td>
                      <td>
                        <input type="number" value={c.p1 || ''} placeholder="0,00" onChange={e => updateRec(c.id, 'p1', pm(e.target.value))} />
                      </td>
                      <td>
                        <input type="number" value={c.p2 || ''} placeholder="0,00" onChange={e => updateRec(c.id, 'p2', pm(e.target.value))} />
                      </td>
                      <td className="success-value">{fmt(tot)}</td>
                      <td className="center">
                        <label className="checkbox-3d">
                          <input type="checkbox" checked={recebido} onChange={e => toggleRecRecebido(c.id, e.target.checked)} />
                          <span className="checkmark" />
                        </label>
                      </td>
                      <td>
                        <motion.button className="btn-del-3d" onClick={() => removeRec(c.id)} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
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
                <td><strong>Total</strong></td>
                <td>{fmt(tAP)}</td>
                <td>{fmt(tP1)}</td>
                <td>{fmt(tP2)}</td>
                <td className="success-value">{fmt(tTot)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
};
