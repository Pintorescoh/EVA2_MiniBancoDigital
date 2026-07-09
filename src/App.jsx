import { useState, useEffect, useContext } from 'react';
// Importamos la burbuja global
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // Extraemos los datos centralizados
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
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px' }}>
        <button 
          onClick={toggleTema}
          style={{
            backgroundColor: 'var(--bg-tarjeta)',
            color: 'var(--texto-principal)',
            border: '1px solid var(--borde-color)',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}
        >
          {tema === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </header>

      <h1 style={{ textAlign: 'center', color: '#58a6ff', marginTop: '10px' }}>Mini Banco Digital - XBank</h1>
      
      {/* Ya no le pasamos el usuario al Dashboard */}
      {usuario ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;