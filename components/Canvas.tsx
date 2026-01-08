import React from 'react';
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
  setZoom: (zoom: number) => void;
}

// Custom Device Frames
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
      <div className="w-10"></div> {/* Spacer for balance */}
    </div>
    <div className="flex-1 relative bg-white overflow-hidden">{children}</div>
  </div>
);

const MobileFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-[0_50px_100px_-20px_rgba(50,50,93,0.25),0_30px_60px_-30px_rgba(0,0,0,0.3)] rounded-[3rem] border-[12px] border-[#1f2937] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-4 bg-[#111] rounded-full flex items-center justify-end pr-2 gap-1">
             <div className="w-1 h-1 rounded-full bg-[#333]"></div>
             <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333]"></div>
          </div>
      </div>
      {/* Side Buttons Visuals */}
      <div className="absolute -left-[14px] top-24 w-[3px] h-8 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-36 w-[3px] h-12 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-52 w-[3px] h-12 bg-[#2a3544] rounded-l-md"></div>
      <div className="absolute -right-[14px] top-36 w-[3px] h-16 bg-[#2a3544] rounded-r-md"></div>

      <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar">
        {children}
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full z-50 pointer-events-none opacity-50 mix-blend-difference"></div>
    </div>
);

const TabletFrame = ({ children, width, height }: React.PropsWithChildren<{ width: string, height: string }>) => (
    <div className="relative shadow-2xl rounded-[1.5rem] border-[12px] border-[#1f2937] bg-[#1f2937] overflow-hidden" style={{ width, height }}>
      {/* Camera */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 mt-1.5 rounded-full bg-[#333] z-50 pointer-events-none"></div>
      
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

  const getViewportDimensions = () => {
    if (viewport === 'mobile') return { width: '375px', height: '812px', label: 'iPhone 14' };
    if (viewport === 'tablet') return { width: '768px', height: '1024px', label: 'iPad Mini' };
    return { width: '100%', height: '100%', label: 'Desktop' }; // 100% relative to wrapper
  };

  const dims = getViewportDimensions();

  return (
    <div className="flex-1 canvas-grid relative flex flex-col items-center overflow-hidden" onClick={() => !previewMode && onClearSelection()}>
      
      {/* Floating Resolution Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-vectra-panel/90 backdrop-blur border border-vectra-border rounded-full px-4 py-1.5 flex items-center gap-3 text-xs text-vectra-muted shadow-lg pointer-events-none">
          <span className="font-bold text-white">{dims.label}</span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span>{viewport === 'desktop' ? 'Fluid' : `${dims.width} x ${dims.height}`}</span>
          <span className="w-px h-3 bg-gray-600"></span>
          <span className="text-vectra-accent">{Math.round(zoom * 100)}%</span>
      </div>

      <div className="flex-1 w-full p-12 flex flex-col items-center overflow-auto custom-scrollbar">
        <div 
          className="relative transition-all duration-300 ease-in-out origin-top flex-shrink-0"
          style={{
            transform: `scale(${zoom})`,
            marginTop: `${(zoom < 1 ? 40 : 0)}px`,
            width: viewport === 'desktop' ? '100%' : 'auto',
            maxWidth: viewport === 'desktop' ? '1200px' : 'none'
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
        {/* Spacer for scrolling past end */}
        <div className="h-32 w-full flex-shrink-0"></div>
      </div>

      {/* Floating Canvas Controls */}
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

      {/* BREADCRUMBS BAR */}
      {!previewMode && (
        <div className="w-full absolute bottom-0 left-0 right-0 z-30">
          <Breadcrumbs tree={tree} selectedId={selectedId} onSelect={(id) => onSelect(id, {} as React.MouseEvent)} />
        </div>
      )}
    </div>
  );
};