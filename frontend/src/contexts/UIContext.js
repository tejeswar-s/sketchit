import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [modal, setModal] = useState(null); // { type, props }
  const [notification, setNotification] = useState(null); // { message, type }
  const [darkMode, setDarkMode] = useState(true);

  return (
    <UIContext.Provider value={{ modal, setModal, notification, setNotification, darkMode, setDarkMode }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
} 