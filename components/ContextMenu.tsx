import React from 'react';
import { Icon } from './Icon';

interface ContextMenuProps {
  x: number;
  y: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  canPaste: boolean;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onDuplicate, onDelete, onUndo, onRedo, onCopyStyles, onPasteStyles, canPaste, onClose }) => {
  React.useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="fixed z-50 bg-vectra-panel border border-vectra-border rounded shadow-xl py-1 w-56"
      style={{ top: y, left: x }}
      onClick={e => e.stopPropagation()}
    >
      <button onClick={() => { onUndo(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-vectra-text hover:bg-vectra-accent hover:text-white flex items-center gap-2">
        <Icon name="undo" /> Undo <span className="ml-auto text-gray-500 text-[10px]">Ctrl+Z</span>
      </button>
      <button onClick={() => { onRedo(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-vectra-text hover:bg-vectra-accent hover:text-white flex items-center gap-2">
        <Icon name="redo" /> Redo <span className="ml-auto text-gray-500 text-[10px]">Ctrl+Y</span>
      </button>
      
      <div className="h-px bg-vectra-border my-1" />
      
      <button onClick={() => { onCopyStyles(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-vectra-text hover:bg-vectra-accent hover:text-white flex items-center gap-2">
        <Icon name="paint-brush" /> Copy Styles
      </button>
      <button disabled={!canPaste} onClick={() => { onPasteStyles(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-vectra-text hover:bg-vectra-accent hover:text-white flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent">
        <Icon name="paste" /> Paste Styles
      </button>

      <div className="h-px bg-vectra-border my-1" />
      
      <button onClick={() => { onDuplicate(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-vectra-text hover:bg-vectra-accent hover:text-white flex items-center gap-2">
        <Icon name="copy" /> Duplicate <span className="ml-auto text-gray-500 text-[10px]">Ctrl+D</span>
      </button>
      <div className="h-px bg-vectra-border my-1" />
      <button onClick={() => { onDelete(); onClose(); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-900/50 flex items-center gap-2">
        <Icon name="trash" /> Delete
      </button>
    </div>
  );
};
