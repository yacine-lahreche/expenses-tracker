/**
 * Catalyst Expenses Module Logic
 * Efficient searching, filtering, and transaction management
 */

// --- Constants & Global State ---
const ROWS_CONTAINER = document.querySelector(".rows");
const HEADLINE = document.querySelector(".headline-meta");
const SEARCH_BOX = document.querySelector(".search-box");
const DATE_INPUT = document.getElementById("dateInput");
const SORT_BTN = document.querySelector(".sort-btn");
const SORT_MENU = document.querySelector(".sort-menu");

// State
let expenseArr = [];
let categoryArr = [];
let currentEditId = null;

// --- Data Layer ---
function refreshData() {
    expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
    
    // Safety check for Uncategorized
    if (!categoryArr.some(c => c.name.toLowerCase() === "uncategorized")) {
        categoryArr.unshift({ name: "Uncategorized", budget: "0.00", color: "cyan" });
        localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
    }
}

function saveData() {
    localStorage.setItem("expenseArr", JSON.stringify(expenseArr));
    localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
}

// --- UI Helpers ---
function updateHeadline(count) {
    if (!HEADLINE) return;
    HEADLINE.textContent = count === 0 
        ? "No expenses processed this month" 
        : `${count} expense${count === 1 ? '' : 's'} processed this month`;
}

/**
 * Syncs all category dropdowns in the view (Filter & Edit Modal)
 */
function refreshCategoryDropdowns() {
    refreshData();
    
    const filterMenu = document.querySelector(".controls .dropdown .dropdown-menu");
    const editMenu = document.querySelector("#editCategoryDropdown .dropdown-menu");
    const filterBtn = document.querySelector(".controls .dropdown .dropdown-btn");

    if (filterMenu) {
        filterMenu.innerHTML = '<a href="#" data-filter="all"><span class="dot"></span>All Categories</a>';
        categoryArr.forEach(cat => {
            const a = document.createElement("a");
            a.href = "#";
            a.innerHTML = `<span class="dot"></span>${cat.name}`;
            filterMenu.appendChild(a);
        });

        // Reset if selected category was deleted
        const currentFilter = filterBtn?.textContent.trim();
        if (currentFilter !== "All Categories" && !categoryArr.some(c => c.name === currentFilter)) {
            if (filterBtn) {
                filterBtn.textContent = "All Categories";
                filterBtn.classList.remove("selected");
            }
        }
    }

    if (editMenu) {
        editMenu.innerHTML = "";
        categoryArr.forEach(cat => {
            const a = document.createElement("a");
            a.href = "#";
            a.innerHTML = `<span class="dot"></span>${cat.name}`;
            editMenu.appendChild(a);
        });
    }
}

// --- Core Engine: Filter & Render ---
function filterAndRender() {
    refreshData();
    
    const searchTerm = SEARCH_BOX?.value.toLowerCase() || "";
    const filterBtn = document.querySelector(".controls .dropdown .dropdown-btn");
    const selectedCategory = filterBtn?.textContent.trim() || "All Categories";
    const selectedDate = DATE_INPUT?.value || "";
    const sortOrder = SORT_BTN?.textContent.trim() || "Latest";

    let filtered = expenseArr.filter(ex => {
        const matchesCategory = selectedCategory === "All Categories" || ex.category === selectedCategory;
        const matchesSearch = ex.merchant?.toLowerCase().includes(searchTerm);
        const matchesDate = !selectedDate || ex.date === selectedDate;
        return matchesCategory && matchesSearch && matchesDate;
    });

    // Sort Logic (Efficient string/number comparison)
    filtered.sort((a, b) => {
        return sortOrder === "Latest" 
            ? b.date.localeCompare(a.date) || b.id - a.id 
            : a.date.localeCompare(b.date) || a.id - b.id;
    });

    renderTable(filtered);
    updateHeadline(filtered.length);
}

function renderTable(expenses) {
    if (!ROWS_CONTAINER) return;
    
    ROWS_CONTAINER.innerHTML = expenses.length > 0 
        ? expenses.map(ex => `
            <article class="table-row">
                <div class="date">${ex.date}</div>
                <div class="category"><span class="icon"></span>${ex.category}</div>
                <div>
                    <div class="merchant">${ex.merchant || 'Unknown'}</div>
                    <div class="note">${ex.notes || 'No notes'}</div>
                </div>
                <div class="amount red" style="margin:0;">-$${parseFloat(ex.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <div style="display:flex; justify-content:end; align-items:center;">
                    <button class="edit-btn" data-id="${ex.id}">&#9998;</button> 
                    <button class="delete-btn" data-id="${ex.id}">&#128465;</button>
                </div>
            </article>
        `).join('')
        : `<div class="table-row" style="justify-content:center; color: var(--budget-on-surface-variant);">No transactions found matching your filters.</div>`;
}

// --- Modal Logic ---
const editModal = {
    overlay: document.getElementById("editModalOverlay"),
    inputs: {
        amount: document.getElementById("editAmountInput"),
        date: document.getElementById("editDateInput"),
        merchant: document.getElementById("editMerchantInput"),
        notes: document.getElementById("editNotesInput")
    },
    catBtn: document.querySelector("#editCategoryDropdown .dropdown-btn"),

    open(id) {
        const expense = expenseArr.find(ex => ex.id === id);
        if (!expense) return;

        currentEditId = id;
        this.inputs.amount.value = expense.amount;
        this.inputs.date.value = expense.date;
        this.inputs.merchant.value = expense.merchant;
        this.inputs.notes.value = expense.notes;
        this.catBtn.textContent = expense.category;
        this.catBtn.classList.add("selected");
        this.overlay.classList.add("show");
    },

    close() {
        this.overlay.classList.remove("show");
        currentEditId = null;
    }
};

// --- Initialization & Event Delegation ---
document.addEventListener("DOMContentLoaded", () => {
    refreshCategoryDropdowns();
    filterAndRender();

    // 1. EVENT DELEGATION: Rows Container (Edit/Delete)
    ROWS_CONTAINER?.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit-btn");
        const deleteBtn = e.target.closest(".delete-btn");

        if (editBtn) {
            editModal.open(parseInt(editBtn.dataset.id));
        } else if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            if (confirm("Permanently delete this transaction?")) {
                expenseArr = expenseArr.filter(ex => ex.id !== id);
                saveData();
                filterAndRender();
            }
        }
    });

    // 2. SEARCH & FILTERING (Debounced input would be here if needed)
    SEARCH_BOX?.addEventListener("input", filterAndRender);
    DATE_INPUT?.addEventListener("change", filterAndRender);

    // 3. DROPDOWN DELEGATION (Filter & Edit Menus)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".dropdown-btn, .sort-btn");
        
        // Close all if clicking outside
        if (!btn) {
            document.querySelectorAll(".dropdown-menu.show, .sort-menu.show").forEach(m => m.classList.remove("show"));
            return;
        }

        e.preventDefault();
        const menu = btn.nextElementSibling;
        document.querySelectorAll(".dropdown-menu, .sort-menu").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        menu?.classList.toggle("show");
    });

    // Dropdown Items Selection (Delegated)
    document.body.addEventListener("click", (e) => {
        const item = e.target.closest(".dropdown-menu a, .sort-menu a");
        if (!item) return;
        e.preventDefault();

        const menu = item.closest(".dropdown-menu, .sort-menu");
        const btn = menu.previousElementSibling;
        
        if (menu.classList.contains("sort-menu")) {
            btn.textContent = item.textContent.trim();
        } else {
            const val = item.textContent.trim();
            btn.textContent = val;
            btn.classList.toggle("selected", val !== "All Categories" && val !== "Choose category...");
        }

        menu.classList.remove("show");
        filterAndRender();
    });

    // 4. MODAL ACTIONS
    document.getElementById("saveEditBtn")?.addEventListener("click", () => {
        const amount = editModal.inputs.amount.value.trim();
        const category = editModal.catBtn.textContent.trim();
        const merchant = editModal.inputs.merchant.value.trim();
        const date = editModal.inputs.date.value;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || category === "Choose category..." || !merchant || !date) {
            alert("Please fill all mandatory fields with valid data.");
            return;
        }

        const index = expenseArr.findIndex(ex => ex.id === currentEditId);
        if (index !== -1) {
            expenseArr[index] = {
                ...expenseArr[index],
                amount: parseFloat(amount).toFixed(2),
                date,
                merchant,
                category,
                notes: editModal.inputs.notes.value.trim()
            };
            saveData();
            filterAndRender();
            editModal.close();
        }
    });

    document.getElementById("closeEditModal")?.addEventListener("click", () => editModal.close());
    document.getElementById("cancelEditBtn")?.addEventListener("click", () => editModal.close());
    editModal.overlay?.addEventListener("click", (e) => e.target === editModal.overlay && editModal.close());

    // 5. MISC
    document.getElementById("addExpenseBtn")?.addEventListener("click", () => {
        window.location.href = "../add-expense/index.html";
    });

    window.addEventListener("visibilitychange", () => document.visibilityState === "visible" && filterAndRender());
});
