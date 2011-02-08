

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
//	console.log('speed = ' + speed);
//	document.getElementById('display').innerHTML = 'Coordinates: x ' + userCoords[0] + ', y ' + userCoords[1];
	
	if (anim) {
		movetocenter(item, speed);	
	} else {
		getpixeldata(userCoords);
		ready = true;
	}
}

function dataviewclick (evt) {
	// alternate - clicked on a DOM element with all the domtiles
//	console.log('dataviewclick');
//	console.log(evt.target.id); // 'rowxcolx' or 'textdata'
	
	if (!ready) return;
	ready = false;
	if (evt.target.id == 'textdata') {
//		console.log('between items click');
		ready = true;
		return;
	}
	var re = /row([0-9]{1,})col([0-9]{1,})/;
	var coords = re.exec(evt.target.id);
	
	if (coords) {
		var distx = parseInt(coords[2]) - Math.floor(centerCoords[0] / 2) + adjustW;
		var disty = parseInt(coords[1]) - Math.floor(centerCoords[1] / 2) + adjustH;
		userCoords[0] += distx;
		userCoords[1] += disty;
		if (anim) {
			var speed = Math.floor(Math.sqrt((distx * distx) + (disty * disty)));
			dataview.style.cssText = dataview.style.cssText.replace(/block/, 'none');
			// find svg item under me
			var col = parseInt(gridSize.w / 2) + distx;
			var row = parseInt(gridSize.h / 2) + disty;
			var item = rects[col][row].rect;
			//console.log(item);
			movetocenter(item, speed);
		} else {
			getpixeldata(userCoords);
			ready = true;
		}
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
	dataview.style.cssText = dataview.style.cssText.replace(/none/, 'block');
	ready = true;
//	gv.style.cssText += '-webkit-transition-property: all;-webkit-transition-duration: 1500ms;';
}

function moveby (vec,speed) {

//	console.log('moveby vec.x:' + vec.x + ' vec.y: ' + vec.y);
	var time = 150;
	if (speed) time += (speed * 50);
//	console.log('time ' + time);
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


var visibleGridSize = {w: parseInt(uv.width / (itemsize.w + itemsize.m)), h: parseInt(uv.height / (itemsize.h + itemsize.m))};
var gridSize = {w: visibleGridSize.w * 2, h: visibleGridSize.h * 2};

//console.log('viz grid tester: W' + visibleGridSize.w);
//console.log('viz grid tester: H' + visibleGridSize.h);
var adjustW = (visibleGridSize.w % 2 == 0) ? 1 : 0;  // for even values of W  even = 2 odd = 1
var adjustH = (visibleGridSize.h % 2 == 0) ? 1 : 0;  
visibleGridSize.w -= adjustW;
visibleGridSize.h -= adjustH;



// draw grid of items
var gridview = Raphael('gridview',gridSize.w * (itemsize.w + itemsize.m),gridSize.h * (itemsize.h + itemsize.m));

var dataview = document.getElementById('textdata');
//console.log(dataview);
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

		// new dom ele for text overlays
		
	}
	
	rects.push(rectCols);
}

// second pass just visible area please
for (var i = 0; i < visibleGridSize.h; i++) {
	for (var j = 0; j < visibleGridSize.w; j++) {
		dataview.innerHTML += '<div id="row' + i + 'col' + j + '" class="domtile">' + i + ' x ' + j + '</div>';		
	}
	dataview.innerHTML += '<br>';
}

var dataViewOffset = {x: (uv.width - (visibleGridSize.w * (itemsize.w + itemsize.m))) / 2, y: (uv.height - (visibleGridSize.h * (itemsize.h + itemsize.m))) / 2};
//console.log(dataViewOffset.x + ' ' + dataViewOffset.y);
// align the text data overlay with the main grid
dataview.style.cssText += 'left: ' + dataViewOffset.x + 'px; top: ' + dataViewOffset.y + 'px; display: block;'; 


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
	setcenter(rects[parseInt(gridSize.w / 2)][parseInt(gridSize.h / 2)].rect);
};
img.setAttribute("src", "19-minutes-heatmap_xhair.jpg");


function loadpixeldata (img) {
//	gCanvas = back;
	dataDim = {w: img.width, h: img.height};
	dataCenter = {x: parseInt(dataDim.w / 2), y: parseInt(dataDim.h / 2)};
	
	back.width = dataDim.w;
	back.height = dataDim.h;
	var ctx = back.getContext("2d");
	ctx.clearRect(0, 0, dataDim.w, dataDim.h);
	ctx.drawImage(img, 0, 0);
 	ready = true;
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
	gettextdata(dataOrigX, dataOrigY);
}


function gettextdata (offsetx,offsety) {
	// second pass just visible area please
//	console.log(offsetx);
	
	var startRow = offsetx + (gridSize.w / 2 - visibleGridSize.w / 2) + 0.5;
	var startCol = offsety + (gridSize.h / 2 - visibleGridSize.h / 2) + 0.5;
	for (var i = 0; i < visibleGridSize.h; i++) {
		for (var j = 0; j < visibleGridSize.w; j++) {
			var id = 'row' + i + 'col' + j;
			var ele = document.getElementById(id);
			ele.innerHTML = (startRow + j) + ' x ' + (startCol + i);
		}
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
	var xP = evt.x / uv.width;  // p of click compared to user viewport
	var yP = evt.y / uv.height;
	var dataX = parseInt(xP * dataDim.w) - dataCenter.x + centerCoords[0];  // translate that p to data size
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
dataview.addEventListener('click', dataviewclick, false);