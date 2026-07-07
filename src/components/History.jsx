// src/components/History.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, or, where, onSnapshot } from 'firebase/firestore';

export default function History({ usuarioActual }) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Apuntamos a la colección de movimientos
    const movRef = collection(db, "movimientos");

    // 2. Construimos la consulta: Traer los documentos donde el usuario sea el que envía O el que recibe
    const consulta = query(
      movRef,
      or(
        where("emisorUid", "==", usuarioActual.uid),
        where("receptorEmail", "==", usuarioActual.email)
      )
    );

    // 3. Escuchamos los resultados en tiempo real
    const unsubscribe = onSnapshot(consulta, (snapshot) => {
      // Mapeamos los documentos a un arreglo normal de JavaScript
      const historial = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenamos el arreglo desde el más reciente al más antiguo usando la fecha
      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setMovimientos(historial);
      setCargando(false);
    });

    // Limpieza de memoria (Obligatorio por rúbrica)
    return () => unsubscribe();
  }, [usuarioActual.uid, usuarioActual.email]);

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando historial...</div>;

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
      <h3>Últimos Movimientos</h3>
      
      {movimientos.length === 0 ? (
        <p style={{ color: '#8b949e', textAlign: 'center', fontStyle: 'italic' }}>
          Aún no tienes transferencias registradas.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movimientos.map((mov) => {
            // Determinamos si el dinero entró o salió para darle color
            const esIngreso = mov.receptorEmail === usuarioActual.email;
            
            return (
              <li 
                key={mov.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px', 
                  marginBottom: '10px',
                  backgroundColor: '#161b22',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${esIngreso ? '#3fb950' : '#f85149'}`
                }}
              >
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
                    {esIngreso ? 'Transferencia Recibida' : 'Transferencia Enviada'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e' }}>
                    {esIngreso ? `De: ${mov.emisorEmail}` : `Para: ${mov.receptorEmail}`}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#8b949e' }}>
                    {new Date(mov.fecha).toLocaleString('es-CL')}
                  </p>
                </div>
                
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: esIngreso ? '#3fb950' : '#f85149' }}>
                  {esIngreso ? '+' : '-'}${mov.monto.toLocaleString('es-CL')}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}