exports.applyRandomLightnessTint = function (sprite, h, s, l) {
    l += sprite.game.rnd.realInRange(-0.1, 0.1);
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    sprite.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};