import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAQ97Y0PQG8WCOCj_ZIaow7FQ5LPuSE0oE",
  authDomain: "chat-plugin-ab02a.firebaseapp.com",
  databaseURL: "https://chat-plugin-ab02a-default-rtdb.firebaseio.com",
  projectId: "chat-plugin-ab02a",
  storageBucket: "chat-plugin-ab02a.firebasestorage.app",
  messagingSenderId: "492348948345",
  appId: "1:492348948345:web:d92dae03d4916d34b379a8",
  measurementId: "G-0RP3NE0H5G"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);