import React, { useState, useEffect, useCallback } from 'react';
import { ComponentData, Interaction, StyleConfig, CMSCollection, DataBinding } from './types';
import { INITIAL_TREE, INITIAL_CMS_COLLECTIONS } from './constants';
import { generateId, findNode, updateNode, createComponent, generateCode, cloneNode, moveNode } from './utils';
import { generateComponentStyles, generateResponsiveVariant } from './ai';
import { ContextMenu } from './components/ContextMenu';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { AssetModal } from './components/AssetModal';
import { CodeModal } from './components/CodeModal';

const App = () => {
  const [tree, setTree] = useState<ComponentData>(INITIAL_TREE);
  const [history, setHistory] = useState<ComponentData[]>([]);
  const [future, setFuture] = useState<ComponentData[]>([]);
  
  // CMS STATE
  const [cmsCollections, setCmsCollections] = useState<CMSCollection[]>(INITIAL_CMS_COLLECTIONS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'add' | 'layers' | 'data'>('add');
  
  const [zoom, setZoom] = useState(1);
  const [editingState, setEditingState] = useState<'base' | 'hover' | 'active' | 'focus'>('base');
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<StyleConfig | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetModalTarget, setAssetModalTarget] = useState<'prop' | 'bg'>('prop');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // History Management
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

  // Actions
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

  // Keyboard Shortcuts
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateComponent]);

  const handleDrop = (parentId: string, type: string, movedId?: string, index: number = -1) => {
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
  };

  const updateProps = (id: string, newProps: any) => {
    saveToHistory(updateNode(tree, id, node => ({
      ...node,
      props: { ...node.props, ...newProps }
    })));
  };

  const updateName = (id: string, name: string) => {
    saveToHistory(updateNode(tree, id, node => ({
      ...node,
      name: name
    })));
  };

  const updateCustomClass = (id: string, className: string) => {
    saveToHistory(updateNode(tree, id, node => ({
      ...node,
      customClassName: className
    })));
  };

  // CMS UPDATERS
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

  // RESPONSIVE STYLE UPDATER
  const updateStyleConfig = (id: string, newConfig: Partial<StyleConfig>) => {
    saveToHistory(updateNode(tree, id, node => {
       if (editingState === 'hover') {
         return { ...node, hoverStyleConfig: { ...(node.hoverStyleConfig || {}), ...newConfig } };
       }
       if (editingState === 'focus') {
         return { ...node, focusStyleConfig: { ...(node.focusStyleConfig || {}), ...newConfig } };
       }
       if (editingState === 'active') {
         return { ...node, activeStyleConfig: { ...(node.activeStyleConfig || {}), ...newConfig } };
       }
       
       if (viewport === 'mobile') {
         return { ...node, mobileStyleConfig: { ...(node.mobileStyleConfig || {}), ...newConfig } };
       }
       if (viewport === 'tablet') {
         return { ...node, tabletStyleConfig: { ...(node.tabletStyleConfig || {}), ...newConfig } };
       }
       return { ...node, styleConfig: { ...node.styleConfig, ...newConfig } };
    }));
  };

  const deleteComponent = (id: string) => {
    if (id === 'root') return;
    const recursiveDelete = (node: ComponentData): ComponentData => ({
      ...node,
      children: node.children.filter(c => c.id !== id).map(recursiveDelete)
    });
    saveToHistory(recursiveDelete(tree));
    setSelectedId(null);
  };

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
    const responsiveStyle = await generateResponsiveVariant(node.styleConfig, viewport as 'mobile'|'tablet');
    setIsAiLoading(false);

    if (responsiveStyle) {
        if (viewport === 'mobile') {
            saveToHistory(updateNode(tree, selectedId, n => ({ ...n, mobileStyleConfig: { ...n.mobileStyleConfig, ...responsiveStyle } })));
        } else if (viewport === 'tablet') {
            saveToHistory(updateNode(tree, selectedId, n => ({ ...n, tabletStyleConfig: { ...n.tabletStyleConfig, ...responsiveStyle } })));
        }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, id });
    setSelectedId(id);
  };

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  
  const getCurrentStyleConfig = (): Partial<StyleConfig> => {
    if (!selectedNode) return {};
    if (editingState === 'hover') return selectedNode.hoverStyleConfig || {};
    if (editingState === 'focus') return selectedNode.focusStyleConfig || {};
    if (editingState === 'active') return selectedNode.activeStyleConfig || {};
    
    if (viewport === 'mobile') return { ...selectedNode.styleConfig, ...selectedNode.mobileStyleConfig };
    if (viewport === 'tablet') return { ...selectedNode.styleConfig, ...selectedNode.tabletStyleConfig };
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
          cmsCollections={cmsCollections} // Pass CMS collections to Canvas
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