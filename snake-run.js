// Load snake lib/commons/helpers
var S = require('./snake-lib.js');

// To change default map size, use
// > require('./snake-lib.js').resizeMap(<width>, <height>)
// to load the snake lib.

// Index helper
var idxAt = S.idxAt,

  // Turn helper
  turnTo = S.turnTo,

  // Constants
  DPAD = S.DPAD,
  MAPOBJ = S.MAPOBJ
  MAP_W = S.MAP_W,
  MAP_H = S.MAP_H,
  MAP_SIZE = S.MAP_SIZE;


// Game map
var Map;

// Positions of the Snake head/tail on the game map (idx)
var Head, Tail;

// Custom gameplay renderer (optional)
var displayRenderer = null;

// Custom input source (optional)
var inputConnector = null;



var requestAnimationFrame, cancelAnimationFrame;

// This should fail if "window" is not in scope
try {
  requestAnimationFrame = window.requestAnimationFrame;
  cancelAnimationFrame = window.cancelAnimationFrame;
}
catch (e) {
  console.log('Polyfilling DOM requestAnimationFrame: ',e);

  // Request Animation Frame polyfill for non-dom-based JS stacks (like node, tessel)
  // Uses process.hrtime & setTimeout
  requestAnimationFrame = (function() {
    // Simulate DOMHighResTimestamp
    // | The DOMHighResTimeStamp type is a double representing a number of milliseconds,
    // | accurate to the thousandth of millisecond, that is with a precision of 1 µs.
    function DOMHighResTimestamp() {
      // TODO: Check for process.hrtime's existence, make a fallback
      var t = process.hrtime();

      // Convert from [sec,nanosec] -> <double> microsec
      // return (t[0] * 1e3) + (t[1] / 1e3 | 0) / 1e6;
      // the above might be too pedantic, this should be more or less the same:
      return (t[0] * 1e3) + (t[1] / 1e6);
    }

    // Make sure we don't call this more than 60 times per second
    var raf = function(callback) {
      return setTimeout(function() {
        callback(DOMHighResTimestamp());
      }, 17);
    }

    // Polyfill cancelAnimationFrame
    raf._cancel = function(id) {
      clearTimeout(id);
    }

    return raf;
  })();

  // Add support for cancelling an animation frame request
  cancelAnimationFrame = requestAnimationFrame._cancel;
}


function init() {
}


/* Start the game
 *
 * SETTINGS:
 *
 * Game map width/height
 * Maze declarator
 * Snake start index & dir
 *
 * TODO: scrollable game map - remove renderer limitation by centering
 *       game viewport map around snake, scrolling as required.
 *
 *       Tip: Giant multiplayer mazes w/ lots of snakes!
 *
 */
function start(settings) {
  // TODO: handle settings (speed, bonuses, mazes)

  // Create new empty game map
  Map = new Array(MAP_SIZE);

  // Make sure map is fully empty
  for (var i=0;i<MAP_SIZE;++i) Map[i] = MAPOBJ.EMPTY;

  // Position snake on the center of the game map
  Head = MAP_W*(MAP_H >> 1) + (MAP_W >> 1);

  // Snake starts left-facing with an inital length of 5 blocks
  // extending to the right
  var i=0;
  while (i<5) {
    // Add left-facing snake bodypart
    Map[Head + i] = MAPOBJ.SNAKE_L;
    ++i;
  }

  // Note snake tail position
  Tail = Head + i - 1;

  // Place the first food
  placeItem(MAPOBJ.FOOD);

  // Run, Forest, run!
  requestAnimationFrame(run);
}


/* Run the friggin game!
 */
var lastTick;
var UPDATE_SPEED = 500;
function run(ts) {
  var gameOver = false;
  if (!lastTick) lastTick = ts-UPDATE_SPEED;

  if (ts >= lastTick+UPDATE_SPEED) {
    // TODO: Process input (e.g place bonuses, etc)
    input();

    // TODO: Update map

    // TODO: Update snake
    gameOver = move();

    // TODO: Update display
    display();

    lastTick += UPDATE_SPEED;
  }

  if (!gameOver) requestAnimationFrame(run);
}

/* Move snake in its usual one-block-per-tick pace across the Map
 */
function move() {
  var next = idxAt(Head, Map[Head]);
  var dir;


  // Headed straight into a wall - game over :(
  if (Map[next] === MAPOBJ.WALL) {
    console.log('Game Over!\nCrashed into a wall :(');
    return 'GAME_OVER';
  }


  // Start with the tail, save direction
  dir = Map[Tail];

  // If snake eats, grow (do not remove tail)
  if (Map[next] >= MAPOBJ.FOOD) {
    // TODO: bonus handling

    // Plant new food item on the map
    placeItem(MAPOBJ.FOOD);

  // No grow, move tail
  } else {
    // Just remove the tail & wiggle away!
    Map[Tail] = MAPOBJ.EMPTY;

    // New tail is where tail direction is taking him
    Tail = idxAt(Tail, dir);
  }


  // The snake shouldn't crash into its tail - now that
  // we have moved the tail, check self-collisions
  if (Map[next] & 15) { // SNAKE_L|SNAKE_R|SNAKE_U|SNAKE_D
    console.log('Game Over!\nBitten self :(');
    return 'GAME_OVER';
  }


  // Okay let's move the head now

  // Currently headed this way
  dir = Map[Head];

  // Current head body slice stays put, we basically "clone" it
  // into the next block based on moving direction

  // Move and put body slice into new location
  Map[(Head = next)] = dir;

  // No game over (yet! :D)
  return false;
}

/* Place Item randomly on the gameplay map
 */
function placeItem(itemType) {
  switch (itemType) {
    case MAPOBJ.FOOD:
      // Initial random location
      var idx = Math.floor(MAP_SIZE*Math.random());

      // Find an empty block
      // be sure to avoid inf. loop and bail map is full
      var i = 0;
      while (i <= MAP_SIZE) {

        // Place item on the empty block
        if ( Map[(idx + i) % MAP_SIZE] === MAPOBJ.EMPTY ) {
          Map[(idx + i) % MAP_SIZE] = itemType;
          console.log('New food placed on map: ',((idx+i)%MAP_SIZE));
          break;
        }

        ++i;
      }

      break;
  }
}

/** Display game area
 *
 *  Callback receives the game area data as an object
 *  The object looks like:
 *  {
 *    width:  <width-of-game-area-in-blocks>,
 *    height: <height-of-game-area-in-blocks>,
 *    map:    <array-of-integers>
 *  }
 *
 *  Map contains integers, the mapping of which is:
 *  0        - empty block
 *  1/3/4/12 - snake body
 *  16       - food (non-disappearing)
 *  17..31   - bonus (disappears after a while)
 *  32       - wall (for creating mazes)
 */
function display() {
  (displayRenderer||defaultDisplay)(Map, MAP_W, MAP_H, Head, Tail);

  /*DEBUG: show default output too*/
  // if (displayRenderer) {
  //   console.log("Default console output:");
  //   defaultDisplay(Map, MAP_W, MAP_H, Head, Tail);
  // }
}

/** Change the game render engine/output
 *
 */
function setDisplay(callback) {
  displayRenderer = callback;
}

/** Default display callback
 *
 * The default display callback simply logs the game map as ASCII
 * character output onto the console.
 */
function defaultDisplay(Map, w,h, headIdx,tailIdx) {
  console.log(
    Map
      .map(function(e, idx) {
        switch (e) {
          case MAPOBJ.SNAKE_L:
          case MAPOBJ.SNAKE_R:
          case MAPOBJ.SNAKE_D:
          case MAPOBJ.SNAKE_U:

            // Snake head
            if (idx === headIdx) {
              // Show direction
              if (e === MAPOBJ.SNAKE_L) e = '<';
              if (e === MAPOBJ.SNAKE_R) e = '>';
              if (e === MAPOBJ.SNAKE_U) e = 'A';
              if (e === MAPOBJ.SNAKE_D) e = 'V';

            // Snake tail
            } else if (idx === tailIdx) {
              e = '¤';

            // Snake body
            } else {
              e = '¤';

            }

            break;

          case MAPOBJ.FOOD:
            e = '@'; break;

          case MAPOBJ.BONUS_FRUIT:
          case MAPOBJ.BONUS_MOUSE:
            e = '&'; break;

          case MAPOBJ.WALL:
            e = '#'; break;

          case MAPOBJ.EMPTY:
          default:
            e = '.'; break;
        }

        return e + ( idx % w === (w - 1) ? '\n' : '' );
      })
      .join('')
  );
}

/** Get current input status ("D-pad direction")
 *
 *  At the start of every tick, the input status is polled by
 *  calling the callback supplied.
 *
 *  Callback should return a single positive integer, encoded as:
 *  0b0000UDRL
 *
 *  That effectively means, eg:
 *  Up + Left: 0b00001101 = 13
 *  Down only: 0b00000100 = 4
 *
 *  While also making:
 *  xdiff = (D & 0b00000011) - 2
 *  ydiff = ((D >> 2) & 0b00000011) - 2 (×23, of course)
 *    &
 *  true.
 */
function input() {
  (inputConnector||defaultInput)(Map, MAP_W, MAP_H, Head, Tail);
}

/** Default input connector
 *
 *  A very basic "AI" input, that randomly wiggles the snake across the Map
 */
function defaultInput(Map, w,h, headIdx,tailIdx) {
  // TODO: Enhance

  // Dumb: stay, turn left or turn right
  var dir = Map[headIdx];
  var whatToDo = (Math.random() * 10)|0;
  var turn = whatToDo < 2 ? -1 : (whatToDo > 7 ? 1 : 0);

  dir = turnTo(turn, dir);

  // Slightly less dumb - dont turn & crash into self
  // If the new direction would lead into self, do not turn
  // 15 === (SNAKE_L|SNAKE_R|SNAKE_U|SNAKE_D)
  if (Map[ idxAt(headIdx, dir) ] & 15) {

    // Revert to original direction before turn
    dir = Map[headIdx];
  }

  // A wee bit smarter - deliberately try & avoid crashing into self/wall
  // 47 === (SNAKE_L|SNAKE_R|SNAKE_U|SNAKE_D|WALL)
  if (Map[ idxAt(headIdx, dir) ] & 47) {
    whatToDo = Math.random() < 0.5 ? -1 : 1;

    // Look turning into one direction
    dir = turnTo(whatToDo, Map[headIdx]);

    // If we are not better of there
    if (Map[ idxAt(headIdx, dir) ] & 47) {

      // ...look in the other direction
      dir = turnTo(-whatToDo, Map[headIdx]);

      // ...if that doesn't work, either - well, at least we tried!
      if (Map[ idxAt(headIdx, dir) ] & 47) {
        dir = Map[headIdx];
        // we are screwed either way :(
      }
    }
  }

  Map[Head] = dir;
}

/** Set input connector
 */
function setInput(callback) {
  inputConnector = callback;
}

module.exports = {
  start: start,

  display: display,
  setDisplay: setDisplay,

  input: input,


}
