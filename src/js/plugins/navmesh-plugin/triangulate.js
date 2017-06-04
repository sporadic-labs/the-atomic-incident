/**
 * @file A function that can triangulate a polygon (expressed as an array of countours) using
 * libtess.js. The libtess JS port's documentation is non-existent. Instead, it mimics an OpenGL
 * utilities API, so see this guide for help: http://www.glprogramming.com/red/chapter11.html
 */

const libtess = require("libtess");

/**
 * A function to take a 2D polygon (described by contours) and return an accurate tesselation into
 * triangles using libtess. This code is from the libtess.js examples with small tweaked. The 
 * winding order used is the default (GLU_TESS_WINDING_ODD).
 *
 * @param {Float32Array[]} contours An array of Float32Arrays. Each one containing a contour of the
 * polygon. Be mindful of the winding order of the contour as it controls where the space is filled
 * in or is a hole. An individual contour takes the form:
 *  Float32Array.from(0,0, 0,100, 100,100, 100,0, ...)
 * where each consecutive pair of values is a vertex on the contour. 
 * @param {boolean} [generateClockwiseOrder=false] Whether or not to returned the tesselated
 * triangles in clockwise or counter-clockwise ordering.
 * @returns {number[]} The vertices of the triangulated polygon in the form:
 *  [0,0 0,100, 100,100, ...]
 */
function triangulate(contours, generateClockwiseOrder = false) {
    // Set up a tessellator and then configure the various callbacks that it needs
    const tessy = new libtess.GluTesselator();

    // Vertex callback for tessellator's output
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, (data, polyVertArray) => {
        polyVertArray[polyVertArray.length] = data[0];
        polyVertArray[polyVertArray.length] = data[1];
    });

    // Callback to check type of tessellation to confirm it is triangles
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, (type) => {
        if (type !== libtess.primitiveType.GL_TRIANGLES) {
            console.warn(`Expected TRIANGLES but got type: ${type}`);
        }
    });

    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, (errno) => {
        console.warn(`Tessellation error: ${errno}`);
    });

    // Not completely sure this callback is used, but worth review the API docs to double check. It
    // has to do with when a polygon intersects with itself and new vertices must be created.
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, (coords) => {
        return [coords[0], coords[1], coords[2]];
    });

    // Simply setting a callback forces GL_TRIANGLES but need no-strip/no-fan behavior
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, () => {});

    // Libtess will take 3d vertices and project them onto a 2D a plane for tessellation. For 2D 
    // tessellation, we can control the order of the tesselated vertex output by using a normal with
    // z = 1 or z = -1
    tessy.gluTessNormal(0, 0, generateClockwiseOrder ? 1 : -1);

    // Kick off the tessellation
    var triangleVerts = [];
    tessy.gluTessBeginPolygon(triangleVerts);
    for (var i = 0; i < contours.length; i++) {
        tessy.gluTessBeginContour();
        var contour = contours[i];
        for (var j = 0; j < contour.length; j += 2) {
            var coords = [contour[j], contour[j + 1], 0];
            tessy.gluTessVertex(coords, coords);
        }
        tessy.gluTessEndContour();
    }
    tessy.gluTessEndPolygon();

    return triangleVerts;
}

module.exports = triangulate;