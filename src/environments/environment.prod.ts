export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface Environment {
  production: boolean;
  firebase: FirebaseConfig;
}

export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyCb0J21FLB2-4xJ0Qv_4QMjkpeFNeiZdg8',
    authDomain: 'minddump-app-agamez.firebaseapp.com',
    projectId: 'minddump-app-agamez',
    storageBucket: 'minddump-app-agamez.firebasestorage.app',
    messagingSenderId: '629498391848',
    appId: '1:629498391848:web:082218fd7a6ecf8a3a341d'
  }
};
