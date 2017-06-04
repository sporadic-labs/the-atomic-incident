// Twice the area of the triangle formed by a, b and c
function triarea2(a, b, c) {
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const bx = c.x - a.x;
    const by = c.y - a.y;
    return bx * ay - ax * by;
}

function almostEqual(value1, value2, errorMargin = 0.0001) {
    if (Math.abs(value1 - value2) <= errorMargin) return true;
    else return false;
}

// https://gist.github.com/Aaronduino/4068b058f8dbc34b4d3a9eedc8b2cbe0
function angleDifference(x, y) {
    let a = x - y;
    // (a+180) % 360; this ensures the correct sign
    a = (function(i, j) {
        return i-Math.floor(i/j)*j
    })(a+Math.PI, Math.PI*2);
    a -= Math.PI;
    return a;
}

function areCollinear(line1, line2, errorMargin=0.0001) {
    // Figure out if the two lines are equal by looking at the area of the triangle formed
    // by their points
    const area1 = triarea2(line1.start, line1.end, line2.start);
    const area2 = triarea2(line1.start, line1.end, line2.end);
    if (almostEqual(area1, 0, errorMargin) && almostEqual(area2, 0, errorMargin)) {
        return true;
    } else return false;
}

module.exports = {
    triarea2,
    almostEqual,
    angleDifference,
    areCollinear
};