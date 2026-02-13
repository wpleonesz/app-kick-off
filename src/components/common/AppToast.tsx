import React from 'react';
import { IonToast } from '@ionic/react';

export interface ToastState {
  isOpen: boolean;
  message: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'medium';
}

export const TOAST_INITIAL: ToastState = {
  isOpen: false,
  message: '',
  color: 'medium',
};

interface AppToastProps {
  toast: ToastState;
  onDismiss: () => void;
}

export const AppToast: React.FC<AppToastProps> = ({ toast, onDismiss }) => {
  return (
    <IonToast
      isOpen={toast.isOpen}
      onDidDismiss={onDismiss}
      message={toast.message}
      duration={3000}
      color={toast.color}
      position="bottom"
      style={{
        '--background': getToastBackgroundColor(toast.color),
      } as React.CSSProperties}
    />
  );
};

function getToastBackgroundColor(
  color: 'success' | 'danger' | 'warning' | 'primary' | 'medium',
): string {
  const colors: Record<typeof color, string> = {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    primary: '#3b82f6',
    medium: '#6b7280',
  };
  return colors[color];
}
