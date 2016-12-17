(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function _cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function _upperTangent(pointset) {
    var lower = [];
    for (var l = 0; l < pointset.length; l++) {
        while (lower.length >= 2 && (_cross(lower[lower.length - 2], lower[lower.length - 1], pointset[l]) <= 0)) {
            lower.pop();
        }
        lower.push(pointset[l]);
    }
    lower.pop();
    return lower;
}

function _lowerTangent(pointset) {
    var reversed = pointset.reverse(),
        upper = [];
    for (var u = 0; u < reversed.length; u++) {
        while (upper.length >= 2 && (_cross(upper[upper.length - 2], upper[upper.length - 1], reversed[u]) <= 0)) {
            upper.pop();
        }
        upper.push(reversed[u]);
    }
    upper.pop();
    return upper;
}

// pointset has to be sorted by X
function convex(pointset) {
    var convex,
        upper = _upperTangent(pointset),
        lower = _lowerTangent(pointset);
    convex = lower.concat(upper);
    convex.push(pointset[0]);  
    return convex;  
}

module.exports = convex;

},{}],2:[function(require,module,exports){
module.exports = {

    toXy: function(pointset, format) {
        if (format === undefined) {
            return pointset.slice();
        }
        return pointset.map(function(pt) {
            /*jslint evil: true */
            var _getXY = new Function('pt', 'return [pt' + format[0] + ',' + 'pt' + format[1] + '];');
            return _getXY(pt);
        });
    },

    fromXy: function(pointset, format) {
        if (format === undefined) {
            return pointset.slice();
        }
        return pointset.map(function(pt) {
            /*jslint evil: true */
            var _getObj = new Function('pt', 'var o = {}; o' + format[0] + '= pt[0]; o' + format[1] + '= pt[1]; return o;');
            return _getObj(pt);
        });
    }

}
},{}],3:[function(require,module,exports){
function Grid(points, cellSize) {
    this._cells = [];
    this._cellSize = cellSize;

    points.forEach(function(point) {
        var cellXY = this.point2CellXY(point),
            x = cellXY[0],
            y = cellXY[1];
        if (this._cells[x] === undefined) {
            this._cells[x] = [];
        }
        if (this._cells[x][y] === undefined) {
            this._cells[x][y] = [];
        }
        this._cells[x][y].push(point);
    }, this);
}

Grid.prototype = {
    cellPoints: function(x, y) { // (Number, Number) -> Array
        return (this._cells[x] !== undefined && this._cells[x][y] !== undefined) ? this._cells[x][y] : [];
    },

    rangePoints: function(bbox) { // (Array) -> Array
        var tlCellXY = this.point2CellXY([bbox[0], bbox[1]]),
            brCellXY = this.point2CellXY([bbox[2], bbox[3]]),
            points = [];

        for (var x = tlCellXY[0]; x <= brCellXY[0]; x++) {
            for (var y = tlCellXY[1]; y <= brCellXY[1]; y++) {
                points = points.concat(this.cellPoints(x, y));
            }
        }

        return points;
    },

    removePoint: function(point) { // (Array) -> Array
        var cellXY = this.point2CellXY(point),
            cell = this._cells[cellXY[0]][cellXY[1]],
            pointIdxInCell;
        
        for (var i = 0; i < cell.length; i++) {
            if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
                pointIdxInCell = i;
                break;
            }
        }

        cell.splice(pointIdxInCell, 1);

        return cell;
    },

    point2CellXY: function(point) { // (Array) -> Array
        var x = parseInt(point[0] / this._cellSize),
            y = parseInt(point[1] / this._cellSize);
        return [x, y];
    },

    extendBbox: function(bbox, scaleFactor) { // (Array, Number) -> Array
        return [
            bbox[0] - (scaleFactor * this._cellSize),
            bbox[1] - (scaleFactor * this._cellSize),
            bbox[2] + (scaleFactor * this._cellSize),
            bbox[3] + (scaleFactor * this._cellSize)
        ];
    }
};

function grid(points, cellSize) {
    return new Grid(points, cellSize);
}

module.exports = grid;
},{}],4:[function(require,module,exports){
/*
 (c) 2014-2016, Andrii Heonia
 Hull.js, a JavaScript library for concave hull generation by set of points.
 https://github.com/AndriiHeonia/hull
*/

'use strict';

var intersect = require('./intersect.js');
var grid = require('./grid.js');
var formatUtil = require('./format.js');
var convexHull = require('./convex.js');

function _filterDuplicates(pointset) {
    return pointset.filter(function(el, idx, arr) {
        var prevEl = arr[idx - 1];
        return idx === 0 || !(prevEl[0] === el[0] && prevEl[1] === el[1]);
    });
}

function _sortByX(pointset) {
    return pointset.sort(function(a, b) {
        if (a[0] == b[0]) {
            return a[1] - b[1];
        } else {
            return a[0] - b[0];
        }
    });
}

function _sqLength(a, b) {
    return Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2);
}

function _cos(o, a, b) {
    var aShifted = [a[0] - o[0], a[1] - o[1]],
        bShifted = [b[0] - o[0], b[1] - o[1]],
        sqALen = _sqLength(o, a),
        sqBLen = _sqLength(o, b),
        dot = aShifted[0] * bShifted[0] + aShifted[1] * bShifted[1];

    return dot / Math.sqrt(sqALen * sqBLen);
}

function _intersect(segment, pointset) {
    for (var i = 0; i < pointset.length - 1; i++) {
        var seg = [pointset[i], pointset[i + 1]];
        if (segment[0][0] === seg[0][0] && segment[0][1] === seg[0][1] ||
            segment[0][0] === seg[1][0] && segment[0][1] === seg[1][1]) {
            continue;
        }
        if (intersect(segment, seg)) {
            return true;
        }
    }
    return false;
}

function _occupiedArea(pointset) {
    var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for (var i = pointset.length - 1; i >= 0; i--) {
        if (pointset[i][0] < minX) {
            minX = pointset[i][0];
        }
        if (pointset[i][1] < minY) {
            minY = pointset[i][1];
        }
        if (pointset[i][0] > maxX) {
            maxX = pointset[i][0];
        }
        if (pointset[i][1] > maxY) {
            maxY = pointset[i][1];
        }
    }

    return [
        maxX - minX, // width
        maxY - minY  // height
    ];
}

function _bBoxAround(edge) {
    return [
        Math.min(edge[0][0], edge[1][0]), // left
        Math.min(edge[0][1], edge[1][1]), // top
        Math.max(edge[0][0], edge[1][0]), // right
        Math.max(edge[0][1], edge[1][1])  // bottom
    ];
}

function _midPoint(edge, innerPoints, convex) {
    var point = null,
        angle1Cos = MAX_CONCAVE_ANGLE_COS,
        angle2Cos = MAX_CONCAVE_ANGLE_COS,
        a1Cos, a2Cos;

    for (var i = 0; i < innerPoints.length; i++) {
        a1Cos = _cos(edge[0], edge[1], innerPoints[i]);
        a2Cos = _cos(edge[1], edge[0], innerPoints[i]);

        if (a1Cos > angle1Cos && a2Cos > angle2Cos &&
            !_intersect([edge[0], innerPoints[i]], convex) &&
            !_intersect([edge[1], innerPoints[i]], convex)) {

            angle1Cos = a1Cos;
            angle2Cos = a2Cos;
            point = innerPoints[i];
        }
    }

    return point;
}

function _concave(convex, maxSqEdgeLen, maxSearchArea, grid, edgeSkipList) {
    var edge,
        keyInSkipList,
        scaleFactor,
        midPoint,
        bBoxAround,
        bBoxWidth,
        bBoxHeight,
        midPointInserted = false;

    for (var i = 0; i < convex.length - 1; i++) {
        edge = [convex[i], convex[i + 1]];
        keyInSkipList = edge[0].join() + ',' + edge[1].join();

        if (_sqLength(edge[0], edge[1]) < maxSqEdgeLen ||
            edgeSkipList[keyInSkipList] === true) { continue; }

        scaleFactor = 0;
        bBoxAround = _bBoxAround(edge);
        do {
            bBoxAround = grid.extendBbox(bBoxAround, scaleFactor);
            bBoxWidth = bBoxAround[2] - bBoxAround[0];
            bBoxHeight = bBoxAround[3] - bBoxAround[1];

            midPoint = _midPoint(edge, grid.rangePoints(bBoxAround), convex);            
            scaleFactor++;
        }  while (midPoint === null && (maxSearchArea[0] > bBoxWidth || maxSearchArea[1] > bBoxHeight));

        if (bBoxWidth >= maxSearchArea[0] && bBoxHeight >= maxSearchArea[1]) {
            edgeSkipList[keyInSkipList] = true;
        }

        if (midPoint !== null) {
            convex.splice(i + 1, 0, midPoint);
            grid.removePoint(midPoint);
            midPointInserted = true;
        }
    }

    if (midPointInserted) {
        return _concave(convex, maxSqEdgeLen, maxSearchArea, grid, edgeSkipList);
    }

    return convex;
}

function hull(pointset, concavity, format) {
    var convex,
        concave,
        innerPoints,
        occupiedArea,
        maxSearchArea,
        cellSize,
        points,
        maxEdgeLen = concavity || 20;

    if (pointset.length < 4) {
        return pointset.slice();
    }

    points = _filterDuplicates(_sortByX(formatUtil.toXy(pointset, format)));

    occupiedArea = _occupiedArea(points);
    maxSearchArea = [
        occupiedArea[0] * MAX_SEARCH_BBOX_SIZE_PERCENT,
        occupiedArea[1] * MAX_SEARCH_BBOX_SIZE_PERCENT
    ];

    convex = convexHull(points);
    innerPoints = points.filter(function(pt) {
        return convex.indexOf(pt) < 0;
    });

    cellSize = Math.ceil(1 / (points.length / (occupiedArea[0] * occupiedArea[1])));

    concave = _concave(
        convex, Math.pow(maxEdgeLen, 2),
        maxSearchArea, grid(innerPoints, cellSize), {});
 
    return formatUtil.fromXy(concave, format);
}

var MAX_CONCAVE_ANGLE_COS = Math.cos(90 / (180 / Math.PI)); // angle = 90 deg
var MAX_SEARCH_BBOX_SIZE_PERCENT = 0.6;

module.exports = hull;
},{"./convex.js":1,"./format.js":2,"./grid.js":3,"./intersect.js":5}],5:[function(require,module,exports){
function ccw(x1, y1, x2, y2, x3, y3) {           
    var cw = ((y3 - y1) * (x2 - x1)) - ((y2 - y1) * (x3 - x1));
    return cw > 0 ? true : cw < 0 ? false : true; // colinear
}

function intersect(seg1, seg2) {
  var x1 = seg1[0][0], y1 = seg1[0][1],
      x2 = seg1[1][0], y2 = seg1[1][1],
      x3 = seg2[0][0], y3 = seg2[0][1],
      x4 = seg2[1][0], y4 = seg2[1][1];

    return ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) && ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);
}

module.exports = intersect;
},{}],6:[function(require,module,exports){
// Version 0.5.0 - Copyright 2012 - 2015 -  Jim Riecken <jimr@jimr.ca>
//
// Released under the MIT License - https://github.com/jriecken/sat-js
//
// A simple library for determining intersections of circles and
// polygons using the Separating Axis Theorem.
/** @preserve SAT.js - Version 0.5.0 - Copyright 2012 - 2015 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */

/*global define: false, module: false*/
/*jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true, 
  eqeqeq:true, bitwise:true, strict:true, undef:true, 
  curly:true, browser:true */

// Create a UMD wrapper for SAT. Works in:
//
//  - Plain browser via global SAT variable
//  - AMD loader (like require.js)
//  - Node.js
//
// The quoted properties all over the place are used so that the Closure Compiler
// does not mangle the exposed API in advanced mode.
/**
 * @param {*} root - The global scope
 * @param {Function} factory - Factory that creates SAT module
 */
(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define['amd']) {
    define(factory);
  } else if (typeof exports === 'object') {
    module['exports'] = factory();
  } else {
    root['SAT'] = factory();
  }
}(this, function () {
  "use strict";

  var SAT = {};

  //
  // ## Vector
  //
  // Represents a vector in two dimensions with `x` and `y` properties.


  // Create a new Vector, optionally passing in the `x` and `y` coordinates. If
  // a coordinate is not specified, it will be set to `0`
  /** 
   * @param {?number=} x The x position.
   * @param {?number=} y The y position.
   * @constructor
   */
  function Vector(x, y) {
    this['x'] = x || 0;
    this['y'] = y || 0;
  }
  SAT['Vector'] = Vector;
  // Alias `Vector` as `V`
  SAT['V'] = Vector;


  // Copy the values of another Vector into this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['copy'] = Vector.prototype.copy = function(other) {
    this['x'] = other['x'];
    this['y'] = other['y'];
    return this;
  };

  // Create a new vector with the same coordinates as this on.
  /**
   * @return {Vector} The new cloned vector
   */
  Vector.prototype['clone'] = Vector.prototype.clone = function() {
    return new Vector(this['x'], this['y']);
  };

  // Change this vector to be perpendicular to what it was before. (Effectively
  // roatates it 90 degrees in a clockwise direction)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['perp'] = Vector.prototype.perp = function() {
    var x = this['x'];
    this['x'] = this['y'];
    this['y'] = -x;
    return this;
  };

  // Rotate this vector (counter-clockwise) by the specified angle (in radians).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Vector} This for chaining.
   */
  Vector.prototype['rotate'] = Vector.prototype.rotate = function (angle) {
    var x = this['x'];
    var y = this['y'];
    this['x'] = x * Math.cos(angle) - y * Math.sin(angle);
    this['y'] = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
  };

  // Reverse this vector.
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reverse'] = Vector.prototype.reverse = function() {
    this['x'] = -this['x'];
    this['y'] = -this['y'];
    return this;
  };
  

  // Normalize this vector.  (make it have length of `1`)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['normalize'] = Vector.prototype.normalize = function() {
    var d = this.len();
    if(d > 0) {
      this['x'] = this['x'] / d;
      this['y'] = this['y'] / d;
    }
    return this;
  };
  
  // Add another vector to this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['add'] = Vector.prototype.add = function(other) {
    this['x'] += other['x'];
    this['y'] += other['y'];
    return this;
  };
  
  // Subtract another vector from this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  Vector.prototype['sub'] = Vector.prototype.sub = function(other) {
    this['x'] -= other['x'];
    this['y'] -= other['y'];
    return this;
  };
  
  // Scale this vector. An independant scaling factor can be provided
  // for each axis, or a single scaling factor that will scale both `x` and `y`.
  /**
   * @param {number} x The scaling factor in the x direction.
   * @param {?number=} y The scaling factor in the y direction.  If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['scale'] = Vector.prototype.scale = function(x,y) {
    this['x'] *= x;
    this['y'] *= y || x;
    return this; 
  };
  
  // Project this vector on to another vector.
  /**
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['project'] = Vector.prototype.project = function(other) {
    var amt = this.dot(other) / other.len2();
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Project this vector onto a vector of unit length. This is slightly more efficient
  // than `project` when dealing with unit vectors.
  /**
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['projectN'] = Vector.prototype.projectN = function(other) {
    var amt = this.dot(other);
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Reflect this vector on an arbitrary axis.
  /**
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflect'] = Vector.prototype.reflect = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.project(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Reflect this vector on an arbitrary axis (represented by a unit vector). This is
  // slightly more efficient than `reflect` when dealing with an axis that is a unit vector.
  /**
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflectN'] = Vector.prototype.reflectN = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.projectN(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Get the dot product of this vector and another.
  /**
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  Vector.prototype['dot'] = Vector.prototype.dot = function(other) {
    return this['x'] * other['x'] + this['y'] * other['y'];
  };
  
  // Get the squared length of this vector.
  /**
   * @return {number} The length^2 of this vector.
   */
  Vector.prototype['len2'] = Vector.prototype.len2 = function() {
    return this.dot(this);
  };
  
  // Get the length of this vector.
  /**
   * @return {number} The length of this vector.
   */
  Vector.prototype['len'] = Vector.prototype.len = function() {
    return Math.sqrt(this.len2());
  };
  
  // ## Circle
  //
  // Represents a circle with a position and a radius.

  // Create a new circle, optionally passing in a position and/or radius. If no position
  // is given, the circle will be at `(0,0)`. If no radius is provided, the circle will
  // have a radius of `0`.
  /**
   * @param {Vector=} pos A vector representing the position of the center of the circle
   * @param {?number=} r The radius of the circle
   * @constructor
   */
  function Circle(pos, r) {
    this['pos'] = pos || new Vector();
    this['r'] = r || 0;
  }
  SAT['Circle'] = Circle;
  
  // Compute the axis-aligned bounding box (AABB) of this Circle.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Circle.prototype['getAABB'] = Circle.prototype.getAABB = function() {
    var r = this['r'];
    var corner = this["pos"].clone().sub(new Vector(r, r));
    return new Box(corner, r*2, r*2).toPolygon();
  };

  // ## Polygon
  //
  // Represents a *convex* polygon with any number of points (specified in counter-clockwise order)
  //
  // Note: Do _not_ manually change the `points`, `angle`, or `offset` properties. Use the
  // provided setters. Otherwise the calculated properties will not be updated correctly.
  //
  // `pos` can be changed directly.

  // Create a new polygon, passing in a position vector, and an array of points (represented
  // by vectors relative to the position vector). If no position is passed in, the position
  // of the polygon will be `(0,0)`.
  /**
   * @param {Vector=} pos A vector representing the origin of the polygon. (all other
   *   points are relative to this one)
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @constructor
   */
  function Polygon(pos, points) {
    this['pos'] = pos || new Vector();
    this['angle'] = 0;
    this['offset'] = new Vector();
    this.setPoints(points || []);
  }
  SAT['Polygon'] = Polygon;
  
  // Set the points of the polygon.
  /**
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setPoints'] = Polygon.prototype.setPoints = function(points) {
    // Only re-allocate if this is a new polygon or the number of points has changed.
    var lengthChanged = !this['points'] || this['points'].length !== points.length;
    if (lengthChanged) {
      var i;
      var calcPoints = this['calcPoints'] = [];
      var edges = this['edges'] = [];
      var normals = this['normals'] = [];
      // Allocate the vector arrays for the calculated properties
      for (i = 0; i < points.length; i++) {
        calcPoints.push(new Vector());
        edges.push(new Vector());
        normals.push(new Vector());
      }
    }
    this['points'] = points;
    this._recalc();
    return this;
  };

  // Set the current rotation angle of the polygon.
  /**
   * @param {number} angle The current rotation angle (in radians).
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setAngle'] = Polygon.prototype.setAngle = function(angle) {
    this['angle'] = angle;
    this._recalc();
    return this;
  };

  // Set the current offset to apply to the `points` before applying the `angle` rotation.
  /**
   * @param {Vector} offset The new offset vector.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['setOffset'] = Polygon.prototype.setOffset = function(offset) {
    this['offset'] = offset;
    this._recalc();
    return this;
  };

  // Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
  //
  // Note: This changes the **original** points (so any `angle` will be applied on top of this rotation).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['rotate'] = Polygon.prototype.rotate = function(angle) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].rotate(angle);
    }
    this._recalc();
    return this;
  };

  // Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
  // system* (i.e. `pos`).
  //
  // This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
  // the coordinates of `pos`.
  //
  // Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
  /**
   * @param {number} x The horizontal amount to translate.
   * @param {number} y The vertical amount to translate.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['translate'] = Polygon.prototype.translate = function (x, y) {
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
  };


  // Computes the calculated collision polygon. Applies the `angle` and `offset` to the original points then recalculates the
  // edges and normals of the collision polygon.
  /**
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype._recalc = function() {
    // Calculated points - this is what is used for underlying collisions and takes into account
    // the angle/offset set on the polygon.
    var calcPoints = this['calcPoints'];
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    var edges = this['edges'];
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    var normals = this['normals'];
    // Copy the original points array and apply the offset/angle
    var points = this['points'];
    var offset = this['offset'];
    var angle = this['angle'];
    var len = points.length;
    var i;
    for (i = 0; i < len; i++) {
      var calcPoint = calcPoints[i].copy(points[i]);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (angle !== 0) {
        calcPoint.rotate(angle);
      }
    }
    // Calculate the edges/normals
    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i];
      var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
      var e = edges[i].copy(p2).sub(p1);
      normals[i].copy(e).perp().normalize();
    }
    return this;
  };
  
  
  // Compute the axis-aligned bounding box. Any current state
  // (translations/rotations) will be applied before constructing the AABB.
  //
  // Note: Returns a _new_ `Polygon` each time you call this.
  /**
   * @return {Polygon} The AABB
   */
  Polygon.prototype["getAABB"] = Polygon.prototype.getAABB = function() {
    var points = this["calcPoints"];
    var len = points.length;
    var xMin = points[0]["x"];
    var yMin = points[0]["y"];
    var xMax = points[0]["x"];
    var yMax = points[0]["y"];
    for (var i = 1; i < len; i++) {
      var point = points[i];
      if (point["x"] < xMin) {
        xMin = point["x"];
      }
      else if (point["x"] > xMax) {
        xMax = point["x"];
      }
      if (point["y"] < yMin) {
        yMin = point["y"];
      }
      else if (point["y"] > yMax) {
        yMax = point["y"];
      }
    }
    return new Box(this["pos"].clone().add(new Vector(xMin, yMin)), xMax - xMin, yMax - yMin).toPolygon();
  };
  

  // ## Box
  //
  // Represents an axis-aligned box, with a width and height.


  // Create a new box, with the specified position, width, and height. If no position
  // is given, the position will be `(0,0)`. If no width or height are given, they will
  // be set to `0`.
  /**
   * @param {Vector=} pos A vector representing the top-left of the box.
   * @param {?number=} w The width of the box.
   * @param {?number=} h The height of the box.
   * @constructor
   */
  function Box(pos, w, h) {
    this['pos'] = pos || new Vector();
    this['w'] = w || 0;
    this['h'] = h || 0;
  }
  SAT['Box'] = Box;

  // Returns a polygon whose edges are the same as this box.
  /**
   * @return {Polygon} A new Polygon that represents this box.
   */
  Box.prototype['toPolygon'] = Box.prototype.toPolygon = function() {
    var pos = this['pos'];
    var w = this['w'];
    var h = this['h'];
    return new Polygon(new Vector(pos['x'], pos['y']), [
     new Vector(), new Vector(w, 0), 
     new Vector(w,h), new Vector(0,h)
    ]);
  };
  
  // ## Response
  //
  // An object representing the result of an intersection. Contains:
  //  - The two objects participating in the intersection
  //  - The vector representing the minimum change necessary to extract the first object
  //    from the second one (as well as a unit vector in that direction and the magnitude
  //    of the overlap)
  //  - Whether the first object is entirely inside the second, and vice versa.
  /**
   * @constructor
   */  
  function Response() {
    this['a'] = null;
    this['b'] = null;
    this['overlapN'] = new Vector();
    this['overlapV'] = new Vector();
    this.clear();
  }
  SAT['Response'] = Response;

  // Set some values of the response back to their defaults.  Call this between tests if
  // you are going to reuse a single Response object for multiple intersection tests (recommented
  // as it will avoid allcating extra memory)
  /**
   * @return {Response} This for chaining
   */
  Response.prototype['clear'] = Response.prototype.clear = function() {
    this['aInB'] = true;
    this['bInA'] = true;
    this['overlap'] = Number.MAX_VALUE;
    return this;
  };

  // ## Object Pools

  // A pool of `Vector` objects that are used in calculations to avoid
  // allocating memory.
  /**
   * @type {Array.<Vector>}
   */
  var T_VECTORS = [];
  for (var i = 0; i < 10; i++) { T_VECTORS.push(new Vector()); }
  
  // A pool of arrays of numbers used in calculations to avoid allocating
  // memory.
  /**
   * @type {Array.<Array.<number>>}
   */
  var T_ARRAYS = [];
  for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

  // Temporary response used for polygon hit detection.
  /**
   * @type {Response}
   */
  var T_RESPONSE = new Response();

  // Unit square polygon used for polygon hit detection.
  /**
   * @type {Polygon}
   */
  var UNIT_SQUARE = new Box(new Vector(), 1, 1).toPolygon();

  // ## Helper Functions

  // Flattens the specified array of points onto a unit vector axis,
  // resulting in a one dimensional range of the minimum and
  // maximum value on that axis.
  /**
   * @param {Array.<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array.<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE;
    var max = -Number.MAX_VALUE;
    var len = points.length;
    for (var i = 0; i < len; i++ ) {
      // The magnitude of the projection of the point onto the normal
      var dot = points[i].dot(normal);
      if (dot < min) { min = dot; }
      if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
  }
  
  // Check whether two convex polygons are separated by the specified
  // axis (must be a unit vector).
  /**
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array.<Vector>} aPoints The points in the first polygon.
   * @param {Array.<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @param {Response=} response A Response object (optional) which will be populated
   *   if the axis is not a separating axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = T_ARRAYS.pop();
    var rangeB = T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      T_VECTORS.push(offsetV); 
      T_ARRAYS.push(rangeA); 
      T_ARRAYS.push(rangeB);
      return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
      var overlap = 0;
      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response['aInB'] = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) { 
          overlap = rangeA[1] - rangeB[0];
          response['bInA'] = false;
        // B is fully inside A.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      // B starts further left than A
      } else {
        response['bInA'] = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) { 
          overlap = rangeA[0] - rangeB[1];
          response['aInB'] = false;
        // A is fully inside B.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }
      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      var absOverlap = Math.abs(overlap);
      if (absOverlap < response['overlap']) {
        response['overlap'] = absOverlap;
        response['overlapN'].copy(axis);
        if (overlap < 0) {
          response['overlapN'].reverse();
        }
      }      
    }
    T_VECTORS.push(offsetV); 
    T_ARRAYS.push(rangeA); 
    T_ARRAYS.push(rangeB);
    return false;
  }
  
  // Calculates which Vornoi region a point is on a line segment.
  // It is assumed that both the line and the point are relative to `(0,0)`
  //
  //            |       (0)      |
  //     (-1)  [S]--------------[E]  (1)
  //            |       (0)      |
  /**
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return  {number} LEFT_VORNOI_REGION (-1) if it is the left region, 
   *          MIDDLE_VORNOI_REGION (0) if it is the middle region, 
   *          RIGHT_VORNOI_REGION (1) if it is the right region.
   */
  function vornoiRegion(line, point) {
    var len2 = line.len2();
    var dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left vornoi region.
    if (dp < 0) { return LEFT_VORNOI_REGION; }
    // If the point is beyond the end of the line, it is in the
    // right vornoi region.
    else if (dp > len2) { return RIGHT_VORNOI_REGION; }
    // Otherwise, it's in the middle one.
    else { return MIDDLE_VORNOI_REGION; }
  }
  // Constants for Vornoi regions
  /**
   * @const
   */
  var LEFT_VORNOI_REGION = -1;
  /**
   * @const
   */
  var MIDDLE_VORNOI_REGION = 0;
  /**
   * @const
   */
  var RIGHT_VORNOI_REGION = 1;
  
  // ## Collision Tests

  // Check if a point is inside a circle.
  /**
   * @param {Vector} p The point to test.
   * @param {Circle} c The circle to test.
   * @return {boolean} true if the point is inside the circle, false if it is not.
   */
  function pointInCircle(p, c) {
    var differenceV = T_VECTORS.pop().copy(p).sub(c['pos']);
    var radiusSq = c['r'] * c['r'];
    var distanceSq = differenceV.len2();
    T_VECTORS.push(differenceV);
    // If the distance between is smaller than the radius then the point is inside the circle.
    return distanceSq <= radiusSq;
  }
  SAT['pointInCircle'] = pointInCircle;

  // Check if a point is inside a convex polygon.
  /**
   * @param {Vector} p The point to test.
   * @param {Polygon} poly The polygon to test.
   * @return {boolean} true if the point is inside the polygon, false if it is not.
   */
  function pointInPolygon(p, poly) {
    UNIT_SQUARE['pos'].copy(p);
    T_RESPONSE.clear();
    var result = testPolygonPolygon(UNIT_SQUARE, poly, T_RESPONSE);
    if (result) {
      result = T_RESPONSE['aInB'];
    }
    return result;
  }
  SAT['pointInPolygon'] = pointInPolygon;

  // Check if two circles collide.
  /**
   * @param {Circle} a The first circle.
   * @param {Circle} b The second circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   the circles intersect.
   * @return {boolean} true if the circles intersect, false if they don't. 
   */
  function testCircleCircle(a, b, response) {
    // Check if the distance between the centers of the two
    // circles is greater than their combined radius.
    var differenceV = T_VECTORS.pop().copy(b['pos']).sub(a['pos']);
    var totalRadius = a['r'] + b['r'];
    var totalRadiusSq = totalRadius * totalRadius;
    var distanceSq = differenceV.len2();
    // If the distance is bigger than the combined radius, they don't intersect.
    if (distanceSq > totalRadiusSq) {
      T_VECTORS.push(differenceV);
      return false;
    }
    // They intersect.  If we're calculating a response, calculate the overlap.
    if (response) { 
      var dist = Math.sqrt(distanceSq);
      response['a'] = a;
      response['b'] = b;
      response['overlap'] = totalRadius - dist;
      response['overlapN'].copy(differenceV.normalize());
      response['overlapV'].copy(differenceV).scale(response['overlap']);
      response['aInB']= a['r'] <= b['r'] && dist <= b['r'] - a['r'];
      response['bInA'] = b['r'] <= a['r'] && dist <= a['r'] - b['r'];
    }
    T_VECTORS.push(differenceV);
    return true;
  }
  SAT['testCircleCircle'] = testCircleCircle;
  
  // Check if a polygon and a circle collide.
  /**
   * @param {Polygon} polygon The polygon.
   * @param {Circle} circle The circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonCircle(polygon, circle, response) {
    // Get the position of the circle relative to the polygon.
    var circlePos = T_VECTORS.pop().copy(circle['pos']).sub(polygon['pos']);
    var radius = circle['r'];
    var radius2 = radius * radius;
    var points = polygon['calcPoints'];
    var len = points.length;
    var edge = T_VECTORS.pop();
    var point = T_VECTORS.pop();
    
    // For each edge in the polygon:
    for (var i = 0; i < len; i++) {
      var next = i === len - 1 ? 0 : i + 1;
      var prev = i === 0 ? len - 1 : i - 1;
      var overlap = 0;
      var overlapN = null;
      
      // Get the edge.
      edge.copy(polygon['edges'][i]);
      // Calculate the center of the circle relative to the starting point of the edge.
      point.copy(circlePos).sub(points[i]);
      
      // If the distance between the center of the circle and the point
      // is bigger than the radius, the polygon is definitely not fully in
      // the circle.
      if (response && point.len2() > radius2) {
        response['aInB'] = false;
      }
      
      // Calculate which Vornoi region the center of the circle is in.
      var region = vornoiRegion(edge, point);
      // If it's the left region:
      if (region === LEFT_VORNOI_REGION) { 
        // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
        edge.copy(polygon['edges'][prev]);
        // Calculate the center of the circle relative the starting point of the previous edge
        var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
        region = vornoiRegion(edge, point2);
        if (region === RIGHT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge);
            T_VECTORS.push(point); 
            T_VECTORS.push(point2);
            return false;
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
        T_VECTORS.push(point2);
      // If it's the right region:
      } else if (region === RIGHT_VORNOI_REGION) {
        // We need to make sure we're in the left region on the next edge
        edge.copy(polygon['edges'][next]);
        // Calculate the center of the circle relative to the starting point of the next edge.
        point.copy(circlePos).sub(points[next]);
        region = vornoiRegion(edge, point);
        if (region === LEFT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge); 
            T_VECTORS.push(point);
            return false;              
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
      // Otherwise, it's the middle region:
      } else {
        // Need to check if the circle is intersecting the edge,
        // Change the edge into its "edge normal".
        var normal = edge.perp().normalize();
        // Find the perpendicular distance between the center of the 
        // circle and the edge.
        var dist = point.dot(normal);
        var distAbs = Math.abs(dist);
        // If the circle is on the outside of the edge, there is no intersection.
        if (dist > 0 && distAbs > radius) {
          // No intersection
          T_VECTORS.push(circlePos); 
          T_VECTORS.push(normal); 
          T_VECTORS.push(point);
          return false;
        } else if (response) {
          // It intersects, calculate the overlap.
          overlapN = normal;
          overlap = radius - dist;
          // If the center of the circle is on the outside of the edge, or part of the
          // circle is on the outside, the circle is not fully inside the polygon.
          if (dist >= 0 || overlap < 2 * radius) {
            response['bInA'] = false;
          }
        }
      }
      
      // If this is the smallest overlap we've seen, keep it. 
      // (overlapN may be null if the circle was in the wrong Vornoi region).
      if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
        response['overlap'] = overlap;
        response['overlapN'].copy(overlapN);
      }
    }
    
    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
      response['a'] = polygon;
      response['b'] = circle;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    T_VECTORS.push(circlePos); 
    T_VECTORS.push(edge); 
    T_VECTORS.push(point);
    return true;
  }
  SAT['testPolygonCircle'] = testPolygonCircle;
  
  // Check if a circle and a polygon collide.
  //
  // **NOTE:** This is slightly less efficient than polygonCircle as it just
  // runs polygonCircle and reverses everything at the end.
  /**
   * @param {Circle} circle The circle.
   * @param {Polygon} polygon The polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testCirclePolygon(circle, polygon, response) {
    // Test the polygon against the circle.
    var result = testPolygonCircle(polygon, circle, response);
    if (result && response) {
      // Swap A and B in the response.
      var a = response['a'];
      var aInB = response['aInB'];
      response['overlapN'].reverse();
      response['overlapV'].reverse();
      response['a'] = response['b'];
      response['b'] = a;
      response['aInB'] = response['bInA'];
      response['bInA'] = aInB;
    }
    return result;
  }
  SAT['testCirclePolygon'] = testCirclePolygon;
  
  // Checks whether polygons collide.
  /**
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonPolygon(a, b, response) {
    var aPoints = a['calcPoints'];
    var aLen = aPoints.length;
    var bPoints = b['calcPoints'];
    var bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (var i = 0; i < aLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, a['normals'][i], response)) {
        return false;
      }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (var i = 0;i < bLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, b['normals'][i], response)) {
        return false;
      }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response['a'] = a;
      response['b'] = b;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    return true;
  }
  SAT['testPolygonPolygon'] = testPolygonPolygon;

  return SAT;
}));

},{}],7:[function(require,module,exports){
module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;

    this.fixedToCamera = true;

    var textStyle = {
        font: "32px Arial",
        fill: "#9C9C9C",
        align: "left"
    };
    this._scoreText = game.make.text(30, 20, "Score: 0", textStyle);
    this.add(this._scoreText);
    this._comboText = game.make.text(30, 60, "Combo: 0", textStyle);
    this.add(this._comboText);
    this._ammoText = game.make.text(30, 100, "Ammo: 0", textStyle);
    this.add(this._ammoText);
    this._debugText = game.make.text(30, game.height - 40, 
        "Debug ('E' key): false", textStyle);
    this._debugText.fontSize = 14;
    this.add(this._debugText);
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreText.setText("Score: " + this._scoreKeeper.getScore());
    if (this._player._gunType === "default") {
        this._ammoText.setText("Ammo: -");
    } else {
        this._ammoText.setText("Ammo: " + 
            this._player.getAmmo() + " / " + this._player.getGun()._totalAmmo);
    }
    this._comboText.setText("Combo: " + this._player.getCombo());
    this._debugText.setText("Debug ('E' key): " + 
        this._satBodyPlugin.isDebugAllEnabled());
};
},{}],8:[function(require,module,exports){
module.exports = Player;

var Controller = require("../helpers/controller.js");
var spriteUtils = require("../helpers/sprite-utilities.js");
var ComboTracker = require("../helpers/combo-tracker.js");
var Reticule = require("./reticule.js");
var Gun = require("./weapons/gun.js");
var MachineGun = require("./weapons/machine-gun.js");
var Laser = require("./weapons/laser.js");
var Arrow = require("./weapons/arrow.js");
var Beam = require("./weapons/beam.js");
var MeleeWeapon = require("./weapons/melee-weapon.js");
var Scattershot = require("./weapons/scattershot.js");
var Flamethrower = require("./weapons/flamethrower.js");
var Explosive = require("./weapons/explosive.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move",
    ATTACK: "attack",
    HIT: "hit",
    DIE: "die"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);

function Player(game, x, y, parentGroup) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._isShooting = false;
    this._isDead = false;

    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;

    // Combo
    this._comboTracker = new ComboTracker(game, 2000);

    // Reticle
    this._reticule = new Reticule(game, globals.groups.foreground);

    // Weapons
    this._gun = new Gun(game, parentGroup, this);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("player/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("player/move-", 1, 4, 
        "", 2);
    var attackFrames = Phaser.Animation.generateFrameNames("player/attack-", 2,
        4, "", 2);
    var hitFrames = Phaser.Animation.generateFrameNames("player/hit-", 1, 4, 
        "", 2);
    var dieFrames = Phaser.Animation.generateFrameNames("player/die-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 4, true);
    this.animations.add(ANIM_NAMES.ATTACK, attackFrames, 10, true);
    this.animations.add(ANIM_NAMES.HIT, hitFrames, 10, false);
    this.animations.add(ANIM_NAMES.DIE, dieFrames, 10, false);
    this.animations.play(ANIM_NAMES.IDLE);

    // Configure player physics
    this._maxSpeed = 50;
    this._customDrag = 1000;
    this._maxAcceleration = 5000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setCircle(this.width/2); // Fudge factor

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);

    // Player controls
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    // movement
    this._controls.addKeyboardControl("move-up", [Kb.W]);
    this._controls.addKeyboardControl("move-left", [Kb.A]);
    this._controls.addKeyboardControl("move-right", [Kb.D]);
    this._controls.addKeyboardControl("move-down", [Kb.S]);
    // primary attack
    this._controls.addKeyboardControl("attack-up", [Kb.UP]);
    this._controls.addKeyboardControl("attack-left", [Kb.LEFT]);
    this._controls.addKeyboardControl("attack-right", [Kb.RIGHT]);
    this._controls.addKeyboardControl("attack-down", [Kb.DOWN]);
    this._controls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);
    // special attack
    this._controls.addKeyboardControl("attack-space", [Kb.SPACEBAR]);
    this._controls.addMouseDownControl("attack-special",
        Phaser.Pointer.RIGHT_BUTTON);
    // Cycling weapons
    this._controls.addKeyboardControl("weapon-sword", [Kb.ONE]);
    this._controls.addKeyboardControl("weapon-scattershot", [Kb.TWO]);
    this._controls.addKeyboardControl("weapon-flamethrower", [Kb.THREE]);
    this._controls.addKeyboardControl("weapon-machine-gun", [Kb.FOUR]);
    this._controls.addKeyboardControl("weapon-laser", [Kb.FIVE]);
    this._controls.addKeyboardControl("weapon-beam", [Kb.SIX]);
    this._controls.addKeyboardControl("weapon-arrow", [Kb.SEVEN]);
    this._controls.addKeyboardControl("explosive", [Kb.EIGHT]);
}

Player.prototype.getCombo = function () {
    return this._comboTracker.getCombo();
};

Player.prototype.incrementCombo = function (increment) {
    this._comboTracker.incrementCombo(increment);
    var newSpeed = Phaser.Math.mapLinear(this.getCombo(), 0, 50, 50, 500);
    newSpeed = Phaser.Math.clamp(newSpeed, 50, 500);
    this._maxSpeed = newSpeed; 
};

Player.prototype.update = function () {
    this._controls.update();
    
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    if (this._controls.isControlActive("move-left")) acceleration.x = -1;
    else if (this._controls.isControlActive("move-right")) acceleration.x = 1;
    if (this._controls.isControlActive("move-up")) acceleration.y = -1;
    else if (this._controls.isControlActive("move-down")) acceleration.y = 1;

    // Normalize the acceleration and set the magnitude. This makes it so that
    // the player moves in the same speed in all directions.
    acceleration = acceleration.setMagnitude(this._maxAcceleration);
    this.body.acceleration.copyFrom(acceleration);

    // Cap the velocity. Phaser physics's max velocity caps the velocity in the
    // x & y dimensions separately. This allows the sprite to move faster along
    // a diagonal than it would along the x or y axis. To fix that, we need to
    // cap the velocity based on it's magnitude.
    if (this.body.velocity.getMagnitude() > this._maxSpeed) {
        this.body.velocity.setMagnitude(this._maxSpeed);
    }

    // Custom drag. Arcade drag runs the calculation on each axis separately. 
    // This leads to more drag in the diagonal than in other directions.  To fix
    // that, we need to apply drag ourselves.
    /* jshint ignore:start */
    // Based on: https://github.com/photonstorm/phaser/blob/v2.4.8/src/physics/arcade/World.js#L257
    /* jshint ignore:end */
    if (acceleration.isZero() && !this.body.velocity.isZero()) {
        var dragMagnitude = this._customDrag * this.game.time.physicsElapsed;
        if (this.body.velocity.getMagnitude() < dragMagnitude) {
            // Snap to 0 velocity so that we avoid the drag causing the velocity
            // to flip directions and end up oscillating
            this.body.velocity.set(0);
        } else {
            // Apply drag in opposite direction of velocity
            var drag = this.body.velocity.clone()
                .setMagnitude(-1 * dragMagnitude); 
            this.body.velocity.add(drag.x, drag.y);
        }
    }

    // ammo check
    if (this._gun.isAmmoEmpty && this._gun.isAmmoEmpty()) {
        this._gun.destroy();
        this._gun = new Gun(this.game, this.parent, this);
    }

    // Swapping weapons
    if (this._controls.isControlActive("weapon-machine-gun")) {
        this._gun.destroy();
        this._gun = new MachineGun(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-laser")) {
        this._gun.destroy();
        this._gun = new Laser(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-beam")) {
        this._gun.destroy();
        this._gun = new Beam(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-arrow")) {
        this._gun.destroy();
        this._gun = new Arrow(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-sword")) {
        this._gun.destroy();
        this._gun = new MeleeWeapon(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-scattershot")) {
        this._gun.destroy();
        this._gun = new Scattershot(this.game, this.parent, this);
    } else if (this._controls.isControlActive("weapon-flamethrower")) {
        this._gun.destroy();
        this._gun = new Flamethrower(this.game, this.parent, this);
    } else if (this._controls.isControlActive("explosive")) {
        this._gun.destroy();
        this._gun = new Explosive(this.game, this.parent, this);
    }

    // Firing logic
    var isShooting = false;
    var attackDir = this.position.clone();
    if (this._controls.isControlActive("attack")) {
        isShooting = true;
        attackDir = this._reticule.position.clone();
    }
    if (this._controls.isControlActive("attack-left")) {
        isShooting = true;
        attackDir.x += -1;
    } else if (this._controls.isControlActive("attack-right")) {
        isShooting = true;
        attackDir.x += 1;
    }
    if (this._controls.isControlActive("attack-up")) {
        isShooting = true;
        attackDir.y += -1;
    } else if (this._controls.isControlActive("attack-down")) {
        isShooting = true;
        attackDir.y += 1;
    }
    if (isShooting) {
        this._gun.fire(attackDir);
    }

    // special weapons logic
    var isShootingSpecial = false;
    var specialAttackDir = this.position.clone();
    if (this._controls.isControlActive("attack-special")) {
        isShootingSpecial = true;
        specialAttackDir = this._reticule.position.clone();
    }
    if (this._controls.isControlActive("attack-space")) {
        isShootingSpecial = true;
        specialAttackDir.x += 0;
        specialAttackDir.y -= 1;
    }
    if (isShootingSpecial && this.getGun().specialFire) {
        this._gun.specialFire(specialAttackDir);
    }

    // Check whether player is moving in order to update its animation
    var isIdle = acceleration.isZero();
    if ((isShooting || isShootingSpecial) &&
        (this.animations.name !== ANIM_NAMES.ATTACK)) {
        this.animations.play(ANIM_NAMES.ATTACK);
    } else if (!isShooting && !isShootingSpecial && isIdle &&
        this.animations.name !== ANIM_NAMES.IDLE) {
        this.animations.play(ANIM_NAMES.IDLE);
    } else if (!isShooting && !isShootingSpecial && !isIdle &&
        this.animations.name !== ANIM_NAMES.MOVE) {
        this.animations.play(ANIM_NAMES.MOVE);
    }

    // Enemy collisions
    spriteUtils.checkOverlapWithGroup(this, this._enemies, this._onCollideWithEnemy, this);

    // Pickup collisions
    spriteUtils.checkOverlapWithGroup(this, this._pickups, this._onCollideWithPickup, this);

    // if (this._isDead) {
    //     console.log("dead!");
    //     this.animations.play(ANIM_NAMES.DIE);
    //     this.animations.onComplete.add(function() {
    //         this._isDead = false;
    //         this.destroy();
    //         this.game.state.restart();
    //     }, this);
    // }
};

Player.prototype._onCollideWithEnemy = function () {
    // return to start screen
    // *** this doesn't work, didn't look into it...
    // this.game.state.start("start");

    // for sandbox testing
    // console.log("died!");
    // this.body.enable = false;
    // this._isDead = true;

    this.game.state.restart();
};

Player.prototype._onCollideWithPickup = function (self, pickup) {
    if (pickup._category === "weapon") {
        if (pickup.type === this._gunType) {
            this.getGun().incrementAmmo(pickup.ammoAmount);
        } else {
            this._gunType = pickup.type;
            this.getGun().fillAmmo();
        }
    }
    pickup.destroy();
};


Player.prototype.destroy = function () {
    this._reticule.destroy();
    this._comboTracker.destroy();
    for (var gun in this._allGuns) {
        this._allGuns[gun].destroy();
    }
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Player.prototype.getGun = function() {
    return this._gun;
};

Player.prototype.getAmmo = function() {
    if (this._gun.getAmmo) return this._gun.getAmmo();
};
},{"../helpers/combo-tracker.js":23,"../helpers/controller.js":24,"../helpers/sprite-utilities.js":27,"./reticule.js":9,"./weapons/arrow.js":11,"./weapons/beam.js":14,"./weapons/explosive.js":15,"./weapons/flamethrower.js":17,"./weapons/gun.js":18,"./weapons/laser.js":19,"./weapons/machine-gun.js":20,"./weapons/melee-weapon.js":21,"./weapons/scattershot.js":22}],9:[function(require,module,exports){
module.exports = Reticule;

Reticule.prototype = Object.create(Phaser.Sprite.prototype);

function Reticule(game, parentGroup) {
    Phaser.Sprite.call(this, game, 0, 0, "assets", "hud/reticule");
    this.anchor.set(0.5);
    parentGroup.add(this);
    
    this._updatePosition();
}

Reticule.prototype._updatePosition = function() {
    var newPos = Phaser.Point.add(this.game.camera.position, 
        this.game.input.activePointer);
    this.position.copyFrom(newPos);
};

Reticule.prototype.update = function () {
    this._updatePosition();
};
},{}],10:[function(require,module,exports){
module.exports = ShadowMask;

var calculateHullsFromTiles = require("../helpers/hull-from-tiles.js");

// Prototype chain - inherits from ???
function ShadowMask(game, opacity, tilemap, parentGroup) {
    this.game = game;
    this.shadowOpacity = opacity;
    this.camera = this.game.camera;
    this.parent = parentGroup;

    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = game.add.bitmapData(game.width, game.height);
    bitmap.fill(0, 0, 0, opacity);
    var image = bitmap.addToWorld(game.width / 2, game.height / 2, 0.5, 0.5, 1, 
        1);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    parentGroup.addChild(image);

    this._bitmap = bitmap;
    this._image = image;
    this._lightWalls = calculateHullsFromTiles(tilemap);

    this._rayBitmap = this.game.add.bitmapData(game.width, game.height);
    this._rayBitmapImage = this._rayBitmap.addToWorld(game.width / 2, 
        game.height / 2, 0.5, 0.5, 1, 1);
    parentGroup.addChild(this._rayBitmapImage);
    this._rayBitmapImage.fixedToCamera = true;
    this._rayBitmapImage.visible = false;
}

ShadowMask.prototype._getVisibleWalls = function () {
    var camRect = this.camera.view;
    var visibleWalls = [];

    // Create walls for each corner of the stage, and add them to the walls array.
    var camLeft = new Phaser.Line(camRect.x, camRect.y + camRect.height, camRect.x, camRect.y);
    var camTop = new Phaser.Line(camRect.x, camRect.y, camRect.x + camRect.width, camRect.y);
    var camRight = new Phaser.Line(camRect.x + camRect.width, camRect.y, camRect.x + camRect.width, camRect.y + camRect.height);
    var camBottom = new Phaser.Line(camRect.x + camRect.width, camRect.y + camRect.height, camRect.x, camRect.y + camRect.height);
    visibleWalls.push(camLeft, camRight, camTop, camBottom);

    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            if (camRect.intersectsRaw(line.left, line.right, line.top, line.bottom)) {
                line = getVisibleSegment(line);
                visibleWalls.push(line);
            }
        }
    }

    function getVisibleSegment(line) {
        // This function checks the given line against the edges of the camera. 
        // If it intersects with an edge, then we need to only get the visible
        // portion of the line.
        // TODO: if we want this to work for diagonal lines in the tilemap, we
        // need to update this code to account for the possibility that a line
        // can intersect multiple edges of the camera 
        var p = line.intersects(camLeft, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camRight, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        var p = line.intersects(camTop, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camBottom, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        return line;
    }
    return visibleWalls;
};

ShadowMask.prototype._sortPoints = function (points, target) {
    // TODO: make more efficient by sorting and caching the angle calculations
    points.sort(function (p1, p2) {
        var angle1 = Phaser.Point.angle(target, p1);
        var angle2 = Phaser.Point.angle(target, p2);
        return angle1 - angle2;
    });
};

ShadowMask.prototype.update = function () {
    var points = [];
    var globals = this.game.globals;

    var walls = this._getVisibleWalls();

    var playerPoint = globals.player.position;
    for (var w = 0; w < walls.length; w++) {
        // Get start and end point for each wall.
        var wall = walls[w];
        var startAngle = globals.player.position.angle(wall.start);
        var endAngle = globals.player.position.angle(wall.end);

        // Check for an intersection at each angle, and +/- 0.001
        // Add the intersection to the points array.
        points.push(checkRayIntersection(this, startAngle-0.001));
        points.push(checkRayIntersection(this, startAngle));
        points.push(checkRayIntersection(this, startAngle+0.001));
        points.push(checkRayIntersection(this, endAngle-0.001));
        points.push(checkRayIntersection(this, endAngle));
        points.push(checkRayIntersection(this, endAngle+0.001));
    }

    this._sortPoints(points, globals.player.position);

    // Create an arbitrarily long ray, starting at the player position, through the
    // specified angle.  Check if this ray intersets any walls.  If it does, return
    // the point at which it intersects the closest wall.  Otherwise, return the point
    // at which it intersects the edge of the stage.
    function checkRayIntersection(ctx, angle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var intersect = ctx.getWallIntersection(ray, walls);
        // Save the intersection or the end of the ray
        if (intersect) {
            return intersect;
        } else {
            return ray.end;
        }
    }
    // If the closest wall is the same as the one provided, return false.
    // Otherwise, return the new wall.
    function checkClosestWall(ctx, angle, closestWall) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var newWall = ctx.getClosestWall(ray, walls);
        // Save the intersection or the end of the ray
        if (!newWall || !closestWall) { return false; }
        if (newWall.start.x <= closestWall.start.x + 3 &&
            newWall.start.x >= closestWall.start.x - 3 &&
            newWall.start.y <= closestWall.start.y + 3 &&
            newWall.start.y >= closestWall.start.y - 3 &&
            newWall.end.x <= closestWall.end.x + 3 &&
            newWall.end.x >= closestWall.end.x - 3 &&
            newWall.end.y <= closestWall.end.y + 3 &&
            newWall.end.y >= closestWall.end.y - 3) {
            return false;
        } else {
            return newWall;
        }
    }

    // Clear and draw a shadow everywhere
    this._bitmap.clear();
    this._bitmap.update();
    this._bitmap.fill(0, 0, 0, this.shadowOpacity);
    // Draw the "light" areas
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    this._bitmap.ctx.strokeStyle = 'rgb(255, 255, 255)';
    // Note: xOffset and yOffset convert from world coordinates to coordinates 
    // inside of the bitmap mask. There might be a more elegant way to do this
    // when we optimize.
    // When the camera stops moving, fix the offset.
    var xOffset;
    if (globals.player.x > 400 && globals.player.x < 1400) {
        xOffset = globals.player.x - this.game.width / 2;
    } else if (globals.player.x > 1400) {
        xOffset = 1400 - this.game.width / 2;
    } else {
        xOffset = 0;
    }
    var yOffset;
    if (globals.player.y > 300 && globals.player.y < 1140) {
        yOffset = globals.player.y - this.game.height / 2;
    } else if (globals.player.y > 1140) {
        yOffset = 1140 - this.game.height / 2;;
    } else {
        yOffset = 0;
    }
    this._bitmap.ctx.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for(var i = 0; i < points.length; i++) {
        this._bitmap.ctx.lineTo(points[i].x - xOffset, points[i].y - yOffset);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();

    // Draw each of the rays on the rayBitmap
    this._rayBitmap.context.clearRect(0, 0, this.game.width, this.game.height);
    this._rayBitmap.context.beginPath();
    this._rayBitmap.context.strokeStyle = 'rgb(255, 0, 0)';
    this._rayBitmap.context.fillStyle = 'rgb(255, 0, 0)';
    this._rayBitmap.context.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for(var k = 0; k < points.length; k++) {
        this._rayBitmap.context.moveTo(globals.player.x - xOffset, globals.player.y - yOffset);
        this._rayBitmap.context.lineTo(points[k].x - xOffset, points[k].y - yOffset);
        this._rayBitmap.context.fillRect(points[k].x - xOffset -2,
            points[k].y - yOffset - 2, 4, 4);
    }
    this._rayBitmap.context.stroke();

    // This just tells the engine it should update the texture cache
    this._bitmap.dirty = true;
    this._rayBitmap.dirty = true;
};


// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
ShadowMask.prototype.getWallIntersection = function(ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestIntersection = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestIntersection = intersect;
            }
        }
    }
    return closestIntersection;
};

// Return the closest wall that this ray intersects.
ShadowMask.prototype.getClosestWall = function(ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestWall = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestWall = walls[i]
            }
        }
    }
    return closestWall;
};

ShadowMask.prototype.toggleRays = function() {
    // Toggle the visibility of the rays when the pointer is clicked
    if (this._rayBitmapImage.visible) {
        this._rayBitmapImage.visible = false;
    } else {
        this._rayBitmapImage.visible = true;
    }
};

ShadowMask.prototype.drawWalls = function () {
    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            this.game.debug.geom(line, "rgba(255,0,255,0.75)");
        }
    }
};

ShadowMask.prototype.destroy = function () {
    // TODO: implement a destroy that kills the two bitmaps and their associated
    // image objects
};

},{"../helpers/hull-from-tiles.js":25}],11:[function(require,module,exports){
module.exports = Arrow;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Arrow.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: true,
    canPierce: true,
};

function Arrow(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Arrow", player);
    this.initAmmo(40);
    this.initCooldown(360);
}

Arrow.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.96 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.96 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

Arrow.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/arrow", this, 
        this._player, 100, angle, 300, 500, projectileOptions);
    p.scale.setTo(1.4, 1.4);
};
},{"./base-projectile.js":12,"./base-weapon.js":13}],12:[function(require,module,exports){
module.exports = BaseProjectile;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var Fire = require("./fire.js");

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);

// options is an object containing some optional settings for the
// base projectile class
// - isDestructible - bool
// - rotateOnSetup - bool
// - canBounce - bool
// - canPierce - bool // bullets go through enemies
// - canBurn - bool
// - decayRate - range (0 - 1.0)
// - grow - bool // ok seriously i'm not sure about this one...
// - tracking - bool
// - trackingTarget - (x, y) (or an object maybe, i don't really know...)
function BaseProjectile(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed, range, options) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._damage = damage;
    this._speed = speed;
    this._range = range;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseProjectile should be removed?

    // projectile options
    if (options !== undefined && options.isDestructible !== undefined)
        this._isDestructable = options.isDestructible;
    else this._isDestructable = true;
    if (options !== undefined && options.rotateOnSetup !== undefined)
        this._rotateOnSetup = options.rotateOnSetup;
    else this._rotateOnSetup = true;
    if (options !== undefined && options.canPierce !== undefined)
        this._canPierce = options.canPierce;
    else this._canPierce = false;
    if (options !== undefined && options.canBounce !== undefined)
        this._canBounce = options.canBounce;
    else this._canBounce = true;
    if (options !== undefined && options.canBurn !== undefined)
        this._canBurn = options.canBurn;
    else this._canBurn = false;
    if (options !== undefined && options.decayRate !== undefined)
        this._decayRate = options.decayRate;
    else this._decayRate = 1.0;
    if (options !== undefined && options.grow !== undefined)
        this._grow = options.grow;
    else this._grow = false;
    if (options !== undefined && options.tracking !== undefined && options.trackingRadius !== undefined) {
        this._tracking = options.tracking;
        this._trackingTarget = options.trackingTarget;
    } else {
        this._tracking = false;
        this._trackingTarget = null;
    }
    // If rotateOnSetup option is true, rotate projectile to face in the
    // right direction. Sprites are saved facing up (90 degrees), so we
    // need to offset the angle
    if (this._rotateOnSetup)
        this.rotation = angle + (Math.PI / 2); // Radians
    else
        this.rotation = angle;

    // If grow, the bullet grows from size 0.25 to 1.00
    if (this._grow) {
        this.scale.setTo(0.25, 0.25);
    }

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
}

BaseProjectile.prototype.update = function() {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer,
        this._onCollideWithMap);

    // If a decate rate was set, apply it to the velocity.
    if (this._decayRate) {
        this.body.velocity.x = this.body.velocity.x * this._decayRate;
        this.body.velocity.y = this.body.velocity.y * this._decayRate;
    }

    // If the grow flag was set, increase the scale of the projectile every frame.
    // This might be a hack, but if it applicable elsewhere we can figure
    // something more generic out.
    if (this._grow) {
        var x = this.scale.x * 1.0264;
        var y = this.scale.y * 1.0264;
        this.scale.setTo(x, y);
    }

    // If the projectile can burn, check each tile for a fire.
    // If one exists, ignore the tile and keep moving.  If there is no fire,
    // destroy the projectile and create a fire.
    if (this._canBurn && this.checkTileMapLocation(this.position.x,
        this.position.y)) {
        // this isn't working yet...
    }

    // If the projectile tracks, check if target is within the tracking radius.
    // If it is, begin tracking.  Otherwise, continue on the initiail trajectory.
    // NOTE(rex): HMMMM This isn't quite working...
    if (this._tracking) {

    }
}

BaseProjectile.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);
    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) >
        this._range) || (this._isDestructable && this._remove)) {
        this.destroy();
    }
};

BaseProjectile.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

BaseProjectile.prototype._onCollideWithMap = function (self, map) {
    if (self._isDestructable) {
        self._remove = true;
    }
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    if (self._isDestructable && !self._canPierce) {
        self._remove = true;
    }
};

BaseProjectile.prototype.checkTileMapLocation = function(x, y) {
    var checkTile = this.game.globals.tileMap.getTileWorldXY(x, y, 36, 36,
        this.game.globals.tileMapLayer);

    if (checkTile === null || checkTile === undefined) return true;
    else return false;
}

BaseProjectile.prototype.trackTarget = function(self, target) {
    // If target is in range, calculate the acceleration based on the 
    // direction this sprite needs to travel to hit the target
    var distance = this.position.distance(target.position);
    var angle = this.position.angle(target.position);
    var targetSpeed = distance / this.game.time.physicsElapsed;
    var magnitude = Math.min(15, targetSpeed);
    this.body.velocity.x = targetSpeed * Math.cos(angle);
    this.body.velocity.y = targetSpeed * Math.sin(angle);
}
},{"../../helpers/sprite-utilities.js":27,"./fire.js":16}],13:[function(require,module,exports){
module.exports = BaseWeapon;

var utils = require("../../helpers/utilities.js");

BaseWeapon.prototype = Object.create(Phaser.Group.prototype);

var INFINITE_AMMO = -1;

function BaseWeapon(game, parentGroup, weaponName, player) {
    Phaser.Group.call(this, game, parentGroup, weaponName);

    this._name = weaponName;
    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._ableToAttack = true;
}

BaseWeapon.prototype.initAmmo = function (totalAmmo, currentAmmo) {
    this._totalAmmo = totalAmmo;
    this._currentAmmo = utils.default(currentAmmo, totalAmmo);
};

BaseWeapon.prototype.initCooldown = function (cooldownTime, 
    specialCooldownTime) {
    // Set up a timer that doesn't autodestroy itself
    this._cooldownTime = cooldownTime;
    this._specialCooldownTime = utils.default(specialCooldownTime, 
        cooldownTime);
};

BaseWeapon.prototype.isAbleToAttack = function () {
    return this._ableToAttack;
};

BaseWeapon.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
    }, this);
};

BaseWeapon.prototype.isAmmoEmpty = function() {
    return ((this._currentAmmo <= 0) && (this._currentAmmo !== INFINITE_AMMO));
};

BaseWeapon.prototype.getAmmo = function() {
    return this._currentAmmo;
};

BaseWeapon.prototype.incrementAmmo = function(amt) {
    if (this._totalAmmo > (this._currentAmmo + amt)) {
        this._currentAmmo += amt;
    } else {
        this._currentAmmo = this._totalAmmo;
        console.log("too much ammo!");
    }
};

BaseWeapon.prototype.fillAmmo = function() {
    this._currentAmmo = this._totalAmmo;
};

BaseWeapon.prototype.emptyAmmo = function() {
    this._currentAmmo = 0;
};

BaseWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};
},{"../../helpers/utilities.js":28}],14:[function(require,module,exports){
module.exports = Beam;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

Beam.prototype = Object.create(Phaser.Sprite.prototype);

function Beam(game, parentGroup, player) {
    Phaser.Sprite.call(this, game, 0, 0, "assets", "weapons/beam");
    this.anchor.set(0, 0.5);
    parentGroup.add(this);
    this.sendToBack(); // Underneath player
    
    this._timer = game.time.create(false);
    this._timer.start();
    
    this._cooldownTime = 1000;
    this._attackDuration = 2000;
    this._isAttacking = false;
    this._ableToAttack = true;
    this._damage = 10;
    this._player = player;
    this._enemies = game.globals.groups.enemies;

    this.visible = false;
    this._beamSize = this.height;
    this._range = this.width;

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
}

Beam.prototype.fire = function (targetPos) {
    if (this._isAttacking) {
        this.position.copyFrom(this._player.position);
        this.rotation = this._player.position.angle(targetPos);
    } else if (this._ableToAttack) {
        this._startAttack(targetPos);
    }
};

Beam.prototype.postUpdate = function () {
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    if (this._isAttacking) {
        // Update graphics to player position. Note: this seems fragile. It the
        // player postUpdates AFTER this sprite, this sprite will be off by a
        // frame's worth of physics.
        this.position.copyFrom(this._player.position);
        // Check overlapd
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
};

Beam.prototype.destroy = function () {
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Beam.prototype._startAttack = function (targetPos) {
    this.position.copyFrom(this._player.position);
    this.rotation = this._player.position.angle(targetPos);
    this._isAttacking = true;
    this.visible = true;
    this._timer.add(this._attackDuration, this._stopAttack.bind(this));
};

Beam.prototype._stopAttack = function () {
    this.visible = false;
    this._isAttacking = false;
    this._ableToAttack = false;
    // Cooldown
    this._timer.add(this._cooldownTime, function () {
        this._ableToAttack = true;
    }, this);
};

Beam.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};
},{"../../helpers/sprite-utilities.js":27}],15:[function(require,module,exports){
module.exports = Explosive;

var BaseWeapon = require("./base-weapon.js");

Explosive.prototype = Object.create(BaseWeapon.prototype);

function Explosive(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Explosive", player);
    this.initAmmo(30);
    this.initCooldown(150);
}

Explosive.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this._createProjectile(x, y, angle);

        this.incrementAmmo(-1);

        this._startCooldown(this._cooldownTime);
    }
};

Explosive.prototype.specialFire = function () {
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
        // create 8 bullets evenly distributed in a circle
        for (var i=0; i<=7; i++) {
            // Start bullet in a position along that trajectory, but in front
            // of the player
            var angle = (i*(Math.PI/4));
            var x = this._player.position.x + (0.75 * this._player.width) * 
                Math.cos(angle);
            var y = this._player.position.y + (0.75 * this._player.width) * 
                Math.sin(angle);
            this._createProjectile(x, y, angle);
        }

        this.incrementAmmo(-8);

        this._startCooldown(this._specialCooldownTime);
    }
};

Explosive.prototype._createProjectile = function (x, y, angle) {
    new BaseProjectile(this.game, x, y, this, this._player, angle);
};


var SpriteUtils = require("../../helpers/sprite-utilities.js");

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);

function BaseProjectile(game, x, y, parentGroup, player, angle) {
    Phaser.Sprite.call(this, game, x, y);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._graphics = game.make.graphics(0, 0);
    this.addChild(this._graphics);

    // Draw circle
    this._graphics.beginFill(0x000000);
    this._graphics.drawCircle(0, 0, 10);
    this._graphics.endFill();

    this._timer = game.time.create(false);
    this._timer.start();

    this._hasExploded = false;
    this._damage = 100;
    this._range = 400;
    this._speed = 200;

    this._player = player;
    this._enemies = game.globals.groups.enemies;

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this, 5);
}

BaseProjectile.prototype.update = function() {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer, 
        this._onCollideWithMap);
}

BaseProjectile.prototype.explode = function () {    
    this._hasExploded = true;
    // Switch to explosion circle SAT body 
    this.game.globals.plugins.satBody.removeBody(this.satBody);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this, 
        this._range / 2);
    // Stop moving
    this.body.velocity.set(0);
    // Draw explosion circle
    this._graphics.clear();
    this._graphics.beginFill(0x000000, 0.5);
    this._graphics.drawCircle(0, 0, this._range);
    this._graphics.endFill();
    // Check explosion overlap
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, this._onExplodeEnemy,
        this);
    // Scheduled destruction slightly in the future
    this._timer.add(100, this.destroy, this);
};

BaseProjectile.prototype.destroy = function () {
    this._graphics.destroy();
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

BaseProjectile.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap for the non-exploded projectile
    if (!this._hasExploded) {
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this._isDestructable && this._remove)) {
        this.destroy();
    }
};

BaseProjectile.prototype._onCollideWithMap = function (self, map) {
    if (self._isDestructable) {
        self._remove = true;
    }
    self.explode();
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    self.explode();
};

BaseProjectile.prototype._onExplodeEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (self._isDestructable) self._remove = true;
    self.explode();
};
},{"../../helpers/sprite-utilities.js":27,"./base-weapon.js":13}],16:[function(require,module,exports){
module.exports = Fire;

Fire.prototype = Object.create(Phaser.Sprite.prototype);

function Fire(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, "assets", "enemy01/die-02");
    this.anchor.set(0.5);

    this._initialPos = this.position.clone();

    // Configure physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

Fire.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

},{}],17:[function(require,module,exports){
module.exports = Flamethrower;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Flamethrower.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
    canBurn: true,
    decayRate: 0.965,
    grow: true,
};

function Flamethrower(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Flamethrower", player);
    this.initAmmo(320);
    this.initCooldown(12);
}

Flamethrower.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {

        // Find trajectory
        // randomize the trajectory of each flame
        var angleToPlayer = this._player.position.angle(targetPos); // Rads
        var mod = (this.game.rnd.integerInRange(0, 15) * (Math.PI / 180)) *
                  this.game.rnd.sign();
        var angle = angleToPlayer + mod;
        var speed = this.game.rnd.integerInRange(164,184)
        var range = this.game.rnd.integerInRange(64,72)
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle, speed, range);
        this._startCooldown(this._cooldownTime);
    }
};

Flamethrower.prototype._createProjectile = function (x, y, angle, speed, range) {
    var p = new Projectile(this.game, x, y, "assets", `weapons/e-burst-01`, this, 
        this._player, 6, angle, speed, range, projectileOptions);
    p.rotation += 135;
    // // Randomize the color of each flame.
    var g = this.game.rnd.integerInRange(0, 255);
    p.tint = Phaser.Color.getColor(240, g, 24);
};
},{"./base-projectile.js":12,"./base-weapon.js":13}],18:[function(require,module,exports){
module.exports = Gun;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Gun.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Gun(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Gun", player);
    this.initAmmo(-1);
    this.initCooldown(320, 480);
}

Gun.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

Gun.prototype.specialFire = function () {
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
        // create 8 bullets evenly distributed in a circle
        for (var i=0; i<=7; i++) {
            // Start bullet in a position along that trajectory, but in front
            // of the player
            var angle = (i*(Math.PI/4));
            var x = this._player.position.x + (0.75 * this._player.width) * 
                Math.cos(angle);
            var y = this._player.position.y + (0.75 * this._player.width) * 
                Math.sin(angle);
            this._createProjectile(x, y, angle);
        }

        this.incrementAmmo(-8);

        this._startCooldown(this._specialCooldownTime);
    }
};

Gun.prototype._createProjectile = function (x, y, angle) {
    new Projectile(this.game, x, y, "assets", "weapons/slug", this, 
        this._player, 50, angle, 300, 160, projectileOptions);
};
},{"./base-projectile.js":12,"./base-weapon.js":13}],19:[function(require,module,exports){
module.exports = Laser;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Laser.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Laser(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Laser", player);
    this.initAmmo(120);
    this.initCooldown(160, 500);
    this.tracker = null;
}

Laser.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        var spacing = 0.16 * this._player.width;
        var spacing2 = 0.36 * this._player.width;
        var a = this._createProjectile(angle, 48, 0);
        var b = this._createProjectile(angle, 16, spacing2);
        var c = this._createProjectile(angle, 16, -spacing2);
        var d = this._createProjectile(angle, 24, spacing);
        var e = this._createProjectile(angle, 24, -spacing);
        this.tracker = new Tracker(this.game, a.position.x, a.position.y,
            [a, b, c, d, e]);
        this.incrementAmmo(-5);
        this._startCooldown(this._cooldownTime);
    }
};

Laser.prototype._createProjectile = function (angle, playerDistance, 
    perpendicularOffset) {
    var perpAngle = angle - (Math.PI / 2);
    var x = this._player.x + (playerDistance * Math.cos(angle)) - 
        (perpendicularOffset * Math.cos(perpAngle));
    var y = this._player.y + (playerDistance * Math.sin(angle)) - 
        (perpendicularOffset * Math.sin(perpAngle));    
    var p = new Projectile(this.game, x, y, "assets", "weapons/laser-01", this,
        this._player, 7, angle, 640, 320, projectileOptions);
    p.scale.setTo(0.72, 0.72);
    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
    return p;
};







// Tracker for the laser
Tracker.prototype = Object.create(Phaser.Sprite.prototype);

/**
 * @param {Projectile} bullets - Array of bullets associated with a specific tracker.
 */
function Tracker(game, x, y, bullets) {
    console.log('tracker!');
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    this.scale.setTo(1.2, 1.2);

    this.bullets = bullets

    this.game.physics.arcade.enable(this);
}

Tracker.prototype.update = function() {
    console.log('this.is happening at least');
    // Set tracker position to bullet[0] position
    this.position.x = this.bullets[0].position.x;
    this.position.y = this.bullets[0].position.y;

    // Collisions with enemies
    this.game.physics.arcade.collide(this, this.game.globals.groups.enemies,
        this._onCollideWithEnemy, this);
}

Tracker.prototype._onCollideWithEnemy = function (self, enemy) {
    console.log('collide!');
    for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[0].trackTarget(enemy);
    }
    this.destroy();
};
Tracker.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

},{"./base-projectile.js":12,"./base-weapon.js":13}],20:[function(require,module,exports){
module.exports = MachineGun;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

MachineGun.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function MachineGun(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "MachineGun", player);
    this.initAmmo(240);
    this.initCooldown(56);
}

MachineGun.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.5 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.5 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

MachineGun.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/slug", this, 
        this._player, 16, angle, 300, 160, projectileOptions);
    p.scale.setTo(0.75, 0.75);
    // // Randomize the color of each flame.
    var r = this.game.rnd.integerInRange(120, 160);
    var g = this.game.rnd.integerInRange(160, 200);
    var b = this.game.rnd.integerInRange(160, 200);
    p.tint = Phaser.Color.getColor(r, g, b);
};
},{"./base-projectile.js":12,"./base-weapon.js":13}],21:[function(require,module,exports){
module.exports = MeleeWeapon;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

MeleeWeapon.prototype = Object.create(Phaser.Sprite.prototype);

function MeleeWeapon(game, parentGroup, player) {    
    Phaser.Sprite.call(this, game, player.x, player.y, "assets", 
        "weapons/sword");

    this.anchor.set(0.5, 1.0);
    this.pivot.y = 18;
    parentGroup.add(this);

    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = 350; // Milliseconds 
    this._specialCooldownTime = 960; // Milliseconds 

    this._ableToAttack = true;
    this._swingDir = 1;
    this._damage = 35;

    this.visible = false;
    this._swing = null; 

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this, 38, 
        this.height + this.pivot.y);
}

MeleeWeapon.prototype.postUpdate = function () {
    if (this.visible) {
        this.position.x = this._player.position.x;
        this.position.y = this._player.position.y;

        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
};

MeleeWeapon.prototype.fire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) - 
            (this._swingDir * Math.PI/4) + (Math.PI/4);
        var pos = this._player.position.angle(targetPos) * (180/Math.PI);

        var endAngle = pos + (this._swingDir * 180); // tweens take degrees
        if (endAngle === 360) {
            endAngle = 0;
        }

        this._swing = this.game.add.tween(this).to({angle: endAngle}, 
            this._cooldownTime, "Quad.easeInOut", false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
        }, this);

        this.visible = true;

        this._swing.start();

        this._startCooldown(this._cooldownTime);
    }
};

MeleeWeapon.prototype.specialFire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) + (Math.PI/2);
        var pos = (this._player.position.angle(targetPos) + (Math.PI/2)) * 
            (180/Math.PI);
        var endAngle = pos + 720; // for some reason tweens take degrees

        this._swing = this.game.add.tween(this).to({angle: endAngle}, 
            this._specialCooldownTime, "Quad.easeInOut", false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
        }, this);

        this.visible = true;
        this._swing.start();

        this._startCooldown(this._cooldownTime);

    }
};

MeleeWeapon.prototype.hideWeapon = function () {
    this._swing.stop();
    this.visible = false;
};

MeleeWeapon.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    // this.visible = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
        // this._swingDir = this._swingDir * -1;
    }, this);
};

MeleeWeapon.prototype._checkOverlapWithGroup = function (group, callback, 
    callbackContext) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            this._checkOverlapWithGroup(child, callback, callbackContext);
        } else {
            this.game.physics.arcade.overlap(this, child, callback, null, 
                callbackContext);
        }
    }
};

MeleeWeapon.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};

MeleeWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();
    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

},{"../../helpers/sprite-utilities.js":27}],22:[function(require,module,exports){
module.exports = Scattershot;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Scattershot.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Scattershot(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Scattershot", player);
    this.initAmmo(40);
    this.initCooldown(600, 700);
}

Scattershot.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var pelletNum = this.game.rnd.integerInRange(16, 24);

        // randomize the trajectory of every bullet in the shotgun blast
        for (var i=0; i<pelletNum; i++) {
            var angleToPlayer = this._player.position.angle(targetPos); // Rads
            var mod = (this.game.rnd.integerInRange(0, 30) * (Math.PI / 180)) *
                      this.game.rnd.sign();
            var angle = angleToPlayer + mod;
            var speed = this.game.rnd.integerInRange(364,376)
            var range = this.game.rnd.integerInRange(48,96)
            var perpendicularOffset = this.game.rnd.integerInRange(-5,5)
            this._createProjectile(angle, 24, perpendicularOffset, speed, range);
        }

        this.incrementAmmo(-1);

        this._startCooldown(this._cooldownTime);
    }
};

Scattershot.prototype._createProjectile = function (angle, playerDistance, 
    perpendicularOffset, speed, range) {
    var perpAngle = angle - (Math.PI / 2);
    var x = this._player.x + (playerDistance * Math.cos(angle)) - 
        (perpendicularOffset * Math.cos(perpAngle));
    var y = this._player.y + (playerDistance * Math.sin(angle)) - 
        (perpendicularOffset * Math.sin(perpAngle));
    // shotgun blast is made up of a bunch of slugs at half size.
    var p = new Projectile(this.game, x, y, "assets", "weapons/slug", this,
        this._player, 12, angle, speed, range, projectileOptions);
    p.scale.setTo(0.5, 0.5);
    var rgb = Phaser.Color.HSLtoRGB(0.75, 0.36, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};
},{"./base-projectile.js":12,"./base-weapon.js":13}],23:[function(require,module,exports){
module.exports = ComboTracker;

var utils = require("../helpers/utilities.js");

function ComboTracker(game, comboTimeout) {
    this._combo = 0;

    this._comboTimeout = utils.default(comboTimeout, 2000);
    this._comboTimer = game.time.create(false); // Doesn't autodestroy
    this._comboTimer.start();
}

ComboTracker.prototype.getCombo = function () {
    return this._combo;
};

ComboTracker.prototype.incrementCombo = function (increment) {
    // Update the combo
    this._combo += utils.default(increment, 1);
    
    // Reset the timer events and schedule an event to reset the combo to zero
    this._comboTimer.removeAll();
    this._comboTimer.add(this._comboTimeout, function () {
        this._combo = 0;
    }.bind(this));
};

ComboTracker.prototype.destroy = function () {
    this._comboTimer.destroy();
};
},{"../helpers/utilities.js":28}],24:[function(require,module,exports){
/**
 * @module Controller
 */
module.exports = Controller;

/**
 * This object can be used to look up the mouse button property that corresponds
 * with the button's numerical ID.
 * @type {Object}
 */
var POINTER_BUTTONS_LOOKUP = {};
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.LEFT_BUTTON] = "leftButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.MIDDLE_BUTTON] = "middleButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.RIGHT_BUTTON] = "rightButton";
    
/**
 * A helper class for abstracting away a controller. This can register multiple
 * control keys to the same action, e.g. using both "left" and "w" for moving a
 * character left.
 * @class Controller
 * @constructor
 * @param {object} input A reference to a Phaser.input for the current game.
 */
function Controller(input) {
    this._input = input;

    // Object containing the active control names. If a control is active, this
    // will have a property (that control's name) set to true. Inactive controls
    // are not stored in the object.
    this._activeControls = {};

    // Objects containing the mapping of: 
    //  keyCode/mouseButton -> control name
    this._keyboardMap = {};
    this._mouseMap = {};
}

/**
 * Check what controls are active. This must be called once per frame, before
 * Controller.isControlActive.
 */
Controller.prototype.update = function () {
    // Reset controls
    this._activeControls = {};
    
    // Check for any registered mouse controls that have been activated
    var activePointer = this._input.activePointer;
    for (var buttonName in this._mouseMap) {
        var controls = this._mouseMap[buttonName];
        var buttonPropertyName = POINTER_BUTTONS_LOOKUP[buttonName];
        var pointerButton = activePointer[buttonPropertyName];
        if (pointerButton.isDown) {
            this._activateControls(controls);
        }
    }

    // Check for any registered keyboard controls that have been activated
    for (var keyCode in this._keyboardMap) {
        var controls = this._keyboardMap[keyCode];
        if (this._input.keyboard.isDown(keyCode)) {
            this._activateControls(controls);
        }
        // TODO: isDown(...) only works in browsers. Make this mobile-friendly.
    }
};

/**
 * Check whether a specified control is currently active.
 * @param  {string}  controlName The name of the control which was registered in
 *                               Controller.addKey.
 * @return {Boolean}             Whether or not the control is active.
 */
Controller.prototype.isControlActive = function (controlName) {
    return (this._activeControls[controlName] === true);
};

/**
 * Register a key or keys under a control name.
 * @param {string}          controlName The name of the control, e.g. "jump" or
 *                                      "left".
 * @param {number[]|number} keyCodes    The key code or an array of key codes to
 *                                      register under the specified control 
 *                                      name, e.g. Phaser.Keyboard.SPACEBAR
 */
Controller.prototype.addKeyboardControl = function (controlName, keyCodes) {
    if (!Array.isArray(keyCodes)) keyCodes = [keyCodes];
    for (var i = 0; i < keyCodes.length; i += 1) {
        var keyCode = keyCodes[i];
        if (this._keyboardMap[keyCode]) {
            this._keyboardMap[keyCode].push(controlName);
        } else {
            this._keyboardMap[keyCode] = [controlName];
        }
    }
};

/**
 * Register a mouse button under a control name.
 * @param {string} controlName The name of the control, e.g. "jump" or "left".
 * @param {number} mouseButton The phaser mouse button to register under the 
 *                             specified control name, e.g. 
 *                             Phaser.Pointer.LEFT_BUTTON.
 */
Controller.prototype.addMouseDownControl = function (controlName, mouseButton) {
    if (this._mouseMap[mouseButton]) {
        this._mouseMap[mouseButton].push(controlName);
    } else {
        this._mouseMap[mouseButton] = [controlName];
    }
};

/**
 * Activate the array of controls specified
 * @param  {string[]} controls Array of controls to active
 * @private
 */
Controller.prototype._activateControls = function (controls) {
    for (var i = 0; i < controls.length; i += 1) {
        var controlName = controls[i];
        this._activeControls[controlName] = true;
    }
};

},{}],25:[function(require,module,exports){
var hull = require("hull.js");

module.exports = function calculateHullsFromTiles(tileMap) {
	var clusters = calculateClusters(tileMap);
	var hulls = calculateHulls(clusters);
	return hulls;
};

function calculateClusters(tileMap) {
    var clusters = [];
    for (var x = 0; x < tileMap.width; x++) {
        for (var y = 0; y < tileMap.height; y++) {
            var tile = getCollidingTile(x, y);
            if (tile && !findTileInClusters(tile)) {
                cluster = [];
                recursivelySearchNeighbors(x, y, cluster);
                clusters.push(cluster);
            }
        }
    }

    function getCollidingTile(x, y) {
        var tile = tileMap.getTile(x, y, "BlockingLayer");
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
};

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
        lineDeltaX = line.start.x - line.end.x;
        lineDeltaY = line.start.y - line.end.y;

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
        var nextSegment = new Phaser.Line(points[p-1][0], points[p-1][1], 
            points[0][0], points[0][1]);   
        if (checkIfCollinear(line, nextSegment)) {
            // Extend the current line and add it
            line = new Phaser.Line(line.start.x, line.start.y, 
        		nextSegment.end.x, nextSegment.end.y);
            lines.push(line);
        } else {
            // Add the line and the next segment
            lines.push(line);
            lines.push(nextSegment);         	
        }

        // Determine whether the last line and the first line need to be merged
        if (checkIfCollinear(lines[0], lines[lines.length - 1])) {
        	var firstLine = lines.shift();
        	var lastLine = lines.pop();
        	var combinedLine = new Phaser.Line(firstLine.start.x, 
        		firstLine.start.y, 
        		lastLine.end.x, lastLine.end.y);
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
	dx1 = line1.end.x - line1.start.x;
	dy1 = line1.end.y - line1.start.y;
	dx2 = line2.end.x - line2.start.x;
	dy2 = line2.end.y - line2.start.y;
	return ((dx1 * dy2) - (dy1 * dx2)) === 0;
}
},{"hull.js":4}],26:[function(require,module,exports){
module.exports = ScoreKeeper;

function ScoreKeeper() {
	this._score = 0;
}

ScoreKeeper.prototype.incrementScore = function (points) {
    if (points === undefined) return;
    this._score += points;
};

ScoreKeeper.prototype.setScore = function (points) {
    this._score = points || 0;
};

ScoreKeeper.prototype.getScore = function () {
    return this._score;
};
},{}],27:[function(require,module,exports){
exports.applyRandomLightnessTint = function (sprite, h, s, l) {
    l += sprite.game.rnd.realInRange(-0.1, 0.1);
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    sprite.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};

exports.checkOverlapWithGroup = function (sprite, group, callback, context) {
    // Loop through children in group
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            // If child is a group, recursion time
            exports.checkOverlapWithGroup(sprite, child, callback, context);
        } else {
            // If child is not a group, make sure it has a SAT body
            if (!child.satBody) continue;
            // Check overlap
            var isOverlap = sprite.satBody.testOverlap(child.satBody);
            if (isOverlap) callback.call(context, sprite, child);
        }
    }
};

},{}],28:[function(require,module,exports){
exports.default = function (value, defaultValue) {
    return (value !== undefined) ? value : defaultValue;
};

exports.defaultProperties = function (object, properties) {
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            var value = exports.default(properties[key].value, 
                properties[key].default);
            object[key] = value;
        }
    }
    return object;
};

exports.randomBoolean = function () {
    return Boolean(Math.floor(Math.random() * 2));
};

exports.pointFromAngle = function (angle, isDegrees) {
    var radians = isDegrees ? (angle * Math.PI / 180) : angle;
    return new Phaser.Point(Math.cos(radians), Math.sin(radians));
};

exports.map = function (num, min1, max1, min2, max2, options) {
    var mapped = (num - min1) / (max1 - min1) * (max2 - min2) + min2;
    if (!options) return mapped;
    if (options.round && options.round === true) {
        mapped = Math.round(mapped);
    }
    if (options.floor && options.floor === true) {
        mapped = Math.floor(mapped);        
    }
    if (options.ceil && options.ceil === true) {
        mapped = Math.ceil(mapped);        
    }
    if (options.clamp && options.clamp === true) {
        mapped = Math.min(mapped, max2);
        mapped = Math.max(mapped, min2);
    }
    return mapped;
};
},{}],29:[function(require,module,exports){
var Sandbox = require("./states/sandbox.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");
var StartScreen = require("./states/start-screen.js");

// Keep this on CANVAS until Phaser 3 for performance reasons?
var game = new Phaser.Game(800, 600, Phaser.CANVAS, "game-container");

game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("start", StartScreen);
game.state.add("sandbox", Sandbox);
game.state.start("boot");
},{"./states/boot-state.js":33,"./states/load-state.js":34,"./states/sandbox.js":35,"./states/start-screen.js":36}],30:[function(require,module,exports){
/**
 * The MIT License (MIT)

 * Copyright (c) 2014 Raphaël Roux

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * 
 *
 */

/**
 * @author       Raphaël Roux
 * @copyright    2014 Raphaël Roux
 * @license      {@link http://opensource.org/licenses/MIT}
 */

/**
* AStar is a phaser pathfinding plugin based on an A* kind of algorythm 
* It works with the Phaser.Tilemap
*
* @class Phaser.Plugin.AStar
* @constructor
* @param {Any} parent - The object that owns this plugin, usually Phaser.PluginManager.
*/

Phaser.Plugin.AStar = function (game, parent)
{
    this.game = game;
    /**
    * @property {Any} parent - The parent of this plugin. If added to the PluginManager the parent will be set to that, otherwise it will be null.
    */
    this.parent = parent;

    /**
    * @property {Phaser.Tilemap} _tilemap - A reference to the tilemap used to store astar nodes according to the Phaser.Tilemap structure.
    */
    this._tilemap;

    /**
    * @property {number} _layerIndex - The layer index of the tilemap that is used to store astar nodes.
    */
    this._layerIndex;

    /**
    * @property {number} _tilesetIndex - The tileset index of the tileset that handle tiles properties.
    */
    this._tilesetIndex;
   
    /**
    * @property {array} _open - An array that references nodes to be considered by the search path algorythm.
    */
    this._open; 

    /**
    * @property {array} _closed - An array that references nodes not to consider anymore.
    */
    this._closed; 
   
    /**
    * @property {array} _visited - Internal array of visited tiles, use for debug pupose.
    */
    this._visited; 

    /**
    * @property {boolean} _useDiagonal - Does the astar algorythm can use tile diagonal?
    * @default true
    */
    this._useDiagonal = true;

    /**
    * @property {boolean} _findClosest - Does the findPath algorythm must calculate the closest result if destination is unreachable. If not findPath will return an empty array
    * @default true
    */
    this._findClosest = true;

    /**
    * @property {string} _walkablePropName - Wich name have the walkable propertiy in your tileset.
    * @default 'walkable'
    */
    this._walkablePropName = 'walkable';

    /**
    * @property {function} _distanceFunction - The function used to calculate distance.
    */
    this._distanceFunction = Phaser.Plugin.AStar.DISTANCE_EUCLIDIAN;

    /**
    * @property {Phaser.Plugin.AStar.AStarPath} _lastPath - The last path calculated by astar.
    */
    this._lastPath = null; 

    /**
    * @property {boolean} _debug - Boolean to debug mode, stores visited nodes, and have a cost. Disable in production.
    * @default false
    */
    this._debug = true;
};

Phaser.Plugin.AStar.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.AStar.prototype.constructor = Phaser.Plugin.AStar;


Phaser.Plugin.AStar.VERSION = '0.0.101';
Phaser.Plugin.AStar.COST_ORTHOGONAL = 1;
Phaser.Plugin.AStar.COST_DIAGONAL = Phaser.Plugin.AStar.COST_ORTHOGONAL*Math.sqrt(2);
Phaser.Plugin.AStar.DISTANCE_MANHATTAN = 'distManhattan';
Phaser.Plugin.AStar.DISTANCE_EUCLIDIAN = 'distEuclidian';

/**
 * Sets the Phaser.Tilemap used to searchPath into.
 * @method Phaser.Plugin.AStar#setAStarMap
 * @public
 * @param {Phaser.Tilemap} map - the Phaser.Tilemap used to searchPath into. It must have a tileset with tile porperties to know if tiles are walkable or not.
 * @param {string} layerName - The name of the layer that handle tiles.
 * @param {string} tilesetName - The name of the tileset that have walkable properties.
 * @return {Phaser.Plugin.AStar} The Phaser.Plugin.AStar itself.
 */
Phaser.Plugin.AStar.prototype.setAStarMap = function(map, layerName, tilesetName)
{
    this._tilemap = map;
    this._layerIndex = this._tilemap.getLayerIndex(layerName);;
    this._tilesetIndex = this._tilemap.getTilesetIndex(tilesetName);

    this.updateMap();

    return this;
};


/**
 * Sets the Phaser.Tilemap used to searchPath into.
 * @method Phaser.Plugin.AStar-setAStarMap
 * @private
 * @return {void} The Phaser.Plugin.AStar itself.
 */
 Phaser.Plugin.AStar.prototype.updateMap = function()
{
    var tile;
    var walkable;

    //for each tile, add a default AStarNode with x, y and walkable properties according to the tilemap/tileset datas
    for(var y=0; y < this._tilemap.height; y++)
    {
        for(var x=0; x < this._tilemap.width; x++)
        {
            tile = this._tilemap.layers[this._layerIndex].data[y][x];

            // If tile is undefined or tile doesn't have collisions set up, then
            // it's walkable
            walkable = !tile.collides;
            // walkable = this._tilemap.tilesets[this._tilesetIndex].tileProperties[tile.index - 1][this._walkablePropName] !== "false" ? true : false;
            
            tile.properties.astarNode = new Phaser.Plugin.AStar.AStarNode(x, y, walkable);
        }
    }

};


/**
 * Find a path between to tiles coordinates
 * @method Phaser.Plugin.AStar#findPath
 * @public
 * @param {Phaser.Point} startPoint - The start point x, y in tiles coordinates to search a path.
 * @param {Phaser.Point} goalPoint - The goal point x, y in tiles coordinates that you trying to reach.
 * @return {Phaser.Plugin.AStar.AStarPath} The Phaser.Plugin.AStar.AStarPath that results
 */
Phaser.Plugin.AStar.prototype.findPath = function(startPoint, goalPoint)
{
    var path = new Phaser.Plugin.AStar.AStarPath();


    // NOTE(rex): This is where things break if the enemy is outside of the tile range.
    var start = this._tilemap.layers[this._layerIndex].data[startPoint.y][startPoint.x].properties.astarNode; //:AStarNode;
    var goal = this._tilemap.layers[this._layerIndex].data[goalPoint.y][goalPoint.x].properties.astarNode

    path.start = start;
    path.goal = goal;

    this._open = [];
    this._closed = [];
    this._visited = [];
   
    this._open.push(start);
    
    start.g = 0;
    start.h = this[this._distanceFunction](start, goal);
    start.f = start.h;
    start.parent = null;                    
   
    //Loop until there are no more nodes to search
    while(this._open.length > 0) 
    {
        //Find lowest f in this._open
        var f = Infinity;
        var x;
        for (var i=0; i<this._open.length; i++) 
        {
            if (this._open[i].f < f) 
            {
                x = this._open[i];
                f = x.f;
            }
        }
       
        //Solution found, return solution
        if (x == goal) 
        {
            path.nodes = this.reconstructPath(goal);
            this._lastPath = path;
            if(this._debug === true) path.visited = this._visited;
            return path;
        }    
       
        //Close current node
        this._open.splice(this._open.indexOf(x), 1);
        this._closed.push(x);
       
        //Then get its neighbors       
        var n = this.neighbors(x);

        for(var yIndex=0; yIndex < n.length; yIndex++) 
        {

            var y = n[yIndex];
               
            if (-1 != this._closed.indexOf(y))
                continue;
           
            var g = x.g + y.travelCost;
            var better = false;
           
            //Add the node for being considered next loop.
            if (-1 == this._open.indexOf(y)) 
            {
                    this._open.push(y);
                    better = true;
                    if(this._debug === true) this.visit(y);
            } 
            else if (g < y.g) 
            {
                    better = true;
            }

            if (better) {
                    y.parent = x;
                    y.g = g;
                    y.h = this[this._distanceFunction](y, goal);
                    y.f = y.g + y.h;
            }
               
        }
           
    }

    //If no solution found, does A* try to return the closest result?
    if(this._findClosest === true)
    {
        var min = Infinity;
        var closestGoal, node, dist;
        for(var i=0, ii=this._closed.length; i<ii; i++) 
        {
            node = this._closed[i];

            var dist = this[this._distanceFunction](goal, node);
            if (dist < min) 
            {
                min = dist;
                closestGoal = node;
            }
        }

        //Reconstruct a path a path from the closestGoal
        path.nodes = this.reconstructPath(closestGoal);
        if(this._debug === true) path.visited = this._visited;
    }

    this._lastPath = path;

    return path;                              
};


/**
 * Reconstruct the result path backwards from the goal point, crawling its parents. Internal method.
 * @method Phaser.Plugin.AStar-reconstructPath
 * @private
 * @param {Phaser.Plugin.AStar.AStarNode} n - The astar node from wich you want to rebuild the path.
 * @return {array} An array of Phaser.Plugin.AStar.AStarNode
 */ 
Phaser.Plugin.AStar.prototype.reconstructPath = function(n) 
{
    var solution = [];
    var nn = n;
    while(nn.parent) {
            solution.push({x: nn.x, y: nn.y});
            nn = nn.parent;
    }
    return solution;
};

 
/**
 * Add a node into visited if it is not already in. Debug only.
 * @method Phaser.Plugin.AStar-visit
 * @private
 * @param {Phaser.Plugin.AStar.AStarNode} node - The astar node you want to register as visited
 * @return {void}
 */ 
Phaser.Plugin.AStar.prototype.visit = function(node)
{
    for(var i in this._visited)
    {
        if (this._visited[i] == node) return;
    }

    this._visited.push(node);
};
   

/**
 * Add a node into visited if it is not already in. Debug only.
 * @method Phaser.Plugin.AStar-neighbors
 * @private
 * @param {Phaser.Plugin.AStar.AStarNode} n - The astar node you want to register as visited
 * @return {void}
 */
Phaser.Plugin.AStar.prototype.neighbors = function(node)
{
    var x = node.x;
    var y = node.y;
    var n = null;
    var neighbors = [];
   
    var map = this._tilemap.layers[this._layerIndex].data;

    //West
    if (x > 0) {
           
        n = map[y][x-1].properties.astarNode;
        if (n.walkable) {
            n.travelCost = Phaser.Plugin.AStar.COST_ORTHOGONAL;
            neighbors.push(n);
        }
    }
    //East
    if (x < this._tilemap.width-1) {
        n = map[y][x+1].properties.astarNode;
        if (n.walkable) {
            n.travelCost = Phaser.Plugin.AStar.COST_ORTHOGONAL;
            neighbors.push(n);
        }
    }
    //North
    if (y > 0) {
        n = map[y-1][x].properties.astarNode;
        if (n.walkable) {
            n.travelCost = Phaser.Plugin.AStar.COST_ORTHOGONAL;
            neighbors.push(n);
        }
    }
    //South
    if (y < this._tilemap.height-1) {
        n = map[y+1][x].properties.astarNode;
        if (n.walkable) {
            n.travelCost = Phaser.Plugin.AStar.COST_ORTHOGONAL;
            neighbors.push(n);
        }
    }
   
    //If diagonals aren't used do not search for other neighbors and return orthogonal search result
    if(this._useDiagonal === false)
        return neighbors;
   
    //NorthWest
    if (x > 0 && y > 0) {
        n = map[y-1][x-1].properties.astarNode;
        if (n.walkable
            && map[y][x-1].properties.astarNode.walkable
            && map[y-1][x].properties.astarNode.walkable
        ) {                                            
            n.travelCost = Phaser.Plugin.AStar.COST_DIAGONAL;
            neighbors.push(n);
        }
    }
    //NorthEast
    if (x < this._tilemap.width-1 && y > 0) {
        n = map[y-1][x+1].properties.astarNode;
        if (n.walkable
            && map[y][x+1].properties.astarNode.walkable
            && map[y-1][x].properties.astarNode.walkable
        ) {
            n.travelCost = Phaser.Plugin.AStar.COST_DIAGONAL;
            neighbors.push(n);
        }
    }
    //SouthWest
    if (x > 0 && y < this._tilemap.height-1) {
        n = map[y+1][x-1].properties.astarNode;
        if (n.walkable
            && map[y][x-1].properties.astarNode.walkable
            && map[y+1][x].properties.astarNode.walkable
        ) {
            n.travelCost = Phaser.Plugin.AStar.COST_DIAGONAL;
            neighbors.push(n);
        }
    }
    //SouthEast
    if (x < this._tilemap.width-1 && y < this._tilemap.height-1) {
        n = map[y+1][x+1].properties.astarNode;
        if (n.walkable
            && map[y][x+1].properties.astarNode.walkable
            && map[y+1][x].properties.astarNode.walkable
        ) {
            n.travelCost = Phaser.Plugin.AStar.COST_DIAGONAL;
            neighbors.push(n);
        }
    }
   
    return neighbors;
};


/**
 * Calculate a distance between tow astar nodes coordinates according to the Manhattan method
 * @method Phaser.Plugin.AStar-distManhattan
 * @private
 * @param {Phaser.Plugin.AStar.AStarNode} nodeA - The A node.
 * @param {Phaser.Plugin.AStar.AStarNode} nodeB - The B node.
 * @return {number} The distance between nodeA and nodeB
 */
Phaser.Plugin.AStar.prototype.distManhattan = function (nodeA, nodeB) 
{
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
};

/**
 * Calculate a distance between tow astar nodes coordinates according to the Euclidian method. More accurate
 * @method Phaser.Plugin.AStar-distEuclidian
 * @private
 * @param {Phaser.Plugin.AStar.AStarNode} nodeA - The A node.
 * @param {Phaser.Plugin.AStar.AStarNode} nodeB - The B node.
 * @return {number} The distance between nodeA and nodeB
 */
Phaser.Plugin.AStar.prototype.distEuclidian = function(nodeA, nodeB)
{
    return Math.sqrt(Math.pow((nodeA.x - nodeB.x), 2) + Math.pow((nodeA.y  -nodeB.y), 2));
};


/**
 * Tells if a tile is walkable from its tilemap coordinates
 * @method Phaser.Plugin.AStar-isWalkable
 * @public
 * @param {number} x - The x coordiante of the tile in tilemap's coordinate.
 * @param {number} y - The y coordinate of the tile in tilemap's coordinate.
 * @return {boolean} The distance between nodeA and nodeB
 */
Phaser.Plugin.AStar.prototype.isWalkable = function(x, y)
{  
    return this._tilemap.layers[this._layerIndex].data[y][x].properties.astarNode.walkable;
};


/**
 * @properties {string} version - The version number of Phaser.Plugin.AStar read only
 */
Object.defineProperty(Phaser.Plugin.AStar.prototype, "version", {
    
    get: function () {
        return Phaser.Plugin.AStar.VERSION;
    }

});

        
/**
* AStarNode is an object that stores AStar value. Each tile have an AStarNode in their properties
* @class Phaser.Plugin.AStar.AStarNode
* @constructor
* @param {number} x - The x coordinate of the tile.
* @param {number} y - The y coordinate of the tile.
* @param {boolean} isWalkable - Is this tile is walkable?
*/
Phaser.Plugin.AStar.AStarNode = function(x, y, isWalkable)
{

    /**
    * @property {number} x - The x coordinate of the tile.
    */
    this.x = x;
    
    /**
    * @property {number} y - The y coordinate of the tile.
    */
    this.y = y;

    /**
    * @property {number} g - The total travel cost from the start point. Sum of COST_ORTHOGONAL and COST_DIAGONAL
    */
    this.g = 0;

    /**
    * @property {number} h - The remaing distance as the crow flies between this node and the goal.
    */
    this.h = 0;

    /**
    * @property {number} f - The weight. Sum of g + h.
    */
    this.f = 0;

    /**
     * @property {Phaser.Plugin.AStar.AStarNode} parent - Where do we come from? It's an AStarNode reference needed to reconstruct a path backwards (from goal to start point)
     */
    this.parent; 

    /**
     * @property {boolean} walkable - Is this node is walkable?
     */
    this.walkable = isWalkable;

    /**
     * @property {number} travelCost - The cost to travel to this node, COST_ORTHOGONAL or COST_DIAGONAL 
     */
    this.travelCost;
};


/**
* AStarPath is an object that stores a searchPath result.
* @class Phaser.Plugin.AStar.AStarPath
* @constructor
* @param {array} nodes - An array of nodes coordinates sorted backward from goal to start point.
* @param {Phaser.Plugin.AStarNode} start - The start AStarNode used for the searchPath.
* @param {Phaser.Plugin.AStarNode} goal - The goal AStarNode used for the searchPath.
*/
Phaser.Plugin.AStar.AStarPath = function(nodes, start, goal)
{
    /**
     * @property {array} nodes - Array of AstarNodes x, y coordiantes that are the path solution from goal to start point. 
     */
    this.nodes = nodes || [];

    /**
     * @property {Phaser.Plugin.Astar.AStarNode} start - Reference to the start point used by findPath. 
     */
    this.start = start || null;

    /**
     * @property {Phaser.Plugin.Astar.AStarNode} goal - Reference to the goal point used by findPath. 
     */
    this.goal = goal || null;

    /**
     * @property {array} visited - Array of AStarNodes that the findPath algorythm has visited. Used for debug only.
     */
    this.visited = [];
};


/**
* Debug method to draw the last calculated path by AStar
* @method Phaser.Utils.Debug.AStar
* @param {Phaser.Plugin.AStar} astar- The AStar plugin that you want to debug.
* @param {number} x - X position on camera for debug display.
* @param {number} y - Y position on camera for debug display.
* @param {string} color - Color to stroke the path line.
* @return {void}
*/
Phaser.Utils.Debug.prototype.AStar = function(astar, x, y, color, showVisited)
{
    if (this.context == null)
    {
        return;
    }
    
    var pathLength = 0;
    if(astar._lastPath !== null)
    {
        pathLength = astar._lastPath.nodes.length;
    }

    color = color || 'rgb(255,255,255)';

    this.game.debug.start(x, y, color);


    if(pathLength > 0)
    {
        var node = astar._lastPath.nodes[0];
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo((node.x * astar._tilemap.tileWidth) + (astar._tilemap.tileWidth/2) - this.game.camera.view.x, (node.y * astar._tilemap.tileHeight) + (astar._tilemap.tileHeight/2) - this.game.camera.view.y);

        for(var i=0; i<pathLength; i++)
        {
            node = astar._lastPath.nodes[i];
            this.context.lineTo((node.x * astar._tilemap.tileWidth) + (astar._tilemap.tileWidth/2) - this.game.camera.view.x, (node.y * astar._tilemap.tileHeight) + (astar._tilemap.tileHeight/2) - this.game.camera.view.y);
        }

        this.context.lineTo((astar._lastPath.start.x * astar._tilemap.tileWidth) + (astar._tilemap.tileWidth/2) - this.game.camera.view.x, (astar._lastPath.start.y * astar._tilemap.tileHeight) + (astar._tilemap.tileHeight/2) - this.game.camera.view.y);

        this.context.stroke(); 

        //Draw circles on visited nodes
        if(showVisited !== false)
        {
            var visitedNode;
            for(var j=0; j < astar._lastPath.visited.length; j++)
            {
                visitedNode = astar._lastPath.visited[j];
                this.context.beginPath();
                this.context.arc((visitedNode.x * astar._tilemap.tileWidth) + (astar._tilemap.tileWidth/2) - this.game.camera.view.x, (visitedNode.y * astar._tilemap.tileHeight) + (astar._tilemap.tileHeight/2) - this.game.camera.view.y, 2, 0, Math.PI*2, true);
                this.context.stroke(); 
            }
        }
    }

    this.line('Path length: ' + pathLength);
    this.line('Distance func: ' + astar._distanceFunction);
    this.line('Use diagonal: ' + astar._useDiagonal);
    this.line('Find Closest: ' + astar._findClosest);

    this.game.debug.stop();
};





},{}],31:[function(require,module,exports){
var SatBody = require("./sat-body.js");

module.exports = Phaser.Plugin.SatBody = function (game, parent) {
    this.game = game;
    this.parent = parent;
    this._bodies = [];
    this._isDebug = false;
};

Phaser.Plugin.SatBody.prototype = Object.create(Phaser.Plugin.prototype);

Phaser.Plugin.SatBody.prototype.addBoxBody = function (sprite, width, height) {
    var body = new SatBody(sprite);
    body.initBox(width, height);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.addCircleBody = function (sprite, radius) {
    var body = new SatBody(sprite);
    body.initCircle(radius);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.addPolygonBody = function (sprite, points) {
    var body = new SatBody(sprite);
    body.initPolygon(points);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.isDebugAllEnabled = function () {
    return (this._isDebug === true);
};

Phaser.Plugin.SatBody.prototype.enableDebugAll = function () {
    this._isDebug = true;
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].enableDebug();
    }
};

Phaser.Plugin.SatBody.prototype.disableDebugAll = function () {
    this._isDebug = false;
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].disableDebug();
    }
};

Phaser.Plugin.SatBody.prototype.postUpdate = function () {
    // Update after the physics have been applied to all game objects
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].postUpdate();
    }
};

Phaser.Plugin.SatBody.prototype.removeBody = function (body) {
    for (var i = 0; i < this._bodies.length; i += 1) {
        if (body === this._bodies[i]) {
            this._bodies.splice(i, 1);
            break;
        }
    }
};

Phaser.Plugin.SatBody.prototype.destroy = function () {
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].destroy();
    }
};

},{"./sat-body.js":32}],32:[function(require,module,exports){
/**
 * TODO:
 * - Do we need to worry problems with coordinate systems not matching for 
 *   collisions? If so, overlap should happen with world coordinates.
 * - Do we need the option for a SAT body to be composed of multiple shapes, 
 *   e.g. a box plus a circle?
 * - Do we need there to be a possible offset between the sprite's anchor and 
 *   this SatBody? If so, we need to track that.
 * - Do we need to consider scale and pivot?
 */

module.exports = SatBody;

var utils = require("../../helpers/utilities.js");
var SAT = require("sat");

var BODY_TYPE = {
    CIRCLE: "circle",
    POLYGON: "polygon"
};

// Helper Object Factories
var vec = function (x, y) {
    return new SAT.Vector(x, y);
};
var box = function (pos, w, h) {
    return new SAT.Box(pos, w, h);
};
var circle = function (pos, r) {
    return new SAT.Circle(pos, r);
};
var polygon = function (pos, points) {
    return new SAT.Polygon(pos, points);
};

function SatBody(sprite) {
    this.game = sprite.game;
    this._sprite = sprite;
    this.disableDebug();

    // Schedule clean up when parent sprite owner is destroyed
    this._sprite.events.onDestroy.add(this.destroy.bind(this));
}

SatBody.prototype.initBox = function (width, height) {
    var s = this._sprite;
    var anchor = this._sprite.anchor;
    width = utils.default(width, s.width);
    height = utils.default(height, s.height);
    this._bodyType = BODY_TYPE.POLYGON;
    this._body = box(vec(s.x, s.y), width, height).toPolygon();
    this._body.translate(-anchor.x * width, -anchor.y * height);
};

SatBody.prototype.initCircle = function (r) {
    this._bodyType = BODY_TYPE.CIRCLE;
    var s = this._sprite;
    if (!r) r = s.width / 2;
    this._body = circle(vec(s.x, s.y), r);
};

SatBody.prototype.initPolygon = function (points) {
    // Untested
    // This function would be more convient if it took an array or parsed the 
    // arguments variable to construct the points
    this._bodyType = BODY_TYPE.POLYGON;
    var s = this._sprite;
    this._body = polygon(vec(s.x, s.y), points);
};

SatBody.prototype.getBody = function () {
    return this._body;
};

SatBody.prototype.getBodyType = function () {
    return this._bodyType;
};

SatBody.prototype.testOverlap = function (otherBody) {
    // Handy boolean shorthands
    var thisIsCircle = (this._bodyType === BODY_TYPE.CIRCLE);
    var otherIsCircle = (otherBody._bodyType === BODY_TYPE.CIRCLE);

    // Determine the appropriate collision body comparison
    if (thisIsCircle && otherIsCircle) {
        return SAT.testCircleCircle(this._body, otherBody._body);
    } else if (!thisIsCircle && otherIsCircle) {
        return SAT.testPolygonCircle(this._body, otherBody._body);
    } else if (thisIsCircle && !otherIsCircle) {
        return SAT.testPolygonCircle(otherBody._body, this._body);
    } else {
        return SAT.testPolygonPolygon(this._body, otherBody._body);
    }
};

SatBody.prototype.postUpdate = function () {
    // Update the position of the colliding body
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
        this._body.setAngle(this._sprite.rotation);
        // Rotation should probably be world rotation...or something?
    }

    if (this._isDebug) this._updateDebug();
};

SatBody.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.satBody.removeBody(this);
};

SatBody.prototype.setDebugColor = function (debugColor) {
    this._debugColor = debugColor;
};

SatBody.prototype.enableDebug = function (debugColor) {
    debugColor = (debugColor !== undefined) ? debugColor : 0x00FF00;
    this._isDebug = true;
    if (!this._debugGraphics) {
        // Only create debug graphics if it is needed, for performance reasons
        this._debugGraphics = this.game.add.graphics(0, 0);
        this._sprite.parent.add(this._debugGraphics);
    } 
    this._debugGraphics.visible = true;
    if (debugColor) this.setDebugColor(debugColor);
};

SatBody.prototype.disableDebug = function () {    
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
};

SatBody.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this._sprite.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, this._debugColor, 0.6);
    this._debugGraphics.beginFill(this._debugColor, 0.4);
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._debugGraphics.drawCircle(this._body.x, this._body.y, 
            2 * this._body.r);
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        this._debugGraphics.drawPolygon(this._body.calcPoints);
    }
    this._debugGraphics.endFill();
};
},{"../../helpers/utilities.js":28,"sat":6}],33:[function(require,module,exports){
/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

module.exports = BootState;

function BootState() {}

BootState.prototype.create = function () {
    // Take care of any global game settings that need to be set up
    this.game.renderer.renderSession.roundPixels = false;
    // Disable cursor
    this.game.canvas.style.cursor = "none";
    // Disable the built-in pausing. This is useful for debugging, but may also
    // be useful for the game logic
    this.stage.disableVisibilityChange = true;
    this.stage.backgroundColor = "#F9F9F9";

    this.game.state.start("load");
};
},{}],34:[function(require,module,exports){
/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState() {}

LoadState.prototype.preload = function () {    
    // Images
    this.load.atlasJSONHash("assets", "resources/atlases/assets.png", 
        "resources/atlases/assets.json");
    this.load.image("fogMask", "resources/images/fog-mask-2.png")

    // Tilemap
    this.load.tilemap("tilemap", "resources/tilemaps/open-tilemap.json", null, 
        Phaser.Tilemap.TILED_JSON);
    this.load.image("coloredTiles", "resources/tilemaps/tiles.png");

    // Stand-in for a loading bar
    this.loadingText = this.add.text(this.world.centerX, this.world.centerY, 
        "0%", { 
            font: "200px Arial", 
            fill: "#000", 
            align: "center" 
        });
    this.loadingText.anchor.set(0.5);
};

LoadState.prototype.loadRender = function () {
    this.loadingText.setText(this.load.progress + "%");
};

LoadState.prototype.create = function () {
    // Since load progress might not reach 100 in the load loop, manually do it
    this.loadingText.setText("100%");

    // this.game.state.start("start"); // start screen
    this.game.state.start("sandbox"); // for testing

};
},{}],35:[function(require,module,exports){
/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var ShadowMask = require("../game-objects/shadow-mask.js");

function Sandbox() {}

Sandbox.prototype.create = function () {
    // Create the space for globals on the game object
    this.game.globals = {};

    // Shorthands
    var game = this.game;
    var globals = game.globals;
    
    // Debugging FPS
    game.time.advancedTiming = true;
    
    // Canvas styling
    game.canvas.style.cursor = "none";
    game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar)
    };

    // Groups for z-index sorting and for collisions
    var groups = {
        background: game.add.group(this.world, "background"),
        midground: game.add.group(this.world, "midground"),
        foreground: game.add.group(this.world, "foreground")
    };
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.pickups = game.add.group(groups.midground, "pickups");
    groups.nonCollidingGroup = game.add.group(groups.midground, 
        "non-colliding");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("colors", "coloredTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("Background", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var blockingLayer = map.createLayer("BlockingLayer", this.game.width, 
        this.game.height, groups.background);
    map.setCollisionBetween(0, 3, true, "BlockingLayer");
    globals.tileMap = map;
    globals.tileMapLayer = blockingLayer;

    globals.shadowMask = new ShadowMask(game, 0.8, map, groups.midground);

    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "BlockingLayer", "colors");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Get the Spawn Point(s) for the player from the tile map.
    var playerStartPoint = this.getMapPoints("player")[0]; // only one for the moment...
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, playerStartPoint.x, playerStartPoint.y, groups.midground);
    this.camera.follow(player);
    globals.player = player;

    // Spawn Point Testing
    // Get the Spawn Point(s) for the lights (these were orignally set up for the weapons...)
    var lightSpawnPoints = this.getMapPoints("weapon");
    // Pick a random Point for the light to spawn at.
    globals.lightPoint = new Phaser.Point(lightSpawnPoints[0].x, lightSpawnPoints[0].y);

    
    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    // var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
    // for (var i=0; i<50; i++) {
    //     new WeaponPickup(this.game, this.game.rnd.integerInRange(0, 1300), 
    //         this.game.rnd.integerInRange(0, 1300), "gun", 5)
    // }
    
    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
            globals.shadowMask.toggleRays();
        } else {
            globals.plugins.satBody.enableDebugAll();
            globals.shadowMask.toggleRays();
        }
    }, this);
};

Sandbox.prototype.getMapPoints = function(key) {
    // There could be more than 1 map point per type...
    var mapPoints = [];
    // We are searching the current tile map layer.
    var map = this.game.globals.tileMap;
    // If the current key exists...
    if (map.objects[key]) {
        // For each object with the current key.
        var objects = map.objects[key];
        for (var i = 0; i < objects.length; i++) {
            mapPoints.push({
                x: objects[i].x,
                y: objects[i].y
            })
        }
    }
    return mapPoints;
};

Sandbox.prototype.update = function () {
    this.game.globals.shadowMask.update();
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, "#ff0000");

    this.game.globals.shadowMask.drawWalls();
};
},{"../game-objects/heads-up-display.js":7,"../game-objects/player.js":8,"../game-objects/shadow-mask.js":10,"../helpers/score-keeper.js":26,"../plugins/AStar.js":30,"../plugins/sat-body-plugin/sat-body-plugin.js":31}],36:[function(require,module,exports){
/**
 * StartScreen - start here!
 */

module.exports = StartScreen;

var Reticule = require("../game-objects/reticule.js");

function StartScreen() {}

StartScreen.prototype.create = function () {
    // Groups for z-index sorting and for collisions
    this.groups = {
        background: this.game.add.group(this.world, "background"),
        midground: this.game.add.group(this.world, "midground"),
        foreground: this.game.add.group(this.world, "foreground")
    };

    this.bg = this.add.tileSprite(0, 0, 2000, 2000, "assets", "hud/grid", 
        this.groups.background);

    var logo = this.game.add.sprite(this.world.centerX, this.world.centerY-160,
        "assets", "startScreen/logo");
    logo.anchor.setTo(0.5,0.5);
    this.groups.midground.add(logo);
    var playBtn = this.game.add.button(this.world.centerX,
        this.world.centerY+20, "assets", this._playTheGame, this,
        "startScreen/play-down", "startScreen/play-up");
    playBtn.anchor.setTo(0.5,0.5);
    this.groups.midground.add(playBtn);
    var optionsBtn = this.game.add.button(this.world.centerX,
        this.world.centerY+140, "assets", this._options, this,
        "startScreen/options-down", "startScreen/options-up");
    optionsBtn.anchor.setTo(0.5,0.5);
    this.groups.midground.add(optionsBtn);

    this.reticule = new Reticule(this, this.groups.foreground);
};

StartScreen.prototype._playTheGame = function () {
    this.game.state.start("game");
};

StartScreen.prototype._options = function () {
    console.log("trick!");
};

},{"../game-objects/reticule.js":9}]},{},[29])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaHVsbC5qcy9zcmMvY29udmV4LmpzIiwibm9kZV9tb2R1bGVzL2h1bGwuanMvc3JjL2Zvcm1hdC5qcyIsIm5vZGVfbW9kdWxlcy9odWxsLmpzL3NyYy9ncmlkLmpzIiwibm9kZV9tb2R1bGVzL2h1bGwuanMvc3JjL2h1bGwuanMiLCJub2RlX21vZHVsZXMvaHVsbC5qcy9zcmMvaW50ZXJzZWN0LmpzIiwibm9kZV9tb2R1bGVzL3NhdC9TQVQuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL2hlYWRzLXVwLWRpc3BsYXkuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3BsYXllci5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvcmV0aWN1bGUuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3NoYWRvdy1tYXNrLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy93ZWFwb25zL2Fycm93LmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy93ZWFwb25zL2Jhc2UtcHJvamVjdGlsZS5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvd2VhcG9ucy9iYXNlLXdlYXBvbi5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvd2VhcG9ucy9iZWFtLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy93ZWFwb25zL2V4cGxvc2l2ZS5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvd2VhcG9ucy9maXJlLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy93ZWFwb25zL2ZsYW1ldGhyb3dlci5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvd2VhcG9ucy9ndW4uanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3dlYXBvbnMvbGFzZXIuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3dlYXBvbnMvbWFjaGluZS1ndW4uanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3dlYXBvbnMvbWVsZWUtd2VhcG9uLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy93ZWFwb25zL3NjYXR0ZXJzaG90LmpzIiwic3JjL2pzL2hlbHBlcnMvY29tYm8tdHJhY2tlci5qcyIsInNyYy9qcy9oZWxwZXJzL2NvbnRyb2xsZXIuanMiLCJzcmMvanMvaGVscGVycy9odWxsLWZyb20tdGlsZXMuanMiLCJzcmMvanMvaGVscGVycy9zY29yZS1rZWVwZXIuanMiLCJzcmMvanMvaGVscGVycy9zcHJpdGUtdXRpbGl0aWVzLmpzIiwic3JjL2pzL2hlbHBlcnMvdXRpbGl0aWVzLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvcGx1Z2lucy9BU3Rhci5qcyIsInNyYy9qcy9wbHVnaW5zL3NhdC1ib2R5LXBsdWdpbi9zYXQtYm9keS1wbHVnaW4uanMiLCJzcmMvanMvcGx1Z2lucy9zYXQtYm9keS1wbHVnaW4vc2F0LWJvZHkuanMiLCJzcmMvanMvc3RhdGVzL2Jvb3Qtc3RhdGUuanMiLCJzcmMvanMvc3RhdGVzL2xvYWQtc3RhdGUuanMiLCJzcmMvanMvc3RhdGVzL3NhbmRib3guanMiLCJzcmMvanMvc3RhdGVzL3N0YXJ0LXNjcmVlbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Q5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIF9jcm9zcyhvLCBhLCBiKSB7XG4gICAgcmV0dXJuIChhWzBdIC0gb1swXSkgKiAoYlsxXSAtIG9bMV0pIC0gKGFbMV0gLSBvWzFdKSAqIChiWzBdIC0gb1swXSk7XG59XG5cbmZ1bmN0aW9uIF91cHBlclRhbmdlbnQocG9pbnRzZXQpIHtcbiAgICB2YXIgbG93ZXIgPSBbXTtcbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IHBvaW50c2V0Lmxlbmd0aDsgbCsrKSB7XG4gICAgICAgIHdoaWxlIChsb3dlci5sZW5ndGggPj0gMiAmJiAoX2Nyb3NzKGxvd2VyW2xvd2VyLmxlbmd0aCAtIDJdLCBsb3dlcltsb3dlci5sZW5ndGggLSAxXSwgcG9pbnRzZXRbbF0pIDw9IDApKSB7XG4gICAgICAgICAgICBsb3dlci5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBsb3dlci5wdXNoKHBvaW50c2V0W2xdKTtcbiAgICB9XG4gICAgbG93ZXIucG9wKCk7XG4gICAgcmV0dXJuIGxvd2VyO1xufVxuXG5mdW5jdGlvbiBfbG93ZXJUYW5nZW50KHBvaW50c2V0KSB7XG4gICAgdmFyIHJldmVyc2VkID0gcG9pbnRzZXQucmV2ZXJzZSgpLFxuICAgICAgICB1cHBlciA9IFtdO1xuICAgIGZvciAodmFyIHUgPSAwOyB1IDwgcmV2ZXJzZWQubGVuZ3RoOyB1KyspIHtcbiAgICAgICAgd2hpbGUgKHVwcGVyLmxlbmd0aCA+PSAyICYmIChfY3Jvc3ModXBwZXJbdXBwZXIubGVuZ3RoIC0gMl0sIHVwcGVyW3VwcGVyLmxlbmd0aCAtIDFdLCByZXZlcnNlZFt1XSkgPD0gMCkpIHtcbiAgICAgICAgICAgIHVwcGVyLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHVwcGVyLnB1c2gocmV2ZXJzZWRbdV0pO1xuICAgIH1cbiAgICB1cHBlci5wb3AoKTtcbiAgICByZXR1cm4gdXBwZXI7XG59XG5cbi8vIHBvaW50c2V0IGhhcyB0byBiZSBzb3J0ZWQgYnkgWFxuZnVuY3Rpb24gY29udmV4KHBvaW50c2V0KSB7XG4gICAgdmFyIGNvbnZleCxcbiAgICAgICAgdXBwZXIgPSBfdXBwZXJUYW5nZW50KHBvaW50c2V0KSxcbiAgICAgICAgbG93ZXIgPSBfbG93ZXJUYW5nZW50KHBvaW50c2V0KTtcbiAgICBjb252ZXggPSBsb3dlci5jb25jYXQodXBwZXIpO1xuICAgIGNvbnZleC5wdXNoKHBvaW50c2V0WzBdKTsgIFxuICAgIHJldHVybiBjb252ZXg7ICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb252ZXg7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHRvWHk6IGZ1bmN0aW9uKHBvaW50c2V0LCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9pbnRzZXQuc2xpY2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9pbnRzZXQubWFwKGZ1bmN0aW9uKHB0KSB7XG4gICAgICAgICAgICAvKmpzbGludCBldmlsOiB0cnVlICovXG4gICAgICAgICAgICB2YXIgX2dldFhZID0gbmV3IEZ1bmN0aW9uKCdwdCcsICdyZXR1cm4gW3B0JyArIGZvcm1hdFswXSArICcsJyArICdwdCcgKyBmb3JtYXRbMV0gKyAnXTsnKTtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0WFkocHQpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZnJvbVh5OiBmdW5jdGlvbihwb2ludHNldCwgZm9ybWF0KSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHBvaW50c2V0LnNsaWNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvaW50c2V0Lm1hcChmdW5jdGlvbihwdCkge1xuICAgICAgICAgICAgLypqc2xpbnQgZXZpbDogdHJ1ZSAqL1xuICAgICAgICAgICAgdmFyIF9nZXRPYmogPSBuZXcgRnVuY3Rpb24oJ3B0JywgJ3ZhciBvID0ge307IG8nICsgZm9ybWF0WzBdICsgJz0gcHRbMF07IG8nICsgZm9ybWF0WzFdICsgJz0gcHRbMV07IHJldHVybiBvOycpO1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRPYmoocHQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0iLCJmdW5jdGlvbiBHcmlkKHBvaW50cywgY2VsbFNpemUpIHtcbiAgICB0aGlzLl9jZWxscyA9IFtdO1xuICAgIHRoaXMuX2NlbGxTaXplID0gY2VsbFNpemU7XG5cbiAgICBwb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb2ludCkge1xuICAgICAgICB2YXIgY2VsbFhZID0gdGhpcy5wb2ludDJDZWxsWFkocG9pbnQpLFxuICAgICAgICAgICAgeCA9IGNlbGxYWVswXSxcbiAgICAgICAgICAgIHkgPSBjZWxsWFlbMV07XG4gICAgICAgIGlmICh0aGlzLl9jZWxsc1t4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9jZWxsc1t4XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9jZWxsc1t4XVt5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9jZWxsc1t4XVt5XSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NlbGxzW3hdW3ldLnB1c2gocG9pbnQpO1xuICAgIH0sIHRoaXMpO1xufVxuXG5HcmlkLnByb3RvdHlwZSA9IHtcbiAgICBjZWxsUG9pbnRzOiBmdW5jdGlvbih4LCB5KSB7IC8vIChOdW1iZXIsIE51bWJlcikgLT4gQXJyYXlcbiAgICAgICAgcmV0dXJuICh0aGlzLl9jZWxsc1t4XSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2NlbGxzW3hdW3ldICE9PSB1bmRlZmluZWQpID8gdGhpcy5fY2VsbHNbeF1beV0gOiBbXTtcbiAgICB9LFxuXG4gICAgcmFuZ2VQb2ludHM6IGZ1bmN0aW9uKGJib3gpIHsgLy8gKEFycmF5KSAtPiBBcnJheVxuICAgICAgICB2YXIgdGxDZWxsWFkgPSB0aGlzLnBvaW50MkNlbGxYWShbYmJveFswXSwgYmJveFsxXV0pLFxuICAgICAgICAgICAgYnJDZWxsWFkgPSB0aGlzLnBvaW50MkNlbGxYWShbYmJveFsyXSwgYmJveFszXV0pLFxuICAgICAgICAgICAgcG9pbnRzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgeCA9IHRsQ2VsbFhZWzBdOyB4IDw9IGJyQ2VsbFhZWzBdOyB4KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSB0bENlbGxYWVsxXTsgeSA8PSBickNlbGxYWVsxXTsgeSsrKSB7XG4gICAgICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLmNvbmNhdCh0aGlzLmNlbGxQb2ludHMoeCwgeSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBvaW50cztcbiAgICB9LFxuXG4gICAgcmVtb3ZlUG9pbnQ6IGZ1bmN0aW9uKHBvaW50KSB7IC8vIChBcnJheSkgLT4gQXJyYXlcbiAgICAgICAgdmFyIGNlbGxYWSA9IHRoaXMucG9pbnQyQ2VsbFhZKHBvaW50KSxcbiAgICAgICAgICAgIGNlbGwgPSB0aGlzLl9jZWxsc1tjZWxsWFlbMF1dW2NlbGxYWVsxXV0sXG4gICAgICAgICAgICBwb2ludElkeEluQ2VsbDtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2VsbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNlbGxbaV1bMF0gPT09IHBvaW50WzBdICYmIGNlbGxbaV1bMV0gPT09IHBvaW50WzFdKSB7XG4gICAgICAgICAgICAgICAgcG9pbnRJZHhJbkNlbGwgPSBpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2VsbC5zcGxpY2UocG9pbnRJZHhJbkNlbGwsIDEpO1xuXG4gICAgICAgIHJldHVybiBjZWxsO1xuICAgIH0sXG5cbiAgICBwb2ludDJDZWxsWFk6IGZ1bmN0aW9uKHBvaW50KSB7IC8vIChBcnJheSkgLT4gQXJyYXlcbiAgICAgICAgdmFyIHggPSBwYXJzZUludChwb2ludFswXSAvIHRoaXMuX2NlbGxTaXplKSxcbiAgICAgICAgICAgIHkgPSBwYXJzZUludChwb2ludFsxXSAvIHRoaXMuX2NlbGxTaXplKTtcbiAgICAgICAgcmV0dXJuIFt4LCB5XTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kQmJveDogZnVuY3Rpb24oYmJveCwgc2NhbGVGYWN0b3IpIHsgLy8gKEFycmF5LCBOdW1iZXIpIC0+IEFycmF5XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBiYm94WzBdIC0gKHNjYWxlRmFjdG9yICogdGhpcy5fY2VsbFNpemUpLFxuICAgICAgICAgICAgYmJveFsxXSAtIChzY2FsZUZhY3RvciAqIHRoaXMuX2NlbGxTaXplKSxcbiAgICAgICAgICAgIGJib3hbMl0gKyAoc2NhbGVGYWN0b3IgKiB0aGlzLl9jZWxsU2l6ZSksXG4gICAgICAgICAgICBiYm94WzNdICsgKHNjYWxlRmFjdG9yICogdGhpcy5fY2VsbFNpemUpXG4gICAgICAgIF07XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZ3JpZChwb2ludHMsIGNlbGxTaXplKSB7XG4gICAgcmV0dXJuIG5ldyBHcmlkKHBvaW50cywgY2VsbFNpemUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdyaWQ7IiwiLypcbiAoYykgMjAxNC0yMDE2LCBBbmRyaWkgSGVvbmlhXG4gSHVsbC5qcywgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGNvbmNhdmUgaHVsbCBnZW5lcmF0aW9uIGJ5IHNldCBvZiBwb2ludHMuXG4gaHR0cHM6Ly9naXRodWIuY29tL0FuZHJpaUhlb25pYS9odWxsXG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpbnRlcnNlY3QgPSByZXF1aXJlKCcuL2ludGVyc2VjdC5qcycpO1xudmFyIGdyaWQgPSByZXF1aXJlKCcuL2dyaWQuanMnKTtcbnZhciBmb3JtYXRVdGlsID0gcmVxdWlyZSgnLi9mb3JtYXQuanMnKTtcbnZhciBjb252ZXhIdWxsID0gcmVxdWlyZSgnLi9jb252ZXguanMnKTtcblxuZnVuY3Rpb24gX2ZpbHRlckR1cGxpY2F0ZXMocG9pbnRzZXQpIHtcbiAgICByZXR1cm4gcG9pbnRzZXQuZmlsdGVyKGZ1bmN0aW9uKGVsLCBpZHgsIGFycikge1xuICAgICAgICB2YXIgcHJldkVsID0gYXJyW2lkeCAtIDFdO1xuICAgICAgICByZXR1cm4gaWR4ID09PSAwIHx8ICEocHJldkVsWzBdID09PSBlbFswXSAmJiBwcmV2RWxbMV0gPT09IGVsWzFdKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gX3NvcnRCeVgocG9pbnRzZXQpIHtcbiAgICByZXR1cm4gcG9pbnRzZXQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhWzBdID09IGJbMF0pIHtcbiAgICAgICAgICAgIHJldHVybiBhWzFdIC0gYlsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBhWzBdIC0gYlswXTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBfc3FMZW5ndGgoYSwgYikge1xuICAgIHJldHVybiBNYXRoLnBvdyhiWzBdIC0gYVswXSwgMikgKyBNYXRoLnBvdyhiWzFdIC0gYVsxXSwgMik7XG59XG5cbmZ1bmN0aW9uIF9jb3MobywgYSwgYikge1xuICAgIHZhciBhU2hpZnRlZCA9IFthWzBdIC0gb1swXSwgYVsxXSAtIG9bMV1dLFxuICAgICAgICBiU2hpZnRlZCA9IFtiWzBdIC0gb1swXSwgYlsxXSAtIG9bMV1dLFxuICAgICAgICBzcUFMZW4gPSBfc3FMZW5ndGgobywgYSksXG4gICAgICAgIHNxQkxlbiA9IF9zcUxlbmd0aChvLCBiKSxcbiAgICAgICAgZG90ID0gYVNoaWZ0ZWRbMF0gKiBiU2hpZnRlZFswXSArIGFTaGlmdGVkWzFdICogYlNoaWZ0ZWRbMV07XG5cbiAgICByZXR1cm4gZG90IC8gTWF0aC5zcXJ0KHNxQUxlbiAqIHNxQkxlbik7XG59XG5cbmZ1bmN0aW9uIF9pbnRlcnNlY3Qoc2VnbWVudCwgcG9pbnRzZXQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50c2V0Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICB2YXIgc2VnID0gW3BvaW50c2V0W2ldLCBwb2ludHNldFtpICsgMV1dO1xuICAgICAgICBpZiAoc2VnbWVudFswXVswXSA9PT0gc2VnWzBdWzBdICYmIHNlZ21lbnRbMF1bMV0gPT09IHNlZ1swXVsxXSB8fFxuICAgICAgICAgICAgc2VnbWVudFswXVswXSA9PT0gc2VnWzFdWzBdICYmIHNlZ21lbnRbMF1bMV0gPT09IHNlZ1sxXVsxXSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludGVyc2VjdChzZWdtZW50LCBzZWcpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF9vY2N1cGllZEFyZWEocG9pbnRzZXQpIHtcbiAgICB2YXIgbWluWCA9IEluZmluaXR5LFxuICAgICAgICBtaW5ZID0gSW5maW5pdHksXG4gICAgICAgIG1heFggPSAtSW5maW5pdHksXG4gICAgICAgIG1heFkgPSAtSW5maW5pdHk7XG5cbiAgICBmb3IgKHZhciBpID0gcG9pbnRzZXQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHBvaW50c2V0W2ldWzBdIDwgbWluWCkge1xuICAgICAgICAgICAgbWluWCA9IHBvaW50c2V0W2ldWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwb2ludHNldFtpXVsxXSA8IG1pblkpIHtcbiAgICAgICAgICAgIG1pblkgPSBwb2ludHNldFtpXVsxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9pbnRzZXRbaV1bMF0gPiBtYXhYKSB7XG4gICAgICAgICAgICBtYXhYID0gcG9pbnRzZXRbaV1bMF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvaW50c2V0W2ldWzFdID4gbWF4WSkge1xuICAgICAgICAgICAgbWF4WSA9IHBvaW50c2V0W2ldWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgbWF4WCAtIG1pblgsIC8vIHdpZHRoXG4gICAgICAgIG1heFkgLSBtaW5ZICAvLyBoZWlnaHRcbiAgICBdO1xufVxuXG5mdW5jdGlvbiBfYkJveEFyb3VuZChlZGdlKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgTWF0aC5taW4oZWRnZVswXVswXSwgZWRnZVsxXVswXSksIC8vIGxlZnRcbiAgICAgICAgTWF0aC5taW4oZWRnZVswXVsxXSwgZWRnZVsxXVsxXSksIC8vIHRvcFxuICAgICAgICBNYXRoLm1heChlZGdlWzBdWzBdLCBlZGdlWzFdWzBdKSwgLy8gcmlnaHRcbiAgICAgICAgTWF0aC5tYXgoZWRnZVswXVsxXSwgZWRnZVsxXVsxXSkgIC8vIGJvdHRvbVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIF9taWRQb2ludChlZGdlLCBpbm5lclBvaW50cywgY29udmV4KSB7XG4gICAgdmFyIHBvaW50ID0gbnVsbCxcbiAgICAgICAgYW5nbGUxQ29zID0gTUFYX0NPTkNBVkVfQU5HTEVfQ09TLFxuICAgICAgICBhbmdsZTJDb3MgPSBNQVhfQ09OQ0FWRV9BTkdMRV9DT1MsXG4gICAgICAgIGExQ29zLCBhMkNvcztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5uZXJQb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYTFDb3MgPSBfY29zKGVkZ2VbMF0sIGVkZ2VbMV0sIGlubmVyUG9pbnRzW2ldKTtcbiAgICAgICAgYTJDb3MgPSBfY29zKGVkZ2VbMV0sIGVkZ2VbMF0sIGlubmVyUG9pbnRzW2ldKTtcblxuICAgICAgICBpZiAoYTFDb3MgPiBhbmdsZTFDb3MgJiYgYTJDb3MgPiBhbmdsZTJDb3MgJiZcbiAgICAgICAgICAgICFfaW50ZXJzZWN0KFtlZGdlWzBdLCBpbm5lclBvaW50c1tpXV0sIGNvbnZleCkgJiZcbiAgICAgICAgICAgICFfaW50ZXJzZWN0KFtlZGdlWzFdLCBpbm5lclBvaW50c1tpXV0sIGNvbnZleCkpIHtcblxuICAgICAgICAgICAgYW5nbGUxQ29zID0gYTFDb3M7XG4gICAgICAgICAgICBhbmdsZTJDb3MgPSBhMkNvcztcbiAgICAgICAgICAgIHBvaW50ID0gaW5uZXJQb2ludHNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9pbnQ7XG59XG5cbmZ1bmN0aW9uIF9jb25jYXZlKGNvbnZleCwgbWF4U3FFZGdlTGVuLCBtYXhTZWFyY2hBcmVhLCBncmlkLCBlZGdlU2tpcExpc3QpIHtcbiAgICB2YXIgZWRnZSxcbiAgICAgICAga2V5SW5Ta2lwTGlzdCxcbiAgICAgICAgc2NhbGVGYWN0b3IsXG4gICAgICAgIG1pZFBvaW50LFxuICAgICAgICBiQm94QXJvdW5kLFxuICAgICAgICBiQm94V2lkdGgsXG4gICAgICAgIGJCb3hIZWlnaHQsXG4gICAgICAgIG1pZFBvaW50SW5zZXJ0ZWQgPSBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udmV4Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICBlZGdlID0gW2NvbnZleFtpXSwgY29udmV4W2kgKyAxXV07XG4gICAgICAgIGtleUluU2tpcExpc3QgPSBlZGdlWzBdLmpvaW4oKSArICcsJyArIGVkZ2VbMV0uam9pbigpO1xuXG4gICAgICAgIGlmIChfc3FMZW5ndGgoZWRnZVswXSwgZWRnZVsxXSkgPCBtYXhTcUVkZ2VMZW4gfHxcbiAgICAgICAgICAgIGVkZ2VTa2lwTGlzdFtrZXlJblNraXBMaXN0XSA9PT0gdHJ1ZSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIHNjYWxlRmFjdG9yID0gMDtcbiAgICAgICAgYkJveEFyb3VuZCA9IF9iQm94QXJvdW5kKGVkZ2UpO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBiQm94QXJvdW5kID0gZ3JpZC5leHRlbmRCYm94KGJCb3hBcm91bmQsIHNjYWxlRmFjdG9yKTtcbiAgICAgICAgICAgIGJCb3hXaWR0aCA9IGJCb3hBcm91bmRbMl0gLSBiQm94QXJvdW5kWzBdO1xuICAgICAgICAgICAgYkJveEhlaWdodCA9IGJCb3hBcm91bmRbM10gLSBiQm94QXJvdW5kWzFdO1xuXG4gICAgICAgICAgICBtaWRQb2ludCA9IF9taWRQb2ludChlZGdlLCBncmlkLnJhbmdlUG9pbnRzKGJCb3hBcm91bmQpLCBjb252ZXgpOyAgICAgICAgICAgIFxuICAgICAgICAgICAgc2NhbGVGYWN0b3IrKztcbiAgICAgICAgfSAgd2hpbGUgKG1pZFBvaW50ID09PSBudWxsICYmIChtYXhTZWFyY2hBcmVhWzBdID4gYkJveFdpZHRoIHx8IG1heFNlYXJjaEFyZWFbMV0gPiBiQm94SGVpZ2h0KSk7XG5cbiAgICAgICAgaWYgKGJCb3hXaWR0aCA+PSBtYXhTZWFyY2hBcmVhWzBdICYmIGJCb3hIZWlnaHQgPj0gbWF4U2VhcmNoQXJlYVsxXSkge1xuICAgICAgICAgICAgZWRnZVNraXBMaXN0W2tleUluU2tpcExpc3RdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtaWRQb2ludCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY29udmV4LnNwbGljZShpICsgMSwgMCwgbWlkUG9pbnQpO1xuICAgICAgICAgICAgZ3JpZC5yZW1vdmVQb2ludChtaWRQb2ludCk7XG4gICAgICAgICAgICBtaWRQb2ludEluc2VydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtaWRQb2ludEluc2VydGVkKSB7XG4gICAgICAgIHJldHVybiBfY29uY2F2ZShjb252ZXgsIG1heFNxRWRnZUxlbiwgbWF4U2VhcmNoQXJlYSwgZ3JpZCwgZWRnZVNraXBMaXN0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udmV4O1xufVxuXG5mdW5jdGlvbiBodWxsKHBvaW50c2V0LCBjb25jYXZpdHksIGZvcm1hdCkge1xuICAgIHZhciBjb252ZXgsXG4gICAgICAgIGNvbmNhdmUsXG4gICAgICAgIGlubmVyUG9pbnRzLFxuICAgICAgICBvY2N1cGllZEFyZWEsXG4gICAgICAgIG1heFNlYXJjaEFyZWEsXG4gICAgICAgIGNlbGxTaXplLFxuICAgICAgICBwb2ludHMsXG4gICAgICAgIG1heEVkZ2VMZW4gPSBjb25jYXZpdHkgfHwgMjA7XG5cbiAgICBpZiAocG9pbnRzZXQubGVuZ3RoIDwgNCkge1xuICAgICAgICByZXR1cm4gcG9pbnRzZXQuc2xpY2UoKTtcbiAgICB9XG5cbiAgICBwb2ludHMgPSBfZmlsdGVyRHVwbGljYXRlcyhfc29ydEJ5WChmb3JtYXRVdGlsLnRvWHkocG9pbnRzZXQsIGZvcm1hdCkpKTtcblxuICAgIG9jY3VwaWVkQXJlYSA9IF9vY2N1cGllZEFyZWEocG9pbnRzKTtcbiAgICBtYXhTZWFyY2hBcmVhID0gW1xuICAgICAgICBvY2N1cGllZEFyZWFbMF0gKiBNQVhfU0VBUkNIX0JCT1hfU0laRV9QRVJDRU5ULFxuICAgICAgICBvY2N1cGllZEFyZWFbMV0gKiBNQVhfU0VBUkNIX0JCT1hfU0laRV9QRVJDRU5UXG4gICAgXTtcblxuICAgIGNvbnZleCA9IGNvbnZleEh1bGwocG9pbnRzKTtcbiAgICBpbm5lclBvaW50cyA9IHBvaW50cy5maWx0ZXIoZnVuY3Rpb24ocHQpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZleC5pbmRleE9mKHB0KSA8IDA7XG4gICAgfSk7XG5cbiAgICBjZWxsU2l6ZSA9IE1hdGguY2VpbCgxIC8gKHBvaW50cy5sZW5ndGggLyAob2NjdXBpZWRBcmVhWzBdICogb2NjdXBpZWRBcmVhWzFdKSkpO1xuXG4gICAgY29uY2F2ZSA9IF9jb25jYXZlKFxuICAgICAgICBjb252ZXgsIE1hdGgucG93KG1heEVkZ2VMZW4sIDIpLFxuICAgICAgICBtYXhTZWFyY2hBcmVhLCBncmlkKGlubmVyUG9pbnRzLCBjZWxsU2l6ZSksIHt9KTtcbiBcbiAgICByZXR1cm4gZm9ybWF0VXRpbC5mcm9tWHkoY29uY2F2ZSwgZm9ybWF0KTtcbn1cblxudmFyIE1BWF9DT05DQVZFX0FOR0xFX0NPUyA9IE1hdGguY29zKDkwIC8gKDE4MCAvIE1hdGguUEkpKTsgLy8gYW5nbGUgPSA5MCBkZWdcbnZhciBNQVhfU0VBUkNIX0JCT1hfU0laRV9QRVJDRU5UID0gMC42O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGh1bGw7IiwiZnVuY3Rpb24gY2N3KHgxLCB5MSwgeDIsIHkyLCB4MywgeTMpIHsgICAgICAgICAgIFxuICAgIHZhciBjdyA9ICgoeTMgLSB5MSkgKiAoeDIgLSB4MSkpIC0gKCh5MiAtIHkxKSAqICh4MyAtIHgxKSk7XG4gICAgcmV0dXJuIGN3ID4gMCA/IHRydWUgOiBjdyA8IDAgPyBmYWxzZSA6IHRydWU7IC8vIGNvbGluZWFyXG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdChzZWcxLCBzZWcyKSB7XG4gIHZhciB4MSA9IHNlZzFbMF1bMF0sIHkxID0gc2VnMVswXVsxXSxcbiAgICAgIHgyID0gc2VnMVsxXVswXSwgeTIgPSBzZWcxWzFdWzFdLFxuICAgICAgeDMgPSBzZWcyWzBdWzBdLCB5MyA9IHNlZzJbMF1bMV0sXG4gICAgICB4NCA9IHNlZzJbMV1bMF0sIHk0ID0gc2VnMlsxXVsxXTtcblxuICAgIHJldHVybiBjY3coeDEsIHkxLCB4MywgeTMsIHg0LCB5NCkgIT09IGNjdyh4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSAmJiBjY3coeDEsIHkxLCB4MiwgeTIsIHgzLCB5MykgIT09IGNjdyh4MSwgeTEsIHgyLCB5MiwgeDQsIHk0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbnRlcnNlY3Q7IiwiLy8gVmVyc2lvbiAwLjUuMCAtIENvcHlyaWdodCAyMDEyIC0gMjAxNSAtICBKaW0gUmllY2tlbiA8amltckBqaW1yLmNhPlxuLy9cbi8vIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qcmllY2tlbi9zYXQtanNcbi8vXG4vLyBBIHNpbXBsZSBsaWJyYXJ5IGZvciBkZXRlcm1pbmluZyBpbnRlcnNlY3Rpb25zIG9mIGNpcmNsZXMgYW5kXG4vLyBwb2x5Z29ucyB1c2luZyB0aGUgU2VwYXJhdGluZyBBeGlzIFRoZW9yZW0uXG4vKiogQHByZXNlcnZlIFNBVC5qcyAtIFZlcnNpb24gMC41LjAgLSBDb3B5cmlnaHQgMjAxMiAtIDIwMTUgLSBKaW0gUmllY2tlbiA8amltckBqaW1yLmNhPiAtIHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gaHR0cHM6Ly9naXRodWIuY29tL2pyaWVja2VuL3NhdC1qcyAqL1xuXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlKi9cbi8qanNoaW50IHNoYWRvdzp0cnVlLCBzdWI6dHJ1ZSwgZm9yaW46dHJ1ZSwgbm9hcmc6dHJ1ZSwgbm9lbXB0eTp0cnVlLCBcbiAgZXFlcWVxOnRydWUsIGJpdHdpc2U6dHJ1ZSwgc3RyaWN0OnRydWUsIHVuZGVmOnRydWUsIFxuICBjdXJseTp0cnVlLCBicm93c2VyOnRydWUgKi9cblxuLy8gQ3JlYXRlIGEgVU1EIHdyYXBwZXIgZm9yIFNBVC4gV29ya3MgaW46XG4vL1xuLy8gIC0gUGxhaW4gYnJvd3NlciB2aWEgZ2xvYmFsIFNBVCB2YXJpYWJsZVxuLy8gIC0gQU1EIGxvYWRlciAobGlrZSByZXF1aXJlLmpzKVxuLy8gIC0gTm9kZS5qc1xuLy9cbi8vIFRoZSBxdW90ZWQgcHJvcGVydGllcyBhbGwgb3ZlciB0aGUgcGxhY2UgYXJlIHVzZWQgc28gdGhhdCB0aGUgQ2xvc3VyZSBDb21waWxlclxuLy8gZG9lcyBub3QgbWFuZ2xlIHRoZSBleHBvc2VkIEFQSSBpbiBhZHZhbmNlZCBtb2RlLlxuLyoqXG4gKiBAcGFyYW0geyp9IHJvb3QgLSBUaGUgZ2xvYmFsIHNjb3BlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmYWN0b3J5IC0gRmFjdG9yeSB0aGF0IGNyZWF0ZXMgU0FUIG1vZHVsZVxuICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZVsnYW1kJ10pIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlWydleHBvcnRzJ10gPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdFsnU0FUJ10gPSBmYWN0b3J5KCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgU0FUID0ge307XG5cbiAgLy9cbiAgLy8gIyMgVmVjdG9yXG4gIC8vXG4gIC8vIFJlcHJlc2VudHMgYSB2ZWN0b3IgaW4gdHdvIGRpbWVuc2lvbnMgd2l0aCBgeGAgYW5kIGB5YCBwcm9wZXJ0aWVzLlxuXG5cbiAgLy8gQ3JlYXRlIGEgbmV3IFZlY3Rvciwgb3B0aW9uYWxseSBwYXNzaW5nIGluIHRoZSBgeGAgYW5kIGB5YCBjb29yZGluYXRlcy4gSWZcbiAgLy8gYSBjb29yZGluYXRlIGlzIG5vdCBzcGVjaWZpZWQsIGl0IHdpbGwgYmUgc2V0IHRvIGAwYFxuICAvKiogXG4gICAqIEBwYXJhbSB7P251bWJlcj19IHggVGhlIHggcG9zaXRpb24uXG4gICAqIEBwYXJhbSB7P251bWJlcj19IHkgVGhlIHkgcG9zaXRpb24uXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gVmVjdG9yKHgsIHkpIHtcbiAgICB0aGlzWyd4J10gPSB4IHx8IDA7XG4gICAgdGhpc1sneSddID0geSB8fCAwO1xuICB9XG4gIFNBVFsnVmVjdG9yJ10gPSBWZWN0b3I7XG4gIC8vIEFsaWFzIGBWZWN0b3JgIGFzIGBWYFxuICBTQVRbJ1YnXSA9IFZlY3RvcjtcblxuXG4gIC8vIENvcHkgdGhlIHZhbHVlcyBvZiBhbm90aGVyIFZlY3RvciBpbnRvIHRoaXMgb25lLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IG90aGVyIFRoZSBvdGhlciBWZWN0b3IuXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydjb3B5J10gPSBWZWN0b3IucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihvdGhlcikge1xuICAgIHRoaXNbJ3gnXSA9IG90aGVyWyd4J107XG4gICAgdGhpc1sneSddID0gb3RoZXJbJ3knXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBDcmVhdGUgYSBuZXcgdmVjdG9yIHdpdGggdGhlIHNhbWUgY29vcmRpbmF0ZXMgYXMgdGhpcyBvbi5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhlIG5ldyBjbG9uZWQgdmVjdG9yXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydjbG9uZSddID0gVmVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXNbJ3gnXSwgdGhpc1sneSddKTtcbiAgfTtcblxuICAvLyBDaGFuZ2UgdGhpcyB2ZWN0b3IgdG8gYmUgcGVycGVuZGljdWxhciB0byB3aGF0IGl0IHdhcyBiZWZvcmUuIChFZmZlY3RpdmVseVxuICAvLyByb2F0YXRlcyBpdCA5MCBkZWdyZWVzIGluIGEgY2xvY2t3aXNlIGRpcmVjdGlvbilcbiAgLyoqXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydwZXJwJ10gPSBWZWN0b3IucHJvdG90eXBlLnBlcnAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeCA9IHRoaXNbJ3gnXTtcbiAgICB0aGlzWyd4J10gPSB0aGlzWyd5J107XG4gICAgdGhpc1sneSddID0gLXg7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gUm90YXRlIHRoaXMgdmVjdG9yIChjb3VudGVyLWNsb2Nrd2lzZSkgYnkgdGhlIHNwZWNpZmllZCBhbmdsZSAoaW4gcmFkaWFucykuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgVGhlIGFuZ2xlIHRvIHJvdGF0ZSAoaW4gcmFkaWFucylcbiAgICogQHJldHVybiB7VmVjdG9yfSBUaGlzIGZvciBjaGFpbmluZy5cbiAgICovXG4gIFZlY3Rvci5wcm90b3R5cGVbJ3JvdGF0ZSddID0gVmVjdG9yLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUpIHtcbiAgICB2YXIgeCA9IHRoaXNbJ3gnXTtcbiAgICB2YXIgeSA9IHRoaXNbJ3knXTtcbiAgICB0aGlzWyd4J10gPSB4ICogTWF0aC5jb3MoYW5nbGUpIC0geSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICB0aGlzWyd5J10gPSB4ICogTWF0aC5zaW4oYW5nbGUpICsgeSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBSZXZlcnNlIHRoaXMgdmVjdG9yLlxuICAvKipcbiAgICogQHJldHVybiB7VmVjdG9yfSBUaGlzIGZvciBjaGFpbmluZy5cbiAgICovXG4gIFZlY3Rvci5wcm90b3R5cGVbJ3JldmVyc2UnXSA9IFZlY3Rvci5wcm90b3R5cGUucmV2ZXJzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXNbJ3gnXSA9IC10aGlzWyd4J107XG4gICAgdGhpc1sneSddID0gLXRoaXNbJ3knXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgXG5cbiAgLy8gTm9ybWFsaXplIHRoaXMgdmVjdG9yLiAgKG1ha2UgaXQgaGF2ZSBsZW5ndGggb2YgYDFgKVxuICAvKipcbiAgICogQHJldHVybiB7VmVjdG9yfSBUaGlzIGZvciBjaGFpbmluZy5cbiAgICovXG4gIFZlY3Rvci5wcm90b3R5cGVbJ25vcm1hbGl6ZSddID0gVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZCA9IHRoaXMubGVuKCk7XG4gICAgaWYoZCA+IDApIHtcbiAgICAgIHRoaXNbJ3gnXSA9IHRoaXNbJ3gnXSAvIGQ7XG4gICAgICB0aGlzWyd5J10gPSB0aGlzWyd5J10gLyBkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgXG4gIC8vIEFkZCBhbm90aGVyIHZlY3RvciB0byB0aGlzIG9uZS5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VmVjdG9yfSBvdGhlciBUaGUgb3RoZXIgVmVjdG9yLlxuICAgKiBAcmV0dXJuIHtWZWN0b3J9IFRoaXMgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgVmVjdG9yLnByb3RvdHlwZVsnYWRkJ10gPSBWZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdGhpc1sneCddICs9IG90aGVyWyd4J107XG4gICAgdGhpc1sneSddICs9IG90aGVyWyd5J107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFxuICAvLyBTdWJ0cmFjdCBhbm90aGVyIHZlY3RvciBmcm9tIHRoaXMgb25lLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IG90aGVyIFRoZSBvdGhlciBWZWN0b3IuXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaWluZy5cbiAgICovXG4gIFZlY3Rvci5wcm90b3R5cGVbJ3N1YiddID0gVmVjdG9yLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbihvdGhlcikge1xuICAgIHRoaXNbJ3gnXSAtPSBvdGhlclsneCddO1xuICAgIHRoaXNbJ3knXSAtPSBvdGhlclsneSddO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBcbiAgLy8gU2NhbGUgdGhpcyB2ZWN0b3IuIEFuIGluZGVwZW5kYW50IHNjYWxpbmcgZmFjdG9yIGNhbiBiZSBwcm92aWRlZFxuICAvLyBmb3IgZWFjaCBheGlzLCBvciBhIHNpbmdsZSBzY2FsaW5nIGZhY3RvciB0aGF0IHdpbGwgc2NhbGUgYm90aCBgeGAgYW5kIGB5YC5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeCBkaXJlY3Rpb24uXG4gICAqIEBwYXJhbSB7P251bWJlcj19IHkgVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB5IGRpcmVjdGlvbi4gIElmIHRoaXNcbiAgICogICBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgeCBzY2FsaW5nIGZhY3RvciB3aWxsIGJlIHVzZWQuXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydzY2FsZSddID0gVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHgseSkge1xuICAgIHRoaXNbJ3gnXSAqPSB4O1xuICAgIHRoaXNbJ3knXSAqPSB5IHx8IHg7XG4gICAgcmV0dXJuIHRoaXM7IFxuICB9O1xuICBcbiAgLy8gUHJvamVjdCB0aGlzIHZlY3RvciBvbiB0byBhbm90aGVyIHZlY3Rvci5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VmVjdG9yfSBvdGhlciBUaGUgdmVjdG9yIHRvIHByb2plY3Qgb250by5cbiAgICogQHJldHVybiB7VmVjdG9yfSBUaGlzIGZvciBjaGFpbmluZy5cbiAgICovXG4gIFZlY3Rvci5wcm90b3R5cGVbJ3Byb2plY3QnXSA9IFZlY3Rvci5wcm90b3R5cGUucHJvamVjdCA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdmFyIGFtdCA9IHRoaXMuZG90KG90aGVyKSAvIG90aGVyLmxlbjIoKTtcbiAgICB0aGlzWyd4J10gPSBhbXQgKiBvdGhlclsneCddO1xuICAgIHRoaXNbJ3knXSA9IGFtdCAqIG90aGVyWyd5J107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFxuICAvLyBQcm9qZWN0IHRoaXMgdmVjdG9yIG9udG8gYSB2ZWN0b3Igb2YgdW5pdCBsZW5ndGguIFRoaXMgaXMgc2xpZ2h0bHkgbW9yZSBlZmZpY2llbnRcbiAgLy8gdGhhbiBgcHJvamVjdGAgd2hlbiBkZWFsaW5nIHdpdGggdW5pdCB2ZWN0b3JzLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IG90aGVyIFRoZSB1bml0IHZlY3RvciB0byBwcm9qZWN0IG9udG8uXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydwcm9qZWN0TiddID0gVmVjdG9yLnByb3RvdHlwZS5wcm9qZWN0TiA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgdmFyIGFtdCA9IHRoaXMuZG90KG90aGVyKTtcbiAgICB0aGlzWyd4J10gPSBhbXQgKiBvdGhlclsneCddO1xuICAgIHRoaXNbJ3knXSA9IGFtdCAqIG90aGVyWyd5J107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFxuICAvLyBSZWZsZWN0IHRoaXMgdmVjdG9yIG9uIGFuIGFyYml0cmFyeSBheGlzLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IGF4aXMgVGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGF4aXMuXG4gICAqIEByZXR1cm4ge1ZlY3Rvcn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydyZWZsZWN0J10gPSBWZWN0b3IucHJvdG90eXBlLnJlZmxlY3QgPSBmdW5jdGlvbihheGlzKSB7XG4gICAgdmFyIHggPSB0aGlzWyd4J107XG4gICAgdmFyIHkgPSB0aGlzWyd5J107XG4gICAgdGhpcy5wcm9qZWN0KGF4aXMpLnNjYWxlKDIpO1xuICAgIHRoaXNbJ3gnXSAtPSB4O1xuICAgIHRoaXNbJ3knXSAtPSB5O1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBcbiAgLy8gUmVmbGVjdCB0aGlzIHZlY3RvciBvbiBhbiBhcmJpdHJhcnkgYXhpcyAocmVwcmVzZW50ZWQgYnkgYSB1bml0IHZlY3RvcikuIFRoaXMgaXNcbiAgLy8gc2xpZ2h0bHkgbW9yZSBlZmZpY2llbnQgdGhhbiBgcmVmbGVjdGAgd2hlbiBkZWFsaW5nIHdpdGggYW4gYXhpcyB0aGF0IGlzIGEgdW5pdCB2ZWN0b3IuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpcyBUaGUgdW5pdCB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBheGlzLlxuICAgKiBAcmV0dXJuIHtWZWN0b3J9IFRoaXMgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgVmVjdG9yLnByb3RvdHlwZVsncmVmbGVjdE4nXSA9IFZlY3Rvci5wcm90b3R5cGUucmVmbGVjdE4gPSBmdW5jdGlvbihheGlzKSB7XG4gICAgdmFyIHggPSB0aGlzWyd4J107XG4gICAgdmFyIHkgPSB0aGlzWyd5J107XG4gICAgdGhpcy5wcm9qZWN0TihheGlzKS5zY2FsZSgyKTtcbiAgICB0aGlzWyd4J10gLT0geDtcbiAgICB0aGlzWyd5J10gLT0geTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgXG4gIC8vIEdldCB0aGUgZG90IHByb2R1Y3Qgb2YgdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gIG90aGVyIFRoZSB2ZWN0b3IgdG8gZG90IHRoaXMgb25lIGFnYWluc3QuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGRvdCBwcm9kdWN0LlxuICAgKi9cbiAgVmVjdG9yLnByb3RvdHlwZVsnZG90J10gPSBWZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgcmV0dXJuIHRoaXNbJ3gnXSAqIG90aGVyWyd4J10gKyB0aGlzWyd5J10gKiBvdGhlclsneSddO1xuICB9O1xuICBcbiAgLy8gR2V0IHRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGlzIHZlY3Rvci5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGxlbmd0aF4yIG9mIHRoaXMgdmVjdG9yLlxuICAgKi9cbiAgVmVjdG9yLnByb3RvdHlwZVsnbGVuMiddID0gVmVjdG9yLnByb3RvdHlwZS5sZW4yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZG90KHRoaXMpO1xuICB9O1xuICBcbiAgLy8gR2V0IHRoZSBsZW5ndGggb2YgdGhpcyB2ZWN0b3IuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBsZW5ndGggb2YgdGhpcyB2ZWN0b3IuXG4gICAqL1xuICBWZWN0b3IucHJvdG90eXBlWydsZW4nXSA9IFZlY3Rvci5wcm90b3R5cGUubGVuID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmxlbjIoKSk7XG4gIH07XG4gIFxuICAvLyAjIyBDaXJjbGVcbiAgLy9cbiAgLy8gUmVwcmVzZW50cyBhIGNpcmNsZSB3aXRoIGEgcG9zaXRpb24gYW5kIGEgcmFkaXVzLlxuXG4gIC8vIENyZWF0ZSBhIG5ldyBjaXJjbGUsIG9wdGlvbmFsbHkgcGFzc2luZyBpbiBhIHBvc2l0aW9uIGFuZC9vciByYWRpdXMuIElmIG5vIHBvc2l0aW9uXG4gIC8vIGlzIGdpdmVuLCB0aGUgY2lyY2xlIHdpbGwgYmUgYXQgYCgwLDApYC4gSWYgbm8gcmFkaXVzIGlzIHByb3ZpZGVkLCB0aGUgY2lyY2xlIHdpbGxcbiAgLy8gaGF2ZSBhIHJhZGl1cyBvZiBgMGAuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1ZlY3Rvcj19IHBvcyBBIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZVxuICAgKiBAcGFyYW0gez9udW1iZXI9fSByIFRoZSByYWRpdXMgb2YgdGhlIGNpcmNsZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIENpcmNsZShwb3MsIHIpIHtcbiAgICB0aGlzWydwb3MnXSA9IHBvcyB8fCBuZXcgVmVjdG9yKCk7XG4gICAgdGhpc1snciddID0gciB8fCAwO1xuICB9XG4gIFNBVFsnQ2lyY2xlJ10gPSBDaXJjbGU7XG4gIFxuICAvLyBDb21wdXRlIHRoZSBheGlzLWFsaWduZWQgYm91bmRpbmcgYm94IChBQUJCKSBvZiB0aGlzIENpcmNsZS5cbiAgLy9cbiAgLy8gTm90ZTogUmV0dXJucyBhIF9uZXdfIGBQb2x5Z29uYCBlYWNoIHRpbWUgeW91IGNhbGwgdGhpcy5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1BvbHlnb259IFRoZSBBQUJCXG4gICAqL1xuICBDaXJjbGUucHJvdG90eXBlWydnZXRBQUJCJ10gPSBDaXJjbGUucHJvdG90eXBlLmdldEFBQkIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgciA9IHRoaXNbJ3InXTtcbiAgICB2YXIgY29ybmVyID0gdGhpc1tcInBvc1wiXS5jbG9uZSgpLnN1YihuZXcgVmVjdG9yKHIsIHIpKTtcbiAgICByZXR1cm4gbmV3IEJveChjb3JuZXIsIHIqMiwgcioyKS50b1BvbHlnb24oKTtcbiAgfTtcblxuICAvLyAjIyBQb2x5Z29uXG4gIC8vXG4gIC8vIFJlcHJlc2VudHMgYSAqY29udmV4KiBwb2x5Z29uIHdpdGggYW55IG51bWJlciBvZiBwb2ludHMgKHNwZWNpZmllZCBpbiBjb3VudGVyLWNsb2Nrd2lzZSBvcmRlcilcbiAgLy9cbiAgLy8gTm90ZTogRG8gX25vdF8gbWFudWFsbHkgY2hhbmdlIHRoZSBgcG9pbnRzYCwgYGFuZ2xlYCwgb3IgYG9mZnNldGAgcHJvcGVydGllcy4gVXNlIHRoZVxuICAvLyBwcm92aWRlZCBzZXR0ZXJzLiBPdGhlcndpc2UgdGhlIGNhbGN1bGF0ZWQgcHJvcGVydGllcyB3aWxsIG5vdCBiZSB1cGRhdGVkIGNvcnJlY3RseS5cbiAgLy9cbiAgLy8gYHBvc2AgY2FuIGJlIGNoYW5nZWQgZGlyZWN0bHkuXG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHBvbHlnb24sIHBhc3NpbmcgaW4gYSBwb3NpdGlvbiB2ZWN0b3IsIGFuZCBhbiBhcnJheSBvZiBwb2ludHMgKHJlcHJlc2VudGVkXG4gIC8vIGJ5IHZlY3RvcnMgcmVsYXRpdmUgdG8gdGhlIHBvc2l0aW9uIHZlY3RvcikuIElmIG5vIHBvc2l0aW9uIGlzIHBhc3NlZCBpbiwgdGhlIHBvc2l0aW9uXG4gIC8vIG9mIHRoZSBwb2x5Z29uIHdpbGwgYmUgYCgwLDApYC5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VmVjdG9yPX0gcG9zIEEgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgb3JpZ2luIG9mIHRoZSBwb2x5Z29uLiAoYWxsIG90aGVyXG4gICAqICAgcG9pbnRzIGFyZSByZWxhdGl2ZSB0byB0aGlzIG9uZSlcbiAgICogQHBhcmFtIHtBcnJheS48VmVjdG9yPj19IHBvaW50cyBBbiBhcnJheSBvZiB2ZWN0b3JzIHJlcHJlc2VudGluZyB0aGUgcG9pbnRzIGluIHRoZSBwb2x5Z29uLFxuICAgKiAgIGluIGNvdW50ZXItY2xvY2t3aXNlIG9yZGVyLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIFBvbHlnb24ocG9zLCBwb2ludHMpIHtcbiAgICB0aGlzWydwb3MnXSA9IHBvcyB8fCBuZXcgVmVjdG9yKCk7XG4gICAgdGhpc1snYW5nbGUnXSA9IDA7XG4gICAgdGhpc1snb2Zmc2V0J10gPSBuZXcgVmVjdG9yKCk7XG4gICAgdGhpcy5zZXRQb2ludHMocG9pbnRzIHx8IFtdKTtcbiAgfVxuICBTQVRbJ1BvbHlnb24nXSA9IFBvbHlnb247XG4gIFxuICAvLyBTZXQgdGhlIHBvaW50cyBvZiB0aGUgcG9seWdvbi5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj49fSBwb2ludHMgQW4gYXJyYXkgb2YgdmVjdG9ycyByZXByZXNlbnRpbmcgdGhlIHBvaW50cyBpbiB0aGUgcG9seWdvbixcbiAgICogICBpbiBjb3VudGVyLWNsb2Nrd2lzZSBvcmRlci5cbiAgICogQHJldHVybiB7UG9seWdvbn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBQb2x5Z29uLnByb3RvdHlwZVsnc2V0UG9pbnRzJ10gPSBQb2x5Z29uLnByb3RvdHlwZS5zZXRQb2ludHMgPSBmdW5jdGlvbihwb2ludHMpIHtcbiAgICAvLyBPbmx5IHJlLWFsbG9jYXRlIGlmIHRoaXMgaXMgYSBuZXcgcG9seWdvbiBvciB0aGUgbnVtYmVyIG9mIHBvaW50cyBoYXMgY2hhbmdlZC5cbiAgICB2YXIgbGVuZ3RoQ2hhbmdlZCA9ICF0aGlzWydwb2ludHMnXSB8fCB0aGlzWydwb2ludHMnXS5sZW5ndGggIT09IHBvaW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aENoYW5nZWQpIHtcbiAgICAgIHZhciBpO1xuICAgICAgdmFyIGNhbGNQb2ludHMgPSB0aGlzWydjYWxjUG9pbnRzJ10gPSBbXTtcbiAgICAgIHZhciBlZGdlcyA9IHRoaXNbJ2VkZ2VzJ10gPSBbXTtcbiAgICAgIHZhciBub3JtYWxzID0gdGhpc1snbm9ybWFscyddID0gW107XG4gICAgICAvLyBBbGxvY2F0ZSB0aGUgdmVjdG9yIGFycmF5cyBmb3IgdGhlIGNhbGN1bGF0ZWQgcHJvcGVydGllc1xuICAgICAgZm9yIChpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxjUG9pbnRzLnB1c2gobmV3IFZlY3RvcigpKTtcbiAgICAgICAgZWRnZXMucHVzaChuZXcgVmVjdG9yKCkpO1xuICAgICAgICBub3JtYWxzLnB1c2gobmV3IFZlY3RvcigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpc1sncG9pbnRzJ10gPSBwb2ludHM7XG4gICAgdGhpcy5fcmVjYWxjKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gU2V0IHRoZSBjdXJyZW50IHJvdGF0aW9uIGFuZ2xlIG9mIHRoZSBwb2x5Z29uLlxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIFRoZSBjdXJyZW50IHJvdGF0aW9uIGFuZ2xlIChpbiByYWRpYW5zKS5cbiAgICogQHJldHVybiB7UG9seWdvbn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBQb2x5Z29uLnByb3RvdHlwZVsnc2V0QW5nbGUnXSA9IFBvbHlnb24ucHJvdG90eXBlLnNldEFuZ2xlID0gZnVuY3Rpb24oYW5nbGUpIHtcbiAgICB0aGlzWydhbmdsZSddID0gYW5nbGU7XG4gICAgdGhpcy5fcmVjYWxjKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gU2V0IHRoZSBjdXJyZW50IG9mZnNldCB0byBhcHBseSB0byB0aGUgYHBvaW50c2AgYmVmb3JlIGFwcGx5aW5nIHRoZSBgYW5nbGVgIHJvdGF0aW9uLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IG9mZnNldCBUaGUgbmV3IG9mZnNldCB2ZWN0b3IuXG4gICAqIEByZXR1cm4ge1BvbHlnb259IFRoaXMgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgUG9seWdvbi5wcm90b3R5cGVbJ3NldE9mZnNldCddID0gUG9seWdvbi5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24ob2Zmc2V0KSB7XG4gICAgdGhpc1snb2Zmc2V0J10gPSBvZmZzZXQ7XG4gICAgdGhpcy5fcmVjYWxjKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gUm90YXRlcyB0aGlzIHBvbHlnb24gY291bnRlci1jbG9ja3dpc2UgYXJvdW5kIHRoZSBvcmlnaW4gb2YgKml0cyBsb2NhbCBjb29yZGluYXRlIHN5c3RlbSogKGkuZS4gYHBvc2ApLlxuICAvL1xuICAvLyBOb3RlOiBUaGlzIGNoYW5nZXMgdGhlICoqb3JpZ2luYWwqKiBwb2ludHMgKHNvIGFueSBgYW5nbGVgIHdpbGwgYmUgYXBwbGllZCBvbiB0b3Agb2YgdGhpcyByb3RhdGlvbikuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgVGhlIGFuZ2xlIHRvIHJvdGF0ZSAoaW4gcmFkaWFucylcbiAgICogQHJldHVybiB7UG9seWdvbn0gVGhpcyBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBQb2x5Z29uLnByb3RvdHlwZVsncm90YXRlJ10gPSBQb2x5Z29uLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihhbmdsZSkge1xuICAgIHZhciBwb2ludHMgPSB0aGlzWydwb2ludHMnXTtcbiAgICB2YXIgbGVuID0gcG9pbnRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBwb2ludHNbaV0ucm90YXRlKGFuZ2xlKTtcbiAgICB9XG4gICAgdGhpcy5fcmVjYWxjKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gVHJhbnNsYXRlcyB0aGUgcG9pbnRzIG9mIHRoaXMgcG9seWdvbiBieSBhIHNwZWNpZmllZCBhbW91bnQgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbiBvZiAqaXRzIG93biBjb29yZGluYXRlXG4gIC8vIHN5c3RlbSogKGkuZS4gYHBvc2ApLlxuICAvL1xuICAvLyBUaGlzIGlzIG1vc3QgdXNlZnVsIHRvIGNoYW5nZSB0aGUgXCJjZW50ZXIgcG9pbnRcIiBvZiBhIHBvbHlnb24uIElmIHlvdSBqdXN0IHdhbnQgdG8gbW92ZSB0aGUgd2hvbGUgcG9seWdvbiwgY2hhbmdlXG4gIC8vIHRoZSBjb29yZGluYXRlcyBvZiBgcG9zYC5cbiAgLy9cbiAgLy8gTm90ZTogVGhpcyBjaGFuZ2VzIHRoZSAqKm9yaWdpbmFsKiogcG9pbnRzIChzbyBhbnkgYG9mZnNldGAgd2lsbCBiZSBhcHBsaWVkIG9uIHRvcCBvZiB0aGlzIHRyYW5zbGF0aW9uKVxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIGhvcml6b250YWwgYW1vdW50IHRvIHRyYW5zbGF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgVGhlIHZlcnRpY2FsIGFtb3VudCB0byB0cmFuc2xhdGUuXG4gICAqIEByZXR1cm4ge1BvbHlnb259IFRoaXMgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgUG9seWdvbi5wcm90b3R5cGVbJ3RyYW5zbGF0ZSddID0gUG9seWdvbi5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgcG9pbnRzID0gdGhpc1sncG9pbnRzJ107XG4gICAgdmFyIGxlbiA9IHBvaW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgcG9pbnRzW2ldLnggKz0geDtcbiAgICAgIHBvaW50c1tpXS55ICs9IHk7XG4gICAgfVxuICAgIHRoaXMuX3JlY2FsYygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG5cbiAgLy8gQ29tcHV0ZXMgdGhlIGNhbGN1bGF0ZWQgY29sbGlzaW9uIHBvbHlnb24uIEFwcGxpZXMgdGhlIGBhbmdsZWAgYW5kIGBvZmZzZXRgIHRvIHRoZSBvcmlnaW5hbCBwb2ludHMgdGhlbiByZWNhbGN1bGF0ZXMgdGhlXG4gIC8vIGVkZ2VzIGFuZCBub3JtYWxzIG9mIHRoZSBjb2xsaXNpb24gcG9seWdvbi5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1BvbHlnb259IFRoaXMgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgUG9seWdvbi5wcm90b3R5cGUuX3JlY2FsYyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENhbGN1bGF0ZWQgcG9pbnRzIC0gdGhpcyBpcyB3aGF0IGlzIHVzZWQgZm9yIHVuZGVybHlpbmcgY29sbGlzaW9ucyBhbmQgdGFrZXMgaW50byBhY2NvdW50XG4gICAgLy8gdGhlIGFuZ2xlL29mZnNldCBzZXQgb24gdGhlIHBvbHlnb24uXG4gICAgdmFyIGNhbGNQb2ludHMgPSB0aGlzWydjYWxjUG9pbnRzJ107XG4gICAgLy8gVGhlIGVkZ2VzIGhlcmUgYXJlIHRoZSBkaXJlY3Rpb24gb2YgdGhlIGBuYHRoIGVkZ2Ugb2YgdGhlIHBvbHlnb24sIHJlbGF0aXZlIHRvXG4gICAgLy8gdGhlIGBuYHRoIHBvaW50LiBJZiB5b3Ugd2FudCB0byBkcmF3IGEgZ2l2ZW4gZWRnZSBmcm9tIHRoZSBlZGdlIHZhbHVlLCB5b3UgbXVzdFxuICAgIC8vIGZpcnN0IHRyYW5zbGF0ZSB0byB0aGUgcG9zaXRpb24gb2YgdGhlIHN0YXJ0aW5nIHBvaW50LlxuICAgIHZhciBlZGdlcyA9IHRoaXNbJ2VkZ2VzJ107XG4gICAgLy8gVGhlIG5vcm1hbHMgaGVyZSBhcmUgdGhlIGRpcmVjdGlvbiBvZiB0aGUgbm9ybWFsIGZvciB0aGUgYG5gdGggZWRnZSBvZiB0aGUgcG9seWdvbiwgcmVsYXRpdmVcbiAgICAvLyB0byB0aGUgcG9zaXRpb24gb2YgdGhlIGBuYHRoIHBvaW50LiBJZiB5b3Ugd2FudCB0byBkcmF3IGFuIGVkZ2Ugbm9ybWFsLCB5b3UgbXVzdCBmaXJzdFxuICAgIC8vIHRyYW5zbGF0ZSB0byB0aGUgcG9zaXRpb24gb2YgdGhlIHN0YXJ0aW5nIHBvaW50LlxuICAgIHZhciBub3JtYWxzID0gdGhpc1snbm9ybWFscyddO1xuICAgIC8vIENvcHkgdGhlIG9yaWdpbmFsIHBvaW50cyBhcnJheSBhbmQgYXBwbHkgdGhlIG9mZnNldC9hbmdsZVxuICAgIHZhciBwb2ludHMgPSB0aGlzWydwb2ludHMnXTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpc1snb2Zmc2V0J107XG4gICAgdmFyIGFuZ2xlID0gdGhpc1snYW5nbGUnXTtcbiAgICB2YXIgbGVuID0gcG9pbnRzLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBjYWxjUG9pbnQgPSBjYWxjUG9pbnRzW2ldLmNvcHkocG9pbnRzW2ldKTtcbiAgICAgIGNhbGNQb2ludC54ICs9IG9mZnNldC54O1xuICAgICAgY2FsY1BvaW50LnkgKz0gb2Zmc2V0Lnk7XG4gICAgICBpZiAoYW5nbGUgIT09IDApIHtcbiAgICAgICAgY2FsY1BvaW50LnJvdGF0ZShhbmdsZSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIENhbGN1bGF0ZSB0aGUgZWRnZXMvbm9ybWFsc1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIHAxID0gY2FsY1BvaW50c1tpXTtcbiAgICAgIHZhciBwMiA9IGkgPCBsZW4gLSAxID8gY2FsY1BvaW50c1tpICsgMV0gOiBjYWxjUG9pbnRzWzBdO1xuICAgICAgdmFyIGUgPSBlZGdlc1tpXS5jb3B5KHAyKS5zdWIocDEpO1xuICAgICAgbm9ybWFsc1tpXS5jb3B5KGUpLnBlcnAoKS5ub3JtYWxpemUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG4gIFxuICBcbiAgLy8gQ29tcHV0ZSB0aGUgYXhpcy1hbGlnbmVkIGJvdW5kaW5nIGJveC4gQW55IGN1cnJlbnQgc3RhdGVcbiAgLy8gKHRyYW5zbGF0aW9ucy9yb3RhdGlvbnMpIHdpbGwgYmUgYXBwbGllZCBiZWZvcmUgY29uc3RydWN0aW5nIHRoZSBBQUJCLlxuICAvL1xuICAvLyBOb3RlOiBSZXR1cm5zIGEgX25ld18gYFBvbHlnb25gIGVhY2ggdGltZSB5b3UgY2FsbCB0aGlzLlxuICAvKipcbiAgICogQHJldHVybiB7UG9seWdvbn0gVGhlIEFBQkJcbiAgICovXG4gIFBvbHlnb24ucHJvdG90eXBlW1wiZ2V0QUFCQlwiXSA9IFBvbHlnb24ucHJvdG90eXBlLmdldEFBQkIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcG9pbnRzID0gdGhpc1tcImNhbGNQb2ludHNcIl07XG4gICAgdmFyIGxlbiA9IHBvaW50cy5sZW5ndGg7XG4gICAgdmFyIHhNaW4gPSBwb2ludHNbMF1bXCJ4XCJdO1xuICAgIHZhciB5TWluID0gcG9pbnRzWzBdW1wieVwiXTtcbiAgICB2YXIgeE1heCA9IHBvaW50c1swXVtcInhcIl07XG4gICAgdmFyIHlNYXggPSBwb2ludHNbMF1bXCJ5XCJdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBwb2ludCA9IHBvaW50c1tpXTtcbiAgICAgIGlmIChwb2ludFtcInhcIl0gPCB4TWluKSB7XG4gICAgICAgIHhNaW4gPSBwb2ludFtcInhcIl07XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChwb2ludFtcInhcIl0gPiB4TWF4KSB7XG4gICAgICAgIHhNYXggPSBwb2ludFtcInhcIl07XG4gICAgICB9XG4gICAgICBpZiAocG9pbnRbXCJ5XCJdIDwgeU1pbikge1xuICAgICAgICB5TWluID0gcG9pbnRbXCJ5XCJdO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocG9pbnRbXCJ5XCJdID4geU1heCkge1xuICAgICAgICB5TWF4ID0gcG9pbnRbXCJ5XCJdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEJveCh0aGlzW1wicG9zXCJdLmNsb25lKCkuYWRkKG5ldyBWZWN0b3IoeE1pbiwgeU1pbikpLCB4TWF4IC0geE1pbiwgeU1heCAtIHlNaW4pLnRvUG9seWdvbigpO1xuICB9O1xuICBcblxuICAvLyAjIyBCb3hcbiAgLy9cbiAgLy8gUmVwcmVzZW50cyBhbiBheGlzLWFsaWduZWQgYm94LCB3aXRoIGEgd2lkdGggYW5kIGhlaWdodC5cblxuXG4gIC8vIENyZWF0ZSBhIG5ldyBib3gsIHdpdGggdGhlIHNwZWNpZmllZCBwb3NpdGlvbiwgd2lkdGgsIGFuZCBoZWlnaHQuIElmIG5vIHBvc2l0aW9uXG4gIC8vIGlzIGdpdmVuLCB0aGUgcG9zaXRpb24gd2lsbCBiZSBgKDAsMClgLiBJZiBubyB3aWR0aCBvciBoZWlnaHQgYXJlIGdpdmVuLCB0aGV5IHdpbGxcbiAgLy8gYmUgc2V0IHRvIGAwYC5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VmVjdG9yPX0gcG9zIEEgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgdG9wLWxlZnQgb2YgdGhlIGJveC5cbiAgICogQHBhcmFtIHs/bnVtYmVyPX0gdyBUaGUgd2lkdGggb2YgdGhlIGJveC5cbiAgICogQHBhcmFtIHs/bnVtYmVyPX0gaCBUaGUgaGVpZ2h0IG9mIHRoZSBib3guXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gQm94KHBvcywgdywgaCkge1xuICAgIHRoaXNbJ3BvcyddID0gcG9zIHx8IG5ldyBWZWN0b3IoKTtcbiAgICB0aGlzWyd3J10gPSB3IHx8IDA7XG4gICAgdGhpc1snaCddID0gaCB8fCAwO1xuICB9XG4gIFNBVFsnQm94J10gPSBCb3g7XG5cbiAgLy8gUmV0dXJucyBhIHBvbHlnb24gd2hvc2UgZWRnZXMgYXJlIHRoZSBzYW1lIGFzIHRoaXMgYm94LlxuICAvKipcbiAgICogQHJldHVybiB7UG9seWdvbn0gQSBuZXcgUG9seWdvbiB0aGF0IHJlcHJlc2VudHMgdGhpcyBib3guXG4gICAqL1xuICBCb3gucHJvdG90eXBlWyd0b1BvbHlnb24nXSA9IEJveC5wcm90b3R5cGUudG9Qb2x5Z29uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBvcyA9IHRoaXNbJ3BvcyddO1xuICAgIHZhciB3ID0gdGhpc1sndyddO1xuICAgIHZhciBoID0gdGhpc1snaCddO1xuICAgIHJldHVybiBuZXcgUG9seWdvbihuZXcgVmVjdG9yKHBvc1sneCddLCBwb3NbJ3knXSksIFtcbiAgICAgbmV3IFZlY3RvcigpLCBuZXcgVmVjdG9yKHcsIDApLCBcbiAgICAgbmV3IFZlY3Rvcih3LGgpLCBuZXcgVmVjdG9yKDAsaClcbiAgICBdKTtcbiAgfTtcbiAgXG4gIC8vICMjIFJlc3BvbnNlXG4gIC8vXG4gIC8vIEFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHJlc3VsdCBvZiBhbiBpbnRlcnNlY3Rpb24uIENvbnRhaW5zOlxuICAvLyAgLSBUaGUgdHdvIG9iamVjdHMgcGFydGljaXBhdGluZyBpbiB0aGUgaW50ZXJzZWN0aW9uXG4gIC8vICAtIFRoZSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBtaW5pbXVtIGNoYW5nZSBuZWNlc3NhcnkgdG8gZXh0cmFjdCB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vICAgIGZyb20gdGhlIHNlY29uZCBvbmUgKGFzIHdlbGwgYXMgYSB1bml0IHZlY3RvciBpbiB0aGF0IGRpcmVjdGlvbiBhbmQgdGhlIG1hZ25pdHVkZVxuICAvLyAgICBvZiB0aGUgb3ZlcmxhcClcbiAgLy8gIC0gV2hldGhlciB0aGUgZmlyc3Qgb2JqZWN0IGlzIGVudGlyZWx5IGluc2lkZSB0aGUgc2Vjb25kLCBhbmQgdmljZSB2ZXJzYS5cbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi8gIFxuICBmdW5jdGlvbiBSZXNwb25zZSgpIHtcbiAgICB0aGlzWydhJ10gPSBudWxsO1xuICAgIHRoaXNbJ2InXSA9IG51bGw7XG4gICAgdGhpc1snb3ZlcmxhcE4nXSA9IG5ldyBWZWN0b3IoKTtcbiAgICB0aGlzWydvdmVybGFwViddID0gbmV3IFZlY3RvcigpO1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgfVxuICBTQVRbJ1Jlc3BvbnNlJ10gPSBSZXNwb25zZTtcblxuICAvLyBTZXQgc29tZSB2YWx1ZXMgb2YgdGhlIHJlc3BvbnNlIGJhY2sgdG8gdGhlaXIgZGVmYXVsdHMuICBDYWxsIHRoaXMgYmV0d2VlbiB0ZXN0cyBpZlxuICAvLyB5b3UgYXJlIGdvaW5nIHRvIHJldXNlIGEgc2luZ2xlIFJlc3BvbnNlIG9iamVjdCBmb3IgbXVsdGlwbGUgaW50ZXJzZWN0aW9uIHRlc3RzIChyZWNvbW1lbnRlZFxuICAvLyBhcyBpdCB3aWxsIGF2b2lkIGFsbGNhdGluZyBleHRyYSBtZW1vcnkpXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gVGhpcyBmb3IgY2hhaW5pbmdcbiAgICovXG4gIFJlc3BvbnNlLnByb3RvdHlwZVsnY2xlYXInXSA9IFJlc3BvbnNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXNbJ2FJbkInXSA9IHRydWU7XG4gICAgdGhpc1snYkluQSddID0gdHJ1ZTtcbiAgICB0aGlzWydvdmVybGFwJ10gPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vICMjIE9iamVjdCBQb29sc1xuXG4gIC8vIEEgcG9vbCBvZiBgVmVjdG9yYCBvYmplY3RzIHRoYXQgYXJlIHVzZWQgaW4gY2FsY3VsYXRpb25zIHRvIGF2b2lkXG4gIC8vIGFsbG9jYXRpbmcgbWVtb3J5LlxuICAvKipcbiAgICogQHR5cGUge0FycmF5LjxWZWN0b3I+fVxuICAgKi9cbiAgdmFyIFRfVkVDVE9SUyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHsgVF9WRUNUT1JTLnB1c2gobmV3IFZlY3RvcigpKTsgfVxuICBcbiAgLy8gQSBwb29sIG9mIGFycmF5cyBvZiBudW1iZXJzIHVzZWQgaW4gY2FsY3VsYXRpb25zIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAgLy8gbWVtb3J5LlxuICAvKipcbiAgICogQHR5cGUge0FycmF5LjxBcnJheS48bnVtYmVyPj59XG4gICAqL1xuICB2YXIgVF9BUlJBWVMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA1OyBpKyspIHsgVF9BUlJBWVMucHVzaChbXSk7IH1cblxuICAvLyBUZW1wb3JhcnkgcmVzcG9uc2UgdXNlZCBmb3IgcG9seWdvbiBoaXQgZGV0ZWN0aW9uLlxuICAvKipcbiAgICogQHR5cGUge1Jlc3BvbnNlfVxuICAgKi9cbiAgdmFyIFRfUkVTUE9OU0UgPSBuZXcgUmVzcG9uc2UoKTtcblxuICAvLyBVbml0IHNxdWFyZSBwb2x5Z29uIHVzZWQgZm9yIHBvbHlnb24gaGl0IGRldGVjdGlvbi5cbiAgLyoqXG4gICAqIEB0eXBlIHtQb2x5Z29ufVxuICAgKi9cbiAgdmFyIFVOSVRfU1FVQVJFID0gbmV3IEJveChuZXcgVmVjdG9yKCksIDEsIDEpLnRvUG9seWdvbigpO1xuXG4gIC8vICMjIEhlbHBlciBGdW5jdGlvbnNcblxuICAvLyBGbGF0dGVucyB0aGUgc3BlY2lmaWVkIGFycmF5IG9mIHBvaW50cyBvbnRvIGEgdW5pdCB2ZWN0b3IgYXhpcyxcbiAgLy8gcmVzdWx0aW5nIGluIGEgb25lIGRpbWVuc2lvbmFsIHJhbmdlIG9mIHRoZSBtaW5pbXVtIGFuZFxuICAvLyBtYXhpbXVtIHZhbHVlIG9uIHRoYXQgYXhpcy5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj59IHBvaW50cyBUaGUgcG9pbnRzIHRvIGZsYXR0ZW4uXG4gICAqIEBwYXJhbSB7VmVjdG9yfSBub3JtYWwgVGhlIHVuaXQgdmVjdG9yIGF4aXMgdG8gZmxhdHRlbiBvbi5cbiAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gcmVzdWx0IEFuIGFycmF5LiAgQWZ0ZXIgY2FsbGluZyB0aGlzIGZ1bmN0aW9uLFxuICAgKiAgIHJlc3VsdFswXSB3aWxsIGJlIHRoZSBtaW5pbXVtIHZhbHVlLFxuICAgKiAgIHJlc3VsdFsxXSB3aWxsIGJlIHRoZSBtYXhpbXVtIHZhbHVlLlxuICAgKi9cbiAgZnVuY3Rpb24gZmxhdHRlblBvaW50c09uKHBvaW50cywgbm9ybWFsLCByZXN1bHQpIHtcbiAgICB2YXIgbWluID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICB2YXIgbWF4ID0gLU51bWJlci5NQVhfVkFMVUU7XG4gICAgdmFyIGxlbiA9IHBvaW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIC8vIFRoZSBtYWduaXR1ZGUgb2YgdGhlIHByb2plY3Rpb24gb2YgdGhlIHBvaW50IG9udG8gdGhlIG5vcm1hbFxuICAgICAgdmFyIGRvdCA9IHBvaW50c1tpXS5kb3Qobm9ybWFsKTtcbiAgICAgIGlmIChkb3QgPCBtaW4pIHsgbWluID0gZG90OyB9XG4gICAgICBpZiAoZG90ID4gbWF4KSB7IG1heCA9IGRvdDsgfVxuICAgIH1cbiAgICByZXN1bHRbMF0gPSBtaW47IHJlc3VsdFsxXSA9IG1heDtcbiAgfVxuICBcbiAgLy8gQ2hlY2sgd2hldGhlciB0d28gY29udmV4IHBvbHlnb25zIGFyZSBzZXBhcmF0ZWQgYnkgdGhlIHNwZWNpZmllZFxuICAvLyBheGlzIChtdXN0IGJlIGEgdW5pdCB2ZWN0b3IpLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IGFQb3MgVGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBwb2x5Z29uLlxuICAgKiBAcGFyYW0ge1ZlY3Rvcn0gYlBvcyBUaGUgcG9zaXRpb24gb2YgdGhlIHNlY29uZCBwb2x5Z29uLlxuICAgKiBAcGFyYW0ge0FycmF5LjxWZWN0b3I+fSBhUG9pbnRzIFRoZSBwb2ludHMgaW4gdGhlIGZpcnN0IHBvbHlnb24uXG4gICAqIEBwYXJhbSB7QXJyYXkuPFZlY3Rvcj59IGJQb2ludHMgVGhlIHBvaW50cyBpbiB0aGUgc2Vjb25kIHBvbHlnb24uXG4gICAqIEBwYXJhbSB7VmVjdG9yfSBheGlzIFRoZSBheGlzICh1bml0IHNpemVkKSB0byB0ZXN0IGFnYWluc3QuICBUaGUgcG9pbnRzIG9mIGJvdGggcG9seWdvbnNcbiAgICogICB3aWxsIGJlIHByb2plY3RlZCBvbnRvIHRoaXMgYXhpcy5cbiAgICogQHBhcmFtIHtSZXNwb25zZT19IHJlc3BvbnNlIEEgUmVzcG9uc2Ugb2JqZWN0IChvcHRpb25hbCkgd2hpY2ggd2lsbCBiZSBwb3B1bGF0ZWRcbiAgICogICBpZiB0aGUgYXhpcyBpcyBub3QgYSBzZXBhcmF0aW5nIGF4aXMuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgaXQgaXMgYSBzZXBhcmF0aW5nIGF4aXMsIGZhbHNlIG90aGVyd2lzZS4gIElmIGZhbHNlLFxuICAgKiAgIGFuZCBhIHJlc3BvbnNlIGlzIHBhc3NlZCBpbiwgaW5mb3JtYXRpb24gYWJvdXQgaG93IG11Y2ggb3ZlcmxhcCBhbmRcbiAgICogICB0aGUgZGlyZWN0aW9uIG9mIHRoZSBvdmVybGFwIHdpbGwgYmUgcG9wdWxhdGVkLlxuICAgKi9cbiAgZnVuY3Rpb24gaXNTZXBhcmF0aW5nQXhpcyhhUG9zLCBiUG9zLCBhUG9pbnRzLCBiUG9pbnRzLCBheGlzLCByZXNwb25zZSkge1xuICAgIHZhciByYW5nZUEgPSBUX0FSUkFZUy5wb3AoKTtcbiAgICB2YXIgcmFuZ2VCID0gVF9BUlJBWVMucG9wKCk7XG4gICAgLy8gVGhlIG1hZ25pdHVkZSBvZiB0aGUgb2Zmc2V0IGJldHdlZW4gdGhlIHR3byBwb2x5Z29uc1xuICAgIHZhciBvZmZzZXRWID0gVF9WRUNUT1JTLnBvcCgpLmNvcHkoYlBvcykuc3ViKGFQb3MpO1xuICAgIHZhciBwcm9qZWN0ZWRPZmZzZXQgPSBvZmZzZXRWLmRvdChheGlzKTtcbiAgICAvLyBQcm9qZWN0IHRoZSBwb2x5Z29ucyBvbnRvIHRoZSBheGlzLlxuICAgIGZsYXR0ZW5Qb2ludHNPbihhUG9pbnRzLCBheGlzLCByYW5nZUEpO1xuICAgIGZsYXR0ZW5Qb2ludHNPbihiUG9pbnRzLCBheGlzLCByYW5nZUIpO1xuICAgIC8vIE1vdmUgQidzIHJhbmdlIHRvIGl0cyBwb3NpdGlvbiByZWxhdGl2ZSB0byBBLlxuICAgIHJhbmdlQlswXSArPSBwcm9qZWN0ZWRPZmZzZXQ7XG4gICAgcmFuZ2VCWzFdICs9IHByb2plY3RlZE9mZnNldDtcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIGdhcC4gSWYgdGhlcmUgaXMsIHRoaXMgaXMgYSBzZXBhcmF0aW5nIGF4aXMgYW5kIHdlIGNhbiBzdG9wXG4gICAgaWYgKHJhbmdlQVswXSA+IHJhbmdlQlsxXSB8fCByYW5nZUJbMF0gPiByYW5nZUFbMV0pIHtcbiAgICAgIFRfVkVDVE9SUy5wdXNoKG9mZnNldFYpOyBcbiAgICAgIFRfQVJSQVlTLnB1c2gocmFuZ2VBKTsgXG4gICAgICBUX0FSUkFZUy5wdXNoKHJhbmdlQik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gVGhpcyBpcyBub3QgYSBzZXBhcmF0aW5nIGF4aXMuIElmIHdlJ3JlIGNhbGN1bGF0aW5nIGEgcmVzcG9uc2UsIGNhbGN1bGF0ZSB0aGUgb3ZlcmxhcC5cbiAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgIHZhciBvdmVybGFwID0gMDtcbiAgICAgIC8vIEEgc3RhcnRzIGZ1cnRoZXIgbGVmdCB0aGFuIEJcbiAgICAgIGlmIChyYW5nZUFbMF0gPCByYW5nZUJbMF0pIHtcbiAgICAgICAgcmVzcG9uc2VbJ2FJbkInXSA9IGZhbHNlO1xuICAgICAgICAvLyBBIGVuZHMgYmVmb3JlIEIgZG9lcy4gV2UgaGF2ZSB0byBwdWxsIEEgb3V0IG9mIEJcbiAgICAgICAgaWYgKHJhbmdlQVsxXSA8IHJhbmdlQlsxXSkgeyBcbiAgICAgICAgICBvdmVybGFwID0gcmFuZ2VBWzFdIC0gcmFuZ2VCWzBdO1xuICAgICAgICAgIHJlc3BvbnNlWydiSW5BJ10gPSBmYWxzZTtcbiAgICAgICAgLy8gQiBpcyBmdWxseSBpbnNpZGUgQS4gIFBpY2sgdGhlIHNob3J0ZXN0IHdheSBvdXQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG9wdGlvbjEgPSByYW5nZUFbMV0gLSByYW5nZUJbMF07XG4gICAgICAgICAgdmFyIG9wdGlvbjIgPSByYW5nZUJbMV0gLSByYW5nZUFbMF07XG4gICAgICAgICAgb3ZlcmxhcCA9IG9wdGlvbjEgPCBvcHRpb24yID8gb3B0aW9uMSA6IC1vcHRpb24yO1xuICAgICAgICB9XG4gICAgICAvLyBCIHN0YXJ0cyBmdXJ0aGVyIGxlZnQgdGhhbiBBXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNwb25zZVsnYkluQSddID0gZmFsc2U7XG4gICAgICAgIC8vIEIgZW5kcyBiZWZvcmUgQSBlbmRzLiBXZSBoYXZlIHRvIHB1c2ggQSBvdXQgb2YgQlxuICAgICAgICBpZiAocmFuZ2VBWzFdID4gcmFuZ2VCWzFdKSB7IFxuICAgICAgICAgIG92ZXJsYXAgPSByYW5nZUFbMF0gLSByYW5nZUJbMV07XG4gICAgICAgICAgcmVzcG9uc2VbJ2FJbkInXSA9IGZhbHNlO1xuICAgICAgICAvLyBBIGlzIGZ1bGx5IGluc2lkZSBCLiAgUGljayB0aGUgc2hvcnRlc3Qgd2F5IG91dC5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgb3B0aW9uMSA9IHJhbmdlQVsxXSAtIHJhbmdlQlswXTtcbiAgICAgICAgICB2YXIgb3B0aW9uMiA9IHJhbmdlQlsxXSAtIHJhbmdlQVswXTtcbiAgICAgICAgICBvdmVybGFwID0gb3B0aW9uMSA8IG9wdGlvbjIgPyBvcHRpb24xIDogLW9wdGlvbjI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIElmIHRoaXMgaXMgdGhlIHNtYWxsZXN0IGFtb3VudCBvZiBvdmVybGFwIHdlJ3ZlIHNlZW4gc28gZmFyLCBzZXQgaXQgYXMgdGhlIG1pbmltdW0gb3ZlcmxhcC5cbiAgICAgIHZhciBhYnNPdmVybGFwID0gTWF0aC5hYnMob3ZlcmxhcCk7XG4gICAgICBpZiAoYWJzT3ZlcmxhcCA8IHJlc3BvbnNlWydvdmVybGFwJ10pIHtcbiAgICAgICAgcmVzcG9uc2VbJ292ZXJsYXAnXSA9IGFic092ZXJsYXA7XG4gICAgICAgIHJlc3BvbnNlWydvdmVybGFwTiddLmNvcHkoYXhpcyk7XG4gICAgICAgIGlmIChvdmVybGFwIDwgMCkge1xuICAgICAgICAgIHJlc3BvbnNlWydvdmVybGFwTiddLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgICAgfSAgICAgIFxuICAgIH1cbiAgICBUX1ZFQ1RPUlMucHVzaChvZmZzZXRWKTsgXG4gICAgVF9BUlJBWVMucHVzaChyYW5nZUEpOyBcbiAgICBUX0FSUkFZUy5wdXNoKHJhbmdlQik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvLyBDYWxjdWxhdGVzIHdoaWNoIFZvcm5vaSByZWdpb24gYSBwb2ludCBpcyBvbiBhIGxpbmUgc2VnbWVudC5cbiAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IGJvdGggdGhlIGxpbmUgYW5kIHRoZSBwb2ludCBhcmUgcmVsYXRpdmUgdG8gYCgwLDApYFxuICAvL1xuICAvLyAgICAgICAgICAgIHwgICAgICAgKDApICAgICAgfFxuICAvLyAgICAgKC0xKSAgW1NdLS0tLS0tLS0tLS0tLS1bRV0gICgxKVxuICAvLyAgICAgICAgICAgIHwgICAgICAgKDApICAgICAgfFxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IGxpbmUgVGhlIGxpbmUgc2VnbWVudC5cbiAgICogQHBhcmFtIHtWZWN0b3J9IHBvaW50IFRoZSBwb2ludC5cbiAgICogQHJldHVybiAge251bWJlcn0gTEVGVF9WT1JOT0lfUkVHSU9OICgtMSkgaWYgaXQgaXMgdGhlIGxlZnQgcmVnaW9uLCBcbiAgICogICAgICAgICAgTUlERExFX1ZPUk5PSV9SRUdJT04gKDApIGlmIGl0IGlzIHRoZSBtaWRkbGUgcmVnaW9uLCBcbiAgICogICAgICAgICAgUklHSFRfVk9STk9JX1JFR0lPTiAoMSkgaWYgaXQgaXMgdGhlIHJpZ2h0IHJlZ2lvbi5cbiAgICovXG4gIGZ1bmN0aW9uIHZvcm5vaVJlZ2lvbihsaW5lLCBwb2ludCkge1xuICAgIHZhciBsZW4yID0gbGluZS5sZW4yKCk7XG4gICAgdmFyIGRwID0gcG9pbnQuZG90KGxpbmUpO1xuICAgIC8vIElmIHRoZSBwb2ludCBpcyBiZXlvbmQgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lLCBpdCBpcyBpbiB0aGVcbiAgICAvLyBsZWZ0IHZvcm5vaSByZWdpb24uXG4gICAgaWYgKGRwIDwgMCkgeyByZXR1cm4gTEVGVF9WT1JOT0lfUkVHSU9OOyB9XG4gICAgLy8gSWYgdGhlIHBvaW50IGlzIGJleW9uZCB0aGUgZW5kIG9mIHRoZSBsaW5lLCBpdCBpcyBpbiB0aGVcbiAgICAvLyByaWdodCB2b3Jub2kgcmVnaW9uLlxuICAgIGVsc2UgaWYgKGRwID4gbGVuMikgeyByZXR1cm4gUklHSFRfVk9STk9JX1JFR0lPTjsgfVxuICAgIC8vIE90aGVyd2lzZSwgaXQncyBpbiB0aGUgbWlkZGxlIG9uZS5cbiAgICBlbHNlIHsgcmV0dXJuIE1JRERMRV9WT1JOT0lfUkVHSU9OOyB9XG4gIH1cbiAgLy8gQ29uc3RhbnRzIGZvciBWb3Jub2kgcmVnaW9uc1xuICAvKipcbiAgICogQGNvbnN0XG4gICAqL1xuICB2YXIgTEVGVF9WT1JOT0lfUkVHSU9OID0gLTE7XG4gIC8qKlxuICAgKiBAY29uc3RcbiAgICovXG4gIHZhciBNSURETEVfVk9STk9JX1JFR0lPTiA9IDA7XG4gIC8qKlxuICAgKiBAY29uc3RcbiAgICovXG4gIHZhciBSSUdIVF9WT1JOT0lfUkVHSU9OID0gMTtcbiAgXG4gIC8vICMjIENvbGxpc2lvbiBUZXN0c1xuXG4gIC8vIENoZWNrIGlmIGEgcG9pbnQgaXMgaW5zaWRlIGEgY2lyY2xlLlxuICAvKipcbiAgICogQHBhcmFtIHtWZWN0b3J9IHAgVGhlIHBvaW50IHRvIHRlc3QuXG4gICAqIEBwYXJhbSB7Q2lyY2xlfSBjIFRoZSBjaXJjbGUgdG8gdGVzdC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcG9pbnQgaXMgaW5zaWRlIHRoZSBjaXJjbGUsIGZhbHNlIGlmIGl0IGlzIG5vdC5cbiAgICovXG4gIGZ1bmN0aW9uIHBvaW50SW5DaXJjbGUocCwgYykge1xuICAgIHZhciBkaWZmZXJlbmNlViA9IFRfVkVDVE9SUy5wb3AoKS5jb3B5KHApLnN1YihjWydwb3MnXSk7XG4gICAgdmFyIHJhZGl1c1NxID0gY1snciddICogY1snciddO1xuICAgIHZhciBkaXN0YW5jZVNxID0gZGlmZmVyZW5jZVYubGVuMigpO1xuICAgIFRfVkVDVE9SUy5wdXNoKGRpZmZlcmVuY2VWKTtcbiAgICAvLyBJZiB0aGUgZGlzdGFuY2UgYmV0d2VlbiBpcyBzbWFsbGVyIHRoYW4gdGhlIHJhZGl1cyB0aGVuIHRoZSBwb2ludCBpcyBpbnNpZGUgdGhlIGNpcmNsZS5cbiAgICByZXR1cm4gZGlzdGFuY2VTcSA8PSByYWRpdXNTcTtcbiAgfVxuICBTQVRbJ3BvaW50SW5DaXJjbGUnXSA9IHBvaW50SW5DaXJjbGU7XG5cbiAgLy8gQ2hlY2sgaWYgYSBwb2ludCBpcyBpbnNpZGUgYSBjb252ZXggcG9seWdvbi5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VmVjdG9yfSBwIFRoZSBwb2ludCB0byB0ZXN0LlxuICAgKiBAcGFyYW0ge1BvbHlnb259IHBvbHkgVGhlIHBvbHlnb24gdG8gdGVzdC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcG9pbnQgaXMgaW5zaWRlIHRoZSBwb2x5Z29uLCBmYWxzZSBpZiBpdCBpcyBub3QuXG4gICAqL1xuICBmdW5jdGlvbiBwb2ludEluUG9seWdvbihwLCBwb2x5KSB7XG4gICAgVU5JVF9TUVVBUkVbJ3BvcyddLmNvcHkocCk7XG4gICAgVF9SRVNQT05TRS5jbGVhcigpO1xuICAgIHZhciByZXN1bHQgPSB0ZXN0UG9seWdvblBvbHlnb24oVU5JVF9TUVVBUkUsIHBvbHksIFRfUkVTUE9OU0UpO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJlc3VsdCA9IFRfUkVTUE9OU0VbJ2FJbkInXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBTQVRbJ3BvaW50SW5Qb2x5Z29uJ10gPSBwb2ludEluUG9seWdvbjtcblxuICAvLyBDaGVjayBpZiB0d28gY2lyY2xlcyBjb2xsaWRlLlxuICAvKipcbiAgICogQHBhcmFtIHtDaXJjbGV9IGEgVGhlIGZpcnN0IGNpcmNsZS5cbiAgICogQHBhcmFtIHtDaXJjbGV9IGIgVGhlIHNlY29uZCBjaXJjbGUuXG4gICAqIEBwYXJhbSB7UmVzcG9uc2U9fSByZXNwb25zZSBSZXNwb25zZSBvYmplY3QgKG9wdGlvbmFsKSB0aGF0IHdpbGwgYmUgcG9wdWxhdGVkIGlmXG4gICAqICAgdGhlIGNpcmNsZXMgaW50ZXJzZWN0LlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBjaXJjbGVzIGludGVyc2VjdCwgZmFsc2UgaWYgdGhleSBkb24ndC4gXG4gICAqL1xuICBmdW5jdGlvbiB0ZXN0Q2lyY2xlQ2lyY2xlKGEsIGIsIHJlc3BvbnNlKSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGNlbnRlcnMgb2YgdGhlIHR3b1xuICAgIC8vIGNpcmNsZXMgaXMgZ3JlYXRlciB0aGFuIHRoZWlyIGNvbWJpbmVkIHJhZGl1cy5cbiAgICB2YXIgZGlmZmVyZW5jZVYgPSBUX1ZFQ1RPUlMucG9wKCkuY29weShiWydwb3MnXSkuc3ViKGFbJ3BvcyddKTtcbiAgICB2YXIgdG90YWxSYWRpdXMgPSBhWydyJ10gKyBiWydyJ107XG4gICAgdmFyIHRvdGFsUmFkaXVzU3EgPSB0b3RhbFJhZGl1cyAqIHRvdGFsUmFkaXVzO1xuICAgIHZhciBkaXN0YW5jZVNxID0gZGlmZmVyZW5jZVYubGVuMigpO1xuICAgIC8vIElmIHRoZSBkaXN0YW5jZSBpcyBiaWdnZXIgdGhhbiB0aGUgY29tYmluZWQgcmFkaXVzLCB0aGV5IGRvbid0IGludGVyc2VjdC5cbiAgICBpZiAoZGlzdGFuY2VTcSA+IHRvdGFsUmFkaXVzU3EpIHtcbiAgICAgIFRfVkVDVE9SUy5wdXNoKGRpZmZlcmVuY2VWKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gVGhleSBpbnRlcnNlY3QuICBJZiB3ZSdyZSBjYWxjdWxhdGluZyBhIHJlc3BvbnNlLCBjYWxjdWxhdGUgdGhlIG92ZXJsYXAuXG4gICAgaWYgKHJlc3BvbnNlKSB7IFxuICAgICAgdmFyIGRpc3QgPSBNYXRoLnNxcnQoZGlzdGFuY2VTcSk7XG4gICAgICByZXNwb25zZVsnYSddID0gYTtcbiAgICAgIHJlc3BvbnNlWydiJ10gPSBiO1xuICAgICAgcmVzcG9uc2VbJ292ZXJsYXAnXSA9IHRvdGFsUmFkaXVzIC0gZGlzdDtcbiAgICAgIHJlc3BvbnNlWydvdmVybGFwTiddLmNvcHkoZGlmZmVyZW5jZVYubm9ybWFsaXplKCkpO1xuICAgICAgcmVzcG9uc2VbJ292ZXJsYXBWJ10uY29weShkaWZmZXJlbmNlVikuc2NhbGUocmVzcG9uc2VbJ292ZXJsYXAnXSk7XG4gICAgICByZXNwb25zZVsnYUluQiddPSBhWydyJ10gPD0gYlsnciddICYmIGRpc3QgPD0gYlsnciddIC0gYVsnciddO1xuICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGJbJ3InXSA8PSBhWydyJ10gJiYgZGlzdCA8PSBhWydyJ10gLSBiWydyJ107XG4gICAgfVxuICAgIFRfVkVDVE9SUy5wdXNoKGRpZmZlcmVuY2VWKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBTQVRbJ3Rlc3RDaXJjbGVDaXJjbGUnXSA9IHRlc3RDaXJjbGVDaXJjbGU7XG4gIFxuICAvLyBDaGVjayBpZiBhIHBvbHlnb24gYW5kIGEgY2lyY2xlIGNvbGxpZGUuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BvbHlnb259IHBvbHlnb24gVGhlIHBvbHlnb24uXG4gICAqIEBwYXJhbSB7Q2lyY2xlfSBjaXJjbGUgVGhlIGNpcmNsZS5cbiAgICogQHBhcmFtIHtSZXNwb25zZT19IHJlc3BvbnNlIFJlc3BvbnNlIG9iamVjdCAob3B0aW9uYWwpIHRoYXQgd2lsbCBiZSBwb3B1bGF0ZWQgaWZcbiAgICogICB0aGV5IGludGVyc2V0LlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZXkgaW50ZXJzZWN0LCBmYWxzZSBpZiB0aGV5IGRvbid0LlxuICAgKi9cbiAgZnVuY3Rpb24gdGVzdFBvbHlnb25DaXJjbGUocG9seWdvbiwgY2lyY2xlLCByZXNwb25zZSkge1xuICAgIC8vIEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIGNpcmNsZSByZWxhdGl2ZSB0byB0aGUgcG9seWdvbi5cbiAgICB2YXIgY2lyY2xlUG9zID0gVF9WRUNUT1JTLnBvcCgpLmNvcHkoY2lyY2xlWydwb3MnXSkuc3ViKHBvbHlnb25bJ3BvcyddKTtcbiAgICB2YXIgcmFkaXVzID0gY2lyY2xlWydyJ107XG4gICAgdmFyIHJhZGl1czIgPSByYWRpdXMgKiByYWRpdXM7XG4gICAgdmFyIHBvaW50cyA9IHBvbHlnb25bJ2NhbGNQb2ludHMnXTtcbiAgICB2YXIgbGVuID0gcG9pbnRzLmxlbmd0aDtcbiAgICB2YXIgZWRnZSA9IFRfVkVDVE9SUy5wb3AoKTtcbiAgICB2YXIgcG9pbnQgPSBUX1ZFQ1RPUlMucG9wKCk7XG4gICAgXG4gICAgLy8gRm9yIGVhY2ggZWRnZSBpbiB0aGUgcG9seWdvbjpcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgbmV4dCA9IGkgPT09IGxlbiAtIDEgPyAwIDogaSArIDE7XG4gICAgICB2YXIgcHJldiA9IGkgPT09IDAgPyBsZW4gLSAxIDogaSAtIDE7XG4gICAgICB2YXIgb3ZlcmxhcCA9IDA7XG4gICAgICB2YXIgb3ZlcmxhcE4gPSBudWxsO1xuICAgICAgXG4gICAgICAvLyBHZXQgdGhlIGVkZ2UuXG4gICAgICBlZGdlLmNvcHkocG9seWdvblsnZWRnZXMnXVtpXSk7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRvIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgZWRnZS5cbiAgICAgIHBvaW50LmNvcHkoY2lyY2xlUG9zKS5zdWIocG9pbnRzW2ldKTtcbiAgICAgIFxuICAgICAgLy8gSWYgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIGFuZCB0aGUgcG9pbnRcbiAgICAgIC8vIGlzIGJpZ2dlciB0aGFuIHRoZSByYWRpdXMsIHRoZSBwb2x5Z29uIGlzIGRlZmluaXRlbHkgbm90IGZ1bGx5IGluXG4gICAgICAvLyB0aGUgY2lyY2xlLlxuICAgICAgaWYgKHJlc3BvbnNlICYmIHBvaW50LmxlbjIoKSA+IHJhZGl1czIpIHtcbiAgICAgICAgcmVzcG9uc2VbJ2FJbkInXSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDYWxjdWxhdGUgd2hpY2ggVm9ybm9pIHJlZ2lvbiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgaXMgaW4uXG4gICAgICB2YXIgcmVnaW9uID0gdm9ybm9pUmVnaW9uKGVkZ2UsIHBvaW50KTtcbiAgICAgIC8vIElmIGl0J3MgdGhlIGxlZnQgcmVnaW9uOlxuICAgICAgaWYgKHJlZ2lvbiA9PT0gTEVGVF9WT1JOT0lfUkVHSU9OKSB7IFxuICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSdyZSBpbiB0aGUgUklHSFRfVk9STk9JX1JFR0lPTiBvZiB0aGUgcHJldmlvdXMgZWRnZS5cbiAgICAgICAgZWRnZS5jb3B5KHBvbHlnb25bJ2VkZ2VzJ11bcHJldl0pO1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgcHJldmlvdXMgZWRnZVxuICAgICAgICB2YXIgcG9pbnQyID0gVF9WRUNUT1JTLnBvcCgpLmNvcHkoY2lyY2xlUG9zKS5zdWIocG9pbnRzW3ByZXZdKTtcbiAgICAgICAgcmVnaW9uID0gdm9ybm9pUmVnaW9uKGVkZ2UsIHBvaW50Mik7XG4gICAgICAgIGlmIChyZWdpb24gPT09IFJJR0hUX1ZPUk5PSV9SRUdJT04pIHtcbiAgICAgICAgICAvLyBJdCdzIGluIHRoZSByZWdpb24gd2Ugd2FudC4gIENoZWNrIGlmIHRoZSBjaXJjbGUgaW50ZXJzZWN0cyB0aGUgcG9pbnQuXG4gICAgICAgICAgdmFyIGRpc3QgPSBwb2ludC5sZW4oKTtcbiAgICAgICAgICBpZiAoZGlzdCA+IHJhZGl1cykge1xuICAgICAgICAgICAgLy8gTm8gaW50ZXJzZWN0aW9uXG4gICAgICAgICAgICBUX1ZFQ1RPUlMucHVzaChjaXJjbGVQb3MpOyBcbiAgICAgICAgICAgIFRfVkVDVE9SUy5wdXNoKGVkZ2UpO1xuICAgICAgICAgICAgVF9WRUNUT1JTLnB1c2gocG9pbnQpOyBcbiAgICAgICAgICAgIFRfVkVDVE9SUy5wdXNoKHBvaW50Mik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxuICAgICAgICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGZhbHNlO1xuICAgICAgICAgICAgb3ZlcmxhcE4gPSBwb2ludC5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBUX1ZFQ1RPUlMucHVzaChwb2ludDIpO1xuICAgICAgLy8gSWYgaXQncyB0aGUgcmlnaHQgcmVnaW9uOlxuICAgICAgfSBlbHNlIGlmIChyZWdpb24gPT09IFJJR0hUX1ZPUk5PSV9SRUdJT04pIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgd2UncmUgaW4gdGhlIGxlZnQgcmVnaW9uIG9uIHRoZSBuZXh0IGVkZ2VcbiAgICAgICAgZWRnZS5jb3B5KHBvbHlnb25bJ2VkZ2VzJ11bbmV4dF0pO1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRvIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgbmV4dCBlZGdlLlxuICAgICAgICBwb2ludC5jb3B5KGNpcmNsZVBvcykuc3ViKHBvaW50c1tuZXh0XSk7XG4gICAgICAgIHJlZ2lvbiA9IHZvcm5vaVJlZ2lvbihlZGdlLCBwb2ludCk7XG4gICAgICAgIGlmIChyZWdpb24gPT09IExFRlRfVk9STk9JX1JFR0lPTikge1xuICAgICAgICAgIC8vIEl0J3MgaW4gdGhlIHJlZ2lvbiB3ZSB3YW50LiAgQ2hlY2sgaWYgdGhlIGNpcmNsZSBpbnRlcnNlY3RzIHRoZSBwb2ludC5cbiAgICAgICAgICB2YXIgZGlzdCA9IHBvaW50LmxlbigpO1xuICAgICAgICAgIGlmIChkaXN0ID4gcmFkaXVzKSB7XG4gICAgICAgICAgICAvLyBObyBpbnRlcnNlY3Rpb25cbiAgICAgICAgICAgIFRfVkVDVE9SUy5wdXNoKGNpcmNsZVBvcyk7IFxuICAgICAgICAgICAgVF9WRUNUT1JTLnB1c2goZWRnZSk7IFxuICAgICAgICAgICAgVF9WRUNUT1JTLnB1c2gocG9pbnQpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAgICAgICAgICAgICAgXG4gICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xuICAgICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxuICAgICAgICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGZhbHNlO1xuICAgICAgICAgICAgb3ZlcmxhcE4gPSBwb2ludC5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdzIHRoZSBtaWRkbGUgcmVnaW9uOlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTmVlZCB0byBjaGVjayBpZiB0aGUgY2lyY2xlIGlzIGludGVyc2VjdGluZyB0aGUgZWRnZSxcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBlZGdlIGludG8gaXRzIFwiZWRnZSBub3JtYWxcIi5cbiAgICAgICAgdmFyIG5vcm1hbCA9IGVkZ2UucGVycCgpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAvLyBGaW5kIHRoZSBwZXJwZW5kaWN1bGFyIGRpc3RhbmNlIGJldHdlZW4gdGhlIGNlbnRlciBvZiB0aGUgXG4gICAgICAgIC8vIGNpcmNsZSBhbmQgdGhlIGVkZ2UuXG4gICAgICAgIHZhciBkaXN0ID0gcG9pbnQuZG90KG5vcm1hbCk7XG4gICAgICAgIHZhciBkaXN0QWJzID0gTWF0aC5hYnMoZGlzdCk7XG4gICAgICAgIC8vIElmIHRoZSBjaXJjbGUgaXMgb24gdGhlIG91dHNpZGUgb2YgdGhlIGVkZ2UsIHRoZXJlIGlzIG5vIGludGVyc2VjdGlvbi5cbiAgICAgICAgaWYgKGRpc3QgPiAwICYmIGRpc3RBYnMgPiByYWRpdXMpIHtcbiAgICAgICAgICAvLyBObyBpbnRlcnNlY3Rpb25cbiAgICAgICAgICBUX1ZFQ1RPUlMucHVzaChjaXJjbGVQb3MpOyBcbiAgICAgICAgICBUX1ZFQ1RPUlMucHVzaChub3JtYWwpOyBcbiAgICAgICAgICBUX1ZFQ1RPUlMucHVzaChwb2ludCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlKSB7XG4gICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxuICAgICAgICAgIG92ZXJsYXBOID0gbm9ybWFsO1xuICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xuICAgICAgICAgIC8vIElmIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSBpcyBvbiB0aGUgb3V0c2lkZSBvZiB0aGUgZWRnZSwgb3IgcGFydCBvZiB0aGVcbiAgICAgICAgICAvLyBjaXJjbGUgaXMgb24gdGhlIG91dHNpZGUsIHRoZSBjaXJjbGUgaXMgbm90IGZ1bGx5IGluc2lkZSB0aGUgcG9seWdvbi5cbiAgICAgICAgICBpZiAoZGlzdCA+PSAwIHx8IG92ZXJsYXAgPCAyICogcmFkaXVzKSB7XG4gICAgICAgICAgICByZXNwb25zZVsnYkluQSddID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIElmIHRoaXMgaXMgdGhlIHNtYWxsZXN0IG92ZXJsYXAgd2UndmUgc2Vlbiwga2VlcCBpdC4gXG4gICAgICAvLyAob3ZlcmxhcE4gbWF5IGJlIG51bGwgaWYgdGhlIGNpcmNsZSB3YXMgaW4gdGhlIHdyb25nIFZvcm5vaSByZWdpb24pLlxuICAgICAgaWYgKG92ZXJsYXBOICYmIHJlc3BvbnNlICYmIE1hdGguYWJzKG92ZXJsYXApIDwgTWF0aC5hYnMocmVzcG9uc2VbJ292ZXJsYXAnXSkpIHtcbiAgICAgICAgcmVzcG9uc2VbJ292ZXJsYXAnXSA9IG92ZXJsYXA7XG4gICAgICAgIHJlc3BvbnNlWydvdmVybGFwTiddLmNvcHkob3ZlcmxhcE4pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGZpbmFsIG92ZXJsYXAgdmVjdG9yIC0gYmFzZWQgb24gdGhlIHNtYWxsZXN0IG92ZXJsYXAuXG4gICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICByZXNwb25zZVsnYSddID0gcG9seWdvbjtcbiAgICAgIHJlc3BvbnNlWydiJ10gPSBjaXJjbGU7XG4gICAgICByZXNwb25zZVsnb3ZlcmxhcFYnXS5jb3B5KHJlc3BvbnNlWydvdmVybGFwTiddKS5zY2FsZShyZXNwb25zZVsnb3ZlcmxhcCddKTtcbiAgICB9XG4gICAgVF9WRUNUT1JTLnB1c2goY2lyY2xlUG9zKTsgXG4gICAgVF9WRUNUT1JTLnB1c2goZWRnZSk7IFxuICAgIFRfVkVDVE9SUy5wdXNoKHBvaW50KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBTQVRbJ3Rlc3RQb2x5Z29uQ2lyY2xlJ10gPSB0ZXN0UG9seWdvbkNpcmNsZTtcbiAgXG4gIC8vIENoZWNrIGlmIGEgY2lyY2xlIGFuZCBhIHBvbHlnb24gY29sbGlkZS5cbiAgLy9cbiAgLy8gKipOT1RFOioqIFRoaXMgaXMgc2xpZ2h0bHkgbGVzcyBlZmZpY2llbnQgdGhhbiBwb2x5Z29uQ2lyY2xlIGFzIGl0IGp1c3RcbiAgLy8gcnVucyBwb2x5Z29uQ2lyY2xlIGFuZCByZXZlcnNlcyBldmVyeXRoaW5nIGF0IHRoZSBlbmQuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0NpcmNsZX0gY2lyY2xlIFRoZSBjaXJjbGUuXG4gICAqIEBwYXJhbSB7UG9seWdvbn0gcG9seWdvbiBUaGUgcG9seWdvbi5cbiAgICogQHBhcmFtIHtSZXNwb25zZT19IHJlc3BvbnNlIFJlc3BvbnNlIG9iamVjdCAob3B0aW9uYWwpIHRoYXQgd2lsbCBiZSBwb3B1bGF0ZWQgaWZcbiAgICogICB0aGV5IGludGVyc2V0LlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZXkgaW50ZXJzZWN0LCBmYWxzZSBpZiB0aGV5IGRvbid0LlxuICAgKi9cbiAgZnVuY3Rpb24gdGVzdENpcmNsZVBvbHlnb24oY2lyY2xlLCBwb2x5Z29uLCByZXNwb25zZSkge1xuICAgIC8vIFRlc3QgdGhlIHBvbHlnb24gYWdhaW5zdCB0aGUgY2lyY2xlLlxuICAgIHZhciByZXN1bHQgPSB0ZXN0UG9seWdvbkNpcmNsZShwb2x5Z29uLCBjaXJjbGUsIHJlc3BvbnNlKTtcbiAgICBpZiAocmVzdWx0ICYmIHJlc3BvbnNlKSB7XG4gICAgICAvLyBTd2FwIEEgYW5kIEIgaW4gdGhlIHJlc3BvbnNlLlxuICAgICAgdmFyIGEgPSByZXNwb25zZVsnYSddO1xuICAgICAgdmFyIGFJbkIgPSByZXNwb25zZVsnYUluQiddO1xuICAgICAgcmVzcG9uc2VbJ292ZXJsYXBOJ10ucmV2ZXJzZSgpO1xuICAgICAgcmVzcG9uc2VbJ292ZXJsYXBWJ10ucmV2ZXJzZSgpO1xuICAgICAgcmVzcG9uc2VbJ2EnXSA9IHJlc3BvbnNlWydiJ107XG4gICAgICByZXNwb25zZVsnYiddID0gYTtcbiAgICAgIHJlc3BvbnNlWydhSW5CJ10gPSByZXNwb25zZVsnYkluQSddO1xuICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGFJbkI7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgU0FUWyd0ZXN0Q2lyY2xlUG9seWdvbiddID0gdGVzdENpcmNsZVBvbHlnb247XG4gIFxuICAvLyBDaGVja3Mgd2hldGhlciBwb2x5Z29ucyBjb2xsaWRlLlxuICAvKipcbiAgICogQHBhcmFtIHtQb2x5Z29ufSBhIFRoZSBmaXJzdCBwb2x5Z29uLlxuICAgKiBAcGFyYW0ge1BvbHlnb259IGIgVGhlIHNlY29uZCBwb2x5Z29uLlxuICAgKiBAcGFyYW0ge1Jlc3BvbnNlPX0gcmVzcG9uc2UgUmVzcG9uc2Ugb2JqZWN0IChvcHRpb25hbCkgdGhhdCB3aWxsIGJlIHBvcHVsYXRlZCBpZlxuICAgKiAgIHRoZXkgaW50ZXJzZXQuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhleSBpbnRlcnNlY3QsIGZhbHNlIGlmIHRoZXkgZG9uJ3QuXG4gICAqL1xuICBmdW5jdGlvbiB0ZXN0UG9seWdvblBvbHlnb24oYSwgYiwgcmVzcG9uc2UpIHtcbiAgICB2YXIgYVBvaW50cyA9IGFbJ2NhbGNQb2ludHMnXTtcbiAgICB2YXIgYUxlbiA9IGFQb2ludHMubGVuZ3RoO1xuICAgIHZhciBiUG9pbnRzID0gYlsnY2FsY1BvaW50cyddO1xuICAgIHZhciBiTGVuID0gYlBvaW50cy5sZW5ndGg7XG4gICAgLy8gSWYgYW55IG9mIHRoZSBlZGdlIG5vcm1hbHMgb2YgQSBpcyBhIHNlcGFyYXRpbmcgYXhpcywgbm8gaW50ZXJzZWN0aW9uLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYUxlbjsgaSsrKSB7XG4gICAgICBpZiAoaXNTZXBhcmF0aW5nQXhpcyhhWydwb3MnXSwgYlsncG9zJ10sIGFQb2ludHMsIGJQb2ludHMsIGFbJ25vcm1hbHMnXVtpXSwgcmVzcG9uc2UpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgYW55IG9mIHRoZSBlZGdlIG5vcm1hbHMgb2YgQiBpcyBhIHNlcGFyYXRpbmcgYXhpcywgbm8gaW50ZXJzZWN0aW9uLlxuICAgIGZvciAodmFyIGkgPSAwO2kgPCBiTGVuOyBpKyspIHtcbiAgICAgIGlmIChpc1NlcGFyYXRpbmdBeGlzKGFbJ3BvcyddLCBiWydwb3MnXSwgYVBvaW50cywgYlBvaW50cywgYlsnbm9ybWFscyddW2ldLCByZXNwb25zZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTaW5jZSBub25lIG9mIHRoZSBlZGdlIG5vcm1hbHMgb2YgQSBvciBCIGFyZSBhIHNlcGFyYXRpbmcgYXhpcywgdGhlcmUgaXMgYW4gaW50ZXJzZWN0aW9uXG4gICAgLy8gYW5kIHdlJ3ZlIGFscmVhZHkgY2FsY3VsYXRlZCB0aGUgc21hbGxlc3Qgb3ZlcmxhcCAoaW4gaXNTZXBhcmF0aW5nQXhpcykuICBDYWxjdWxhdGUgdGhlXG4gICAgLy8gZmluYWwgb3ZlcmxhcCB2ZWN0b3IuXG4gICAgaWYgKHJlc3BvbnNlKSB7XG4gICAgICByZXNwb25zZVsnYSddID0gYTtcbiAgICAgIHJlc3BvbnNlWydiJ10gPSBiO1xuICAgICAgcmVzcG9uc2VbJ292ZXJsYXBWJ10uY29weShyZXNwb25zZVsnb3ZlcmxhcE4nXSkuc2NhbGUocmVzcG9uc2VbJ292ZXJsYXAnXSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIFNBVFsndGVzdFBvbHlnb25Qb2x5Z29uJ10gPSB0ZXN0UG9seWdvblBvbHlnb247XG5cbiAgcmV0dXJuIFNBVDtcbn0pKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gSGVhZHNVcERpc3BsYXk7XG5cbkhlYWRzVXBEaXNwbGF5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLkdyb3VwLnByb3RvdHlwZSk7XG5cbmZ1bmN0aW9uIEhlYWRzVXBEaXNwbGF5KGdhbWUsIHBhcmVudEdyb3VwKSB7XG4gICAgUGhhc2VyLkdyb3VwLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50R3JvdXAsIFwiaGVhZHMtdXAtZGlzcGxheVwiKTtcbiAgICBcbiAgICB0aGlzLl9zY29yZUtlZXBlciA9IHRoaXMuZ2FtZS5nbG9iYWxzLnNjb3JlS2VlcGVyO1xuICAgIHRoaXMuX3BsYXllciA9IHRoaXMuZ2FtZS5nbG9iYWxzLnBsYXllcjtcbiAgICB0aGlzLl9zYXRCb2R5UGx1Z2luID0gdGhpcy5nYW1lLmdsb2JhbHMucGx1Z2lucy5zYXRCb2R5O1xuXG4gICAgdGhpcy5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblxuICAgIHZhciB0ZXh0U3R5bGUgPSB7XG4gICAgICAgIGZvbnQ6IFwiMzJweCBBcmlhbFwiLFxuICAgICAgICBmaWxsOiBcIiM5QzlDOUNcIixcbiAgICAgICAgYWxpZ246IFwibGVmdFwiXG4gICAgfTtcbiAgICB0aGlzLl9zY29yZVRleHQgPSBnYW1lLm1ha2UudGV4dCgzMCwgMjAsIFwiU2NvcmU6IDBcIiwgdGV4dFN0eWxlKTtcbiAgICB0aGlzLmFkZCh0aGlzLl9zY29yZVRleHQpO1xuICAgIHRoaXMuX2NvbWJvVGV4dCA9IGdhbWUubWFrZS50ZXh0KDMwLCA2MCwgXCJDb21ibzogMFwiLCB0ZXh0U3R5bGUpO1xuICAgIHRoaXMuYWRkKHRoaXMuX2NvbWJvVGV4dCk7XG4gICAgdGhpcy5fYW1tb1RleHQgPSBnYW1lLm1ha2UudGV4dCgzMCwgMTAwLCBcIkFtbW86IDBcIiwgdGV4dFN0eWxlKTtcbiAgICB0aGlzLmFkZCh0aGlzLl9hbW1vVGV4dCk7XG4gICAgdGhpcy5fZGVidWdUZXh0ID0gZ2FtZS5tYWtlLnRleHQoMzAsIGdhbWUuaGVpZ2h0IC0gNDAsIFxuICAgICAgICBcIkRlYnVnICgnRScga2V5KTogZmFsc2VcIiwgdGV4dFN0eWxlKTtcbiAgICB0aGlzLl9kZWJ1Z1RleHQuZm9udFNpemUgPSAxNDtcbiAgICB0aGlzLmFkZCh0aGlzLl9kZWJ1Z1RleHQpO1xufVxuXG5IZWFkc1VwRGlzcGxheS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3Njb3JlVGV4dC5zZXRUZXh0KFwiU2NvcmU6IFwiICsgdGhpcy5fc2NvcmVLZWVwZXIuZ2V0U2NvcmUoKSk7XG4gICAgaWYgKHRoaXMuX3BsYXllci5fZ3VuVHlwZSA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgICAgdGhpcy5fYW1tb1RleHQuc2V0VGV4dChcIkFtbW86IC1cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYW1tb1RleHQuc2V0VGV4dChcIkFtbW86IFwiICsgXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXIuZ2V0QW1tbygpICsgXCIgLyBcIiArIHRoaXMuX3BsYXllci5nZXRHdW4oKS5fdG90YWxBbW1vKTtcbiAgICB9XG4gICAgdGhpcy5fY29tYm9UZXh0LnNldFRleHQoXCJDb21ibzogXCIgKyB0aGlzLl9wbGF5ZXIuZ2V0Q29tYm8oKSk7XG4gICAgdGhpcy5fZGVidWdUZXh0LnNldFRleHQoXCJEZWJ1ZyAoJ0UnIGtleSk6IFwiICsgXG4gICAgICAgIHRoaXMuX3NhdEJvZHlQbHVnaW4uaXNEZWJ1Z0FsbEVuYWJsZWQoKSk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuXG52YXIgQ29udHJvbGxlciA9IHJlcXVpcmUoXCIuLi9oZWxwZXJzL2NvbnRyb2xsZXIuanNcIik7XG52YXIgc3ByaXRlVXRpbHMgPSByZXF1aXJlKFwiLi4vaGVscGVycy9zcHJpdGUtdXRpbGl0aWVzLmpzXCIpO1xudmFyIENvbWJvVHJhY2tlciA9IHJlcXVpcmUoXCIuLi9oZWxwZXJzL2NvbWJvLXRyYWNrZXIuanNcIik7XG52YXIgUmV0aWN1bGUgPSByZXF1aXJlKFwiLi9yZXRpY3VsZS5qc1wiKTtcbnZhciBHdW4gPSByZXF1aXJlKFwiLi93ZWFwb25zL2d1bi5qc1wiKTtcbnZhciBNYWNoaW5lR3VuID0gcmVxdWlyZShcIi4vd2VhcG9ucy9tYWNoaW5lLWd1bi5qc1wiKTtcbnZhciBMYXNlciA9IHJlcXVpcmUoXCIuL3dlYXBvbnMvbGFzZXIuanNcIik7XG52YXIgQXJyb3cgPSByZXF1aXJlKFwiLi93ZWFwb25zL2Fycm93LmpzXCIpO1xudmFyIEJlYW0gPSByZXF1aXJlKFwiLi93ZWFwb25zL2JlYW0uanNcIik7XG52YXIgTWVsZWVXZWFwb24gPSByZXF1aXJlKFwiLi93ZWFwb25zL21lbGVlLXdlYXBvbi5qc1wiKTtcbnZhciBTY2F0dGVyc2hvdCA9IHJlcXVpcmUoXCIuL3dlYXBvbnMvc2NhdHRlcnNob3QuanNcIik7XG52YXIgRmxhbWV0aHJvd2VyID0gcmVxdWlyZShcIi4vd2VhcG9ucy9mbGFtZXRocm93ZXIuanNcIik7XG52YXIgRXhwbG9zaXZlID0gcmVxdWlyZShcIi4vd2VhcG9ucy9leHBsb3NpdmUuanNcIik7XG5cbnZhciBBTklNX05BTUVTID0ge1xuICAgIElETEU6IFwiaWRsZVwiLFxuICAgIE1PVkU6IFwibW92ZVwiLFxuICAgIEFUVEFDSzogXCJhdHRhY2tcIixcbiAgICBISVQ6IFwiaGl0XCIsXG4gICAgRElFOiBcImRpZVwiXG59O1xuXG4vLyBQcm90b3R5cGUgY2hhaW4gLSBpbmhlcml0cyBmcm9tIFNwcml0ZVxuUGxheWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBQbGF5ZXIoZ2FtZSwgeCwgeSwgcGFyZW50R3JvdXApIHtcbiAgICAvLyBDYWxsIHRoZSBzcHJpdGUgY29uc3RydWN0b3IsIGJ1dCBpbnN0ZWFkIG9mIGl0IGNyZWF0aW5nIGEgbmV3IG9iamVjdCwgaXRcbiAgICAvLyBtb2RpZmllcyB0aGUgY3VycmVudCBcInRoaXNcIiBvYmplY3RcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgXCJhc3NldHNcIiwgXCJwbGF5ZXIvaWRsZS0wMVwiKTtcbiAgICB0aGlzLmFuY2hvci5zZXQoMC41KTtcbiAgICBwYXJlbnRHcm91cC5hZGQodGhpcyk7XG5cbiAgICB0aGlzLl9pc1Nob290aW5nID0gZmFsc2U7XG4gICAgdGhpcy5faXNEZWFkID0gZmFsc2U7XG5cbiAgICAvLyBTaG9ydGhhbmRcbiAgICB2YXIgZ2xvYmFscyA9IHRoaXMuZ2FtZS5nbG9iYWxzO1xuICAgIHRoaXMuX2VuZW1pZXMgPSBnbG9iYWxzLmdyb3Vwcy5lbmVtaWVzO1xuICAgIHRoaXMuX3BpY2t1cHMgPSBnbG9iYWxzLmdyb3Vwcy5waWNrdXBzO1xuXG4gICAgLy8gQ29tYm9cbiAgICB0aGlzLl9jb21ib1RyYWNrZXIgPSBuZXcgQ29tYm9UcmFja2VyKGdhbWUsIDIwMDApO1xuXG4gICAgLy8gUmV0aWNsZVxuICAgIHRoaXMuX3JldGljdWxlID0gbmV3IFJldGljdWxlKGdhbWUsIGdsb2JhbHMuZ3JvdXBzLmZvcmVncm91bmQpO1xuXG4gICAgLy8gV2VhcG9uc1xuICAgIHRoaXMuX2d1biA9IG5ldyBHdW4oZ2FtZSwgcGFyZW50R3JvdXAsIHRoaXMpO1xuXG4gICAgLy8gU2V0dXAgYW5pbWF0aW9uc1xuICAgIHZhciBpZGxlRnJhbWVzID0gUGhhc2VyLkFuaW1hdGlvbi5nZW5lcmF0ZUZyYW1lTmFtZXMoXCJwbGF5ZXIvaWRsZS1cIiwgMSwgNCwgXG4gICAgICAgIFwiXCIsIDIpO1xuICAgIHZhciBtb3ZlRnJhbWVzID0gUGhhc2VyLkFuaW1hdGlvbi5nZW5lcmF0ZUZyYW1lTmFtZXMoXCJwbGF5ZXIvbW92ZS1cIiwgMSwgNCwgXG4gICAgICAgIFwiXCIsIDIpO1xuICAgIHZhciBhdHRhY2tGcmFtZXMgPSBQaGFzZXIuQW5pbWF0aW9uLmdlbmVyYXRlRnJhbWVOYW1lcyhcInBsYXllci9hdHRhY2stXCIsIDIsXG4gICAgICAgIDQsIFwiXCIsIDIpO1xuICAgIHZhciBoaXRGcmFtZXMgPSBQaGFzZXIuQW5pbWF0aW9uLmdlbmVyYXRlRnJhbWVOYW1lcyhcInBsYXllci9oaXQtXCIsIDEsIDQsIFxuICAgICAgICBcIlwiLCAyKTtcbiAgICB2YXIgZGllRnJhbWVzID0gUGhhc2VyLkFuaW1hdGlvbi5nZW5lcmF0ZUZyYW1lTmFtZXMoXCJwbGF5ZXIvZGllLVwiLCAxLCA0LCBcbiAgICAgICAgXCJcIiwgMik7XG4gICAgdGhpcy5hbmltYXRpb25zLmFkZChBTklNX05BTUVTLklETEUsIGlkbGVGcmFtZXMsIDEwLCB0cnVlKTtcbiAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKEFOSU1fTkFNRVMuTU9WRSwgbW92ZUZyYW1lcywgNCwgdHJ1ZSk7XG4gICAgdGhpcy5hbmltYXRpb25zLmFkZChBTklNX05BTUVTLkFUVEFDSywgYXR0YWNrRnJhbWVzLCAxMCwgdHJ1ZSk7XG4gICAgdGhpcy5hbmltYXRpb25zLmFkZChBTklNX05BTUVTLkhJVCwgaGl0RnJhbWVzLCAxMCwgZmFsc2UpO1xuICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoQU5JTV9OQU1FUy5ESUUsIGRpZUZyYW1lcywgMTAsIGZhbHNlKTtcbiAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLklETEUpO1xuXG4gICAgLy8gQ29uZmlndXJlIHBsYXllciBwaHlzaWNzXG4gICAgdGhpcy5fbWF4U3BlZWQgPSA1MDtcbiAgICB0aGlzLl9jdXN0b21EcmFnID0gMTAwMDtcbiAgICB0aGlzLl9tYXhBY2NlbGVyYXRpb24gPSA1MDAwO1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMpO1xuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMuYm9keS5zZXRDaXJjbGUodGhpcy53aWR0aC8yKTsgLy8gRnVkZ2UgZmFjdG9yXG5cbiAgICB0aGlzLnNhdEJvZHkgPSB0aGlzLmdhbWUuZ2xvYmFscy5wbHVnaW5zLnNhdEJvZHkuYWRkQm94Qm9keSh0aGlzKTtcblxuICAgIC8vIFBsYXllciBjb250cm9sc1xuICAgIHRoaXMuX2NvbnRyb2xzID0gbmV3IENvbnRyb2xsZXIodGhpcy5nYW1lLmlucHV0KTtcbiAgICB2YXIgS2IgPSBQaGFzZXIuS2V5Ym9hcmQ7XG4gICAgLy8gbW92ZW1lbnRcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJtb3ZlLXVwXCIsIFtLYi5XXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwibW92ZS1sZWZ0XCIsIFtLYi5BXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwibW92ZS1yaWdodFwiLCBbS2IuRF0pO1xuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcIm1vdmUtZG93blwiLCBbS2IuU10pO1xuICAgIC8vIHByaW1hcnkgYXR0YWNrXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwiYXR0YWNrLXVwXCIsIFtLYi5VUF0pO1xuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcImF0dGFjay1sZWZ0XCIsIFtLYi5MRUZUXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwiYXR0YWNrLXJpZ2h0XCIsIFtLYi5SSUdIVF0pO1xuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcImF0dGFjay1kb3duXCIsIFtLYi5ET1dOXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkTW91c2VEb3duQ29udHJvbChcImF0dGFja1wiLCBQaGFzZXIuUG9pbnRlci5MRUZUX0JVVFRPTik7XG4gICAgLy8gc3BlY2lhbCBhdHRhY2tcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJhdHRhY2stc3BhY2VcIiwgW0tiLlNQQUNFQkFSXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkTW91c2VEb3duQ29udHJvbChcImF0dGFjay1zcGVjaWFsXCIsXG4gICAgICAgIFBoYXNlci5Qb2ludGVyLlJJR0hUX0JVVFRPTik7XG4gICAgLy8gQ3ljbGluZyB3ZWFwb25zXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwid2VhcG9uLXN3b3JkXCIsIFtLYi5PTkVdKTtcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJ3ZWFwb24tc2NhdHRlcnNob3RcIiwgW0tiLlRXT10pO1xuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcIndlYXBvbi1mbGFtZXRocm93ZXJcIiwgW0tiLlRIUkVFXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwid2VhcG9uLW1hY2hpbmUtZ3VuXCIsIFtLYi5GT1VSXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwid2VhcG9uLWxhc2VyXCIsIFtLYi5GSVZFXSk7XG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwid2VhcG9uLWJlYW1cIiwgW0tiLlNJWF0pO1xuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcIndlYXBvbi1hcnJvd1wiLCBbS2IuU0VWRU5dKTtcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJleHBsb3NpdmVcIiwgW0tiLkVJR0hUXSk7XG59XG5cblBsYXllci5wcm90b3R5cGUuZ2V0Q29tYm8gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbWJvVHJhY2tlci5nZXRDb21ibygpO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5pbmNyZW1lbnRDb21ibyA9IGZ1bmN0aW9uIChpbmNyZW1lbnQpIHtcbiAgICB0aGlzLl9jb21ib1RyYWNrZXIuaW5jcmVtZW50Q29tYm8oaW5jcmVtZW50KTtcbiAgICB2YXIgbmV3U3BlZWQgPSBQaGFzZXIuTWF0aC5tYXBMaW5lYXIodGhpcy5nZXRDb21ibygpLCAwLCA1MCwgNTAsIDUwMCk7XG4gICAgbmV3U3BlZWQgPSBQaGFzZXIuTWF0aC5jbGFtcChuZXdTcGVlZCwgNTAsIDUwMCk7XG4gICAgdGhpcy5fbWF4U3BlZWQgPSBuZXdTcGVlZDsgXG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jb250cm9scy51cGRhdGUoKTtcbiAgICBcbiAgICAvLyBDb2xsaXNpb25zIHdpdGggdGhlIHRpbGVtYXBcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLCB0aGlzLmdhbWUuZ2xvYmFscy50aWxlTWFwTGF5ZXIpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBwbGF5ZXIncyBuZXcgYWNjZWxlcmF0aW9uLiBJdCBzaG91bGQgYmUgemVybyBpZiBubyBrZXlzIGFyZVxuICAgIC8vIHByZXNzZWQgLSBhbGxvd3MgZm9yIHF1aWNrIHN0b3BwaW5nLlxuICAgIHZhciBhY2NlbGVyYXRpb24gPSBuZXcgUGhhc2VyLlBvaW50KDAsIDApO1xuXG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIm1vdmUtbGVmdFwiKSkgYWNjZWxlcmF0aW9uLnggPSAtMTtcbiAgICBlbHNlIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJtb3ZlLXJpZ2h0XCIpKSBhY2NlbGVyYXRpb24ueCA9IDE7XG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIm1vdmUtdXBcIikpIGFjY2VsZXJhdGlvbi55ID0gLTE7XG4gICAgZWxzZSBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwibW92ZS1kb3duXCIpKSBhY2NlbGVyYXRpb24ueSA9IDE7XG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIGFjY2VsZXJhdGlvbiBhbmQgc2V0IHRoZSBtYWduaXR1ZGUuIFRoaXMgbWFrZXMgaXQgc28gdGhhdFxuICAgIC8vIHRoZSBwbGF5ZXIgbW92ZXMgaW4gdGhlIHNhbWUgc3BlZWQgaW4gYWxsIGRpcmVjdGlvbnMuXG4gICAgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uLnNldE1hZ25pdHVkZSh0aGlzLl9tYXhBY2NlbGVyYXRpb24pO1xuICAgIHRoaXMuYm9keS5hY2NlbGVyYXRpb24uY29weUZyb20oYWNjZWxlcmF0aW9uKTtcblxuICAgIC8vIENhcCB0aGUgdmVsb2NpdHkuIFBoYXNlciBwaHlzaWNzJ3MgbWF4IHZlbG9jaXR5IGNhcHMgdGhlIHZlbG9jaXR5IGluIHRoZVxuICAgIC8vIHggJiB5IGRpbWVuc2lvbnMgc2VwYXJhdGVseS4gVGhpcyBhbGxvd3MgdGhlIHNwcml0ZSB0byBtb3ZlIGZhc3RlciBhbG9uZ1xuICAgIC8vIGEgZGlhZ29uYWwgdGhhbiBpdCB3b3VsZCBhbG9uZyB0aGUgeCBvciB5IGF4aXMuIFRvIGZpeCB0aGF0LCB3ZSBuZWVkIHRvXG4gICAgLy8gY2FwIHRoZSB2ZWxvY2l0eSBiYXNlZCBvbiBpdCdzIG1hZ25pdHVkZS5cbiAgICBpZiAodGhpcy5ib2R5LnZlbG9jaXR5LmdldE1hZ25pdHVkZSgpID4gdGhpcy5fbWF4U3BlZWQpIHtcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldE1hZ25pdHVkZSh0aGlzLl9tYXhTcGVlZCk7XG4gICAgfVxuXG4gICAgLy8gQ3VzdG9tIGRyYWcuIEFyY2FkZSBkcmFnIHJ1bnMgdGhlIGNhbGN1bGF0aW9uIG9uIGVhY2ggYXhpcyBzZXBhcmF0ZWx5LiBcbiAgICAvLyBUaGlzIGxlYWRzIHRvIG1vcmUgZHJhZyBpbiB0aGUgZGlhZ29uYWwgdGhhbiBpbiBvdGhlciBkaXJlY3Rpb25zLiAgVG8gZml4XG4gICAgLy8gdGhhdCwgd2UgbmVlZCB0byBhcHBseSBkcmFnIG91cnNlbHZlcy5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgLy8gQmFzZWQgb246IGh0dHBzOi8vZ2l0aHViLmNvbS9waG90b25zdG9ybS9waGFzZXIvYmxvYi92Mi40Ljgvc3JjL3BoeXNpY3MvYXJjYWRlL1dvcmxkLmpzI0wyNTdcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuICAgIGlmIChhY2NlbGVyYXRpb24uaXNaZXJvKCkgJiYgIXRoaXMuYm9keS52ZWxvY2l0eS5pc1plcm8oKSkge1xuICAgICAgICB2YXIgZHJhZ01hZ25pdHVkZSA9IHRoaXMuX2N1c3RvbURyYWcgKiB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcbiAgICAgICAgaWYgKHRoaXMuYm9keS52ZWxvY2l0eS5nZXRNYWduaXR1ZGUoKSA8IGRyYWdNYWduaXR1ZGUpIHtcbiAgICAgICAgICAgIC8vIFNuYXAgdG8gMCB2ZWxvY2l0eSBzbyB0aGF0IHdlIGF2b2lkIHRoZSBkcmFnIGNhdXNpbmcgdGhlIHZlbG9jaXR5XG4gICAgICAgICAgICAvLyB0byBmbGlwIGRpcmVjdGlvbnMgYW5kIGVuZCB1cCBvc2NpbGxhdGluZ1xuICAgICAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldCgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFwcGx5IGRyYWcgaW4gb3Bwb3NpdGUgZGlyZWN0aW9uIG9mIHZlbG9jaXR5XG4gICAgICAgICAgICB2YXIgZHJhZyA9IHRoaXMuYm9keS52ZWxvY2l0eS5jbG9uZSgpXG4gICAgICAgICAgICAgICAgLnNldE1hZ25pdHVkZSgtMSAqIGRyYWdNYWduaXR1ZGUpOyBcbiAgICAgICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS5hZGQoZHJhZy54LCBkcmFnLnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gYW1tbyBjaGVja1xuICAgIGlmICh0aGlzLl9ndW4uaXNBbW1vRW1wdHkgJiYgdGhpcy5fZ3VuLmlzQW1tb0VtcHR5KCkpIHtcbiAgICAgICAgdGhpcy5fZ3VuLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5fZ3VuID0gbmV3IEd1bih0aGlzLmdhbWUsIHRoaXMucGFyZW50LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTd2FwcGluZyB3ZWFwb25zXG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIndlYXBvbi1tYWNoaW5lLWd1blwiKSkge1xuICAgICAgICB0aGlzLl9ndW4uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ndW4gPSBuZXcgTWFjaGluZUd1bih0aGlzLmdhbWUsIHRoaXMucGFyZW50LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIndlYXBvbi1sYXNlclwiKSkge1xuICAgICAgICB0aGlzLl9ndW4uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ndW4gPSBuZXcgTGFzZXIodGhpcy5nYW1lLCB0aGlzLnBhcmVudCwgdGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJ3ZWFwb24tYmVhbVwiKSkge1xuICAgICAgICB0aGlzLl9ndW4uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ndW4gPSBuZXcgQmVhbSh0aGlzLmdhbWUsIHRoaXMucGFyZW50LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIndlYXBvbi1hcnJvd1wiKSkge1xuICAgICAgICB0aGlzLl9ndW4uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ndW4gPSBuZXcgQXJyb3codGhpcy5nYW1lLCB0aGlzLnBhcmVudCwgdGhpcyk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJ3ZWFwb24tc3dvcmRcIikpIHtcbiAgICAgICAgdGhpcy5fZ3VuLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5fZ3VuID0gbmV3IE1lbGVlV2VhcG9uKHRoaXMuZ2FtZSwgdGhpcy5wYXJlbnQsIHRoaXMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwid2VhcG9uLXNjYXR0ZXJzaG90XCIpKSB7XG4gICAgICAgIHRoaXMuX2d1bi5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX2d1biA9IG5ldyBTY2F0dGVyc2hvdCh0aGlzLmdhbWUsIHRoaXMucGFyZW50LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcIndlYXBvbi1mbGFtZXRocm93ZXJcIikpIHtcbiAgICAgICAgdGhpcy5fZ3VuLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5fZ3VuID0gbmV3IEZsYW1ldGhyb3dlcih0aGlzLmdhbWUsIHRoaXMucGFyZW50LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcImV4cGxvc2l2ZVwiKSkge1xuICAgICAgICB0aGlzLl9ndW4uZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ndW4gPSBuZXcgRXhwbG9zaXZlKHRoaXMuZ2FtZSwgdGhpcy5wYXJlbnQsIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIEZpcmluZyBsb2dpY1xuICAgIHZhciBpc1Nob290aW5nID0gZmFsc2U7XG4gICAgdmFyIGF0dGFja0RpciA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiYXR0YWNrXCIpKSB7XG4gICAgICAgIGlzU2hvb3RpbmcgPSB0cnVlO1xuICAgICAgICBhdHRhY2tEaXIgPSB0aGlzLl9yZXRpY3VsZS5wb3NpdGlvbi5jbG9uZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiYXR0YWNrLWxlZnRcIikpIHtcbiAgICAgICAgaXNTaG9vdGluZyA9IHRydWU7XG4gICAgICAgIGF0dGFja0Rpci54ICs9IC0xO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiYXR0YWNrLXJpZ2h0XCIpKSB7XG4gICAgICAgIGlzU2hvb3RpbmcgPSB0cnVlO1xuICAgICAgICBhdHRhY2tEaXIueCArPSAxO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiYXR0YWNrLXVwXCIpKSB7XG4gICAgICAgIGlzU2hvb3RpbmcgPSB0cnVlO1xuICAgICAgICBhdHRhY2tEaXIueSArPSAtMTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcImF0dGFjay1kb3duXCIpKSB7XG4gICAgICAgIGlzU2hvb3RpbmcgPSB0cnVlO1xuICAgICAgICBhdHRhY2tEaXIueSArPSAxO1xuICAgIH1cbiAgICBpZiAoaXNTaG9vdGluZykge1xuICAgICAgICB0aGlzLl9ndW4uZmlyZShhdHRhY2tEaXIpO1xuICAgIH1cblxuICAgIC8vIHNwZWNpYWwgd2VhcG9ucyBsb2dpY1xuICAgIHZhciBpc1Nob290aW5nU3BlY2lhbCA9IGZhbHNlO1xuICAgIHZhciBzcGVjaWFsQXR0YWNrRGlyID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICAgIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJhdHRhY2stc3BlY2lhbFwiKSkge1xuICAgICAgICBpc1Nob290aW5nU3BlY2lhbCA9IHRydWU7XG4gICAgICAgIHNwZWNpYWxBdHRhY2tEaXIgPSB0aGlzLl9yZXRpY3VsZS5wb3NpdGlvbi5jbG9uZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiYXR0YWNrLXNwYWNlXCIpKSB7XG4gICAgICAgIGlzU2hvb3RpbmdTcGVjaWFsID0gdHJ1ZTtcbiAgICAgICAgc3BlY2lhbEF0dGFja0Rpci54ICs9IDA7XG4gICAgICAgIHNwZWNpYWxBdHRhY2tEaXIueSAtPSAxO1xuICAgIH1cbiAgICBpZiAoaXNTaG9vdGluZ1NwZWNpYWwgJiYgdGhpcy5nZXRHdW4oKS5zcGVjaWFsRmlyZSkge1xuICAgICAgICB0aGlzLl9ndW4uc3BlY2lhbEZpcmUoc3BlY2lhbEF0dGFja0Rpcik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgd2hldGhlciBwbGF5ZXIgaXMgbW92aW5nIGluIG9yZGVyIHRvIHVwZGF0ZSBpdHMgYW5pbWF0aW9uXG4gICAgdmFyIGlzSWRsZSA9IGFjY2VsZXJhdGlvbi5pc1plcm8oKTtcbiAgICBpZiAoKGlzU2hvb3RpbmcgfHwgaXNTaG9vdGluZ1NwZWNpYWwpICYmXG4gICAgICAgICh0aGlzLmFuaW1hdGlvbnMubmFtZSAhPT0gQU5JTV9OQU1FUy5BVFRBQ0spKSB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW9ucy5wbGF5KEFOSU1fTkFNRVMuQVRUQUNLKTtcbiAgICB9IGVsc2UgaWYgKCFpc1Nob290aW5nICYmICFpc1Nob290aW5nU3BlY2lhbCAmJiBpc0lkbGUgJiZcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLm5hbWUgIT09IEFOSU1fTkFNRVMuSURMRSkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLklETEUpO1xuICAgIH0gZWxzZSBpZiAoIWlzU2hvb3RpbmcgJiYgIWlzU2hvb3RpbmdTcGVjaWFsICYmICFpc0lkbGUgJiZcbiAgICAgICAgdGhpcy5hbmltYXRpb25zLm5hbWUgIT09IEFOSU1fTkFNRVMuTU9WRSkge1xuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLk1PVkUpO1xuICAgIH1cblxuICAgIC8vIEVuZW15IGNvbGxpc2lvbnNcbiAgICBzcHJpdGVVdGlscy5jaGVja092ZXJsYXBXaXRoR3JvdXAodGhpcywgdGhpcy5fZW5lbWllcywgdGhpcy5fb25Db2xsaWRlV2l0aEVuZW15LCB0aGlzKTtcblxuICAgIC8vIFBpY2t1cCBjb2xsaXNpb25zXG4gICAgc3ByaXRlVXRpbHMuY2hlY2tPdmVybGFwV2l0aEdyb3VwKHRoaXMsIHRoaXMuX3BpY2t1cHMsIHRoaXMuX29uQ29sbGlkZVdpdGhQaWNrdXAsIHRoaXMpO1xuXG4gICAgLy8gaWYgKHRoaXMuX2lzRGVhZCkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcImRlYWQhXCIpO1xuICAgIC8vICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLkRJRSk7XG4gICAgLy8gICAgIHRoaXMuYW5pbWF0aW9ucy5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIHRoaXMuX2lzRGVhZCA9IGZhbHNlO1xuICAgIC8vICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgLy8gICAgICAgICB0aGlzLmdhbWUuc3RhdGUucmVzdGFydCgpO1xuICAgIC8vICAgICB9LCB0aGlzKTtcbiAgICAvLyB9XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLl9vbkNvbGxpZGVXaXRoRW5lbXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcmV0dXJuIHRvIHN0YXJ0IHNjcmVlblxuICAgIC8vICoqKiB0aGlzIGRvZXNuJ3Qgd29yaywgZGlkbid0IGxvb2sgaW50byBpdC4uLlxuICAgIC8vIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydChcInN0YXJ0XCIpO1xuXG4gICAgLy8gZm9yIHNhbmRib3ggdGVzdGluZ1xuICAgIC8vIGNvbnNvbGUubG9nKFwiZGllZCFcIik7XG4gICAgLy8gdGhpcy5ib2R5LmVuYWJsZSA9IGZhbHNlO1xuICAgIC8vIHRoaXMuX2lzRGVhZCA9IHRydWU7XG5cbiAgICB0aGlzLmdhbWUuc3RhdGUucmVzdGFydCgpO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5fb25Db2xsaWRlV2l0aFBpY2t1cCA9IGZ1bmN0aW9uIChzZWxmLCBwaWNrdXApIHtcbiAgICBpZiAocGlja3VwLl9jYXRlZ29yeSA9PT0gXCJ3ZWFwb25cIikge1xuICAgICAgICBpZiAocGlja3VwLnR5cGUgPT09IHRoaXMuX2d1blR5cGUpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0R3VuKCkuaW5jcmVtZW50QW1tbyhwaWNrdXAuYW1tb0Ftb3VudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ndW5UeXBlID0gcGlja3VwLnR5cGU7XG4gICAgICAgICAgICB0aGlzLmdldEd1bigpLmZpbGxBbW1vKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcGlja3VwLmRlc3Ryb3koKTtcbn07XG5cblxuUGxheWVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JldGljdWxlLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9jb21ib1RyYWNrZXIuZGVzdHJveSgpO1xuICAgIGZvciAodmFyIGd1biBpbiB0aGlzLl9hbGxHdW5zKSB7XG4gICAgICAgIHRoaXMuX2FsbEd1bnNbZ3VuXS5kZXN0cm95KCk7XG4gICAgfVxuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLmRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUuZ2V0R3VuID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2d1bjtcbn07XG5cblBsYXllci5wcm90b3R5cGUuZ2V0QW1tbyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9ndW4uZ2V0QW1tbykgcmV0dXJuIHRoaXMuX2d1bi5nZXRBbW1vKCk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gUmV0aWN1bGU7XG5cblJldGljdWxlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBSZXRpY3VsZShnYW1lLCBwYXJlbnRHcm91cCkge1xuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCAwLCAwLCBcImFzc2V0c1wiLCBcImh1ZC9yZXRpY3VsZVwiKTtcbiAgICB0aGlzLmFuY2hvci5zZXQoMC41KTtcbiAgICBwYXJlbnRHcm91cC5hZGQodGhpcyk7XG4gICAgXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcbn1cblxuUmV0aWN1bGUucHJvdG90eXBlLl91cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdQb3MgPSBQaGFzZXIuUG9pbnQuYWRkKHRoaXMuZ2FtZS5jYW1lcmEucG9zaXRpb24sIFxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlcik7XG4gICAgdGhpcy5wb3NpdGlvbi5jb3B5RnJvbShuZXdQb3MpO1xufTtcblxuUmV0aWN1bGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IFNoYWRvd01hc2s7XG5cbnZhciBjYWxjdWxhdGVIdWxsc0Zyb21UaWxlcyA9IHJlcXVpcmUoXCIuLi9oZWxwZXJzL2h1bGwtZnJvbS10aWxlcy5qc1wiKTtcblxuLy8gUHJvdG90eXBlIGNoYWluIC0gaW5oZXJpdHMgZnJvbSA/Pz9cbmZ1bmN0aW9uIFNoYWRvd01hc2soZ2FtZSwgb3BhY2l0eSwgdGlsZW1hcCwgcGFyZW50R3JvdXApIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgIHRoaXMuc2hhZG93T3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgdGhpcy5jYW1lcmEgPSB0aGlzLmdhbWUuY2FtZXJhO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50R3JvdXA7XG5cbiAgICAvLyBDcmVhdGUgYSBiaXRtYXAgYW5kIGltYWdlIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGR5bmFtaWMgbGlnaHRpbmdcbiAgICB2YXIgYml0bWFwID0gZ2FtZS5hZGQuYml0bWFwRGF0YShnYW1lLndpZHRoLCBnYW1lLmhlaWdodCk7XG4gICAgYml0bWFwLmZpbGwoMCwgMCwgMCwgb3BhY2l0eSk7XG4gICAgdmFyIGltYWdlID0gYml0bWFwLmFkZFRvV29ybGQoZ2FtZS53aWR0aCAvIDIsIGdhbWUuaGVpZ2h0IC8gMiwgMC41LCAwLjUsIDEsIFxuICAgICAgICAxKTtcbiAgICBpbWFnZS5ibGVuZE1vZGUgPSBQaGFzZXIuYmxlbmRNb2Rlcy5NVUxUSVBMWTtcbiAgICBpbWFnZS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgICBwYXJlbnRHcm91cC5hZGRDaGlsZChpbWFnZSk7XG5cbiAgICB0aGlzLl9iaXRtYXAgPSBiaXRtYXA7XG4gICAgdGhpcy5faW1hZ2UgPSBpbWFnZTtcbiAgICB0aGlzLl9saWdodFdhbGxzID0gY2FsY3VsYXRlSHVsbHNGcm9tVGlsZXModGlsZW1hcCk7XG5cbiAgICB0aGlzLl9yYXlCaXRtYXAgPSB0aGlzLmdhbWUuYWRkLmJpdG1hcERhdGEoZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQpO1xuICAgIHRoaXMuX3JheUJpdG1hcEltYWdlID0gdGhpcy5fcmF5Qml0bWFwLmFkZFRvV29ybGQoZ2FtZS53aWR0aCAvIDIsIFxuICAgICAgICBnYW1lLmhlaWdodCAvIDIsIDAuNSwgMC41LCAxLCAxKTtcbiAgICBwYXJlbnRHcm91cC5hZGRDaGlsZCh0aGlzLl9yYXlCaXRtYXBJbWFnZSk7XG4gICAgdGhpcy5fcmF5Qml0bWFwSW1hZ2UuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG4gICAgdGhpcy5fcmF5Qml0bWFwSW1hZ2UudmlzaWJsZSA9IGZhbHNlO1xufVxuXG5TaGFkb3dNYXNrLnByb3RvdHlwZS5fZ2V0VmlzaWJsZVdhbGxzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW1SZWN0ID0gdGhpcy5jYW1lcmEudmlldztcbiAgICB2YXIgdmlzaWJsZVdhbGxzID0gW107XG5cbiAgICAvLyBDcmVhdGUgd2FsbHMgZm9yIGVhY2ggY29ybmVyIG9mIHRoZSBzdGFnZSwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3YWxscyBhcnJheS5cbiAgICB2YXIgY2FtTGVmdCA9IG5ldyBQaGFzZXIuTGluZShjYW1SZWN0LngsIGNhbVJlY3QueSArIGNhbVJlY3QuaGVpZ2h0LCBjYW1SZWN0LngsIGNhbVJlY3QueSk7XG4gICAgdmFyIGNhbVRvcCA9IG5ldyBQaGFzZXIuTGluZShjYW1SZWN0LngsIGNhbVJlY3QueSwgY2FtUmVjdC54ICsgY2FtUmVjdC53aWR0aCwgY2FtUmVjdC55KTtcbiAgICB2YXIgY2FtUmlnaHQgPSBuZXcgUGhhc2VyLkxpbmUoY2FtUmVjdC54ICsgY2FtUmVjdC53aWR0aCwgY2FtUmVjdC55LCBjYW1SZWN0LnggKyBjYW1SZWN0LndpZHRoLCBjYW1SZWN0LnkgKyBjYW1SZWN0LmhlaWdodCk7XG4gICAgdmFyIGNhbUJvdHRvbSA9IG5ldyBQaGFzZXIuTGluZShjYW1SZWN0LnggKyBjYW1SZWN0LndpZHRoLCBjYW1SZWN0LnkgKyBjYW1SZWN0LmhlaWdodCwgY2FtUmVjdC54LCBjYW1SZWN0LnkgKyBjYW1SZWN0LmhlaWdodCk7XG4gICAgdmlzaWJsZVdhbGxzLnB1c2goY2FtTGVmdCwgY2FtUmlnaHQsIGNhbVRvcCwgY2FtQm90dG9tKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbGlnaHRXYWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX2xpZ2h0V2FsbHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBsaW5lID0gdGhpcy5fbGlnaHRXYWxsc1tpXVtqXTtcbiAgICAgICAgICAgIGlmIChjYW1SZWN0LmludGVyc2VjdHNSYXcobGluZS5sZWZ0LCBsaW5lLnJpZ2h0LCBsaW5lLnRvcCwgbGluZS5ib3R0b20pKSB7XG4gICAgICAgICAgICAgICAgbGluZSA9IGdldFZpc2libGVTZWdtZW50KGxpbmUpO1xuICAgICAgICAgICAgICAgIHZpc2libGVXYWxscy5wdXNoKGxpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0VmlzaWJsZVNlZ21lbnQobGluZSkge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0aGUgZ2l2ZW4gbGluZSBhZ2FpbnN0IHRoZSBlZGdlcyBvZiB0aGUgY2FtZXJhLiBcbiAgICAgICAgLy8gSWYgaXQgaW50ZXJzZWN0cyB3aXRoIGFuIGVkZ2UsIHRoZW4gd2UgbmVlZCB0byBvbmx5IGdldCB0aGUgdmlzaWJsZVxuICAgICAgICAvLyBwb3J0aW9uIG9mIHRoZSBsaW5lLlxuICAgICAgICAvLyBUT0RPOiBpZiB3ZSB3YW50IHRoaXMgdG8gd29yayBmb3IgZGlhZ29uYWwgbGluZXMgaW4gdGhlIHRpbGVtYXAsIHdlXG4gICAgICAgIC8vIG5lZWQgdG8gdXBkYXRlIHRoaXMgY29kZSB0byBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBhIGxpbmVcbiAgICAgICAgLy8gY2FuIGludGVyc2VjdCBtdWx0aXBsZSBlZGdlcyBvZiB0aGUgY2FtZXJhIFxuICAgICAgICB2YXIgcCA9IGxpbmUuaW50ZXJzZWN0cyhjYW1MZWZ0LCB0cnVlKTtcbiAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgIC8vIEZpbmQgd2hpY2ggcG9pbnQgb24gdGhlIGxpbmUgaXMgdmlzaWJsZVxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnQueCA8IGxpbmUuZW5kLngpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBoYXNlci5MaW5lKHAueCwgcC55LCBsaW5lLmVuZC54LCBsaW5lLmVuZC55KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQaGFzZXIuTGluZShwLngsIHAueSwgbGluZS5zdGFydC54LCBsaW5lLnN0YXJ0LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwID0gbGluZS5pbnRlcnNlY3RzKGNhbVJpZ2h0LCB0cnVlKTtcbiAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgIC8vIEZpbmQgd2hpY2ggcG9pbnQgb24gdGhlIGxpbmUgaXMgdmlzaWJsZVxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnQueCA8IGxpbmUuZW5kLngpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBoYXNlci5MaW5lKGxpbmUuc3RhcnQueCwgbGluZS5zdGFydC55LCBwLngsIHAueSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGhhc2VyLkxpbmUobGluZS5lbmQueCwgbGluZS5lbmQueSwgcC54LCBwLnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwID0gbGluZS5pbnRlcnNlY3RzKGNhbVRvcCwgdHJ1ZSk7XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICAvLyBGaW5kIHdoaWNoIHBvaW50IG9uIHRoZSBsaW5lIGlzIHZpc2libGVcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0LnkgPCBsaW5lLmVuZC55KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQaGFzZXIuTGluZShwLngsIHAueSwgbGluZS5lbmQueCwgbGluZS5lbmQueSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGhhc2VyLkxpbmUocC54LCBwLnksIGxpbmUuc3RhcnQueCwgbGluZS5zdGFydC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgcCA9IGxpbmUuaW50ZXJzZWN0cyhjYW1Cb3R0b20sIHRydWUpO1xuICAgICAgICBpZiAocCkge1xuICAgICAgICAgICAgLy8gRmluZCB3aGljaCBwb2ludCBvbiB0aGUgbGluZSBpcyB2aXNpYmxlXG4gICAgICAgICAgICBpZiAobGluZS5zdGFydC55IDwgbGluZS5lbmQueSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGhhc2VyLkxpbmUobGluZS5zdGFydC54LCBsaW5lLnN0YXJ0LnksIHAueCwgcC55KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQaGFzZXIuTGluZShsaW5lLmVuZC54LCBsaW5lLmVuZC55LCBwLngsIHAueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgfVxuICAgIHJldHVybiB2aXNpYmxlV2FsbHM7XG59O1xuXG5TaGFkb3dNYXNrLnByb3RvdHlwZS5fc29ydFBvaW50cyA9IGZ1bmN0aW9uIChwb2ludHMsIHRhcmdldCkge1xuICAgIC8vIFRPRE86IG1ha2UgbW9yZSBlZmZpY2llbnQgYnkgc29ydGluZyBhbmQgY2FjaGluZyB0aGUgYW5nbGUgY2FsY3VsYXRpb25zXG4gICAgcG9pbnRzLnNvcnQoZnVuY3Rpb24gKHAxLCBwMikge1xuICAgICAgICB2YXIgYW5nbGUxID0gUGhhc2VyLlBvaW50LmFuZ2xlKHRhcmdldCwgcDEpO1xuICAgICAgICB2YXIgYW5nbGUyID0gUGhhc2VyLlBvaW50LmFuZ2xlKHRhcmdldCwgcDIpO1xuICAgICAgICByZXR1cm4gYW5nbGUxIC0gYW5nbGUyO1xuICAgIH0pO1xufTtcblxuU2hhZG93TWFzay5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICB2YXIgZ2xvYmFscyA9IHRoaXMuZ2FtZS5nbG9iYWxzO1xuXG4gICAgdmFyIHdhbGxzID0gdGhpcy5fZ2V0VmlzaWJsZVdhbGxzKCk7XG5cbiAgICB2YXIgcGxheWVyUG9pbnQgPSBnbG9iYWxzLnBsYXllci5wb3NpdGlvbjtcbiAgICBmb3IgKHZhciB3ID0gMDsgdyA8IHdhbGxzLmxlbmd0aDsgdysrKSB7XG4gICAgICAgIC8vIEdldCBzdGFydCBhbmQgZW5kIHBvaW50IGZvciBlYWNoIHdhbGwuXG4gICAgICAgIHZhciB3YWxsID0gd2FsbHNbd107XG4gICAgICAgIHZhciBzdGFydEFuZ2xlID0gZ2xvYmFscy5wbGF5ZXIucG9zaXRpb24uYW5nbGUod2FsbC5zdGFydCk7XG4gICAgICAgIHZhciBlbmRBbmdsZSA9IGdsb2JhbHMucGxheWVyLnBvc2l0aW9uLmFuZ2xlKHdhbGwuZW5kKTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgYW4gaW50ZXJzZWN0aW9uIGF0IGVhY2ggYW5nbGUsIGFuZCArLy0gMC4wMDFcbiAgICAgICAgLy8gQWRkIHRoZSBpbnRlcnNlY3Rpb24gdG8gdGhlIHBvaW50cyBhcnJheS5cbiAgICAgICAgcG9pbnRzLnB1c2goY2hlY2tSYXlJbnRlcnNlY3Rpb24odGhpcywgc3RhcnRBbmdsZS0wLjAwMSkpO1xuICAgICAgICBwb2ludHMucHVzaChjaGVja1JheUludGVyc2VjdGlvbih0aGlzLCBzdGFydEFuZ2xlKSk7XG4gICAgICAgIHBvaW50cy5wdXNoKGNoZWNrUmF5SW50ZXJzZWN0aW9uKHRoaXMsIHN0YXJ0QW5nbGUrMC4wMDEpKTtcbiAgICAgICAgcG9pbnRzLnB1c2goY2hlY2tSYXlJbnRlcnNlY3Rpb24odGhpcywgZW5kQW5nbGUtMC4wMDEpKTtcbiAgICAgICAgcG9pbnRzLnB1c2goY2hlY2tSYXlJbnRlcnNlY3Rpb24odGhpcywgZW5kQW5nbGUpKTtcbiAgICAgICAgcG9pbnRzLnB1c2goY2hlY2tSYXlJbnRlcnNlY3Rpb24odGhpcywgZW5kQW5nbGUrMC4wMDEpKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zb3J0UG9pbnRzKHBvaW50cywgZ2xvYmFscy5wbGF5ZXIucG9zaXRpb24pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGFyYml0cmFyaWx5IGxvbmcgcmF5LCBzdGFydGluZyBhdCB0aGUgcGxheWVyIHBvc2l0aW9uLCB0aHJvdWdoIHRoZVxuICAgIC8vIHNwZWNpZmllZCBhbmdsZS4gIENoZWNrIGlmIHRoaXMgcmF5IGludGVyc2V0cyBhbnkgd2FsbHMuICBJZiBpdCBkb2VzLCByZXR1cm5cbiAgICAvLyB0aGUgcG9pbnQgYXQgd2hpY2ggaXQgaW50ZXJzZWN0cyB0aGUgY2xvc2VzdCB3YWxsLiAgT3RoZXJ3aXNlLCByZXR1cm4gdGhlIHBvaW50XG4gICAgLy8gYXQgd2hpY2ggaXQgaW50ZXJzZWN0cyB0aGUgZWRnZSBvZiB0aGUgc3RhZ2UuXG4gICAgZnVuY3Rpb24gY2hlY2tSYXlJbnRlcnNlY3Rpb24oY3R4LCBhbmdsZSkge1xuICAgICAgICAvLyBDcmVhdGUgYSByYXkgZnJvbSB0aGUgbGlnaHQgdG8gYSBwb2ludCBvbiB0aGUgY2lyY2xlXG4gICAgICAgIHZhciByYXkgPSBuZXcgUGhhc2VyLkxpbmUoZ2xvYmFscy5wbGF5ZXIueCwgZ2xvYmFscy5wbGF5ZXIueSxcbiAgICAgICAgICAgIGdsb2JhbHMucGxheWVyLnggKyBNYXRoLmNvcyhhbmdsZSkgKiAxMDAwLFxuICAgICAgICAgICAgZ2xvYmFscy5wbGF5ZXIueSArIE1hdGguc2luKGFuZ2xlKSAqIDEwMDApO1xuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmF5IGludGVyc2VjdGVkIGFueSB3YWxsc1xuICAgICAgICB2YXIgaW50ZXJzZWN0ID0gY3R4LmdldFdhbGxJbnRlcnNlY3Rpb24ocmF5LCB3YWxscyk7XG4gICAgICAgIC8vIFNhdmUgdGhlIGludGVyc2VjdGlvbiBvciB0aGUgZW5kIG9mIHRoZSByYXlcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiByYXkuZW5kO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIHRoZSBjbG9zZXN0IHdhbGwgaXMgdGhlIHNhbWUgYXMgdGhlIG9uZSBwcm92aWRlZCwgcmV0dXJuIGZhbHNlLlxuICAgIC8vIE90aGVyd2lzZSwgcmV0dXJuIHRoZSBuZXcgd2FsbC5cbiAgICBmdW5jdGlvbiBjaGVja0Nsb3Nlc3RXYWxsKGN0eCwgYW5nbGUsIGNsb3Nlc3RXYWxsKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIHJheSBmcm9tIHRoZSBsaWdodCB0byBhIHBvaW50IG9uIHRoZSBjaXJjbGVcbiAgICAgICAgdmFyIHJheSA9IG5ldyBQaGFzZXIuTGluZShnbG9iYWxzLnBsYXllci54LCBnbG9iYWxzLnBsYXllci55LFxuICAgICAgICAgICAgZ2xvYmFscy5wbGF5ZXIueCArIE1hdGguY29zKGFuZ2xlKSAqIDEwMDAsXG4gICAgICAgICAgICBnbG9iYWxzLnBsYXllci55ICsgTWF0aC5zaW4oYW5nbGUpICogMTAwMCk7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSByYXkgaW50ZXJzZWN0ZWQgYW55IHdhbGxzXG4gICAgICAgIHZhciBuZXdXYWxsID0gY3R4LmdldENsb3Nlc3RXYWxsKHJheSwgd2FsbHMpO1xuICAgICAgICAvLyBTYXZlIHRoZSBpbnRlcnNlY3Rpb24gb3IgdGhlIGVuZCBvZiB0aGUgcmF5XG4gICAgICAgIGlmICghbmV3V2FsbCB8fCAhY2xvc2VzdFdhbGwpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIGlmIChuZXdXYWxsLnN0YXJ0LnggPD0gY2xvc2VzdFdhbGwuc3RhcnQueCArIDMgJiZcbiAgICAgICAgICAgIG5ld1dhbGwuc3RhcnQueCA+PSBjbG9zZXN0V2FsbC5zdGFydC54IC0gMyAmJlxuICAgICAgICAgICAgbmV3V2FsbC5zdGFydC55IDw9IGNsb3Nlc3RXYWxsLnN0YXJ0LnkgKyAzICYmXG4gICAgICAgICAgICBuZXdXYWxsLnN0YXJ0LnkgPj0gY2xvc2VzdFdhbGwuc3RhcnQueSAtIDMgJiZcbiAgICAgICAgICAgIG5ld1dhbGwuZW5kLnggPD0gY2xvc2VzdFdhbGwuZW5kLnggKyAzICYmXG4gICAgICAgICAgICBuZXdXYWxsLmVuZC54ID49IGNsb3Nlc3RXYWxsLmVuZC54IC0gMyAmJlxuICAgICAgICAgICAgbmV3V2FsbC5lbmQueSA8PSBjbG9zZXN0V2FsbC5lbmQueSArIDMgJiZcbiAgICAgICAgICAgIG5ld1dhbGwuZW5kLnkgPj0gY2xvc2VzdFdhbGwuZW5kLnkgLSAzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3V2FsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFyIGFuZCBkcmF3IGEgc2hhZG93IGV2ZXJ5d2hlcmVcbiAgICB0aGlzLl9iaXRtYXAuY2xlYXIoKTtcbiAgICB0aGlzLl9iaXRtYXAudXBkYXRlKCk7XG4gICAgdGhpcy5fYml0bWFwLmZpbGwoMCwgMCwgMCwgdGhpcy5zaGFkb3dPcGFjaXR5KTtcbiAgICAvLyBEcmF3IHRoZSBcImxpZ2h0XCIgYXJlYXNcbiAgICB0aGlzLl9iaXRtYXAuY3R4LmJlZ2luUGF0aCgpO1xuICAgIHRoaXMuX2JpdG1hcC5jdHguZmlsbFN0eWxlID0gJ3JnYigyNTUsIDI1NSwgMjU1KSc7XG4gICAgdGhpcy5fYml0bWFwLmN0eC5zdHJva2VTdHlsZSA9ICdyZ2IoMjU1LCAyNTUsIDI1NSknO1xuICAgIC8vIE5vdGU6IHhPZmZzZXQgYW5kIHlPZmZzZXQgY29udmVydCBmcm9tIHdvcmxkIGNvb3JkaW5hdGVzIHRvIGNvb3JkaW5hdGVzIFxuICAgIC8vIGluc2lkZSBvZiB0aGUgYml0bWFwIG1hc2suIFRoZXJlIG1pZ2h0IGJlIGEgbW9yZSBlbGVnYW50IHdheSB0byBkbyB0aGlzXG4gICAgLy8gd2hlbiB3ZSBvcHRpbWl6ZS5cbiAgICAvLyBXaGVuIHRoZSBjYW1lcmEgc3RvcHMgbW92aW5nLCBmaXggdGhlIG9mZnNldC5cbiAgICB2YXIgeE9mZnNldDtcbiAgICBpZiAoZ2xvYmFscy5wbGF5ZXIueCA+IDQwMCAmJiBnbG9iYWxzLnBsYXllci54IDwgMTQwMCkge1xuICAgICAgICB4T2Zmc2V0ID0gZ2xvYmFscy5wbGF5ZXIueCAtIHRoaXMuZ2FtZS53aWR0aCAvIDI7XG4gICAgfSBlbHNlIGlmIChnbG9iYWxzLnBsYXllci54ID4gMTQwMCkge1xuICAgICAgICB4T2Zmc2V0ID0gMTQwMCAtIHRoaXMuZ2FtZS53aWR0aCAvIDI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgeE9mZnNldCA9IDA7XG4gICAgfVxuICAgIHZhciB5T2Zmc2V0O1xuICAgIGlmIChnbG9iYWxzLnBsYXllci55ID4gMzAwICYmIGdsb2JhbHMucGxheWVyLnkgPCAxMTQwKSB7XG4gICAgICAgIHlPZmZzZXQgPSBnbG9iYWxzLnBsYXllci55IC0gdGhpcy5nYW1lLmhlaWdodCAvIDI7XG4gICAgfSBlbHNlIGlmIChnbG9iYWxzLnBsYXllci55ID4gMTE0MCkge1xuICAgICAgICB5T2Zmc2V0ID0gMTE0MCAtIHRoaXMuZ2FtZS5oZWlnaHQgLyAyOztcbiAgICB9IGVsc2Uge1xuICAgICAgICB5T2Zmc2V0ID0gMDtcbiAgICB9XG4gICAgdGhpcy5fYml0bWFwLmN0eC5tb3ZlVG8ocG9pbnRzWzBdLnggLSB4T2Zmc2V0LCBwb2ludHNbMF0ueSAtIHlPZmZzZXQpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5fYml0bWFwLmN0eC5saW5lVG8ocG9pbnRzW2ldLnggLSB4T2Zmc2V0LCBwb2ludHNbaV0ueSAtIHlPZmZzZXQpO1xuICAgIH1cbiAgICB0aGlzLl9iaXRtYXAuY3R4LmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuX2JpdG1hcC5jdHguZmlsbCgpO1xuXG4gICAgLy8gRHJhdyBlYWNoIG9mIHRoZSByYXlzIG9uIHRoZSByYXlCaXRtYXBcbiAgICB0aGlzLl9yYXlCaXRtYXAuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5nYW1lLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0KTtcbiAgICB0aGlzLl9yYXlCaXRtYXAuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICB0aGlzLl9yYXlCaXRtYXAuY29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2IoMjU1LCAwLCAwKSc7XG4gICAgdGhpcy5fcmF5Qml0bWFwLmNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYigyNTUsIDAsIDApJztcbiAgICB0aGlzLl9yYXlCaXRtYXAuY29udGV4dC5tb3ZlVG8ocG9pbnRzWzBdLnggLSB4T2Zmc2V0LCBwb2ludHNbMF0ueSAtIHlPZmZzZXQpO1xuICAgIGZvcih2YXIgayA9IDA7IGsgPCBwb2ludHMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdGhpcy5fcmF5Qml0bWFwLmNvbnRleHQubW92ZVRvKGdsb2JhbHMucGxheWVyLnggLSB4T2Zmc2V0LCBnbG9iYWxzLnBsYXllci55IC0geU9mZnNldCk7XG4gICAgICAgIHRoaXMuX3JheUJpdG1hcC5jb250ZXh0LmxpbmVUbyhwb2ludHNba10ueCAtIHhPZmZzZXQsIHBvaW50c1trXS55IC0geU9mZnNldCk7XG4gICAgICAgIHRoaXMuX3JheUJpdG1hcC5jb250ZXh0LmZpbGxSZWN0KHBvaW50c1trXS54IC0geE9mZnNldCAtMixcbiAgICAgICAgICAgIHBvaW50c1trXS55IC0geU9mZnNldCAtIDIsIDQsIDQpO1xuICAgIH1cbiAgICB0aGlzLl9yYXlCaXRtYXAuY29udGV4dC5zdHJva2UoKTtcblxuICAgIC8vIFRoaXMganVzdCB0ZWxscyB0aGUgZW5naW5lIGl0IHNob3VsZCB1cGRhdGUgdGhlIHRleHR1cmUgY2FjaGVcbiAgICB0aGlzLl9iaXRtYXAuZGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX3JheUJpdG1hcC5kaXJ0eSA9IHRydWU7XG59O1xuXG5cbi8vIER5bmFtaWMgbGlnaHRpbmcvUmF5Y2FzdGluZy5cbi8vIFRoYW5rcywgeWFmZCFcbi8vIGh0dHA6Ly9nYW1lbWVjaGFuaWNleHBsb3Jlci5jb20vI3JheWNhc3RpbmctMlxuU2hhZG93TWFzay5wcm90b3R5cGUuZ2V0V2FsbEludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKHJheSwgd2FsbHMpIHtcbiAgICB2YXIgZGlzdGFuY2VUb1dhbGwgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgdmFyIGNsb3Nlc3RJbnRlcnNlY3Rpb24gPSBudWxsO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3YWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaW50ZXJzZWN0ID0gUGhhc2VyLkxpbmUuaW50ZXJzZWN0cyhyYXksIHdhbGxzW2ldKTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3Rpb25cbiAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMuZ2FtZS5tYXRoLmRpc3RhbmNlKHJheS5zdGFydC54LCByYXkuc3RhcnQueSxcbiAgICAgICAgICAgICAgICBpbnRlcnNlY3QueCwgaW50ZXJzZWN0LnkpO1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDwgZGlzdGFuY2VUb1dhbGwpIHtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZVRvV2FsbCA9IGRpc3RhbmNlO1xuICAgICAgICAgICAgICAgIGNsb3Nlc3RJbnRlcnNlY3Rpb24gPSBpbnRlcnNlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3RJbnRlcnNlY3Rpb247XG59O1xuXG4vLyBSZXR1cm4gdGhlIGNsb3Nlc3Qgd2FsbCB0aGF0IHRoaXMgcmF5IGludGVyc2VjdHMuXG5TaGFkb3dNYXNrLnByb3RvdHlwZS5nZXRDbG9zZXN0V2FsbCA9IGZ1bmN0aW9uKHJheSwgd2FsbHMpIHtcbiAgICB2YXIgZGlzdGFuY2VUb1dhbGwgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgdmFyIGNsb3Nlc3RXYWxsID0gbnVsbDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2FsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGludGVyc2VjdCA9IFBoYXNlci5MaW5lLmludGVyc2VjdHMocmF5LCB3YWxsc1tpXSk7XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3QgaW50ZXJzZWN0aW9uXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSB0aGlzLmdhbWUubWF0aC5kaXN0YW5jZShyYXkuc3RhcnQueCwgcmF5LnN0YXJ0LnksXG4gICAgICAgICAgICAgICAgaW50ZXJzZWN0LngsIGludGVyc2VjdC55KTtcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8IGRpc3RhbmNlVG9XYWxsKSB7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2VUb1dhbGwgPSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBjbG9zZXN0V2FsbCA9IHdhbGxzW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3RXYWxsO1xufTtcblxuU2hhZG93TWFzay5wcm90b3R5cGUudG9nZ2xlUmF5cyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRvZ2dsZSB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgcmF5cyB3aGVuIHRoZSBwb2ludGVyIGlzIGNsaWNrZWRcbiAgICBpZiAodGhpcy5fcmF5Qml0bWFwSW1hZ2UudmlzaWJsZSkge1xuICAgICAgICB0aGlzLl9yYXlCaXRtYXBJbWFnZS52aXNpYmxlID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmF5Qml0bWFwSW1hZ2UudmlzaWJsZSA9IHRydWU7XG4gICAgfVxufTtcblxuU2hhZG93TWFzay5wcm90b3R5cGUuZHJhd1dhbGxzID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbGlnaHRXYWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX2xpZ2h0V2FsbHNbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBsaW5lID0gdGhpcy5fbGlnaHRXYWxsc1tpXVtqXTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5kZWJ1Zy5nZW9tKGxpbmUsIFwicmdiYSgyNTUsMCwyNTUsMC43NSlcIik7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5TaGFkb3dNYXNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE86IGltcGxlbWVudCBhIGRlc3Ryb3kgdGhhdCBraWxscyB0aGUgdHdvIGJpdG1hcHMgYW5kIHRoZWlyIGFzc29jaWF0ZWRcbiAgICAvLyBpbWFnZSBvYmplY3RzXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJvdztcblxudmFyIEJhc2VXZWFwb24gPSByZXF1aXJlKFwiLi9iYXNlLXdlYXBvbi5qc1wiKTtcbnZhciBQcm9qZWN0aWxlID0gcmVxdWlyZShcIi4vYmFzZS1wcm9qZWN0aWxlLmpzXCIpO1xuXG5BcnJvdy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VXZWFwb24ucHJvdG90eXBlKTtcblxuLy8gb3B0aW9uYWwgc2V0dGluZ3MgZm9yIHByb2plY3RpbGVzXG52YXIgcHJvamVjdGlsZU9wdGlvbnMgPSB7XG4gICAgaXNEZXN0cnVjdGlibGU6IHRydWUsXG4gICAgcm90YXRlT25TZXR1cDogdHJ1ZSxcbiAgICBjYW5Cb3VuY2U6IHRydWUsXG4gICAgY2FuUGllcmNlOiB0cnVlLFxufTtcblxuZnVuY3Rpb24gQXJyb3coZ2FtZSwgcGFyZW50R3JvdXAsIHBsYXllcikge1xuICAgIEJhc2VXZWFwb24uY2FsbCh0aGlzLCBnYW1lLCBwYXJlbnRHcm91cCwgXCJBcnJvd1wiLCBwbGF5ZXIpO1xuICAgIHRoaXMuaW5pdEFtbW8oNDApO1xuICAgIHRoaXMuaW5pdENvb2xkb3duKDM2MCk7XG59XG5cbkFycm93LnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLmlzQWJsZVRvQXR0YWNrKCkgJiYgIXRoaXMuaXNBbW1vRW1wdHkoKSkge1xuICAgICAgICAvLyBGaW5kIHRyYWplY3RvcnlcbiAgICAgICAgdmFyIGFuZ2xlID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLmFuZ2xlKHRhcmdldFBvcyk7IC8vIFJhZGlhbnNcbiAgICAgICAgLy8gU3RhcnQgYnVsbGV0IGluIGEgcG9zaXRpb24gYWxvbmcgdGhhdCB0cmFqZWN0b3J5LCBidXQgaW4gZnJvbnQgb2YgXG4gICAgICAgIC8vIHRoZSBwbGF5ZXJcbiAgICAgICAgdmFyIHggPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueCArICgwLjk2ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICB2YXIgeSA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi55ICsgKDAuOTYgKiB0aGlzLl9wbGF5ZXIud2lkdGgpICogXG4gICAgICAgICAgICBNYXRoLnNpbihhbmdsZSk7XG5cbiAgICAgICAgdGhpcy5pbmNyZW1lbnRBbW1vKC0xKTtcblxuICAgICAgICB0aGlzLl9jcmVhdGVQcm9qZWN0aWxlKHgsIHksIGFuZ2xlKTtcbiAgICAgICAgdGhpcy5fc3RhcnRDb29sZG93bih0aGlzLl9jb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkFycm93LnByb3RvdHlwZS5fY3JlYXRlUHJvamVjdGlsZSA9IGZ1bmN0aW9uICh4LCB5LCBhbmdsZSkge1xuICAgIHZhciBwID0gbmV3IFByb2plY3RpbGUodGhpcy5nYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBcIndlYXBvbnMvYXJyb3dcIiwgdGhpcywgXG4gICAgICAgIHRoaXMuX3BsYXllciwgMTAwLCBhbmdsZSwgMzAwLCA1MDAsIHByb2plY3RpbGVPcHRpb25zKTtcbiAgICBwLnNjYWxlLnNldFRvKDEuNCwgMS40KTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBCYXNlUHJvamVjdGlsZTtcblxudmFyIFNwcml0ZVV0aWxzID0gcmVxdWlyZShcIi4uLy4uL2hlbHBlcnMvc3ByaXRlLXV0aWxpdGllcy5qc1wiKTtcbnZhciBGaXJlID0gcmVxdWlyZShcIi4vZmlyZS5qc1wiKTtcblxuQmFzZVByb2plY3RpbGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG5cbi8vIG9wdGlvbnMgaXMgYW4gb2JqZWN0IGNvbnRhaW5pbmcgc29tZSBvcHRpb25hbCBzZXR0aW5ncyBmb3IgdGhlXG4vLyBiYXNlIHByb2plY3RpbGUgY2xhc3Ncbi8vIC0gaXNEZXN0cnVjdGlibGUgLSBib29sXG4vLyAtIHJvdGF0ZU9uU2V0dXAgLSBib29sXG4vLyAtIGNhbkJvdW5jZSAtIGJvb2xcbi8vIC0gY2FuUGllcmNlIC0gYm9vbCAvLyBidWxsZXRzIGdvIHRocm91Z2ggZW5lbWllc1xuLy8gLSBjYW5CdXJuIC0gYm9vbFxuLy8gLSBkZWNheVJhdGUgLSByYW5nZSAoMCAtIDEuMClcbi8vIC0gZ3JvdyAtIGJvb2wgLy8gb2sgc2VyaW91c2x5IGknbSBub3Qgc3VyZSBhYm91dCB0aGlzIG9uZS4uLlxuLy8gLSB0cmFja2luZyAtIGJvb2xcbi8vIC0gdHJhY2tpbmdUYXJnZXQgLSAoeCwgeSkgKG9yIGFuIG9iamVjdCBtYXliZSwgaSBkb24ndCByZWFsbHkga25vdy4uLilcbmZ1bmN0aW9uIEJhc2VQcm9qZWN0aWxlKGdhbWUsIHgsIHksIGtleSwgZnJhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIsIGRhbWFnZSxcbiAgICBhbmdsZSwgc3BlZWQsIHJhbmdlLCBvcHRpb25zKSB7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksIGtleSwgZnJhbWUpO1xuICAgIHRoaXMuYW5jaG9yLnNldCgwLjUpO1xuICAgIHBhcmVudEdyb3VwLmFkZCh0aGlzKTtcblxuICAgIHRoaXMuX3BsYXllciA9IHBsYXllcjtcbiAgICB0aGlzLl9lbmVtaWVzID0gZ2FtZS5nbG9iYWxzLmdyb3Vwcy5lbmVtaWVzO1xuICAgIHRoaXMuX2RhbWFnZSA9IGRhbWFnZTtcbiAgICB0aGlzLl9zcGVlZCA9IHNwZWVkO1xuICAgIHRoaXMuX3JhbmdlID0gcmFuZ2U7XG4gICAgdGhpcy5faW5pdGlhbFBvcyA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgICB0aGlzLl9yZW1vdmUgPSBmYWxzZTsgLy8gY2hlY2sgaWYgQmFzZVByb2plY3RpbGUgc2hvdWxkIGJlIHJlbW92ZWQ/XG5cbiAgICAvLyBwcm9qZWN0aWxlIG9wdGlvbnNcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuaXNEZXN0cnVjdGlibGUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgdGhpcy5faXNEZXN0cnVjdGFibGUgPSBvcHRpb25zLmlzRGVzdHJ1Y3RpYmxlO1xuICAgIGVsc2UgdGhpcy5faXNEZXN0cnVjdGFibGUgPSB0cnVlO1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5yb3RhdGVPblNldHVwICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHRoaXMuX3JvdGF0ZU9uU2V0dXAgPSBvcHRpb25zLnJvdGF0ZU9uU2V0dXA7XG4gICAgZWxzZSB0aGlzLl9yb3RhdGVPblNldHVwID0gdHJ1ZTtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuY2FuUGllcmNlICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHRoaXMuX2NhblBpZXJjZSA9IG9wdGlvbnMuY2FuUGllcmNlO1xuICAgIGVsc2UgdGhpcy5fY2FuUGllcmNlID0gZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmNhbkJvdW5jZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICB0aGlzLl9jYW5Cb3VuY2UgPSBvcHRpb25zLmNhbkJvdW5jZTtcbiAgICBlbHNlIHRoaXMuX2NhbkJvdW5jZSA9IHRydWU7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmNhbkJ1cm4gIT09IHVuZGVmaW5lZClcbiAgICAgICAgdGhpcy5fY2FuQnVybiA9IG9wdGlvbnMuY2FuQnVybjtcbiAgICBlbHNlIHRoaXMuX2NhbkJ1cm4gPSBmYWxzZTtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuZGVjYXlSYXRlICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHRoaXMuX2RlY2F5UmF0ZSA9IG9wdGlvbnMuZGVjYXlSYXRlO1xuICAgIGVsc2UgdGhpcy5fZGVjYXlSYXRlID0gMS4wO1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5ncm93ICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHRoaXMuX2dyb3cgPSBvcHRpb25zLmdyb3c7XG4gICAgZWxzZSB0aGlzLl9ncm93ID0gZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnRyYWNraW5nICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy50cmFja2luZ1JhZGl1cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3RyYWNraW5nID0gb3B0aW9ucy50cmFja2luZztcbiAgICAgICAgdGhpcy5fdHJhY2tpbmdUYXJnZXQgPSBvcHRpb25zLnRyYWNraW5nVGFyZ2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3RyYWNraW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3RyYWNraW5nVGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gICAgLy8gSWYgcm90YXRlT25TZXR1cCBvcHRpb24gaXMgdHJ1ZSwgcm90YXRlIHByb2plY3RpbGUgdG8gZmFjZSBpbiB0aGVcbiAgICAvLyByaWdodCBkaXJlY3Rpb24uIFNwcml0ZXMgYXJlIHNhdmVkIGZhY2luZyB1cCAoOTAgZGVncmVlcyksIHNvIHdlXG4gICAgLy8gbmVlZCB0byBvZmZzZXQgdGhlIGFuZ2xlXG4gICAgaWYgKHRoaXMuX3JvdGF0ZU9uU2V0dXApXG4gICAgICAgIHRoaXMucm90YXRpb24gPSBhbmdsZSArIChNYXRoLlBJIC8gMik7IC8vIFJhZGlhbnNcbiAgICBlbHNlXG4gICAgICAgIHRoaXMucm90YXRpb24gPSBhbmdsZTtcblxuICAgIC8vIElmIGdyb3csIHRoZSBidWxsZXQgZ3Jvd3MgZnJvbSBzaXplIDAuMjUgdG8gMS4wMFxuICAgIGlmICh0aGlzLl9ncm93KSB7XG4gICAgICAgIHRoaXMuc2NhbGUuc2V0VG8oMC4yNSwgMC4yNSk7XG4gICAgfVxuXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzKTtcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUudmVsb2NpdHlGcm9tQW5nbGUoYW5nbGUgKiAxODAgLyBNYXRoLlBJLCBcbiAgICAgICAgdGhpcy5fc3BlZWQsIHRoaXMuYm9keS52ZWxvY2l0eSk7XG5cbiAgICB0aGlzLnNhdEJvZHkgPSB0aGlzLmdhbWUuZ2xvYmFscy5wbHVnaW5zLnNhdEJvZHkuYWRkQm94Qm9keSh0aGlzKTtcbn1cblxuQmFzZVByb2plY3RpbGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENvbGxpc2lvbnMgd2l0aCB0aGUgdGlsZW1hcFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMsIHRoaXMuZ2FtZS5nbG9iYWxzLnRpbGVNYXBMYXllcixcbiAgICAgICAgdGhpcy5fb25Db2xsaWRlV2l0aE1hcCk7XG5cbiAgICAvLyBJZiBhIGRlY2F0ZSByYXRlIHdhcyBzZXQsIGFwcGx5IGl0IHRvIHRoZSB2ZWxvY2l0eS5cbiAgICBpZiAodGhpcy5fZGVjYXlSYXRlKSB7XG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS54ID0gdGhpcy5ib2R5LnZlbG9jaXR5LnggKiB0aGlzLl9kZWNheVJhdGU7XG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS55ID0gdGhpcy5ib2R5LnZlbG9jaXR5LnkgKiB0aGlzLl9kZWNheVJhdGU7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGdyb3cgZmxhZyB3YXMgc2V0LCBpbmNyZWFzZSB0aGUgc2NhbGUgb2YgdGhlIHByb2plY3RpbGUgZXZlcnkgZnJhbWUuXG4gICAgLy8gVGhpcyBtaWdodCBiZSBhIGhhY2ssIGJ1dCBpZiBpdCBhcHBsaWNhYmxlIGVsc2V3aGVyZSB3ZSBjYW4gZmlndXJlXG4gICAgLy8gc29tZXRoaW5nIG1vcmUgZ2VuZXJpYyBvdXQuXG4gICAgaWYgKHRoaXMuX2dyb3cpIHtcbiAgICAgICAgdmFyIHggPSB0aGlzLnNjYWxlLnggKiAxLjAyNjQ7XG4gICAgICAgIHZhciB5ID0gdGhpcy5zY2FsZS55ICogMS4wMjY0O1xuICAgICAgICB0aGlzLnNjYWxlLnNldFRvKHgsIHkpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwcm9qZWN0aWxlIGNhbiBidXJuLCBjaGVjayBlYWNoIHRpbGUgZm9yIGEgZmlyZS5cbiAgICAvLyBJZiBvbmUgZXhpc3RzLCBpZ25vcmUgdGhlIHRpbGUgYW5kIGtlZXAgbW92aW5nLiAgSWYgdGhlcmUgaXMgbm8gZmlyZSxcbiAgICAvLyBkZXN0cm95IHRoZSBwcm9qZWN0aWxlIGFuZCBjcmVhdGUgYSBmaXJlLlxuICAgIGlmICh0aGlzLl9jYW5CdXJuICYmIHRoaXMuY2hlY2tUaWxlTWFwTG9jYXRpb24odGhpcy5wb3NpdGlvbi54LFxuICAgICAgICB0aGlzLnBvc2l0aW9uLnkpKSB7XG4gICAgICAgIC8vIHRoaXMgaXNuJ3Qgd29ya2luZyB5ZXQuLi5cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcHJvamVjdGlsZSB0cmFja3MsIGNoZWNrIGlmIHRhcmdldCBpcyB3aXRoaW4gdGhlIHRyYWNraW5nIHJhZGl1cy5cbiAgICAvLyBJZiBpdCBpcywgYmVnaW4gdHJhY2tpbmcuICBPdGhlcndpc2UsIGNvbnRpbnVlIG9uIHRoZSBpbml0aWFpbCB0cmFqZWN0b3J5LlxuICAgIC8vIE5PVEUocmV4KTogSE1NTU0gVGhpcyBpc24ndCBxdWl0ZSB3b3JraW5nLi4uXG4gICAgaWYgKHRoaXMuX3RyYWNraW5nKSB7XG5cbiAgICB9XG59XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5wb3N0VXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFVwZGF0ZSBhcmNhZGUgcGh5c2ljc1xuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLnBvc3RVcGRhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAvLyBDaGVjayBvdmVybGFwXG4gICAgU3ByaXRlVXRpbHMuY2hlY2tPdmVybGFwV2l0aEdyb3VwKHRoaXMsIHRoaXMuX2VuZW1pZXMsIFxuICAgICAgICB0aGlzLl9vbkNvbGxpZGVXaXRoRW5lbXksIHRoaXMpO1xuICAgIC8vIElmIHByb2plY3RpbGUgaGFzIGNvbGxpZGVkIHdpdGggYW4gZW5lbXksIG9yIGlzIG91dCBvZiByYW5nZSwgcmVtb3ZlIGl0XG4gICAgaWYgKCh0aGlzLnBvc2l0aW9uLmRpc3RhbmNlKHRoaXMuX2luaXRpYWxQb3MpID5cbiAgICAgICAgdGhpcy5fcmFuZ2UpIHx8ICh0aGlzLl9pc0Rlc3RydWN0YWJsZSAmJiB0aGlzLl9yZW1vdmUpKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgIH1cbn07XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLmRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5fb25Db2xsaWRlV2l0aE1hcCA9IGZ1bmN0aW9uIChzZWxmLCBtYXApIHtcbiAgICBpZiAoc2VsZi5faXNEZXN0cnVjdGFibGUpIHtcbiAgICAgICAgc2VsZi5fcmVtb3ZlID0gdHJ1ZTtcbiAgICB9XG59O1xuXG5CYXNlUHJvamVjdGlsZS5wcm90b3R5cGUuX29uQ29sbGlkZVdpdGhFbmVteSA9IGZ1bmN0aW9uIChzZWxmLCBlbmVteSkge1xuICAgIHZhciBpc0tpbGxlZCA9IGVuZW15LnRha2VEYW1hZ2UodGhpcy5fZGFtYWdlKTtcbiAgICBpZiAoaXNLaWxsZWQpIHRoaXMuX3BsYXllci5pbmNyZW1lbnRDb21ibygxKTtcbiAgICBpZiAoc2VsZi5faXNEZXN0cnVjdGFibGUgJiYgIXNlbGYuX2NhblBpZXJjZSkge1xuICAgICAgICBzZWxmLl9yZW1vdmUgPSB0cnVlO1xuICAgIH1cbn07XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5jaGVja1RpbGVNYXBMb2NhdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB2YXIgY2hlY2tUaWxlID0gdGhpcy5nYW1lLmdsb2JhbHMudGlsZU1hcC5nZXRUaWxlV29ybGRYWSh4LCB5LCAzNiwgMzYsXG4gICAgICAgIHRoaXMuZ2FtZS5nbG9iYWxzLnRpbGVNYXBMYXllcik7XG5cbiAgICBpZiAoY2hlY2tUaWxlID09PSBudWxsIHx8IGNoZWNrVGlsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn1cblxuQmFzZVByb2plY3RpbGUucHJvdG90eXBlLnRyYWNrVGFyZ2V0ID0gZnVuY3Rpb24oc2VsZiwgdGFyZ2V0KSB7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIGluIHJhbmdlLCBjYWxjdWxhdGUgdGhlIGFjY2VsZXJhdGlvbiBiYXNlZCBvbiB0aGUgXG4gICAgLy8gZGlyZWN0aW9uIHRoaXMgc3ByaXRlIG5lZWRzIHRvIHRyYXZlbCB0byBoaXQgdGhlIHRhcmdldFxuICAgIHZhciBkaXN0YW5jZSA9IHRoaXMucG9zaXRpb24uZGlzdGFuY2UodGFyZ2V0LnBvc2l0aW9uKTtcbiAgICB2YXIgYW5nbGUgPSB0aGlzLnBvc2l0aW9uLmFuZ2xlKHRhcmdldC5wb3NpdGlvbik7XG4gICAgdmFyIHRhcmdldFNwZWVkID0gZGlzdGFuY2UgLyB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcbiAgICB2YXIgbWFnbml0dWRlID0gTWF0aC5taW4oMTUsIHRhcmdldFNwZWVkKTtcbiAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IHRhcmdldFNwZWVkICogTWF0aC5jb3MoYW5nbGUpO1xuICAgIHRoaXMuYm9keS52ZWxvY2l0eS55ID0gdGFyZ2V0U3BlZWQgKiBNYXRoLnNpbihhbmdsZSk7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBCYXNlV2VhcG9uO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vLi4vaGVscGVycy91dGlsaXRpZXMuanNcIik7XG5cbkJhc2VXZWFwb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuR3JvdXAucHJvdG90eXBlKTtcblxudmFyIElORklOSVRFX0FNTU8gPSAtMTtcblxuZnVuY3Rpb24gQmFzZVdlYXBvbihnYW1lLCBwYXJlbnRHcm91cCwgd2VhcG9uTmFtZSwgcGxheWVyKSB7XG4gICAgUGhhc2VyLkdyb3VwLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50R3JvdXAsIHdlYXBvbk5hbWUpO1xuXG4gICAgdGhpcy5fbmFtZSA9IHdlYXBvbk5hbWU7XG4gICAgdGhpcy5fcGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuX2VuZW1pZXMgPSB0aGlzLmdhbWUuZ2xvYmFscy5ncm91cHMuZW5lbWllcztcblxuICAgIHRoaXMuX2Nvb2xkb3duVGltZXIgPSB0aGlzLmdhbWUudGltZS5jcmVhdGUoZmFsc2UpO1xuICAgIHRoaXMuX2Nvb2xkb3duVGltZXIuc3RhcnQoKTtcbiAgICB0aGlzLl9hYmxlVG9BdHRhY2sgPSB0cnVlO1xufVxuXG5CYXNlV2VhcG9uLnByb3RvdHlwZS5pbml0QW1tbyA9IGZ1bmN0aW9uICh0b3RhbEFtbW8sIGN1cnJlbnRBbW1vKSB7XG4gICAgdGhpcy5fdG90YWxBbW1vID0gdG90YWxBbW1vO1xuICAgIHRoaXMuX2N1cnJlbnRBbW1vID0gdXRpbHMuZGVmYXVsdChjdXJyZW50QW1tbywgdG90YWxBbW1vKTtcbn07XG5cbkJhc2VXZWFwb24ucHJvdG90eXBlLmluaXRDb29sZG93biA9IGZ1bmN0aW9uIChjb29sZG93blRpbWUsIFxuICAgIHNwZWNpYWxDb29sZG93blRpbWUpIHtcbiAgICAvLyBTZXQgdXAgYSB0aW1lciB0aGF0IGRvZXNuJ3QgYXV0b2Rlc3Ryb3kgaXRzZWxmXG4gICAgdGhpcy5fY29vbGRvd25UaW1lID0gY29vbGRvd25UaW1lO1xuICAgIHRoaXMuX3NwZWNpYWxDb29sZG93blRpbWUgPSB1dGlscy5kZWZhdWx0KHNwZWNpYWxDb29sZG93blRpbWUsIFxuICAgICAgICBjb29sZG93blRpbWUpO1xufTtcblxuQmFzZVdlYXBvbi5wcm90b3R5cGUuaXNBYmxlVG9BdHRhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FibGVUb0F0dGFjaztcbn07XG5cbkJhc2VXZWFwb24ucHJvdG90eXBlLl9zdGFydENvb2xkb3duID0gZnVuY3Rpb24gKHRpbWUpIHtcbiAgICBpZiAoIXRoaXMuX2FibGVUb0F0dGFjaykgcmV0dXJuO1xuICAgIHRoaXMuX2FibGVUb0F0dGFjayA9IGZhbHNlO1xuICAgIHRoaXMuX2Nvb2xkb3duVGltZXIuYWRkKHRpbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fYWJsZVRvQXR0YWNrID0gdHJ1ZTtcbiAgICB9LCB0aGlzKTtcbn07XG5cbkJhc2VXZWFwb24ucHJvdG90eXBlLmlzQW1tb0VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICgodGhpcy5fY3VycmVudEFtbW8gPD0gMCkgJiYgKHRoaXMuX2N1cnJlbnRBbW1vICE9PSBJTkZJTklURV9BTU1PKSk7XG59O1xuXG5CYXNlV2VhcG9uLnByb3RvdHlwZS5nZXRBbW1vID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRBbW1vO1xufTtcblxuQmFzZVdlYXBvbi5wcm90b3R5cGUuaW5jcmVtZW50QW1tbyA9IGZ1bmN0aW9uKGFtdCkge1xuICAgIGlmICh0aGlzLl90b3RhbEFtbW8gPiAodGhpcy5fY3VycmVudEFtbW8gKyBhbXQpKSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRBbW1vICs9IGFtdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jdXJyZW50QW1tbyA9IHRoaXMuX3RvdGFsQW1tbztcbiAgICAgICAgY29uc29sZS5sb2coXCJ0b28gbXVjaCBhbW1vIVwiKTtcbiAgICB9XG59O1xuXG5CYXNlV2VhcG9uLnByb3RvdHlwZS5maWxsQW1tbyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2N1cnJlbnRBbW1vID0gdGhpcy5fdG90YWxBbW1vO1xufTtcblxuQmFzZVdlYXBvbi5wcm90b3R5cGUuZW1wdHlBbW1vID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fY3VycmVudEFtbW8gPSAwO1xufTtcblxuQmFzZVdlYXBvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jb29sZG93blRpbWVyLmRlc3Ryb3koKTtcblxuICAgIC8vIENhbGwgdGhlIHN1cGVyIGNsYXNzIGFuZCBwYXNzIGFsb25nIGFueSBhcnVnbWVudHNcbiAgICBQaGFzZXIuR3JvdXAucHJvdG90eXBlLmRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBCZWFtO1xuXG52YXIgU3ByaXRlVXRpbHMgPSByZXF1aXJlKFwiLi4vLi4vaGVscGVycy9zcHJpdGUtdXRpbGl0aWVzLmpzXCIpO1xuXG5CZWFtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBCZWFtKGdhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIpIHtcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgMCwgMCwgXCJhc3NldHNcIiwgXCJ3ZWFwb25zL2JlYW1cIik7XG4gICAgdGhpcy5hbmNob3Iuc2V0KDAsIDAuNSk7XG4gICAgcGFyZW50R3JvdXAuYWRkKHRoaXMpO1xuICAgIHRoaXMuc2VuZFRvQmFjaygpOyAvLyBVbmRlcm5lYXRoIHBsYXllclxuICAgIFxuICAgIHRoaXMuX3RpbWVyID0gZ2FtZS50aW1lLmNyZWF0ZShmYWxzZSk7XG4gICAgdGhpcy5fdGltZXIuc3RhcnQoKTtcbiAgICBcbiAgICB0aGlzLl9jb29sZG93blRpbWUgPSAxMDAwO1xuICAgIHRoaXMuX2F0dGFja0R1cmF0aW9uID0gMjAwMDtcbiAgICB0aGlzLl9pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgIHRoaXMuX2FibGVUb0F0dGFjayA9IHRydWU7XG4gICAgdGhpcy5fZGFtYWdlID0gMTA7XG4gICAgdGhpcy5fcGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuX2VuZW1pZXMgPSBnYW1lLmdsb2JhbHMuZ3JvdXBzLmVuZW1pZXM7XG5cbiAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcbiAgICB0aGlzLl9iZWFtU2l6ZSA9IHRoaXMuaGVpZ2h0O1xuICAgIHRoaXMuX3JhbmdlID0gdGhpcy53aWR0aDtcblxuICAgIHRoaXMuc2F0Qm9keSA9IHRoaXMuZ2FtZS5nbG9iYWxzLnBsdWdpbnMuc2F0Qm9keS5hZGRCb3hCb2R5KHRoaXMpO1xufVxuXG5CZWFtLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLl9pc0F0dGFja2luZykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLmNvcHlGcm9tKHRoaXMuX3BsYXllci5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMucm90YXRpb24gPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24uYW5nbGUodGFyZ2V0UG9zKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2FibGVUb0F0dGFjaykge1xuICAgICAgICB0aGlzLl9zdGFydEF0dGFjayh0YXJnZXRQb3MpO1xuICAgIH1cbn07XG5cbkJlYW0ucHJvdG90eXBlLnBvc3RVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUucG9zdFVwZGF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh0aGlzLl9pc0F0dGFja2luZykge1xuICAgICAgICAvLyBVcGRhdGUgZ3JhcGhpY3MgdG8gcGxheWVyIHBvc2l0aW9uLiBOb3RlOiB0aGlzIHNlZW1zIGZyYWdpbGUuIEl0IHRoZVxuICAgICAgICAvLyBwbGF5ZXIgcG9zdFVwZGF0ZXMgQUZURVIgdGhpcyBzcHJpdGUsIHRoaXMgc3ByaXRlIHdpbGwgYmUgb2ZmIGJ5IGFcbiAgICAgICAgLy8gZnJhbWUncyB3b3J0aCBvZiBwaHlzaWNzLlxuICAgICAgICB0aGlzLnBvc2l0aW9uLmNvcHlGcm9tKHRoaXMuX3BsYXllci5wb3NpdGlvbik7XG4gICAgICAgIC8vIENoZWNrIG92ZXJsYXBkXG4gICAgICAgIFNwcml0ZVV0aWxzLmNoZWNrT3ZlcmxhcFdpdGhHcm91cCh0aGlzLCB0aGlzLl9lbmVtaWVzLCBcbiAgICAgICAgICAgIHRoaXMuX29uQ29sbGlkZVdpdGhFbmVteSwgdGhpcyk7XG4gICAgfVxufTtcblxuQmVhbS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl90aW1lci5kZXN0cm95KCk7XG4gICAgUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUuZGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuQmVhbS5wcm90b3R5cGUuX3N0YXJ0QXR0YWNrID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIHRoaXMucG9zaXRpb24uY29weUZyb20odGhpcy5fcGxheWVyLnBvc2l0aW9uKTtcbiAgICB0aGlzLnJvdGF0aW9uID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLmFuZ2xlKHRhcmdldFBvcyk7XG4gICAgdGhpcy5faXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XG4gICAgdGhpcy5fdGltZXIuYWRkKHRoaXMuX2F0dGFja0R1cmF0aW9uLCB0aGlzLl9zdG9wQXR0YWNrLmJpbmQodGhpcykpO1xufTtcblxuQmVhbS5wcm90b3R5cGUuX3N0b3BBdHRhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgdGhpcy5faXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9hYmxlVG9BdHRhY2sgPSBmYWxzZTtcbiAgICAvLyBDb29sZG93blxuICAgIHRoaXMuX3RpbWVyLmFkZCh0aGlzLl9jb29sZG93blRpbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fYWJsZVRvQXR0YWNrID0gdHJ1ZTtcbiAgICB9LCB0aGlzKTtcbn07XG5cbkJlYW0ucHJvdG90eXBlLl9vbkNvbGxpZGVXaXRoRW5lbXkgPSBmdW5jdGlvbiAoc2VsZiwgZW5lbXkpIHtcbiAgICB2YXIgaXNLaWxsZWQgPSBlbmVteS50YWtlRGFtYWdlKHRoaXMuX2RhbWFnZSk7XG4gICAgaWYgKGlzS2lsbGVkKSB0aGlzLl9wbGF5ZXIuaW5jcmVtZW50Q29tYm8oMSk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gRXhwbG9zaXZlO1xuXG52YXIgQmFzZVdlYXBvbiA9IHJlcXVpcmUoXCIuL2Jhc2Utd2VhcG9uLmpzXCIpO1xuXG5FeHBsb3NpdmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlV2VhcG9uLnByb3RvdHlwZSk7XG5cbmZ1bmN0aW9uIEV4cGxvc2l2ZShnYW1lLCBwYXJlbnRHcm91cCwgcGxheWVyKSB7XG4gICAgQmFzZVdlYXBvbi5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudEdyb3VwLCBcIkV4cGxvc2l2ZVwiLCBwbGF5ZXIpO1xuICAgIHRoaXMuaW5pdEFtbW8oMzApO1xuICAgIHRoaXMuaW5pdENvb2xkb3duKDE1MCk7XG59XG5cbkV4cGxvc2l2ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uICh0YXJnZXRQb3MpIHtcbiAgICBpZiAodGhpcy5pc0FibGVUb0F0dGFjaygpICYmICF0aGlzLmlzQW1tb0VtcHR5KCkpIHtcbiAgICAgICAgLy8gRmluZCB0cmFqZWN0b3J5XG4gICAgICAgIHZhciBhbmdsZSA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5hbmdsZSh0YXJnZXRQb3MpOyAvLyBSYWRpYW5zXG4gICAgICAgIC8vIFN0YXJ0IGJ1bGxldCBpbiBhIHBvc2l0aW9uIGFsb25nIHRoYXQgdHJhamVjdG9yeSwgYnV0IGluIGZyb250IG9mIFxuICAgICAgICAvLyB0aGUgcGxheWVyXG4gICAgICAgIHZhciB4ID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLnggKyAoMC43NSAqIHRoaXMuX3BsYXllci53aWR0aCkgKiBcbiAgICAgICAgICAgIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHkgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueSArICgwLjc1ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgTWF0aC5zaW4oYW5nbGUpO1xuXG4gICAgICAgIHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoeCwgeSwgYW5nbGUpO1xuXG4gICAgICAgIHRoaXMuaW5jcmVtZW50QW1tbygtMSk7XG5cbiAgICAgICAgdGhpcy5fc3RhcnRDb29sZG93bih0aGlzLl9jb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkV4cGxvc2l2ZS5wcm90b3R5cGUuc3BlY2lhbEZpcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNBYmxlVG9BdHRhY2soKSAmJiB0aGlzLmdldEFtbW8oKSA+IDApIHtcbiAgICAgICAgLy8gY3JlYXRlIDggYnVsbGV0cyBldmVubHkgZGlzdHJpYnV0ZWQgaW4gYSBjaXJjbGVcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IGJ1bGxldCBpbiBhIHBvc2l0aW9uIGFsb25nIHRoYXQgdHJhamVjdG9yeSwgYnV0IGluIGZyb250XG4gICAgICAgICAgICAvLyBvZiB0aGUgcGxheWVyXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSAoaSooTWF0aC5QSS80KSk7XG4gICAgICAgICAgICB2YXIgeCA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi54ICsgKDAuNzUgKiB0aGlzLl9wbGF5ZXIud2lkdGgpICogXG4gICAgICAgICAgICAgICAgTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICAgICAgdmFyIHkgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueSArICgwLjc1ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgICAgIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoeCwgeSwgYW5nbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbmNyZW1lbnRBbW1vKC04KTtcblxuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKHRoaXMuX3NwZWNpYWxDb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkV4cGxvc2l2ZS5wcm90b3R5cGUuX2NyZWF0ZVByb2plY3RpbGUgPSBmdW5jdGlvbiAoeCwgeSwgYW5nbGUpIHtcbiAgICBuZXcgQmFzZVByb2plY3RpbGUodGhpcy5nYW1lLCB4LCB5LCB0aGlzLCB0aGlzLl9wbGF5ZXIsIGFuZ2xlKTtcbn07XG5cblxudmFyIFNwcml0ZVV0aWxzID0gcmVxdWlyZShcIi4uLy4uL2hlbHBlcnMvc3ByaXRlLXV0aWxpdGllcy5qc1wiKTtcblxuQmFzZVByb2plY3RpbGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG5cbmZ1bmN0aW9uIEJhc2VQcm9qZWN0aWxlKGdhbWUsIHgsIHksIHBhcmVudEdyb3VwLCBwbGF5ZXIsIGFuZ2xlKSB7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHkpO1xuICAgIHRoaXMuYW5jaG9yLnNldCgwLjUpO1xuICAgIHBhcmVudEdyb3VwLmFkZCh0aGlzKTtcblxuICAgIHRoaXMuX2dyYXBoaWNzID0gZ2FtZS5tYWtlLmdyYXBoaWNzKDAsIDApO1xuICAgIHRoaXMuYWRkQ2hpbGQodGhpcy5fZ3JhcGhpY3MpO1xuXG4gICAgLy8gRHJhdyBjaXJjbGVcbiAgICB0aGlzLl9ncmFwaGljcy5iZWdpbkZpbGwoMHgwMDAwMDApO1xuICAgIHRoaXMuX2dyYXBoaWNzLmRyYXdDaXJjbGUoMCwgMCwgMTApO1xuICAgIHRoaXMuX2dyYXBoaWNzLmVuZEZpbGwoKTtcblxuICAgIHRoaXMuX3RpbWVyID0gZ2FtZS50aW1lLmNyZWF0ZShmYWxzZSk7XG4gICAgdGhpcy5fdGltZXIuc3RhcnQoKTtcblxuICAgIHRoaXMuX2hhc0V4cGxvZGVkID0gZmFsc2U7XG4gICAgdGhpcy5fZGFtYWdlID0gMTAwO1xuICAgIHRoaXMuX3JhbmdlID0gNDAwO1xuICAgIHRoaXMuX3NwZWVkID0gMjAwO1xuXG4gICAgdGhpcy5fcGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuX2VuZW1pZXMgPSBnYW1lLmdsb2JhbHMuZ3JvdXBzLmVuZW1pZXM7XG5cbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS52ZWxvY2l0eUZyb21BbmdsZShhbmdsZSAqIDE4MCAvIE1hdGguUEksIFxuICAgICAgICB0aGlzLl9zcGVlZCwgdGhpcy5ib2R5LnZlbG9jaXR5KTtcblxuICAgIHRoaXMuc2F0Qm9keSA9IHRoaXMuZ2FtZS5nbG9iYWxzLnBsdWdpbnMuc2F0Qm9keS5hZGRDaXJjbGVCb2R5KHRoaXMsIDUpO1xufVxuXG5CYXNlUHJvamVjdGlsZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ29sbGlzaW9ucyB3aXRoIHRoZSB0aWxlbWFwXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcywgdGhpcy5nYW1lLmdsb2JhbHMudGlsZU1hcExheWVyLCBcbiAgICAgICAgdGhpcy5fb25Db2xsaWRlV2l0aE1hcCk7XG59XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5leHBsb2RlID0gZnVuY3Rpb24gKCkgeyAgICBcbiAgICB0aGlzLl9oYXNFeHBsb2RlZCA9IHRydWU7XG4gICAgLy8gU3dpdGNoIHRvIGV4cGxvc2lvbiBjaXJjbGUgU0FUIGJvZHkgXG4gICAgdGhpcy5nYW1lLmdsb2JhbHMucGx1Z2lucy5zYXRCb2R5LnJlbW92ZUJvZHkodGhpcy5zYXRCb2R5KTtcbiAgICB0aGlzLnNhdEJvZHkgPSB0aGlzLmdhbWUuZ2xvYmFscy5wbHVnaW5zLnNhdEJvZHkuYWRkQ2lyY2xlQm9keSh0aGlzLCBcbiAgICAgICAgdGhpcy5fcmFuZ2UgLyAyKTtcbiAgICAvLyBTdG9wIG1vdmluZ1xuICAgIHRoaXMuYm9keS52ZWxvY2l0eS5zZXQoMCk7XG4gICAgLy8gRHJhdyBleHBsb3Npb24gY2lyY2xlXG4gICAgdGhpcy5fZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICB0aGlzLl9ncmFwaGljcy5iZWdpbkZpbGwoMHgwMDAwMDAsIDAuNSk7XG4gICAgdGhpcy5fZ3JhcGhpY3MuZHJhd0NpcmNsZSgwLCAwLCB0aGlzLl9yYW5nZSk7XG4gICAgdGhpcy5fZ3JhcGhpY3MuZW5kRmlsbCgpO1xuICAgIC8vIENoZWNrIGV4cGxvc2lvbiBvdmVybGFwXG4gICAgU3ByaXRlVXRpbHMuY2hlY2tPdmVybGFwV2l0aEdyb3VwKHRoaXMsIHRoaXMuX2VuZW1pZXMsIHRoaXMuX29uRXhwbG9kZUVuZW15LFxuICAgICAgICB0aGlzKTtcbiAgICAvLyBTY2hlZHVsZWQgZGVzdHJ1Y3Rpb24gc2xpZ2h0bHkgaW4gdGhlIGZ1dHVyZVxuICAgIHRoaXMuX3RpbWVyLmFkZCgxMDAsIHRoaXMuZGVzdHJveSwgdGhpcyk7XG59O1xuXG5CYXNlUHJvamVjdGlsZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9ncmFwaGljcy5kZXN0cm95KCk7XG4gICAgdGhpcy5fdGltZXIuZGVzdHJveSgpO1xuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLmRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5wb3N0VXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFVwZGF0ZSBhcmNhZGUgcGh5c2ljc1xuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLnBvc3RVcGRhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAvLyBDaGVjayBvdmVybGFwIGZvciB0aGUgbm9uLWV4cGxvZGVkIHByb2plY3RpbGVcbiAgICBpZiAoIXRoaXMuX2hhc0V4cGxvZGVkKSB7XG4gICAgICAgIFNwcml0ZVV0aWxzLmNoZWNrT3ZlcmxhcFdpdGhHcm91cCh0aGlzLCB0aGlzLl9lbmVtaWVzLCBcbiAgICAgICAgICAgIHRoaXMuX29uQ29sbGlkZVdpdGhFbmVteSwgdGhpcyk7XG4gICAgfVxuICAgIC8vIElmIHByb2plY3RpbGUgaGFzIGNvbGxpZGVkIHdpdGggYW4gZW5lbXksIG9yIGlzIG91dCBvZiByYW5nZSwgcmVtb3ZlIGl0XG4gICAgaWYgKCh0aGlzLl9pc0Rlc3RydWN0YWJsZSAmJiB0aGlzLl9yZW1vdmUpKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgIH1cbn07XG5cbkJhc2VQcm9qZWN0aWxlLnByb3RvdHlwZS5fb25Db2xsaWRlV2l0aE1hcCA9IGZ1bmN0aW9uIChzZWxmLCBtYXApIHtcbiAgICBpZiAoc2VsZi5faXNEZXN0cnVjdGFibGUpIHtcbiAgICAgICAgc2VsZi5fcmVtb3ZlID0gdHJ1ZTtcbiAgICB9XG4gICAgc2VsZi5leHBsb2RlKCk7XG59O1xuXG5CYXNlUHJvamVjdGlsZS5wcm90b3R5cGUuX29uQ29sbGlkZVdpdGhFbmVteSA9IGZ1bmN0aW9uIChzZWxmLCBlbmVteSkge1xuICAgIHNlbGYuZXhwbG9kZSgpO1xufTtcblxuQmFzZVByb2plY3RpbGUucHJvdG90eXBlLl9vbkV4cGxvZGVFbmVteSA9IGZ1bmN0aW9uIChzZWxmLCBlbmVteSkge1xuICAgIHZhciBpc0tpbGxlZCA9IGVuZW15LnRha2VEYW1hZ2UodGhpcy5fZGFtYWdlKTtcbiAgICBpZiAoc2VsZi5faXNEZXN0cnVjdGFibGUpIHNlbGYuX3JlbW92ZSA9IHRydWU7XG4gICAgc2VsZi5leHBsb2RlKCk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gRmlyZTtcblxuRmlyZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblxuZnVuY3Rpb24gRmlyZShnYW1lLCB4LCB5KSB7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksIFwiYXNzZXRzXCIsIFwiZW5lbXkwMS9kaWUtMDJcIik7XG4gICAgdGhpcy5hbmNob3Iuc2V0KDAuNSk7XG5cbiAgICB0aGlzLl9pbml0aWFsUG9zID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuXG4gICAgLy8gQ29uZmlndXJlIHBoeXNpY3NcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzKTtcbiAgICB0aGlzLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICB0aGlzLmJvZHkuc2V0Q2lyY2xlKHRoaXMud2lkdGggLyAyICogMC44KTsgLy8gRnVkZ2UgZmFjdG9yXG59XG5cbkZpcmUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUuZGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gRmxhbWV0aHJvd2VyO1xuXG52YXIgQmFzZVdlYXBvbiA9IHJlcXVpcmUoXCIuL2Jhc2Utd2VhcG9uLmpzXCIpO1xudmFyIFByb2plY3RpbGUgPSByZXF1aXJlKFwiLi9iYXNlLXByb2plY3RpbGUuanNcIik7XG5cbkZsYW1ldGhyb3dlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VXZWFwb24ucHJvdG90eXBlKTtcblxuLy8gb3B0aW9uYWwgc2V0dGluZ3MgZm9yIHByb2plY3RpbGVzXG52YXIgcHJvamVjdGlsZU9wdGlvbnMgPSB7XG4gICAgaXNEZXN0cnVjdGlibGU6IHRydWUsXG4gICAgcm90YXRlT25TZXR1cDogdHJ1ZSxcbiAgICBjYW5Cb3VuY2U6IGZhbHNlLFxuICAgIGNhbkJ1cm46IHRydWUsXG4gICAgZGVjYXlSYXRlOiAwLjk2NSxcbiAgICBncm93OiB0cnVlLFxufTtcblxuZnVuY3Rpb24gRmxhbWV0aHJvd2VyKGdhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIpIHtcbiAgICBCYXNlV2VhcG9uLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50R3JvdXAsIFwiRmxhbWV0aHJvd2VyXCIsIHBsYXllcik7XG4gICAgdGhpcy5pbml0QW1tbygzMjApO1xuICAgIHRoaXMuaW5pdENvb2xkb3duKDEyKTtcbn1cblxuRmxhbWV0aHJvd2VyLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLmlzQWJsZVRvQXR0YWNrKCkgJiYgIXRoaXMuaXNBbW1vRW1wdHkoKSkge1xuXG4gICAgICAgIC8vIEZpbmQgdHJhamVjdG9yeVxuICAgICAgICAvLyByYW5kb21pemUgdGhlIHRyYWplY3Rvcnkgb2YgZWFjaCBmbGFtZVxuICAgICAgICB2YXIgYW5nbGVUb1BsYXllciA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5hbmdsZSh0YXJnZXRQb3MpOyAvLyBSYWRzXG4gICAgICAgIHZhciBtb2QgPSAodGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgwLCAxNSkgKiAoTWF0aC5QSSAvIDE4MCkpICpcbiAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5ybmQuc2lnbigpO1xuICAgICAgICB2YXIgYW5nbGUgPSBhbmdsZVRvUGxheWVyICsgbW9kO1xuICAgICAgICB2YXIgc3BlZWQgPSB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDE2NCwxODQpXG4gICAgICAgIHZhciByYW5nZSA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoNjQsNzIpXG4gICAgICAgIC8vIFN0YXJ0IGJ1bGxldCBpbiBhIHBvc2l0aW9uIGFsb25nIHRoYXQgdHJhamVjdG9yeSwgYnV0IGluIGZyb250IG9mIFxuICAgICAgICAvLyB0aGUgcGxheWVyXG4gICAgICAgIHZhciB4ID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLnggKyAoMC43NSAqIHRoaXMuX3BsYXllci53aWR0aCkgKiBcbiAgICAgICAgICAgIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHkgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueSArICgwLjc1ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgTWF0aC5zaW4oYW5nbGUpO1xuXG4gICAgICAgIHRoaXMuaW5jcmVtZW50QW1tbygtMSk7XG5cbiAgICAgICAgdGhpcy5fY3JlYXRlUHJvamVjdGlsZSh4LCB5LCBhbmdsZSwgc3BlZWQsIHJhbmdlKTtcbiAgICAgICAgdGhpcy5fc3RhcnRDb29sZG93bih0aGlzLl9jb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkZsYW1ldGhyb3dlci5wcm90b3R5cGUuX2NyZWF0ZVByb2plY3RpbGUgPSBmdW5jdGlvbiAoeCwgeSwgYW5nbGUsIHNwZWVkLCByYW5nZSkge1xuICAgIHZhciBwID0gbmV3IFByb2plY3RpbGUodGhpcy5nYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBgd2VhcG9ucy9lLWJ1cnN0LTAxYCwgdGhpcywgXG4gICAgICAgIHRoaXMuX3BsYXllciwgNiwgYW5nbGUsIHNwZWVkLCByYW5nZSwgcHJvamVjdGlsZU9wdGlvbnMpO1xuICAgIHAucm90YXRpb24gKz0gMTM1O1xuICAgIC8vIC8vIFJhbmRvbWl6ZSB0aGUgY29sb3Igb2YgZWFjaCBmbGFtZS5cbiAgICB2YXIgZyA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMCwgMjU1KTtcbiAgICBwLnRpbnQgPSBQaGFzZXIuQ29sb3IuZ2V0Q29sb3IoMjQwLCBnLCAyNCk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gR3VuO1xuXG52YXIgQmFzZVdlYXBvbiA9IHJlcXVpcmUoXCIuL2Jhc2Utd2VhcG9uLmpzXCIpO1xudmFyIFByb2plY3RpbGUgPSByZXF1aXJlKFwiLi9iYXNlLXByb2plY3RpbGUuanNcIik7XG5cbkd1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VXZWFwb24ucHJvdG90eXBlKTtcblxuLy8gb3B0aW9uYWwgc2V0dGluZ3MgZm9yIHByb2plY3RpbGVzXG52YXIgcHJvamVjdGlsZU9wdGlvbnMgPSB7XG4gICAgaXNEZXN0cnVjdGlibGU6IHRydWUsXG4gICAgcm90YXRlT25TZXR1cDogdHJ1ZSxcbiAgICBjYW5Cb3VuY2U6IGZhbHNlLFxufTtcblxuZnVuY3Rpb24gR3VuKGdhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIpIHtcbiAgICBCYXNlV2VhcG9uLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50R3JvdXAsIFwiR3VuXCIsIHBsYXllcik7XG4gICAgdGhpcy5pbml0QW1tbygtMSk7XG4gICAgdGhpcy5pbml0Q29vbGRvd24oMzIwLCA0ODApO1xufVxuXG5HdW4ucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbiAodGFyZ2V0UG9zKSB7XG4gICAgaWYgKHRoaXMuaXNBYmxlVG9BdHRhY2soKSAmJiAhdGhpcy5pc0FtbW9FbXB0eSgpKSB7XG4gICAgICAgIC8vIEZpbmQgdHJhamVjdG9yeVxuICAgICAgICB2YXIgYW5nbGUgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24uYW5nbGUodGFyZ2V0UG9zKTsgLy8gUmFkaWFuc1xuICAgICAgICAvLyBTdGFydCBidWxsZXQgaW4gYSBwb3NpdGlvbiBhbG9uZyB0aGF0IHRyYWplY3RvcnksIGJ1dCBpbiBmcm9udCBvZiBcbiAgICAgICAgLy8gdGhlIHBsYXllclxuICAgICAgICB2YXIgeCA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi54ICsgKDAuNzUgKiB0aGlzLl9wbGF5ZXIud2lkdGgpICogXG4gICAgICAgICAgICBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLnkgKyAoMC43NSAqIHRoaXMuX3BsYXllci53aWR0aCkgKiBcbiAgICAgICAgICAgIE1hdGguc2luKGFuZ2xlKTtcblxuICAgICAgICB0aGlzLl9jcmVhdGVQcm9qZWN0aWxlKHgsIHksIGFuZ2xlKTtcbiAgICAgICAgdGhpcy5fc3RhcnRDb29sZG93bih0aGlzLl9jb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkd1bi5wcm90b3R5cGUuc3BlY2lhbEZpcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNBYmxlVG9BdHRhY2soKSAmJiB0aGlzLmdldEFtbW8oKSA+IDApIHtcbiAgICAgICAgLy8gY3JlYXRlIDggYnVsbGV0cyBldmVubHkgZGlzdHJpYnV0ZWQgaW4gYSBjaXJjbGVcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPD03OyBpKyspIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IGJ1bGxldCBpbiBhIHBvc2l0aW9uIGFsb25nIHRoYXQgdHJhamVjdG9yeSwgYnV0IGluIGZyb250XG4gICAgICAgICAgICAvLyBvZiB0aGUgcGxheWVyXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSAoaSooTWF0aC5QSS80KSk7XG4gICAgICAgICAgICB2YXIgeCA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi54ICsgKDAuNzUgKiB0aGlzLl9wbGF5ZXIud2lkdGgpICogXG4gICAgICAgICAgICAgICAgTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICAgICAgdmFyIHkgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueSArICgwLjc1ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgICAgIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoeCwgeSwgYW5nbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbmNyZW1lbnRBbW1vKC04KTtcblxuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKHRoaXMuX3NwZWNpYWxDb29sZG93blRpbWUpO1xuICAgIH1cbn07XG5cbkd1bi5wcm90b3R5cGUuX2NyZWF0ZVByb2plY3RpbGUgPSBmdW5jdGlvbiAoeCwgeSwgYW5nbGUpIHtcbiAgICBuZXcgUHJvamVjdGlsZSh0aGlzLmdhbWUsIHgsIHksIFwiYXNzZXRzXCIsIFwid2VhcG9ucy9zbHVnXCIsIHRoaXMsIFxuICAgICAgICB0aGlzLl9wbGF5ZXIsIDUwLCBhbmdsZSwgMzAwLCAxNjAsIHByb2plY3RpbGVPcHRpb25zKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBMYXNlcjtcblxudmFyIEJhc2VXZWFwb24gPSByZXF1aXJlKFwiLi9iYXNlLXdlYXBvbi5qc1wiKTtcbnZhciBQcm9qZWN0aWxlID0gcmVxdWlyZShcIi4vYmFzZS1wcm9qZWN0aWxlLmpzXCIpO1xuXG5MYXNlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VXZWFwb24ucHJvdG90eXBlKTtcblxuLy8gb3B0aW9uYWwgc2V0dGluZ3MgZm9yIHByb2plY3RpbGVzXG52YXIgcHJvamVjdGlsZU9wdGlvbnMgPSB7XG4gICAgaXNEZXN0cnVjdGlibGU6IHRydWUsXG4gICAgcm90YXRlT25TZXR1cDogdHJ1ZSxcbiAgICBjYW5Cb3VuY2U6IGZhbHNlLFxufTtcblxuZnVuY3Rpb24gTGFzZXIoZ2FtZSwgcGFyZW50R3JvdXAsIHBsYXllcikge1xuICAgIEJhc2VXZWFwb24uY2FsbCh0aGlzLCBnYW1lLCBwYXJlbnRHcm91cCwgXCJMYXNlclwiLCBwbGF5ZXIpO1xuICAgIHRoaXMuaW5pdEFtbW8oMTIwKTtcbiAgICB0aGlzLmluaXRDb29sZG93bigxNjAsIDUwMCk7XG4gICAgdGhpcy50cmFja2VyID0gbnVsbDtcbn1cblxuTGFzZXIucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbiAodGFyZ2V0UG9zKSB7XG4gICAgaWYgKHRoaXMuaXNBYmxlVG9BdHRhY2soKSAmJiAhdGhpcy5pc0FtbW9FbXB0eSgpKSB7XG4gICAgICAgIC8vIEZpbmQgdHJhamVjdG9yeVxuICAgICAgICB2YXIgYW5nbGUgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24uYW5nbGUodGFyZ2V0UG9zKTsgLy8gUmFkaWFuc1xuICAgICAgICB2YXIgc3BhY2luZyA9IDAuMTYgKiB0aGlzLl9wbGF5ZXIud2lkdGg7XG4gICAgICAgIHZhciBzcGFjaW5nMiA9IDAuMzYgKiB0aGlzLl9wbGF5ZXIud2lkdGg7XG4gICAgICAgIHZhciBhID0gdGhpcy5fY3JlYXRlUHJvamVjdGlsZShhbmdsZSwgNDgsIDApO1xuICAgICAgICB2YXIgYiA9IHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoYW5nbGUsIDE2LCBzcGFjaW5nMik7XG4gICAgICAgIHZhciBjID0gdGhpcy5fY3JlYXRlUHJvamVjdGlsZShhbmdsZSwgMTYsIC1zcGFjaW5nMik7XG4gICAgICAgIHZhciBkID0gdGhpcy5fY3JlYXRlUHJvamVjdGlsZShhbmdsZSwgMjQsIHNwYWNpbmcpO1xuICAgICAgICB2YXIgZSA9IHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoYW5nbGUsIDI0LCAtc3BhY2luZyk7XG4gICAgICAgIHRoaXMudHJhY2tlciA9IG5ldyBUcmFja2VyKHRoaXMuZ2FtZSwgYS5wb3NpdGlvbi54LCBhLnBvc2l0aW9uLnksXG4gICAgICAgICAgICBbYSwgYiwgYywgZCwgZV0pO1xuICAgICAgICB0aGlzLmluY3JlbWVudEFtbW8oLTUpO1xuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKHRoaXMuX2Nvb2xkb3duVGltZSk7XG4gICAgfVxufTtcblxuTGFzZXIucHJvdG90eXBlLl9jcmVhdGVQcm9qZWN0aWxlID0gZnVuY3Rpb24gKGFuZ2xlLCBwbGF5ZXJEaXN0YW5jZSwgXG4gICAgcGVycGVuZGljdWxhck9mZnNldCkge1xuICAgIHZhciBwZXJwQW5nbGUgPSBhbmdsZSAtIChNYXRoLlBJIC8gMik7XG4gICAgdmFyIHggPSB0aGlzLl9wbGF5ZXIueCArIChwbGF5ZXJEaXN0YW5jZSAqIE1hdGguY29zKGFuZ2xlKSkgLSBcbiAgICAgICAgKHBlcnBlbmRpY3VsYXJPZmZzZXQgKiBNYXRoLmNvcyhwZXJwQW5nbGUpKTtcbiAgICB2YXIgeSA9IHRoaXMuX3BsYXllci55ICsgKHBsYXllckRpc3RhbmNlICogTWF0aC5zaW4oYW5nbGUpKSAtIFxuICAgICAgICAocGVycGVuZGljdWxhck9mZnNldCAqIE1hdGguc2luKHBlcnBBbmdsZSkpOyAgICBcbiAgICB2YXIgcCA9IG5ldyBQcm9qZWN0aWxlKHRoaXMuZ2FtZSwgeCwgeSwgXCJhc3NldHNcIiwgXCJ3ZWFwb25zL2xhc2VyLTAxXCIsIHRoaXMsXG4gICAgICAgIHRoaXMuX3BsYXllciwgNywgYW5nbGUsIDY0MCwgMzIwLCBwcm9qZWN0aWxlT3B0aW9ucyk7XG4gICAgcC5zY2FsZS5zZXRUbygwLjcyLCAwLjcyKTtcbiAgICB2YXIgcmdiID0gUGhhc2VyLkNvbG9yLkhTTHRvUkdCKDAuNTIsIDAuNSwgMC42NCk7XG4gICAgcC50aW50ID0gUGhhc2VyLkNvbG9yLmdldENvbG9yKHJnYi5yLCByZ2IuZywgcmdiLmIpO1xuICAgIHJldHVybiBwO1xufTtcblxuXG5cblxuXG5cblxuLy8gVHJhY2tlciBmb3IgdGhlIGxhc2VyXG5UcmFja2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBwYXJhbSB7UHJvamVjdGlsZX0gYnVsbGV0cyAtIEFycmF5IG9mIGJ1bGxldHMgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgdHJhY2tlci5cbiAqL1xuZnVuY3Rpb24gVHJhY2tlcihnYW1lLCB4LCB5LCBidWxsZXRzKSB7XG4gICAgY29uc29sZS5sb2coJ3RyYWNrZXIhJyk7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksIFwiYXNzZXRzXCIsIFwicGxheWVyL2lkbGUtMDFcIik7XG4gICAgdGhpcy5hbmNob3Iuc2V0KDAuNSk7XG4gICAgdGhpcy5zY2FsZS5zZXRUbygxLjIsIDEuMik7XG5cbiAgICB0aGlzLmJ1bGxldHMgPSBidWxsZXRzXG5cbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMpO1xufVxuXG5UcmFja2VyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygndGhpcy5pcyBoYXBwZW5pbmcgYXQgbGVhc3QnKTtcbiAgICAvLyBTZXQgdHJhY2tlciBwb3NpdGlvbiB0byBidWxsZXRbMF0gcG9zaXRpb25cbiAgICB0aGlzLnBvc2l0aW9uLnggPSB0aGlzLmJ1bGxldHNbMF0ucG9zaXRpb24ueDtcbiAgICB0aGlzLnBvc2l0aW9uLnkgPSB0aGlzLmJ1bGxldHNbMF0ucG9zaXRpb24ueTtcblxuICAgIC8vIENvbGxpc2lvbnMgd2l0aCBlbmVtaWVzXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcywgdGhpcy5nYW1lLmdsb2JhbHMuZ3JvdXBzLmVuZW1pZXMsXG4gICAgICAgIHRoaXMuX29uQ29sbGlkZVdpdGhFbmVteSwgdGhpcyk7XG59XG5cblRyYWNrZXIucHJvdG90eXBlLl9vbkNvbGxpZGVXaXRoRW5lbXkgPSBmdW5jdGlvbiAoc2VsZiwgZW5lbXkpIHtcbiAgICBjb25zb2xlLmxvZygnY29sbGlkZSEnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYnVsbGV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmJ1bGxldHNbMF0udHJhY2tUYXJnZXQoZW5lbXkpO1xuICAgIH1cbiAgICB0aGlzLmRlc3Ryb3koKTtcbn07XG5UcmFja2VyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIFBoYXNlci5TcHJpdGUucHJvdG90eXBlLmRlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE1hY2hpbmVHdW47XG5cbnZhciBCYXNlV2VhcG9uID0gcmVxdWlyZShcIi4vYmFzZS13ZWFwb24uanNcIik7XG52YXIgUHJvamVjdGlsZSA9IHJlcXVpcmUoXCIuL2Jhc2UtcHJvamVjdGlsZS5qc1wiKTtcblxuTWFjaGluZUd1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VXZWFwb24ucHJvdG90eXBlKTtcblxuLy8gb3B0aW9uYWwgc2V0dGluZ3MgZm9yIHByb2plY3RpbGVzXG52YXIgcHJvamVjdGlsZU9wdGlvbnMgPSB7XG4gICAgaXNEZXN0cnVjdGlibGU6IHRydWUsXG4gICAgcm90YXRlT25TZXR1cDogdHJ1ZSxcbiAgICBjYW5Cb3VuY2U6IGZhbHNlLFxufTtcblxuZnVuY3Rpb24gTWFjaGluZUd1bihnYW1lLCBwYXJlbnRHcm91cCwgcGxheWVyKSB7XG4gICAgQmFzZVdlYXBvbi5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudEdyb3VwLCBcIk1hY2hpbmVHdW5cIiwgcGxheWVyKTtcbiAgICB0aGlzLmluaXRBbW1vKDI0MCk7XG4gICAgdGhpcy5pbml0Q29vbGRvd24oNTYpO1xufVxuXG5NYWNoaW5lR3VuLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLmlzQWJsZVRvQXR0YWNrKCkgJiYgIXRoaXMuaXNBbW1vRW1wdHkoKSkge1xuICAgICAgICAvLyBGaW5kIHRyYWplY3RvcnlcbiAgICAgICAgdmFyIGFuZ2xlID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLmFuZ2xlKHRhcmdldFBvcyk7IC8vIFJhZGlhbnNcbiAgICAgICAgLy8gU3RhcnQgYnVsbGV0IGluIGEgcG9zaXRpb24gYWxvbmcgdGhhdCB0cmFqZWN0b3J5LCBidXQgaW4gZnJvbnQgb2YgXG4gICAgICAgIC8vIHRoZSBwbGF5ZXJcbiAgICAgICAgdmFyIHggPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueCArICgwLjUgKiB0aGlzLl9wbGF5ZXIud2lkdGgpICogXG4gICAgICAgICAgICBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLnkgKyAoMC41ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIFxuICAgICAgICAgICAgTWF0aC5zaW4oYW5nbGUpO1xuXG4gICAgICAgIHRoaXMuaW5jcmVtZW50QW1tbygtMSk7XG5cbiAgICAgICAgdGhpcy5fY3JlYXRlUHJvamVjdGlsZSh4LCB5LCBhbmdsZSk7XG4gICAgICAgIHRoaXMuX3N0YXJ0Q29vbGRvd24odGhpcy5fY29vbGRvd25UaW1lKTtcbiAgICB9XG59O1xuXG5NYWNoaW5lR3VuLnByb3RvdHlwZS5fY3JlYXRlUHJvamVjdGlsZSA9IGZ1bmN0aW9uICh4LCB5LCBhbmdsZSkge1xuICAgIHZhciBwID0gbmV3IFByb2plY3RpbGUodGhpcy5nYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBcIndlYXBvbnMvc2x1Z1wiLCB0aGlzLCBcbiAgICAgICAgdGhpcy5fcGxheWVyLCAxNiwgYW5nbGUsIDMwMCwgMTYwLCBwcm9qZWN0aWxlT3B0aW9ucyk7XG4gICAgcC5zY2FsZS5zZXRUbygwLjc1LCAwLjc1KTtcbiAgICAvLyAvLyBSYW5kb21pemUgdGhlIGNvbG9yIG9mIGVhY2ggZmxhbWUuXG4gICAgdmFyIHIgPSB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDEyMCwgMTYwKTtcbiAgICB2YXIgZyA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMTYwLCAyMDApO1xuICAgIHZhciBiID0gdGhpcy5nYW1lLnJuZC5pbnRlZ2VySW5SYW5nZSgxNjAsIDIwMCk7XG4gICAgcC50aW50ID0gUGhhc2VyLkNvbG9yLmdldENvbG9yKHIsIGcsIGIpO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IE1lbGVlV2VhcG9uO1xuXG52YXIgU3ByaXRlVXRpbHMgPSByZXF1aXJlKFwiLi4vLi4vaGVscGVycy9zcHJpdGUtdXRpbGl0aWVzLmpzXCIpO1xuXG5NZWxlZVdlYXBvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblxuZnVuY3Rpb24gTWVsZWVXZWFwb24oZ2FtZSwgcGFyZW50R3JvdXAsIHBsYXllcikgeyAgICBcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgcGxheWVyLngsIHBsYXllci55LCBcImFzc2V0c1wiLCBcbiAgICAgICAgXCJ3ZWFwb25zL3N3b3JkXCIpO1xuXG4gICAgdGhpcy5hbmNob3Iuc2V0KDAuNSwgMS4wKTtcbiAgICB0aGlzLnBpdm90LnkgPSAxODtcbiAgICBwYXJlbnRHcm91cC5hZGQodGhpcyk7XG5cbiAgICB0aGlzLl9wbGF5ZXIgPSBwbGF5ZXI7XG4gICAgdGhpcy5fZW5lbWllcyA9IHRoaXMuZ2FtZS5nbG9iYWxzLmdyb3Vwcy5lbmVtaWVzO1xuXG4gICAgLy8gU2V0IHVwIGEgdGltZXIgdGhhdCBkb2Vzbid0IGF1dG9kZXN0cm95IGl0c2VsZlxuICAgIHRoaXMuX2Nvb2xkb3duVGltZXIgPSB0aGlzLmdhbWUudGltZS5jcmVhdGUoZmFsc2UpO1xuICAgIHRoaXMuX2Nvb2xkb3duVGltZXIuc3RhcnQoKTtcbiAgICB0aGlzLl9jb29sZG93blRpbWUgPSAzNTA7IC8vIE1pbGxpc2Vjb25kcyBcbiAgICB0aGlzLl9zcGVjaWFsQ29vbGRvd25UaW1lID0gOTYwOyAvLyBNaWxsaXNlY29uZHMgXG5cbiAgICB0aGlzLl9hYmxlVG9BdHRhY2sgPSB0cnVlO1xuICAgIHRoaXMuX3N3aW5nRGlyID0gMTtcbiAgICB0aGlzLl9kYW1hZ2UgPSAzNTtcblxuICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuX3N3aW5nID0gbnVsbDsgXG5cbiAgICB0aGlzLnNhdEJvZHkgPSB0aGlzLmdhbWUuZ2xvYmFscy5wbHVnaW5zLnNhdEJvZHkuYWRkQm94Qm9keSh0aGlzLCAzOCwgXG4gICAgICAgIHRoaXMuaGVpZ2h0ICsgdGhpcy5waXZvdC55KTtcbn1cblxuTWVsZWVXZWFwb24ucHJvdG90eXBlLnBvc3RVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMudmlzaWJsZSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLnk7XG5cbiAgICAgICAgU3ByaXRlVXRpbHMuY2hlY2tPdmVybGFwV2l0aEdyb3VwKHRoaXMsIHRoaXMuX2VuZW1pZXMsIFxuICAgICAgICAgICAgdGhpcy5fb25Db2xsaWRlV2l0aEVuZW15LCB0aGlzKTtcbiAgICB9XG4gICAgUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUucG9zdFVwZGF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuTWVsZWVXZWFwb24ucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbiAodGFyZ2V0UG9zKSB7XG4gICAgaWYgKHRoaXMuX2FibGVUb0F0dGFjaykge1xuICAgICAgICAvLyBzdGFydCBhbmdsZVxuICAgICAgICB0aGlzLnJvdGF0aW9uID0gdGhpcy5fcGxheWVyLnBvc2l0aW9uLmFuZ2xlKHRhcmdldFBvcykgLSBcbiAgICAgICAgICAgICh0aGlzLl9zd2luZ0RpciAqIE1hdGguUEkvNCkgKyAoTWF0aC5QSS80KTtcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5hbmdsZSh0YXJnZXRQb3MpICogKDE4MC9NYXRoLlBJKTtcblxuICAgICAgICB2YXIgZW5kQW5nbGUgPSBwb3MgKyAodGhpcy5fc3dpbmdEaXIgKiAxODApOyAvLyB0d2VlbnMgdGFrZSBkZWdyZWVzXG4gICAgICAgIGlmIChlbmRBbmdsZSA9PT0gMzYwKSB7XG4gICAgICAgICAgICBlbmRBbmdsZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zd2luZyA9IHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcykudG8oe2FuZ2xlOiBlbmRBbmdsZX0sIFxuICAgICAgICAgICAgdGhpcy5fY29vbGRvd25UaW1lLCBcIlF1YWQuZWFzZUluT3V0XCIsIGZhbHNlLCAwLCAwLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuX3N3aW5nLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5fc3dpbmcuc3RhcnQoKTtcblxuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKHRoaXMuX2Nvb2xkb3duVGltZSk7XG4gICAgfVxufTtcblxuTWVsZWVXZWFwb24ucHJvdG90eXBlLnNwZWNpYWxGaXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLl9hYmxlVG9BdHRhY2spIHtcbiAgICAgICAgLy8gc3RhcnQgYW5nbGVcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5hbmdsZSh0YXJnZXRQb3MpICsgKE1hdGguUEkvMik7XG4gICAgICAgIHZhciBwb3MgPSAodGhpcy5fcGxheWVyLnBvc2l0aW9uLmFuZ2xlKHRhcmdldFBvcykgKyAoTWF0aC5QSS8yKSkgKiBcbiAgICAgICAgICAgICgxODAvTWF0aC5QSSk7XG4gICAgICAgIHZhciBlbmRBbmdsZSA9IHBvcyArIDcyMDsgLy8gZm9yIHNvbWUgcmVhc29uIHR3ZWVucyB0YWtlIGRlZ3JlZXNcblxuICAgICAgICB0aGlzLl9zd2luZyA9IHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcykudG8oe2FuZ2xlOiBlbmRBbmdsZX0sIFxuICAgICAgICAgICAgdGhpcy5fc3BlY2lhbENvb2xkb3duVGltZSwgXCJRdWFkLmVhc2VJbk91dFwiLCBmYWxzZSwgMCwgMCwgZmFsc2UpO1xuICAgICAgICB0aGlzLl9zd2luZy5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zd2luZy5zdGFydCgpO1xuXG4gICAgICAgIHRoaXMuX3N0YXJ0Q29vbGRvd24odGhpcy5fY29vbGRvd25UaW1lKTtcblxuICAgIH1cbn07XG5cbk1lbGVlV2VhcG9uLnByb3RvdHlwZS5oaWRlV2VhcG9uID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3N3aW5nLnN0b3AoKTtcbiAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcbn07XG5cbk1lbGVlV2VhcG9uLnByb3RvdHlwZS5fc3RhcnRDb29sZG93biA9IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgaWYgKCF0aGlzLl9hYmxlVG9BdHRhY2spIHJldHVybjtcbiAgICB0aGlzLl9hYmxlVG9BdHRhY2sgPSBmYWxzZTtcbiAgICAvLyB0aGlzLnZpc2libGUgPSBmYWxzZTtcbiAgICB0aGlzLl9jb29sZG93blRpbWVyLmFkZCh0aW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2FibGVUb0F0dGFjayA9IHRydWU7XG4gICAgICAgIC8vIHRoaXMuX3N3aW5nRGlyID0gdGhpcy5fc3dpbmdEaXIgKiAtMTtcbiAgICB9LCB0aGlzKTtcbn07XG5cbk1lbGVlV2VhcG9uLnByb3RvdHlwZS5fY2hlY2tPdmVybGFwV2l0aEdyb3VwID0gZnVuY3Rpb24gKGdyb3VwLCBjYWxsYmFjaywgXG4gICAgY2FsbGJhY2tDb250ZXh0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5jaGlsZHJlbi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY2hpbGQgPSBncm91cC5jaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgUGhhc2VyLkdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGVja092ZXJsYXBXaXRoR3JvdXAoY2hpbGQsIGNhbGxiYWNrLCBjYWxsYmFja0NvbnRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcywgY2hpbGQsIGNhbGxiYWNrLCBudWxsLCBcbiAgICAgICAgICAgICAgICBjYWxsYmFja0NvbnRleHQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuTWVsZWVXZWFwb24ucHJvdG90eXBlLl9vbkNvbGxpZGVXaXRoRW5lbXkgPSBmdW5jdGlvbiAoc2VsZiwgZW5lbXkpIHtcbiAgICB2YXIgaXNLaWxsZWQgPSBlbmVteS50YWtlRGFtYWdlKHRoaXMuX2RhbWFnZSk7XG4gICAgaWYgKGlzS2lsbGVkKSB0aGlzLl9wbGF5ZXIuaW5jcmVtZW50Q29tYm8oMSk7XG59O1xuXG5NZWxlZVdlYXBvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jb29sZG93blRpbWVyLmRlc3Ryb3koKTtcbiAgICAvLyBDYWxsIHRoZSBzdXBlciBjbGFzcyBhbmQgcGFzcyBhbG9uZyBhbnkgYXJ1Z21lbnRzXG4gICAgUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUuZGVzdHJveS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gU2NhdHRlcnNob3Q7XG5cbnZhciBCYXNlV2VhcG9uID0gcmVxdWlyZShcIi4vYmFzZS13ZWFwb24uanNcIik7XG52YXIgUHJvamVjdGlsZSA9IHJlcXVpcmUoXCIuL2Jhc2UtcHJvamVjdGlsZS5qc1wiKTtcblxuU2NhdHRlcnNob3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlV2VhcG9uLnByb3RvdHlwZSk7XG5cbi8vIG9wdGlvbmFsIHNldHRpbmdzIGZvciBwcm9qZWN0aWxlc1xudmFyIHByb2plY3RpbGVPcHRpb25zID0ge1xuICAgIGlzRGVzdHJ1Y3RpYmxlOiB0cnVlLFxuICAgIHJvdGF0ZU9uU2V0dXA6IHRydWUsXG4gICAgY2FuQm91bmNlOiBmYWxzZSxcbn07XG5cbmZ1bmN0aW9uIFNjYXR0ZXJzaG90KGdhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIpIHtcbiAgICBCYXNlV2VhcG9uLmNhbGwodGhpcywgZ2FtZSwgcGFyZW50R3JvdXAsIFwiU2NhdHRlcnNob3RcIiwgcGxheWVyKTtcbiAgICB0aGlzLmluaXRBbW1vKDQwKTtcbiAgICB0aGlzLmluaXRDb29sZG93big2MDAsIDcwMCk7XG59XG5cblNjYXR0ZXJzaG90LnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24gKHRhcmdldFBvcykge1xuICAgIGlmICh0aGlzLmlzQWJsZVRvQXR0YWNrKCkgJiYgIXRoaXMuaXNBbW1vRW1wdHkoKSkge1xuICAgICAgICAvLyBGaW5kIHRyYWplY3RvcnlcbiAgICAgICAgdmFyIHBlbGxldE51bSA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMTYsIDI0KTtcblxuICAgICAgICAvLyByYW5kb21pemUgdGhlIHRyYWplY3Rvcnkgb2YgZXZlcnkgYnVsbGV0IGluIHRoZSBzaG90Z3VuIGJsYXN0XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxwZWxsZXROdW07IGkrKykge1xuICAgICAgICAgICAgdmFyIGFuZ2xlVG9QbGF5ZXIgPSB0aGlzLl9wbGF5ZXIucG9zaXRpb24uYW5nbGUodGFyZ2V0UG9zKTsgLy8gUmFkc1xuICAgICAgICAgICAgdmFyIG1vZCA9ICh0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDAsIDMwKSAqIChNYXRoLlBJIC8gMTgwKSkgKlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5ybmQuc2lnbigpO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gYW5nbGVUb1BsYXllciArIG1vZDtcbiAgICAgICAgICAgIHZhciBzcGVlZCA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMzY0LDM3NilcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoNDgsOTYpXG4gICAgICAgICAgICB2YXIgcGVycGVuZGljdWxhck9mZnNldCA9IHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoLTUsNSlcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVByb2plY3RpbGUoYW5nbGUsIDI0LCBwZXJwZW5kaWN1bGFyT2Zmc2V0LCBzcGVlZCwgcmFuZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbmNyZW1lbnRBbW1vKC0xKTtcblxuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKHRoaXMuX2Nvb2xkb3duVGltZSk7XG4gICAgfVxufTtcblxuU2NhdHRlcnNob3QucHJvdG90eXBlLl9jcmVhdGVQcm9qZWN0aWxlID0gZnVuY3Rpb24gKGFuZ2xlLCBwbGF5ZXJEaXN0YW5jZSwgXG4gICAgcGVycGVuZGljdWxhck9mZnNldCwgc3BlZWQsIHJhbmdlKSB7XG4gICAgdmFyIHBlcnBBbmdsZSA9IGFuZ2xlIC0gKE1hdGguUEkgLyAyKTtcbiAgICB2YXIgeCA9IHRoaXMuX3BsYXllci54ICsgKHBsYXllckRpc3RhbmNlICogTWF0aC5jb3MoYW5nbGUpKSAtIFxuICAgICAgICAocGVycGVuZGljdWxhck9mZnNldCAqIE1hdGguY29zKHBlcnBBbmdsZSkpO1xuICAgIHZhciB5ID0gdGhpcy5fcGxheWVyLnkgKyAocGxheWVyRGlzdGFuY2UgKiBNYXRoLnNpbihhbmdsZSkpIC0gXG4gICAgICAgIChwZXJwZW5kaWN1bGFyT2Zmc2V0ICogTWF0aC5zaW4ocGVycEFuZ2xlKSk7XG4gICAgLy8gc2hvdGd1biBibGFzdCBpcyBtYWRlIHVwIG9mIGEgYnVuY2ggb2Ygc2x1Z3MgYXQgaGFsZiBzaXplLlxuICAgIHZhciBwID0gbmV3IFByb2plY3RpbGUodGhpcy5nYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBcIndlYXBvbnMvc2x1Z1wiLCB0aGlzLFxuICAgICAgICB0aGlzLl9wbGF5ZXIsIDEyLCBhbmdsZSwgc3BlZWQsIHJhbmdlLCBwcm9qZWN0aWxlT3B0aW9ucyk7XG4gICAgcC5zY2FsZS5zZXRUbygwLjUsIDAuNSk7XG4gICAgdmFyIHJnYiA9IFBoYXNlci5Db2xvci5IU0x0b1JHQigwLjc1LCAwLjM2LCAwLjY0KTtcbiAgICBwLnRpbnQgPSBQaGFzZXIuQ29sb3IuZ2V0Q29sb3IocmdiLnIsIHJnYi5nLCByZ2IuYik7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gQ29tYm9UcmFja2VyO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi4vaGVscGVycy91dGlsaXRpZXMuanNcIik7XG5cbmZ1bmN0aW9uIENvbWJvVHJhY2tlcihnYW1lLCBjb21ib1RpbWVvdXQpIHtcbiAgICB0aGlzLl9jb21ibyA9IDA7XG5cbiAgICB0aGlzLl9jb21ib1RpbWVvdXQgPSB1dGlscy5kZWZhdWx0KGNvbWJvVGltZW91dCwgMjAwMCk7XG4gICAgdGhpcy5fY29tYm9UaW1lciA9IGdhbWUudGltZS5jcmVhdGUoZmFsc2UpOyAvLyBEb2Vzbid0IGF1dG9kZXN0cm95XG4gICAgdGhpcy5fY29tYm9UaW1lci5zdGFydCgpO1xufVxuXG5Db21ib1RyYWNrZXIucHJvdG90eXBlLmdldENvbWJvID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21ibztcbn07XG5cbkNvbWJvVHJhY2tlci5wcm90b3R5cGUuaW5jcmVtZW50Q29tYm8gPSBmdW5jdGlvbiAoaW5jcmVtZW50KSB7XG4gICAgLy8gVXBkYXRlIHRoZSBjb21ib1xuICAgIHRoaXMuX2NvbWJvICs9IHV0aWxzLmRlZmF1bHQoaW5jcmVtZW50LCAxKTtcbiAgICBcbiAgICAvLyBSZXNldCB0aGUgdGltZXIgZXZlbnRzIGFuZCBzY2hlZHVsZSBhbiBldmVudCB0byByZXNldCB0aGUgY29tYm8gdG8gemVyb1xuICAgIHRoaXMuX2NvbWJvVGltZXIucmVtb3ZlQWxsKCk7XG4gICAgdGhpcy5fY29tYm9UaW1lci5hZGQodGhpcy5fY29tYm9UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbWJvID0gMDtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcblxuQ29tYm9UcmFja2VyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NvbWJvVGltZXIuZGVzdHJveSgpO1xufTsiLCIvKipcbiAqIEBtb2R1bGUgQ29udHJvbGxlclxuICovXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG5cbi8qKlxuICogVGhpcyBvYmplY3QgY2FuIGJlIHVzZWQgdG8gbG9vayB1cCB0aGUgbW91c2UgYnV0dG9uIHByb3BlcnR5IHRoYXQgY29ycmVzcG9uZHNcbiAqIHdpdGggdGhlIGJ1dHRvbidzIG51bWVyaWNhbCBJRC5cbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBQT0lOVEVSX0JVVFRPTlNfTE9PS1VQID0ge307XG5QT0lOVEVSX0JVVFRPTlNfTE9PS1VQW1BoYXNlci5Qb2ludGVyLkxFRlRfQlVUVE9OXSA9IFwibGVmdEJ1dHRvblwiO1xuUE9JTlRFUl9CVVRUT05TX0xPT0tVUFtQaGFzZXIuUG9pbnRlci5NSURETEVfQlVUVE9OXSA9IFwibWlkZGxlQnV0dG9uXCI7XG5QT0lOVEVSX0JVVFRPTlNfTE9PS1VQW1BoYXNlci5Qb2ludGVyLlJJR0hUX0JVVFRPTl0gPSBcInJpZ2h0QnV0dG9uXCI7XG4gICAgXG4vKipcbiAqIEEgaGVscGVyIGNsYXNzIGZvciBhYnN0cmFjdGluZyBhd2F5IGEgY29udHJvbGxlci4gVGhpcyBjYW4gcmVnaXN0ZXIgbXVsdGlwbGVcbiAqIGNvbnRyb2wga2V5cyB0byB0aGUgc2FtZSBhY3Rpb24sIGUuZy4gdXNpbmcgYm90aCBcImxlZnRcIiBhbmQgXCJ3XCIgZm9yIG1vdmluZyBhXG4gKiBjaGFyYWN0ZXIgbGVmdC5cbiAqIEBjbGFzcyBDb250cm9sbGVyXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCBBIHJlZmVyZW5jZSB0byBhIFBoYXNlci5pbnB1dCBmb3IgdGhlIGN1cnJlbnQgZ2FtZS5cbiAqL1xuZnVuY3Rpb24gQ29udHJvbGxlcihpbnB1dCkge1xuICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cbiAgICAvLyBPYmplY3QgY29udGFpbmluZyB0aGUgYWN0aXZlIGNvbnRyb2wgbmFtZXMuIElmIGEgY29udHJvbCBpcyBhY3RpdmUsIHRoaXNcbiAgICAvLyB3aWxsIGhhdmUgYSBwcm9wZXJ0eSAodGhhdCBjb250cm9sJ3MgbmFtZSkgc2V0IHRvIHRydWUuIEluYWN0aXZlIGNvbnRyb2xzXG4gICAgLy8gYXJlIG5vdCBzdG9yZWQgaW4gdGhlIG9iamVjdC5cbiAgICB0aGlzLl9hY3RpdmVDb250cm9scyA9IHt9O1xuXG4gICAgLy8gT2JqZWN0cyBjb250YWluaW5nIHRoZSBtYXBwaW5nIG9mOiBcbiAgICAvLyAga2V5Q29kZS9tb3VzZUJ1dHRvbiAtPiBjb250cm9sIG5hbWVcbiAgICB0aGlzLl9rZXlib2FyZE1hcCA9IHt9O1xuICAgIHRoaXMuX21vdXNlTWFwID0ge307XG59XG5cbi8qKlxuICogQ2hlY2sgd2hhdCBjb250cm9scyBhcmUgYWN0aXZlLiBUaGlzIG11c3QgYmUgY2FsbGVkIG9uY2UgcGVyIGZyYW1lLCBiZWZvcmVcbiAqIENvbnRyb2xsZXIuaXNDb250cm9sQWN0aXZlLlxuICovXG5Db250cm9sbGVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gUmVzZXQgY29udHJvbHNcbiAgICB0aGlzLl9hY3RpdmVDb250cm9scyA9IHt9O1xuICAgIFxuICAgIC8vIENoZWNrIGZvciBhbnkgcmVnaXN0ZXJlZCBtb3VzZSBjb250cm9scyB0aGF0IGhhdmUgYmVlbiBhY3RpdmF0ZWRcbiAgICB2YXIgYWN0aXZlUG9pbnRlciA9IHRoaXMuX2lucHV0LmFjdGl2ZVBvaW50ZXI7XG4gICAgZm9yICh2YXIgYnV0dG9uTmFtZSBpbiB0aGlzLl9tb3VzZU1hcCkge1xuICAgICAgICB2YXIgY29udHJvbHMgPSB0aGlzLl9tb3VzZU1hcFtidXR0b25OYW1lXTtcbiAgICAgICAgdmFyIGJ1dHRvblByb3BlcnR5TmFtZSA9IFBPSU5URVJfQlVUVE9OU19MT09LVVBbYnV0dG9uTmFtZV07XG4gICAgICAgIHZhciBwb2ludGVyQnV0dG9uID0gYWN0aXZlUG9pbnRlcltidXR0b25Qcm9wZXJ0eU5hbWVdO1xuICAgICAgICBpZiAocG9pbnRlckJ1dHRvbi5pc0Rvd24pIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlQ29udHJvbHMoY29udHJvbHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGFueSByZWdpc3RlcmVkIGtleWJvYXJkIGNvbnRyb2xzIHRoYXQgaGF2ZSBiZWVuIGFjdGl2YXRlZFxuICAgIGZvciAodmFyIGtleUNvZGUgaW4gdGhpcy5fa2V5Ym9hcmRNYXApIHtcbiAgICAgICAgdmFyIGNvbnRyb2xzID0gdGhpcy5fa2V5Ym9hcmRNYXBba2V5Q29kZV07XG4gICAgICAgIGlmICh0aGlzLl9pbnB1dC5rZXlib2FyZC5pc0Rvd24oa2V5Q29kZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlQ29udHJvbHMoY29udHJvbHMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IGlzRG93biguLi4pIG9ubHkgd29ya3MgaW4gYnJvd3NlcnMuIE1ha2UgdGhpcyBtb2JpbGUtZnJpZW5kbHkuXG4gICAgfVxufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgc3BlY2lmaWVkIGNvbnRyb2wgaXMgY3VycmVudGx5IGFjdGl2ZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gIGNvbnRyb2xOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250cm9sIHdoaWNoIHdhcyByZWdpc3RlcmVkIGluXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb250cm9sbGVyLmFkZEtleS5cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBjb250cm9sIGlzIGFjdGl2ZS5cbiAqL1xuQ29udHJvbGxlci5wcm90b3R5cGUuaXNDb250cm9sQWN0aXZlID0gZnVuY3Rpb24gKGNvbnRyb2xOYW1lKSB7XG4gICAgcmV0dXJuICh0aGlzLl9hY3RpdmVDb250cm9sc1tjb250cm9sTmFtZV0gPT09IHRydWUpO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIGtleSBvciBrZXlzIHVuZGVyIGEgY29udHJvbCBuYW1lLlxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIGNvbnRyb2xOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250cm9sLCBlLmcuIFwianVtcFwiIG9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZWZ0XCIuXG4gKiBAcGFyYW0ge251bWJlcltdfG51bWJlcn0ga2V5Q29kZXMgICAgVGhlIGtleSBjb2RlIG9yIGFuIGFycmF5IG9mIGtleSBjb2RlcyB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyIHVuZGVyIHRoZSBzcGVjaWZpZWQgY29udHJvbCBcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBlLmcuIFBoYXNlci5LZXlib2FyZC5TUEFDRUJBUlxuICovXG5Db250cm9sbGVyLnByb3RvdHlwZS5hZGRLZXlib2FyZENvbnRyb2wgPSBmdW5jdGlvbiAoY29udHJvbE5hbWUsIGtleUNvZGVzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGtleUNvZGVzKSkga2V5Q29kZXMgPSBba2V5Q29kZXNdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5Q29kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGtleUNvZGUgPSBrZXlDb2Rlc1tpXTtcbiAgICAgICAgaWYgKHRoaXMuX2tleWJvYXJkTWFwW2tleUNvZGVdKSB7XG4gICAgICAgICAgICB0aGlzLl9rZXlib2FyZE1hcFtrZXlDb2RlXS5wdXNoKGNvbnRyb2xOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2tleWJvYXJkTWFwW2tleUNvZGVdID0gW2NvbnRyb2xOYW1lXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBtb3VzZSBidXR0b24gdW5kZXIgYSBjb250cm9sIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29udHJvbE5hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRyb2wsIGUuZy4gXCJqdW1wXCIgb3IgXCJsZWZ0XCIuXG4gKiBAcGFyYW0ge251bWJlcn0gbW91c2VCdXR0b24gVGhlIHBoYXNlciBtb3VzZSBidXR0b24gdG8gcmVnaXN0ZXIgdW5kZXIgdGhlIFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllZCBjb250cm9sIG5hbWUsIGUuZy4gXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUGhhc2VyLlBvaW50ZXIuTEVGVF9CVVRUT04uXG4gKi9cbkNvbnRyb2xsZXIucHJvdG90eXBlLmFkZE1vdXNlRG93bkNvbnRyb2wgPSBmdW5jdGlvbiAoY29udHJvbE5hbWUsIG1vdXNlQnV0dG9uKSB7XG4gICAgaWYgKHRoaXMuX21vdXNlTWFwW21vdXNlQnV0dG9uXSkge1xuICAgICAgICB0aGlzLl9tb3VzZU1hcFttb3VzZUJ1dHRvbl0ucHVzaChjb250cm9sTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbW91c2VNYXBbbW91c2VCdXR0b25dID0gW2NvbnRyb2xOYW1lXTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFjdGl2YXRlIHRoZSBhcnJheSBvZiBjb250cm9scyBzcGVjaWZpZWRcbiAqIEBwYXJhbSAge3N0cmluZ1tdfSBjb250cm9scyBBcnJheSBvZiBjb250cm9scyB0byBhY3RpdmVcbiAqIEBwcml2YXRlXG4gKi9cbkNvbnRyb2xsZXIucHJvdG90eXBlLl9hY3RpdmF0ZUNvbnRyb2xzID0gZnVuY3Rpb24gKGNvbnRyb2xzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250cm9scy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgY29udHJvbE5hbWUgPSBjb250cm9sc1tpXTtcbiAgICAgICAgdGhpcy5fYWN0aXZlQ29udHJvbHNbY29udHJvbE5hbWVdID0gdHJ1ZTtcbiAgICB9XG59O1xuIiwidmFyIGh1bGwgPSByZXF1aXJlKFwiaHVsbC5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxjdWxhdGVIdWxsc0Zyb21UaWxlcyh0aWxlTWFwKSB7XG5cdHZhciBjbHVzdGVycyA9IGNhbGN1bGF0ZUNsdXN0ZXJzKHRpbGVNYXApO1xuXHR2YXIgaHVsbHMgPSBjYWxjdWxhdGVIdWxscyhjbHVzdGVycyk7XG5cdHJldHVybiBodWxscztcbn07XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUNsdXN0ZXJzKHRpbGVNYXApIHtcbiAgICB2YXIgY2x1c3RlcnMgPSBbXTtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRpbGVNYXAud2lkdGg7IHgrKykge1xuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRpbGVNYXAuaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgIHZhciB0aWxlID0gZ2V0Q29sbGlkaW5nVGlsZSh4LCB5KTtcbiAgICAgICAgICAgIGlmICh0aWxlICYmICFmaW5kVGlsZUluQ2x1c3RlcnModGlsZSkpIHtcbiAgICAgICAgICAgICAgICBjbHVzdGVyID0gW107XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlbHlTZWFyY2hOZWlnaGJvcnMoeCwgeSwgY2x1c3Rlcik7XG4gICAgICAgICAgICAgICAgY2x1c3RlcnMucHVzaChjbHVzdGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENvbGxpZGluZ1RpbGUoeCwgeSkge1xuICAgICAgICB2YXIgdGlsZSA9IHRpbGVNYXAuZ2V0VGlsZSh4LCB5LCBcIkJsb2NraW5nTGF5ZXJcIik7XG4gICAgICAgIGlmICh0aWxlICYmIHRpbGUuY29sbGlkZXMpIHJldHVybiB0aWxlO1xuICAgICAgICBlbHNlIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlY3Vyc2l2ZWx5U2VhcmNoTmVpZ2hib3JzKHgsIHksIGNsdXN0ZXIpIHtcbiAgICAgICAgdmFyIHRpbGUgPSBnZXRDb2xsaWRpbmdUaWxlKHgsIHkpO1xuICAgICAgICBpZiAodGlsZSAmJiAoY2x1c3Rlci5pbmRleE9mKHRpbGUpID09PSAtMSkpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgY3VycmVudCB0aWxlXG4gICAgICAgICAgICBjbHVzdGVyLnB1c2godGlsZSk7XG4gICAgICAgICAgICAvLyBTZWFyY2ggdGhlIG5laWdoYm9ycyAgIFxuICAgICAgICAgICAgcmVjdXJzaXZlbHlTZWFyY2hOZWlnaGJvcnMoeCwgeSAtIDEsIGNsdXN0ZXIpO1xuICAgICAgICAgICAgcmVjdXJzaXZlbHlTZWFyY2hOZWlnaGJvcnMoeCwgeSArIDEsIGNsdXN0ZXIpO1xuICAgICAgICAgICAgcmVjdXJzaXZlbHlTZWFyY2hOZWlnaGJvcnMoeCArIDEsIHksIGNsdXN0ZXIpO1xuICAgICAgICAgICAgcmVjdXJzaXZlbHlTZWFyY2hOZWlnaGJvcnMoeCAtIDEsIHksIGNsdXN0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZFRpbGVJbkNsdXN0ZXJzKHRpbGUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbHVzdGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2x1c3RlciA9IGNsdXN0ZXJzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjbHVzdGVyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbGUgPT09IGNsdXN0ZXJbal0pIHJldHVybiBjbHVzdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjbHVzdGVycztcbn07XG5cbmZ1bmN0aW9uIGdldEh1bGxQb2ludHMoY2x1c3Rlcikge1xuICAgIHZhciB0aWxlUG9pbnRzID0gW107XG4gICAgZm9yICh2YXIgdCA9IDA7IHQgPCBjbHVzdGVyLmxlbmd0aDsgdCsrKSB7XG4gICAgICAgIHZhciB0aWxlID0gY2x1c3Rlclt0XTtcbiAgICAgICAgdGlsZVBvaW50cy5wdXNoKFxuICAgICAgICAgICAgW3RpbGUubGVmdCwgdGlsZS50b3BdLFxuICAgICAgICAgICAgW3RpbGUucmlnaHQsIHRpbGUudG9wXSwgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBbdGlsZS5sZWZ0LCB0aWxlLmJvdHRvbV0sICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgW3RpbGUucmlnaHQsIHRpbGUuYm90dG9tXVxuICAgICAgICApO1xuICAgIH1cbiAgICB2YXIgcG9pbnRzID0gaHVsbCh0aWxlUG9pbnRzLCAxKTtcbiAgICByZXR1cm4gcG9pbnRzO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVIdWxscyhjbHVzdGVycykge1xuICAgIHZhciBwb2x5Z29ucyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2x1c3RlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBvaW50cyA9IGdldEh1bGxQb2ludHMoY2x1c3RlcnNbaV0pO1xuICAgICAgICB2YXIgbGluZXMgPSBbXTtcblxuICAgICAgICB2YXIgbGluZSA9IG5ldyBQaGFzZXIuTGluZShwb2ludHNbMF1bMF0sIHBvaW50c1swXVsxXSwgXG4gICAgICAgICAgICBwb2ludHNbMV1bMF0sIHBvaW50c1sxXVsxXSk7XG4gICAgICAgIGxpbmVEZWx0YVggPSBsaW5lLnN0YXJ0LnggLSBsaW5lLmVuZC54O1xuICAgICAgICBsaW5lRGVsdGFZID0gbGluZS5zdGFydC55IC0gbGluZS5lbmQueTtcblxuICAgICAgICBmb3IgKHZhciBwID0gMjsgcCA8IHBvaW50cy5sZW5ndGg7IHArKykge1xuICAgICAgICAgICAgdmFyIG5leHRTZWdtZW50ID0gbmV3IFBoYXNlci5MaW5lKHBvaW50c1twLTFdWzBdLCBwb2ludHNbcC0xXVsxXSwgXG4gICAgICAgICAgICAgICAgcG9pbnRzW3BdWzBdLCBwb2ludHNbcF1bMV0pO1xuXG4gICAgICAgICAgICBpZiAoY2hlY2tJZkNvbGxpbmVhcihsaW5lLCBuZXh0U2VnbWVudCkpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRlbmQgdGhlIGN1cnJlbnQgbGluZVxuICAgICAgICAgICAgICAgIGxpbmUgPSBuZXcgUGhhc2VyLkxpbmUobGluZS5zdGFydC54LCBsaW5lLnN0YXJ0LnksIFxuICAgICAgICAgICAgXHRcdG5leHRTZWdtZW50LmVuZC54LCBuZXh0U2VnbWVudC5lbmQueSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVuZCB0aGUgY3VycmVudCBsaW5lIGFuZCBzdGFydCBhIG5ldyBvbmVcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICAgICAgICAgIGxpbmUgPSBuZXh0U2VnbWVudC5jbG9uZSgpOyAgICAgICAgICAgIFx0XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFByb2Nlc3MgdGhlIGxhc3QgbGluZSBzZWdtZW50IC0gY29ubmVjdGluZyB0aGUgbGFzdCBwb2ludCBpbiB0aGUgXG4gICAgICAgIC8vIGFycmF5IGJhY2sgYXJvdW5kIHRvIHRoZSBmaXJzdCBwb2ludFxuICAgICAgICAvLyBUT0RPOiB0aGVyZSdzIGEgY2xlYW5lciB3YXkgdG8gZG8gdGhpcy4uLlxuICAgICAgICB2YXIgbmV4dFNlZ21lbnQgPSBuZXcgUGhhc2VyLkxpbmUocG9pbnRzW3AtMV1bMF0sIHBvaW50c1twLTFdWzFdLCBcbiAgICAgICAgICAgIHBvaW50c1swXVswXSwgcG9pbnRzWzBdWzFdKTsgICBcbiAgICAgICAgaWYgKGNoZWNrSWZDb2xsaW5lYXIobGluZSwgbmV4dFNlZ21lbnQpKSB7XG4gICAgICAgICAgICAvLyBFeHRlbmQgdGhlIGN1cnJlbnQgbGluZSBhbmQgYWRkIGl0XG4gICAgICAgICAgICBsaW5lID0gbmV3IFBoYXNlci5MaW5lKGxpbmUuc3RhcnQueCwgbGluZS5zdGFydC55LCBcbiAgICAgICAgXHRcdG5leHRTZWdtZW50LmVuZC54LCBuZXh0U2VnbWVudC5lbmQueSk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWRkIHRoZSBsaW5lIGFuZCB0aGUgbmV4dCBzZWdtZW50XG4gICAgICAgICAgICBsaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICAgICAgbGluZXMucHVzaChuZXh0U2VnbWVudCk7ICAgICAgICAgXHRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHRoZSBsYXN0IGxpbmUgYW5kIHRoZSBmaXJzdCBsaW5lIG5lZWQgdG8gYmUgbWVyZ2VkXG4gICAgICAgIGlmIChjaGVja0lmQ29sbGluZWFyKGxpbmVzWzBdLCBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXSkpIHtcbiAgICAgICAgXHR2YXIgZmlyc3RMaW5lID0gbGluZXMuc2hpZnQoKTtcbiAgICAgICAgXHR2YXIgbGFzdExpbmUgPSBsaW5lcy5wb3AoKTtcbiAgICAgICAgXHR2YXIgY29tYmluZWRMaW5lID0gbmV3IFBoYXNlci5MaW5lKGZpcnN0TGluZS5zdGFydC54LCBcbiAgICAgICAgXHRcdGZpcnN0TGluZS5zdGFydC55LCBcbiAgICAgICAgXHRcdGxhc3RMaW5lLmVuZC54LCBsYXN0TGluZS5lbmQueSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiB0aGUgZmlyc3QgYW5kIGxhc3QgbGluZSBtYXkgbmVlZCB0byBiZSBtZXJnZWQhIFRoaXMgd29ya3MgcmlnaHRcbiAgICAgICAgLy8gbm93LCBidXQgbWF5IGJlIGdlbmVyYXRpbmcgb25lIG1vcmUgbGluZSB0aGFuIG5lZWRlZC4gXG5cbiAgICAgICAgLy8gQWRkIHRoZSBmaW5hbCBsaW5lcyB0byB0aGUgcG9seWdvblxuICAgICAgICBwb2x5Z29ucy5wdXNoKGxpbmVzKTtcblxuICAgIH1cbiAgICByZXR1cm4gcG9seWdvbnM7XG59XG5cbmZ1bmN0aW9uIGNoZWNrSWZDb2xsaW5lYXIobGluZTEsIGxpbmUyKSB7XG4gICAgLy8gVG8gY2hlY2sgaWYgdHdvIHNsb3BlcyBhcmUgZXF1YWw6XG4gICAgLy8gIGxpbmVEZWx0YVkgLyBsaW5lRGVsdGFYID0gc2VnbWVudERlbHRhWSAvIHNlZ21lbnREZWx0YVhcbiAgICAvLyBCdXQgdG8gYXZvaWQgZGl2aWRpbmcgYnkgemVybzpcbiAgICAvLyAgKGxpbmVEZWx0YVggKiBzZWdtZW50RGVsdGFZKSAtIChsaW5lRGVsdGFZICogc2VnbWVudERlbHRhWCkgPSAwXG5cdGR4MSA9IGxpbmUxLmVuZC54IC0gbGluZTEuc3RhcnQueDtcblx0ZHkxID0gbGluZTEuZW5kLnkgLSBsaW5lMS5zdGFydC55O1xuXHRkeDIgPSBsaW5lMi5lbmQueCAtIGxpbmUyLnN0YXJ0Lng7XG5cdGR5MiA9IGxpbmUyLmVuZC55IC0gbGluZTIuc3RhcnQueTtcblx0cmV0dXJuICgoZHgxICogZHkyKSAtIChkeTEgKiBkeDIpKSA9PT0gMDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IFNjb3JlS2VlcGVyO1xuXG5mdW5jdGlvbiBTY29yZUtlZXBlcigpIHtcblx0dGhpcy5fc2NvcmUgPSAwO1xufVxuXG5TY29yZUtlZXBlci5wcm90b3R5cGUuaW5jcmVtZW50U2NvcmUgPSBmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgaWYgKHBvaW50cyA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgdGhpcy5fc2NvcmUgKz0gcG9pbnRzO1xufTtcblxuU2NvcmVLZWVwZXIucHJvdG90eXBlLnNldFNjb3JlID0gZnVuY3Rpb24gKHBvaW50cykge1xuICAgIHRoaXMuX3Njb3JlID0gcG9pbnRzIHx8IDA7XG59O1xuXG5TY29yZUtlZXBlci5wcm90b3R5cGUuZ2V0U2NvcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njb3JlO1xufTsiLCJleHBvcnRzLmFwcGx5UmFuZG9tTGlnaHRuZXNzVGludCA9IGZ1bmN0aW9uIChzcHJpdGUsIGgsIHMsIGwpIHtcbiAgICBsICs9IHNwcml0ZS5nYW1lLnJuZC5yZWFsSW5SYW5nZSgtMC4xLCAwLjEpO1xuICAgIHZhciByZ2IgPSBQaGFzZXIuQ29sb3IuSFNMdG9SR0IoaCwgcywgbCk7XG4gICAgc3ByaXRlLnRpbnQgPSBQaGFzZXIuQ29sb3IuZ2V0Q29sb3IocmdiLnIsIHJnYi5nLCByZ2IuYik7XG59O1xuXG5leHBvcnRzLmNoZWNrT3ZlcmxhcFdpdGhHcm91cCA9IGZ1bmN0aW9uIChzcHJpdGUsIGdyb3VwLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgIC8vIExvb3AgdGhyb3VnaCBjaGlsZHJlbiBpbiBncm91cFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gZ3JvdXAuY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFBoYXNlci5Hcm91cCkge1xuICAgICAgICAgICAgLy8gSWYgY2hpbGQgaXMgYSBncm91cCwgcmVjdXJzaW9uIHRpbWVcbiAgICAgICAgICAgIGV4cG9ydHMuY2hlY2tPdmVybGFwV2l0aEdyb3VwKHNwcml0ZSwgY2hpbGQsIGNhbGxiYWNrLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIGNoaWxkIGlzIG5vdCBhIGdyb3VwLCBtYWtlIHN1cmUgaXQgaGFzIGEgU0FUIGJvZHlcbiAgICAgICAgICAgIGlmICghY2hpbGQuc2F0Qm9keSkgY29udGludWU7XG4gICAgICAgICAgICAvLyBDaGVjayBvdmVybGFwXG4gICAgICAgICAgICB2YXIgaXNPdmVybGFwID0gc3ByaXRlLnNhdEJvZHkudGVzdE92ZXJsYXAoY2hpbGQuc2F0Qm9keSk7XG4gICAgICAgICAgICBpZiAoaXNPdmVybGFwKSBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHNwcml0ZSwgY2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsImV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uICh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XG4gICAgcmV0dXJuICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHZhbHVlIDogZGVmYXVsdFZhbHVlO1xufTtcblxuZXhwb3J0cy5kZWZhdWx0UHJvcGVydGllcyA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnRpZXMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcGVydGllcykge1xuICAgICAgICBpZiAocHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBleHBvcnRzLmRlZmF1bHQocHJvcGVydGllc1trZXldLnZhbHVlLCBcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW2tleV0uZGVmYXVsdCk7XG4gICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLnJhbmRvbUJvb2xlYW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMikpO1xufTtcblxuZXhwb3J0cy5wb2ludEZyb21BbmdsZSA9IGZ1bmN0aW9uIChhbmdsZSwgaXNEZWdyZWVzKSB7XG4gICAgdmFyIHJhZGlhbnMgPSBpc0RlZ3JlZXMgPyAoYW5nbGUgKiBNYXRoLlBJIC8gMTgwKSA6IGFuZ2xlO1xuICAgIHJldHVybiBuZXcgUGhhc2VyLlBvaW50KE1hdGguY29zKHJhZGlhbnMpLCBNYXRoLnNpbihyYWRpYW5zKSk7XG59O1xuXG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uIChudW0sIG1pbjEsIG1heDEsIG1pbjIsIG1heDIsIG9wdGlvbnMpIHtcbiAgICB2YXIgbWFwcGVkID0gKG51bSAtIG1pbjEpIC8gKG1heDEgLSBtaW4xKSAqIChtYXgyIC0gbWluMikgKyBtaW4yO1xuICAgIGlmICghb3B0aW9ucykgcmV0dXJuIG1hcHBlZDtcbiAgICBpZiAob3B0aW9ucy5yb3VuZCAmJiBvcHRpb25zLnJvdW5kID09PSB0cnVlKSB7XG4gICAgICAgIG1hcHBlZCA9IE1hdGgucm91bmQobWFwcGVkKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZmxvb3IgJiYgb3B0aW9ucy5mbG9vciA9PT0gdHJ1ZSkge1xuICAgICAgICBtYXBwZWQgPSBNYXRoLmZsb29yKG1hcHBlZCk7ICAgICAgICBcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuY2VpbCAmJiBvcHRpb25zLmNlaWwgPT09IHRydWUpIHtcbiAgICAgICAgbWFwcGVkID0gTWF0aC5jZWlsKG1hcHBlZCk7ICAgICAgICBcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuY2xhbXAgJiYgb3B0aW9ucy5jbGFtcCA9PT0gdHJ1ZSkge1xuICAgICAgICBtYXBwZWQgPSBNYXRoLm1pbihtYXBwZWQsIG1heDIpO1xuICAgICAgICBtYXBwZWQgPSBNYXRoLm1heChtYXBwZWQsIG1pbjIpO1xuICAgIH1cbiAgICByZXR1cm4gbWFwcGVkO1xufTsiLCJ2YXIgU2FuZGJveCA9IHJlcXVpcmUoXCIuL3N0YXRlcy9zYW5kYm94LmpzXCIpO1xudmFyIEJvb3RTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlcy9ib290LXN0YXRlLmpzXCIpO1xudmFyIExvYWRTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlcy9sb2FkLXN0YXRlLmpzXCIpO1xudmFyIFN0YXJ0U2NyZWVuID0gcmVxdWlyZShcIi4vc3RhdGVzL3N0YXJ0LXNjcmVlbi5qc1wiKTtcblxuLy8gS2VlcCB0aGlzIG9uIENBTlZBUyB1bnRpbCBQaGFzZXIgMyBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucz9cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNjAwLCBQaGFzZXIuQ0FOVkFTLCBcImdhbWUtY29udGFpbmVyXCIpO1xuXG5nYW1lLnN0YXRlLmFkZChcImJvb3RcIiwgQm9vdFN0YXRlKTtcbmdhbWUuc3RhdGUuYWRkKFwibG9hZFwiLCBMb2FkU3RhdGUpO1xuZ2FtZS5zdGF0ZS5hZGQoXCJzdGFydFwiLCBTdGFydFNjcmVlbik7XG5nYW1lLnN0YXRlLmFkZChcInNhbmRib3hcIiwgU2FuZGJveCk7XG5nYW1lLnN0YXRlLnN0YXJ0KFwiYm9vdFwiKTsiLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQgUmFwaGHDq2wgUm91eFxuXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIFxuICpcbiAqL1xuXG4vKipcbiAqIEBhdXRob3IgICAgICAgUmFwaGHDq2wgUm91eFxuICogQGNvcHlyaWdodCAgICAyMDE0IFJhcGhhw6tsIFJvdXhcbiAqIEBsaWNlbnNlICAgICAge0BsaW5rIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVR9XG4gKi9cblxuLyoqXG4qIEFTdGFyIGlzIGEgcGhhc2VyIHBhdGhmaW5kaW5nIHBsdWdpbiBiYXNlZCBvbiBhbiBBKiBraW5kIG9mIGFsZ29yeXRobSBcbiogSXQgd29ya3Mgd2l0aCB0aGUgUGhhc2VyLlRpbGVtYXBcbipcbiogQGNsYXNzIFBoYXNlci5QbHVnaW4uQVN0YXJcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7QW55fSBwYXJlbnQgLSBUaGUgb2JqZWN0IHRoYXQgb3ducyB0aGlzIHBsdWdpbiwgdXN1YWxseSBQaGFzZXIuUGx1Z2luTWFuYWdlci5cbiovXG5cblBoYXNlci5QbHVnaW4uQVN0YXIgPSBmdW5jdGlvbiAoZ2FtZSwgcGFyZW50KVxue1xuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge0FueX0gcGFyZW50IC0gVGhlIHBhcmVudCBvZiB0aGlzIHBsdWdpbi4gSWYgYWRkZWQgdG8gdGhlIFBsdWdpbk1hbmFnZXIgdGhlIHBhcmVudCB3aWxsIGJlIHNldCB0byB0aGF0LCBvdGhlcndpc2UgaXQgd2lsbCBiZSBudWxsLlxuICAgICovXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7UGhhc2VyLlRpbGVtYXB9IF90aWxlbWFwIC0gQSByZWZlcmVuY2UgdG8gdGhlIHRpbGVtYXAgdXNlZCB0byBzdG9yZSBhc3RhciBub2RlcyBhY2NvcmRpbmcgdG8gdGhlIFBoYXNlci5UaWxlbWFwIHN0cnVjdHVyZS5cbiAgICAqL1xuICAgIHRoaXMuX3RpbGVtYXA7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBfbGF5ZXJJbmRleCAtIFRoZSBsYXllciBpbmRleCBvZiB0aGUgdGlsZW1hcCB0aGF0IGlzIHVzZWQgdG8gc3RvcmUgYXN0YXIgbm9kZXMuXG4gICAgKi9cbiAgICB0aGlzLl9sYXllckluZGV4O1xuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0gX3RpbGVzZXRJbmRleCAtIFRoZSB0aWxlc2V0IGluZGV4IG9mIHRoZSB0aWxlc2V0IHRoYXQgaGFuZGxlIHRpbGVzIHByb3BlcnRpZXMuXG4gICAgKi9cbiAgICB0aGlzLl90aWxlc2V0SW5kZXg7XG4gICBcbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7YXJyYXl9IF9vcGVuIC0gQW4gYXJyYXkgdGhhdCByZWZlcmVuY2VzIG5vZGVzIHRvIGJlIGNvbnNpZGVyZWQgYnkgdGhlIHNlYXJjaCBwYXRoIGFsZ29yeXRobS5cbiAgICAqL1xuICAgIHRoaXMuX29wZW47IFxuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge2FycmF5fSBfY2xvc2VkIC0gQW4gYXJyYXkgdGhhdCByZWZlcmVuY2VzIG5vZGVzIG5vdCB0byBjb25zaWRlciBhbnltb3JlLlxuICAgICovXG4gICAgdGhpcy5fY2xvc2VkOyBcbiAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHthcnJheX0gX3Zpc2l0ZWQgLSBJbnRlcm5hbCBhcnJheSBvZiB2aXNpdGVkIHRpbGVzLCB1c2UgZm9yIGRlYnVnIHB1cG9zZS5cbiAgICAqL1xuICAgIHRoaXMuX3Zpc2l0ZWQ7IFxuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IF91c2VEaWFnb25hbCAtIERvZXMgdGhlIGFzdGFyIGFsZ29yeXRobSBjYW4gdXNlIHRpbGUgZGlhZ29uYWw/XG4gICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgKi9cbiAgICB0aGlzLl91c2VEaWFnb25hbCA9IHRydWU7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gX2ZpbmRDbG9zZXN0IC0gRG9lcyB0aGUgZmluZFBhdGggYWxnb3J5dGhtIG11c3QgY2FsY3VsYXRlIHRoZSBjbG9zZXN0IHJlc3VsdCBpZiBkZXN0aW5hdGlvbiBpcyB1bnJlYWNoYWJsZS4gSWYgbm90IGZpbmRQYXRoIHdpbGwgcmV0dXJuIGFuIGVtcHR5IGFycmF5XG4gICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgKi9cbiAgICB0aGlzLl9maW5kQ2xvc2VzdCA9IHRydWU7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBfd2Fsa2FibGVQcm9wTmFtZSAtIFdpY2ggbmFtZSBoYXZlIHRoZSB3YWxrYWJsZSBwcm9wZXJ0aXkgaW4geW91ciB0aWxlc2V0LlxuICAgICogQGRlZmF1bHQgJ3dhbGthYmxlJ1xuICAgICovXG4gICAgdGhpcy5fd2Fsa2FibGVQcm9wTmFtZSA9ICd3YWxrYWJsZSc7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IF9kaXN0YW5jZUZ1bmN0aW9uIC0gVGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIGRpc3RhbmNlLlxuICAgICovXG4gICAgdGhpcy5fZGlzdGFuY2VGdW5jdGlvbiA9IFBoYXNlci5QbHVnaW4uQVN0YXIuRElTVEFOQ0VfRVVDTElESUFOO1xuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge1BoYXNlci5QbHVnaW4uQVN0YXIuQVN0YXJQYXRofSBfbGFzdFBhdGggLSBUaGUgbGFzdCBwYXRoIGNhbGN1bGF0ZWQgYnkgYXN0YXIuXG4gICAgKi9cbiAgICB0aGlzLl9sYXN0UGF0aCA9IG51bGw7IFxuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IF9kZWJ1ZyAtIEJvb2xlYW4gdG8gZGVidWcgbW9kZSwgc3RvcmVzIHZpc2l0ZWQgbm9kZXMsIGFuZCBoYXZlIGEgY29zdC4gRGlzYWJsZSBpbiBwcm9kdWN0aW9uLlxuICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAqL1xuICAgIHRoaXMuX2RlYnVnID0gdHJ1ZTtcbn07XG5cblBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuUGx1Z2luLnByb3RvdHlwZSk7XG5QaGFzZXIuUGx1Z2luLkFTdGFyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBoYXNlci5QbHVnaW4uQVN0YXI7XG5cblxuUGhhc2VyLlBsdWdpbi5BU3Rhci5WRVJTSU9OID0gJzAuMC4xMDEnO1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5DT1NUX09SVEhPR09OQUwgPSAxO1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5DT1NUX0RJQUdPTkFMID0gUGhhc2VyLlBsdWdpbi5BU3Rhci5DT1NUX09SVEhPR09OQUwqTWF0aC5zcXJ0KDIpO1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5ESVNUQU5DRV9NQU5IQVRUQU4gPSAnZGlzdE1hbmhhdHRhbic7XG5QaGFzZXIuUGx1Z2luLkFTdGFyLkRJU1RBTkNFX0VVQ0xJRElBTiA9ICdkaXN0RXVjbGlkaWFuJztcblxuLyoqXG4gKiBTZXRzIHRoZSBQaGFzZXIuVGlsZW1hcCB1c2VkIHRvIHNlYXJjaFBhdGggaW50by5cbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3RhciNzZXRBU3Rhck1hcFxuICogQHB1YmxpY1xuICogQHBhcmFtIHtQaGFzZXIuVGlsZW1hcH0gbWFwIC0gdGhlIFBoYXNlci5UaWxlbWFwIHVzZWQgdG8gc2VhcmNoUGF0aCBpbnRvLiBJdCBtdXN0IGhhdmUgYSB0aWxlc2V0IHdpdGggdGlsZSBwb3JwZXJ0aWVzIHRvIGtub3cgaWYgdGlsZXMgYXJlIHdhbGthYmxlIG9yIG5vdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBsYXllck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbGF5ZXIgdGhhdCBoYW5kbGUgdGlsZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGlsZXNldE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdGlsZXNldCB0aGF0IGhhdmUgd2Fsa2FibGUgcHJvcGVydGllcy5cbiAqIEByZXR1cm4ge1BoYXNlci5QbHVnaW4uQVN0YXJ9IFRoZSBQaGFzZXIuUGx1Z2luLkFTdGFyIGl0c2VsZi5cbiAqL1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5wcm90b3R5cGUuc2V0QVN0YXJNYXAgPSBmdW5jdGlvbihtYXAsIGxheWVyTmFtZSwgdGlsZXNldE5hbWUpXG57XG4gICAgdGhpcy5fdGlsZW1hcCA9IG1hcDtcbiAgICB0aGlzLl9sYXllckluZGV4ID0gdGhpcy5fdGlsZW1hcC5nZXRMYXllckluZGV4KGxheWVyTmFtZSk7O1xuICAgIHRoaXMuX3RpbGVzZXRJbmRleCA9IHRoaXMuX3RpbGVtYXAuZ2V0VGlsZXNldEluZGV4KHRpbGVzZXROYW1lKTtcblxuICAgIHRoaXMudXBkYXRlTWFwKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBQaGFzZXIuVGlsZW1hcCB1c2VkIHRvIHNlYXJjaFBhdGggaW50by5cbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3Rhci1zZXRBU3Rhck1hcFxuICogQHByaXZhdGVcbiAqIEByZXR1cm4ge3ZvaWR9IFRoZSBQaGFzZXIuUGx1Z2luLkFTdGFyIGl0c2VsZi5cbiAqL1xuIFBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlLnVwZGF0ZU1hcCA9IGZ1bmN0aW9uKClcbntcbiAgICB2YXIgdGlsZTtcbiAgICB2YXIgd2Fsa2FibGU7XG5cbiAgICAvL2ZvciBlYWNoIHRpbGUsIGFkZCBhIGRlZmF1bHQgQVN0YXJOb2RlIHdpdGggeCwgeSBhbmQgd2Fsa2FibGUgcHJvcGVydGllcyBhY2NvcmRpbmcgdG8gdGhlIHRpbGVtYXAvdGlsZXNldCBkYXRhc1xuICAgIGZvcih2YXIgeT0wOyB5IDwgdGhpcy5fdGlsZW1hcC5oZWlnaHQ7IHkrKylcbiAgICB7XG4gICAgICAgIGZvcih2YXIgeD0wOyB4IDwgdGhpcy5fdGlsZW1hcC53aWR0aDsgeCsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5fdGlsZW1hcC5sYXllcnNbdGhpcy5fbGF5ZXJJbmRleF0uZGF0YVt5XVt4XTtcblxuICAgICAgICAgICAgLy8gSWYgdGlsZSBpcyB1bmRlZmluZWQgb3IgdGlsZSBkb2Vzbid0IGhhdmUgY29sbGlzaW9ucyBzZXQgdXAsIHRoZW5cbiAgICAgICAgICAgIC8vIGl0J3Mgd2Fsa2FibGVcbiAgICAgICAgICAgIHdhbGthYmxlID0gIXRpbGUuY29sbGlkZXM7XG4gICAgICAgICAgICAvLyB3YWxrYWJsZSA9IHRoaXMuX3RpbGVtYXAudGlsZXNldHNbdGhpcy5fdGlsZXNldEluZGV4XS50aWxlUHJvcGVydGllc1t0aWxlLmluZGV4IC0gMV1bdGhpcy5fd2Fsa2FibGVQcm9wTmFtZV0gIT09IFwiZmFsc2VcIiA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGlsZS5wcm9wZXJ0aWVzLmFzdGFyTm9kZSA9IG5ldyBQaGFzZXIuUGx1Z2luLkFTdGFyLkFTdGFyTm9kZSh4LCB5LCB3YWxrYWJsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cblxuLyoqXG4gKiBGaW5kIGEgcGF0aCBiZXR3ZWVuIHRvIHRpbGVzIGNvb3JkaW5hdGVzXG4gKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uQVN0YXIjZmluZFBhdGhcbiAqIEBwdWJsaWNcbiAqIEBwYXJhbSB7UGhhc2VyLlBvaW50fSBzdGFydFBvaW50IC0gVGhlIHN0YXJ0IHBvaW50IHgsIHkgaW4gdGlsZXMgY29vcmRpbmF0ZXMgdG8gc2VhcmNoIGEgcGF0aC5cbiAqIEBwYXJhbSB7UGhhc2VyLlBvaW50fSBnb2FsUG9pbnQgLSBUaGUgZ29hbCBwb2ludCB4LCB5IGluIHRpbGVzIGNvb3JkaW5hdGVzIHRoYXQgeW91IHRyeWluZyB0byByZWFjaC5cbiAqIEByZXR1cm4ge1BoYXNlci5QbHVnaW4uQVN0YXIuQVN0YXJQYXRofSBUaGUgUGhhc2VyLlBsdWdpbi5BU3Rhci5BU3RhclBhdGggdGhhdCByZXN1bHRzXG4gKi9cblBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlLmZpbmRQYXRoID0gZnVuY3Rpb24oc3RhcnRQb2ludCwgZ29hbFBvaW50KVxue1xuICAgIHZhciBwYXRoID0gbmV3IFBoYXNlci5QbHVnaW4uQVN0YXIuQVN0YXJQYXRoKCk7XG5cblxuICAgIC8vIE5PVEUocmV4KTogVGhpcyBpcyB3aGVyZSB0aGluZ3MgYnJlYWsgaWYgdGhlIGVuZW15IGlzIG91dHNpZGUgb2YgdGhlIHRpbGUgcmFuZ2UuXG4gICAgdmFyIHN0YXJ0ID0gdGhpcy5fdGlsZW1hcC5sYXllcnNbdGhpcy5fbGF5ZXJJbmRleF0uZGF0YVtzdGFydFBvaW50LnldW3N0YXJ0UG9pbnQueF0ucHJvcGVydGllcy5hc3Rhck5vZGU7IC8vOkFTdGFyTm9kZTtcbiAgICB2YXIgZ29hbCA9IHRoaXMuX3RpbGVtYXAubGF5ZXJzW3RoaXMuX2xheWVySW5kZXhdLmRhdGFbZ29hbFBvaW50LnldW2dvYWxQb2ludC54XS5wcm9wZXJ0aWVzLmFzdGFyTm9kZVxuXG4gICAgcGF0aC5zdGFydCA9IHN0YXJ0O1xuICAgIHBhdGguZ29hbCA9IGdvYWw7XG5cbiAgICB0aGlzLl9vcGVuID0gW107XG4gICAgdGhpcy5fY2xvc2VkID0gW107XG4gICAgdGhpcy5fdmlzaXRlZCA9IFtdO1xuICAgXG4gICAgdGhpcy5fb3Blbi5wdXNoKHN0YXJ0KTtcbiAgICBcbiAgICBzdGFydC5nID0gMDtcbiAgICBzdGFydC5oID0gdGhpc1t0aGlzLl9kaXN0YW5jZUZ1bmN0aW9uXShzdGFydCwgZ29hbCk7XG4gICAgc3RhcnQuZiA9IHN0YXJ0Lmg7XG4gICAgc3RhcnQucGFyZW50ID0gbnVsbDsgICAgICAgICAgICAgICAgICAgIFxuICAgXG4gICAgLy9Mb29wIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIG5vZGVzIHRvIHNlYXJjaFxuICAgIHdoaWxlKHRoaXMuX29wZW4ubGVuZ3RoID4gMCkgXG4gICAge1xuICAgICAgICAvL0ZpbmQgbG93ZXN0IGYgaW4gdGhpcy5fb3BlblxuICAgICAgICB2YXIgZiA9IEluZmluaXR5O1xuICAgICAgICB2YXIgeDtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMuX29wZW4ubGVuZ3RoOyBpKyspIFxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5fb3BlbltpXS5mIDwgZikgXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgeCA9IHRoaXMuX29wZW5baV07XG4gICAgICAgICAgICAgICAgZiA9IHguZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICAvL1NvbHV0aW9uIGZvdW5kLCByZXR1cm4gc29sdXRpb25cbiAgICAgICAgaWYgKHggPT0gZ29hbCkgXG4gICAgICAgIHtcbiAgICAgICAgICAgIHBhdGgubm9kZXMgPSB0aGlzLnJlY29uc3RydWN0UGF0aChnb2FsKTtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RQYXRoID0gcGF0aDtcbiAgICAgICAgICAgIGlmKHRoaXMuX2RlYnVnID09PSB0cnVlKSBwYXRoLnZpc2l0ZWQgPSB0aGlzLl92aXNpdGVkO1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH0gICAgXG4gICAgICAgXG4gICAgICAgIC8vQ2xvc2UgY3VycmVudCBub2RlXG4gICAgICAgIHRoaXMuX29wZW4uc3BsaWNlKHRoaXMuX29wZW4uaW5kZXhPZih4KSwgMSk7XG4gICAgICAgIHRoaXMuX2Nsb3NlZC5wdXNoKHgpO1xuICAgICAgIFxuICAgICAgICAvL1RoZW4gZ2V0IGl0cyBuZWlnaGJvcnMgICAgICAgXG4gICAgICAgIHZhciBuID0gdGhpcy5uZWlnaGJvcnMoeCk7XG5cbiAgICAgICAgZm9yKHZhciB5SW5kZXg9MDsgeUluZGV4IDwgbi5sZW5ndGg7IHlJbmRleCsrKSBcbiAgICAgICAge1xuXG4gICAgICAgICAgICB2YXIgeSA9IG5beUluZGV4XTtcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKC0xICE9IHRoaXMuX2Nsb3NlZC5pbmRleE9mKHkpKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBnID0geC5nICsgeS50cmF2ZWxDb3N0O1xuICAgICAgICAgICAgdmFyIGJldHRlciA9IGZhbHNlO1xuICAgICAgICAgICBcbiAgICAgICAgICAgIC8vQWRkIHRoZSBub2RlIGZvciBiZWluZyBjb25zaWRlcmVkIG5leHQgbG9vcC5cbiAgICAgICAgICAgIGlmICgtMSA9PSB0aGlzLl9vcGVuLmluZGV4T2YoeSkpIFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcGVuLnB1c2goeSk7XG4gICAgICAgICAgICAgICAgICAgIGJldHRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRoaXMuX2RlYnVnID09PSB0cnVlKSB0aGlzLnZpc2l0KHkpO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIGVsc2UgaWYgKGcgPCB5LmcpIFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBiZXR0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYmV0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHkucGFyZW50ID0geDtcbiAgICAgICAgICAgICAgICAgICAgeS5nID0gZztcbiAgICAgICAgICAgICAgICAgICAgeS5oID0gdGhpc1t0aGlzLl9kaXN0YW5jZUZ1bmN0aW9uXSh5LCBnb2FsKTtcbiAgICAgICAgICAgICAgICAgICAgeS5mID0geS5nICsgeS5oO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgICAgXG4gICAgfVxuXG4gICAgLy9JZiBubyBzb2x1dGlvbiBmb3VuZCwgZG9lcyBBKiB0cnkgdG8gcmV0dXJuIHRoZSBjbG9zZXN0IHJlc3VsdD9cbiAgICBpZih0aGlzLl9maW5kQ2xvc2VzdCA9PT0gdHJ1ZSlcbiAgICB7XG4gICAgICAgIHZhciBtaW4gPSBJbmZpbml0eTtcbiAgICAgICAgdmFyIGNsb3Nlc3RHb2FsLCBub2RlLCBkaXN0O1xuICAgICAgICBmb3IodmFyIGk9MCwgaWk9dGhpcy5fY2xvc2VkLmxlbmd0aDsgaTxpaTsgaSsrKSBcbiAgICAgICAge1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuX2Nsb3NlZFtpXTtcblxuICAgICAgICAgICAgdmFyIGRpc3QgPSB0aGlzW3RoaXMuX2Rpc3RhbmNlRnVuY3Rpb25dKGdvYWwsIG5vZGUpO1xuICAgICAgICAgICAgaWYgKGRpc3QgPCBtaW4pIFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1pbiA9IGRpc3Q7XG4gICAgICAgICAgICAgICAgY2xvc2VzdEdvYWwgPSBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9SZWNvbnN0cnVjdCBhIHBhdGggYSBwYXRoIGZyb20gdGhlIGNsb3Nlc3RHb2FsXG4gICAgICAgIHBhdGgubm9kZXMgPSB0aGlzLnJlY29uc3RydWN0UGF0aChjbG9zZXN0R29hbCk7XG4gICAgICAgIGlmKHRoaXMuX2RlYnVnID09PSB0cnVlKSBwYXRoLnZpc2l0ZWQgPSB0aGlzLl92aXNpdGVkO1xuICAgIH1cblxuICAgIHRoaXMuX2xhc3RQYXRoID0gcGF0aDtcblxuICAgIHJldHVybiBwYXRoOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxufTtcblxuXG4vKipcbiAqIFJlY29uc3RydWN0IHRoZSByZXN1bHQgcGF0aCBiYWNrd2FyZHMgZnJvbSB0aGUgZ29hbCBwb2ludCwgY3Jhd2xpbmcgaXRzIHBhcmVudHMuIEludGVybmFsIG1ldGhvZC5cbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3Rhci1yZWNvbnN0cnVjdFBhdGhcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1BoYXNlci5QbHVnaW4uQVN0YXIuQVN0YXJOb2RlfSBuIC0gVGhlIGFzdGFyIG5vZGUgZnJvbSB3aWNoIHlvdSB3YW50IHRvIHJlYnVpbGQgdGhlIHBhdGguXG4gKiBAcmV0dXJuIHthcnJheX0gQW4gYXJyYXkgb2YgUGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGVcbiAqLyBcblBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlLnJlY29uc3RydWN0UGF0aCA9IGZ1bmN0aW9uKG4pIFxue1xuICAgIHZhciBzb2x1dGlvbiA9IFtdO1xuICAgIHZhciBubiA9IG47XG4gICAgd2hpbGUobm4ucGFyZW50KSB7XG4gICAgICAgICAgICBzb2x1dGlvbi5wdXNoKHt4OiBubi54LCB5OiBubi55fSk7XG4gICAgICAgICAgICBubiA9IG5uLnBhcmVudDtcbiAgICB9XG4gICAgcmV0dXJuIHNvbHV0aW9uO1xufTtcblxuIFxuLyoqXG4gKiBBZGQgYSBub2RlIGludG8gdmlzaXRlZCBpZiBpdCBpcyBub3QgYWxyZWFkeSBpbi4gRGVidWcgb25seS5cbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3Rhci12aXNpdFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7UGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGV9IG5vZGUgLSBUaGUgYXN0YXIgbm9kZSB5b3Ugd2FudCB0byByZWdpc3RlciBhcyB2aXNpdGVkXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovIFxuUGhhc2VyLlBsdWdpbi5BU3Rhci5wcm90b3R5cGUudmlzaXQgPSBmdW5jdGlvbihub2RlKVxue1xuICAgIGZvcih2YXIgaSBpbiB0aGlzLl92aXNpdGVkKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMuX3Zpc2l0ZWRbaV0gPT0gbm9kZSkgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3Zpc2l0ZWQucHVzaChub2RlKTtcbn07XG4gICBcblxuLyoqXG4gKiBBZGQgYSBub2RlIGludG8gdmlzaXRlZCBpZiBpdCBpcyBub3QgYWxyZWFkeSBpbi4gRGVidWcgb25seS5cbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3Rhci1uZWlnaGJvcnNcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1BoYXNlci5QbHVnaW4uQVN0YXIuQVN0YXJOb2RlfSBuIC0gVGhlIGFzdGFyIG5vZGUgeW91IHdhbnQgdG8gcmVnaXN0ZXIgYXMgdmlzaXRlZFxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5wcm90b3R5cGUubmVpZ2hib3JzID0gZnVuY3Rpb24obm9kZSlcbntcbiAgICB2YXIgeCA9IG5vZGUueDtcbiAgICB2YXIgeSA9IG5vZGUueTtcbiAgICB2YXIgbiA9IG51bGw7XG4gICAgdmFyIG5laWdoYm9ycyA9IFtdO1xuICAgXG4gICAgdmFyIG1hcCA9IHRoaXMuX3RpbGVtYXAubGF5ZXJzW3RoaXMuX2xheWVySW5kZXhdLmRhdGE7XG5cbiAgICAvL1dlc3RcbiAgICBpZiAoeCA+IDApIHtcbiAgICAgICAgICAgXG4gICAgICAgIG4gPSBtYXBbeV1beC0xXS5wcm9wZXJ0aWVzLmFzdGFyTm9kZTtcbiAgICAgICAgaWYgKG4ud2Fsa2FibGUpIHtcbiAgICAgICAgICAgIG4udHJhdmVsQ29zdCA9IFBoYXNlci5QbHVnaW4uQVN0YXIuQ09TVF9PUlRIT0dPTkFMO1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2gobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy9FYXN0XG4gICAgaWYgKHggPCB0aGlzLl90aWxlbWFwLndpZHRoLTEpIHtcbiAgICAgICAgbiA9IG1hcFt5XVt4KzFdLnByb3BlcnRpZXMuYXN0YXJOb2RlO1xuICAgICAgICBpZiAobi53YWxrYWJsZSkge1xuICAgICAgICAgICAgbi50cmF2ZWxDb3N0ID0gUGhhc2VyLlBsdWdpbi5BU3Rhci5DT1NUX09SVEhPR09OQUw7XG4gICAgICAgICAgICBuZWlnaGJvcnMucHVzaChuKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvL05vcnRoXG4gICAgaWYgKHkgPiAwKSB7XG4gICAgICAgIG4gPSBtYXBbeS0xXVt4XS5wcm9wZXJ0aWVzLmFzdGFyTm9kZTtcbiAgICAgICAgaWYgKG4ud2Fsa2FibGUpIHtcbiAgICAgICAgICAgIG4udHJhdmVsQ29zdCA9IFBoYXNlci5QbHVnaW4uQVN0YXIuQ09TVF9PUlRIT0dPTkFMO1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2gobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy9Tb3V0aFxuICAgIGlmICh5IDwgdGhpcy5fdGlsZW1hcC5oZWlnaHQtMSkge1xuICAgICAgICBuID0gbWFwW3krMV1beF0ucHJvcGVydGllcy5hc3Rhck5vZGU7XG4gICAgICAgIGlmIChuLndhbGthYmxlKSB7XG4gICAgICAgICAgICBuLnRyYXZlbENvc3QgPSBQaGFzZXIuUGx1Z2luLkFTdGFyLkNPU1RfT1JUSE9HT05BTDtcbiAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKG4pO1xuICAgICAgICB9XG4gICAgfVxuICAgXG4gICAgLy9JZiBkaWFnb25hbHMgYXJlbid0IHVzZWQgZG8gbm90IHNlYXJjaCBmb3Igb3RoZXIgbmVpZ2hib3JzIGFuZCByZXR1cm4gb3J0aG9nb25hbCBzZWFyY2ggcmVzdWx0XG4gICAgaWYodGhpcy5fdXNlRGlhZ29uYWwgPT09IGZhbHNlKVxuICAgICAgICByZXR1cm4gbmVpZ2hib3JzO1xuICAgXG4gICAgLy9Ob3J0aFdlc3RcbiAgICBpZiAoeCA+IDAgJiYgeSA+IDApIHtcbiAgICAgICAgbiA9IG1hcFt5LTFdW3gtMV0ucHJvcGVydGllcy5hc3Rhck5vZGU7XG4gICAgICAgIGlmIChuLndhbGthYmxlXG4gICAgICAgICAgICAmJiBtYXBbeV1beC0xXS5wcm9wZXJ0aWVzLmFzdGFyTm9kZS53YWxrYWJsZVxuICAgICAgICAgICAgJiYgbWFwW3ktMV1beF0ucHJvcGVydGllcy5hc3Rhck5vZGUud2Fsa2FibGVcbiAgICAgICAgKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG4udHJhdmVsQ29zdCA9IFBoYXNlci5QbHVnaW4uQVN0YXIuQ09TVF9ESUFHT05BTDtcbiAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKG4pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vTm9ydGhFYXN0XG4gICAgaWYgKHggPCB0aGlzLl90aWxlbWFwLndpZHRoLTEgJiYgeSA+IDApIHtcbiAgICAgICAgbiA9IG1hcFt5LTFdW3grMV0ucHJvcGVydGllcy5hc3Rhck5vZGU7XG4gICAgICAgIGlmIChuLndhbGthYmxlXG4gICAgICAgICAgICAmJiBtYXBbeV1beCsxXS5wcm9wZXJ0aWVzLmFzdGFyTm9kZS53YWxrYWJsZVxuICAgICAgICAgICAgJiYgbWFwW3ktMV1beF0ucHJvcGVydGllcy5hc3Rhck5vZGUud2Fsa2FibGVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBuLnRyYXZlbENvc3QgPSBQaGFzZXIuUGx1Z2luLkFTdGFyLkNPU1RfRElBR09OQUw7XG4gICAgICAgICAgICBuZWlnaGJvcnMucHVzaChuKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvL1NvdXRoV2VzdFxuICAgIGlmICh4ID4gMCAmJiB5IDwgdGhpcy5fdGlsZW1hcC5oZWlnaHQtMSkge1xuICAgICAgICBuID0gbWFwW3krMV1beC0xXS5wcm9wZXJ0aWVzLmFzdGFyTm9kZTtcbiAgICAgICAgaWYgKG4ud2Fsa2FibGVcbiAgICAgICAgICAgICYmIG1hcFt5XVt4LTFdLnByb3BlcnRpZXMuYXN0YXJOb2RlLndhbGthYmxlXG4gICAgICAgICAgICAmJiBtYXBbeSsxXVt4XS5wcm9wZXJ0aWVzLmFzdGFyTm9kZS53YWxrYWJsZVxuICAgICAgICApIHtcbiAgICAgICAgICAgIG4udHJhdmVsQ29zdCA9IFBoYXNlci5QbHVnaW4uQVN0YXIuQ09TVF9ESUFHT05BTDtcbiAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKG4pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vU291dGhFYXN0XG4gICAgaWYgKHggPCB0aGlzLl90aWxlbWFwLndpZHRoLTEgJiYgeSA8IHRoaXMuX3RpbGVtYXAuaGVpZ2h0LTEpIHtcbiAgICAgICAgbiA9IG1hcFt5KzFdW3grMV0ucHJvcGVydGllcy5hc3Rhck5vZGU7XG4gICAgICAgIGlmIChuLndhbGthYmxlXG4gICAgICAgICAgICAmJiBtYXBbeV1beCsxXS5wcm9wZXJ0aWVzLmFzdGFyTm9kZS53YWxrYWJsZVxuICAgICAgICAgICAgJiYgbWFwW3krMV1beF0ucHJvcGVydGllcy5hc3Rhck5vZGUud2Fsa2FibGVcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBuLnRyYXZlbENvc3QgPSBQaGFzZXIuUGx1Z2luLkFTdGFyLkNPU1RfRElBR09OQUw7XG4gICAgICAgICAgICBuZWlnaGJvcnMucHVzaChuKTtcbiAgICAgICAgfVxuICAgIH1cbiAgIFxuICAgIHJldHVybiBuZWlnaGJvcnM7XG59O1xuXG5cbi8qKlxuICogQ2FsY3VsYXRlIGEgZGlzdGFuY2UgYmV0d2VlbiB0b3cgYXN0YXIgbm9kZXMgY29vcmRpbmF0ZXMgYWNjb3JkaW5nIHRvIHRoZSBNYW5oYXR0YW4gbWV0aG9kXG4gKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uQVN0YXItZGlzdE1hbmhhdHRhblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7UGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGV9IG5vZGVBIC0gVGhlIEEgbm9kZS5cbiAqIEBwYXJhbSB7UGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGV9IG5vZGVCIC0gVGhlIEIgbm9kZS5cbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIGRpc3RhbmNlIGJldHdlZW4gbm9kZUEgYW5kIG5vZGVCXG4gKi9cblBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlLmRpc3RNYW5oYXR0YW4gPSBmdW5jdGlvbiAobm9kZUEsIG5vZGVCKSBcbntcbiAgICByZXR1cm4gTWF0aC5hYnMobm9kZUEueCAtIG5vZGVCLngpICsgTWF0aC5hYnMobm9kZUEueSAtIG5vZGVCLnkpO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGUgYSBkaXN0YW5jZSBiZXR3ZWVuIHRvdyBhc3RhciBub2RlcyBjb29yZGluYXRlcyBhY2NvcmRpbmcgdG8gdGhlIEV1Y2xpZGlhbiBtZXRob2QuIE1vcmUgYWNjdXJhdGVcbiAqIEBtZXRob2QgUGhhc2VyLlBsdWdpbi5BU3Rhci1kaXN0RXVjbGlkaWFuXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtQaGFzZXIuUGx1Z2luLkFTdGFyLkFTdGFyTm9kZX0gbm9kZUEgLSBUaGUgQSBub2RlLlxuICogQHBhcmFtIHtQaGFzZXIuUGx1Z2luLkFTdGFyLkFTdGFyTm9kZX0gbm9kZUIgLSBUaGUgQiBub2RlLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgZGlzdGFuY2UgYmV0d2VlbiBub2RlQSBhbmQgbm9kZUJcbiAqL1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5wcm90b3R5cGUuZGlzdEV1Y2xpZGlhbiA9IGZ1bmN0aW9uKG5vZGVBLCBub2RlQilcbntcbiAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KChub2RlQS54IC0gbm9kZUIueCksIDIpICsgTWF0aC5wb3coKG5vZGVBLnkgIC1ub2RlQi55KSwgMikpO1xufTtcblxuXG4vKipcbiAqIFRlbGxzIGlmIGEgdGlsZSBpcyB3YWxrYWJsZSBmcm9tIGl0cyB0aWxlbWFwIGNvb3JkaW5hdGVzXG4gKiBAbWV0aG9kIFBoYXNlci5QbHVnaW4uQVN0YXItaXNXYWxrYWJsZVxuICogQHB1YmxpY1xuICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb29yZGlhbnRlIG9mIHRoZSB0aWxlIGluIHRpbGVtYXAncyBjb29yZGluYXRlLlxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSB0aWxlIGluIHRpbGVtYXAncyBjb29yZGluYXRlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVGhlIGRpc3RhbmNlIGJldHdlZW4gbm9kZUEgYW5kIG5vZGVCXG4gKi9cblBoYXNlci5QbHVnaW4uQVN0YXIucHJvdG90eXBlLmlzV2Fsa2FibGUgPSBmdW5jdGlvbih4LCB5KVxueyAgXG4gICAgcmV0dXJuIHRoaXMuX3RpbGVtYXAubGF5ZXJzW3RoaXMuX2xheWVySW5kZXhdLmRhdGFbeV1beF0ucHJvcGVydGllcy5hc3Rhck5vZGUud2Fsa2FibGU7XG59O1xuXG5cbi8qKlxuICogQHByb3BlcnRpZXMge3N0cmluZ30gdmVyc2lvbiAtIFRoZSB2ZXJzaW9uIG51bWJlciBvZiBQaGFzZXIuUGx1Z2luLkFTdGFyIHJlYWQgb25seVxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUGhhc2VyLlBsdWdpbi5BU3Rhci5wcm90b3R5cGUsIFwidmVyc2lvblwiLCB7XG4gICAgXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBQaGFzZXIuUGx1Z2luLkFTdGFyLlZFUlNJT047XG4gICAgfVxuXG59KTtcblxuICAgICAgICBcbi8qKlxuKiBBU3Rhck5vZGUgaXMgYW4gb2JqZWN0IHRoYXQgc3RvcmVzIEFTdGFyIHZhbHVlLiBFYWNoIHRpbGUgaGF2ZSBhbiBBU3Rhck5vZGUgaW4gdGhlaXIgcHJvcGVydGllc1xuKiBAY2xhc3MgUGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGVcbiogQGNvbnN0cnVjdG9yXG4qIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHggY29vcmRpbmF0ZSBvZiB0aGUgdGlsZS5cbiogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSB0aWxlLlxuKiBAcGFyYW0ge2Jvb2xlYW59IGlzV2Fsa2FibGUgLSBJcyB0aGlzIHRpbGUgaXMgd2Fsa2FibGU/XG4qL1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5BU3Rhck5vZGUgPSBmdW5jdGlvbih4LCB5LCBpc1dhbGthYmxlKVxue1xuXG4gICAgLyoqXG4gICAgKiBAcHJvcGVydHkge251bWJlcn0geCAtIFRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIHRpbGUuXG4gICAgKi9cbiAgICB0aGlzLnggPSB4O1xuICAgIFxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSB0aWxlLlxuICAgICovXG4gICAgdGhpcy55ID0geTtcblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGcgLSBUaGUgdG90YWwgdHJhdmVsIGNvc3QgZnJvbSB0aGUgc3RhcnQgcG9pbnQuIFN1bSBvZiBDT1NUX09SVEhPR09OQUwgYW5kIENPU1RfRElBR09OQUxcbiAgICAqL1xuICAgIHRoaXMuZyA9IDA7XG5cbiAgICAvKipcbiAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoIC0gVGhlIHJlbWFpbmcgZGlzdGFuY2UgYXMgdGhlIGNyb3cgZmxpZXMgYmV0d2VlbiB0aGlzIG5vZGUgYW5kIHRoZSBnb2FsLlxuICAgICovXG4gICAgdGhpcy5oID0gMDtcblxuICAgIC8qKlxuICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGYgLSBUaGUgd2VpZ2h0LiBTdW0gb2YgZyArIGguXG4gICAgKi9cbiAgICB0aGlzLmYgPSAwO1xuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtQaGFzZXIuUGx1Z2luLkFTdGFyLkFTdGFyTm9kZX0gcGFyZW50IC0gV2hlcmUgZG8gd2UgY29tZSBmcm9tPyBJdCdzIGFuIEFTdGFyTm9kZSByZWZlcmVuY2UgbmVlZGVkIHRvIHJlY29uc3RydWN0IGEgcGF0aCBiYWNrd2FyZHMgKGZyb20gZ29hbCB0byBzdGFydCBwb2ludClcbiAgICAgKi9cbiAgICB0aGlzLnBhcmVudDsgXG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IHdhbGthYmxlIC0gSXMgdGhpcyBub2RlIGlzIHdhbGthYmxlP1xuICAgICAqL1xuICAgIHRoaXMud2Fsa2FibGUgPSBpc1dhbGthYmxlO1xuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHRyYXZlbENvc3QgLSBUaGUgY29zdCB0byB0cmF2ZWwgdG8gdGhpcyBub2RlLCBDT1NUX09SVEhPR09OQUwgb3IgQ09TVF9ESUFHT05BTCBcbiAgICAgKi9cbiAgICB0aGlzLnRyYXZlbENvc3Q7XG59O1xuXG5cbi8qKlxuKiBBU3RhclBhdGggaXMgYW4gb2JqZWN0IHRoYXQgc3RvcmVzIGEgc2VhcmNoUGF0aCByZXN1bHQuXG4qIEBjbGFzcyBQaGFzZXIuUGx1Z2luLkFTdGFyLkFTdGFyUGF0aFxuKiBAY29uc3RydWN0b3JcbiogQHBhcmFtIHthcnJheX0gbm9kZXMgLSBBbiBhcnJheSBvZiBub2RlcyBjb29yZGluYXRlcyBzb3J0ZWQgYmFja3dhcmQgZnJvbSBnb2FsIHRvIHN0YXJ0IHBvaW50LlxuKiBAcGFyYW0ge1BoYXNlci5QbHVnaW4uQVN0YXJOb2RlfSBzdGFydCAtIFRoZSBzdGFydCBBU3Rhck5vZGUgdXNlZCBmb3IgdGhlIHNlYXJjaFBhdGguXG4qIEBwYXJhbSB7UGhhc2VyLlBsdWdpbi5BU3Rhck5vZGV9IGdvYWwgLSBUaGUgZ29hbCBBU3Rhck5vZGUgdXNlZCBmb3IgdGhlIHNlYXJjaFBhdGguXG4qL1xuUGhhc2VyLlBsdWdpbi5BU3Rhci5BU3RhclBhdGggPSBmdW5jdGlvbihub2Rlcywgc3RhcnQsIGdvYWwpXG57XG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHthcnJheX0gbm9kZXMgLSBBcnJheSBvZiBBc3Rhck5vZGVzIHgsIHkgY29vcmRpYW50ZXMgdGhhdCBhcmUgdGhlIHBhdGggc29sdXRpb24gZnJvbSBnb2FsIHRvIHN0YXJ0IHBvaW50LiBcbiAgICAgKi9cbiAgICB0aGlzLm5vZGVzID0gbm9kZXMgfHwgW107XG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge1BoYXNlci5QbHVnaW4uQXN0YXIuQVN0YXJOb2RlfSBzdGFydCAtIFJlZmVyZW5jZSB0byB0aGUgc3RhcnQgcG9pbnQgdXNlZCBieSBmaW5kUGF0aC4gXG4gICAgICovXG4gICAgdGhpcy5zdGFydCA9IHN0YXJ0IHx8IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBAcHJvcGVydHkge1BoYXNlci5QbHVnaW4uQXN0YXIuQVN0YXJOb2RlfSBnb2FsIC0gUmVmZXJlbmNlIHRvIHRoZSBnb2FsIHBvaW50IHVzZWQgYnkgZmluZFBhdGguIFxuICAgICAqL1xuICAgIHRoaXMuZ29hbCA9IGdvYWwgfHwgbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSB7YXJyYXl9IHZpc2l0ZWQgLSBBcnJheSBvZiBBU3Rhck5vZGVzIHRoYXQgdGhlIGZpbmRQYXRoIGFsZ29yeXRobSBoYXMgdmlzaXRlZC4gVXNlZCBmb3IgZGVidWcgb25seS5cbiAgICAgKi9cbiAgICB0aGlzLnZpc2l0ZWQgPSBbXTtcbn07XG5cblxuLyoqXG4qIERlYnVnIG1ldGhvZCB0byBkcmF3IHRoZSBsYXN0IGNhbGN1bGF0ZWQgcGF0aCBieSBBU3RhclxuKiBAbWV0aG9kIFBoYXNlci5VdGlscy5EZWJ1Zy5BU3RhclxuKiBAcGFyYW0ge1BoYXNlci5QbHVnaW4uQVN0YXJ9IGFzdGFyLSBUaGUgQVN0YXIgcGx1Z2luIHRoYXQgeW91IHdhbnQgdG8gZGVidWcuXG4qIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBwb3NpdGlvbiBvbiBjYW1lcmEgZm9yIGRlYnVnIGRpc3BsYXkuXG4qIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBwb3NpdGlvbiBvbiBjYW1lcmEgZm9yIGRlYnVnIGRpc3BsYXkuXG4qIEBwYXJhbSB7c3RyaW5nfSBjb2xvciAtIENvbG9yIHRvIHN0cm9rZSB0aGUgcGF0aCBsaW5lLlxuKiBAcmV0dXJuIHt2b2lkfVxuKi9cblBoYXNlci5VdGlscy5EZWJ1Zy5wcm90b3R5cGUuQVN0YXIgPSBmdW5jdGlvbihhc3RhciwgeCwgeSwgY29sb3IsIHNob3dWaXNpdGVkKVxue1xuICAgIGlmICh0aGlzLmNvbnRleHQgPT0gbnVsbClcbiAgICB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgdmFyIHBhdGhMZW5ndGggPSAwO1xuICAgIGlmKGFzdGFyLl9sYXN0UGF0aCAhPT0gbnVsbClcbiAgICB7XG4gICAgICAgIHBhdGhMZW5ndGggPSBhc3Rhci5fbGFzdFBhdGgubm9kZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIGNvbG9yID0gY29sb3IgfHwgJ3JnYigyNTUsMjU1LDI1NSknO1xuXG4gICAgdGhpcy5nYW1lLmRlYnVnLnN0YXJ0KHgsIHksIGNvbG9yKTtcblxuXG4gICAgaWYocGF0aExlbmd0aCA+IDApXG4gICAge1xuICAgICAgICB2YXIgbm9kZSA9IGFzdGFyLl9sYXN0UGF0aC5ub2Rlc1swXTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jb250ZXh0Lm1vdmVUbygobm9kZS54ICogYXN0YXIuX3RpbGVtYXAudGlsZVdpZHRoKSArIChhc3Rhci5fdGlsZW1hcC50aWxlV2lkdGgvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueCwgKG5vZGUueSAqIGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQpICsgKGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueSk7XG5cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8cGF0aExlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBub2RlID0gYXN0YXIuX2xhc3RQYXRoLm5vZGVzW2ldO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVUbygobm9kZS54ICogYXN0YXIuX3RpbGVtYXAudGlsZVdpZHRoKSArIChhc3Rhci5fdGlsZW1hcC50aWxlV2lkdGgvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueCwgKG5vZGUueSAqIGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQpICsgKGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQubGluZVRvKChhc3Rhci5fbGFzdFBhdGguc3RhcnQueCAqIGFzdGFyLl90aWxlbWFwLnRpbGVXaWR0aCkgKyAoYXN0YXIuX3RpbGVtYXAudGlsZVdpZHRoLzIpIC0gdGhpcy5nYW1lLmNhbWVyYS52aWV3LngsIChhc3Rhci5fbGFzdFBhdGguc3RhcnQueSAqIGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQpICsgKGFzdGFyLl90aWxlbWFwLnRpbGVIZWlnaHQvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueSk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZSgpOyBcblxuICAgICAgICAvL0RyYXcgY2lyY2xlcyBvbiB2aXNpdGVkIG5vZGVzXG4gICAgICAgIGlmKHNob3dWaXNpdGVkICE9PSBmYWxzZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHZpc2l0ZWROb2RlO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGogPCBhc3Rhci5fbGFzdFBhdGgudmlzaXRlZC5sZW5ndGg7IGorKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2aXNpdGVkTm9kZSA9IGFzdGFyLl9sYXN0UGF0aC52aXNpdGVkW2pdO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuYXJjKCh2aXNpdGVkTm9kZS54ICogYXN0YXIuX3RpbGVtYXAudGlsZVdpZHRoKSArIChhc3Rhci5fdGlsZW1hcC50aWxlV2lkdGgvMikgLSB0aGlzLmdhbWUuY2FtZXJhLnZpZXcueCwgKHZpc2l0ZWROb2RlLnkgKiBhc3Rhci5fdGlsZW1hcC50aWxlSGVpZ2h0KSArIChhc3Rhci5fdGlsZW1hcC50aWxlSGVpZ2h0LzIpIC0gdGhpcy5nYW1lLmNhbWVyYS52aWV3LnksIDIsIDAsIE1hdGguUEkqMiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZSgpOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubGluZSgnUGF0aCBsZW5ndGg6ICcgKyBwYXRoTGVuZ3RoKTtcbiAgICB0aGlzLmxpbmUoJ0Rpc3RhbmNlIGZ1bmM6ICcgKyBhc3Rhci5fZGlzdGFuY2VGdW5jdGlvbik7XG4gICAgdGhpcy5saW5lKCdVc2UgZGlhZ29uYWw6ICcgKyBhc3Rhci5fdXNlRGlhZ29uYWwpO1xuICAgIHRoaXMubGluZSgnRmluZCBDbG9zZXN0OiAnICsgYXN0YXIuX2ZpbmRDbG9zZXN0KTtcblxuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5zdG9wKCk7XG59O1xuXG5cblxuXG4iLCJ2YXIgU2F0Qm9keSA9IHJlcXVpcmUoXCIuL3NhdC1ib2R5LmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBoYXNlci5QbHVnaW4uU2F0Qm9keSA9IGZ1bmN0aW9uIChnYW1lLCBwYXJlbnQpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX2JvZGllcyA9IFtdO1xuICAgIHRoaXMuX2lzRGVidWcgPSBmYWxzZTtcbn07XG5cblBoYXNlci5QbHVnaW4uU2F0Qm9keS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5QbHVnaW4ucHJvdG90eXBlKTtcblxuUGhhc2VyLlBsdWdpbi5TYXRCb2R5LnByb3RvdHlwZS5hZGRCb3hCb2R5ID0gZnVuY3Rpb24gKHNwcml0ZSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBib2R5ID0gbmV3IFNhdEJvZHkoc3ByaXRlKTtcbiAgICBib2R5LmluaXRCb3god2lkdGgsIGhlaWdodCk7XG4gICAgaWYgKHRoaXMuX2lzRGVidWcpIGJvZHkuZW5hYmxlRGVidWcoKTtcbiAgICB0aGlzLl9ib2RpZXMucHVzaChib2R5KTtcbiAgICByZXR1cm4gYm9keTtcbn07XG5cblBoYXNlci5QbHVnaW4uU2F0Qm9keS5wcm90b3R5cGUuYWRkQ2lyY2xlQm9keSA9IGZ1bmN0aW9uIChzcHJpdGUsIHJhZGl1cykge1xuICAgIHZhciBib2R5ID0gbmV3IFNhdEJvZHkoc3ByaXRlKTtcbiAgICBib2R5LmluaXRDaXJjbGUocmFkaXVzKTtcbiAgICBpZiAodGhpcy5faXNEZWJ1ZykgYm9keS5lbmFibGVEZWJ1ZygpO1xuICAgIHRoaXMuX2JvZGllcy5wdXNoKGJvZHkpO1xuICAgIHJldHVybiBib2R5O1xufTtcblxuUGhhc2VyLlBsdWdpbi5TYXRCb2R5LnByb3RvdHlwZS5hZGRQb2x5Z29uQm9keSA9IGZ1bmN0aW9uIChzcHJpdGUsIHBvaW50cykge1xuICAgIHZhciBib2R5ID0gbmV3IFNhdEJvZHkoc3ByaXRlKTtcbiAgICBib2R5LmluaXRQb2x5Z29uKHBvaW50cyk7XG4gICAgaWYgKHRoaXMuX2lzRGVidWcpIGJvZHkuZW5hYmxlRGVidWcoKTtcbiAgICB0aGlzLl9ib2RpZXMucHVzaChib2R5KTtcbiAgICByZXR1cm4gYm9keTtcbn07XG5cblBoYXNlci5QbHVnaW4uU2F0Qm9keS5wcm90b3R5cGUuaXNEZWJ1Z0FsbEVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9pc0RlYnVnID09PSB0cnVlKTtcbn07XG5cblBoYXNlci5QbHVnaW4uU2F0Qm9keS5wcm90b3R5cGUuZW5hYmxlRGVidWdBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faXNEZWJ1ZyA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ib2RpZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdGhpcy5fYm9kaWVzW2ldLmVuYWJsZURlYnVnKCk7XG4gICAgfVxufTtcblxuUGhhc2VyLlBsdWdpbi5TYXRCb2R5LnByb3RvdHlwZS5kaXNhYmxlRGVidWdBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faXNEZWJ1ZyA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYm9kaWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRoaXMuX2JvZGllc1tpXS5kaXNhYmxlRGVidWcoKTtcbiAgICB9XG59O1xuXG5QaGFzZXIuUGx1Z2luLlNhdEJvZHkucHJvdG90eXBlLnBvc3RVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVXBkYXRlIGFmdGVyIHRoZSBwaHlzaWNzIGhhdmUgYmVlbiBhcHBsaWVkIHRvIGFsbCBnYW1lIG9iamVjdHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2JvZGllcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB0aGlzLl9ib2RpZXNbaV0ucG9zdFVwZGF0ZSgpO1xuICAgIH1cbn07XG5cblBoYXNlci5QbHVnaW4uU2F0Qm9keS5wcm90b3R5cGUucmVtb3ZlQm9keSA9IGZ1bmN0aW9uIChib2R5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ib2RpZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGJvZHkgPT09IHRoaXMuX2JvZGllc1tpXSkge1xuICAgICAgICAgICAgdGhpcy5fYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuUGhhc2VyLlBsdWdpbi5TYXRCb2R5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYm9kaWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRoaXMuX2JvZGllc1tpXS5kZXN0cm95KCk7XG4gICAgfVxufTtcbiIsIi8qKlxuICogVE9ETzpcbiAqIC0gRG8gd2UgbmVlZCB0byB3b3JyeSBwcm9ibGVtcyB3aXRoIGNvb3JkaW5hdGUgc3lzdGVtcyBub3QgbWF0Y2hpbmcgZm9yIFxuICogICBjb2xsaXNpb25zPyBJZiBzbywgb3ZlcmxhcCBzaG91bGQgaGFwcGVuIHdpdGggd29ybGQgY29vcmRpbmF0ZXMuXG4gKiAtIERvIHdlIG5lZWQgdGhlIG9wdGlvbiBmb3IgYSBTQVQgYm9keSB0byBiZSBjb21wb3NlZCBvZiBtdWx0aXBsZSBzaGFwZXMsIFxuICogICBlLmcuIGEgYm94IHBsdXMgYSBjaXJjbGU/XG4gKiAtIERvIHdlIG5lZWQgdGhlcmUgdG8gYmUgYSBwb3NzaWJsZSBvZmZzZXQgYmV0d2VlbiB0aGUgc3ByaXRlJ3MgYW5jaG9yIGFuZCBcbiAqICAgdGhpcyBTYXRCb2R5PyBJZiBzbywgd2UgbmVlZCB0byB0cmFjayB0aGF0LlxuICogLSBEbyB3ZSBuZWVkIHRvIGNvbnNpZGVyIHNjYWxlIGFuZCBwaXZvdD9cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhdEJvZHk7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi8uLi9oZWxwZXJzL3V0aWxpdGllcy5qc1wiKTtcbnZhciBTQVQgPSByZXF1aXJlKFwic2F0XCIpO1xuXG52YXIgQk9EWV9UWVBFID0ge1xuICAgIENJUkNMRTogXCJjaXJjbGVcIixcbiAgICBQT0xZR09OOiBcInBvbHlnb25cIlxufTtcblxuLy8gSGVscGVyIE9iamVjdCBGYWN0b3JpZXNcbnZhciB2ZWMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBuZXcgU0FULlZlY3Rvcih4LCB5KTtcbn07XG52YXIgYm94ID0gZnVuY3Rpb24gKHBvcywgdywgaCkge1xuICAgIHJldHVybiBuZXcgU0FULkJveChwb3MsIHcsIGgpO1xufTtcbnZhciBjaXJjbGUgPSBmdW5jdGlvbiAocG9zLCByKSB7XG4gICAgcmV0dXJuIG5ldyBTQVQuQ2lyY2xlKHBvcywgcik7XG59O1xudmFyIHBvbHlnb24gPSBmdW5jdGlvbiAocG9zLCBwb2ludHMpIHtcbiAgICByZXR1cm4gbmV3IFNBVC5Qb2x5Z29uKHBvcywgcG9pbnRzKTtcbn07XG5cbmZ1bmN0aW9uIFNhdEJvZHkoc3ByaXRlKSB7XG4gICAgdGhpcy5nYW1lID0gc3ByaXRlLmdhbWU7XG4gICAgdGhpcy5fc3ByaXRlID0gc3ByaXRlO1xuICAgIHRoaXMuZGlzYWJsZURlYnVnKCk7XG5cbiAgICAvLyBTY2hlZHVsZSBjbGVhbiB1cCB3aGVuIHBhcmVudCBzcHJpdGUgb3duZXIgaXMgZGVzdHJveWVkXG4gICAgdGhpcy5fc3ByaXRlLmV2ZW50cy5vbkRlc3Ryb3kuYWRkKHRoaXMuZGVzdHJveS5iaW5kKHRoaXMpKTtcbn1cblxuU2F0Qm9keS5wcm90b3R5cGUuaW5pdEJveCA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIHMgPSB0aGlzLl9zcHJpdGU7XG4gICAgdmFyIGFuY2hvciA9IHRoaXMuX3Nwcml0ZS5hbmNob3I7XG4gICAgd2lkdGggPSB1dGlscy5kZWZhdWx0KHdpZHRoLCBzLndpZHRoKTtcbiAgICBoZWlnaHQgPSB1dGlscy5kZWZhdWx0KGhlaWdodCwgcy5oZWlnaHQpO1xuICAgIHRoaXMuX2JvZHlUeXBlID0gQk9EWV9UWVBFLlBPTFlHT047XG4gICAgdGhpcy5fYm9keSA9IGJveCh2ZWMocy54LCBzLnkpLCB3aWR0aCwgaGVpZ2h0KS50b1BvbHlnb24oKTtcbiAgICB0aGlzLl9ib2R5LnRyYW5zbGF0ZSgtYW5jaG9yLnggKiB3aWR0aCwgLWFuY2hvci55ICogaGVpZ2h0KTtcbn07XG5cblNhdEJvZHkucHJvdG90eXBlLmluaXRDaXJjbGUgPSBmdW5jdGlvbiAocikge1xuICAgIHRoaXMuX2JvZHlUeXBlID0gQk9EWV9UWVBFLkNJUkNMRTtcbiAgICB2YXIgcyA9IHRoaXMuX3Nwcml0ZTtcbiAgICBpZiAoIXIpIHIgPSBzLndpZHRoIC8gMjtcbiAgICB0aGlzLl9ib2R5ID0gY2lyY2xlKHZlYyhzLngsIHMueSksIHIpO1xufTtcblxuU2F0Qm9keS5wcm90b3R5cGUuaW5pdFBvbHlnb24gPSBmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgLy8gVW50ZXN0ZWRcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdvdWxkIGJlIG1vcmUgY29udmllbnQgaWYgaXQgdG9vayBhbiBhcnJheSBvciBwYXJzZWQgdGhlIFxuICAgIC8vIGFyZ3VtZW50cyB2YXJpYWJsZSB0byBjb25zdHJ1Y3QgdGhlIHBvaW50c1xuICAgIHRoaXMuX2JvZHlUeXBlID0gQk9EWV9UWVBFLlBPTFlHT047XG4gICAgdmFyIHMgPSB0aGlzLl9zcHJpdGU7XG4gICAgdGhpcy5fYm9keSA9IHBvbHlnb24odmVjKHMueCwgcy55KSwgcG9pbnRzKTtcbn07XG5cblNhdEJvZHkucHJvdG90eXBlLmdldEJvZHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvZHk7XG59O1xuXG5TYXRCb2R5LnByb3RvdHlwZS5nZXRCb2R5VHlwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9keVR5cGU7XG59O1xuXG5TYXRCb2R5LnByb3RvdHlwZS50ZXN0T3ZlcmxhcCA9IGZ1bmN0aW9uIChvdGhlckJvZHkpIHtcbiAgICAvLyBIYW5keSBib29sZWFuIHNob3J0aGFuZHNcbiAgICB2YXIgdGhpc0lzQ2lyY2xlID0gKHRoaXMuX2JvZHlUeXBlID09PSBCT0RZX1RZUEUuQ0lSQ0xFKTtcbiAgICB2YXIgb3RoZXJJc0NpcmNsZSA9IChvdGhlckJvZHkuX2JvZHlUeXBlID09PSBCT0RZX1RZUEUuQ0lSQ0xFKTtcblxuICAgIC8vIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgY29sbGlzaW9uIGJvZHkgY29tcGFyaXNvblxuICAgIGlmICh0aGlzSXNDaXJjbGUgJiYgb3RoZXJJc0NpcmNsZSkge1xuICAgICAgICByZXR1cm4gU0FULnRlc3RDaXJjbGVDaXJjbGUodGhpcy5fYm9keSwgb3RoZXJCb2R5Ll9ib2R5KTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzSXNDaXJjbGUgJiYgb3RoZXJJc0NpcmNsZSkge1xuICAgICAgICByZXR1cm4gU0FULnRlc3RQb2x5Z29uQ2lyY2xlKHRoaXMuX2JvZHksIG90aGVyQm9keS5fYm9keSk7XG4gICAgfSBlbHNlIGlmICh0aGlzSXNDaXJjbGUgJiYgIW90aGVySXNDaXJjbGUpIHtcbiAgICAgICAgcmV0dXJuIFNBVC50ZXN0UG9seWdvbkNpcmNsZShvdGhlckJvZHkuX2JvZHksIHRoaXMuX2JvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBTQVQudGVzdFBvbHlnb25Qb2x5Z29uKHRoaXMuX2JvZHksIG90aGVyQm9keS5fYm9keSk7XG4gICAgfVxufTtcblxuU2F0Qm9keS5wcm90b3R5cGUucG9zdFVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBjb2xsaWRpbmcgYm9keVxuICAgIGlmICh0aGlzLl9ib2R5VHlwZSA9PT0gQk9EWV9UWVBFLkNJUkNMRSkge1xuICAgICAgICB0aGlzLl9ib2R5LnBvcy54ID0gdGhpcy5fc3ByaXRlLndvcmxkLng7XG4gICAgICAgIHRoaXMuX2JvZHkucG9zLnkgPSB0aGlzLl9zcHJpdGUud29ybGQueTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlUeXBlID09PSBCT0RZX1RZUEUuUE9MWUdPTikge1xuICAgICAgICB0aGlzLl9ib2R5LnBvcy54ID0gdGhpcy5fc3ByaXRlLndvcmxkLng7XG4gICAgICAgIHRoaXMuX2JvZHkucG9zLnkgPSB0aGlzLl9zcHJpdGUud29ybGQueTtcbiAgICAgICAgdGhpcy5fYm9keS5zZXRBbmdsZSh0aGlzLl9zcHJpdGUucm90YXRpb24pO1xuICAgICAgICAvLyBSb3RhdGlvbiBzaG91bGQgcHJvYmFibHkgYmUgd29ybGQgcm90YXRpb24uLi5vciBzb21ldGhpbmc/XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzRGVidWcpIHRoaXMuX3VwZGF0ZURlYnVnKCk7XG59O1xuXG5TYXRCb2R5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9kZWJ1Z0dyYXBoaWNzKSB0aGlzLl9kZWJ1Z0dyYXBoaWNzLmRlc3Ryb3koKTtcbiAgICB0aGlzLmdhbWUuZ2xvYmFscy5wbHVnaW5zLnNhdEJvZHkucmVtb3ZlQm9keSh0aGlzKTtcbn07XG5cblNhdEJvZHkucHJvdG90eXBlLnNldERlYnVnQ29sb3IgPSBmdW5jdGlvbiAoZGVidWdDb2xvcikge1xuICAgIHRoaXMuX2RlYnVnQ29sb3IgPSBkZWJ1Z0NvbG9yO1xufTtcblxuU2F0Qm9keS5wcm90b3R5cGUuZW5hYmxlRGVidWcgPSBmdW5jdGlvbiAoZGVidWdDb2xvcikge1xuICAgIGRlYnVnQ29sb3IgPSAoZGVidWdDb2xvciAhPT0gdW5kZWZpbmVkKSA/IGRlYnVnQ29sb3IgOiAweDAwRkYwMDtcbiAgICB0aGlzLl9pc0RlYnVnID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuX2RlYnVnR3JhcGhpY3MpIHtcbiAgICAgICAgLy8gT25seSBjcmVhdGUgZGVidWcgZ3JhcGhpY3MgaWYgaXQgaXMgbmVlZGVkLCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuICAgICAgICB0aGlzLl9kZWJ1Z0dyYXBoaWNzID0gdGhpcy5nYW1lLmFkZC5ncmFwaGljcygwLCAwKTtcbiAgICAgICAgdGhpcy5fc3ByaXRlLnBhcmVudC5hZGQodGhpcy5fZGVidWdHcmFwaGljcyk7XG4gICAgfSBcbiAgICB0aGlzLl9kZWJ1Z0dyYXBoaWNzLnZpc2libGUgPSB0cnVlO1xuICAgIGlmIChkZWJ1Z0NvbG9yKSB0aGlzLnNldERlYnVnQ29sb3IoZGVidWdDb2xvcik7XG59O1xuXG5TYXRCb2R5LnByb3RvdHlwZS5kaXNhYmxlRGVidWcgPSBmdW5jdGlvbiAoKSB7ICAgIFxuICAgIHRoaXMuX2lzRGVidWcgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5fZGVidWdHcmFwaGljcykgdGhpcy5fZGVidWdHcmFwaGljcy52aXNpYmxlID0gZmFsc2U7XG59O1xuXG5TYXRCb2R5LnByb3RvdHlwZS5fdXBkYXRlRGVidWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVidWdHcmFwaGljcy5wb3NpdGlvbi5jb3B5RnJvbSh0aGlzLl9zcHJpdGUucG9zaXRpb24pO1xuICAgIHRoaXMuX2RlYnVnR3JhcGhpY3MuY2xlYXIoKTtcbiAgICB0aGlzLl9kZWJ1Z0dyYXBoaWNzLmxpbmVTdHlsZSgxLCB0aGlzLl9kZWJ1Z0NvbG9yLCAwLjYpO1xuICAgIHRoaXMuX2RlYnVnR3JhcGhpY3MuYmVnaW5GaWxsKHRoaXMuX2RlYnVnQ29sb3IsIDAuNCk7XG4gICAgaWYgKHRoaXMuX2JvZHlUeXBlID09PSBCT0RZX1RZUEUuQ0lSQ0xFKSB7XG4gICAgICAgIHRoaXMuX2RlYnVnR3JhcGhpY3MuZHJhd0NpcmNsZSh0aGlzLl9ib2R5LngsIHRoaXMuX2JvZHkueSwgXG4gICAgICAgICAgICAyICogdGhpcy5fYm9keS5yKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlUeXBlID09PSBCT0RZX1RZUEUuUE9MWUdPTikge1xuICAgICAgICB0aGlzLl9kZWJ1Z0dyYXBoaWNzLmRyYXdQb2x5Z29uKHRoaXMuX2JvZHkuY2FsY1BvaW50cyk7XG4gICAgfVxuICAgIHRoaXMuX2RlYnVnR3JhcGhpY3MuZW5kRmlsbCgpO1xufTsiLCIvKipcbiAqIEJvb3RTdGF0ZVxuICogLSBTZXRzIGFueSBnbG9iYWwgc2V0dGluZ3MgZm9yIHRoZSBnYW1lXG4gKiAtIExvYWRzIG9ubHkgdGhlIGFzc2V0cyBuZWVkZWQgZm9yIHRoZSBMb2FkU3RhdGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3RTdGF0ZTtcblxuZnVuY3Rpb24gQm9vdFN0YXRlKCkge31cblxuQm9vdFN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVGFrZSBjYXJlIG9mIGFueSBnbG9iYWwgZ2FtZSBzZXR0aW5ncyB0aGF0IG5lZWQgdG8gYmUgc2V0IHVwXG4gICAgdGhpcy5nYW1lLnJlbmRlcmVyLnJlbmRlclNlc3Npb24ucm91bmRQaXhlbHMgPSBmYWxzZTtcbiAgICAvLyBEaXNhYmxlIGN1cnNvclxuICAgIHRoaXMuZ2FtZS5jYW52YXMuc3R5bGUuY3Vyc29yID0gXCJub25lXCI7XG4gICAgLy8gRGlzYWJsZSB0aGUgYnVpbHQtaW4gcGF1c2luZy4gVGhpcyBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZywgYnV0IG1heSBhbHNvXG4gICAgLy8gYmUgdXNlZnVsIGZvciB0aGUgZ2FtZSBsb2dpY1xuICAgIHRoaXMuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuICAgIHRoaXMuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gXCIjRjlGOUY5XCI7XG5cbiAgICB0aGlzLmdhbWUuc3RhdGUuc3RhcnQoXCJsb2FkXCIpO1xufTsiLCIvKipcbiAqIExvYWRTdGF0ZSAtIHRoaXMgaXMgdGhlIGxvYWRpbmcgc2NyZWVuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkU3RhdGU7XG5cbmZ1bmN0aW9uIExvYWRTdGF0ZSgpIHt9XG5cbkxvYWRTdGF0ZS5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uICgpIHsgICAgXG4gICAgLy8gSW1hZ2VzXG4gICAgdGhpcy5sb2FkLmF0bGFzSlNPTkhhc2goXCJhc3NldHNcIiwgXCJyZXNvdXJjZXMvYXRsYXNlcy9hc3NldHMucG5nXCIsIFxuICAgICAgICBcInJlc291cmNlcy9hdGxhc2VzL2Fzc2V0cy5qc29uXCIpO1xuICAgIHRoaXMubG9hZC5pbWFnZShcImZvZ01hc2tcIiwgXCJyZXNvdXJjZXMvaW1hZ2VzL2ZvZy1tYXNrLTIucG5nXCIpXG5cbiAgICAvLyBUaWxlbWFwXG4gICAgdGhpcy5sb2FkLnRpbGVtYXAoXCJ0aWxlbWFwXCIsIFwicmVzb3VyY2VzL3RpbGVtYXBzL29wZW4tdGlsZW1hcC5qc29uXCIsIG51bGwsIFxuICAgICAgICBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcbiAgICB0aGlzLmxvYWQuaW1hZ2UoXCJjb2xvcmVkVGlsZXNcIiwgXCJyZXNvdXJjZXMvdGlsZW1hcHMvdGlsZXMucG5nXCIpO1xuXG4gICAgLy8gU3RhbmQtaW4gZm9yIGEgbG9hZGluZyBiYXJcbiAgICB0aGlzLmxvYWRpbmdUZXh0ID0gdGhpcy5hZGQudGV4dCh0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWSwgXG4gICAgICAgIFwiMCVcIiwgeyBcbiAgICAgICAgICAgIGZvbnQ6IFwiMjAwcHggQXJpYWxcIiwgXG4gICAgICAgICAgICBmaWxsOiBcIiMwMDBcIiwgXG4gICAgICAgICAgICBhbGlnbjogXCJjZW50ZXJcIiBcbiAgICAgICAgfSk7XG4gICAgdGhpcy5sb2FkaW5nVGV4dC5hbmNob3Iuc2V0KDAuNSk7XG59O1xuXG5Mb2FkU3RhdGUucHJvdG90eXBlLmxvYWRSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5sb2FkaW5nVGV4dC5zZXRUZXh0KHRoaXMubG9hZC5wcm9ncmVzcyArIFwiJVwiKTtcbn07XG5cbkxvYWRTdGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFNpbmNlIGxvYWQgcHJvZ3Jlc3MgbWlnaHQgbm90IHJlYWNoIDEwMCBpbiB0aGUgbG9hZCBsb29wLCBtYW51YWxseSBkbyBpdFxuICAgIHRoaXMubG9hZGluZ1RleHQuc2V0VGV4dChcIjEwMCVcIik7XG5cbiAgICAvLyB0aGlzLmdhbWUuc3RhdGUuc3RhcnQoXCJzdGFydFwiKTsgLy8gc3RhcnQgc2NyZWVuXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KFwic2FuZGJveFwiKTsgLy8gZm9yIHRlc3RpbmdcblxufTsiLCIvKipcbiAqIFNhbmRib3ggLSB0aGlzIGlzIHRoZSBtYWluIGxldmVsIGZvciBub3dcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhbmRib3g7XG5cbnZhciBTYXRCb2R5UGx1Z2luID0gcmVxdWlyZShcIi4uL3BsdWdpbnMvc2F0LWJvZHktcGx1Z2luL3NhdC1ib2R5LXBsdWdpbi5qc1wiKTtcbnZhciBBU3RhciA9IHJlcXVpcmUoXCIuLi9wbHVnaW5zL0FTdGFyLmpzXCIpO1xudmFyIFBsYXllciA9IHJlcXVpcmUoXCIuLi9nYW1lLW9iamVjdHMvcGxheWVyLmpzXCIpO1xudmFyIFNjb3JlS2VlcGVyID0gcmVxdWlyZShcIi4uL2hlbHBlcnMvc2NvcmUta2VlcGVyLmpzXCIpO1xudmFyIEhlYWRzVXBEaXNwbGF5ID0gcmVxdWlyZShcIi4uL2dhbWUtb2JqZWN0cy9oZWFkcy11cC1kaXNwbGF5LmpzXCIpO1xudmFyIFNoYWRvd01hc2sgPSByZXF1aXJlKFwiLi4vZ2FtZS1vYmplY3RzL3NoYWRvdy1tYXNrLmpzXCIpO1xuXG5mdW5jdGlvbiBTYW5kYm94KCkge31cblxuU2FuZGJveC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIENyZWF0ZSB0aGUgc3BhY2UgZm9yIGdsb2JhbHMgb24gdGhlIGdhbWUgb2JqZWN0XG4gICAgdGhpcy5nYW1lLmdsb2JhbHMgPSB7fTtcblxuICAgIC8vIFNob3J0aGFuZHNcbiAgICB2YXIgZ2FtZSA9IHRoaXMuZ2FtZTtcbiAgICB2YXIgZ2xvYmFscyA9IGdhbWUuZ2xvYmFscztcbiAgICBcbiAgICAvLyBEZWJ1Z2dpbmcgRlBTXG4gICAgZ2FtZS50aW1lLmFkdmFuY2VkVGltaW5nID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBDYW52YXMgc3R5bGluZ1xuICAgIGdhbWUuY2FudmFzLnN0eWxlLmN1cnNvciA9IFwibm9uZVwiO1xuICAgIGdhbWUuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9KTtcblxuICAgIC8vIFBsdWdpbnNcbiAgICBnbG9iYWxzLnBsdWdpbnMgPSB7XG4gICAgICAgIHNhdEJvZHk6IGdhbWUucGx1Z2lucy5hZGQoU2F0Qm9keVBsdWdpbiksXG4gICAgICAgIGFzdGFyOiBnYW1lLnBsdWdpbnMuYWRkKFBoYXNlci5QbHVnaW4uQVN0YXIpXG4gICAgfTtcblxuICAgIC8vIEdyb3VwcyBmb3Igei1pbmRleCBzb3J0aW5nIGFuZCBmb3IgY29sbGlzaW9uc1xuICAgIHZhciBncm91cHMgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IGdhbWUuYWRkLmdyb3VwKHRoaXMud29ybGQsIFwiYmFja2dyb3VuZFwiKSxcbiAgICAgICAgbWlkZ3JvdW5kOiBnYW1lLmFkZC5ncm91cCh0aGlzLndvcmxkLCBcIm1pZGdyb3VuZFwiKSxcbiAgICAgICAgZm9yZWdyb3VuZDogZ2FtZS5hZGQuZ3JvdXAodGhpcy53b3JsZCwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgfTtcbiAgICBncm91cHMuZW5lbWllcyA9IGdhbWUuYWRkLmdyb3VwKGdyb3Vwcy5taWRncm91bmQsIFwiZW5lbWllc1wiKTtcbiAgICBncm91cHMucGlja3VwcyA9IGdhbWUuYWRkLmdyb3VwKGdyb3Vwcy5taWRncm91bmQsIFwicGlja3Vwc1wiKTtcbiAgICBncm91cHMubm9uQ29sbGlkaW5nR3JvdXAgPSBnYW1lLmFkZC5ncm91cChncm91cHMubWlkZ3JvdW5kLCBcbiAgICAgICAgXCJub24tY29sbGlkaW5nXCIpO1xuICAgIGdsb2JhbHMuZ3JvdXBzID0gZ3JvdXBzO1xuXG4gICAgLy8gSW5pdGlhbGl6aW5nIHRoZSB3b3JsZFxuICAgIHRoaXMuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gXCIjRjlGOUY5XCI7XG5cbiAgICAvLyBMb2FkaW5nIHRoZSB0aWxlbWFwXG4gICAgdmFyIG1hcCA9IGdhbWUuYWRkLnRpbGVtYXAoXCJ0aWxlbWFwXCIpO1xuICAgIC8vIFNldCB1cCB0aGUgdGlsZXNldHMuIEZpcnN0IHBhcmFtZXRlciBpcyBuYW1lIG9mIHRpbGVzZXQgaW4gVGlsZWQgYW5kIFxuICAgIC8vIHNlY29uZCBwYXJhbXRlciBpcyBuYW1lIG9mIHRpbGVzZXQgaW1hZ2UgaW4gUGhhc2VyJ3MgY2FjaGVcbiAgICBtYXAuYWRkVGlsZXNldEltYWdlKFwiY29sb3JzXCIsIFwiY29sb3JlZFRpbGVzXCIpO1xuICAgIC8vIENyZWF0ZSBhIGxheWVyIGZvciBlYWNoIFxuICAgIHZhciBiYWNrZ3JvdW5kTGF5ZXIgPSBtYXAuY3JlYXRlTGF5ZXIoXCJCYWNrZ3JvdW5kXCIsIHRoaXMuZ2FtZS53aWR0aCwgXG4gICAgICAgIHRoaXMuZ2FtZS5oZWlnaHQsIGdyb3Vwcy5iYWNrZ3JvdW5kKTtcbiAgICBiYWNrZ3JvdW5kTGF5ZXIucmVzaXplV29ybGQoKTtcbiAgICB2YXIgYmxvY2tpbmdMYXllciA9IG1hcC5jcmVhdGVMYXllcihcIkJsb2NraW5nTGF5ZXJcIiwgdGhpcy5nYW1lLndpZHRoLCBcbiAgICAgICAgdGhpcy5nYW1lLmhlaWdodCwgZ3JvdXBzLmJhY2tncm91bmQpO1xuICAgIG1hcC5zZXRDb2xsaXNpb25CZXR3ZWVuKDAsIDMsIHRydWUsIFwiQmxvY2tpbmdMYXllclwiKTtcbiAgICBnbG9iYWxzLnRpbGVNYXAgPSBtYXA7XG4gICAgZ2xvYmFscy50aWxlTWFwTGF5ZXIgPSBibG9ja2luZ0xheWVyO1xuXG4gICAgZ2xvYmFscy5zaGFkb3dNYXNrID0gbmV3IFNoYWRvd01hc2soZ2FtZSwgMC44LCBtYXAsIGdyb3Vwcy5taWRncm91bmQpO1xuXG4gICAgLy8gQVN0YXIgcGx1Z2luXG4gICAgZ2xvYmFscy5wbHVnaW5zLmFzdGFyLnNldEFTdGFyTWFwKG1hcCwgXCJCbG9ja2luZ0xheWVyXCIsIFwiY29sb3JzXCIpO1xuXG4gICAgLy8gUGh5c2ljc1xuICAgIHRoaXMucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMucGh5c2ljcy5hcmNhZGUuZ3Jhdml0eS5zZXQoMCk7XG5cbiAgICAvLyBQbGF5ZXJcbiAgICAvLyBHZXQgdGhlIFNwYXduIFBvaW50KHMpIGZvciB0aGUgcGxheWVyIGZyb20gdGhlIHRpbGUgbWFwLlxuICAgIHZhciBwbGF5ZXJTdGFydFBvaW50ID0gdGhpcy5nZXRNYXBQb2ludHMoXCJwbGF5ZXJcIilbMF07IC8vIG9ubHkgb25lIGZvciB0aGUgbW9tZW50Li4uXG4gICAgLy8gU2V0dXAgYSBuZXcgcGxheWVyLCBhbmQgYXR0YWNoIGl0IHRvIHRoZSBnbG9iYWwgdmFyaWFibHMgb2JqZWN0LlxuICAgIHZhciBwbGF5ZXIgPSBuZXcgUGxheWVyKGdhbWUsIHBsYXllclN0YXJ0UG9pbnQueCwgcGxheWVyU3RhcnRQb2ludC55LCBncm91cHMubWlkZ3JvdW5kKTtcbiAgICB0aGlzLmNhbWVyYS5mb2xsb3cocGxheWVyKTtcbiAgICBnbG9iYWxzLnBsYXllciA9IHBsYXllcjtcblxuICAgIC8vIFNwYXduIFBvaW50IFRlc3RpbmdcbiAgICAvLyBHZXQgdGhlIFNwYXduIFBvaW50KHMpIGZvciB0aGUgbGlnaHRzICh0aGVzZSB3ZXJlIG9yaWduYWxseSBzZXQgdXAgZm9yIHRoZSB3ZWFwb25zLi4uKVxuICAgIHZhciBsaWdodFNwYXduUG9pbnRzID0gdGhpcy5nZXRNYXBQb2ludHMoXCJ3ZWFwb25cIik7XG4gICAgLy8gUGljayBhIHJhbmRvbSBQb2ludCBmb3IgdGhlIGxpZ2h0IHRvIHNwYXduIGF0LlxuICAgIGdsb2JhbHMubGlnaHRQb2ludCA9IG5ldyBQaGFzZXIuUG9pbnQobGlnaHRTcGF3blBvaW50c1swXS54LCBsaWdodFNwYXduUG9pbnRzWzBdLnkpO1xuXG4gICAgXG4gICAgLy8gU2NvcmVcbiAgICBnbG9iYWxzLnNjb3JlS2VlcGVyID0gbmV3IFNjb3JlS2VlcGVyKCk7XG5cbiAgICAvLyBIVURcbiAgICBnbG9iYWxzLmh1ZCA9IG5ldyBIZWFkc1VwRGlzcGxheShnYW1lLCBncm91cHMuZm9yZWdyb3VuZCk7XG4gICAgXG4gICAgLy8gdmFyIFdhdmUxID0gcmVxdWlyZShcIi4uL2dhbWUtb2JqZWN0cy93YXZlcy93YXZlLTEuanNcIik7XG4gICAgLy8gbmV3IFdhdmUxKGdhbWUpO1xuXG4gICAgLy8gdmFyIFdlYXBvblBpY2t1cCA9IHJlcXVpcmUoXCIuLi9nYW1lLW9iamVjdHMvcGlja3Vwcy93ZWFwb24tcGlja3VwLmpzXCIpO1xuICAgIC8vIGZvciAodmFyIGk9MDsgaTw1MDsgaSsrKSB7XG4gICAgLy8gICAgIG5ldyBXZWFwb25QaWNrdXAodGhpcy5nYW1lLCB0aGlzLmdhbWUucm5kLmludGVnZXJJblJhbmdlKDAsIDEzMDApLCBcbiAgICAvLyAgICAgICAgIHRoaXMuZ2FtZS5ybmQuaW50ZWdlckluUmFuZ2UoMCwgMTMwMCksIFwiZ3VuXCIsIDUpXG4gICAgLy8gfVxuICAgIFxuICAgIC8vIFRvZ2dsZSBkZWJ1Z2dpbmcgU0FUIGJvZGllc1xuICAgIHZhciBkZWJ1Z1RvZ2dsZUtleSA9IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5FKTtcbiAgICBkZWJ1Z1RvZ2dsZUtleS5vbkRvd24uYWRkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGdsb2JhbHMucGx1Z2lucy5zYXRCb2R5LmlzRGVidWdBbGxFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIGdsb2JhbHMucGx1Z2lucy5zYXRCb2R5LmRpc2FibGVEZWJ1Z0FsbCgpO1xuICAgICAgICAgICAgZ2xvYmFscy5zaGFkb3dNYXNrLnRvZ2dsZVJheXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsb2JhbHMucGx1Z2lucy5zYXRCb2R5LmVuYWJsZURlYnVnQWxsKCk7XG4gICAgICAgICAgICBnbG9iYWxzLnNoYWRvd01hc2sudG9nZ2xlUmF5cygpO1xuICAgICAgICB9XG4gICAgfSwgdGhpcyk7XG59O1xuXG5TYW5kYm94LnByb3RvdHlwZS5nZXRNYXBQb2ludHMgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAvLyBUaGVyZSBjb3VsZCBiZSBtb3JlIHRoYW4gMSBtYXAgcG9pbnQgcGVyIHR5cGUuLi5cbiAgICB2YXIgbWFwUG9pbnRzID0gW107XG4gICAgLy8gV2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCB0aWxlIG1hcCBsYXllci5cbiAgICB2YXIgbWFwID0gdGhpcy5nYW1lLmdsb2JhbHMudGlsZU1hcDtcbiAgICAvLyBJZiB0aGUgY3VycmVudCBrZXkgZXhpc3RzLi4uXG4gICAgaWYgKG1hcC5vYmplY3RzW2tleV0pIHtcbiAgICAgICAgLy8gRm9yIGVhY2ggb2JqZWN0IHdpdGggdGhlIGN1cnJlbnQga2V5LlxuICAgICAgICB2YXIgb2JqZWN0cyA9IG1hcC5vYmplY3RzW2tleV07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbWFwUG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIHg6IG9iamVjdHNbaV0ueCxcbiAgICAgICAgICAgICAgICB5OiBvYmplY3RzW2ldLnlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcFBvaW50cztcbn07XG5cblNhbmRib3gucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmdhbWUuZ2xvYmFscy5zaGFkb3dNYXNrLnVwZGF0ZSgpO1xufTtcblxuU2FuZGJveC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2FtZS5kZWJ1Zy50ZXh0KHRoaXMuZ2FtZS50aW1lLmZwcywgNSwgMTUsIFwiI0E4QThBOFwiKTtcbiAgICAvLyB0aGlzLmdhbWUuZGVidWcuQVN0YXIodGhpcy5nYW1lLmdsb2JhbHMucGx1Z2lucy5hc3RhciwgMjAsIDIwLCBcIiNmZjAwMDBcIik7XG5cbiAgICB0aGlzLmdhbWUuZ2xvYmFscy5zaGFkb3dNYXNrLmRyYXdXYWxscygpO1xufTsiLCIvKipcbiAqIFN0YXJ0U2NyZWVuIC0gc3RhcnQgaGVyZSFcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXJ0U2NyZWVuO1xuXG52YXIgUmV0aWN1bGUgPSByZXF1aXJlKFwiLi4vZ2FtZS1vYmplY3RzL3JldGljdWxlLmpzXCIpO1xuXG5mdW5jdGlvbiBTdGFydFNjcmVlbigpIHt9XG5cblN0YXJ0U2NyZWVuLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gR3JvdXBzIGZvciB6LWluZGV4IHNvcnRpbmcgYW5kIGZvciBjb2xsaXNpb25zXG4gICAgdGhpcy5ncm91cHMgPSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHRoaXMuZ2FtZS5hZGQuZ3JvdXAodGhpcy53b3JsZCwgXCJiYWNrZ3JvdW5kXCIpLFxuICAgICAgICBtaWRncm91bmQ6IHRoaXMuZ2FtZS5hZGQuZ3JvdXAodGhpcy53b3JsZCwgXCJtaWRncm91bmRcIiksXG4gICAgICAgIGZvcmVncm91bmQ6IHRoaXMuZ2FtZS5hZGQuZ3JvdXAodGhpcy53b3JsZCwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgfTtcblxuICAgIHRoaXMuYmcgPSB0aGlzLmFkZC50aWxlU3ByaXRlKDAsIDAsIDIwMDAsIDIwMDAsIFwiYXNzZXRzXCIsIFwiaHVkL2dyaWRcIiwgXG4gICAgICAgIHRoaXMuZ3JvdXBzLmJhY2tncm91bmQpO1xuXG4gICAgdmFyIGxvZ28gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSh0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWS0xNjAsXG4gICAgICAgIFwiYXNzZXRzXCIsIFwic3RhcnRTY3JlZW4vbG9nb1wiKTtcbiAgICBsb2dvLmFuY2hvci5zZXRUbygwLjUsMC41KTtcbiAgICB0aGlzLmdyb3Vwcy5taWRncm91bmQuYWRkKGxvZ28pO1xuICAgIHZhciBwbGF5QnRuID0gdGhpcy5nYW1lLmFkZC5idXR0b24odGhpcy53b3JsZC5jZW50ZXJYLFxuICAgICAgICB0aGlzLndvcmxkLmNlbnRlclkrMjAsIFwiYXNzZXRzXCIsIHRoaXMuX3BsYXlUaGVHYW1lLCB0aGlzLFxuICAgICAgICBcInN0YXJ0U2NyZWVuL3BsYXktZG93blwiLCBcInN0YXJ0U2NyZWVuL3BsYXktdXBcIik7XG4gICAgcGxheUJ0bi5hbmNob3Iuc2V0VG8oMC41LDAuNSk7XG4gICAgdGhpcy5ncm91cHMubWlkZ3JvdW5kLmFkZChwbGF5QnRuKTtcbiAgICB2YXIgb3B0aW9uc0J0biA9IHRoaXMuZ2FtZS5hZGQuYnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCxcbiAgICAgICAgdGhpcy53b3JsZC5jZW50ZXJZKzE0MCwgXCJhc3NldHNcIiwgdGhpcy5fb3B0aW9ucywgdGhpcyxcbiAgICAgICAgXCJzdGFydFNjcmVlbi9vcHRpb25zLWRvd25cIiwgXCJzdGFydFNjcmVlbi9vcHRpb25zLXVwXCIpO1xuICAgIG9wdGlvbnNCdG4uYW5jaG9yLnNldFRvKDAuNSwwLjUpO1xuICAgIHRoaXMuZ3JvdXBzLm1pZGdyb3VuZC5hZGQob3B0aW9uc0J0bik7XG5cbiAgICB0aGlzLnJldGljdWxlID0gbmV3IFJldGljdWxlKHRoaXMsIHRoaXMuZ3JvdXBzLmZvcmVncm91bmQpO1xufTtcblxuU3RhcnRTY3JlZW4ucHJvdG90eXBlLl9wbGF5VGhlR2FtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmdhbWUuc3RhdGUuc3RhcnQoXCJnYW1lXCIpO1xufTtcblxuU3RhcnRTY3JlZW4ucHJvdG90eXBlLl9vcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKFwidHJpY2shXCIpO1xufTtcbiJdfQ==
