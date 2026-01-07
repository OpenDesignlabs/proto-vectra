import React, { useState } from 'react';
import { ComponentData } from '../types';
import { Icon } from './Icon';

interface LayersPanelProps {
  data: ComponentData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  depth?: number;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ data, selectedId, onSelect, onUpdateName, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.name);

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
      setEditName(data.name); // Revert if empty
    }
    setIsEditing(false);
  };

  const getIconForType = (type: string) => {
    switch(type) {
        case 'container': return 'square';
        case 'text': return 'font';
        case 'button': return 'mouse-pointer';
        case 'image': return 'image';
        case 'video': return 'video';
        case 'input': return 'keyboard';
        default: return 'circle';
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer text-xs transition-colors border-l-2 ${isSelected ? 'bg-vectra-accent/20 border-vectra-accent text-white' : 'border-transparent text-vectra-muted hover:bg-vectra-border hover:text-white'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
      >
        <div 
          className={`w-4 h-4 flex items-center justify-center mr-1 cursor-pointer hover:text-white ${hasChildren ? 'visible' : 'invisible'}`}
          onClick={toggleExpand}
        >
           <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <Icon name="caret-right" />
           </span>
        </div>
        <span className="mr-2 opacity-70 w-4 text-center">
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
          {data.children.map(child => (
            <LayersPanel 
              key={child.id} 
              data={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              onUpdateName={onUpdateName}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
