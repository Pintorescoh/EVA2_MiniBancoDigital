import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // Estado para guardar la información del usuario conectado
  const [usuario, setUsuario] = useState(null);
  
  // Estado para mostrar un indicador mientras Firebase verifica si hay una sesión activa
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es un "observador" en tiempo real.
    // Firebase nos avisará automáticamente aquí cada vez que alguien inicie o cierre sesión.
    const unsubscribe = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });

    // La rúbrica exige limpiar las suscripciones cuando el componente se destruye para evitar fugas de memoria
    return () => unsubscribe();
  }, []);

  // Mientras esperamos la respuesta de Firebase, mostramos esto:
  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sistema central...</div>;
  }

  return (
    <div>
      <h1 style={{ textAlign: 'center', color: '#58a6ff' }}>Mini Banco Digital - XBank</h1>
      
      {/* Renderizado condicional */}
      {usuario ? (
        <Dashboard usuario={usuario} />
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;