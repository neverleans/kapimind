// FII Explorer - Discovery and Ranking System

let allFiis = [];
let filteredFiis = [];
let currentFilter = 'all';
let currentSort = 'score';
let selectedForComparison = [];

// Category mapping (simplified - in production you'd get this from API metadata)
const CATEGORY_MAP = {
    // Tijolo (Brick & Mortar)
    'brick': ['HGLG11', 'VISC11', 'XPML11', 'BTLG11', 'MCHY11', 'KNRI11', 'HGPO11'],

    // Papel (Paper - CRIs, etc)
    'paper': ['MXRF11', 'VGHF11', 'KNCR11', 'KNSC11', 'RBRY11', 'RBVO11', 'URPR11', 'DEVA11'],

    // FIAgro
    'fiagro': ['VGIA11', 'RZAK11', 'GGRC11', 'RZAG11'],

    // Shoppings
    'shopping': ['HGBS11', 'MALL11', 'GZIT11', 'BPML11'],

    // Hotéis
    'hotel': ['MGHT11', 'HTMX11'],

    // Logística
    'logistics': ['LVBI11', 'RBRR11', 'HFOF11'],

    // Híbrido
    'hybrid': ['HGRU11', 'VILG11', 'KNHF11']
};

$(document).ready(function () {
    setupEventListeners();
    loadInitialData();
});

function setupEventListeners() {
    $('#searchInput').on('input', function () {
        const query = $(this).val().toUpperCase();
        if (query.length >= 3) {
            filterFiis();
        } else if (query.length === 0) {
            filterFiis();
        }
    });
}

async function loadInitialData() {
    showLoading(true);

    try {
        // Try to fetch FII list from brapi.dev
        // Note: brapi may not have a dedicated FII list endpoint, so we'll use a curated list
        await fetchFiiData();

        filterFiis();
        updateStats();
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar FIIs:', error);
        showLoading(false);
        showError('Erro ao buscar dados. Verifique sua chave de API.');
    }
}

async function fetchFiiData() {
    // Curated list of top FIIs (updated with 2025-2026 high-yield funds)
    const fiiTickers = [
        // High Yield (Papel)
        'MXRF11', 'VGHF11', 'KNCR11', 'KNSC11', 'RBRY11', 'RBVO11', 'URPR11', 'DEVA11',

        // Brick & Mortar (Tijolo)
        'HGLG11', 'VISC11', 'XPML11', 'BTLG11', 'MCHY11', 'KNRI11',
        'HGPO11', // Pátria Prime Offices - DY ~40%

        // FIAgro
        'VGIA11', 'RZAK11', 'GGRC11',
        'RZAG11', // Recorde R$ 0,15/cota em jan/2026

        // Logística
        'LVBI11', 'RBRR11', 'HFOF11',

        // Shoppings
        'HGBS11', 'MALL11', 'GZIT11', 'BPML11', // BTG Pactual Shoppings - DY >20%

        // Hotéis
        'MGHT11', // Hotel - Alto DY
        'HTMX11',

        // Híbridos
        'HGRU11', 'VILG11', 'KNHF11'
    ];

    const promises = fiiTickers.map(ticker => fetchSingleFii(ticker));
    const results = await Promise.all(promises);

    allFiis = results.filter(fii => fii !== null);

    // Calculate scores for all FIIs
    allFiis.forEach(fii => {
        fii.score = calculateScore(fii);
        fii.category = getCategoryForTicker(fii.ticker);
    });

    console.log(`✅ ${allFiis.length} FIIs carregados`);
}

async function fetchSingleFii(ticker) {
    try {
        const response = await $.ajax({
            url: `https://brapi.dev/api/quote/${ticker}?range=1mo&fundamental=true&dividends=true&token=${CONFIG.brapiApiKey}`,
            method: 'GET',
            timeout: 10000
        });

        if (response.results && response.results[0]) {
            const data = response.results[0];

            // Extract dividend yield
            const dividendsData = data.dividendsData || {};
            const cashDividends = dividendsData.cashDividends || [];

            // Calculate last 12 months dividend yield
            const last12MonthsDividends = cashDividends
                .filter(div => {
                    const divDate = new Date(div.paymentDate);
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    return divDate >= oneYearAgo;
                })
                .reduce((sum, div) => sum + (div.rate || 0), 0);

            const currentPrice = data.regularMarketPrice || data.previousClose || 0;
            const dividendYield = currentPrice > 0 ? (last12MonthsDividends / currentPrice) * 100 : 0;

            // Extract fundamentals
            const summaryProfile = data.summaryProfile || {};
            const defaultKeyStatistics = data.defaultKeyStatistics || {};

            return {
                ticker: ticker,
                name: summaryProfile.longName || ticker,
                price: currentPrice,
                change: data.regularMarketChangePercent || 0,
                dividendYield: dividendYield,
                pvp: defaultKeyStatistics.priceToBook || 1,
                liquidity: data.averageDailyVolume10Day || data.regularMarketVolume || 0,
                marketCap: data.marketCap || 0,
                dividends12m: last12MonthsDividends,
                sector: summaryProfile.sector || 'N/A'
            };
        }

        return null;
    } catch (error) {
        console.error(`Erro ao buscar ${ticker}:`, error);
        return null;
    }
}

function getCategoryForTicker(ticker) {
    for (const [category, tickers] of Object.entries(CATEGORY_MAP)) {
        if (tickers.includes(ticker)) {
            return category;
        }
    }
    return 'hybrid'; // Default
}

function calculateScore(fii) {
    // Scoring algorithm (0-100)
    let score = 0;

    // 1. Dividend Yield (40 points)
    // 0-5% = 0pts, 5-8% = 20pts, 8-12% = 30pts, 12%+ = 40pts
    if (fii.dividendYield >= 12) score += 40;
    else if (fii.dividendYield >= 8) score += 30 + ((fii.dividendYield - 8) / 4) * 10;
    else if (fii.dividendYield >= 5) score += 20 + ((fii.dividendYield - 5) / 3) * 10;
    else score += (fii.dividendYield / 5) * 20;

    // 2. Liquidity (25 points)
    // Based on daily volume
    const liquidityScore = Math.min(25, (fii.liquidity / 1000000) * 5);
    score += liquidityScore;

    // 3. P/VP (20 points)
    // Lower is better: P/VP < 0.85 = 20pts, 0.85-0.95 = 15pts, 0.95-1.05 = 10pts, >1.05 = 5pts
    if (fii.pvp < 0.85) score += 20;
    else if (fii.pvp < 0.95) score += 15;
    else if (fii.pvp < 1.05) score += 10;
    else if (fii.pvp < 1.20) score += 5;

    // 4. Market Cap (15 points)
    // Prefer larger funds (mais estabilidade)
    const capScore = Math.min(15, (fii.marketCap / 1000000000) * 3);
    score += capScore;

    return Math.round(score);
}

function setFilter(category) {
    currentFilter = category;

    // Update UI
    $('.filter-btn').removeClass('active');
    event.target.classList.add('active');

    filterFiis();
}

function sortBy(criteria) {
    currentSort = criteria;

    // Update UI
    $('.sort-btn').removeClass('bg-brand-purple').addClass('bg-gray-700');
    event.target.classList.remove('bg-gray-700');
    event.target.classList.add('bg-brand-purple');

    filterFiis();
}

function filterFiis() {
    const searchQuery = $('#searchInput').val().toUpperCase();

    // Apply filters
    filteredFiis = allFiis.filter(fii => {
        // Category filter
        if (currentFilter !== 'all' && fii.category !== currentFilter) {
            return false;
        }

        // Search filter
        if (searchQuery && !fii.ticker.includes(searchQuery) && !fii.name.toUpperCase().includes(searchQuery)) {
            return false;
        }

        return true;
    });

    // Apply sorting
    filteredFiis.sort((a, b) => {
        switch (currentSort) {
            case 'score':
                return b.score - a.score;
            case 'dividendYield':
                return b.dividendYield - a.dividendYield;
            case 'liquidity':
                return b.liquidity - a.liquidity;
            case 'pvp':
                return a.pvp - b.pvp; // Lower is better
            default:
                return 0;
        }
    });

    renderFiiList();
    updateStats();
}

function renderFiiList() {
    const $list = $('#fiiList');
    const $emptyState = $('#emptyState');

    if (filteredFiis.length === 0) {
        $list.empty();
        $emptyState.show();
        return;
    }

    $emptyState.hide();
    $list.empty();

    filteredFiis.forEach((fii, index) => {
        const rankBadge = index < 3 ? getRankBadge(index + 1) : `<span class="text-gray-500">#${index + 1}</span>`;
        const isPositive = fii.change >= 0;
        const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
        const categoryIcon = getCategoryIcon(fii.category);
        const categoryName = getCategoryName(fii.category);

        const isSelected = selectedForComparison.includes(fii.ticker);

        const isHighYield = fii.dividendYield > 15;

        const card = `
            <div class="bg-gray-800/50 rounded-lg p-4 border ${isSelected ? 'border-brand-purple' : 'border-gray-700'} hover:border-gray-600 transition-all relative overflow-hidden">
                ${isHighYield ? '<div class="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-red-500/30">🔥 HIGH YIELD</div>' : ''}
                
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl">${rankBadge}</div>
                        <div>
                            <h3 class="text-xl font-bold text-white">${fii.ticker}</h3>
                            <p class="text-sm text-gray-400">${fii.name}</p>
                            <p class="text-xs text-gray-500 mt-1">${categoryIcon} ${categoryName}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-gray-400 text-xs">Score Geral</p>
                            <div class="flex items-center gap-2">
                                <p class="text-2xl font-bold text-brand-yellow">${fii.score}</p>
                                <div class="relative w-20 h-2 bg-gray-700 rounded">
                                    <div class="score-bar absolute top-0 left-0 h-full" style="width: ${fii.score}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <button onclick="toggleCompare('${fii.ticker}')" class="px-4 py-2 ${isSelected ? 'bg-brand-purple' : 'bg-gray-700'} hover:bg-brand-purple text-white rounded-lg text-sm transition-colors">
                            <i class="fas fa-balance-scale mr-1"></i>
                            ${isSelected ? 'Remover' : 'Comparar'}
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-4 gap-4">
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Preço</p>
                        <p class="text-lg font-mono text-white mt-1">${formatBRL(fii.price)}</p>
                        <p class="${changeColor} text-xs font-semibold mt-1">
                            ${isPositive ? '+' : ''}${fii.change.toFixed(2)}%
                        </p>
                    </div>
                    
                    <div>
                        <p class="text-xs text-gray-500 uppercase flex items-center gap-1">
                            <i class="fas fa-percentage text-brand-green"></i> DY (12m)
                        </p>
                        <p class="text-lg font-bold text-brand-green mt-1">${fii.dividendYield.toFixed(2)}%</p>
                        <p class="text-xs text-gray-500 mt-1">${formatBRL(fii.dividends12m)}/cota</p>
                    </div>
                    
                    <div>
                        <p class="text-xs text-gray-500 uppercase">P/VP</p>
                        <p class="text-lg font-mono ${fii.pvp < 1 ? 'text-green-400' : 'text-gray-300'} mt-1">${fii.pvp.toFixed(2)}</p>
                        <p class="text-xs ${fii.pvp < 1 ? 'text-green-400' : 'text-gray-500'} mt-1">
                            ${fii.pvp < 1 ? 'Abaixo do VP' : 'Acima do VP'}
                        </p>
                    </div>
                    
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Liquidez Diária</p>
                        <p class="text-lg font-mono text-gray-300 mt-1">${formatNumber(fii.liquidity)}</p>
                        <p class="text-xs text-gray-500 mt-1">Volume médio</p>
                    </div>
                </div>
            </div>
        `;

        $list.append(card);
    });
}

function getRankBadge(rank) {
    const badges = {
        1: '<span class="text-3xl">🥇</span>',
        2: '<span class="text-3xl">🥈</span>',
        3: '<span class="text-3xl">🥉</span>'
    };
    return badges[rank] || `<span class="text-gray-500">#${rank}</span>`;
}

function getCategoryIcon(category) {
    const icons = {
        'brick': '🧱',
        'paper': '📄',
        'fiagro': '🌾',
        'shopping': '🛍️',
        'hotel': '🏨',
        'logistics': '📦',
        'hybrid': '🔀'
    };
    return icons[category] || '❓';
}

function getCategoryName(category) {
    const names = {
        'brick': 'Tijolo',
        'paper': 'Papel',
        'fiagro': 'FIAgro',
        'shopping': 'Shopping',
        'hotel': 'Hotéis',
        'logistics': 'Logística',
        'hybrid': 'Híbrido'
    };
    return names[category] || 'Outro';
}

function toggleCompare(ticker) {
    const index = selectedForComparison.indexOf(ticker);

    if (index > -1) {
        selectedForComparison.splice(index, 1);
    } else {
        if (selectedForComparison.length >= 4) {
            alert('Você pode comparar no máximo 4 FIIs por vez');
            return;
        }
        selectedForComparison.push(ticker);
    }

    renderFiiList();
    renderComparison();
}

function renderComparison() {
    const $section = $('#compareSection');
    const $list = $('#compareList');

    if (selectedForComparison.length === 0) {
        $section.addClass('hidden');
        return;
    }

    $section.removeClass('hidden');
    $list.empty();

    selectedForComparison.forEach(ticker => {
        const fii = allFiis.find(f => f.ticker === ticker);
        if (!fii) return;

        const card = `
            <div class="bg-gray-800/70 rounded-lg p-4 border border-brand-purple">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="text-lg font-bold text-white">${fii.ticker}</h3>
                        <p class="text-xs text-gray-400">${fii.name.substring(0, 30)}...</p>
                    </div>
                    <button onclick="toggleCompare('${ticker}')" class="text-gray-400 hover:text-red-400">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Score:</span>
                        <span class="font-bold text-brand-yellow">${fii.score}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">DY:</span>
                        <span class="font-bold text-brand-green">${fii.dividendYield.toFixed(2)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Preço:</span>
                        <span class="text-white">${formatBRL(fii.price)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">P/VP:</span>
                        <span class="${fii.pvp < 1 ? 'text-green-400' : 'text-gray-300'}">${fii.pvp.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        $list.append(card);
    });
}

function updateStats() {
    const total = filteredFiis.length;
    const avgDY = total > 0 ? filteredFiis.reduce((sum, f) => sum + f.dividendYield, 0) / total : 0;
    const bestDY = total > 0 ? Math.max(...filteredFiis.map(f => f.dividendYield)) : 0;
    const topScore = total > 0 ? Math.max(...filteredFiis.map(f => f.score)) : 0;

    $('#totalFiis').text(total);
    $('#avgDY').text(avgDY.toFixed(2) + '%');
    $('#bestDY').text(bestDY.toFixed(2) + '%');
    $('#topScore').text(topScore);
}

function showLoading(show) {
    if (show) {
        $('#loadingIndicator').removeClass('hidden');
        $('#fiiList').empty();
        $('#emptyState').hide();
    } else {
        $('#loadingIndicator').addClass('hidden');
    }
}

function showError(message) {
    $('#fiiList').html(`
        <div class="text-center py-12">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <p class="text-gray-300 text-lg">${message}</p>
        </div>
    `);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Make functions global
window.setFilter = setFilter;
window.sortBy = sortBy;
window.toggleCompare = toggleCompare;
