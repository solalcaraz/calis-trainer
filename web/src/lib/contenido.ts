/**
 * Carga el contenido de la web en build.
 * - Con SANITY_PROJECT_ID definido: lo lee de Sanity (lo que Johanna edita en el admin).
 * - Sin él: usa src/data/contenido-local.json (desarrollo y respaldo).
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import local from '../data/contenido-local.json';
import type { Contenido, Imagen, ItemGaleria } from './tipos';

const ANCHOS = [480, 800, 1200, 1600];

const projectId = import.meta.env.SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.SANITY_DATASET as string | undefined) ?? 'production';

let cache: Promise<Contenido> | undefined;

export function getContenido(): Promise<Contenido> {
  cache ??= projectId ? desdeSanity(projectId) : desdeLocal();
  return cache;
}

const archivosMedia = import.meta.glob<{ default: ImageMetadata }>('../assets/media/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

async function fotoLocal(archivo: string, alt: string): Promise<Imagen> {
  const modulo = archivosMedia[`../assets/media/${archivo}`];
  if (!modulo) throw new Error(`Falta la imagen local "${archivo}" en src/assets/media`);
  const meta = modulo.default;
  const anchos = ANCHOS.filter((a) => a <= meta.width);
  const img = await getImage({ src: meta, widths: anchos.length ? anchos : [meta.width], format: 'webp' });
  return {
    src: img.src,
    srcset: img.srcSet.attribute,
    ancho: meta.width,
    alto: meta.height,
    alt,
  };
}

async function desdeLocal(): Promise<Contenido> {
  const galeria: ItemGaleria[] = await Promise.all(
    local.galeria.map(async (g): Promise<ItemGaleria> => {
      const categoria = g.categoria as ItemGaleria['categoria'];
      if (g.tipo === 'video' && g.video) {
        return {
          categoria,
          tipo: 'video',
          video: {
            src: `/media/videos/${g.video}`,
            poster: g.poster ? await fotoLocal(g.poster, '') : undefined,
            alt: g.alt,
          },
        };
      }
      return { categoria, tipo: 'foto', foto: await fotoLocal(g.archivo!, g.alt) };
    }),
  );

  return {
    ajustes: local.ajustes,
    inicio: { ...local.inicio, foto: await fotoLocal(local.inicio.foto.archivo, local.inicio.foto.alt) },
    sobreMi: { ...local.sobreMi, foto: await fotoLocal(local.sobreMi.foto.archivo, local.sobreMi.foto.alt) },
    progresion: local.progresion,
    servicios: local.servicios as Contenido['servicios'],
    testimonios: local.testimonios,
    galeria,
    preguntas: local.preguntas,
  };
}

interface FotoSanity {
  alt?: string;
  asset?: { _id: string; url: string; metadata?: { dimensions?: { width: number; height: number } } };
  crop?: unknown;
  hotspot?: unknown;
}

interface GaleriaSanity {
  categoria: ItemGaleria['categoria'];
  tipo: ItemGaleria['tipo'];
  texto?: string;
  alt?: string;
  foto?: FotoSanity | null;
  poster?: FotoSanity | null;
  videoUrl?: string;
}

const FOTO = `{ alt, crop, hotspot, asset->{ _id, url, metadata { dimensions } } }`;

const CONSULTA = `{
  "ajustes": *[_id == "ajustes"][0]{ whatsapp, mensajeBase, instagram, lugar },
  "inicio": *[_id == "inicio"][0]{ antetitulo, titulo, bajada, foto ${FOTO} },
  "sobreMi": *[_id == "sobreMi"][0]{ parrafos, foto ${FOTO} },
  "progresion": *[_id == "progresion"][0]{ titulo, pasos },
  "servicios": *[_type == "servicio" && visible != false] | order(orderRank){
    "id": slug.current, nombre, grupo, "etiquetas": coalesce(etiquetas, []), resumen, dato, horarios, destacado,
    "mensajeWhatsapp": coalesce(mensajeWhatsapp, "Hola Joha! Quiero reservar una clase de prueba de " + nombre + ".")
  },
  "testimonios": *[_type == "testimonio" && visible != false && permiso == true] | order(orderRank){ texto, autor, contexto },
  "galeria": *[_type == "itemGaleria" && visible != false] | order(orderRank){
    categoria, tipo, texto, alt, foto ${FOTO}, poster ${FOTO}, "videoUrl": video.asset->url
  },
  "preguntas": *[_type == "pregunta" && visible != false] | order(orderRank){ pregunta, respuesta }
}`;

async function desdeSanity(projectId: string): Promise<Contenido> {
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    useCdn: false,
    perspective: 'published',
  });
  const builder = createImageUrlBuilder({ projectId, dataset });

  const foto = (f: FotoSanity | null | undefined, altExtra = ''): Imagen | undefined => {
    if (!f?.asset) return undefined;
    const dims = f.asset.metadata?.dimensions ?? { width: 1600, height: 1200 };
    const base = builder.image(f as Parameters<typeof builder.image>[0]).auto('format').quality(80).fit('max');
    const anchos = ANCHOS.filter((a) => a <= dims.width);
    const lista = anchos.length ? anchos : [dims.width];
    return {
      src: base.width(lista[lista.length - 1]).url(),
      srcset: lista.map((a) => `${base.width(a).url()} ${a}w`).join(', '),
      ancho: dims.width,
      alto: dims.height,
      alt: f.alt ?? altExtra,
    };
  };

  const d = await client.fetch(CONSULTA);
  const faltan = ['ajustes', 'inicio', 'sobreMi', 'progresion'].filter((k) => !d[k]);
  if (faltan.length) throw new Error(`Faltan documentos en Sanity: ${faltan.join(', ')}. Corré el seed del studio.`);

  const galeria: ItemGaleria[] = (d.galeria ?? [])
    .map((g: GaleriaSanity): ItemGaleria | undefined => {
      if (g.tipo === 'video' && g.videoUrl) {
        return { categoria: g.categoria, tipo: 'video', texto: g.texto, video: { src: g.videoUrl, poster: foto(g.poster), alt: g.alt ?? '' } };
      }
      const f = foto(g.foto, g.alt);
      return f ? { categoria: g.categoria, tipo: 'foto', texto: g.texto, foto: f } : undefined;
    })
    .filter((g: ItemGaleria | undefined): g is ItemGaleria => g !== undefined);

  return {
    ajustes: d.ajustes,
    inicio: { ...d.inicio, foto: foto(d.inicio.foto)! },
    sobreMi: { ...d.sobreMi, foto: foto(d.sobreMi.foto)! },
    progresion: d.progresion,
    servicios: d.servicios ?? [],
    testimonios: d.testimonios ?? [],
    galeria,
    preguntas: d.preguntas ?? [],
  };
}
