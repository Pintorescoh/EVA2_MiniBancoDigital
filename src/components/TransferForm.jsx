import { useState, useContext } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

// Ya no recibe usuarioActual
export default function TransferForm({ saldoActual }) {
  // Extraemos el usuario global y lo renombramos a usuarioActual
  const { usuario: usuarioActual } = useContext(AuthContext);
  
  const [emailDestino, setEmailDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [estado, setEstado] = useState({ tipo: '', texto: '' }); 
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setEstado({ tipo: '', texto: '' });
    const montoNum = Number(monto);

    if (montoNum <= 0) return setEstado({ tipo: 'error', texto: 'El monto a transferir debe ser mayor a $0.' });
    if (montoNum > saldoActual) return setEstado({ tipo: 'error', texto: 'Saldo insuficiente para esta operación.' });
    if (emailDestino === usuarioActual.email) return setEstado({ tipo: 'error', texto: 'No puedes transferir dinero a tu propia cuenta.' });

    setProcesando(true); 

    try {
      const usersRef = collection(db, "users");
      const consulta = query(usersRef, where("email", "==", emailDestino));
      const resultados = await getDocs(consulta);

      if (resultados.empty) {
        setProcesando(false);
        return setEstado({ tipo: 'error', texto: 'El correo ingresado no pertenece a ningún usuario de XBank.' });
      }

      const destinatarioDoc = resultados.docs[0];
      const datosDestinatario = destinatarioDoc.data();
      const emisorRef = doc(db, "users", usuarioActual.uid);
      const receptorRef = doc(db, "users", destinatarioDoc.id);

      await updateDoc(emisorRef, { saldo: saldoActual - montoNum });
      await updateDoc(receptorRef, { saldo: datosDestinatario.saldo + montoNum });

      await addDoc(collection(db, "movimientos"), {
        emisorUid: usuarioActual.uid,
        emisorEmail: usuarioActual.email,
        receptorUid: destinatarioDoc.id,
        receptorEmail: emailDestino,
        monto: montoNum,
        fecha: new Date().toISOString(),
        tipo: 'transferencia'
      });

      setEstado({ tipo: 'exito', texto: `¡Transferencia de $${montoNum.toLocaleString('es-CL')} enviada con éxito!` });
      setEmailDestino('');
      setMonto('');

    } catch (error) {
      console.error("Error procesando transferencia:", error);
      setEstado({ tipo: 'error', texto: 'Ocurrió un error en el servidor.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid var(--borde-color)', paddingTop: '20px' }}>
      <h3>Realizar Transferencia</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--texto-secundario)' }}>Correo del destinatario:</label>
          <input type="email" value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} required placeholder="ejemplo@correo.com" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--texto-secundario)' }}>Monto a transferir:</label>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="Ej: 15000" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }} />
        </div>
        {estado.texto && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', backgroundColor: estado.tipo === 'error' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', color: estado.tipo === 'error' ? '#f85149' : '#3fb950', border: `1px solid ${estado.tipo === 'error' ? '#f85149' : '#3fb950'}` }}>
            {estado.texto}
          </div>
        )}
        <button type="submit" disabled={procesando} style={{ width: '100%', padding: '10px', backgroundColor: procesando ? 'var(--borde-color)' : '#58a6ff', color: procesando ? 'var(--texto-secundario)' : '#0d1117', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: procesando ? 'not-allowed' : 'pointer' }}>
          {procesando ? 'Procesando transferencia...' : 'Transferir Fondos'}
        </button>
      </form>
    </div>
  );
}