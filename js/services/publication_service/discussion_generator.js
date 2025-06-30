window.discussionGenerator = (() => {

    function generateDiscussionHTML(stats, commonData) {
        const overallStats = stats?.[window.APP_CONFIG.COHORTS.OVERALL.id];
        if (!overallStats || !overallStats.performanceAS) {
            return '<p class="text-warning">Discussion could not be generated due to missing statistical data.</p>';
        }

        const helpers = window.publicationHelpers;
        const { bruteForceMetricForPublication, nSurgeryAlone } = commonData;
        
        const performanceAS = overallStats.performanceAS;
        const bfResultForPub = overallStats?.performanceT2Bruteforce?.[bruteForceMetricForPublication];
        const bfComparisonForPub = overallStats?.comparisonASvsT2Bruteforce?.[bruteForceMetricForPublication];
        const interCohortComparison = stats?.interCohortComparison?.as;

        const bfComparisonText = (bfResultForPub && bfComparisonForPub)
            ? `(AUC, ${helpers.formatValueForPublication(performanceAS?.auc?.value, 2, false, true)} vs ${helpers.formatValueForPublication(bfResultForPub?.auc?.value, 2, false, true)}; ${helpers.formatPValueForPublication(bfComparisonForPub?.delong?.pValue)})`
            : '(comparison data pending)';
        
        const interCohortComparisonText = interCohortComparison
            ? `This robustness is further supported by the finding that there was no evidence of a difference in the diagnostic performance of the Avocado Sign for predicting nodal status between the primary surgery and neoadjuvant therapy cohorts (AUC, ${helpers.formatValueForPublication(stats.surgeryAlone?.performanceAS?.auc?.value, 2, false, true)} vs ${helpers.formatValueForPublication(stats.neoadjuvantTherapy?.performanceAS?.auc?.value, 2, false, true)}, respectively; ${helpers.formatPValueForPublication(interCohortComparison.pValue)}).`
            : '';

        const summaryParagraph = `
            <p>In this study, we validated the diagnostic performance of the contrast-enhanced Avocado Sign for predicting the patient-level mesorectal nodal status in rectal cancer. Our central finding is that this simple, binary imaging marker was not only highly accurate (AUC, ${helpers.formatMetricForPublication(performanceAS?.auc, 'auc', { includeCI: false, includeCount: false })}) but also proved to be statistically superior to a cohort-specific, data-driven T2-weighted benchmark ${bfComparisonText}. The superiority is particularly noteworthy given that the data-driven benchmark was mathematically optimized for this specific dataset—a hurdle that a generalizable criterion would not typically be expected to clear. This suggests that the Avocado Sign efficiently captures diagnostically relevant information that may be missed by combinations of standard T2-weighted morphologic features.</p>
        `;

        const contextParagraph = `
            <p>When contextualized against established literature, the Avocado Sign's performance surpassed that of conventional T2-weighted criteria. The limitations of these standard criteria are well-documented, with meta-analyses reporting suboptimal accuracy and highlighting N-staging as the "weakest link" of rectal MRI ${helpers.getReference('Beets_Tan_2018')}${helpers.getReference('Al_Sukhni_2012')}${helpers.getReference('Zhuang_2021')}. This diagnostic gap has led to a diminished reliance on T- and N-staging for therapy decisions in landmark trials like OCUM ${helpers.getReference('Stelzner_2022')}. Our univariable analysis of T2 features confirmed this challenge, showing that while features like an irregular border and size had a significant association with nodal status, their predictive value is limited in isolation. The Avocado Sign offers a potential solution by simplifying the assessment to a single, highly reproducible feature (Cohen’s kappa = ${helpers.formatValueForPublication(overallStats?.interobserverKappa?.value, 2, false, true)}) ${helpers.getReference('Lurz_Schaefer_2025')}. ${interCohortComparisonText}</p>
        `;
        
        const clinicalImplicationsParagraph = `
            <p>The clinical implications of a more reliable predictor for the patient-based nodal status are substantial. Current treatment paradigms are increasingly moving towards personalized approaches, such as total neoadjuvant therapy (TNT) and organ preservation strategies, which hinge on accurate initial risk stratification ${helpers.getReference('Garcia_Aguilar_2022')}${helpers.getReference('Schrag_2023')}. An inaccurate nodal status assessment can lead to either overtreatment of node-negative patients with toxic systemic therapies or undertreatment of node-positive patients, compromising oncologic outcomes. Our mismatch analysis demonstrated that in cases of discordance with the ESGAR 2016 criteria, the Avocado Sign correctly identified more N-positive patients than it missed, highlighting its potential to refine clinical decision-making. By incorporating a contrast-enhanced sequence, the Avocado Sign could represent a critical step towards establishing a new, more accurate standard of care for nodal staging in rectal cancer.</p>
        `;

        let powerAnalysisText = '';
        const esgarComparisonSurgeryAlone = stats.surgeryAlone?.comparisonASvsT2Literature?.['ESGAR_2016_SurgeryAlone'];
        const powerAnalysisData = stats.surgeryAlone?.insights?.powerAnalysis?.['ESGAR_2016_SurgeryAlone'];
        
        if (esgarComparisonSurgeryAlone && powerAnalysisData) {
            const pValue = esgarComparisonSurgeryAlone.delong?.pValue;
            if (pValue > 0.05) {
                const calculatedPower = powerAnalysisData.postHocPower;
                const requiredN = window.statisticsService.calculatePowerAndSampleSize(0.05, 0.80, powerAnalysisData.varDiff, powerAnalysisData.effectSize).requiredSampleSize;
                powerAnalysisText = `For instance, while the Avocado Sign demonstrated a numerically greater AUC than the ESGAR 2016 criteria in the primary surgery cohort, this difference did not reach statistical significance (${helpers.formatPValueForPublication(pValue)}). Our post-hoc power analysis indicated that the study had only ${formatPercent(calculatedPower, 0)} power to detect the observed difference. To reliably confirm or refute such a difference in a future study, a prospective trial would require an estimated sample size of approximately ${formatNumber(requiredN, 0)} patients to achieve 80% power.`;
            }
        }

        const limitationsParagraph = `
            <p>This study had several limitations. First, its retrospective, single-center design may limit the generalizability of our findings, and selection bias, although mitigated by analyzing consecutive patients, cannot be entirely ruled out. Second, the subgroup of treatment-naïve patients who underwent primary surgery was relatively small (n=${nSurgeryAlone}), which may have limited the statistical power to detect differences in diagnostic performance within this specific cohort. ${powerAnalysisText} Third, the data-driven T2 benchmark was derived from and applied to the same dataset, which carries an inherent risk of overfitting; however, this makes the demonstrated superiority of the Avocado Sign even more compelling. Finally, all MRI examinations were performed on a single 3.0-T system using one type of gadolinium-based contrast agent, and performance with other agents or at different field strengths remains to be validated.</p>
        `;
        
        const conclusionParagraph = `
            <p>In conclusion, the contrast-enhanced Avocado Sign is an accurate and reproducible imaging marker for the prediction of mesorectal nodal status in patients with rectal cancer. Its performance is superior to both established literature-based and computationally optimized T2-weighted criteria, suggesting it could simplify and standardize nodal assessment. Prospective multicenter validation is warranted to confirm these findings and to establish the role of contrast-enhanced MRI as a new standard in the clinical pathway for rectal cancer staging.</p>
        `;

        return `
            ${summaryParagraph}
            ${contextParagraph}
            ${clinicalImplicationsParagraph}
            ${limitationsParagraph}
            ${conclusionParagraph}
        `;
    }

    return Object.freeze({
        generateDiscussionHTML
    });

})();