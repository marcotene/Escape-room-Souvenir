
import React, { useState, useEffect } from 'react';
import { Page, Mockup, AppState } from './types';
import SetupPage from './components/SetupPage';
import FotofinishPage from './components/FotofinishPage';
import MockupList from './components/MockupList';

const STORAGE_KEY = 'escape_room_souvenirs_data';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, currentPage: Page.LIST, editingMockupId: null };
      } catch (e) {
        console.error("Error loading state", e);
      }
    }
    return {
      mockups: [],
      currentPage: Page.LIST,
      editingMockupId: null
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mockups: state.mockups }));
  }, [state.mockups]);

  const navigate = (page: Page, mockupId: string | null = null) => {
    setState(prev => ({ ...prev, currentPage: page, editingMockupId: mockupId }));
  };

  const saveMockup = (mockup: Mockup) => {
    setState(prev => {
      const exists = prev.mockups.findIndex(m => m.id === mockup.id);
      let newMockups;
      if (exists >= 0) {
        newMockups = [...prev.mockups];
        newMockups[exists] = mockup;
      } else {
        newMockups = [...prev.mockups, mockup];
      }
      return { ...prev, mockups: newMockups, currentPage: Page.LIST, editingMockupId: null };
    });
  };

  const deleteMockup = (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo mockup?")) {
      setState(prev => ({
        ...prev,
        mockups: prev.mockups.filter(m => m.id !== id)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-4 pb-20 selection:bg-red-500/30">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 mt-4">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-black text-red-700 font-bangers uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Escape Room Souvenir
          </h1>
          <div className="h-1 w-24 bg-red-700/50 rounded-full mt-1"></div>
        </div>
      </header>

      <main className="w-full max-w-4xl">
        {state.currentPage === Page.LIST && (
          <MockupList 
            mockups={state.mockups}
            onEdit={(id) => navigate(Page.SETUP, id)}
            onDelete={deleteMockup}
            onUse={(id) => navigate(Page.FOTOFINISH, id)}
            onCreate={() => navigate(Page.SETUP, null)}
          />
        )}

        {state.currentPage === Page.SETUP && (
          <SetupPage 
            mockup={state.mockups.find(m => m.id === state.editingMockupId)}
            onSave={saveMockup}
            onCancel={() => navigate(Page.LIST)}
          />
        )}

        {state.currentPage === Page.FOTOFINISH && (
          <FotofinishPage 
            mockup={state.mockups.find(m => m.id === state.editingMockupId)!}
            onBack={() => navigate(Page.LIST)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
