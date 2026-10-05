import { defineField, defineType } from 'sanity';
import { campoFoto, max } from './campos';

export const inicio = defineType({
  name: 'inicio',
  title: 'Portada',
  type: 'document',
  fields: [
    defineField({ name: 'antetitulo', title: 'Texto chico arriba del título', type: 'string', validation: (r) => [r.required(), max(60)(r)] }),
    defineField({
      name: 'titulo',
      title: 'Título principal',
      description: 'Se muestra en mayúsculas. Corto y con fuerza.',
      type: 'string',
      validation: (r) => [r.required(), max(40)(r)],
    }),
    defineField({ name: 'bajada', title: 'Bajada', type: 'text', rows: 2, validation: (r) => [r.required(), max(160)(r)] }),
    campoFoto({
      name: 'foto',
      title: 'Foto de portada',
      description: 'Una foto tuya haciendo una habilidad. Se recorta sola: marcá con el punto el centro de atención.',
      obligatoria: true,
    }),
  ],
  preview: { prepare: () => ({ title: 'Portada' }) },
});

export const sobreMi = defineType({
  name: 'sobreMi',
  title: 'Sobre mí',
  type: 'document',
  fields: [
    // El texto chico y el título quedan fijos en la web (SobreMi.astro).
    defineField({
      name: 'parrafos',
      title: 'Tu historia',
      description: 'Un párrafo por bloque. El primero se muestra un poco más grande.',
      type: 'array',
      of: [{ type: 'text', rows: 3 }],
      validation: (r) => r.required().min(1).max(6),
    }),
    campoFoto({ name: 'foto', title: 'Foto', obligatoria: true }),
  ],
  preview: { prepare: () => ({ title: 'Sobre mí' }) },
});

export const progresion = defineType({
  name: 'progresion',
  title: 'Progresión de ejemplo',
  type: 'document',
  description: 'La escalera de pasos que aparece en "Cómo empezar".',
  fields: [
    defineField({ name: 'titulo', title: 'Título', type: 'string', validation: (r) => [r.required(), max(40)(r)] }),
    defineField({
      name: 'pasos',
      title: 'Pasos',
      description: 'De 3 a 6 pasos, del más fácil al objetivo.',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (r) => r.required().min(3).max(6).error('Poné entre 3 y 6 pasos.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Progresión de ejemplo' }) },
});

export const ajustes = defineType({
  name: 'ajustes',
  title: 'Contacto y lugar',
  type: 'document',
  fields: [
    defineField({
      name: 'whatsapp',
      title: 'Número de WhatsApp',
      description: 'Sin +, espacios ni guiones: 549 + código de área sin 0 + número sin 15. Ej: 5491112345678',
      type: 'string',
      validation: (r) => r.required().regex(/^549\d{10}$/, { name: 'número argentino' }).error('Revisá el formato: 549 y 10 números más.'),
    }),
    defineField({
      name: 'mensajeBase',
      title: 'Mensaje de WhatsApp de los botones principales',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'instagram', title: 'Link de Instagram', type: 'url', validation: (r) => r.required() }),
    defineField({
      name: 'lugar',
      title: 'Lugar de las clases presenciales',
      type: 'object',
      fields: [
        defineField({ name: 'nombre', title: 'Nombre del lugar', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'zona', title: 'Barrio y ciudad', type: 'string', validation: (r) => r.required() }),
        defineField({
          name: 'mapaLink',
          title: 'Link de Google Maps',
          description: 'En Google Maps: Compartir → Copiar vínculo.',
          type: 'url',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'mapaEmbed',
          title: 'Link del mapa insertado',
          description: 'En Google Maps: Compartir → Insertar un mapa → copiá solo lo que está entre comillas después de src=',
          type: 'url',
          validation: (r) => r.required(),
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Contacto y lugar' }) },
});
