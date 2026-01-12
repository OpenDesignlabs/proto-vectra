
import React, { useState } from 'react';
import { Icon } from './Icon';
import { ComponentData, StyleConfig, CMSCollection, DataBinding, Interaction, AuditIssue } from '../types';
import { performAudit } from '../utils';

interface InspectorProps {
  selectedNode: ComponentData | null;
  editingState: string;
  setEditingState: (state: string) => void;
  viewport: string;
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
  addCustomState: (id: string, name: string) => void;
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
  updateBinding,
  addCustomState
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'interact' | 'audit'>('design');
  const [auditResults, setAuditResults] = useState<AuditIssue[]>([]);
  const [auditScore, setAuditScore] = useState(100);
  const [newStateName, setNewStateName] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

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

  const handleAudit = () => {
    // Audit the full branch from selected node
    const results = performAudit(selectedNode);
    setAuditResults(results);
    
    // Calculate Score
    let score = 100;
    results.forEach(r => {
        if (r.severity === 'high') score -= 15;
        if (r.severity === 'medium') score -= 5;
        if (r.severity === 'low') score -= 1;
    });
    setAuditScore(Math.max(0, score));
  };

  const handleAddState = () => {
      if (!newStateName.trim()) return;
      addCustomState(selectedNode.id, newStateName.trim().toLowerCase().replace(/\s+/g, '-'));
      setNewStateName('');
  };

  const getSeverityColor = (s: string) => {
    switch(s) {
        case 'high': return 'text-red-400 border-red-500/30 bg-red-900/10';
        case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
        case 'low': return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
        default: return 'text-gray-400';
    }
  }

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-500 border-green-500';
      if (score >= 70) return 'text-yellow-500 border-yellow-500';
      return 'text-red-500 border-red-500';
  }

  const customStateKeys = Object.keys(selectedNode.customStates || {});

  return (
    <div className={`w-80 bg-vectra-panel border-l border-vectra-border flex flex-col overflow-y-auto transition-all duration-300 ${previewMode ? '-mr-80' : ''}`}>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-vectra-border bg-vectra-bg">
        <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'design' ? 'text-vectra-accent border-b-2 border-vectra-accent' : 'text-gray-500 hover:text-white'}`}>Design</button>
        <button onClick={() => setActiveTab('interact')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'interact' ? 'text-vectra-accent border-b-2 border-vectra-accent' : 'text-gray-500 hover:text-white'}`}>Interact</button>
        <button onClick={() => setActiveTab('audit')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'audit' ? 'text-vectra-accent border-b-2 border-vectra-accent' : 'text-gray-500 hover:text-white'}`}>Audit</button>
      </div>

      <div className="p-0">
        {/* Header Actions */}
        <div className="p-4 border-b border-vectra-border flex justify-between items-center bg-vectra-panel">
          <div className="flex items-center gap-2 overflow-hidden">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span className="text-xs uppercase font-bold text-white truncate max-w-[120px]" title={selectedNode.name}>{selectedNode.name}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => moveComponent('up')} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Move Up"><Icon name="arrow-up" /></button>
            <button onClick={() => moveComponent('down')} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Move Down"><Icon name="arrow-down" /></button>
            <button onClick={() => duplicateComponent()} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-vectra-border" title="Duplicate (Ctrl+D)"><Icon name="copy" /></button>
            <button onClick={() => deleteComponent(selectedNode.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors" title="Delete"><Icon name="trash" /></button>
          </div>
        </div>

        {activeTab === 'design' && (
        <>
            {/* Visual State Manager */}
            <div className="p-4 border-b border-vectra-border bg-vectra-bg">
                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Component State</label>
                <div className="flex flex-wrap gap-1 mb-2">
                    {['base', 'hover', 'active', 'focus', ...customStateKeys].map((state) => (
                        <button
                            key={state}
                            onClick={() => setEditingState(state)}
                            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded transition-colors border ${editingState === state ? 'bg-gray-700 text-white border-gray-600' : 'text-gray-500 border-gray-800 hover:border-gray-600'}`}
                        >
                            {state}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-1 mt-2">
                    <input 
                        className="flex-1 bg-vectra-panel border border-vectra-border rounded px-2 py-1 text-xs text-white" 
                        placeholder="New state name..." 
                        value={newStateName}
                        onChange={(e) => setNewStateName(e.target.value)}
                    />
                    <button onClick={handleAddState} className="bg-vectra-accent px-3 rounded text-white text-xs">+</button>
                </div>

                {editingState !== 'base' && (
                    <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1">
                        <Icon name="info-circle" /> 
                        <span>Editing <b>{editingState}</b> state. Trigger via Interaction.</span>
                    </div>
                )}
            </div>

            {/* Design Controls (Existing) */}
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

            <div className="p-4 space-y-6">
                {/* Semantics / Tag */}
                <div className="space-y-3">
                     <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="code" /> Semantics</h3>
                     <div className="space-y-1">
                        <label className="text-xs text-gray-400">HTML Tag</label>
                        <select 
                            value={selectedNode.tagName || ''} 
                            onChange={(e) => updateProps(selectedNode.id, { tagName: e.target.value || undefined })}
                            className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                        >
                            <option value="">Default ({selectedNode.type})</option>
                            <option value="div">div</option>
                            <option value="section">section</option>
                            <option value="article">article</option>
                            <option value="header">header</option>
                            <option value="footer">footer</option>
                            <option value="nav">nav</option>
                            <option value="form">form</option>
                            <option value="aside">aside</option>
                            <option value="main">main</option>
                        </select>
                     </div>
                </div>

                {/* Layout Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="layer-group" /> Layout</h3>
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

                {/* Appearance Section */}
                <div className="space-y-3 pt-4 border-t border-vectra-border">
                    <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="palette" /> Appearance</h3>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-xs text-gray-400">Background</label>
                            <div className="flex items-center gap-2 bg-vectra-bg border border-vectra-border rounded p-1">
                                <input 
                                    type="color" 
                                    value={currentStyleConfig.backgroundColor?.startsWith('#') ? currentStyleConfig.backgroundColor : '#ffffff'} 
                                    onChange={(e) => updateStyleConfig(selectedNode.id, { backgroundColor: e.target.value })}
                                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={currentStyleConfig.backgroundColor || ''} 
                                    onChange={(e) => updateStyleConfig(selectedNode.id, { backgroundColor: e.target.value })}
                                    className="flex-1 bg-transparent border-none text-[10px] text-white focus:outline-none p-0 w-full"
                                    placeholder="#fff"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Text Color</label>
                            <div className="flex items-center gap-2 bg-vectra-bg border border-vectra-border rounded p-1">
                                <input 
                                    type="color" 
                                    value={currentStyleConfig.textColor?.startsWith('#') ? currentStyleConfig.textColor : '#000000'} 
                                    onChange={(e) => updateStyleConfig(selectedNode.id, { textColor: e.target.value })}
                                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={currentStyleConfig.textColor || ''} 
                                    onChange={(e) => updateStyleConfig(selectedNode.id, { textColor: e.target.value })}
                                    className="flex-1 bg-transparent border-none text-[10px] text-white focus:outline-none p-0 w-full"
                                    placeholder="#000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Motion Section */}
                <div className="space-y-3 pt-4 border-t border-vectra-border">
                    <h3 className="text-xs font-bold text-vectra-muted uppercase flex items-center gap-2"><Icon name="film" /> Motion & 3D</h3>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Animation</label>
                        <select value={currentStyleConfig.animation || 'none'} onChange={(e) => updateStyleConfig(selectedNode.id, { animation: e.target.value as any })} className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                        >
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
                </div>

                {/* AI Design */}
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
        </>
        )}

        {activeTab === 'interact' && (
            <div className="p-4 space-y-6">
                <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded">
                    <h3 className="text-xs font-bold text-blue-300 uppercase mb-3 flex items-center gap-2"><Icon name="bolt" /> Interaction</h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Trigger</label>
                            <select 
                                value={selectedNode.interactions?.trigger || 'click'} 
                                onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, trigger: e.target.value } })}
                                className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                            >
                                <option value="click">On Click</option>
                                <option value="view">On Scroll View</option>
                                <option value="mouseEnter">Mouse Enter</option>
                                <option value="mouseLeave">Mouse Leave</option>
                                {selectedNode.tagName === 'form' && <option value="submit">On Submit (Form)</option>}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Action</label>
                            <select 
                                value={selectedNode.interactions?.type || 'none'} 
                                onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, type: e.target.value } })}
                                className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                            >
                                <option value="none">None</option>
                                <option value="setState">Set Custom State</option>
                                <option value="alert">Show Alert</option>
                                <option value="link">Open Link</option>
                                <option value="scroll">Scroll To ID</option>
                                <option value="log">Console Log</option>
                                <option value="api">API Request</option>
                            </select>
                        </div>

                        {selectedNode.interactions?.type === 'api' ? (
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400">Method</label>
                                    <select 
                                        value={selectedNode.interactions?.apiMethod || 'GET'} 
                                        onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, apiMethod: e.target.value } })}
                                        className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400">URL</label>
                                    <input 
                                        type="text" 
                                        value={selectedNode.interactions?.apiUrl || ''} 
                                        onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, apiUrl: e.target.value } })}
                                        placeholder="https://api.example.com/data"
                                        className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                                    />
                                </div>
                            </div>
                        ) : selectedNode.interactions?.type && selectedNode.interactions.type !== 'none' && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">
                                    {selectedNode.interactions.type === 'setState' ? 'State Name' : 'Value'}
                                </label>
                                <input 
                                    type="text" 
                                    value={selectedNode.interactions?.value || ''} 
                                    onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, value: e.target.value } })}
                                    placeholder={
                                        selectedNode.interactions.type === 'link' ? 'https://example.com' :
                                        selectedNode.interactions.type === 'scroll' ? '#section-id' :
                                        selectedNode.interactions.type === 'setState' ? 'e.g. toggled' :
                                        'Value...'
                                    }
                                    className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                                />
                                {selectedNode.interactions.type === 'setState' && (
                                    <p className="text-[10px] text-gray-500">Toggles the named custom state.</p>
                                )}
                            </div>
                        )}
                        
                        {(selectedNode.interactions?.trigger === 'view') && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Threshold (0-1)</label>
                                <input 
                                    type="number" 
                                    step="0.1" min="0" max="1"
                                    value={selectedNode.interactions?.threshold || 0.1} 
                                    onChange={(e) => updateProps(selectedNode.id, { _interaction: { ...selectedNode.interactions, threshold: parseFloat(e.target.value) } })}
                                    className="w-full bg-vectra-bg border border-vectra-border rounded px-2 py-1.5 text-xs text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'audit' && (
            <div className="p-4 space-y-6">
                <div className="bg-gray-800/30 p-4 rounded border border-gray-700 flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center mb-4 ${getScoreColor(auditScore)}`}>
                         <span className="text-2xl font-bold text-white">{auditScore}</span>
                         <span className="text-[10px] uppercase text-gray-400">Score</span>
                    </div>
                    
                    <h3 className="text-sm font-bold mt-2">Component Health</h3>
                    <p className="text-xs text-gray-400 mb-4 text-center">Analysis includes bundle size, render cost, and accessibility.</p>
                    
                    <button onClick={handleAudit} className="bg-vectra-accent hover:bg-blue-600 text-white px-6 py-2 rounded text-xs font-bold transition-colors shadow-lg shadow-blue-500/20">
                        <Icon name="search" /> Run Analysis
                    </button>
                </div>

                {auditResults.length > 0 ? (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                            Issues Found <span className="bg-gray-800 text-white px-2 py-0.5 rounded-full text-[10px]">{auditResults.length}</span>
                        </h4>
                        
                        <div className="space-y-2">
                            {auditResults.map((issue) => (
                                <div key={issue.id} className={`border rounded-lg overflow-hidden transition-all duration-300 ${getSeverityColor(issue.severity)} ${expandedIssue === issue.id ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
                                    <div 
                                        onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                        className="p-3 flex items-start gap-3 cursor-pointer hover:bg-white/5"
                                    >
                                        <div className={`mt-0.5 ${issue.category === 'performance' ? 'text-blue-400' : issue.category === 'bundle' ? 'text-purple-400' : 'text-yellow-400'}`}>
                                            <Icon name={issue.category === 'performance' ? 'bolt' : issue.category === 'bundle' ? 'box' : 'universal-access'} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-xs font-bold text-gray-200">{issue.title}</h5>
                                                <span className={`text-[9px] uppercase font-bold border px-1.5 py-0.5 rounded ${getSeverityColor(issue.severity)}`}>{issue.severity}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{issue.description}</p>
                                        </div>
                                        <Icon name={expandedIssue === issue.id ? 'chevron-up' : 'chevron-down'} />
                                    </div>
                                    
                                    {expandedIssue === issue.id && (
                                        <div className="px-3 pb-3 pt-0 animate-fade-in">
                                            <div className="h-px bg-white/10 my-2"></div>
                                            <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">{issue.description}</p>
                                            
                                            {issue.suggestion && (
                                                <div className="bg-black/30 p-2 rounded flex gap-2 items-start">
                                                    <span className="text-green-400 text-xs mt-0.5"><Icon name="lightbulb" /></span>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed"><span className="text-green-400 font-bold">Fix:</span> {issue.suggestion}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 opacity-50">
                        <p className="text-xs">Run analysis to see results.</p>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
