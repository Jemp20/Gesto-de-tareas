import { initializeApp } from "firebase/app";
import { getFirestore }  from "firebase/firestore";
import { getStorage }    from "firebase/storage";
import { getAuth }       from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBkOo-t4M9m31qvjSm47VXdBjMnkKEjOmc",
  authDomain:        "panelgia.firebaseapp.com",
  projectId:         "panelgia",
  storageBucket: "panelgia.appspot.com",
  messagingSenderId: "118355494961",
  appId:             "1:118355494961:web:0a126cccf294f80718ad10",
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
export default app;
