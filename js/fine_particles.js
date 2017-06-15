var c = document.querySelector('canvas'),
    ctx = c.getContext('2d'),
    screenWidth = 0,
    screenHeight = 0,
    particleCount = 10,
		particleRadius = 1,
    averageSpeed = 4,
    friction = 1.0,
    colorChangeSpeed = 0.04,
    backgroundColor = "rgba(0, 0, 0, 1.0)",
    startingColor = {
      r: 100,
      g: 100,
      b: 100
    },
    selectedColor = {
      r: 255,
      g: 255,
      b: 255
    },
    particles = [];

var mouseDown = false,
    mouseX = 0,
    mouseY = 0;

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame       ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           window.oRequestAnimationFrame      ||
           window.msRequestAnimationFrame     ||
           function (callback) {
               window.setTimeout(callback, 1000/60);
           };
})();

// function distance (x1, y1, x2, y2) {
//     return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
// }

function Particle (x, y) {
    this.x = x;
    this.y = y;
    this.dx = (Math.random()*averageSpeed)-(averageSpeed/2);
    this.dy = (Math.random()*averageSpeed)-(averageSpeed/2);
    this.color = {
      r: startingColor.r,
      g: startingColor.g,
      b: startingColor.b
    };
    this.targetColor = {
      r: selectedColor.r,
      g: selectedColor.g,
      b: selectedColor.b
    };
    this.radius = particleRadius;
}

Particle.prototype.draw = function () {
  ctx.save();
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
  ctx.fillStyle = 'rgba('+Math.round(this.color.r)+','+Math.round(this.color.g)+','+Math.round(this.color.b)+',1.0)';
  ctx.fill();
  ctx.restore();
};

(function() {

  var Controls = function () {

    this.reset = function () {
      console.log("Reset!");
      particles = [];
    }

  };

  function init () {
    // GUI
    controls = new Controls();
    var gui = new dat.GUI();
    gui.add(controls, "reset").name("Reset");
  }

  function resize () {
    screenWidth = c.width = window.innerWidth;
    screenHeight = c.height = window.innerHeight;
    init();
  }

  function draw () {
    ctx.save();
    ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, screenWidth, screenHeight);

    update();

    for (var i = 0, len = particles.length ; i < len ; i++) {
      particles[i].draw();
    }

    window.requestAnimFrame(draw);

  }

  function update () {

    if (mouseDown) {
      var particle = new Particle(mouseX, mouseY);
      particles.push(particle);
    }

    var particle1, particle2, i, j, len, min_distance, overlap, possible_x_bounds, possible_y_bounds, min_x, max_x, min_y, max_y;

    for (i = 0, len = particles.length; i < len ; i++) {
      particle1 = particles[i];

      // Collision detection with other particles:
      for (j = 0 ; j < len ; j++) {
        particle2 = particles[j];
        min_distance = particle1.radius + particle2.radius;
        if (particle1 !== particle2 && Math.abs(particle2.x - particle1.x) < min_distance && Math.abs(particle2.y - particle1.y) < min_distance) {
          possible_x_bounds = [particle1.x-particle1.radius, particle1.x+particle1.radius, particle2.x-particle2.radius, particle2.x+particle2.radius];
          min_x = Math.min(...possible_x_bounds);
          max_x = Math.max(...possible_x_bounds);
          possible_y_bounds = [particle1.y-particle1.radius, particle1.y+particle1.radius, particle2.y-particle2.radius, particle2.y+particle2.radius];
          min_y = Math.min(...possible_y_bounds);
          max_y = Math.max(...possible_y_bounds);
          overlap = {
            x: ( (max_x-min_x) / min_distance ) * 0.1,
            y: ( (max_y-min_y) / min_distance ) * 0.1
          };
          if (particle1.x < particle2.x ) overlap.x = -overlap.x;
					if (particle1.y < particle2.y ) overlap.y = -overlap.y;
          particle1.dx += overlap.x;
          particle1.dy += overlap.y;

          particle1.targetColor = particle2.targetColor;
        }
      }

      particle1.dx *= friction;
      particle1.dy *= friction;

      particle1.x += particle1.dx;
      particle1.y += particle1.dy;

      // Collision detection with the walls:
      if (particle1.x < particle1.radius || particle1.x+particle1.radius > screenWidth) {
        particle1.dx = -particle1.dx;
      }
      if (particle1.y < particle1.radius || particle1.y+particle1.radius > screenHeight) {
        particle1.dy = -particle1.dy;
      }
      particle1.x = Math.min( Math.max( particle1.x, particle1.radius ), 0 + screenWidth - particle1.radius );
			particle1.y = Math.min( Math.max( particle1.y, particle1.radius ), 0 + screenHeight - particle1.radius );

      // Color changing
      particle1.color.r += ( particle1.targetColor.r - particle1.color.r ) * colorChangeSpeed;
			particle1.color.g += ( particle1.targetColor.g - particle1.color.g ) * colorChangeSpeed;
			particle1.color.b += ( particle1.targetColor.b - particle1.color.b ) * colorChangeSpeed;
    }
  }

  // Event handlers:

  function handleClick (event) {
    // var particle = new Particle(event.clientX, event.clientY);
    // particles.push(particle);

    mouseDown = true;
  }
  function handleMove (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
  function handleUp (event) {
    mouseDown = false;
  }

  window.addEventListener("resize", resize);

  c.addEventListener("mousedown", handleClick, false);
  c.addEventListener("mousemove", handleMove, false);
  c.addEventListener("mouseup", handleUp, false);

  resize();
  draw();

})();
