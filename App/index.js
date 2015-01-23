var w = window.innerWidth;
var h = window.innerHeight;

var canvas = document.getElementById('canvas');
canvas.width = w;
canvas.height = h;

var ctx = canvas.getContext('2d');

var randomColor = function() { return '#'+(Math.random()*0xFFFFFF<<0).toString(16); }

var scene, loopId;
var scenes = {};
var cr = w/6,
    cx = w/2,
    cy = h/2;

var mouseInCircle = function(mouseX, mouseY, circleX, circleY, radius){
  var dx = mouseX - circleX;
  var dy = mouseY - circleY;

  return (dx*dx + dy*dy <= radius * radius)
}

scenes.start = {
  startCircles: function( event ) {
    touchX = event.clientX || event.targetTouches[0].clientX;
    touchY = event.clientY || event.targetTouches[0].clientY;
    if (mouseInCircle(touchX, touchY, cx, cy, cr)){
      changeScene('circles');
    }
  },
  setup: function() {
    ctx.fillStyle = '#ffffff';
    console.log('in start scene!');
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, 2*Math.PI, true);
    ctx.fill();
    ctx.stroke();
    canvas.addEventListener( 'touchstart', this.startCircles, false );
    canvas.addEventListener( 'click', this.startCircles, false );
  },
  loop: function() {
    //console.log(Date.now());
  },
  cleanup: function() {
    console.log('exiting start');
    document.removeEventListener( 'touchstart', this.startCirles );
  }
}

scenes.circles = {
  drawCircles: function( event ) {
    for (var i = 0; i < event.touches.length; i++) {
      var touch = event.touches[i];
      ctx.beginPath();
      ctx.arc(touch.pageX, touch.pageY, 20, 0, 2*Math.PI, true);
      ctx.fill();
      ctx.stroke();
    }
  },
  changeFill: function( event ){
    ctx.fillStyle = randomColor();
  },
  setup: function() {
    ctx.fillStyle = '#000000';
    ctx.fillRect( 0, 0, w, h );

    ctx.globalAlpha = 0.05;
    ctx.lineWidth = 2;
    document.addEventListener( 'touchstart', this.changeFill, false );
    document.addEventListener( 'touchmove', this.drawCircles, false );
  },
  loop: function() {
  },
  cleanup: function() {
    document.removeEventListener( 'touchstart', this.changeFill );
    document.removeEventListener( 'touchmove', this.drawCircles );
  }
}

var changeScene = function(newscene){
  if(scene) { scene.cleanup() }
  if(loopId) { clearInterval(loopId) }

  scene = scenes[newscene];
  scene.setup();
  loopId = setInterval(scene.loop, 1000/60);
}

changeScene("start");
