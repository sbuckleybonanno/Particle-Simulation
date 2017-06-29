var c = document.querySelector('canvas'),
    ctx = c.getContext('2d'),
    screenWidth = 0,
    screenHeight = 0,
    particleCount = 0,
		particleRadius = 10,
    averageSpeed = 4,
    friction = 0.9,
    colorChangeSpeed = 0.04,
    backgroundColor = "rgba(0, 0, 0, 0.1)",
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
    appearance = "particles",
    voronoi = new Voronoi(),
    fenetre = {xl: 0, xr: window.innerWidth, yt: 0, yb: window.innerHeight}
    diagram = null,
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
  var rgb;
  rgb = Math.round(this.color.r)+','+Math.round(this.color.g)+','+Math.round(this.color.b);
  ctx.save();
  ctx.beginPath();
  if (appearance === "particles") {
    ctx.fillStyle = 'rgba('+rgb+',1.0)';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
  }
  else if (appearance === "glass") {
    ctx.fillStyle = 'rgba('+rgb+',0.1)';
    // ctx.arc(this.x, this.y, this.radius*2, 0, Math.PI * 2, false);
    ctx.fillRect(this.x-(this.radius*2), this.y-(this.radius*2), this.radius*4, this.radius*4);
  }
  // else if (appearance === "hazy") {
  //   var grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius*4);
  //   grd.addColorStop(0, 'rgba('+rgb+',1.0)');
  //   grd.addColorStop(1, 'rgba('+rgb+',0)');
  //   ctx.arc(this.x, this.y, this.radius*4, 0, Math.PI * 2, false);
  //   ctx.fillStyle = grd;
  // }

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
    };
    this.removeParticles = function () {
      var n = particles.length * 0.2;
      for (i = 0 ; i < n ; i++) {
        particles.pop();
      }
    };
    this.particlesAppearance = function () {
      appearance = "particles";
    };
    this.mosaicAppearance = function () {
      appearance = "glass";
    };
    this.geometricAppearance = function () {
      appearance = "geometric";
    }

  // this.speed = 0.5;
  // this.particles = particles.length;
  };

  var controls, gui, n, i, particle;

  function initGUI () {
    controls = new Controls();
    gui = new dat.GUI();
    var qualitiesFolder = gui.addFolder("Qualities");
    qualitiesFolder.add(controls, "radius", 0.1, 30).name("Radius").onFinishChange(function () {
      particleRadius = controls.radius;
    });
    qualitiesFolder.add(controls, "friction", -0.1, 1.0).name("Viscosity").onChange(function () {
      friction = 1.0 - controls.friction;
    });
    qualitiesFolder.addColor(controls, "selectedColor").name("Color").onFinishChange(function () {
      selectedColor.r = controls.selectedColor[0];
      selectedColor.g = controls.selectedColor[1];
      selectedColor.b = controls.selectedColor[2];
    });

    var quantitiesFolder = gui.addFolder("Quantities");
    quantitiesFolder.add(controls, "addParticles").name("Add");
    quantitiesFolder.add(controls, "removeParticles").name("Remove");
    quantitiesFolder.add(controls, "reset").name("Reset");

    var appearanceFolder = gui.addFolder("Appearance");
    appearanceFolder.add(controls, "particlesAppearance").name("Particles");
    appearanceFolder.add(controls, "mosaicAppearance").name("Mosaic");
    appearanceFolder.add(controls, "geometricAppearance").name("Geometric");
  }

  //   var info = gui.addFolder("Info");
  //   // info.add(controls, "speed").name("Average Speed").listen();
  //   info.add(controls, "particles").name("Particles").listen();
  // }

  function resize () {
    screenWidth = c.width = window.innerWidth;
    screenHeight = c.height = window.innerHeight;
    fenetre = {xl: 0, xr: window.innerWidth, yt: 0, yb: window.innerHeight}
  }

  function draw () {
    ctx.save();
    ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.restore();

    update();

    if (appearance === "geometric") {
      // voronoi
      voronoi.recycle(diagram);
      diagram = voronoi.compute(particles, fenetre);
  		if (!this.diagram) {return;}

      ctx.save();
      //cells
      if (diagram.cells.length === 1) {
        var particle = particles[0];
        ctx.fillStyle = 'rgba('+Math.round(particle.color.r)+','+Math.round(particle.color.g)+','+Math.round(particle.color.b)+',0.3)';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
      }

      for (var i = 0 ; i < diagram.cells.length ; i++) {
        var cell = diagram.cells[i];
        var halfedges = cell.halfedges,
  				nHalfedges = halfedges.length;
  			if (nHalfedges > 2) {
  				v = halfedges[0].getStartpoint();
  				ctx.beginPath();
  				ctx.moveTo(v.x,v.y);
  				for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
  					v = halfedges[iHalfedge].getEndpoint();
  					ctx.lineTo(v.x,v.y);
  					}
          ctx.closePath();
  				ctx.fillStyle = 'rgba('+Math.round(cell.site.color.r)+','+Math.round(cell.site.color.g)+','+Math.round(cell.site.color.b)+',0.3)';
  				ctx.fill();
  			}
      }

      // edges
  		ctx.strokeStyle = 'rgb(0, 0, 0)';
      // ctx.lineWidth = 0.2;
  		var edges = this.diagram.edges,
  			iEdge = edges.length,
  			edge, v, rStrokeStyle, gStockStyle, bStockStyle;
  		while (iEdge--) {
        ctx.beginPath();
  			edge = edges[iEdge];
  			v = edge.va;
  			ctx.moveTo(v.x,v.y);
  			v = edge.vb;
  			ctx.lineTo(v.x,v.y);
        // rStrokeStyle = edge.lSite.color.r;
        // gStrokeStyle = edge.lSite.color.g;
        // bStrokeStyle = edge.lSite.color.b;
        // if (edge.rSite) {
        //   rStrokeStyle = (rStrokeStyle+edge.rSite.color.r)/2;
        //   gStrokeStyle = (gStrokeStyle+edge.rSite.color.g)/2;
        //   bStrokeStyle = (bStrokeStyle+edge.rSite.color.b)/2;
        // }
        // ctx.strokeStyle = 'rgb('+Math.round(rStrokeStyle)+','+Math.round(gStrokeStyle)+','+Math.round(bStrokeStyle)+')';
        ctx.stroke();
  		}
      ctx.restore();
    }
    else {
      for (var i = 0, len = particles.length ; i < len ; i++) {
        particles[i].draw();
      }
    }

    window.requestAnimFrame(draw);

  }

  function update () {

    if (mouseDown) {
      particle = new Particle(mouseX, mouseY);
      particles.push(particle);
      controls.particleCount++;
    }

    var particle1, particle2, i, j, len, min_distance, overlap, possible_x_bounds, possible_y_bounds, min_x, max_x, min_y, max_y; // , speed;

    for (i = 0, len = particles.length; i < len ; i++) {
      particle1 = particles[i];

      for (j = 0 ; j < len ; j++) {
        particle2 = particles[j];

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

    // speed = 0;
    // for (i = 0, len = particles.length; i < len ; i++) {
    //   particle1 = particles[i];
    //   speed += Math.sqrt(particle1.dx*particle1.dx + particle1.dy*particle1.dy);
    // }
    // if (particles.length > 0) {
    //   controls.speed = speed/particles.length;
    // }
    // else {
    //   controls.speed = 0;
    // }
    //
    // controls.particles = particles.length;
  }

  // Event handlers:

  function handleClick (event) {
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
