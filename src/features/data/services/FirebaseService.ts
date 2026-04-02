import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAakUuQoA-3X-SRzsthgM9k70qN7whceNg",
  authDomain: "productapp-f525b.firebaseapp.com",
  projectId: "productapp-f525b",
  storageBucket: "productapp-f525b.appspot.com",
  messagingSenderId: "375083713677",
  appId: "1:375083713677:web:c04efcd9efe8d970478ec4",
  measurementId: "G-Q6DMLH8R50"
}

// 🔥 inicialización única
const app = initializeApp(firebaseConfig)

// 🔥 exportás servicios
export const db = getFirestore(app)