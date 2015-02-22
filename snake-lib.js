// Snake directions
var DPAD = {
  LEFT: 1,
  RIGHT: 3,
  DOWN: 4,
  UP: 12
};
exports.DPAD = DPAD;


// Game map "legend"
var MAPOBJ = {
  EMPTY: 0,

  SNAKE_L: DPAD.LEFT,
  SNAKE_R: DPAD.RIGHT,
  SNAKE_D: DPAD.DOWN,
  SNAKE_U: DPAD.UP,

  FOOD: 16,

  BONUS_FRUIT: 17,
  BONUS_MOUSE: 18,

  // Generic bonus type, for auto-random-selecting bonuses
  BONUS_GEN: 31,

  WALL: 32
};
exports.MAPOBJ = MAPOBJ;


// Default game map dimensions
var MAP_W = 23;
var MAP_H = 11;
var MAP_SIZE = MAP_W * MAP_H;

/* Change map default dimensions
 */
exports.resizeMap = function (w,h) {
  exports.MAP_W = MAP_W;
  exports.MAP_H = MAP_H;
  exports.MAP_SIZE = MAP_SIZE;

  return exports;
}
exports.resizeMap(MAP_W,MAP_H);

/* Returns with the index of the block that's exactly one block
 * away from the block specified by <currentIdx> in a <dir> direction
 */
exports.idxAt = function (currentIdx, dir) {
  // Moving left, on left screen edge
  if (dir === DPAD.LEFT && currentIdx % MAP_W === 0) currentIdx += MAP_W;
  // Moving right, on right screen edge
  if (dir === DPAD.RIGHT && currentIdx % MAP_W === (MAP_W - 1)) currentIdx -= MAP_W;

  // Moving up, on top screen edge
  if (dir === DPAD.UP && currentIdx < MAP_W) currentIdx += MAP_H*MAP_W;
  // Moving down, on bottom screen edge
  if (dir === DPAD.DOWN && currentIdx >= (MAP_H - 1) * MAP_W) currentIdx -= MAP_H*MAP_W;

  // TODO: edge overflow handling

  return currentIdx
    + ((dir & 3) || 2) - 2
    + (((dir >> 2 & 3) || 2) - 2) * -MAP_W;
}

/* Determines what direction is the snake headed after turning right/left
 *
 * Turn should be a signed integer, denoting:
 * -1: turn left
 *  0: straight ahead
 * +1: turn right
 */
exports.turnTo = function (turn, dir) {
  switch (dir) {
    case DPAD.LEFT:
      dir = [DPAD.DOWN, dir, DPAD.UP][turn+1];
      break;

    case DPAD.RIGHT:
      dir = [DPAD.UP, dir, DPAD.DOWN][turn+1];
      break;

    case DPAD.UP:
      dir = [DPAD.LEFT, dir, DPAD.RIGHT][turn+1];
      break;

    case DPAD.DOWN:
      dir = [DPAD.RIGHT, dir, DPAD.LEFT][turn+1];
      break;
  }

  return dir;
}
