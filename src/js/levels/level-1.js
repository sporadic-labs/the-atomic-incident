import Composition from "../game-objects/waves/wave-composition";
import TargetingWave from "../game-objects/waves/targeting-wave";
import PathTweenWave from "../game-objects/waves/path-tween-wave";
import SnakePathWave from "../game-objects/waves/snake-path-wave";
// import FlythroughWave from "../game-objects/waves/flythrough-wave";

/**
 * This function returns an array of wave objects when invoked
 * @export
 * @param {Phaser.Game} g 
 * @returns {Object[]} An array of waves
 */
export default function getWaves(g) {
    return [
        {
            // Array of ammo colors to spawn at each time
            ammoDrops: [
                {
                    time: 0, // Time relative to the start of the wave 
                    ammo: {red: 1, blue: 1, green: 1} // Amount of each color to spawn at this time
                }  
            ],
            // Array of enemies that are in this wave
            enemyGroups: [
                {
                    time: 0, // Time relative to the start of the wave
                    composition: new Composition({red: 10, shield: null}), // Wave composition
                    wave: TargetingWave.createCircle(g, {radius: 80}) // Wave logic
                }, {
                    time: 3, // Time relative to the start of the wave
                    composition: new Composition({green: 10, shield: null}), // Wave composition
                    wave: TargetingWave.createCircle(g, {radius: 80}) // Wave logic
                }, {
                    time: 6, // Time relative to the start of the wave
                    composition: new Composition({blue: 10, shield: null}), // Wave composition
                    wave: TargetingWave.createCircle(g, {radius: 80}) // Wave logic
                }
                
            ],
            // Delay between last wave and the start of this wave
            delay: 3
        },

        {
            ammoDrops: [
                {
                    time: 0,
                    ammo: {red: 1, blue: 0, green: 0}
                }  
            ],
            enemyGroups: [
                {
                    time: 0,
                    composition: new Composition({red: 10, shield: null}),
                    wave: TargetingWave.createTunnel(g, {width: 100, length: 300, angle: 90})
                }, {
                    time: 3,
                    composition: new Composition({red: 10, shield: null}),
                    wave: TargetingWave.createTunnel(g, {width: 100, length: 300, angle: 0})
                }, {
                    time: 6,
                    composition: new Composition({red: 10, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 80})
                }
            ],
            delay: 10
        },

        {
            ammoDrops: [
                {
                    time: 0,
                    ammo: {red: 0, blue: 1, green: 1}
                }  
            ],
            enemyGroups: [
                {
                    time: 0,
                    composition: new Composition({blue: 10, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 80})
                }, {
                    time: 3,
                    composition: new Composition({green: 10, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 80})
                }, {
                    time: 6,
                    composition: new Composition({blue: 10, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 80})
                }
            ],
            delay: 10
        },

        {
            ammoDrops: [
                {
                    time: 0,
                    ammo: {red: 1, blue: 1, green: 1}
                }  
            ],
            enemyGroups: [
                {
                    time: 0,
                    composition: new Composition({red: 25, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 200})
                }, {
                    time: 0.25,
                    composition: new Composition({blue: 20, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 150})
                }, {
                    time: 0.5,
                    composition: new Composition({green: 15, shield: null}),
                    wave: TargetingWave.createCircle(g, {radius: 100})
                }
            ],
            delay: 10
        },
        
        {
            ammoDrops: [
                {
                    time: 0,
                    ammo: {red: 3, blue: 0, green: 0}
                }  
            ],
            enemyGroups: [
                {
                    time: 0,
                    composition: new Composition({red: 20, shield: null}),
                    wave: new PathTweenWave(g, {speed: 100})
                },
                {
                    time: 4,
                    composition: new Composition({red: 20, shield: null}),
                    wave: new PathTweenWave(g, {speed: 100})
                },
                {
                    time: 8,
                    composition: new Composition({red: 20, shield: null}),
                    wave: new PathTweenWave(g, {speed: 100})
                }
            ],
            delay: 15
        },

        
        {
            ammoDrops: [
                {
                    time: 0,
                    ammo: {red: 1, blue: 1, green: 1}
                }  
            ],
            enemyGroups: [
                {
                    time: 0,
                    composition: new Composition({red: 10, shield: null}),
                    wave: new SnakePathWave(g, {speed: 100})
                }, {
                    time: 1,
                    composition: new Composition({green: 10, shield: null}),
                    wave: new SnakePathWave(g, {speed: 100})
                }, {
                    time: 2,
                    composition: new Composition({blue: 10, shield: null}),
                    wave: new SnakePathWave(g, {speed: 100})
                }
            ],
            delay: 15
        }

    ]
}