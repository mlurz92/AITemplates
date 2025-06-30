window.insightsTab = (() => {

    function _createControlsHTML(insightsState, allStats) {
        const { studyId, power, alpha, effectSizeType, customEffectSize, featureImportanceMethod } = insightsState;
        
        const allLitSets = window.studyT2CriteriaManager.getAllStudyCriteriaSets();
        const bfResults = window.bruteForceManager.getAllResults();

        const createOptions = (sets) => sets.map(set => `<option value="${set.id}" ${studyId === set.id ? 'selected' : ''}>${set.name || set.id}</option>`).join('');
        
        const groupedLitSets = allLitSets.reduce((acc, set) => {
            const group = set.group || 'Other Literature Criteria';
            if (!acc[group]) acc[group] = [];
            acc[group].push(set);
            return acc;
        }, {});

        const bfOptionsHTML = Object.keys(bfResults).map(cohortId => {
            const metric = window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC;
            if (bfResults[cohortId]?.[metric]) {
                const bfId = `bf_${cohortId}_${metric}`;
                return `<option value="${bfId}" ${studyId === bfId ? 'selected' : ''}>Best Case T2 (${getCohortDisplayName(cohortId)})</option>`;
            }
            return '';
        }).join('');

        let optgroupHTML = `<optgroup label="Data-driven Best-Case Criteria">${bfOptionsHTML}</optgroup>`;
        
        const groupOrder = ['ESGAR Criteria', 'Other Literature Criteria'];
        groupOrder.forEach(groupName => {
            if (groupedLitSets[groupName]) {
                optgroupHTML += `<optgroup label="${groupName}">${createOptions(groupedLitSets[groupName])}</optgroup>`;
            }
        });

        return `
            <div class="row justify-content-center mb-4">
                <div class="col-md-8">
                    <div class="input-group">
                        <label class="input-group-text" for="insights-comparison-select">Analysis Comparison Basis (T2):</label>
                        <select class="form-select" id="insights-comparison-select">${optgroupHTML}</select>
                    </div>
                </div>
            </div>`;
    }

    function _renderFeatureImportanceChart(featureData) {
        const chartId = 'feature-importance-chart-container';
        const container = document.getElementById(chartId);
        if (!container) return;

        if (!featureData || featureData.length === 0) {
            container.innerHTML = '<p class="text-muted small p-2 text-center">No feature data to display.</p>';
            return;
        }

        const chartData = featureData.map(f => ({
            name: f.featureName,
            value: f.or?.value ?? 0,
            ci_lower: f.or?.ci?.lower ?? 0,
            ci_upper: f.or?.ci?.upper ?? 0
        })).sort((a,b) => b.value - a.value);

        const margin = { top: 20, right: 30, bottom: 40, left: 150 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        container.innerHTML = '';
        const svg = d3.select(container).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        const xMax = d3.max(chartData, d => d.ci_upper);
        const x = d3.scaleLinear()
            .domain([0, Math.max(10, xMax)])
            .range([0, width]);

        const y = d3.scaleBand()
            .range([0, height])
            .domain(chartData.map(d => d.name))
            .padding(0.3);

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5));

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        svg.append('line')
            .attr('x1', x(1))
            .attr('x2', x(1))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', 'red')
            .attr('stroke-dasharray', '4');

        svg.selectAll('.error-bar')
            .data(chartData)
            .enter()
            .append('line')
            .attr('class', 'error-bar')
            .attr('x1', d => x(d.ci_lower))
            .attr('x2', d => x(d.ci_upper))
            .attr('y1', d => y(d.name) + y.bandwidth() / 2)
            .attr('y2', d => y(d.name) + y.bandwidth() / 2)
            .attr('stroke', 'gray')
            .attr('stroke-width', '1px');

        svg.selectAll('.or-point')
            .data(chartData)
            .enter()
            .append('circle')
            .attr('class', 'or-point')
            .attr('cx', d => x(d.value))
            .attr('cy', d => y(d.name) + y.bandwidth() / 2)
            .attr('r', 4)
            .attr('fill', window.APP_CONFIG.CHART_SETTINGS.AS_COLOR);
    }
    
    function render(insightsState, allStats) {
        if (!insightsState || !allStats) return '<p class="text-danger">Insights tab cannot be rendered due to missing data.</p>';
        
        const { studyId } = insightsState;
        
        const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(studyId);
        let cohortIdForAnalysis;
        if (studyId.startsWith('bf_')) {
            cohortIdForAnalysis = studyId.split('_')[1];
        } else {
            cohortIdForAnalysis = studySet?.applicableCohort || window.APP_CONFIG.COHORTS.OVERALL.id;
        }
        
        const statsForCohort = allStats[cohortIdForAnalysis];
        
        let powerAnalysisData = null;
        if(statsForCohort?.insights?.powerAnalysis?.[studyId]) {
            powerAnalysisData = statsForCohort.insights.powerAnalysis[studyId];
        } else if (studyId.startsWith('bf_')) {
            const metric = studyId.split('_')[2];
            if(statsForCohort?.insights?.powerAnalysis?.[`bf_${cohortIdForAnalysis}_${metric}`]) {
                powerAnalysisData = statsForCohort.insights.powerAnalysis[`bf_${cohortIdForAnalysis}_${metric}`];
            }
        }
        
        let mismatchAnalysisData = null;
        if(statsForCohort?.insights?.mismatchAnalysis?.[studyId]) {
            mismatchAnalysisData = statsForCohort.insights.mismatchAnalysis[studyId];
        } else if (studyId.startsWith('bf_')) {
             const metric = studyId.split('_')[2];
             if(statsForCohort?.insights?.mismatchAnalysis?.[`bf_${cohortIdForAnalysis}_${metric}`]) {
                 mismatchAnalysisData = statsForCohort.insights.mismatchAnalysis[`bf_${cohortIdForAnalysis}_${metric}`];
             }
        }

        const featureImportanceData = statsForCohort?.insights?.featureImportance;
        
        const controlsHTML = _createControlsHTML(insightsState, allStats);
        
        const powerCard = window.uiComponents.createStatisticsCard(
            'power-analysis',
            'Power & Sample Size Analysis',
            window.uiComponents.createPowerAnalysisCardHTML(insightsState, powerAnalysisData),
            true,
            'powerAnalysis'
        );

        const mismatchCard = window.uiComponents.createStatisticsCard(
            'mismatch-analysis',
            'Mismatch Analysis',
            window.uiComponents.createMismatchAnalysisCardHTML(mismatchAnalysisData),
            true,
            'mismatchAnalysis'
        );

        const featureImportanceCard = window.uiComponents.createStatisticsCard(
            'feature-importance-analysis',
            'T2 Feature Importance',
            window.uiComponents.createFeatureImportanceCardHTML(featureImportanceData),
            true,
            'featureImportance'
        );

        setTimeout(() => {
            _renderFeatureImportanceChart(featureImportanceData);
        }, 50);

        return `
            <div class="container-fluid">
                ${controlsHTML}
                <div class="row g-4">
                    <div class="col-lg-12">${powerCard}</div>
                    <div class="col-lg-6">${mismatchCard}</div>
                    <div class="col-lg-6">${featureImportanceCard}</div>
                </div>
            </div>`;
    }

    return Object.freeze({
        render
    });
})();