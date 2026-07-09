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

  const handleLimpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroTipo('todas');
    setFiltroFecha('');
  };

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando historial...</div>;

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid var(--borde-color)', paddingTop: '20px' }}>
      <h3>Últimos Movimientos</h3>
      <fieldset style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--bg-principal)', padding: '15px', borderRadius: '8px', border: '1px solid var(--borde-color)' }}>
        <legend style={{ color: 'var(--texto-secundario)', fontSize: '0.85rem', padding: '0 5px' }}>Búsqueda avanzada</legend>
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--texto-secundario)' }}>Contraparte:</label>
          <input type="text" placeholder="Buscar por correo..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }} />
        </div>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--texto-secundario)' }}>Tipo:</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px' }}>
            <option value="todas">Todas</option>
            <option value="transferencia">Transferencias</option>
            <option value="deposito">Depósitos</option>
            <option value="retiro">Retiros</option>
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--texto-secundario)' }}>Fecha:</label>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} style={{ width: '100%', padding: '7px', backgroundColor: 'var(--bg-interior)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="button" onClick={handleLimpiarFiltros} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-tarjeta)', color: 'var(--texto-principal)', border: '1px solid var(--borde-color)', borderRadius: '4px', cursor: 'pointer' }}>Limpiar</button>
        </div>
      </fieldset>
      {movimientosFiltrados.length === 0 ? (
        <p style={{ color: 'var(--texto-secundario)', textAlign: 'center', fontStyle: 'italic' }}>No se encontraron movimientos.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movimientosFiltrados.map((mov) => {
            const esIngreso = mov.receptorEmail === usuarioActual.email;
            let tituloOperacion = mov.tipo === 'deposito' ? 'Depósito en Cajero' : mov.tipo === 'retiro' ? 'Retiro en Cajero' : esIngreso ? 'Transferencia Recibida' : 'Transferencia Enviada';
            return (
              <li key={mov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '10px', backgroundColor: 'var(--bg-interior)', borderRadius: '6px', borderLeft: `4px solid ${esIngreso ? '#3fb950' : '#f85149'}` }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: 'var(--texto-principal)' }}>{tituloOperacion}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--texto-secundario)' }}>{esIngreso ? `De: ${mov.emisorEmail}` : `Para: ${mov.receptorEmail}`}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--texto-secundario)' }}>{new Date(mov.fecha).toLocaleString('es-CL')}</p>
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