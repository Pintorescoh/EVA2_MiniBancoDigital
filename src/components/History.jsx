// src/components/History.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, or, where, onSnapshot } from 'firebase/firestore';

export default function History({ usuarioActual }) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados completamente controlados para los tres filtros obligatorios
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState(''); // Formato: YYYY-MM-DD

  useEffect(() => {
    const movRef = collection(db, "movimientos");
    const consulta = query(
      movRef,
      or(
        where("emisorUid", "==", usuarioActual.uid),
        where("receptorEmail", "==", usuarioActual.email)
      )
    );

    const unsubscribe = onSnapshot(consulta, (snapshot) => {
      const historial = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setMovimientos(historial);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [usuarioActual.uid, usuarioActual.email]);

  // Lógica de filtrado combinada para los tres criterios
  const movimientosFiltrados = movimientos.filter((mov) => {
    // 1. Filtro por Tipo de operación
    const pasaFiltroTipo = filtroTipo === 'todas' || mov.tipo === filtroTipo;

    // 2. Filtro por Contraparte (Búsqueda por texto en correos)
    const esIngreso = mov.receptorEmail === usuarioActual.email;
    const contraparte = esIngreso ? mov.emisorEmail : mov.receptorEmail;
    const pasaFiltroTexto = contraparte.toLowerCase().includes(filtroTexto.toLowerCase());

   // 3. Filtro por Fecha (Ajustado a la zona horaria local)
    const fechaObjeto = new Date(mov.fecha);
    // Formateamos manualmente a YYYY-MM-DD según la hora local del navegador
    const fechaLocalMovimiento = `${fechaObjeto.getFullYear()}-${String(fechaObjeto.getMonth() + 1).padStart(2, '0')}-${String(fechaObjeto.getDate()).padStart(2, '0')}`;
    
    const pasaFiltroFecha = !filtroFecha || fechaLocalMovimiento === filtroFecha;
    // El documento debe cumplir los tres criterios simultáneamente
    return pasaFiltroTipo && pasaFiltroTexto && pasaFiltroFecha;
  });

  // Función limpiadora para restablecer la búsqueda
  const handleLimpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroTipo('todas');
    setFiltroFecha('');
  };

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '20px' }}>Cargando historial...</div>;

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
      <h3>Últimos Movimientos</h3>
      
      {/* Contenedor semántico de filtros */}
      <fieldset style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', backgroundColor: '#0d1117', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <legend style={{ color: '#8b949e', fontSize: '0.85rem', padding: '0 5px' }}>Búsqueda avanzada</legend>
        
        {/* Filtro 1: Contraparte */}
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#8b949e' }}>Contraparte:</label>
          <input 
            type="text" 
            placeholder="Buscar por correo..." 
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filtro 2: Tipo de Operación */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#8b949e' }}>Tipo:</label>
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ width: '100%', padding: '8px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px' }}
          >
            <option value="todas">Todas</option>
            <option value="transferencia">Transferencias</option>
            <option value="deposito">Depósitos</option>
            <option value="retiro">Retiros</option>
          </select>
        </div>

        {/* Filtro 3: Fecha específica */}
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#8b949e' }}>Fecha:</label>
          <input 
            type="date" 
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            style={{ width: '100%', padding: '7px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Botón auxiliar para restablecer */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            type="button" 
            onClick={handleLimpiarFiltros}
            style={{ padding: '8px 12px', backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
          >
            Limpiar
          </button>
        </div>
      </fieldset>

      {movimientosFiltrados.length === 0 ? (
        <p style={{ color: '#8b949e', textAlign: 'center', fontStyle: 'italic' }}>
          No se encontraron movimientos con los criterios seleccionados.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movimientosFiltrados.map((mov) => {
            const esIngreso = mov.receptorEmail === usuarioActual.email;
            
            let tituloOperacion = '';
            if (mov.tipo === 'deposito') tituloOperacion = 'Depósito en Cajero';
            else if (mov.tipo === 'retiro') tituloOperacion = 'Retiro en Cajero';
            else tituloOperacion = esIngreso ? 'Transferencia Recibida' : 'Transferencia Enviada';

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
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{tituloOperacion}</p>
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