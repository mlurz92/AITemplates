window.uiComponents = (() => {

    function createDashboardCard(title, content, chartId = null, cardClasses = '', headerClasses = '', bodyClasses = '', cohortDisplayName = '') {
        const tooltipKey = chartId ? chartId.replace(/^chart-dash-/, '').replace(/-/g, '') : title.toLowerCase().replace(/\s+/g, '');
        
        const tooltipConfig = window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics;
        let tooltipContent = title || '';
        if (tooltipConfig && tooltipConfig[tooltipKey] && tooltipConfig[tooltipKey].description) {
            tooltipContent = tooltipConfig[tooltipKey].description;
        }

        if (cohortDisplayName) {
            tooltipContent = tooltipContent.replace('[COHORT]', `<strong>${cohortDisplayName}</strong>`);
        }

        return `
            <div class="col-xl-2 col-lg-4 col-md-4 col-sm-6 dashboard-card-col ${cardClasses}">
                <div class="card h-100 dashboard-card">
                    <div class="card-header ${headerClasses} d-flex justify-content-between align-items-center" data-tippy-content="${tooltipContent}">
                        <span class="text-truncate">${title}</span>
                    </div>
                    <div class="card-body d-flex flex-column justify-content-between ${bodyClasses}">
                        <div class="dashboard-card-content">${content}</div>
                        ${chartId ? `<div id="${chartId}" class="mt-1 w-100 dashboard-chart-container"></div>` : ''}
                    </div>
                </div>
            </div>`;
    }

    function createT2CriteriaControls(initialCriteria, initialLogic) {
        if (!initialCriteria || !initialLogic) return '<p class="text-danger">Error: Could not load initial criteria.</p>';
        const logicChecked = initialLogic === 'OR';
        const defaultCriteria = getDefaultT2Criteria();
        const sizeThreshold = initialCriteria.size?.threshold ?? defaultCriteria.size.threshold;
        const { min, max, step } = window.APP_CONFIG.T2_CRITERIA_SETTINGS.SIZE_RANGE;
        const formattedThresholdForInput = formatNumber(sizeThreshold, 1, '5.0', true);
        const tooltips = window.APP_CONFIG.UI_TEXTS.tooltips;

        const createButtonOptions = (key, isChecked, criterionLabel) => {
            const valuesKey = key.toUpperCase() + '_VALUES';
            const values = window.APP_CONFIG.T2_CRITERIA_SETTINGS[valuesKey];
            if (!Array.isArray(values)) return '';
            const currentValue = initialCriteria[key]?.value;

            return values.map(value => {
                const isActiveValue = isChecked && currentValue === value;
                const icon = getT2IconSVG(key, value);
                const buttonTooltip = `Set criterion '${criterionLabel}' to '${value}'. ${isChecked ? '' : '(Criterion is currently inactive)'}`;
                
                return `<button class="btn t2-criteria-button criteria-icon-button ${isActiveValue ? 'active' : ''} ${!isChecked ? 'inactive-option' : ''}" data-criterion="${key}" data-value="${value}" data-tippy-content="${buttonTooltip}" ${!isChecked ? 'disabled' : ''}>${icon}</button>`;
            }).join('');
        };

        const createCriteriaGroup = (key, label, tooltipKey, contentGenerator) => {
            const isChecked = initialCriteria[key]?.active === true;
            let tooltip = tooltips[tooltipKey]?.description || label;
            if (tooltipKey === 't2Size') {
                tooltip = tooltip.replace('[MIN]', min).replace('[MAX]', max).replace('[STEP]', step);
            }
            return `
                <div class="col-md-6 criteria-group">
                    <div class="form-check mb-2">
                        <input class="form-check-input criteria-checkbox" type="checkbox" value="${key}" id="check-${key}" ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label fw-bold" for="check-${key}">${label}</label>
                         <span data-tippy-content="${tooltip}"> <i class="fas fa-info-circle text-muted ms-1"></i></span>
                    </div>
                    <div class="criteria-options-container ps-3">
                        ${contentGenerator(key, isChecked, label)}
                    </div>
                </div>`;
        };

        return `
            <div class="card criteria-card" id="t2-criteria-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Define T2 Criteria</span>
                    <div class="form-check form-switch" data-tippy-content="${tooltips.t2Logic.description}">
                         <label class="form-check-label small me-2" for="t2-logic-switch" id="t2-logic-label-prefix">Logic:</label>
                         <input class="form-check-input" type="checkbox" role="switch" id="t2-logic-switch" ${logicChecked ? 'checked' : ''}>
                         <label class="form-check-label fw-bold" for="t2-logic-switch" id="t2-logic-label">${window.APP_CONFIG.UI_TEXTS.t2LogicDisplayNames[initialLogic] || initialLogic}</label>
                     </div>
                </div>
                <div class="card-body">
                     <div class="row g-4">
                        ${createCriteriaGroup('size', 'Size', 't2Size', (key, isChecked) => `
                            <div class="d-flex align-items-center flex-wrap">
                                 <span class="me-1 small text-muted">≥</span>
                                 <input type="range" class="form-range criteria-range flex-grow-1 me-2" id="range-size" min="${min}" max="${max}" step="${step}" value="${formattedThresholdForInput}" ${!isChecked ? 'disabled' : ''} data-tippy-content="Set short-axis diameter threshold (≥).">
                                 <span class="criteria-value-display text-end me-1 fw-bold" id="value-size">${formatNumber(sizeThreshold, 1)}</span><span class="me-2 small text-muted">mm</span>
                                 <input type="number" class="form-control form-control-sm criteria-input-manual" id="input-size" min="${min}" max="${max}" step="${step}" value="${formattedThresholdForInput}" ${!isChecked ? 'disabled' : ''} style="width: 70px;" aria-label="Enter size manually" data-tippy-content="Enter threshold manually.">
                            </div>
                        `)}
                        ${createCriteriaGroup('shape', 'Shape', 't2Shape', createButtonOptions)}
                        ${createCriteriaGroup('border', 'Border', 't2Border', createButtonOptions)}
                        ${createCriteriaGroup('homogeneity', 'Homogeneity', 't2Homogeneity', createButtonOptions)}
                        ${createCriteriaGroup('signal', 'Signal', 't2Signal', createButtonOptions)}
                        <div class="col-12 d-flex justify-content-end align-items-center border-top pt-3 mt-3">
                            <button class="btn btn-sm btn-outline-secondary me-2" id="btn-reset-criteria" data-tippy-content="${tooltips.t2Actions.reset}">
                                <i class="fas fa-undo me-1"></i> Reset to Default
                            </button>
                            <button class="btn btn-sm btn-primary" id="btn-apply-criteria" data-tippy-content="${tooltips.t2Actions.apply}">
                                <i class="fas fa-check me-1"></i> Apply & Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function createStatisticsCard(id, title, content = '', addPadding = true, tooltipKey = null, cohortId = '') {
        let cardTooltipHtml = `data-tippy-content="${title}"`;
        if (tooltipKey && window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics && window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics[tooltipKey] && window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics[tooltipKey].cardTitle) {
            let tooltipTemplate = window.APP_CONFIG.UI_TEXTS.tooltips.descriptiveStatistics[tooltipKey].cardTitle;
            let cohortName = cohortId ? getCohortDisplayName(cohortId) : 'the current cohort';
            let finalTooltip = tooltipTemplate.replace('[COHORT]', `<strong>${cohortName}</strong>`);
            cardTooltipHtml = `data-tippy-content="${finalTooltip}"`;
        }
        
        return `
            <div class="col-12 stat-card" id="${id}-card-container">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center" ${cardTooltipHtml}>
                         <span>${title}</span>
                     </div>
                    <div class="card-body ${addPadding ? '' : 'p-0'}" style="overflow-y: auto; overflow-x: hidden;">
                        <div id="${id}-content">${content}</div>
                    </div>
                </div>
            </div>`;
    }

    function createPublicationNav(currentSectionId) {
        const navItems = window.PUBLICATION_CONFIG.sections.map(mainSection => {
            const sectionLabel = window.APP_CONFIG.UI_TEXTS.publicationTab.sectionLabels[mainSection.labelKey] || mainSection.id.replace(/_/g, ' ');
            const isMainActive = mainSection.id === currentSectionId || (mainSection.subSections && mainSection.subSections.some(sub => sub.id === currentSectionId));
            
            let subNavHTML = '';
            if (isMainActive && mainSection.subSections && mainSection.subSections.length > 0) {
                subNavHTML += '<ul class="nav flex-column ps-3 mt-1 mb-2">';
                mainSection.subSections.forEach(sub => {
                    const isSubActive = sub.id === currentSectionId;
                    subNavHTML += `
                        <li class="nav-item">
                            <a class="nav-link nav-link-sub py-1 publication-section-link ${isSubActive ? 'active' : ''}" href="#" data-section-id="${sub.id}" data-tippy-content="${sub.label}">
                                ${sub.label}
                            </a>
                        </li>`;
                });
                subNavHTML += '</ul>';
            }
            
            const mainLinkClass = (mainSection.subSections && mainSection.subSections.length > 0) ? 'nav-link-main' : '';
            const wordCountSpan = mainSection.limit ? '<span class="word-count-indicator"></span>' : '';

            return `
                <li class="nav-item">
                    <a class="nav-link py-2 publication-section-link d-flex justify-content-between align-items-center ${mainLinkClass} ${isMainActive && !subNavHTML ? 'active' : ''}" href="#" data-section-id="${mainSection.id}" data-tippy-content="${sectionLabel}">
                        ${sectionLabel}
                        ${wordCountSpan}
                    </a>
                    ${subNavHTML}
                </li>`;
        }).join('');

        return `<nav id="publication-sections-nav" class="nav flex-column nav-pills">${navItems}</nav>`;
    }

    function createBruteForceModalContent(resultsData) {
        if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
            return '<p class="text-center text-muted">No brute-force results available.</p>';
        }

        const formatCriteriaFunc = typeof window.studyT2CriteriaManager !== 'undefined' ? window.studyT2CriteriaManager.formatCriteriaForDisplay : (c, l) => 'N/A';
        const { results, metric, duration, totalTested, cohort, nTotal, nPlus, nMinus } = resultsData;

        let html = `
            <div class="mb-4">
                <h5>Optimization Summary for Cohort: ${getCohortDisplayName(cohort)}</h5>
                <ul class="list-unstyled small mb-2">
                    <li><strong>Target Metric:</strong> ${metric}</li>
                    <li><strong>Total Combinations Tested:</strong> ${formatNumber(totalTested, 0)}</li>
                    <li><strong>Duration:</strong> ${formatNumber(duration / 1000, 1, 'N/A', true)} seconds</li>
                    <li><strong>Patient Count (N):</strong> ${formatNumber(nTotal, 0)} (N+: ${formatNumber(nPlus, 0)}, N-: ${formatNumber(nMinus, 0)})</li>
                </ul>
            </div>
            <h5>Top Results (including ties):</h5>
            <div class="table-responsive">
                <table class="table table-sm table-striped small" id="bruteforce-results-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>${metric}</th>
                            <th>Logic</th>
                            <th>Criteria</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let rank = 1;
        let displayedCount = 0;
        let lastMetricValue = -Infinity;
        const precision = 1e-8;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result || typeof result.metricValue !== 'number' || !isFinite(result.metricValue)) continue;

            const currentMetricValueRounded = parseFloat(result.metricValue.toFixed(precision));
            const lastMetricValueRounded = parseFloat(lastMetricValue.toFixed(precision));

            let currentRank = rank;
            const isNewRank = Math.abs(currentMetricValueRounded - lastMetricValueRounded) > precision;

            if (i > 0 && isNewRank) {
                rank = displayedCount + 1;
                currentRank = rank;
            } else if (i > 0) {
                currentRank = rank;
            }

            if (rank > 10 && isNewRank) {
                break;
            }

            html += `
                <tr>
                    <td>${currentRank}</td>
                    <td>${formatNumber(result.metricValue, 4, 'N/A', true)}</td>
                    <td>${result.logic.toUpperCase()}</td>
                    <td><code>${formatCriteriaFunc(result.criteria, result.logic)}</code></td>
                </tr>
            `;

            if (isNewRank || i === 0) {
                lastMetricValue = result.metricValue;
            }
            displayedCount++;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function createBruteForceOverviewTableHTML(allBfResultsByCohort) {
        if (!allBfResultsByCohort || Object.keys(allBfResultsByCohort).length === 0) {
            return '<p class="text-muted small p-3">No saved brute-force optimization results available. Run optimization on the Analysis tab.</p>';
        }

        const formatCriteriaFunc = typeof window.studyT2CriteriaManager !== 'undefined' ? window.studyT2CriteriaManager.formatCriteriaForDisplay : (c, l) => 'N/A';
        const na = window.APP_CONFIG.NA_PLACEHOLDER;
        
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-striped small caption-top">
                    <caption>Saved Brute-Force Optima</caption>
                    <thead>
                        <tr>
                            <th>Cohort</th>
                            <th>Target Metric</th>
                            <th>Best Value</th>
                            <th>Criteria</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const cohortOrder = ['Overall', 'surgeryAlone', 'neoadjuvantTherapy'];
        let hasContent = false;

        cohortOrder.forEach(cohortId => {
            if (allBfResultsByCohort[cohortId]) {
                const cohortResults = allBfResultsByCohort[cohortId];
                const cohortMetrics = Object.keys(cohortResults);
                
                if (cohortMetrics.length > 0) {
                    hasContent = true;
                    tableHTML += `<tr><td colspan="5" class="text-start table-group-divider fw-bold pt-2">${getCohortDisplayName(cohortId)}</td></tr>`;

                    cohortMetrics.sort((a,b) => a.localeCompare(b)).forEach(metricName => {
                        const result = cohortResults[metricName];
                        if(result && result.bestResult) {
                            tableHTML += `
                                <tr>
                                    <td></td>
                                    <td>${metricName}</td>
                                    <td>${formatNumber(result.bestResult.metricValue, 4, na, true)}</td>
                                    <td><code>${formatCriteriaFunc(result.bestResult.criteria, result.bestResult.logic, true)}</code></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary p-0 px-2" 
                                                data-action="apply-saved-bf" 
                                                data-cohort="${cohortId}" 
                                                data-metric="${metricName}"
                                                data-tippy-content="Apply this set of criteria to the 'Define T2 Criteria' panel.">
                                            Apply
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }
                    });
                }
            }
        });

        if (!hasContent) {
            return '<p class="text-muted small p-3">No saved brute-force optimization results available. Run optimization on the Analysis tab.</p>';
        }

        tableHTML += '</tbody></table></div>';
        return tableHTML;
    }

    function createBruteForceRunnerCardHTML(state, payload, bfWorkerAvailable, currentCohort, selectedMetric) {
        const metricOptions = window.APP_CONFIG.AVAILABLE_BRUTE_FORCE_METRICS;
        let startButtonDisabled = true;
        let cancelButtonDisabled = true;
        let applyBestButtonDisabled = true;
        let showDetailsButtonDisabled = true;
        let progressHTML = '';

        const currentCohortResults = window.bruteForceManager.getAllResultsForCohort(currentCohort);
        const currentBestResultForMetric = currentCohortResults?.[selectedMetric]?.bestResult;
        const formatCriteriaFunc = typeof window.studyT2CriteriaManager !== 'undefined' ? window.studyT2CriteriaManager.formatCriteriaForDisplay : (c, l) => 'N/A';

        switch (state) {
            case 'initial':
                startButtonDisabled = !bfWorkerAvailable;
                cancelButtonDisabled = true;
                applyBestButtonDisabled = !currentBestResultForMetric;
                showDetailsButtonDisabled = !currentBestResultForMetric;
                progressHTML = `
                    <p class="mb-2 small text-muted">Select metric and start optimization.</p>
                    <div class="progress" style="height: 5px;"><div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>
                    <p class="small text-muted mt-2 mb-0">Progress: 0%</p>
                `;
                break;
            case 'progress':
                startButtonDisabled = true;
                cancelButtonDisabled = false;
                applyBestButtonDisabled = true;
                showDetailsButtonDisabled = true;
                const tested = payload?.tested || 0;
                const total = payload?.total || 1;
                const percent = total > 0 ? Math.floor((tested / total) * 100) : 0;
                const currentBest = payload?.currentBest;
                const currentBestInfo = currentBest ? `Current Best: <strong>${formatNumber(currentBest.metricValue, 4)}</strong> with <code>${formatCriteriaFunc(currentBest.criteria, currentBest.logic, true)}</code>` : 'No best found yet.';
                progressHTML = `
                    <p class="mb-2 small text-muted">Running on cohort: <strong>${getCohortDisplayName(currentCohort)}</strong>, Metric: <strong>${payload?.metric || selectedMetric}</strong></p>
                    <div class="progress" style="height: 5px;"><div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: ${percent}%;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div></div>
                    <p class="small text-muted mt-2 mb-0">Combinations tested: ${formatNumber(tested, 0)} / ${formatNumber(total, 0)} (${percent}%)</p>
                    <p class="small text-muted mb-0">${currentBestInfo}</p>
                `;
                break;
            case 'result':
                startButtonDisabled = !bfWorkerAvailable;
                cancelButtonDisabled = true;
                applyBestButtonDisabled = !(payload && payload.bestResult);
                showDetailsButtonDisabled = !(payload && payload.bestResult);
                const best = payload;
                const durationSeconds = (best?.duration || 0) / 1000;
                progressHTML = `
                    <p class="mb-2 small text-muted">Optimization finished for cohort: <strong>${getCohortDisplayName(best?.cohort || currentCohort)}</strong>, Metric: <strong>${best?.metric || selectedMetric}</strong></p>
                    <div class="progress" style="height: 5px;"><div class="progress-bar bg-success" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div></div>
                    <p class="small text-muted mt-2 mb-0">Total Tested: ${formatNumber(best?.totalTested || 0, 0)} in ${formatNumber(durationSeconds, 1)} seconds</p>
                    <p class="small text-muted mb-0">Best Result: <strong>${formatNumber(best?.bestResult?.metricValue, 4)}</strong> with <code>${formatCriteriaFunc(best?.bestResult?.criteria, best?.bestResult?.logic, true)}</code></p>
                `;
                break;
            case 'cancelled':
                startButtonDisabled = !bfWorkerAvailable;
                cancelButtonDisabled = true;
                applyBestButtonDisabled = !currentBestResultForMetric;
                showDetailsButtonDisabled = !currentBestResultForMetric;
                progressHTML = `
                    <p class="mb-2 small text-muted">Optimization cancelled for cohort: <strong>${getCohortDisplayName(payload?.cohort || currentCohort)}</strong>.</p>
                    <div class="progress" style="height: 5px;"><div class="progress-bar bg-warning" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>
                    <p class="small text-muted mt-2 mb-0">Progress: Cancelled</p>
                `;
                break;
            case 'error':
                startButtonDisabled = !bfWorkerAvailable;
                cancelButtonDisabled = true;
                applyBestButtonDisabled = !currentBestResultForMetric;
                showDetailsButtonDisabled = !currentBestResultForMetric;
                progressHTML = `
                    <p class="mb-2 small text-danger">Error during optimization for cohort: <strong>${getCohortDisplayName(payload?.cohort || currentCohort)}</strong>.</p>
                    <div class="progress" style="height: 5px;"><div class="progress-bar bg-danger" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>
                    <p class="small text-danger mt-2 mb-0">Error: ${payload?.message || 'Unknown error'}</p>
                `;
                break;
            default:
                 progressHTML = `<p class="text-muted small">Waiting for state...</p>`;
        }

        const content = `
            <div class="p-3">
                <div class="mb-3">
                    <label for="brute-force-metric" class="form-label small text-muted mb-1">Optimize for Metric:</label>
                    <select class="form-select form-select-sm" id="brute-force-metric" ${window.bruteForceManager.isRunning() ? 'disabled' : ''}>
                        ${metricOptions.map(m => `<option value="${m.value}" ${m.value === selectedMetric ? 'selected' : ''}>${m.label}</option>`).join('')}
                    </select>
                </div>
                ${progressHTML}
                <div class="d-flex justify-content-end mt-3">
                    <button class="btn btn-sm btn-outline-primary me-2" id="btn-start-brute-force" ${startButtonDisabled ? 'disabled' : ''}><i class="fas fa-play me-1"></i> Start</button>
                    <button class="btn btn-sm btn-outline-warning me-2" id="btn-cancel-brute-force" ${cancelButtonDisabled ? 'disabled' : ''}><i class="fas fa-stop me-1"></i> Cancel</button>
                    <button class="btn btn-sm btn-info me-2" id="btn-show-bf-details" ${showDetailsButtonDisabled ? 'disabled' : ''}><i class="fas fa-info-circle me-1"></i> Top 10</button>
                    <button class="btn btn-sm btn-success" id="btn-apply-best-bf-criteria" data-metric="${selectedMetric}" ${applyBestButtonDisabled ? 'disabled' : ''}><i class="fas fa-arrow-alt-circle-up me-1"></i> Apply Best</button>
                </div>
            </div>
        `;
        
        return createStatisticsCard('bf-runner-card', 'Criteria Optimization (Brute-Force)', content, false);
    }

    function createAnalysisContextBannerHTML(context, patientCount) {
        if (!context) return '';
        const { cohortId, criteriaName } = context;
        const cohortName = getCohortDisplayName(cohortId);
        const count = patientCount ?? '?';
        
        let text = window.APP_CONFIG.UI_TEXTS.analysisContextBanner.text
            .replace('[CRITERIA_NAME]', criteriaName || 'the selected criteria')
            .replace('[COHORT_NAME]', cohortName)
            .replace('[COUNT]', count);
        
        return `
            <div class="alert alert-info small p-2 mt-3 text-center" role="alert" id="analysis-context-banner">
                <i class="fas fa-info-circle me-1"></i>
                <strong>${window.APP_CONFIG.UI_TEXTS.analysisContextBanner.title}:</strong> ${text}
            </div>
        `;
    }

    function createAddedValueCardHTML(addedValueStats, t2SetName) {
        const na = window.APP_CONFIG.NA_PLACEHOLDER;
        const fP = (val, dig = 1) => formatPercent(val, dig, na);
        const fCI_p = (m, k) => { 
            const d = (k === 'auc' || k === 'f1' || k ==='youden' || k === 'balAcc') ? 3 : 1; 
            const p = !(k === 'auc' || k === 'f1' || k ==='youden' || k === 'balAcc'); 
            return formatCI(m?.value, m?.ci?.lower, m?.ci?.upper, d, p, na); 
        };
        
        const fpData = addedValueStats?.t2FalsePositives;
        const fnData = addedValueStats?.t2FalseNegatives;

        if (!fpData || !fnData) {
            return '<p class="text-muted small p-2">Added value analysis data not available.</p>';
        }

        const fpPerf = fpData.performanceAS;
        const fnPerf = fnData.performanceAS;

        return `
            <div class="table-responsive">
                <table class="table table-sm table-striped small mb-0">
                    <thead class="small">
                        <tr>
                            <th data-tippy-content="Analysis of subgroups where the initial T2 criteria failed.">Subgroup (T2 Failure)</th>
                            <th data-tippy-content="Number of patients in this subgroup.">N</th>
                            <th data-tippy-content="Specificity of the Avocado Sign within this subgroup.">AS Specificity</th>
                            <th data-tippy-content="Sensitivity of the Avocado Sign within this subgroup.">AS Sensitivity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>T2 False Positives (T2+, N-)</td>
                            <td>${fpData.count}</td>
                            <td data-tippy-content="Of the ${fpData.count} patients incorrectly flagged by T2 criteria, the Avocado Sign correctly identified ${fP(fpPerf?.spec?.value, 1)} as negative.">${fCI_p(fpPerf?.spec, 'spec')}</td>
                            <td>${na}</td>
                        </tr>
                        <tr>
                            <td>T2 False Negatives (T2-, N+)</td>
                            <td>${fnData.count}</td>
                            <td>${na}</td>
                            <td data-tippy-content="Of the ${fnData.count} patients missed by T2 criteria, the Avocado Sign correctly identified ${fP(fnPerf?.sens?.value, 1)} as positive.">${fCI_p(fnPerf?.sens, 'sens')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
    }

    function createExportTabContentHTML() {
        const exportText = window.APP_CONFIG.UI_TEXTS.exportTab;
        return `
            <div class="p-4">
                <h3 class="mb-4">Export Publication Content</h3>
                <p class="text-muted mb-4">Generate exportable files from the current publication content and charts. Please ensure you have navigated through the "Publication" tab first to fully render all content before exporting.</p>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
                                <i class="fas fa-file-alt fa-3x mb-3 text-primary"></i>
                                <h5 class="card-title text-center">${exportText.exportManuscript}</h5>
                                <p class="card-text text-center small text-muted">Exports the complete manuscript (text, tables, and figures as text descriptions) in Markdown format.</p>
                                <button class="btn btn-primary mt-3" id="btn-export-manuscript-md">
                                    <i class="fas fa-file-download me-2"></i> Download Markdown
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
                                <i class="fas fa-table fa-3x mb-3 text-success"></i>
                                <h5 class="card-title text-center">${exportText.exportTables}</h5>
                                <p class="card-text text-center small text-muted">Extracts and exports all tables from the manuscript as separate Markdown files.</p>
                                <button class="btn btn-success mt-3" id="btn-export-tables-md">
                                    <i class="fas fa-file-csv me-2"></i> Download Tables
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-body d-flex flex-column align-items-center justify-content-center p-4">
                                <i class="fas fa-chart-area fa-3x mb-3 text-info"></i>
                                <h5 class="card-title text-center">${exportText.exportCharts}</h5>
                                <p class="card-text text-center small text-muted">Exports all generated charts (ROC, Bar, Pie, Histogram, Flowchart) as individual SVG files.</p>
                                <button class="btn btn-info mt-3" id="btn-export-charts-svg">
                                    <i class="fas fa-chart-pie me-2"></i> Download Charts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function createPowerAnalysisCardHTML(insightsState, powerAnalysisData) {
        const { studyId, power, alpha, effectSizeType, customEffectSize } = insightsState;
        const { varDiff, effectSize, n } = powerAnalysisData || {};
        
        const isDataAvailable = typeof varDiff === 'number' && typeof effectSize === 'number' && typeof n === 'number';
        const observedEffectSize = isDataAvailable ? Math.abs(effectSize) : 0;
        
        let postHocPowerResult = window.APP_CONFIG.NA_PLACEHOLDER;
        if (isDataAvailable && n > 0) {
            const z_alpha = inverseNormalCDF(1 - alpha / 2);
            const z_beta_calc = (Math.abs(effectSize) * Math.sqrt(n) / Math.sqrt(varDiff)) - z_alpha;
            const calculatedPower = normalCDF(z_beta_calc);
            postHocPowerResult = isNaN(calculatedPower) ? 'N/A' : formatPercent(calculatedPower, 1);
        }

        let requiredSampleSizeResult = window.APP_CONFIG.NA_PLACEHOLDER;
        const effectSizeForCalc = effectSizeType === 'observed' ? observedEffectSize : customEffectSize;
        if (isDataAvailable && effectSizeForCalc > 0) {
             const z_alpha = inverseNormalCDF(1 - alpha / 2);
             const z_beta = inverseNormalCDF(power);
             const requiredN = Math.pow(z_alpha + z_beta, 2) * varDiff / Math.pow(effectSizeForCalc, 2);
             requiredSampleSizeResult = isNaN(requiredN) ? 'N/A' : formatNumber(Math.ceil(requiredN), 0);
        }

        return `
            <div class="p-3">
                <div class="row g-3">
                    <div class="col-md-6 border-end">
                        <h6 class="text-muted small text-uppercase">Settings</h6>
                        <div class="mb-2">
                            <label for="insights-power" class="form-label small mb-0">Desired Power (1-β)</label>
                            <div class="d-flex align-items-center"><input type="range" class="form-range" id="insights-power" min="0.5" max="0.99" step="0.01" value="${power}"><span class="ms-2 fw-bold" id="insights-power-value">${formatPercent(power, 0)}</span></div>
                        </div>
                        <div class="mb-3">
                            <label for="insights-alpha" class="form-label small mb-0">Significance Level (α)</label>
                            <div class="d-flex align-items-center"><input type="range" class="form-range" id="insights-alpha" min="0.001" max="0.2" step="0.001" value="${alpha}"><span class="ms-2 fw-bold" id="insights-alpha-value">${formatNumber(alpha, 3)}</span></div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label small mb-1">Effect Size for Sample Size Calculation</label>
                            <div class="form-check"><input class="form-check-input" type="radio" name="effectSizeType" id="effect-observed" value="observed" ${effectSizeType === 'observed' ? 'checked' : ''}><label class="form-check-label small" for="effect-observed">Use observed AUC difference: <strong>${formatNumber(observedEffectSize, 3)}</strong></label></div>
                            <div class="form-check"><input class="form-check-input" type="radio" name="effectSizeType" id="effect-custom" value="custom" ${effectSizeType === 'custom' ? 'checked' : ''}><label class="form-check-label small" for="effect-custom">Define a custom minimum effect size (ΔAUC):</label></div>
                            <input type="number" class="form-control form-control-sm mt-1" id="insights-custom-effect" min="0.01" max="0.5" step="0.01" value="${customEffectSize}" ${effectSizeType !== 'custom' ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-muted small text-uppercase">Results</h6>
                        <div class="mb-3">
                            <p class="small mb-1"><strong>Post-hoc Power Analysis:</strong></p>
                            <p class="fs-4 fw-bold text-primary mb-0" id="power-result-posthoc">${postHocPowerResult}</p>
                            <p class="small text-muted mb-0">Achieved power to detect the observed AUC difference of ${formatNumber(observedEffectSize, 3)} with N=${n || '?'}.</p>
                        </div>
                        <div class="mb-2">
                            <p class="small mb-1"><strong>Prospective Sample Size Estimation:</strong></p>
                            <p class="fs-4 fw-bold text-primary mb-0" id="power-result-prospective">${requiredSampleSizeResult}</p>
                            <p class="small text-muted mb-0">Required patients to detect an AUC difference of ${formatNumber(effectSizeForCalc, 3)} with ${formatPercent(power, 0)} power.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 mt-3 pt-3 border-top">
                    <p class="small text-muted fst-italic mb-0"><i class="fas fa-info-circle me-1"></i><strong>Interpretation:</strong> A low post-hoc power for a non-significant result (*P* > .05) does not prove the absence of a difference, but suggests the study may have been too small to detect it. The primary utility of this analysis is for planning future, adequately powered validation studies.</p>
                </div>
            </div>`;
    }

    function createMismatchAnalysisCardHTML(mismatchData) {
        if (!mismatchData) return '<p class="text-muted small p-3">Mismatch data not available.</p>';
        
        const { concordantPositive, concordantNegative, discordant_AS_win, discordant_T2_win } = mismatchData;
        const total = concordantPositive.total + concordantNegative.total + discordant_AS_win.total + discordant_T2_win.total;
        if (total === 0) return '<p class="text-muted small p-3">No patients to analyze for mismatch.</p>';

        const createCell = (groupData, title, asStatus, t2Status) => {
            const nPlus = groupData.N_plus;
            const totalInGroup = groupData.total;
            const nPlusPercent = totalInGroup > 0 ? (nPlus / totalInGroup) * 100 : 0;
            const barWidth = isNaN(nPlusPercent) ? 0 : nPlusPercent;
            const tooltipContent = `<strong>${title}</strong><br>Total Patients: ${totalInGroup}<br>N-Positive: ${nPlus} (${formatPercent(nPlusPercent / 100, 1)})`;
            return `
                <div class="mismatch-cell" data-tippy-content="${tooltipContent}">
                    <div class="mismatch-header">
                        <span class="badge bg-as-${asStatus === '+' ? 'pos' : 'neg'} me-1">AS ${asStatus}</span>
                        <span class="badge bg-t2-${t2Status === '+' ? 'pos' : 'neg'}">T2 ${t2Status}</span>
                    </div>
                    <div class="mismatch-body">
                        <p class="mismatch-total">${totalInGroup}</p>
                        <p class="mismatch-nplus-label">N+ Rate</p>
                    </div>
                    <div class="mismatch-bar-container">
                        <div class="mismatch-bar" style="width: ${barWidth}%;"></div>
                    </div>
                    <div class="mismatch-nplus-value">${nPlus} / ${totalInGroup}</div>
                </div>`;
        };
        
        const asWinCount = discordant_AS_win.N_plus;
        const t2MissCount = discordant_AS_win.total - discordant_AS_win.N_plus;
        const asMissCount = discordant_T2_win.total - discordant_T2_win.N_plus;
        const t2WinCount = discordant_T2_win.N_plus;

        return `
            <div class="p-3">
                <div class="mismatch-grid">
                    ${createCell(concordantPositive, 'Concordant Positive', '+', '+')}
                    ${createCell(discordant_AS_win, 'Discordant (AS Correct)', '+', '-')}
                    ${createCell(discordant_T2_win, 'Discordant (T2 Correct)', '-', '+')}
                    ${createCell(concordantNegative, 'Concordant Negative', '-', '-')}
                </div>
                <div class="mt-3 pt-3 border-top">
                     <p class="small text-muted fst-italic mb-0"><i class="fas fa-info-circle me-1"></i><strong>Interpretation:</strong> This grid shows how AS and T2 perform in cases where they disagree. The "AS Correct" cell shows ${asWinCount} N+ cases correctly identified by AS but missed by T2. Conversely, the "T2 Correct" cell shows ${t2WinCount} N+ cases correctly identified by T2 but missed by AS.</p>
                </div>
            </div>`;
    }

    function createFeatureImportanceCardHTML(featureData) {
        if (!featureData || featureData.length === 0) {
            return '<p class="text-muted small p-3">Feature importance data not available.</p>';
        }
        const na = window.APP_CONFIG.NA_PLACEHOLDER;
        
        let tableHTML = `<div class="table-responsive"><table class="table table-sm small table-striped mb-0">
            <thead><tr>
                <th>T2 Feature</th>
                <th data-tippy-content="Odds Ratio (95% CI)">OR (95% CI)</th>
                <th data-tippy-content="P-value from Fisher's Exact Test">p-Value</th>
            </tr></thead><tbody>`;

        featureData.forEach(feature => {
            const or = feature.or;
            const orText = (or && isFinite(or.value)) ? `${formatNumber(or.value, 2)} (${formatNumber(or.ci?.lower, 2)}-${formatNumber(or.ci?.upper, 2)})` : na;
            const pValueText = isFinite(feature.pValue) ? getPValueText(feature.pValue, false) : na;
            tableHTML += `<tr><td>${escapeHTML(feature.featureName)}</td><td>${orText}</td><td>${pValueText}</td></tr>`;
        });
        tableHTML += '</tbody></table></div>';
        
        return `
            <div class="p-3">
                <div class="row g-3">
                    <div class="col-md-6" id="feature-importance-chart-container">
                        <!-- Chart will be rendered here -->
                        <p class="text-muted small p-2 text-center">Loading chart...</p>
                    </div>
                    <div class="col-md-6">
                        ${tableHTML}
                    </div>
                </div>
                <div class="col-12 mt-3 pt-3 border-top">
                    <p class="small text-muted fst-italic mb-0"><i class="fas fa-info-circle me-1"></i><strong>Interpretation:</strong> This analysis shows the univariable association of each T2 feature with the final N-status. A higher Odds Ratio (OR) indicates a stronger association. Features are sorted by their OR.</p>
                </div>
            </div>`;
    }

    return Object.freeze({
        createDashboardCard,
        createT2CriteriaControls,
        createStatisticsCard,
        createPublicationNav,
        createBruteForceModalContent,
        createBruteForceOverviewTableHTML,
        createBruteForceRunnerCardHTML,
        createAnalysisContextBannerHTML,
        createAddedValueCardHTML,
        createExportTabContentHTML,
        createPowerAnalysisCardHTML,
        createMismatchAnalysisCardHTML,
        createFeatureImportanceCardHTML
    });
})();