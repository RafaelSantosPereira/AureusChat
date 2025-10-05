import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';

import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyCaroJ5prNxfnT7XQLOaMqNxVMiEc2qTXw",
  authDomain: "aureus-chat.firebaseapp.com",
  projectId: "aureus-chat",
  storageBucket: "aureus-chat.firebasestorage.app",
  messagingSenderId: "597705486207",
  appId: "1:597705486207:web:2204338133f3344523744a",
  measurementId: "G-VPG76FWGY1"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()) 
  ]
};
