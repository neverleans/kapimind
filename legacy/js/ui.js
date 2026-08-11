function renderProjections(crossoverMonth, paybackMonth, finalDivs, finalInv, independenceMonth) {
    const container = document.getElementById('projectionsContainer');
    const formatTime = (totalMonths) => {
        if (!totalMonths) return "Fora do horizonte (50 anos)";
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return `${years} anos e ${months} meses`;
    };

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- NEW: Financial Independence Card -->
            <div class="glass-panel p-6 rounded-2xl border border-brand-yellow/30 relative overflow-hidden">
                 <div class="absolute right-[-10px] top-[-10px] opacity-10"><i class="fas fa-trophy text-8xl"></i></div>
                <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-hand-holding-usd text-brand-yellow"></i> Independência Financeira
                </h3>
                <p class="text-2xl font-bold mt-2 text-white">${formatTime(independenceMonth)}</p>
                <p class="text-xs text-gray-400 mt-1">
                    Quando dividendos cobrem <span class="text-brand-yellow font-bold">${formatBRL(CONFIG.monthlyExpenses)}</span>/mês
                </p>
            </div>
            
            <div class="glass-panel p-6 rounded-2xl border border-brand-green/30 relative overflow-hidden">
                 <div class="absolute right-[-10px] top-[-10px] opacity-10"><i class="fas fa-hourglass-half text-8xl"></i></div>
                <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <i class="fas fa-undo text-brand-green"></i> Payback Integral
                </h3>
                <p class="text-2xl font-bold mt-2 text-white">${formatTime(paybackMonth)}</p>
                <p class="text-xs text-gray-400 mt-1">
                    Quando dividendos acumulados = total aportado
                </p>
            </div>

            <div class="glass-panel p-6 rounded-2xl border border-brand-purple/30 relative overflow-hidden">
                <div class="absolute right-[-10px] top-[-10px] opacity-10"><i class="fas fa-infinity text-8xl"></i></div>
                <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                     <i class="fas fa-fire text-brand-purple"></i> Efeito Bola de Neve
                </h3>
                <p class="text-2xl font-bold mt-2 text-white">${formatTime(crossoverMonth)}</p>
                <p class="text-xs text-gray-400 mt-1">Quando renda mensal > aporte mensal</p>
            </div>
        </div>
    `;
}

function renderTabs(simulationData, switchTabCallback) {
    const tabsContainer = document.getElementById('yearTabsHeader');
    tabsContainer.innerHTML = '';

    // Add Year Tabs 1-15 with REAL YEARS (2026-2040)
    Object.keys(simulationData).forEach((year, index) => {
        const btn = document.createElement('button');
        const isActive = index === 0;

        // Calculate real calendar year
        const realYear = CONFIG.startYear + parseInt(year) - 1;

        let label = `${realYear}`;
        if (year <= 5) label += ' 🌶️';
        else label += ' 🛡️';

        let baseClass = `px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 `;
        let activeClass = isActive ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-700';

        btn.className = baseClass + activeClass;
        btn.innerText = label;
        btn.onclick = () => switchTabCallback(year, btn);
        tabsContainer.appendChild(btn);
    });

    // Add Special "SUMMARY" Tab
    const btnSummary = document.createElement('button');
    btnSummary.className = `px-6 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none tab-btn whitespace-nowrap mb-2 border border-brand-yellow/50 text-brand-yellow hover:bg-brand-yellow/10`;
    btnSummary.innerText = '🏆 2041+ (RESUMO)';
    btnSummary.onclick = () => switchTabCallback('summary', btnSummary);
    tabsContainer.appendChild(btnSummary);
}

function renderMonthsGrid(yearKey, simulationData) {
    const grid = document.getElementById('monthsGrid');
    grid.innerHTML = '';

    // Handle Special Summary Tab
    if (yearKey === 'summary') {
        const lastYear = Object.keys(simulationData).pop();
        renderVictorySummary(grid, simulationData[lastYear]);
        return;
    }

    // Normal Rendering
    const months = simulationData[yearKey];
    if (!months) return;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

    months.forEach(m => {
        const card = document.createElement('div');
        const isFreedom = m.contribution === 0;

        const cardClass = isFreedom
            ? "bg-gradient-to-br from-gray-800 to-green-900/20 p-4 rounded-xl border border-brand-green/30 hover:border-brand-green transition-colors flex flex-col gap-3 relative group"
            : "bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors flex flex-col gap-3 relative group";

        card.className = cardClass;

        // Check if market data is available for this month
        const realYear = CONFIG.startYear + parseInt(yearKey) - 1;
        const monthInYear = m.monthLabel.match(/\d+/)[0]; // Extract month number
        const hasMarketData = isMonthDataAvailable(realYear, parseInt(monthInYear));

        // Add market data badge if available
        let marketDataBadge = '';
        if (hasMarketData) {
            marketDataBadge = `
                <button onclick="openMarketDataModal(${realYear}, ${monthInYear}, ${JSON.stringify(m).replace(/"/g, '&quot;')})" 
                        class="text-[10px] bg-brand-blue/20 hover:bg-brand-blue/40 text-brand-blue border border-brand-blue/50 px-2 py-1 rounded uppercase tracking-wider transition-colors flex items-center gap-1">
                    <i class="fas fa-chart-line"></i> Dados Reais
                </button>
            `;
        }

        let strategyBadge = '';
        const currentYearNum = parseInt(yearKey);
        if (currentYearNum <= 5) {
            strategyBadge = '<span class="text-[10px] text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">🌶️ Turbo</span>';
        } else if (currentYearNum <= 15) {
            strategyBadge = '<span class="text-[10px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">🛡️ Blindagem</span>';
        } else {
            strategyBadge = '<span class="text-[10px] text-brand-green border border-brand-green/30 px-1.5 py-0.5 rounded uppercase tracking-wider">🏆 Voo Solo</span>';
        }

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
                <div class="flex gap-2 flex-wrap justify-end">
                    ${strategyBadge}
                    ${marketDataBadge}
                </div>
            </div>

            <div class="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 space-y-1">
                 <div class="flex justify-between items-center text-xs">
                     <span class="text-gray-400">Aporte:</span>
                     <span class="${m.contribution === 0 ? 'text-brand-green font-bold' : 'text-gray-200 font-mono'}">${formatBRL(m.contribution)}</span>
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

function renderVictorySummary(grid, lastYearMonths) {
    const lastMonth = lastYearMonths[lastYearMonths.length - 1];
    const yearlyIncome = lastYearMonths.reduce((acc, m) => acc + m.dividends, 0);
    const avgMonthlyIncome = yearlyIncome / 12;

    grid.className = 'w-full';
    grid.innerHTML = `
        <div class="bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green"></div>
            
            <i class="fas fa-crown text-6xl text-brand-yellow mb-6"></i>
            
            <h2 class="text-3xl md:text-5xl font-bold text-white mb-2">Liberdade Conquistada!</h2>
            <p class="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Resultados consolidados após 15 anos de disciplina. 
                Sua máquina de renda passiva está 100% operacional.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div class="bg-gray-800/80 p-6 rounded-2xl border border-gray-700/50">
                    <p class="text-gray-400 text-sm uppercase tracking-wider mb-2">Patrimônio Final</p>
                    <p class="text-3xl md:text-4xl font-bold text-white">${formatBRL(lastMonth.balanceTotal)}</p>
                </div>
                <div class="bg-gray-800/80 p-6 rounded-2xl border border-brand-green/50 shadow-lg shadow-brand-green/10 transform md:scale-105">
                    <p class="text-gray-400 text-sm uppercase tracking-wider mb-2">Renda Mensal (Média 15º Ano)</p>
                    <p class="text-3xl md:text-4xl font-bold text-brand-green">${formatBRL(avgMonthlyIncome)}</p>
                    <p class="text-xs text-gray-500 mt-1">Isento de Imposto de Renda</p>
                </div>
                <div class="bg-gray-800/80 p-6 rounded-2xl border border-gray-700/50">
                    <p class="text-gray-400 text-sm uppercase tracking-wider mb-2">Renda Anual (15º Ano)</p>
                    <p class="text-3xl md:text-4xl font-bold text-brand-purple">${formatBRL(yearlyIncome)}</p>
                </div>
            </div>

            <div class="inline-block bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <p class="text-sm text-gray-300">
                    <i class="fas fa-check-circle text-brand-green mr-2"></i>
                    A partir de agora (Ano 16+), você pode optar por parar de aportar e viver apenas da renda acima.
                </p>
            </div>
        </div>
    `;
}
