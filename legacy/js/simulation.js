function calculateProjections(startQty, startInv, startDivs, startContrib, startMonth, currentDividends, independenceMonth) {
    let qty = { ...startQty };
    let totalInvested = startInv;
    let totalDividends = startDivs;
    let currentContrib = startContrib;

    // Clone current dividend values to track growth
    let dividends = { ...currentDividends };

    let month = startMonth;
    let crossoverDate = null;
    let paybackDate = null;

    // If independence not yet reached, keep searching
    let projectedIndependenceMonth = independenceMonth;

    while (month < 600) {
        // Apply dividend growth annually
        if (month % 12 === 1 && month > startMonth) {
            Object.keys(dividends).forEach(k => {
                dividends[k] *= (1 + CONFIG.dividendGrowthRate);
            });
        }

        if (month % 12 === 1) {
            currentContrib = currentContrib * (1 + CONFIG.inflationRate);
        }

        // STRATEGY SHIFT LOGIC (Phase 2 CONTINUES)
        let allocation = {};
        if (month <= 60) {
            allocation = { MXRF11: 0.33, VGHF11: 0.33, VGIA11: 0.34, HGLG11: 0.0, VISC11: 0.0 };
        } else {
            allocation = { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };
        }

        totalInvested += currentContrib;

        let monthlyDiv = 0;
        Object.keys(qty).forEach(k => monthlyDiv += qty[k] * dividends[k]);

        totalDividends += monthlyDiv;

        // Check independence if not yet reached
        if (!projectedIndependenceMonth && monthlyDiv >= CONFIG.monthlyExpenses) {
            projectedIndependenceMonth = month;
        }

        if (!crossoverDate && monthlyDiv > currentContrib) crossoverDate = month;
        if (!paybackDate && totalDividends > totalInvested) paybackDate = month;
        if (crossoverDate && paybackDate && projectedIndependenceMonth) break;

        let totalToInvest = currentContrib + monthlyDiv;
        Object.keys(allocation).forEach(k => {
            qty[k] += (totalToInvest * allocation[k]) / CONFIG.assets[k].price;
        });

        month++;
    }

    renderProjections(crossoverDate, paybackDate, totalDividends, totalInvested, projectedIndependenceMonth);
}
