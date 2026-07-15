import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// 1. Mockeamos la configuración de Firebase
vi.mock('../firebase/config', () => ({
  auth: {},
  db: {}
}));

// 2. Mockeamos las funciones de Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

// 3. Mockeamos las funciones de Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn()
}));

describe('Componente: Login', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks(); // Limpia el historial de los espías entre pruebas
  });

  it('renderiza el formulario de inicio de sesión por defecto', () => {
    render(<Login />);
    
    expect(screen.getByRole('heading', { name: 'Ingresar a XBank' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  it('alterna entre el modo Login y Registro', async () => {
    render(<Login />);
    
    const toggleButton = screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' });
    
    // Cambiar a registro
    await user.click(toggleButton);
    expect(screen.getByRole('heading', { name: 'Crear Cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();

    // Volver a login
    await user.click(screen.getByRole('button', { name: '¿Ya tienes cuenta? Inicia sesión' }));
    expect(screen.getByRole('heading', { name: 'Ingresar a XBank' })).toBeInTheDocument();
  });

  it('llama a signInWithEmailAndPassword al enviar el formulario en modo login', async () => {
    render(<Login />);
    
    await user.type(screen.getByLabelText(/Email:/i), 'usuario@banco.cl');
    await user.type(screen.getByLabelText(/Contraseña:/i), '123456');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Verificamos que Firebase fue llamado con los datos correctos
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'usuario@banco.cl', '123456');
  });

  it('llama a createUserWithEmailAndPassword y crea el documento en BD al registrarse', async () => {
    // Simulamos que Firebase devuelve un usuario exitosamente
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: '999', email: 'nuevo@banco.cl' }
    });

    render(<Login />);
    
    // Cambiamos a registro y llenamos datos
    await user.click(screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' }));
    await user.type(screen.getByLabelText(/Email:/i), 'nuevo@banco.cl');
    await user.type(screen.getByLabelText(/Contraseña:/i), '123456');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    await waitFor(() => {
      // Verificamos creación de usuario
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'nuevo@banco.cl', '123456');
      // Verificamos que se asignó el saldo inicial en Firestore
      expect(setDoc).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra un mensaje de error si Firebase rechaza la operación', async () => {
    // Simulamos un rechazo de Firebase (ej. contraseña incorrecta)
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    render(<Login />);
    
    await user.type(screen.getByLabelText(/Email:/i), 'error@banco.cl');
    await user.type(screen.getByLabelText(/Contraseña:/i), 'mala');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // El componente debe mostrar el mensaje de error en pantalla
    expect(await screen.findByText(/Hubo un error: Verifica tus datos/i)).toBeInTheDocument();
  });
});