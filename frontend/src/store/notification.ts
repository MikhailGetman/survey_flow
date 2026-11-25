// frontend/src/store/notification.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([]);
  let idCounter = 0;

  function addNotification(notification: Omit<Notification, 'id'>) {
    const id = `notification-${++idCounter}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    notifications.value.push(newNotification);

    if (newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  function success(title: string, message: any, duration?: number) {
    return addNotification({ type: 'success', title, message, duration });
  }

  function error(title: string, message: any, duration?: number) {
    return addNotification({ type: 'error', title, message, duration: duration || 7000 });
  }

  function warning(title: string, message: any, duration?: number) {
    return addNotification({ type: 'warning', title, message, duration });
  }

  function info(title: string, message: any, duration?: number) {
    return addNotification({ type: 'info', title, message, duration });
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAll() {
    notifications.value = [];
  }

  return {
    notifications,
    addNotification,
    success,
    error,
    warning,
    info,
    removeNotification,
    clearAll
  };
});