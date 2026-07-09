// src/context/AuthContext.jsx
import { createContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

// 1. Creamos el Contexto (la "burbuja" de datos)
export const AuthContext = createContext();

// 2. Definimos el Reducer (las reglas estrictas de cómo cambia la sesión)
const authReducer = (estado, accion) => {
  switch (accion.type) {
    case 'LOGIN':
      return { ...estado, usuario: accion.payload, cargando: false };
    case 'LOGOUT':
      return { ...estado, usuario: null, cargando: false };
    default:
      return estado;
  }
};

// 3. Creamos el Provider (el componente envolvente que proveerá los datos)
export const AuthProvider = ({ children }) => {
  // Inicializamos useReducer con usuario null y cargando en true
  const [estado, dispatch] = useReducer(authReducer, {
    usuario: null,
    cargando: true
  });

  // Movemos el "observador" de Firebase desde App.jsx hacia acá
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioActual) => {
      if (usuarioActual) {
        dispatch({ type: 'LOGIN', payload: usuarioActual });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ ...estado, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};