window.titlePageGenerator = (() => {

    function generateTitlePageHTML(stats, commonData) {
        
        const overallStats = stats?.[window.APP_CONFIG.COHORTS.OVERALL.id];
        const helpers = window.publicationHelpers;

        const title = "Contrast-enhanced MRI versus T2-based Criteria for Nodal Staging in Rectal Cancer";
        const authors = "Markus Lurz, MD • Arnd-Oliver Schäfer, MD";
        const institution = "Department of Radiology and Nuclear Medicine, St. Georg Hospital, Leipzig, Germany";
        const correspondingAuthor = {
            name: "Markus Lurz, MD",
            address: "Delitzscher Str. 141, 04129 Leipzig, Germany",
            email: "Markus.Lurz@sanktgeorg.de"
        };
        
        const manuscriptType = "Original Research";
        const fundingStatement = "The authors state that this work has not received any funding.";
        const dataSharingStatement = "Data generated or analyzed during the study are available from the corresponding author by request.";

        let keyResultsHTML = '<p>Key results could not be generated due to missing data.</p>';
        let summaryStatementHTML = '<p>Summary statement could not be generated due to missing data.</p>';

        if (overallStats && commonData) {
            const { nOverall, bruteForceMetricForPublication } = commonData;
            const bfResultForPub = overallStats?.performanceT2Bruteforce?.[bruteForceMetricForPublication];
            const bfComparisonForPub = overallStats?.comparisonASvsT2Bruteforce?.[bruteForceMetricForPublication];
            
            const asOverallAUC = overallStats?.performanceAS?.auc?.value;
            const esgarHybridAUC = overallStats?.performanceT2Literature?.['ESGAR_2016_Overall']?.auc?.value;
            const esgarHybridComparisonPValue = overallStats?.comparisonASvsT2Literature?.['ESGAR_2016_Overall']?.delong?.pValue;

            const bfT2OverallAUC = bfResultForPub?.auc?.value;
            const bfComparisonPValue = bfComparisonForPub?.delong?.pValue;
            
            const overallSens = overallStats?.performanceAS?.sens;
            const overallSpec = overallStats?.performanceAS?.spec;

            summaryStatementHTML = `<p><strong>In a retrospective study of ${nOverall} patients with rectal cancer, a novel contrast-enhanced MRI feature for predicting nodal status yielded a greater area under the receiver operating characteristic curve than both an optimized T2-based benchmark and currently recommended T2 criteria from the literature.</strong></p>`;
            
            keyResultsHTML = `
                <h4 style="font-size: 1.1rem; font-weight: bold; margin-top: 1.5rem;">Key Results</h4>
                <ul style="padding-left: 20px; margin-top: 0.5rem; list-style-position: inside; text-align: left;">
                    <li>In a retrospective analysis of ${nOverall} patients with rectal cancer, a contrast-enhanced MRI feature (the Avocado Sign) predicted patient-level mesorectal nodal status with a sensitivity of ${helpers.formatMetricForPublication(overallSens, 'sens', { includeCI: false, includeCount: true })} and a specificity of ${helpers.formatMetricForPublication(overallSpec, 'spec', { includeCI: false, includeCount: true })}.</li>
                    <li>The diagnostic performance of the Avocado Sign was superior to that of a computationally optimized, data-driven T2-based benchmark for the overall cohort (area under the receiver operating characteristic curve [AUC], ${helpers.formatValueForPublication(asOverallAUC, 2, false, true)} vs ${helpers.formatValueForPublication(bfT2OverallAUC, 2, false, true)}; ${helpers.formatPValueForPublication(bfComparisonPValue)}).</li>
                    <li>The Avocado Sign also demonstrated a greater AUC than the currently recommended T2-based ESGAR criteria for the overall cohort (AUC, ${helpers.formatValueForPublication(asOverallAUC, 2, false, true)} vs ${helpers.formatValueForPublication(esgarHybridAUC, 2, false, true)}; ${helpers.formatPValueForPublication(esgarHybridComparisonPValue)}).</li>
                </ul>
            `;
        }
        
        const html = `
            <div id="title_main" class="publication-title-page" style="padding: 2rem; border-bottom: 2px solid #333; margin-bottom: 2rem;">
                <p style="font-size: 1rem; color: #555;"><strong>Article Type:</strong> ${manuscriptType}</p>
                <h1 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 1rem; color: #000;">${title}</h1>
                <div style="font-size: 1rem; color: #333; margin-bottom: 1.5rem;">
                    <p style="margin-bottom: 0.25rem;"><strong>Authors:</strong> ${authors}</p>
                    <p style="margin-bottom: 0;"><strong>From the:</strong> ${institution}</p>
                </div>

                ${summaryStatementHTML}
                ${keyResultsHTML}
                
                <div style="font-size: 0.85rem; color: #444; margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 1rem;">
                    <p><strong>Address correspondence to:</strong> ${correspondingAuthor.name}, ${institution}, ${correspondingAuthor.address} (e-mail: ${correspondingAuthor.email}).</p>
                    <p><strong>Funding:</strong> ${fundingStatement}</p>
                    <p><strong>Data Sharing Statement:</strong> ${dataSharingStatement}</p>
                </div>
            </div>
        `;
        
        return html;
    }

    return Object.freeze({
        generateTitlePageHTML
    });

})();