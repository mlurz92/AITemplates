window.statisticsTab = (() => {

    function createDescriptiveStatsContentHTML(stats, indexSuffix, cohortId) {
        if (!stats || !stats.descriptive || !stats.descriptive.patientCount) return '<p class="text-muted small p-3">No descriptive data available.</p>';
        const d = stats.descriptive;
        const total = d.patientCount;
        const na = window.APP_CONFIG.NA_PLACEHOLDER;
        const fv = (val, dig = 1, useStd = true) => formatNumber(val, dig, na, useStd);
        const fLK = (lkData) => {
            if (!lkData || isNaN(lkData.median)) return na;
            return `${fv(lkData.median,1)} (${fv(lkData.min,0)}–${fv(lkData.max,0)}) [${fv(lkData.mean,1)} ± ${fv(lkData.sd,1)}]`;
        };
        const appliedCriteria = window.t2CriteriaManager.getAppliedCriteria();
        const appliedLogic = window.t2CriteriaManager.getAppliedLogic();
        const formattedAppliedT2 = window.studyT2CriteriaManager.formatCriteriaForDisplay(appliedCriteria, appliedLogic, true);
        const tooltips = window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics;
        
        const getCountString = (count, total) => {
            if (total === 0 || count === undefined || count === null) return `0 (${na})`;
            return `${count} (${formatPercent(count / total, 1)})`;
        };

        const getTooltip = (key, cohortId) => {
            let content = tooltips[key]?.description || '';
            return content.replace('[COHORT]', `<strong>${getCohortDisplayName(cohortId)}</strong>`);
        };

        return `
            <div class="row g-3 p-2">
                <div class="col-md-6">
                    <div class="table-responsive mb-3">
                        <table class="table table-sm table-striped small mb-0 caption-top" id="table-descriptive-demographics-${indexSuffix}">
                            <caption>Demographics & Status (N=${total})</caption>
                            <thead class="visually-hidden"><tr><th>Metric</th><th>Value</th></tr></thead>
                            <tbody>
                                <tr data-tippy-content="Patient age in years (Median, Min–Max, Mean ± Standard Deviation)."><td>Age, Median (Min–Max) [Mean ± SD]</td><td>${fv(d.age?.median,1)} (${fv(d.age?.min,0)}–${fv(d.age?.max,0)}) [${fv(d.age?.mean,1)} ± ${fv(d.age?.sd,1)}]</td></tr>
                                <tr data-tippy-content="Distribution of male and female patients."><td>Sex (male / female) (n / %)</td><td>${getCountString(d.sex?.m, total)} / ${getCountString(d.sex?.f, total)}</td></tr>
                                <tr data-tippy-content="Distribution of treatment approaches before surgery."><td>Therapy (Surgery alone / Neoadjuvant therapy) (n / %)</td><td>${getCountString(d.therapy?.surgeryAlone, total)} / ${getCountString(d.therapy?.neoadjuvantTherapy, total)}</td></tr>
                                <tr data-tippy-content="Distribution of final histopathological N-Status (N+/N-)."><td>N Status (+ / -) (n / %)</td><td>${getCountString(d.nStatus?.plus, total)} / ${getCountString(d.nStatus?.minus, total)}</td></tr>
                                <tr data-tippy-content="Distribution of Avocado Sign status (AS+/AS-)."><td>AS Status (+ / -) (n / %)</td><td>${getCountString(d.asStatus?.plus, total)} / ${getCountString(d.asStatus?.minus, total)}</td></tr>
                                <tr data-tippy-content="Distribution of T2 criteria status (T2+/T2-) based on applied settings: ${formattedAppliedT2}."><td>T2 Status (+ / -)</td><td>${getCountString(d.t2Status?.plus, total)} / ${getCountString(d.t2Status?.minus, total)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                     <div class="table-responsive">
                        <table class="table table-sm table-striped small mb-0 caption-top" id="table-descriptive-ln-${indexSuffix}">
                             <caption>Lymph Node Counts (Median (Min–Max) [Mean ± SD])</caption>
                             <thead class="visually-hidden"><tr><th>Metric</th><th>Value</th></tr></thead>
                             <tbody>
                                <tr data-tippy-content="Number of histopathologically examined lymph nodes per patient."><td>LN N total</td><td>${fLK(d.lnCounts?.n?.total)}</td></tr>
                                <tr data-tippy-content="Number of pathologically positive lymph nodes per patient, evaluated only in N+ patients (n=${d.nStatus?.plus ?? 0})."><td>LN N+ <sup>*</sup></td><td>${fLK(d.lnCounts?.n?.plus)}</td></tr>
                                <tr data-tippy-content="Total number of lymph nodes visible on T1-CE MRI per patient."><td>LN AS total</td><td>${fLK(d.lnCounts?.as?.total)}</td></tr>
                                <tr data-tippy-content="Number of Avocado Sign positive lymph nodes per patient, evaluated only in AS+ patients (n=${d.asStatus?.plus ?? 0})."><td>LN AS+ <sup>**</sup></td><td>${fLK(d.lnCounts?.as?.plus)}</td></tr>
                                <tr data-tippy-content="Total number of lymph nodes visible on T2-based images per patient."><td>LN T2 total</td><td>${fLK(d.lnCounts?.t2?.total)}</td></tr>
                                <tr data-tippy-content="Number of T2-positive lymph nodes (based on applied criteria) per patient, evaluated only in T2+ patients (n=${d.t2Status?.plus ?? 0})."><td>LN T2+ <sup>***</sup></td><td>${fLK(d.lnCounts?.t2?.plus)}</td></tr>
                             </tbody>
                        </table>
                     </div>
                    <p class="small text-muted mt-1 mb-0"><sup>*</sup> Only in N+ patients (n=${d.nStatus?.plus ?? 0}); <sup>**</sup> Only in AS+ patients (n=${d.asStatus?.plus ?? 0}); <sup>***</sup> Only in T2+ patients (n=${d.t2Status?.plus ?? 0}).</p>
                </div>
                <div class="col-md-6 d-flex flex-column">
                    <div class="mb-2 flex-grow-1" id="chart-stat-age-${indexSuffix}" data-tippy-content="${getTooltip('age', cohortId)}"></div>
                    <div class="flex-grow-1" id="chart-stat-gender-${indexSuffix}" data-tippy-content="${getTooltip('gender', cohortId)}"></div>
                </div>
            </div>`;
    }

    function createCriteriaComparisonTableHTML(allStats) {
        const na_stat = window.APP_CONFIG.NA_PLACEHOLDER;
        const results = [];
        const allLitSets = window.studyT2CriteriaManager.getAllStudyCriteriaSets();

        const addResults = (items, groupTitle) => {
            if (items.length > 0) {
                results.push({ isSeparator: true, name: `<strong>${groupTitle}</strong>` });
                items.forEach(item => results.push(item));
            }
        };

        const generateRowData = (name, pValue, performanceStats, isPlaceholder = false) => ({
            name, pValue, isPlaceholder, ...performanceStats
        });

        const asPerf = allStats['Overall']?.performanceAS;
        if (asPerf) {
            results.push({
                group: 'Avocado Sign',
                name: 'Avocado Sign (Overall Cohort)',
                ...asPerf
            });
        }
        
        const litSurgeryAlone = [], litNeoadjuvant = [], litOverall = [];
        allLitSets.forEach(set => {
            const cohortForSet = set.applicableCohort || 'Overall';
            const statsForSet = allStats[cohortForSet];
            if (statsForSet) {
                const perf = statsForSet.performanceT2Literature?.[set.id];
                const comp = statsForSet.comparisonASvsT2Literature?.[set.id];
                if (perf) {
                    const row = generateRowData(
                        `${set.name}<br><em class="text-muted small fw-normal">(Cohort: ${getCohortDisplayName(cohortForSet)})</em>`,
                        comp?.delong?.pValue,
                        perf
                    );
                    if (cohortForSet === 'surgeryAlone') litSurgeryAlone.push(row);
                    else if (cohortForSet === 'neoadjuvantTherapy') litNeoadjuvant.push(row);
                    else litOverall.push(row);
                }
            }
        });
        
        addResults(litSurgeryAlone, 'Literature-Based T2 Criteria (Surgery-alone Cohort)');
        addResults(litNeoadjuvant, 'Literature-Based T2 Criteria (Neoadjuvant-therapy Cohort)');
        addResults(litOverall, 'Literature-Based T2 Criteria (Overall Cohort)');

        if (results.length === 0) return '<p class="text-muted small p-3">No criteria comparison data.</p>';
        
        let tableHtml = `<div class="table-responsive"><table class="table table-sm table-striped small mb-0"><thead><tr>
            <th data-tippy-content="Method or criteria set being evaluated.">Set</th>
            <th data-tippy-content="${getDefinitionTooltip('sens')}">Sens.</th>
            <th data-tippy-content="${getDefinitionTooltip('spec')}">Spec.</th>
            <th data-tippy-content="${getDefinitionTooltip('ppv')}">PPV</th>
            <th data-tippy-content="${getDefinitionTooltip('npv')}">NPV</th>
            <th data-tippy-content="${getDefinitionTooltip('auc')}">AUC</th>
            <th data-tippy-content="${getDefinitionTooltip('pValue')}">p-Value (vs AS)</th>
        </tr></thead><tbody>`;

        results.forEach(r => {
            if (r.isSeparator) {
                tableHtml += `<tr><td colspan="7" class="text-start table-group-divider fw-bold pt-2">${r.name}</td></tr>`;
                return;
            }

            if (r.isPlaceholder) {
                tableHtml += `<tr><td>${r.name}</td><td colspan="6" class="text-center text-muted">${na_stat}</td></tr>`;
                return;
            }

            const pValueTooltip = (r.pValue !== undefined) ? getInterpretationTooltip('pValue', {value: r.pValue, testName: 'DeLong'}, {comparisonName: 'AUC', method1: 'AS', method2: r.name}) : 'Comparison not applicable';
            const pValueCellContent = (r.pValue !== undefined) ? `${getPValueText(r.pValue, false)} ${getStatisticalSignificanceSymbol(r.pValue)}` : na_stat;

            tableHtml += `<tr>
                <td>${r.name}</td>
                <td>${formatPercent(r.sens?.value, 1, na_stat)}</td>
                <td>${formatPercent(r.spec?.value, 1, na_stat)}</td>
                <td>${formatPercent(r.ppv?.value, 1, na_stat)}</td>
                <td>${formatPercent(r.npv?.value, 1, na_stat)}</td>
                <td>${formatNumber(r.auc?.value, 3, na_stat, true)}</td>
                <td data-tippy-content="${pValueTooltip}">${pValueCellContent}</td>
            </tr>`;
        });

        tableHtml += `</tbody></table></div>`;
        return tableHtml;
    }

    function render(processedData, appliedCriteria, appliedLogic, layout, cohort1, cohort2, globalCohort) {
        if (!processedData) throw new Error("Statistics data not available.");
        
        const allCohortStats = window.statisticsService.calculateAllPublicationStats(processedData, appliedCriteria, appliedLogic, window.bruteForceManager.getAllResults());
        const na_stat = window.APP_CONFIG.NA_PLACEHOLDER;
        
        let cohortIdsToShow = [];
        if (layout === 'einzel') {
            cohortIdsToShow.push(globalCohort);
        } else {
            cohortIdsToShow.push(cohort1, cohort2);
        }

        const datasetsExist = cohortIdsToShow.some(cid => allCohortStats[cid] && allCohortStats[cid].descriptive.patientCount > 0);
        if (!datasetsExist) {
            const emptyStateHTML = `
                <div class="d-flex justify-content-end mb-3">
                    <div class="btn-group btn-group-sm">
                        <button id="statistics-toggle-single" class="btn btn-outline-primary ${layout === 'einzel' ? 'active' : ''}">Single View</button>
                        <button id="statistics-toggle-comparison" class="btn btn-outline-primary ${layout === 'vergleich' ? 'active' : ''}">Comparison View</button>
                    </div>
                </div>
                <div class="alert alert-warning">No data available for the selected statistics cohort(s).</div>`;
            return emptyStateHTML;
        }
        
        const outerRow = document.createElement('div');
        outerRow.className = 'row g-4';
        const formattedAppliedT2Short = `Applied T2 (${window.studyT2CriteriaManager.formatCriteriaForDisplay(appliedCriteria, appliedLogic, true)})`;
        const formattedAppliedT2Long = `Applied T2 (${window.studyT2CriteriaManager.formatCriteriaForDisplay(appliedCriteria, appliedLogic, false)})`;

        cohortIdsToShow.forEach((cohortId, i) => {
            const stats = allCohortStats[cohortId];
            const col = document.createElement('div');
            col.className = layout === 'vergleich' ? 'col-xl-6' : 'col-12';
            const innerRowId = `inner-stat-row-${i}`;
            
            if (stats && stats.descriptive.patientCount > 0) {
                col.innerHTML = `<h4 class="mb-3">Cohort: ${getCohortDisplayName(cohortId)} (N=${stats.descriptive.patientCount})</h4><div class="row g-3" id="${innerRowId}"></div>`;
                outerRow.appendChild(col);
                const innerContainer = col.querySelector(`#${innerRowId}`);

                innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`descriptive-stats-${i}`, 'Descriptive Statistics', createDescriptiveStatsContentHTML(stats, i, cohortId), true, 'descriptiveStatistics', cohortId);

                const fCI_p_stat = (m, k) => { const d = (k === 'auc' || k ==='f1' || k==='youden' || k === 'balAcc') ? 3 : 1; const p = !(k === 'auc'||k==='f1'||k==='youden' || k === 'balAcc'); return formatCI(m?.value, m?.ci?.lower, m?.ci?.upper, d, p, na_stat); };
                
                const createPerfTableHTML = (perfStats) => {
                    if (!perfStats || typeof perfStats.matrix !== 'object') return '<p class="text-muted small p-2">No diagnostic performance data.</p>';
                    return `<div class="table-responsive"><table class="table table-sm table-striped small mb-0"><thead><tr>
                        <th data-tippy-content="The diagnostic metric being evaluated.">Metric</th>
                        <th data-tippy-content="The calculated value for the metric, with its 95% Confidence Interval in parentheses.">Value (95% CI)</th>
                        <th data-tippy-content="The statistical method used to calculate the confidence interval.">CI Method</th></tr></thead><tbody>
                        <tr><td data-tippy-content="${getDefinitionTooltip('sens')}">Sensitivity</td><td data-tippy-content="${getInterpretationTooltip('sens', perfStats.sens)}">${fCI_p_stat(perfStats.sens, 'sens')}</td><td>${perfStats.sens?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('spec')}">Specificity</td><td data-tippy-content="${getInterpretationTooltip('spec', perfStats.spec)}">${fCI_p_stat(perfStats.spec, 'spec')}</td><td>${perfStats.spec?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('ppv')}">PPV</td><td data-tippy-content="${getInterpretationTooltip('ppv', perfStats.ppv)}">${fCI_p_stat(perfStats.ppv, 'ppv')}</td><td>${perfStats.ppv?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('npv')}">NPV</td><td data-tippy-content="${getInterpretationTooltip('npv', perfStats.npv)}">${fCI_p_stat(perfStats.npv, 'npv')}</td><td>${perfStats.npv?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('acc')}">Accuracy</td><td data-tippy-content="${getInterpretationTooltip('acc', perfStats.acc)}">${fCI_p_stat(perfStats.acc, 'acc')}</td><td>${perfStats.acc?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('auc')}">AUC</td><td data-tippy-content="${getInterpretationTooltip('auc', perfStats.auc)}">${fCI_p_stat(perfStats.auc, 'auc')}</td><td>${perfStats.auc?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('f1')}">F1-Score</td><td data-tippy-content="${getInterpretationTooltip('f1', perfStats.f1)}">${fCI_p_stat(perfStats.f1, 'f1')}</td><td>${perfStats.f1?.method || na_stat}</td></tr>
                    </tbody></table></div>`;
                };

                const createCompTableHTML = (compStats) => {
                    if (!compStats) return '<p class="text-muted small p-2">No comparison data.</p>';
                    const mcnemarTooltip = getInterpretationTooltip('pValue', {value: compStats.mcnemar?.pValue, testName: 'McNemar'}, { method1: 'AS', method2: 'T2 Criteria', metricName: 'Accuracy'});
                    const delongTooltip = getInterpretationTooltip('pValue', {value: compStats.delong?.pValue, testName: 'DeLong'}, { method1: 'AS', method2: 'T2 Criteria', metricName: 'AUC'});
                    
                    return `<div class="table-responsive"><table class="table table-sm table-striped small mb-0"><thead><tr>
                        <th data-tippy-content="Statistical test used to compare the two methods.">Test</th>
                        <th data-tippy-content="The calculated value of the test statistic.">Statistic</th>
                        <th data-tippy-content="${getDefinitionTooltip('pValue')}">p-Value</th>
                        <th data-tippy-content="Name of the statistical test and any corrections applied.">Method</th></tr></thead><tbody>
                        <tr><td data-tippy-content="${getDefinitionTooltip('mcnemar')}">McNemar (Acc)</td><td>${formatNumber(compStats.mcnemar?.statistic, 3, na_stat, true)} (df=${compStats.mcnemar?.df || na_stat})</td><td data-tippy-content="${mcnemarTooltip}">${getPValueText(compStats.mcnemar?.pValue, false)} ${getStatisticalSignificanceSymbol(compStats.mcnemar?.pValue)}</td><td>${compStats.mcnemar?.method || na_stat}</td></tr>
                        <tr><td data-tippy-content="${getDefinitionTooltip('delong')}">DeLong (AUC)</td><td>Z=${formatNumber(compStats.delong?.Z, 3, na_stat, true)}</td><td data-tippy-content="${delongTooltip}">${getPValueText(compStats.delong?.pValue, false)} ${getStatisticalSignificanceSymbol(compStats.delong?.pValue)}</td><td>${compStats.delong?.method || na_stat}</td></tr>
                    </tbody></table></div>`;
                };

                const createAssocTableHTML = (assocStats, appliedCrit) => {
                    if (!assocStats || Object.keys(assocStats).length === 0) return '<p class="text-muted small p-2">No association data.</p>';
                    const fORCI = (orObj) => { const val = formatNumber(orObj?.value, 2, na_stat, true); const ciL = formatNumber(orObj?.ci?.lower, 2, na_stat, true); const ciU = formatNumber(orObj?.ci?.upper, 2, na_stat, true); return (val !== na_stat && ciL !== na_stat && ciU !== na_stat) ? `${val} (${ciL}-${ciU})` : val; };
                    const fRDCI = (rdObj) => { const val = formatNumber(rdObj?.value * 100, 1, na_stat, true); const ciL = formatNumber(rdObj?.ci?.lower * 100, 1, na_stat, true); const ciU = formatNumber(rdObj?.ci?.upper * 100, 1, na_stat, true); return (val !== na_stat && ciL !== na_stat && ciU !== na_stat) ? `${val}% (${ciL}%-${ciU}%)` : (val !== na_stat ? `${val}%` : na_stat); };
                    const fPhi = (phiObj) => formatNumber(phiObj?.value, 2, na_stat, true);

                    let html = `<div class="table-responsive"><table class="table table-sm table-striped small mb-0"><thead><tr>
                        <th data-tippy-content="The specific imaging feature being tested for association with N-Status.">Feature</th>
                        <th data-tippy-content="${getDefinitionTooltip('or')}">OR (95% CI)</th>
                        <th data-tippy-content="${getDefinitionTooltip('rd')}">RD (95% CI)</th>
                        <th data-tippy-content="${getDefinitionTooltip('phi')}">Phi</th>
                        <th data-tippy-content="${getDefinitionTooltip('pValue')}">p-Value</th>
                        <th data-tippy-content="The statistical test used to calculate the p-value.">Test</th></tr></thead><tbody>`;

                    const addRow = (key, name, obj) => {
                        const pValueTooltip = getInterpretationTooltip('pValue', { ...obj, value: obj.pValue, testName: obj.testName }, { featureName: escapeHTML(name) });
                        html += `<tr><td>${escapeHTML(name)}</td>
                            <td data-tippy-content="${getInterpretationTooltip('or', {...obj.or, featureName: escapeHTML(name)})}">${fORCI(obj.or)}</td>
                            <td data-tippy-content="${getInterpretationTooltip('rd', {...obj.rd, featureName: escapeHTML(name)})}">${fRDCI(obj.rd)}</td>
                            <td data-tippy-content="${getInterpretationTooltip('phi', {...obj.phi, featureName: escapeHTML(name)})}">${fPhi(obj.phi)}</td>
                            <td data-tippy-content="${pValueTooltip}">${getPValueText(obj.pValue, false)} ${getStatisticalSignificanceSymbol(obj.pValue)}</td>
                            <td>${obj.testName || na_stat}</td></tr>`;
                    };

                    if (assocStats.as) addRow('as', 'AS Positive', assocStats.as);
                    if (assocStats.size_mwu) {
                         const mwuTooltip = getInterpretationTooltip('pValue', { ...assocStats.size_mwu, value: assocStats.size_mwu.pValue, testName: assocStats.size_mwu.testName }, { comparisonName: 'median LN size between N+ and N- groups' });
                        html += `<tr><td>${assocStats.size_mwu.featureName}</td><td>${na_stat}</td><td>${na_stat}</td><td>${na_stat}</td><td data-tippy-content="${mwuTooltip}">${getPValueText(assocStats.size_mwu.pValue, false)} ${getStatisticalSignificanceSymbol(assocStats.size_mwu.pValue)}</td><td>${assocStats.size_mwu.testName || na_stat}</td></tr>`;
                    }

                    ['size', 'shape', 'border', 'homogeneity', 'signal'].forEach(fKey => {
                        if (assocStats[fKey]) {
                            const activeStatus = appliedCrit?.[fKey]?.active ? '' : ' (inactive)';
                            addRow(fKey, `${assocStats[fKey].featureName}${activeStatus}`, assocStats[fKey]);
                        }
                    });
                    html += `</tbody></table></div>`;
                    return html;
                };
                
                const addedValueContent = window.uiComponents.createAddedValueCardHTML(stats.addedValueAnalysis?.['Rutegard_2025'], 'ESGAR 2016');

                innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`performance-as-${i}`, 'Diagnostic Performance: Avocado Sign (vs. N)', createPerfTableHTML(stats.performanceAS), false, null, cohortId);
                innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`performance-t2-${i}`, `Diagnostic Performance: ${formattedAppliedT2Long} vs. N`, createPerfTableHTML(stats.performanceT2Applied), false, null, cohortId);
                innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`comparison-as-t2-${i}`, `Statistical Comparison: AS vs. Applied T2 Criteria`, createCompTableHTML(stats.comparisonASvsT2Applied), false, null, cohortId);
                innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`associations-${i}`, 'Association with N-Status', createAssocTableHTML(stats.associationsApplied, appliedCriteria), false, null, cohortId);
                if (cohortId === 'surgeryAlone') {
                    innerContainer.innerHTML += window.uiComponents.createStatisticsCard(`added-value-${i}`, 'Added Diagnostic Value of AS (vs. ESGAR 2016)', addedValueContent, false, 'addedValue', cohortId);
                }

            } else {
                 col.innerHTML = `<h4 class="mb-3">Cohort: ${getCohortDisplayName(cohortId)}</h4><div class="alert alert-warning small p-2">No data for this cohort.</div>`;
                 outerRow.appendChild(col);
            }
        });

        if (layout === 'vergleich' && allCohortStats[cohort1] && allCohortStats[cohort2] && allCohortStats.interCohortComparison && allCohortStats.interCohortDemographicComparison) {
             const compCard = document.createElement('div');
             compCard.className = 'col-12';
             const c1Stats = allCohortStats[cohort1];
             const c2Stats = allCohortStats[cohort2];
             const interComp = allCohortStats.interCohortComparison;
             const interDemoComp = allCohortStats.interCohortDemographicComparison;
             
             let compContent = '<p class="text-muted small p-2">Not enough data for cohort comparison.</p>';
             
             if(interComp.as && interComp.t2Applied && c1Stats && c2Stats) {
                 compContent = `<div class="table-responsive"><table class="table table-sm table-striped small mb-0">
                    <thead><tr>
                        <th>Metric</th>
                        <th>${getCohortDisplayName(cohort1)}</th>
                        <th>${getCohortDisplayName(cohort2)}</th>
                        <th data-tippy-content="P-value from Welch's t-test or Fisher's Exact Test for independent samples.">p-Value (unpaired)</th>
                    </tr></thead>
                    <tbody>
                        <tr><td>Age (Mean ± SD)</td><td>${formatNumber(c1Stats.descriptive.age.mean, 1)} ± ${formatNumber(c1Stats.descriptive.age.sd, 1)}</td><td>${formatNumber(c2Stats.descriptive.age.mean, 1)} ± ${formatNumber(c2Stats.descriptive.age.sd, 1)}</td><td>${getPValueText(interDemoComp?.age?.pValue, false)}</td></tr>
                        <tr><td>Sex (m / f)</td><td>${c1Stats.descriptive.sex.m} / ${c1Stats.descriptive.sex.f}</td><td>${c2Stats.descriptive.sex.m} / ${c2Stats.descriptive.sex.f}</td><td>${getPValueText(interDemoComp?.sex?.pValue, false)}</td></tr>
                        <tr><td>N-Status (+ / -)</td><td>${c1Stats.descriptive.nStatus.plus} / ${c1Stats.descriptive.nStatus.minus}</td><td>${c2Stats.descriptive.nStatus.plus} / ${c2Stats.descriptive.nStatus.minus}</td><td>${getPValueText(interDemoComp?.nStatus?.pValue, false)}</td></tr>
                        <tr class="table-group-divider"><td colspan="4"></td></tr>
                        <tr><td>AUC (Avocado Sign)</td><td>${formatNumber(c1Stats.performanceAS.auc.value, 3, na_stat, true)}</td><td>${formatNumber(c2Stats.performanceAS.auc.value, 3, na_stat, true)}</td><td>${getPValueText(interComp.as.pValue, false)}</td></tr>
                        <tr><td>AUC (${formattedAppliedT2Short})</td><td>${formatNumber(c1Stats.performanceT2Applied.auc.value, 3, na_stat, true)}</td><td>${formatNumber(c2Stats.performanceT2Applied.auc.value, 3, na_stat, true)}</td><td>${getPValueText(interComp.t2Applied.pValue, false)}</td></tr>
                    </tbody>
                 </table></div>`;
             }
             compCard.innerHTML = window.uiComponents.createStatisticsCard('cohort-comparison', `Cohort Comparison: ${getCohortDisplayName(cohort1)} vs. ${getCohortDisplayName(cohort2)}`, compContent, false, null, '');
             outerRow.appendChild(compCard);
        }

        if (layout === 'einzel') {
            const criteriaComparisonCard = document.createElement('div');
            criteriaComparisonCard.className = 'col-12';
            criteriaComparisonCard.innerHTML = window.uiComponents.createStatisticsCard(
                'criteria-comparison',
                `Criteria Comparison Table`,
                createCriteriaComparisonTableHTML(allCohortStats),
                false,
                'criteriaComparisonTable',
                globalCohort
            );
            outerRow.appendChild(criteriaComparisonCard);
        }

        const allCohorts = Object.values(window.APP_CONFIG.COHORTS);
        const cohortOptions1 = allCohorts.map(c => `<option value="${c.id}" ${c.id === cohort1 ? 'selected' : ''}>${c.displayName}</option>`).join('');
        const cohortOptions2 = allCohorts.map(c => `<option value="${c.id}" ${c.id === cohort2 ? 'selected' : ''}>${c.displayName}</option>`).join('');

        const viewSelectorHTML = `
            <div class="d-flex justify-content-end mb-3">
                <div class="btn-group btn-group-sm">
                    <button id="statistics-toggle-single" class="btn btn-outline-primary ${layout === 'einzel' ? 'active' : ''}">Single View</button>
                    <button id="statistics-toggle-comparison" class="btn btn-outline-primary ${layout === 'vergleich' ? 'active' : ''}">Comparison View</button>
                </div>
                <div id="statistics-cohort-select-container" class="ms-3" style="display: ${layout === 'vergleich' ? 'block' : 'none'};">
                    <div class="input-group input-group-sm">
                         <select class="form-select" id="statistics-cohort-select-1" aria-label="Select first cohort">${cohortOptions1}</select>
                         <span class="input-group-text">vs.</span>
                         <select class="form-select" id="statistics-cohort-select-2" aria-label="Select second cohort">${cohortOptions2}</select>
                    </div>
                </div>
            </div>`;

        setTimeout(() => {
            cohortIdsToShow.forEach((cohortId, i) => {
                const stats = allCohortStats[cohortId];
                if (stats && stats.descriptive.patientCount > 0) {
                    if (document.getElementById(`chart-stat-age-${i}`)) {
                        window.chartRenderer.renderAgeDistributionChart(stats.descriptive.ageData, `chart-stat-age-${i}`, { height: 180, margin: { top: 10, right: 10, bottom: 35, left: 40 } });
                    }
                    if (document.getElementById(`chart-stat-gender-${i}`)) {
                        const genderData = [{label: 'Male', value: stats.descriptive.sex.m ?? 0}, {label: 'Female', value: stats.descriptive.sex.f ?? 0}];
                        if (stats.descriptive.sex.unknown > 0) genderData.push({label: 'Unknown', value: stats.descriptive.sex.unknown });
                        window.chartRenderer.renderPieChart(genderData, `chart-stat-gender-${i}`, { height: 180, margin: { top: 10, right: 10, bottom: 35, left: 10 }, innerRadiusFactor: 0.0, legendBelow: true, legendItemCount: genderData.length });
                    }
                }
            });
        }, 50);
        return viewSelectorHTML + outerRow.outerHTML;
    }

    return Object.freeze({
        render
    });
})();