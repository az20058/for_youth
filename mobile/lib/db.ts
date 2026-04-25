import * as SQLite from 'expo-sqlite';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: number;
  relatedId: string | null;
  createdAt: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export function initDB(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync('foryouth.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      relatedId TEXT,
      createdAt TEXT NOT NULL
    );
  `);
  return db;
}

export function getAllNotifications(): NotificationRow[] {
  const database = initDB();
  return database.getAllSync<NotificationRow>(
    'SELECT * FROM notifications ORDER BY createdAt DESC',
  );
}

export function upsertNotifications(items: NotificationRow[]): void {
  const database = initDB();
  const stmt = database.prepareSync(
    `INSERT OR REPLACE INTO notifications (id, type, title, message, isRead, relatedId, createdAt)
     VALUES ($id, $type, $title, $message, $isRead, $relatedId, $createdAt)`,
  );
  try {
    for (const item of items) {
      stmt.executeSync({
        $id: item.id,
        $type: item.type,
        $title: item.title,
        $message: item.message,
        $isRead: item.isRead,
        $relatedId: item.relatedId,
        $createdAt: item.createdAt,
      });
    }
  } finally {
    stmt.finalizeSync();
  }
}

export function markAsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const database = initDB();
  const placeholders = ids.map(() => '?').join(',');
  database.runSync(
    `UPDATE notifications SET isRead = 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

export function markAllAsRead(): void {
  const database = initDB();
  database.runSync('UPDATE notifications SET isRead = 1');
}

export function getUnreadCount(): number {
  const database = initDB();
  const row = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE isRead = 0',
  );
  return row?.count ?? 0;
}
