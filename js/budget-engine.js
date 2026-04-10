/**
 * BudgetEngine - Shared logic for transaction processing and budget monitoring
 */

export const BudgetEngine = {
    /**
     * Extracts weekly expenses from a list
     */
    getWeeklyExpenses(expenses) {
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
    },

    /**
     * Extracts monthly expenses
     */
    getMonthlyExpenses(expenses) {
        const now = new Date();
        return expenses.filter(ex => {
            const [y, m, d] = ex.date.split('-');
            const exDate = new Date(y, m-1, d);
            return exDate.getMonth() === now.getMonth() && exDate.getFullYear() === now.getFullYear();
        });
    },

    /**
     * Extracts yearly expenses
     */
    getYearlyExpenses(expenses) {
        const now = new Date();
        return expenses.filter(ex => {
            const [y, m, d] = ex.date.split('-');
            const exDate = new Date(y, m-1, d);
            return exDate.getFullYear() === now.getFullYear();
        });
    },

    /**
     * Budget calculators
     */
    getCategoryMonthlyBudget(categoryName, categories) {
        const cat = categories.find(c => c.name === categoryName);
        return cat ? parseFloat(cat.budget || 0) : 0;
    },

    getCategoryWeeklyBudget(categoryName, categories) {
        return this.getCategoryMonthlyBudget(categoryName, categories) / 4.33;
    },

    getCategoryYearlyBudget(categoryName, categories) {
        return this.getCategoryMonthlyBudget(categoryName, categories) * 12;
    },

    /**
     * Main Notification Logic
     */
    checkBudgetNotifications(newTransaction, category) {
        console.log('BudgetEngine: Checking notifications for', newTransaction);
        
        let notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];
        let expenses = JSON.parse(localStorage.getItem('expenseArr')) || [];
        let categories = JSON.parse(localStorage.getItem('categoryArr')) || [];
        
        const weeklyExp = this.getWeeklyExpenses(expenses);
        const monthlyExp = this.getMonthlyExpenses(expenses);
        const yearlyExp = this.getYearlyExpenses(expenses);

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

        const catWeeklyBudget = this.getCategoryWeeklyBudget(category, categories);
        const catMonthlyBudget = this.getCategoryMonthlyBudget(category, categories);
        const catYearlyBudget = this.getCategoryYearlyBudget(category, categories);

        const createNotification = (type, message, period) => {
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
            }
        };

        // Category checks
        if (catMonthlyBudget > 0) {
            if (catWeeklyTotal > catWeeklyBudget) {
                createNotification('budget_exceeded', `${category} weekly budget exceeded by $${(catWeeklyTotal - catWeeklyBudget).toFixed(2)}`, 'weekly');
            }
            if (catMonthlyTotal > catMonthlyBudget) {
                createNotification('budget_exceeded', `${category} monthly budget exceeded by $${(catMonthlyTotal - catMonthlyBudget).toFixed(2)}`, 'monthly');
            }
            if (catYearlyTotal > catYearlyBudget) {
                createNotification('budget_exceeded', `${category} yearly budget exceeded by $${(catYearlyTotal - catYearlyBudget).toFixed(2)}`, 'yearly');
            }
        }

        // Global checks
        if (totalMonthlyBudget > 0) {
            if (weeklyTotal > totalWeeklyBudget) {
                createNotification('overall_budget_exceeded', `Overall weekly budget exceeded by $${(weeklyTotal - totalWeeklyBudget).toFixed(2)}`, 'weekly');
            }
            if (monthlyTotal > totalMonthlyBudget) {
                createNotification('overall_budget_exceeded', `Overall monthly budget exceeded by $${(monthlyTotal - totalMonthlyBudget).toFixed(2)}`, 'monthly');
            }
            if (yearlyTotal > totalYearlyBudget) {
                createNotification('overall_budget_exceeded', `Overall yearly budget exceeded by $${(yearlyTotal - totalYearlyBudget).toFixed(2)}`, 'yearly');
            }
        }

        localStorage.setItem('notificationsArr', JSON.stringify(notifications));
        
        // Dispatch event for UI updates if any scripts are listening
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
};
