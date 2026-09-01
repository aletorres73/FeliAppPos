import { useEffect, useState } from 'react';
import type { AppNotification } from '../../../domain/types/notificationsTypes';
import { notificationRepository } from '../../../data/repositories/NotificationRepository';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = notificationRepository.subscribe((data) => {
      setNotifications(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const deleteOne = (id: string) => notificationRepository.deleteNotification(id);
  const clearAll = () => notificationRepository.clearAllNotifications();
  const markAsRead = (id: string) => notificationRepository.markAsRead(id);

  return {
    notifications,
    unreadCount,
    isLoading,
    deleteOne,
    clearAll,
    markAsRead
  };
}