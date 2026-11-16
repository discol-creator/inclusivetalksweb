// Comprueba la credencial de una escarapela. La usa /validar cuando alguien escanea el QR.
// Va por POST: así el documento no queda en la URL ni en los registros del servidor.

import { verificar } from './_firma.mjs';

const ETIQUETAS = { asistente: 'Asistente', ponente: 'Ponente' };

const MOTIVOS = {
  'sin-clave': 'La validación no está configurada. Escríbenos y lo revisamos.',
  firma: 'Esta escarapela no la emitimos nosotros, o el código está alterado.',
  version: 'Esta escarapela es de una versión anterior. Pide una nueva.',
  formato: 'El código del QR no se entiende. Vuelve a escanearlo.'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ valido: false, mensaje: 'Método no permitido.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; }
  }

  const resultado = verificar((cuerpo || {}).credencial);
  if (!resultado.valido) {
    // Sin datos personales en el log: solo por qué falló.
    console.error('Escarapela rechazada:', resultado.motivo);
    return res.status(200).json({
      valido: false,
      mensaje: MOTIVOS[resultado.motivo] || MOTIVOS.formato
    });
  }

  return res.status(200).json({
    valido: true,
    tipo: ETIQUETAS[resultado.tipo] || resultado.tipo,
    documento: resultado.documento
  });
}
