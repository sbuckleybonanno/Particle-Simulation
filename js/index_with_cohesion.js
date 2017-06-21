var c = document.querySelector('canvas'),
    ctx = c.getContext('2d'),
    screenWidth = 0,
    screenHeight = 0,
    particleCount = 0,
		particleRadius = 10,
    averageSpeed = 4,
    friction = 0.9,
    cohesion = 0.0,
    cohesionMinDistance = 100,
    colorChangeSpeed = 0.04,
    backgroundColor = "rgba(0, 0, 0, 0.2)",
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
  // var grd;
  ctx.save();
  // grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
  // grd.addColorStop(1, 'rgba('+Math.round(this.color.r)+','+Math.round(this.color.g)+','+Math.round(this.color.b)+',1.0)');
  // grd.addColorStop(0, "rgba(0, 0, 0, 0)");
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
  ctx.fillStyle = 'rgba('+Math.round(this.color.r)+','+Math.round(this.color.g)+','+Math.round(this.color.b)+',1.0)';
  // ctx.fillStyle = grd;
  ctx.fill();
  ctx.restore();
};

(function() {

  var Controls = function () {
    this.reset = function () {
      particles = [];
    }
    this.selectedColor = [255, 255, 255];
    this.friction = 1.0-friction;
    this.cohesion = 0.5;
    this.radius = particleRadius;
    this.particleCount = 0;
    this.addParticles = function () {
      var n = particles.length * 0.2;
      if (n == 0) {
        particle = new Particle(Math.random()*screenWidth, Math.random()*screenHeight);
        particles.push(particle);
      }
      else {
        for (var i = 0 ; i < n ; i++) {
          particle = new Particle(Math.random()*screenWidth, Math.random()*screenHeight);
          particles.push(particle);
        }
      }
    }
    this.removeParticles = function () {
      var n = particles.length * 0.2;
      for (i = 0 ; i < n ; i++) {
        particles.pop();
      }
    }
  };

  var controls, gui, n, i, particle;

  function initGUI () {
    controls = new Controls();
    gui = new dat.GUI();
    var qualities = gui.addFolder("Qualities");
    qualities.add(controls, "radius", 0.1, 30).name("Radius").onFinishChange(function () {
      particleRadius = controls.radius;
    });
    qualities.add(controls, "friction", -0.1, 1.0).name("Viscosity").onChange(function () {
      friction = 1.0 - controls.friction;
    });
    qualities.add(controls, "cohesion", -10, 10).name("Cohesion").listen().onChange(function () {
      cohesion = controls.cohesion * 0.1;
    });
    qualities.addColor(controls, "selectedColor").name("Color").onFinishChange(function () {
      selectedColor.r = controls.selectedColor[0];
      selectedColor.g = controls.selectedColor[1];
      selectedColor.b = controls.selectedColor[2];
    });
    controls.cohesion = 0.0;
    var quantities = gui.addFolder("Quantities");
    quantities.add(controls, "addParticles").name("Add");
    quantities.add(controls, "removeParticles").name("Remove");
    quantities.add(controls, "reset").name("Reset");

  }

  function resize () {
    screenWidth = c.width = window.innerWidth;
    screenHeight = c.height = window.innerHeight;
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
      particle = new Particle(mouseX, mouseY);
      particles.push(particle);
      controls.particleCount++;
    }

    var particle1, particle2, i, j, len, min_distance, overlap, possible_x_bounds, possible_y_bounds, min_x, max_x, min_y, max_y, x_coh, y_coh, diagonal;

    for (i = 0, len = particles.length; i < len ; i++) {
      particle1 = particles[i];

      for (j = 0 ; j < len ; j++) {
        particle2 = particles[j];

        // Cohesion:

        x_coh = particle1.x - particle2.x;
        y_coh = particle1.y - particle2.y;
        // normalize
        if (x_coh !== 0 && y_coh !== 0) {
          diagonal = Math.sqrt(x_coh*x_coh + y_coh*y_coh);
          if (diagonal < cohesionMinDistance) {
            x_coh /= (diagonal*diagonal);
            // x_coh = 1.0 / (diagonal*diagonal)
            y_coh /= (diagonal*diagonal);
            // scale
            x_coh *= cohesion; // For now I'm saying that every particle possesses equal attraction. The alternative is for attraction to be based on radius, similar to gravity.
            y_coh *= cohesion;
            particle1.dx += -x_coh;
            particle1.dy += -y_coh;
          }
        }

        // Collision detection with other particles:

        min_distance = (particle1.radius + particle2.radius) // * 0.8; // The 0.8 is to reduce the hitbox square to be smaller than the rendered circle image, so that circles that don't visually touch don't reflect off of invisible hitboxes.
        if (particle1 !== particle2 && Math.abs(particle2.x - particle1.x) < min_distance && Math.abs(particle2.y - particle1.y) < min_distance) {
          possible_x_bounds = [particle1.x-particle1.radius, particle1.x+particle1.radius, particle2.x-particle2.radius, particle2.x+particle2.radius];
          min_x = Math.min(...possible_x_bounds);
          max_x = Math.max(...possible_x_bounds);
          possible_y_bounds = [particle1.y-particle1.radius, particle1.y+particle1.radius, particle2.y-particle2.radius, particle2.y+particle2.radius];
          min_y = Math.min(...possible_y_bounds);
          max_y = Math.max(...possible_y_bounds);
          overlap = {
            x: ( (max_x-min_x) / min_distance ) * 0.1,
            y: ( (max_y-min_y) / min_distance ) * 0.1 // Comment out one of these 0.1's for a cool effect on one (or both) of the axes.
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

  function handleTouchStart(event) {
    event.preventDefault();
    mouseX = event.touches[0].pageX;
    mouseY = event.touches[0].pageY;
    mouseDown = true;
  }
  function handleTouchMove(event) {
    event.preventDefault();
    mouseX = event.touches[0].pageX;
    mouseY = event.touches[0].pageY;
  }
  function handleTouchEnd(event) {
    mouseDown = false;
  }

  window.addEventListener("resize", resize);

  c.addEventListener("mousedown", handleClick, false);
  c.addEventListener("mousemove", handleMove, false);
  c.addEventListener("mouseup", handleUp, false);

  c.addEventListener('touchstart', handleTouchStart, false);
  c.addEventListener('touchmove', handleTouchMove, false);
  c.addEventListener('touchend', handleTouchEnd, false);

  initGUI();
  resize();
  draw();

})();
