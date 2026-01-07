import React from 'react';
import { Icon } from './Icon';

export const DraggableItem = ({ type, icon, label }: { type: string; icon: string; label: string }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/vectra-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-3 mb-2 rounded cursor-grab bg-vectra-panel border border-vectra-border hover:border-vectra-accent transition-colors group"
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-800 text-vectra-muted group-hover:text-white">
        <Icon name={icon} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};