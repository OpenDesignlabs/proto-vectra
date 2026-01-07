import React from 'react';
import { ComponentData } from '../types';
import { findNode } from '../utils';
import { Icon } from './Icon';

interface BreadcrumbsProps {
  tree: ComponentData;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ tree, selectedId, onSelect }) => {
  if (!selectedId) return null;

  const path: ComponentData[] = [];
  let currentId: string | null = selectedId;

  while (currentId) {
    const node = findNode(tree, currentId);
    if (node) {
      path.unshift(node);
      currentId = node.parentId;
    } else {
      break;
    }
  }

  return (
    <div className="h-8 bg-vectra-panel border-t border-vectra-border flex items-center px-4 text-xs text-vectra-muted">
      {path.map((node, index) => (
        <React.Fragment key={node.id}>
          {index > 0 && <span className="mx-2 text-gray-600"><Icon name="chevron-right" /></span>}
          <button 
            onClick={() => onSelect(node.id)}
            className={`hover:text-white flex items-center gap-1 ${node.id === selectedId ? 'text-vectra-accent font-bold' : ''}`}
          >
            <span className="opacity-70 text-[10px] uppercase">{node.type}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};