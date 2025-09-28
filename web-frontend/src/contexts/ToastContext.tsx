import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ToastProps, ToastType } from '../components/Toast';
import ToastContainer from '../components/ToastContainer';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showError: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showWarning: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  showInfo: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
}

interface ToastOptions {
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: ToastProps[];
}

type ToastAction =
  | { type: 'ADD_TOAST'; payload: ToastProps }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' };

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastReducer = (state: ToastState, action: ToastAction, maxToasts: number): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      const newToasts = [...state.toasts, action.payload];
      // Remove oldest toasts if we exceed maxToasts
      if (newToasts.length > maxToasts) {
        return {
          ...state,
          toasts: newToasts.slice(-maxToasts),
        };
      }
      return {
        ...state,
        toasts: newToasts,
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    case 'CLEAR_ALL_TOASTS':
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

const generateId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [state, dispatch] = useReducer(
    (state: ToastState, action: ToastAction) => toastReducer(state, action, maxToasts),
    { toasts: [] }
  );

  const hideToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>): string => {
    const id = generateId();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: hideToast,
    };

    dispatch({ type: 'ADD_TOAST', payload: newToast });
    return id;
  };

  const clearAllToasts = () => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  };

  const createToastHelper = (type: ToastType) => (
    title: string,
    message?: string,
    options?: Partial<ToastOptions>
  ): string => {
    return showToast({
      type,
      title,
      message,
      duration: options?.duration ?? 5000,
      action: options?.action,
    });
  };

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAllToasts,
    showSuccess: createToastHelper('success'),
    showError: createToastHelper('error'),
    showWarning: createToastHelper('warning'),
    showInfo: createToastHelper('info'),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={state.toasts} position={position} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;