//=============================================================================
// Custom Settings Changed for Game
// by Mike Harris
// Last Updated: 2016.1.7
//=============================================================================

var Imported = Imported || {};
Imported.Alkr_CustomGameSettings = true;

var Alkr = Alkr || {};
Alkr.SET = Alkr.SET || {};

/*:
 * @plugindesc Custom changes to RPG Maker's default settings optimized for Alien Uprising: Invasion.
 * @author Mike Harris
 *
 * @help This plugin does not provide plugin commands.
 *
 * == CHANGES TO CURRENT GAME PROCESSES =====
 * 1. Shadow Opacity: 35% (Default 50%)
 * 2. Bush Depth: 32 pixels (Default 12 pixels)
 * 3. Actor Opacity (In Bush): 62.5% (160/256)
 * 4. Scrolling Centered for Large Actors
 *
 * == CUSTOM GAME SETTINGS/FUNCTIONS =====
 * 5. Unseen Visibility (while moving under the leaves)
 * 6. Cliff Edges
 * 7. Height Level Set
 * 8. Water Depth Initializing
 * 9. Water Depth Running
 * 10. Water Depth Resetting
 *
 * == REGION IDs EFFECTED BY PLUGIN FUNCTIONS =====
 *  225: default bush depth (set with plugin: Kaus_Ultimate_Overlay.js)
 *  226 - 229 used in Water/Bush Depth
 *  230 - 240 used in Aldar Tree Visibility
 *  241 - 251 used in Cliff Edges Set
 *  252 - 255 used for teleport points (left, right, down, up)
 */

(function() {

//=============================================================================
//==   C H A N G E S   T O   C U R R E N T   G A M E   P R O C E S S E S   ====
//=============================================================================


//============   1.   S H A D O W   O P A C I T Y   ===========================
// default shadow opacity set to 35% instead of 50% ///////////////////////////

Tilemap.prototype._drawShadow = function(bitmap, shadowBits, dx, dy) {
  if (shadowBits & 0x0f) {
    var w1 = this._tileWidth / 2;
    var h1 = this._tileHeight / 2;
    var color = 'rgba(0,0,0,0.35)';
    for (var i = 0; i < 4; i++) {
      if (shadowBits & (1 << i)) {
        var dx1 = dx + (i % 2) * w1;
        var dy1 = dy + Math.floor(i / 2) * h1;
        bitmap.fillRect(dx1, dy1, w1, h1, color);
      }
    }
  }
};

//===============   2.   B U S H   D E P T H   ================================
// default water/bush depth increased to 32 pixes instead of 12 pixels ////////

Game_CharacterBase.prototype.refreshBushDepth = function() {
  if (this.isNormalPriority() && !this.isObjectCharacter() &&
    this.isOnBush() && !this.isJumping()) {
    if (!this.isMoving()) {
      this._bushDepth = 32;
    }
  } else {
    this._bushDepth = 0;
  }
};

//===============   3.   A C T O R   O P A C I T Y   ==========================
// default opacity in Water/bushes: 62.5% (160/256) instead of 50% ////////////

Sprite_Character.prototype.createHalfBodySprites = function() {
  if (!this._upperBody) {
    this._upperBody = new Sprite();
    this._upperBody.anchor.x = .5;
    this._upperBody.anchor.y = 1;
    this.addChild(this._upperBody);
  }
  if (!this._lowerBody) {
    this._lowerBody = new Sprite();
    this._lowerBody.anchor.x = .5;
    this._lowerBody.anchor.y = 1;
    this._lowerBody.opacity = 64;
    this.addChild(this._lowerBody);
  }
};

//===   4.   S C R O L L I N G   C E N T E R E D   F O R   L A R G E   A C T O R S   ===
// the default 1 tile actor center scrolling doesn't have the -1 after this.centerY(), lastScrolledY, and this.scrolledY()
Game_Player.prototype.center = function(x, y) {
    return $gameMap.setDisplayPos(x - this.centerX(), (y - this.centerY()) - 1);
};
Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    var x1 = lastScrolledX;
    var y1 = lastScrolledY - 1;
    var x2 = this.scrolledX();
    var y2 = this.scrolledY() - 1;
    if (y2 > y1 && y2 > this.centerY()) {
        $gameMap.scrollDown(y2 - y1);
    }
    if (x2 < x1 && x2 < this.centerX()) {
        $gameMap.scrollLeft(x1 - x2);
    }
    if (x2 > x1 && x2 > this.centerX()) {
        $gameMap.scrollRight(x2 - x1);
    }
    if (y2 < y1 && y2 < this.centerY()) {
        $gameMap.scrollUp(y1 - y2);
    }
};

/*
//============   4.   B U S H   R E G I O N   C H E C K   =====================
// sets regionId 225 for water/bush locations

Game_Map.prototype.isBush = function(x, y) {
    return (this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x40)) ||
    (this.isValid(x, y) && this.regionId(x, y) === 225);
};
*/


//=============================================================================
//==   C U S T O M   G A M E   S E T T I N G S / F U N C T I O N S   ==========
//=============================================================================


//=========   5.   U N S E E N   V I S A B I L I T Y   ========================
// 4. Unseen Visability ///////////////////////////////////////////////////////

/* Flips switches to make leaves/overhead events transparent/visible to make a
line of sight effect.

Diagram: (X == tree base (0x, 0y)
          | == center of visability
          0 == leaves of tree
          . == visibility under tree (40% opaque = switch A)
          - == " " (70% opaque = switch B)
          = == " " (90% opaque = switch C)

                     <---y------ -9 ---------->
       _______________________________________________________
      |                                                       |
      |                  =  =  = -8  =  =  =                  |        B Rows: 1
      |            =  =  =  -  - -7  -  -  =  =  =            |                2
      |         =  =  -  -  -  - -6  -  -  -  -  =  =         |                3
  /|  |      =  =  -  -  -  -  . -5  .  -  -  -  -  =  =      | /| A Rows: 1   4
   |  |      =  -  -  -  .  .  . -4  .  .  .  -  -  -  =      |  |         2   5
   |  |   =  =  -  -  .  .  .  0 -3  0  .  .  .  -  -  =  =   |  |         3   6
   |  |   =  -  -  -  .  .  0  0 -2  0  0  .  .  -  -  -  =   |  |         4   7
   |  |   =  -  -  .  .  .  0  0 -1  0  0  .  .  .  -  -  =   |  |         5   8
  -9  |   =  -  -  .  .  .  .  .  X  .  .  .  .  .  -  -  =   |  9         6   9
   |  |   =  -  -  .  .  .  .  .  1  .  .  .  .  .  -  -  =   |  |         7  10
   x  |   =  -  -  -  .  .  .  .  2  .  .  .  .  -  -  -  =   |  x         8  11
   |  |   =  =  -  -  .  .  .  .  3  .  .  .  .  -  -  =  =   |  |         9  12
   |/ |      =  -  -  -  .  .  .  4  .  .  .  -  -  -  =      |  |/       10  13
      |      =  =  -  -  -  -  .  5  .  -  -  -  -  =  =      |           11  14
      |         =  =  -  -  -  -  6  -  -  -  -  =  =         |               15
      |            =  =  =  -  -  7  -  -  =  =  =            |               16
      |                  =  =  =  8  =  =  =                  |               17
      |_______________________________________________________|

                     <---y------- 9 ---------->

regionId 230 - 240 == level 1 - level 10 of map heights*/

Alkr.SET.unseenVis = function(regId) {

//  if (($gamePlayer.regionId() === regId) && ($gameVariables.value(4) === (regId - 230))) {
  if ($gamePlayer.regionId() === regId) {

    for (var i = 1; i < arguments.length; i++) {  // all event Ids for trees, etc.
      if (($gamePlayer.y > $gameMap.event(arguments[i]).y - 10) &&  // within y minimum
      ($gamePlayer.y < $gameMap.event(arguments[i]).y + 8)) {  // within y maximum)


        switch ($gamePlayer.y) {

          // rows 1 and 17 //
          ///////////////////=  =  =  8  =  =  =///////////////////////////////
          case ($gameMap.event(arguments[i]).y - 8):
          case ($gameMap.event(arguments[i]).y + 8):
            // Switch C (90% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 4) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 2 and 16 //
          ///////////////////=  =  =  -  -  7  -  -  =  =  =///////////////////
          case ($gameMap.event(arguments[i]).y - 7):
          case ($gameMap.event(arguments[i]).y + 7):
            // Switch B (70% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 3) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 6) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 2)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 3 and 15 //
          ///////////////////=  =  -  -  -  -  6  -  -  -  -  =  =/////////////
          case ($gameMap.event(arguments[i]).y - 6):
          case ($gameMap.event(arguments[i]).y + 6):
            // Switch B (70% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 5) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 7) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 4)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 4 and 14 //
          ///////////////////=  =  -  -  -  -  .  5  .  -  -  -  -  =  =///////
          case ($gameMap.event(arguments[i]).y - 5):
          case ($gameMap.event(arguments[i]).y + 5):
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 2) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 6) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 1)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 8) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 5)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 5 and 13 //
          ///////////////////=  -  -  -  .  .  .  4  .  .  .  -  -  -  =///////
          case ($gameMap.event(arguments[i]).y - 4):
          case ($gameMap.event(arguments[i]).y + 4):
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 4) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 7) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 3)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) === 7) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 6 and 12 //
          ///////////////////=  =  -  -  .  .  .  .  3  .  .  .  .  -  -  =  =/
          case ($gameMap.event(arguments[i]).y - 3):
          case ($gameMap.event(arguments[i]).y + 3):
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 5) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 7) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 4)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 9) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 6)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 7 and 11 //
          ///////////////////=  -  -  -  .  .  .  .  2  .  .  .  .  -  -  -  =/
          case ($gameMap.event(arguments[i]).y - 2):
          case ($gameMap.event(arguments[i]).y + 2):
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 5) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 8) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 4)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) === 8) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // rows 8 and 10 //
          ///////////////////=  -  -  .  .  .  .  .  1  .  .  .  .  .  -  -  =/
          case ($gameMap.event(arguments[i]).y - 1):
          case ($gameMap.event(arguments[i]).y + 1):
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 6) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 8) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 5)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) === 8) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }; break;


          // row 9 (Center) //
          ///////////////////=  -  -  .  .  .  .  .  X  .  .  .  .  .  -  -  =/
          case $gameMap.event(arguments[i]).y:
            // Switch A (40% opaque)
            if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 6) {
              if (Galv.PUZ.selfSwitchesOff('A',arguments[i]))
                Galv.PUZ.switch('event','A','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch B (70% opaque)
            } else if ((Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) < 8) &&
            (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) > 5)) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('B',arguments[i]))
                Galv.PUZ.switch('event','B','on',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            // Switch C (90% opaque)
            } else if (Math.abs($gameMap.event(arguments[i]).x - $gamePlayer.x) === 8) {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOff('C',arguments[i]))
                Galv.PUZ.switch('event','C','on',arguments[i]);
            // outside of bounds (resetting everything)
            } else {
              if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
                Galv.PUZ.switch('event','A','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
                Galv.PUZ.switch('event','B','off',arguments[i]);
              if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
                Galv.PUZ.switch('event','C','off',arguments[i]);
            }
        }
      }
    }

  // resetting switches for last time (when not under leaves or !region 254
  } else {
      for (var i = 1; i < arguments.length; i++) {  // event IDs of all trees
        if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
          Galv.PUZ.switch('event','A','off',arguments[i]);
        if (Galv.PUZ.selfSwitchesOn('B',arguments[i]))
          Galv.PUZ.switch('event','B','off',arguments[i]);
        if (Galv.PUZ.selfSwitchesOn('C',arguments[i]))
          Galv.PUZ.switch('event','C','off',arguments[i]);
      }
  }
};


//===============   6.   C L I F F   E D G E S   ==============================
/* Flips switches to make bounding edges of cliff different depending on position

regionId 251 == Resetting highetLvl variable(4)
  241 - 250 == level 1 - level 10 of map heights

*/

Alkr.SET.cliffEdges = function(brDgTL, brTL,brTC,brTR, brDgTR,
                                 brLT,                   brRT,
                                 brLC,                   brRC,
                                 brLB,                   brRB,
                               brDgBL, brBL,brBC,brBR, brDgBR) {


// Initial settings ///////

  // Defaulting Barriers to correct boolean values
  if (brDgTL === undefined) brDgTL = 0;
  if (brTL === undefined) brTL = 0;
  if (brTC === undefined) brTC = 0;
  if (brTR === undefined) brTR = 0;
  if (brDgTR === undefined) brDgTR = 0;
  if (brLT === undefined) brLT = 0;
  if (brRT === undefined) brRT = 0;
  if (brLC === undefined) brLC = 0;
  if (brRC === undefined) brRC = 0;
  if (brLB === undefined) brLB = 0;
  if (brRB === undefined) brRB = 0;
  if (brDgBL === undefined) brDgBL = 0;
  if (brBL === undefined) brBL = 0;
  if (brBC === undefined) brBC = 0;
  if (brBR === undefined) brBR = 0;
  if (brDgBR === undefined) brDgBR = 0;



// Setting barrier positions /////////

  // Top cliff barriers
  $gameMap.event(3)._x = ($gamePlayer._x - Math.max(1,brDgTL));  // barrier DgTL
  $gameMap.event(3)._realX = ($gamePlayer._realX - Math.max(1,brDgTL));
  $gameMap.event(3)._y = ($gamePlayer._y - Math.max(1,brDgTL));
  $gameMap.event(3)._realY = ($gamePlayer._realY - Math.max(1,brDgTL));

  $gameMap.event(4)._x = ($gamePlayer._x - 1);  // barrier TL
  $gameMap.event(4)._realX = ($gamePlayer._realX - 1);
  $gameMap.event(4)._y = ($gamePlayer._y - Math.max(1,brTL));
  $gameMap.event(4)._realY = ($gamePlayer._realY - Math.max(1,brTL));
  $gameMap.event(5)._x = $gamePlayer._x;  // barrier TC
  $gameMap.event(5)._realX = $gamePlayer._realX;
  $gameMap.event(5)._y = ($gamePlayer._y - Math.max(1,brTC));
  $gameMap.event(5)._realY = ($gamePlayer._realY - Math.max(1,brTC));
  $gameMap.event(6)._x = ($gamePlayer._x + 1);  // barrier TR
  $gameMap.event(6)._realX = ($gamePlayer._realX + 1);
  $gameMap.event(6)._y = ($gamePlayer._y - Math.max(1,brTR));
  $gameMap.event(6)._realY = ($gamePlayer._realY - Math.max(1,brTR));

  $gameMap.event(7)._x = ($gamePlayer._x + Math.max(1,brDgTR));  // barrier DgTR
  $gameMap.event(7)._realX = ($gamePlayer._realX + Math.max(1,brDgTR));
  $gameMap.event(7)._y = ($gamePlayer._y - Math.max(1,brDgTR));
  $gameMap.event(7)._realY = ($gamePlayer._realY - Math.max(1,brDgTR));


  // Side cliff barriers
  $gameMap.event(8)._x = ($gamePlayer._x - Math.max(1,brLT));  // barrier LT
  $gameMap.event(8)._realX = ($gamePlayer._x - Math.max(1,brLT));
  $gameMap.event(8)._y = ($gamePlayer._y - 1);
  $gameMap.event(8)._realY = ($gamePlayer._realY - 1);
  $gameMap.event(9)._x = ($gamePlayer._x + Math.max(1,brRT));  // barrier RT
  $gameMap.event(9)._realX = ($gamePlayer._x + Math.max(1,brRT));
  $gameMap.event(9)._y = ($gamePlayer._y - 1);
  $gameMap.event(9)._realY = ($gamePlayer._realY - 1);

  $gameMap.event(10)._x = ($gamePlayer._x - Math.max(1,brLC));  // barrier LC
  $gameMap.event(10)._realX = ($gamePlayer._x - Math.max(1,brLC));
  $gameMap.event(10)._y = $gamePlayer._y;
  $gameMap.event(10)._realY = $gamePlayer._realY;
  $gameMap.event(11)._x = ($gamePlayer._x + Math.max(1,brRC));  // barrier RC
  $gameMap.event(11)._realX = ($gamePlayer._x + Math.max(1,brRC));
  $gameMap.event(11)._y = $gamePlayer._y;
  $gameMap.event(11)._realY = $gamePlayer._realY;

  $gameMap.event(12)._x = ($gamePlayer._x - Math.max(1,brLB));  // barrier LB
  $gameMap.event(12)._realX = ($gamePlayer._x - Math.max(1,brLB));
  $gameMap.event(12)._y = ($gamePlayer._y + 1);
  $gameMap.event(12)._realY = ($gamePlayer._realY + 1);
  $gameMap.event(13)._x = ($gamePlayer._x + Math.max(1,brRB));  // barrier RB
  $gameMap.event(13)._realX = ($gamePlayer._x + Math.max(1,brRB));
  $gameMap.event(13)._y = ($gamePlayer._y + 1);
  $gameMap.event(13)._realY = ($gamePlayer._realY + 1);


  // Bottom cliff barriers
  $gameMap.event(14)._x = ($gamePlayer._x - Math.max(1,brDgBL));  // barrier DgBL
  $gameMap.event(14)._realX = ($gamePlayer._realX - Math.max(1,brDgBL));
  $gameMap.event(14)._y = ($gamePlayer._y + Math.max(1,brDgBL));
  $gameMap.event(14)._realY = ($gamePlayer._realY + Math.max(1,brDgBL));

  $gameMap.event(15)._x = ($gamePlayer._x - 1);  // barrier BL
  $gameMap.event(15)._realX = ($gamePlayer._realX - 1);
  $gameMap.event(15)._y = ($gamePlayer._y + Math.max(1,brBL));
  $gameMap.event(15)._realY = ($gamePlayer._realY + Math.max(1,brBL));
  $gameMap.event(16)._x = $gamePlayer._x;  // barrier BC
  $gameMap.event(16)._realX = $gamePlayer._realX;
  $gameMap.event(16)._y = ($gamePlayer._y + Math.max(1,brBC));
  $gameMap.event(16)._realY = ($gamePlayer._realY + Math.max(1,brBC));
  $gameMap.event(17)._x = ($gamePlayer._x + 1);  // barrier BR
  $gameMap.event(17)._realX = ($gamePlayer._realX + 1);
  $gameMap.event(17)._y = ($gamePlayer._y + Math.max(1,brBR));
  $gameMap.event(17)._realY = ($gamePlayer._realY + Math.max(1,brBR));

  $gameMap.event(18)._x = ($gamePlayer._x + Math.max(1,brDgBR));  // barrier DgBR
  $gameMap.event(18)._realX = ($gamePlayer._realX + Math.max(1,brDgBR));
  $gameMap.event(18)._y = ($gamePlayer._y + Math.max(1,brDgBR));
  $gameMap.event(18)._realY = ($gamePlayer._realY + Math.max(1,brDgBR));


// Setting barrier switches /////////

  for (var i = 0; i < arguments.length; i++) {  // all event Ids for barriers (3-18)
    if (arguments[i] > 0) {
      Galv.PUZ.switch('event','A','on',(i + 3));
    } else {
      Galv.PUZ.switch('event','A','off',(i + 3));
    }
  }
};


//===============   7.   H E I G H T   L E V E L   S E T   ====================
// regionIds 241 - 251 used to determine cliff height

Alkr.SET.heightLvlSet = function () {
  if (($gamePlayer.regionId() > 240) && ($gamePlayer.regionId() < 252)) {
    $gameVariables.setValue(4, ($gamePlayer.regionId() - 240)); // heightLvl set
    if ($gameVariables.value(4) === 11) $gameVariables.setValue(4, 0);
    if (($gameVariables.value(4) > 0) && ($gameVariables.value(4) < 11)) {
      for (var i = 0; i < arguments.length; i++) {  // event IDs of all cliff barriers
        if (Galv.PUZ.selfSwitchesOn('A',arguments[i]))
          Galv.PUZ.switch('event','A','off',arguments[i]);
      }
    }
  }
};


//======   8.   W A T E R   D E P T H   I N I T I A L I Z I N G   =============
// splits character bitmap for water depth changes ////////////////////////////

Alkr.SET.waterDepthInit = function () {
  // putting water color over the player
  Sprite_Character.prototype.updateHalfBodySprites = function() {
    if (this._bushDepth > 0) {
      this.createHalfBodySprites();
      this._upperBody.bitmap = this.bitmap;
      this._upperBody.visible = true;
      this._upperBody.y = - this._bushDepth;
      this._lowerBody.bitmap = this.bitmap;
      this._lowerBody.visible = true;
      this._lowerBody.opacity = (255 - (96 + ( ( ($gamePlayer.regionId() - 225) * 8) *
    ($gamePlayer.regionId() - 225) ) ) );
/*      this._upperBody.setBlendColor(this.getBlendColor());
      this._lowerBody.setBlendColor([100,150,236,64]);
      this._upperBody.setColorTone(this.getColorTone());
      this._lowerBody.setColorTone([50,75,118,0]);
      this._lowerBody.blendMode = this.blendMode;   */
    } else if (this._upperBody) {
      this._upperBody.visible = false;
      this._lowerBody.visible = false;
    }
  };
  Game_CharacterBase.prototype.refreshBushDepth = function() {
    this._bushDepth = $gameVariables.value(6);
  };
  // bush region check
  Game_Map.prototype.isBush = function(x, y) {
      return (this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x40)) ||
      (this.isValid(x, y) && this.regionId(x, y) > 225 && this.regionId(x, y) < 230);
  };
};


//========   9.   W A T E R   D E P T H   R U N N I N G   ====================
// changes water depth (different than the default 32 pixels) ////////////////
// regionIds 226 - 229 used in water/bush depth in this plugin

Alkr.SET.waterDepthRun = function () {
  // setting waterDepthDest
  if (($gamePlayer.regionId() === 226) && ($gameVariables.value(5) != 12)) {
    $gameVariables.setValue(5, 12);
  } else if (($gamePlayer.regionId() === 227) && ($gameVariables.value(5) != 24)) {
    $gameVariables.setValue(5, 24);
  } else if (($gamePlayer.regionId() === 228) && ($gameVariables.value(5) != 60)) {
    $gameVariables.setValue(5, 60);
  } else if (($gamePlayer.regionId() === 229) && ($gameVariables.value(5) != 96)) {
    $gameVariables.setValue(5, 96);
  }

  // if waterDepthCrnt < waterDepthDest
  if ($gameVariables.value(6) < $gameVariables.value(5)) {
    $gameVariables.setValue(6, ($gameVariables.value(6) + 4));

    // else if waterDepthCrnt > waterDepthDest
  } else if ($gameVariables.value(6) > $gameVariables.value(5)) {
    $gameVariables.setValue(6, ($gameVariables.value(6) - 4));
  }

  $gamePlayer.refreshBushDepth();
};


//=======   10.   W A T E R   D E P T H   R E S E T T I N G   =================
// resets the water/bush depth back to 32 pixels //////////////////////////////

Alkr.SET.waterDepthReset = function () {

    // changing water/bush depth back to 32
    Game_CharacterBase.prototype.refreshBushDepth = function() {
      if (this.isNormalPriority() && !this.isObjectCharacter() &&
        this.isOnBush() && !this.isJumping()) {
        if (!this.isMoving()) {
          this._bushDepth = 32;
        }
      } else {
        this._bushDepth = 0;
      }
    };

    // taking water color off player
    Sprite_Character.prototype.updateHalfBodySprites = function() {
      if (this._bushDepth > 0) {
        this.createHalfBodySprites();
        this._upperBody.bitmap = this.bitmap;
        this._upperBody.visible = true;
        this._upperBody.y = - this._bushDepth;
        this._lowerBody.bitmap = this.bitmap;
        this._lowerBody.visible = true;
        this._lowerBody.opacity = 64;  // Setting transparency back to default
        this._upperBody.setBlendColor(this.getBlendColor());
        this._lowerBody.setBlendColor(this.getBlendColor());
        this._upperBody.setColorTone(this.getColorTone());
        this._lowerBody.setColorTone(this.getBlendColor());
        this._lowerBody.blendMode = this.blendMode;
      } else if (this._upperBody) {
        this._upperBody.visible = false;
        this._lowerBody.visible = false;
      }
    };

    // defaulting region check
    Game_Map.prototype.isBush = function(x, y) {
        return (this.isValid(x, y) && this.checkLayeredTilesFlags(x, y, 0x40)) ||
        (this.isValid(x, y) && this.regionId(x, y) === 225);
    };

    $gameVariables.setValue(5, 0);
    $gameVariables.setValue(6, 0);
};


// 11. Continual Settings //////////////////////////////////////////////////////

/*
Alkr.SET.contSettings = function() {

};
*/


// ALL DONE ///////////////////////////////////////////////////////////////////

})();
