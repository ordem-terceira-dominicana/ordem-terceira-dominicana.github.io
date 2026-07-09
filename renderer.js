/**
 * Renderiza um ficheiro Markdown do Pequeno Ofício.
 *
 * Suporta inclusões do tipo:
 *
 * {{include:common/alleluia}}
 * {{include:common/glory}}
 *
 * As inclusões podem ser aninhadas.
 */
export async function render(markdown) {

    const expanded = await expandIncludes(markdown);

    return marked.parse(expanded);

}

async function expandIncludes(markdown) {

    const regex = /\{\{\s*include\s*:\s*([^\}]+)\s*\}\}/g;

    let result = markdown;
    let match;

    while ((match = regex.exec(result)) !== null) {

        const includePath = match[1].trim();

        // aqui o includePath já é algo como "common/alleluia"
        const response = await fetch(`content/${includePath}.md`);

        if (!response.ok) {
            throw new Error(
                `Não foi possível carregar content/${includePath}.md`
            );
        }

        const included = await response.text();

        const expanded = await expandIncludes(included);

        result =
            result.slice(0, match.index) +
            expanded +
            result.slice(match.index + match[0].length);

        regex.lastIndex = 0;
    }

    return result;
}
