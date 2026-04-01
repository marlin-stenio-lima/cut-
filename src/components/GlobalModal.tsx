import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Info, HelpCircle } from 'lucide-react';

interface GlobalModalProps {
  isOpen: boolean;
  type: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const GlobalModal: React.FC<GlobalModalProps> = ({ 
  isOpen, type, title, message, onConfirm, onCancel 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <div className="glow-success"><CheckCircle2 size={42} color="#22c55e" /></div>;
      case 'error': return <div className="glow-error"><XCircle size={42} color="#ef4444" /></div>;
      case 'warning': return <div className="glow-warning"><AlertCircle size={42} color="#f59e0b" /></div>;
      case 'confirm': return <div className="glow-info"><HelpCircle size={42} color="#6366f1" /></div>;
      default: return <div className="glow-info"><Info size={42} color="#3b82f6" /></div>;
    }
  };

  const isConfirm = type === 'confirm';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(23, 23, 23, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          animation: 'modalSpring 0.4s cubic-bezier(.34,1.56,.64,1)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center',
          animation: 'iconBounce 2s infinite ease-in-out'
        }}>
          {getIcon()}
        </div>

        <h3 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'white',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '0.95rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          {isConfirm && (
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            >
              Cancelar
            </button>
          )}

          <button 
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: type === 'error' 
                ? 'linear-gradient(135deg, #ef4444, #991b1b)' 
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: type === 'error'
                ? '0 8px 24px rgba(239, 68, 68, 0.2)'
                : '0 8px 24px rgba(99, 102, 241, 0.2)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isConfirm ? 'Confirmar' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
};
