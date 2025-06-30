window.comparisonTab = (() => {

    function _createASPerformanceViewHTML(comparisonData) {
        const { statsGesamt, statsSurgeryAlone, statsNeoadjuvantTherapy, globalCohort, statsCurrentCohort, patientCount, processedData } = comparisonData || {};
        const na = window.APP_CONFIG.NA_PLACEHOLDER;

        const cohortsData = [
            { id: window.APP_CONFIG.COHORTS.OVERALL.id, stats: statsGesamt?.performanceAS },
            { id: window.APP_CONFIG.COHORTS.SURGERY_ALONE.id, stats: statsSurgeryAlone?.performanceAS },
            { id: window.APP_CONFIG.COHORTS.NEOADJUVANT.id, stats: statsNeoadjuvantTherapy?.performanceAS }
        ];

        const currentCohortName = getCohortDisplayName(globalCohort);
        const displayPatientCount = patientCount > 0 ? patientCount : (statsCurrentCohort?.matrix?.tp + statsCurrentCohort?.matrix?.fp + statsCurrentCohort?.matrix?.fn + statsCurrentCohort?.matrix?.tn) || 0;
        const hasDataForCurrent = !!(statsCurrentCohort && statsCurrentCohort.matrix && displayPatientCount > 0);

        const createPerfTableRow = (stats, cohortKey) => {
            const cohortDisplayName = getCohortDisplayName(cohortKey);
            const fCI_p = (m, k) => { 
                const d = (k === 'auc' || k === 'f1' || k ==='youden' || k === 'balAcc') ? 3 : 0; 
                const p = !(k === 'auc' || k === 'f1' || k ==='youden' || k === 'balAcc'); 
                return formatCI(m?.value, m?.ci?.lower, m?.ci?.upper, d, p, na); 
            };
            if (!stats || typeof stats.matrix !== 'object') {
                const nPatients = (cohortKey === 'Overall' ? statsGesamt?.descriptive?.patientCount : (cohortKey === 'surgeryAlone' ? statsSurgeryAlone?.descriptive?.patientCount : statsNeoadjuvantTherapy?.descriptive?.patientCount)) || '?';
                return `<tr><td class="fw-bold">${cohortDisplayName} (N=${nPatients})</td><td colspan="6" class="text-muted text-center">Data missing</td></tr>`;
            }
            const count = stats.matrix ? (stats.matrix.tp + stats.matrix.fp + stats.matrix.fn + stats.matrix.tn) : 0;
            return `<tr>
                        <td class="fw-bold">${cohortDisplayName} (N=${count})</td>
                        <td data-tippy-content="${getInterpretationTooltip('sens', stats.sens)}">${fCI_p(stats.sens, 'sens')}</td>
                        <td data-tippy-content="${getInterpretationTooltip('spec', stats.spec)}">${fCI_p(stats.spec, 'spec')}</td>
                        <td data-tippy-content="${getInterpretationTooltip('ppv', stats.ppv)}">${fCI_p(stats.ppv, 'ppv')}</td>
                        <td data-tippy-content="${getInterpretationTooltip('npv', stats.npv)}">${fCI_p(stats.npv, 'npv')}</td>
                        <td data-tippy-content="${getInterpretationTooltip('acc', stats.acc)}">${fCI_p(stats.acc, 'acc')}</td>
                        <td data-tippy-content="${getInterpretationTooltip('auc', stats.auc)}">${fCI_p(stats.auc, 'auc')}</td>
                    </tr>`;
        };
        const tableId = "comp-as-perf-table";
        const chartId = "comp-as-perf-chart";

        let tableHTML = `
            <div class="col-12">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center"><span>AS Performance vs. N for All Cohorts</span></div>
                    <div class="card-body p-0"><div class="table-responsive"><table class="table table-striped table-hover table-sm small mb-0" id="${tableId}">
                        <thead class="small"><tr>
                            <th data-tippy-content="Patient cohort and its size (N).">Cohort</th>
                            <th data-tippy-content="${getDefinitionTooltip('sens')}">Sens. (95% CI)</th>
                            <th data-tippy-content="${getDefinitionTooltip('spec')}">Spec. (95% CI)</th>
                            <th data-tippy-content="${getDefinitionTooltip('ppv')}">PPV (95% CI)</th>
                            <th data-tippy-content="${getDefinitionTooltip('npv')}">NPV (95% CI)</th>
                            <th data-tippy-content="${getDefinitionTooltip('acc')}">Acc. (95% CI)</th>
                            <th data-tippy-content="${getDefinitionTooltip('auc')}">AUC (95% CI)</th>
                        </tr></thead>
                        <tbody>${cohortsData.map(c => createPerfTableRow(c.stats, c.id)).join('')}</tbody>
                    </table></div></div>
                </div>
            </div>`;

        let chartHTML = `
            <div class="col-lg-8 offset-lg-2">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center"><span>Performance Visualization (AS vs. N) - Cohort: ${currentCohortName}</span>
                    </div>
                    <div class="card-body p-1"><div id="${chartId}" class="comp-chart-container border rounded" style="min-height: 280px;">${hasDataForCurrent ? '' : `<p class="text-center text-muted p-3">No data for chart (${currentCohortName}).</p>`}</div></div>
                </div>
            </div>`;
        return `<div class="row g-3"><div class="col-12"><h3 class="text-center mb-3">Diagnostic Performance - Avocado Sign</h3></div>${tableHTML}${chartHTML}</div>`;
    }
    
    function _createASvsT2ComparisonViewHTML(comparisonData, selectedStudyId) {
        const { performanceAS, performanceT2, comparison, comparisonCriteriaSet, cohortForComparison, patientCountForComparison, t2ShortName } = comparisonData || {};
        const na_stat = window.APP_CONFIG.NA_PLACEHOLDER;
        const displayCohortForComparison = getCohortDisplayName(cohortForComparison);
        
        let comparisonBasisName = "N/A", comparisonInfoHTML = '<p class="text-muted small">Please select a T2 criteria basis for comparison.</p>';
        if (selectedStudyId && comparisonCriteriaSet) {
            const studyInfo = comparisonCriteriaSet.studyInfo;
            comparisonBasisName = comparisonCriteriaSet.displayShortName || comparisonCriteriaSet.name || selectedStudyId;
            let criteriaHTML = comparisonCriteriaSet.logic === 'KOMBINIERT' ? (studyInfo?.keyCriteriaSummary || comparisonCriteriaSet.description) : window.studyT2CriteriaManager.formatCriteriaForDisplay(comparisonCriteriaSet.criteria, comparisonCriteriaSet.logic, false);
            comparisonInfoHTML = `<dl class="row small mb-0"><dt class="col-sm-4">Reference:</dt><dd class="col-sm-8">${studyInfo?.refKey ? `Published in ${window.studyT2CriteriaManager.getStudyCriteriaSetById(studyInfo.refKey)?.name || studyInfo.refKey}` : (studyInfo?.isDynamic ? 'Data-driven (Brute-Force)' : 'N/A')}</dd><dt class="col-sm-4">Basis Cohort:</dt><dd class="col-sm-8">${studyInfo?.patientCohort || `Current: ${displayCohortForComparison} (N=${patientCountForComparison || '?'})`}</dd><dt class="col-sm-4">Criteria:</dt><dd class="col-sm-8"><code>${criteriaHTML}</code></dd></dl>`;
        }

        const litStudySets = window.studyT2CriteriaManager.getAllStudyCriteriaSets();
        const bfResults = window.bruteForceManager.getAllResults();
        
        const createOptions = (sets) => sets.map(set => `<option value="${set.id}" ${selectedStudyId === set.id ? 'selected' : ''}>${set.name || set.id}</option>`).join('');

        const groupedLitSets = litStudySets.reduce((acc, set) => {
            const group = set.group || 'Other Literature Criteria';
            if (!acc[group]) acc[group] = [];
            acc[group].push(set);
            return acc;
        }, {});

        const bfOptionsHTML = Object.keys(bfResults).map(cohortId => {
            const metric = window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC;
            if (bfResults[cohortId]?.[metric]) {
                const bfId = `bf_${cohortId}`;
                return `<option value="${bfId}" ${selectedStudyId === bfId ? 'selected' : ''}>Best Case T2 (${getCohortDisplayName(cohortId)})</option>`;
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

        const selectHTML = `
            <select class="form-select" id="comp-study-select">
                <option value="" ${!selectedStudyId ? 'selected' : ''} disabled>-- Please select --</option>
                ${optgroupHTML}
            </select>`;

        let resultsHTML = '';
        const canDisplayResults = !!(selectedStudyId && performanceAS && performanceT2 && comparison && comparisonCriteriaSet && patientCountForComparison > 0);

        if (canDisplayResults) {
            const t2ShortNameEffective = t2ShortName || (comparisonCriteriaSet?.displayShortName || 'T2');
            const metrics = [
                { key: 'sens', name: 'Sensitivity' },
                { key: 'spec', name: 'Specificity' },
                { key: 'ppv', name: 'PPV' },
                { key: 'npv', name: 'NPV' },
                { key: 'acc', name: 'Accuracy' },
                { key: 'auc', name: 'AUC' }
            ];

            let comparisonTableHTML = `<div class="table-responsive"><table class="table table-sm table-striped small mb-0" id="comp-as-vs-t2-comp-table"><thead class="small"><tr><th>Metric</th><th>AS (Value, 95% CI)</th><th>${t2ShortNameEffective} (Value, 95% CI)</th><th>p-Value</th></tr></thead><tbody>`;
            metrics.forEach(metric => {
                const isRate = !(metric.key === 'auc');
                const digits = (metric.key === 'auc') ? 3 : 0;
                const valAS = formatCI(performanceAS[metric.key]?.value, performanceAS[metric.key]?.ci?.lower, performanceAS[metric.key]?.ci?.upper, digits, isRate, na_stat);
                const valT2 = formatCI(performanceT2[metric.key]?.value, performanceT2[metric.key]?.ci?.lower, performanceT2[metric.key]?.ci?.upper, digits, isRate, na_stat);
                
                let pValue = na_stat;
                let pValueTooltip = 'Comparison not applicable for this metric.';
                if (metric.key === 'acc' && comparison.mcnemar) {
                    pValue = getPValueText(comparison.mcnemar.pValue, false) + ' ' + getStatisticalSignificanceSymbol(comparison.mcnemar.pValue);
                    pValueTooltip = getInterpretationTooltip('pValue', {value: comparison.mcnemar.pValue, testName: 'McNemar'}, { method1: 'AS', method2: t2ShortNameEffective, metricName: 'Accuracy'});
                } else if (metric.key === 'auc' && comparison.delong) {
                    pValue = getPValueText(comparison.delong.pValue, false) + ' ' + getStatisticalSignificanceSymbol(comparison.delong.pValue);
                    pValueTooltip = getInterpretationTooltip('pValue', {value: comparison.delong.pValue, testName: 'DeLong'}, { method1: 'AS', method2: t2ShortNameEffective, metricName: 'AUC'});
                }

                comparisonTableHTML += `<tr><td data-tippy-content="${getDefinitionTooltip(metric.key)}">${metric.name}</td><td data-tippy-content="${getInterpretationTooltip('sens', performanceAS[metric.key])}">${valAS}</td><td data-tippy-content="${getInterpretationTooltip('spec', performanceT2[metric.key])}">${valT2}</td><td data-tippy-content="${pValueTooltip}">${pValue}</td></tr>`;
            });
            comparisonTableHTML += `</tbody></table></div>`;
            const comparisonTableCardHTML = window.uiComponents.createStatisticsCard('comp-as-vs-t2-comp-table_card', `Performance Metrics (AS vs. ${t2ShortNameEffective})`, comparisonTableHTML, false, null, []);
            
            const chartContainerId = "comp-chart-container";
            resultsHTML = `<div class="row g-3 comparison-row">
                     <div class="col-lg-7 col-xl-7 comparison-col-left">
                        <div class="card h-100">
                             <div class="card-header d-flex justify-content-between align-items-center"><span>Comparison Chart (AS vs. ${t2ShortNameEffective})</span>
                             </div>
                            <div class="card-body p-1 d-flex align-items-center justify-content-center"><div id="${chartContainerId}" class="comp-chart-container w-100" style="min-height: 300px;"><p class="text-muted small text-center p-3">Loading comparison chart...</p></div></div>
                        </div>
                    </div>
                    <div class="col-lg-5 col-xl-5 comparison-col-right d-flex flex-column">
                         <div class="card mb-3 flex-shrink-0" id="comp-t2-basis-info-card"><div class="card-header card-header-sm">T2 Criteria Comparison Basis</div><div class="card-body p-2">${comparisonInfoHTML}</div></div>
                         <div class="card mb-3 flex-grow-1">${comparisonTableCardHTML}</div>
                    </div>
                </div>`;
        } else {
             resultsHTML = `<div class="alert alert-info">Please select a comparison basis. The analysis will be performed on the methodologically correct cohort for the selected criteria set.</div>`;
        }
        
        let contextBannerHTML = '';
        const analysisContext = window.state.getAnalysisContext();
        if (analysisContext) {
            contextBannerHTML = window.uiComponents.createAnalysisContextBannerHTML(analysisContext, patientCountForComparison);
        }

        return `<div class="row mb-4"><div class="col-12"><h4 class="text-center mb-1">Comparison: Avocado Sign vs. T2 Criteria</h4>${contextBannerHTML}<div class="row justify-content-center mt-2"><div class="col-md-9 col-lg-7"><div class="input-group input-group-sm"><label class="input-group-text" for="comp-study-select">T2 Comparison Basis:</label>${selectHTML}</div></div></div></div></div><div id="comparison-as-vs-t2-results">${resultsHTML}</div>`;
    }

    function render(view, comparisonData, selectedStudyIdFromState, currentGlobalCohort) {
        let chartDataForComparison = [];
        let t2ShortNameEffectiveForChart = "T2";

        if (comparisonData && comparisonData.performanceAS && comparisonData.performanceT2) {
            const performanceAS = comparisonData.performanceAS;
            const performanceT2 = comparisonData.performanceT2;
            t2ShortNameEffectiveForChart = comparisonData.t2ShortName || (comparisonData.comparisonCriteriaSet?.displayShortName || 'T2');

            chartDataForComparison = [
                { metric: 'Sens.', AS: performanceAS.sens?.value || 0, T2: performanceT2.sens?.value || 0 },
                { metric: 'Spec.', AS: performanceAS.spec?.value || 0, T2: performanceT2.spec?.value || 0 },
                { metric: 'PPV', AS: performanceAS.ppv?.value || 0, T2: performanceT2.ppv?.value || 0 },
                { metric: 'NPV', AS: performanceAS.npv?.value || 0, T2: performanceT2.npv?.value || 0 },
                { metric: 'AUC', AS: performanceAS.auc?.value || 0, T2: performanceT2.auc?.value || 0 }
            ];
        }

        let viewSelectorHTML = `
            <div class="row mb-4">
                <div class="col-12 d-flex justify-content-center">
                    <div class="btn-group btn-group-sm" role="group" aria-label="Comparison View Selection">
                        <input type="radio" class="btn-check" name="comparisonView" id="view-as-perf" autocomplete="off" value="as-pur" ${view === 'as-pur' ? 'checked' : ''}>
                        <label class="btn btn-outline-primary comp-view-btn" for="view-as-perf"><i class="fas fa-star me-1"></i> AS Performance</label>
                        <input type="radio" class="btn-check" name="comparisonView" id="view-as-vs-t2" value="as-vs-t2" autocomplete="off" ${view === 'as-vs-t2' ? 'checked' : ''}>
                        <label class="btn btn-outline-primary comp-view-btn" for="view-as-vs-t2"><i class="fas fa-exchange-alt me-1"></i> AS vs. T2 Comparison</label>
                    </div>
                </div>
            </div>`;

        let contentHTML = (view === 'as-pur') 
            ? _createASPerformanceViewHTML(comparisonData)
            : _createASvsT2ComparisonViewHTML(comparisonData, selectedStudyIdFromState);
        
        setTimeout(() => {
            if (view === 'as-pur' && comparisonData?.statsCurrentCohort) {
                const chartId = "comp-as-perf-chart";
                const dataForROC = window.dataProcessor.filterDataByCohort(comparisonData.processedData, comparisonData.globalCohort);
                if (document.getElementById(chartId) && dataForROC.length > 0) {
                    window.chartRenderer.renderDiagnosticPerformanceChart(dataForROC, 'asStatus', 'nStatus', chartId, window.APP_CONFIG.UI_TEXTS.legendLabels.avocadoSign);
                } else if (document.getElementById(chartId)) {
                    window.uiManager.updateElementHTML(chartId, `<p class="text-center text-muted p-3">No data for chart (${getCohortDisplayName(comparisonData.globalCohort)}).</p>`);
                }
            } else if (view === 'as-vs-t2' && comparisonData?.performanceAS && comparisonData?.performanceT2) {
                const chartContainerId = "comp-chart-container";
                if (document.getElementById(chartContainerId)) {
                    window.chartRenderer.renderComparisonBarChart(chartDataForComparison, chartContainerId, {}, t2ShortNameEffectiveForChart);
                }
            }
        }, 100);
        
        return viewSelectorHTML + `<div id="comparison-content-area">${contentHTML}</div>`;
    }
    
    return Object.freeze({
        render
    });
})();