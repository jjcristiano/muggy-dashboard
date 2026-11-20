import { EphemerisRule, ResolvedEphemeris } from '../types';
import { diffDays, toDateStr } from './formatters';

/**
 * Calcula la fecha de Domingo de Pascua para un año dado (Algoritmo de Butcher-Meeus)
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Marzo, 4=Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Obtiene el N-ésimo día de la semana de un mes y año dados
 * @param year Año (ej. 2026)
 * @param month Mes 1-12
 * @param weekday Día de la semana 0 (Domingo) - 6 (Sábado)
 * @param nth Orden (1 = primero, 2 = segundo, 3 = tercero, 4 = cuarto)
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number
): Date {
  const firstDay = new Date(year, month - 1, 1, 12, 0, 0);
  const firstWeekday = firstDay.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Resuelve la fecha YYYY-MM-DD de una regla de efeméride para un año específico
 */
export function resolveRuleDateForYear(rule: EphemerisRule, year: number): string {
  if (rule.ruleType === 'custom_date' && rule.customDateStr) {
    // Si es fecha personalizada fija en el calendario anual, o con año propio
    const parts = rule.customDateStr.split('-');
    if (parts.length === 3) {
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    return rule.customDateStr;
  }

  if (rule.ruleType === 'fixed' && rule.month && rule.day) {
    const m = String(rule.month).padStart(2, '0');
    const d = String(rule.day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  if (
    rule.ruleType === 'nth_weekday' &&
    rule.month !== undefined &&
    rule.weekday !== undefined &&
    rule.nth !== undefined
  ) {
    const date = getNthWeekdayOfMonth(year, rule.month, rule.weekday, rule.nth);
    return toDateStr(date);
  }

  if (rule.ruleType === 'easter_offset') {
    const easter = getEasterSunday(year);
    if (rule.easterOffsetDays) {
      easter.setDate(easter.getDate() + rule.easterOffsetDays);
    }
    return toDateStr(easter);
  }

  return `${year}-01-01`;
}

/**
 * Resuelve una lista de reglas de efemérides para un año visualizado y calcula cuántos días faltan desde `todayStr`
 */
export function resolveEphemerides(
  rules: EphemerisRule[],
  targetYear: number,
  todayStr: string
): ResolvedEphemeris[] {
  const currentYear = Number(todayStr.split('-')[0]) || targetYear;

  return rules.map((rule) => {
    const resolvedDate = resolveRuleDateForYear(rule, targetYear);

    // Calcular próxima ocurrencia real desde hoy (si ya pasó este año, tomar el próximo año)
    let nextOccurrenceDate = resolveRuleDateForYear(rule, currentYear);
    let daysUntil = diffDays(todayStr, nextOccurrenceDate);

    if (daysUntil < 0) {
      nextOccurrenceDate = resolveRuleDateForYear(rule, currentYear + 1);
      daysUntil = diffDays(todayStr, nextOccurrenceDate);
    }

    return {
      ...rule,
      resolvedDate,
      daysUntil,
      nextOccurrenceDate,
    };
  });
}

/**
 * Catálogo inicial de Efemérides y Oportunidades Comerciales de Argentina verificadas
 */
export const DEFAULT_EPHEMERIS_RULES: EphemerisRule[] = [
  {
    id: 'ef-ano-nuevo',
    name: 'Año Nuevo',
    category: 'Feriado / Nacional',
    description: 'Comienzo del nuevo año calendario.',
    anticipationDays: 15,
    isCommercialOpportunity: false,
    suggestions: ['Tazas con propósitos de año nuevo', 'Calendarios y regalos empresariales'],
    ruleType: 'fixed',
    month: 1,
    day: 1,
  },
  {
    id: 'ef-reyes',
    name: 'Día de Reyes',
    category: 'Comercial Clave',
    description: 'Fecha tradicional de regalos para niños y ahijados.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas 3D infantiles (Stitch, Spider-Man, Toy Story, Groot)',
      'Tazas de plástico irrompibles con nombre',
      'Cantimploras personalizadas para colonia de vacaciones',
      'Adicional de golosinas en cada taza',
    ],
    ruleType: 'fixed',
    month: 1,
    day: 6,
  },
  {
    id: 'ef-san-valentin',
    name: 'San Valentín / Día de los Enamorados',
    category: 'Comercial Clave',
    description: 'Una de las fechas más fuertes para regalos personalizados en pareja.',
    anticipationDays: 30,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas mágicas con foto oculta de la pareja',
      'Dúo de tazas combinadas o diseño Polaroid',
      'Tazas con interior negro + Adicional golosinas',
      'Combos desayuno / merienda romántica',
    ],
    ruleType: 'fixed',
    month: 2,
    day: 14,
  },
  {
    id: 'ef-inicio-clases',
    name: 'Inicio de Clases / Vuelta al Cole',
    category: 'Comercial Clave',
    description: 'Temporada alta de kits escolares, jardín y primaria (fines de febrero / primeros días de marzo).',
    anticipationDays: 35,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas de plástico irrompibles para jardín con nombre y personaje',
      'Cantimploras personalizadas para el cole',
      'Lapiceros de polímero personalizados',
      'Combos jardín: Taza plástica + Cantimplora',
    ],
    ruleType: 'nth_weekday',
    month: 3,
    nth: 1,
    weekday: 1, // Primer lunes de marzo
  },
  {
    id: 'ef-dia-mujer',
    name: 'Día Internacional de la Mujer',
    category: 'Comercial Clave',
    description: 'Oportunidad para regalos empresariales, familiares y diseños con frases.',
    anticipationDays: 21,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas espejadas doradas edición especial',
      'Mates de cerámica con frases e ilustraciones delicadas',
      'Hoppys y botellas deportivas personalizadas',
      'Regalos corporativos por cantidad',
    ],
    ruleType: 'fixed',
    month: 3,
    day: 8,
  },
  {
    id: 'ef-memoria',
    name: 'Día Nacional de la Memoria por la Verdad y la Justicia',
    category: 'Feriado / Nacional',
    description: 'Feriado nacional inamovible en Argentina.',
    anticipationDays: 7,
    isCommercialOpportunity: false,
    suggestions: [],
    ruleType: 'fixed',
    month: 3,
    day: 24,
  },
  {
    id: 'ef-pascuas',
    name: 'Domingo de Pascuas',
    category: 'Comercial Clave',
    description: 'Excelente oportunidad para combinar tazas infantiles y de cerámica con huevos de Pascua y golosinas.',
    anticipationDays: 25,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas personalizadas rellenas con huevos de Pascua y golosinas',
      'Tazas 3D (Hello Kitty, Stitch, Chip) con chocolates',
      'Tazas plásticas temáticas de Pascuas para niños',
    ],
    ruleType: 'easter_offset',
    easterOffsetDays: 0,
  },
  {
    id: 'ef-trabajador',
    name: 'Día del Trabajador',
    category: 'Comercial Clave',
    description: 'Feriado nacional y fecha clave para regalos a equipos de trabajo y profesionales.',
    anticipationDays: 25,
    isCommercialOpportunity: true,
    suggestions: [
      'Jarros térmicos personalizados para la oficina',
      'Tazas con frases de profesiones y humor de oficina',
      'Mates listos y mates de cerámica con logo de empresa',
    ],
    ruleType: 'fixed',
    month: 5,
    day: 1,
  },
  {
    id: 'ef-ahijado',
    name: 'Día del Ahijado',
    category: 'Especial / Estacional',
    description: 'Se celebra el segundo domingo de mayo en Argentina. Ideal para regalos de padrinos y madrinas.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas 3D de personajes favoritos',
      'Tazas con foto y frase de padrinos/madrinas',
      'Adicional golosinas para sorprender',
    ],
    ruleType: 'nth_weekday',
    month: 5,
    nth: 2,
    weekday: 0, // Segundo domingo de mayo
  },
  {
    id: 'ef-arquitecto',
    name: 'Día del Arquitecto Argentino',
    category: 'Profesiones y Oficios',
    description: 'Se celebra el 1 de julio en Argentina.',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Jarros térmicos para obra/estudio', 'Tazas de cerámica con diseños de arquitectura'],
    ruleType: 'fixed',
    month: 7,
    day: 1,
  },
  {
    id: 'ef-padre',
    name: 'Día del Padre',
    category: 'Comercial Clave',
    description: 'Tercer domingo de junio. Una de las 4 fechas de mayor facturación anual para Muggy.',
    anticipationDays: 30,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas personalizadas con fotos familiares o de fútbol',
      'Mates personalizados (cerámica, plástico o Mate listo)',
      'Jarros térmicos para el trabajo o el auto',
      'Packs de regalo con Adicional golosinas',
      'Tazas 3D (Darth Vader, Groot)',
    ],
    ruleType: 'nth_weekday',
    month: 6,
    nth: 3,
    weekday: 0, // Tercer domingo de junio
  },
  {
    id: 'ef-amigo',
    name: 'Día del Amigo',
    category: 'Comercial Clave',
    description: '20 de julio. Altísimo volumen de ventas unitarias y promociones de 2 o más unidades.',
    anticipationDays: 30,
    isCommercialOpportunity: true,
    suggestions: [
      'Promoción 2 o más unidades en Tazas para grupos de amigos',
      'Mates de cerámica y plástico con frases de amistad',
      'Combos de regalos con Adicional golosinas',
      'Tazas diseño Polaroid con fotos del grupo',
    ],
    ruleType: 'fixed',
    month: 7,
    day: 20,
  },
  {
    id: 'ef-abuelos',
    name: 'Día de los Abuelos',
    category: 'Comercial Clave',
    description: '26 de julio (Santa Ana y San Joaquín). Muy buscado para regalos con fotos de nietos.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas de cerámica con collage de fotos de los nietos',
      'Mates personalizados para el abuelo y la abuela',
      'Tazas mágicas con mensaje sorpresa familiar',
    ],
    ruleType: 'fixed',
    month: 7,
    day: 26,
  },
  {
    id: 'ef-pachamama',
    name: 'Día de la Pachamama',
    category: 'Especial / Estacional',
    description: '1 de agosto. Tradición cultural en toda Argentina.',
    anticipationDays: 10,
    isCommercialOpportunity: false,
    suggestions: ['Mates de cerámica con diseños autóctonos'],
    ruleType: 'fixed',
    month: 8,
    day: 1,
  },
  {
    id: 'ef-nino',
    name: 'Día del Niño / Día de las Infancias',
    category: 'Comercial Clave',
    description: 'Tercer domingo de agosto en Argentina. Fecha clave para línea infantil y 3D.',
    anticipationDays: 30,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas 3D de cerámica (Stitch, Spider-Man, Toy Story, Groot, Hello Kitty, Nemo)',
      'Tazas plásticas personalizadas + Adicional golosinas',
      'Cantimploras y vasos/lapiceros con personajes',
    ],
    ruleType: 'nth_weekday',
    month: 8,
    nth: 3,
    weekday: 0, // Tercer domingo de agosto
  },
  {
    id: 'ef-abogado',
    name: 'Día del Abogado',
    category: 'Profesiones y Oficios',
    description: '29 de agosto en Argentina (natalicio de Juan Bautista Alberdi).',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Tazas interior negro o doradas espejadas para estudio jurídico', 'Jarros térmicos'],
    ruleType: 'fixed',
    month: 8,
    day: 29,
  },
  {
    id: 'ef-secretaria',
    name: 'Día de la Secretaria',
    category: 'Profesiones y Oficios',
    description: '4 de septiembre en Argentina. Regalos de oficina y atención al cliente.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas espejadas doradas con nombre',
      'Sets de Mate de cerámica o Jarro térmico para escritorio',
      'Lapiceros personalizados',
    ],
    ruleType: 'fixed',
    month: 9,
    day: 4,
  },
  {
    id: 'ef-maestro',
    name: 'Día del Maestro',
    category: 'Comercial Clave',
    description: '11 de septiembre. Altísima demanda de regalos individuales y grupales de padres de alumnos.',
    anticipationDays: 30,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas personalizadas con nombres de todos los alumnos del grado',
      'Tazas con frases de agradecimiento para seños y profes',
      'Jarros térmicos y Mates listos para el recreo',
      'Regalos personalizados con Adicional golosinas',
    ],
    ruleType: 'fixed',
    month: 9,
    day: 11,
  },
  {
    id: 'ef-profesor',
    name: 'Día del Profesor',
    category: 'Comercial Clave',
    description: '17 de septiembre en Argentina. Continuación de la campaña docente de septiembre.',
    anticipationDays: 25,
    isCommercialOpportunity: true,
    suggestions: [
      'Jarros térmicos personalizados por materia',
      'Tazas cerámica interior negro con frases docentes',
      'Mates de cerámica',
    ],
    ruleType: 'fixed',
    month: 9,
    day: 17,
  },
  {
    id: 'ef-primavera',
    name: 'Día de la Primavera y del Estudiante',
    category: 'Comercial Clave',
    description: '21 de septiembre. Muy popular para regalos con flores amarillas, mates al aire libre y botellas.',
    anticipationDays: 25,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas y mates con temática Flores Amarillas',
      'Mates listos y Hoppys para picnic de primavera',
      'Combos de amistad y pareja con golosinas',
    ],
    ruleType: 'fixed',
    month: 9,
    day: 21,
  },
  {
    id: 'ef-diversidad',
    name: 'Día del Respeto a la Diversidad Cultural',
    category: 'Feriado / Nacional',
    description: '12 de octubre. Feriado nacional en Argentina.',
    anticipationDays: 10,
    isCommercialOpportunity: false,
    suggestions: [],
    ruleType: 'fixed',
    month: 10,
    day: 12,
  },
  {
    id: 'ef-psicologo',
    name: 'Día del Psicólogo',
    category: 'Profesiones y Oficios',
    description: '13 de octubre en Argentina.',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Tazas y sets de mate para consultorio', 'Tazas con frases de psicología'],
    ruleType: 'fixed',
    month: 10,
    day: 13,
  },
  {
    id: 'ef-madre',
    name: 'Día de la Madre',
    category: 'Comercial Clave',
    description: 'Tercer domingo de octubre en Argentina. Uno de los picos de ventas más altos del año.',
    anticipationDays: 35,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas personalizadas con fotos polaroid e ilustraciones de mamá',
      'Tazas espejadas doradas y Tazas mágicas',
      'Jarros térmicos y Hoppys personalizados',
      'Mates de cerámica con diseños florales + Adicional golosinas',
      'Tazas 3D (Chip, Stitch, Hello Kitty)',
    ],
    ruleType: 'nth_weekday',
    month: 10,
    nth: 3,
    weekday: 0, // Tercer domingo de octubre
  },
  {
    id: 'ef-soberania',
    name: 'Día de la Soberanía Nacional',
    category: 'Feriado / Nacional',
    description: '20 de noviembre. Feriado nacional en Argentina.',
    anticipationDays: 10,
    isCommercialOpportunity: false,
    suggestions: [],
    ruleType: 'fixed',
    month: 11,
    day: 20,
  },
  {
    id: 'ef-enfermero',
    name: 'Día de la Enfermería (Argentina)',
    category: 'Profesiones y Oficios',
    description: '21 de noviembre en Argentina.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Jarros térmicos para guardias en hospital/clínica',
      'Hoppys de aluminio con nombre para no mezclar en el servicio',
      'Tazas personalizadas de salud',
    ],
    ruleType: 'fixed',
    month: 11,
    day: 21,
  },
  {
    id: 'ef-medico',
    name: 'Día del Médico',
    category: 'Profesiones y Oficios',
    description: '3 de diciembre en Argentina.',
    anticipationDays: 20,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas personalizadas para consultorio en agradecimiento',
      'Jarros térmicos y Mates personalizados',
    ],
    ruleType: 'fixed',
    month: 12,
    day: 3,
  },
  {
    id: 'ef-inmaculada',
    name: 'Día de la Inmaculada Concepción (Armado del Arbolito)',
    category: 'Feriado / Nacional',
    description: '8 de diciembre. Feriado nacional e inicio oficial de la temporada fuerte de compras navideñas.',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Lanzamiento oficial del catálogo de Navidad y combos de fin de año'],
    ruleType: 'fixed',
    month: 12,
    day: 8,
  },
  {
    id: 'ef-contador',
    name: 'Día del Contador Público',
    category: 'Profesiones y Oficios',
    description: '17 de diciembre en Argentina.',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Tazas para estudio contable', 'Jarros térmicos personalizados'],
    ruleType: 'fixed',
    month: 12,
    day: 17,
  },
  {
    id: 'ef-navidad',
    name: 'Nochebuena y Navidad',
    category: 'Comercial Clave',
    description: '24 y 25 de diciembre. Cierre de año con máxima demanda de regalos familiares, amigo invisible y corporativos.',
    anticipationDays: 35,
    isCommercialOpportunity: true,
    suggestions: [
      'Tazas navideñas y Tazas 3D para el arbolito',
      'Promociones por cantidad (2 o más unidades) para regalar a toda la familia',
      'Copas de polímero personalizadas para brindis',
      'Combos con Adicional golosinas listas para regalar',
    ],
    ruleType: 'fixed',
    month: 12,
    day: 24,
  },
  {
    id: 'ef-fin-ano',
    name: 'Fin de Año',
    category: 'Especial / Estacional',
    description: '31 de diciembre. Cierre del ejercicio anual.',
    anticipationDays: 15,
    isCommercialOpportunity: true,
    suggestions: ['Copas de polímero personalizadas para fiestas de fin de año'],
    ruleType: 'fixed',
    month: 12,
    day: 31,
  },
];
