import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCGvl1YQcBSbaNcXIoLjp_bUpxZsMurqz4",
  authDomain: "jobtrackr-9a9e2.firebaseapp.com",
  projectId: "jobtrackr-9a9e2",
  storageBucket: "jobtrackr-9a9e2.firebasestorage.app",
  messagingSenderId: "612443859813",
  appId: "1:612443859813:web:29fd6310bc0570ce354f8c",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)