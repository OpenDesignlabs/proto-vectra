import React, { useState, useRef, useEffect } from 'react';
import { ComponentData, ComponentType, CMSCollection, CMSItem, DataBinding } from '../types';
import { getTailwindClasses } from '../utils';

interface RendererProps {
  data: ComponentData;
  selectedId: string | null;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDrop: (targetId: string, type: string, movedId?: string, index?: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  viewport: 'desktop' | 'tablet' | 'mobile';
  previewMode: boolean;
  index?: number; 
  parentData?: ComponentData;
  // New props for Data Integration
  cmsCollections: CMSCollection[];
  dataContext?: CMSItem; // The current item if we are inside a repeated list
}

export const Renderer: React.FC<RendererProps> = ({ 
  data, 
  selectedId, 
  onSelect, 
  onDrop, 
  onContextMenu,
  onTextChange,
  viewport,
  previewMode,
  index = 0,
  parentData,
  cmsCollections,
  dataContext
}) => {
  const isSelected = data.id === selectedId;
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);
  const elementRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // SCROLL TRIGGER LOGIC
  useEffect(() => {
      if (data.styleConfig.scrollTrigger && previewMode) {
          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      setIsVisible(true);
                      observer.disconnect(); // Animate once
                  }
              });
          }, { threshold: 0.1 });

          if (elementRef.current) {
              observer.observe(elementRef.current);
          }
          return () => observer.disconnect();
      } else {
          setIsVisible(true); // Always visible if not triggering or not previewing
      }
  }, [data.styleConfig.scrollTrigger, previewMode]);

  // --- DATA BINDING RESOLUTION ---
  const resolveProps = () => {
    const finalProps = { ...data.props };
    
    if (data.bindings && dataContext) {
      (Object.entries(data.bindings) as [string, DataBinding][]).forEach(([propKey, binding]) => {
         if (binding.fieldId && dataContext[binding.fieldId] !== undefined) {
             finalProps[propKey] = dataContext[binding.fieldId];
         }
      });
    }
    return finalProps;
  };

  const resolvedProps = resolveProps();

  // Handle Dragging THIS component
  const handleDragStart = (e: React.DragEvent) => {
    if (previewMode || data.id === 'root') {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('application/vectra-move-id', data.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (previewMode) return;
    if (data.id === 'root') {
        setDragOverPosition('inside');
        return;
    }

    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const clientY = e.clientY;
    const isContainer = data.type === 'container';
    
    if (isContainer) {
        setDragOverPosition('inside');
    } else {
        const middleY = rect.top + rect.height / 2;
        if (clientY < middleY) {
            setDragOverPosition('top');
        } else {
            setDragOverPosition('bottom');
        }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPosition(null);

    const movedId = e.dataTransfer.getData('application/vectra-move-id');
    const type = e.dataTransfer.getData('application/vectra-type');

    if (!movedId && !type) return;

    let targetId = data.id;
    let insertionIndex = -1;

    if (dragOverPosition === 'top') {
        if (parentData) {
            targetId = parentData.id;
            insertionIndex = index;
        }
    } else if (dragOverPosition === 'bottom') {
        if (parentData) {
            targetId = parentData.id;
            insertionIndex = index + 1;
        }
    } else {
        targetId = data.id;
        insertionIndex = -1;
    }

    if (movedId) {
      if (movedId !== targetId) { 
         onDrop(targetId, '', movedId, insertionIndex);
      }
    } else if (type) {
      onDrop(targetId, type, undefined, insertionIndex);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewMode) {
      if (data.interactions?.type === 'alert') {
        alert(data.interactions.value);
      } else if (data.interactions?.type === 'link') {
        window.open(data.interactions.value, '_blank');
      }
      return;
    }
    onSelect(data.id, e);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewMode) {
      onContextMenu(e, data.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (previewMode) return;
    if ((data.type === 'text' || data.type === 'button') && !data.bindings?.text) {
        e.stopPropagation();
        const newText = prompt("Edit Text:", data.props.text);
        if (newText !== null) {
            onTextChange(data.id, newText);
        }
    }
  };

  // RESPONSIVE STYLE MERGING
  let effectiveStyle = { ...data.styleConfig };
  
  if (viewport === 'tablet' && data.tabletStyleConfig) {
    effectiveStyle = { ...effectiveStyle, ...data.tabletStyleConfig };
  } else if (viewport === 'mobile') {
    if (data.mobileStyleConfig) {
      effectiveStyle = { ...effectiveStyle, ...data.mobileStyleConfig };
    }
  }

  // Generate CSS classes
  let tailwindClasses = getTailwindClasses(effectiveStyle);
  
  // Apply Animation Class explicitly if Scroll Trigger is active and visible
  if (effectiveStyle.scrollTrigger && isVisible && effectiveStyle.animation && effectiveStyle.animation !== 'none') {
      tailwindClasses += ` animate-${effectiveStyle.animation}`;
  } else if (effectiveStyle.scrollTrigger && !isVisible) {
      // Start hidden if scroll triggered
      tailwindClasses += ' opacity-0'; 
  }

  if (data.hoverStyleConfig) {
    tailwindClasses += ' ' + getTailwindClasses(data.hoverStyleConfig, 'hover');
  }
  if (data.customClassName) {
    tailwindClasses += ' ' + data.customClassName;
  }

  const style: React.CSSProperties = {
    backgroundColor: effectiveStyle.backgroundColor,
    color: effectiveStyle.textColor,
    borderColor: effectiveStyle.borderColor,
    opacity: effectiveStyle.opacity !== undefined ? effectiveStyle.opacity / 100 : 1,
    cursor: previewMode && data.interactions?.type !== 'none' ? 'pointer' : 'default',
    
    // Inline Animation Props for arbitrary values
    animationDelay: effectiveStyle.animationDelay ? `${effectiveStyle.animationDelay}ms` : undefined,
    animationTimingFunction: effectiveStyle.animationTimingFunction,

    ...data.props.style
  };

  const hoverClass = !previewMode && !isSelected ? 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-transparent' : '';
  const selectionClass = isSelected && !previewMode ? 'ring-2 ring-vectra-accent ring-offset-2 ring-offset-black z-10' : '';
  const bindingClass = (data.repeatConfig || data.bindings) && !previewMode ? 'ring-1 ring-purple-500 ring-offset-1' : '';

  const commonProps = {
    ref: elementRef,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onDoubleClick: handleDoubleClick,
    className: `${tailwindClasses} ${resolvedProps.className || ''} ${selectionClass} ${hoverClass} ${bindingClass} relative transition-all duration-200`,
    style,
    draggable: !previewMode && data.id !== 'root',
    onDragStart: handleDragStart,
    onDragOver: !previewMode ? handleDragOver : undefined,
    onDragLeave: !previewMode ? handleDragLeave : undefined,
    onDrop: !previewMode ? handleDrop : undefined,
  };

  // --- RECURSIVE RENDER LOGIC ---
  const renderChildren = () => {
    if (data.repeatConfig) {
        const collection = cmsCollections.find(c => c.id === data.repeatConfig?.collectionId);
        
        if (collection && collection.items.length > 0) {
            return collection.items.map((item, itemIdx) => (
                <React.Fragment key={item.id}>
                    {data.children.map((child, childIdx) => (
                        <Renderer 
                            key={`${child.id}-${item.id}`} 
                            data={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onDrop={onDrop}
                            onContextMenu={onContextMenu}
                            onTextChange={onTextChange}
                            viewport={viewport}
                            previewMode={previewMode}
                            index={childIdx}
                            parentData={data}
                            cmsCollections={cmsCollections}
                            dataContext={item} 
                        />
                    ))}
                </React.Fragment>
            ));
        } else if (!previewMode) {
             return <div className="p-2 text-xs text-purple-400 border border-purple-500/30 bg-purple-900/10 rounded">Empty List (Source: {collection?.name})</div>
        }
    }

    if (data.children.length === 0 && !previewMode && data.type === 'container') {
      return (
        <div className="p-4 border-2 border-dashed border-gray-300/20 text-gray-500 text-xs rounded flex items-center justify-center w-full min-h-[50px] bg-gray-900/10 pointer-events-none">
          Drop items here
        </div>
      );
    }
    return data.children.map((child, idx) => (
      <Renderer 
        key={child.id} 
        data={child} 
        selectedId={selectedId} 
        onSelect={onSelect} 
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        onTextChange={onTextChange}
        viewport={viewport}
        previewMode={previewMode}
        index={idx}
        parentData={data}
        cmsCollections={cmsCollections}
        dataContext={dataContext}
      />
    ));
  };

  const SelectionLabel = () => (
    isSelected && !previewMode ? (
      <div className="absolute -top-6 left-0 flex gap-1 pointer-events-none z-20">
          <div className="bg-vectra-accent text-white text-[10px] px-2 py-0.5 rounded-t font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
            {data.name}
          </div>
          {data.repeatConfig && <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-t font-bold uppercase shadow-sm">List</div>}
          {data.bindings && Object.keys(data.bindings).length > 0 && <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-t font-bold uppercase shadow-sm">Bound</div>}
      </div>
    ) : null
  );

  const InsertionIndicator = () => {
      if (!dragOverPosition || previewMode) return null;
      if (dragOverPosition === 'inside') return <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-50 rounded" />;
      if (dragOverPosition === 'top') return <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 pointer-events-none z-50 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />;
      if (dragOverPosition === 'bottom') return <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 pointer-events-none z-50 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />;
      return null;
  };

  switch (data.type) {
    case 'container':
      return (
        <div {...commonProps}>
          <SelectionLabel />
          <InsertionIndicator />
          {renderChildren()}
        </div>
      );
    case 'button':
      return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            <button {...commonProps}>{resolvedProps.text || 'Button'}</button>
        </div>
      );
    case 'text':
      return (
        <div className="relative inline-block w-full">
             <SelectionLabel />
             <InsertionIndicator />
            <p {...commonProps}>{resolvedProps.text || 'Text'}</p>
        </div>
      );
    case 'input':
      return (
         <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            <input 
              type={data.props.type || 'text'} 
              placeholder={resolvedProps.placeholder} 
              disabled={!previewMode} 
              {...commonProps} 
              className={`${commonProps.className} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
         </div>
      );
    case 'image':
       return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            <img src={resolvedProps.src} alt="Visual" {...commonProps} />
        </div>
      );
    case 'video':
      return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            <video 
              src={resolvedProps.src} 
              controls={!previewMode || data.props.controls} 
              autoPlay={data.props.autoPlay} 
              loop={data.props.loop}
              muted={data.props.muted}
              {...commonProps} 
            />
        </div>
      );
    default:
      return null;
  }
};