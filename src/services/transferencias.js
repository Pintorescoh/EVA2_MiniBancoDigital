// src/services/transferencias.js
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

export const realizarTransferenciaBD = async (montoNum, saldoActual, emailDestino, usuarioActual) => {
  const usersRef = collection(db, "users");
  const consulta = query(usersRef, where("email", "==", emailDestino));
  const resultados = await getDocs(consulta);

  if (resultados.empty) {
    throw new Error('Usuario no encontrado en XBank.');
  }

  const destinatarioDoc = resultados.docs[0];
  const datosDestinatario = destinatarioDoc.data();
  const emisorRef = doc(db, "users", usuarioActual.uid);
  const receptorRef = doc(db, "users", destinatarioDoc.id);

  // Actualizar saldos
  await updateDoc(emisorRef, { saldo: saldoActual - montoNum });
  await updateDoc(receptorRef, { saldo: datosDestinatario.saldo + montoNum });

  // Registrar movimiento
  await addDoc(collection(db, "movimientos"), {
    emisorUid: usuarioActual.uid,
    emisorEmail: usuarioActual.email,
    receptorUid: destinatarioDoc.id,
    receptorEmail: emailDestino,
    monto: montoNum,
    fecha: new Date().toISOString(),
    tipo: 'transferencia'
  });
};