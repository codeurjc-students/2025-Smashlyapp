import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthView = 'login' | 'register';

interface AuthModalContextType {
  isOpen: boolean;
  view: AuthView;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
  toggleView: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');

  const openLogin = () => {
    setView('login');
    setIsOpen(true);
  };

  const openRegister = () => {
    setView('register');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const toggleView = () => {
    setView((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openLogin, openRegister, closeModal, toggleView }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
