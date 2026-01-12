
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComponentData, Interaction, StyleConfig, CMSCollection, DataBinding, Breakpoint, CMSItem } from './types';
import { INITIAL_TREE, INITIAL_CMS_COLLECTIONS, API_BASE_URL } from './constants';
import { generateId, findNode, updateNode, createComponent, generateCode, cloneNode, moveNode } from './utils';
import { generateComponentStyles, generateResponsiveVariant } from './ai';
import { ContextMenu } from './components/ContextMenu';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { AssetModal } from './components/AssetModal';
import { CodeModal } from './components/CodeModal';

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'desktop', name: 'Desktop', width: '100%', height: '100%', type: 'desktop', icon: 'desktop' },
  { id: 'ultrawide', name: 'Ultrawide', width: '2560px', height: '1080px', type: 'ultrawide', icon: 'tv' },
  { id: 'tablet', name: 'Tablet', width: '768px', height: '1024px', type: 'tablet', icon: 'tablet-alt' },
  { id: 'foldable', name: 'Foldable', width: '673px', height: '864px', type: 'foldable', icon: 'book-open' },
  { id: 'mobile', name: 'Mobile', width: '375px', height: '812px', type: 'mobile', icon: 'mobile-alt' },
];

const App = () => {
  const [tree, setTree] = useState<ComponentData>(INITIAL_TREE);
  const [history, setHistory] = useState<ComponentData[]>([]);
  const [future, setFuture] = useState<ComponentData[]>([]);
  
  const [cmsCollections, setCmsCollections] = useState<CMSCollection[]>(INITIAL_CMS_COLLECTIONS);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(DEFAULT_BREAKPOINTS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<string>('desktop');
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'add' | 'layers' | 'data'>('add');
  
  const [zoom, setZoom] = useState(1);
  const [editingState, setEditingState] = useState<string>('base'); 
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<StyleConfig | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetModalTarget, setAssetModalTarget] = useState<'prop' | 'bg'>('prop');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const pollInterval = useRef<any>(null);

  // --- Backend Integration ---

  const loadOfflineData = () => {
     console.log("Loading offline data...");
     const savedTree = localStorage.getItem('vectra_project');
     if (savedTree) {
         try { setTree(JSON.parse(savedTree)); } catch(e) { console.error("Corrupt local tree"); }
     }
     
     const savedCMS = localStorage.getItem('vectra_cms');
     if (savedCMS) {
         try { setCmsCollections(JSON.parse(savedCMS)); } catch(e) { console.error("Corrupt local CMS"); }
     }
  };

  const fetchData = async () => {
      try {
          // Health Check first
          const health = await fetch(`${API_BASE_URL}/health`);
          if (!health.ok) throw new Error("Backend not healthy");

          const projectRes = await fetch(`${API_BASE_URL}/project`);
          const projectData = await projectRes.json();
          
          const cmsRes = await fetch(`${API_BASE_URL}/cms/collections`);
          const cmsData = await cmsRes.json();

          setTree(projectData);
          setCmsCollections(cmsData);
          setIsBackendAvailable(true);
          return true;
      } catch (error) {
          console.warn("Backend unavailable:", error);
          setIsBackendAvailable(false);
          loadOfflineData();
          return false;
      }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-reconnect polling
    pollInterval.current = setInterval(async () => {
        if (!isBackendAvailable) {
            try {
                const res = await fetch(`${API_BASE_URL}/health`);
                if (res.ok) {
                    console.log("Backend reconnected!");
                    fetchData(); // Reload data on reconnect
                }
            } catch(e) {}
        }
    }, 5000);

    return () => clearInterval(pollInterval.current);
  }, [isBackendAvailable]);

  const handleSave = async () => {
      setIsSaving(true);
      
      // Save to local storage always as backup
      localStorage.setItem('vectra_project', JSON.stringify(tree));
      localStorage.setItem('vectra_cms', JSON.stringify(cmsCollections));

      if (isBackendAvailable) {
          try {
              const res = await fetch(`${API_BASE_URL}/project`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(tree)
              });
              if (!res.ok) throw new Error("Save failed");
          } catch (error) {
              console.error("Failed to save to backend", error);
              setIsBackendAvailable(false); 
              alert("Connection to backend lost. Saved locally.");
          }
      } else {
          // Try to reconnect immediately on save attempt
          try {
             const health = await fetch(`${API_BASE_URL}/health`);
             if (health.ok) {
                 setIsBackendAvailable(true);
                 // Retry save
                 await fetch(`${API_BASE_URL}/project`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tree)
                });
             }
          } catch(e) {
              // Still offline
              await new Promise(r => setTimeout(r, 400)); 
          }
      }
      
      setIsSaving(false);
  };

  // --- CMS Actions ---

  const handleAddCollection = async (name: string) => {
    if (isBackendAvailable) {
        try {
            const res = await fetch(`${API_BASE_URL}/cms/collections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (!res.ok) throw new Error("Failed to create collection");
            const updatedCollections = await res.json();
            setCmsCollections(updatedCollections);
        } catch(e) { 
            console.error(e);
            alert("Failed to create collection on server.");
        }
    } else {
        // Offline logic
        const newCol: CMSCollection = {
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name,
            fields: [{ id: 'title', name: 'Title', type: 'text' }],
            items: []
        };
        setCmsCollections([...cmsCollections, newCol]);
    }
  };

  const handleAddItem = async (collectionId: string, itemData: CMSItem) => {
      if (isBackendAvailable) {
          try {
              const res = await fetch(`${API_BASE_URL}/cms/item/${collectionId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(itemData)
              });
              if (!res.ok) throw new Error("Failed to add item");
              const updatedCollections = await res.json();
              setCmsCollections(updatedCollections);
          } catch (e) { 
              console.error(e);
              alert("Failed to add item on server.");
          }
      } else {
          // Offline logic
          const updated = cmsCollections.map(c => {
              if (c.id === collectionId) {
                  return { ...c, items: [...c.items, { id: 'item-'+Date.now(), ...itemData }] };
              }
              return c;
          });
          setCmsCollections(updated);
      }
  };

  // ---------------------------

  const saveToHistory = (newTree: ComponentData) => {
    setHistory(prev => {
      const newHistory = [...prev, tree];
      if (newHistory.length > 50) return newHistory.slice(1);
      return newHistory;
    });
    setFuture([]); 
    setTree(newTree);
  };

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const newHistory = prev.slice(0, -1);
      setFuture(f => [tree, ...f]);
      setTree(previous);
      return newHistory;
    });
  }, [tree]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      const newFuture = prev.slice(1);
      setHistory(h => [...h, tree]);
      setTree(next);
      return newFuture;
    });
  }, [tree]);

  const duplicateComponent = useCallback((id?: string) => {
    const targetId = id || selectedId;
    if (!targetId || targetId === 'root') return;
    const nodeToClone = findNode(tree, targetId);
    if (!nodeToClone || !nodeToClone.parentId) return;

    const cloned = cloneNode(nodeToClone, nodeToClone.parentId);
    
    saveToHistory(updateNode(tree, nodeToClone.parentId, parent => ({
      ...parent,
      children: [...parent.children, cloned]
    })));
  }, [tree, selectedId]);

  const moveComponent = useCallback((direction: 'up' | 'down') => {
    if (!selectedId || selectedId === 'root') return;
    const node = findNode(tree, selectedId);
    if (!node || !node.parentId) return;

    saveToHistory(updateNode(tree, node.parentId, parent => {
      const index = parent.children.findIndex(c => c.id === selectedId);
      if (index === -1) return parent;
      
      const newChildren = [...parent.children];
      if (direction === 'up' && index > 0) {
        [newChildren[index], newChildren[index - 1]] = [newChildren[index - 1], newChildren[index]];
      } else if (direction === 'down' && index < newChildren.length - 1) {
        [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
      }
      
      return { ...parent, children: newChildren };
    }));
  }, [tree, selectedId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateComponent();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateComponent, tree, cmsCollections, isBackendAvailable]);

  // Using useCallback to prevent re-renders of all drag targets during drag operations
  const handleDrop = useCallback((parentId: string, type: string, movedId?: string, index: number = -1) => {
    if (movedId) {
      const newTree = moveNode(tree, movedId, parentId, index);
      saveToHistory(newTree);
    } else {
      const newComponent = createComponent(type);
      const componentWithParent = { ...newComponent, parentId };
      saveToHistory(updateNode(tree, parentId, node => {
        const newChildren = [...node.children];
        if (index >= 0) {
            newChildren.splice(index, 0, componentWithParent);
        } else {
            newChildren.push(componentWithParent);
        }
        return {
          ...node,
          children: newChildren
        };
      }));
    }
  }, [tree]);

  const updateProps = useCallback((id: string, newProps: any) => {
    saveToHistory(updateNode(tree, id, node => {
      if (newProps._interaction) {
          const { _interaction, ...restProps } = newProps;
          return {
              ...node,
              interactions: _interaction,
              props: { ...node.props, ...restProps }
          };
      }
      return {
        ...node,
        props: { ...node.props, ...newProps }
      };
    }));
  }, [tree]);

  const updateName = useCallback((id: string, name: string) => {
    saveToHistory(updateNode(tree, id, node => ({
      ...node,
      name: name
    })));
  }, [tree]);

  const updateCustomClass = (id: string, className: string) => {
    saveToHistory(updateNode(tree, id, node => ({
      ...node,
      customClassName: className
    })));
  };

  const updateRepeatConfig = (id: string, collectionId: string | null) => {
      saveToHistory(updateNode(tree, id, node => ({
          ...node,
          repeatConfig: collectionId ? { collectionId } : undefined
      })));
  };

  const updateBinding = (id: string, prop: string, binding: DataBinding | null) => {
      saveToHistory(updateNode(tree, id, node => {
          const newBindings = { ...node.bindings };
          if (binding) {
              newBindings[prop] = binding;
          } else {
              delete newBindings[prop];
          }
          return { ...node, bindings: newBindings };
      }));
  };

  const updateStyleConfig = (id: string, newConfig: Partial<StyleConfig>) => {
    saveToHistory(updateNode(tree, id, node => {
       if (editingState === 'hover') return { ...node, hoverStyleConfig: { ...(node.hoverStyleConfig || {}), ...newConfig } };
       if (editingState === 'focus') return { ...node, focusStyleConfig: { ...(node.focusStyleConfig || {}), ...newConfig } };
       if (editingState === 'active') return { ...node, activeStyleConfig: { ...(node.activeStyleConfig || {}), ...newConfig } };
       
       if (editingState !== 'base' && !['hover', 'focus', 'active'].includes(editingState)) {
          return {
             ...node,
             customStates: {
                ...(node.customStates || {}),
                [editingState]: { ...(node.customStates?.[editingState] || {}), ...newConfig }
             }
          };
       }

       if (viewport !== 'desktop') {
          if (viewport === 'mobile') {
             return { ...node, mobileStyleConfig: { ...(node.mobileStyleConfig || {}), ...newConfig } };
          }
          if (viewport === 'tablet') {
             return { ...node, tabletStyleConfig: { ...(node.tabletStyleConfig || {}), ...newConfig } };
          }
          return {
             ...node,
             breakpoints: {
                ...(node.breakpoints || {}),
                [viewport]: { ...(node.breakpoints?.[viewport] || {}), ...newConfig }
             }
          }
       }
       return { ...node, styleConfig: { ...node.styleConfig, ...newConfig } };
    }));
  };

  const deleteComponent = useCallback((id: string) => {
    if (id === 'root') return;
    const recursiveDelete = (node: ComponentData): ComponentData => ({
      ...node,
      children: node.children.filter(c => c.id !== id).map(recursiveDelete)
    });
    saveToHistory(recursiveDelete(tree));
    setSelectedId(null);
  }, [tree]);

  const handleCopyStyles = () => {
    if (!selectedId) return;
    const node = findNode(tree, selectedId);
    if (node) {
      setCopiedStyle(node.styleConfig);
    }
  };

  const handlePasteStyles = () => {
     if (!selectedId || !copiedStyle) return;
     updateStyleConfig(selectedId, copiedStyle);
  };

  const handleAiEdit = async () => {
    if (!selectedId || !aiPrompt.trim()) return;
    const node = findNode(tree, selectedId);
    if (!node) return;

    setIsAiLoading(true);
    const updatedProps = await generateComponentStyles(aiPrompt, node.props, node.type);
    setIsAiLoading(false);

    if (updatedProps) {
      if (updatedProps.className) updateProps(selectedId, { className: updatedProps.className });
      setAiPrompt('');
    }
  };

  const handleAutoResponsive = async () => {
    if (!selectedId || viewport === 'desktop') return;
    const node = findNode(tree, selectedId);
    if (!node) return;

    setIsAiLoading(true);
    if (viewport === 'mobile' || viewport === 'tablet') {
        const responsiveStyle = await generateResponsiveVariant(node.styleConfig, viewport);
        setIsAiLoading(false);
        if (responsiveStyle) {
            updateStyleConfig(selectedId, responsiveStyle);
        }
    } else {
        setIsAiLoading(false);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, id });
    setSelectedId(id);
  }, []);

  const addCustomState = (id: string, stateName: string) => {
      saveToHistory(updateNode(tree, id, node => ({
          ...node,
          customStates: { ...(node.customStates || {}), [stateName]: {} }
      })));
      setEditingState(stateName);
  };

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  
  const getCurrentStyleConfig = (): Partial<StyleConfig> => {
    if (!selectedNode) return {};
    if (editingState === 'hover') return selectedNode.hoverStyleConfig || {};
    if (editingState === 'focus') return selectedNode.focusStyleConfig || {};
    if (editingState === 'active') return selectedNode.activeStyleConfig || {};
    if (editingState !== 'base') return selectedNode.customStates?.[editingState] || {};
    if (viewport === 'mobile') return { ...selectedNode.styleConfig, ...selectedNode.mobileStyleConfig };
    if (viewport === 'tablet') return { ...selectedNode.styleConfig, ...selectedNode.tabletStyleConfig };
    if (viewport !== 'desktop') return { ...selectedNode.styleConfig, ...(selectedNode.breakpoints?.[viewport] || {}) };
    return selectedNode.styleConfig;
  };

  const currentStyleConfig = getCurrentStyleConfig();

  const selectAsset = (url: string) => {
     if (selectedId) {
        if (assetModalTarget === 'prop') {
            updateProps(selectedId, { src: url });
        } else {
            updateStyleConfig(selectedId, { backgroundImage: url });
        }
     }
     setIsAssetModalOpen(false);
  };
  
  const openAssetModal = (target: 'prop' | 'bg') => {
      setAssetModalTarget(target);
      setIsAssetModalOpen(true);
  }

  const generatedCodeString = `import React from 'react';\n\nexport default function MyComponent() {\n  return (\n${generateCode(tree, 2)}\n  );\n}`;

  return (
    <div className="flex flex-col h-full font-sans">
      <Header 
        historyLength={history.length}
        futureLength={future.length}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        setZoom={setZoom}
        viewport={viewport}
        setViewport={setViewport}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        showCode={showCode}
        setShowCode={setShowCode}
        onClearSelection={() => setSelectedId(null)}
        breakpoints={breakpoints}
        setBreakpoints={setBreakpoints}
        onSave={handleSave}
        isSaving={isSaving}
        isBackendAvailable={isBackendAvailable}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          activeTab={activeSideTab}
          setActiveTab={setActiveSideTab}
          previewMode={previewMode}
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateName={updateName}
          collections={cmsCollections}
          onDrop={handleDrop}
          onAddCollection={handleAddCollection}
          onAddItem={handleAddItem}
        />

        <Canvas 
          tree={tree}
          selectedId={selectedId}
          viewport={viewport}
          zoom={zoom}
          setZoom={setZoom}
          previewMode={previewMode}
          onSelect={setSelectedId}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
          onTextChange={(id, text) => updateProps(id, { text })}
          onClearSelection={() => setSelectedId(null)}
          cmsCollections={cmsCollections}
          breakpoints={breakpoints}
        />

        <Inspector 
          selectedNode={selectedNode}
          editingState={editingState}
          setEditingState={setEditingState}
          viewport={viewport}
          currentStyleConfig={currentStyleConfig}
          updateStyleConfig={updateStyleConfig}
          updateProps={updateProps}
          updateCustomClass={updateCustomClass}
          moveComponent={moveComponent}
          duplicateComponent={duplicateComponent}
          deleteComponent={deleteComponent}
          previewMode={previewMode}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          handleAiEdit={handleAiEdit}
          isAiLoading={isAiLoading}
          openAssetModal={openAssetModal}
          onAutoResponsive={handleAutoResponsive}
          cmsCollections={cmsCollections}
          updateRepeatConfig={updateRepeatConfig}
          updateBinding={updateBinding}
          addCustomState={addCustomState}
        />
      </div>
      
      <AssetModal 
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSelect={selectAsset}
      />
      
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onDuplicate={() => duplicateComponent(contextMenu.id)}
          onDelete={() => deleteComponent(contextMenu.id)}
          onCopyStyles={handleCopyStyles}
          onPasteStyles={handlePasteStyles}
          canPaste={!!copiedStyle}
          onUndo={undo}
          onRedo={redo}
          onClose={() => setContextMenu(null)}
        />
      )}

      <CodeModal 
        isOpen={showCode}
        onClose={() => setShowCode(false)}
        code={generatedCodeString}
      />
    </div>
  );
};

export default App;
