import { defineConfig } from 'sanity';
import { AddIcon } from '@sanity/icons/Add';
import { ImagesIcon } from '@sanity/icons/Images';
import { UsersIcon } from '@sanity/icons/Users';
import { structureTool, type StructureResolver } from 'sanity/structure';
import { esESLocale } from '@sanity/locale-es-es';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { schemaTypes, SINGLETONS } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? 'falta-project-id';
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

const estructura: StructureResolver = (S, context) => {
  const unico = (tipo: string, titulo: string) =>
    S.listItem().title(titulo).id(tipo).child(S.document().schemaType(tipo).documentId(tipo).title(titulo));
  const ordenable = (tipo: string, titulo: string) => orderableDocumentListDeskItem({ type: tipo, title: titulo, S, context });
  // Cada sección de fotos tiene su lista: se ordena arrastrando y el botón + agrega directo en esa sección.
  const galeria = (categoria: string, titulo: string, icono: typeof ImagesIcon) =>
    orderableDocumentListDeskItem({
      type: 'itemGaleria',
      id: `galeria-${categoria}`,
      title: titulo,
      icon: icono,
      filter: 'categoria == $categoria',
      params: { categoria },
      createIntent: false,
      menuItems: [
        S.menuItem()
          .title('Agregar')
          .icon(AddIcon)
          .intent({ type: 'create', params: { type: 'itemGaleria', template: `itemGaleria-${categoria}` } })
          .showAsAction(true)
          .serialize(),
      ],
      S,
      context,
    });

  return S.list()
    .title('Tu web')
    .items([
      unico('inicio', 'Portada'),
      unico('sobreMi', 'Sobre mí'),
      ordenable('servicio', 'Servicios'),
      unico('progresion', 'Progresión de ejemplo'),
      S.divider(),
      galeria('logros', 'Progreso que se ve', ImagesIcon),
      galeria('comunidad', 'Comunidad', UsersIcon),
      ordenable('testimonio', 'Testimonios'),
      ordenable('pregunta', 'Preguntas frecuentes'),
      S.divider(),
      unico('ajustes', 'Contacto y lugar'),
    ]);
};

export default defineConfig({
  name: 'calis-trainer',
  title: 'Calis Trainer · Admin',
  projectId,
  dataset,
  plugins: [structureTool({ structure: estructura }), esESLocale()],
  schema: {
    types: schemaTypes,
    // Las páginas únicas (Portada, Sobre mí, etc.) no se pueden crear de nuevo ni duplicar.
    // Las fotos y videos se crean desde su sección, así ya quedan en el lugar correcto.
    templates: (plantillas) => [
      ...plantillas.filter(({ schemaType }) => !SINGLETONS.includes(schemaType) && schemaType !== 'itemGaleria'),
      { id: 'itemGaleria-logros', title: 'Foto o video de progreso', schemaType: 'itemGaleria', value: { categoria: 'logros' } },
      { id: 'itemGaleria-comunidad', title: 'Foto de comunidad', schemaType: 'itemGaleria', value: { categoria: 'comunidad', tipo: 'foto' } },
    ],
  },
  document: {
    actions: (acciones, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? acciones.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : acciones,
    newDocumentOptions: (opciones) => opciones.filter(({ templateId }) => !SINGLETONS.includes(templateId)),
  },
});
