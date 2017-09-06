import { observe } from "mobx";
import storage from "store/dist/store.modern";

/**
 * A function that will take an observable store and sync it with local storage. The serialization
 * process is controlled via the object's toJSON method. Override that to control what gets synced.
 * This function also sets up an observer that will re-sync the observable store to storage whenever
 * the store is changed.
 * 
 * @export
 * @param {string} gameDataName Key to use for storage
 * @param {object} gameDataStore 
 */
export default function autoSync(gameDataName, gameDataStore) {
  const storedData = storage.get(gameDataName);
  if (storedData === undefined) storage.set(gameDataName, gameDataStore);
  else {
    // There was an existing store, so restore the key/value pairs to the gameDataStore
    for (const [key, value] of Object.entries(storedData)) {
      gameDataStore[key] = value;
    }
  }
  // Anytime the data changes, sync to local storage
  observe(gameDataStore, () => storage.set(gameDataName, gameDataStore));
}
