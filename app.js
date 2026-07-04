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
  const marker = "SANTA CATARINA DE SENA";
  const idx = markdown.indexOf(marker);
  if (idx !== -1) {
    return markdown.slice(0, idx).trim();
  }
  return markdown;
}

async function main() {
  try {
    const hour = getCurrentOfficeHour();
    const office = getLittleOfficeSeason(Date.now());

    let seasonToUse;

    if (hour === Hour.TERCE) {
      seasonToUse = office.solar_cycle;
    } else {
      seasonToUse = office.easter
        ? OfficeSeason.PASCHAL
        : office.solar_cycle;
    }

    let intro = await loadOffice("common", "introduction");

    // Se não for Matinas, encurtar a introdução
    if (hour !== Hour.MATINS) {
      const marker = "Senhor, eu vos ofereço";
      const idx = intro.indexOf(marker);
      if (idx !== -1) {
        intro = intro.slice(idx);
      }
    }

    let filesToLoad = [];
    
    if (hour === Hour.MATINS || hour === Hour.LAUDS) {
      filesToLoad = ["matins", "lauds"];
    } else if (
      hour === Hour.PRIME ||
      hour === Hour.TERCE ||
      hour === Hour.SEXT ||
      hour === Hour.NONE
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
    if (hour === Hour.LAUDS || hour === Hour.VESPERS) {
      const commemorations = await loadOffice("common", "commemorations");
      markdown += commemorations + "\n\n";
    }

    markdown = intro + "\n\n" + markdown;
    
    markdown = markdown.replaceAll(
      /{{\s*include\s*:\s*response\s*}}/g,
      office.alleluia
        ? "{{include:common/alleluia}}"
        : "{{include:common/glory}}"
    );

    // --- OMISSÃO DE SANTA CATARINA ---
    const today = new Date();
    const rank = getFeastRank(today);
    
    // 1. Laudes — omite por rank OU por data
    if (hour === Hour.LAUDS) {
      const omit =
        rank === 1 ||
        rank === 2 ||
        isSantaCatarinaOmittedByDate(today);

      if (omit) {
        markdown = removeSantaCatarina(markdown);
      }
    }
    
    // 2. Vésperas — omite APENAS por data
    if (hour === Hour.VESPERS) {
      if (isSantaCatarinaOmittedByDate(today)) {
        markdown = removeSantaCatarina(markdown);
      }
    }
    // --- Fim de Omissão ---

    const html = await render(markdown);

    document.getElementById("office").innerHTML = html;
    document.title = `Pequeno Ofício — ${hour}`;

  } catch (err) {
    console.error(err);
  }
}

main();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${location.pathname}sw.js`);
}
