let chartInstance = null;
let donutInstance = null;

function renderCharts(labels, invested, value, portfolioValueMap, totalDividends) {
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
                    label: 'Patrimônio Total',
                    data: value,
                    borderColor: '#3b82f6', // Brand Blue
                    backgroundColor: gradientValue,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Aporte Acumulado',
                    data: invested,
                    borderColor: '#94a3b8', // Gray
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Dividendos Reinvestidos (Lucro Bruto)',
                    data: totalDividends,
                    borderColor: '#10b981', // Brand Green
                    borderWidth: 2,
                    borderDash: [2, 2],
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
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
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
