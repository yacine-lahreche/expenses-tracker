document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("show");
            overlay.classList.toggle("active");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("show");
            overlay.classList.remove("active");
        });

        // Close sidebar when clicking a link on mobile
        sidebar.querySelectorAll(".nav-item").forEach(link => {
            link.addEventListener("click", () => {
                sidebar.classList.remove("show");
                overlay.classList.remove("active");
            });
        });
    }
});
