import { useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import TransferForm from './TransferForm';
import CajeroVirtual from './CajeroVirtual';
import History from './History';

// Ya no recibimos props
export default function Dashboard() {
  // Lo leemos directamente del contexto global
  const { usuario } = useContext(AuthContext);
  const [datosCuenta, setDatosCuenta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    const docRef = doc(db, 'users', usuario.uid);
    const unsubscribe = onSnapshot(docRef, 
      (documento) => {
        if (documento.exists()) setDatosCuenta(documento.data());
        else setError("No se encontraron los datos de la cuenta.");
      },
      (errorFirebase) => {
        console.error("Error al leer datos:", errorFirebase);
        setError("Error de conexión.");
      }
    );
    return () => unsubscribe();
  }, [usuario]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (!datosCuenta && !error) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando saldo...</div>;

  return (
    <div style={{ border: '1px solid var(--borde-color)', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '20px auto', backgroundColor: 'var(--bg-tarjeta)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--borde-color)', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Mi Cuenta</h2>
        <button onClick={handleLogout} style={{ backgroundColor: 'var(--bg-principal)', color: '#f85149', border: '1px solid #f85149', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      {error ? (
        <p style={{ color: '#f85149' }}>{error}</p>
      ) : (
        <>
          <div style={{ backgroundColor: 'var(--bg-interior)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: 'var(--texto-secundario)', margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Saldo Disponible</p>
            <h1 style={{ color: '#3fb950', margin: 0, fontSize: '2.5rem' }}>${datosCuenta.saldo.toLocaleString('es-CL')}</h1>
            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--texto-principal)' }}>Usuario: {datosCuenta.email}</p>
          </div>
          
          {/* Ya no pasamos usuarioActual a los hijos, solo el saldo */}
          <TransferForm saldoActual={datosCuenta.saldo} />
          <CajeroVirtual saldoActual={datosCuenta.saldo} />
          <History />
        </>
      )}
    </div>
  );
}