import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { API_BASE_URL } from '../constants';

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80',
  'https://images.unsplash.com/photo-1517423568366-eb51fb59dfb7?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1469474932222-de90811e9244?w=800&q=80',
];

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'uploads'>('presets');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
      if (isOpen && activeTab === 'uploads') {
          fetch(`${API_BASE_URL}/uploads`)
            .then(res => res.json())
            .then(setUploadedImages)
            .catch(console.error);
      }
  }, [isOpen, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
          try {
              const res = await fetch(`${API_BASE_URL}/upload`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      image: reader.result,
                      name: file.name
                  })
              });
              
              if (!res.ok) throw new Error("Upload failed");
              
              const data = await res.json();
              setUploadedImages([data.url, ...uploadedImages]);
              onSelect(data.url); // Auto select
          } catch (err) {
              alert("Failed to upload image. Ensure backend is running.");
          } finally {
              setIsUploading(false);
          }
      };
      reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-vectra-panel w-full max-w-3xl rounded-lg shadow-2xl border border-vectra-border flex flex-col h-[70vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-vectra-border">
          <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('presets')} 
                className={`text-sm font-bold pb-1 ${activeTab === 'presets' ? 'text-white border-b-2 border-vectra-accent' : 'text-gray-500'}`}
              >
                  Presets
              </button>
              <button 
                onClick={() => setActiveTab('uploads')} 
                className={`text-sm font-bold pb-1 ${activeTab === 'uploads' ? 'text-white border-b-2 border-vectra-accent' : 'text-gray-500'}`}
              >
                  My Uploads
              </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="times" /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-[#0d1117]">
            {activeTab === 'presets' && (
                <div className="grid grid-cols-4 gap-4">
                    {PRESET_IMAGES.map((url, idx) => (
                        <button key={idx} onClick={() => onSelect(url)} className="relative group aspect-square rounded overflow-hidden border border-transparent hover:border-vectra-accent focus:outline-none">
                            <img src={url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold text-xs bg-vectra-accent px-2 py-1 rounded">Select</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'uploads' && (
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:border-vectra-accent hover:text-white transition-colors relative cursor-pointer">
                        <Icon name={isUploading ? "circle-notch fa-spin" : "cloud-upload-alt"} />
                        <span className="mt-2 text-sm">{isUploading ? "Uploading..." : "Click to Upload Image"}</span>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                    </div>
                    
                    {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-4">
                            {uploadedImages.map((url, idx) => (
                                <button key={idx} onClick={() => onSelect(url)} className="relative group aspect-square rounded overflow-hidden border border-transparent hover:border-vectra-accent focus:outline-none bg-gray-800">
                                    <img src={url} alt="Upload" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white font-bold text-xs bg-vectra-accent px-2 py-1 rounded">Select</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};