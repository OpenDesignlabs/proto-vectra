import React, { useState, useRef, useEffect } from 'react';
import { ComponentData, CMSCollection, CMSItem, DataBinding, Breakpoint } from '../types';
import { getTailwindClasses } from '../utils';
import { Icon } from './Icon';

// --- Helper Components for Empty States ---

const ShortcutKey = ({ label, keys }: { label: string, keys: string[] }) => (
  <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
          {keys.map((k) => (
              <kbd key={k} className="bg-[#2a2e35] border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300 font-sans min-w-[20px] text-center shadow-sm">
                  {k}
              </kbd>
          ))}
      </div>
  </div>
);

const QuickActionCard = ({ icon, label, desc, accent, onClick }: { icon: string, label: string, desc: string, accent: 'purple' | 'yellow' | 'emerald' | 'blue', onClick: () => void }) => {
    const colors = {
        purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hover: 'group-hover:border-purple-500/50', iconBg: 'bg-purple-500/20' },
        yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', hover: 'group-hover:border-yellow-500/50', iconBg: 'bg-yellow-500/20' },
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'group-hover:border-emerald-500/50', iconBg: 'bg-emerald-500/20' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'group-hover:border-blue-500/50', iconBg: 'bg-blue-500/20' },
    };
    const c = colors[accent];

    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }} 
            className={`group relative p-5 h-full text-left rounded-xl border border-vectra-border bg-vectra-panel hover:bg-[#1a1d24] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${c.hover}`}
        >
            <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -mr-10 -mt-10 ${c.bg}`}></div>
            
            <div className="relative z-10 flex flex-col h-full gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${c.bg} border ${c.border} ${c.text} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={icon} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-200 group-hover:text-white mb-1 transition-colors">{label}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400">{desc}</p>
                </div>
                
                <div className="mt-auto pt-2 flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                    Add Section <span className="ml-2"><Icon name="arrow-right" /></span>
                </div>
            </div>
        </button>
    )
};

// --- Main Renderer Component ---

interface RendererProps {
  data: ComponentData;
  selectedId: string | null;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDrop: (targetId: string, type: string, movedId?: string, index?: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  viewport: string;
  previewMode: boolean;
  index?: number; 
  parentData?: ComponentData;
  cmsCollections: CMSCollection[];
  dataContext?: CMSItem; 
  breakpoints?: Breakpoint[];
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
  dataContext,
  breakpoints
}) => {
  const isSelected = data.id === selectedId;
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);
  const elementRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeCustomState, setActiveCustomState] = useState<string | null>(null);

  // Handle Scroll/View Trigger Interactions & Animations
  useEffect(() => {
      if ((data.styleConfig.scrollTrigger || data.interactions?.trigger === 'view') && previewMode) {
          const threshold = data.interactions?.threshold || 0.1;
          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      setIsVisible(true);
                      if (data.interactions?.trigger === 'view' && data.interactions.type !== 'none') {
                          executeInteraction(data.interactions);
                      }
                      observer.disconnect(); 
                  }
              });
          }, { threshold });

          if (elementRef.current) {
              observer.observe(elementRef.current);
          }
          return () => observer.disconnect();
      } else {
          setIsVisible(true); 
      }
  }, [data.styleConfig.scrollTrigger, data.interactions, previewMode]);

  const executeInteraction = (interaction: any) => {
      if (!interaction) return;
      
      switch (interaction.type) {
          case 'alert':
              alert(interaction.value);
              break;
          case 'link':
              window.open(interaction.value, '_blank');
              break;
          case 'scroll':
              const target = document.getElementById(interaction.value.replace('#', ''));
              if (target) target.scrollIntoView({ behavior: 'smooth' });
              break;
          case 'log':
              console.log(`[Interaction Log]: ${interaction.value}`);
              break;
          case 'setState':
              if (activeCustomState === interaction.value) {
                  setActiveCustomState(null);
              } else {
                  setActiveCustomState(interaction.value);
              }
              break;
          case 'api':
              console.log(`[API Mock] Fetching ${interaction.apiMethod} ${interaction.apiUrl}...`);
              // Mock fetch
              break;
      }
  };

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
    const height = rect.height;
    const offsetY = clientY - rect.top;

    // Advanced Edge Detection for Nested Containers
    // 20% threshold at top/bottom for reordering, middle 60% for nesting
    const EDGE_THRESHOLD_PX = 15;
    const EDGE_THRESHOLD_PCT = 0.25; 
    
    // Check if mouse is near top or bottom edge
    const isNearTop = offsetY < Math.max(EDGE_THRESHOLD_PX, height * EDGE_THRESHOLD_PCT);
    const isNearBottom = offsetY > height - Math.max(EDGE_THRESHOLD_PX, height * EDGE_THRESHOLD_PCT);

    if (data.type === 'container') {
        // If the container is empty, always prioritize dropping inside
        if (data.children.length === 0) {
             setDragOverPosition('inside');
        } 
        // If container has content...
        else {
             if (isNearTop) {
                 setDragOverPosition('top');
             } else if (isNearBottom) {
                 setDragOverPosition('bottom');
             } else {
                 setDragOverPosition('inside');
             }
        }
    } else {
        // Non-container elements (Text, Buttons, etc) - Simple Top/Bottom split
        const middleY = height / 2;
        if (offsetY < middleY) {
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

    // Logic: If 'top', drop into parent at current index
    // If 'bottom', drop into parent at index + 1
    // If 'inside', drop into self (container)

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
        // Inside
        targetId = data.id;
        insertionIndex = -1; // Append
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
      if (data.interactions && data.interactions.trigger === 'click') {
          executeInteraction(data.interactions);
      }
      return;
    }
    onSelect(data.id, e);
  };

  const handleMouseEnter = () => {
      if (previewMode && data.interactions?.trigger === 'mouseEnter') {
          executeInteraction(data.interactions);
      }
  }

  const handleMouseLeave = () => {
      if (previewMode && data.interactions?.trigger === 'mouseLeave') {
          executeInteraction(data.interactions);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
      if (previewMode && data.interactions?.trigger === 'submit') {
          e.preventDefault();
          executeInteraction(data.interactions);
      }
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

  // --- STYLE RESOLUTION ---
  
  let effectiveStyle = { ...data.styleConfig };
  
  // 1. Apply Responsive Styles
  if (viewport !== 'desktop') {
      if (viewport === 'tablet' && data.tabletStyleConfig) {
          effectiveStyle = { ...effectiveStyle, ...data.tabletStyleConfig };
      } else if (viewport === 'mobile' && data.mobileStyleConfig) {
          effectiveStyle = { ...effectiveStyle, ...data.mobileStyleConfig };
      } 
      else if (data.breakpoints?.[viewport]) {
          effectiveStyle = { ...effectiveStyle, ...data.breakpoints[viewport] };
      }
  }

  // 2. Apply Custom State Styles
  if (activeCustomState && data.customStates?.[activeCustomState]) {
      effectiveStyle = { ...effectiveStyle, ...data.customStates[activeCustomState] };
  }

  let tailwindClasses = getTailwindClasses(effectiveStyle);
  
  if (effectiveStyle.scrollTrigger && isVisible && effectiveStyle.animation && effectiveStyle.animation !== 'none') {
      tailwindClasses += ` animate-${effectiveStyle.animation}`;
  } else if (effectiveStyle.scrollTrigger && !isVisible) {
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
    animationDelay: effectiveStyle.animationDelay ? `${effectiveStyle.animationDelay}ms` : undefined,
    animationTimingFunction: effectiveStyle.animationTimingFunction,
    ...data.props.style
  };

  // Interactive Styles
  const isDragOverInside = dragOverPosition === 'inside' && !previewMode;
  
  const hoverClass = !previewMode && !isSelected ? 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-transparent' : '';
  const selectionClass = isSelected && !previewMode ? 'ring-2 ring-vectra-accent ring-offset-2 ring-offset-black z-10' : '';
  const bindingClass = (data.repeatConfig || data.bindings) && !previewMode ? 'ring-1 ring-purple-500 ring-offset-1' : '';
  const dragInsideClass = isDragOverInside ? 'ring-2 ring-dashed ring-vectra-accent bg-vectra-accent/5 z-20 shadow-inner' : '';

  const commonProps = {
    ref: elementRef,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onDoubleClick: handleDoubleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onSubmit: handleSubmit,
    className: `${tailwindClasses} ${resolvedProps.className || ''} ${selectionClass} ${hoverClass} ${bindingClass} ${dragInsideClass} relative transition-all duration-200`,
    style,
    id: data.props.id,
    draggable: !previewMode && data.id !== 'root',
    onDragStart: handleDragStart,
    onDragOver: !previewMode ? handleDragOver : undefined,
    onDragLeave: !previewMode ? handleDragLeave : undefined,
    onDrop: !previewMode ? handleDrop : undefined,
  };

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
                            breakpoints={breakpoints}
                        />
                    ))}
                </React.Fragment>
            ));
        } else if (!previewMode) {
             return <div className="p-2 text-xs text-purple-400 border border-purple-500/30 bg-purple-900/10 rounded">Empty List (Source: {collection?.name})</div>
        }
    }

    if (data.children.length === 0 && !previewMode && data.type === 'container') {
      const isRoot = data.id === 'root';
      const isDragOver = dragOverPosition === 'inside';

      // 1. ADVANCED ROOT EMPTY STATE
      if (isRoot) {
          return (
            <div className={`w-full h-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${isDragOver ? 'bg-vectra-accent/10' : ''}`}>
                
                {/* Background: Cyber Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20" 
                     style={{ 
                         backgroundImage: `
                             linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                         `,
                         backgroundSize: '40px 40px',
                         maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
                     }} 
                />

                {/* --- NORMAL STATE: Dashboard --- */}
                <div className={`relative z-10 max-w-5xl w-full px-8 flex flex-col items-center text-center transition-all duration-300 ${isDragOver ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'}`}>
                     {/* Background: Glow Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>

                    <div className="mb-8 relative group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                        <div className="relative w-24 h-24 bg-[#0f1115] rounded-2xl border border-gray-800 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 group-hover:border-gray-600">
                             <span className="text-5xl bg-clip-text text-transparent bg-gradient-to-tr from-blue-400 to-purple-400">
                                <Icon name="layer-group" />
                             </span>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-sm">
                        Design Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Vision</span>
                    </h1>
                    
                    <p className="text-gray-400 text-lg mb-12 max-w-2xl leading-relaxed">
                        Your canvas is empty. Drag elements from the sidebar or jumpstart your project with a pro layout below.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <QuickActionCard icon="compass" label="Navigation" desc="Responsive top bar with logo & links" accent="purple" onClick={() => onDrop(data.id, 'navbar')} />
                        <QuickActionCard icon="star" label="Hero Header" desc="High-impact intro with title & CTA" accent="yellow" onClick={() => onDrop(data.id, 'hero')} />
                        <QuickActionCard icon="columns" label="Feature Section" desc="Grid layout with cards & images" accent="emerald" onClick={() => onDrop(data.id, 'card')} />
                        <QuickActionCard icon="cube" label="Empty Block" desc="Start fresh with a blank container" accent="blue" onClick={() => onDrop(data.id, 'container')} />
                    </div>

                    <div className="mt-16 py-4 px-6 bg-gray-900/50 rounded-full border border-gray-800/50 flex items-center gap-8 backdrop-blur-sm">
                         <ShortcutKey label="Undo" keys={['Ctrl', 'Z']} />
                         <ShortcutKey label="Redo" keys={['Ctrl', 'Y']} />
                         <ShortcutKey label="Save" keys={['Ctrl', 'S']} />
                         <ShortcutKey label="Preview" keys={['P']} />
                    </div>
                </div>

                {/* --- DRAGGING STATE: Huge Drop Zone --- */}
                <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-300 ${isDragOver ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                     <div className="w-[80%] h-[80%] border-4 border-dashed border-vectra-accent/50 rounded-3xl flex flex-col items-center justify-center bg-vectra-bg/90 backdrop-blur-sm shadow-2xl animate-pulse-slow">
                        <div className="w-32 h-32 rounded-full bg-vectra-accent/10 flex items-center justify-center mb-6 animate-bounce">
                           <span className="text-6xl text-vectra-accent"><Icon name="arrow-down" /></span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2">Drop Component Here</h2>
                        <p className="text-xl text-gray-400">Release to create your first element</p>
                     </div>
                </div>
            </div>
          );
      }

      // 2. ADVANCED NESTED EMPTY STATE
      return (
        <div className={`
          w-full min-h-[120px] h-full flex flex-col items-center justify-center p-6
          border-2 border-dashed rounded-xl transition-all duration-300 group relative overflow-hidden
          ${isDragOver 
             ? 'border-vectra-accent bg-vectra-accent/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' 
             : isSelected 
                ? 'border-vectra-accent/50 bg-vectra-accent/5' 
                : 'border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/60'}
        `}>
             {/* Animated Stripes Background */}
             <div className={`absolute inset-0 opacity-[0.03] transition-opacity duration-300 pointer-events-none
                ${isDragOver ? 'opacity-15 animate-slide-up' : ''}`}
                style={{ 
                    backgroundImage: 'repeating-linear-gradient(45deg, #3b82f6 0, #3b82f6 10px, transparent 10px, transparent 20px)' 
                }}
             />

             {/* Dynamic Icon */}
             <div className={`
                relative w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 z-10
                ${isDragOver 
                    ? 'bg-vectra-accent text-white scale-110 shadow-lg shadow-blue-500/50 rotate-90' 
                    : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300 border border-gray-700 group-hover:scale-105'}
             `}>
                <Icon name={isDragOver ? "arrow-down" : "plus"} />
                {isDragOver && <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>}
             </div>

             <div className="text-center z-10 space-y-1">
                 <p className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 
                    ${isDragOver ? 'text-vectra-accent translate-y-0' : 'text-gray-500 group-hover:text-gray-300 translate-y-1 group-hover:translate-y-0'}`}>
                    {isDragOver ? 'Release to Drop' : 'Empty Slot'}
                 </p>
             </div>
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
        breakpoints={breakpoints}
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
          {activeCustomState && <div className="bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded-t font-bold uppercase shadow-sm">{activeCustomState}</div>}
      </div>
    ) : null
  );

  const InsertionIndicator = () => {
      if (!dragOverPosition || previewMode || dragOverPosition === 'inside') return null;
      
      const isTop = dragOverPosition === 'top';
      return (
        <div className={`absolute left-0 right-0 z-50 pointer-events-none flex items-center justify-center ${isTop ? '-top-1.5' : '-bottom-1.5'}`}>
             {/* The Bar */}
             <div className="w-full h-1 bg-vectra-accent shadow-[0_0_8px_#3b82f6] relative rounded-full">
                 {/* End caps */}
                 <div className={`absolute left-0 -top-1 w-3 h-3 bg-vectra-accent rounded-full border-2 border-white shadow-sm`}></div>
                 <div className={`absolute right-0 -top-1 w-3 h-3 bg-vectra-accent rounded-full border-2 border-white shadow-sm`}></div>
                 
                 {/* Center Label */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-vectra-accent text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm uppercase tracking-wider whitespace-nowrap">
                     Insert Here
                 </div>
             </div>
        </div>
      );
  };

  const InsideIndicator = () => {
      if (dragOverPosition !== 'inside' || previewMode) return null;
      // Only show text label for non-empty containers, empty ones handled by the empty state view
      if (data.children.length === 0) return null;

      return (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              <div className="bg-vectra-accent/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg uppercase tracking-wider flex items-center gap-2 animate-bounce">
                  <Icon name="level-down-alt" /> Drop Inside
              </div>
          </div>
      )
  }

  // Determine Tag
  const Tag = (data.tagName || (data.type === 'button' ? 'button' : data.type === 'image' ? 'img' : data.type === 'input' ? 'input' : data.type === 'video' ? 'video' : data.type === 'text' ? 'p' : 'div')) as React.ElementType;

  // Render Logic
  if (data.type === 'container' || (data.tagName && !['img','input','video','br'].includes(data.tagName))) {
      return (
        <Tag {...commonProps}>
          <SelectionLabel />
          <InsertionIndicator />
          <InsideIndicator />
          {renderChildren()}
        </Tag>
      );
  } else if (data.type === 'button' || data.tagName === 'button') {
      return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            {/* @ts-ignore */}
            <Tag {...commonProps}>{resolvedProps.text || 'Button'}</Tag>
        </div>
      );
  } else if (data.type === 'text' || data.tagName === 'p' || data.tagName === 'h1') {
       return (
        <div className="relative inline-block w-full">
             <SelectionLabel />
             <InsertionIndicator />
             {/* @ts-ignore */}
            <Tag {...commonProps}>{resolvedProps.text || 'Text'}</Tag>
        </div>
      );
  } else if (data.type === 'image' || data.tagName === 'img') {
       return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            {/* @ts-ignore */}
            <Tag src={resolvedProps.src} alt="Visual" {...commonProps} />
        </div>
      );
  } else if (data.type === 'input' || data.tagName === 'input') {
      return (
         <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            {/* @ts-ignore */}
            <Tag 
              type={data.props.type || 'text'} 
              placeholder={resolvedProps.placeholder} 
              disabled={!previewMode} 
              {...commonProps} 
              className={`${commonProps.className} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
         </div>
      );
  } else if (data.type === 'video' || data.tagName === 'video') {
       return (
        <div className="relative inline-block w-full">
            <SelectionLabel />
            <InsertionIndicator />
            {/* @ts-ignore */}
            <Tag 
              src={resolvedProps.src} 
              controls={!previewMode || data.props.controls} 
              autoPlay={data.props.autoPlay} 
              loop={data.props.loop}
              muted={data.props.muted}
              {...commonProps} 
            />
        </div>
      );
  }

  return null;
};