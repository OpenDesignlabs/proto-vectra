import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  historyLength: number;
  futureLength: number;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  setViewport: (v: 'desktop' | 'tablet' | 'mobile') => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  onClearSelection: () => void;
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
  onClearSelection
}) => {
  return (
    <header className="h-14 bg-vectra-panel border-b border-vectra-border flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-vectra-accent rounded flex items-center justify-center text-white font-bold">V</div>
          <span className="font-bold text-lg tracking-tight">Vectra</span>
        </div>

        <div className="flex items-center gap-1 bg-vectra-bg rounded p-1 border border-vectra-border">
          <button onClick={onUndo} disabled={historyLength === 0} className="p-1.5 px-3 rounded hover:bg-vectra-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Undo (Ctrl+Z)"><Icon name="undo" /></button>
          <button onClick={onRedo} disabled={futureLength === 0} className="p-1.5 px-3 rounded hover:bg-vectra-border disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Redo (Ctrl+Y)"><Icon name="redo" /></button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-vectra-bg rounded p-1 border border-vectra-border ml-2">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-vectra-border text-xs"><Icon name="minus" /></button>
          <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-vectra-border text-xs"><Icon name="plus" /></button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-vectra-bg rounded p-1 border border-vectra-border">
          <button onClick={() => setViewport('desktop')} className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${viewport === 'desktop' ? 'bg-vectra-border text-white' : 'text-vectra-muted hover:text-white'}`}><Icon name="desktop" /></button>
          <button onClick={() => setViewport('tablet')} className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${viewport === 'tablet' ? 'bg-vectra-border text-white' : 'text-vectra-muted hover:text-white'}`}><Icon name="tablet-alt" /></button>
          <button onClick={() => setViewport('mobile')} className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${viewport === 'mobile' ? 'bg-vectra-border text-white' : 'text-vectra-muted hover:text-white'}`}><Icon name="mobile-alt" /></button>
        </div>
        <button onClick={() => { setPreviewMode(!previewMode); onClearSelection(); }} className={`px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${previewMode ? 'bg-green-600 text-white' : 'bg-vectra-border text-vectra-muted hover:text-white'}`}>
          <Icon name={previewMode ? 'play' : 'eye'} /> {previewMode ? 'Previewing' : 'Preview'}
        </button>
      </div>

      <button onClick={() => setShowCode(!showCode)} className="text-xs font-mono bg-vectra-border px-3 py-1.5 rounded text-vectra-text hover:bg-gray-700">{showCode ? 'Close Code' : '</> View Code'}</button>
    </header>
  );
};
