import { useState, useCallback } from 'react';
import { extractErrorMessage, friendlyErrorMessage } from '../lib/error-utils';
import { ToastState, TOAST_INITIAL } from '../components/common/AppToast';

/**
 * Hook unificado para mostrar toasts en cualquier página/componente.
 *
 * Uso:
 *   const { toast, showToast, showError, showSuccess, dismissToast } = useAppToast();
 *
 *   try { ... }
 *   catch (error) { showError(error); }  // Extrae el mensaje automáticamente
 *
 *   showSuccess('Guardado correctamente');
 *
 *   <AppToast toast={toast} onDismiss={dismissToast} />
 */
export function useAppToast() {
  const [toast, setToast] = useState<ToastState>(TOAST_INITIAL);

  const dismissToast = useCallback(() => {
    setToast(TOAST_INITIAL);
  }, []);

  /** Muestra un toast con color y mensaje personalizado */
  const showToast = useCallback(
    (message: string, color: ToastState['color'] = 'medium') => {
      setToast({ isOpen: true, message, color });
    },
    [],
  );

  /** Extrae el mensaje de cualquier tipo de error y lo muestra como toast rojo */
  const showError = useCallback((error: unknown, fallback?: string) => {
    const message = friendlyErrorMessage(error);
    console.warn('Toast error:', extractErrorMessage(error, fallback));
    setToast({ isOpen: true, message, color: 'danger' });
  }, []);

  /** Toast verde de éxito */
  const showSuccess = useCallback((message: string) => {
    setToast({ isOpen: true, message, color: 'success' });
  }, []);

  /** Toast amarillo de advertencia */
  const showWarning = useCallback((message: string) => {
    setToast({ isOpen: true, message, color: 'warning' });
  }, []);

  /** Toast azul informativo */
  const showInfo = useCallback((message: string) => {
    setToast({ isOpen: true, message, color: 'primary' });
  }, []);

  return {
    toast,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    dismissToast,
  };
}
