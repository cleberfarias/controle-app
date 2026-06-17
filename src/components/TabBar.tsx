import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks, CreditCard, Inbox, TrendingUp, FileBarChart, Home } from 'lucide-react';

export type TabId = 'fixas' | 'parc' | 'rec' | 'inv' | 'fin' | 'rel';

interface Props {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.FC<any> }[] = [
  { id: 'fixas', label: 'Contas fixas', icon: ListChecks },
  { id: 'parc', label: 'Parceladas', icon: CreditCard },
  { id: 'rec', label: 'A receber', icon: Inbox },
  { id: 'inv', label: 'Investimento', icon: TrendingUp },
  { id: 'fin', label: 'Financiamento', icon: Home },
  { id: 'rel', label: 'Relatorio', icon: FileBarChart },
];

export const TabBar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-bar-3d">
      {tabs.map(tab => (
        <motion.button
          key={tab.id}
          className={`tab-btn-3d ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          <tab.icon size={16} />
          <span>{tab.label}</span>
          {activeTab === tab.id && (
            <motion.div
              className="tab-indicator"
              layoutId="tab-indicator"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
