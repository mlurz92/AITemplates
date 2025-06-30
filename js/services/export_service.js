window.exportService = (() => {

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function htmlToMarkdown(html) {
        if (typeof html !== 'string') return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let markdown = '';

        function processNode(node) {
            let result = '';
            if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                const childrenMarkdown = Array.from(node.childNodes).map(processNode).join('');

                switch (tagName) {
                    case 'h1': result += `\n# ${childrenMarkdown.trim()}\n\n`; break;
                    case 'h2': result += `\n## ${childrenMarkdown.trim()}\n\n`; break;
                    case 'h3': result += `\n### ${childrenMarkdown.trim()}\n\n`; break;
                    case 'h4': result += `\n#### ${childrenMarkdown.trim()}\n\n`; break;
                    case 'h5': result += `\n##### ${childrenMarkdown.trim()}\n\n`; break;
                    case 'h6': result += `\n###### ${childrenMarkdown.trim()}\n\n`; break;
                    case 'p': result += `\n${childrenMarkdown.trim()}\n\n`; break;
                    case 'strong': case 'b': result += `**${childrenMarkdown}**`; break;
                    case 'em': case 'i': result += `*${childrenMarkdown}*`; break;
                    case 'ul':
                        result += `\n${Array.from(node.children).map(li => `* ${processNode(li).trim()}`).join('\n')}\n\n`;
                        break;
                    case 'ol':
                        result += `\n${Array.from(node.children).map((li, i) => `${i + 1}. ${processNode(li).trim()}`).join('\n')}\n\n`;
                        break;
                    case 'table':
                        let tableMarkdown = '';
                        const caption = node.querySelector('caption');
                        if (caption) {
                            tableMarkdown += `\n**${caption.textContent.trim()}**\n\n`;
                        }
                        const headers = Array.from(node.querySelectorAll('thead th')).map(th => th.textContent.trim().replace(/\|/g, '\\|'));
                        if (headers.length > 0) {
                            tableMarkdown += `| ${headers.join(' | ')} |\n`;
                            tableMarkdown += `|${headers.map(() => '---').join('|')}|\n`;
                        }
                        const rows = Array.from(node.querySelectorAll('tbody tr'));
                        rows.forEach(row => {
                            const cells = Array.from(row.querySelectorAll('th, td')).map(cell => cell.innerHTML.replace(/<br\s*\/?>/gi, ' ').trim().replace(/\|/g, '\\|'));
                            tableMarkdown += `| ${cells.join(' | ')} |\n`;
                        });
                        const footer = node.querySelector('tfoot td');
                        if (footer) {
                            tableMarkdown += `\n*Note.*—${footer.textContent.trim()}\n`;
                        }
                        result += tableMarkdown;
                        break;
                    case 'hr': result += '\n---\n'; break;
                    case 'br': result += '  \n'; break;
                    case 'div': case 'section': result += childrenMarkdown; break;
                    default: result += childrenMarkdown; break;
                }
            }
            return result;
        }

        markdown = processNode(doc.body);
        return markdown.replace(/(\n\s*){3,}/g, '\n\n').trim();
    }

    function exportManuscriptAsMarkdown(htmlContent) {
        if (!htmlContent) {
            window.uiManager.showToast(window.APP_CONFIG.UI_TEXTS.exportTab.exportFailed, 'danger');
            return;
        }
        try {
            const markdown = htmlToMarkdown(htmlContent);
            const filename = `Radiology_Manuscript_${getCurrentDateString('YYYYMMDD')}.md`;
            downloadFile(filename, markdown, 'text/markdown;charset=utf-8');
            window.uiManager.showToast(window.APP_CONFIG.UI_TEXTS.exportTab.exportSuccess, 'success');
        } catch (error) {
            window.uiManager.showToast(window.APP_CONFIG.UI_TEXTS.exportTab.exportFailed, 'danger');
        }
    }

    function exportTablesAsMarkdown(htmlContent) {
        if (!htmlContent) {
            window.uiManager.showToast(window.APP_CONFIG.UI_TEXTS.exportTab.exportFailed, 'danger');
            return;
        }
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const tables = doc.querySelectorAll('table');
            let tablesExported = 0;

            if (tables.length === 0) {
                window.uiManager.showToast('No tables found in the manuscript content to export.', 'info');
                return;
            }

            tables.forEach((table, index) => {
                const tableMarkdown = htmlToMarkdown(table.outerHTML);
                const captionElement = table.querySelector('caption');
                const tableIdAttribute = table.getAttribute('id');
                const tableTitle = captionElement ? captionElement.textContent.replace(/Table \d+:/, '').trim() : (tableIdAttribute ? tableIdAttribute.replace(/^table-results-/, '') : `Table_${index + 1}`);
                const filename = `Table_${tableTitle.replace(/[^a-zA-Z0-9_]/g, '_')}.md`;
                
                downloadFile(filename, tableMarkdown, 'text/markdown;charset=utf-8');
                tablesExported++;
            });

            if (tablesExported > 0) {
                window.uiManager.showToast(`${tablesExported} table(s) exported successfully!`, 'success');
            } else {
                window.uiManager.showToast('Failed to export any tables.', 'danger');
            }
        } catch (error) {
            window.uiManager.showToast(window.APP_CONFIG.UI_TEXTS.exportTab.exportFailed, 'danger');
        }
    }

    async function exportChartsAsSvg(chartContainerIds, fileNamePrefix = 'Radiology_Chart') {
        if (!Array.isArray(chartContainerIds) || chartContainerIds.length === 0) {
            window.uiManager.showToast('No chart container IDs provided for export.', 'warning');
            return;
        }
        
        let chartsExported = 0;
        for (const containerId of chartContainerIds) {
            const originalContainer = document.getElementById(containerId);
            if (!originalContainer) {
                continue;
            }

            const svgElement = originalContainer.querySelector('svg');
            if (svgElement) {
                try {
                    const cleanSvgElement = svgElement.cloneNode(true);
                    let svgString = new XMLSerializer().serializeToString(cleanSvgElement);
                    svgString = `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` + svgString;
                    const filename = `${fileNamePrefix}_${containerId}_${getCurrentDateString('YYYYMMDD')}.svg`;
                    downloadFile(filename, svgString, 'image/svg+xml;charset=utf-8');
                    chartsExported++;
                } catch (error) {
                    console.error(`Error exporting chart ${containerId}:`, error);
                }
            }
        }

        if (chartsExported > 0) {
            window.uiManager.showToast(`${chartsExported} chart(s) exported successfully!`, 'success');
        } else {
            window.uiManager.showToast('No rendered charts found to export. Please visit the corresponding tabs first.', 'warning');
        }
    }

    return Object.freeze({
        exportManuscriptAsMarkdown,
        exportTablesAsMarkdown,
        exportChartsAsSvg
    });
})();