export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface Environment {
  production: boolean;
  firebase: FirebaseConfig;
}

export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyMindDumpSyncAppLocalDemoKey12345',
    authDomain: 'minddump-sync.firebaseapp.com',
    projectId: 'minddump-sync',
    storageBucket: 'minddump-sync.appspot.com',
    messagingSenderId: '100000000001',
    appId: '1:100000000001:web:a1b2c3d4e5f6g7h8i9j0'
  }
};
