
import React, { useState, useRef } from 'react';
import { Mockup, TextElement, OverlayImage, FontType } from '../types';
import Transformable from './Transformable';
import { Save, X, Image as ImageIcon, ArrowLeft, Plus, RotateCw, Maximize } from 'lucide-react';

interface SetupPageProps {
  mockup?: Mockup;
  onSave: (mockup: Mockup) => void;
  onCancel: () => void;
}

const DEFAULT_MOCKUP = (id: string): Mockup => ({
  id,
  name: 'Nuovo Mockup',
  overlays: [],
  teamNameState: {
    id: 'teamName', text: 'NOME SQUADRA', x: 50, y: 50, scale: 1, rotation: 0, 
    color: '#ffffff', fontSize: 32, fontFamily: 'font-bangers', visible: true
  },
  scoreState: {
    id: 'score', text: '12:34', x: 50, y: 100, scale: 1, rotation: 0, 
    color: '#ffffff', fontSize: 24, fontFamily: 'font-mono', visible: true
  },
  dateState: {
    id: 'date', text: new Date().toLocaleDateString(), x: 50, y: 150, scale: 1, rotation: 0, 
    color: '#ffffff', fontSize: 18, fontFamily: 'font-roboto', visible: true
  }
});

const SetupPage: React.FC<SetupPageProps> = ({ mockup, onSave, onCancel }) => {
  const [currentMockup, setCurrentMockup] = useState<Mockup>(() => mockup || DEFAULT_MOCKUP(crypto.randomUUID()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'elements' | 'text'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateText = (id: 'teamName' | 'score' | 'date', updates: Partial<TextElement>) => {
    setCurrentMockup(prev => ({
      ...prev,
      [`${id}State`]: { ...prev[`${id}State` as keyof Mockup] as TextElement, ...updates }
    }));
  };

  const handleUpdateOverlay = (id: string, updates: Partial<OverlayImage>) => {
    setCurrentMockup(prev => ({
      ...prev,
      overlays: prev.overlays.map(o => o.id === id ? { ...o, ...updates } : o)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const uri = ev.target?.result as string;
        const newOverlay: OverlayImage = {
          id: crypto.randomUUID(),
          uri,
          x: 50,
          y: 50,
          scale: 0.5,
          rotation: 0
        };
        setCurrentMockup(prev => ({
          ...prev,
          overlays: [...prev.overlays, newOverlay]
        }));
        setSelectedId(newOverlay.id);
        setActiveTab('elements');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeOverlay = (id: string) => {
    setCurrentMockup(prev => ({
      ...prev,
      overlays: prev.overlays.filter(o => o.id !== id)
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedOverlay = currentMockup.overlays.find(o => o.id === selectedId);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 w-full">
        <div className="flex-1 flex flex-col items-center">
          <div className="canvas-container rounded-2xl overflow-hidden bg-black relative border-4 border-zinc-800">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <ImageIcon className="w-32 h-32 text-white" />
            </div>

            {currentMockup.overlays.map(overlay => (
              <Transformable
                key={overlay.id}
                active={selectedId === overlay.id}
                x={overlay.x}
                y={overlay.y}
                scale={overlay.scale}
                rotation={overlay.rotation}
                onChange={(upd) => handleUpdateOverlay(overlay.id, upd)}
              >
                <div onClick={() => setSelectedId(overlay.id)} className="relative">
                    <img src={overlay.uri} alt="overlay" className="max-w-none pointer-events-none" style={{ height: 'auto', width: '300px' }} />
                </div>
              </Transformable>
            ))}

            {(['teamName', 'score', 'date'] as const).map(key => {
              const state = currentMockup[`${key}State` as keyof Mockup] as TextElement;
              if (!state.visible) return null;
              return (
                <Transformable
                  key={key}
                  active={selectedId === key}
                  x={state.x}
                  y={state.y}
                  scale={state.scale}
                  rotation={state.rotation}
                  onChange={(upd) => handleUpdateText(key, upd)}
                >
                  <div 
                    onClick={() => setSelectedId(key)}
                    className={`${state.fontFamily} whitespace-nowrap cursor-pointer select-none leading-none`}
                    style={{ color: state.color, fontSize: `${state.fontSize}px` }}
                  >
                    {state.text}
                  </div>
                </Transformable>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 uppercase font-black tracking-widest italic">Anteprima Mockup • Trascina gli elementi</p>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-2xl">
            <div className="flex border-b border-zinc-800 mb-6 gap-2">
               <button onClick={() => setActiveTab('general')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'text-red-600 border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}>Setup</button>
               <button onClick={() => setActiveTab('elements')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'elements' ? 'text-red-600 border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}>Grafica</button>
               <button onClick={() => setActiveTab('text')} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'text' ? 'text-red-600 border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}>Testi</button>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">Nome Identificativo</label>
                  <input 
                    type="text" 
                    value={currentMockup.name}
                    onChange={(e) => setCurrentMockup(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 p-3 rounded-xl text-zinc-100 font-bold focus:border-red-900 transition-colors outline-none"
                  />
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-200 p-4 rounded-xl hover:bg-zinc-700 transition-all font-black uppercase text-xs tracking-tighter shadow-md">
                    <Plus className="w-5 h-5 text-red-600" /> Aggiungi Cornice PNG
                </button>
                <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            {activeTab === 'elements' && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {selectedOverlay && (
                    <div className="bg-red-950/20 p-4 rounded-xl border border-red-900/30 space-y-4 mb-4 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Controllo Layer</span>
                            <button onClick={() => setSelectedId(null)} className="text-zinc-600 hover:text-white"><X className="w-4 h-4"/></button>
                        </div>
                        <div className="space-y-2">
                            <label className="flex justify-between items-center text-[9px] font-black text-zinc-500 tracking-widest uppercase">
                                <span className="flex items-center gap-2"><Maximize className="w-3 h-3 text-red-600"/> Scala</span>
                                <span className="text-zinc-300 font-mono">{selectedOverlay.scale.toFixed(2)}</span>
                            </label>
                            <input type="range" min="0.1" max="3" step="0.01" value={selectedOverlay.scale} onChange={(e) => handleUpdateOverlay(selectedOverlay.id, { scale: parseFloat(e.target.value) })} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div className="space-y-2">
                            <label className="flex justify-between items-center text-[9px] font-black text-zinc-500 tracking-widest uppercase">
                                <span className="flex items-center gap-2"><RotateCw className="w-3 h-3 text-red-600"/> Rotazione</span>
                                <span className="text-zinc-300 font-mono">{selectedOverlay.rotation}°</span>
                            </label>
                            <input type="range" min="-180" max="180" value={selectedOverlay.rotation} onChange={(e) => handleUpdateOverlay(selectedOverlay.id, { rotation: parseInt(e.target.value) })} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    {currentMockup.overlays.length === 0 && <p className="text-center text-[10px] text-zinc-600 italic py-4">Nessun overlay caricato.</p>}
                    {currentMockup.overlays.map((o, idx) => (
                    <div key={o.id} onClick={() => setSelectedId(o.id)} className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${selectedId === o.id ? 'border-red-700 bg-red-900/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-3">
                            <img src={o.uri} className="w-10 h-10 object-contain bg-black rounded-lg border border-zinc-800 p-1" alt="" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cornice {idx + 1}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeOverlay(o.id); }} className="text-zinc-600 hover:text-red-500 transition-colors p-1"><X className="w-4 h-4"/></button>
                    </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                {(['teamName', 'score', 'date'] as const).map(key => {
                  const textState = currentMockup[`${key}State` as keyof Mockup] as TextElement;
                  return (
                    <div key={key} className={`space-y-4 p-4 rounded-xl border-2 transition-all ${selectedId === key ? 'border-red-700 bg-red-900/10' : 'border-zinc-800 bg-zinc-950'}`}>
                      <div className="flex justify-between items-center">
                          <label onClick={() => setSelectedId(key)} className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] cursor-pointer italic">{key === 'teamName' ? 'Squadra' : key === 'score' ? 'Punteggio' : 'Data'}</label>
                          <input type="checkbox" checked={textState.visible} onChange={(e) => handleUpdateText(key, { visible: e.target.checked })} className="w-4 h-4 accent-red-600" />
                      </div>
                      {textState.visible && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                           <div className="grid grid-cols-2 gap-3">
                               <select className="bg-zinc-900 text-[10px] border-2 border-zinc-800 rounded-lg p-2 font-black uppercase text-zinc-300 outline-none focus:border-red-900" value={textState.fontFamily} onChange={(e) => handleUpdateText(key, { fontFamily: e.target.value as FontType })}>
                                  <option value="font-bangers">Bangers</option>
                                  <option value="font-marker">Marker</option>
                                  <option value="font-roboto">Roboto</option>
                                  <option value="font-mono">Mono</option>
                               </select>
                               <input type="color" className="w-full h-9 bg-zinc-900 border-2 border-zinc-800 rounded-lg cursor-pointer p-1" value={textState.color} onChange={(e) => handleUpdateText(key, { color: e.target.value })} />
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase">
                                <span>Dimensione</span>
                                <span className="text-zinc-300 font-mono">{textState.fontSize}px</span>
                              </div>
                              <input type="range" min="8" max="150" value={textState.fontSize} onChange={(e) => handleUpdateText(key, { fontSize: parseInt(e.target.value) })} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => onSave(currentMockup)} className="flex-1 btn-mystic text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl transition-all uppercase text-xs tracking-widest active:scale-95">
                <Save className="w-5 h-5" /> Salva Mockup
            </button>
            <button onClick={onCancel} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-4 rounded-2xl font-black flex items-center justify-center shadow-lg transition-all active:scale-95">
                <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
