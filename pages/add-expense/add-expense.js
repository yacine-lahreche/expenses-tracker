import { BudgetEngine } from "../../js/budget-engine.js";
import Toast from "../../js/toast.js";

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
            return '<a href="#"><span class="dot" style="background: var(--' + cat.color + ')"></span>' + cat.name + '</a>';
        }).join('');
    }

    if (SELECTORS.catBtn && currentSelection !== "Choose category..." && !categoryArr.some(c => c.name === currentSelection)) {
        SELECTORS.catBtn.textContent = "Choose category...";
        SELECTORS.catBtn.classList.remove("selected");
    }
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
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        SELECTORS.date.value = today;
        SELECTORS.date.classList.add("selected");

        SELECTORS.date.addEventListener("change", (e) => {
            e.target.classList.toggle("selected", !!e.target.value);
        });
    }

    if (SELECTORS.amount) {
        SELECTORS.amount.focus();
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

    // SUBMISSION
    if (SELECTORS.submit) {
        SELECTORS.submit.addEventListener("click", () => {
            const amount = SELECTORS.amount.value.trim();
            const dateVal = SELECTORS.date.value;
            const merchant = SELECTORS.merchant.value.trim();
            const category = SELECTORS.catBtn.textContent.trim();

            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) { 
                Toast.show("Please enter a valid expense amount.", "error"); 
                return; 
            }
            if (category === "Choose category...") { 
                Toast.show("Selecting a category is mandatory.", "error"); 
                return; 
            }
            if (!dateVal) { 
                Toast.show("Please select a valid date.", "error"); 
                return; 
            }

            const dateObj = new Date(dateVal);
            if (isNaN(dateObj.getTime())) { 
                Toast.show("Invalid date format.", "error"); 
                return; 
            }
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
            
            // Trigger notification scan via the shared engine
            BudgetEngine.checkBudgetNotifications(newTransaction, category);
            refreshCategoryDropdown();

            Toast.show("Expense added successfully!", "success");
            
            // Small delay so user sees the success toast
            setTimeout(() => {
                window.location.href = "../expenses/index.html"; 
            }, 1000);
        });
    }

    window.addEventListener("focus", refreshCategoryDropdown);
});

