export const validarTransferencia = (monto, saldoActual, emailDestino, emailOrigen) => {
  const montoNum = Number(monto);

  if (isNaN(montoNum) || montoNum <= 0) {
    return { valido: false, error: 'El monto debe ser mayor a $0.' };
  }
  if (montoNum > saldoActual) {
    return { valido: false, error: 'Saldo insuficiente.' };
  }
  if (!emailDestino || !emailDestino.includes('@')) {
    return { valido: false, error: 'Correo de destinatario inválido.' };
  }
  if (emailDestino === emailOrigen) {
    return { valido: false, error: 'No puedes transferir a tu cuenta.' };
  }

  return { valido: true, error: null };
};