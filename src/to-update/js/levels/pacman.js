import Composition from "../game-objects/waves/wave-composition";
import PathTweenWave from "../game-objects/waves/path-tween-wave";
import GenericLevel from "./generic-level";

export const mapName = "pacman";
const lightRadius = 400;

/**
 * This function returns a Level object
 * @export
 * @param {Phaser.Game} g
 * @returns {Level}
 */
export function makeLevel(game) {
  const level = new GenericLevel(game, mapName);
  addWaves(game, level);
  return level;
}

/**
 * @param {Phaser.Game} g
 * @param {Level} level
 */
function addWaves(g, level) {
  level
    .addWaveDelay(2)
    .addWave({
      mapName,
      lightRadius,
      ammoDrops: [
        {
          time: 0, // Time relative to the start of the wave
          ammo: { red: 2, blue: 0, green: 0 } // Amount of each color to spawn at this time
        }
      ],
      enemyGroups: [
        {
          time: 0, // Time relative to the start of the wave
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-top:+1:odd"]
          })
        },
        {
          time: 1,
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-top:+1:even"]
          })
        },
        {
          time: 6, // Time relative to the start of the wave
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-bottom:-1:even"]
          })
        },
        {
          time: 7,
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-bottom:-1:odd"]
          })
        }
      ]
    })
    .addWaveDelay(10)
    .addWave({
      mapName,
      lightRadius,
      ammoDrops: [
        {
          time: 0, // Time relative to the start of the wave
          ammo: { red: 0, blue: 1, green: 1 } // Amount of each color to spawn at this time
        }
      ],
      enemyGroups: [
        {
          time: 0, // Time relative to the start of the wave
          composition: new Composition({ blue: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-left:+1:odd"]
          })
        },
        {
          time: 1,
          composition: new Composition({ blue: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-left:+1:even"]
          })
        },
        {
          time: 6, // Time relative to the start of the wave
          composition: new Composition({ green: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-right:-1:even"]
          })
        },
        {
          time: 7,
          composition: new Composition({ green: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-right:-1:odd"]
          })
        }
      ]
    })
    .addWaveDelay(10)
    .addWave({
      mapName,
      lightRadius,
      ammoDrops: [
        {
          time: 0, // Time relative to the start of the wave
          ammo: { red: 2, blue: 0, green: 0 } // Amount of each color to spawn at this time
        }
      ],
      enemyGroups: [
        {
          time: 0, // Time relative to the start of the wave
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-top:+1:odd"]
          })
        },
        {
          time: 1,
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-top:+1:even"]
          })
        },
        {
          time: 6, // Time relative to the start of the wave
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-bottom:-1:even"]
          })
        },
        {
          time: 7,
          composition: new Composition({ red: 20, shield: null }),
          wave: new PathTweenWave(g, {
            speed: 150,
            paths: ["paths-bottom:-1:odd"]
          })
        }
      ]
    });
}
