import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOL2HDgQDF0oGPfUig1mVVAOJ_H0vMWQI",
  authDomain: "batiflow-627b9.firebaseapp.com",
  projectId: "batiflow-627b9",
  storageBucket: "batiflow-627b9.firebasestorage.app",
  messagingSenderId: "660828720700",
  appId: "1:660828720700:web:0e7a9a011f81e590effd39",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);