exports.applyRandomLightnessTint = function (sprite, h, s, l) {
    l += sprite.game.rnd.realInRange(-0.1, 0.1);
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    sprite.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};

exports.checkOverlapWithGroup = function (self, group, callback, context) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            exports.checkOverlapWithGroup(self, child, callback, context);
        } else {
            self.game.physics.arcade.overlap(self, child, callback, null, 
                context);
        }
    }
};

exports.satOverlapWithArcadeGroup = function (satPolygon, self, group, callback, 
    context) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            exports.satOverlapWithArcadeGroup(satPolygon, self, child, callback, 
                context);
        } else {
            // Check for a body
            var body = child.body;
            if (!body) continue;

            // If there is a body, create a SAT polygon from the body. Assume 
            // that the body's anchor is (0.5, 0.5) since all enemies are set up
            // that way for now...
            var w = body.width;
            var h = body.height;
            var pos = new SAT.Vector(body.x, body.y);  
            var satOtherPolygon = new SAT.Box(pos, w, h).toPolygon();
            var collided = SAT.testPolygonPolygon(satPolygon, satOtherPolygon);
            if (collided) callback.call(context, self, child);
        }
    }
};