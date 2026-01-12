
import React from 'react';
import { Renderer } from './Renderer';
import { Breadcrumbs } from './Breadcrumbs';
import { ComponentData, CMSCollection, Breakpoint } from '../types';
import { Icon } from './Icon';

interface CanvasProps {
  tree: ComponentData;
  selectedId: string | null;
  viewport: string;
  zoom: number;
  previewMode: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onDrop: (targetId: string, type: string, movedId?: string, index?: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onClearSelection: () => void;
  cmsCollections: CMSCollection[];
  setZoom: (zoom: number) => void;
  breakpoints: Breakpoint[];
}

// --- Frame Components ---

const DesktopFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
  <div 
    className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col ring-1 ring-gray-900/10" 
    style={{ width: width, height: height, minHeight: '80vh' }}
  >
    <div className="h-9 bg-[#f3f4f6] border-b border-gray-300 flex items-center px-4 gap-3 select-none">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]"></div>
      </div>
      <div className="flex-1 flex justify-center px-4">
        <div className="bg-white border border-gray-300 rounded-[4px] px-3 py-0.5 text-[10px] text-gray-500 w-full max-w-[300px] text-center font-mono flex items-center justify-center gap-1 shadow-sm">
          <Icon name="lock" /> vectra.app/preview
        </div>
      </div>
      <div className="w-10"></div> 
    </div>
    <div className="flex-1 relative bg-white overflow-hidden">{children}</div>
  </div>
);

const MobileFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25),0_30px_60px_-30px_rgba(0,0,0,0.3)] rounded-[3rem] border-[12px] border-[#1f2937] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-4 bg-[#111] rounded-full flex items-center justify-end pr-2 gap-1">
             <div className="w-1 h-1 rounded-full bg-[#333]"></div>
             <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333]"></div>
          </div>
      </div>
      {/* Side Buttons */}
      <div className="absolute -left-[14px] top-24 w-[3px] h-8 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-36 w-[3px] h-12 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-52 w-[3px] h-12 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -right-[14px] top-36 w-[3px] h-16 bg-[#2a3544] rounded-r-md"></div>

      <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </div>
      
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full z-50 pointer-events-none opacity-50 mix-blend-difference"></div>
    </div>
);

const TabletFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-2xl rounded-[1.5rem] border-[12px] border-[#1f2937] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 mt-1.5 rounded-full bg-[#333] z-50 pointer-events-none"></div>
      
      <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
);

const FoldableFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-xl rounded-[1rem] border-[8px] border-[#2d3748] bg-[#2d3748] overflow-hidden flex" style={{ width, height }}>
        {/* Hinge */}
        <div className="absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-gradient-to-r from-black/20 to-white/10 z-50 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
        
        <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden">
            {children}
        </div>
    </div>
);

const UltrawideFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="flex flex-col items-center">
        <div className="relative shadow-2xl rounded-md border-[10px] border-[#111] bg-[#111] overflow-hidden" style={{ width, height }}>
            <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden">
                {children}
            </div>
            {/* Monitor Chin */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#1a1a1a] flex items-center justify-center z-50 pointer-events-none">
                 <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Vectra</div>
            </div>
        </div>
        {/* Monitor Stand */}
        <div className="w-32 h-16 bg-gradient-to-b from-[#111] to-[#222] mt-[-2px] z-[-1]" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
        <div className="w-64 h-2 bg-[#222] rounded-full shadow-lg"></div>
    </div>
);

const CustomFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-lg border border-dashed border-gray-600 bg-white" style={{ width, height }}>
         <div className="absolute -top-6 left-0 text-xs text-gray-500 font-mono">{width} x {height}</div>
         <div className="w-full h-full overflow-y-auto overflow-x-hidden">
             {children}
         </div>
    </div>
);

// --- Main Canvas Component ---

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
  setZoom,
  breakpoints
}) => {

  const activeBreakpoint = breakpoints.find(bp => bp.id === viewport) || breakpoints[0];
  const dims = {
      width: activeBreakpoint.width,
      height: activeBreakpoint.height || '100%',
      label: activeBreakpoint.name
  };

  const renderFrame = () => {
      const commonProps = {
          data: tree,
          selectedId,
          onSelect: (id: string, e: React.MouseEvent) => { if (!previewMode) onSelect(id, e); },
          onDrop,
          onContextMenu,
          onTextChange,
          viewport,
          previewMode,
          cmsCollections,
          breakpoints
      };

      const content = <Renderer {...commonProps} />;

      switch (activeBreakpoint.type) {
          case 'mobile':
              return <MobileFrame width={dims.width} height={dims.height}>{content}</MobileFrame>;
          case 'tablet':
              return <TabletFrame width={dims.width} height={dims.height}>{content}</TabletFrame>;
          case 'foldable':
              return <FoldableFrame width={dims.width} height={dims.height}>{content}</FoldableFrame>;
          case 'ultrawide':
              return <UltrawideFrame width={dims.width} height={dims.height}>{content}</UltrawideFrame>;
          case 'desktop':
              return (
                  <DesktopFrame width="100%" height="100%">
                      <div className="w-full h-full overflow-y-auto custom-scrollbar">
                          {content}
                      </div>
                  </DesktopFrame>
              );
          default:
              return <CustomFrame width={dims.width} height={dims.height}>{content}</CustomFrame>;
      }
  };

  return (
    <div className="flex-1 canvas-grid relative flex flex-col items-center overflow-hidden" onClick={() => !previewMode && onClearSelection()}>
      
      {/* Top Info Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-vectra-panel/90 backdrop-blur border border-vectra-border rounded-full px-4 py-1.5 flex items-center gap-3 text-xs text-vectra-muted shadow-lg pointer-events-none transition-all hover:bg-vectra-panel">
          <span className="font-bold text-white flex items-center gap-2">
             <Icon name={activeBreakpoint.icon} /> {dims.label}
          </span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span className="font-mono">{viewport === 'desktop' ? 'Fluid' : `${dims.width} x ${dims.height}`}</span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span className="text-vectra-accent font-bold">{Math.round(zoom * 100)}%</span>
      </div>

      <div className="flex-1 w-full p-12 flex flex-col items-center overflow-auto custom-scrollbar">
        <div 
          className="relative transition-all duration-300 ease-in-out origin-top flex-shrink-0"
          style={{
            transform: `scale(${zoom})`,
            marginTop: `${(zoom < 1 ? 40 : 0)}px`,
            width: activeBreakpoint.type === 'desktop' ? '100%' : 'auto',
            maxWidth: activeBreakpoint.type === 'desktop' ? '1400px' : 'none', // Limit fluid desktop slightly for readability
            height: activeBreakpoint.type === 'desktop' ? '100%' : 'auto'
          }}
        >
            {renderFrame()}
        </div>
        <div className="h-32 w-full flex-shrink-0"></div>
      </div>

      <div className="absolute bottom-10 right-8 flex flex-col gap-2 z-40">
        {zoom !== 1 && (
             <button onClick={() => setZoom(1)} className="bg-vectra-panel hover:bg-vectra-border text-white p-2 rounded-full shadow-lg border border-vectra-border transition-all" title="Reset Zoom">
                <span className="text-xs font-bold">1:1</span>
             </button>
        )}
        <button onClick={() => setZoom(0.5)} className="bg-vectra-panel hover:bg-vectra-border text-white p-2 rounded-full shadow-lg border border-vectra-border transition-all" title="Fit Screen">
             <Icon name="compress" />
        </button>
      </div>

      {!previewMode && (
        <div className="w-full absolute bottom-0 left-0 right-0 z-30">
          <Breadcrumbs tree={tree} selectedId={selectedId} onSelect={(id) => onSelect(id, {} as React.MouseEvent)} />
        </div>
      )}
    </div>
  );
};
