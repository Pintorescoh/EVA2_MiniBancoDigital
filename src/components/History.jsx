import { useState, useEffect, useContext } from 'react';
import { db } from '../firebase/config';
import { collection, query, or, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

export default function History() {
  const { usuario: usuarioActual } = useContext(AuthContext);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState(''); 

  useEffect(() => {
    if (!usuarioActual) return;
    const movRef = collection(db, "movimientos");
    const consulta = query(movRef, or(where("emisorUid", "==", usuarioActual.uid), where("receptorEmail", "==", usuarioActual.email)));

    const unsubscribe = onSnapshot(consulta, (snapshot) => {
      const historial = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setMovimientos(historial);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [usuarioActual]);

  const movimientosFiltrados = movimientos.filter((mov) => {
    const pasaFiltroTipo = filtroTipo === 'todas' || mov.tipo === filtroTipo;
    const esIngreso = mov.receptorEmail === usuarioActual.email;
    const contraparte = esIngreso ? mov.emisorEmail : mov.receptorEmail;
    const pasaFiltroTexto = contraparte.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const fechaObjeto = new Date(mov.fecha);
    const fechaLocalMovimiento = `${fechaObjeto.getFullYear()}-${String(fechaObjeto.getMonth() + 1).padStart(2, '0')}-${String(fechaObjeto.getDate()).padStart(2, '0')}`;
    const pasaFiltroFecha = !filtroFecha || fechaLocalMovimiento === filtroFecha;

    return pasaFiltroTipo && pasaFiltroTexto && pasaFiltroFecha;
  });

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando historial...</div>;

  return (
    <div style={{ marginTop: '10px' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Movimientos</h3>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        <input type="text" placeholder="Buscar contraparte..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} style={{ minWidth: '140px', flex: 1, padding: '10px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '8px', outline: 'none' }} />
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ padding: '10px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '8px', outline: 'none' }}>
          <option value="todas">Todos</option>
          <option value="transferencia">Transferencias</option>
          <option value="deposito">Depósitos</option>
          <option value="retiro">Retiros</option>
        </select>
        <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} style={{ padding: '10px', backgroundColor: 'var(--bg-principal)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '8px', outline: 'none' }} />
      </div>

      {movimientosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--bg-principal)', borderRadius: '12px', border: '1px dashed var(--borde-color)' }}>
          <p style={{ color: 'var(--texto-secundario)', margin: 0 }}>No hay registros.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {movimientosFiltrados.map((mov) => {
            const esIngreso = mov.receptorEmail === usuarioActual.email;
            let tituloOperacion = mov.tipo === 'deposito' ? 'Cajero' : mov.tipo === 'retiro' ? 'Cajero' : 'Transferencia';
            
            return (
              <li key={mov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-principal)', borderRadius: '12px', border: '1px solid var(--borde-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: esIngreso ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: esIngreso ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {esIngreso ? '↓' : '↑'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', color: 'var(--texto-principal)', fontSize: '0.95rem' }}>{tituloOperacion}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--texto-secundario)' }}>{esIngreso ? mov.emisorEmail : mov.receptorEmail}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '1.05rem', color: esIngreso ? '#22c55e' : '#texto-principal' }}>
                    {esIngreso ? '+' : '-'}${mov.monto.toLocaleString('es-CL')}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--texto-secundario)' }}>
                    {new Date(mov.fecha).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}