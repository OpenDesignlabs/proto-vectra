import React from 'react';
import { Icon } from './Icon';

export const DraggableItem = ({ type, icon, label }: { type: string; icon: string; label: string }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/vectra-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback class to the dragged element
    const el = e.currentTarget as HTMLElement;
    el.classList.add('opacity-50', 'scale-95', 'ring-2', 'ring-vectra-accent');
  };

  const handleDragEnd = (e: React.DragEvent) => {
     // Remove visual feedback
     const el = e.currentTarget as HTMLElement;
     el.classList.remove('opacity-50', 'scale-95', 'ring-2', 'ring-vectra-accent');
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="flex items-center gap-3 p-3 mb-2 rounded cursor-grab bg-vectra-panel border border-vectra-border hover:border-vectra-accent hover:bg-vectra-bg transition-all duration-200 group active:cursor-grabbing"
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-800 text-vectra-muted group-hover:text-white group-hover:bg-vectra-accent/20 transition-colors">
        <Icon name={icon} />
      </div>
      <span className="text-sm font-medium group-hover:text-white transition-colors">{label}</span>
    </div>
  );
};