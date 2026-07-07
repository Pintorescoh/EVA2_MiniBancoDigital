// src/components/Dashboard.jsx
import History from './History';
import TransferForm from './TransferForm';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Recibimos la variable "usuario" que nos mandará App.jsx
export default function Dashboard({ usuario }) {
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [error, setError] = useState(null);

  // useEffect se ejecuta cuando el componente aparece en pantalla
  useEffect(() => {
    // 1. Apuntamos al documento específico de este usuario en la colección 'users'
    const docRef = doc(db, 'users', usuario.uid);

    // 2. onSnapshot es el "micrófono" de Firebase. Se queda escuchando en tiempo real.
    // Si el saldo cambia en la nube, esta función se vuelve a ejecutar sola.
    const unsubscribe = onSnapshot(
      docRef, 
      (documento) => {
        if (documento.exists()) {
          setDatosCuenta(documento.data());
        } else {
          setError("No se encontraron los datos de la cuenta.");
        }
      },
      (errorFirebase) => {
        console.error("Error al leer datos:", errorFirebase);
        setError("Error de conexión al obtener el saldo.");
      }
    );

    // 3. LIMPIEZA (Vital para la rúbrica): 
    // Cuando el usuario cierra sesión o se va de esta pantalla, debemos apagar el micrófono.
    // Si no retornamos 'unsubscribe', generamos fugas de memoria (memory leaks).
    return () => unsubscribe();
    
  }, [usuario.uid]); // El arreglo de dependencias. Solo se vuelve a ejecutar si cambia el UID del usuario.

  // Función para cumplir el RF5: Cerrar Sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Pantalla de carga mientras llegan los datos de Firestore
  if (!datosCuenta && !error) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando saldo...</div>;
  }

  return (
    <div style={{ border: '1px solid #30363d', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Mi Cuenta</h2>
        <button 
          onClick={handleLogout}
          style={{ backgroundColor: '#21262d', color: '#f85149', border: '1px solid #f85149', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>

  {error ? (
        <p style={{ color: '#f85149' }}>{error}</p>
      ) : (
        /* Agregamos el Fragmento de React aquí para agrupar los dos elementos hermanos */
        <>
          <div style={{ backgroundColor: '#1c2333', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#8b949e', margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Saldo Disponible</p>
            <h1 style={{ color: '#3fb950', margin: 0, fontSize: '2.5rem' }}>
              ${datosCuenta.saldo.toLocaleString('es-CL')}
            </h1>
            <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>Usuario: {datosCuenta.email}</p>
          </div>
          
          {/* Agregamos el formulario y le pasamos los datos necesarios */}
          <TransferForm usuarioActual={usuario} saldoActual={datosCuenta.saldo} />
          
          {/* Agregamos el historial de movimientos */}
          <History usuarioActual={usuario} />
        </>
      )}
    </div>
  );
}