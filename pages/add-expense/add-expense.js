/**
 * DOM Elements Selection
 */
const amountInput = document.querySelector(".amount-input");
const addExpenseBtn = document.querySelector("#add-expense-btn");
const dateInput = document.querySelector("#dateInput");
const merchantInput = document.querySelector("#merchantInput");
const notesInput = document.querySelector("#notesInput");
const dropdowns = document.querySelectorAll(".dropdown");

// CATEGORY DROPDOWN DYNAMIC LOADING
const categoryDropdown = document.querySelector('.field-wrap .dropdown');
const categoryBtn = categoryDropdown.querySelector(".dropdown-btn");
const categoryMenu = categoryDropdown.querySelector(".dropdown-menu");
let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];

function refreshCategoryDropdowns() {
    categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];
    const currentSelection = categoryBtn.textContent.trim();
    
    categoryMenu.innerHTML = "";
    categoryArr.forEach(category => {
        const option = document.createElement("a");
        option.href = "#";
        option.textContent = category.name;
        categoryMenu.appendChild(option);
    });

    // Check if current selection still exists
    if (currentSelection !== "Choose category..." && !categoryArr.some(c => c.name === currentSelection)) {
        categoryBtn.textContent = "Choose category...";
        categoryBtn.classList.remove("selected");
    }
}

window.onfocus = refreshCategoryDropdowns;
refreshCategoryDropdowns();

categoryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    categoryMenu.classList.toggle("show");
});

// DELEGATION LOGIC
categoryMenu.addEventListener("click", (e) => {
    const target = e.target.closest("a");
    if (!target) return;
    e.preventDefault();
    
    categoryBtn.textContent = target.textContent.trim();
    categoryBtn.classList.add("selected");
    categoryMenu.classList.remove("show");
});

// Toggle date color
dateInput.addEventListener("change", (e) => {
    if (e.target.value) {
        dateInput.classList.add("selected");
    } else {
        dateInput.classList.remove("selected");
    }
});

// Close dropdowns if clicking outside
window.addEventListener("click", (e) => {
    if (!e.target.matches('.dropdown-btn')) {
        document.querySelectorAll(".dropdown-menu.show").forEach(menu => {
            menu.classList.remove("show");
        });
    }
});

/**
 * Amount Input Validation
 * Restricts input to numeric values and ensures only one decimal point.
 */
amountInput.addEventListener('input', (e) => {
    let value = e.target.value;
    // Remove anything that's not a digit or a dot
    value = value.replace(/[^0-9.]/g, ''); 
    const parts = value.split('.');

    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
});

/**
 * Transaction Data Management
 */
let expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];

/**
 * Add Expense Form Submission
 */
addExpenseBtn.addEventListener("click", () => {
    const amount = amountInput.value.trim();
    const date = dateInput.value;
    const merchant = merchantInput.value.trim();
    const notes = notesInput.value.trim();
    
    // Direct references to button values
    const categoryValue = categoryBtn.textContent.trim();

    // Comprehensive validation
    if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid expense amount.");
        return;
    }
    
    // Check if category is selected (placeholder or empty check)
    if (!categoryValue || categoryValue === "Choose category...") {
        alert("Choosing a category is mandatory. Please select one.");
        return;
    }

    if (!date) {
        alert("Please select the date of the expense.");
        return;
    }

    // New expense object
    const newTransaction = {
        id: Date.now(),
        amount: parseFloat(amount).toFixed(2),
        category: categoryValue,
        merchant: merchant || "Unknown",
        date: date,
        notes: notes,
        createdAt: new Date().toISOString()
    };

    console.log(newTransaction);

    expenseArr.push(newTransaction);
    
    // Save to localStorage
    localStorage.setItem("expenseArr", JSON.stringify(expenseArr));  

    // Success feedback and redirection
    alert("Expense added successfully!");
    window.location.href = "../expenses/index.html"; 
});

