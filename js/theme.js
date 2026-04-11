/**
 * Catalyst Theme Management Logic
 * Handles dark/light mode switching and icon persistence
 */

document.addEventListener("DOMContentLoaded", () => {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (!themeToggleBtn) return;

    const themeIcon = themeToggleBtn.querySelector("img");
    const favicon = document.querySelector('link[rel="icon"]');
    
    /**
     * Updates the icon based on current theme
     */
    function updateThemeIcon(theme) {
        if (!themeIcon) return;
        const basePath = themeIcon.src.substring(0, themeIcon.src.lastIndexOf("/") + 1);
        themeIcon.src = theme === "light" ? `${basePath}dark.png` : `${basePath}light.png`;
    }

    /**
     * Updates the favicon based on current theme
     */
    function updateFavicon(theme) {
        if (!favicon || !themeIcon) return;
        const basePath = themeIcon.src.substring(0, themeIcon.src.lastIndexOf("/") + 1);
        favicon.setAttribute("href", theme === "light" ? `${basePath}favicon-light.ico` : `${basePath}favicon-dark.ico`);
    }

    // Initialize UI on page load
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    updateThemeIcon(currentTheme);
    updateFavicon(currentTheme);

    themeToggleBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        
        // Update DOM
        document.documentElement.setAttribute("data-theme", newTheme);
        
        // Persistence
        localStorage.setItem("theme", newTheme);
        
        // UI Update
        updateThemeIcon(newTheme);
        updateFavicon(newTheme);
    });
});
