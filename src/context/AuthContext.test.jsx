// src/context/AuthContext.test.jsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './AuthContext';
import { onAuthStateChanged } from 'firebase/auth';

// RT5: Mockeamos los módulos de Firebase
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebase/config', () => ({
  auth: {}, // Un objeto vacío basta para engañar a la configuración
}));

// Creamos un "Componente Consumidor" falso para poder leer qué hay dentro del Contexto
const ComponentePrueba = () => {
  const { usuario, cargando } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="estado-cargando">{cargando ? 'Cargando' : 'Listo'}</span>
      <span data-testid="estado-usuario">{usuario ? usuario.email : 'Nadie'}</span>
    </div>
  );
};

describe('Contexto: AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Limpiamos la memoria entre cada prueba
  });

  it('inicializa con el usuario en null y estado de carga', () => {
    onAuthStateChanged.mockImplementation(() => {
      return () => {}; // Función de limpieza (unsubscribe)
    });

    render(
      <AuthProvider>
        <ComponentePrueba />
      </AuthProvider>
    );

    expect(screen.getByTestId('estado-cargando')).toHaveTextContent('Cargando');
    expect(screen.getByTestId('estado-usuario')).toHaveTextContent('Nadie');
  });

  it('ejecuta la acción LOGIN cuando Firebase detecta una sesión activa', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ email: 'usuario@banco.cl', uid: '123' });
      return () => {}; 
    });

    render(
      <AuthProvider>
        <ComponentePrueba />
      </AuthProvider>
    );

    expect(screen.getByTestId('estado-cargando')).toHaveTextContent('Listo');
    expect(screen.getByTestId('estado-usuario')).toHaveTextContent('usuario@banco.cl');
  });

  it('ejecuta la acción LOGOUT cuando Firebase detecta que no hay sesión', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <ComponentePrueba />
      </AuthProvider>
    );

    expect(screen.getByTestId('estado-cargando')).toHaveTextContent('Listo');
    expect(screen.getByTestId('estado-usuario')).toHaveTextContent('Nadie');
  });

  // BONUS: Este bloque ahora está correctamente posicionado fuera del anterior
  it('limpia la suscripción (unsubscribe) al desmontar el componente (Bonus)', () => {
    // 1. Creamos una función espía falsa
    const mockUnsubscribe = vi.fn();
    
    // 2. Le decimos al mock de Firebase que DEVUELVA esa función espía
    onAuthStateChanged.mockReturnValue(mockUnsubscribe);

    // 3. Renderizamos el contexto
    const { unmount } = render(
      <AuthProvider>
        <ComponentePrueba />
      </AuthProvider>
    );

    // 4. Act: Forzamos que el componente se destruya (desmontar)
    unmount();

    // 5. Assert: Verificamos que React llamó a nuestra función de limpieza
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});