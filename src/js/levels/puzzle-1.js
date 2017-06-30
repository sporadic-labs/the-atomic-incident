import Composition from "../game-objects/waves/wave-composition";
import PathTweenWave from "../game-objects/waves/path-tween-wave";
import GenericLevel from "./generic-level";

export const mapName = "puzzle-map-1";
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
                ammo: {red: 2, blue: 0, green: 0} // Amount of each color to spawn at this time
            }  
        ],
        enemyGroups: [
            {
                time: 0, // Time relative to the start of the wave
                composition: new Composition({red: 20, shield: null}),
                wave: new PathTweenWave(g, {speed: 150, paths: ["paths-top:+1:all"]})
            }, {
                time: 3,
                composition: new Composition({red: 20, shield: null}),
                wave: new PathTweenWave(g, {speed: 150, paths: ["paths-bottom:-1"]})
            }
        ]
    })
    .addWaveDelay(10)
    // .addWave({
    //     mapName,
    //     lightRadius,
    //     ammoDrops: [
    //         {
    //             time: 0,
    //             ammo: {red: 0, blue: 1, green: 1}
    //         }  
    //     ],
    //     enemyGroups: [
    //         {
    //             time: 2,
    //             composition: new Composition({green: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-top-even:+1", "paths-top-odd:+1"
    //             ]})
    //         }, {
    //             time: 5,
    //             composition: new Composition({blue: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-bottom-even:+1", "paths-bottom-odd:+1"
    //             ]})
    //         }
            
    //     ]
    // })
    // .addWaveDelay(10)
    // .addWave({
    //     mapName,
    //     lightRadius,
    //     ammoDrops: [
    //         {
    //             time: 0,
    //             ammo: {red: 0, blue: 1, green: 0}
    //         }  
    //     ],
    //     enemyGroups: [
    //         {
    //             time: 2,
    //             composition: new Composition({blue: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: ["paths-top-even:+1"]})
    //         }, {
    //             time: 2,
    //             composition: new Composition({blue: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: ["paths-bottom-even:-1"]})
    //         }
            
    //     ]
    // })
    // .addWaveDelay(10)
    // .addWave({
    //     mapName,
    //     lightRadius,
    //     ammoDrops: [
    //         {
    //             time: 0,
    //             ammo: {red: 1, blue: 0, green: 1}
    //         }  
    //     ],
    //     enemyGroups: [
    //         {
    //             time: 2,
    //             composition: new Composition({red: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-top-even:+1"
    //             ]})
    //         }, {
    //             time: 2.25,
    //             composition: new Composition({green: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-bottom-even:+1"
    //             ]})
    //         }, {
    //             time: 2.5,
    //             composition: new Composition({red: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-top-odd:+1"
    //             ]})
    //         }, {
    //             time: 2.75,
    //             composition: new Composition({green: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-bottom-odd:+1"
    //             ]})
    //         }             
    //     ]
    // })
    // .addWaveDelay(10)
    // .addWave({
    //     mapName,
    //     lightRadius,
    //     ammoDrops: [
    //         {
    //             time: 0,
    //             ammo: {red: 1, blue: 1, green: 1}
    //         }
    //     ],
    //     enemyGroups: [
    //         {
    //             time: 0,
    //             composition: new Composition({red: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-top-even:+1"
    //             ]})
    //         }, {
    //             time: 0,
    //             composition: new Composition({red: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-bottom-even:-1"
    //             ]})
    //         }, {
    //             time: 1,
    //             composition: new Composition({blue: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-middle:+1"
    //             ]})
    //         }, {
    //             time: 2,
    //             composition: new Composition({green: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-top-odd:+1"
    //             ]})
    //         }, {
    //             time: 2,
    //             composition: new Composition({green: 20, shield: null}),
    //             wave: new PathTweenWave(g, {speed: 150, paths: [
    //                 "paths-bottom-odd:+1"
    //             ]})
    //         }
    //     ]
    // });
}