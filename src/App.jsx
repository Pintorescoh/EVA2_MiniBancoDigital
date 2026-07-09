import { useState, useEffect, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { usuario, cargando } = useContext(AuthContext);

  const [tema, setTema] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('theme', tema);
  }, [tema]);

  const toggleTema = () => {
    setTema((temaAnterior) => (temaAnterior === 'dark' ? 'light' : 'dark'));
  };

  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sistema central...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px', backgroundColor: 'var(--bg-principal)' }}>
      
      {/* NAVEGACIÓN PRINCIPAL (Navbar) */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 5%', 
        backgroundColor: 'var(--bg-tarjeta)',
        borderBottom: '1px solid var(--borde-color)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        
        {/* Agrupación de Logo y Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo SVG de alto rendimiento */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <path d="m15 9-6 6"></path>
            <path d="m9 9 6 6"></path>
          </svg>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: '800', 
            color: 'var(--texto-principal)',
            letterSpacing: '-0.5px'
          }}>
            XBank
          </h1>
        </div>

        {/* Botón de Tema optimizado */}
        <button 
          onClick={toggleTema}
          style={{
            backgroundColor: 'var(--bg-interior)',
            color: 'var(--texto-principal)',
            border: '1px solid var(--borde-color)',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          {tema === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </nav>

      {/* CONTENIDO DE LA APLICACIÓN */}
      <main style={{ padding: '0 20px', marginTop: '40px' }}>
        {usuario ? (
          <Dashboard />
        ) : (
          <Login />
        )}
      </main>
      
    </div>
  );
}

export default App;