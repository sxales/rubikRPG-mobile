var Stage = function Stage() {
	var state;
	var _frame = 0;
	var _tutorial = 0;
	var bonus = -1;
	var stage = 0;
	var bounties = [5,10,20,50,25];
	var summons = 0, deaths = 0;
	var oldbalance = 0, newbalance = 0;
	var CHESTVALUE = 50;
	var WAITING = -1, INPLAY = 0, FAILED = 1, SUCCESS = 2, PAUSED = 3; SAVE = 4;//states
	var BLUE = 7, GRAY = 3, GREEN = 6, RED = 5, SUPER = 0, WHITE = 2, YELLOW = 8, PINK = 4, LOGO = 1; //font colors
	var BASIC = 0,  INTERMEDIATE = 1, ADVANCED = 2, BOSS = 3, MAGE = 4, CHEST = 5, EMPTY = -1; //enemy types
	var NORMAL = 0, PETRIFIED = 1, FROSTBITE = 3, BURNED = 4, ELECTROCUTED = 2, KNOCKEDDOWN = 5; //status effects
	var cleared = false;
	var model = new ArrayList2d();
	var player = new Entity();
	var displayedxp = 0;
	var messages = new Array();
	var SCREENRATIO = .85;
	var MENURATIO = .05;
	var mages = new Array();
	var statuseffects = new Array();
	var chests = new Array();
	var stageboss = new Point();
	var defeated = new Array();
	var injured = new Array();
	var _width, _height;
	var mute = false;
	var volume = .2;
	var locked = true;
	var btndown;
	var MINATK = 5; MINDEF = 5, MINSPD = 1; MINRCV = 1, MINHP = 20;
	var baseatk = 5, basedef = 5, basespd = 1, basercv = 1, basehp = 10;
	var PENALTYMIN = .05, PENALTYMAX = .15;
	var BASICRATIO = 3/5, INTRATIO = 1, ADVRATIO = 6/5, BOSSRATIO = 8/5, MAGERATIO = 6/5;
	var XPRATE = 1;
	var TRAPPEDCHESTDAMAGE = .75;
	var atkloss = 0, defloss = 0, spdloss = 0, rcvloss = 0;
	var subscribers = new Array();
	var btnnew = new Button();
	var btnload = new Button();
	var hardcore = true;

	subscribe = function(s) {
		subscribers.push(s);
	};

	unsubscribe = function(s) {
		for (var i = 0; i<subscribers.length; i++) {
			if (subscribers[i] == s) {
				subscribers.splice(i);
				break;
			}
		}
	};

	notify = function(b) {
		for (var i = 0; i<subscribers.length; i++) {
			subscribers[i].call(this,b);
		}
	};

	this.init = function(w,h) {
		_height = h;
		_width = w;

		setVolume(volume);

		oldbalance = 0;
		stage = 0;
		summons = 0;
		deaths = 0;
		player = {hp: MINHP, currenthp: MINHP, xp: 1, currentxp : 0, atk: MINATK, def: MINDEF, spd: MINSPD, rcv: MINRCV, act: 99, spl: 0, statuseffect: NORMAL};

		displayedxp = 0;

		reset();

		if (typeof(Storage) !== "undefined") {
			if (Number(localStorage.getItem("hp")) > MINHP) state = SAVE;
		}
	};

	this.keydown = function(evt) {
		if (evt.key == "p") {
			if (state == INPLAY) {
				state = PAUSED;
			}
		}
		else if (evt.key == "r") {
			displayedxp = 0;
			oldbalance = 0;
			newbalance = 0;
			stage = 0;
			player = {hp: MINHP, currenthp: MINHP, xp: 1, currentxp : 0, atk: MINATK, def: MINDEF, spd: MINSPD, rcv: MINRCV, act: 99, spl: 0};
			reset();
		}
		else if (evt.key == "m") {
			mute = !mute;
		}
	};

	this.mousedown = function(evt) {
		if (evt.clientY < _height*SCREENRATIO) {
			if (evt.button == 0) {
				btndown =  window.setTimeout(rightClick, 500, evt.clientX, evt.clientY);//long press
			}
		}
	};

	this.mouseup = function(evt) {
		var size = _width / (model.getWidth()*2);
		if (btndown) window.clearTimeout(btndown);
		if (evt.clientY < _height*SCREENRATIO) {
			if (state == SAVE) {
				if (evt.button == 0) {
					if (btnload.check(evt.clientX, evt.clientY)) {
						load();
						reset();
						state = WAITING;
					}
					else if (btnnew.check(evt.clientX, evt.clientY)) {
						localStorage.clear();
						state = WAITING;
					}
				}
			}
			else {
				if (evt.button == 0) {
					click(evt.clientX, evt.clientY); //left click
				}
				else rightClick(evt.clientX, evt.clientY);
			}
		}
	};

	this.mouseout = function(evt) {
		if (btndown) window.clearTimeout(btndown);
	};

	this.mousemove = function(evt) {
		if (state == SAVE) {
			btnload.check(evt.clientX, evt.clientY);
			btnnew.check(evt.clientX, evt.clientY);
		}
	};

	this.touchstart = function(evt) {
		if (evt.touches[0].pageY < _height*SCREENRATIO) {
			btndown =  window.setTimeout(rightClick, 500, evt.touches[0].pageX, evt.touches[0].pageY);//long press
		}
	};

	this.touchend = function(evt) {
		var size = _width / (model.getWidth()*2);
		if (btndown) window.clearTimeout(btndown);
		if (evt.changedTouches[0].pageY < _height*SCREENRATIO) {
			if (state == SAVE) {
				if (check_collision(btnload, evt.changedTouches[0].pageX, evt.changedTouches[0].pageY)) {
					load();
					reset();
					state = WAITING;
				}
				else if (check_collision(btnnew, evt.changedTouches[0].pageX, evt.changedTouches[0].pageY)) {
					localStorage.clear();
					state = WAITING;
				}
			}
			else {
				click(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY); //left click
			}
		}
	};

	this.touchcancel = function(evt) {
		if (btndown) window.clearTimeout(btndown);
	};

	this.touchmove = function(evt) {
	};

	rightClick = function(inputX, inputY) {
		if (state == INPLAY && player.spl >= 100) {
			var width = _width / model.getWidth();
			var height = (_height*SCREENRATIO) / model.getHeight();
			var x = Math.floor(inputX/width);
			var y = Math.floor(inputY/height);
			var resetspl = false;
			for (var i=-1; i<=1; i++) {
				for (var j=-1; j<=1; j++) {
					if (x+i >= 0 && x+i < model.getWidth() && y+j >= 0 && y+j < model.getHeight() && model.get(x+i,y+j).type != EMPTY && model.get(x+i,y+j).type != CHEST) {
						resetspl = true;
						//give status effect
						var temp = model.get(x+i, y+j);
						temp.statuseffect = PETRIFIED;
						temp.sts = 49; //10 second counter
						model.set(x+i, y+j, temp);
						//add them to the tracker
						var p = new Point();
						p = {x: x+i,y: y+j};
						statuseffects.push(p);
					}
				}
			}
			if (resetspl) player.spl = 0;
		}
		//else do nothing
	};

	click  = function(inputX, inputY) {
		if (state == WAITING) {
			oldbalance = newbalance;
			state = INPLAY;
		}
		else if (state == PAUSED) state = INPLAY;
		else if (state == INPLAY) {
			var width = _width / model.getWidth();
			var height = (_height*SCREENRATIO) / model.getHeight();
			var x = Math.floor(inputX/width);
			var y = Math.floor(inputY/height);
			var enemy = model.get(x,y);
			if ((enemy.type == BASIC || enemy.type == INTERMEDIATE || enemy.type == ADVANCED || enemy.type == MAGE || (enemy.type == BOSS && !locked)) && enemy.statuseffect != PETRIFIED){
				
				var atk = Math.round(player.atk + Math.random()*(player.atk * (1/10))); //base attak
				if (player.statuseffect == ELECTROCUTED) atk /= 2;//electrocution weakens enemies
				var def = Math.round(enemy.def * (1/2) - Math.random()*(enemy.def * (1/10))); //base defense
				if (enemy.statuseffect == FROSTBITE) def /= 2;//frostbite lowers enemy defense
				
				var dmg = atk - def; //damage
				if (dmg <= 0) dmg = 1;
				
				var spd = enemy.spd * 2 - player.spd;
				if (enemy.spd < 1) spd = 1;
				if (spd < 0) spd = 0;
				
				var spdcheck = Math.floor(Math.random()*(32+spd));
				
				
				if (spdcheck <= 1) {
					//critical hit
					dmg *= 2;
					var m = new Message();
					var fs = width/3;
					var txt = "critical hit";
					m = {type: GREEN, message: txt, x: inputX-(fs*txt.length/2), y: inputY, s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);
				}
				else if (spdcheck >= 32 + player.spd * .8) {
					//miss
					dmg = 0;
					var m = new Message();
					var fs = width/3;
					var txt = "miss";
					m = {type: WHITE, message: txt, x: inputX-(fs*txt.length/2), y: inputY, s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);
				}
				enemy.currenthp -= dmg;

				if (!isInjured(x,y)) {
					var p = new Point();
					p = {x: x,y: y};
					injured.push(p);
				}

				var m = new Message();
				var fs = width/3;
				m = {type: GREEN, message:dmg, x: inputX+fs*Math.random(), y: inputY-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
				messages.push(m);

				if (enemy.currenthp > 0) {
					//enemy attack
					var atk = Math.round(enemy.atk + Math.random()*(enemy.atk * (1/10))); //base attack
					if (enemy.statuseffect == ELECTROCUTED) atk /= 2;//electrocution weakens enemies
					var def = Math.round(player.def * (1/2) - Math.random()*(player.def * (1/10))); //base defense
					if (player.statuseffect == FROSTBITE) def /= 2;//frostbite lowers enemy defense
				
					var dmg = atk - def; //damage
					if (dmg <= 0) dmg = 1;
					
					if (player.currenthp == player.hp && dmg >= player.hp) dmg = player.currenthp - 1;//prevent one hit kills on player

					if (enemy.type == BOSS) dmg *= ((56-defeated.length)/56); //boss modifier

					var playerhp = ""+player.hp;
					var fs = _height*(1-SCREENRATIO) / 5;
					var margin = fs;
					var buffer = fs/2;
					var position = _height*SCREENRATIO + margin;
					var offset = _width*.6;
					var l = offset-margin-buffer-(fs*3);
					
					var spd = player.spd * 2 - enemy.spd;
					//if (player.spd < 1) spd = 1;
					if (spd < 0) spd = 0;
					
					if (enemy.statuseffect == KNOCKEDDOWN) spd = 0;//knockdown immobilizes an enemy
					
					var spdcheck = Math.floor(Math.random()*(32+spd));

					if (spdcheck <= 1) {
					//miss
						dmg = 0;
						var m = new Message();
						var txt = "dodge";
						var startx = (l - txt.length*fs)/2 + fs*3 + buffer + margin;
						m = {type: WHITE, message: txt, x: startx, y: position, s: fs, duration: 1, tick: 0, delay: 0};
						messages.push(m);
					}
					
					if (dmg > 0) {
						var m = new Message();
						var dam = ""+Math.round(dmg);
						var percent = player.currenthp/player.hp;
						var startx = offset - (1-percent)*l - dam.length*fs;
						m = {type: RED, message: Math.round(dmg), x: startx, y: position, s: fs, duration: 1, tick: 0, delay: 0};
						messages.push(m);

						player.spl += Math.round((dmg/(player.hp*3))*100);
						if (player.spl > 100) player.spl = 100;
						
						player.currenthp -= Math.round(dmg);
					}

					if (player.currenthp <= 0) {
						player.currenthp = 0;
						//dead
						atkloss = Math.round(player.atk * (PENALTYMIN + Math.random() * (PENALTYMAX - PENALTYMIN))) + 1;
						if (player.atk - atkloss < MINATK) atkloss = player.atk - MINATK;

						defloss = Math.round(player.def * (PENALTYMIN + Math.random() * (PENALTYMAX - PENALTYMIN))) + 1;
						if (player.def - defloss < MINDEF) defloss = player.def - MINDEF;

						spdloss = Math.round(player.spd * (PENALTYMIN + Math.random() * (PENALTYMAX - PENALTYMIN))) + 1;
						if (player.spd - spdloss < MINSPD) spdloss = player.spd - MINSPD;

						rcvloss = Math.round(player.rcv * (PENALTYMIN + Math.random() * (PENALTYMAX - PENALTYMIN))) + 1;
						if (player.rcv - rcvloss < MINRCV) rcvloss = player.rcv - MINRCV;

						if (!mute) resourceRepository.gameover.play();
						_frame = 0;
						state = 1;
					}
				}
				else {
					//deafeated
					defeatEnemy(x,y);
				}
			}
			else if (enemy.type == CHEST) {
				//opened chest
				enemy.type = EMPTY;
				for (var i=0; i<chests.length; i++) {
					if (chests[i].x == x && chests[i].y == y) chests.splice(i,1);
				}
				var p = new Point();
				p = {x: x,y: y};
				defeated.push(p);
				var n = Math.floor(enemy.act%4);
				if (n == 0) {
					//x5
					var g = CHESTVALUE*5;
					g = Math.round(g*.9)+Math.round(Math.random()*(g*.2));
					newbalance += g;
					
					var m = new Message();
					var fs = width/3;
					var txt = ""+g+"g";
					m = {type: YELLOW, message:txt, x: inputX+fs*Math.random(), y: inputY-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);
				}
				else if (n == 1) {
					//x2
					var g = CHESTVALUE*2;
					g = Math.round(g*.9)+Math.round(Math.random()*(g*.2));
					newbalance += g;
					
					var m = new Message();
					var fs = width/3;
					var txt = ""+g+"g";
					m = {type: YELLOW, message:txt, x: inputX+fs*Math.random(), y: inputY-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);
				}
				else if (n == 2) {
					//x1
					var g = CHESTVALUE;
					g = Math.round(g*.9)+Math.round(Math.random()*(g*.2));
					newbalance += g;
					
					var m = new Message();
					var fs = width/3;
					var txt = ""+g+"g";
					m = {type: YELLOW, message:txt, x: inputX+fs*Math.random(), y: inputY-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);
				}
				else {
					//trapped chest
					var m = new Message();
					var fs = width/3;
					var txt = "boom";
					m = {type: RED, message:txt, x: inputX+fs*Math.random(), y: inputY-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);

					if (!mute) resourceRepository.boom.play();

					var d = Math.floor(player.currenthp*TRAPPEDCHESTDAMAGE);

					var m = new Message();
					var playerhp = ""+player.hp;
					var dam = ""+Math.round(d);
					var fs = _height*(1-SCREENRATIO) / 5;
					var margin = fs;
					var buffer = fs/2;
					var position = _height*SCREENRATIO + margin;
					var offset = _width*.6;
					var l = offset-margin-buffer-(fs*3);
					var percent = player.currenthp/player.hp;
					var startx = offset - (1-percent)*l - dam.length*fs;
					m = {type: RED, message: Math.round(d), x: startx, y: position+fs, s: fs, duration: 1, tick: 0, delay: 0};
					messages.push(m);

					player.currenthp -= Math.round(d);

					if (player.currenthp <= 0) {
						player.currenthp = 0;
						//dead
						if (!mute) resourceRepository.gameover.play();
						_frame = 0;
						state = FAILED;
					}
				}

				if (cleared) {
					if (!mute) resourceRepository.cleared.play();
					player.currenthp = player.hp;
					_frame = 0;
					state = SUCCESS;
				}
				else {
					if (!mute) resourceRepository.acquire.play();
				}
			}
			model.set(x, y, enemy);
		}
	};

	this.draw = function(ctx) {
		ctx.clearRect(0, 0, _width, _height);

		//draw the model
		var width = _width / model.getWidth();
		var height = (_height*SCREENRATIO) / model.getHeight();
		var index = 0;
		for (var i=0;i<model.getWidth(); i++) {
			for (var j=0; j<model.getHeight(); j++) {
				//var image = new Image();
				switch (model.get(i,j).type) {
					case BASIC:
						index = 23; //black
						break;
					case INTERMEDIATE:
						index = 5; //green
						break;
					case ADVANCED:
						index = 2; //gold
						break;
					case BOSS:
						index = 10; //blue
						break;
					case MAGE:
						index = 14; //purple
						break;
					case CHEST:
						index = 17; //brown
						break;
					default:
						index = 20; //gray
						break;
				}
				var fs = (_width / model.getWidth());
				if (state == WAITING || state == PAUSED || state == SAVE) index = ((i+j+_frame) << 1 )%16; //colorful waiting screen
				else if (model.get(i,j).statuseffect == PETRIFIED) index = 22;//dark gray
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8), 64*Math.floor(index/8), 64, 64, i*width, j*height, width, height);

				if (state == INPLAY && model.get(i,j).type != -1) { 
					//add damamge animation
					index = 0; //red
					if (model.get(i,j).statuseffect == PETRIFIED) index = 21;//light gray
					var hppercent = (model.get(i,j).currenthp / model.get(i,j).hp);
					var offset = Math.floor(64*hppercent);
					//var offset = Math.floor((model.get(i,j).currenthp / model.get(i,j).hp)*64);
					if (offset < 64 && offset >= 0) ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+offset, 64*Math.floor(index/8), 64-offset, 64, i*width+(width*hppercent), j*height, width-(width*hppercent), height);
					//add status effect sprite (looks like crap atm)
					if (model.get(i,j).statuseffect == FROSTBITE) ctx.drawImage(resourceRepository.spriteSheet, 64*(FROSTBITE), 0, 64, 64, i*width + width/4, j*height + height/4, width/2, height/2);
					else if (model.get(i,j).statuseffect == BURNED) ctx.drawImage(resourceRepository.spriteSheet, 64*(BURNED), 0, 64, 64, i*width + width/4, j*height + height/4, width/2, height/2);
					else if (model.get(i,j).statuseffect == ELECTROCUTED) ctx.drawImage(resourceRepository.spriteSheet, 64*(ELECTROCUTED), 0, 64, 64, i*width + width/4, j*height + height/4, width/2, height/2);
					else if (model.get(i,j).statuseffect == KNOCKEDDOWN) ctx.drawImage(resourceRepository.spriteSheet, 64*(KNOCKEDDOWN), 0, 64, 64, i*width + width/4, j*height + height/4, width/2, height/2);
				}
				if (state == INPLAY && locked) { //add lock and key sprites
					if (model.get(i,j).type == BOSS) ctx.drawImage(resourceRepository.spriteSheet, 0, 0, 64, 64, i*width + (width*.1),j*height + (height*.1),width*.8,height*.8);
					else if (model.get(i,j).type == ADVANCED) ctx.drawImage(resourceRepository.spriteSheet, 65, 0, 64, 64, i*width + (width*.1),j*height + (height*.1),width*.8,height*.8);
				}

			}
		}
		//draw countdown for mages
		if (state == INPLAY) {
			for(var i=0; i<mages.length; i++) {
				var mage = model.get(mages[i].x, mages[i].y);
				var fs = _width / model.getWidth() / 2;
				writeMessage(ctx, (9-Math.floor(mage.act/10)), WHITE, mages[i].x*(_width / model.getWidth()) + (fs/2), mages[i].y*((_height*SCREENRATIO) / model.getHeight()) + (fs/2), fs);
			}
		}

		//chest roulette
		if (state == INPLAY) {
			for(var i=0; i<chests.length; i++) {
				var chest = model.get(chests[i].x, chests[i].y);
				var fs = _width / model.getWidth() / 4;
				switch (Math.floor(chest.act%4)) {
					case 0:
						writeMessage(ctx, "x5", WHITE, chests[i].x*(_width / model.getWidth()) + (fs), chests[i].y*((_height*SCREENRATIO) / model.getHeight()) + (fs*3/2), fs);
						break;
					case 1:
						writeMessage(ctx, "x2", WHITE, chests[i].x*(_width / model.getWidth()) + (fs), chests[i].y*((_height*SCREENRATIO) / model.getHeight()) + (fs*3/2), fs);
						break;
					case 2:
						writeMessage(ctx, "x1", WHITE, chests[i].x*(_width / model.getWidth()) + (fs), chests[i].y*((_height*SCREENRATIO) / model.getHeight()) + (fs*3/2), fs);
						break;
					case 3:
						writeMessage(ctx, "bad", WHITE, chests[i].x*(_width / model.getWidth()) + (fs/2), chests[i].y*((_height*SCREENRATIO) / model.getHeight()) + (fs*3/2), fs);
						break;
				}
			}
		}
		//draw scoreboard
		ctx.drawImage(resourceRepository.background, 0, _height*SCREENRATIO, _width, _height*(1-SCREENRATIO));

		var fs = _height*(1-SCREENRATIO) / 6;
		var margin = fs;
		var buffer = fs/2;
		var position = _height*SCREENRATIO + margin;
		writeMessage(ctx, "hp", WHITE, margin, position, fs);
		writeMessage(ctx, "exp", WHITE, margin, position+(3*fs/2), fs);
		writeMessage(ctx, "spl", WHITE, margin, position+fs*3, fs);

		var offset = _width-margin-fs*7-buffer;
		writeMessage(ctx, "atk", WHITE, offset+margin, position, fs);
		writeMessage(ctx, "def", WHITE, offset+margin, position+fs, fs);
		writeMessage(ctx, "spd", WHITE, offset+margin, position+fs*2, fs);
		writeMessage(ctx, "rcv", WHITE, offset+margin, position+fs*3, fs);

		var l = offset - buffer*2 - (fs*3);
		var percent = player.currenthp/player.hp;
		var bezel = 2;

		//display hp bar
		ctx.strokeStyle="black";
		ctx.strokeRect(margin+buffer+(fs*3), position, l, fs);
		if (l*percent > bezel*2) {
			ctx.fillStyle="white";
			ctx.fillRect(margin+buffer+(fs*3), position, l*percent, fs); //light box
			if (percent <= .3 && _frame%2 == 0) ctx.fillStyle="#eb1c23"; //red
			else ctx.fillStyle="#940200"; //dark red
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+bezel, l*percent-bezel, fs-bezel); //shadow box
			if (percent <= .3 && _frame%2 == 0) ctx.fillStyle="#940200"; //dark red
			else ctx.fillStyle="#eb1c23"; //red
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+bezel, l*percent-bezel*2, fs-bezel*2); //inner box
		}
		//ticking xp
		if (++displayedxp > player.currentxp/player.xp*100) displayedxp = player.currentxp/player.xp*100;
		if (displayedxp >= 100) {
			player.currentxp -= player.xp;
			displayedxp = 0;
			levelup();
			if (!mute) resourceRepository.levelup.play();
		}
		percent = displayedxp/100;
		//display xp bar
		ctx.strokeStyle="black";
		ctx.strokeRect(margin+buffer+(fs*3), position+(3*fs/2), l, fs);
		if (l*percent > bezel*2) {
			ctx.fillStyle="white";
			ctx.fillRect(margin+buffer+(fs*3), position+(3*fs/2), l*percent, fs); //light box
			ctx.fillStyle="#3e701e"; //dark green
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+(3*fs/2)+bezel, l*percent-bezel, fs-bezel); //shadow box
			ctx.fillStyle="#6cc236"; //green
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+(3*fs/2)+bezel, l*percent-bezel*2, fs-bezel*2); //inner box
		}
		//special bar
		ctx.strokeStyle="black";
		ctx.strokeRect(margin+buffer+(fs*3), position+fs*3, l, fs);
		percent = player.spl/100;
		if (l*percent > bezel*2) {
			ctx.fillStyle="white";
			ctx.fillRect(margin+buffer+(fs*3), position+fs*3, l*percent, fs); //light box
			if (player.spl >= 100 && _frame%2 == 0) ctx.fillStyle="#9400D3"; //dark violet
			else ctx.fillStyle="#4B0082"; //indigo
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+fs*3+bezel, l*percent-bezel, fs-bezel); //shadow box
			if (player.spl >= 100 && _frame%2 == 0)	ctx.fillStyle="#4B0082"; //indigo
			else ctx.fillStyle="#9400D3"; //dark violet
			ctx.fillRect(margin+buffer+(fs*3)+bezel, position+fs*3+bezel, l*percent-bezel*2, fs-bezel*2); //inner box
		}

		writeMessage(ctx, player.atk, WHITE, offset+margin+buffer+(fs*3), position, fs);
		writeMessage(ctx, player.def, WHITE, offset+margin+buffer+(fs*3), position+fs, fs);
		writeMessage(ctx, player.spd, WHITE, offset+margin+buffer+(fs*3), position+(fs*2), fs);
		writeMessage(ctx, player.rcv, WHITE, offset+margin+buffer+(fs*3), position+(fs*3), fs);

		//draw messages
		if (state == INPLAY) {
			for(var i=0; i<messages.length; i++) {
				if (messages[i].delay <= 0) {
					if (messages[i].type < 0) {
						ctx.drawImage(messages[i].message, 512, 0, 64, 64, messages[i].x, messages[i].y, messages[i].w, messages[i].h);
					}
					else {
						var move = _height/350;
						messages[i].y -= move;
						writeMessage(ctx, messages[i].message, messages[i].type, messages[i].x, messages[i].y, messages[i].s);
					}

					if (messages[i].ticks++ >= messages[i].duration) messages.splice(i--, 1); //remove
				}
			}
		}

		//draw logo
		if (state == WAITING) {
			var w = _width*.9;
			var h = w * .8
			var margin = _width*.05;
			
			drawBox(ctx, 20, margin, _height*SCREENRATIO/2 - h/2, w, h);
			drawBox(ctx, 20, margin, _height*.9/2 - h/2 - w*.29, w, w*.19);

			var txt = "rubik rpg";
			var fs = Math.floor(w/(txt.length+6));
			writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, _height*.9/2 - h/2 - w*.29 + (w*.19 - fs)/2, fs);

			var txt = "tap to begin";
			if (stage > 0) txt = "tap to continue";
			var fs = _width / (txt.length+2);
			if (Math.round(_frame/5)% 2 == 1) writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, _height*SCREENRATIO/2 + h/2 + fs*2, fs);

			var interval = 25;

			//tutorial
			fs = Math.floor(w/20);
			var buffer = fs/2;
			var starth = _height*SCREENRATIO/2 - h/2;
			if (tutorial/interval < 1) {
				var txt = "how to play";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);
				var txt = "tap to attack";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(2)), fs);

				var txt = "watch your health";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(7/2)), fs);
				var txt = "bar, enemies tend";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(9/2)), fs);
				var txt = "to attack back";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(11/2)), fs);

				var txt = "Item Chest";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);

				var index = 17;//brown
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(37/4)), fs*3, fs*3);

				var txt = "tap chests for";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(25/2)), fs);
				var txt = "loot but lookout";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(27/2)), fs);
				var txt = "for trapped chests";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(29/2)), fs);
			}
			else if (tutorial/interval < 2) {
				var txt = "how to play";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);
				var txt = "when the special";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(2)), fs);
				var txt = "bar is full";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(3)), fs);
				var txt = "long press to";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(9/2)), fs);
				var txt = "petrify enemies";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(11/2)), fs);

				var txt = "Petrified Enemies";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);

				var index = 22;//gray
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(37/4)), fs*3, fs*3);

				var txt = "petrified enemies";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(25/2)), fs);
				var txt = "cannot heal or";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(27/2)), fs);
				var txt = "be attacked";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(29/2)), fs);
			}
			else if (tutorial/interval < 3) {
				var txt = "Soldier";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);

				var index = 23;//black
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(7/4)), fs*3, fs*3);

				var txt = "A weak enemy,";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(5)), fs);
				var txt = "The most common";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(6)), fs);
				var txt = "in the dungeon";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(7)), fs);

				var txt = "Advanced Soldier";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);

				var index = 5;//green
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(37/4)), fs*3, fs*3);

				var txt = "stronger than a";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(25/2)), fs);
				var txt = "regular soldier";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(27/2)), fs);
				var txt = "but less common";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(29/2)), fs);
			}
			else if (tutorial/interval < 4) {
				var txt = "Commander";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);

				var index = 2;//gold
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(7/4)), fs*3, fs*3);

				var txt = "A strong enemy.";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(5)), fs);
				var txt = "Unlocks the boss";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(6)), fs);
				var txt = "when defeated";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(7)), fs);

				var txt = "Mage";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);

				var index = 14;//purple
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(37/4)), fs*3, fs*3);

				var txt = "Also strong,";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(25/2)), fs);
				var txt = "A mage summons";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(27/2)), fs);
				var txt = "reinforcements";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(29/2)), fs);
			}
			else if (tutorial/interval < 5) {
				var txt = "Boss";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);

				var index = 10;//blue
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(7/4)), fs*3, fs*3);

				var txt = "The strongest enemy";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(5)), fs);
				var txt = "Only 1 per dungeon";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(13/2)), fs);
				var txt = "The Boss is";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);
				var txt = "stronger the more";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(9)), fs);
				var txt = "enemies that remain";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(10)), fs);

				var txt = "Defeat the boss";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(12)), fs);
				var txt = "to clear";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(13)), fs);
				var txt = "the dungeon";
				writeMessage(ctx, txt, PINK, (_width-fs*txt.length)/2, starth + (fs*(14)), fs);

			}
			else if (tutorial/interval < 6) {
				var txt = "Be careful";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);
				var txt = "The further down";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(2)), fs);
				var txt = "you go the";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(3)), fs);
				var txt = "stronger enemies";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(4)), fs);
				var txt = "get and the more";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(5)), fs);
				var txt = "mages show up";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(6)), fs);

				var txt = "tip";
				writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, starth + (fs*(8)), fs);

				var index = 14;//purple
				ctx.drawImage(resourceRepository.tileSheet, 64*(index%8)+1, 64*Math.floor(index/8)+1, 63, 63, w/2 - fs/2, starth + (fs*(37/4)), fs*3, fs*3);

				var txt = "mages cannot";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(25/2)), fs);
				var txt = "summon enemies";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(27/2)), fs);
				var txt = "when petrified";
				writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(29/2)), fs);
			}
			else tutorial = 0;
		}
		else if (state == PAUSED) {
			var w = _width*.9;
			var h = w * .8
			var margin = _width*.05;
			
			drawBox(ctx, 20, margin, _height*.9/2 - h/2 - w*.29, w, w*.19);
		
			var txt = "rubik rpg";
			var fs = Math.floor(w/(txt.length+6));
			writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, _height*.9/2 - h/2 - w*.29 + (w*.19 - fs)/2, fs);
			
			var txt = "tap to resume";
			var fs = _width / (txt.length+2);
			if (Math.round(_frame/5)% 2 == 1) writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, _height*SCREENRATIO/2 + h/2 + fs*2, fs);
			var txt = "paused";
			var fs = _width / (txt.length+2);
			writeMessage(ctx, txt, SUPER, (_width-fs*txt.length)/2, _height*SCREENRATIO/2 - fs/2, fs);
		}
		else if (state == FAILED) {
			if (!hardcore) {
				var txt = "penalty";
				var fs = Math.floor(_width/(txt.length+2));
				var starty = (_height*SCREENRATIO-fs*6)/2;
				var startx = (_width-(fs*txt.length))/2;
				writeMessage(ctx, txt, RED, (_width-(fs*txt.length))/2, starty, fs);

				txt = atkloss+" atk";
				writeMessage(ctx, txt, RED,(_width-(fs*txt.length))/2, starty+fs, fs);
				txt = defloss+" def";
				writeMessage(ctx, txt, RED, (_width-(fs*txt.length))/2, starty+fs*2, fs);
				txt = spdloss+" spd";
				writeMessage(ctx, txt, RED, (_width-(fs*txt.length))/2, starty+fs*3, fs);
				txt = rcvloss+" rcv";
				writeMessage(ctx, txt, RED, (_width-(fs*txt.length))/2, starty+fs*4, fs);
				txt = (newbalance-oldbalance)+" gld";
				writeMessage(ctx, txt, RED, (_width-(fs*txt.length))/2, starty+fs*5, fs);
			}
			else {
				var w = _width*.9;
				var h = w * .8
				var margin = _width*.05;

				var fs = Math.floor(w/16);
				var buffer = fs/2;
				var starth = _height*SCREENRATIO/2 - fs*(5);
				drawBox(ctx, 20, margin, starth, w, fs*10);
				
				var txt = "game over";
				var fs2 = Math.floor(_width/(txt.length+2));
				var starty = (_height*SCREENRATIO-fs2*5)/2;
				var startx = (_width-(fs2*txt.length))/2;
				writeMessage(ctx, txt, RED, (_width-(fs2*txt.length))/2, starty, fs2);

				var txt = "stages";
				writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(3)), fs);
				txt = ""+(stage+1);
				writeMessage(ctx, txt, PINK, margin+w-(fs*(txt.length+1)), starth + (fs*(3)), fs);

				var txt = "spawns";
				writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(9/2)), fs);
				txt = ""+summons;
				writeMessage(ctx, txt, PINK, margin+w-(fs*(txt.length+1)), starth + (fs*(9/2)), fs);
			
				var txt = "balance";
				writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(6)), fs);
				txt = ""+(newbalance+oldbalance);
				writeMessage(ctx, txt, YELLOW, margin+w-(fs*(txt.length+1)), starth + (fs*(6)), fs);
				
				if (!hardcore) {
					var txt = "deaths";
					writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(15/2)), fs);
					txt = ""+deaths;
					var fc = PINK;
					if (deaths > 0) fc = RED;
					writeMessage(ctx, txt, fc, margin+w-(fs*(txt.length+1)), starth + (fs*(15/2)), fs);
				}
			}

			fs = Math.floor((_width*.9)/16);

			if (typeof(Storage) !== "undefined") {
				txt = "saving...";
				if (Math.round(_frame/5)% 2 == 1) writeMessage(ctx, txt, WHITE, _width-(fs*(txt.length)), _height*SCREENRATIO-fs*(3/2), fs);
			}
			else {
				txt = "saving failed";
				writeMessage(ctx, txt, RED, _width-(fs*(txt.length)), _height*SCREENRATIO-fs*(3/2), fs);
			}

			if (_frame > 24) {
				if (!hardcore) {
					//death penalty
					player.atk -= atkloss;
					player.def -= defloss;
					player.spd -= spdloss;
					player.rcv -= rcvloss;

					player.currentxp = 0;
					displayedxp = 0;
					newbalance = oldbalance;

					player.act = 0;

					player.currenthp = player.hp;

					_frame = 0;
					deaths++;
				}
				else {
					oldbalance = 0;
					stage = 0;
					summons = 0;
					deaths = 0;
					player = {hp: MINHP, currenthp: MINHP, xp: 1, currentxp : 0, atk: MINATK, def: MINDEF, spd: MINSPD, rcv: MINRCV, act: 99, spl: 0, statuseffect: NORMAL};
					
					baseatk = 5, basedef = 5, basespd = 1, basercv = 1, basehp = 10;

					displayedxp = 0;
				}
				save();
				//notify(false); //stage failed
				reset();
				
			}
		}
		else if (state == SUCCESS) {
			var w = _width*.9;
			var h = w * .8
			var margin = _width*.05;
			
			drawBox(ctx, 20, margin, _height*.9/2 - h/2 - w*.29, w, w*.19);

			var txt = "rubik rpg";
			var fs = Math.floor(w/(txt.length+6));
			writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, _height*.9/2 - h/2 - w*.29 + (w*.19 - fs)/2, fs);

			fs = Math.floor(w/16);
			var buffer = fs/2;
			var starth = _height*SCREENRATIO/2 - fs*(9/2);
			drawBox(ctx, 20, margin, starth, w, fs*9);

			var txt = "stage cleared";
			writeMessage(ctx, txt, SUPER, (_width-fs*txt.length)/2, starth + (fs*(1/2)), fs);

			var txt = "stages";
			writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(3)), fs);
			txt = ""+(stage+1);
			writeMessage(ctx, txt, PINK, margin+w-(fs*(txt.length+1)), starth + (fs*(3)), fs);

			var txt = "spawns";
			writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(9/2)), fs);
			txt = ""+summons;
			writeMessage(ctx, txt, PINK, margin+w-(fs*(txt.length+1)), starth + (fs*(9/2)), fs);
		
			
			var txt = "balance";
			writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(6)), fs);
			txt = ""+(newbalance+oldbalance);
			writeMessage(ctx, txt, YELLOW, margin+w-(fs*(txt.length+1)), starth + (fs*(6)), fs);
			
			if (!hardcore) {
				var txt = "deaths";
				writeMessage(ctx, txt, WHITE, margin+fs, starth + (fs*(15/2)), fs);
				txt = ""+deaths;
				var fc = PINK;
				if (deaths > 0) fc = RED;
				writeMessage(ctx, txt, fc, margin+w-(fs*(txt.length+1)), starth + (fs*(15/2)), fs);
			}

			if (typeof(Storage) !== "undefined") {
				txt = "saving...";
				if (Math.round(_frame/5)% 2 == 1) writeMessage(ctx, txt, WHITE, _width-(fs*(txt.length)), _height*SCREENRATIO-fs*(3/2), fs);
			}
			else {
				txt = "saving failed";
				writeMessage(ctx, txt, RED, _width-(fs*(txt.length)), _height*SCREENRATIO-fs*(3/2), fs);
			}

			if (_frame > 25) {
				stage++;
				_frame = 0;
				baseatk = player.atk;
				basedef = player.def;
				basespd = player.spd;
				basercv = player.rcv;
				basehp = player.hp;

				save();
				reset();
			}
		}
		else if (state == SAVE) {
			var w = _width*.9;
			var h = w * .8
			var margin = _width*.05;
			drawBox(ctx, 20, margin, _height*.9/2 - h/2 - w*.29, w, w*.19);

			var txt = "rubik rpg";
			var fs = Math.floor(w/(txt.length+6));
			writeMessage(ctx, txt, LOGO, (_width-fs*txt.length)/2, _height*.9/2 - h/2 - w*.29 + (w*.19 - fs)/2, fs);

			fs = Math.floor(w/20);
			
			var buffer = fs/2;
			var starth = (_height-(fs*7))/2;
			drawBox(ctx, 20, margin, starth, w, fs*(6));

			var bh = fs*2;

			var txt = "save found!";
			writeMessage(ctx, txt, WHITE, (_width-fs*txt.length)/2, starth + (fs*(1)), fs);
			
			w -= fs;

			btnload.init("load", margin+(fs/2), starth + (fs*(3)), w/2, bh);
			btnload.draw(ctx);

			btnnew.init("discard", margin+(fs/2)+w/2, starth + (fs*(3)), w/2, bh);
			btnnew.draw(ctx);
		}
	};

	save = function() {
		if (typeof(Storage) !== "undefined") {
			// Code for localStorage/sessionStorage.
			localStorage.setItem("hp", player.hp);
			localStorage.setItem("currenthp", player.currenthp);
			localStorage.setItem("xp", player.xp);
			localStorage.setItem("currentxp", player.currentxp);
			localStorage.setItem("spl", player.spl);
			localStorage.setItem("atk", player.atk);
			localStorage.setItem("def", player.def);
			localStorage.setItem("spd", player.spd);
			localStorage.setItem("rcv", player.rcv);
			localStorage.setItem("stage", stage);
			localStorage.setItem("balance", newbalance);
			localStorage.setItem("deaths", deaths);
			localStorage.setItem("enemies", (0));
			localStorage.setItem("summons", summons);
		}
		else {
		  // Sorry! No Web Storage support..
		}
	};

	load = function() {
		player = {hp: Number(localStorage.getItem("hp")), currenthp: Number(localStorage.getItem("currenthp")), xp: Number(localStorage.getItem("xp")), currentxp : Number(localStorage.getItem("currentxp")), atk: Number(localStorage.getItem("atk")), def: Number(localStorage.getItem("def")), spd: Number(localStorage.getItem("spd")), rcv: Number(localStorage.getItem("rcv")), act: 99, spl: Number(localStorage.getItem("spl"))};
		newbalance = Number(localStorage.getItem("balance"));
		enemiesdefeated = Number(localStorage.getItem("enemies"));
		summons = Number(localStorage.getItem("summons"));
		deaths = Number(localStorage.getItem("deaths"));
		stage = Number(localStorage.getItem("stage"));

		baseatk = player.atk;
		basedef = player.def;
		basespd = player.spd;
		basercv = player.rcv;
		basehp = player.hp;
	}

	levelup = function() {
		player.xp = Math.ceil(player.xp+XPRATE);
		player.hp += Math.round(1 + Math.random() * (player.hp * 0.1));
		player.currenthp = player.hp;
		player.atk += Math.round(1 + Math.random());
		player.def += Math.round(1 + Math.random());
		player.spd += Math.round(1 + Math.random());
		player.rcv += Math.round(1 + Math.random());

		var m = new Message();
		var txt = "status up";
		var fs = Math.floor(_width/(txt.length+2));
		var starty = (_height-fs)/2;
		var startx = (_width-(fs*txt.length))/2;
		m = {type: SUPER, message: txt, x: startx, y: starty, s: fs, duration: 2, tick: 0, delay: 0};
		messages.push(m);
	};

	reset = function() {
		bonus = -1;
		locked = true;
		cleared = false;

		messages.splice(0, messages.length);
		defeated.splice(0, defeated.length);
		injured.splice(0, injured.length);
		mages.splice(0, mages.length);
		chests.splice(0, chests.length);
		statuseffects.splice(0, statuseffects.length);
		model.init(6, Math.floor((_height*SCREENRATIO) / (_width / 6)));

		for (var i=0;i<model.getWidth(); i++) {
			for (var j=0; j<model.getHeight(); j++) {
				model.set(i, j, generateEnemy());
			}
		}

		//stageboss (1 per stage)
		var temp = new Entity();
		temp = {hp: baseatk*7, currenthp: baseatk*7, xp: 5*(stage+1), atk: Math.floor(baseatk*BOSSRATIO+1), def: Math.floor(basedef*BOSSRATIO+1), spd: 1, rcv: Math.floor(basercv*BOSSRATIO+1), act: 0, statuseffect: NORMAL, sts: 0, type: BOSS};
		var x = Math.floor(Math.random()*model.getWidth());
		var y = Math.floor(Math.random()*model.getHeight());
		model.set(x, y, temp);
		stageboss = {x: x, y: y};

		//teamleader (at least 1 per stage)
		var temp = new Entity();
		temp = {hp: baseatk*5, currenthp: baseatk*5, xp: 3*(stage+1), atk: Math.floor(baseatk*ADVRATIO+1), def: Math.floor(basedef*ADVRATIO+1), spd: 1, rcv: Math.floor(basercv*ADVRATIO+1), act: 0, statuseffect: NORMAL, sts: 0, type: ADVANCED};
		var x = stageboss.x;
		var y = stageboss.y;
		do {
			x = Math.floor(Math.random()*model.getWidth());
			y = Math.floor(Math.random()*model.getHeight());
		} while (x == stageboss.x || y == stageboss.y);
		model.set(x, y, temp);

		state = WAITING;
		tutorial = 0;
	};

	generateEnemy = function() {
		var temp = new Entity();
		var t = Math.floor((Math.random()*100)+1);
		if (t>= 70) {
			if (t > 95) {
				//advanced enemies (~5%)
				temp = {hp: baseatk*5, currenthp: baseatk*5, xp: 3*(stage+1), atk: Math.floor(baseatk*ADVRATIO+1), def: Math.floor(basedef*ADVRATIO+1), spd: 1, rcv: Math.floor(basercv*ADVRATIO+1), act: 0, statuseffect: NORMAL, sts: 0, type: ADVANCED};
			}
			else {
				//intermediate enemies (~25%)
				temp = {hp: baseatk*4, currenthp: baseatk*4, xp: 2*(stage+1), atk: Math.floor(baseatk*INTRATIO+1), def: Math.floor(basedef*INTRATIO+1), spd: 1, rcv: Math.floor(basercv*INTRATIO+1), act: 0, statuseffect: NORMAL, sts: 0, type: INTERMEDIATE};
			}
		}
		else {
			//basic enemies (~70%)
			temp = {hp: baseatk*3, currenthp: baseatk*3, xp: 1*(stage+1), atk: Math.floor(baseatk*BASICRATIO+1), def: Math.floor(basedef*BASICRATIO+1), spd: 1, rcv: Math.floor(basercv*BASICRATIO+1), act: 0, statuseffect: NORMAL, sts: 0, type: BASIC};
		}
		return temp;
	};

	setVolume = function(v) {
			volume = v;
			resourceRepository.gameover.volume = volume;
			resourceRepository.levelup.volume = volume;
			resourceRepository.cleared.volume = volume;
			resourceRepository.spawn.volume = volume;
			resourceRepository.acquire.volume = volume;
			resourceRepository.boom.volume = volume;
	};

	isInjured = function(x,y) {
		var isinjured = false;
		for(var i=0; i<injured.length; i++) {
			if (x == injured[i].x && y == injured[i].y) isinjured = true;
		}
		return isinjured;
	};
	
	defeatEnemy = function(x,y) {
		var enemy = model.get(x,y);
		
		var m = new Message();
		var fs = _width/model.getWidth()/3;
		var txt = ""+bounties[enemy.type]+"g";
		m = {type: YELLOW, message:txt, x: x*(_width/model.getWidth())+fs*Math.random(), y: y*(_width/model.getWidth())-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
		messages.push(m);
		
		newbalance += bounties[enemy.type];
			
		if (enemy.type == BOSS) {
			//boss defeated
			enemy.type = CHEST;
			enemy.act = 0;
			var p = new Point();
			p = {x: x,y: y};
			chests.push(p);
			cleared = true;
		}
		else if (enemy.type == MAGE) {
			//mage defeated
			for (var j=0; j<mages.length; j++) {
				if (mages[j].x == x && mages[j].y == y) mages.splice(j,1);
			}
			enemy.type = EMPTY;
		}
		else if (enemy.type == ADVANCED) {
			locked = false;
			enemy.type = EMPTY;
		}
		else enemy.type = EMPTY;

		if (Math.floor(Math.random()*16) == 0) {
			enemy.type = CHEST;
			enemy.act = 0;
			var p = new Point();
			p = {x: x,y: y};
			chests.push(p);
		}
		else {
			var p = new Point();
			p = {x: x,y: y};
			defeated.push(p);
		}
		
		for (var j=0; j<injured.length; j++) {
			if (injured[j].x == x && injured[j].y == y) injured.splice(j,1);
		}

		player.currentxp+= enemy.xp;
	};

	this.update = function() {
		if (++_frame > 100) _frame = 0;
		if (++tutorial > 1000) tutorial = 0;
		if (state == INPLAY) {
			//regenerate hp player
			var rcv = player.rcv;
			var regen = rcv/16;
			if (player.currenthp+regen < player.hp) {
				player.currenthp += regen;
			}
			else player.currenthp = player.hp;
			//regenerate hp enemeies
			for(var i=0; i<injured.length; i++) {
				var enemy = model.get(injured[i].x, injured[i].y);
				var rcv = enemy.rcv;
				var regen = rcv/64;
				if (enemy.currenthp <= 0) {
					//enemy defeated
					
				}
				else if (enemy.currenthp+regen <= enemy.hp) {
					if (enemy.statuseffect == NORMAL) enemy.currenthp += regen;
				}
				else {
					enemy.currenthp = enemy.hp;
					injured.splice(i,1);
				}
			}
			//tick messages
			for(var i=0; i<messages.length;i++) {
				if (messages[i].delay > 0) messages[i].delay--;
				else if (messages[i].tick++ > messages[i].duration) messages.splice(i,1);
			}
			//check status effects
			for(var i=0; i<statuseffects.length; i++) {
				var remove = false;
				var temp = model.get(statuseffects[i].x, statuseffects[i].y);
				if (--temp.sts < 0) {
					temp.sts = 0;
					temp.statuseffect = NORMAL;
					remove = true;
				}
				else {
					if (temp.statuseffect == BURNED){
						//deal burn damage
						var atk = Math.round(player.atk * (1/32));
						if (atk < 1) atk = 1;//minimum damage
						temp.currenthp -= atk;
						
						var m = new Message();
						var fs = _width/model.getWidth()/3;
						m = {type: GREEN, message:atk, x: statuseffects[i].x*(_width/model.getWidth())+fs*Math.random(), y: statuseffects[i].y*(_width/model.getWidth())-fs*Math.random(), s: fs, duration: 1, tick: 0, delay: 0};
						messages.push(m);
						
						if (!isInjured(statuseffects[i].x, statuseffects[i].y)) {
							var p = new Point();
							p = {x: statuseffects[i].x,y: statuseffects[i].y};
							injured.push(p);
						}
						
						//if enemy hp <= 0 remove them
						if (temp.currenthp <= 0) {
							temp.sts = 0;
							temp.statuseffect = NORMAL
							remove = true;
							defeatEnemy(statuseffects[i].x, statuseffects[i].y);
						}
					}
				}
				model.set(statuseffects[i].x, statuseffects[i].y, temp);
				if (remove) {
					statuseffects.splice(i,1);
					i--;
				}
			}
			//mage check
			if (!cleared && defeated.length > 0 && mages.length < Math.floor(stage/2) && Math.floor(Math.random()*64) == 0) {
				//spawn mage
				var temp = new Entity();
				temp = {hp: baseatk*5, currenthp: baseatk*5, xp: 4*(stage+1), atk: Math.floor(baseatk*MAGERATIO+1), def: Math.floor(basedef*MAGERATIO+1), spd: 1, rcv: Math.floor(basercv*MAGERATIO+1), statuseffect: NORMAL, sts: 0, act: 0, type: MAGE};

				var m = new Message();
				var fs = _width/model.getWidth()/3;
				m = {type: BLUE, message: "mage spawn", x: defeated[0].x*(_width / model.getWidth()), y: defeated[0].y*((_height*SCREENRATIO) / model.getHeight()), s: fs, duration: 2, tick: 0, delay: 0};
				messages.push(m);
				if (!mute) resourceRepository.spawn.play();

				model.set(defeated[0].x, defeated[0].y, temp);
				mages.push(defeated[0]);
				defeated.splice(0,1);
			}
			//chest roulette
			for(var i=0; i<chests.length; i++) {
				var chest = model.get(chests[i].x, chests[i].y);
				if (++chest.act >= 99) chest.act = 0;
				model.set(chests[i].x, chests[i].y, chest);
			}
			//mage action
			for(var i=0; i<mages.length; i++) {
				var mage = model.get(mages[i].x, mages[i].y);
				if (mage.statuseffect == NORMAL) mage.act++;
				if (mage.act >= 89) {
					if (defeated.length > 0) {
						//summon
						summons++;
						model.set(defeated[0].x, defeated[0].y, generateEnemy());

						var m = new Message();
						m = {type: BLUE, message: "summon", x: defeated[0].x*(_width / model.getWidth()), y: defeated[0].y*((_height*SCREENRATIO) / model.getHeight()), s: fs, duration: 2, tick: 0, delay: 0};
						messages.push(m);
						if (!mute) resourceRepository.spawn.play();

						defeated.splice(0,1);
					}
					mage.act = 0;
				}
				model.set(mages[i].x, mages[i].y, mage);
			}
		}
	};
}
