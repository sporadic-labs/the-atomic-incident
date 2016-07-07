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