/**
 * Catalyst Budget Module Logic
 * Standardized data synchronization and high-fidelity rendering
 */

// --- Constants & Global State ---
const HEX_MAP = {
    cyan: "#74e8ff",
    green: "#11efb4",
    coral: "#ff7975",
    amber: "#ffb86c",
    violet: "#bd93f9"
};

const TEXT_MAP = {
    cyan: "Cyan Blue",
    green: "Emerald Green",
    coral: "Coral Red",
    amber: "Amber Gold",
    violet: "Royal Violet"
};

const ICON_MAP = {
    'housing': 'home',
    'food': 'restaurant',
    'entertainment': 'movie',
    'transportation': 'directions_car',
    'utilities': 'bolt',
    'shopping': 'shopping_bag',
    'health': 'health_and_safety',
    'travel': 'flight',
    'uncategorized': 'category'
};

let expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
let currentTimePeriod = 'monthly';
let editingCategoryName = null;

// Select Modal Elements
const addCategoryModal = document.getElementById("addCategoryModal");
const editCategoryModal = document.getElementById("categoryModalOverlay");
const closeBtns = document.querySelectorAll(".close");
const createBtn = document.getElementById("createBtn");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");

// --- Data Layer Helpers ---
function saveData() {
    localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
}

function ensureUncategorized() {
    if (!categoryArr.some(c => c.name.toLowerCase() === "uncategorized")) {
        categoryArr.unshift({ name: "Uncategorized", budget: "0.00", color: "cyan" });
        saveData();
    }
}

function refreshData() {
    expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
    ensureUncategorized();
}

/**
 * Filters expenses for the current month and year
 */
function getMonthlyExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenseArr.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
}

/**
 * Returns color based on spending percentage
 */
function getZoneColor(percent) {
    if (percent < 60) return "var(--budget-secondary)";
    if (percent <= 80) return "#ffb86c"; // Warning Amber
    return "var(--budget-error)";
}

// --- Status & Icon Helpers ---
function getStatusLabel(spent, budget) {
    const b = parseFloat(budget);
    if (b <= 0) return { label: "NO BUDGET", class: "status-warning", color: "var(--budget-outline)" };
    const percent = (spent / b) * 100;
    
    if (percent < 60) return { label: "SAFE ZONE", class: "status-safe", color: "var(--budget-secondary)" };
    if (percent <= 80) return { label: "APPROACHING LIMIT", class: "status-warning", color: "#ffb86c" };
    return { label: "OVER BUDGET", class: "status-danger", color: "var(--budget-error)" };
}

function getCategoryIcon(name) {
    return ICON_MAP[name.toLowerCase()] || 'category';
}

// --- UI Rendering ---

/**
 * Updates the summary card at the top of the page
 */
function updateSummary() {
    const monthlyExpenses = getMonthlyExpenses();
    const totalBudget = categoryArr.reduce((sum, cat) => sum + parseFloat(cat.budget || 0), 0);
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const percent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100).toFixed(1) : 0;

    // Update Text Elements
    const elements = {
        '.stat-primary': `$${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        '.stat-secondary': `$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        '.stat-neutral': `$${totalRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        '.progress-label': `${percent}% Spent`
    };

    Object.entries(elements).forEach(([selector, val]) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = val;
    });

    // Update Progress Bar
    const progressBar = document.querySelector('.summary-card .progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.style.background = getZoneColor(percent);
    }
}

/**
 * Renders individual category progress cards
 */
function renderCategoryCards() {
    const grid = document.querySelector('.category-grid');
    if (!grid) return;

    const addCard = grid.querySelector('.add-card');
    grid.innerHTML = '';

    const monthlyExpenses = getMonthlyExpenses();

    // PERFORMANCE: Pre-aggregate spending by category to avoid O(N*M) complexity
    const spendingMap = monthlyExpenses.reduce((acc, exp) => {
        const cat = exp.category.toLowerCase();
        acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
        return acc;
    }, {});

    categoryArr.forEach((cat) => {
        const spent = spendingMap[cat.name.toLowerCase()] || 0;
        const status = getStatusLabel(spent, cat.budget);
        const percent = cat.budget > 0 ? Math.min((spent / cat.budget) * 100, 100) : 0;
        const isOver = spent > parseFloat(cat.budget) && parseFloat(cat.budget) > 0;
        const catColor = HEX_MAP[cat.color] || cat.color || "#22d3ee";

        const card = document.createElement('div');
        card.className = 'glass-panel category-card';
        card.innerHTML = `
      <div class="card-header">
        <div class="category-icon" style="background: ${catColor}33; color: ${catColor};">
          <span class="material-symbols-outlined">${getCategoryIcon(cat.name)}</span>
        </div>
        <button class="btn-edit" data-name="${cat.name}">
          <span class="material-symbols-outlined">edit</span>
        </button>
      </div>
      <h3 class="card-title">${cat.name}</h3>
      <div class="card-status">
        <span class="badge-status ${status.class}">${status.label}</span>
      </div>
      <div class="card-stats">
        <span class="spent-val ${isOver ? 'danger' : ''}">$${spent.toLocaleString()}</span>
        <span class="budget-val">/ $${parseFloat(cat.budget).toLocaleString()}</span>
      </div>
      <div class="card-progress">
        <div class="progress-fill" style="background: ${status.color}; width: ${percent}%;"></div>
      </div>
    `;
        grid.appendChild(card);
    });

    if (addCard) grid.appendChild(addCard);

    // Event Delegation: Re-attach edit listeners
    grid.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(e.currentTarget.dataset.name);
        });
    });
}

/**
 * Handles pulse chart logic for Weekly/Monthly/Yearly views
 */
function renderChart(period = 'monthly') {
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

// --- Dropdown Logic ---
function setupDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return { btn: null };
    const btn = dropdown.querySelector(".dropdown-btn");
    const menu = dropdown.querySelector(".dropdown-menu");

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m !== menu && m.classList.remove("show"));
        menu.classList.toggle("show");
    });

    menu.querySelectorAll("a").forEach(option => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            const { color, hex } = option.dataset;
            btn.querySelector(".mini-dot").style.background = hex;
            btn.querySelector("span:not(.mini-dot)").textContent = option.textContent.trim();
            btn.dataset.color = color;
            menu.classList.remove("show");
        });
    });
    return { btn };
}

let addColorDropdown, editColorDropdown;

// --- Modal Logic ---
function openAddModal() {
    addCategoryModal.classList.add("show");
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryBudget").value = "";
    addColorDropdown.btn.querySelector(".mini-dot").style.background = HEX_MAP.cyan;
    addColorDropdown.btn.querySelector("span:not(.mini-dot)").textContent = TEXT_MAP.cyan;
    addColorDropdown.btn.dataset.color = "cyan";
}

function openEditModal(name) {
    const category = categoryArr.find(c => c.name === name);
    if (!category) return;

    editingCategoryName = name;
    document.getElementById("editCategoryName").value = category.name;
    document.getElementById("editCategoryBudget").value = category.budget;
    
    const btn = editColorDropdown.btn;
    btn.querySelector(".mini-dot").style.background = HEX_MAP[category.color] || HEX_MAP.cyan;
    btn.querySelector("span:not(.mini-dot)").textContent = TEXT_MAP[category.color] || TEXT_MAP.cyan;
    btn.dataset.color = category.color || "cyan";

    const isUncategorized = name.toLowerCase() === "uncategorized";
    deleteCategoryBtn.style.display = isUncategorized ? "none" : "grid";
    const actionGrid = document.querySelector(".mini-grid-2");
    if (actionGrid) actionGrid.style.gridTemplateColumns = isUncategorized ? "1fr" : "1fr 1fr";

    editCategoryModal.classList.add("show");
}

function closeModals() {
    addCategoryModal.classList.remove("show");
    editCategoryModal.classList.remove("show");
}

// --- persistence & Form Actions ---
createBtn?.addEventListener("click", () => {
    const name = document.getElementById("categoryName").value.trim();
    const budget = document.getElementById("categoryBudget").value.trim();
    const color = addColorDropdown.btn.dataset.color || "cyan";

    if (!name || !budget || isNaN(budget) || parseFloat(budget) <= 0) {
        alert("Please provide a valid name and positive budget.");
        return;
    }
    if (categoryArr.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert("Category already exists.");
        return;
    }

    categoryArr.push({ name, budget: parseFloat(budget).toFixed(2), color });
    saveData();
    closeModals();
    init();
});

saveCategoryBtn?.addEventListener("click", () => {
    const newName = document.getElementById("editCategoryName").value.trim();
    const newBudget = document.getElementById("editCategoryBudget").value.trim();
    const newColor = editColorDropdown.btn.dataset.color || "cyan";

    if (!newName || !newBudget || isNaN(newBudget) || parseFloat(newBudget) <= 0) {
        alert("Invalid input.");
        return;
    }

    const index = categoryArr.findIndex(c => c.name === editingCategoryName);
    if (index === -1) return;

    if (newName !== editingCategoryName) {
        expenseArr.forEach(exp => { if (exp.category === editingCategoryName) exp.category = newName; });
        localStorage.setItem("expenseArr", JSON.stringify(expenseArr));
    }

    categoryArr[index] = { name: newName, budget: parseFloat(newBudget).toFixed(2), color: newColor };
    saveData();
    closeModals();
    init();
});

deleteCategoryBtn?.addEventListener("click", () => {
    const count = expenseArr.filter(exp => exp.category === editingCategoryName).length;
    if (confirm(`Delete "${editingCategoryName}"? (${count} expenses will move to Uncategorized)`)) {
        expenseArr.forEach(exp => { if (exp.category === editingCategoryName) exp.category = "Uncategorized"; });
        localStorage.setItem("expenseArr", JSON.stringify(expenseArr));
        categoryArr = categoryArr.filter(c => c.name !== editingCategoryName);
        saveData();
        closeModals();
        init();
    }
});

function init() {
    refreshData();
    updateSummary();
    renderCategoryCards();
    renderChart(currentTimePeriod);
}

// --- Lifecycle ---
document.addEventListener('DOMContentLoaded', () => {
    addColorDropdown = setupDropdown("addCategoryColorDropdown");
    editColorDropdown = setupDropdown("editCategoryColorDropdown");
    init();

    window.addEventListener("click", (e) => {
        if (e.target === addCategoryModal || e.target === editCategoryModal) closeModals();
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    });

    closeBtns.forEach(btn => btn.addEventListener("click", closeModals));
    document.querySelector('.add-card')?.addEventListener('click', openAddModal);
    document.querySelector('.btn-reset')?.addEventListener('click', () => {
        if (confirm("Reset current data?")) {
            expenseArr = [];
            localStorage.setItem("expenseArr", "[]");
            init();
        }
    });

    // Time Period Tabs
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTimePeriod = e.target.textContent.toLowerCase();
            renderChart(currentTimePeriod);
        });
    });

    window.addEventListener("visibilitychange", () => document.visibilityState === "visible" && init());
});
