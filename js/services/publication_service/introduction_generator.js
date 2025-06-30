window.introductionGenerator = (() => {

    function generateIntroductionHTML(stats, commonData) {
        const helpers = window.publicationHelpers;

        const introText = `
            <p>Accurate preoperative determination of the mesorectal lymph node (N) status is a cornerstone of modern rectal cancer management. It critically informs the choice between primary surgery and neoadjuvant therapies and is pivotal for identifying candidates for emerging organ-preservation strategies, such as total neoadjuvant therapy (TNT) followed by nonoperative management ${helpers.getReference('Schrag_2023')}${helpers.getReference('Garcia_Aguilar_2022')}. While magnetic resonance imaging (MRI) is the established modality for local staging, its reliability in assessing the nodal status remains a significant clinical challenge, often described as its "weakest link" ${helpers.getReference('Beets_Tan_2018')}.</p>
            <p>This limitation stems from the reliance on T2-weighted (T2w) criteria. While the current standard, adopted by both the European Society of Gastrointestinal and Abdominal Radiology (ESGAR) and the Society of Abdominal Radiology (SAR), combines node size with morphologic features, its diagnostic accuracy remains suboptimal ${helpers.getReference('Beets_Tan_2018')}. The most recent SAR consensus statement describes the sensitivity of this approach as "mediocre" ${helpers.getReference('Lee_2023')}. This diagnostic uncertainty is further highlighted by a pivotal meta-analysis by Al-Sukhni et al, which reported a pooled sensitivity and specificity of only 77% and 71%, respectively, for T2w-based MRI ${helpers.getReference('Al_Sukhni_2012')}, and by the large prospective OCUM trial, which reported an accuracy of only 56.5% for T2w-based nodal staging ${helpers.getReference('Stelzner_2022')}. This diagnostic gap can lead to both over- and undertreatment, highlighting a critical need for more robust and reproducible imaging markers.</p>
            <p>A novel feature on contrast-enhanced T1-weighted images, termed the "Avocado Sign" (AS), was recently proposed as a simple, binary marker for predicting a patient's nodal status, defined by a hypointense core within a homogeneously enhancing lymph node ${helpers.getReference('Lurz_Schaefer_2025')}. The initial study suggested high diagnostic performance. However, to rigorously establish its clinical utility, a direct comparison is necessary against not only existing guidelines but also against the best possible performance achievable with T2w criteria on a given dataset. Such a comparison would determine whether the Avocado Sign offers a true diagnostic advantage or merely replicates information accessible through complex T2w analysis.</p>
            <p>The purpose of this study was to rigorously validate the Avocado Sign for predicting patient-level mesorectal nodal status using a dual-comparison approach. First, we compared its diagnostic performance against a computationally optimized, data-driven T2-based benchmark to assess its added value within our specific cohort. Second, to ensure clinical relevance and contextualize our findings, we compared its performance against established, literature-based T2 criteria applied to the appropriate patient subgroups.</p>
        `;

        return introText;
    }

    return Object.freeze({
        generateIntroductionHTML
    });

})();