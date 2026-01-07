import React from 'react';
import { Icon } from './Icon';

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80',
  'https://images.unsplash.com/photo-1517423568366-eb51fb59dfb7?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1469474932222-de90811e9244?w=800&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
];

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8">
      <div className="bg-vectra-panel w-full max-w-3xl rounded-lg shadow-2xl border border-vectra-border flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-vectra-border">
          <h3 className="font-bold text-white">Select an Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="times" /></button>
        </div>
        <div className="p-4 overflow-y-auto grid grid-cols-4 gap-4">
          {PRESET_IMAGES.map((url, idx) => (
            <button key={idx} onClick={() => onSelect(url)} className="relative group aspect-square rounded overflow-hidden border border-transparent hover:border-vectra-accent focus:outline-none">
              <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white font-bold text-xs bg-vectra-accent px-2 py-1 rounded">Select</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
