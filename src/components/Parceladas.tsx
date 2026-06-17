import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CreditCard } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Parcelada } from '../types';
import { fmt, meuValParc, isPago } from '../hooks/useFinanceData';

interface Props {
  parcs: Parcelada[];
  mes: string;
  addParc: () => void;
  removeParc: (id: number) => void;
  updateParc: (id: number, field: string, value: any) => void;
  toggleParcPago: (id: number, checked: boolean) => void;
}

export const Parceladas: React.FC<Props> = ({ parcs, mes, addParc, removeParc, updateParc, toggleParcPago }) => {
  const total = parcs.reduce((s, c) => s + meuValParc(c), 0);
  const pm = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  return (
    <GlassCard hover3d={false} delay={0.1}>
      <div className="section-header">
        <div className="section-title">
          <CreditCard size={18} />
          Parceladas / Divididas
          <span className="badge-3d">{parcs.length}</span>
        </div>
        <motion.button
          className="btn-add-3d"
          onClick={addParc}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} /> Adicionar
        </motion.button>
      </div>

      <p className="hint-text">
        Contas <strong>divididas</strong>: informe o total e o numero de pessoas.
        Contas <strong>parceladas</strong>: informe o total e o n de parcelas.
      </p>

      {parcs.length === 0 ? (
        <div className="empty-state">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <CreditCard size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
          </motion.div>
          <p>Nenhuma conta parcelada/dividida.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Total (R$)</th>
                <th>Div/Parc</th>
                <th>Meu valor</th>
                <th>Parcela</th>
                <th>Pagas</th>
                <th>Pago?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {parcs.map(c => {
                  const mv = meuValParc(c);
                  const isDi = c.tipo === 'dividida';
                  const pago = isPago(c, mes);
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={pago ? 'row-paid' : ''}
                    >
                      <td>
                        <input type="text" value={c.nome} placeholder="Ex: C6, Nubank..." onChange={e => updateParc(c.id, 'nome', e.target.value)} />
                      </td>
                      <td>
                        <select value={c.tipo} onChange={e => updateParc(c.id, 'tipo', e.target.value)}>
                          <option value="dividida">Dividida</option>
                          <option value="parcelada">Parcelada</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" value={c.valorTotal || ''} placeholder="Total" onChange={e => updateParc(c.id, 'valorTotal', pm(e.target.value))} />
                      </td>
                      <td>
                        <div className="divisor-cell">
                          <input type="number" value={c.divisor || 2} min={1} max={60} onChange={e => updateParc(c.id, 'divisor', pm(e.target.value))} />
                          <span className={`tag-3d ${isDi ? 'tag-div' : 'tag-par'}`}>{isDi ? 'pessoas' : 'x'}</span>
                        </div>
                      </td>
                      <td className="highlight-value">{fmt(mv)}</td>
                      <td>
                        <input type="number" value={c.parcelaAtual || ''} placeholder="3" min={1} onChange={e => updateParc(c.id, 'parcelaAtual', pm(e.target.value))} />
                      </td>
                      <td>
                        <input type="number" value={c.parcelasPagas || 0} min={0} onChange={e => updateParc(c.id, 'parcelasPagas', pm(e.target.value))} />
                      </td>
                      <td className="center">
                        <label className="checkbox-3d">
                          <input type="checkbox" checked={pago} onChange={e => toggleParcPago(c.id, e.target.checked)} />
                          <span className="checkmark" />
                        </label>
                      </td>
                      <td>
                        <motion.button className="btn-del-3d" onClick={() => removeParc(c.id)} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
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
                <td colSpan={4}><strong>Total (minha parte)</strong></td>
                <td className="highlight-value">{fmt(total)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </GlassCard>
  );
};
