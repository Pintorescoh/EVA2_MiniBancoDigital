// src/components/TransferForm.test.jsx
import '@testing-library/jest-dom'; // Habilitamos los superpoderes localmente
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransferForm from './TransferForm';
import { AuthContext } from '../context/AuthContext';
import { realizarTransferenciaBD } from '../services/transferencias';

// RT5: Mockeamos la capa de servicios. 
// Esto evita que el test intente conectarse a Firebase real.
vi.mock('../services/transferencias', () => ({
  realizarTransferenciaBD: vi.fn(), // vi.fn() es un "espía" que registra si fue llamado
}));

// Preparar datos falsos para engañar al AuthContext
const mockUsuario = { email: 'yo@banco.cl', uid: '123' };
const mockSaldoActual = 50000;

// Función auxiliar para renderizar el componente envuelto en su Contexto
const renderizarFormulario = () => {
  return render(
    <AuthContext.Provider value={{ usuario: mockUsuario }}>
      <TransferForm saldoActual={mockSaldoActual} />
    </AuthContext.Provider>
  );
};

describe('Componente: TransferForm', () => {
  const user = userEvent.setup(); // Inicializamos el simulador de usuario

  beforeEach(() => {
    vi.clearAllMocks(); // Limpiamos la memoria del espía antes de cada test
  });

  it('renderiza los campos y el botón de enviar', () => {
    renderizarFormulario();
    
    // Verificamos que lo visual exista
    expect(screen.getByPlaceholderText('Correo del destinatario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Monto a transferir (Ej: 15000)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar Transferencia/i })).toBeInTheDocument();
  });

  it('muestra error al ingresar un monto inválido y NO llama al servicio', async () => {
    renderizarFormulario();

    // Act: El usuario escribe y envía el formulario
    await user.type(screen.getByPlaceholderText('Correo del destinatario'), 'destino@banco.cl');
    await user.type(screen.getByPlaceholderText('Monto a transferir (Ej: 15000)'), '0'); // Monto inválido
    await user.click(screen.getByRole('button', { name: /Confirmar Transferencia/i }));

    // Assert: Verificamos el mensaje y que la BD jamás fue tocada
    expect(await screen.findByText('El monto debe ser mayor a $0.')).toBeInTheDocument();
    expect(realizarTransferenciaBD).not.toHaveBeenCalled();
  });

  it('llama al servicio mockeado con datos válidos y deshabilita el botón mientras procesa', async () => {
    // Configuramos el mock para que simule una respuesta exitosa, pero con un ligero retraso
    realizarTransferenciaBD.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderizarFormulario();

    // Act
    await user.type(screen.getByPlaceholderText('Correo del destinatario'), 'destino@banco.cl');
    await user.type(screen.getByPlaceholderText('Monto a transferir (Ej: 15000)'), '15000');
    
    const boton = screen.getByRole('button', { name: /Confirmar Transferencia/i });
    await user.click(boton);

    // Assert: Verificamos el estado de "Carga" (doble submit prevenido)
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent('Procesando...');

    // Assert: Verificamos que el espía fue llamado exactamente 1 vez con los datos correctos
    await waitFor(() => {
      expect(realizarTransferenciaBD).toHaveBeenCalledTimes(1);
      expect(realizarTransferenciaBD).toHaveBeenCalledWith(15000, 50000, 'destino@banco.cl', mockUsuario);
    });

    // Assert: Verificamos el éxito final
    expect(await screen.findByText('¡$15.000 transferidos!')).toBeInTheDocument();
  });

  it('muestra error si el servicio mockeado falla (ej. usuario no existe)', async () => {
    // Configuramos el mock para que rechace con un error simulado
    realizarTransferenciaBD.mockRejectedValueOnce(new Error('Usuario no encontrado en XBank.'));

    renderizarFormulario();

    // Act
    await user.type(screen.getByPlaceholderText('Correo del destinatario'), 'fantasma@banco.cl');
    await user.type(screen.getByPlaceholderText('Monto a transferir (Ej: 15000)'), '10000');
    await user.click(screen.getByRole('button', { name: /Confirmar Transferencia/i }));

    // Assert: Verificamos que la interfaz maneja el error del servidor
    expect(await screen.findByText('Usuario no encontrado en XBank.')).toBeInTheDocument();
  });
});