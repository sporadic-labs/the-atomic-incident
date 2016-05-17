# Planning

### Game 0.0.0 - the first one

#### Central Ideas

- Top down
- Restricted vision of a larger map
- Overwhelming horde of enemies - crushing in from all sides
- Mechanic to encourage "dangerous" play that hightens the tension
    - Combo-based damage/score/exp/drops
- Free movement in all directions
- Easy to play, hard to master progression (easier said than done...)
- Attacks/movements/enemies that all play on the idea of crowds.  E.g. dash to slip through cracks in a crowd, attacks that have a wide area of effect, enemies that group together, etc.

#### Gameplay

-	wave-based, increasing difficulty w/ # of enemies and/or amount of enemy health
	-	Vary enemy composition by wave, a boss every milestone reached
	-	waves triggered after time, or after all enemies are killed, or some combo (next wave triggered 1 min after there is only 10 enemies left, keep the pressure on)
- High score based on number of waves completed, enemies killed and/or highest combo
- Mechanics to highten tension
    - Combo-based ideas
        - Hitting 5x, 10x, 20x, etc. triggers the next weapon drop
        - Multiplier for exp or damage
    - Limited resources (ammo/mana/etc)
    - Enemies that are "spawners"

#### Map

-	each player has own view, instead of a shared view that zooms to show all players
-	obstacles (rocks, trees, etc.) can be used to hide behind/kite enemies
	-	can obstacles be destoryed?
	-	can obstacles block projectiles?

#### Graphics

-	geometric assets to start, simple aesthetics
-	use color/shape to differentiate between player, enemy, projectile, background and obstacles

#### Player

-	player is always centered on screen
	-	move around map with w a s d or arrow keys
	-	mouse is crosshair
	-	primary attack with the mouse, secondary attack with right click or space
-	a short range power attack and a long range weaker attack
-	Powerup drops from enemies to upgrade weapons/abilities/stats
-	stats
	-	primary weapon power
	-	secondary weapon power
	-	amount of health
	-	health regen
	-	speed
-	weapons/abilities
	-	dash/teleport ability, something that plays upon the restricted vision
	-	a close range slash attack (link's swirly attack), effective on crowds, but encourages players to take a risk
	-	sawed off shotgun/crossbow - low damage, large spread, knockback
-	does player have health they can regen? multiple lives? can multiple players revive each other?

#### Enemies

-	Several different types of enemies, generated using combinations of movement and attack patterns
-   Crowd patterns:
    -   Enemies that rush when they are in packs, forcing player to divide and conquer
    -   Enemies that fan out in an attempt to flank/reduce player's ability to combo
    -   Enemies that group and charge in a line one-by-one
    -   Enemies (typically dormant) that attack when can see an ally being attacked
    -   Enemies that run as soon as they see one of their pack go down
    -   Packs of enemies that are "hunters" that attempt to hide outside of player's vision and ambush
    -   Enemies that attempt to lure a player into a pack ambush
    -   Enemies that only attack when they can see/hear you
-	Movement Patterns:
	-	Aggressive charge
	-	Slow follow
	-	Attack and retreat
	-	Follow from a distance (for ranged attackers)
	-	Slow follow in a random direction
-	Attack Patterns:
	-	Close range (sword)
	-	Mid range (fireball, mace/whip, spear, etc)
	-	Ranged attack (arrows)
	-	Suicide bomber
	-	Charge/body slam
-	Other ideas
	-	Shield
	-	Weakness/Resistance
	-	Boss only mechanics?
-	Tiers
	-	1 - Mobs, low health low dammage, appear in large groups, 1 attack 1 movement
	-	2 - Mob Leader, mid health mid damage, sometimes appear alongside mobs, 1 attack 2 movement
	-	3 - Captain, boss, mid health high damage, 2 attack 2 movement
	-	4 - Ultra, boss, high health high damage, 3 attack 3 movement
-	Generate capatains and ultras on the fly, with random trait combos for variation when replaying

### Initial Ideas

-	Character Classes
	-	Different roles based on states, attack range
	-	Stats: speed, power, health, health regen?
	-	Basic skill tree to enhance states, possibly unlock new weapons?
	-	xp gained from killing enemies, possibly other players
-	RPG elements
	-	World is randomly populated with materials needed to level up the skill tree
	-	Destroy materials to collect them, gain small amounts of xp
-	Leveling mechanism
	-	Power-ups dropped from boss give new abilities, possibly for a limited amount of time
	-	xp, skill trees, level up to gain power (xp drops, or kill them to earn xp)
	-	As score goes up, player size increases, attract enemies of greater power
	-	smaller players can hang around, dangerous but there is a chance to earn more xp
-	Fighting mechanism
	-	Team based PVE
	-	PVP
	-	Solo PVE w/ division style pvp (rogue)
	-	Rounds vs. decentralized gameplay
-	Other Things
	-	Stealth, teleporting/dashing mechanism
	-	Multiplayer
	-	Minigore style hordes
	-	Usurping mechanism

### Games for inspiration

-	[Agar.io](https://agar.io/)
-	[Slither.io](http://slither.io/)
-	[Diep.io](http://diep.io/)
-	[Factorio](https://www.factorio.com/)
-	[StarDew Valley](http://stardewvalley.net/)
-	[Towerfall Ascension](http://www.towerfall-game.com/)
-	[Ninja Slash](http://www.kongregate.com/games/doopop/ninja-slash)
-	[Pixeljunk Monsters](http://pixeljunk.jp/library/Monsters/)
-	[Dungeon Defenders](https://dungeondefenders.com/2/about)
-	[Everyday Shooter](http://www.everydayshooter.com/)
-	[Tilt to Live](http://onemanleft.com/games/tilttolive/)
-	[Wings.io](http://wings.io/)

### Tutorials

-	[Isometric Games in Unity](http://www.theappguruz.com/blog/create-isometric-games-like-clash-of-clans-crossy-roads-age-of-empire-etc)
-	[Enemy Follow Script in Unity](http://www.theappguruz.com/blog/enemy-follow-script-ai)
-	[Basic MMORPG Concepts](http://www.lucedigitale.com/blog/mmorpg-develop-basic-concepts/)

-	[Phaser - Space Shooter](http://phaser.io/tutorials/coding-tips-007)
-	[Phaser - State Management](http://phaser.io/news/2015/10/state-management-tutorial)
-	[Phaser - Procedural Dungeon](http://phaser.io/news/2016/03/procedural-dungeon-tutorial)
-	[Phaser - High Scoreboard w/ Parse Server](http://www.html5gamedevs.com/topic/19277-js-high-score-and-leaderboard-system-based-on-parsecom/)
