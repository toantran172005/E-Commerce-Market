import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPkVyg1V7erOSe2KWUvp9pDfO5EgVsJs4",
  authDomain: "e-commerce-market-e2875.firebaseapp.com",
  projectId: "e-commerce-market-e2875",
  storageBucket: "e-commerce-market-e2875.firebasestorage.app",
  messagingSenderId: "794360087185",
  appId: "1:794360087185:web:ee816e20e5d8d6d1cb3530",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
