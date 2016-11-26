var hull = require("hull.js");

module.exports = function calculateHullsFromTiles(tilemapLayer) {
    var clusters = calculateClusters(tilemapLayer);
    var hulls = calculateHulls(clusters);
    return hulls;
};

function calculateClusters(tilemapLayer) {
    var tilemap = tilemapLayer.map;
    var clusters = [];
    for (var x = 0; x < tilemap.width; x++) {
        for (var y = 0; y < tilemap.height; y++) {
            var tile = getCollidingTile(x, y);
            if (tile && !findTileInClusters(tile)) {
                var cluster = [];
                recursivelySearchNeighbors(x, y, cluster);
                clusters.push(cluster);
            }
        }
    }

    function getCollidingTile(x, y) {
        var tile = tilemap.getTile(x, y, tilemapLayer.index);
        if (tile && tile.collides) return tile;
        else return null;
    }

    function recursivelySearchNeighbors(x, y, cluster) {
        var tile = getCollidingTile(x, y);
        if (tile && (cluster.indexOf(tile) === -1)) {
            // Add the current tile
            cluster.push(tile);
            // Search the neighbors   
            recursivelySearchNeighbors(x, y - 1, cluster);
            recursivelySearchNeighbors(x, y + 1, cluster);
            recursivelySearchNeighbors(x + 1, y, cluster);
            recursivelySearchNeighbors(x - 1, y, cluster);
        }
    }

    function findTileInClusters(tile) {
        for (var i = 0; i < clusters.length; i++) {
            cluster = clusters[i];
            for (var j = 0; j < cluster.length; j++) {
                if (tile === cluster[j]) return cluster;
            }
        }
        return null;
    }

    return clusters;
}

function getHullPoints(cluster) {
    var tilePoints = [];
    for (var t = 0; t < cluster.length; t++) {
        var tile = cluster[t];
        tilePoints.push(
            [tile.left, tile.top],
            [tile.right, tile.top],                
            [tile.left, tile.bottom],                
            [tile.right, tile.bottom]
        );
    }
    var points = hull(tilePoints, 1);
    return points;
}

function calculateHulls(clusters) {
    var polygons = [];
    for (var i = 0; i < clusters.length; i++) {
        var points = getHullPoints(clusters[i]);
        var lines = [];

        var line = new Phaser.Line(points[0][0], points[0][1], 
            points[1][0], points[1][1]);

        for (var p = 2; p < points.length; p++) {
            var nextSegment = new Phaser.Line(points[p-1][0], points[p-1][1], 
                points[p][0], points[p][1]);

            if (checkIfCollinear(line, nextSegment)) {
                // Extend the current line
                line = new Phaser.Line(line.start.x, line.start.y, 
                    nextSegment.end.x, nextSegment.end.y);
            } else {
                // End the current line and start a new one
                lines.push(line);
                line = nextSegment.clone();             
            }
        }
        
        // Process the last line segment - connecting the last point in the 
        // array back around to the first point
        // TODO: there's a cleaner way to do this...
        var lastSegment = new Phaser.Line(points[p-1][0], points[p-1][1], 
            points[0][0], points[0][1]);   
        if (checkIfCollinear(line, lastSegment)) {
            // Extend the current line and add it
            line = new Phaser.Line(line.start.x, line.start.y, 
                lastSegment.end.x, lastSegment.end.y);
            lines.push(line);
        } else {
            // Add the line and the next segment
            lines.push(line);
            lines.push(lastSegment);            
        }

        // Determine whether the last line and the first line need to be merged
        if (checkIfCollinear(lines[0], lines[lines.length - 1])) {
            var firstLine = lines.shift();
            var lastLine = lines.pop();
            var combinedLine = new Phaser.Line(firstLine.start.x, 
                firstLine.start.y, 
                lastLine.end.x, lastLine.end.y);
            lines.push(combinedLine);
        }

        // TODO: the first and last line may need to be merged! This works right
        // now, but may be generating one more line than needed. 

        // Add the final lines to the polygon
        polygons.push(lines);

    }
    return polygons;
}

function checkIfCollinear(line1, line2) {
    // To check if two slopes are equal:
    //  lineDeltaY / lineDeltaX = segmentDeltaY / segmentDeltaX
    // But to avoid dividing by zero:
    //  (lineDeltaX * segmentDeltaY) - (lineDeltaY * segmentDeltaX) = 0
    var dx1 = line1.end.x - line1.start.x;
    var dy1 = line1.end.y - line1.start.y;
    var dx2 = line2.end.x - line2.start.x;
    var dy2 = line2.end.y - line2.start.y;
    return ((dx1 * dy2) - (dy1 * dx2)) === 0;
}