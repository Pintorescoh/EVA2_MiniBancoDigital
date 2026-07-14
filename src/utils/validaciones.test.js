import { describe, it, expect } from 'vitest';
import { validarTransferencia } from './validaciones';

describe('Lógica pura: validarTransferencia', () => {

  it('rechaza montos negativos o iguales a cero', () => {
    const saldo = 50000;
    const origen = 'yo@banco.cl';
    const destino = 'otro@banco.cl';

    const resultadoCero = validarTransferencia(0, saldo, destino, origen);
    const resultadoNegativo = validarTransferencia(-10000, saldo, destino, origen);

    expect(resultadoCero.valido).toBe(false);
    expect(resultadoCero.error).toBe('El monto debe ser mayor a $0.');
    expect(resultadoNegativo.valido).toBe(false);
  });

  it('rechaza la transferencia si el monto es mayor al saldo disponible', () => {
    const resultado = validarTransferencia(15000, 10000, 'destino@banco.cl', 'yo@banco.cl');
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe('Saldo insuficiente.');
  });

  it('rechaza las transferencias a uno mismo', () => {
    const resultado = validarTransferencia(5000, 10000, 'yo@banco.cl', 'yo@banco.cl');
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe('No puedes transferir a tu cuenta.');
  });

  it('rechaza correos de destinatario vacíos o inválidos', () => {
    const resultadoVacio = validarTransferencia(5000, 10000, '', 'yo@banco.cl');
    const resultadoInvalido = validarTransferencia(5000, 10000, 'correo-sin-arroba', 'yo@banco.cl');

    expect(resultadoVacio.valido).toBe(false);
    expect(resultadoInvalido.valido).toBe(false);
    expect(resultadoInvalido.error).toBe('Correo de destinatario inválido.');
  });

  it('acepta la transferencia (caso feliz) cuando todos los datos son válidos', () => {
    const resultado = validarTransferencia(5000, 10000, 'amigo@banco.cl', 'yo@banco.cl');
    expect(resultado.valido).toBe(true);
    expect(resultado.error).toBe(null);
  });
});