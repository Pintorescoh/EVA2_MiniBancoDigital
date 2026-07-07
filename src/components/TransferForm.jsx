// src/components/TransferForm.jsx
import { useState } from 'react';
import { db } from '../firebase/config';
// Importamos las herramientas de Firestore para buscar, actualizar y agregar documentos
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

export default function TransferForm({ usuarioActual, saldoActual }) {
  const [emailDestino, setEmailDestino] = useState('');
  const [monto, setMonto] = useState('');
  
  // Estados para manejar la experiencia del usuario (Rúbrica: feedback claro y prevención de doble submit)
  const [estado, setEstado] = useState({ tipo: '', texto: '' }); 
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setEstado({ tipo: '', texto: '' }); // Limpiamos mensajes anteriores
    
    const montoNum = Number(monto); // Convertimos el texto a número

    // --- 1. VALIDACIONES LOCALES (Antes de tocar Firestore) ---
    if (montoNum <= 0) {
      return setEstado({ tipo: 'error', texto: 'El monto a transferir debe ser mayor a $0.' });
    }
    if (montoNum > saldoActual) {
      return setEstado({ tipo: 'error', texto: 'Saldo insuficiente para esta operación.' });
    }
    if (emailDestino === usuarioActual.email) {
      return setEstado({ tipo: 'error', texto: 'No puedes transferir dinero a tu propia cuenta.' });
    }

    setProcesando(true); // Bloqueamos el botón para evitar que el usuario haga doble clic

    try {
      // --- 2. BUSCAR AL DESTINATARIO ---
      // Hacemos una "query" (consulta) a la colección de usuarios buscando ese correo exacto
      const usersRef = collection(db, "users");
      const consulta = query(usersRef, where("email", "==", emailDestino));
      const resultados = await getDocs(consulta);

      if (resultados.empty) {
        setProcesando(false);
        return setEstado({ tipo: 'error', texto: 'El correo ingresado no pertenece a ningún usuario de XBank.' });
      }

      // Extraemos los datos del usuario que encontramos
      const destinatarioDoc = resultados.docs[0];
      const datosDestinatario = destinatarioDoc.data();

      // --- 3. PREPARAR REFERENCIAS ---
      const emisorRef = doc(db, "users", usuarioActual.uid);
      const receptorRef = doc(db, "users", destinatarioDoc.id);

      // --- 4. ACTUALIZAR SALDOS ---
      // Descontamos al emisor y sumamos al receptor
      await updateDoc(emisorRef, { saldo: saldoActual - montoNum });
      await updateDoc(receptorRef, { saldo: datosDestinatario.saldo + montoNum });

      // --- 5. REGISTRAR EL MOVIMIENTO (Para el Historial) ---
      // Creamos un nuevo documento en la colección 'movimientos'
      await addDoc(collection(db, "movimientos"), {
        emisorUid: usuarioActual.uid,
        emisorEmail: usuarioActual.email,
        receptorUid: destinatarioDoc.id,
        receptorEmail: emailDestino,
        monto: montoNum,
        fecha: new Date().toISOString(), // Guardamos la fecha y hora exacta
        tipo: 'transferencia'
      });

      // ¡Éxito! Limpiamos el formulario y avisamos
      setEstado({ tipo: 'exito', texto: `¡Transferencia de $${montoNum.toLocaleString('es-CL')} enviada con éxito!` });
      setEmailDestino('');
      setMonto('');

    } catch (error) {
      console.error("Error procesando transferencia:", error);
      setEstado({ tipo: 'error', texto: 'Ocurrió un error en el servidor. Intenta nuevamente.' });
    } finally {
      setProcesando(false); // Liberamos el botón sin importar si hubo éxito o error
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
      <h3>Realizar Transferencia</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Correo del destinatario:</label>
          <input 
            type="email" 
            value={emailDestino} 
            onChange={(e) => setEmailDestino(e.target.value)} 
            required 
            placeholder="ejemplo@correo.com"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Monto a transferir:</label>
          <input 
            type="number" 
            value={monto} 
            onChange={(e) => setMonto(e.target.value)} 
            required 
            placeholder="Ej: 15000"
            style={{ width: '100%', padding: '8px' }}
          />
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
          disabled={procesando} // Si está procesando, el botón se apaga
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: procesando ? '#30363d' : '#58a6ff', 
            color: '#0d1117', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            cursor: procesando ? 'not-allowed' : 'pointer'
          }}
        >
          {procesando ? 'Procesando transferencia...' : 'Transferir Fondos'}
        </button>
      </form>
    </div>
  );
}