/**
 * Sources while building this plugin:
 * - Code inspired by PatrolJS, an implementation of navmeshes for threejs: 
 *   https://github.com/nickjanssen/PatrolJS
 * - Navmesh path-finding algorithm explanations:
 *   http://jceipek.com/Olin-Coding-Tutorials/pathing.html
 *   http://digestingduck.blogspot.com/2010/03/simple-stupid-funnel-algorithm.html
 * - Advice on astar heuristics from:
 *   http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
 * 
 * TODO:
 *  - Allow other polygons other than rectangles to be imported from Tiled
 *  - Describe the Tiled process. Adding an object layer, setting snapping, making sure vertices 
 *    overlap. 
 *  - Try libtess in quad mode
 */

const triangulate = require("./triangulate");
const NavMesh = require("./navmesh");


/**
 * This plugin can create and manage a set of navmeshes for a game. Each is stored using a
 * user-supplied key. The navmeshes can either be constructed algorithmically from convex polygons
 * that describe the obstacles in the map or from convex polygons embedded in a Tiled map. 
 *
 * @class NavMeshPlugin
 * @extends {Phaser.Plugin}
 */
class NavMeshPlugin extends Phaser.Plugin {
    /**
     * Creates an instance of NavMeshPlugin.
     * 
     * @param {Phaser.Game} game 
     * @param {Phaser.PluginManager} manager 
     * 
     * @memberOf NavMeshPlugin
     */
    constructor(game, manager) {
        super(game, manager);
        this.game = game;
        this._pluginManager = manager;
        this._navMeshes = {};
        this._currentLevel = null;
    }

    /**
     * Load a navmesh from Tiled and switch it to be the current navmesh. Currently assumes that the
     * polygons are squares!
     * 
     * @param {string} levelName The key to use to store the navmesh in the plugin 
     * @param {Phaser.Tilemap} tilemap The tilemap that contains polygons under an object layer
     * @param {string} objectKey The name of the object layer in the tilemap
     * @param {number} [meshShrinkAmount=0] The amount (in pixels) that the navmesh has been
     * shrunk around obstacles (a.k.a the amount obstacles have been expanded)
     * 
     * @memberof NavMeshPlugin
     */
    buildMeshFromTiled(levelName, tilemap, objectKey, meshShrinkAmount = 0) {
        // Load up the object layer
        const rects = tilemap.objects[objectKey];
        // Loop over the objects and construct a polygon
        const polygons = [];
        for (const r of rects) {
            const top = r.y;
            const bottom = r.y + r.height;
            const left = r.x;
            const right = r.x + r.width;
            const poly = new Phaser.Polygon(left,top, left,bottom, right,bottom, right,top);
            polygons.push(poly);
        }
        // Build the navmesh, cache it and set it to be the current
        const navMesh = new NavMesh(this.game, polygons, meshShrinkAmount);
        this._navMeshes[levelName] = navMesh;
        this._currentNavMesh = navMesh;
    }  

    /**
     * Build a navmesh from an array of convex polygons. This currently tesselates the polygons into
     * triangles. They aren't as efficient or as well designed as ones made by hand in Tiled. 
     *
     * @param {string} levelName The key to use to store the navmesh in the plugin  
     * @param {[]} hulls An array of convex polygons describing the obstacles in the
     * level. See lighting-plugin/hull-from-tiles.
     *
     * @memberof NavMeshPlugin
     */
    buildMesh(levelName, hulls) {
        const contours = this._buildContours(hulls);
        // Get an array of triangulated vertices
        const triangles = triangulate(contours, false); // Counter-clockwise ordering!
        const polygons = [];
        for (let i = 0; i < triangles.length; i += 6) {
            const poly = new Phaser.Polygon(
                // These should be in counter-clockwise order from triangulate
                triangles[i + 0], triangles[i + 1], 
                triangles[i + 2], triangles[i + 3], 
                triangles[i + 4], triangles[i + 5]
            );
            polygons.push(poly);
        }
        const navMesh = new NavMesh(this.game, polygons);
        this._navMeshes[levelName] = navMesh;
        this._currentNavMesh = navMesh;
    }

    /**
     * Switch the currently loaded navmesh
     *
     * @param {string} levelName Name of the level to look up in the cache of loaded levels 
     * 
     * @memberof NavMeshPlugin
     */
    switchLevel(levelName) {
        if (this._navMeshes[levelName]) this._currentNavMesh = this._navMeshes[levelName];
    }
    
    /**
     * Find a path from the start point to the end point using the currently loaded navmesh
     * 
     * @param {Phaser.Point} startPoint The starting point in world coordinates
     * @param {Phaser.Point} endPoint The end point in world coordinates
     * @param {boolean} [debugDraw=false] Whether or not to draw debug graphics for the path
     * @param {boolean} [debugPrint=false] Whether or not to pring debug info to the console
     * @returns {Phaser.Point[]|null} An array of points if a path is found, or null if no path
     * 
     * @memberof NavMeshPlugin
     */
    findPath(startPoint, endPoint, debugDraw = false, debugPrint = false) {
        if (!this._currentNavMesh) return;
        const path = this._currentNavMesh.findPath(startPoint, endPoint, debugDraw);
        if (debugPrint) {
            let s = `Path: (${startPoint.x}, ${startPoint.y}) -> (${endPoint.x}, ${endPoint.y})`;
            if (path) {
                for (const p of path) {
                    s += `\n\t(${p.x}, ${p.y})`;
                }
            } else s += `\n\tNo path found.`
            console.log(s);
        }
        return path;
    }

    /**
     * @param {[]} hulls 
     * @returns 
     * 
     * @memberof NavMeshPlugin
     */
    _buildContours(hulls) {
        const w = this.game.width;
        const h = this.game.height;
        // Start the contours
        const contours = [
            // Full screen - counter clockwise
            Float32Array.of(0,0, 0,h, w,h, w,0)
        ];
        // For each convex hull add the contour
        for (const hull of hulls) {
            const contour = [];
            for (const lineInfo of hull) {
                contour.push(lineInfo.line.start.x, lineInfo.line.start.y);
            }
            contours.push(Float32Array.from(contour));
        }
        return contours;
    }
}

module.exports = NavMeshPlugin;