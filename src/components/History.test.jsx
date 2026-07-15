import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Historial from './History';
import { AuthContext } from '../context/AuthContext';
import { onSnapshot } from 'firebase/firestore';

// 1. Mockeamos la configuración de Firebase
vi.mock('../firebase/config', () => ({
  db: {}
}));

// 2. Mockeamos las funciones de Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  or: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(), // Esta es la función clave a secuestrar
}));

// Preparamos un usuario falso para el contexto
const mockUsuario = { uid: '123', email: 'yo@banco.cl' };

// Función auxiliar para envolver el componente en su "burbuja" de AuthContext
const renderConContexto = (componente) => {
  return render(
    <AuthContext.Provider value={{ usuario: mockUsuario }}>
      {componente}
    </AuthContext.Provider>
  );
};

describe('Componente: Historial', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga inicial', () => {
    // Hacemos que onSnapshot no devuelva datos de inmediato
    onSnapshot.mockImplementation(() => {
      return vi.fn(); // Retorna función de limpieza (unsubscribe)
    });

    renderConContexto(<Historial />);
    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
  });

  it('muestra mensaje amigable cuando no hay movimientos', () => {
    // Simulamos que Firebase responde con un arreglo vacío
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn(); 
    });

    renderConContexto(<Historial />);
    expect(screen.getByText('No hay registros.')).toBeInTheDocument();
  });

  it('renderiza ingresos y egresos con los colores y signos correctos', () => {
    // Simulamos dos transacciones en la base de datos
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: [
          {
            id: 'mov1',
            data: () => ({
              tipo: 'transferencia',
              monto: 15000,
              emisorEmail: 'amigo@banco.cl',
              receptorEmail: 'yo@banco.cl', // Alguien ME transfirió (Ingreso)
              fecha: '2026-07-10T10:00:00'
            })
          },
          {
            id: 'mov2',
            data: () => ({
              tipo: 'retiro',
              monto: 5000,
              emisorEmail: 'yo@banco.cl', // YO retiré (Egreso)
              receptorEmail: 'cajero',
              fecha: '2026-07-11T10:00:00'
            })
          }
        ]
      });
      return vi.fn();
    });

    renderConContexto(<Historial />);

    // Verificamos el ingreso (+)
    expect(screen.getByText('+$15.000')).toBeInTheDocument();
    expect(screen.getByText('amigo@banco.cl')).toBeInTheDocument();

    // Verificamos el egreso (-)
    expect(screen.getByText('-$5.000')).toBeInTheDocument();
  });

  it('filtra los movimientos por texto de contraparte', async () => {
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        docs: [
          {
            id: 'mov1',
            data: () => ({
              tipo: 'transferencia',
              monto: 15000,
              emisorEmail: 'amigo@banco.cl',
              receptorEmail: 'yo@banco.cl',
              fecha: '2026-07-10T10:00:00'
            })
          },
          {
            id: 'mov2',
            data: () => ({
              tipo: 'transferencia',
              monto: 5000,
              emisorEmail: 'yo@banco.cl',
              receptorEmail: 'jefe@banco.cl',
              fecha: '2026-07-11T10:00:00'
            })
          }
        ]
      });
      return vi.fn();
    });

    renderConContexto(<Historial />);

    // Ambos correos deben estar visibles inicialmente
    expect(screen.getByText('amigo@banco.cl')).toBeInTheDocument();
    expect(screen.getByText('jefe@banco.cl')).toBeInTheDocument();

    // Act: Escribimos en el buscador
    const inputBusqueda = screen.getByPlaceholderText('Buscar contraparte...');
    await user.type(inputBusqueda, 'jefe');

    // Assert: Solo 'jefe' debería estar visible
    expect(screen.getByText('jefe@banco.cl')).toBeInTheDocument();
    expect(screen.queryByText('amigo@banco.cl')).not.toBeInTheDocument();
  });
});