/**
 * Catalyst Dashboard Module logic
 * Connects real expenditure data to high-fidelity summary cards
 */

// --- Constants & Global State ---
let expenseArr = [];
let categoryArr = [];

// --- Data Layer ---
function refreshData() {
    expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
}

// --- Date Helpers ---
const now = new Date();
const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    return { start, end };
}

// --- Statistics Engine ---
function getPeriodSpending(start, end) {
    return expenseArr
        .filter(ex => {
            const d = new Date(ex.date);
            return d >= start && d <= end;
        })
        .reduce((sum, ex) => sum + parseFloat(ex.amount || 0), 0);
}

function updateSummaryCards() {
    refreshData();
    
    // 1. Total Spent (This Month)
    const thisMonthSpent = getPeriodSpending(startOfThisMonth, now);
    const totalSpentEl = document.getElementById("totalSpentVal");
    if (totalSpentEl) totalSpentEl.textContent = `$${thisMonthSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    // 2. Remaining (Total Budget - Total Spent This Month)
    const totalBudget = categoryArr.reduce((sum, cat) => sum + parseFloat(cat.budget || 0), 0);
    const remaining = Math.max(0, totalBudget - thisMonthSpent);
    const remainingEl = document.getElementById("remainingVal");
    const remainingBar = document.getElementById("remainingBar");
    
    if (remainingEl) remainingEl.textContent = `$${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (remainingBar) {
        const percent = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;
        remainingBar.style.width = `${percent}%`;
    }

    // 3. Monthly Savings (Budget - Spent)
    const savingsEl = document.getElementById("monthlySavingsVal");
    if (savingsEl) savingsEl.textContent = `$${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const targetEl = document.querySelector(".card:nth-child(3) .subtitle");
    if (targetEl) targetEl.textContent = `Target: $${totalBudget.toLocaleString()}`;
}

// --- Comparison Animation Logic ---
let currentComparisonIdx = 0;
const comparisons = [
    { label: 'week', getThis: () => {
        const r = getWeekRange(now);
        return getPeriodSpending(r.start, r.end);
    }, getLast: () => {
        const lastWeekDate = new Date(now);
        lastWeekDate.setDate(now.getDate() - 7);
        const r = getWeekRange(lastWeekDate);
        return getPeriodSpending(r.start, r.end);
    }},
    { label: 'month', getThis: () => getPeriodSpending(startOfThisMonth, now), 
      getLast: () => getPeriodSpending(startOfLastMonth, endOfLastMonth) },
    { label: 'year', getThis: () => getPeriodSpending(new Date(now.getFullYear(), 0, 1), now), 
      getLast: () => getPeriodSpending(new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() - 1, 11, 31)) }
];

function triggerComparisonAnimation() {
    const trendEl = document.getElementById("comparisonTrend");
    if (!trendEl) return;

    const data = comparisons[currentComparisonIdx];
    const valThis = data.getThis();
    const valLast = data.getLast();
    
    let diffPercent = 0;
    let status = 'less';
    
    if (valLast > 0) {
        diffPercent = ((valThis / valLast) - 1) * 100;
        status = diffPercent >= 0 ? 'more' : 'less';
    } else if (valThis > 0) {
        diffPercent = 100;
        status = 'more';
    }

    // Update style & text with a small fade
    trendEl.style.opacity = 0;
    
    setTimeout(() => {
        trendEl.textContent = `${Math.abs(diffPercent).toFixed(1)}% ${status} than last ${data.label}`;
        trendEl.style.color = status === 'less' ? 'var(--green)' : 'var(--coral)';
        trendEl.style.opacity = 1;
        
        currentComparisonIdx = (currentComparisonIdx + 1) % comparisons.length;
    }, 400);
}

// --- Lifecycle ---
document.addEventListener("DOMContentLoaded", () => {
    updateSummaryCards();
    
    // Initial comparison trigger
    triggerComparisonAnimation();
    setInterval(triggerComparisonAnimation, 5000);
    
    // Initial Chart Render
    renderSpendingChart('monthly');
    
    // Initial Budget Status
    updateBudgetStatus();
    
    // Initial Recent Expenses
    updateRecentExpenses();
    
    // --- Period Toggle Handlers ---
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderSpendingChart(btn.dataset.period);
        });
    });
    
    // Auto-refresh when returning to tab
    window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            updateSummaryCards();
            const activePeriod = document.querySelector('.period-btn.active')?.dataset.period || 'monthly';
            renderSpendingChart(activePeriod);
            updateBudgetStatus();
            updateRecentExpenses();
        }
    });
});

/**
 * Handles pulse chart logic for Weekly/Monthly/Yearly views
 */
function renderSpendingChart(period = 'monthly') {
    const container = document.querySelector('.chart-container');
    const labelRow = document.querySelector('.chart-labels');
    if (!container) return;

    const gridLines = container.querySelector('.chart-grid');
    container.innerHTML = '';
    if (gridLines) container.appendChild(gridLines);

    const now = new Date();
    let dataPoints = [];

    if (period === 'weekly') {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const spent = expenseArr.filter(exp => exp.date === dayStr).reduce((s, e) => s + parseFloat(e.amount), 0);
            dataPoints.push({ label: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), amount: spent, isProjected: false });
        }

        const weeklySpent = dataPoints.reduce((s, p) => s + p.amount, 0);
        const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0-6 (Mon-Sun)
        const daysPassed = dayIdx + 1;
        dataPoints.push({ label: 'PROJECTION', amount: (weeklySpent / daysPassed) * 7, isProjected: true });
    } else if (period === 'monthly') {
        const currentMonth = now.getMonth(), currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const weekRanges = [{ s: 1, e: 7 }, { s: 8, e: 14 }, { s: 15, e: 21 }, { s: 22, e: daysInMonth }];

        weekRanges.forEach((range, i) => {
            const weekSpent = expenseArr.filter(exp => {
                const d = new Date(exp.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d.getDate() >= range.s && d.getDate() <= range.e;
            }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            dataPoints.push({ label: `WEEK ${i + 1}`, amount: weekSpent, isProjected: false });
        });

        const monthlySpent = dataPoints.reduce((s, p) => s + p.amount, 0);
        const currentDay = now.getDate();
        dataPoints.push({ label: 'PROJECTION', amount: (monthlySpent / currentDay) * daysInMonth, isProjected: true });
    } else {
        // Yearly
        const currentYear = now.getFullYear();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        months.forEach((m, i) => {
            const monthSpent = expenseArr.filter(exp => {
                const d = new Date(exp.date);
                return d.getMonth() === i && d.getFullYear() === currentYear;
            }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            dataPoints.push({ label: m, amount: monthSpent, isProjected: i > now.getMonth() });
        });
    }

    // Render Bars
    const maxAmount = Math.max(...dataPoints.map(d => d.amount), 1);
    if (labelRow) labelRow.innerHTML = dataPoints.map(d => `<span>${d.label}</span>`).join('');

    dataPoints.forEach(dp => {
        const bar = document.createElement('div');
        bar.className = `chart-bar group ${dp.isProjected ? 'projected' : ''}`;
        
        // Highlight current period
        const isCurrentWeekly = period === 'weekly' && !dp.isProjected && dp.label === now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const isCurrentMonthly = period === 'monthly' && !dp.isProjected && dp.label === `WEEK ${Math.ceil(now.getDate() / 7)}`;
        const isCurrentYearly = period === 'yearly' && !dp.isProjected && dp.label === ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][now.getMonth()];
        
        if (isCurrentWeekly || isCurrentMonthly || isCurrentYearly) {
            bar.classList.add('current', 'glow-cyan');
        }

        bar.style.height = `${Math.max((dp.amount / maxAmount) * 90, 5)}%`;
        bar.innerHTML = `<div class="tooltip">$${Math.round(dp.amount).toLocaleString()}</div>`;
        container.appendChild(bar);
    });
}

/**
 * Updates the Budget Status section with Warning/Danger levels
 */
function updateBudgetStatus() {
    refreshData();
    const container = document.getElementById("alertCardsContainer");
    const countEl = document.getElementById("alertCount");
    if (!container) return;

    // 1. Calculate Monthly Spending per Category
    const spentMap = {};
    categoryArr.forEach(c => spentMap[c.name] = 0);
    expenseArr.filter(ex => {
        const d = new Date(ex.date);
        return d >= startOfThisMonth && d <= now;
    }).forEach(ex => {
        if (spentMap[ex.category] !== undefined) spentMap[ex.category] += parseFloat(ex.amount);
    });

    // 2. Filter for Warning (60-80%), Danger (80-100%), Exceeded (>100%)
    const activeAlerts = categoryArr.filter(cat => {
        const spent = spentMap[cat.name];
        const budget = parseFloat(cat.budget || 0);
        if (budget === 0) return false;
        return (spent / budget) >= 0.6;
    });

    // 3. Render
    if (activeAlerts.length === 0) {
        container.innerHTML = `
            <div class="alert-card" style="text-align:center; padding: 40px 20px; opacity: 0.6;">
                <p>All budgets are safe. <br><span style="font-size: 11px;">(Categories under 60% are hidden)</span></p>
            </div>
        `;
        if (countEl) countEl.textContent = "0 Active Alerts";
        return;
    }

    if (countEl) countEl.textContent = `${activeAlerts.length} Active Alert${activeAlerts.length === 1 ? '' : 's'}`;

    container.innerHTML = activeAlerts.map(cat => {
        const spent = spentMap[cat.name];
        const budget = parseFloat(cat.budget);
        const percent = (spent / budget) * 100;
        
        let statusClass = "warning";
        let helperText = "APPROACHING LIMIT";
        let helperColor = "amber"; // amber class to be handled in CSS if not present
        let hexColor = "#ffb86c";
        
        if (percent >= 100) {
            statusClass = "danger";
            helperText = `OVER BUDGET (${Math.round(percent - 100)}%)`;
            helperColor = "red";
            hexColor = "#ff7975";
        } else if (percent >= 80) {
            statusClass = "danger";
            helperText = "CRITICAL ZONE";
            helperColor = "red";
            hexColor = "#ff7975";
        }

        return `
            <article class="alert-card ${statusClass}">
                <div class="alert-top">
                    <div class="title-row"><div class="badge" style="background: ${hexColor}33; color: ${hexColor};">${cat.name.charAt(0)}</div>${cat.name}</div>
                    <div class="amount ${percent >= 100 ? 'red' : ''}">$${spent.toLocaleString()} / $${budget.toLocaleString()}</div>
                </div>
                <div class="progress">
                    <span style="width: ${Math.min(100, percent)}%; background: ${hexColor};"></span>
                </div>
                <div class="helper" style="color: ${hexColor};">${helperText}</div>
            </article>
        `;
    }).join('');
}

/**
 * Updates the Recent Expenses List with top 3 most recent transactions
 */
function updateRecentExpenses() {
    refreshData();
    const container = document.getElementById("recentExpensesList");
    if (!container) return;

    // Sort by date (newest first), then by id (newest first)
    const sorted = [...expenseArr].sort((a, b) => {
        return b.date.localeCompare(a.date) || b.id - a.id;
    });

    const recent = sorted.slice(0, 3);

    if (recent.length === 0) {
        container.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--muted); font-size: 13px;">
                No recent expenses logged.
            </div>
        `;
        return;
    }

    container.innerHTML = recent.map(ex => {
        const formattedDate = new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        let metaText = `${ex.category} • ${formattedDate}`;
        if (ex.notes) metaText += ` • ${ex.notes}`;

        const catObj = categoryArr.find(c => c.name === ex.category);
        const catColor = catObj ? catObj.color : 'var(--primary)';

        return `
            <div class="tx-row">
              <div class="tx-main">
                <div class="tx-icon" style="background: ${catColor}; --cat-color: ${catColor};"></div>
                <div>
                  <div class="tx-name">${ex.merchant || 'Unknown Merchant'}</div>
                  <div class="tx-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                    ${metaText}
                  </div>
                </div>
              </div>
              <div class="tx-amount">-$${parseFloat(ex.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                <div class="tx-status" style="color: var(--muted);">Processed</div>
              </div>
            </div>
        `;
    }).join('');
}
