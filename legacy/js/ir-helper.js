// IR Helper - Tax Declaration Assistant for FIIs

// CNPJ mapping for FIIs (you'll need to update with real CNPJs)
const FII_CNPJ = {
    'MXRF11': '28.757.546/0001-00',
    'VGHF11': '29.641.226/0001-53',
    'VGIA11': '37.045.467/0001-09',
    'HGLG11': '28.737.771/0001-85',
    'VISC11': '11.158.792/0001-52'
};

let simulationData = null;
let selectedYear = new Date().getFullYear();

// Initialize page
$(document).ready(function () {
    loadSimulationData();
    populateYearSelector();
    updateReport();
});

function loadSimulationData() {
    // Try to load from localStorage (saved by main simulator)
    const saved = localStorage.getItem('simulationData');
    if (saved) {
        simulationData = JSON.parse(saved);
        console.log('✅ Dados carregados do localStorage');
    } else {
        // Run simulation if not available
        console.log('⚠️ Nenhum dado encontrado. Gerando simulação...');
        runBasicSimulation();
    }
}

function runBasicSimulation() {
    // Basic simulation to generate data
    simulationData = {
        months: [],
        years: []
    };

    let totalInvested = 0;
    let currentCotas = { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 };

    const startYear = CONFIG.startYear;
    const monthlyContribution = CONFIG.initialInvestment;

    for (let i = 0; i < CONFIG.months; i++) {
        const yearIndex = Math.floor(i / 12);
        const monthInYear = (i % 12) + 1;
        const actualYear = startYear + yearIndex;

        // Apply inflation
        const inflationFactor = Math.pow(1 + CONFIG.inflationRate, yearIndex);
        const contribution = monthlyContribution * inflationFactor;

        totalInvested += contribution;

        // Distribute investment across assets
        const assetKeys = Object.keys(CONFIG.assets);
        const perAsset = contribution / assetKeys.length;

        let dividends = 0;
        assetKeys.forEach(ticker => {
            const asset = CONFIG.assets[ticker];
            const cotas = perAsset / asset.price;
            currentCotas[ticker] += cotas;
            dividends += currentCotas[ticker] * asset.dividend;
        });

        simulationData.months.push({
            year: actualYear,
            month: monthInYear,
            contribution: contribution,
            totalInvested: totalInvested,
            cotas: { ...currentCotas },
            dividends: dividends
        });
    }

    // Group by year
    const yearMap = {};
    simulationData.months.forEach(m => {
        if (!yearMap[m.year]) {
            yearMap[m.year] = {
                year: m.year,
                totalInvested: 0,
                totalDividends: 0,
                cotas: { MXRF11: 0, VGHF11: 0, VGIA11: 0, HGLG11: 0, VISC11: 0 }
            };
        }
        yearMap[m.year].totalInvested = m.totalInvested;
        yearMap[m.year].totalDividends += m.dividends;
        yearMap[m.year].cotas = m.cotas;
    });

    simulationData.years = Object.values(yearMap);
    console.log('✅ Simulação básica gerada:', simulationData);
}

function populateYearSelector() {
    const $selector = $('#yearSelector');
    $selector.empty();

    const currentYear = new Date().getFullYear();
    const years = simulationData.years.filter(y => y.year <= currentYear);

    years.forEach(yearData => {
        $selector.append(`<option value="${yearData.year}">${yearData.year}</option>`);
    });

    // Set to most recent year
    if (years.length > 0) {
        selectedYear = years[years.length - 1].year;
        $selector.val(selectedYear);
    }

    $selector.on('change', function () {
        selectedYear = parseInt($(this).val());
        updateReport();
    });
}

function updateReport() {
    const yearData = simulationData.years.find(y => y.year === selectedYear);
    const prevYearData = simulationData.years.find(y => y.year === selectedYear - 1);

    if (!yearData) {
        console.error('Dados não encontrados para o ano:', selectedYear);
        return;
    }

    // Update summary cards
    $('#totalInvested').text(formatBRL(yearData.totalInvested));
    $('#totalDividends').text(formatBRL(yearData.totalDividends));

    // Update Bens e Direitos table
    updateBensTable(yearData, prevYearData);

    // Update Dividends table
    updateDividendsTable(yearData);
}

function updateBensTable(yearData, prevYearData) {
    const $tbody = $('#bensTable');
    $tbody.empty();

    const assets = Object.keys(CONFIG.assets);

    assets.forEach(ticker => {
        const asset = CONFIG.assets[ticker];
        const currentCotas = yearData.cotas[ticker] || 0;
        const currentValue = currentCotas * asset.price;

        const prevCotas = prevYearData ? (prevYearData.cotas[ticker] || 0) : 0;
        const prevValue = prevCotas * asset.price;

        const cnpj = FII_CNPJ[ticker] || 'Consultar CVM';

        $tbody.append(`
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                <td class="py-3 px-4 text-white font-semibold">${ticker}</td>
                <td class="py-3 px-4 text-gray-300 font-mono text-sm">${cnpj}</td>
                <td class="py-3 px-4 text-right text-gray-300">${currentCotas.toFixed(4)}</td>
                <td class="py-3 px-4 text-right text-gray-300">${formatBRL(prevValue)}</td>
                <td class="py-3 px-4 text-right text-white font-semibold">${formatBRL(currentValue)}</td>
            </tr>
        `);
    });

    // Add total row
    const totalPrevValue = prevYearData ? prevYearData.totalInvested : 0;
    $tbody.append(`
        <tr class="bg-gray-800/50 font-bold">
            <td colspan="3" class="py-4 px-4 text-white">TOTAL</td>
            <td class="py-4 px-4 text-right text-brand-blue">${formatBRL(totalPrevValue)}</td>
            <td class="py-4 px-4 text-right text-brand-green">${formatBRL(yearData.totalInvested)}</td>
        </tr>
    `);
}

function updateDividendsTable(yearData) {
    const $tbody = $('#dividendsTable');
    $tbody.empty();

    const assets = Object.keys(CONFIG.assets);

    // Get monthly data for first and second semester
    const monthsInYear = simulationData.months.filter(m => m.year === selectedYear);
    const firstSemester = monthsInYear.slice(0, 6);
    const secondSemester = monthsInYear.slice(6, 12);

    assets.forEach(ticker => {
        const asset = CONFIG.assets[ticker];

        // Calculate dividends per semester
        let firstSemDividends = 0;
        firstSemester.forEach(m => {
            firstSemDividends += (m.cotas[ticker] || 0) * asset.dividend;
        });

        let secondSemDividends = 0;
        secondSemester.forEach(m => {
            secondSemDividends += (m.cotas[ticker] || 0) * asset.dividend;
        });

        const totalYear = firstSemDividends + secondSemDividends;

        $tbody.append(`
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                <td class="py-3 px-4 text-white font-semibold">${ticker}</td>
                <td class="py-3 px-4 text-right text-gray-300">${formatBRL(firstSemDividends)}</td>
                <td class="py-3 px-4 text-right text-gray-300">${formatBRL(secondSemDividends)}</td>
                <td class="py-3 px-4 text-right text-white font-semibold">${formatBRL(totalYear)}</td>
            </tr>
        `);
    });

    // Add total row
    const totalFirstSem = firstSemester.reduce((sum, m) => sum + m.dividends, 0);
    const totalSecondSem = secondSemester.reduce((sum, m) => sum + m.dividends, 0);
    const totalYear = totalFirstSem + totalSecondSem;

    $tbody.append(`
        <tr class="bg-gray-800/50 font-bold">
            <td class="py-4 px-4 text-white">TOTAL</td>
            <td class="py-4 px-4 text-right text-brand-blue">${formatBRL(totalFirstSem)}</td>
            <td class="py-4 px-4 text-right text-brand-blue">${formatBRL(totalSecondSem)}</td>
            <td class="py-4 px-4 text-right text-brand-green">${formatBRL(totalYear)}</td>
        </tr>
    `);
}

function exportToCSV() {
    const yearData = simulationData.years.find(y => y.year === selectedYear);
    if (!yearData) return;

    let csv = 'FII,CNPJ,Cotas,Valor Total\n';

    Object.keys(CONFIG.assets).forEach(ticker => {
        const cotas = yearData.cotas[ticker] || 0;
        const value = cotas * CONFIG.assets[ticker].price;
        const cnpj = FII_CNPJ[ticker] || '';

        csv += `${ticker},${cnpj},${cotas.toFixed(4)},${value.toFixed(2)}\n`;
    });

    csv += '\n\nDividendos por FII\n';
    csv += 'FII,Total Ano\n';

    const monthsInYear = simulationData.months.filter(m => m.year === selectedYear);

    Object.keys(CONFIG.assets).forEach(ticker => {
        const asset = CONFIG.assets[ticker];
        let totalDividends = 0;

        monthsInYear.forEach(m => {
            totalDividends += (m.cotas[ticker] || 0) * asset.dividend;
        });

        csv += `${ticker},${totalDividends.toFixed(2)}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `IR_FIIs_${selectedYear}.csv`;
    link.click();

    alert(`✅ Arquivo exportado: IR_FIIs_${selectedYear}.csv`);
}
