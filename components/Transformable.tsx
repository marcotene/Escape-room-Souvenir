
import React, { useRef, useEffect } from 'react';

interface TransformableProps {
  children: React.ReactNode;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  onChange: (updates: { x: number; y: number; scale: number; rotation: number }) => void;
  active?: boolean;
}

const Transformable: React.FC<TransformableProps> = ({ children, x, y, scale, rotation, onChange, active }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ x, y, scale, rotation });
  const gestureRef = useRef({
    initialDist: 0,
    initialScale: 1,
    isGesturing: false,
    lastX: 0,
    lastY: 0
  });

  // Mantieni il ref aggiornato con le props
  useEffect(() => {
    stateRef.current = { x, y, scale, rotation };
  }, [x, y, scale, rotation]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!active) return;
    
    if (e.touches.length === 1) {
      gestureRef.current.lastX = e.touches[0].clientX;
      gestureRef.current.lastY = e.touches[0].clientY;
      gestureRef.current.isGesturing = true;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      gestureRef.current.initialDist = dist;
      gestureRef.current.initialScale = stateRef.current.scale;
      gestureRef.current.isGesturing = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!active || !gestureRef.current.isGesturing) return;
    
    // Evita scroll pagina durante modifica
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - gestureRef.current.lastX;
      const dy = e.touches[0].clientY - gestureRef.current.lastY;
      
      onChange({
        ...stateRef.current,
        x: stateRef.current.x + dx,
        y: stateRef.current.y + dy
      });
      
      gestureRef.current.lastX = e.touches[0].clientX;
      gestureRef.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (gestureRef.current.initialDist > 0) {
        const factor = dist / gestureRef.current.initialDist;
        const newScale = Math.max(0.05, gestureRef.current.initialScale * factor);
        
        onChange({
          ...stateRef.current,
          scale: newScale
        });
      }
    }
  };

  const handleTouchEnd = () => {
    gestureRef.current.isGesturing = false;
    gestureRef.current.initialDist = 0;
  };

  // Supporto Mouse per PC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!active || e.button !== 0) return;
    gestureRef.current.lastX = e.clientX;
    gestureRef.current.lastY = e.clientY;
    gestureRef.current.isGesturing = true;

    const moveHandler = (moveEv: MouseEvent) => {
      const dx = moveEv.clientX - gestureRef.current.lastX;
      const dy = moveEv.clientY - gestureRef.current.lastY;
      onChange({
        ...stateRef.current,
        x: stateRef.current.x + dx,
        y: stateRef.current.y + dy
      });
      gestureRef.current.lastX = moveEv.clientX;
      gestureRef.current.lastY = moveEv.clientY;
    };

    const upHandler = () => {
      gestureRef.current.isGesturing = false;
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
  };

  return (
    <div
      ref={containerRef}
      className={`transform-element transition-shadow ${active ? 'ring-2 ring-indigo-500 ring-offset-2 z-50' : 'z-10'}`}
      style={{
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'top left',
        touchAction: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default Transformable;
