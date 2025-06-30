window.methodsGenerator = (() => {

    function _createMriParametersTableHTML() {
        const tableConfig = {
            id: 'table-methods-mri-params',
            caption: 'Table 1. MRI Sequence Parameters',
            headers: ['Sequence', 'Sagittal T2-TSE', 'Axial T2-TSE', 'Coronal T2-TSE', 'DWI (b=0, 500, 1000)', 'Dixon-VIBE (postcontrast)'],
            rows: [
                ['Repetition time (msec)', '4170', '4400', '4400', '3700', '5.8'],
                ['Echo time (msec)', '72', '81', '81', '59', '2.5/3.7'],
                ['Field of view (mm)', '220', '220', '220', '220', '270'],
                ['Slice thickness (mm)', '3', '2', '2', '2', '1.5'],
                ['Matrix', '394 × 448', '380 × 432', '380 × 432', '140 × 140', '326 × 384'],
                ['Acquisition time (min)', '4:37', '4:50', '4:50', '3:57', '4:10']
            ],
            notes: "DWI = diffusion-weighted imaging, TSE = turbo spin-echo, VIBE = volumetric interpolated breath-hold examination."
        };
        return window.publicationHelpers.createPublicationTableHTML(tableConfig);
    }

    function generateStudyDesignHTML(stats, commonData) {
        const { nOverall, nNeoadjuvantTherapy, nSurgeryAlone } = commonData || {};
        const helpers = window.publicationHelpers;

        if (nOverall === undefined || nNeoadjuvantTherapy === undefined || nSurgeryAlone === undefined) {
            return '<h3 id="methoden_studienanlage_ethik">Study Design and Patients</h3><p class="text-warning">Patient cohort data is missing.</p>';
        }

        const regulatoryStatement = window.APP_CONFIG.UI_TEXTS.PUBLICATION_TEXTS.MIM_REGULATORY_STATEMENT;
        const surgeryAlonePercentString = helpers.formatMetricForPublication({value: nSurgeryAlone / nOverall, n_success: nSurgeryAlone, n_trials: nOverall }, 'acc', { includeCI: false, includeCount: true });
        const neoadjuvantPercentString = helpers.formatMetricForPublication({value: nNeoadjuvantTherapy / nOverall, n_success: nNeoadjuvantTherapy, n_trials: nOverall }, 'acc', { includeCI: false, includeCount: true });

        return `
            <h3 id="methoden_studienanlage_ethik">Study Design and Patients</h3>
            <p>${regulatoryStatement} This analysis involved a fully blinded re-evaluation of a previously described retrospective cohort of ${helpers.formatValueForPublication(nOverall, 0)} consecutive patients with histopathologically confirmed rectal cancer who underwent pelvic MRI for primary staging or restaging between January 2020 and November 2023 ${helpers.getReference('Lurz_Schaefer_2025')}.</p>
            <p>Inclusion criteria for this secondary analysis were the availability of high-quality T2-weighted and contrast-enhanced T1-weighted MRI sequences and a definitive histopathological reference standard from the subsequent total mesorectal excision specimen. Of the final cohort, ${surgeryAlonePercentString} underwent primary surgery, while ${neoadjuvantPercentString} received neoadjuvant chemoradiotherapy followed by restaging MRI prior to surgery.</p>
        `;
    }

    function generateMriProtocolAndImageAnalysisHTML(stats, commonData) {
        const helpers = window.publicationHelpers;
        return `
            <h3 id="methoden_mrt_protokoll_akquisition">MRI Protocol and Image Analysis</h3>
            <p>All MRI examinations were performed on a 3.0-T system (MAGNETOM Prisma Fit; Siemens Healthineers) and included high-resolution T2-weighted sequences, diffusion-weighted imaging, and a postcontrast T1-weighted fat-suppressed sequence. The imaging protocol was designed to acquire high-resolution T2-weighted images conforming to the definition provided by the SAR Colorectal and Anal Cancer Disease-Focused Panel ${helpers.getReference('Lee_2023')}. Detailed imaging parameters are provided in Table 1.</p>
            ${_createMriParametersTableHTML()}
            <p>Two board-certified radiologists (with 8 and 30 years of experience in abdominal MRI), blinded to histopathological outcomes and each other's findings, independently reviewed all studies; discrepancies were resolved by consensus. To minimize recall bias, T2-weighted and contrast-enhanced sequences were evaluated in separate reading sessions at least four weeks apart.</p>
            <p><strong>Avocado Sign (AS) Assessment.</strong>—On contrast-enhanced T1-weighted images, a patient's mesorectal nodal status was classified as AS-positive if at least one mesorectal lymph node demonstrated the Avocado Sign, defined as a distinct hypointense core within an otherwise homogeneously hyperintense node, irrespective of its size or shape (Fig 2) ${helpers.getReference('Lurz_Schaefer_2025')}.</p>
            <p><strong>T2 Criteria Assessment.</strong>—On T2-weighted images, all visible mesorectal nodes were evaluated for five standard morphologic features: size, shape, border, internal homogeneity, and signal intensity. A patient's nodal status was classified as T2-positive if at least one lymph node fulfilled a given set of combined T2-based criteria. The final patient-level nodal status was categorized as either positive or negative, in accordance with current SAR reporting recommendations that advise against specifying N sub-stages on MRI due to limited accuracy ${helpers.getReference('Lee_2023')}.</p>
        `;
    }

    function generateComparativeCriteriaHTML(stats, commonData) {
        const { bruteForceMetricForPublication } = commonData || {};
        const helpers = window.publicationHelpers;

        if (!bruteForceMetricForPublication || !stats) {
            return '<h3 id="methoden_vergleichskriterien_t2">Comparative T2 Criteria Sets</h3><p class="text-warning">Required data for comparative criteria is missing.</p>';
        }

        const tableConfig = {
            id: 'table-methods-t2-literature',
            caption: 'Table 2. T2 Criteria Sets used for Comparison',
            headers: ['Criteria Set', 'Study', 'Applicable Cohort', 'Key Criteria Summary', 'Logic'],
            rows: []
        };
        
        const allLiteratureSets = window.studyT2CriteriaManager.getAllStudyCriteriaSets() || [];
        const esgarSets = allLiteratureSets.filter(set => set.group === 'ESGAR Criteria');
        const otherSets = allLiteratureSets.filter(set => set.group !== 'ESGAR Criteria');

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

        const addRowsToConfig = (sets) => {
            sets.forEach(set => {
                if (set && set.studyInfo) {
                    const criteriaSetName = authorNameMap[set.id] || set.name || 'N/A';
                    tableConfig.rows.push([
                        criteriaSetName,
                        helpers.getReference(set.studyInfo.refKey || set.id),
                        getCohortDisplayName(set.applicableCohort),
                        set.studyInfo.keyCriteriaSummary || 'N/A',
                        set.logic === 'KOMBINIERT' ? 'Combined (ESGAR Logic)' : (window.APP_CONFIG.UI_TEXTS.t2LogicDisplayNames[set.logic] || 'N/A')
                    ]);
                }
            });
        };

        if (esgarSets.length > 0) {
            tableConfig.rows.push(['<td colspan="5" class="text-start table-group-divider fw-bold pt-2">ESGAR 2016 Criteria</td>']);
            addRowsToConfig(esgarSets);
        }

        tableConfig.rows.push(['<td colspan="5" class="text-start table-group-divider fw-bold pt-2">Data-driven Best-Case T2 Criteria</td>']);
        const cohortOrder = ['surgeryAlone', 'neoadjuvantTherapy', 'Overall'];
        cohortOrder.forEach(cohortId => {
            const cohortStats = stats[cohortId];
            const bfDef = cohortStats?.bruteforceDefinitions?.[bruteForceMetricForPublication];
            if (bfDef) {
                const criteriaDisplay = window.studyT2CriteriaManager.formatCriteriaForDisplay(bfDef.criteria, bfDef.logic, false);
                tableConfig.rows.push([
                    'Best Case T2 Criteria (AUC optimized)',
                    '—',
                    getCohortDisplayName(cohortId),
                    criteriaDisplay,
                    window.APP_CONFIG.UI_TEXTS.t2LogicDisplayNames[bfDef.logic] || bfDef.logic
                ]);
            } else {
                 tableConfig.rows.push([
                    'Best Case T2 Criteria (AUC optimized)',
                    '—',
                    getCohortDisplayName(cohortId),
                    'Not yet calculated',
                    'N/A'
                ]);
            }
        });

        if (otherSets.length > 0) {
            tableConfig.rows.push(['<td colspan="5" class="text-start table-group-divider fw-bold pt-2">Additional T2 Criteria from Key Studies</td>']);
            addRowsToConfig(otherSets);
        }

        return `
            <h3 id="methoden_vergleichskriterien_t2">Comparative T2 Criteria Sets</h3>
            <p>To provide a robust benchmark for the Avocado Sign, its performance was compared against multiple T2-based criteria sets in a tiered approach. First, we applied the 2016 ESGAR consensus criteria, which represent a widely recognized clinical standard, to their respective target populations within our cohort ${helpers.getReference('Beets_Tan_2018')}. Second, to establish the most stringent internal comparator, a data-driven benchmark was developed via a systematic, computer-assisted analysis (Brute-Force) that exhaustively tested all permutations of T2 features and logical operators to identify the combination with the highest diagnostic performance for a pre-selected metric (${bruteForceMetricForPublication}). Third, to contextualize our findings further, we applied several additional T2-based criteria sets from previously published studies to their appropriate cohorts. All evaluated criteria sets are detailed in Table 2.</p>
            ${helpers.createPublicationTableHTML(tableConfig)}
        `;
    }

    function generateReferenceStandardHTML(stats, commonData) {
        return `
            <h3 id="methoden_referenzstandard_histopathologie">Reference Standard</h3>
            <p>The definitive reference standard for the patient-level nodal status was the histopathological examination of the total mesorectal excision specimens performed by experienced gastrointestinal pathologists. All identified lymph nodes were meticulously dissected and analyzed for the presence of metastatic tumor cells. A patient was classified as N-positive if metastases were found in at least one lymph node.</p>
        `;
    }

    function generateStatisticalAnalysisHTML(stats, commonData) {
        const helpers = window.publicationHelpers;
        const statisticalSignificanceLevel = window.APP_CONFIG?.STATISTICAL_CONSTANTS?.SIGNIFICANCE_LEVEL;
        const nBootstrap = window.APP_CONFIG?.STATISTICAL_CONSTANTS?.BOOTSTRAP_CI_REPLICATIONS;
        const appVersion = window.APP_CONFIG?.APP_VERSION;

        if (!statisticalSignificanceLevel || !nBootstrap || !appVersion) {
            return '<h3 id="methoden_statistische_analyse_methoden">Statistical Analysis</h3><p class="text-warning">Configuration for statistical analysis is missing.</p>';
        }
        
        const pValueText = helpers.formatPValueForPublication(statisticalSignificanceLevel).replace(/=/g, '<');

        const methodsText = `Descriptive statistics were used to summarize patient characteristics. Diagnostic performance metrics—including sensitivity, specificity, positive predictive value, negative predictive value, and accuracy—were calculated. The Wilson score method was used for 95% confidence intervals (CIs) of proportions. For the area under the receiver operating characteristic curve (AUC), CIs were derived using the bootstrap percentile method with ${helpers.formatValueForPublication(nBootstrap, 0)} replications.`;
            
        const comparisonText = `The primary comparison between the AUC of the Avocado Sign and other criteria was performed using the method described by DeLong et al for correlated ROC curves ${helpers.getReference('DeLong_1988')}. McNemar’s test was used to compare accuracies. For associations between individual categorical features and nodal status, the Fisher exact test was used. For comparison of demographic data and AUCs between independent cohorts, the Welch t test and Fisher exact test were used, respectively. Post-hoc power and prospective sample size calculations were based on the variance of the AUC difference derived from the DeLong test. All statistical analyses were performed using custom software scripts (JavaScript, ES2020+) implemented in the analysis tool itself (Version ${appVersion}). A two-sided ${pValueText} was considered to indicate statistical significance.`;

        return `
            <h3 id="methoden_statistische_analyse_methoden">Statistical Analysis</h3>
            <p>${methodsText}</p>
            <p>${comparisonText}</p>
        `;
    }

    return Object.freeze({
        generateStudyDesignHTML,
        generateMriProtocolAndImageAnalysisHTML,
        generateComparativeCriteriaHTML,
        generateReferenceStandardHTML,
        generateStatisticalAnalysisHTML
    });

})();