/**
 * Toast - Premium notification system for Catalyst
 */

const Toast = {
    init() {
        if (document.getElementById('toast-container')) return;
        
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Define styles inline for reliability, but can be moved to CSS
        toast.style.cssText = `
            min-width: 280px;
            max-width: 400px;
            background: rgba(18, 35, 74, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(119, 200, 255, 0.15);
            border-radius: 12px;
            padding: 14px 20px;
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            pointer-events: auto;
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        `;

        if (type === 'error') {
            toast.style.boxShadow = '0 0 10px rgba(255, 120, 116, 0.4)';
        } else if (type === 'success') {
            toast.style.boxShadow = '0 0 10px rgba(17, 241, 180, 0.4)';
        } else {
            toast.style.boxShadow = '0 0 10px rgba(81, 223, 255, 0.4)';
        }

        toast.innerHTML = `
            <span style="flex: 1;">${message}</span>
            <button style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 18px; padding: 0 4px;">&times;</button>
        `;

        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        const close = () => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        };

        toast.querySelector('button').onclick = close;

        if (duration > 0) {
            setTimeout(close, duration);
        }
    }
};

export default Toast;
