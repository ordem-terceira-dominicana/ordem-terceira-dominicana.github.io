import { getLittleOfficeSeason,  getCurrentOfficeHour, OfficeSeason, Hour } from "./liturgy.js";
import { loadOffice } from "./loader.js";
import { render } from "./renderer.js";

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

        const intro = await loadOffice("common", "introduction");
        let markdown = await loadOffice(hour, seasonToUse);

        markdown = intro + "\n\n" + markdown;

        markdown = markdown.replace(
            "{{include:response}}",
            office.alleluia
                ? "{{include:common/alleluia}}"
                : "{{include:common/glory}}"
        );

        const html = await render(markdown);

        document.getElementById("office").innerHTML = html;

        document.title = `Pequeno Ofício — ${hour}`;

    } catch (err) {
        console.error(err);
    }
}

main();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
