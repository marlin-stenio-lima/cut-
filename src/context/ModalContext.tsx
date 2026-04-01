import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { GlobalModal } from '../components/GlobalModal';

type ModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastState {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ModalContextType {
  showAlert: (title: string, message: string, type?: ModalType) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showAlert = useCallback((title: string, message: string, type: ModalType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type,
        title,
        message,
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      <GlobalModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 10000,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            animation: 'toastIn 0.3s cubic-bezier(.34,1.56,.64,1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto'
          }}>
            {toast.type === 'success' && <span style={{ color: '#22c55e' }}>✓</span>}
            {toast.type === 'error' && <span style={{ color: '#ef4444' }}>✕</span>}
            {toast.message}
          </div>
        ))}
      </div>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};
