/**
 * notifications.js - Logic for the Catalyst Notification Center Dropdown
 */

let notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];

// 1. Dynamic Global DOM Injection
let dropdown = document.getElementById('notifDropdown');
if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.className = 'notification-dropdown';
    dropdown.innerHTML = `
        <div class="notif-header">
            <h3>Notifications</h3>
            <button class="notif-clear-btn" id="clearNotifsBtn">Clear All</button>
        </div>
        <div class="notif-body" id="notifList"></div>
        <div class="notif-footer" style="padding: 12px; text-align: center;">
            <a href="../notifications/index.html" class="see-all-btn" style="color: var(--muted); font-size: 13px; font-weight: 600; transition: opacity 0.2s;">See All Notifications</a>
        </div>
    `;
    const header = document.querySelector('.topbar.shell');
    if (header) {
        header.style.position = 'relative'; // Ensure absolute dropdown alignment
        header.appendChild(dropdown);
    }
}

const toggleBtns = document.querySelectorAll('.topbar-notification');
const notifList = document.getElementById('notifList');
const clearBtn = document.getElementById('clearNotifsBtn');

// Helper to format time relative to now
function formatTime(dateString) {
    const diff = (new Date() - new Date(dateString)) / 1000; // seconds
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function saveNotifications() {
    localStorage.setItem('notificationsArr', JSON.stringify(notifications));
}

function updateBadge() {
    // Always re-read from localStorage so new notifications are reflected
    notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];
    const unreadCount = notifications.length;
    document.querySelectorAll('.topbar-notification').forEach(icon => {
        let badge = icon.querySelector('.notif-badge');
        if (unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                // Append dynamically
                icon.appendChild(badge);
                
                // Inline absolute glass positioning
                badge.style.position = 'absolute';
                badge.style.top = '-4px';
                badge.style.right = '-4px';
                badge.style.backgroundColor = '#ff5c5c';
                badge.style.color = '#fff';
                badge.style.fontSize = '9px';
                badge.style.fontWeight = 'bold';
                badge.style.width = '14px';
                badge.style.height = '14px';
                badge.style.borderRadius = '50%';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
            }
            badge.textContent = unreadCount;
        } else {
            if (badge) badge.remove();
        }
    });
}


function renderNotifications() {
    // Always re-read so notifications created since page-load are visible
    notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];
    notifList.innerHTML = '';

    if (notifications.length === 0) {
        notifList.innerHTML = `<div class="notif-empty">No notifications</div>`;
        return;
    }

    // Sort newest first
    const sorted = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time));

    sorted.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        
        let typeClass = 'type-system';
        if (notif.type === 'budget_exceeded') typeClass = 'type-warning';
        if (notif.type === 'overall_budget_exceeded') typeClass = 'type-expense';

        item.innerHTML = `
            <div class="notif-item-header">
                <span class="notif-type ${typeClass}">${notif.type === 'overall_budget_exceeded' ? 'MAX BUDGET ALERT' : 'BUDGET WARNING'}</span>
                <span class="notif-time">${formatTime(notif.time)}</span>
            </div>
            <p class="notif-message">${notif.message}</p>
            <button class="notif-dismiss" data-id="${notif.id}">✕</button>
        `;

        notifList.appendChild(item);
    });

    // Add dismiss listeners
    document.querySelectorAll('.notif-dismiss').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent event from bubbling up to close the dropdown
            e.stopPropagation();
            const id = parseInt(e.target.dataset.id);
            notifications = notifications.filter(n => n.id !== id);
            saveNotifications();
            renderNotifications();
        });
    });

    updateBadge(); // Sync badge state dynamically
}

// 4. Toggle Dropdown & Universal Close Logic
toggleBtns.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
            renderNotifications(); 
        }
    });
});

if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifications = [];
        saveNotifications();
        renderNotifications();
    });
}

// Close when clicking outside
window.addEventListener('click', (e) => {
    let isClickInsideToggle = Array.from(toggleBtns).some(btn => btn.contains(e.target));
    if (dropdown && !dropdown.contains(e.target) && !isClickInsideToggle) {
        dropdown.classList.remove('active');
    }
});

// Initial Render on boot
renderNotifications();
updateBadge();
