// Market Data Integration with Dynamic Script Loading (CORS-free)

window.MARKET_DATA = window.MARKET_DATA || {};

// Check if month data is already loaded
function getHistoricalMonthData(year, month) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return window.MARKET_DATA[monthKey] || null;
}

// Load month data file dynamically
function loadMonthData(year, month) {
    return new Promise((resolve) => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        // Check if already loaded
        if (window.MARKET_DATA[monthKey]) {
            console.log(`✅ Dados de ${monthKey} já carregados`);
            resolve(window.MARKET_DATA[monthKey]);
            return;
        }

        // Load script dynamically
        const script = document.createElement('script');
        script.src = `data/${monthKey}.js`;

        script.onload = () => {
            console.log(`📖 Arquivo data/${monthKey}.js carregado`);
            resolve(window.MARKET_DATA[monthKey] || null);
        };

        script.onerror = () => {
            console.warn(`⚠️ Arquivo data/${monthKey}.js não encontrado`);
            resolve(null);
        };

        document.head.appendChild(script);
    });
}

// Check if month is closed (not current month)
function isMonthClosed(year, month) {
    // Use explicit constructor: new Date(year, monthIndex, day)
    const currentDate = new Date(2026, 1, 1); // Feb 1, 2026 (month is 0-indexed)
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    console.log(`🔍 isMonthClosed(${year}, ${month}): currentYear=${currentYear}, currentMonth=${currentMonth}`);

    if (year < currentYear) {
        console.log(`✅ ${year} < ${currentYear} → TRUE`);
        return true;
    }
    if (year === currentYear && month < currentMonth) {
        console.log(`✅ ${year} === ${currentYear} && ${month} < ${currentMonth} → TRUE`);
        return true;
    }
    console.log(`❌ Nenhuma condição atendida → FALSE`);
    return false;
}

function isMonthDataAvailable(realYear, monthInYear) {
    const currentDate = new Date('2026-02-01');
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (realYear < currentYear) return true;
    if (realYear === currentYear && monthInYear <= currentMonth) return true;

    return false;
}

async function openMarketDataModal(realYear, monthInYear, monthData) {
    const modal = $('#marketDataModal');
    const modalTitle = $('#modalTitle');
    const modalContent = $('#modalContent');

    const monthClosed = isMonthClosed(realYear, monthInYear);

    modalTitle.html(`
        <i class="fas fa-chart-line text-brand-blue"></i> 
        Dados de Mercado - ${getMonthName(monthInYear)} ${realYear}
    `);

    // Show initial loading
    modalContent.html(`
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-brand-blue mb-4"></i>
                <p class="text-gray-400">Carregando histórico...</p>
            </div>
        </div>
    `);

    modal.removeClass('hidden');

    // Try to load from file first
    const historicalData = await loadMonthData(realYear, monthInYear);

    if (historicalData) {
        console.log(`📄 Dados de ${monthInYear}/${realYear} carregados do arquivo`);
        renderHistoricalData(historicalData, monthData, realYear, monthInYear);
        return;
    }

    // If not in file, fetch from API
    console.log(`🌐 Buscando ${monthInYear}/${realYear} da API...`);
    modalContent.html(`
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <i class="fas fa-cloud-download-alt text-4xl text-brand-blue mb-4 animate-pulse"></i>
                <p class="text-gray-400">Buscando dados da B3...</p>
                <p class="text-xs text-gray-500 mt-2">${getMonthName(monthInYear)}/${realYear}</p>
            </div>
        </div>
    `);

    const assets = Object.keys(CONFIG.assets);
    const promises = assets.map(ticker => fetchAssetData(ticker, realYear, monthInYear));

    console.log(`📡 Iniciando ${promises.length} requisições paralelas para a API...`);

    try {
        const results = await Promise.all(promises);
        console.log(`✅ Todas as ${results.length} requisições completadas!`);
        console.log('📊 Resultados:', results);
        console.log(`🎯 Chamando renderMarketDataWithSave com canSave=${monthClosed}`);

        renderMarketDataWithSave(results, monthData, realYear, monthInYear, monthClosed);
    } catch (error) {
        console.error('❌ Erro nas requisições API:', error);
        modalContent.html(`
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-300">Erro ao carregar dados de mercado</p>
                <p class="text-sm text-gray-500 mt-2">${error.message}</p>
            </div>
        `);
    }
}

function fetchAssetData(ticker, year, month) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d&dividends=true&token=${CONFIG.brapiApiKey}`,
            method: 'GET',
            timeout: 10000,
            success: function (response) {
                if (response.results && response.results[0]) {
                    const data = response.results[0];
                    const historicalData = data.historicalDataPrice || [];

                    const monthData = historicalData.filter(day => {
                        const dayDate = new Date(day.date * 1000);
                        return dayDate.getFullYear() === year &&
                            dayDate.getMonth() === month - 1;
                    });

                    if (monthData.length === 0) {
                        resolve({
                            ticker: ticker,
                            name: CONFIG.assets[ticker].name,
                            color: CONFIG.assets[ticker].color,
                            error: 'Sem dados para este período'
                        });
                        return;
                    }

                    const prices = monthData.map(d => d.close);
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                    const firstPrice = monthData[0].open;
                    const lastPrice = monthData[monthData.length - 1].close;
                    const change = lastPrice - firstPrice;
                    const changePercent = ((change / firstPrice) * 100);
                    // Get dividend data for the month
                    console.log(`📊 [${ticker}] Estrutura completa da API:`, data);
                    console.log(`📊 [${ticker}] dividendsData:`, data.dividendsData);

                    const dividendsData = data.dividendsData || {};
                    const cashDividends = dividendsData.cashDividends || [];

                    console.log(`💰 [${ticker}] cashDividends recebidos:`, cashDividends);
                    console.log(`💰 [${ticker}] Total de dividendos na API:`, cashDividends.length);

                    // Filter dividends for this specific month
                    const monthDividends = cashDividends.filter(div => {
                        const divDate = new Date(div.paymentDate);
                        console.log(`🔍 [${ticker}] Dividendo: ${div.rate} em ${div.paymentDate} (${divDate.toLocaleDateString()})`);
                        const matches = divDate.getFullYear() === year &&
                            divDate.getMonth() === month - 1;
                        console.log(`   Match? ${matches} (ano: ${divDate.getFullYear()} === ${year}, mês: ${divDate.getMonth() + 1} === ${month})`);
                        return matches;
                    });

                    console.log(`✅ [${ticker}] Dividendos filtrados para ${month}/${year}:`, monthDividends);

                    let totalDividends = monthDividends.reduce((sum, div) => sum + (div.rate || 0), 0);

                    // Fallback: se API não retornou dividendos, usar valor do CONFIG
                    if (totalDividends === 0 && CONFIG.assets[ticker]) {
                        totalDividends = CONFIG.assets[ticker].dividend;
                        console.log(`🔄 [${ticker}] API sem dados. Usando CONFIG: R$ ${totalDividends.toFixed(2)}`);
                    }

                    const dividendYield = lastPrice > 0 ? ((totalDividends / lastPrice) * 100) : 0;
                    const dividendCount = monthDividends.length > 0 ? monthDividends.length : (totalDividends > 0 ? 1 : 0);

                    console.log(`💵 [${ticker}] Total: R$ ${totalDividends.toFixed(2)}, Yield: ${dividendYield.toFixed(2)}%, Pagamentos: ${dividendCount}`);

                    resolve({
                        ticker: ticker,
                        name: CONFIG.assets[ticker].name,
                        color: CONFIG.assets[ticker].color,
                        avgPrice: avgPrice,
                        firstPrice: firstPrice,
                        lastPrice: lastPrice,
                        change: change,
                        changePercent: changePercent,
                        daysCount: monthData.length,
                        dividends: totalDividends,
                        dividendYield: dividendYield,
                        dividendCount: monthDividends.length
                    });
                } else {
                    resolve({
                        ticker: ticker,
                        name: CONFIG.assets[ticker].name,
                        color: CONFIG.assets[ticker].color,
                        error: 'Dados não disponíveis'
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error(`Erro ao buscar ${ticker}:`, status, error);
                resolve({
                    ticker: ticker,
                    name: CONFIG.assets[ticker].name,
                    color: CONFIG.assets[ticker].color,
                    error: 'Erro ao buscar dados'
                });
            }
        });
    });
}

function renderHistoricalData(historicalData, monthData, year, month) {
    const modalContent = $('#modalContent');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const assetsArray = Object.values(historicalData);

    let html = `
        <div class="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30 flex justify-between items-center">
            <p class="text-sm text-gray-300">
                <i class="fas fa-file-code text-green-400 mr-2"></i>
                Dados permanentes de <strong>${getMonthName(month)}/${year}</strong> (data/${monthKey}.js)
            </p>
            <span class="text-xs text-green-400">
                <i class="fas fa-check-circle"></i> Salvo no projeto
            </span>
        </div>
        <div class="space-y-4">
    `;

    assetsArray.forEach(asset => {
        const isPositive = asset.changePercent >= 0;
        const arrowIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

        html += `
            <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-16 rounded" style="background-color: ${asset.color}"></div>
                        <div>
                            <h3 class="text-xl font-bold text-white">${asset.ticker}</h3>
                            <p class="text-sm text-gray-400">${asset.name}</p>
                            <p class="text-xs text-gray-500 mt-1">
                                <i class="fas fa-chart-bar mr-1"></i>
                                ${asset.daysCount} pregões
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-500 uppercase mb-1">Fechamento</p>
                        <p class="text-2xl font-bold text-white">${formatBRL(asset.lastPrice)}</p>
                        <p class="${changeColor} text-sm font-semibold flex items-center gap-1 justify-end mt-1">
                            <i class="fas ${arrowIcon}"></i>
                            ${asset.changePercent.toFixed(2)}%
                        </p>
                    </div>
                </div>
                
                <div class="grid grid-cols-4 gap-4 pt-3 border-t border-gray-700">
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Média</p>
                        <p class="text-sm font-mono text-gray-300 mt-1">${formatBRL(asset.avgPrice)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Abertura</p>
                        <p class="text-sm font-mono text-gray-300 mt-1">${formatBRL(asset.firstPrice)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Variação</p>
                        <p class="text-sm font-mono ${changeColor} mt-1">${asset.change >= 0 ? '+' : ''}${formatBRL(asset.change)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase flex items-center gap-1">
                            <i class="fas fa-coins text-brand-yellow"></i> Dividendos
                        </p>
                        <p class="text-sm font-mono text-brand-yellow mt-1 font-bold">
                            ${asset.dividends ? formatBRL(asset.dividends) : 'R$ 0,00'}
                        </p>
                        ${asset.dividendYield ? `<p class="text-xs text-gray-500 mt-1">${asset.dividendYield.toFixed(2)}% yield</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    modalContent.html(html);
}

function renderMarketDataWithSave(assetsData, monthData, year, month, canSave) {
    const modalContent = $('#modalContent');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    // Store data globally for save function
    window.currentMarketData = { year, month, assets: assetsData };

    // Auto-save if month is closed
    if (canSave) {
        console.log(`💾 Mês fechado detectado! Salvando ${monthKey}.js automaticamente...`);
        setTimeout(() => {
            saveToProjectFile(year, month, true); // true = auto mode
        }, 500);
    }

    let html = `
        <div class="mb-4 p-3 ${canSave ? 'bg-green-900/20 border-green-500/30' : 'bg-brand-blue/10 border-brand-blue/30'} rounded-lg border flex justify-between items-center flex-wrap gap-2">
            <p class="text-sm text-gray-300">
                ${canSave ?
            `<i class="fas fa-download text-green-400 mr-2 animate-pulse"></i>
                     <strong>Arquivo sendo salvo...</strong> data/${monthKey}.js` :
            `<i class="fas fa-cloud text-brand-blue mr-2"></i>
                     Dados da API - <strong>${getMonthName(month)}/${year}</strong>`
        }
            </p>
            ${canSave ?
            `<span class="text-xs text-green-400">
                    <i class="fas fa-check-circle"></i> Mês fechado
                </span>` : ''
        }
        </div>
        <div class="space-y-4">
    `;

    assetsData.forEach(asset => {
        if (asset.error) {
            html += `
                <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-12 rounded" style="background-color: ${asset.color}"></div>
                            <div>
                                <h3 class="text-lg font-bold text-white">${asset.ticker}</h3>
                                <p class="text-sm text-gray-400">${asset.name}</p>
                            </div>
                        </div>
                        <p class="text-sm text-gray-500">${asset.error}</p>
                    </div>
                </div>
            `;
        } else {
            const isPositive = asset.changePercent >= 0;
            const arrowIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
            const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

            html += `
                <div class="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-16 rounded" style="background-color: ${asset.color}"></div>
                            <div>
                                <h3 class="text-xl font-bold text-white">${asset.ticker}</h3>
                                <p class="text-sm text-gray-400">${asset.name}</p>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-chart-bar mr-1"></i>
                                    ${asset.daysCount} pregões
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-500 uppercase mb-1">Fechamento</p>
                            <p class="text-2xl font-bold text-white">${formatBRL(asset.lastPrice)}</p>
                            <p class="${changeColor} text-sm font-semibold flex items-center gap-1 justify-end mt-1">
                                <i class="fas ${arrowIcon}"></i>
                                ${asset.changePercent.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-4 pt-3 border-t border-gray-700">
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Média</p>
                            <p class="text-sm font-mono text-gray-300 mt-1">${formatBRL(asset.avgPrice)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Abertura</p>
                            <p class="text-sm font-mono text-gray-300 mt-1">${formatBRL(asset.firstPrice)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Variação</p>
                            <p class="text-sm font-mono ${changeColor} mt-1">${asset.change >= 0 ? '+' : ''}${formatBRL(asset.change)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase flex items-center gap-1">
                                <i class="fas fa-coins text-brand-yellow"></i> Dividendos
                            </p>
                            <p class="text-sm font-mono text-brand-yellow mt-1 font-bold">
                                ${asset.dividends ? formatBRL(asset.dividends) : 'R$ 0,00'}
                            </p>
                            ${asset.dividendYield ? `<p class="text-xs text-gray-500 mt-1">${asset.dividendYield.toFixed(2)}% yield</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';

    if (canSave) {
        html += `
            <div class="mt-6 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                <p class="text-sm text-green-300 flex items-center gap-2 font-semibold mb-2">
                    <i class="fas fa-info-circle"></i>
                    <span>📥 Arquivo baixado automaticamente!</span>
                </p>
                <p class="text-xs text-gray-400">
                    <strong>Próximo passo:</strong> Verifique sua pasta <code class="bg-gray-800 px-2 py-1 rounded">Downloads</code> e mova o arquivo <code class="bg-gray-800 px-2 py-1 rounded">${monthKey}.js</code> para:
                </p>
                <p class="text-xs text-gray-300 mt-1 font-mono bg-gray-800/50 px-3 py-2 rounded mt-2">
                    📁 INVESTIMENTOS/data/${monthKey}.js
                </p>
                <p class="text-xs text-gray-400 mt-2">
                    ✨ Após mover, recarregue a página. O sistema usará automaticamente esse arquivo em vez da API.
                </p>
            </div>
        `;
    }

    modalContent.html(html);
}

function saveToProjectFile(year, month, autoMode = false) {
    console.log(`🔍 [INICIO] saveToProjectFile: year=${year}, month=${month}, autoMode=${autoMode}`);

    if (!window.currentMarketData) {
        console.error('❌ window.currentMarketData NÃO existe!');
        if (!autoMode) alert('Nenhum dado disponível para salvar');
        return;
    }

    console.log('✅ window.currentMarketData existe:', window.currentMarketData);

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    // Build JavaScript file content
    let jsContent = `// Dados de mercado - ${getMonthName(month)} ${year}\n`;
    jsContent += `window.MARKET_DATA = window.MARKET_DATA || {};\n`;
    jsContent += `window.MARKET_DATA['${monthKey}'] = {\n`;

    const validAssets = window.currentMarketData.assets.filter(a => !a.error);
    console.log(`📊 Ativos válidos: ${validAssets.length}`);

    validAssets.forEach((asset, index) => {
        const isLast = index === validAssets.length - 1;
        jsContent += `    "${asset.ticker}": {\n`;
        jsContent += `        "ticker": "${asset.ticker}",\n`;
        jsContent += `        "name": "${asset.name}",\n`;
        jsContent += `        "color": "${asset.color}",\n`;
        jsContent += `        "avgPrice": ${asset.avgPrice.toFixed(2)},\n`;
        jsContent += `        "firstPrice": ${asset.firstPrice.toFixed(2)},\n`;
        jsContent += `        "lastPrice": ${asset.lastPrice.toFixed(2)},\n`;
        jsContent += `        "change": ${asset.change.toFixed(2)},\n`;
        jsContent += `        "changePercent": ${asset.changePercent.toFixed(2)},\n`;
        jsContent += `        "daysCount": ${asset.daysCount},\n`;
        jsContent += `        "dividends": ${(asset.dividends || 0).toFixed(2)},\n`;
        jsContent += `        "dividendYield": ${(asset.dividendYield || 0).toFixed(2)},\n`;
        jsContent += `        "dividendCount": ${asset.dividendCount || 0}\n`;
        jsContent += `    }${isLast ? '' : ','}\n`;
    });

    jsContent += `};\n`;

    console.log('📝 Conteúdo gerado (primeiros 200 chars):', jsContent.substring(0, 200));

    // Download file
    try {
        console.log('🎬 Iniciando processo de download...');

        const blob = new Blob([jsContent], { type: 'text/javascript' });
        console.log('✅ Blob criado:', blob.size, 'bytes');

        const url = URL.createObjectURL(blob);
        console.log('✅ URL criada:', url);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${monthKey}.js`;
        link.style.display = 'none';

        document.body.appendChild(link);
        console.log('✅ Link adicionado ao DOM');

        console.log('🖱️ Executando link.click()...');
        link.click();
        console.log('✅ link.click() executado!');

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('🧹 Limpeza concluída (link removido)');
        }, 100);

        if (!autoMode) {
            alert(`✅ Arquivo baixado: ${monthKey}.js\n\n📁 Procure em Downloads e mova para:\nINVESTIMENTOS/data/${monthKey}.js\n\n🔄 Depois recarregue a página!`);
        } else {
            console.log(`✅ Download automático concluído: ${monthKey}.js`);
            console.log(`📁 Verifique: C:\\Users\\Lucas\\Downloads\\${monthKey}.js`);
        }
    } catch (error) {
        console.error('❌ ERRO durante download:', error);
        alert(`Erro ao baixar: ${error.message}`);
    }

    console.log(`🏁 [FIM] saveToProjectFile`);
}

function closeMarketDataModal() {
    $('#marketDataModal').addClass('hidden');
}

function getMonthName(monthNumber) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[monthNumber - 1];
}

$(document).keyup(function (e) {
    if (e.key === "Escape") {
        closeMarketDataModal();
    }
});

$('#marketDataModal').click(function (e) {
    if (e.target === this) {
        closeMarketDataModal();
    }
});
