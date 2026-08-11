let simulationData = [];

// Inject Tailwind Config
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                dark: {
                    900: '#0f172a',
                    800: '#1e293b',
                    700: '#334155',
                },
                brand: {
                    green: '#10b981',
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    yellow: '#f59e0b',
                    red: '#ef4444'
                }
            }
        }
    }
}

async function runSimulation() {
    // Reset Data
    const labels = [];
    const dataTotalInvested = [];
    const dataTotalValue = [];
    const dataTotalDividends = [];

    // Portfolio State
    let portfolioQty = {
        MXRF11: 0,
        VGHF11: 0,
        VGIA11: 0,
        HGLG11: 0,
        VISC11: 0
    };

    // Track dividend values adjusted by growth over time
    let currentDividends = {
        MXRF11: CONFIG.assets.MXRF11.dividend,
        VGHF11: CONFIG.assets.VGHF11.dividend,
        VGIA11: CONFIG.assets.VGIA11.dividend,
        HGLG11: CONFIG.assets.HGLG11.dividend,
        VISC11: CONFIG.assets.VISC11.dividend
    };

    let cashBalance = 0;
    let cumulativeInvestedFromPocket = 0;
    let cumulativeDividendsReceived = 0;
    let currentMonthlyDividend = 0;
    let lastMonthlyContribution = 0;
    let independenceMonth = null; // NEW: Track when dividends >= expenses

    simulationData = [];

    for (let i = 1; i <= CONFIG.months; i++) {
        const currentYear = Math.ceil(i / 12);
        const monthInYear = ((i - 1) % 12) + 1;

        // Apply dividend growth annually (at the start of each year)
        if (monthInYear === 1 && i > 1) {
            Object.keys(currentDividends).forEach(key => {
                currentDividends[key] *= (1 + CONFIG.dividendGrowthRate);
            });
        }

        let allocation = {};
        let monthlyContribution = 0;

        if (i <= 60) {
            // Phase 1: High Yield (Y1-5)
            allocation = { MXRF11: 0.33, VGHF11: 0.33, VGIA11: 0.34, HGLG11: 0.0, VISC11: 0.0 };

            const yearIndex = Math.floor((i - 1) / 12);
            monthlyContribution = CONFIG.initialInvestment * Math.pow(1 + CONFIG.inflationRate, yearIndex);

        } else if (i <= 180) {
            // Phase 2 + 3: Blindagem (Y6-15)
            allocation = { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };

            const yearIndex = Math.floor((i - 1) / 12);
            monthlyContribution = CONFIG.initialInvestment * Math.pow(1 + CONFIG.inflationRate, yearIndex);

        } else {
            // Phase 4: Year 16+ (Zero Contribution)
            allocation = { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };
            monthlyContribution = 0;
        }

        lastMonthlyContribution = monthlyContribution;
        cumulativeInvestedFromPocket += monthlyContribution;
        cashBalance += monthlyContribution;

        // Dividends (using CURRENT adjusted dividend values)
        let dividendsThisMonth = 0;
        Object.keys(portfolioQty).forEach(assetKey => {
            const qty = portfolioQty[assetKey];
            const divPerShare = currentDividends[assetKey];
            dividendsThisMonth += qty * divPerShare;
        });
        currentMonthlyDividend = dividendsThisMonth;
        cumulativeDividendsReceived += dividendsThisMonth;
        cashBalance += dividendsThisMonth;

        // Check for Financial Independence
        if (!independenceMonth && dividendsThisMonth >= CONFIG.monthlyExpenses) {
            independenceMonth = i;
        }

        // Buying
        const totalAvailableToInvest = cashBalance;
        let buyAmounts = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };
        let buyQtys = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };

        Object.keys(allocation).forEach(key => {
            const targetAmount = totalAvailableToInvest * allocation[key];
            const price = CONFIG.assets[key].price;
            const qtyToBuy = targetAmount / price;

            portfolioQty[key] += qtyToBuy;
            buyAmounts[key] = targetAmount;
            buyQtys[key] = qtyToBuy;
        });
        cashBalance = 0;

        // Patrimony
        let totalBalance = 0;
        Object.keys(portfolioQty).forEach(key => {
            totalBalance += portfolioQty[key] * CONFIG.assets[key].price;
        });

        if (!simulationData[currentYear]) simulationData[currentYear] = [];
        simulationData[currentYear].push({
            monthTotal: i,
            monthLabel: `Mês ${monthInYear}`,
            contribution: monthlyContribution,
            dividends: dividendsThisMonth,
            totalToInvest: totalAvailableToInvest,
            allocation: allocation,
            buyAmounts: buyAmounts,
            buyQtys: buyQtys,
            portfolioQty: { ...portfolioQty },
            balanceTotal: totalBalance
        });

        labels.push(`Mês ${i}`);
        dataTotalValue.push(totalBalance);
        dataTotalInvested.push(cumulativeInvestedFromPocket);
        dataTotalDividends.push(cumulativeDividendsReceived);
    }

    document.getElementById('displayTotalInvested').innerText = formatBRL(dataTotalValue[dataTotalValue.length - 1]);
    document.getElementById('displayMonthlyDividends').innerText = formatBRL(currentMonthlyDividend);

    const portfolioValueMap = {};
    Object.keys(portfolioQty).forEach(key => {
        portfolioValueMap[key] = portfolioQty[key] * CONFIG.assets[key].price;
    });

    renderCharts(labels, dataTotalInvested, dataTotalValue, portfolioValueMap, dataTotalDividends);
    renderTabs(simulationData, switchTab);
    renderMonthsGrid(1, simulationData);

    // Pass independence month to projections
    calculateProjections(portfolioQty, cumulativeInvestedFromPocket, cumulativeDividendsReceived, lastMonthlyContribution, CONFIG.months + 1, currentDividends, independenceMonth);

    // Save simulation data for IR Helper page
    saveSimulationDataForIR(simulationData, cumulativeInvestedFromPocket, cumulativeDividendsReceived);
}

function saveSimulationDataForIR(yearlyData, totalInvested, totalDividends) {
    // Flatten simulation data for IR helper
    const months = [];
    const years = [];

    Object.keys(yearlyData).forEach(yearKey => {
        const yearIndex = parseInt(yearKey) - 1;
        const realYear = CONFIG.startYear + yearIndex;

        let yearTotalInvested = 0;
        let yearTotalDividends = 0;
        let finalCotas = {};

        yearlyData[yearKey].forEach(monthData => {
            yearTotalInvested += monthData.contribution;
            yearTotalDividends += monthData.dividends;
            finalCotas = monthData.portfolioQty;

            months.push({
                year: realYear,
                month: parseInt(monthData.monthLabel.match(/\d+/)[0]),
                contribution: monthData.contribution,
                totalInvested: yearTotalInvested,
                cotas: { ...monthData.portfolioQty },
                dividends: monthData.dividends
            });
        });

        years.push({
            year: realYear,
            totalInvested: yearTotalInvested,
            totalDividends: yearTotalDividends,
            cotas: finalCotas
        });
    });

    const irData = {
        months: months,
        years: years,
        generatedAt: new Date().toISOString()
    };

    try {
        localStorage.setItem('simulationData', JSON.stringify(irData));
        console.log('✅ Dados salvos para auxiliar de IR');
    } catch (e) {
        console.error('❌ Erro ao salvar dados:', e);
    }
}

function switchTab(year, clickedBtn) {
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.className = 'px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 text-gray-400 hover:text-white hover:bg-gray-700'
    );
    clickedBtn.className = 'px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 bg-brand-blue text-white shadow-lg shadow-blue-500/30';
    renderMonthsGrid(year, simulationData);
}

// Initialize
window.addEventListener('load', runSimulation);
// Expose for "Recalcular" button in HTML
window.runSimulation = runSimulation;
