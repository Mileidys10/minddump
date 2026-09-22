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
  production: false,
  firebase: {
    apiKey: 'AIzaSyA0U49QbzgTrH0D6pVuMi6jm2yqM7ans5U',
    authDomain: 'minddump-3ec4a.firebaseapp.com',
    projectId: 'minddump-3ec4a',
    storageBucket: 'minddump-3ec4a.firebasestorage.app',
    messagingSenderId: '91029711598',
    appId: '1:91029711598:web:3b3cd3088bfb7f9a1a21ff',
    measurementId: 'G-XRSR30HFKC'
  }
};
