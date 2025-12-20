import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import { login as authLogin } from "../services/auth";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      await authLogin(email, password);
      navigate("/home");
    } catch (err: any) {
      setError(err?.message || "Error en autenticación");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <form onSubmit={handleSubmit}>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Correo</IonLabel>
              <IonInput
                value={email}
                onIonInput={(e: any) => setEmail(e.target.value)}
                type="email"
                required
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Contraseña</IonLabel>
              <IonInput
                value={password}
                onIonInput={(e: any) => setPassword(e.target.value)}
                type="password"
                required
              />
            </IonItem>
          </IonList>
          {error && (
            <IonText color="danger">
              <p style={{ padding: 12 }}>{error}</p>
            </IonText>
          )}
          <div style={{ padding: 12 }}>
            <IonButton type="submit" expand="block">
              Entrar
            </IonButton>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
