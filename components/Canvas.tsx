import React, { useRef, useState, useEffect } from 'react';
import { Renderer } from './Renderer';
import { Breadcrumbs } from './Breadcrumbs';
import { ComponentData, CMSCollection } from '../types';
import { Icon } from './Icon';

interface CanvasProps {
  tree: ComponentData;
  selectedId: string | null;
  viewport: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  previewMode: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDrop: (targetId: string, type: string, movedId?: string, index?: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onClearSelection: () => void;
  cmsCollections: CMSCollection[];
  setZoom: (fn: (z: number) => number) => void;
}

// --- Device Frames ---

const DesktopFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
  <div 
    className="bg-white rounded shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ring-1 ring-gray-900/10 transition-shadow" 
    style={{ width: width, height: height, minHeight: '80vh' }}
  >
    <div className="h-8 bg-[#eef0f2] border-b border-[#d1d5db] flex items-center px-4 gap-2 select-none">
      <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]"></div>
      </div>
      <div className="flex-1 flex justify-center px-4">
        <div className="bg-white border border-[#d1d5db] rounded-[4px] px-3 py-0.5 text-[10px] text-gray-500 w-full max-w-[360px] text-center font-mono flex items-center justify-center gap-1 shadow-sm opacity-80">
          <Icon name="lock" /> vectra.app/preview
        </div>
      </div>
    </div>
    <div className="flex-1 relative bg-white overflow-hidden">{children}</div>
  </div>
);

const MobileFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-[0_0_0_12px_#1f2937,0_0_0_14px_#3f4855,0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-[3rem] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-4 bg-[#0a0a0a] rounded-full flex items-center justify-end pr-2 gap-1 border border-[#222]">
             <div className="w-1 h-1 rounded-full bg-[#444]"></div>
             <div className="w-2 h-2 rounded-full bg-[#111] border border-[#333]"></div>
          </div>
      </div>
      {/* Side Buttons */}
      <div className="absolute -left-[15px] top-24 w-[3px] h-8 bg-[#2a3544] rounded-l-md border-r border-[#111]"></div>
      <div className="absolute -left-[15px] top-36 w-[3px] h-12 bg-[#2a3544] rounded-l-md border-r border-[#111]"></div>
      <div className="absolute -left-[15px] top-52 w-[3px] h-12 bg-[#2a3544] rounded-l-md border-r border-[#111]"></div>
      <div className="absolute -right-[15px] top-36 w-[3px] h-16 bg-[#2a3544] rounded-r-md border-l border-[#111]"></div>

      <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full z-50 pointer-events-none opacity-80 mix-blend-difference shadow-sm"></div>
    </div>
);

const TabletFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-[0_0_0_12px_#1f2937,0_0_0_13px_#3f4855,0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-[1.5rem] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      {/* Camera */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 mt-1.5 rounded-full bg-[#333] z-50 pointer-events-none ring-1 ring-[#555]"></div>
      
      <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
);

export const Canvas: React.FC<CanvasProps> = ({
  tree,
  selectedId,
  viewport,
  zoom,
  previewMode,
  onSelect,
  onDrop,
  onContextMenu,
  onTextChange,
  onClearSelection,
  cmsCollections,
  setZoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
  // Refs for panning logic to avoid re-renders
  const panStartRef = useRef<{x: number, y: number, scrollLeft: number, scrollTop: number} | null>(null);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Wheel Zoom Listener (Ctrl + Scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(z => Math.max(0.2, Math.min(3, z + delta)));
      }
    };

    // We use a non-passive listener to prevent default browser zoom
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space+Left Click starts panning
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      if (containerRef.current) {
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop
        };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStartRef.current && containerRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const getViewportDimensions = () => {
    if (viewport === 'mobile') return { width: '375px', height: '812px', label: 'iPhone 14' };
    if (viewport === 'tablet') return { width: '768px', height: '1024px', label: 'iPad Mini' };
    return { width: '100%', height: '100%', label: 'Desktop' };
  };

  const dims = getViewportDimensions();

  // Dynamic Styles
  const cursorClass = isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : '';

  return (
    <div className="flex-1 relative flex flex-col bg-[#1e1e1e] overflow-hidden">
      
      {/* Info Bar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-[#16191d]/90 backdrop-blur-md border border-[#2a2e35] rounded-full px-4 py-1.5 flex items-center gap-3 text-xs text-[#94a3b8] shadow-xl pointer-events-none select-none transition-opacity duration-300 hover:opacity-100 opacity-80">
          <span className="font-bold text-white">{dims.label}</span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span>{viewport === 'desktop' ? 'Fluid' : `${dims.width} x ${dims.height}`}</span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span className="text-vectra-accent font-mono">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Main Canvas Scroll Area */}
      <div 
        ref={containerRef}
        className={`flex-1 relative overflow-auto canvas-grid ${cursorClass} custom-scrollbar`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
             // Only clear selection if we didn't just pan
             if (!isPanning && !previewMode) onClearSelection();
        }}
        style={{
           // When panning, we disable smooth scrolling for instant feedback
           scrollBehavior: isPanning ? 'auto' : 'smooth'
        }}
      >
        <div 
            className="min-w-full min-h-full p-[100px] flex flex-col items-center justify-start origin-top-left"
            style={{
                 // We don't use transform: scale on the wrapper because it messes up scrollbars.
                 // Instead we scale the inner content wrapper.
            }}
        >
             {/* Scaled Content Wrapper */}
             <div 
                className="relative transition-transform duration-200 ease-out origin-top"
                style={{
                    transform: `scale(${zoom})`,
                    // Fix blurriness on some screens
                    backfaceVisibility: 'hidden',
                    // Adjust width constraints based on viewport
                    width: viewport === 'desktop' ? '100%' : 'auto',
                    maxWidth: viewport === 'desktop' ? '1200px' : 'none',
                }}
             >
                {viewport === 'mobile' ? (
                    <MobileFrame width={dims.width} height={dims.height}>
                        <Renderer
                            data={tree}
                            selectedId={selectedId}
                            onSelect={(id, e) => { if (!previewMode) onSelect(id, e); }}
                            onDrop={onDrop}
                            onContextMenu={onContextMenu}
                            onTextChange={onTextChange}
                            viewport={viewport}
                            previewMode={previewMode}
                            cmsCollections={cmsCollections}
                        />
                    </MobileFrame>
                ) : viewport === 'tablet' ? (
                    <TabletFrame width={dims.width} height={dims.height}>
                        <Renderer
                            data={tree}
                            selectedId={selectedId}
                            onSelect={(id, e) => { if (!previewMode) onSelect(id, e); }}
                            onDrop={onDrop}
                            onContextMenu={onContextMenu}
                            onTextChange={onTextChange}
                            viewport={viewport}
                            previewMode={previewMode}
                            cmsCollections={cmsCollections}
                        />
                    </TabletFrame>
                ) : (
                    <DesktopFrame width="100%" height="100%">
                        <div className="w-full h-full overflow-y-auto custom-scrollbar">
                            <Renderer
                                data={tree}
                                selectedId={selectedId}
                                onSelect={(id, e) => { if (!previewMode) onSelect(id, e); }}
                                onDrop={onDrop}
                                onContextMenu={onContextMenu}
                                onTextChange={onTextChange}
                                viewport={viewport}
                                previewMode={previewMode}
                                cmsCollections={cmsCollections}
                            />
                        </div>
                    </DesktopFrame>
                )}
             </div>

             {/* Bottom Spacer */}
             <div className="w-full h-[50vh] flex-shrink-0" />
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-40">
        <button 
            onClick={() => setZoom(z => 1)} 
            className="w-10 h-10 bg-vectra-panel hover:bg-[#252a30] text-white rounded-full shadow-lg border border-vectra-border flex items-center justify-center transition-all group"
            title="Reset Zoom to 100%"
        >
            <span className="text-[10px] font-bold group-hover:text-vectra-accent">1:1</span>
        </button>
         <button 
            onClick={() => setZoom(z => 0.5)} 
            className="w-10 h-10 bg-vectra-panel hover:bg-[#252a30] text-white rounded-full shadow-lg border border-vectra-border flex items-center justify-center transition-all group"
            title="Fit to Screen (50%)"
        >
             <Icon name="compress" />
        </button>
      </div>

      {/* Breadcrumbs */}
      {!previewMode && (
        <div className="w-full absolute bottom-0 left-0 right-0 z-30">
          <Breadcrumbs tree={tree} selectedId={selectedId} onSelect={(id) => onSelect(id, {} as React.MouseEvent)} />
        </div>
      )}
    </div>
  );
};