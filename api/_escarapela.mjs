// Escarapela de asistente · Inclusive Talks Medellín 2026
// Reproduce docs/escarapela-asistente.html como PNG de 800 × 1200 px (diseño de 400 × 600 a 2x).
// El prefijo "_" evita que Vercel la publique como ruta: es un módulo interno.

import { readFileSync } from 'node:fs';
import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

const ESCALA = 2;                 // el diseño mide 400 × 600; se exporta a 2x para impresión
const ANCHO = 400 * ESCALA;
const ALTO = 600 * ESCALA;

const AZUL = '#0EA5E9';
const TINTA = '#1A1A1A';
const GRIS = '#595959';
const FONDO = '#F2F8FC';

const s = (n) => n * ESCALA;      // convierte medidas del diseño a píxeles finales

/* ---------- Fuentes ---------- */
// Subconjunto latino descargado de Google Fonts (incluye tildes y ñ).
const fuente = (archivo) => readFileSync(new URL(`./fonts/${archivo}`, import.meta.url));

const POPPINS_700 = fuente('Poppins-Bold.ttf');
const POPPINS_800 = fuente('Poppins-ExtraBold.ttf');
const INTER_400 = fuente('Inter-Regular.ttf');
const INTER_600 = fuente('Inter-SemiBold.ttf');

const FUENTES = [
  { name: 'Poppins', data: POPPINS_700, weight: 700, style: 'normal' },
  { name: 'Poppins', data: POPPINS_800, weight: 800, style: 'normal' },
  { name: 'Inter', data: INTER_400, weight: 400, style: 'normal' },
  { name: 'Inter', data: INTER_600, weight: 500, style: 'normal' },
  { name: 'Inter', data: INTER_600, weight: 600, style: 'normal' }
];

/* ---------- Medición del nombre ----------
   Anchos de avance reales de Poppins ExtraBold (em por carácter), extraídos del .ttf.
   Sirven para partir el nombre en máximo dos líneas y reducir el tamaño si no cabe. */
const ANCHOS = {" ":0.191,"!":0.423,"\"":0.451,"#":0.919,"$":0.661,"%":0.904,"&":0.814,"'":0.243,"(":0.47,")":0.47,"*":0.548,"+":0.589,",":0.314,"-":0.578,".":0.301,"/":0.426,"0":0.657,"1":0.387,"2":0.569,"3":0.61,"4":0.691,"5":0.655,"6":0.635,"7":0.523,"8":0.653,"9":0.606,":":0.302,";":0.366,"<":0.524,"=":0.661,">":0.519,"?":0.538,"@":1.104,"A":0.755,"B":0.671,"C":0.758,"D":0.735,"E":0.548,"F":0.561,"G":0.757,"H":0.743,"I":0.308,"J":0.584,"K":0.726,"L":0.491,"M":0.935,"N":0.765,"O":0.787,"P":0.636,"Q":0.788,"R":0.661,"S":0.62,"T":0.604,"U":0.712,"V":0.747,"W":1.076,"X":0.739,"Y":0.701,"Z":0.613,"[":0.522,"\\":0.84,"]":0.521,"^":0.733,"_":0.772,"`":0.307,"a":0.68,"b":0.68,"c":0.607,"d":0.68,"e":0.616,"f":0.373,"g":0.68,"h":0.686,"i":0.308,"j":0.307,"k":0.647,"l":0.308,"m":1.067,"n":0.686,"o":0.636,"p":0.68,"q":0.68,"r":0.447,"s":0.568,"t":0.421,"u":0.686,"v":0.649,"w":0.885,"x":0.628,"y":0.655,"z":0.507,"{":0.492,"|":0.277,"}":0.492,"~":0.674,"Á":0.755,"À":0.755,"Ä":0.755,"Â":0.755,"Ã":0.755,"É":0.548,"È":0.548,"Ë":0.548,"Ê":0.548,"Í":0.308,"Ì":0.308,"Ï":0.308,"Î":0.308,"Ó":0.787,"Ò":0.787,"Ö":0.787,"Ô":0.787,"Õ":0.787,"Ú":0.712,"Ù":0.712,"Ü":0.712,"Û":0.712,"Ñ":0.765,"Ç":0.758,"á":0.68,"à":0.68,"ä":0.68,"â":0.68,"ã":0.68,"é":0.616,"è":0.616,"ë":0.616,"ê":0.616,"í":0.347,"ì":0.347,"ï":0.347,"î":0.347,"ó":0.636,"ò":0.636,"ö":0.636,"ô":0.636,"õ":0.636,"ú":0.686,"ù":0.686,"ü":0.686,"û":0.686,"ñ":0.686,"ç":0.607,"’":0.346,"‘":0.346,"“":0.595,"”":0.595,"–":0.689,"—":0.933,"·":0.324};
const ANCHO_POR_DEFECTO = 0.68;

function anchoTexto(texto, tamano) {
  let em = 0;
  for (const caracter of texto) em += ANCHOS[caracter] ?? ANCHO_POR_DEFECTO;
  return em * tamano;
}

// Reparte las palabras en líneas sin pasarse del ancho disponible.
function repartirEnLineas(nombre, tamano, anchoMaximo) {
  const lineas = [];
  let actual = '';
  for (const palabra of nombre.split(/\s+/).filter(Boolean)) {
    const propuesta = actual ? `${actual} ${palabra}` : palabra;
    if (actual && anchoTexto(propuesta, tamano) > anchoMaximo) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = propuesta;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// Busca el tamaño más grande con el que el nombre quepa en dos líneas como máximo.
function ajustarNombre(nombre, anchoMaximo) {
  const tamanos = [s(28), s(25), s(22), s(20), s(18), s(16), s(14)];
  for (const tamano of tamanos) {
    const lineas = repartirEnLineas(nombre, tamano, anchoMaximo);
    const cabe = lineas.length <= 2 && lineas.every((l) => anchoTexto(l, tamano) <= anchoMaximo);
    if (cabe) return { tamano, lineas };
  }
  // Caso extremo (una sola palabra larguísima): se encoge hasta que la línea más ancha quepa.
  const minimo = tamanos[tamanos.length - 1];
  const lineas = repartirEnLineas(nombre, minimo, anchoMaximo).slice(0, 2);
  const masAncha = Math.max(...lineas.map((linea) => anchoTexto(linea, minimo)));
  const factor = masAncha > anchoMaximo ? anchoMaximo / masAncha : 1;
  return { tamano: Math.floor(minimo * factor), lineas };
}

/* ---------- Elementos (satori usa objetos con la forma de un elemento de React) ---------- */
const el = (type, style = {}, children = undefined) => ({ type, props: { style, children } });
const texto = (style, contenido) => el('div', { display: 'flex', ...style }, contenido);
const svgEnLinea = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// Patrón de puntos: el diseño lo hace con radial-gradient; aquí se dibuja punto por punto.
function puntos({ ancho, alto, posicion }) {
  const paso = s(15);
  const radio = s(2.8);
  const primero = s(15.5);           // centro del primer punto dentro de su celda
  const hijos = [];
  for (let cx = primero; cx + radio <= ancho; cx += paso) {
    for (let cy = primero; cy + radio <= alto; cy += paso) {
      hijos.push(el('div', {
        position: 'absolute',
        left: cx - radio,
        top: cy - radio,
        width: radio * 2,
        height: radio * 2,
        borderRadius: radio,
        backgroundColor: AZUL
      }));
    }
  }
  return el('div', { position: 'absolute', display: 'flex', width: ancho, height: alto, ...posicion }, hijos);
}

function icono({ svg, etiqueta, ancho, alto }) {
  return el('div', {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: s(6)
  }, [
    el('div', {
      display: 'flex', width: s(42), height: s(42), borderRadius: s(21),
      backgroundColor: 'rgba(26,26,26,0.055)', alignItems: 'center', justifyContent: 'center'
    }, [{ type: 'img', props: { src: svgEnLinea(svg), width: ancho, height: alto, style: {} } }]),
    texto({
      fontFamily: 'Inter', fontWeight: 600, fontSize: s(9), letterSpacing: s(9) * 0.06,
      color: GRIS
    }, etiqueta)
  ]);
}

const ICONOS = [
  {
    etiqueta: 'CURIOSIDADES',
    ancho: s(20), alto: s(20),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${s(20)}" height="${s(20)}" viewBox="0 0 28 28" fill="none"><circle cx="13" cy="15" r="9" stroke="${AZUL}" stroke-width="2.4"/><circle cx="19" cy="7" r="3.2" fill="${AZUL}"/></svg>`
  },
  {
    etiqueta: 'TIPS',
    ancho: s(18), alto: s(20),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${s(18)}" height="${s(20)}" viewBox="0 0 28 30" fill="none"><rect x="3" y="17" width="5" height="8" rx="1.5" fill="#D9DCDF"/><rect x="11.5" y="12" width="5" height="13" rx="1.5" fill="#7DD3FC"/><rect x="20" y="5" width="5" height="20" rx="1.5" fill="${AZUL}"/><circle cx="22.5" cy="2.5" r="2.4" fill="${TINTA}"/></svg>`
  },
  {
    etiqueta: 'DEBATE',
    ancho: s(24), alto: s(10),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${s(24)}" height="${s(10)}" viewBox="0 0 32 12" fill="none"><circle cx="4" cy="6" r="4" fill="${TINTA}"/><rect x="10" y="5" width="12" height="2" rx="1" fill="#D9DCDF"/><circle cx="28" cy="6" r="4" fill="${AZUL}"/></svg>`
  }
];

/* ---------- Escarapela completa ---------- */
function plantilla({ nombre, organizacion, codigo, qr }) {
  const anchoContenido = ANCHO - s(32) * 2;
  const { tamano, lineas } = ajustarNombre(nombre, anchoContenido);

  const contenido = [
    // Logotipo
    el('div', {
      display: 'flex', fontFamily: 'Poppins', fontWeight: 800, fontSize: s(20), marginBottom: s(14)
    }, [
      texto({ color: AZUL }, 'i'),
      texto({ color: TINTA }, 'nclusive talks'),
      texto({ color: AZUL }, '.')
    ]),

    // Distintivo "Asistente"
    texto({
      padding: `${s(6)}px ${s(18)}px`, borderRadius: s(999), border: `${s(1.5)}px solid ${TINTA}`,
      color: TINTA, fontFamily: 'Poppins', fontWeight: 700, fontSize: s(12),
      letterSpacing: s(12) * 0.08, marginBottom: s(28)
    }, 'ASISTENTE'),

    // Nombre (una o dos líneas)
    el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginBottom: organizacion ? s(6) : s(24)
    }, lineas.map((linea) => texto({
      fontFamily: 'Poppins', fontWeight: 800, fontSize: tamano, color: TINTA, lineHeight: 1.15
    }, linea)))
  ];

  // La línea de organización se oculta cuando viene vacía.
  if (organizacion) {
    contenido.push(texto({
      fontFamily: 'Inter', fontWeight: 500, fontSize: s(14), color: GRIS,
      marginBottom: s(24), textAlign: 'center'
    }, organizacion));
  }

  contenido.push(
    el('div', { display: 'flex', width: s(48), height: s(3), backgroundColor: AZUL, marginBottom: s(20) }),

    el('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: s(26), marginBottom: s(22)
    }, ICONOS.map(icono)),

    el('div', {
      display: 'flex', width: s(84), height: s(84), alignItems: 'center', justifyContent: 'center',
      marginBottom: s(6)
    }, [{ type: 'img', props: { src: qr, width: s(84), height: s(84), style: {} } }]),

    texto({
      fontFamily: 'Poppins', fontWeight: 700, fontSize: s(14), letterSpacing: s(14) * 0.08,
      color: TINTA, marginBottom: s(12)
    }, codigo),

    texto({ fontFamily: 'Inter', fontWeight: 400, fontSize: s(11), color: GRIS }, 'Segunda edición · Medellín'),
    texto({ fontFamily: 'Inter', fontWeight: 400, fontSize: s(11), color: GRIS, marginTop: s(2) }, '04 de diciembre, 2026')
  );

  return el('div', {
    position: 'relative', display: 'flex', width: ANCHO, height: ALTO,
    backgroundColor: FONDO, fontFamily: 'Inter', overflow: 'hidden'
  }, [
    puntos({ ancho: s(120), alto: s(100), posicion: { right: 0, top: 0 } }),
    puntos({ ancho: s(150), alto: s(130), posicion: { left: 0, bottom: 0 } }),
    el('div', {
      position: 'absolute', display: 'flex', left: s(-110), bottom: s(-110),
      width: s(320), height: s(320), borderRadius: s(160), backgroundColor: 'rgba(14,165,233,0.09)'
    }),
    el('div', {
      position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      padding: `${s(40)}px ${s(32)}px ${s(32)}px`, alignItems: 'center', justifyContent: 'center',
      textAlign: 'center'
    }, contenido)
  ]);
}

/**
 * Genera la escarapela en PNG (800 × 1200 px).
 * @returns {Promise<Buffer>}
 */
export async function generarEscarapela({ nombre, organizacion, codigo }) {
  // El QR codifica solo el código personal, nada más.
  const qr = await QRCode.toDataURL(codigo, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: s(84) * 2,
    color: { dark: `${TINTA}ff`, light: `${FONDO}ff` }
  });

  const imagen = new ImageResponse(
    plantilla({ nombre, organizacion, codigo, qr }),
    { width: ANCHO, height: ALTO, fonts: FUENTES }
  );

  return Buffer.from(await imagen.arrayBuffer());
}
