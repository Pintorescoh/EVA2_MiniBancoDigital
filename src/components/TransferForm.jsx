// src/components/TransferForm.jsx
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { validarTransferencia } from '../utils/validaciones';
import { realizarTransferenciaBD } from '../services/transferencias';

export default function TransferForm({ saldoActual }) {
  const { usuario: usuarioActual } = useContext(AuthContext);
  const [emailDestino, setEmailDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [estado, setEstado] = useState({ tipo: '', texto: '' }); 
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setEstado({ tipo: '', texto: '' });
    
    // 1. Usar lógica pura (testeada en Fase 2)
    const validacion = validarTransferencia(monto, saldoActual, emailDestino, usuarioActual.email);
    
    if (!validacion.valido) {
      return setEstado({ tipo: 'error', texto: validacion.error });
    }

    setProcesando(true); 
    const montoNum = Number(monto);

    try {
      // 2. Usar servicio externo (Aislado para RT5)
      await realizarTransferenciaBD(montoNum, saldoActual, emailDestino, usuarioActual);

      setEstado({ tipo: 'exito', texto: `¡$${montoNum.toLocaleString('es-CL')} transferidos!` });
      setEmailDestino('');
      setMonto('');
    } catch (error) {
      // Si el servicio lanza un error (ej. Usuario no encontrado), lo atrapamos aquí
      setEstado({ tipo: 'error', texto: error.message || 'Error en el servidor.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-principal)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--borde-color)' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Enviar Dinero</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <input type="email" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} required placeholder="Correo del destinatario" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: 'none', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="Monto a transferir (Ej: 15000)" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: 'none', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
        {estado.texto && (
          <div style={{ padding: '12px', marginBottom: '15px', borderRadius: '8px', backgroundColor: estado.tipo === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: estado.tipo === 'error' ? '#ef4444' : '#22c55e', fontSize: '0.9rem', textAlign: 'center' }}>
            {estado.texto}
          </div>
        )}
        <button type="submit" disabled={procesando} style={{ width: '100%', padding: '12px', backgroundColor: procesando ? 'var(--borde-color)' : 'var(--acento-azul)', color: procesando ? 'var(--texto-secundario)' : '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: procesando ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
          {procesando ? 'Procesando...' : 'Confirmar Transferencia'}
        </button>
      </form>
    </div>
  );
}