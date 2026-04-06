// Select elements
const addCategoryBtn = document.querySelector(".add-category-btn");
const addCategoryModal = document.getElementById("addCategoryModal");
const modalOverlay = document.getElementById("categoryModalOverlay");
const closeBtns = document.querySelectorAll(".close");

// Open modal on add category button click
addCategoryBtn.addEventListener("click", () => {
    addCategoryModal.classList.add("show"); 
});

// Close modal logic
closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        modalOverlay.classList.remove("show");
        addCategoryModal.classList.remove("show");
    });
});

window.addEventListener("click", (e) => {
    if (e.target === modalOverlay || e.target === addCategoryModal) {
        modalOverlay.classList.remove("show");
        addCategoryModal.classList.remove("show");
    }
});

const createBtn = document.getElementById("createBtn");
let categoryArr = JSON.parse(localStorage.getItem("categoryArr")) || [];

// Ensure Uncategorized exists and is immutable
if (!categoryArr.some(c => c.name.toLowerCase() === "uncategorized")) {
    categoryArr.unshift({ name: "Uncategorized", budget: "0.00", color: "gray" });
    localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
}

// Dropdown Handling
function setupDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return { btn: null };
    const btn = dropdown.querySelector(".dropdown-btn");
    const menu = dropdown.querySelector(".dropdown-menu");

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Close other dropdowns first
        document.querySelectorAll(".dropdown-menu.show").forEach(m => {
            if (m !== menu) m.classList.remove("show");
        });
        menu.classList.toggle("show");
    });

    menu.querySelectorAll("a").forEach(option => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            const color = option.dataset.color;
            const hex = option.dataset.hex;
            const text = option.textContent.trim();
            
            btn.querySelector(".mini-dot").style.background = hex;
            btn.querySelector("span:not(.mini-dot)").textContent = text;
            btn.dataset.color = color;
            menu.classList.remove("show");
        });
    });
    return { btn };
}

const addColorDropdown = setupDropdown("addCategoryColorDropdown");
const editColorDropdown = setupDropdown("editCategoryColorDropdown");

window.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
});

// MODAL ELEMENTS FOR QUICK EDIT
const editCategoryName = document.getElementById("editCategoryName");
const editCategoryBudget = document.getElementById("editCategoryBudget");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");

let currentEditingName = null;

createBtn.addEventListener("click", () => {
    const categoryName = document.getElementById("categoryName").value.trim();
    const categoryBudget = document.getElementById("categoryBudget").value.trim();
    const categoryColor = addColorDropdown.btn.dataset.color || "cyan";

    if (!categoryName) {
        alert("Category name is mandatory.");
        return;
    }

    if (categoryName.toLowerCase() === "uncategorized") {
        alert("The name 'Uncategorized' is reserved for system use.");
        return;
    }

    if ((categoryBudget && isNaN(categoryBudget)) || categoryBudget < 0) {
        alert("Budget must be a valid number.");
        return;
    }

    if (categoryArr.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
        alert("A category with this name already exists.");
        return;
    }

    const category = {
        name: categoryName,
        budget: categoryBudget || "0.00",
        color: categoryColor,
    };
    categoryArr.push(category);
    localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
    addCategoryModal.classList.remove("show");
    renderCategories();
});

// Edit Logic
saveCategoryBtn.addEventListener("click", () => {
    const newName = editCategoryName.value.trim();
    const newBudget = editCategoryBudget.value.trim();
    const newColor = editColorDropdown.btn.dataset.color || "cyan";

    if (!newName) {
        alert("Category name cannot be empty.");
        return;
    }
    
    if (newName.toLowerCase() === "uncategorized" && currentEditingName.toLowerCase() !== "uncategorized") {
        alert("The name 'Uncategorized' is reserved.");
        return;
    }

    if ((newBudget && isNaN(newBudget)) || newBudget < 0) {
        alert("Budget must be a valid number.");
        return;
    }

    const index = categoryArr.findIndex(c => c.name === currentEditingName);
    
    // Check for duplicates (excluding the current one)
    if (categoryArr.some((c, i) => i !== index && c.name.toLowerCase() === newName.toLowerCase())) {
        alert("A category with this name already exists.");
        return;
    }

    if (index !== -1) {
        // If name changed, update all expenses too!
        if (newName !== currentEditingName) {
            const expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
            const updatedExpenses = expenseArr.map(exp => {
                if (exp.category === currentEditingName) {
                    return { ...exp, category: newName };
                }
                return exp;
            });
            localStorage.setItem("expenseArr", JSON.stringify(updatedExpenses));
        }

        categoryArr[index] = {
            ...categoryArr[index],
            name: newName,
            budget: newBudget || "0.00",
            color: newColor
        };
        localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
        modalOverlay.classList.remove("show");
        renderCategories();
        alert("Category updated!");
    }
});

deleteCategoryBtn.addEventListener("click", () => {
    if (currentEditingName.toLowerCase() === "uncategorized") {
        alert("The Uncategorized category cannot be deleted.");
        return;
    }
    const expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];
    const expenseCount = expenseArr.filter(exp => exp.category === currentEditingName).length;
    if (confirm(`Delete "${currentEditingName}"? (${expenseCount} expenses will move to Uncategorized)`)) {
        // Move expenses
        const updatedExpenses = expenseArr.map(exp => {
            if (exp.category === currentEditingName) {
                return { ...exp, category: "Uncategorized" };
            }
            return exp;
        });
        localStorage.setItem("expenseArr", JSON.stringify(updatedExpenses));

        categoryArr = categoryArr.filter(c => c.name !== currentEditingName);
        localStorage.setItem("categoryArr", JSON.stringify(categoryArr));
        modalOverlay.classList.remove("show");
        renderCategories();
    }
});

function renderCategories() {
    const grid = document.querySelector(".grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    // Load expenses to calculate spent amounts
    const expenseArr = JSON.parse(localStorage.getItem("expenseArr")) || [];

    categoryArr.forEach(category => {
        // Calculate total spent for this category
        const totalSpent = expenseArr
            .filter(exp => exp.category.toLowerCase() === category.name.toLowerCase())
            .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        const budget = parseFloat(category.budget) || 0;
        const percent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

        const catCard = document.createElement("article");
        catCard.classList.add("cat-card");
        catCard.innerHTML = `
            <div class="card-header"> 
                <div class="name-pill">
                  <span class="color-dot ${category.color}"></span>
                  <h2>${category.name}</h2>
                </div>
                ${category.name.toLowerCase() !== "uncategorized" ? `<div class="dot-menu" data-name="${category.name}">&#8942;</div>` : ""}
            </div>
            <div class="card-body">
                <div class="spent-row">
                  <p>Total spent: <strong>$${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></p>
                </div>
                
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${percent}%"></div>
                </div>

                <div class="cap">
                    <span class="cap-label">Budget</span>
                    <span class="amount">$${budget.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        `;
        grid.appendChild(catCard);
    });

    // Re-attach listeners for dot menus after re-render
    document.querySelectorAll(".dot-menu").forEach(menu => {
        menu.addEventListener("click", (e) => {
            e.stopPropagation();
            const name = menu.dataset.name;
            const category = categoryArr.find(c => c.name === name);
            if (category) {
                currentEditingName = name;
                editCategoryName.value = category.name;
                editCategoryBudget.value = category.budget;
                
                // Set color dropdown button
                const hexMap = { cyan: "#74e8ff", green: "#11efb4", coral: "#ff7975", amber: "#ffb86c", violet: "#bd93f9" };
                const textMap = { cyan: "Cyan Blue", green: "Emerald Green", coral: "Coral Red", amber: "Amber Gold", violet: "Royal Violet" };
                
                const dot = editColorDropdown.btn.querySelector(".mini-dot");
                const span = editColorDropdown.btn.querySelector("span:not(.mini-dot)");
                
                dot.style.background = hexMap[category.color] || hexMap.cyan;
                span.textContent = textMap[category.color] || textMap.cyan;
                editColorDropdown.btn.dataset.color = category.color;

                modalOverlay.classList.add("show");
            }
        });
    });
}

renderCategories();