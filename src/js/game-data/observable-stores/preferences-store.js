import { extendObservable, action } from "mobx";
import storageAutosync from "./sync-to-storage";

class PreferencesStore {
  constructor() {
    extendObservable(this, {
      // State properties
      volume: 1,
      shadowOpacity: 1,
      shadersEnabled: true,
      physicsDebug: false,
      skipMenu: false,

      // Actions - these mutate the state
      setVolume: action(function(newVolume) {
        this.volume = newVolume;
      }),
      setShadowOpacity: action(function(shadowOpacity) {
        this.shadowOpacity = shadowOpacity;
      }),
      setShadersEnabled: action(function(shadersEnabled) {
        this.shadersEnabled = shadersEnabled;
      }),
      setPhysicsDebug: action(function(physicsDebug) {
        this.physicsDebug = physicsDebug;
      }),
      setSkipMenu: action(function(skipMenu) {
        this.skipMenu = skipMenu;
      })
    });
  }
}

const preferencesStore = new PreferencesStore();
storageAutosync("preferences-store", preferencesStore);

export default preferencesStore;
