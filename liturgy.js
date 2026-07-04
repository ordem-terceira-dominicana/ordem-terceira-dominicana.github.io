const OfficeSeason = Object.freeze({
    ADVENT: "advent",
    CHRISTMAS_TO_PURIFICATION: "christmas_purification",
    AFTER_PURIFICATION: "after_purification",
    PASCHAL: "paschal"
});

/* Meeus/Jones/Butcher ALgorithm */
function easter(year) {
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

    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

// Fontes:
// - Rubricae Generales Breviarii et Missalis (S.C.R. Prot. N. O.126/960, 16 Dec 1960)
//   Documento: "1960 General Rubrics.pdf"
// - Calendarium Ordinis Praedicatorum Reformatus (1960)
const firstClassFeasts = [
  { month: 11, day: 25, name: "Natal" },
  { month: 0,  day: 6,  name: "Epifania" },
  { month: 2,  day: 19, name: "São José" },
  { month: 2,  day: 25, name: "Anunciação" },
  { month: 7,  day: 15, name: "Assunção" },
  { month: 8,  day: 8,  name: "Natividade de Nossa Senhora" },
  { month: 10, day: 1,  name: "Todos os Santos" },
  { month: 11, day: 8,  name: "Imaculada Conceição" },

  { movable: "Easter", name: "Domingo de Páscoa" },
  { movable: "Pentecost", name: "Pentecostes" },
  { movable: "Ascension", name: "Ascensão" },
  { movable: "CorpusChristi", name: "Corpus Christi" },
  { movable: "ChristKing", name: "Cristo Rei" },

  { movable: "AdventSundays", name: "Domingos de Advento" },
  { movable: "LentSundays", name: "Domingos de Quaresma" },
  { movable: "PassionSundays", name: "Domingos da Paixão" },

  { month: 7,  day: 4,  name: "São Domingos" },
  { month: 0,  day: 28, name: "São Tomás de Aquino" },
  { month: 9,  day: 7,  name: "Nossa Senhora do Rosário" }
];

const secondClassFeasts = [
  { month: 1,  day: 22, name: "Cátedra de São Pedro" },
  { month: 3,  day: 25, name: "São Marcos" },
  { month: 4,  day: 11, name: "São Filipe e Tiago" },
  { month: 5,  day: 29, name: "São Pedro e São Paulo" },
  { month: 7,  day: 6,  name: "Transfiguração" },
  { month: 8,  day: 14, name: "Exaltação da Santa Cruz" },
  { month: 8,  day: 21, name: "São Mateus" },
  { month: 9,  day: 18, name: "São Lucas" },
  { month: 10, day: 30, name: "São André" },
  { month: 11, day: 26, name: "Santo Estêvão" },
  { month: 11, day: 27, name: "São João Evangelista" },
  { month: 11, day: 28, name: "Santos Inocentes" },

  { movable: "SecondClassSundays", name: "Domingos de 2ª classe" },

  { month: 3,  day: 30, name: "Santa Catarina de Sena" },
  { month: 3,  day: 5,  name: "São Vicente Ferrer" },
  { month: 3,  day: 29, name: "São Pedro Mártir" },
  { month: 4,  day: 10, name: "São Antonino" },
  { month: 7,  day: 30, name: "Santa Rosa de Lima" },

  { month: 10, day: 12, name: "Todos os Santos da Ordem" },
  { month: 10, day: 13, name: "Defuntos da Ordem" }
];



function isFixedFeast(date, list) {
  return list.some(f =>
    f.month !== undefined &&
    f.day !== undefined &&
    f.month === date.getMonth() &&
    f.day === date.getDate()
  );
}

function isMovableFeast(date, feastName) {
  const year = date.getFullYear();
  const easterSunday = easter(year);

  switch (feastName) {
    case "Easter":
      return date.toDateString() === easterSunday.toDateString();
    case "Ascension":
      return date.toDateString() === addDays(easterSunday, 39).toDateString();
    case "Pentecost":
      return date.toDateString() === addDays(easterSunday, 49).toDateString();
    case "CorpusChristi":
      return date.toDateString() === addDays(easterSunday, 60).toDateString();
    case "ChristKing": {
      const d = new Date(year, 9, 31);
      while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
      return date.toDateString() === d.toDateString();
    }
    case "AdventSundays":
      return getLittleOfficeSeason(date).solar_cycle === OfficeSeason.ADVENT &&
             date.getDay() === 0;
    case "LentSundays":
      return date.getDay() === 0 &&
             date >= new Date(year, 1, 14) &&
             date < easterSunday;
    case "PassionSundays":
      return date.getDay() === 0 &&
             date >= addDays(easterSunday, -14) &&
             date < easterSunday;
    case "SecondClassSundays":
      return date.getDay() === 0;
    default:
      return false;
  }
}

function isFirstClass(date) {
  if (isFixedFeast(date, firstClassFeasts)) return true;
  return firstClassFeasts.some(f => f.movable && isMovableFeast(date, f.movable));
}

function isSecondClass(date) {
  if (isFixedFeast(date, secondClassFeasts)) return true;
  return secondClassFeasts.some(f => f.movable && isMovableFeast(date, f.movable));
}

function getFeastRank(date) {
  if (isFirstClass(date)) return 1;
  if (isSecondClass(date)) return 2;
  return 0;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function firstSundayOfAdvent(year) {
    // 27 de Novembro
    const d = new Date(year, 10, 27);

    while (d.getDay() !== 0) {
        d.setDate(d.getDate() + 1);
    }

    return d;
}

function boundaries(year) {
    const easterSunday = easter(year);

    return {
        advent: firstSundayOfAdvent(year),
        christmas: new Date(year, 11, 25),
        purification: new Date(year + 1, 1, 2),

        septuagesima: addDays(easterSunday, -63),
        easter: easterSunday,
        trinity: addDays(easterSunday, 56)
    };

}

function getLittleOfficeSeason(timestamp) {

    const date = new Date(timestamp);

    const adventThisYear = firstSundayOfAdvent(date.getFullYear());

    const cycleYear =
        date >= adventThisYear
            ? date.getFullYear()
            : date.getFullYear() - 1;

    const b = boundaries(cycleYear);

    let solar_cycle;

    if (date >= b.advent && date < b.christmas) {

        solar_cycle = OfficeSeason.ADVENT;

    } else if (date >= b.christmas && date < b.purification) {

        solar_cycle = OfficeSeason.CHRISTMAS_TO_PURIFICATION;

    } else {

        solar_cycle = OfficeSeason.AFTER_PURIFICATION;
    }

    const easter =
        (date >= b.easter && date < b.trinity);

    const alleluia =
        !(date >= b.septuagesima && date < b.easter);

    return {
        solar_cycle,
        easter,
        alleluia
    };
}

const Hour = Object.freeze({
    MATINS: "matins",
    LAUDS: "lauds",
    PRIME: "prime",
    TERCE: "terce",
    SEXT: "sext",
    NONE: "none",
    VESPERS: "vespers",
    COMPLINE: "compline"
});

function getCurrentOfficeHour() {
    const now = new Date();
    const hour = now.getHours();

    // De acordo com:
    // MANUAL DA ORDEM TERCEIRA DE S. DOMINGOS (1949). 2ª edição. Tipografia Porto Médico. Porto. 
    // De manhã: Prima, Tércia, Sexta, Noa
    if (hour < 12) {
        return [
            Hour.PRIME,
            Hour.TERCE,
            Hour.SEXT,
            Hour.NONE
        ];
    }

    // Depois do meio dia, antes das 15: Vésperas e Completas
    if (hour < 15) {
        return [
            Hour.VESPERS,
            Hour.COMPLINE
        ];
    }

    // Depois das 15: Matinas e Laudes de véspera
    return [
        Hour.MATINS,
        Hour.LAUDS
    ];

    // fallback (não deve acontecer)
    return Hour.NONE;
}

/**
 * Santa Catarina de Sena:
 * - ocorre a 30 de abril (II classe)
 * - omitida nas Laudes de festas de 1ª ou 2ª classe;
 *   também omitida a 30 de abril e durante a oitava.
 *
 * Esta função só calcula a parte "litúrgica":
 * - se é um dia em que Santa Catarina deve ser omitida
 *   (independentemente da Hora).
 */
function isSantaCatarinaOmittedByDate(date) {
  const m = date.getMonth();
  const d = date.getDate();

  // 30 de abril
  if (m === 3 && d === 30) return true;

  // oitava: 30 abril → 6 maio
  const inOctave =
    (m === 3 && d >= 30) ||
    (m === 4 && d <= 6);

  return inOctave;
}

export {
    easter,
    addDays,
    firstSundayOfAdvent,
    boundaries,
    getLittleOfficeSeason,
    getCurrentOfficeHour,
    OfficeSeason,
    Hour,
    isFirstClass,
    isSecondClass,
    getFeastRank,
    isSantaCatarinaOmittedByDate 
};

