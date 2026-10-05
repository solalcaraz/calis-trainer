/**
 * Carga el contenido inicial de la web en Sanity (una sola vez).
 * Uso: npm run seed   (necesita haber hecho `npx sanity login` antes)
 *
 * Lee ../web/src/data/contenido-local.json y sube las fotos y videos de ../web.
 * Es seguro correrlo de nuevo: reemplaza los documentos con los mismos IDs.
 */
import { getCliClient } from 'sanity/cli';
import { createReadStream, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const client = getCliClient({ apiVersion: '2025-01-01' });
const WEB = resolve(process.cwd(), '../web');
const local = JSON.parse(readFileSync(join(WEB, 'src/data/contenido-local.json'), 'utf8'));

const cacheAssets = new Map<string, string>();

async function subir(tipo: 'image' | 'file', ruta: string): Promise<string> {
  if (cacheAssets.has(ruta)) return cacheAssets.get(ruta)!;
  process.stdout.write(`  subiendo ${basename(ruta)}... `);
  const asset = await client.assets.upload(tipo, createReadStream(ruta), { filename: basename(ruta) });
  console.log('ok');
  cacheAssets.set(ruta, asset._id);
  return asset._id;
}

const foto = async (archivo: string, alt: string) => ({
  _type: 'image',
  alt,
  asset: { _type: 'reference', _ref: await subir('image', join(WEB, 'src/assets/media', archivo)) },
});

/** Rangos de orden compatibles con @sanity/orderable-document-list. */
const rango = (i: number) => `0|${(100000 + i * 5000).toString(36)}:`;

async function main() {
  console.log(`Cargando contenido en ${client.config().projectId} / ${client.config().dataset}`);
  const docs: any[] = [];

  docs.push({ _id: 'ajustes', _type: 'ajustes', ...local.ajustes, lugar: { _type: 'object', ...local.ajustes.lugar } });
  docs.push({
    _id: 'inicio', _type: 'inicio',
    antetitulo: local.inicio.antetitulo, titulo: local.inicio.titulo, bajada: local.inicio.bajada,
    foto: await foto(local.inicio.foto.archivo, local.inicio.foto.alt),
  });
  docs.push({
    _id: 'sobreMi', _type: 'sobreMi',
    parrafos: local.sobreMi.parrafos,
    foto: await foto(local.sobreMi.foto.archivo, local.sobreMi.foto.alt),
  });
  docs.push({ _id: 'progresion', _type: 'progresion', ...local.progresion });

  local.servicios.forEach((s: any, i: number) => {
    const { id, ...resto } = s;
    docs.push({
      _id: `servicio-${id}`, _type: 'servicio', ...resto,
      slug: { _type: 'slug', current: id }, destacado: !!s.destacado, visible: true, orderRank: rango(i),
    });
  });

  local.testimonios.forEach((t: any, i: number) => {
    // El permiso queda en false a propósito: Johanna tiene que confirmarlo en el admin antes de volver a publicar.
    docs.push({ _id: `testimonio-${i + 1}`, _type: 'testimonio', ...t, permiso: false, visible: true, orderRank: rango(i) });
  });

  for (const [i, g] of local.galeria.entries()) {
    const base = { _id: `galeria-${i + 1}`, _type: 'itemGaleria', categoria: g.categoria, tipo: g.tipo, visible: true, orderRank: rango(i) };
    if (g.tipo === 'video') {
      docs.push({
        ...base,
        alt: g.alt,
        video: { _type: 'file', asset: { _type: 'reference', _ref: await subir('file', join(WEB, 'public/media/videos', g.video)) } },
        ...(g.poster && { poster: await foto(g.poster, g.alt) }),
      });
    } else {
      docs.push({ ...base, foto: await foto(g.archivo, g.alt) });
    }
  }

  local.preguntas.forEach((p: any, i: number) => {
    docs.push({ _id: `pregunta-${i + 1}`, _type: 'pregunta', ...p, visible: true, orderRank: rango(i) });
  });

  const tx = client.transaction();
  docs.forEach((d) => tx.createOrReplace(d));
  await tx.commit();
  console.log(`Listo: ${docs.length} documentos publicados.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
