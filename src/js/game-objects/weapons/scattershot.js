import BaseWeapon from "./base-weapon";
import Projectile from "./base-projectile";

export default class Scattershot extends BaseWeapon {
    constructor(game, parentGroup, player) {
        super(game, parentGroup, "Scattershot", player);

        // Initial weapon settings:
        //  Ammo               - 24 shots / clip
        //  Time between shots - 600 ms
        //  Reload time        - 3600 ms
        this.init(24, 600, 3600);
    }

    fire(angle) {
        if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
            // Find trajectory
            var pelletNum = this.game.rnd.integerInRange(12, 18);

            // randomize the trajectory of every bullet in the shotgun blast
            for (var i=0; i<pelletNum; i++) {
                var mod = (this.game.rnd.integerInRange(0, 30) * (Math.PI / 180)) *
                        this.game.rnd.sign();
                var rndAngle = angle + mod;
                var speed = this.game.rnd.integerInRange(364,376)
                var perpendicularOffset = this.game.rnd.integerInRange(-5,5)
                this._createProjectile(rndAngle, 24, perpendicularOffset, speed);
            }

            this.incrementAmmo(-1);

            this._startCooldown(this._cooldownTime);
        }
    }

    _createProjectile(angle, playerDistance, perpendicularOffset, speed) {
        var perpAngle = angle - (Math.PI / 2);
        var x = this._player.x + (playerDistance * Math.cos(angle)) - 
            (perpendicularOffset * Math.cos(perpAngle));
        var y = this._player.y + (playerDistance * Math.sin(angle)) - 
            (perpendicularOffset * Math.sin(perpAngle));
        // shotgun blast is made up of a bunch of slugs at half size.
        var p = new Projectile(this.game, x, y, "assets", "weapons/slug", this,
            this._player, 16, angle, speed);
        p.scale.setTo(0.5, 0.5);
        var rgb = Phaser.Color.HSLtoRGB(0.75, 0.36, 0.64);
        p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
    }
}