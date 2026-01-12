import React from 'react';
import { Icon } from './Icon';
import { DraggableItem } from './DraggableItem';
import { LayersPanel } from './LayersPanel';
import { DataPanel } from './DataPanel';
import { ComponentData, CMSCollection, CMSItem } from '../types';

interface LeftSidebarProps {
  activeTab: 'add' | 'layers' | 'data';
  setActiveTab: (tab: 'add' | 'layers' | 'data') => void;
  previewMode: boolean;
  tree: ComponentData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  collections: CMSCollection[];
  onDrop: (parentId: string, type: string, movedId?: string, index?: number) => void;
  onAddCollection: (name: string) => void;
  onAddItem: (collectionId: string, item: CMSItem) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  previewMode,
  tree,
  selectedId,
  onSelect,
  onUpdateName,
  collections,
  onDrop,
  onAddCollection,
  onAddItem
}) => {
  return (
    <div className={`w-64 bg-vectra-panel border-r border-vectra-border flex flex-col transition-all duration-300 ${previewMode ? '-ml-64' : ''}`}>
      <div className="flex border-b border-vectra-border">
        <button onClick={() => setActiveTab('add')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'add' ? 'bg-vectra-panel text-vectra-accent border-b-2 border-vectra-accent' : 'bg-vectra-bg text-vectra-muted hover:text-white'}`}><Icon name="plus" /> Add</button>
        <button onClick={() => setActiveTab('layers')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'layers' ? 'bg-vectra-panel text-vectra-accent border-b-2 border-vectra-accent' : 'bg-vectra-bg text-vectra-muted hover:text-white'}`}><Icon name="layer-group" /> Layers</button>
        <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'data' ? 'bg-vectra-panel text-vectra-accent border-b-2 border-vectra-accent' : 'bg-vectra-bg text-vectra-muted hover:text-white'}`}><Icon name="database" /> Data</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'add' ? (
          <div className="p-4">
            <h2 className="text-xs font-bold text-vectra-muted uppercase tracking-wider mb-3">Snippets</h2>
            <DraggableItem type="navbar" icon="compass" label="Navbar" />
            <DraggableItem type="hero" icon="star" label="Hero Section" />
            <DraggableItem type="card" icon="id-card" label="Feature Card" />
            <DraggableItem type="modal" icon="window-maximize" label="Modal" />

            <h2 className="text-xs font-bold text-vectra-muted uppercase tracking-wider mb-3 mt-6">Basic</h2>
            <DraggableItem type="container" icon="square" label="Container" />
            <DraggableItem type="text" icon="font" label="Text Block" />
            <DraggableItem type="button" icon="mouse-pointer" label="Button" />

            <h2 className="text-xs font-bold text-vectra-muted uppercase tracking-wider mb-3 mt-6">Form</h2>
            <DraggableItem type="input" icon="keyboard" label="Input Field" />

            <h2 className="text-xs font-bold text-vectra-muted uppercase tracking-wider mb-3 mt-6">Media</h2>
            <DraggableItem type="image" icon="image" label="Image" />
            <DraggableItem type="video" icon="video" label="Video" />
          </div>
        ) : activeTab === 'layers' ? (
          <div className="p-4 text-sm">
            <LayersPanel 
              data={tree} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              onUpdateName={onUpdateName} 
              onDrop={onDrop}
            />
          </div>
        ) : (
          <DataPanel 
            collections={collections} 
            onAddCollection={onAddCollection} 
            onAddItem={onAddItem} 
          />
        )}
      </div>
    </div>
  );
};