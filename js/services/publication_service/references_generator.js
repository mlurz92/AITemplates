window.referencesGenerator = (() => {

    function processAndNumberReferences(html, allReferences) {
        const citedRefKeys = new Map();
        let refCounter = 1;

        if (typeof html !== 'string' || !allReferences) {
            return { processedHtml: html || '', referencesHtml: '' };
        }

        const singleRefRegex = /\[([A-Za-z0-9_]+)\]/g;

        const allMatches = [...html.matchAll(singleRefRegex)];
        allMatches.forEach(match => {
            const refKey = match[1];
            if (allReferences[refKey] && !citedRefKeys.has(refKey)) {
                citedRefKeys.set(refKey, refCounter++);
            }
        });

        const groupRefRegex = /(\[([A-Za-z0-9_]+)\])+/g;

        const processedHtml = html.replace(groupRefRegex, (match) => {
            const keysInGroup = [...match.matchAll(singleRefRegex)].map(m => m[1]);
            
            const numbers = keysInGroup
                .map(refKey => citedRefKeys.get(refKey))
                .filter(num => num !== undefined);

            const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);
            
            if (uniqueNumbers.length > 0) {
                return `(${uniqueNumbers.join(', ')})`;
            }
            return match; 
        });

        const sortedCitedRefs = Array.from(citedRefKeys.entries()).sort((a, b) => a[1] - b[1]);

        let referencesHtml = '';
        if (sortedCitedRefs.length > 0) {
            const listItems = sortedCitedRefs.map(([key, number]) => {
                const refData = allReferences[key];
                if (!refData || !refData.text) {
                    return `<li>Reference for key '${key}' not found.</li>`;
                }
                return `<li>${refData.text}</li>`;
            }).join('');
            referencesHtml = `<section id="references_main"><h2>References</h2><ol>${listItems}</ol></section>`;
        } else {
             referencesHtml = `<section id="references_main"><h2>References</h2><p class="text-muted">No references cited in the text.</p></section>`;
        }

        return { processedHtml, referencesHtml };
    }

    return Object.freeze({
        processAndNumberReferences
    });

})();