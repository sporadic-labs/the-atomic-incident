const Path = require("./path.js");

/**
 * A function that can look up an object layer from a Phaser.Tilemap object and parse line paths
 * from it.
 * 
 * @export
 * @param {Phaser.Tilemap} map 
 * @param {string} layerKey The name of the object layer in Tiled  
 * @param {boolean} [shouldReverse=false] Whether or not to reverse the paths when parsing them 
 * @param {string} [selection="all"] Whether to select "all", "even" or "odd" paths in the layer
 * @returns {Path[]}
 */
export function parsePathLayer(map, layerKey, shouldReverse = false, selection = "all") {
    const tiledPaths = map.objects[layerKey] || [];
    const paths = [];

    // Loop over odd numbered, even numbered or all paths
    let start = 0;
    let end = tiledPaths.length;
    let increment = 1;
    selection = selection.toLocaleLowerCase();
    if (selection === "odd") {
        start = 1;
        end = tiledPaths.length;
        increment = 2;
    } else if (selection === "even") {
        start = 0;
        end = tiledPaths.length - 1;
        increment = 2;
    }

    for (var i = start; i < end; i += increment) {
        var pathNodes = tiledPaths[i].polyline || [];
        var startX = tiledPaths[i].x;
        var startY = tiledPaths[i].y;
        var path = new Path();
        for (var j = 0; j < pathNodes.length; j++) {
            path.addPoint(new Phaser.Point(
                startX + pathNodes[j][0], startY + pathNodes[j][1]
            ));
        }
        if (shouldReverse) paths.push(path.reverse());
        else paths.push(path);
    }
    return paths;
}
    
/**
 * A function that can look up an array of layers in a Phaser.Tilemap object and parse the paths
 * into one array. Shorthand string format for use with parsePathLayer:
 *  Example:    path-name:+1:odd
 *  Format:     [name]:[direction, +1/-1]:[selection, odd/even/all]
 * 
 * @export
 * @param {Phaser.Tilemap} map 
 * @param {string[]} pathLayerShorthands Array of shorthands that describe how to parse the paths
 * @returns 
 */
export function parsePathLayers(map, pathLayerShorthands) {
    const allPaths = [];
    for (const pathName of pathLayerShorthands) {
        const [tiledName, direction, selection] = pathName.split(":");
        const shouldReverse = (Number(direction) === -1) ? true : false;
        const paths = parsePathLayer(map, tiledName, shouldReverse, selection);
        allPaths.push(...paths);
    }
    return allPaths;
}