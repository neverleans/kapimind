// --- Constants & Config ---
const CONFIG = {
    initialInvestment: 600,
    months: 120, // Extended to 10 Years
    inflationRate: 0.10, // 10% annual increase in contribution
    // Real Data (Jan/Feb 2026)
    assets: {
        MXRF11: { name: 'MXRF11', type: 'paper', price: 9.62, dividend: 0.10, color: '#10b981' },
        VGHF11: { name: 'VGHF11', type: 'paper', price: 7.17, dividend: 0.07, color: '#8b5cf6' },
        VGIA11: { name: 'VGIA11', type: 'fiagro', price: 9.96, dividend: 0.14, color: '#ef4444' },
        HGLG11: { name: 'HGLG11', type: 'brick', price: 157.50, dividend: 1.10, color: '#f59e0b' },
        VISC11: { name: 'VISC11', type: 'brick', price: 109.30, dividend: 0.84, color: '#3b82f6' }
    }
};

// --- State ---
let chartInstance = null;
let donutInstance = null;
let simulationData = [];

// --- Config Tailwind (Injected for simplicity) ---
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

// --- Helpers ---
const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- Core Simulation Logic ---
async function runSimulation() {
    // Reset Charts Data
    const labels = [];
    const dataTotalInvested = [];
    const dataTotalValue = [];

    // Portfolio State (Quantity of Shares)
    let portfolioQty = {
        MXRF11: 0,
        VGHF11: 0,
        VGIA11: 0,
        HGLG11: 0,
        VISC11: 0
    };
    let cashBalance = 0;

    let cumulativeInvestedFromPocket = 0;
    let cumulativeDividendsReceived = 0;
    let currentMonthlyDividend = 0;
    let lastMonthlyContribution = 0;

    simulationData = [];

    for (let i = 1; i <= CONFIG.months; i++) {
        const currentYear = Math.ceil(i / 12);
        const monthInYear = ((i - 1) % 12) + 1;

        let allocation = {};
        if (i <= 60) {
            allocation = { MXRF11: 0.33, VGHF11: 0.33, VGIA11: 0.34, HGLG11: 0.0, VISC11: 0.0 };
        } else {
            allocation = { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };
        }

        const yearIndex = Math.floor((i - 1) / 12);
        const monthlyContribution = CONFIG.initialInvestment * Math.pow(1 + CONFIG.inflationRate, yearIndex);
        lastMonthlyContribution = monthlyContribution;
        cumulativeInvestedFromPocket += monthlyContribution;
        cashBalance += monthlyContribution;

        // Dividends
        let dividendsThisMonth = 0;
        Object.keys(portfolioQty).forEach(assetKey => {
            const qty = portfolioQty[assetKey];
            const divPerShare = CONFIG.assets[assetKey].dividend;
            dividendsThisMonth += qty * divPerShare;
        });
        currentMonthlyDividend = dividendsThisMonth;
        cumulativeDividendsReceived += dividendsThisMonth;
        cashBalance += dividendsThisMonth;

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
    }

    document.getElementById('displayTotalInvested').innerText = formatBRL(dataTotalValue[dataTotalValue.length - 1]);
    document.getElementById('displayMonthlyDividends').innerText = formatBRL(currentMonthlyDividend);

    const portfolioValueMap = {};
    Object.keys(portfolioQty).forEach(key => {
        portfolioValueMap[key] = portfolioQty[key] * CONFIG.assets[key].price;
    });

    renderCharts(labels, dataTotalInvested, dataTotalValue, portfolioValueMap);
    renderTabs();

    calculateProjections(portfolioQty, cumulativeInvestedFromPocket, cumulativeDividendsReceived, lastMonthlyContribution, CONFIG.months + 1);
}

function calculateProjections(startQty, startInv, startDivs, startContrib, startMonth) {
    let qty = { ...startQty };
    let totalInvested = startInv;
    let totalDividends = startDivs;
    let currentContrib = startContrib;

    let month = startMonth;
    let crossoverDate = null;
    let paybackDate = null;

    while (month < 600) {
        if (month % 12 === 1) {
            currentContrib = currentContrib * (1 + CONFIG.inflationRate);
        }

        let allocation = {};
        if (month <= 60) {
            allocation = { MXRF11: 0.33, VGHF11: 0.33, VGIA11: 0.34, HGLG11: 0.0, VISC11: 0.0 };
        } else {
            allocation = { MXRF11: 0.05, VGHF11: 0.05, VGIA11: 0.05, HGLG11: 0.425, VISC11: 0.425 };
        }

        totalInvested += currentContrib;

        let monthlyDiv = 0;
        Object.keys(qty).forEach(k => monthlyDiv += qty[k] * CONFIG.assets[k].dividend);

        totalDividends += monthlyDiv;

        if (!crossoverDate && monthlyDiv > currentContrib) crossoverDate = month;
        if (!paybackDate && totalDividends > totalInvested) paybackDate = month;
        if (crossoverDate && paybackDate) break;

        let totalToInvest = currentContrib + monthlyDiv;
        Object.keys(allocation).forEach(k => {
            qty[k] += (totalToInvest * allocation[k]) / CONFIG.assets[k].price;
        });

        month++;
    }

    renderProjections(crossoverDate, paybackDate, totalDividends, totalInvested);
}

function renderProjections(crossoverMonth, paybackMonth, finalDivs, finalInv) {
    const container = document.getElementById('projectionsContainer');
    const formatTime = (totalMonths) => {
        if (!totalMonths) return "Fora do horizonte (50 anos)";
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return `${years} anos e ${months} meses`;
    };

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="glass-panel p-6 rounded-2xl border border-brand-green/30 relative overflow-hidden">
                 <div class="absolute right-[-10px] top-[-10px] opacity-10"><i class="fas fa-hourglass-half text-8xl"></i></div>
                <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-undo text-brand-green"></i> Payback Integral
                </h3>
                <p class="text-2xl font-bold mt-2 text-white">${formatTime(paybackMonth)}</p>
                <p class="text-xs text-gray-400 mt-1">
                    <span class="text-brand-green font-bold">REDUZIDO!</span> Graças à fase High Yield estendida (Fiagro).
                </p>
            </div>

            <div class="glass-panel p-6 rounded-2xl border border-brand-purple/30 relative overflow-hidden">
                <div class="absolute right-[-10px] top-[-10px] opacity-10"><i class="fas fa-infinity text-8xl"></i></div>
                <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                     <i class="fas fa-fire text-brand-purple"></i> Efeito Bola de Neve
                </h3>
                <p class="text-2xl font-bold mt-2 text-white">${formatTime(crossoverMonth)}</p>
                <p class="text-xs text-gray-400 mt-1">Liberdade Financeira (Renda > Aporte).</p>
            </div>
        </div>
    `;
}

function renderTabs() {
    const tabsContainer = document.getElementById('yearTabsHeader');
    tabsContainer.innerHTML = '';

    Object.keys(simulationData).forEach((year, index) => {
        const btn = document.createElement('button');
        const isActive = index === 0;

        let label = `Ano ${year}`;
        if (year <= 5) label += ' 🌶️';
        else label += ' 🛡️';

        btn.className = `px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 ` +
            (isActive ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-700');
        btn.innerText = label;
        btn.onclick = () => switchTab(year, btn);
        tabsContainer.appendChild(btn);
    });

    if (simulationData[1]) renderMonthsGrid(1);
}

function switchTab(year, clickedBtn) {
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.className = 'px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 text-gray-400 hover:text-white hover:bg-gray-700'
    );
    clickedBtn.className = 'px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 bg-brand-blue text-white shadow-lg shadow-blue-500/30';
    renderMonthsGrid(year);
}

function renderMonthsGrid(year) {
    const grid = document.getElementById('monthsGrid');
    grid.innerHTML = '';

    const months = simulationData[year];
    if (!months) return;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

    months.forEach(m => {
        const card = document.createElement('div');
        card.className = "bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors flex flex-col gap-3 relative group";

        let strategyBadge = year <= 5 ?
            '<span class="text-[10px] text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">🌶️ Turbo (Fiagro)</span>' :
            '<span class="text-[10px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">🛡️ Blindagem</span>';

        let buyingHtml = '';
        Object.keys(m.buyAmounts).forEach(asset => {
            if (m.buyAmounts[asset] > 1) {
                const assetInfo = CONFIG.assets[asset];
                buyingHtml += `
                    <div class="flex items-center justify-between p-1.5 rounded hover:bg-gray-700/30 transition-colors">
                        <div class="flex items-center gap-2">
                            <div class="w-1 h-6 rounded-full" style="background-color: ${assetInfo.color}"></div>
                            <div class="flex flex-col">
                                <span class="text-xs font-bold text-gray-200">${assetInfo.name}</span>
                                <span class="text-[9px] text-gray-500">~${m.buyQtys[asset].toFixed(1)}</span>
                            </div>
                        </div>
                        <span class="font-mono text-xs" style="color:${assetInfo.color}">${formatBRL(m.buyAmounts[asset])}</span>
                    </div>
                 `;
            }
        });

        card.innerHTML = `
           <div class="flex justify-between items-start border-b border-gray-700 pb-2">
                <div class="flex items-center gap-2">
                    <span class="bg-gray-700 text-xs font-bold px-2 py-1 rounded text-gray-300">#${m.monthTotal}</span>
                    <span class="font-bold text-white">${m.monthLabel}</span>
                </div>
                ${strategyBadge}
            </div>

            <div class="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 space-y-1">
                 <div class="flex justify-between items-center text-xs">
                     <span class="text-gray-400">Aporte:</span>
                     <span class="text-gray-200 font-mono">${formatBRL(m.contribution)}</span>
                 </div>
                 
                 <div class="bg-gray-800/80 p-1.5 rounded flex flex-col gap-1 border border-gray-700/50">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400">Dividendos:</span>
                        <span class="text-brand-green font-mono font-bold">+${formatBRL(m.dividends)}</span>
                    </div>
                     <div class="flex justify-end gap-2 text-[8px] text-gray-500">
                        ${m.portfolioQty.VGIA11 > 1 ? `<span class="text-red-400">VGIA:${(m.portfolioQty.VGIA11 * CONFIG.assets.VGIA11.dividend).toFixed(0)}</span>` : ''} 
                        ${m.portfolioQty.MXRF11 > 1 ? `<span>MXRF:${(m.portfolioQty.MXRF11 * CONFIG.assets.MXRF11.dividend).toFixed(0)}</span>` : ''}
                     </div>
                 </div>

                 <div class="border-t border-gray-700/50 my-1"></div>
                 <div class="flex justify-between items-center text-sm font-bold">
                     <span class="text-gray-300">Total Investir:</span>
                     <span class="text-white font-mono">${formatBRL(m.totalToInvest)}</span>
                 </div>
            </div>

            <div class="space-y-1 mt-1">
                <p class="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Ordem de Compra</p>
                ${buyingHtml}
            </div>

            <div class="mt-auto pt-3 border-t border-gray-700 flex justify-between items-end">
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">Patrimônio Acumulado</p>
                    <p class="text-lg font-bold text-brand-blue leading-none mt-1">${formatBRL(m.balanceTotal)}</p>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });

    grid.appendChild(gridContainer);
}

function renderCharts(labels, invested, value, portfolioValueMap) {
    const ctxGrowth = document.getElementById('growthChart').getContext('2d');
    const ctxDonut = document.getElementById('allocationChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();
    if (donutInstance) donutInstance.destroy();

    // Gradient
    const gradientValue = ctxGrowth.createLinearGradient(0, 0, 0, 400);
    gradientValue.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradientValue.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    chartInstance = new Chart(ctxGrowth, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor Patrimonial',
                    data: value,
                    borderColor: '#3b82f6',
                    backgroundColor: gradientValue,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Total Aportado',
                    data: invested,
                    borderColor: '#94a3b8',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxTicksLimit: 6 }
                }
            }
        }
    });

    // Donut Data
    const assetLabels = Object.keys(portfolioValueMap);
    const assetValues = Object.values(portfolioValueMap);
    const assetColors = assetLabels.map(key => CONFIG.assets[key].color);

    donutInstance = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: assetLabels,
            datasets: [{
                data: assetValues,
                backgroundColor: assetColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
            },
            cutout: '70%'
        }
    });
}

// Initialize on load
window.addEventListener('load', runSimulation);
