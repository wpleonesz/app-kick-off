import React from 'react'
import { IonApp, IonRouterOutlet, IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import { isAuthenticated } from './services/auth'
import { Capacitor } from '@capacitor/core'

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

const NotSupportedWeb: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Solo móvil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p>Esta aplicación está diseñada solo para dispositivos móviles. Descarga la app nativa o ejecútala en un emulador.</p>
        <p>Si necesitas abrir en web para desarrollo, usa `npm run dev` localmente con `API_BASE` configurado.</p>
        <IonButton onClick={() => { window.location.reload() }}>Actualizar</IonButton>
      </IonContent>
    </IonPage>
  )
}

const App: React.FC = () => {
  const platform = Capacitor.getPlatform()
  const isWeb = platform === 'web'

  if (isWeb) {
    return (
      <IonApp>
        <NotSupportedWeb />
      </IonApp>
    )
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default App
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
