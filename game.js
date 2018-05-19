// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d');

var width = 371,
  height = 600;

canvas.width = width;
canvas.height = height;

var platforms = [],
  platformCount = 10,
  position = 0,
  gravity = 0.2,
  animloop,
  flag = 0,
  menuloop, broken = 0,
  dir, score = 0, isFirst = true;

var image_left=document.getElementById("image_left");
var image_left2=document.getElementById("image_left2");
var image_right=document.getElementById("image_right");
var image_right2=document.getElementById("image_right2");
var image_normal=document.getElementById("image_normal");
var image_moveable=document.getElementById("image_moveable");
var image_breakable=document.getElementById("image_breakable");
var image_null=document.getElementById("image_null");
var image_broken=document.getElementById("image_broken");
var image_spring=document.getElementById("image_spring");
var image_spring2=document.getElementById("image_spring2");

//地平线
var Base = function() {
  this.height = 1;
  this.width = width;
  this.moved = 0;

  this.x = 0;
  this.y = height - this.height;

 this.draw = function() {};
};

var base = new Base();

//Jumper object
var Jumper = function() {
  this.vy = 11;
  this.vx = 0;

  this.isMovingLeft = false;
  this.isMovingRight = false;
  this.isDead = false;

  this.width = 62;
  this.height = 60;
  this.image;

  this.dir = "left";
  this.x = width / 2 - this.width / 2;
  this.y = height;

  //添加各状态对应图片
  this.draw = function() {
    try {

        if (this.dir == "right") this.image=image_right;
        else if (this.dir == "left") this.image=image_left;
        else if (this.dir == "right_land") this.image=image_right2;
        else if (this.dir == "left_land") this.image=image_left2;

       ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
    } catch (e) {}
  };

  this.jump = function() {
    this.vy = -8;
  };

  this.jumpHigh = function() {
    this.vy = -16;
  };

};

var jumper = new Jumper();

//生成平台
function Platform() {
  this.width = 63;
  this.height = 18;

  this.x = Math.random() * (width - this.width);
  this.y = position;

  position += (height / platformCount);

  this.flag = 0;
  this.state = 0;
  this.image;

  this.draw = function() {
    try {
        if (this.type == 1) this.image=image_normal;
        else if (this.type == 2) this.image=image_moveable;
        else if (this.type == 3 && this.flag === 0) this.image=image_breakable;
        else if (this.type == 3 && this.flag == 1) this.image=image_null;

        ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
    } catch (e) {}
  };
  /*
  1: Normal Platform
  2: Moving Platform
  3: Breakable Platform
  */
//难度设置
    //为方便演示，此处调为不论多少分，三种平台均会出现
 /* if (score >= 1000) this.types = [2, 3, 3];
  else if (score >= 500 && score < 1000) this.types = [1, 2, 2, 3, 3];
  else if (score >= 100 && score < 500) this.types = [1, 1, 2];
  else this.types = [1];*/

 //三种平台比例
  this.types = [1,1,2,3];

  //随机数函数，从数组中选取平台
  this.type = this.types[Math.floor(Math.random() * this.types.length)];

  //不能连续生成两个breakable，否则会产生无法上升的情况
  if (this.type == 3 && broken < 1) {
    broken++;
  } else if (this.type == 3 && broken >= 1) {
    this.type = 1;
    broken = 0;
  }

  this.moved = 0;
  this.vx = 1;
}

for (var i = 0; i < platformCount; i++) {
  platforms.push(new Platform());
}

//碰到breakable平台后变为broken状态
var Platform_broken = function() {
  this.height = 35;
  this.width = 63;

  this.x = 0;
  this.y = 0;
  this.image=image_broken;

  this.appearance = false;

  this.draw = function() {
    try {
      if (this.appearance === true)
          ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
      else return;
    } catch (e) {}
  };
};

var platform_broken = new Platform_broken();

//弹簧
var spring = function() {
  this.x = 0;
  this.y = 0;

  this.width = 17;
  this.height = 29;
  this.image;

  this.state = 0;

  this.draw = function() {
    try {
        if (this.state === 0) this.image=image_spring;
        else if (this.state == 1) this.image=image_spring2;
         ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
    } catch (e) {}
  };
};

var Spring = new spring();

function init() {
  var dir = "left",
    jumpCount = 0;
  
  isFirst = false;


  function paintCanvas() {
    ctx.clearRect(0, 0, width, height);
  }

  function playerCalc() {
    if (dir == "left") {
      jumper.dir = "left";
      if (jumper.vy < -7 && jumper.vy > -15) jumper.dir = "left_land";
    } else if (dir == "right") {
      jumper.dir = "right";
      if (jumper.vy < -7 && jumper.vy > -15) jumper.dir = "right_land";
    }

    //键盘控制
    document.onkeydown = function(e) {
      var key = e.keyCode;
      
      if (key == 37) {
        dir = "left";
        jumper.isMovingLeft = true;
      } else if (key == 39) {
        dir = "right";
        jumper.isMovingRight = true;
      }
      
      if(key == 32) {
        if(isFirst === true)
          init();
        else 
          reset();
      }
    };

    document.onkeyup = function(e) {
      var key = e.keyCode;
    
      if (key == 37) {
        dir = "left";
        jumper.isMovingLeft = false;
      } else if (key == 39) {
        dir = "right";
        jumper.isMovingRight = false;
      }
    };

    if (jumper.isMovingLeft === true) {
      jumper.x += jumper.vx;
      jumper.vx -= 0.15;
    } else {
      jumper.x += jumper.vx;
      if (jumper.vx < 0) jumper.vx += 0.1;
    }

    if (jumper.isMovingRight === true) {
      jumper.x += jumper.vx;
      jumper.vx += 0.15;
    } else {
      jumper.x += jumper.vx;
      if (jumper.vx > 0) jumper.vx -= 0.1;
    }

    // 速度限制，速度不能过大
    if(jumper.vx > 8)
      jumper.vx = 8;
    else if(jumper.vx < -8)
      jumper.vx = -8;


    //在地平线时起跳
    if ((jumper.y + jumper.height) > base.y && base.y < height) jumper.jump();

    //起跳后落至底部gameover
    if (base.y > height && (jumper.y + jumper.height) > height && jumper.isDead != "lol") jumper.isDead = true;

    //x方向可循环跳转。如到达屏幕最右端后继续向右，可从左侧跳出
    if (jumper.x > width) jumper.x = 0 - jumper.width;
    else if (jumper.x < 0 - jumper.width) jumper.x = width;


    //受重力影响，向上跳的过程中逐渐减速，直至为0，则下落
    if (jumper.y >= (height / 2) - (jumper.height / 2)) {
      jumper.y += jumper.vy;
      jumper.vy += gravity;
    }
//jumper向上跳，屏幕向上滚动，已有平台下移，上部生成新平台
    else {
      platforms.forEach(function(p, i) {

        if (jumper.vy < 0) {
          p.y -= jumper.vy;
        }

        if (p.y > height) {
          platforms[i] = new Platform();
          platforms[i].y = p.y - height;
        }

      });

      base.y -= jumper.vy;
      jumper.vy += gravity;

      if (jumper.vy >= 0) {
        jumper.y += jumper.vy;
        jumper.vy += gravity;
      }

      score++;
    }

    //若检测到jumper碰撞平台，使jumper进行jump
    collides();

    if (jumper.isDead === true) gameOver();
  }

  function springCalc() {
    var s = Spring;
    var p = platforms[0];
//normal和moving平台上可以出现弹簧
    if (p.type == 1 || p.type == 2) {
      s.x = p.x + p.width / 2 - s.width / 2;
      s.y = p.y - p.height - 10;

      if (s.y > height / 1.1) s.state = 0;

      s.draw();
    } else {
      s.x = 0 - s.width;
      s.y = 0 - s.height;
    }
  }

  function platformCalc() {
    var subs = platform_broken;

    platforms.forEach(function(p, i) {
      if (p.type == 2) {
        if (p.x < 0 || p.x + p.width > width) p.vx *= -1;

        p.x += p.vx;
      }

      if (p.flag == 1 && subs.appearance === false && jumpCount === 0) {
        subs.x = p.x;
        subs.y = p.y;
        subs.appearance = true;

        jumpCount++;
      }

      p.draw();
    });

    if (subs.appearance === true) {
      subs.draw();
      subs.y += 8;
    }

    if (subs.y > height) subs.appearance = false;
  }

  //根据jumper和platform的相对位置进行碰撞检测
  function collides() {
    platforms.forEach(function(p,i) {
      if (jumper.vy > 0 && p.state === 0 && (jumper.x + 15 < p.x + p.width) && (jumper.x + jumper.width - 15 > p.x) && (jumper.y + jumper.height > p.y) && (jumper.y + jumper.height < p.y + p.height)) {

        //breakable平台不能跳上，若检测到未碰过的breakable平台，更改为broken，之后return
        if (p.type == 3 && p.flag === 0) {
          p.flag = 1;
          jumpCount = 0;
          return;
        }
        else if (p.flag == 1) return;//若平台已经被跳上，return
        else {
          jumper.jump();//未跳上的可跳平台，jumper跳上
        }
      }
    });

    //Springs
    var s = Spring;
    if (jumper.vy > 0 && (s.state === 0) && (jumper.x + 15 < s.x + s.width) && (jumper.x + jumper.width - 15 > s.x) && (jumper.y + jumper.height > s.y) && (jumper.y + jumper.height < s.y + s.height)) {
      s.state = 1;
      jumper.jumpHigh();
    }

  }

  function updateScore() {
    var scoreText = document.getElementById("score");
    scoreText.innerHTML = score;
  }

  function gameOver() {
    platforms.forEach(function(p, i) {
      p.y -= 12;
    });

    if(jumper.y > height/2 && flag === 0) {
      jumper.y -= 8;
      jumper.vy = 0;
    } 
    else if(jumper.y < height / 2) flag = 1;
    else if(jumper.y + jumper.height > height) {
      showGoMenu();
      hideScore();
      jumper.isDead = "lol";

    }
  }

  //更新数据
  function update() {
    paintCanvas();
    platformCalc();
    springCalc();
    playerCalc();
    jumper.draw();
    base.draw();
    updateScore();
  }

  menuLoop = function(){return;};
  animloop = function() {
    update();
    requestAnimFrame(animloop);
  };

  animloop();

  hideMenu();
  showScore();
}

function reset() {
  hideGoMenu();
  showScore();
  jumper.isDead = false;
  
  flag = 0;
  position = 0;
  score = 0;

  base = new Base();
  jumper = new Jumper();
  Spring = new spring();
  platform_broken = new Platform_broken();

  platforms = [];
  for (var i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }
}

function hideMenu() {
  var menu = document.getElementById("start_menu");
  menu.style.zIndex = -1;
}

function showGoMenu() {
  var menu = document.getElementById("over_menu");
  menu.style.zIndex = 1;
  menu.style.visibility = "visible";

  var scoreText = document.getElementById("go_score");
  scoreText.innerHTML = "You scored " + score + " points!";
}

function hideGoMenu() {
  var menu = document.getElementById("over_menu");
  menu.style.zIndex = -1;
  menu.style.visibility = "hidden";
}

function showScore() {
  var menu = document.getElementById("score_menu");
  menu.style.zIndex = 1;
}

function hideScore() {
  var menu = document.getElementById("score_menu");
  menu.style.zIndex = -1;
}

function playerJump() {
  jumper.y += jumper.vy;
  jumper.vy += gravity;

  if (jumper.vy > 0 &&
    (jumper.x + 15 < 260) &&
    (jumper.x + jumper.width - 15 > 155) &&
    (jumper.y + jumper.height > 475) &&
    (jumper.y + jumper.height < 500))
    jumper.jump();

  if (dir == "left") {
    jumper.dir = "left";
    if (jumper.vy < -7 && jumper.vy > -15) jumper.dir = "left_land";
  } else if (dir == "right") {
    jumper.dir = "right";
    if (jumper.vy < -7 && jumper.vy > -15) jumper.dir = "right_land";
  }

  document.onkeydown = function(e) {
    var key = e.keyCode;

    if (key == 37) {
      dir = "left";
      jumper.isMovingLeft = true;
    } else if (key == 39) {
      dir = "right";
      jumper.isMovingRight = true;
    }
  
    if(key == 32) {
      if(isFirst === true) {
        init();
        isFirst = false;
      }
      else 
        reset();
    }
  };

  document.onkeyup = function(e) {
    var key = e.keyCode;

    if (key == 37) {
      dir = "left";
      jumper.isMovingLeft = false;
    } else if (key == 39) {
      dir = "right";
      jumper.isMovingRight = false;
    }
  };


  if (jumper.isMovingLeft === true) {
    jumper.x += jumper.vx;
    jumper.vx -= 0.15;
  } else {
    jumper.x += jumper.vx;
    if (jumper.vx < 0) jumper.vx += 0.1;
  }

  if (jumper.isMovingRight === true) {
    jumper.x += jumper.vx;
    jumper.vx += 0.15;
  } else {
    jumper.x += jumper.vx;
    if (jumper.vx > 0) jumper.vx -= 0.1;
  }

  if ((jumper.y + jumper.height) > base.y && base.y < height) jumper.jump();

  if (jumper.x > width) jumper.x = 0 - jumper.width;
  else if (jumper.x < 0 - jumper.width) jumper.x = width;

  jumper.draw();
}

function update() {
  ctx.clearRect(0, 0, width, height);
  playerJump();
}   

menuLoop = function() {
  update();
  requestAnimFrame(menuLoop);
};

menuLoop();