import { defineField, defineType } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { campoFoto, max } from './campos';

const visible = defineField({
  name: 'visible',
  title: 'Mostrar en la web',
  description: 'Apagalo para ocultarlo sin borrarlo.',
  type: 'boolean',
  initialValue: true,
});

export const servicio = defineType({
  name: 'servicio',
  title: 'Servicio',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    defineField({ name: 'nombre', title: 'Nombre', type: 'string', validation: (r) => [r.required(), max(40)(r)] }),
    defineField({
      name: 'slug',
      title: 'Identificador',
      description: 'Se genera solo a partir del nombre. Tocá "Generar".',
      type: 'slug',
      options: { source: 'nombre', maxLength: 40 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'grupo',
      title: 'Grupo',
      description: 'Cómo se entrena. En la web, los servicios se muestran agrupados así.',
      type: 'string',
      options: {
        list: [
          { title: 'En la plaza (grupal, al aire libre)', value: 'plaza' },
          { title: 'Online', value: 'online' },
          { title: 'A tu medida (1 a 1 o plan propio)', value: 'medida' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required().error('Elegí un grupo.'),
    }),
    defineField({
      name: 'etiquetas',
      title: 'Etiquetas',
      description: 'Nivel o tipo de clase; la modalidad ya la indica el grupo. Ej: "Todos los niveles", "1 a 1". Hasta 3.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (r) => r.max(3),
    }),
    defineField({
      name: 'resumen',
      title: 'Descripción',
      description: 'Para quién es y qué incluye, en 2 o 3 líneas.',
      type: 'text',
      rows: 3,
      validation: (r) => [r.required(), max(220)(r)],
    }),
    defineField({ name: 'dato', title: 'Dato corto', description: 'Duración o lugar. Ej: "Clases de 1 h · Plaza Irlanda".', type: 'string', validation: max(60) }),
    defineField({
      name: 'horarios',
      title: 'Horarios',
      description: 'Uno por línea. Aparecen en la sección "Dónde y cuándo". Ej: "Lunes de 18:30 a 21:00".',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'mensajeWhatsapp',
      title: 'Mensaje de WhatsApp',
      description: 'El texto que llega cuando tocan el botón. Si lo dejás vacío: "Hola Joha! Quiero reservar una clase de prueba de [nombre]."',
      type: 'string',
    }),
    defineField({
      name: 'destacado',
      title: 'Destacado',
      description: 'Su botón se muestra en rojo. Marcá uno solo: el que más querés llenar.',
      type: 'boolean',
      initialValue: false,
    }),
    visible,
    orderRankField({ type: 'servicio' }),
  ],
  preview: {
    select: { title: 'nombre', subtitle: 'dato', visible: 'visible', destacado: 'destacado' },
    prepare: ({ title, subtitle, visible, destacado }) => ({
      title: `${title}${destacado ? ' (destacado)' : ''}`,
      subtitle: visible === false ? 'Oculto' : subtitle,
    }),
  },
});

export const testimonio = defineType({
  name: 'testimonio',
  title: 'Testimonio',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: 'texto',
      title: 'Testimonio',
      description: 'Sin emojis. Podés recortarlo, pero no cambiarle el sentido.',
      type: 'text',
      rows: 4,
      validation: (r) => [r.required(), max(350)(r)],
    }),
    defineField({ name: 'autor', title: 'Nombre', description: 'Nombre o nombre con inicial. Ej: "Ana P."', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'contexto', title: 'Detalle', description: 'Ej: "Alumna desde 2024" o "Logró su primera dominada".', type: 'string', validation: max(50) }),
    defineField({
      name: 'permiso',
      title: 'Tengo permiso para publicarlo',
      type: 'boolean',
      initialValue: false,
      validation: (r) => r.custom((v) => (v === true ? true : 'Confirmá que la persona aceptó que publiques su testimonio.')),
    }),
    visible,
    orderRankField({ type: 'testimonio' }),
  ],
  preview: {
    select: { title: 'autor', subtitle: 'texto', visible: 'visible' },
    prepare: ({ title, subtitle, visible }) => ({ title, subtitle: visible === false ? 'Oculto' : subtitle }),
  },
});

// ---------- Fotos y videos ----------

const MAX_SEGUNDOS = 15;
const MAX_MB = 50;

/** Lee la duración del video en el navegador (el admin corre en el navegador). */
function duracionVideo(url: string): Promise<number | undefined> {
  if (typeof document === 'undefined') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const fin = (d?: number) => { clearTimeout(t); v.removeAttribute('src'); v.load(); resolve(d); };
    const t = setTimeout(() => fin(undefined), 15000);
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => fin(Number.isFinite(v.duration) ? v.duration : undefined);
    v.onerror = () => fin(undefined);
    v.src = url;
  });
}

export const itemGaleria = defineType({
  name: 'itemGaleria',
  title: 'Foto o video',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: 'categoria',
      title: 'Sección',
      type: 'string',
      options: {
        list: [
          { title: 'Progreso que se ve (fotos y videos)', value: 'logros' },
          { title: 'Comunidad (fotos grupales)', value: 'comunidad' },
        ],
        layout: 'radio',
      },
      initialValue: 'logros',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tipo',
      title: 'Tipo',
      type: 'string',
      options: { list: [{ title: 'Foto', value: 'foto' }, { title: 'Video', value: 'video' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'foto',
      validation: (r) =>
        r.required().custom((tipo, ctx) =>
          tipo === 'video' && (ctx.parent as any)?.categoria === 'comunidad' ? 'En "Comunidad" van solo fotos. Los videos van en "Progreso que se ve".' : true,
        ),
    }),
    campoFoto({
      name: 'foto',
      title: 'Foto',
      hidden: ({ parent }: any) => parent?.tipo === 'video',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      description: `Máximo ${MAX_SEGUNDOS} segundos, sin sonido (se reproduce en silencio). Si pesa mucho, mandátelo a vos misma por WhatsApp y subí el que te llega: queda más liviano.`,
      type: 'file',
      options: { accept: 'video/mp4,video/webm,video/quicktime' },
      hidden: ({ parent }) => parent?.tipo !== 'video',
      validation: (r) =>
        r.custom(async (valor: any, ctx) => {
          if ((ctx.parent as any)?.tipo !== 'video') return true;
          if (!valor?.asset?._ref) return 'Subí el video.';
          const cliente = ctx.getClient({ apiVersion: '2025-01-01' });
          const asset = await cliente.fetch<{ url: string; size: number } | null>('*[_id == $id][0]{ url, size }', { id: valor.asset._ref });
          if (!asset) return true;
          if (asset.size > MAX_MB * 1024 * 1024) {
            return `El video pesa ${Math.round(asset.size / 1024 / 1024)} MB y el máximo es ${MAX_MB} MB. Mandátelo por WhatsApp y subí el que te llega.`;
          }
          const segundos = await duracionVideo(asset.url);
          if (segundos !== undefined && segundos > MAX_SEGUNDOS + 0.5) {
            return `El video dura ${Math.round(segundos)} segundos y el máximo es ${MAX_SEGUNDOS}. Recortalo desde la galería del celular.`;
          }
          return true;
        }),
    }),
    campoFoto({
      name: 'poster',
      title: 'Imagen de portada del video (opcional)',
      description: 'Se ve mientras el video carga. Si no subís una, se muestra el primer cuadro.',
      hidden: ({ parent }: any) => parent?.tipo !== 'video',
    }),
    defineField({
      name: 'alt',
      title: 'Descripción del video',
      description: 'Qué se ve, en una frase. Ej: "Alumna haciendo su primera dominada".',
      type: 'string',
      hidden: ({ parent }) => parent?.tipo !== 'video',
      validation: (r) => r.custom((v, ctx) => ((ctx.parent as any)?.tipo === 'video' && !v ? 'Describí el video en una frase.' : true)),
    }),
    defineField({ name: 'texto', title: 'Epígrafe (opcional)', description: 'Texto corto debajo. Ej: "Primera vertical de Ana".', type: 'string', validation: max(60) }),
    visible,
    orderRankField({ type: 'itemGaleria' }),
  ],
  validation: (r) =>
    r.custom((doc: any) => (doc?.tipo === 'foto' && !doc?.foto?.asset ? 'Subí la foto.' : true)),
  preview: {
    select: { foto: 'foto', poster: 'poster', tipo: 'tipo', categoria: 'categoria', alt: 'foto.alt', altVideo: 'alt', texto: 'texto', visible: 'visible' },
    prepare: ({ foto, poster, tipo, categoria, alt, altVideo, texto, visible }) => ({
      title: texto || (tipo === 'video' ? altVideo : alt) || (tipo === 'video' ? 'Video' : 'Foto'),
      subtitle: `${tipo === 'video' ? 'Video' : 'Foto'} · ${categoria === 'comunidad' ? 'Comunidad' : 'Progreso que se ve'}${visible === false ? ' · Oculto' : ''}`,
      media: tipo === 'video' ? poster : foto,
    }),
  },
});

export const pregunta = defineType({
  name: 'pregunta',
  title: 'Pregunta frecuente',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    defineField({ name: 'pregunta', title: 'Pregunta', type: 'string', validation: (r) => [r.required(), max(80)(r)] }),
    defineField({ name: 'respuesta', title: 'Respuesta', type: 'text', rows: 3, validation: (r) => [r.required(), max(400)(r)] }),
    visible,
    orderRankField({ type: 'pregunta' }),
  ],
  preview: { select: { title: 'pregunta', subtitle: 'respuesta' } },
});
