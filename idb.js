const DB_NAME = 'TaskManagerDB';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

let db;

// --- Database Initialization ---
function getDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error');
        };

        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
    });
}

// --- CRUD Operations ---

/**
 * Gets all tasks from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of tasks.
 */
export async function getTasks() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(`Error getting tasks: ${event.target.error}`);
    });
}

/**
 * Adds a new task to the database.
 * @param {object} task - The task object to add.
 * @returns {Promise<IDBValidKey>} A promise that resolves to the new task's ID.
 */
export async function addTask(task) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(task);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(`Error adding task: ${event.target.error}`);
    });
}

/**
 * Updates an existing task in the database.
 * @param {object} task - The task object to update.
 * @returns {Promise<IDBValidKey>} A promise that resolves to the updated task's ID.
 */
export async function updateTask(task) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(task);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(`Error updating task: ${event.target.error}`);
    });
}

/**
 * Deletes a task from the database by its ID.
 * @param {number} id - The ID of the task to delete.
 * @returns {Promise<void>} A promise that resolves when the task is deleted.
 */
export async function deleteTask(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(`Error deleting task: ${event.target.error}`);
    });
}
