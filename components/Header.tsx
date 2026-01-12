import React, { useState } from 'react';
import { Icon } from './Icon';
import { Breakpoint } from '../types';

interface HeaderProps {
  historyLength: number;
  futureLength: number;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  viewport: string;
  setViewport: (v: string) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  onClearSelection: () => void;
  breakpoints: Breakpoint[];
  setBreakpoints: (bps: Breakpoint[]) => void;
  onSave: () => void;
  isSaving: boolean;
  isBackendAvailable?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  historyLength,
  futureLength,
  onUndo,
  onRedo,
  zoom,
  setZoom,
  viewport,
  setViewport,
  previewMode,
  setPreviewMode,
  showCode,
  setShowCode,
  onClearSelection,
  breakpoints,
  setBreakpoints,
  onSave,
  isSaving,
  isBackendAvailable = true
}) => {
  const [isAddingBp, setIsAddingBp] = useState(false);
  const [newBpName, setNewBpName] = useState('');
  const [newBpWidth, setNewBpWidth] = useState('');

  const handleAddBreakpoint = () => {
      if (!newBpName || !newBpWidth) return;
      const id = newBpName.toLowerCase().replace(/\s+/g, '-');
      setBreakpoints([...breakpoints, { id, name: newBpName, width: newBpWidth + 'px', icon: 'mobile-alt', type: 'custom' }]);
      setIsAddingBp(false);
      setNewBpName('');
      setNewBpWidth('');
  };

  return (
    <header className="h-14 bg-vectra-panel border-b border-vectra-border flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-vectra-accent rounded flex items-center justify-center text-white font-bold">V</div>
          <span className="font-bold text-lg tracking-tight">Vectra</span>
          
          <div className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${isBackendAvailable ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isBackendAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isBackendAvailable ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-vectra-bg rounded p-1 border border-vectra-border">
          <button onClick={onUndo} disabled={historyLength === 0} className="p-1.5 px-3 rounded hover:bg-vectra-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Undo (Ctrl+Z)"><Icon name="undo" /></button>
          <button onClick={onRedo} disabled={futureLength === 0} className="p-1.5 px-3 rounded hover:bg-vectra-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Redo (Ctrl+Y)"><Icon name="redo" /></button>
        </div>

        <div className="flex items-center gap-2 bg-vectra-bg rounded p-1 border border-vectra-border ml-2">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-vectra-border text-xs"><Icon name="minus" /></button>
          <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-vectra-border text-xs"><Icon name="plus" /></button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
            onClick={onSave} 
            disabled={isSaving}
            className={`px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${isSaving ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
            {isSaving ? <Icon name="circle-notch fa-spin" /> : <Icon name="save" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        <div className="flex bg-vectra-bg rounded p-1 border border-vectra-border relative">
          {breakpoints.map(bp => (
              <button 
                  key={bp.id}
                  onClick={() => setViewport(bp.id)} 
                  className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${viewport === bp.id ? 'bg-vectra-border text-white' : 'text-vectra-muted hover:text-white'}`}
                  title={`${bp.name} (${bp.width})`}
              >
                  <Icon name={bp.icon} />
              </button>
          ))}
          <button onClick={() => setIsAddingBp(!isAddingBp)} className="px-2 py-1 text-xs text-gray-500 hover:text-white border-l border-vectra-border ml-1">+</button>
          
          {isAddingBp && (
              <div className="absolute top-full left-0 mt-2 bg-vectra-panel border border-vectra-border rounded p-3 shadow-xl w-48 z-50">
                  <h4 className="text-xs font-bold mb-2">New Breakpoint</h4>
                  <input className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1 text-xs mb-2 text-white" placeholder="Name (e.g. 4K)" value={newBpName} onChange={e => setNewBpName(e.target.value)} />
                  <input className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1 text-xs mb-2 text-white" placeholder="Width (e.g. 1440)" value={newBpWidth} type="number" onChange={e => setNewBpWidth(e.target.value)} />
                  <button onClick={handleAddBreakpoint} className="w-full bg-vectra-accent text-white rounded py-1 text-xs">Add</button>
              </div>
          )}
        </div>
        <button onClick={() => { setPreviewMode(!previewMode); onClearSelection(); }} className={`px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${previewMode ? 'bg-green-600 text-white' : 'bg-vectra-border text-vectra-muted hover:text-white'}`}>
          <Icon name={previewMode ? 'play' : 'eye'} /> {previewMode ? 'Previewing' : 'Preview'}
        </button>
      </div>

      <button onClick={() => setShowCode(!showCode)} className="text-xs font-mono bg-vectra-border px-3 py-1.5 rounded text-vectra-text hover:bg-gray-700">{showCode ? 'Close Code' : '</> View Code'}</button>
    </header>
  );
};