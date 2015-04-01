'use strict';
var w = window.innerWidth
var h = window.innerHeight

var canvas = document.getElementById('canvas')
canvas.width = w
canvas.height = h
canvas.MSAAEnabled = true
canvas.MSAASamples = 4

var ctx = canvas.getContext('2d')

var _ = {
    randomColor: function() { return '#'+(Math.random()*0xFFFFFF<<0).toString(16) }
  , pointInCircle: function(pX, pY, cX, cY, r){
    var dx = pX - cX; var dy = pY - cY
    return (dx*dx + dy*dy <= r * r)
  }
  , randomColorWithAlpha: function() {
      return 'rgba('+Math.floor(Math.random()*255)
               + ','+Math.floor(Math.random()*255)
               + ','+Math.floor(Math.random()*255)
               + ','+Math.random()+')'
  }
  , drawCircle: function(circle) {
    ctx.fillStyle = circle.c
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, 2*Math.PI, true)
    ctx.fill()
  }
  , drawBox: function(box) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = box.c
    ctx.fillRect(box.x-box.r,box.y-box.r,2*box.r,2*box.r)
    ctx.fillStyle = oldStyle
  }
  , drawText: function(text) {
    var oldStyle = ctx.fillStyle
    ctx.fillStyle = text.style || "#FFFFFF"
    ctx.font = text.size || "40px" + " Verdana"
    var x = text.x || (w-ctx.measureText(text.text).width) / 2
    var y = text.y || (ctx.measureText(text.text).actualBoundingBoxAscent) * 2
    if(text.align == "bottom") y = h - y
    ctx.fillText(text.text, x, y)
    ctx.fillStyle = oldStyle
  }
}

var scenes = {}
var circles = []
var boxes = []
var texts = []
var scene = null
var touch_to_circle_map = {}
var move_circle = false
var handlers = {
  touchstart: null,
  touchmove: null,
  touchend: null
}

var accel
window.ondevicemotion = function(e) {
  accel.x = e.getAccelerationIncludingGravity.x
  accel.y = e.getAccelerationIncludingGravity.y
}

var loop = function() {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  circles.forEach(function(circle){
    if(circle.v){
      if(accel){
        circle.v.x += accel.x || 0
        circle.v.y += accel.y || 0
      }
      circle.x += circle.v.x
      circle.y += circle.v.y
      if(circle.x < 0 ) circle.x = 0
      if(circle.x > w) circle.x = w
      if(circle.y < 0 ) circle.y = 0
      if(circle.y > h) circle.y = h
    }
    _.drawCircle(circle)
  })

  boxes.forEach(function(box){
    _.drawBox(box)
  })

  texts.forEach(function(text){
    _.drawText(text)
  })

  if(scene != "start") {
    _.drawCircle(restart_circle)
    _.drawText(restart_text)
  }
}

// keep track of last timeout so we can stop it if we want to restart
var timeoutId = null

var restart_circle = {x: w, y: h, r: 80, c: "#a53154"}
var restart_text = {x: w-70, y: h-15, text: "restart", size: "20px"}
var restart = function(event) {
  var touchX = event.clientX || event.changedTouches[0].clientX
  var touchY = event.clientY || event.changedTouches[0].clientY
  if(_.pointInCircle(touchX, touchY, restart_circle.x, restart_circle.y, restart_circle.r)) {
    clearTimeout(timeoutId)
    timeoutId = null
    gotoScene("start")
  }
}

canvas.addEventListener("touchend", restart, false)

var gotoSceneSoon = function(newscene){
  clearTimeout(timeoutId)
  timeoutId = setTimeout(function(){ gotoScene(newscene) }, 2000)
}

var gotoScene = function (newscene) {
  var listeners = function(add){
    for(var name in handlers) {
      if (handlers.hasOwnProperty(name)){
        if(scenes[scene] && scenes[scene][name]){
          if(add)
            canvas.addEventListener(name, scenes[scene][name], false)
          else
            canvas.removeEventListener(name, scenes[scene][name], false)
        }
      }
    }
  }
  if(scene != newscene){
    listeners(false)
    scene = newscene
    circles = []
    texts = []
    boxes = []
    scenes[scene].setup()
    listeners(true)
  }
}

scenes.start = {
  setup: function() {
    circles.push({x: w/2, y: h/2, r: Math.min(w/3,h/3), c: '#0E43C8'})
    texts.push({y: h/2 + 20, text: "START!"})
  },
  touchstart: function( event ) {
    var touchX = event.clientX || event.targetTouches[0].clientX
    var touchY = event.clientY || event.targetTouches[0].clientY
    if (_.pointInCircle(touchX, touchY, circles[0].x, circles[0].y, circles[0].r)){
      gotoScene("touches")
    }
  }
}

scenes.touches = {
  setup: function() {
    texts.push({text: "Tap on each of the circles", style: "#0E43C8"})
    circles.push({x: w*1/7, y: h*6/7, r: w/10, c: '#0E43C8'})
    circles.push({x: w*6/7, y: h*6/7, r: w/10, c: '#0E43C8'})
    circles.push({x: w*1/7, y: h*1/7, r: w/10, c: '#0E43C8'})
    circles.push({x: w*6/7, y: h*1/7, r: w/10, c: '#0E43C8'})
  },
  touchstart: function( event ) {
    var touchX = event.clientX || event.targetTouches[0].clientX
    var touchY = event.clientY || event.targetTouches[0].clientY
    for(var i=0; i<circles.length; i++){
      if (_.pointInCircle(touchX, touchY, circles[i].x, circles[i].y, circles[i].r)){
        circles.splice(i,1)
        break
      }
    }
    if(circles.length==0){
      texts.push({align: "bottom", text: "Fabulous tapping", style: "#0E43C8"})
      gotoSceneSoon('multitouch')
    }
  }
}

scenes.multitouch = {
  setup: function() {
    texts.push({text: "touch all the yellow circles at the same time", style: "#FF00FF"})
    var colors = ["rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    var circle_radius = w/12
    circles.push({x: (1 + circles.length) * circle_radius * 2, y: h/2, r: circle_radius, c: colors[1]})
    circles.push({x: (1 + circles.length) * circle_radius * 2, y: h/2, r: circle_radius, c: colors[0]})
    circles.push({x: (1 + circles.length) * circle_radius * 2, y: h/2, r: circle_radius, c: colors[1]})
    circles.push({x: (1 + circles.length) * circle_radius * 2, y: h/2, r: circle_radius, c: colors[2]})
    circles.push({x: (1 + circles.length) * circle_radius * 2, y: h/2, r: circle_radius, c: colors[1]})
  },
  touchstart: function(e) {
    var correct_touches=0
    for(var i=0; i<e.targetTouches.length; i++){
      var touchX = e.targetTouches[i].clientX
      var touchY = e.targetTouches[i].clientY
      for(var j=0; j<circles.length; j+=2){
        if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r)){
          correct_touches++
        }
      }
    }
    if(correct_touches>=2){
      texts.push({align: "bottom", text: "Great multi-touching!", style: "#00FF00"})
      gotoSceneSoon('swipe')
    }
  }
}

scenes.swipe = {
  setup: function() {
    texts.push({text: "Move the circle into the box", style: "#FF00FF"})
    var colors = ["rgba(220,220,220,220.5)", "rgba(0,255,255,0.5)", "rgba(255,255,0,0.5)", "rgba(255,0,255,0.5)"]
    circles.push({x: 2*h/12, y: h/2, r: h/12, c: colors[3]})
    boxes.push({x:w-(2*h/12), y: h/2, r: h/12, c: colors[2]})
  },
  touchstart: function(e) {
    move_circle = _.pointInCircle(e.targetTouches[0].clientX, e.targetTouches[0].clientY, circles[0].x, circles[0].y, circles[0].r)
  },
  touchmove: function(e) {
    if(move_circle){
      var touchX = e.targetTouches[0].clientX
      var touchY = e.targetTouches[0].clientY
      circles[0].x = touchX
      circles[0].y = touchY
    }

    if(_.pointInCircle(circles[0].x, circles[0].y, boxes[0].x, boxes[0].y, circles[0].r)){
      texts.push({align: "bottom", text: "circle in the box!", style: "#00FF00"})
      gotoSceneSoon('pinch')
    }
  }
}

scenes.pinch = {
  setup: function() {
    texts.push({text: "Pinch these circles to bring them together", style: "#FF00FF"})
    circles.push({x: 1*w/3, y: h/2, r: h/12, c: "rgba(255,0,0,0.5)"})
    circles.push({x: 2*w/3, y: h/2, r: h/12, c: "rgba(255,255,0,0.5)"})
  },
  touchstart: function(e) {
    if(e.targetTouches.length>=2){
      touch_to_circle_map = {}
      for(var i=0; i<e.targetTouches.length; i++){
        var touchX = e.targetTouches[i].clientX
        var touchY = e.targetTouches[i].clientY
        for(var j=0; j<circles.length; j++){
          if(_.pointInCircle(touchX, touchY, circles[j].x, circles[j].y, circles[j].r / 2)){
            touch_to_circle_map[i] = j
          }
        }
      }
    }
  },
  touchmove: function(e) {
    if(e.targetTouches.length>=2){
      for(var i=0; i<e.targetTouches.length; i++){
        circles[touch_to_circle_map[i]].x = e.targetTouches[i].clientX
        circles[touch_to_circle_map[i]].y = e.targetTouches[i].clientY
      }
      if(_.pointInCircle(circles[0].x, circles[0].y, circles[1].x, circles[1].y, circles[1].r / 4)){
        texts.push({align: "bottom", text: "Congratulations, you made orange!", style: "#FF7700"})
        gotoSceneSoon('tilt')
      }
    }
  },
  touchend: this.touchstart
}

scenes.tilt = {
  setup: function() {
    texts.push({text: "Tilt these circles to the left side", style: "#FF00FF"})
    for(var i=0; i<100; i++){
      circles.push({
        x: w * Math.random(),
        y: h * Math.random(),
        r: h/10 * Math.random(),
        c: _.randomColorWithAlpha(),
        v: {
          x: Math.random() - 0.5,
          y: Math.random() - 0.5
          }
        })
    }
    var circleMoveInterval = setInterval(function(){
      var i = Math.floor(Math.random()*circles.length)
      circles[i].v.x = Math.min(Math.random() - 0.5 + circles[i].v.x, 1)
      circles[i].v.y = Math.min(Math.random() - 0.5 + circles[i].v.y, 1)
    }, 500)
    var tiltToLeftInterval = setInterval(function(){
      var oneTooFarRight = false
      for(var i=0; i<circles.length; i++){
        if(circles[i].x > w/6) oneTooFarRight = true
      }
      if(!oneTooFarRight){
        texts.push({align: "bottom", text: "Nice, they are all on the left side!", style: "#00FF77"})
        clearInterval(circleMoveInterval)
        clearInterval(tiltToLeftInterval)
        gotoSceneSoon("start")
      }
    }, 3000)
  }
}

gotoScene('start')
setInterval(loop, 1000/60)
