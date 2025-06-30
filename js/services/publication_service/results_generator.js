window.resultsGenerator = (() => {

    function generatePatientCharacteristicsHTML(stats, commonData) {
        const overallStats = stats?.[window.APP_CONFIG.COHORTS.OVERALL.id];
        const surgeryAloneStats = stats?.[window.APP_CONFIG.COHORTS.SURGERY_ALONE.id];
        const neoadjuvantStats = stats?.[window.APP_CONFIG.COHORTS.NEOADJUVANT.id];

        if (!overallStats?.descriptive || !surgeryAloneStats?.descriptive || !neoadjuvantStats?.descriptive) {
            return '<h3 id="ergebnisse_patientencharakteristika">Patient Characteristics</h3><p class="text-warning">Patient characteristics data is incomplete and could not be generated.</p>';
        }
        
        const helpers = window.publicationHelpers;
        const { nOverall, nSurgeryAlone, nNeoadjuvantTherapy, nPositive } = commonData;
        const descriptiveComparison = stats?.interCohortDemographicComparison;

        const surgeryAlonePercentString = helpers.formatMetricForPublication({value: nSurgeryAlone / nOverall, n_success: nSurgeryAlone, n_trials: nOverall}, 'acc', { includeCI: false, includeCount: true });
        const neoadjuvantPercentString = helpers.formatMetricForPublication({value: nNeoadjuvantTherapy / nOverall, n_success: nNeoadjuvantTherapy, n_trials: nOverall}, 'acc', { includeCI: false, includeCount: true });
        const nPositivePercentString = helpers.formatMetricForPublication({value: nPositive / nOverall, n_success: nPositive, n_trials: nOverall}, 'acc', { includeCI: false, includeCount: true });
        
        const text = `
            <h3 id="ergebnisse_patientencharakteristika">Patient Characteristics</h3>
            <p>The final study cohort included ${helpers.formatValueForPublication(nOverall, 0)} patients (mean age, ${helpers.formatValueForPublication(overallStats?.descriptive?.age?.mean, 1)} years ± ${helpers.formatValueForPublication(overallStats?.descriptive?.age?.sd, 1)}; ${overallStats?.descriptive?.sex?.m} men). The patient selection process is detailed in the study flowchart (Fig 1). Of the included patients, ${surgeryAlonePercentString} underwent primary surgery, while ${neoadjuvantPercentString} received neoadjuvant chemoradiotherapy. Overall, ${nPositivePercentString} had histopathologically confirmed lymph node metastases (N-positive). Patients in the primary surgery group were significantly older than those in the neoadjuvant therapy group (mean age, ${helpers.formatValueForPublication(surgeryAloneStats?.descriptive?.age?.mean, 1)} vs ${helpers.formatValueForPublication(neoadjuvantStats?.descriptive?.age?.mean, 1)} years, respectively; ${helpers.formatPValueForPublication(descriptiveComparison?.age?.pValue)}). The proportion of men and the prevalence of N-positive status did not differ significantly between the subgroups (${helpers.formatPValueForPublication(descriptiveComparison?.sex?.pValue)} and ${helpers.formatPValueForPublication(descriptiveComparison?.nStatus?.pValue)}, respectively). Detailed patient characteristics for all cohorts are provided in Table 3.</p>
        `;

        const figurePlaceholder = `
            <div class="my-4 p-3 border rounded text-center bg-light" id="figure-1-flowchart-container-wrapper">
                <p class="mb-1 fw-bold">Figure 1: Study Flowchart</p>
                <div id="figure-1-flowchart-container" class="publication-chart-container" style="max-width: 650px;">
                    <p class="mb-0 text-muted small">[A STARD-compliant flowchart showing participant enrollment, allocation to the surgery-alone and neoadjuvant therapy groups, and inclusion in the final analysis.]</p>
                </div>
            </div>
            <div class="my-4 p-3 border rounded bg-light" id="figure-2-examples-container-wrapper">
                <p class="mb-2 fw-bold text-center">Figure 2: MRI Examples of Nodal Assessment</p>
                <div id="figure-2-examples-container" class="publication-chart-container text-start small" style="max-width: 800px;">
                    <p class="mb-2"><strong>[Instruction for Author: Please insert a 4-panel figure here showing the following:]</strong></p>
                    <ul class="list-unstyled ps-3">
                        <li><strong>Panel A:</strong> Axial T2-weighted image of a morphologically suspicious lymph node (e.g., irregular border).</li>
                        <li><strong>Panel B:</strong> Corresponding axial contrast-enhanced T1-weighted fat-suppressed image showing a positive Avocado Sign in the same node.</li>
                        <li><strong>Panel C:</strong> Axial T2-weighted image of a morphologically inconspicuous lymph node (e.g., small, oval, smooth border).</li>
                        <li><strong>Panel D:</strong> Corresponding contrast-enhanced T1-weighted image demonstrating a positive Avocado Sign in this otherwise unremarkable node, highlighting the added value of the sign.</li>
                    </ul>
                    <hr>
                    <p class="mb-1"><strong>Suggested Figure Legend (Radiology Style):</strong></p>
                    <p class="fst-italic" style="font-size: 9pt; line-height: 1.4;">
                        Figure 2: Images in a 68-year-old man with histopathologically confirmed N-positive rectal cancer. 
                        <strong>(a)</strong> Axial T2-weighted image shows a mesorectal lymph node (arrow) with an irregular border, a feature suspicious for malignancy. 
                        <strong>(b)</strong> Corresponding axial contrast-enhanced T1-weighted fat-suppressed image demonstrates a distinct hypointense core within the enhancing node (arrow), representing a positive Avocado Sign. 
                        <strong>(c)</strong> In a different patient, a 55-year-old woman, an axial T2-weighted image shows a small, oval lymph node with smooth borders (arrowhead), appearing morphologically benign. 
                        <strong>(d)</strong> The corresponding contrast-enhanced T1-weighted image, however, reveals a clear Avocado Sign (arrowhead), correctly identifying metastatic involvement despite the benign T2-based morphology.
                    </p>
                </div>
            </div>
        `;
        
        const getAgeRow = (statsObj, type) => {
            if (!statsObj?.age || isNaN(statsObj.age.mean)) return window.APP_CONFIG.NA_PLACEHOLDER;
            if (type === 'mean') return `${helpers.formatValueForPublication(statsObj.age.mean, 1)} ± ${helpers.formatValueForPublication(statsObj.age.sd, 1)}`;
            if (type === 'median') return `${helpers.formatValueForPublication(statsObj.age.median, 0)} (${helpers.formatValueForPublication(statsObj.age.q1, 0)}–${helpers.formatValueForPublication(statsObj.age.q3, 0)})`;
            return window.APP_CONFIG.NA_PLACEHOLDER;
        };

        const getCountString = (count, total) => {
            if(total === 0 || count === undefined || count === null) return `0 (${window.APP_CONFIG.NA_PLACEHOLDER})`;
            return helpers.formatMetricForPublication({ value: count / total, n_success: count, n_trials: total }, 'acc', { includeCI: false });
        };
        
        const tableConfig = {
            id: 'table-results-patient-char',
            caption: 'Table 3. Patient Demographics and Clinical Characteristics',
            headers: [`Characteristic`, `Overall Cohort (n=${nOverall})`, `Surgery alone (n=${nSurgeryAlone})`, `Neoadjuvant therapy (n=${nNeoadjuvantTherapy})`, '<em>P</em> value'],
            rows: [
                ['Age (y), mean ± SD', getAgeRow(overallStats?.descriptive, 'mean'), getAgeRow(surgeryAloneStats?.descriptive, 'mean'), getAgeRow(neoadjuvantStats?.descriptive, 'mean'), helpers.formatPValueForPublication(descriptiveComparison?.age?.pValue)],
                ['   Age (y), median (IQR)', getAgeRow(overallStats?.descriptive, 'median'), getAgeRow(surgeryAloneStats?.descriptive, 'median'), getAgeRow(neoadjuvantStats?.descriptive, 'median'), ''],
                ['Men', getCountString(overallStats?.descriptive?.sex?.m, nOverall), getCountString(surgeryAloneStats?.descriptive?.sex?.m, nSurgeryAlone), getCountString(neoadjuvantStats?.descriptive?.sex?.m, nNeoadjuvantTherapy), helpers.formatPValueForPublication(descriptiveComparison?.sex?.pValue)],
                ['Histopathologic nodal status, positive', getCountString(overallStats?.descriptive?.nStatus?.plus, nOverall), getCountString(surgeryAloneStats?.descriptive?.nStatus?.plus, nSurgeryAlone), getCountString(neoadjuvantStats?.descriptive?.nStatus?.plus, nNeoadjuvantTherapy), helpers.formatPValueForPublication(descriptiveComparison?.nStatus?.pValue)]
            ],
            notes: "Data are numbers of patients, with percentages in parentheses, or mean ± standard deviation or median and interquartile range (IQR). <em>P</em> values were derived from the Welch t test for continuous variables and the Fisher exact test for categorical variables, comparing the surgery-alone and neoadjuvant therapy groups."
        };
        
        return text + figurePlaceholder + helpers.createPublicationTableHTML(tableConfig);
    }
    
    function _createConsolidatedComparisonTableHTML(stats, commonData) {
        const na_stat = window.APP_CONFIG.NA_PLACEHOLDER;
        const results = [];
        const allLitSets = window.studyT2CriteriaManager.getAllStudyCriteriaSets();
        const { bruteForceMetricForPublication } = commonData;
        const cohortOrder = ['surgeryAlone', 'neoadjuvantTherapy', 'Overall'];

        const addResults = (items, groupTitle) => {
            if (items.length > 0) {
                results.push({ isSeparator: true, name: `<strong>${groupTitle}</strong>` });
                items.forEach(item => results.push(item));
            }
        };

        const generateRowData = (name, pValue, performanceStats, isPlaceholder = false) => ({
            name, pValue, isPlaceholder, ...performanceStats
        });
        
        const authorNameMap = {
            'ESGAR_2016_SurgeryAlone': 'ESGAR 2016 Primary Staging',
            'ESGAR_2016_Neoadjuvant': 'ESGAR 2016 Restaging',
            'ESGAR_2016_Overall': 'ESGAR 2016 Hybrid',
            'Rutegard_2025': 'Rutegård et al (2025)',
            'Koh_2008': 'Koh et al (2008)',
            'Barbaro_2024': 'Barbaro et al (2024)',
            'Grone_2017': 'Gröne et al (2017)',
            'Jiang_2025': 'Jiang et al (2025)',
            'Pangarkar_2021': 'Pangarkar et al (2021)',
            'Zhang_2023': 'Zhang et al (2023)',
            'Crimi_2024': 'Crimì et al (2024)',
            'Almlov_2020': 'Almlöv et al (2020)',
            'Zhuang_2021': 'Zhuang et al (2021)'
        };

        const asResults = cohortOrder.map(cohortId => {
            const asPerf = stats[cohortId]?.performanceAS;
            return asPerf ? generateRowData(`Avocado Sign (${getCohortDisplayName(cohortId)})`, undefined, asPerf) : null;
        }).filter(Boolean);
        addResults(asResults, 'Avocado Sign');

        const esgarSets = allLitSets.filter(set => set.group === 'ESGAR Criteria');
        const esgarResults = esgarSets.map(set => {
            const cohortForSet = set.applicableCohort || 'Overall';
            const statsForSet = stats[cohortForSet];
            if (statsForSet) {
                const perf = statsForSet.performanceT2Literature?.[set.id];
                const comp = statsForSet.comparisonASvsT2Literature?.[set.id];
                if (perf) {
                    const criteriaSetName = authorNameMap[set.id] || set.name;
                    return generateRowData(criteriaSetName, comp?.delong?.pValue, perf);
                }
            }
            return null;
        }).filter(Boolean);
        addResults(esgarResults, 'ESGAR Consensus Criteria');

        const bfResults = [];
        cohortOrder.forEach(cohortId => {
            const cohortStats = stats[cohortId];
            const bfPerf = cohortStats?.performanceT2Bruteforce?.[bruteForceMetricForPublication];
            const bfComp = cohortStats?.comparisonASvsT2Bruteforce?.[bruteForceMetricForPublication];
            const nameContent = `Best-Case T2 Criteria (${getCohortDisplayName(cohortId)})`;
            bfResults.push(generateRowData(nameContent, bfComp?.delong?.pValue, bfPerf, !bfPerf));
        });
        addResults(bfResults, 'Data-driven Best-Case T2 Criteria');

        const otherLitSets = allLitSets.filter(set => set.group !== 'ESGAR Criteria');
        const litSurgeryAlone = [], litNeoadjuvant = [], litOverall = [];
        otherLitSets.forEach(set => {
            const cohortForSet = set.applicableCohort || 'Overall';
            const statsForSet = stats[cohortForSet];
            if (statsForSet) {
                const perf = statsForSet.performanceT2Literature?.[set.id];
                const comp = statsForSet.comparisonASvsT2Literature?.[set.id];
                if (perf) {
                    const criteriaSetName = authorNameMap[set.id] || set.name;
                    const row = generateRowData(criteriaSetName, comp?.delong?.pValue, perf);
                    if (cohortForSet === 'surgeryAlone') litSurgeryAlone.push(row);
                    else if (cohortForSet === 'neoadjuvantTherapy') litNeoadjuvant.push(row);
                    else litOverall.push(row);
                }
            }
        });
        addResults(litSurgeryAlone, 'T2 Criteria from Key Studies (Surgery-alone Cohort)');
        addResults(litNeoadjuvant, 'T2 Criteria from Key Studies (Neoadjuvant-therapy Cohort)');
        addResults(litOverall, 'T2 Criteria from Key Studies (Overall Cohort)');

        const tableConfig = {
            id: 'table-results-consolidated-comparison',
            caption: 'Table 4. Diagnostic Performance Comparison of Avocado Sign vs T2-based Criteria',
            headers: ['Set', 'Sensitivity', 'Specificity', 'PPV', 'NPV', 'AUC (95% CI)', '<em>P</em> value (vs AS)'],
            rows: [],
            notes: 'Data are percentages, with numerators and denominators in parentheses. AUC = Area under the receiver operating characteristic curve, AS = Avocado Sign, NPV = Negative predictive value, PPV = Positive predictive value. The <em>P</em> value (DeLong test) indicates the statistical significance of the difference in AUC compared to the Avocado Sign within the respective cohort.'
        };

        results.forEach(r => {
            if (r.isSeparator) {
                tableConfig.rows.push([`<td colspan="7" class="text-start table-group-divider fw-bold pt-2">${r.name}</td>`]);
                return;
            }
            if (r.isPlaceholder) {
                tableConfig.rows.push([r.name, ...Array(6).fill(`<span class="text-center text-muted d-block">${na_stat}</span>`)]);
                return;
            }
            const helpers = window.publicationHelpers;
            const pValueTooltip = (r.pValue !== undefined) ? getInterpretationTooltip('pValue', {value: r.pValue, testName: 'DeLong'}, {comparisonName: 'AUC', method1: 'AS', method2: r.name}) : 'Comparison not applicable';
            const pValueCellContent = (r.pValue !== undefined) ? `${helpers.formatPValueForPublication(r.pValue)}` : na_stat;
            
            const rowData = [
                r.name,
                helpers.formatMetricForPublication(r.sens, 'sens', {includeCI: false}),
                helpers.formatMetricForPublication(r.spec, 'spec', {includeCI: false}),
                helpers.formatMetricForPublication(r.ppv, 'ppv', {includeCI: false}),
                helpers.formatMetricForPublication(r.npv, 'npv', {includeCI: false}),
                helpers.formatMetricForPublication(r.auc, 'auc'),
                `<span data-tippy-content="${pValueTooltip}">${pValueCellContent}</span>`
            ];
            tableConfig.rows.push(rowData);
        });

        return window.publicationHelpers.createPublicationTableHTML(tableConfig);
    }

    function generateComparisonHTML(stats, commonData) {
        if (!stats) {
            return '<h3 id="ergebnisse_vergleich_as_vs_t2">Diagnostic Performance and Comparison</h3><p class="text-warning">Statistical data for comparison is incomplete.</p>';
        }

        const overallStats = stats[window.APP_CONFIG.COHORTS.OVERALL.id];
        const surgeryAloneStats = stats[window.APP_CONFIG.COHORTS.SURGERY_ALONE.id];
        const helpers = window.publicationHelpers;
        const interobserverKappa = overallStats?.interobserverKappa;
        const interobserverKappaCI = overallStats?.interobserverKappa?.ci;

        const mismatchData = overallStats?.insights?.mismatchAnalysis?.['ESGAR_2016_Overall'];
        let mismatchText = '';
        if (mismatchData) {
            const asWinCount = mismatchData.discordant_AS_win.N_plus;
            const t2WinCount = mismatchData.discordant_T2_win.N_plus;
            mismatchText = `<p>A mismatch analysis comparing the Avocado Sign to the hybrid ESGAR 2016 criteria in the overall cohort revealed that in the ${mismatchData.discordant_AS_win.total} cases where the two methods disagreed, the Avocado Sign correctly identified ${asWinCount} N-positive patients missed by the T2 criteria, while the T2 criteria correctly identified ${t2WinCount} N-positive patients missed by the Avocado Sign.</p>`;
        }

        let featureImportanceText = '';
        const featureImportanceData = surgeryAloneStats?.insights?.featureImportance;
        if (featureImportanceData && featureImportanceData.length > 0) {
            const topFeature = featureImportanceData[0];
            const secondFeature = featureImportanceData[1];
            if (topFeature && secondFeature) {
                featureImportanceText = `<p>In the primary surgery cohort, univariable analysis of T2-weighted features showed that an irregular border (OR, ${helpers.formatValueForPublication(topFeature.or.value, 2)}; ${helpers.formatPValueForPublication(topFeature.pValue)}) and a short-axis diameter of at least 5 mm (OR, ${helpers.formatValueForPublication(secondFeature.or.value, 2)}; ${helpers.formatPValueForPublication(secondFeature.pValue)}) were the strongest individual predictors of nodal metastasis.</p>`;
            }
        }

        const text = `
            <h3 id="ergebnisse_vergleich_as_vs_t2">Diagnostic Performance and Comparison</h3>
            <p>The diagnostic performance of the Avocado Sign was evaluated for each patient subgroup. For the entire cohort (n=${commonData.nOverall}), the area under the receiver operating characteristic curve (AUC) was ${helpers.formatMetricForPublication(overallStats?.performanceAS?.auc, 'auc', {includeCount: false})}. The interobserver agreement for the sign was previously reported as almost perfect for this cohort (Cohen’s kappa = ${helpers.formatValueForPublication(interobserverKappa?.value, 2, false, true)}; 95% CI: ${helpers.formatValueForPublication(interobserverKappaCI?.lower, 2, false, true)}, ${helpers.formatValueForPublication(interobserverKappaCI?.upper, 2, false, true)}) ${helpers.getReference('Lurz_Schaefer_2025')}.</p>
            ${mismatchText}
            ${featureImportanceText}
            <p>A detailed comparison of the diagnostic performance of the Avocado Sign against both literature-based and data-driven T2 criteria is presented in Table 4. The Avocado Sign consistently yielded a greater AUC than the established literature-based T2 criteria within their respective, methodologically appropriate cohorts. Its performance was also comparable with the data-driven best-case benchmarks.</p>
        `;

        const comparisonTableHTML = _createConsolidatedComparisonTableHTML(stats, commonData);

        return text + comparisonTableHTML;
    }

    return Object.freeze({
        generatePatientCharacteristicsHTML,
        generateComparisonHTML
    });

})();