import React from 'react';
import { Icon } from './Icon';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

export const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, code }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-12">
      <div className="bg-vectra-panel w-full max-w-4xl h-full max-h-[800px] rounded-lg shadow-2xl flex flex-col border border-vectra-border">
        <div className="flex justify-between items-center p-4 border-b border-vectra-border"><h3 className="font-bold text-white">Generated React Code</h3><button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="times" /></button></div>
        <div className="flex-1 overflow-auto p-6 bg-[#0d1117]"><pre className="font-mono text-sm text-blue-300">{code}</pre></div>
      </div>
    </div>
  );
};
