
import React from 'react';
import { Mockup } from '../types';
import { Plus, Edit2, Trash2, Camera, Layout } from 'lucide-react';

interface MockupListProps {
  mockups: Mockup[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUse: (id: string) => void;
  onCreate: () => void;
}

const MockupList: React.FC<MockupListProps> = ({ mockups, onEdit, onDelete, onUse, onCreate }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-tight">
          <Layout className="w-6 h-6 text-red-600" /> I Tuoi Mockup
        </h2>
        <button 
          onClick={onCreate}
          className="btn-mystic text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold uppercase text-xs tracking-widest"
        >
          <Plus className="w-4 h-4" /> Nuovo Mockup
        </button>
      </div>

      {mockups.length === 0 ? (
        <div className="bg-zinc-900 p-16 rounded-3xl border-2 border-dashed border-zinc-800 text-center">
          <p className="text-zinc-500 mb-6 font-medium italic">Il tuo archivio è vuoto...</p>
          <button 
            onClick={onCreate}
            className="text-red-500 font-bold hover:text-red-400 transition-colors uppercase text-sm tracking-widest underline decoration-2 underline-offset-4"
          >
            Crea il primo mockup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockups.map(mockup => (
            <div key={mockup.id} className="card-dark p-5 rounded-2xl flex flex-col justify-between hover:border-red-900/50 transition-all duration-300 group shadow-lg">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-zinc-100 mb-1 group-hover:text-red-500 transition-colors uppercase tracking-tight">{mockup.name}</h3>
                <p className="text-[10px] text-zinc-600 font-mono tracking-tighter">REF: {mockup.id.slice(0, 12)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onUse(mockup.id)}
                  className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all uppercase shadow-md active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Fotofinish
                </button>
                <button 
                  onClick={() => onEdit(mockup.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-xl transition-colors"
                  title="Modifica"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onDelete(mockup.id)}
                  className="bg-red-900/10 hover:bg-red-900/20 text-red-500 p-2.5 rounded-xl transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MockupList;
