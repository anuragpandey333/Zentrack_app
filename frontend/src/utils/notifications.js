// Simple toast notification system
class NotificationManager {
    constructor() {
        this.listeners = [];
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notify(message, type = 'info') {
        this.listeners.forEach(callback => callback({ message, type, id: Date.now() }));
    }

    success(message) {
        this.notify(message, 'success');
    }

    error(message) {
        this.notify(message, 'error');
    }

    warning(message) {
        this.notify(message, 'warning');
    }

    info(message) {
        this.notify(message, 'info');
    }
}

export const notificationManager = new NotificationManager();
