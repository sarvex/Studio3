
// @codekit-prepend "Studio/Requirements.js"

// @codekit-append "Studio/Components/Box.js"
// @codekit-append "Studio/Components/Color.js"
// @codekit-append "Studio/Components/DisplayProperty.js"

// @codekit-append "Studio/Components/LinkedList.js"
// @codekit-append "Studio/Components/Plugin.js"
// @codekit-append "Studio/Components/Image.js"
// @codekit-append "Studio/Components/Cache.js"
// @codekit-append "Studio/Components/Ease.js"

// @codekit-append "Studio/DisplayObjects/DisplayObject.js"

// @codekit-append "Studio/DisplayObjects/DisplayList.js"
// @codekit-append "Studio/DisplayObjects/Rect.js"
// @codekit-append "Studio/DisplayObjects/Clip.js"
// @codekit-append "Studio/DisplayObjects/CircleClip.js"
// @codekit-append "Studio/DisplayObjects/Restore.js"
// @codekit-append "Studio/DisplayObjects/Circle.js"
// @codekit-append "Studio/DisplayObjects/Sprite.js"
// @codekit-append "Studio/DisplayObjects/Camera.js"
// @codekit-append "Studio/DisplayObjects/Scene.js"
// @codekit-append "Studio/DisplayObjects/Stage.js"
// @codekit-append "Studio/DisplayObjects/TextBox.js"
// @codekit-append "Studio/DisplayObjects/Tween.js"
// @codekit-append "Studio/DisplayObjects/Pattern.js"
// @codekit-append "Studio/DisplayObjects/TileMap.js"

// @codekit-append "Studio/Effects/Standards.js"

// @codekit-append "Studio/engines/WebGL.js"
// @codekit-append "Studio/engines/Canvas.js"

// @codekit-append "Studio/Input/Keyboard.js"
// @codekit-append "Studio/Input/Touch.js"

'use strict';


if (!window.Studio) {
	window.Studio = {  // alt+S = ß just for those that hate writing things out.
		stages: [],
		stage: null,
		tko: null,
		assets: {length: 0},
		queue: 0,
		progress: 0,
		sin: Math.sin,
		cos: Math.cos,
		random: Math.random,
		abs: Math.abs,
		my: {ratio: 1},
		temp: {},
		info: {displayObjects: 0},
		active: true,
		cap: 1000 / 20, // don't let the true frame rate go below 20fps, prevent huge frame skips
		draws: 0,
		loaded: true,
		version: '0.5.1',
		now: 0, // to get around Safari not supporting performance.now() you can pull in the timestap with this property.
		delta: 0,
	};
	Studio.time = 1;
	Studio.interval = null;
	Studio.browser = navigator.userAgent.toLowerCase();
	Studio.disableRAF = false;
	Studio.RAF;
}

Studio.updateProgress = function() {
	this.progress = this.queue / this.assets.length;
};

Studio.addAsset = function(path, Who) {
	if (!this.assets[path]) {
		this.assets.length += 1;
		this.assets[path] = new Who();
		this.updateProgress();
		return true;
	} else {
		console.warn('Already loaded : ', path, Studio.assets[Who]);
		return false;
	}
};

Studio.start = function(time_stamp) {
	// Studio.stage=Studio.stages[0];
	if (Studio.queue === Studio.assets.length) {
		Studio.progress = 1;
	}
	if (time_stamp) {
		Studio.now = time_stamp;
		Studio.time = time_stamp;
		Studio.RAF = requestAnimationFrame(Studio.loop);

	} else {
		Studio.RAF = requestAnimationFrame(Studio.start);
	}
};

Studio.loop = function(time_stamp) {
	Studio.tick(time_stamp);
	Studio.draws = 0;

	// for(var m = 0; m!== Studio.stages.length; m++){
	// 	Studio.stage = Studio.stages[m];
	// 	if(Studio.stage.active){
	Studio.stage.loop(Studio.delta);
	// }
	// }
	Studio.RAF = requestAnimationFrame(Studio.loop);
};

//?? what? Something is up with the time_stamp... seems like the float gets all out of whack eventually (floats suck).
// So to get the 60fps that you know is possible (check this before hand), setting the tick to be 60fps, we manage to match
// what the console (in this case Apple TV 4) is actually outputting. Quite amazed by this really.
Studio.console = function(time_stamp) {
	this.delta = 16.6666666;
	this.now += this.delta;
};

Studio.capped = function(time_stamp) {
	this.delta = time_stamp - this.now;
	this.now = time_stamp;
	this.delta = this.cap > this.delta ? this.delta : this.cap;
};

Studio.uncapped = function(time_stamp) {
	this.delta = time_stamp - this.now;
	this.now = time_stamp;
};

Studio.tick = Studio.capped;

Studio.stopTime = function() {
	//this.time = this.now();
	//this.delta = this.frameRatio = 0;
	//this.active=false;
	// console.log('STOP');
};

Studio.resetTime = function() {
	//this.active=true;
	//this.start();
	// console.log('START');
};

Studio.handleVisibilityChange = function() {
	if (document.hidden) {
		console.log('%cStudio Paused (visibilitychange)', Studio.statStyle);
		cancelAnimationFrame(Studio.RAF);
	} else {
		console.log('%cStudio Play (visibilitychange)', Studio.statStyle);
		Studio.RAF = requestAnimationFrame(Studio.start);
	}
};

document.addEventListener('visibilitychange', Studio.handleVisibilityChange, false);

Studio.z_index = function(a, b) {
	if (a.z < b.z) {
		return -1;
	}
	if (a.z > b.z) {
		return 1;
	}
	return 0;
};

Studio.round = function(x) {
	return x + 0.5 | 0;
};

// apply(obj:Object)
// this will modify or add the current object to contain the contents of the object (obj) being passed in.

Studio.apply = function(obj) { // Display Object and a few others share this function. All children of displayObject inherit this function.
	Studio.temp.keys = Object.keys(obj); // we use Studio.temp.keys to avoid creating more garbage.
	Studio.temp.keys_i = Studio.temp.keys.length;
	while (Studio.temp.keys_i) {
		if(Studio.temp.key =='color_hex'){
			this['color'].setFromHex(obj[Studio.temp.key]);
		}
		Studio.temp.key = Studio.temp.keys[Studio.temp.keys_i - 1];
		this[Studio.temp.key] = obj[Studio.temp.key];
		Studio.temp.keys_i--;
	}
	return this;
};

// addTo()

Studio.addTo = function(a, b) {
	for (var attr in b) {
		if (b.hasOwnProperty(attr) && !a.hasOwnProperty(attr)) {
			a[attr] = b[attr];
		}
	}
};

// Studio.extend(a,b)
// A : the New Class
// B : Class to inherit attributes from.

Studio.extend = function(A, B) {
	A.prototype = new B();
	A.prototype.constructor = A;
};

Studio.Messanger = function() {
	this.listeners = [];
	this.status = 0;
};

Studio.Messanger.prototype.addListener = function(callback, who) {
	this.listeners.push({callback:callback,who:who});
	// reply back with current status when adding new listener.
	if(who){
		who[callback].call(who,this.status)
	}else{
		callback(this.status)
	}
};

Studio.Messanger.prototype.setStatus = function(message) {
	this.status = message;
	// now lets tell everyone that listens.
	var who = null;
	for (var i = 0; i < this.listeners.length; i++) {
		who = this.listeners[i].who;
		if(who){
			who[this.listeners[i].callback].call(who,this.status)
		}else{
			this.listeners[i].callback(this.status)
		}
	}
};




Studio.createPool = function(who,size,fixed){
	var pool = []
	var poolSize = size || 0

	if(who.constructor != who){
		who.constructor = who
	}

	for(var i = 0; i!= poolSize; i++){
		pool[i] = new who()
		if(pool[i].init){
			pool[i].init()
		}
	}

	who.fromPool = function(properties){
		var poolObject = pool[--poolSize]
		if (!poolObject){
			poolObject = new who()
			poolSize++
		}
		pool[poolSize] = null
		if(properties){
			poolObject.apply(properties)
		}
		return poolObject
	}

	who.prototype.intoPull = function(){
		pool[poolSize] = this
		poolSize++
	}
}



Studio.TOP = Studio.LEFT = 0;
Studio.MIDDLE = Studio.CENTER = 0.5;
Studio.BOTTOM = Studio.RIGHT = 1;

Studio.infoStyle = 'background-color: #3af; padding: 2px 4px; color: #fff';
Studio.errorStyle = 'background-color: #c01; padding: 2px 4px;';
Studio.warningStyle = 'background-color: #fd2; padding: 2px 4px;';
Studio.statStyle = 'background-color: #eee; padding: 2px 4px; color: #555; font-size: 10px';
Studio.engineStyle = 'background-color: #eee; color: #3af; padding: 1px 4px; border: 1px solid #3af';

