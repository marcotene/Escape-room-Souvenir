
import React, { useState, useRef, useEffect } from 'react';
import { Mockup, TextElement } from '../types';
import Transformable from './Transformable';
import { Camera, RefreshCcw, Download, Share2, Printer, ArrowLeft, Upload, Check, Eye, X, Maximize, RotateCw } from 'lucide-react';

interface FotofinishPageProps {
  mockup: Mockup;
  onBack: () => void;
}

const FotofinishPage: React.FC<FotofinishPageProps> = ({ mockup, onBack }) => {
  const [teamName, setTeamName] = useState('NOME SQUADRA');
  const [score, setScore] = useState('00:00');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState({ x: 0, y: 0, scale: 0.5, rotation: 0 });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCameraActive) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isCameraActive, facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1440 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Errore nell'attivazione della fotocamera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setPhotoUri(canvas.toDataURL('image/jpeg', 0.9));
        setIsCameraActive(false);
        setPhotoState({ x: 0, y: 0, scale: 0.5, rotation: 0 });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoUri(ev.target?.result as string);
        setPhotoState({ x: 0, y: 0, scale: 0.5, rotation: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!containerRef.current) return null;
    
    const previewWidth = containerRef.current.offsetWidth;
    const targetW = 1600;
    const targetH = 1200;
    const ratio = targetW / previewWidth;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Sfondo Nero (e area di Clipping fondamentale)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetW, targetH);

    // Salviamo lo stato del contesto prima del clipping
    ctx.save();
    // Area di ritaglio: garantisce che NULLA sbordi dai bordi 1600x1200
    ctx.beginPath();
    ctx.rect(0, 0, targetW, targetH);
    ctx.clip();

    // 2. Foto Background (Z-0)
    if (photoUri) {
      const img = new Image();
      img.src = photoUri;
      await new Promise(r => img.onload = r);
      
      ctx.save();
      ctx.translate(photoState.x * ratio, photoState.y * ratio);
      ctx.rotate(photoState.rotation * Math.PI / 180);
      ctx.scale(photoState.scale * ratio, photoState.scale * ratio);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
    
    // Fine clipping foto
    ctx.restore();

    // 3. Overlays (Z-10)
    for (const overlay of mockup.overlays) {
      const img = new Image();
      img.src = overlay.uri;
      await new Promise(r => img.onload = r);
      
      ctx.save();
      ctx.translate(overlay.x * ratio, overlay.y * ratio);
      ctx.rotate(overlay.rotation * Math.PI / 180);
      ctx.scale(overlay.scale * ratio, overlay.scale * ratio);
      
      const baseEditorWidth = 300;
      const h = img.height * (baseEditorWidth / img.width);
      ctx.drawImage(img, 0, 0, baseEditorWidth, h);
      ctx.restore();
    }
    
    // 4. Testi (Z-20)
    const elements = [
        { state: mockup.teamNameState, val: teamName },
        { state: mockup.scoreState, val: score },
        { state: mockup.dateState, val: mockup.dateState.text }
    ];

    for (const item of elements) {
        if (!item.state.visible) continue;
        ctx.save();
        ctx.translate(item.state.x * ratio, item.state.y * ratio);
        ctx.rotate(item.state.rotation * Math.PI / 180);
        ctx.scale(item.state.scale * ratio, item.state.scale * ratio);
        
        const fontMap: any = {
            'font-bangers': 'Bangers',
            'font-marker': 'Permanent Marker',
            'font-roboto': 'Roboto Condensed',
            'font-mono': 'Share Tech Mono'
        };

        ctx.font = `bold ${item.state.fontSize}px "${fontMap[item.state.fontFamily] || 'sans-serif'}"`;
        ctx.fillStyle = item.state.color;
        ctx.textBaseline = 'top';
        ctx.fillText(item.val, 0, 0);
        ctx.restore();
    }

    return canvas;
  };

  const exportAction = async (type: 'save' | 'share' | 'print' | 'preview') => {
    setIsLoading(true);
    try {
        const canvas = await generateCanvas();
        if (!canvas) throw new Error("Generazione fallita.");

        const dataUrl = canvas.toDataURL('image/png');

        if (type === 'preview') {
            setPreviewImage(dataUrl);
        } else if (type === 'save') {
            const link = document.createElement('a');
            link.download = `escape-room-${teamName.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } else if (type === 'print') {
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html>
                    <head>
                        <title>Stampa Souvenir</title>
                        <style>
                            @page { size: ${printSize}; margin: 0; }
                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; color: white; }
                            img { max-width: 98%; max-height: 98vh; object-fit: contain; box-shadow: 0 0 50px rgba(185,28,28,0.3); }
                        </style>
                    </head>
                    <body><img src="${dataUrl}"></body>
                    <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                    </html>
                `);
                win.document.close();
            }
        } else if (type === 'share') {
            if (navigator.share) {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'souvenir.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'Escape Room Memory',
                    text: `Siamo usciti in ${score}! Team: ${teamName}`
                }).catch(() => {});
            } else {
                alert("Condivisione non supportata su questo browser. Usa il tasto Salva.");
            }
        }
    } catch (e) {
        alert("Errore generazione immagine.");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col items-center">
          <div 
            ref={containerRef}
            className="canvas-container rounded-3xl relative border-4 border-zinc-900 group shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          >
            {/* Foto (Z-0) - Clipping via CSS overflow-hidden del container */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
                {isCameraActive ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : photoUri ? (
                    <Transformable
                        active={true}
                        x={photoState.x}
                        y={photoState.y}
                        scale={photoState.scale}
                        rotation={photoState.rotation}
                        onChange={setPhotoState}
                    >
                        <img src={photoUri} alt="bg" className="max-w-none pointer-events-none" style={{ maxHeight: 'none', width: 'auto' }} />
                    </Transformable>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 gap-4">
                        <Camera className="w-16 h-16 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">In attesa della foto...</span>
                    </div>
                )}
            </div>

            {/* Cornice Mockup (Z-10) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {mockup.overlays.map(o => (
                    <div key={o.id} className="absolute" style={{ transform: `translate(${o.x}px, ${o.y}px) scale(${o.scale}) rotate(${o.rotation}deg)`, transformOrigin: 'top left' }}>
                         <img src={o.uri} alt="" style={{ height: 'auto', width: '300px' }} />
                    </div>
                ))}

                {[
                    { state: mockup.teamNameState, val: teamName },
                    { state: mockup.scoreState, val: score },
                    { state: mockup.dateState, val: mockup.dateState.text }
                ].map((item, idx) => item.state.visible && (
                    <div key={idx} className={`absolute ${item.state.fontFamily} whitespace-nowrap leading-none`} style={{ transform: `translate(${item.state.x}px, ${item.state.y}px) scale(${item.state.scale}) rotate(${item.state.rotation}deg)`, color: item.state.color, fontSize: `${item.state.fontSize}px`, transformOrigin: 'top left' }}>
                        {item.val}
                    </div>
                ))}
            </div>

            {/* Camera Overlay */}
            {isCameraActive && (
                 <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-50">
                    <button onClick={capturePhoto} className="bg-green-600 text-white p-5 rounded-full shadow-2xl active:scale-90 transition-transform"><Check className="w-8 h-8" /></button>
                    <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="bg-zinc-800 text-white p-5 rounded-full shadow-2xl active:scale-90 transition-transform"><RefreshCcw className="w-8 h-8" /></button>
                    <button onClick={() => setIsCameraActive(false)} className="bg-red-700 text-white p-5 rounded-full shadow-2xl active:scale-90 transition-transform"><X className="w-8 h-8" /></button>
                 </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-600 mt-4 uppercase font-black tracking-[0.3em] italic">Editor 4:3 • Trascina la foto per posizionarla</p>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col gap-5">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-5">
            <h3 className="font-black text-red-600 flex items-center gap-3 text-xs uppercase italic tracking-widest"><Upload className="w-5 h-5"/> Personalizza</h3>
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Team</label>
                    <input type="text" value={teamName} placeholder="Nome Squadra" onChange={(e) => setTeamName(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-800 p-3.5 rounded-2xl font-bold text-sm text-zinc-100 focus:border-red-900 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Risultato</label>
                    <input type="text" value={score} placeholder="Tempo / Punteggio" onChange={(e) => setScore(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-800 p-3.5 rounded-2xl font-mono text-sm text-zinc-100 focus:border-red-900 outline-none transition-all" />
                </div>
            </div>

            {photoUri && (
                <div className="bg-red-950/10 p-5 rounded-2xl border border-red-900/20 space-y-5 animate-in slide-in-from-top-4">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] italic flex items-center gap-2"><Maximize className="w-4 h-4"/> Aggiusta Foto</span>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase">
                            <span>Scala</span>
                            <span className="text-zinc-300 font-mono">{photoState.scale.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.05" max="5" step="0.01" value={photoState.scale} onChange={(e) => setPhotoState(p => ({...p, scale: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase">
                            <span>Rotazione</span>
                            <span className="text-zinc-300 font-mono">{photoState.rotation}°</span>
                        </div>
                        <input type="range" min="-180" max="180" value={photoState.rotation} onChange={(e) => setPhotoState(p => ({...p, rotation: parseInt(e.target.value)}))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
                <button onClick={() => setIsCameraActive(true)} className="btn-mystic text-white p-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">
                    <Camera className="w-5 h-5" /> Scatta Foto
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-300 p-4 rounded-2xl font-black hover:bg-zinc-750 active:scale-95 transition-all text-[11px] uppercase tracking-widest border border-zinc-700">
                    <Upload className="w-5 h-5" /> Carica Foto
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                {photoUri && <button onClick={() => setPhotoUri(null)} className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em] hover:text-red-400 mt-2 self-center italic">Rimuovi Foto attuale</button>}
            </div>
          </div>

          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-900 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-zinc-100 font-black text-xs uppercase tracking-[0.2em] italic">Esporta</h3>
                <div className="flex bg-zinc-900 p-1 rounded-xl text-[10px] text-zinc-500 font-black">
                    <button onClick={() => setPrintSize('A4')} className={`px-4 py-1.5 rounded-lg transition-all ${printSize === 'A4' ? 'bg-red-700 text-white shadow-lg shadow-red-900/30' : 'hover:text-zinc-300'}`}>A4</button>
                    <button onClick={() => setPrintSize('A5')} className={`px-4 py-1.5 rounded-lg transition-all ${printSize === 'A5' ? 'bg-red-700 text-white shadow-lg shadow-red-900/30' : 'hover:text-zinc-300'}`}>A5</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button disabled={isLoading} onClick={() => exportAction('save')} className="bg-zinc-900 text-zinc-200 p-4 rounded-2xl font-bold flex flex-col items-center gap-3 text-[10px] hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800 group">
                    <Download className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" /> SALVA
                </button>
                <button disabled={isLoading} onClick={() => exportAction('share')} className="bg-zinc-900 text-zinc-200 p-4 rounded-2xl font-bold flex flex-col items-center gap-3 text-[10px] hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800 group">
                    <Share2 className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" /> SHARE
                </button>
                <button disabled={isLoading} onClick={() => exportAction('print')} className="bg-zinc-900 text-zinc-200 p-4 rounded-2xl font-bold flex flex-col items-center gap-3 text-[10px] hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800 group">
                    <Printer className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" /> STAMPA
                </button>
                <button disabled={isLoading} onClick={() => exportAction('preview')} className="bg-zinc-900 text-zinc-200 p-4 rounded-2xl font-bold flex flex-col items-center gap-3 text-[10px] hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800 group">
                    <Eye className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" /> PREVIEW
                </button>
            </div>
            {isLoading && <p className="text-center text-[10px] text-red-500 font-black animate-pulse uppercase tracking-[0.2em] italic">Incisione immagine...</p>}
          </div>

          <button onClick={onBack} className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-500 p-5 rounded-2xl font-black hover:bg-zinc-700 hover:text-zinc-300 transition-all text-xs uppercase tracking-[0.2em] italic">
            <ArrowLeft className="w-4 h-4" /> Torna Indietro
          </button>
        </div>
      </div>

      {/* Modal Anteprima */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <button onClick={() => setPreviewImage(null)} className="absolute top-8 right-8 text-white bg-zinc-900 p-4 rounded-full shadow-2xl hover:bg-red-700 transition-colors border border-zinc-800"><X className="w-7 h-7"/></button>
            <div className="relative group max-w-full">
                <img src={previewImage} className="max-w-full max-h-[72vh] rounded-3xl shadow-[0_0_120px_rgba(0,0,0,1)] border-8 border-zinc-900" alt="Preview" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-red-700 text-white px-8 py-3 rounded-full text-xs font-black shadow-2xl uppercase tracking-[0.3em] italic border border-red-900/50">Risultato Finale</div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-16">
                <button onClick={() => exportAction('save')} className="bg-white text-zinc-950 px-12 py-5 rounded-2xl font-black flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase text-[11px] tracking-widest shadow-white/5"><Download className="w-6 h-6"/> Scarica Foto</button>
                <button onClick={() => exportAction('print')} className="bg-red-700 text-white px-12 py-5 rounded-2xl font-black flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase text-[11px] tracking-widest border border-red-900/50"><Printer className="w-6 h-6"/> Stampa Souvenir</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default FotofinishPage;
