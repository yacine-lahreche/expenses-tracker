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
    
    // Ensure "Uncategorized" safety
    if (!categoryArr.some(c => c.name.toLowerCase() === "uncategorized")) {
        categoryArr.unshift({ name: "Uncategorized", budget: "0.00", color: "cyan" });
        localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
    }

    const currentSelection = SELECTORS.catBtn.textContent.trim();
    SELECTORS.catMenu.innerHTML = categoryArr.map(cat => `
        <a href="#"><span class="dot"></span>${cat.name}</a>
    `).join('');

    // Reset if selected category was deleted elsewhere
    if (currentSelection !== "Choose category..." && !categoryArr.some(c => c.name === currentSelection)) {
        SELECTORS.catBtn.textContent = "Choose category...";
        SELECTORS.catBtn.classList.remove("selected");
    }
}

// --- Initialization & Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    refreshCategoryDropdown();

    // 1. DROPDOWN DELEGATION
    SELECTORS.catBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        SELECTORS.catMenu.classList.toggle("show");
    });

    SELECTORS.catMenu?.addEventListener("click", (e) => {
        const target = e.target.closest("a");
        if (!target) return;
        e.preventDefault();
        
        const val = target.textContent.trim();
        SELECTORS.catBtn.textContent = val;
        SELECTORS.catBtn.classList.add("selected");
        SELECTORS.catMenu.classList.remove("show");
    });

    // 2. INPUT BEHAVIOR
    SELECTORS.date?.addEventListener("change", (e) => {
        e.target.classList.toggle("selected", !!e.target.value);
    });

    SELECTORS.amount?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9.]/g, ''); 
        const parts = value.split('.');
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
        e.target.value = value;
    });

    // Close logic
    window.addEventListener("click", () => {
        document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
    });

    // 3. SUBMISSION
    SELECTORS.submit?.addEventListener("click", () => {
        const amount = SELECTORS.amount.value.trim();
        const date = SELECTORS.date.value;
        const merchant = SELECTORS.merchant.value.trim();
        const category = SELECTORS.catBtn.textContent.trim();

        // Validation
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert("Please enter a valid expense amount.");
            return;
        }
        if (category === "Choose category...") {
            alert("Selecting a category is mandatory.");
            return;
        }
        if (!date) {
            alert("Please select a date.");
            return;
        }

        const newTransaction = {
            id: Date.now(),
            amount: parseFloat(amount).toFixed(2),
            category: category,
            merchant: merchant || "Unknown",
            date: date,
            notes: SELECTORS.notes.value.trim(),
            createdAt: new Date().toISOString()
        };

        expenseArr.push(newTransaction);
        localStorage.setItem("expenseArr", JSON.stringify(expenseArr));  

        alert("Expense added successfully!");
        window.location.href = "../expenses/index.html"; 
    });

    // Sync if focus returns (user might have edited categories in another tab)
    window.addEventListener("focus", refreshCategoryDropdown);
});
