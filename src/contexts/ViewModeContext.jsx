import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

export const ViewModeProvider = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(() => {
    // Recupera a preferência salva no localStorage
    const saved = localStorage.getItem('viewMode');
    return saved === 'mobile';
  });

  const toggleViewMode = () => {
    setIsMobileView(prev => {
      const newMode = !prev;
      localStorage.setItem('viewMode', newMode ? 'mobile' : 'desktop');
      return newMode;
    });
  };

  useEffect(() => {
    // Adiciona classe CSS ao body para controle global
    if (isMobileView) {
      document.body.classList.add('force-mobile-view');
    } else {
      document.body.classList.remove('force-mobile-view');
    }

    return () => {
      document.body.classList.remove('force-mobile-view');
    };
  }, [isMobileView]);

  return (
    <ViewModeContext.Provider value={{ isMobileView, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
