import React from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextFabProps {
  activeTab: string;
  onAddHearing: () => void;
  onNewCase: () => void;
  onNewInvoice: () => void;
}

export const ContextFab: React.FC<ContextFabProps> = ({
  activeTab,
  onAddHearing,
  onNewCase,
  onNewInvoice,
}) => {
  let config: { label: string; onClick: () => void } | null = null;

  if (activeTab === 'today') {
    config = { label: 'Add Hearing', onClick: onAddHearing };
  } else if (activeTab === 'cases') {
    config = { label: 'New Case', onClick: onNewCase };
  } else if (activeTab === 'fees') {
    config = { label: 'New Invoice', onClick: onNewInvoice };
  }

  if (!config) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={activeTab}
        type="button"
        initial={{ scale: 0.8, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={config.onClick}
        style={{
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        }}
        className="fixed right-4 sm:right-6 z-40 flex items-center gap-2 px-4 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-xl shadow-amber-400/25 border border-amber-300 transition ios-press select-none"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>{config.label}</span>
      </motion.button>
    </AnimatePresence>
  );
};
