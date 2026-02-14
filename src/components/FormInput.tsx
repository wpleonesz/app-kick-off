import React from "react";
import { IonInput } from "@ionic/react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  error?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

/* Facebook-style label: clean, semi-bold, compact */
const defaultLabelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ion-text-color)",
  marginBottom: "6px",
} as const;

/* Facebook-style input: subtle background, 8px radius, blue focus */
const defaultInputStyle = {
  "--background": "var(--ion-color-light)",
  "--border-radius": "8px",
  "--padding-start": "14px",
  "--padding-end": "14px",
  "--padding-top": "12px",
  "--padding-bottom": "12px",
  "--highlight-color-focused": "var(--ion-color-primary)",
  "--highlight-color-valid": "var(--ion-color-primary)",
  fontSize: "15px",
} as React.CSSProperties;

const errorTextStyle = {
  fontSize: "12px",
  color: "var(--ion-color-danger)",
  marginTop: "4px",
  paddingLeft: "2px",
} as const;

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  placeholder,
  required = false,
  autocomplete,
  error,
  inputStyle,
  labelStyle,
}: FormInputProps<T>) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle || defaultLabelStyle}>
        {label}{" "}
        {required && (
          <span style={{ color: "var(--ion-color-primary)" }}>*</span>
        )}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IonInput
            value={field.value || ""}
            onIonInput={(e: any) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            type={type}
            placeholder={placeholder}
            autocomplete={autocomplete}
            fill="solid"
            style={inputStyle || defaultInputStyle}
            className={error ? "ion-invalid ion-touched" : ""}
          />
        )}
      />
      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
}
