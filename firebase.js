// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔴 REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDtTZHfSRpkTyRa6VNzDXxHTks6AvJI1aQ",
  authDomain: "intikharchu-app.firebaseapp.com",
  projectId: "intikharchu-app",
  storageBucket: "intikharchu-app.firebasestorage.app",
  messagingSenderId: "1026976407177",
  appId: "1:1026976407177:web:4a8432709e517e8544b058",
  measurementId: "G-VF57251SDT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };