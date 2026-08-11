const CONFIG = {
    startYear: 2026, // Base year for simulation
    initialInvestment: 600,
    months: 180,
    inflationRate: 0.10, // 10% annual increase in contribution
    dividendGrowthRate: 0.04, // 4% annual dividend growth (realistic IGP-M adjustment)
    monthlyExpenses: 3000, // User's monthly expenses for Independence calculation

    // brapi.dev API Key for real market data
    brapiApiKey: 'aJ9fXxkau8SddPEQN2f6Xs',

    // Real Data (Jan/Feb 2026)
    assets: {
        MXRF11: { name: 'MXRF11', type: 'paper', price: 9.62, dividend: 0.10, color: '#10b981' },
        VGHF11: { name: 'VGHF11', type: 'paper', price: 7.17, dividend: 0.07, color: '#8b5cf6' },
        VGIA11: { name: 'VGIA11', type: 'fiagro', price: 9.96, dividend: 0.14, color: '#ef4444' },
        HGLG11: { name: 'HGLG11', type: 'brick', price: 157.50, dividend: 1.10, color: '#f59e0b' },
        VISC11: { name: 'VISC11', type: 'brick', price: 109.30, dividend: 0.84, color: '#3b82f6' }
    },

    // Brand Colors
    colors: {
        yellow: '#fbbf24', // For dividends
        blue: '#3b82f6',
        green: '#10b981',
        red: '#ef4444'
    }
};

const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
