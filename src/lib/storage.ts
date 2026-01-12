const DB_NAME = 'frame-studio';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const IMAGE_KEY = 'last-image';

type StoredImage = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  savedAt: number;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveImageToStorage(
  blob: Blob,
  fileName: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const storedImage: StoredImage = {
      blob,
      fileName,
      mimeType: blob.type,
      savedAt: Date.now(),
    };

    const request = store.put(storedImage, IMAGE_KEY);

    request.onerror = () => {
      reject(new Error('Failed to save image to IndexedDB'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function loadImageFromStorage(): Promise<{
  blob: Blob;
  fileName: string;
} | null> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(IMAGE_KEY);

      request.onerror = () => {
        reject(new Error('Failed to load image from IndexedDB'));
      };

      request.onsuccess = () => {
        const result = request.result as StoredImage | undefined;
        if (result && result.blob) {
          resolve({
            blob: result.blob,
            fileName: result.fileName,
          });
        } else {
          resolve(null);
        }
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    console.error('Error loading image from storage');
    return null;
  }
}

export async function clearImageFromStorage(): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(IMAGE_KEY);

      request.onerror = () => {
        reject(new Error('Failed to clear image from IndexedDB'));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    console.error('Error clearing image from storage');
  }
}

export async function hasStoredImage(): Promise<boolean> {
  try {
    const image = await loadImageFromStorage();
    return image !== null;
  } catch {
    return false;
  }
}
