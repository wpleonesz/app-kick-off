import React from "react";
import { IonInput, IonItem, IonLabel, IonText, IonNote } from "@ionic/react";
import type { AutocompleteTypes } from "@ionic/core";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  placeholder?: string;
  required?: boolean;
  autocomplete?: AutocompleteTypes;
  error?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

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
}: FormInputProps<T>) {
  return (
    <IonItem
      lines="none"
      style={{
        marginBottom: "14px",
        "--padding-start": "0",
        "--inner-padding-end": "0",
        "--background": "transparent",
      }}
    >
      <IonLabel
        position="stacked"
        style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}
      >
        {label} {required && <IonText color="primary">*</IonText>}
      </IonLabel>
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
      {error && (
        <IonNote
          color="danger"
          slot="helper"
          style={{ fontSize: "12px", marginTop: "4px", paddingLeft: "2px" }}
        >
          {error}
        </IonNote>
      )}
    </IonItem>
  );
}
