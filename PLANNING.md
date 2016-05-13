# Planning


### Game 0.0.0 - the first one

#### Gameplay
- single player survival horde mode
- wave-based, increasing difficulty w/ # of enemies and/or amount of enemy health
  - Vary enemy composition by wave, a boss every milestone reached
  - waves triggered after time, or after all enemies are killed, or some combo (next wave triggered 1 min after there is only 10 enemies left, keep the pressure on)
- high score based on # of waves / enemies killed
- what is the hook that separates this horde gameplay from other mechanics?
- enemies crushing in from all sides, restrictive sense of space might make for coherent gameplay
- tightly-tuned action that has easy-to-play, hard-to-master progression

#### Map
- top down view, player has restricted vision
- each player has own view, instead of a shared view that zooms to show all players
- large grid-like map, bigger than the players view
- obstacles (rocks, trees, etc.) can be used to hide behind/kite enemies
  - can obstacles be destoryed?
  - can obstacles block projectiles?
- you can move any direction.  Enemies can just pour in from all sides

#### Graphics
- geometric assets to start, simple aesthetics
- use color/shape to differentiate between player, enemy, projectile, background and obstacles
- sprite sheets for animation

#### Player
- player is always centered on screen
  - move around map with w a s d or arrow keys
  - mouse is crosshair
  - primary attack with the mouse, secondary attack with right click or space
- a short range power attack and a long range weaker attack
- Powerup drops from enemies to upgrade weapons/abilities/stats
- stats
  - primary weapon power
  - secondary weapon power
  - amount of health
  - health regen
  - speed
- weapons/abilities
  - dash/teleport ability, something that plays upon the restricted vision
  - a close range slash attack (link's swirly attack), effective on crowds, but encourages players to take a risk
  - sawed off shotgun/crossbow - low damage, large spread, knockback
- does player have health they can regen?  multiple lives?  can multiple players revive each other?

#### Enemies
- Several different types of enemies, generated using combinations of movement and attack patterns
- Movement Patterns:
  - Aggressive charge
  - Slow follow
  - Attack and retreat
  - Follow from a distance (for ranged attackers)
  - Slow follow in a random direction
- Attack Patterns:
  - Close range (sword)
  - Mid range (fireball, mace/whip, spear, etc)
  - Ranged attack (arrows)
  - Suicide bomber
  - Charge/body slam
- Other ideas
  - Shield
  - Weakness/Resistance
  - Boss only mechanics?
- Tiers
  - 1 - Mobs, low health low dammage, appear in large groups, 1 attack 1 movement
  - 2 - Mob Leader, mid health mid damage, sometimes appear alongside mobs, 1 attack 2 movement
  - 3 - Captain, boss, mid health high damage, 2 attack 2 movement
  - 4 - Ultra, boss, high health high damage, 3 attack 3 movement
- Generate capatains and ultras on the fly, with random trait combos for variation when replaying

### Initial Ideas

- Character Classes
  - Different roles based on states, attack range
  - Stats: speed, power, health, health regen?
  - Basic skill tree to enhance states, possibly unlock new weapons?
  - xp gained from killing enemies, possibly other players
- RPG elements
  - World is randomly populated with materials needed to level up the skill tree
  - Destroy materials to collect them, gain small amounts of xp
- Leveling mechanism
  - Power-ups dropped from boss give new abilities, possibly for a limited amount of time
  - xp, skill trees, level up to gain power (xp drops, or kill them to earn xp)
  - As score goes up, player size increases, attract enemies of greater power
  	- smaller players can hang around, dangerous but there is a chance to earn  more xp
- Fighting mechanism
  - Team based PVE
  - PVP
  - Solo PVE w/ division style pvp (rogue)
  - Rounds vs. decentralized gameplay
- Other Things
  - Stealth, teleporting/dashing mechanism
  - Multiplayer
  - Minigore style hordes
  - Usurping mechanism


### Games for inspiration

- [Agar.io](https://agar.io/)
- [Slither.io](http://slither.io/)
- [Diep.io](http://diep.io/)
- [Factorio](https://www.factorio.com/)
- [StarDew Valley](http://stardewvalley.net/)
- [Towerfall Ascension](http://www.towerfall-game.com/)
- [Ninja Slash](http://www.kongregate.com/games/doopop/ninja-slash)
- [Pixeljunk Monsters](http://pixeljunk.jp/library/Monsters/)
- [Dungeon Defenders](https://dungeondefenders.com/2/about)
- [Everyday Shooter](http://www.everydayshooter.com/)
- [Tilt to Live](http://onemanleft.com/games/tilttolive/)


### Tutorials

- [Isometric Games in Unity](http://www.theappguruz.com/blog/create-isometric-games-like-clash-of-clans-crossy-roads-age-of-empire-etc)
- [Enemy Follow Script in Unity](http://www.theappguruz.com/blog/enemy-follow-script-ai)
- [Basic MMORPG Concepts](http://www.lucedigitale.com/blog/mmorpg-develop-basic-concepts/)
