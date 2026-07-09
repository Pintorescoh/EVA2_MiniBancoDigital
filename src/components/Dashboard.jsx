import { useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import TransferForm from './TransferForm';
import CajeroVirtual from './CajeroVirtual';
import History from './History';

export default function Dashboard() {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--borde-color)', paddingBottom: '10px', marginBottom: '25px' }}>
        <h2>Mi Cuenta</h2>
        <button onClick={handleLogout} style={{ backgroundColor: 'var(--bg-principal)', color: '#f85149', border: '1px solid #f85149', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      {error ? (
        <p style={{ color: '#f85149' }}>{error}</p>
      ) : (
        <>
          {/* NUEVA INTERFAZ: Tarjeta Bancaria Virtual */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Degradado premium oscuro
            borderRadius: '16px', 
            padding: '25px', 
            color: '#ffffff', // El texto siempre será blanco dentro de la tarjeta
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '30px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Círculos decorativos de fondo (Marca de agua) */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-80px', left: '-20px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%' }}></div>

            {/* Cabecera de la tarjeta: Chip y Marca */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
              {/* Dibujo SVG del Chip Inteligente */}
              <svg width="45" height="35" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="30" rx="4" fill="#d4af37" fillOpacity="0.85"/>
                <path d="M0 10H12M0 20H12M28 10H40M28 20H40M12 0V30M28 0V30" stroke="#b8860b" strokeWidth="1.5"/>
              </svg>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '800', fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '1px', color: '#58a6ff' }}>XBank</span>
                <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '2px' }}>Débito Platinum</p>
              </div>
            </div>

            {/* Centro de la tarjeta: Saldo (Simulando los números de la tarjeta) */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Saldo Disponible</p>
              <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: '400', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                ${datosCuenta.saldo.toLocaleString('es-CL')}
              </h1>
            </div>

            {/* Pie de la tarjeta: Nombre del titular y logo falso de franquicia */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>Titular de la cuenta</p>
                {/* Extraemos la parte anterior al @ del correo como nombre */}
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  {datosCuenta.email.split('@')[0]}
                </p>
              </div>
              
              {/* Logo simulado de marca de tarjeta (dos círculos entrelazados) */}
              <div style={{ display: 'flex', opacity: 0.9 }}>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f59e0b', marginLeft: '-15px', mixBlendMode: 'multiply' }}></div>
              </div>
            </div>
          </div>
          
          <TransferForm saldoActual={datosCuenta.saldo} />
          <CajeroVirtual saldoActual={datosCuenta.saldo} />
          <History />
        </>
      )}
    </div>
  );
}