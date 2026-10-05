import { defineField } from 'sanity';

/** Foto con recorte y texto alternativo obligatorio. */
export function campoFoto(opciones: { name: string; title: string; description?: string; obligatoria?: boolean; hidden?: any }) {
  return defineField({
    name: opciones.name,
    title: opciones.title,
    description: opciones.description,
    type: 'image',
    options: { hotspot: true },
    hidden: opciones.hidden,
    fields: [
      defineField({
        name: 'alt',
        title: 'Descripción de la foto',
        description: 'Qué se ve en la foto, en una frase. La leen las personas ciegas y Google. Ej: "Alumna haciendo una vertical en la plaza".',
        type: 'string',
        validation: (r) => r.required().max(140).error('Describí la foto en una frase (máximo 140 letras).'),
      }),
    ],
    validation: opciones.obligatoria ? (r) => r.required().error('Subí una foto.') : undefined,
  });
}

/** Límite de caracteres con mensaje amable. */
export const max = (n: number) => (r: any) => r.max(n).warning(`Mejor que no pase de ${n} letras, para que se vea bien en el celular.`);
