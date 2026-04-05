const expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
const headline = document.querySelector(".headline-meta"); 

if (headline) {
    switch (expenseArr.length) {
        case 0:
            headline.textContent = "No expenses processed this month";
            break;
        case 1:
            headline.textContent = "1 expense processed this month";
            break;
        default:
            headline.textContent = `${expenseArr.length} expenses processed this month`;
            break;
    }
}

const dropdowns = document.querySelectorAll(".dropdown");
const categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || []; 

dropdowns.forEach((dropdown) => {
    const btn = dropdown.querySelector(".dropdown-btn");
    const menu = dropdown.querySelector(".dropdown-menu");
    
    if (!btn || !menu) return;

    // Toggle menu
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        // Close other open menus first
        document.querySelectorAll(".dropdown-menu.show, .sort-menu.show").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        menu.classList.toggle("show");
    }); 

    // Add categories to dropdown (only to the category dropdown)
    if (btn.textContent.includes("Categories")) {
        categoryArr.forEach((category) => {
            const option = document.createElement("a");
            option.href = "#";
            option.innerHTML = `<span class="dot"></span>${category.name}`;
            menu.appendChild(option);
        });
    }

    // Select item
    menu.querySelectorAll("a").forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            btn.textContent = item.textContent.trim();
            menu.classList.remove("show");
            btn.classList.add("selected");
            
            // Filter by category if this is the category dropdown
            if (btn.textContent === "All Categories") {
                renderExpenses();
            } else {
                const filtered = expenseArr.filter(ex => ex.category === btn.textContent);
                renderExpenses(filtered);
            }
        });
    });
});

const sortBtn = document.querySelector(".sort-btn");
const sortMenu = document.querySelector(".sort-menu");

if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Close other open menus first
        document.querySelectorAll(".dropdown-menu.show").forEach(m => {
            m.classList.remove("show");
        });

        sortMenu.classList.toggle("show");

        const items = sortMenu.querySelectorAll("a");
        items.forEach((item) => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                sortBtn.textContent = item.textContent.trim();
                sortMenu.classList.remove("show");
                renderExpenses();
            });
        });
    });
}

// Global click listener to close all menus
window.addEventListener("click", (e) => {
    if (!e.target.matches('.dropdown-btn') && !e.target.matches('.sort-btn')) {
        document.querySelectorAll(".dropdown-menu.show, .sort-menu.show").forEach(menu => {
            menu.classList.remove("show");
        });
    }
});

function renderExpenses(expenses = expenseArr) {
    const rowsContainer = document.querySelector(".rows");
    if (!rowsContainer) return;
    
    rowsContainer.innerHTML = "";
    
    expenses.forEach((expense, index) => {
        const article = document.createElement("article");
        article.classList.add("table-row");
        setExpenseOrder(article, index);
        article.innerHTML = `
            <div class="date">${expense.date}</div>
            <div class="category"><span class="icon">C</span>${expense.category}</div>
            <div>
                <div class="merchant">${expense.merchant ?? 'Unknown'}</div>
                <div class="note">${expense.notes || 'No notes'}</div>
            </div>
            <div class="amount red">-$${expense.amount}</div>
            <div>
                <button class="edit-btn" data-id="${expense.id}">&#9998;</button> 
                <button class="delete-btn" data-id="${expense.id}">&#128465;</button>
            </div>
        `;
        rowsContainer.appendChild(article); 
    }); 

    attachEventListeners();
}

renderExpenses();

function setExpenseOrder(article, index) {
    if (sortBtn.textContent.trim() === "Latest") {
        article.style.order = expenseArr.length - index;
    } else {
        article.style.order = index + 1;
    }
}

// MODAL ELEMENTS
const editModalOverlay = document.getElementById("editModalOverlay");
const closeEditModal = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

const editAmountInput = document.getElementById("editAmountInput");
const editDateInput = document.getElementById("editDateInput");
const editMerchantInput = document.getElementById("editMerchantInput");
const editNotesInput = document.getElementById("editNotesInput");
const editCategoryDropdown = document.getElementById("editCategoryDropdown");
const editCategoryBtn = editCategoryDropdown.querySelector(".dropdown-btn");
const editCategoryMenu = editCategoryDropdown.querySelector(".dropdown-menu");

let currentEditId = null;

// Amount Validation for Edit Modal
editAmountInput.addEventListener('input', (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, ''); 
    const parts = value.split('.');
    if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
    e.target.value = value;
});

function attachEventListeners() {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            const expense = expenseArr.find(ex => ex.id === id);
            if (expense) {
                currentEditId = id;
                editAmountInput.value = expense.amount;
                editDateInput.value = expense.date;
                editMerchantInput.value = expense.merchant;
                editNotesInput.value = expense.notes;
                editCategoryBtn.textContent = expense.category;
                
                // Set color-changing classes
                editCategoryBtn.classList.add("selected");
                editDateInput.classList.add("selected");

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
                    renderExpenses();
                }
            }
        });
    });
}

// Load categories into Edit Modal Dropdown
if (editCategoryMenu) {
    categoryArr.forEach((category) => {
        const option = document.createElement("a");
        option.href = "#";
        option.innerHTML = `<span class="dot"></span>${category.name}`;
        editCategoryMenu.appendChild(option);

        option.addEventListener("click", (e) => {
            e.preventDefault();
            editCategoryBtn.textContent = category.name;
            editCategoryMenu.classList.remove("show");
            editCategoryBtn.classList.add("selected");
        });
    });
}

// Modal closing logic
const closeModal = () => {
    editModalOverlay.classList.remove("show");
    currentEditId = null;
};

closeEditModal.addEventListener("click", closeModal);
cancelEditBtn.addEventListener("click", closeModal);
editModalOverlay.addEventListener("click", (e) => {
    if (e.target === editModalOverlay) closeModal();
});

// Edit Category Dropdown logic
editCategoryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editCategoryMenu.classList.toggle("show");
});

editCategoryMenu.querySelectorAll("a").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        editCategoryBtn.textContent = item.textContent;
        editCategoryMenu.classList.remove("show");
    });
});

// Save Changes
saveEditBtn.addEventListener("click", () => {
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
        renderExpenses();
        closeModal();
        alert("Expense updated successfully!");
    }
});

const searchBox = document.querySelector(".search-box");
if (searchBox) {
    searchBox.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = expenseArr.filter((ex) => 
            ex.merchant.toLowerCase().includes(searchTerm)
        );
        renderExpenses(filtered);
    });
}

const dateInput = document.querySelector(".date-box");
if (dateInput) {
    dateInput.addEventListener("change", (e) => {
        const date = e.target.value;
        if (!date) {
            renderExpenses();
        } else {
            const filtered = expenseArr.filter((ex) => ex.date === date);
            renderExpenses(filtered);
        }
    });
}
