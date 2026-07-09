import { useState, useContext } from 'react';
import { db } from '../firebase/config';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

export default function CajeroVirtual({ saldoActual }) {
  const { usuario: usuarioActual } = useContext(AuthContext);

  const [monto, setMonto] = useState('');
  const [operacion, setOperacion] = useState('deposito');
  const [estado, setEstado] = useState({ tipo: '', texto: '' });
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setEstado({ tipo: '', texto: '' });
    const montoNum = Number(monto);
    const LIMITE_TRANSACCION = 500000;

    if (montoNum <= 0) return setEstado({ tipo: 'error', texto: 'El monto debe ser mayor a $0.' });
    if (montoNum > LIMITE_TRANSACCION) return setEstado({ tipo: 'error', texto: `Límite máximo por operación: $${LIMITE_TRANSACCION.toLocaleString('es-CL')}.` });
    if (operacion === 'retiro' && montoNum > saldoActual) return setEstado({ tipo: 'error', texto: 'Saldo insuficiente para realizar este retiro.' });

    setProcesando(true);

    try {
      const usuarioRef = doc(db, 'users', usuarioActual.uid);
      const nuevoSaldo = operacion === 'deposito' ? saldoActual + montoNum : saldoActual - montoNum;

      await updateDoc(usuarioRef, { saldo: nuevoSaldo });
      await addDoc(collection(db, "movimientos"), {
        emisorUid: operacion === 'deposito' ? 'SISTEMA' : usuarioActual.uid,
        emisorEmail: operacion === 'deposito' ? 'Cajero Virtual (Ingreso)' : usuarioActual.email,
        receptorUid: operacion === 'retiro' ? 'SISTEMA' : usuarioActual.uid,
        receptorEmail: operacion === 'retiro' ? 'Cajero Virtual (Retiro)' : usuarioActual.email,
        monto: montoNum,
        fecha: new Date().toISOString(),
        tipo: operacion
      });

      setEstado({ tipo: 'exito', texto: `¡${operacion === 'deposito' ? 'Depósito' : 'Retiro'} procesado correctamente!` });
      setMonto('');
    } catch (error) {
      console.error("Error en el cajero virtual:", error);
      setEstado({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section style={{ marginTop: '30px', borderTop: '1px solid var(--borde-color)', paddingTop: '20px' }}>
      <h3>Simulador de Cajero</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--texto-secundario)' }}>Operación:</label>
            <select value={operacion} onChange={(e) => setOperacion(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }}>
              <option value="deposito">Depositar Dinero</option>
              <option value="retiro">Retirar Dinero</option>
            </select>
          </div>
          <div style={{ flex: '2' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--texto-secundario)' }}>Monto:</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="Ej: 10000" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }} />
          </div>
        </div>
        {estado.texto && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', backgroundColor: estado.tipo === 'error' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', color: estado.tipo === 'error' ? '#f85149' : '#3fb950', border: `1px solid ${estado.tipo === 'error' ? '#f85149' : '#3fb950'}` }}>
            {estado.texto}
          </div>
        )}
        <button type="submit" disabled={procesando} style={{ width: '100%', padding: '10px', backgroundColor: procesando ? 'var(--borde-color)' : '#238636', color: procesando ? 'var(--texto-secundario)' : '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: procesando ? 'not-allowed' : 'pointer' }}>
          {procesando ? 'Procesando operación...' : 'Confirmar Operación'}
        </button>
      </form>
    </section>
  );
}