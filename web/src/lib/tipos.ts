/** Modelo de contenido de la web. Sanity y el contenido local se normalizan a estos tipos. */

export interface Imagen {
  src: string;
  srcset?: string;
  ancho: number;
  alto: number;
  alt: string;
}

export interface Video {
  src: string;
  poster?: Imagen;
  alt: string;
}

export interface Ajustes {
  /** Número en formato internacional sin "+" ni espacios, para wa.me */
  whatsapp: string;
  mensajeBase: string;
  instagram: string;
  lugar: {
    nombre: string;
    zona: string;
    mapaEmbed: string;
    mapaLink: string;
  };
}

export interface Inicio {
  antetitulo: string;
  titulo: string;
  bajada: string;
  foto: Imagen;
}

export interface SobreMi {
  parrafos: string[];
  foto: Imagen;
}

export interface Progresion {
  titulo: string;
  pasos: string[];
}

export interface Servicio {
  id: string;
  nombre: string;
  /** Cómo se entrena; agrupa los servicios en la web. */
  grupo?: 'plaza' | 'online' | 'medida';
  etiquetas: string[];
  resumen: string;
  dato?: string;
  horarios?: string[];
  mensajeWhatsapp: string;
  destacado?: boolean;
}

export interface Testimonio {
  texto: string;
  autor: string;
  contexto?: string;
}

export interface ItemGaleria {
  categoria: 'logros' | 'comunidad';
  tipo: 'foto' | 'video';
  foto?: Imagen;
  video?: Video;
  texto?: string;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

export interface Contenido {
  ajustes: Ajustes;
  inicio: Inicio;
  sobreMi: SobreMi;
  progresion: Progresion;
  servicios: Servicio[];
  testimonios: Testimonio[];
  galeria: ItemGaleria[];
  preguntas: Pregunta[];
}
