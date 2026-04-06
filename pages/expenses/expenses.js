let expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || []; 
const headline = document.querySelector(".headline-meta"); 

function refreshData() {
    expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
}

function updateHeadline(count) {
    if (!headline) return;
    refreshData(); // Ensure we have latest count
    const totalCount = expenseArr.length;
    switch (count) {
        case 0: headline.textContent = "No expenses processed this month"; break;
        case 1: headline.textContent = "1 expense processed this month"; break;
        default: headline.textContent = `${count} expenses processed this month`; break;
    }
}
refreshData();
updateHeadline(expenseArr.length);

const searchBox = document.querySelector(".search-box");
const dateInput = document.getElementById("dateInput");
const sortBtn = document.querySelector(".sort-btn");
const sortMenu = document.querySelector(".sort-menu");
const filterDropdown = document.querySelector(".controls .dropdown");
const filterBtn = filterDropdown?.querySelector(".dropdown-btn");
const filterMenu = filterDropdown?.querySelector(".dropdown-menu");

const editModalOverlay = document.getElementById("editModalOverlay");
const editCategoryDropdown = document.getElementById("editCategoryDropdown");
const editCategoryBtn = editCategoryDropdown?.querySelector(".dropdown-btn");
const editCategoryMenu = editCategoryDropdown?.querySelector(".dropdown-menu");

const editAmountInput = document.getElementById("editAmountInput");
const editDateInput = document.getElementById("editDateInput");
const editMerchantInput = document.getElementById("editMerchantInput");
const editNotesInput = document.getElementById("editNotesInput");
const closeEditModal = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

let currentEditId = null;

function refreshCategoryDropdowns() {
    refreshData();
    
    // Repopulate Filter Menu
    if (filterMenu) {
        const currentFilter = filterBtn.textContent.trim();
        filterMenu.innerHTML = '<a href="#" data-filter="all"><span class="dot"></span>All Categories</a>'; 
        
        categoryArr.forEach(cat => {
            const a = document.createElement("a");
            a.href = "#";
            a.innerHTML = `<span class="dot"></span>${cat.name}`;
            filterMenu.appendChild(a);
        });

        // Check if current filter still exists
        if (currentFilter !== "All Categories" && !categoryArr.some(c => c.name === currentFilter)) {
            filterBtn.textContent = "All Categories";
            filterBtn.classList.remove("selected");
            filterAndRender();
        }
    }

    // Repopulate Edit Modal Menu
    if (editCategoryMenu) {
        const currentEditCat = editCategoryBtn.textContent.trim();
        editCategoryMenu.innerHTML = "";
        categoryArr.forEach((category) => {
            const option = document.createElement("a");
            option.href = "#";
            option.innerHTML = `<span class="dot"></span>${category.name}`;
            editCategoryMenu.appendChild(option);
        });

        // If current selection is gone, reset
        if (currentEditCat !== "Choose category..." && !categoryArr.some(c => c.name === currentEditCat)) {
            editCategoryBtn.textContent = "Choose category...";
            editCategoryBtn.classList.remove("selected");
        }
    }
}

// Global Filter Engine
function filterAndRender() {
    refreshData();
    const searchTerm = searchBox?.value.toLowerCase() || "";
    const selectedCategory = filterBtn?.textContent.trim() || "All Categories";
    const selectedDate = dateInput?.value || "";
    const sortOrder = sortBtn?.textContent.trim() || "Latest";

    let filtered = [...expenseArr];

    if (selectedCategory !== "All Categories") {
        filtered = filtered.filter(ex => ex.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchTerm) {
        filtered = filtered.filter(ex => 
            ex.merchant?.toLowerCase().includes(searchTerm) || 
            ex.notes?.toLowerCase().includes(searchTerm)
        );
    }
    if (selectedDate) {
        filtered = filtered.filter(ex => ex.date === selectedDate);
    }

    // Sort by Date
    filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "Latest" ? dateB - dateA : dateA - dateB;
    });

    renderExpenses(filtered);
    updateHeadline(filtered.length);
}

function renderExpenses(expenses = expenseArr) {
    const rowsContainer = document.querySelector(".rows");
    if (!rowsContainer) return;
    
    rowsContainer.innerHTML = "";
    
    expenses.forEach((expense) => {
        const article = document.createElement("article");
        article.classList.add("table-row");
        article.innerHTML = `
            <div class="date">${expense.date}</div>
            <div class="category"><span class="icon"></span>${expense.category}</div>
            <div>
                <div class="merchant">${expense.merchant ?? 'Unknown'}</div>
                <div class="note">${expense.notes || 'No notes'}</div>
            </div>
            <div class="amount red" style="margin:0;">-$${expense.amount}</div>
            <div style="display:flex; justify-content:end; align-items:center;">
                <button class="edit-btn" data-id="${expense.id}">&#9998;</button> 
                <button class="delete-btn" data-id="${expense.id}">&#128465;</button>
            </div>
        `;
        rowsContainer.appendChild(article); 
    }); 

    attachEventListeners();
}

function attachEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            refreshCategoryDropdowns(); 
            const id = parseInt(btn.dataset.id);
            const expense = expenseArr.find(ex => ex.id === id);
            if (expense) {
                currentEditId = id;
                editAmountInput.value = expense.amount;
                editDateInput.value = expense.date;
                editMerchantInput.value = expense.merchant;
                editNotesInput.value = expense.notes;
                editCategoryBtn.textContent = expense.category;
                editCategoryBtn.classList.add("selected");
                editModalOverlay.classList.add("show");
            }
        });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this expense?")) {
                const idToDelete = parseInt(btn.dataset.id);
                const index = expenseArr.findIndex((ex) => ex.id === idToDelete);
                if (index !== -1) {
                    expenseArr.splice(index, 1);
                    localStorage.setItem("expenseArr", JSON.stringify(expenseArr));
                    filterAndRender();
                }
            }
        });
    });
}

// Initial Populations & Events
refreshCategoryDropdowns();
filterAndRender();

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        refreshCategoryDropdowns();
        filterAndRender();
    }
});

searchBox?.addEventListener("input", filterAndRender);
dateInput?.addEventListener("change", filterAndRender);

// DELEGATION LOGIC: Filter Dropdown
filterMenu?.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target) return;
    e.preventDefault();

    if (target.dataset.filter === "all") {
        filterBtn.textContent = "All Categories";
        filterBtn.classList.remove("selected");
    } else {
        filterBtn.textContent = target.textContent.trim();
        filterBtn.classList.add("selected");
    }
    filterMenu.classList.remove("show");
    filterAndRender();
});

// Edit Modal Amount Input
editAmountInput?.addEventListener('input', (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, ''); 
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    e.target.value = value;
});

// DELEGATION LOGIC: Edit Modal Dropdown
editCategoryMenu?.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target) return;
    e.preventDefault();

    editCategoryBtn.textContent = target.textContent.trim();
    editCategoryBtn.classList.add("selected");
    editCategoryMenu.classList.remove("show");
});

// Dropdown Toggles
document.querySelectorAll(".dropdown-btn, .sort-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        document.querySelectorAll(".dropdown-menu, .sort-menu").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        if (menu) menu.classList.toggle("show");
    });
});

if (sortMenu) {
    sortMenu.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            sortBtn.textContent = a.textContent.trim();
            sortMenu.classList.remove("show");
            filterAndRender();
        });
    });
}

// Modal closing
const closeModal = () => {
    editModalOverlay.classList.remove("show");
    currentEditId = null;
};

closeEditModal?.addEventListener("click", closeModal);
cancelEditBtn?.addEventListener("click", closeModal);
editModalOverlay?.addEventListener("click", (e) => {
    if (e.target === editModalOverlay) closeModal();
});

// Save Changes
saveEditBtn?.addEventListener("click", () => {
    const amount = editAmountInput.value.trim();
    const date = editDateInput.value;
    const merchant = editMerchantInput.value.trim();
    const category = editCategoryBtn.textContent.trim();
    const notes = editNotesInput.value.trim();

    if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    if (category === "Choose category...") {
        alert("Please select a category.");
        return;
    }
    if (!merchant) {
        alert("Please enter a merchant name.");
        return;
    }
    if (!date) {
        alert("Please select a date.");
        return;
    }

    const index = expenseArr.findIndex(ex => ex.id === currentEditId);
    if (index !== -1) {
        expenseArr[index] = {
            ...expenseArr[index],
            amount: parseFloat(amount).toFixed(2),
            date,
            merchant: merchant || "Unknown",
            category,
            notes
        };
        localStorage.setItem("expenseArr", JSON.stringify(expenseArr));
        alert("Expense updated successfully!");
        filterAndRender();
        closeModal();
    }
});

const addExpenseBtn = document.getElementById("addExpenseBtn");
if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", () => {
        window.location.href = "../add-expense/index.html";
    });
}
