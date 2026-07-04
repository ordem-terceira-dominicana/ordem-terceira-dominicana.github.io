/**
 * Carrega o markdown correspondente a uma Hora e ao tempo litúrgico.
 *
 * @param {string} hour
 * @param {string} season
 * @returns {Promise<string>}
 */
export async function loadOffice(hour, season) {

    const response = await fetch(`content/${hour}/${season}.md`);

    if (!response.ok) {
        throw new Error(
            `Não foi possível carregar content/${hour}/${season}.md`
        );
    }

    return await response.text();

}

