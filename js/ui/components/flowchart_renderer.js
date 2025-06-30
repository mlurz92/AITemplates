window.flowchartRenderer = (() => {

    function renderFlowchart(statsData, targetElementId) {
        const container = d3.select(`#${targetElementId}`);
        container.html('');

        const nOverall = statsData?.Overall?.descriptive?.patientCount || 0;
        const nSurgeryAlone = statsData?.surgeryAlone?.descriptive?.patientCount || 0;
        const nNeoadjuvantTherapy = statsData?.neoadjuvantTherapy?.descriptive?.patientCount || 0;

        if (nOverall === 0) {
            container.html('<p class="text-muted small p-2">Flowchart data not available.</p>');
            return;
        }

        const width = 650;
        const height = 520;
        const boxWidth = 300;
        const boxHeight = 55;
        const finalBoxWidth = 520;
        const vSpacing = 75;
        const hGap = 30;

        const svg = container.append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', 'auto')
            .style('max-width', `${width}px`)
            .style('font-family', 'Arial, sans-serif')
            .style('font-size', '12px');

        svg.append('defs').append('marker')
            .attr('id', 'flowchart-arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('xoverflow', 'visible')
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#333')
            .style('stroke', 'none');

        const leftX = (width - (2 * boxWidth) - hGap) / 2;
        const rightX = leftX + boxWidth + hGap;
        const centerX = width / 2;

        const nodes = [
            { id: 'start', x: (width - boxWidth) / 2, y: 10, width: boxWidth, height: boxHeight, text: [`${nOverall} patients with histologically confirmed rectal cancer`, `were enrolled in the study`] },
            { id: 'baselineMRI', x: (width - boxWidth) / 2, y: 10 + vSpacing, width: boxWidth, height: boxHeight, text: [`${nOverall} Underwent baseline MRI`] },
            { id: 'neoadjuvant', x: leftX, y: 10 + 2 * vSpacing, width: boxWidth, height: boxHeight, text: [`${nNeoadjuvantTherapy} Received neoadjuvant`, `chemoradiotherapy`] },
            { id: 'surgeryAlone', x: rightX, y: 10 + 2 * vSpacing, width: boxWidth, height: boxHeight, text: [`${nSurgeryAlone} Underwent surgery alone`, `(Avocado Sign assessed on baseline MRI)`] },
            { id: 'restaging', x: leftX, y: 10 + 3 * vSpacing, width: boxWidth, height: boxHeight, text: [`Restaging MRI in ${nNeoadjuvantTherapy} patients`, `followed by surgery`, `(Avocado Sign assessed on restaging MRI)`] },
            { id: 'final', x: (width - finalBoxWidth) / 2, y: 10 + 4 * vSpacing + 10, width: finalBoxWidth, height: boxHeight, text: [`${nOverall} Patients were included in the final analysis comparing the Avocado Sign with`, `histopathologic findings from surgical specimens`] }
        ];
        
        const lineGenerator = d3.line().x(d => d.x).y(d => d.y);
        
        const splitY = nodes[1].y + nodes[1].height + vSpacing / 2;
        const neoX = nodes[2].x + nodes[2].width / 2;
        const surX = nodes[3].x + nodes[3].width / 2;

        const links = [
            // start -> baselineMRI
            { path: [{x: centerX, y: nodes[0].y + nodes[0].height}, {x: centerX, y: nodes[1].y}], marker: true },
            // baselineMRI -> split
            { path: [{x: centerX, y: nodes[1].y + nodes[1].height}, {x: centerX, y: splitY}], marker: false },
            { path: [{x: neoX, y: splitY}, {x: surX, y: splitY}], marker: false },
            { path: [{x: centerX, y: splitY}, {x: neoX, y: splitY}], marker: false },
            { path: [{x: centerX, y: splitY}, {x: surX, y: splitY}], marker: false },
            { path: [{x: neoX, y: splitY}, {x: neoX, y: nodes[2].y}], marker: true },
            { path: [{x: surX, y: splitY}, {x: surX, y: nodes[3].y}], marker: true },
            // neoadjuvant -> restaging
            { path: [{x: neoX, y: nodes[2].y + nodes[2].height}, {x: neoX, y: nodes[4].y}], marker: true },
            // restaging -> final
            { path: [{x: neoX, y: nodes[4].y + nodes[4].height}, {x: neoX, y: nodes[5].y}], marker: true },
            // surgeryAlone -> final
            { path: [{x: surX, y: nodes[3].y + nodes[3].height}, {x: surX, y: nodes[5].y}], marker: true }
        ];

        svg.selectAll('.flowchart-link')
            .data(links)
            .enter()
            .append('path')
            .attr('d', d => lineGenerator(d.path))
            .attr('stroke', '#333')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('marker-end', d => d.marker ? 'url(#flowchart-arrowhead)' : 'none');
        
        const nodeGroups = svg.selectAll('.flowchart-node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'flowchart-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        nodeGroups.append('rect')
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('fill', '#f8f9fa')
            .attr('stroke', '#333')
            .attr('stroke-width', 1.5)
            .attr('rx', 2)
            .attr('ry', 2);

        const textElements = nodeGroups.append('text')
            .attr('x', d => d.width / 2)
            .attr('y', d => d.height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');

        textElements.each(function(d) {
            const el = d3.select(this);
            const lineHeight = 1.2;
            const startY = -((d.text.length - 1) * lineHeight) / 2 * 12; 
            d.text.forEach((line, i) => {
                const tspan = el.append('tspan')
                    .attr('x', d.width / 2)
                    .attr('dy', i === 0 ? `${startY}px` : `${lineHeight}em`)
                    .text(line);
            });
        });
    }

    return Object.freeze({
        renderFlowchart
    });

})();