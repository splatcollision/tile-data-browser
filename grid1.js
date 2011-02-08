

function flatten(arr) {
	return arr.reduce(function(a,b) { return a.concat(b); });
}


// userViewport
var uv = {width: document.width, height: document.height}; 
uv.centerX = uv.width / 2;
uv.centerY = uv.height / 2;


// gridView
var gv = document.getElementById('gridview');
var gvOrigin = gv.style.webkitTransform;
var gvCenter = gv.style.webkitTransform;  // will be reset in setcenter

var userCoords = [0,0]; // x,y accumulated 
var centerCoords = [0,0]; 
var ready = false;
var anim = true;


function itemClick (evt) {
//	console.log('itemClick');
	if (!ready) return;
	ready = false;
	var item = evt.srcElement.raphael;
	item.attr({stroke: '#FF0000'}).animate({stroke: 'rgb(0,0,0)'},2000);
	
	var distx = (item.node.datax - centerCoords[0]);
	var disty = (item.node.datay - centerCoords[1]);
	userCoords[0] += distx;
	userCoords[1] += disty;
	
	var speed = Math.floor(Math.sqrt((distx * distx) + (disty * disty)));
	console.log('speed = ' + speed);
//	document.getElementById('display').innerHTML = 'Coordinates: x ' + userCoords[0] + ', y ' + userCoords[1];
	
	if (anim) {
		movetocenter(item, speed);	
	} else {
		getpixeldata(userCoords);
		ready = true;
	}
}

function movetocenter (item, spd) {
	//console.log(item.attrs.x + ' ' + item.attrs.y);

	moveby({x: -item.attrs.x + uv.centerX - (itemsize.w / 2), y: -item.attrs.y + uv.centerY - (itemsize.h / 2)}, spd);
}

function setcenter (item) {
	//console.log('setcenter');
	movetocenter(item);
	gvCenter = gv.style.webkitTransform;
	gv.style.cssText += '-webkit-transition-property: all;-webkit-transition-duration: 0ms;';
	centerCoords[0] = userCoords[0] = item.node.datax;
	centerCoords[1] = userCoords[1] = item.node.datay;
}

function resetgrid () {
	//console.log(gv.style.cssText);
	gv.style.cssText = gv.style.cssText.replace(/[0-9]{1,}ms/,'0ms');
	//console.log(gv.style.cssText);
	gv.style.webkitTransform = new WebKitCSSMatrix(gvCenter);
	
	getpixeldata(userCoords);
	ready = true;
//	gv.style.cssText += '-webkit-transition-property: all;-webkit-transition-duration: 1500ms;';
}

function moveby (vec,speed) {

	
	var time = 150;
	if (speed) time += (speed * 50);
	console.log('time ' + time);
//	var dist = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y)); 
//	var dist = ;
//	console.log(vec.x + ' ' + vec.y);
	
	// bigger vectors = bigger time = consistent speed
	gv.style.cssText = gv.style.cssText.replace(/0ms/, time+'ms');
	var newxform = new WebKitCSSMatrix(gvOrigin).translate(vec.x, vec.y);
	gv.style.webkitTransform = newxform;
	
	
	window.setTimeout('resetgrid()',time);
}

var itemsize = {w: 60, h: 45, m: 4};

// calc number of items needed for an infinite grid	
var gridSize = {w: parseInt(uv.width / itemsize.w) * 2, h: parseInt(uv.height / itemsize.h) * 2}

// draw grid of items
var gridview = Raphael('gridview',gridSize.w * (itemsize.w + itemsize.m),gridSize.h * (itemsize.h + itemsize.m));
	

// store?
rects = [];
rectCols = [];

for (var i = 0; i < gridSize.w; i++) {
	var rectCols = [];
	for (var j = 0; j < gridSize.h; j++) {
		var newrect = gridview.rect(i * (itemsize.w + itemsize.m) , j * (itemsize.h + itemsize.m),itemsize.w,itemsize.h).attr({fill: 'rgb(168,168,168)'}).click(itemClick);
		newrect.node.datax = i;
		newrect.node.datay = j;
		//var newtext = gridview.text(i * 50 , j * 40, 'x').attr({fill: '#000000'}); // too slow!
		rectCols.push({x: i, y: j, rect: newrect});
	}
	rects.push(rectCols);
}

setcenter(rects[parseInt(gridSize.w / 2)][parseInt(gridSize.h / 2)].rect);
rects[parseInt(gridSize.w / 2)][parseInt(gridSize.h / 2)].rect.attr({stroke: '#000000'}).animate({stroke: 'rgb(0,255,0)'},1500);
//console.log(rects.length);


var coords = Raphael('coords', uv.width, uv.height);

coords.rect(uv.centerX, 0, 1, uv.height);
coords.rect(0, uv.centerY, uv.width, 1);


// data set here - use a canvas with an image

var back = document.createElement('canvas');
var backcontext = back.getContext('2d');
var dataDim = {};
var dataCenter = {}


var img = new Image();
img.onload = function() {
	loadpixeldata(img);
};
img.setAttribute("src", "19-minutes-heatmap_xhair.png");


function loadpixeldata (img) {
//	gCanvas = back;
	dataDim = {w: img.width, h: img.height};
	dataCenter = {x: parseInt(dataDim.w / 2), y: parseInt(dataDim.h / 2)};
	
	back.width = dataDim.w;
	back.height = dataDim.h;
	var ctx = back.getContext("2d");
	ctx.clearRect(0, 0, dataDim.w, dataDim.h);
	ctx.drawImage(img, 0, 0);
 
}


// need - center of data, userCoords, gridSize

function getpixeldata (offset) {

	var dataOrigX = dataCenter.x + offset[0] - (centerCoords[0] * 2) - 1;
	var dataOrigY = dataCenter.y + offset[1] - (centerCoords[1] * 2) - 1;
	userCoords  = offset; // for clicks on data overlay img
	var idata = backcontext.getImageData(dataOrigX, dataOrigY, gridSize.w, gridSize.h);
	//console.log(idata);
	var data = idata.data;
	// optimize data length here for actual visible tiles - this setup is better for UI though	
	for (var x = 0; x < gridSize.w; x++)
		for (var y = 0; y < gridSize.h; y++)
		{
			var offset = (y * gridSize.w + x) * 4;
			var r = data[offset];
			var g = data[offset+1];
			var b = data[offset+2];
			var color = 'rgb(' + r + ', ' + g + ', ' + b + ')';
			rects[x][y].rect.attr({fill: color});
	}
	
}

var imgbtn = document.getElementById('show');
imgbtn.addEventListener('click', showData, false);
//imgbtn.addEventListener('mouseup', hideData, false);
document.getElementById('data').addEventListener('click', navigateData, false);

function showData() {
	var dataimg = document.getElementById('data');
	dataimg.style.cssText = 'display: block;';
}

function hideData() {
	var dataimg = document.getElementById('data');
	dataimg.style.cssText = 'display: none;';
}

function navigateData(evt) {
//	console.log('navigateData');
	// get coords of click
//	var clickLoc = {x: evt.x + ' '
	var xP = evt.x / uv.width;
	var yP = evt.y / uv.height;
	var dataX = parseInt(xP * dataDim.w) - dataCenter.x + centerCoords[0];
	var dataY = parseInt(yP * dataDim.h) - dataCenter.y + centerCoords[1];
//	console.log(dataX + ' ' + dataY);
	getpixeldata([dataX,dataY]);
	hideData();
}

function keycontrols(evt) {
	var key = evt.keyCode;
	var mult = 1;
	if (evt.shiftKey) mult = 10;
	switch (key) {
		case 37:
			// left arrow
			userCoords[0] -= 1 * mult;
//			userCoords[1] += disty;
			getpixeldata(userCoords);
			break;
		case 39:
			// right arrow
			userCoords[0] += 1 * mult;
//			userCoords[1] += disty;
			getpixeldata(userCoords);
			break;
		case 38: 
			// up arrow
//			userCoords[0] -= 1 * mult;
			userCoords[1] -= 1 * mult;
			getpixeldata(userCoords);
			break;
		case 40:
			// down arrow
//			userCoords[0] -= 1 * mult;
			userCoords[1] += 1 * mult;
			getpixeldata(userCoords);
			break;
		case 32:
			// space  - toggle a brief drag arbitrary vector with coasting?
			break;
	}
}


document.addEventListener('keydown', keycontrols, false);

/*

			Event.observe(document, 'keydown', function (evt){

				var key = evt.keyCode;
				if (!this.observeKeys) { 
					return;

				}

		//	console.log("KEYCODE pressed: '" +  key + "'");

				switch (key) {
					

					case 13:
						// return

						break;
					case 8:
						// delete
						Editor.deleteSelection();
						evt.preventDefault();  // stop back navigation?
						Event.stop(evt);
						
					    evt.returnValue = false;
						break;

					case 32:
						// space
						Editor.spacebar = true;
						// tell timeline to play/pause?
						if (!Editor.mouseisdown) {
							Editor.Timeline.playback();
						}
						evt.preventDefault();  // stop back navigation?
						Event.stop(evt);
						
					    evt.returnValue = false;
					
					
						break;
						
					case 71:
						// "g"
						
						Editor.DocGrid.toggle();
					case 86:
						// v
						//editor_timeline.toolModeSelect();
						//editor_timeline.setToolbar("Select");
						break;
					case 69:
						// e
						//editor_timeline.toolModeDrawRects();
						//editor_timeline.setToolbar("NewShape");
						break;

					case 37:
						// left arrow

						Editor.tweakSelection(-1,0,evt);
						break;
					case 39:
						// right arrow
						Editor.tweakSelection(1,0,evt);
						break;
					case 38: 
						// up arrow
						Editor.tweakSelection(0,-1,evt);
						break;
					case 40:
						// down arrow
						Editor.tweakSelection(0,1,evt);
						break;
				}

			}.bind(this));
			
			*/