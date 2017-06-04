const jsastar = require("javascript-astar");
const utils = require("./utils");
const NavPoly = require("./navpoly");
const NavGraph = require("./navgraph");
const Channel = require("./channel");

/**
 * The workhorse that builds a navigation mesh from a series of polygons. Once built, the mesh can
 * be asked for a path from one point to another point. It has debug methods for visualizing paths
 * and visualizing the individual polygons. Some terminology:
 * 
 * - neighbor: a polygon that shares part of an edge with another polygon
 * - portal: the line that is the overlapping part of the edge between neighbors
 * - channel: the path of polygons from starting point to end point
 * - pull the string: run the funnel algorithm on the channel so that the path hugs the edges of the
 *   channel. Equivalent to having a string snaking through a hallway and then pulling it taut
 * 
 * TODO:
 *  - The astar heuristic and cost functions may need another pass - they don't always produce the
 *    shortest path. It should probably do the funneling while building the astar path?
 *  - The navmesh assumes any polygon can reach any other polygon. This probably should be extended
 *    to put connected polygons into groups like patroljs.
 *  - I'm sure there is stuff to optimize and test... For generalizing the code, make sure it works
 *    with any convex polgyon - triangles, quads, etc. 
 *  - There are probably optimization tricks to do when dealing with certain types of shapes. E.g. 
 *    we are using axis-aligned boxes for the polygons and it is dead simple to calculate if a point
 *    is inside one of those...
 *  - Would "Points-of-Visibility" pathfinding be any faster than this approach? 
 *    http://www.david-gouveia.com/portfolio/pathfinding-on-a-2d-polygonal-map/ 
 * 
 * @class NavMesh
 */
class NavMesh {

    /**
     * Creates an instance of NavMesh.
     * @param {Phaser.Game} game
     * @param {Phaser.Polygon[]} polygons
     * @param {number} [meshShrinkAmount=0] The amount (in pixels) that the navmesh has been
     * shrunk around obstacles (a.k.a the amount obstacles have been expanded)
     *
     * @memberof NavMesh
     */
    constructor(game, polygons, meshShrinkAmount = 0) {
        this.game = game;
        this._debugGraphics = null;
        this._meshShrinkAmount = meshShrinkAmount;

        // Construct NavPoly instances for each polygon
        this._navPolygons = [];
        for (const [i, polygon] of polygons.entries()) {
            this._navPolygons.push(new NavPoly(game, i, polygon));
        }

        this._calculateNeighbors();

        this.graph = new NavGraph(this._navPolygons);
    }

    findPath(startPoint, endPoint, debugDraw = true) {
        let startPoly = null;
        let endPoly = null;
        let startDistance = Number.MAX_VALUE;
        let endDistance = Number.MAX_VALUE;
        let d, r;

        // Find the closest poly for the starting and ending point
        for (const navPoly of this._navPolygons) {
            r = navPoly.boundingRadius;
            d = navPoly.centroid.distance(startPoint);
            if (d <= startDistance && d <= r && navPoly.constains(startPoint)) {
                startPoly = navPoly;
                startDistance = d;
            }

            d = navPoly.centroid.distance(endPoint);
            if (d <= endDistance && d <= r && navPoly.constains(endPoint)) {
                endPoly = navPoly;
                endDistance = d;
            }
        }

        // If the start point wasn't inside a polygon, run a more liberal check that allows a point
        // to be within meshShrinkAmount radius of a polygon
        if (!startPoly && this._meshShrinkAmount > 0) {
            for (const navPoly of this._navPolygons) {
                // Check if point is within bounding circle to avoid extra projection calculations
                r = navPoly.boundingRadius + this._meshShrinkAmount;
                d = navPoly.centroid.distance(startPoint);
                if (d <= r) {
                    // Check if projected point is within range of a polgyon and is closer than the
                    // previous point
                    const info = this._projectPointToPolygon(startPoint, navPoly);
                    if (info.distance <= this._meshShrinkAmount && info.distance < startDistance) {
                        startPoly = navPoly;
                        startDistance = info.distance;
                    }
                }
            }
        }

        // Same check as above, but for the end point
        if (!endPoly && this._meshShrinkAmount > 0) {
            for (const navPoly of this._navPolygons) {
                r = navPoly.boundingRadius + this._meshShrinkAmount;
                d = navPoly.centroid.distance(endPoint);
                if (d <= r) {
                    const info = this._projectPointToPolygon(endPoint, navPoly);
                    if (info.distance <= this._meshShrinkAmount && info.distance < endDistance) {
                        endPoly = navPoly;
                        endDistance = info.distance;
                    }
                }
            }
        }

        // No matching polygons found for the point
        if (!startPoly || !endPoly) return null;
        
        // Search!
        const astarPath = jsastar.astar.search(this.graph, startPoly, endPoly, {
            heuristic: this.graph.navHeuristic
        });
        // jsastar drops the first point from the path, but the funnel algorithm needs it
        astarPath.unshift(startPoly);
        
        // We have a path, so now time for the funnel algorithm
        const channel = new Channel();
        channel.push(startPoint);
        for (let i = 0; i < astarPath.length - 1; i++) {
            const navPolygon = astarPath[i];
            const nextNavPolygon = astarPath[i + 1];

            // Find the portal
            let portal = null;
            for (let i = 0; i < navPolygon.neighbors.length; i++) {
                if (navPolygon.neighbors[i].id === nextNavPolygon.id) {
                    portal = navPolygon.portals[i];
                }
            }

            // Push the portal vertices into the channel
            channel.push(portal.start, portal.end);
        }
        channel.push(endPoint);

        // Pull a string along the channel to run the funnel
        channel.stringPull();

        // Clone path, excluding duplicates
        let lastPoint = null;
        const phaserPath = [];
        for (const p of channel.path) {
            const newPoint = p.clone();
            if (!lastPoint || !newPoint.equals(lastPoint)) {
                phaserPath.push(newPoint);
            } 
            else {
                console.warn("duplicate!");
            }
            lastPoint = newPoint;
        }

        // We don't need the first one, as we already know our start position
        // phaserPath.shift();

        if (debugDraw) {
            if (!this._debugGraphics) this.enableDebug();
            this._debugGraphics.clear();
            this.redraw();

            // Draw astar path
            this._debugGraphics.lineStyle(10, 0x00FF00);
            this._debugGraphics.moveTo(startPoint.x, startPoint.y);
            for (const navPoly of astarPath) {
                this._debugGraphics.lineTo(navPoly.centroid.x, navPoly.centroid.y);
            }
            this._debugGraphics.lineTo(endPoint.x, endPoint.y);

            // Draw the funnel path
            this._debugGraphics.lineStyle(5, 0xffd900);
            const p = new Phaser.Polygon(...phaserPath);
            p.closed = false;
            this._debugGraphics.drawShape(p); 
            this._debugGraphics.beginFill(0xffd900);
            this._debugGraphics.drawEllipse(startPoint.x, startPoint.y, 10, 10);
            this._debugGraphics.drawEllipse(endPoint.x, endPoint.y, 10, 10);
            this._debugGraphics.endFill();
        }

        return phaserPath;
    }

    _calculateNeighbors() {
        // Fill out the neighbor information for each navpoly
        for (let i = 0; i < this._navPolygons.length; i++) {
            const navPoly = this._navPolygons[i];

            for (let j = i + 1; j < this._navPolygons.length; j++) {
                const otherNavPoly = this._navPolygons[j];

                // Check if the other navpoly is within range to touch
                const d = navPoly.centroid.distance(otherNavPoly.centroid);
                if (d > (navPoly.boundingRadius + otherNavPoly.boundingRadius)) continue;

                // The are in range, so check each edge pairing
                for (const edge of navPoly.edges) {
                    for (const otherEdge of otherNavPoly.edges) {
                        
                        // If edges aren't collinear, not an option for connecting navpolys
                        if (!utils.areCollinear(edge, otherEdge)) continue;

                        // If they are collinear, check if they overlay
                        const overlap = this._getSegmentOverlap(edge, otherEdge);
                        if (!overlap) continue;
                        
                        // Connections are symmetric!
                        navPoly.neighbors.push(otherNavPoly);
                        otherNavPoly.neighbors.push(navPoly);

                        // Calculate the portal between the two polygons - this needs to be in
                        // counter-clockwise order, relative to each polygon
                        const [p1, p2] = overlap;
                        let edgeStartAngle = navPoly.centroid.angle(edge.start);
                        let a1 = navPoly.centroid.angle(overlap[0]);
                        let a2 = navPoly.centroid.angle(overlap[1]);
                        let d1 = utils.angleDifference(edgeStartAngle, a1);
                        let d2 = utils.angleDifference(edgeStartAngle, a2);
                        if (d1 < d2) {
                            navPoly.portals.push(new Phaser.Line(p1.x, p1.y, p2.x, p2.y));
                        } else {
                            navPoly.portals.push(new Phaser.Line(p2.x, p2.y, p1.x, p1.y));
                        }

                        edgeStartAngle = otherNavPoly.centroid.angle(otherEdge.start);
                        a1 = otherNavPoly.centroid.angle(overlap[0]);
                        a2 = otherNavPoly.centroid.angle(overlap[1]);
                        d1 = utils.angleDifference(edgeStartAngle, a1);
                        d2 = utils.angleDifference(edgeStartAngle, a2);
                        if (d1 < d2) {
                            otherNavPoly.portals.push(new Phaser.Line(p1.x, p1.y, p2.x, p2.y));
                        } else {
                            otherNavPoly.portals.push(new Phaser.Line(p2.x, p2.y, p1.x, p1.y));
                        }
                            
                        // Two convex polygons should be connected more than once! (Unless
                        // there are unnecessary vertices...)
                    }
                }
            }
        }
    }

    // http://stackoverflow.com/a/17152247
    // Does not return the points in CCW or CW order! You need to check that.
    _getSegmentOverlap(line1, line2) {
        const points = [
            {line: line1, point: line1.start}, 
            {line: line1, point: line1.end}, 
            {line: line2, point: line2.start}, 
            {line: line2, point: line2.end}
        ]; 
        points.sort(function (a, b) {
            if (a.point.x < b.point.x) return -1;
            else if (a.point.x > b.point.x) return 1;
            else {
                if (a.point.y < b.point.y) return -1;
                else if (a.point.y > b.point.y) return 1;
                else return 0;
            }
        });
        // If the first two points in the array come from the same line, no overlap
        const noOverlap = points[0].line === points[1].line;
        // If the two middle points in the array are the same coordinates, then there is a 
        // single point of overlap.
        const singlePointOverlap = points[1].point.equals(points[2].point);
        if (noOverlap || singlePointOverlap) return null;
        else return [points[1].point, points[2].point];
    }

    _projectPointToPolygon(point, navPoly) {
        let closestProjection = null;
        let closestDistance = Number.MAX_VALUE;
        for (const edge of navPoly.edges) {
            const projectedPoint = this._projectPointToEdge(point, edge);
            const d = point.distance(projectedPoint);
            if (closestProjection === null || d < closestDistance) {
                closestDistance = d;
                closestProjection = projectedPoint;
            }
        }
        return {point: closestProjection, distance: closestDistance};
    }

    _distanceSquared(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dx * dx + dy * dy;
    }

    // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    _projectPointToEdge(point, line) {
        const a = line.start;
        const b = line.end;
        // Consider the parametric equation for the edge's line, p = a + t (b - a). We want to find
        // where our point lies on the line by solving for t:
        //  t = [(p-a) . (b-a)] / |b-a|^2
        const l2 = this._distanceSquared(a, b);
        let t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / l2;
        // We clamp t from [0,1] to handle points outside the segment vw.
        t = Phaser.Math.clamp(t, 0, 1);
        // Project onto the segment
        const p = new Phaser.Point(
            a.x + t * (b.x - a.x),
            a.y + t * (b.y - a.y)
        );
        return p;        
    }

    enableDebug() {
        const g = this.game.add.graphics(0, 0);
        this._debugGraphics = g;
    }

    redraw() {
        this._debugGraphics.clear();
        for (const navPoly of this._navPolygons) {
            navPoly.draw(this._debugGraphics);
        }
        this._debugGraphics.alpha = 0.5;
    }
}

module.exports = NavMesh;