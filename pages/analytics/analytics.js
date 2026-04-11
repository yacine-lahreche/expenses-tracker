/**
 * Catalyst Analytics Module Logic
 * Handles dynamic temporal filtering and comparison modes
 */

document.addEventListener("DOMContentLoaded", () => {
    const compareDropdown = document.getElementById("compareModeDropdown");
    const viewDropdown = document.getElementById("viewFilterDropdown");
    
    const compareBtn = compareDropdown.querySelector(".dropdown-btn");
    const viewBtn = viewDropdown.querySelector(".dropdown-btn");
    
    const compareMenu = compareDropdown.querySelector(".dropdown-menu");
    const viewMenu = viewDropdown.querySelector(".dropdown-menu");

    let currentMode = "lastMonth";

    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    // State for data
    let expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];

    /**
     * Toggles dropdown visibility
     */
    function setupDropdown(dropdown) {
        const btn = dropdown.querySelector(".dropdown-btn");
        const menu = dropdown.querySelector(".dropdown-menu");

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".dropdown-menu.show").forEach(m => {
                if (m !== menu) m.classList.remove("show");
            });
            menu.classList.toggle("show");
        });
    }

    /**
     * Reusable health score calculators
     */
    function calculateBudgetHealth(totalSpent, totalBudget) {
        if (totalBudget <= 0) return totalSpent > 0 ? 0 : 100;
        if (totalSpent <= totalBudget) return 100;
        
        const overspent = totalSpent - totalBudget;
        const overspentPct = (overspent / totalBudget) * 100;
        const score = Math.max(0, Math.min(100, 100 - overspentPct));
        return Math.round(score);
    }

    function compareHealth(curr, prev, mode) {
        const badge = document.querySelector(".health-badge");
        if (!badge) return;

        const diff = curr - prev;
        const absDiff = Math.abs(diff);
        const context = mode === "lastYear" ? "last year" : "last month";

        badge.className = "health-badge"; // Reset

        if (diff > 0) {
            badge.classList.add("better");
            badge.innerHTML = `<span class="material-symbols-outlined">trending_up</span><span>${absDiff}% Better vs ${context}</span>`;
        } else if (diff < 0) {
            badge.classList.add("worse");
            badge.innerHTML = `<span class="material-symbols-outlined">trending_down</span><span>${absDiff}% Worse vs ${context}</span>`;
        } else {
            badge.classList.add("same");
            badge.innerHTML = `<span class="material-symbols-outlined">horizontal_rule</span><span>Same as ${context}</span>`;
        }
    }

    /**
     * Main UI Update per selection
     */
    function updateHealthScore() {
        const totalMonthlyBudget = categoryArr.reduce((s, c) => s + parseFloat(c.budget || 0), 0);
        
        let currentSpent = 0;
        let previousSpent = 0;
        let budgetTarget = 0;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        if (currentMode === "overall") {
            currentSpent = expenseArr.reduce((s, e) => s + parseFloat(e.amount), 0);
            budgetTarget = totalMonthlyBudget; 
            previousSpent = currentSpent;
        } else if (currentMode === "lastYear") {
            const selectedValue = viewBtn.textContent;
            const mIdx = MONTHS.indexOf(selectedValue);
            budgetTarget = totalMonthlyBudget;
            
            currentSpent = expenseArr.filter(ex => {
                const d = new Date(ex.date);
                return d.getMonth() === mIdx && d.getFullYear() === currentYear;
            }).reduce((s, e) => s + parseFloat(e.amount), 0);

            previousSpent = expenseArr.filter(ex => {
                const d = new Date(ex.date);
                return d.getMonth() === mIdx && d.getFullYear() === (currentYear - 1);
            }).reduce((s, e) => s + parseFloat(e.amount), 0);

        } else {
            const selectedValue = viewBtn.textContent;
            budgetTarget = totalMonthlyBudget / 4.33;
            const weekIdx = WEEKS.indexOf(selectedValue);

            const getWeekSpend = (year, month, wIdx) => {
                return expenseArr.filter(ex => {
                    const d = new Date(ex.date);
                    if (d.getMonth() !== month || d.getFullYear() !== year) return false;
                    const dateNum = d.getDate();
                    const startDay = wIdx * 7 + 1;
                    const endDay = startDay + 6;
                    return dateNum >= startDay && dateNum <= endDay;
                }).reduce((s, e) => s + parseFloat(e.amount), 0);
            };

            currentSpent = getWeekSpend(currentYear, currentMonth, weekIdx);
            
            let prevMonth = currentMonth - 1;
            let prevYear = currentYear;
            if (prevMonth < 0) { prevMonth = 11; prevYear--; }
            previousSpent = getWeekSpend(prevYear, prevMonth, weekIdx);
        }

        const currentScore = calculateBudgetHealth(currentSpent, budgetTarget);
        const previousScore = (currentMode === "overall") ? currentScore : calculateBudgetHealth(previousSpent, budgetTarget);

        // Update Gauge
        const scoreEl = document.querySelector(".gauge-score");
        const gaugeCircle = document.querySelector(".gauge-face circle:last-child");
        if (scoreEl) scoreEl.textContent = currentScore;
        if (gaugeCircle) {
            const offset = 552.92 - (552.92 * (currentScore / 100));
            gaugeCircle.style.strokeDashoffset = offset;
        }

        compareHealth(currentScore, previousScore, currentMode);
        updateCategoryPerformance(budgetTarget);
        updateSpendingPatterns(currentSpent, previousSpent, currentMode);

        // Expose state and trigger heatmap
        window.currentAnalyticsState = {
            mode: currentMode,
            view: viewBtn.textContent
        };
        if (typeof refreshSpendingHeatmap === 'function') {
            refreshSpendingHeatmap();
        }
    }

    /**
     * Updates the donut chart based on category spending
     */
    function updateCategoryPerformance(baselineBudget) {
        const donutLayout = document.querySelector(".donut-layout");
        if (!donutLayout) return;

        const selectedValue = viewBtn.textContent;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const categoryStats = categoryArr.map(cat => {
            let spent = 0;
            if (currentMode === "overall") {
                spent = expenseArr.filter(e => e.category === cat.name).reduce((s, e) => s + parseFloat(e.amount), 0);
            } else if (currentMode === "lastYear") {
                const mIdx = MONTHS.indexOf(selectedValue);
                spent = expenseArr.filter(e => {
                    const d = new Date(e.date);
                    return e.category === cat.name && d.getMonth() === mIdx && d.getFullYear() === currentYear;
                }).reduce((s, e) => s + parseFloat(e.amount), 0);
            } else {
                const weekIdx = WEEKS.indexOf(selectedValue);
                spent = expenseArr.filter(e => {
                    const d = new Date(e.date);
                    if (e.category !== cat.name || d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
                    const dateNum = d.getDate();
                    const startDay = weekIdx * 7 + 1;
                    const endDay = startDay + 6;
                    return dateNum >= startDay && dateNum <= endDay;
                }).reduce((s, e) => s + parseFloat(e.amount), 0);
            }

            const pct = baselineBudget > 0 ? (spent / baselineBudget) * 100 : 0;
            return { name: cat.name, color: cat.color, pct: pct, spent: spent };
        });

        const legend = donutLayout.querySelector(".donut-legend");
        if (legend) {
            legend.innerHTML = categoryStats.sort((a, b) => b.pct - a.pct).slice(0, 4).map(stat => `
                <div class="legend-row">
                    <div class="legend-label">
                        <span class="dot" style="background: var(--${stat.color || 'primary'})"></span>
                        ${stat.name}
                    </div>
                    <span class="legend-pct">${Math.round(stat.pct)}%</span>
                </div>
            `).join('');
        }

        const svg = donutLayout.querySelector("svg");
        const centerText = donutLayout.querySelector(".donut-center span");
        if (svg) {
            let cumulativeOffset = 0;
            let svgHtml = `<circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--surface-variant)" stroke-width="4"></circle>`;
            const sortedStats = [...categoryStats].sort((a, b) => b.pct - a.pct);
            sortedStats.forEach(stat => {
                if (stat.pct > 0) {
                    const displayPct = Math.min(stat.pct, 100 - cumulativeOffset);
                    if (displayPct > 0) {
                        svgHtml += `
                            <circle cx="18" cy="18" r="16" fill="transparent" 
                                    stroke="var(--${stat.color || 'primary'})" 
                                    stroke-width="4"
                                    stroke-dasharray="${displayPct} 100" 
                                    stroke-dashoffset="-${cumulativeOffset}"
                                    style="transition: stroke-dashoffset 0.5s ease;"></circle>
                        `;
                        cumulativeOffset += displayPct;
                    }
                }
            });
            svg.innerHTML = svgHtml;
            const totalConsumedPct = categoryStats.reduce((s, c) => s + c.pct, 0);
            if (centerText) centerText.textContent = `${Math.round(totalConsumedPct)}%`;
        }
    }

    /**
     * Updates the spending patterns section (Mini analytics)
     */
    function updateSpendingPatterns(currentTotal, previousTotal, mode) {
        const patternsGrid = document.querySelector(".patterns-grid");
        if (!patternsGrid) return;

        // 1. Most Expensive Day
        const currentSelection = viewBtn.textContent;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let filteredExpenses = [];
        let previousFiltered = [];
        let daysInPeriod = 1;
        let prevDaysInPeriod = 1;

        if (mode === "overall") {
            filteredExpenses = expenseArr;
            const uniqueDays = new Set(expenseArr.map(e => e.date)).size;
            daysInPeriod = uniqueDays || 1;
        } else if (mode === "lastYear") {
            const mIdx = MONTHS.indexOf(currentSelection);
            filteredExpenses = expenseArr.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === mIdx && d.getFullYear() === currentYear;
            });
            previousFiltered = expenseArr.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === mIdx && d.getFullYear() === (currentYear - 1);
            });
            daysInPeriod = new Date(currentYear, mIdx + 1, 0).getDate();
            prevDaysInPeriod = new Date(currentYear - 1, mIdx + 1, 0).getDate();
        } else {
            const weekIdx = WEEKS.indexOf(currentSelection);
            const getWeekExp = (y, m, w) => expenseArr.filter(e => {
                const d = new Date(e.date);
                if (d.getMonth() !== m || d.getFullYear() !== y) return false;
                const dateNum = d.getDate();
                const start = w * 7 + 1;
                const end = start + 6;
                return dateNum >= start && dateNum <= end;
            });
            filteredExpenses = getWeekExp(currentYear, currentMonth, weekIdx);
            
            let pm = currentMonth - 1, py = currentYear;
            if (pm < 0) { pm = 11; py--; }
            previousFiltered = getWeekExp(py, pm, weekIdx);
            
            daysInPeriod = 7;
            prevDaysInPeriod = 7;
        }

        // Calculation: Most Expensive Day
        const daySums = {};
        filteredExpenses.forEach(e => {
            daySums[e.date] = (daySums[e.date] || 0) + parseFloat(e.amount);
        });
        let maxDay = "N/A", maxAmount = 0;
        Object.entries(daySums).forEach(([date, sum]) => {
            if (sum > maxAmount) { maxAmount = sum; maxDay = date; }
        });

        // Calculation: Average Daily Spend
        const currentAvg = currentTotal / daysInPeriod;
        const previousAvg = previousTotal / prevDaysInPeriod;
        let changePct = 0;
        if (previousAvg > 0) {
            changePct = ((currentAvg - previousAvg) / previousAvg) * 100;
        }

        // Calculation: Peak Hour
        const hourBins = Array(24).fill(0);
        filteredExpenses.forEach(e => {
            if (e.createdAt) {
                const hour = new Date(e.createdAt).getHours();
                hourBins[hour] += parseFloat(e.amount);
            }
        });
        let peakHour = 0, peakHourAmount = 0;
        hourBins.forEach((amt, h) => {
            if (amt > peakHourAmount) { peakHourAmount = amt; peakHour = h; }
        });

        // Update DOM
        const cols = patternsGrid.querySelectorAll(".pattern-mini");
        
        // Col 1: Most Expensive
        if (cols[0]) {
            cols[0].querySelector(".mini-row span:first-child").textContent = maxDay === "N/A" ? "No Data" : new Date(maxDay).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
            cols[0].querySelector(".mini-row span:last-child").textContent = `$${maxAmount.toFixed(0)}`;
            const bar = cols[0].querySelector(".mini-bar-fill");
            if (bar) bar.style.width = maxAmount > 0 ? "100%" : "0%";
        }

        // Col 2: Average
        if (cols[1]) {
            cols[1].querySelector(".mini-value").textContent = `$${currentAvg.toFixed(2)}`;
            const changeLabel = cols[1].querySelector(".mini-change");
            const direction = changePct >= 0 ? "increase" : "decrease";
            const contextStr = mode === "lastYear" ? "last year" : "last month";
            changeLabel.textContent = `${Math.abs(changePct).toFixed(0)}% ${direction} vs ${contextStr}`;
            changeLabel.style.color = changePct > 0 ? "var(--coral)" : "var(--green)";
        }

        // Col 3: Peak
        if (cols[2]) {
            const peakText = `${peakHour}:00 - ${peakHour + 1}:00`;
            cols[2].querySelector(".mini-time span:last-child").textContent = peakHourAmount > 0 ? peakText : "No Data";
            cols[2].querySelector(".mini-caption").textContent = peakHourAmount > 0 ? `Highest volume: $${peakHourAmount.toFixed(0)}` : "Start logging to see patterns";
        }
    }

    /**
     * Populates the view filter based on selected mode
     */
    function updateViewFilterOptions() {
        viewMenu.innerHTML = "";
        
        if (currentMode === "overall") {
            viewDropdown.style.opacity = "0.5";
            viewDropdown.style.pointerEvents = "none";
            viewBtn.textContent = "All Time";
            updateHealthScore();
            return;
        } else {
            viewDropdown.style.opacity = "1";
            viewDropdown.style.pointerEvents = "auto";
        }

        const data = currentMode === "lastYear" ? MONTHS : WEEKS;
        
        data.forEach((name, index) => {
            const item = document.createElement("a");
            item.href = "#";
            item.textContent = name;
            item.dataset.value = index + 1;
            item.addEventListener("click", (e) => {
                e.preventDefault();
                viewBtn.textContent = name;
                viewMenu.classList.remove("show");
                updateHealthScore();
            });
            viewMenu.appendChild(item);
        });

        // Default value
        if (currentMode === "lastYear") {
            const m = new Date().getMonth();
            viewBtn.textContent = MONTHS[m];
        } else {
            viewBtn.textContent = "Week 1";
        }

        updateHealthScore();
    }

    // Comparison Mode selection
    compareMenu.querySelectorAll("a").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const val = item.dataset.value;
            const text = item.textContent;
            
            if (val !== currentMode) {
                currentMode = val;
                compareBtn.textContent = text;
                updateViewFilterOptions();
            }
            compareMenu.classList.remove("show");
        });
    });

    // Close on click outside
    document.addEventListener("click", () => {
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    });

    // Setup
    setupDropdown(compareDropdown);
    setupDropdown(viewDropdown);
    updateViewFilterOptions();
});
