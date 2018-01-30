/** IndexedDB Singleton */
const IndexedDb = (function() {
    let db;
    class IndexedDbClass {
        constructor() {
            db = null;
        }
        /**
         *
         * @param {Array<Object<{storeName: String, config: Object}>>} storeConfigs
         */
        setupDbStores(dbName, dbVersion, storeConfigs) {
            return new Promise((resolve, reject) => {
                const clientDatabase = indexedDB.open(dbName, dbVersion);
                clientDatabase.onupgradeneeded = function(e) {
                    storeConfigs.forEach(storeConfig => {
                        if (!e.target.result.objectStoreNames.contains(storeConfig.name)) {
                            e.target.result.createObjectStore(storeConfig.name, storeConfig.config);
                        }
                    });
                };

                clientDatabase.onsuccess = function onDatabaseSuccess(e) {
                    db = e.target.result;
                    resolve();
                };

                clientDatabase.onerror = reject;
            });
        }

        setupDbConnection(dbName, dbVersion) {
            return new Promise((resolve, reject) => {
                if (db) {
                    return resolve();
                }
                const clientDatabase = indexedDB.open(dbName, dbVersion);
                clientDatabase.onsuccess = function onDatabaseSuccess(e) {
                    db = e.target.result;
                    resolve();
                };

                clientDatabase.onerror = reject;
            });
        }

        closeDbConnection() {
            if (!db) {
                return;
            }
            db.close();
            db = null;
        }

        pushRecord(storeName, data, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const request = store.add(data, key);

                request.onerror = function() {
                    reject();
                };

                request.onsuccess = function() {
                    resolve();
                };
            });
        }

        shiftRecord(storeName) {
            return this.getStoreKeys(storeName).then(resp => this.deleteRecord(storeName, resp[0]));
        }

        updateRecord(storeName, data, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const request = store.put(data, key);

                request.onerror = function() {
                    reject();
                };

                request.onsuccess = function() {
                    resolve();
                };
            });
        }

        readRecords(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);

                const request = key !== undefined && key !== null ? store.get(key) : store.getAll();

                request.onerror = function() {
                    reject();
                };

                request.onsuccess = function(e) {
                    resolve(e.target.result);
                };
            });
        }

        deleteRecord(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                const request = store.delete(key);

                request.onerror = function() {
                    reject();
                };

                request.onsuccess = function() {
                    resolve();
                };
            });
        }

        getStoreKeys(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);

                const request = store.getAllKeys();

                request.onerror = function() {
                    reject();
                };

                request.onsuccess = function(e) {
                    resolve(e.target.result);
                };
            });
        }
    }
    return new IndexedDbClass();
}());

/** Common Functions */
async function sendCachedMessages(databaseRef) {
    await IndexedDb.setupDbConnection(AppConfig.dbName, AppConfig.dbVersion);
    const cachedMessages = await IndexedDb.readRecords(AppConfig.dbConfigs.messagesConfig.name);
    const unsentMessages = cachedMessages.filter(record => record.unsent);

    return Promise.all(
        unsentMessages.map(msg =>
            databaseRef.push(Object.assign({}, msg, { timestamp: Date.now() })).then(() => {
                IndexedDb.updateRecord(
                    AppConfig.dbConfigs.messagesConfig.name,
                    Object.assign({}, msg, { timestamp: Date.now(), unsent: false })
                );
            })
        )
    );
}
