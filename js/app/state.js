window.state = (() => {
    let currentState = {};
    let defaultState = {};
    let analysisContext = null;

    function init() {
        defaultState = {
            currentCohort: window.APP_CONFIG.DEFAULT_SETTINGS.COHORT,
            dataTableSort: cloneDeep(window.APP_CONFIG.DEFAULT_SETTINGS.DATA_TABLE_SORT),
            analysisTableSort: cloneDeep(window.APP_CONFIG.DEFAULT_SETTINGS.ANALYSIS_TABLE_SORT),
            statsLayout: window.APP_CONFIG.DEFAULT_SETTINGS.STATS_LAYOUT,
            statsCohort1: window.APP_CONFIG.DEFAULT_SETTINGS.STATS_COHORT1,
            statsCohort2: window.APP_CONFIG.DEFAULT_SETTINGS.STATS_COHORT2,
            comparisonView: window.APP_CONFIG.DEFAULT_SETTINGS.COMPARISON_VIEW,
            comparisonStudyId: window.APP_CONFIG.DEFAULT_SETTINGS.COMPARISON_STUDY_ID,
            insightsStudyId: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.STUDY_ID,
            insightsPower: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.POWER,
            insightsAlpha: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.ALPHA,
            insightsEffectSizeType: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.EFFECT_SIZE_TYPE,
            insightsCustomEffectSize: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.CUSTOM_EFFECT_SIZE,
            insightsFeatureImportanceMethod: window.APP_CONFIG.DEFAULT_SETTINGS.INSIGHTS_TAB_DEFAULTS.FEATURE_IMPORTANCE_METHOD,
            publicationSection: window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_SECTION,
            publicationBruteForceMetric: window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_BRUTE_FORCE_METRIC,
            publicationLang: window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_LANG,
            publicationEditMode: window.APP_CONFIG.DEFAULT_SETTINGS.PUBLICATION_EDIT_MODE,
            editedManuscriptHTML: window.APP_CONFIG.DEFAULT_SETTINGS.EDITED_MANUSCRIPT_HTML,
            activeTabId: 'publication'
        };

        const loadedSection = loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_SECTION);
        const isValidSection = window.PUBLICATION_CONFIG.sections.some(s => s.id === loadedSection || s.subSections.some(sub => sub.id === loadedSection));

        currentState = {
            currentCohort: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.CURRENT_COHORT) ?? defaultState.currentCohort,
            dataTableSort: cloneDeep(defaultState.dataTableSort),
            analysisTableSort: cloneDeep(defaultState.analysisTableSort),
            statsLayout: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.STATS_LAYOUT) ?? defaultState.statsLayout,
            statsCohort1: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.STATS_COHORT1) ?? defaultState.statsCohort1,
            statsCohort2: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.STATS_COHORT2) ?? defaultState.statsCohort2,
            comparisonView: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.COMPARISON_VIEW) ?? defaultState.comparisonView,
            comparisonStudyId: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.COMPARISON_STUDY_ID) ?? defaultState.comparisonStudyId,
            insightsStudyId: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_STUDY_ID) ?? defaultState.insightsStudyId,
            insightsPower: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_POWER) ?? defaultState.insightsPower,
            insightsAlpha: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_ALPHA) ?? defaultState.insightsAlpha,
            insightsEffectSizeType: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_EFFECT_SIZE_TYPE) ?? defaultState.insightsEffectSizeType,
            insightsCustomEffectSize: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_CUSTOM_EFFECT_SIZE) ?? defaultState.insightsCustomEffectSize,
            insightsFeatureImportanceMethod: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_FEATURE_IMPORTANCE_METHOD) ?? defaultState.insightsFeatureImportanceMethod,
            publicationSection: isValidSection ? loadedSection : defaultState.publicationSection,
            publicationBruteForceMetric: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_BRUTE_FORCE_METRIC) ?? defaultState.publicationBruteForceMetric,
            publicationLang: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_LANG) ?? defaultState.publicationLang,
            publicationEditMode: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_EDIT_MODE) ?? defaultState.publicationEditMode,
            editedManuscriptHTML: loadFromLocalStorage(window.APP_CONFIG.STORAGE_KEYS.EDITED_MANUSCRIPT_HTML) ?? defaultState.editedManuscriptHTML,
            activeTabId: defaultState.activeTabId
        };
        analysisContext = null;
    }

    function _setter(key, storageKey, newValue) {
        if (currentState[key] !== newValue) {
            currentState[key] = newValue;
            if (storageKey) {
                saveToLocalStorage(storageKey, newValue);
            }
            return true;
        }
        return false;
    }

    function getCurrentCohort() { return currentState.currentCohort; }
    function setCurrentCohort(newCohort) { return _setter('currentCohort', window.APP_CONFIG.STORAGE_KEYS.CURRENT_COHORT, newCohort); }

    function getActiveCohortId() {
        return analysisContext?.cohortId ?? currentState.currentCohort;
    }

    function getAnalysisContext() {
        return analysisContext ? cloneDeep(analysisContext) : null;
    }

    function setAnalysisContext(context) {
        analysisContext = context ? cloneDeep(context) : null;
    }

    function clearAnalysisContext() {
        analysisContext = null;
    }

    function getDataTableSort() { return cloneDeep(currentState.dataTableSort); }
    function updateDataTableSort(key, subKey = null) {
        if (currentState.dataTableSort.key === key && currentState.dataTableSort.subKey === subKey) {
            currentState.dataTableSort.direction = currentState.dataTableSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentState.dataTableSort = { key, direction: 'asc', subKey };
        }
        return true;
    }

    function getAnalysisTableSort() { return cloneDeep(currentState.analysisTableSort); }
    function updateAnalysisTableSort(key, subKey = null) {
        if (currentState.analysisTableSort.key === key && currentState.analysisTableSort.subKey === subKey) {
            currentState.analysisTableSort.direction = currentState.analysisTableSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentState.analysisTableSort = { key, direction: 'asc', subKey };
        }
        return true;
    }

    function getStatsLayout() { return currentState.statsLayout; }
    function setStatsLayout(newLayout) {
        if (newLayout === 'einzel' || newLayout === 'vergleich') {
            return _setter('statsLayout', window.APP_CONFIG.STORAGE_KEYS.STATS_LAYOUT, newLayout);
        }
        return false;
    }

    function getStatsCohort1() { return currentState.statsCohort1; }
    function setStatsCohort1(newCohort) { return _setter('statsCohort1', window.APP_CONFIG.STORAGE_KEYS.STATS_COHORT1, newCohort); }

    function getStatsCohort2() { return currentState.statsCohort2; }
    function setStatsCohort2(newCohort) { return _setter('statsCohort2', window.APP_CONFIG.STORAGE_KEYS.STATS_COHORT2, newCohort); }

    function getComparisonView() { return currentState.comparisonView; }
    function setComparisonView(newView) {
        if (newView !== 'as-pur' && newView !== 'as-vs-t2') return false;
        
        const viewChanged = _setter('comparisonView', window.APP_CONFIG.STORAGE_KEYS.COMPARISON_VIEW, newView);
        let studyIdChanged = false;

        if (newView === 'as-pur') {
            clearAnalysisContext();
        } else if (newView === 'as-vs-t2') {
            if (currentState.comparisonStudyId === null || currentState.comparisonStudyId === window.APP_CONFIG.SPECIAL_IDS.APPLIED_CRITERIA_STUDY_ID) {
                studyIdChanged = setComparisonStudyId(window.APP_CONFIG.DEFAULT_SETTINGS.COMPARISON_STUDY_ID);
            }
            const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(currentState.comparisonStudyId);
            if (studySet?.applicableCohort) {
                setAnalysisContext({ cohortId: studySet.applicableCohort, criteriaName: studySet.name });
            } else if (currentState.comparisonStudyId && currentState.comparisonStudyId.startsWith('bf_')) {
                 const cohortId = currentState.comparisonStudyId.split('_')[1];
                 setAnalysisContext({ cohortId: cohortId, criteriaName: `Best Case T2 (${getCohortDisplayName(cohortId)})` });
            } else {
                clearAnalysisContext();
            }
        }
        return viewChanged || studyIdChanged;
    }

    function getComparisonStudyId() { return currentState.comparisonStudyId; }
    function setComparisonStudyId(newStudyId) {
        const isDynamicBfId = newStudyId && newStudyId.startsWith('bf_');
        const isStaticStudyId = !!window.studyT2CriteriaManager.getStudyCriteriaSetById(newStudyId);

        if (!newStudyId || (!isDynamicBfId && !isStaticStudyId)) {
            newStudyId = window.APP_CONFIG.DEFAULT_SETTINGS.COMPARISON_STUDY_ID;
        }

        const studyIdChanged = _setter('comparisonStudyId', window.APP_CONFIG.STORAGE_KEYS.COMPARISON_STUDY_ID, newStudyId);

        if (studyIdChanged) {
            if (isStaticStudyId) {
                const studySet = window.studyT2CriteriaManager.getStudyCriteriaSetById(newStudyId);
                if (studySet?.applicableCohort) {
                    setAnalysisContext({ cohortId: studySet.applicableCohort, criteriaName: studySet.name });
                } else {
                    clearAnalysisContext();
                }
            } else if (isDynamicBfId) {
                const cohortId = newStudyId.split('_')[1];
                setAnalysisContext({ cohortId: cohortId, criteriaName: `Best Case T2 (${getCohortDisplayName(cohortId)})` });
            } else {
                clearAnalysisContext();
            }
        }
        return studyIdChanged;
    }

    function getInsightsStudyId() { return currentState.insightsStudyId; }
    function setInsightsStudyId(newStudyId) {
        return _setter('insightsStudyId', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_STUDY_ID, newStudyId);
    }
    
    function getInsightsPower() { return currentState.insightsPower; }
    function setInsightsPower(newPower) {
        const val = parseFloat(newPower);
        if (isNaN(val) || val < 0.05 || val > 0.99) return false;
        return _setter('insightsPower', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_POWER, val);
    }

    function getInsightsAlpha() { return currentState.insightsAlpha; }
    function setInsightsAlpha(newAlpha) {
        const val = parseFloat(newAlpha);
        if (isNaN(val) || val < 0.001 || val > 0.2) return false;
        return _setter('insightsAlpha', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_ALPHA, val);
    }

    function getInsightsEffectSizeType() { return currentState.insightsEffectSizeType; }
    function setInsightsEffectSizeType(newType) {
        if (newType !== 'observed' && newType !== 'custom') return false;
        return _setter('insightsEffectSizeType', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_EFFECT_SIZE_TYPE, newType);
    }

    function getInsightsCustomEffectSize() { return currentState.insightsCustomEffectSize; }
    function setInsightsCustomEffectSize(newEffectSize) {
        const val = parseFloat(newEffectSize);
        if (isNaN(val) || val < 0.01 || val > 0.5) return false;
        return _setter('insightsCustomEffectSize', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_CUSTOM_EFFECT_SIZE, val);
    }

    function getInsightsFeatureImportanceMethod() { return currentState.insightsFeatureImportanceMethod; }
    function setInsightsFeatureImportanceMethod(newMethod) {
        if (newMethod !== 'univariable' && newMethod !== 'multivariable') return false;
        return _setter('insightsFeatureImportanceMethod', window.APP_CONFIG.STORAGE_KEYS.INSIGHTS_FEATURE_IMPORTANCE_METHOD, newMethod);
    }

    function getPublicationSection() { return currentState.publicationSection; }
    function setPublicationSection(newSectionId) {
        const isValid = window.PUBLICATION_CONFIG.sections.some(s => s.id === newSectionId || s.subSections.some(sub => sub.id === newSectionId));
        return isValid ? _setter('publicationSection', window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_SECTION, newSectionId) : false;
    }

    function getPublicationBruteForceMetric() { return currentState.publicationBruteForceMetric; }
    function setPublicationBruteForceMetric(newMetric) {
        const isValid = window.APP_CONFIG.AVAILABLE_BRUTE_FORCE_METRICS.some(m => m.value === newMetric);
        return isValid ? _setter('publicationBruteForceMetric', window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_BRUTE_FORCE_METRIC, newMetric) : false;
    }

    function getCurrentPublikationLang() { return currentState.publicationLang; }
    function setPublicationLang(newLang) {
        if (newLang === 'en' || newLang === 'de') {
            return _setter('publicationLang', window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_LANG, newLang);
        }
        return false;
    }
    
    function getActiveTabId() { return currentState.activeTabId; }
    function setActiveTabId(newTabId) {
        if (typeof newTabId === 'string' && currentState.activeTabId !== newTabId) {
            currentState.activeTabId = newTabId;
            if (newTabId !== 'comparison' && newTabId !== 'insights') {
                clearAnalysisContext();
            }
            if (newTabId !== 'publication' && getPublicationEditMode()) {
                setPublicationEditMode(false);
            }
            return true;
        }
        return false;
    }

    function getPublicationEditMode() { return currentState.publicationEditMode; }
    function setPublicationEditMode(newMode) {
        return _setter('publicationEditMode', window.APP_CONFIG.STORAGE_KEYS.PUBLICATION_EDIT_MODE, !!newMode);
    }

    function getEditedManuscriptHTML() { return currentState.editedManuscriptHTML; }
    function setEditedManuscriptHTML(html) {
        return _setter('editedManuscriptHTML', window.APP_CONFIG.STORAGE_KEYS.EDITED_MANUSCRIPT_HTML, html);
    }

    function resetEditedManuscriptHTML() {
        currentState.editedManuscriptHTML = null;
        localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.EDITED_MANUSCRIPT_HTML);
        return true;
    }

    return Object.freeze({
        init,
        getCurrentCohort,
        setCurrentCohort,
        getActiveCohortId,
        getAnalysisContext,
        setAnalysisContext,
        clearAnalysisContext,
        getDataTableSort,
        updateDataTableSort,
        getAnalysisTableSort,
        updateAnalysisTableSort,
        getStatsLayout,
        setStatsLayout,
        getStatsCohort1,
        setStatsCohort1,
        getStatsCohort2,
        setStatsCohort2,
        getComparisonView,
        setComparisonView,
        getComparisonStudyId,
        setComparisonStudyId,
        getInsightsStudyId,
        setInsightsStudyId,
        getInsightsPower,
        setInsightsPower,
        getInsightsAlpha,
        setInsightsAlpha,
        getInsightsEffectSizeType,
        setInsightsEffectSizeType,
        getInsightsCustomEffectSize,
        setInsightsCustomEffectSize,
        getInsightsFeatureImportanceMethod,
        setInsightsFeatureImportanceMethod,
        getPublicationSection,
        setPublicationSection,
        getPublicationBruteForceMetric,
        setPublicationBruteForceMetric,
        getCurrentPublikationLang,
        setPublicationLang,
        getActiveTabId,
        setActiveTabId,
        getPublicationEditMode,
        setPublicationEditMode,
        getEditedManuscriptHTML,
        setEditedManuscriptHTML,
        resetEditedManuscriptHTML
    });
})();