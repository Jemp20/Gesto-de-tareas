// src/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(undefined); // undefined = aún cargando
  const [authLoading, setAuthLoading] = useState(true);      // true mientras Firebase verifica
  const [loginError,  setLoginError]  = useState("");
  const [loginLoading,setLoginLoading]= useState(false);

  useEffect(() => {
    // Firebase llama esto una vez al iniciar para saber si hay sesión guardada
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);      // null = no hay sesión, objeto = hay sesión
      setAuthLoading(false);   // ya terminó de verificar
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    setLoginLoading(true);
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const msgs = {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/user-not-found":     "No existe una cuenta con ese correo.",
        "auth/wrong-password":     "Contraseña incorrecta.",
        "auth/too-many-requests":  "Demasiados intentos. Espera un momento.",
        "auth/invalid-email":      "El correo no es válido.",
      };
      setLoginError(msgs[err.code] ?? `Error: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin:     !!user,       // true solo si hay sesión activa
      authLoading,               // true mientras Firebase verifica al inicio
      login,
      logout,
      loginError,
      loginLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
