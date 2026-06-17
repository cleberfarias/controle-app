import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileBarChart, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AppState } from '../types';
import { fmt, getAllMonths, getMonthReport, isPago, isRecebido, meuValParc } from '../hooks/useFinanceData';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function mesLabel(mes: string): string {
  const [y, mo] = mes.split('-');
  return (MONTH_NAMES[parseInt(mo) - 1] || mo) + ' ' + y;
}

interface Props {
  state: AppState;
  mesAtual: string;
}

export const Relatorio: React.FC<Props> = ({ state, mesAtual }) => {
  const months = getAllMonths(state);
  const [expanded, setExpanded] = useState<string | null>(mesAtual);

  if (months.length === 0) {
    return (
      <GlassCard hover3d={false} delay={0.1}>
        <div className="section-header">
          <div className="section-title"><FileBarChart size={18} /> Relatorio mensal</div>
        </div>
        <div className="empty-state">
          <FileBarChart size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
          <p>Nenhum dado de pagamento registrado.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div>
      <GlassCard hover3d={false} delay={0.1} className="relatorio-overview">
        <div className="section-header">
          <div className="section-title"><FileBarChart size={18} /> Relatorio mensal</div>
        </div>
        <p className="hint-text">Historico de pagamentos por mes. Clique em um mes para ver detalhes.</p>

        <div className="rel-months">
          {months.map((mes, i) => {
            const report = getMonthReport(state, mes);
            const isOpen = expanded === mes;
            const isCurrent = mes === mesAtual;

            const totalContas = state.fixas.length + state.parcs.length;
            const totalPagas = state.fixas.filter(f => isPago(f, mes)).length +
                               state.parcs.filter(p => isPago(p, mes)).length;
            const pctPago = totalContas > 0 ? Math.round((totalPagas / totalContas) * 100) : 0;

            return (
              <motion.div
                key={mes}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rel-month-card"
              >
                <button
                  className={`rel-month-header ${isCurrent ? 'current' : ''}`}
                  onClick={() => setExpanded(isOpen ? null : mes)}
                >
                  <div className="rel-month-left">
                    <span className="rel-month-name">{mesLabel(mes)}</span>
                    {isCurrent && <span className="rel-current-badge">Atual</span>}
                  </div>
                  <div className="rel-month-right">
                    <div className="rel-month-stats">
                      <span className="rel-stat">
                        <span className="rel-stat-label">Pago</span>
                        <span className="rel-stat-val val-red">{fmt(report.totalPago)}</span>
                      </span>
                      <span className="rel-stat">
                        <span className="rel-stat-label">Recebido</span>
                        <span className="rel-stat-val val-green">{fmt(report.totalRecs)}</span>
                      </span>
                      <span className="rel-stat">
                        <span className="rel-stat-label">Contas</span>
                        <span className="rel-stat-val">{totalPagas}/{totalContas}</span>
                      </span>
                    </div>
                    <div className="rel-pct-bar-mini">
                      <div className="rel-pct-fill" style={{ width: `${pctPago}%` }} />
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="rel-month-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="rel-detail-grid">
                        <div className="rel-detail-section">
                          <h4>Contas fixas</h4>
                          {state.fixas.length === 0 ? (
                            <p className="rel-empty">Nenhuma conta fixa</p>
                          ) : (
                            <div className="rel-items">
                              {state.fixas.map(f => (
                                <div key={f.id} className={`rel-item ${isPago(f, mes) ? 'paid' : 'unpaid'}`}>
                                  {isPago(f, mes)
                                    ? <CheckCircle2 size={14} className="rel-icon-ok" />
                                    : <XCircle size={14} className="rel-icon-no" />}
                                  <span className="rel-item-name">{f.nome || 'Sem nome'}</span>
                                  <span className="rel-item-val">{fmt(f.valor)}</span>
                                </div>
                              ))}
                              <div className="rel-subtotal">
                                <span>Subtotal fixas pagas</span>
                                <span className="val-red">{fmt(report.totalFixas)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rel-detail-section">
                          <h4>Parceladas / Divididas</h4>
                          {state.parcs.length === 0 ? (
                            <p className="rel-empty">Nenhuma parcelada</p>
                          ) : (
                            <div className="rel-items">
                              {state.parcs.map(p => (
                                <div key={p.id} className={`rel-item ${isPago(p, mes) ? 'paid' : 'unpaid'}`}>
                                  {isPago(p, mes)
                                    ? <CheckCircle2 size={14} className="rel-icon-ok" />
                                    : <XCircle size={14} className="rel-icon-no" />}
                                  <span className="rel-item-name">{p.nome || 'Sem nome'}</span>
                                  <span className="rel-item-val">{fmt(meuValParc(p))}</span>
                                </div>
                              ))}
                              <div className="rel-subtotal">
                                <span>Subtotal parceladas pagas</span>
                                <span className="val-red">{fmt(report.totalParcs)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rel-detail-section">
                          <h4>A receber</h4>
                          {state.recs.length === 0 ? (
                            <p className="rel-empty">Nenhum recebivel</p>
                          ) : (
                            <div className="rel-items">
                              {state.recs.map(r => (
                                <div key={r.id} className={`rel-item ${isRecebido(r, mes) ? 'paid' : 'unpaid'}`}>
                                  {isRecebido(r, mes)
                                    ? <CheckCircle2 size={14} className="rel-icon-ok" />
                                    : <XCircle size={14} className="rel-icon-no" />}
                                  <span className="rel-item-name">{r.cliente || 'Sem nome'}</span>
                                  <span className="rel-item-val">{fmt(r.p1 + r.p2)}</span>
                                </div>
                              ))}
                              <div className="rel-subtotal">
                                <span>Subtotal recebido</span>
                                <span className="val-green">{fmt(report.totalRecs)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rel-grand-total">
                        <div className="rel-gt-row">
                          <span>Total pago no mes</span>
                          <span className="val-red" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(report.totalPago)}</span>
                        </div>
                        <div className="rel-gt-row">
                          <span>Total recebido no mes</span>
                          <span className="val-green" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(report.totalRecs)}</span>
                        </div>
                        <div className="rel-gt-row rel-gt-balance">
                          <span>Saldo (recebido - pago)</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: (report.totalRecs - report.totalPago) >= 0 ? '#10b981' : '#ef4444' }}>
                            {fmt(report.totalRecs - report.totalPago)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
