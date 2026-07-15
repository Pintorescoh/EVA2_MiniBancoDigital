// src/components/Login.jsx
import { useState } from 'react';
// 1. Importamos nuestras llaves maestras y las funciones de Firebase
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Nuevos estados para la interfaz
  const [isRegistering, setIsRegistering] = useState(false); // Para alternar entre Login y Registro
  const [error, setError] = useState(null); // Para guardar y mostrar mensajes de error

  const handleEmailChange = (evento) => setEmail(evento.target.value);
  const handlePasswordChange = (evento) => setPassword(evento.target.value);

  // 3. Agregamos "async" porque la comunicación con la nube toma tiempo (asíncrona)
  const handleSubmit = async (evento) => {
    evento.preventDefault(); 
    setError(null); // Limpiamos errores antiguos antes de intentar de nuevo
    
    try {
      if (isRegistering) {
        // LÓGICA DE REGISTRO
        // Le pedimos a Firebase Auth que cree el usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // RF1: Al registrarse, creamos su documento en la base de datos (Firestore) con el saldo inicial
        // Usamos el ID único del usuario (user.uid) como nombre del documento por seguridad
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          saldo: 100000
        });
        
        console.log("¡Cuenta creada y saldo asignado!");
      } else {
        // LÓGICA DE INICIO DE SESIÓN
        await signInWithEmailAndPassword(auth, email, password);
        console.log("¡Inicio de sesión exitoso!");
      }
    } catch (errorFirebase) {
      // Si Firebase rechaza la operación (ej. contraseña muy corta, o usuario no existe), lo atrapamos aquí
      console.error(errorFirebase);
      setError("Hubo un error: Verifica tus datos o intenta con una contraseña de al menos 6 caracteres.");
    }
  };

  return (
    <div style={{ border: '1px solid #30363d', padding: '20px', borderRadius: '8px', maxWidth: '400px', margin: '20px auto' }}>
      <h2>{isRegistering ? 'Crear Cuenta' : 'Ingresar a XBank'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          {/* 1. Agregamos htmlFor="email" */}
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            id="email" // <-- 2. Agregamos id="email"
            type="email" 
            value={email} 
            onChange={handleEmailChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          {/* 3. Agregamos htmlFor="password" */}
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input 
            id="password" // <-- 4. Agregamos id="password"
            type="password" 
            value={password} 
            onChange={handlePasswordChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {/* Si hay un error, lo mostramos en color rojo */}
        {error && <p style={{ color: '#f85149', fontSize: '0.9rem' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer', width: '100%', marginBottom: '10px', backgroundColor: '#58a6ff', color: '#0d1117', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
        </button>
      </form>

      {/* Botón para cambiar entre modo Login y Registro */}
      <button 
        onClick={() => setIsRegistering(!isRegistering)}
        style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', width: '100%', textDecoration: 'underline' }}
      >
        {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  );
}