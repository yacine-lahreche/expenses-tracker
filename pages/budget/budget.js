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
 * Filters expenses strictly for the CURRENT month and year.
 * Budgets are monthly constraints, therefore past/future expenses are excluded from these calculations.
 */
function getCurrentMonthExpenses() {
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
    const monthlyExpenses = getCurrentMonthExpenses();
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

    const monthlyExpenses = getCurrentMonthExpenses();

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
 * Renders Dual Line Chart (Actual vs Average) based on category grouping
 */
function renderChart(period = 'monthly') {
    const categories = categoryArr.map(c => c.name);
    if (categories.length === 0) return;

    const now = new Date();
    
    function getWeekRange(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
        return { start, end };
    }

    let startDate, endDate;
    if (period === 'weekly') {
        const r = getWeekRange(now);
        startDate = r.start; endDate = r.end;
    } else if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
        endDate = now;
    } else {
        startDate = new Date(now.getFullYear(), 0, 1); endDate = now;
    }

    // 1. Calculate ACTUAL Spending per Category
    const actualMap = {};
    categories.forEach(c => actualMap[c] = 0);
    expenseArr.filter(ex => {
        const d = new Date(ex.date);
        return d >= startDate && d <= endDate;
    }).forEach(ex => {
        if (actualMap[ex.category] !== undefined) actualMap[ex.category] += parseFloat(ex.amount);
    });

    // 2. Calculate AVERAGE Spending
    const avgMap = {};
    let firstDate = now;
    if(expenseArr.length > 0) {
       firstDate = new Date(Math.min(...expenseArr.map(e => new Date(e.date))));
    }
    const totalDaysRecorded = Math.max(1, (now - firstDate) / (1000*60*60*24));
    
    categories.forEach(c => {
        const total = expenseArr.filter(ex => ex.category === c).reduce((s, e) => s + parseFloat(e.amount), 0);
        const dailyAvg = total / totalDaysRecorded;
        
        let cycleMultiplier = 30; // monthly default
        if (period === 'weekly') cycleMultiplier = 7;
        if (period === 'yearly') cycleMultiplier = 365;
        
        avgMap[c] = dailyAvg * cycleMultiplier;
    });

    // 3. SVG Rendering Logic
    const svg = document.getElementById('spendingLineChart');
    const labelsEl = document.getElementById('spendingChartLabels');
    if (!svg || !labelsEl) return;

    const width = 400, height = 200, padding = 20;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const maxVal = Math.max(...Object.values(actualMap), ...Object.values(avgMap), 100);
    const stepX = chartWidth / (categories.length - 1 || 1);

    const getSmoothPath = (map) => {
        const points = categories.map((cat, i) => {
            const x = padding + (i * stepX);
            const y = (height - padding) - (map[cat] / maxVal) * chartHeight;
            return { x, y };
        });

        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            // Compute horizontal midpoint for tangent smoothing (Monotone Cubic variant)
            const midX = (p1.x + p2.x) / 2;
            d += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
        }
        return d;
    };

    // Safely clear the SVG canvas completely before injecting the new vectors
    svg.innerHTML = '';

    svg.innerHTML = `
        <path d="${getSmoothPath(avgMap)}" class="line-avg" />
        <path d="${getSmoothPath(actualMap)}" class="line-actual" />
        ${categories.map((cat, i) => {
            const x = padding + (i * stepX);
            return `<circle cx="${x}" cy="${(height - padding) - (actualMap[cat] / maxVal) * chartHeight}" r="3" class="dot-actual" />`;
        }).join('')}
    `;

    labelsEl.innerHTML = categories.map(c => `<span>${c}</span>`).join('');
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
            const targetBtn = e.currentTarget;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            
            // Strictly fetch period from data-period datasets (e.g. 'weekly') rather than parsing display text ('Week') 
            currentTimePeriod = targetBtn.dataset.period || targetBtn.textContent.toLowerCase();
            
            // Execute algorithmic pulse plot and completely re-render
            renderChart(currentTimePeriod);
        });
    });

    window.addEventListener("visibilitychange", () => document.visibilityState === "visible" && init());
});
