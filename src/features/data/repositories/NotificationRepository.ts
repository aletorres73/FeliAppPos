import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  writeBatch,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db } from '../services/FirebaseService';
import type { AppNotification } from '../../domain/types/notificationsTypes';

class NotificationRepository {
  private readonly COLLECTION_NAME = 'notifications';

  // Suscripción reactiva a todas las notificaciones
  subscribe(onUpdate: (notifications: AppNotification[]) => void) {
    const colRef = collection(db, this.COLLECTION_NAME);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>)
      }));
      onUpdate(items);
    }, (error) => {
      console.error('Error al escuchar notificaciones:', error);
    });
  }

  // Marcar como leída
  async markAsRead(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, { read: true });
    } catch (e) {
      console.error('Error al marcar notificación como leída:', e);
    }
  }

  // Eliminar individualmente
  async deleteNotification(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Error al eliminar notificación:', e);
    }
  }

  // Limpiar/Eliminar todas las notificaciones
  async clearAllNotifications(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error('Error al vaciar notificaciones:', e);
    }
  }
}

export const notificationRepository = new NotificationRepository();