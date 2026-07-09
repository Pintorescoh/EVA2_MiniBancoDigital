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

    if (montoNum <= 0) return setEstado({ tipo: 'error', texto: 'Monto inválido.' });
    if (montoNum > LIMITE_TRANSACCION) return setEstado({ tipo: 'error', texto: `Límite: $${LIMITE_TRANSACCION.toLocaleString('es-CL')}.` });
    if (operacion === 'retiro' && montoNum > saldoActual) return setEstado({ tipo: 'error', texto: 'Fondos insuficientes.' });

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

      setEstado({ tipo: 'exito', texto: `Operación exitosa.` });
      setMonto('');
    } catch (error) {
      setEstado({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-principal)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--borde-color)' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Cajero Virtual</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: '1' }}>
            <select value={operacion} onChange={(e) => setOperacion(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: 'none', borderRadius: '8px', outline: 'none' }}>
              <option value="deposito">Depositar</option>
              <option value="retiro">Retirar</option>
            </select>
          </div>
          <div style={{ flex: '1.5' }}>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="Monto" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: 'none', borderRadius: '8px', outline: 'none' }} />
          </div>
        </div>
        {estado.texto && (
          <div style={{ padding: '12px', marginBottom: '15px', borderRadius: '8px', backgroundColor: estado.tipo === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: estado.tipo === 'error' ? '#ef4444' : '#22c55e', fontSize: '0.9rem', textAlign: 'center' }}>
            {estado.texto}
          </div>
        )}
        <button type="submit" disabled={procesando} style={{ width: '100%', padding: '12px', backgroundColor: procesando ? 'var(--borde-color)' : '#10b981', color: procesando ? 'var(--texto-secundario)' : '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: procesando ? 'not-allowed' : 'pointer' }}>
          {procesando ? 'Procesando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
}