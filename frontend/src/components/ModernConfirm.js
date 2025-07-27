import React, { useState, useEffect } from 'react';
import { AlertTriangle, HelpCircle, Trash2, X } from 'lucide-react';
import './ModernConfirm.css';

const ModernConfirm = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type = 'default', // 'danger', 'warning', 'info'
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = null
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'danger':
        return <Trash2 className="confirm-icon danger" />;
      case 'warning':
        return <AlertTriangle className="confirm-icon warning" />;
      default:
        return <HelpCircle className="confirm-icon info" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={handleClose}>
      <div 
        className={`modern-confirm ${type} ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <div className="confirm-title-section">
            {getIcon()}
            <div className="confirm-text">
              <h3 className="confirm-title">{title}</h3>
              <p className="confirm-message">{message}</p>
            </div>
          </div>
          <button className="confirm-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="confirm-actions">
          <button
            className="confirm-btn secondary"
            onClick={handleClose}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-btn primary ${type}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for easy usage
export const useConfirm = () => {
  const [confirm, setConfirm] = useState(null);

  const showConfirm = (config) => {
    return new Promise((resolve) => {
      setConfirm({
        id: Date.now(),
        ...config,
        isOpen: true,
        onConfirm: () => {
          resolve(true);
          setConfirm(null);
        },
        onClose: () => {
          resolve(false);
          setConfirm(null);
        }
      });
    });
  };

  const hideConfirm = () => {
    setConfirm(null);
  };

  const confirmProps = confirm ? {
    ...confirm
  } : null;

  return {
    confirm: confirmProps,
    showConfirm,
    hideConfirm,
    ConfirmComponent: confirmProps ? <ModernConfirm {...confirmProps} /> : null
  };
};

export default ModernConfirm;
