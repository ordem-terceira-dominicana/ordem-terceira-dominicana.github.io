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

    if (hour < 6) return Hour.MATINS;          // 00:00–05:59
    if (hour < 8) return Hour.LAUDS;           // 06:00–07:59
    if (hour < 9) return Hour.PRIME;           // 08:00–08:59
    if (hour < 12) return Hour.TERCE;          // 09:00–11:59
    if (hour < 15) return Hour.SEXT;           // 12:00–14:59
    if (hour < 17) return Hour.NONE;           // 15:00–16:59
    if (hour < 20) return Hour.VESPERS;        // 17:00–19:59
    return Hour.COMPLINE;                      // 20:00–23:59
}

export {
    easter,
    addDays,
    firstSundayOfAdvent,
    boundaries,
    getLittleOfficeSeason,
    getCurrentOfficeHour,
    OfficeSeason,
    Hour
};

