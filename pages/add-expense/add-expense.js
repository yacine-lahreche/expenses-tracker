/**
 * Catalyst Add-Expense Logic
 * Streamlined transaction entry with robust validation
 */

// --- Constants & Global State ---
const SELECTORS = {
    amount: document.querySelector(".amount-input"),
    date: document.querySelector("#dateInput"),
    merchant: document.querySelector("#merchantInput"),
    notes: document.querySelector("#notesInput"),
    submit: document.querySelector("#add-expense-btn"),
    catBtn: document.querySelector('.field-wrap .dropdown .dropdown-btn'),
    catMenu: document.querySelector('.field-wrap .dropdown .dropdown-menu')
};

let expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];

// --- Data Layer ---
function refreshCategoryDropdown() {
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
    
    if (!categoryArr.some(c => c.name.toLowerCase() === "uncategorized")) {
        categoryArr.unshift({ name: "Uncategorized", budget: "0.00", color: "cyan" });
        localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
    }

    const currentSelection = SELECTORS.catBtn ? SELECTORS.catBtn.textContent.trim() : "";
    if(SELECTORS.catMenu) {
        SELECTORS.catMenu.innerHTML = categoryArr.map(function(cat) {
            return '<a href="#"><span class="dot"></span>' + cat.name + '</a>';
        }).join('');
    }

    if (SELECTORS.catBtn && currentSelection !== "Choose category..." && !categoryArr.some(c => c.name === currentSelection)) {
        SELECTORS.catBtn.textContent = "Choose category...";
        SELECTORS.catBtn.classList.remove("selected");
    }
}

// --- NOTIFICATION ENGINE HELPER FUNCTIONS ---
function getWeeklyExpenses(expenses) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000 + 86399999);
    
    return expenses.filter(ex => {
        const [y, m, d] = ex.date.split('-');
        const exDate = new Date(y, m-1, d);
        return exDate >= startOfWeek && exDate <= endOfWeek;
    });
}

function getMonthlyExpenses(expenses) {
    const now = new Date();
    return expenses.filter(ex => {
        const [y, m, d] = ex.date.split('-');
        const exDate = new Date(y, m-1, d);
        return exDate.getMonth() === now.getMonth() && exDate.getFullYear() === now.getFullYear();
    });
}

function getYearlyExpenses(expenses) {
    const now = new Date();
    return expenses.filter(ex => {
        const [y, m, d] = ex.date.split('-');
        const exDate = new Date(y, m-1, d);
        return exDate.getFullYear() === now.getFullYear();
    });
}

function getCategoryMonthlyBudget(categoryName, categories) {
    const cat = categories.find(c => c.name === categoryName);
    return cat ? parseFloat(cat.budget || 0) : 0;
}

function getCategoryWeeklyBudget(categoryName, categories) {
    return getCategoryMonthlyBudget(categoryName, categories) / 4.33;
}

function getCategoryYearlyBudget(categoryName, categories) {
    return getCategoryMonthlyBudget(categoryName, categories) * 12;
}

// --- MAIN NOTIFICATION LOGIC ---
function checkBudgetNotifications(newTransaction, category) {
    console.log('checkBudgetNotifications called with:', newTransaction);
    let notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];
    let expenses = JSON.parse(localStorage.getItem('expenseArr')) || [];
    let categories = JSON.parse(localStorage.getItem('categoryArr')) || [];
    
    const weeklyExp = getWeeklyExpenses(expenses);
    const monthlyExp = getMonthlyExpenses(expenses);
    const yearlyExp = getYearlyExpenses(expenses);

    const sumAmounts = (arr) => arr.reduce((s, e) => s + parseFloat(e.amount), 0);
    const sumCatAmounts = (arr, cat) => arr.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.amount), 0);
    
    const weeklyTotal = sumAmounts(weeklyExp);
    const monthlyTotal = sumAmounts(monthlyExp);
    const yearlyTotal = sumAmounts(yearlyExp);

    const catWeeklyTotal = sumCatAmounts(weeklyExp, category);
    const catMonthlyTotal = sumCatAmounts(monthlyExp, category);
    const catYearlyTotal = sumCatAmounts(yearlyExp, category);

    const totalMonthlyBudget = categories.reduce((s, c) => s + parseFloat(c.budget || 0), 0);
    const totalWeeklyBudget = totalMonthlyBudget / 4.33;
    const totalYearlyBudget = totalMonthlyBudget * 12;

    const catWeeklyBudget = getCategoryWeeklyBudget(category, categories);
    const catMonthlyBudget = getCategoryMonthlyBudget(category, categories);
    const catYearlyBudget = getCategoryYearlyBudget(category, categories);

    console.log("--- [Category: " + category + "] Budget Engine Values ---");
    console.log("Weekly spent: $" + catWeeklyTotal + " vs Budget: $" + catWeeklyBudget.toFixed(2) + " | Exceeded?", catWeeklyTotal > catWeeklyBudget);
    console.log("Monthly spent: $" + catMonthlyTotal + " vs Budget: $" + catMonthlyBudget.toFixed(2) + " | Exceeded?", catMonthlyTotal > catMonthlyBudget);
    console.log("Yearly spent: $" + catYearlyTotal + " vs Budget: $" + catYearlyBudget.toFixed(2) + " | Exceeded?", catYearlyTotal > catYearlyBudget);
    
    console.log("--- [Overall Global] Budget Engine Values ---");
    console.log("Weekly total: $" + weeklyTotal + " vs Budget: $" + totalWeeklyBudget.toFixed(2) + " | Exceeded?", weeklyTotal > totalWeeklyBudget);
    console.log("Monthly total: $" + monthlyTotal + " vs Budget: $" + totalMonthlyBudget.toFixed(2) + " | Exceeded?", monthlyTotal > totalMonthlyBudget);
    console.log("Yearly total: $" + yearlyTotal + " vs Budget: $" + totalYearlyBudget.toFixed(2) + " | Exceeded?", yearlyTotal > totalYearlyBudget);

    const createNotification = (type, message, period) => {
        console.log('Creating notification:', message);
        const oneHourAgo = new Date(Date.now() - 3600000);
        const isDuplicate = notifications.some(n => 
            n.message === message && 
            n.period === period && 
            new Date(n.time) > oneHourAgo
        );
        
        if (!isDuplicate) {
            notifications.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                type: type, 
                message: message,
                time: new Date().toISOString(),
                category: category,
                period: period,
                read: false
            });
            console.log('Notification pushed to payload list.');
        } else {
            console.log('Notification blocked (duplicate within 1 hr).');
        }
    };

    if (catMonthlyBudget > 0) {
        if (catWeeklyTotal > catWeeklyBudget) {
            createNotification('budget_exceeded', category + " weekly budget exceeded by $" + (catWeeklyTotal - catWeeklyBudget).toFixed(2), 'weekly');
        }
        if (catMonthlyTotal > catMonthlyBudget) {
            createNotification('budget_exceeded', category + " monthly budget exceeded by $" + (catMonthlyTotal - catMonthlyBudget).toFixed(2), 'monthly');
        }
        if (catYearlyTotal > catYearlyBudget) {
            createNotification('budget_exceeded', category + " yearly budget exceeded by $" + (catYearlyTotal - catYearlyBudget).toFixed(2), 'yearly');
        }
    }

    if (totalMonthlyBudget > 0) {
        if (weeklyTotal > totalWeeklyBudget) {
            createNotification('overall_budget_exceeded', "Overall weekly budget exceeded by $" + (weeklyTotal - totalWeeklyBudget).toFixed(2), 'weekly');
        }
        if (monthlyTotal > totalMonthlyBudget) {
            createNotification('overall_budget_exceeded', "Overall monthly budget exceeded by $" + (monthlyTotal - totalMonthlyBudget).toFixed(2), 'monthly');
        }
        if (yearlyTotal > totalYearlyBudget) {
            createNotification('overall_budget_exceeded', "Overall yearly budget exceeded by $" + (yearlyTotal - totalYearlyBudget).toFixed(2), 'yearly');
        }
    }

    localStorage.setItem('notificationsArr', JSON.stringify(notifications));
    console.log('Notification Engine Final Save Executed. Full Arr:', JSON.parse(localStorage.getItem('notificationsArr')));
}

// --- Initialization & Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    refreshCategoryDropdown();

    if (SELECTORS.catBtn) {
        SELECTORS.catBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(SELECTORS.catMenu) SELECTORS.catMenu.classList.toggle("show");
        });
    }

    if (SELECTORS.catMenu) {
        SELECTORS.catMenu.addEventListener("click", (e) => {
            const target = e.target.closest("a");
            if (!target) return;
            e.preventDefault();
            
            const val = target.textContent.trim();
            SELECTORS.catBtn.textContent = val;
            SELECTORS.catBtn.classList.add("selected");
            SELECTORS.catMenu.classList.remove("show");
        });
    }

    if (SELECTORS.date) {
        SELECTORS.date.addEventListener("change", (e) => {
            e.target.classList.toggle("selected", !!e.target.value);
        });
    }

    if (SELECTORS.amount) {
        SELECTORS.amount.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9.]/g, ''); 
            const parts = value.split('.');
            if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
            e.target.value = value;
        });
    }

    window.addEventListener("click", () => {
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    });

    // 3. SUBMISSION
    if (SELECTORS.submit) {
        SELECTORS.submit.addEventListener("click", () => {
            const amount = SELECTORS.amount.value.trim();
            const dateVal = SELECTORS.date.value;
            const merchant = SELECTORS.merchant.value.trim();
            const category = SELECTORS.catBtn.textContent.trim();

            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) { alert("Please enter a valid expense amount."); return; }
            if (category === "Choose category...") { alert("Selecting a category is mandatory."); return; }
            if (!dateVal) { alert("Please select a valid date."); return; }

            const dateObj = new Date(dateVal);
            if (isNaN(dateObj.getTime())) { alert("Invalid date format."); return; }
            const formattedDate = dateObj.toISOString().split('T')[0];

            const newTransaction = {
                id: Date.now(),
                amount: parseFloat(amount).toFixed(2),
                category: category,
                merchant: merchant || "Unknown",
                date: formattedDate, 
                notes: SELECTORS.notes.value.trim(),
                createdAt: new Date().toISOString()
            };

            let currentExpenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
            currentExpenseArr.push(newTransaction);
            localStorage.setItem("expenseArr", JSON.stringify(currentExpenseArr));  
            
            // Trigger notification scan
            checkBudgetNotifications(newTransaction, category);
            refreshCategoryDropdown(); // refresh latest category budget arrays

            alert("Expense added successfully!");
            window.location.href = "../expenses/index.html"; 
        });
    }

    window.addEventListener("focus", refreshCategoryDropdown);
});
