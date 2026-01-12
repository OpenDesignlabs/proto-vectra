import React, { useState } from 'react';
import { CMSCollection, CMSItem } from '../types';
import { Icon } from './Icon';

interface DataPanelProps {
  collections: CMSCollection[];
  onAddCollection: (name: string) => void;
  onAddItem: (collectionId: string, item: CMSItem) => void;
}

export const DataPanel: React.FC<DataPanelProps> = ({ collections, onAddCollection, onAddItem }) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  
  const selectedCollection = collections.find(c => c.id === selectedCollectionId);

  const handleCreateCollection = () => {
      const name = prompt("Enter collection name (e.g., 'Products'):");
      if (name) {
          onAddCollection(name);
      }
  };

  const handleCreateItem = () => {
      if (!selectedCollection) return;
      const newItem: any = {};
      
      // Simple prompt based entry for now
      selectedCollection.fields.forEach(field => {
          const value = prompt(`Enter value for ${field.name}:`);
          if (value !== null) {
              newItem[field.id] = value;
          }
      });
      
      // Basic validation
      if (Object.keys(newItem).length > 0) {
          onAddItem(selectedCollection.id, newItem);
      }
  };

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="p-4 border-b border-vectra-border bg-vectra-bg">
        <h2 className="font-bold text-white mb-2 flex items-center gap-2">
            <Icon name="database" /> Headless CMS
        </h2>
        <p className="text-xs text-vectra-muted">Manage your dynamic content and data schemas.</p>
      </div>

      {!selectedCollection ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
           <h3 className="text-xs font-bold text-gray-500 uppercase px-2 mt-2">Collections</h3>
           {collections.map(col => (
             <div 
               key={col.id} 
               onClick={() => setSelectedCollectionId(col.id)}
               className="flex items-center justify-between p-3 bg-vectra-panel border border-vectra-border rounded cursor-pointer hover:border-vectra-accent transition-colors group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded bg-purple-900/30 text-purple-400 flex items-center justify-center border border-purple-500/20">
                   <Icon name="table" />
                 </div>
                 <div>
                   <div className="font-medium text-white">{col.name}</div>
                   <div className="text-[10px] text-gray-500">{col.items.length} Items</div>
                 </div>
               </div>
               <Icon name="chevron-right" />
             </div>
           ))}
           <button 
             className="w-full py-2 border border-dashed border-gray-600 rounded text-gray-400 hover:text-white hover:border-gray-400 text-xs mt-2 transition-colors"
             onClick={handleCreateCollection}
           >
             + Create Collection
           </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
           <div className="flex items-center gap-2 p-2 border-b border-vectra-border">
              <button onClick={() => setSelectedCollectionId(null)} className="p-1 hover:text-white text-gray-400"><Icon name="arrow-left" /></button>
              <span className="font-bold">{selectedCollection.name}</span>
              <div className="ml-auto text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">{selectedCollection.items.length} Records</div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="text-[10px] text-gray-500 uppercase border-b border-gray-700">
                       {selectedCollection.fields.map(f => (
                           <th key={f.id} className="p-2 font-normal">{f.name}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    {selectedCollection.items.map(item => (
                       <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          {selectedCollection.fields.map(f => (
                              <td key={f.id} className="p-2 text-xs truncate max-w-[120px]">
                                  {f.type === 'image' ? (
                                      <img src={item[f.id]} className="w-6 h-6 rounded object-cover border border-gray-600" alt="" />
                                  ) : (
                                      <span className="text-gray-300">{item[f.id]}</span>
                                  )}
                              </td>
                          ))}
                       </tr>
                    ))}
                 </tbody>
              </table>
               <button 
                 className="w-full py-2 border border-dashed border-gray-600 rounded text-gray-400 hover:text-white hover:border-gray-400 text-xs mt-4 transition-colors"
                 onClick={handleCreateItem}
               >
                 + Add Item
               </button>
           </div>
        </div>
      )}
    </div>
  );
};