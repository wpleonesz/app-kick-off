import React from 'react';
import { IonInput } from '@ionic/react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  error?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

const defaultLabelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--ion-color-dark)',
  marginBottom: '8px',
} as const;

const defaultInputStyle = {
  '--background': 'var(--ion-color-light)',
  '--border-radius': '12px',
  '--padding-start': '16px',
  '--padding-end': '16px',
  '--padding-top': '14px',
  '--padding-bottom': '14px',
  '--highlight-color-focused': '#1877f2',
  fontSize: '16px',
} as React.CSSProperties;

const errorTextStyle = {
  fontSize: '12px',
  color: 'var(--ion-color-danger)',
  marginTop: '6px',
  paddingLeft: '4px',
} as const;

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  required = false,
  autocomplete,
  error,
  inputStyle,
  labelStyle,
}: FormInputProps<T>) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle || defaultLabelStyle}>
        {label} {required && <span style={{ color: '#1877f2' }}>*</span>}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IonInput
            value={field.value || ''}
            onIonInput={(e: any) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            type={type}
            placeholder={placeholder}
            autocomplete={autocomplete}
            fill="solid"
            style={inputStyle || defaultInputStyle}
            className={error ? 'ion-invalid ion-touched' : ''}
          />
        )}
      />
      {error && (
        <div style={errorTextStyle}>
          {error}
        </div>
      )}
    </div>
  );
}
