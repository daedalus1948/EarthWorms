// This is a very simple game inspired by the original snake game
// A random number of snakes follow your mouse cursor
// When the worms collide with the apple, they "eat" it and "grow" and a new apple is generated in turn
// The simple pathFinder algorithm (manhattan style) does not solve obstacles!
// The random snake body generator is based on a modified version of the same path finder algorithm (generates an array of neighbour squares)
// the code is a bit of a mess - consider refactoring some bits
// the draw functions repeats the draw code, make a drawObject() function aswell

function rndColor() {
  return "rgb("+rnd(0,255)+","+rnd(0,255)+","+rnd(0,255)+")";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // re-render the gameboard
  for (var object = 0;object<game.data["snakes"].length;object++) {
      for (var block=0;block<game.data["snakes"][object].data.length;block++) {
        ctx.beginPath();
        ctx.rect(game.data["snakes"][object].data[block][0],game.data["snakes"][object].data[block][1], game.data["snakes"][object].blocksize, game.data["snakes"][object].blocksize);
        ctx.fillStyle = game.data["snakes"][object].color;
        ctx.fill();
        ctx.closePath();
      }
  }
  ctx.beginPath();
  ctx.rect(game.data["apple"].data[0],game.data["apple"].data[1], game.data["apple"].blocksize, game.data["apple"].blocksize);
  ctx.fillStyle = game.data["apple"].color;
  ctx.fill();
  ctx.closePath();  
  }
// MDN network function - not mine - check legality
function rnd(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return (Math.floor(Math.random() * (max - min)) + min); //The maximum is exclusive and the minimum is inclusive
}

function mouseHandler(event) {
  var mouseX = Math.round(event.pageX/10)*10;
  var mouseY = Math.round(event.pageY/10)*10;
  //consider rewriting this function
  game.mouse = [mouseX, mouseY];
}

function gameLoop() {
  draw();
  game.play();
}

function Snake(data, color) {
  this.data = data;
  this.blocksize = 10;
  this.color = color;
  this.futurePath = [];
  this.directions = {39:["right",[10, 0]],
                37:["left",[-10, 0]], 
                40:["up",[0, 10]],
                38:["down",[0, -10]]
                };
  this.move = function (direction) {
    this.data.unshift(direction);
    this.data.pop(this.data[this.data.length-1]);
  };
  this.eat = function (apple) {
    this.data.push(apple.data);
  };
  this.aiMind = function (target) {
    //snake manhattan pathfinds target
    var path = this.pathFinder(this.data[0], target);
    // since the pathFinder generates a whole list of moves 
    // the snake uses only the first data entry to commit his next move
    this.move(path[0]);
  };
  this.pathFinder = function (orig, dest) {
    var orig = orig.slice(0); // create a shallow copy - DONT MODIFY this.data[0]/orig
    var path = [];
    if (orig[0] == dest[0] && orig[1] == dest[1]) {return [dest];} // exception handling - when the snake arrives at the destination, he stays there (important!) the pathFinder always returns at least one coordinate
    else { // normal manhattan like shortest random path to the destination
      while (orig[0] != dest[0] || orig[1] != dest[1]) {
        var rndIDX = rnd(0, orig.length);
        if (orig[rndIDX] < dest[rndIDX]) {
          orig[rndIDX] += 10;
          path.push([orig[0], orig[1]]);
        }
        else if (orig[rndIDX] > dest[rndIDX]) {
          orig[rndIDX] -= 10;
          path.push([orig[0], orig[1]]);
        }
      }
      return path; // returns a 2D array of coordinates - eg. [[x,y],[x,y],[x,y]]
    }
  };
}

var game = {
  mouse : [0,0],
  data : {"snakes":[], "apple": {data: [rnd(0,600/10)*10,rnd(0,600/10)*10], blocksize: 10, color: "black"}},
  genSnakeData: function (len) {
    var boundary = len*10;
    var head = [rnd(boundary,60-boundary)*10, rnd(boundary,60-boundary)*10];
    var body = [];
    while (body.length < len) {
      var rndIDX = rnd(0, head.length);
      var rndNMB = rnd(0,1);
      if (rndNMB) {head[rndIDX] += 10;}
      else {head[rndIDX] -= 10;}
      body.push([head[0], head[1]]);
    }
    return body;
  },
  spawnSnake: function (len,color) {
    newSnake = new Snake(this.genSnakeData(len), color);
    this.data["snakes"].push(newSnake);
    return newSnake;
  },
  spawnApple: function () {
    this.data["apple"].data = [rnd(0,canvas.width/10)*10,rnd(0,canvas.height/10)*10];
  },
  gameOver: function() {clearInterval(clock);}
  ,
  collisionDetection: function () {
    
    for (var i = 0;i <this.data["snakes"].length;i++){
      // javascript? really? are you kidding me? can't compare two arrays?
      if (this.data["snakes"][i].data[0][0] == this.data["apple"].data[0] && this.data["snakes"][i].data[0][1] == this.data["apple"].data[1]) {
        this.logic(this.data["snakes"][i],"apple-eaten");
      }
      if (this.data["snakes"][i].data[0][0] > canvas.width-1 || this.data["snakes"][i].data[0][0] < 0 || this.data["snakes"][i].data[0][1] > canvas.height-1 || this.data["snakes"][i].data[0][1] < 0) {
        this.logic(this.data["snakes"][i],"wall-collision");
      }
    }
  },
  logic: function (object, event_) {
    if (event_ == "apple-eaten") {
      object.eat(this.data["apple"]);
      this.spawnApple();
    }
    if (event_ == "wall-collision") {
      this.gameOver();
    }
  },
  init: function() {
    for (var r = 0;r<rnd(1,7);r++) {
      this.spawnSnake(5, rndColor());
    }
  },
  play: function() {
    this.collisionDetection();
    // for every snake in the game, initialize his AI which a) searches for the shortest manhattan path b) executes move towards the target
    // the target could either be the "game.mouse" (real mouse coords tracking) or the randomly generated apple - "game.data["apple"].data" 
    game.data["snakes"].forEach(function(snake){snake.aiMind(game.mouse);}); 
  }
};

//init
var canvas = document.querySelector('canvas');
canvas.height = 600;
canvas.width = 600;
var ctx = canvas.getContext('2d');
document.addEventListener("mousemove", mouseHandler, false);
var clock = setInterval(gameLoop, 30);
game.init();