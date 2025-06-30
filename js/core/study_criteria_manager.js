window.studyT2CriteriaManager = (() => {

    const literatureCriteriaSets = [
        // --- ESGAR 2016 Criteria Group ---
        {
            id: 'ESGAR_2016_SurgeryAlone',
            name: 'ESGAR 2016 (Surgery alone)',
            displayShortName: 'ESGAR 2016',
            group: 'ESGAR Criteria',
            logic: 'KOMBINIERT',
            applicableCohort: 'surgeryAlone',
            criteria: {
                size: { active: true },
                shape: { active: true, value: 'round' },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Beets_Tan_2018',
                patientCohort: 'Treatment-naïve / Primary Surgery (n=29)',
                investigationType: 'Consensus Guideline Application',
                focus: 'Application of ESGAR 2016 primary staging criteria',
                keyCriteriaSummary: 'Primary Staging: ≥9mm OR (5-8mm AND ≥2 features) OR (<5mm AND 3 features)'
            },
            description: 'ESGAR 2016 consensus criteria for primary staging: A node is malignant if size is ≥9mm, OR 5-8mm with ≥2 suspicious features (round, irregular border, heterogeneous signal), OR <5mm with all 3 features.'
        },
        {
            id: 'ESGAR_2016_Neoadjuvant',
            name: 'ESGAR 2016 (Neoadjuvant therapy)',
            displayShortName: 'ESGAR 2016',
            group: 'ESGAR Criteria',
            logic: 'KOMBINIERT',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: false },
                border: { active: false },
                homogeneity: { active: false },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Beets_Tan_2018',
                patientCohort: 'Neoadjuvant Therapy (n=77)',
                investigationType: 'Consensus Guideline Application',
                focus: 'Application of ESGAR 2016 restaging criteria',
                keyCriteriaSummary: 'Restaging: Short-axis diameter ≥ 5 mm'
            },
            description: 'ESGAR 2016 consensus criteria for restaging after neoadjuvant therapy: A node is considered malignant if its short-axis diameter is ≥ 5 mm.'
        },
        {
            id: 'ESGAR_2016_Overall',
            name: 'ESGAR 2016 (Overall)',
            displayShortName: 'ESGAR 2016',
            group: 'ESGAR Criteria',
            logic: 'KOMBINIERT',
            applicableCohort: 'Overall',
            criteria: {
                size: { active: true },
                shape: { active: true, value: 'round' },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Beets_Tan_2018',
                patientCohort: 'Overall (n=106)',
                investigationType: 'Consensus Guideline Application',
                focus: 'Application of ESGAR 2016 criteria based on patient therapy type',
                keyCriteriaSummary: 'Hybrid: Primary staging logic for surgery-alone patients, restaging logic for neoadjuvant-therapy patients.'
            },
            description: 'Hybrid application of ESGAR 2016 criteria to the overall cohort. Primary staging logic is used for treatment-naïve patients, and restaging logic (size ≥ 5mm) is used for post-neoadjuvant therapy patients.'
        },
        // --- Other Literature Criteria ---
        {
            id: 'Rutegard_2025',
            name: 'ESGAR 2016 (in Rutegård et al. 2025)',
            displayShortName: 'ESGAR 2016 (Rutegård)',
            group: 'Other Literature Criteria',
            logic: 'KOMBINIERT',
            applicableCohort: 'surgeryAlone',
            criteria: {
                size: { active: true },
                shape: { active: true, value: 'round' },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Rutegard_2025',
                patientCohort: 'Treatment-naïve / Overall (n=46)',
                investigationType: 'Prospective, Node-by-Node',
                focus: 'Validation of combined ESGAR 2016 criteria',
                keyCriteriaSummary: '≥9mm OR (5–8mm AND ≥2 features) OR (<5mm AND 3 features)'
            },
            description: 'ESGAR 2016 consensus criteria: A lymph node is considered malignant if it has a short-axis diameter of ≥9 mm, OR if it has a diameter of 5–8 mm and at least two suspicious morphological features (round shape, irregular border, or heterogeneous signal), OR if it has a diameter of <5 mm and all three suspicious features.'
        },
        {
            id: 'Grone_2017',
            name: 'Gröne et al. (2017)',
            displayShortName: 'Gröne 2017',
            group: 'Other Literature Criteria',
            logic: 'AND',
            applicableCohort: 'surgeryAlone',
            criteria: {
                size: { active: false },
                shape: { active: false },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Grone_2017',
                patientCohort: 'Treatment-naïve (n=60)',
                investigationType: 'Retrospective',
                focus: 'Accuracy of single vs. combined morphological criteria',
                keyCriteriaSummary: 'Irregular Border AND Heterogeneous Signal'
            }
        },
        {
            id: 'Jiang_2025',
            name: 'Node-RADS (in Jiang et al. 2025)',
            displayShortName: 'Node-RADS',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'surgeryAlone',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: true, value: 'round' },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Jiang_2025',
                patientCohort: 'Treatment-naïve (n=113)',
                investigationType: 'Retrospective, Modality Benchmarking',
                focus: 'Evaluation of Node-RADS v1.0 classification',
                keyCriteriaSummary: 'Approximation of high-risk categories (Score ≥4) using OR-logic on major criteria.'
            },
            description: 'Approximation of the Node-RADS v1.0 scoring system. A node is classified as malignant if it meets any of the major criteria for a high-risk score (≥4): short-axis ≥5mm, round shape, irregular border, or heterogeneous signal.'
        },
        {
            id: 'Pangarkar_2021',
            name: 'SAR Restaging (in Pangarkar et al. 2021)',
            displayShortName: 'SAR (Pangarkar 2021)',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: false },
                border: { active: false },
                homogeneity: { active: false },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Pangarkar_2021',
                patientCohort: 'Neoadjuvant Therapy (n=166)',
                investigationType: 'Retrospective',
                focus: 'Validation of SAR restaging criteria (size ≥ 5 mm)',
                keyCriteriaSummary: 'Short-axis diameter ≥ 5 mm'
            }
        },
        {
            id: 'Zhang_2023',
            name: 'ESGAR Restaging (in Zhang et al. 2023)',
            displayShortName: 'ESGAR (Zhang 2023)',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: false },
                border: { active: false },
                homogeneity: { active: false },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Zhang_2023',
                patientCohort: 'Neoadjuvant Therapy (n=90)',
                investigationType: 'Retrospective, Node-by-Node',
                focus: 'Validation of ESGAR restaging criterion (size ≥ 5 mm)',
                keyCriteriaSummary: 'Short-axis diameter ≥ 5 mm'
            }
        },
        {
            id: 'Crimi_2024',
            name: 'Long-Axis Criterion (in Crimì et al. 2024)',
            displayShortName: 'Long-Axis (Crimì 2024)',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 5.5, condition: '>=' }, // Note: This is an approximation. The study used long-axis.
                shape: { active: false },
                border: { active: false },
                homogeneity: { active: false },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Crimi_2024',
                patientCohort: 'Neoadjuvant Therapy (n=139)',
                investigationType: 'Retrospective',
                focus: 'Comparison of dimensional criteria (long-axis, volume)',
                keyCriteriaSummary: 'Long-axis ≥ 5.5 mm (approximated here by short-axis)'
            }
        },
        {
            id: 'Barbaro_2024',
            name: 'Barbaro et al. (2024)',
            displayShortName: 'Barbaro 2024',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 2.2, condition: '>' },
                shape: { active: false },
                border: { active: false },
                homogeneity: { active: false },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Barbaro_2024',
                patientCohort: 'Neoadjuvant Therapy (n=191)',
                investigationType: 'Retrospective, Post-nCRT',
                focus: 'Size criteria for predicting ypN0',
                keyCriteriaSummary: 'Short-axis diameter > 2.2 mm'
            }
        },
        {
            id: 'Almlov_2020',
            name: 'Almlöv et al. (2020)',
            displayShortName: 'Almlöv 2020',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'neoadjuvantTherapy',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: false },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Almlov_2020',
                patientCohort: 'Neoadjuvant Therapy (n=80)',
                investigationType: 'Retrospective Case-Control',
                focus: 'Risk factors for metachronous metastases',
                keyCriteriaSummary: 'Size ≥5mm OR Irregular Border OR Heterogeneous Signal'
            }
        },
        {
            id: 'Koh_2008',
            name: 'Koh et al. (2008)',
            displayShortName: 'Koh 2008',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'Overall',
            criteria: {
                size: { active: false },
                shape: { active: false },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Koh_2008',
                patientCohort: 'Overall (n=25)',
                investigationType: 'Prospective, Pre- and Post-nCRT',
                focus: 'Morphological assessment post-nCRT',
                keyCriteriaSummary: 'Irregular Border OR Heterogeneous Signal'
            }
        },
        {
            id: 'Zhuang_2021',
            name: 'Zhuang et al. (2021) - Size+Morphology',
            displayShortName: 'Zhuang 2021 (Size+Morph)',
            group: 'Other Literature Criteria',
            logic: 'OR',
            applicableCohort: 'Overall',
            criteria: {
                size: { active: true, threshold: 5.0, condition: '>=' },
                shape: { active: false },
                border: { active: true, value: 'irregular' },
                homogeneity: { active: true, value: 'heterogeneous' },
                signal: { active: false }
            },
            studyInfo: {
                refKey: 'Zhuang_2021',
                patientCohort: 'Overall (Meta-Analysis, n=2,875)',
                investigationType: 'Systematic Review',
                focus: 'Comparison of various size and morphology criteria',
                keyCriteriaSummary: 'Approximation of "Size ≥ 5 mm with morphological standard"'
            }
        }
    ];

    function formatCriteriaForDisplay(criteria, logic = null, shortFormat = false) {
        if (!criteria || typeof criteria !== 'object') return 'N/A';
        const parts = [];
        const activeKeys = Object.keys(criteria).filter(key => key !== 'logic' && criteria[key]?.active === true);
        if (activeKeys.length === 0) return 'No active criteria';

        const formatValue = (key, criterion, isShort) => {
            if (!criterion) return '?';
            if (key === 'size') {
                const formattedThreshold = formatNumber(criterion.threshold, 1, '?', true);
                return `Size ${criterion.condition || '>='} ${formattedThreshold}mm`;
            }
            let value = criterion.value || '?';
            if (isShort) {
                switch (value) {
                    case 'irregular': value = 'irreg.'; break;
                    case 'sharp': value = 'smooth'; break;
                    case 'heterogeneous': value = 'heterog.'; break;
                    case 'homogeneous': value = 'homog.'; break;
                    case 'lowSignal': value = 'low sig.'; break;
                    case 'intermediateSignal': value = 'int. sig.'; break;
                    case 'highSignal': value = 'high sig.'; break;
                }
            }

            let prefix = '';
            switch(key) {
                case 'shape': prefix = isShort ? 'Sh=' : 'Shape='; break;
                case 'border': prefix = isShort ? 'Bo=' : 'Border='; break;
                case 'homogeneity': prefix = isShort ? 'Ho=' : 'Homog.='; break;
                case 'signal': prefix = isShort ? 'Si=' : 'Signal='; break;
                default: prefix = key + '=';
            }
            return `${prefix}${value}`;
        };

        const priorityOrder = ['size', 'border', 'homogeneity', 'shape', 'signal'];
        const sortedActiveKeys = [...activeKeys].sort((a, b) => {
            const indexA = priorityOrder.indexOf(a);
            const indexB = priorityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        const effectiveLogic = logic || criteria.logic || 'OR';
        if (effectiveLogic === 'KOMBINIERT') {
             const studySet = literatureCriteriaSets.find(s => s.logic === 'KOMBINIERT' && s.criteria === criteria);
             if (studySet?.studyInfo?.keyCriteriaSummary) {
                 return shortFormat ? (studySet.displayShortName || studySet.name) : studySet.studyInfo.keyCriteriaSummary;
             }
             return 'Combined ESGAR Logic';
        }
        
        sortedActiveKeys.forEach(key => {
             parts.push(formatValue(key, criteria[key], shortFormat));
        });

        const separator = (effectiveLogic === 'AND') ? ' AND ' : ' OR ';
        if (shortFormat && parts.length > 2) {
             return parts.slice(0, 2).join(separator) + ' ...';
        }
        return parts.join(separator);
    }

    function getAllStudyCriteriaSets() {
        return cloneDeep(literatureCriteriaSets);
    }

    function getStudyCriteriaSetById(id) {
        if (typeof id !== 'string') return null;
        const foundSet = literatureCriteriaSets.find(set => set.id === id);
        return foundSet ? cloneDeep(foundSet) : null;
    }

    function _evaluateNodeWithEsgarLogic(lymphNode, criteriaSet, patientTherapy) {
        const checkResult = {
            size: null, shape: null, border: null, homogeneity: null, signal: null,
            esgarCategory: 'N/A', esgarMorphologyCount: 0, isPositive: false
        };
        if (!lymphNode || !criteriaSet) return checkResult;

        const nodeSize = (typeof lymphNode.size === 'number' && !isNaN(lymphNode.size)) ? lymphNode.size : -1;
        const criteria = criteriaSet.criteria;

        let useRestagingLogic = false;
        if (criteriaSet.id === 'ESGAR_2016_Neoadjuvant') {
            useRestagingLogic = true;
        } else if (criteriaSet.id === 'ESGAR_2016_Overall') {
            useRestagingLogic = (patientTherapy === 'neoadjuvantTherapy');
        }

        if (useRestagingLogic) {
            checkResult.isPositive = (nodeSize >= 5.0);
            checkResult.esgarCategory = 'Restaging Logic';
            return checkResult;
        }
        
        const hasRoundShape = (lymphNode.shape === criteria.shape.value);
        const hasIrregularBorder = (lymphNode.border === criteria.border.value);
        const hasHeterogeneousHomogeneity = (lymphNode.homogeneity === criteria.homogeneity.value);

        let morphologyCount = 0;
        if (hasRoundShape) morphologyCount++;
        if (hasIrregularBorder) morphologyCount++;
        if (hasHeterogeneousHomogeneity) morphologyCount++;
        
        checkResult.shape = hasRoundShape;
        checkResult.border = hasIrregularBorder;
        checkResult.homogeneity = hasHeterogeneousHomogeneity;
        checkResult.esgarMorphologyCount = morphologyCount;

        if (nodeSize >= 9.0) {
            checkResult.isPositive = true;
            checkResult.esgarCategory = '≥9mm';
        } else if (nodeSize >= 5.0 && nodeSize < 9.0) {
            checkResult.esgarCategory = '5-8mm';
            if (morphologyCount >= 2) {
                checkResult.isPositive = true;
            }
        } else if (nodeSize >= 0 && nodeSize < 5.0) {
             checkResult.esgarCategory = '<5mm';
             if (morphologyCount >= 3) {
                 checkResult.isPositive = true;
             }
        } else {
            checkResult.esgarCategory = 'N/A (Invalid Size)';
        }
        return checkResult;
    }

    function evaluatePatientWithStudyCriteria(patient, studyCriteriaSet) {
        if (!patient || !studyCriteriaSet) {
            return { t2Status: null, positiveNodeCount: 0, evaluatedNodes: [] };
        }
        
        const logic = studyCriteriaSet.logic;
        if (logic === 'OR' || logic === 'AND') {
            return window.t2CriteriaManager.evaluatePatient(patient, studyCriteriaSet.criteria, logic);
        }

        if (logic === 'KOMBINIERT') {
            const lymphNodes = patient.t2Nodes;
            if (!Array.isArray(lymphNodes) || lymphNodes.length === 0) {
                return { t2Status: '-', positiveNodeCount: 0, evaluatedNodes: [] };
            }
            
            let patientIsPositive = false;
            let positiveNodeCount = 0;
            const evaluatedNodes = lymphNodes.map(lk => {
                if (!lk) return null;
                const checkResult = _evaluateNodeWithEsgarLogic(lk, studyCriteriaSet, patient.therapy);
                const isNodePositive = checkResult.isPositive;
                if (isNodePositive) {
                    patientIsPositive = true;
                    positiveNodeCount++;
                }
                return { ...lk, isPositive: isNodePositive, checkResult };
            }).filter(node => node !== null);
    
            return {
                t2Status: patientIsPositive ? '+' : '-',
                positiveNodeCount,
                evaluatedNodes
            };
        }
        
        return { t2Status: null, positiveNodeCount: 0, evaluatedNodes: [] };
    }

    function evaluateDatasetWithStudyCriteria(dataset, studyCriteriaSet) {
        if (!studyCriteriaSet) {
            return (dataset || []).map(p => ({ ...cloneDeep(p), t2Status: null, countT2NodesPositive: 0, t2NodesEvaluated: [] }));
        }
        if (!Array.isArray(dataset)) return [];
        return dataset.map(patient => {
            if (!patient) return null;
            const patientCopy = cloneDeep(patient);
            const { t2Status, positiveNodeCount, evaluatedNodes } = evaluatePatientWithStudyCriteria(patientCopy, studyCriteriaSet);
            patientCopy.t2Status = t2Status;
            patientCopy.countT2NodesPositive = positiveNodeCount;
            patientCopy.t2NodesEvaluated = evaluatedNodes;
            return patientCopy;
        }).filter(p => p !== null);
    }

    return Object.freeze({
        getAllStudyCriteriaSets,
        getStudyCriteriaSetById,
        evaluatePatientWithStudyCriteria,
        evaluateDatasetWithStudyCriteria,
        formatCriteriaForDisplay
    });
})();