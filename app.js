import { 
  getLittleOfficeSeason,  
  getCurrentOfficeHour, 
  OfficeSeason, 
  Hour, 
  getFeastRank, 
  isSantaCatarinaOmittedByDate
} from "./liturgy.js";
import { loadOffice } from "./loader.js";
import { render } from "./renderer.js";

function removeSantaCatarina(markdown) {
  const start = markdown.indexOf("## **SANTA CATARINA DE SENA**");
  if (start === -1) return markdown;

  const nextHeader = markdown.indexOf("## **", start + 1);

  if (nextHeader === -1) {
    return markdown.slice(0, start).trim();
  }

  return (
    markdown.slice(0, start).trim() +
    "\n\n" +
    markdown.slice(nextHeader).trim()
  );
}

async function main() {
  try {
    const hour = getCurrentOfficeHour();
    const office = getLittleOfficeSeason(Date.now());

    let seasonToUse;

    // Tércia só se aplica se estiver no array
    if (hour.includes(Hour.TERCE)) {
      seasonToUse = office.solar_cycle;
    } else {
      seasonToUse = office.easter
        ? OfficeSeason.PASCHAL
        : office.solar_cycle;
    }

    let intro = await loadOffice("common", "introduction");
    let opening_prayer = await loadOffice("common", "opening_prayer");

    // Se não for Matinas, encurtar a introdução
    if (!hour.includes(Hour.MATINS)) {
      const marker = "Senhor, eu vos ofereço";
      const idx = opening_prayer.indexOf(marker);
      if (idx !== -1) {
        opening_prayer = opening_prayer.slice(idx);
      }
    }

    let filesToLoad = [];
    
    if (hour.includes(Hour.MATINS) || hour.includes(Hour.LAUDS)) {
      filesToLoad = ["matins", "lauds"];
    } else if (
      hour.includes(Hour.PRIME) ||
      hour.includes(Hour.TERCE) ||
      hour.includes(Hour.SEXT) ||
      hour.includes(Hour.NONE)
    ) {
      filesToLoad = ["prime", "terce", "sext", "none"];
    } else {
      filesToLoad = ["vespers", "compline"];
    }
    
    let markdown = "";
    
    for (const h of filesToLoad) {
      markdown += await loadOffice(h, seasonToUse) + "\n\n";
    }

    // Comemorações
    if (hour.includes(Hour.LAUDS) || hour.includes(Hour.VESPERS)) {
      const commemorations = await loadOffice("common", "commemorations");
      markdown += commemorations + "\n\n";
    }

    markdown = intro + opening_prayer + "\n\n" + markdown;
    
    markdown = markdown.replaceAll(
      /{{\s*include\s*:\s*response\s*}}/g,
      office.alleluia
        ? "{{include:common/alleluia}}"
        : "{{include:common/glory}}"
    );

    // --- OMISSÃO DE SANTA CATARINA ---
    const today = new Date();
    const rank = getFeastRank(today);
    
    // Laudes — omite por rank OU por data
    if (hour.includes(Hour.LAUDS)) {
      const omit =
        rank === 1 ||
        rank === 2 ||
        isSantaCatarinaOmittedByDate(today);

      if (omit) {
        markdown = removeSantaCatarina(markdown);
      }
    }
    
    // Vésperas — omite APENAS por data
    if (hour.includes(Hour.VESPERS)) {
      if (isSantaCatarinaOmittedByDate(today)) {
        markdown = removeSantaCatarina(markdown);
      }
    }
    // --- Fim de Omissão ---

    const html = await render(markdown);

    document.getElementById("office").innerHTML = html;
    document.title = `Pequeno Ofício — ${hour.join(", ")}`;

  } catch (err) {
    console.error(err);
  }
}

main();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${location.pathname}sw.js`);
}
