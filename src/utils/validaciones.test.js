import { describe, it, expect } from 'vitest';
import { validarTransferencia } from './validaciones';

describe('Lógica pura: validarTransferencia (con it.each)', () => {
  const saldo = 50000;
  const origen = 'yo@banco.cl';

  // Matriz de casos de prueba: [monto, destino, esperadoValido, esperadoError]
  const casosDePrueba = [
    [0, 'destino@banco.cl', false, 'El monto debe ser mayor a $0.'],
    [-5000, 'destino@banco.cl', false, 'El monto debe ser mayor a $0.'],
    [60000, 'destino@banco.cl', false, 'Saldo insuficiente.'],
    [10000, origen, false, 'No puedes transferir a tu cuenta.'],
    [10000, '', false, 'Correo de destinatario inválido.'],
    [10000, 'sin-arroba', false, 'Correo de destinatario inválido.'],
    [15000, 'amigo@banco.cl', true, null], // Caso feliz
  ];

  it.each(casosDePrueba)(
    'con monto %i y destino %s -> retorna valido: %s',
    (monto, destino, esperadoValido, esperadoError) => {
      const resultado = validarTransferencia(monto, saldo, destino, origen);
      expect(resultado.valido).toBe(esperadoValido);
      expect(resultado.error).toBe(esperadoError);
    }
  );
});