const utils = require("./utils");

class Channel {
    constructor() {
        this.portals = [];
    }

    /**
     * @param {Phaser.Point} p1 
     * @param {Phaser.Point} p2 
     * 
     * @memberof Channel
     */
    push(p1, p2) {
        if (p2 === undefined) p2 = p1;
        this.portals.push({
            left: p1, 
            right: p2
        });
    }

    stringPull(agentRadius = 0) {
        var portals = this.portals;
        var pts = [];
        // Init scan state
        var portalApex, portalLeft, portalRight;
        var apexIndex = 0,
            leftIndex = 0,
            rightIndex = 0;

        portalApex = portals[0].left;
        portalLeft = portals[0].left;
        portalRight = portals[0].right;

        // Add start point.
        pts.push(portalApex);

        for (var i = 1; i < portals.length; i++) {
            // Find the next portal vertices
            var left = portals[i].left;
            var right = portals[i].right;

            // Update right vertex.
            if (utils.triarea2(portalApex, portalRight, right) <= 0.0) {
                if (portalApex.equals(portalRight) ||
                        utils.triarea2(portalApex, portalLeft, right) > 0.0) {
                    // Tighten the funnel.
                    portalRight = right;
                    rightIndex = i;
                } else {
                    // Right vertex just crossed over the left vertex, so the left vertex should
                    // now be part of the path. Add some offset if the agent has a radius.       
                    if (agentRadius > 0) {
                        // Find the angle of the the edges on either side current right vertex
                        const prevLeft = portals[i - 2].left;
                        const nextLeft = portals[i].left;
                        const nextAngle = portalLeft.angle(nextLeft);
                        const prevAngle = prevLeft.angle(portalLeft);
                        
                        // Find the perpendicular to the midpoint of the two angles, i.e the normal
                        // of the current right vertex
                        const diff = utils.angleDifference(nextAngle, prevAngle);
                        const angle = prevAngle + (diff / 2) - (Math.PI / 2);

                        const offsetPoint = portalLeft.clone().add(
                            agentRadius * Math.cos(angle),
                            agentRadius * Math.sin(angle)
                        );
                        
                        pts.push(offsetPoint);
                    } else {
                        pts.push(portalLeft);
                    }
                    
                    // Restart scan from portal left point.

                    // Make current left the new apex.
                    portalApex = portalLeft;
                    apexIndex = leftIndex;
                    // Reset portal
                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    // Restart scan
                    i = apexIndex;
                    continue;
                }
            }

            // Update left vertex.
            if (utils.triarea2(portalApex, portalLeft, left) >= 0.0) {
                if (portalApex.equals(portalLeft) || 
                        utils.triarea2(portalApex, portalRight, left) < 0.0) {
                    // Tighten the funnel.
                    portalLeft = left;
                    leftIndex = i;
                } else {
                    // Left vertex just crossed over the right vertex, so the right vertex should
                    // now be part of the path. Add some offset if the agent has a radius.       
                    if (agentRadius > 0) {
                        // Find the angle of the the edges on either side current right vertex
                        const prevRight = portals[i - 2].right;
                        const nextRight = portals[i].right;
                        const nextAngle = portalRight.angle(nextRight);
                        const prevAngle = prevRight.angle(portalRight);
                        
                        // Find the perpendicular to the midpoint of the two angles, i.e the normal
                        // of the current right vertex
                        const diff = utils.angleDifference(nextAngle, prevAngle);
                        const angle = prevAngle + (diff / 2) + (Math.PI / 2);

                        const offsetPoint = portalRight.clone().add(
                            agentRadius * Math.cos(angle),
                            agentRadius * Math.sin(angle)
                        );
                        
                        pts.push(offsetPoint);
                    } else {
                        pts.push(portalRight);
                    }
                    
                    // Restart scan from portal right point.

                    // Make current right the new apex.
                    portalApex = portalRight;
                    apexIndex = rightIndex;
                    // Reset portal
                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    // Restart scan
                    i = apexIndex;
                    continue;
                }
            }
        }

        if ((pts.length === 0) || (!pts[pts.length - 1].equals(portals[portals.length - 1].left))) {
            // Append last point to path.
            pts.push(portals[portals.length - 1].left);
        }

        this.path = pts;
        return pts;
    }
}

module.exports = Channel;