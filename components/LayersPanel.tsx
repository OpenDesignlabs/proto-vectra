
import React, { useState } from 'react';
import { ComponentData } from '../types';
import { Icon } from './Icon';

interface LayersPanelProps {
  data: ComponentData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onDrop: (parentId: string, type: string, movedId?: string, index?: number) => void;
  depth?: number;
  parentId?: string | null;
  index?: number;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ 
  data, 
  selectedId, 
  onSelect, 
  onUpdateName, 
  onDrop, 
  depth = 0,
  parentId = null,
  index = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.name);
  const [dragState, setDragState] = useState<'top' | 'bottom' | 'inside' | null>(null);

  const isSelected = data.id === selectedId;
  const hasChildren = data.children && data.children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(data.id);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onUpdateName(data.id, editName);
    } else {
      setEditName(data.name); 
    }
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('application/vectra-move-id', data.id);
      e.dataTransfer.effectAllowed = 'move';
      
      // Visual feedback
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
       const el = e.currentTarget as HTMLElement;
       el.style.opacity = '1';
       setDragState(null);
  }

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const movedId = e.dataTransfer.getData('application/vectra-move-id');
      // If we are dragging this node, do nothing (optional optimization, but dataTransfer isn't always available in dragOver)
      
      if (data.id === 'root') {
          setDragState('inside');
          return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      
      // Thresholds
      const insideZone = 0.3; // 30% middle zone for nesting
      
      if (data.type === 'container') {
          if (y < height * ((1 - insideZone) / 2)) {
               setDragState('top');
          } else if (y > height * (1 - (1 - insideZone) / 2)) {
               setDragState('bottom');
          } else {
               setDragState('inside');
          }
      } else {
          // No nesting for non-containers
          if (y < height * 0.5) {
              setDragState('top');
          } else {
              setDragState('bottom');
          }
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState(null);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState(null);
      
      const movedId = e.dataTransfer.getData('application/vectra-move-id');
      if (!movedId || movedId === data.id) return;

      if (dragState === 'inside') {
          onDrop(data.id, '', movedId, -1); // Append
      } else if (dragState === 'top') {
          if (parentId) onDrop(parentId, '', movedId, index);
      } else if (dragState === 'bottom') {
          if (parentId) onDrop(parentId, '', movedId, index + 1);
      }
  };

  const getIconForType = (type: string) => {
    switch(type) {
        case 'container': return 'square';
        case 'text': return 'font';
        case 'button': return 'mouse-pointer';
        case 'image': return 'image';
        case 'video': return 'video';
        case 'input': return 'keyboard';
        case 'navbar': return 'compass';
        case 'hero': return 'star';
        case 'card': return 'id-card';
        default: return 'circle';
    }
  };

  return (
    <div className="select-none">
      <div 
        draggable={data.id !== 'root'}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center py-1.5 px-2 cursor-pointer text-xs transition-colors border-l-2 group
            ${isSelected ? 'bg-vectra-accent/20 border-vectra-accent text-white' : 'border-transparent text-vectra-muted hover:bg-vectra-border hover:text-white'}
            ${dragState === 'inside' ? 'bg-vectra-accent/20 ring-1 ring-inset ring-vectra-accent' : ''}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
      >
        {/* Insertion Indicators */}
        {dragState === 'top' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-vectra-accent z-50 pointer-events-none shadow-[0_0_4px_#3b82f6]">
                <div className="absolute left-0 -top-0.5 w-1.5 h-1.5 bg-vectra-accent rounded-full"></div>
            </div>
        )}
        {dragState === 'bottom' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-vectra-accent z-50 pointer-events-none shadow-[0_0_4px_#3b82f6]">
                <div className="absolute left-0 -top-0.5 w-1.5 h-1.5 bg-vectra-accent rounded-full"></div>
            </div>
        )}

        <div 
          className={`w-4 h-4 flex items-center justify-center mr-1 cursor-pointer hover:text-white ${hasChildren ? 'visible' : 'invisible'}`}
          onClick={toggleExpand}
        >
           <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <Icon name="caret-right" />
           </span>
        </div>
        <span className={`mr-2 opacity-70 w-4 text-center ${dragState === 'inside' ? 'text-vectra-accent' : ''}`}>
            <Icon name={getIconForType(data.type)} />
        </span>
        
        {isEditing ? (
          <form onSubmit={handleNameSubmit} className="flex-1">
             <input 
               autoFocus
               type="text" 
               value={editName} 
               onChange={(e) => setEditName(e.target.value)}
               onBlur={handleNameSubmit}
               className="w-full bg-vectra-bg border border-vectra-accent text-white px-1 py-0.5 outline-none rounded"
             />
          </form>
        ) : (
          <span className="truncate font-medium">{data.name}</span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {data.children.map((child, idx) => (
            <LayersPanel 
              key={child.id} 
              data={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              onUpdateName={onUpdateName}
              onDrop={onDrop}
              depth={depth + 1} 
              parentId={data.id}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};
