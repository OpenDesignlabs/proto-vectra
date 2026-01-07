import React from 'react';
import { Icon } from './Icon';
import { ComponentData, StyleConfig, CMSCollection, DataBinding } from '../types';

interface InspectorProps {
  selectedNode: ComponentData | null;
  editingState: 'base' | 'hover' | 'active' | 'focus';
  setEditingState: (state: 'base' | 'hover' | 'active' | 'focus') => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  currentStyleConfig: Partial<StyleConfig>;
  updateStyleConfig: (id: string, config: Partial<StyleConfig>) => void;
  updateProps: (id: string, props: any) => void;
  updateCustomClass: (id: string, className: string) => void;
  moveComponent: (direction: 'up' | 'down') => void;
  duplicateComponent: () => void;
  deleteComponent: (id: string) => void;
  previewMode: boolean;
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  handleAiEdit: () => void;
  isAiLoading: boolean;
  openAssetModal: (target: 'prop' | 'bg') => void;
  onAutoResponsive?: () => void;
  cmsCollections: CMSCollection[];
  updateRepeatConfig: (id: string, collectionId: string | null) => void;
  updateBinding: (id: string, prop: string, binding: DataBinding | null) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedNode,
  editingState,
  setEditingState,
  viewport,
  currentStyleConfig,
  updateStyleConfig,
  updateProps,
  updateCustomClass,
  moveComponent,
  duplicateComponent,
  deleteComponent,
  previewMode,
  aiPrompt,
  setAiPrompt,
  handleAiEdit,
  isAiLoading,
  openAssetModal,
  onAutoResponsive,
  cmsCollections,
  updateRepeatConfig,
  updateBinding
}) => {
  if (!selectedNode) {
    return (
      <div className={`w-80 bg-vectra-panel border-l border-vectra-border flex flex-col overflow-y-auto transition-all duration-300 ${previewMode ? '-mr-80' : ''}`}>
        <div className="flex flex-col items-center justify-center h-full text-vectra-muted p-8 text-center">
          <Icon name="mouse-pointer" />
          <p className="mt-4 text-sm">Select a component to access Professional Design controls.</p>
        </div>
      </div>
    );
  }

  const availableFields = cmsCollections.flatMap(c => c.fields.map(f => ({ ...f, collectionName: c.name })));

  return (
    <div className={`w-80 bg-vectra-panel border-l border-vectra-border flex flex-col overflow-y-auto transition-all duration-300 ${previewMode ? '-mr-80' : ''}`}>
      <div className="p-0">
        {/* Header Actions */}
        <div className="p-4 border-b border-vectra-border flex justify-between items-center bg-vectra-bg">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs uppercase font-bold text-vectra-accent truncate max-w-[120px]" title={selectedNode.name}>{selectedNode.name}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => moveComponent('up')} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Move Up"><Icon name="arrow-up" /></button>
            <button onClick={() => moveComponent('down')} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Move Down"><Icon name="arrow-down" /></button>
            <button onClick={() => duplicateComponent()} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Duplicate (Ctrl+D)"><Icon name="copy" /></button>
            <button onClick={() => deleteComponent(selectedNode.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors" title="Delete"><Icon name="trash" /></button>
          </div>
        </div>

        {/* DATA BINDING SECTION */}
        {editingState === 'base' && (
            <div className="p-4 border-b border-purple-500/30 bg-purple-900/10">
                <h3 className="text-xs font-bold text-purple-300 uppercase flex items-center gap-2 mb-3"><Icon name="database" /> Dynamic Data</h3>
                {selectedNode.type === 'container' && (
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400">Repeat List Source</label>
                        <select 
                            value={selectedNode.repeatConfig?.collectionId || ''} 
                            onChange={(e) => updateRepeatConfig(selectedNode.id, e.target.value || null)}
                            className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                        >
                            <option value="">None</option>
                            {cmsCollections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500">Turns this container into a list repeating its children.</p>
                    </div>
                )}
                {/* ... (Existing binding inputs for Text/Image) ... */}
                 {selectedNode.type !== 'container' && (
                    <div className="space-y-2">
                        {(selectedNode.type === 'text' || selectedNode.type === 'button') && (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Text Content</label>
                                    {selectedNode.bindings?.text && <span className="text-[10px] text-purple-400">Bound</span>}
                                </div>
                                <select 
                                    value={selectedNode.bindings?.text?.fieldId || ''} 
                                    onChange={(e) => updateBinding(selectedNode.id, 'text', e.target.value ? { fieldId: e.target.value } : null)}
                                    className={`w-full bg-vectra-bg border rounded px-2 py-1.5 text-xs text-white ${selectedNode.bindings?.text ? 'border-purple-500' : 'border-vectra-border'}`}
                                >
                                    <option value="">Static Text</option>
                                    <optgroup label="Dynamic Fields">
                                        {availableFields.map(f => (
                                            <option key={`${f.collectionName}-${f.id}`} value={f.id}>{f.name} ({f.collectionName})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                        {(selectedNode.type === 'image') && (
                             <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Image Source</label>
                                    {selectedNode.bindings?.src && <span className="text-[10px] text-purple-400">Bound</span>}
                                </div>
                                <select 
                                    value={selectedNode.bindings?.src?.fieldId || ''} 
                                    onChange={(e) => updateBinding(selectedNode.id, 'src', e.target.value ? { fieldId: e.target.value } : null)}
                                    className={`w-full bg-vectra-bg border rounded px-2 py-1.5 text-xs text-white ${selectedNode.bindings?.src ? 'border-purple-500' : 'border-vectra-border'}`}
                                >
                                    <option value="">Static URL</option>
                                    <optgroup label="Dynamic Fields">
                                        {availableFields.filter(f => f.type === 'image').map(f => (
                                            <option key={`${f.collectionName}-${f.id}`} value={f.id}>{f.name} ({f.collectionName})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* State Toggle */}
        <div className="px-4 py-2 border-b border-vectra-border bg-vectra-panel flex items-center justify-between">
          <span className="text-xs text-gray-400 font-bold uppercase">State</span>
          <select
            value={editingState}
            onChange={(e) => setEditingState(e.target.value as any)}
            className={`text-xs px-2 py-1 rounded border border-vectra-border outline-none ${editingState === 'base' ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white border-blue-500'}`}
          >
            <option value="base">None (Base)</option>
            <option value="hover">Hover</option>
            <option value="active">Active</option>
            <option value="focus">Focus</option>
          </select>
        </div>

        {/* ... (Editing State Info & Auto Responsive - Keep Existing) ... */}
        {editingState !== 'base' && (
          <div className="px-4 py-2 bg-blue-900/20 border-b border-blue-900/50 text-blue-200 text-xs text-center flex items-center justify-center gap-2">
            <Icon name="info-circle" /> Editing {editingState.charAt(0).toUpperCase() + editingState.slice(1)} Styles
          </div>
        )}
        {editingState === 'base' && viewport !== 'desktop' && (
          <div className="bg-purple-900/20 border-b border-purple-900/50 p-2">
             <div className="text-purple-200 text-xs text-center flex items-center justify-center gap-2 mb-2">
                <Icon name={viewport === 'mobile' ? 'mobile-alt' : 'tablet-alt'} />
                Editing {viewport.charAt(0).toUpperCase() + viewport.slice(1)} Styles
             </div>
             {onAutoResponsive && (
               <button onClick={onAutoResponsive} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-1.5 rounded flex items-center justify-center gap-2 transition-colors shadow-lg">
                 <Icon name="magic" /> Auto-Make Responsive
               </button>
             )}
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* LAYOUT Section (Keep Existing) */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="layer-group" /> Layout</h3>
             {/* ... (Existing Layout Controls) ... */}
             <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Display</label>
                <select value={currentStyleConfig.display || 'block'} onChange={(e) => updateStyleConfig(selectedNode.id, { display: e.target.value as any })} className="w-full bg-vectra-bg border border-vectra-border rounded px-1 py-1 text-[10px] text-white">
                  <option value="block">Block</option>
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Overflow</label>
                <select value={currentStyleConfig.overflow || 'visible'} onChange={(e) => updateStyleConfig(selectedNode.id, { overflow: e.target.value as any })} className="w-full bg-vectra-bg border border-vectra-border rounded px-1 py-1 text-[10px] text-white">
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="scroll">Scroll</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
          
           {/* ... (Typography & Appearance & Spacing & Position - Keep Existing) ... */}

          {/* MOTION & 3D Section - UPDATED */}
          <div className="space-y-3 pt-4 border-t border-vectra-border">
            <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="film" /> Motion & 3D</h3>

            {/* Animation Presets */}
            <div className="space-y-1">
                <label className="text-xs text-gray-400">Animation</label>
                <select value={currentStyleConfig.animation || 'none'} onChange={(e) => updateStyleConfig(selectedNode.id, { animation: e.target.value as any })} className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white">
                  <option value="none">None</option>
                  <option value="fade-in">Fade In</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="bounce-in">Bounce In</option>
                  <optgroup label="Ambient">
                      <option value="float">Float</option>
                      <option value="breathe">Breathe</option>
                      <option value="pulse-slow">Pulse Slow</option>
                      <option value="spin-slow">Spin Slow</option>
                      <option value="wiggle">Wiggle</option>
                  </optgroup>
                  <optgroup label="Advanced">
                      <option value="ticker">Ticker (Marquee)</option>
                      <option value="gradient-xy">Gradient Flow</option>
                  </optgroup>
                </select>
            </div>

            {/* Motion Controls */}
            {currentStyleConfig.animation && currentStyleConfig.animation !== 'none' && (
                <div className="grid grid-cols-2 gap-2 bg-[#111] p-2 rounded border border-gray-800">
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500">Duration (ms)</label>
                        <select value={currentStyleConfig.transitionDuration || 300} onChange={(e) => updateStyleConfig(selectedNode.id, { transitionDuration: parseInt(e.target.value) as any })} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-[10px] text-white">
                            <option value="75">75</option>
                            <option value="150">150</option>
                            <option value="300">300</option>
                            <option value="500">500</option>
                            <option value="1000">1000</option>
                            <option value="2000">2000</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500">Delay (ms)</label>
                        <input type="number" step="100" value={currentStyleConfig.animationDelay || 0} onChange={(e) => updateStyleConfig(selectedNode.id, { animationDelay: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-[10px] text-white" />
                    </div>
                     <div className="space-y-1 col-span-2">
                        <label className="text-[9px] text-gray-500">Easing</label>
                        <select value={currentStyleConfig.animationTimingFunction || 'ease'} onChange={(e) => updateStyleConfig(selectedNode.id, { animationTimingFunction: e.target.value as any })} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-[10px] text-white">
                            <option value="ease">Ease</option>
                            <option value="linear">Linear</option>
                            <option value="ease-in">Ease In</option>
                            <option value="ease-out">Ease Out</option>
                            <option value="ease-in-out">Ease In Out</option>
                        </select>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={currentStyleConfig.scrollTrigger || false} 
                                onChange={(e) => updateStyleConfig(selectedNode.id, { scrollTrigger: e.target.checked })} 
                                className="rounded bg-gray-800 border-gray-600 text-vectra-accent" 
                            />
                            <span className="text-[10px] text-gray-300">Play on Scroll (Reveal)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* 3D Transforms */}
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <h4 className="text-[10px] text-gray-500 font-bold uppercase">3D Transforms</h4>
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-gray-400"><label>Perspective (Depth)</label> <span>{currentStyleConfig.perspective || 0}px</span></div>
                 <input type="range" min="0" max="2000" step="100" value={currentStyleConfig.perspective || 0} onChange={(e) => updateStyleConfig(selectedNode.id, { perspective: parseInt(e.target.value) })} className="w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <div>
                     <label className="text-[10px] text-gray-400">Rot X</label>
                     <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-1 text-xs text-center" value={currentStyleConfig.rotateX || 0} onChange={(e) => updateStyleConfig(selectedNode.id, { rotateX: parseInt(e.target.value) })} />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-400">Rot Y</label>
                     <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-1 text-xs text-center" value={currentStyleConfig.rotateY || 0} onChange={(e) => updateStyleConfig(selectedNode.id, { rotateY: parseInt(e.target.value) })} />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-400">Rot Z</label>
                     <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-1 text-xs text-center" value={currentStyleConfig.rotate || 0} onChange={(e) => updateStyleConfig(selectedNode.id, { rotate: parseInt(e.target.value) })} />
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">Transform Style</label>
                      <select value={currentStyleConfig.transformStyle || 'flat'} onChange={(e) => updateStyleConfig(selectedNode.id, { transformStyle: e.target.value as any })} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-[10px] text-white">
                          <option value="flat">Flat</option>
                          <option value="preserve-3d">Preserve 3D</option>
                      </select>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">Backface</label>
                      <select value={currentStyleConfig.backfaceVisibility || 'visible'} onChange={(e) => updateStyleConfig(selectedNode.id, { backfaceVisibility: e.target.value as any })} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-[10px] text-white">
                          <option value="visible">Visible</option>
                          <option value="hidden">Hidden</option>
                      </select>
                  </div>
              </div>
            </div>
          </div>
          
           {/* ... (AI Design section - Keep existing) ... */}
           {editingState === 'base' && (
            <div className="pt-4 border-t border-vectra-border">
              <div className="flex items-center gap-2 mb-2 text-blue-400"><Icon name="sparkles" /><span className="text-xs font-bold uppercase tracking-wider">AI Design</span></div>
              <div className="flex gap-2">
                <input className="flex-1 bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-vectra-accent" placeholder="e.g. Modern dark card..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                <button onClick={handleAiEdit} disabled={isAiLoading || !aiPrompt} className="bg-vectra-accent hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center transition-all disabled:opacity-50">{isAiLoading ? <Icon name="circle-notch fa-spin" /> : <Icon name="magic" />}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
