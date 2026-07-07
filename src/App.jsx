// src/App.jsx
import Login from './components/Login';

function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', color: '#58a6ff' }}>Mini Banco Digital - XBank</h1>
      
      {/* Aquí estamos renderizando (mostrando) nuestro nuevo componente */}
      <Login />
    </div>
  )
}

export default App;