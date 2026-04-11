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

const toggleBtns = document.querySelectorAll('.topbar-notification:not(#themeToggleBtn)');
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
    document.querySelectorAll('.topbar-notification:not(#themeToggleBtn)').forEach(icon => {
        // Fix: icon must be position:relative so the badge anchors to IT, not the navbar
        icon.style.position = 'relative';
        icon.style.display = 'inline-flex';
        let badge = icon.querySelector('.notif-badge');
        if (unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                icon.appendChild(badge);
                badge.style.cssText = [
                    'position:absolute',
                    'top:-6px',
                    'right:-6px',
                    'background:#ff5c5c',
                    'color:#fff',
                    'font-size:9px',
                    'font-weight:bold',
                    'width:16px',
                    'height:16px',
                    'border-radius:50%',
                    'display:flex',
                    'align-items:center',
                    'justify-content:center',
                    'pointer-events:none',
                    'z-index:10'
                ].join(';');
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
            </div>
            <p class="notif-message">${notif.message}</p>
            <div style="display: flex; justify-content: flex-end; width: 100%;">
                <span class="notif-time">${formatTime(notif.time)}</span>
            </div>
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

// 5. Full-Page Notification List (only on /notifications/index.html)
function renderPageNotifications() {
    const pageList = document.getElementById('pageNotifList');
    if (!pageList) return; // Not on the notifications page, skip

    notifications = JSON.parse(localStorage.getItem('notificationsArr')) || [];

    if (notifications.length === 0) {
        pageList.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 0;gap:16px;">
                <img src="../../assets/icons/notification.png" width="48" style="opacity:0.3;">
                <p style="color:var(--muted);font-size:14px;">No notifications yet</p>
            </div>`;
        return;
    }

    const sorted = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time));

    pageList.innerHTML = sorted.map(notif => {
        let typeClass = 'type-system';
        if (notif.type === 'budget_exceeded') typeClass = 'type-warning';
        if (notif.type === 'overall_budget_exceeded') typeClass = 'type-expense';
        const label = notif.type === 'overall_budget_exceeded' ? 'MAX BUDGET ALERT' : 'BUDGET WARNING';
        return `
            <div class="notif-item" style="background: var(--surface-container);;border-radius:12px;margin-bottom:8px;padding:16px 20px;">
                <div class="notif-item-header">
                    <span class="notif-type ${typeClass}">${label}</span>
                    <span class="notif-time">${formatTime(notif.time)}</span>
                </div>
                <p class="notif-message">${notif.message}</p>
                <div class="notif-item-footer" style="display: flex; justify-content: center; width: 100%;">
                    <button class="notif-dismiss page-dismiss" data-id="${notif.id}" style="opacity:1;position:static;margin-top:8px;font-size:12px;padding:4px 10px;">Dismiss</button>
                </div>

            </div>`;
    }).join('');

    // Dismiss listeners for full page
    pageList.querySelectorAll('.page-dismiss').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = parseInt(e.target.dataset.id);
            notifications = notifications.filter(n => n.id !== id);
            saveNotifications();
            renderPageNotifications();
            updateBadge();
        });
    });
}

// Page-level Clear All button
const pageClearBtn = document.getElementById('pageclearNotifsBtn');
if (pageClearBtn) {
    pageClearBtn.addEventListener('click', () => {
        notifications = [];
        saveNotifications();
        renderPageNotifications();
        updateBadge();
    });
}

// Initial Render on boot
renderNotifications();
renderPageNotifications();
updateBadge();
