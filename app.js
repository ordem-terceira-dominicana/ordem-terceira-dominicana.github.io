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

// Nova função principal para renderizar dependendo do estado
async function updateOffice() {
  try {
    document.getElementById("office").innerHTML = "<p>A carregar...</p>";

    // Ler as configurações salvas ou assumir o padrão
    const activeMode = localStorage.getItem("office-mode") || "secular";
    const selectedHour = localStorage.getItem("office-selected-hour") || "matins";

    const hour = getCurrentOfficeHour(activeMode, selectedHour);
    const office = getLittleOfficeSeason(Date.now());

    let seasonToUse;

    if (hour.includes(Hour.TERCE)) {
      seasonToUse = office.solar_cycle;
    } else {
      seasonToUse = office.easter
        ? OfficeSeason.PASCHAL
        : office.solar_cycle;
    }

    let intro = await loadOffice("common", "introduction");
    let opening_prayer = await loadOffice("common", "opening_prayer");

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

    const today = new Date();
    const rank = getFeastRank(today);
    
    if (hour.includes(Hour.LAUDS)) {
      const omit =
        rank === 1 ||
        rank === 2 ||
        isSantaCatarinaOmittedByDate(today);

      if (omit) {
        markdown = removeSantaCatarina(markdown);
      }
    }
    
    if (hour.includes(Hour.VESPERS)) {
      if (isSantaCatarinaOmittedByDate(today)) {
        markdown = removeSantaCatarina(markdown);
      }
    }

    const html = await render(markdown);

    document.getElementById("office").innerHTML = html;
    document.title = `Pequeno Ofício — ${hour.join(", ").toUpperCase()}`;

  } catch (err) {
    console.error(err);
    document.getElementById("office").innerHTML = "<p>Erro ao carregar o Ofício.</p>";
  }
}

// --- INTERFACE E EVENTOS DO MENU ---
function setupMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const optionsMenu = document.getElementById("options-menu");
  const horaSelector = document.getElementById("hora-selector");
  const hourDropdown = document.getElementById("horas");

  // Recuperar do localStorage para sincronizar a UI inicial
  const savedMode = localStorage.getItem("office-mode") || "secular";
  const savedHour = localStorage.getItem("office-selected-hour") || "matins";

  document.querySelector(`input[name="op-mode"][value="${savedMode}"]`).checked = true;
  hourDropdown.value = savedHour;

  if (savedMode === "livre") {
      horaSelector.style.display = "block";
  }

  // Abrir / Fechar menu
  menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      optionsMenu.style.display = optionsMenu.style.display === "none" ? "block" : "none";
  });

  // Fechar menu ao clicar fora dele
  document.addEventListener("click", (e) => {
      if (!optionsMenu.contains(e.target) && e.target !== menuToggle) {
          optionsMenu.style.display = "none";
      }
  });

  // Mudança de Modo (Secular / Monástico / Livre)
  document.querySelectorAll('input[name="op-mode"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
          const mode = e.target.value;
          localStorage.setItem("office-mode", mode);

          if (mode === "livre") {
              horaSelector.style.display = "block"; // <-- Corrigido aqui!
          } else {
              horaSelector.style.display = "none";
          }
          updateOffice();
      });
  });

  // Mudança de hora manual (Modo Livre)
  hourDropdown.addEventListener("change", (e) => {
      localStorage.setItem("office-selected-hour", e.target.value);
      updateOffice();
  });
}

// Inicialização Geral
function init() {
  setupMenu();
  updateOffice();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(`${location.pathname}sw.js`);
  }
}

init();
