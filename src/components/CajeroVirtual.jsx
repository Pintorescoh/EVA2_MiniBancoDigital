// src/components/CajeroVirtual.jsx
import { useState } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

export default function CajeroVirtual({ usuarioActual, saldoActual }) {
  // Estados para controlar el formulario
  const [monto, setMonto] = useState('');
  const [operacion, setOperacion] = useState('deposito'); // Valor por defecto
  
  // Estados para la experiencia del usuario
  const [estado, setEstado] = useState({ tipo: '', texto: '' });
  const [procesando, setProcesando] = useState(false);

  // Manejadores de eventos claros y específicos
  const handleMontoChange = (evento) => setMonto(evento.target.value);
  const handleOperacionChange = (evento) => setOperacion(evento.target.value);

  const handleSubmit = async (evento) => {
    evento.preventDefault(); // Evitamos recargar la página
    setEstado({ tipo: '', texto: '' });

    const montoNum = Number(monto);
    const LIMITE_TRANSACCION = 500000; // Límite máximo por operación

    // 1. VALIDACIONES LOCALES
    if (montoNum <= 0) {
      return setEstado({ tipo: 'error', texto: 'El monto debe ser mayor a $0.' });
    }
    
    // NUEVA VALIDACIÓN: Límite máximo
    if (montoNum > LIMITE_TRANSACCION) {
      return setEstado({ 
        tipo: 'error', 
        texto: `Por seguridad, el límite máximo por operación es de $${LIMITE_TRANSACCION.toLocaleString('es-CL')}.` 
      });
    }

    // Si es retiro, no puede sacar más de lo que tiene
    if (operacion === 'retiro' && montoNum > saldoActual) {
      return setEstado({ tipo: 'error', texto: 'Saldo insuficiente para realizar este retiro.' });
    }

    setProcesando(true);

    try {
      const usuarioRef = doc(db, 'users', usuarioActual.uid);

      // 2. CÁLCULO DEL NUEVO SALDO
      const nuevoSaldo = operacion === 'deposito' 
        ? saldoActual + montoNum 
        : saldoActual - montoNum;

      // 3. ACTUALIZACIÓN EN FIRESTORE
      await updateDoc(usuarioRef, { saldo: nuevoSaldo });

      // 4. REGISTRO EN EL HISTORIAL
      // Simulamos que el "Cajero" es el emisor o receptor para que aparezca en el historial
      await addDoc(collection(db, "movimientos"), {
        emisorUid: operacion === 'deposito' ? 'SISTEMA' : usuarioActual.uid,
        emisorEmail: operacion === 'deposito' ? 'Cajero Virtual (Ingreso)' : usuarioActual.email,
        receptorUid: operacion === 'retiro' ? 'SISTEMA' : usuarioActual.uid,
        receptorEmail: operacion === 'retiro' ? 'Cajero Virtual (Retiro)' : usuarioActual.email,
        monto: montoNum,
        fecha: new Date().toISOString(),
        tipo: operacion
      });

      // Feedback de éxito
      setEstado({ 
        tipo: 'exito', 
        texto: `¡${operacion === 'deposito' ? 'Depósito' : 'Retiro'} de $${montoNum.toLocaleString('es-CL')} procesado correctamente!` 
      });
      setMonto(''); // Limpiamos el input

    } catch (error) {
      console.error("Error en el cajero virtual:", error);
      setEstado({ tipo: 'error', texto: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setProcesando(false); // Liberamos el formulario
    }
  };

  return (
    <section style={{ marginTop: '30px', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
      <h3>Simulador de Cajero</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          
          {/* Selector semántico del tipo de operación */}
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Operación:</label>
            <select 
              value={operacion} 
              onChange={handleOperacionChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px' }}
            >
              <option value="deposito">Depositar Dinero</option>
              <option value="retiro">Retirar Dinero</option>
            </select>
          </div>

          <div style={{ flex: '2' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Monto:</label>
            <input 
              type="number" 
              value={monto} 
              onChange={handleMontoChange} 
              required 
              placeholder="Ej: 10000"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Mensajes de feedback visual */}
        {estado.texto && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            borderRadius: '4px',
            backgroundColor: estado.tipo === 'error' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)',
            color: estado.tipo === 'error' ? '#f85149' : '#3fb950',
            border: `1px solid ${estado.tipo === 'error' ? '#f85149' : '#3fb950'}`
          }}>
            {estado.texto}
          </div>
        )}

        <button 
          type="submit" 
          disabled={procesando}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: procesando ? '#30363d' : '#238636', // Usamos verde para diferenciarlo del botón de transferencia
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            cursor: procesando ? 'not-allowed' : 'pointer'
          }}
        >
          {procesando ? 'Procesando operación...' : 'Confirmar Operación'}
        </button>
      </form>
    </section>
  );
}