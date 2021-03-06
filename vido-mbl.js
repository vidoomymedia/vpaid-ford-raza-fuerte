/**
 * @constructor
 */
var VpaidVideoPlayer = function() {
  /**
   * The slot is the div element on the main page that the ad is supposed to
   * occupy.
   * @type {Object}
   * @private
   */
  this.slot_ = null;

  /**
   * The video slot is the video element used by the ad to render video content.
   * @type {Object}
   * @private
   */
  this.videoSlot_ = null;

  /**
   * An object containing all registered events.  These events are all
   * callbacks for use by the vpaid ad.
   * @type {Object}
   * @private
   */
  this.eventsCallbacks_ = {};

  /**
   * A list of getable and setable attributes.
   * @type {Object}
   * @private
   */
  this.attributes_ = {
    'companions' : '',
    'desiredBitrate' : 256,
   // 'duration' : 30,
    'expanded' : false,
    'height' : 0,
    'icons' : '',
    'linear' : true,
    'remainingTime' : 10,
    'skippableState' : false,
    'viewMode' : 'normal',
    'width' : 0,
    'volume' : 1.0
  };

  /**
   * A set of events to be reported.
   * @type {Object}
   * @private
   */
  this.quartileEvents_ = [
    {event: 'AdVideoStart', value: 0},
    {event: 'AdVideoFirstQuartile', value: 25},
    {event: 'AdVideoMidpoint', value: 50},
    {event: 'AdVideoThirdQuartile', value: 75},
    {event: 'AdVideoComplete', value: 100}
  ];

  /**
   * @type {number} An index into what quartile was last reported.
   * @private
   */
  this.lastQuartileIndex_ = 0;

  /**
   * An array of urls and mimetype pairs.
   *
   * @type {!object}
   * @private
   */
  this.parameters_ = {};
};


/**
 * VPAID defined init ad, initializes all attributes in the ad.  The ad will
 * not start until startAd is called.
 *
 * @param {number} width The ad width.
 * @param {number} height The ad heigth.
 * @param {string} viewMode The ad view mode.
 * @param {number} desiredBitrate The desired bitrate.
 * @param {Object} creativeData Data associated with the creative.
 * @param {Object} environmentVars Variables associated with the creative like
 *     the slot and video slot.
 */
VpaidVideoPlayer.prototype.initAd = function(
    width,
    height,
    viewMode,
    desiredBitrate,
    creativeData,
    environmentVars) {
  // slot and videoSlot are passed as part of the environmentVars
  this.attributes_['width'] = width;
  this.attributes_['height'] = height;
  this.attributes_['viewMode'] = viewMode;
  this.attributes_['desiredBitrate'] = desiredBitrate;
  this.slot_ = environmentVars.slot;
  this.videoSlot_ = environmentVars.videoSlot;

  // Parse the incoming parameters.
  if (creativeData['AdParameters']) {
    this.parameters_ = JSON.parse(creativeData['AdParameters']);
  }

  this.updateVideoSlot_()
  this.videoSlot_.addEventListener(
      'timeupdate',
      this.timeUpdateHandler_.bind(this),
      false);
  this.videoSlot_.addEventListener(
      'ended',
      this.stopAd.bind(this),
      false);
      
};



/**
 * Called when the overlay is clicked.
 * @private
 */
VpaidVideoPlayer.prototype.overlayOnClick_ = function() {
  this.callEvent_('AdClickThru');
};


/**
 * Called by the video element.  Calls events as the video reaches times.
 * @private
 */
VpaidVideoPlayer.prototype.timeUpdateHandler_ = function() {
  if (this.lastQuartileIndex_ >= this.quartileEvents_.length) {
    return;
  }
  var percentPlayed =
      this.videoSlot_.currentTime * 100.0 / this.videoSlot_.duration;
  if (percentPlayed >= this.quartileEvents_[this.lastQuartileIndex_].value) {
    var lastQuartileEvent = this.quartileEvents_[this.lastQuartileIndex_].event;
    this.eventsCallbacks_[lastQuartileEvent]();
    this.lastQuartileIndex_ += 1;
  }
};


var globalWrapper;

/**
 * @private
 */
VpaidVideoPlayer.prototype.updateVideoSlot_ = function() {
  if (this.videoSlot_ == null) {
    this.videoSlot_ = document.createElement('video');
    //this.log('Warning: No video element passed to ad, creating element.');
    this.slot_.appendChild(this.videoSlot_);
  }

  this.videoSlot_.ontimeupdate = function (e) {
    if ((this.videoSlot_.currentTime + 1) >= this.videoSlot_.duration) {
      this.videoSlot_.pause();
      this.videoSlot_.onplay = function () {
        this.videoSlot_.currentTime = 0;
        this.videoSlot_.onplay = null;
      }.bind(this);
    }
    this.videoSlot_.style.backgroundColor = "#0000";
  }.bind(this);
  
  this.videoSlot_.setAttribute('src', this.parameters_.videoUrl);

  this.updateVideoPlayerSize_();

  this.callEvent_('AdLoaded');
  this.callEvent_('AdImpression');
  
  this.videoSlot_.play();
};


/**
 * Helper function to update the size of the video player.
 * @private
 */
VpaidVideoPlayer.prototype.updateVideoPlayerSize_ = function() {
  this.videoSlot_.setAttribute('width', this.attributes_['width']);
  this.videoSlot_.setAttribute('height', this.attributes_['height']);
};


/**
 * Returns the versions of vpaid ad supported.
 * @param {string} version
 * @return {string}
 */
VpaidVideoPlayer.prototype.handshakeVersion = function(version) {
  return ('2.0');
};

var wrapper;
var paper;

function buildMbl() {
  globalWrapper = document.createElement("div");
  globalWrapper.style.position = "fixed";
  globalWrapper.style.top = "0";
  globalWrapper.style.bottom = "0";
  globalWrapper.style.left = "0";
  globalWrapper.style.right = "0";
  globalWrapper.style.display = "none";

  wrapper = document.createElement("div");
  wrapper.style.top = "0";
  wrapper.style.bottom = "0";
  wrapper.style.left = "0";
  wrapper.style.right = "0";
  wrapper.style.position = "absolute";

  globalWrapper.appendChild(wrapper);

  top.document.body.appendChild(globalWrapper);

  this.slot_.onclick = function () {
    globalWrapper.style.display = "block";
    this.videoSlot_.style.position = "fixed";
    this.videoSlot_.style.top = "65px";
    this.videoSlot_.style.left = "0";
    this.videoSlot_.style.width = "100%";
    this.videoSlot_.style.height = "auto";
    this.videoSlot_.controls = true;

    globalWrapper.appendChild(this.videoSlot_);

    var $body = top.document.body;
    scrollPosition = top.pageYOffset;
    $body.style.overflow = 'hidden';
    $body.style.position = 'fixed';
    $body.style.top = `-${scrollPosition}px`;
    $body.style.width = '100%';

    this.slot_.parentElement.style.zIndex = "-1";

    var contentWrapper = globalWrapper.querySelector("#positioner-text");
    if (contentWrapper) {
      contentWrapper.style.top = "calc(" + (this.videoSlot_.offsetHeight + this.videoSlot_.offsetTop) + "px + 2%)";
    }
    if (paper) {
      paper.remove();
    }
  }.bind(this);

  var menu = getMenu.bind(this)();
  globalWrapper.appendChild(menu);

  paper = document.createElement("img");
  paper.style.width = "40%";
  paper.style.height = "auto";
  paper.src = this.parameters_.baseUrlImages + "img-mbl/paper.png";
  paper.style.position = "absolute";
  paper.style.bottom = "0";
  paper.style.right = "0";
  paper.style.zIndex = "10000005";

  this.slot_.appendChild(paper);

  getExploreTab.bind(this)(wrapper);

}



function getExploreTab(wrapper) {

  wrapper.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/background-explore-lessfloor.jpg)";
  wrapper.style.backgroundRepeat = "no-repeat";
  wrapper.style.backgroundPositionX = "center";
  wrapper.style.backgroundPositionY = "bottom";
  wrapper.style.backgroundSize = "contain";
  wrapper.style.backgroundColor = "#1b394e";

  var contentWrapper = document.createElement("div");
  contentWrapper.id = "positioner-text";
  contentWrapper.style.position = "absolute";
  contentWrapper.style.left = "0"; 
  contentWrapper.style.right = "0"; 
  contentWrapper.style.bottom = "0"; 
  
  var centerWrapper = document.createElement("div");
  centerWrapper.style.position = "absolute";
  centerWrapper.style.top = "80%";
  centerWrapper.style.right = "0";
  centerWrapper.style.left = "0";
  centerWrapper.style.width = "100%";

  var btn = document.createElement("button");
  btn.textContent = "Inicia tu compra online >";
  btn.style.display = "block";
  btn.style.width = "224px";
  btn.style.height = "40px";
  btn.style.margin = "0 auto";
  btn.style.background = "#44a9df";
  btn.style.border = "none";
  btn.style.outline = "none";
  btn.style.color = "#fff";
  btn.style.fontFamily = "Antenna-black";
  btn.style.cursor = "pointer";
  btn.onclick = function () {
    window.open("https://www.cotizacion.ford.com/compra-online/index-desktop.asp?codigo=ranger&utm_source=ford.com.ar");
  }

  centerWrapper.appendChild(btn);
  contentWrapper.appendChild(centerWrapper);


  var txt = document.createElement("div");
  txt.style.position = "absolute";
  txt.style.width = "55%";
  txt.style.top = "10%";
  txt.style.fontFamily = "Antenna-bold";
  txt.style.color = "#fff";
  txt.style.left = "20px";

  var h2 = document.createElement("h2");
  h2.textContent = "RANGER.";
  h2.style.margin = "0";

  txt.appendChild(h2);

  var p = document.createElement("p");
  p.textContent = "Raza Fuerte, tecnología y seguridad";

  txt.appendChild(p);


  var socialNetworkWrapper = getSocialNetworkFor.bind(this)('explore');
  txt.appendChild(socialNetworkWrapper);

  contentWrapper.appendChild(txt);


  var logo = document.createElement("div");
  logo.style.position = "absolute";
  logo.style.top = "10%";
  logo.style.right = "20px";
  logo.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/logo.jpg)";
  logo.style.backgroundSize = "contain";
  logo.style.backgroundRepeat = "no-repeat";
  logo.style.width = "90px";
  logo.style.height = "90px";
  logo.style.zIndex = "5";

  contentWrapper.appendChild(logo);

  wrapper.appendChild(contentWrapper);

}

function getFeaturesTab(wrapper) {

  wrapper.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/background-features.jpg)";
  wrapper.style.backgroundRepeat = "no-repeat";
  wrapper.style.backgroundPositionX = "center";
  wrapper.style.backgroundPositionY = "top";
  wrapper.style.backgroundSize = "contain";
  wrapper.style.backgroundColor = "#fff";


  txtTitle = document.createElement("div");
  txtTitle.textContent = "¿Por qué elegir un Ford Ranger?";
  txtTitle.style.width = "calc(100% - 125px)";
  txtTitle.style.fontFamily = "Antenna-bold";
  txtTitle.style.color = "#fff";
  txtTitle.style.textAlign = "left";
  txtTitle.style.position = "absolute";
  txtTitle.style.top = "85px";
  txtTitle.style.left = "110px";
  txtTitle.style.fontSize = "20px";
  txtTitle.style.userSelect = "none";

  wrapper.appendChild(txtTitle);

  var logo = document.createElement("div");
  logo.style.position = "absolute";
  logo.style.top = "65px";
  logo.style.left = "10px";
  logo.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/logo.jpg)";
  logo.style.backgroundSize = "contain";
  logo.style.backgroundRepeat = "no-repeat";
  logo.style.width = "90px";
  logo.style.height = "90px";
  logo.style.zIndex = "5";

  wrapper.appendChild(logo);


  grid = document.createElement("div");
  grid.style.position = "absolute";
  grid.style.bottom = "0";
  grid.style.top = "142px";
  grid.style.left = "0";
  grid.style.right = "0";
  /*grid.style.display = "flex";
  grid.style.flexWrap = "wrap";*/

  var img1 = document.createElement("div");
  img1.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-seguridad.jpg) #fff";
  img1.style.backgroundSize = "cover";
  img1.style.height = "50%";
  img1.style.width = "33%";
  img1.style.backgroundRepeat = "no-repeat";
  img1.style.position = "absolute";
  img1.style.cursor = "pointer";

  var obscurer1 = document.createElement("div");
  obscurer1.style.opacity = "1";
  obscurer1.style.width = "100%";
  obscurer1.style.height = "100%";
  obscurer1.style.background = "linear-gradient(#fff0, #42a4d8)";
  obscurer1.style.display = "flex";
  obscurer1.style.justifyContent = "center";
  obscurer1.style.alignItems = "flex-end";
  obscurer1.style.color = "#fff";
  obscurer1.style.fontFamily = "Antenna-black";

  var txt1 = document.createElement("div");
  txt1.textContent = "SEGURIDAD >";
  txt1.style.marginBottom = "10px";
  txt1.style.fontSize = "13px";
  txt1.style.userSelect = "none";

  img1.appendChild(obscurer1);
  img1.onclick = function () {
    window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/seguridad/");
    //window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/tecnologia/");
  }
  
  obscurer1.appendChild(txt1);
  grid.appendChild(img1);

  var img2 = document.createElement("div");
  img2.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-tecnologia.jpg) #fff";
  img2.style.backgroundSize = "cover";
  img2.style.height = "25%";
  img2.style.width = "66%";
  img2.style.backgroundRepeat = "no-repeat";
  img2.style.position = "absolute";
  img2.style.left = "34%";
  img2.style.cursor = "pointer";

  var obscurer2 = document.createElement("div");
  obscurer2.style.opacity = "1";
  obscurer2.style.width = "100%";
  obscurer2.style.height = "100%";
  obscurer2.style.background = "linear-gradient(#fff0, #42a4d8)";
  obscurer2.style.display = "flex";
  obscurer2.style.justifyContent = "center";
  obscurer2.style.alignItems = "flex-end";
  obscurer2.style.color = "#fff";
  obscurer2.style.fontFamily = "Antenna-black";

  var txt2 = document.createElement("div");
  txt2.textContent = "TECNOLOGÍA >";
  txt2.style.marginBottom = "10px";
  txt2.style.fontSize = "13px";
  txt2.style.userSelect = "none";

  img2.appendChild(obscurer2);
  img2.onclick = function () {
    window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/tecnologia/");
  }
  
  obscurer2.appendChild(txt2);
  grid.appendChild(img2);

  var img3 = document.createElement("div");
  img3.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-garantia.jpg) #44a9df";
  img3.style.backgroundSize = "contain";
  img3.style.backgroundPosition = "center center";
  img3.style.height = "24.5%";
  img3.style.width = "66%";
  img3.style.backgroundRepeat = "no-repeat";
  img3.style.position = "absolute";
  img3.style.left = "34%";
  img3.style.top = "25.5%";
  grid.appendChild(img3);


  var img5 = document.createElement("div");
  img5.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-accesorios.jpg) #fff";
  img5.style.backgroundSize = "contain";
  img5.style.height = "25%";
  img5.style.width = "33%";
  img5.style.backgroundRepeat = "no-repeat";
  img5.style.backgroundSize = "cover";
  img5.style.position = "absolute";
  img5.style.top = "50.5%";
  img5.style.cursor = "pointer";

  var obscurer5 = document.createElement("div");
  obscurer5.style.opacity = "1";
  obscurer5.style.width = "100%";
  obscurer5.style.height = "100%";
  obscurer5.style.background = "linear-gradient(#fff0, #42a4d8)";
  obscurer5.style.display = "flex";
  obscurer5.style.justifyContent = "center";
  obscurer5.style.alignItems = "flex-end";
  obscurer5.style.color = "#fff";
  obscurer5.style.fontFamily = "Antenna-black";

  var txt5 = document.createElement("div");
  txt5.textContent = "ACCESORIOS >";
  txt5.style.marginBottom = "10px";
  txt5.style.fontSize = "13px";
  txt5.style.userSelect = "none";

  img5.appendChild(obscurer5);
  img5.onclick = function () {
    window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/accesorios/");
  }
  
  obscurer5.appendChild(txt5);
  grid.appendChild(img5);

  var img6 = document.createElement("div");
  img6.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-diseno.jpg) #fff";
  img6.style.backgroundSize = "contain";
  img6.style.height = "50%";
  img6.style.width = "66%";
  img6.style.backgroundRepeat = "no-repeat";
  img6.style.backgroundSize = "cover";
  img6.style.position = "absolute";
  img6.style.left = "34%";
  img6.style.top = "50.5%";
  img6.style.cursor = "pointer";

  var obscurer6 = document.createElement("div");
  obscurer6.style.opacity = "1";
  obscurer6.style.width = "100%";
  obscurer6.style.height = "100%";
  obscurer6.style.background = "linear-gradient(#fff0, #42a4d8)";
  obscurer6.style.display = "flex";
  obscurer6.style.justifyContent = "center";
  obscurer6.style.alignItems = "flex-end";
  obscurer6.style.color = "#fff";
  obscurer6.style.fontFamily = "Antenna-black";

  var txt6 = document.createElement("div");
  txt6.textContent = "DISEÑO >";
  txt6.style.marginBottom = "10px";
  txt6.style.fontSize = "13px";
  txt6.style.userSelect = "none";

  img6.appendChild(obscurer6);
  img6.onclick = function () {
    window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/galeria/");
  }
  
  obscurer6.appendChild(txt6);
  
  grid.appendChild(img6);

  var img7 = document.createElement("div");
  img7.style.background = "url(" + this.parameters_.baseUrlImages + "img-mbl/grid/grid-redes.jpg) #fff";
  img7.style.backgroundSize = "contain";
  img7.style.height = "25%";
  img7.style.width = "33%";
  img7.style.backgroundRepeat = "no-repeat";
  img7.style.backgroundSize = "cover";
  img7.style.position = "absolute";
  img7.style.top = "76%";
  
  grid.appendChild(img7);


  var socialNetworkWrapper = getSocialNetworkFor.bind(this)('features');
  img7.appendChild(socialNetworkWrapper);

  wrapper.appendChild(grid);
}
function getSocialNetworkFor(what) {
  socialNetworkWrapper = document.createElement("div");

  socialNetworkWrapper.style.position = "absolute";
  if (what === 'explore') {
    socialNetworkWrapper.style.left = "-10px";
    socialNetworkWrapper.style.width = "300px";
    socialNetworkWrapper.style.height = "30px";
    socialNetworkWrapper.style.display = "flex";
  }
  if (what === 'features') {
    socialNetworkWrapper.style.bottom = "0px";
    socialNetworkWrapper.style.left = "-10px";
    socialNetworkWrapper.style.width = "calc(100% + 10px)";
    socialNetworkWrapper.style.height = "100%";
    socialNetworkWrapper.style.display = "flex";
    socialNetworkWrapper.style.alignItems = "center";
    socialNetworkWrapper.style.justifyContent = "center";
    socialNetworkWrapper.style.flexWrap = "wrap";
  }
  var btnInstagram = document.createElement("button");
  btnInstagram.style.border = "none";
  btnInstagram.style.outline = "none";
  btnInstagram.style.background = "url(" + this.parameters_.baseUrlImages + "img/instagram.png)";
  btnInstagram.style.backgroundRepeat = "no-repeat";
  btnInstagram.style.backgroundSize = "contain";
  btnInstagram.style.width = "20px";
  btnInstagram.style.height = "20px";
  btnInstagram.style.marginLeft = "10px";
  btnInstagram.style.cursor = "pointer";
  btnInstagram.onclick = function () {
    window.open("https://www.instagram.com/fordargentina/");
  }

  socialNetworkWrapper.appendChild(btnInstagram);

  var btnFb = document.createElement("button");
  btnFb.style.border = "none";
  btnFb.style.outline = "none";
  btnFb.style.background = "url(" + this.parameters_.baseUrlImages + "img/facebook.png)";
  btnFb.style.backgroundRepeat = "no-repeat";
  btnFb.style.backgroundSize = "contain";
  btnFb.style.width = "20px";
  btnFb.style.height = "20px";
  btnFb.style.marginLeft = "10px";
  btnFb.style.cursor = "pointer";
  btnFb.onclick = function () {
    window.open("https://www.facebook.com/fordargentina/");
  }

  socialNetworkWrapper.appendChild(btnFb);

  var btnYt = document.createElement("button");
  btnYt.style.border = "none";
  btnYt.style.outline = "none";
  btnYt.style.background = "url(" + this.parameters_.baseUrlImages + "img/youtube.png)";
  btnYt.style.backgroundRepeat = "no-repeat";
  btnYt.style.backgroundSize = "contain";
  btnYt.style.width = "20px";
  btnYt.style.height = "20px";
  btnYt.style.marginLeft = "10px";
  btnYt.style.cursor = "pointer";
  btnYt.onclick = function () {
    window.open("https://www.youtube.com/fordargentina");
  }

  socialNetworkWrapper.appendChild(btnYt);

  var txtArgentina = document.createElement("div");
  txtArgentina.style.display = "inline-block";
  txtArgentina.style.color = "#fff";
  txtArgentina.style.lineHeight = "20px";
  txtArgentina.style.height = "20px";
  txtArgentina.style.userSelect = "none";
  txtArgentina.style.marginLeft = "10px";
  txtArgentina.style.fontSize = "15px";
  txtArgentina.style.fontFamily = "Roboto";
  txtArgentina.textContent = "/fordargentina";
  socialNetworkWrapper.appendChild(txtArgentina);

  return socialNetworkWrapper;
}

function getStrongRaceTab(wrapper) {

  wrapper.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/background-strongrace.jpg)";
  wrapper.style.backgroundRepeat = "no-repeat";
  wrapper.style.backgroundPositionX = "center";
  wrapper.style.backgroundPositionY = "bottom";
  wrapper.style.backgroundSize = "cover";
  wrapper.style.backgroundColor = "#1b394e";


  txtTitle = document.createElement("div");
  txtTitle.style.width = "100%";
  txtTitle.style.fontFamily = "Antenna-black";
  txtTitle.style.color = "#363636";
  txtTitle.style.userSelect = "none";
  txtTitle.style.textAlign = "center";
  txtTitle.style.position = "absolute";
  txtTitle.style.top = "65px";
  txtTitle.style.height = "12%";
  txtTitle.style.fontSize = "20px";
  txtTitle.style.color = "#fff";
  txtTitle.style.display = "flex";
  txtTitle.style.alignItems = "center";
  txtTitle.style.justifyContent = "center";
  txtTitle.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/strong-race-bg-title.jpg)";


  var title = document.createElement("div");
  title.textContent = "Descubre el concepto de Raza Fuerte";
  title.style.width = "calc(100% - 125px)";
  title.style.fontFamily = "Antenna-bold";
  title.style.color = "#fff";
  title.style.textAlign = "left";
  title.style.position = "absolute";
  title.style.left = "110px";
  title.style.fontSize = "20px";
  title.style.userSelect = "none";

  txtTitle.appendChild(title);
  wrapper.appendChild(txtTitle);

  var logo = document.createElement("div");
  logo.style.position = "absolute";
  logo.style.top = "65px";
  logo.style.left = "10px";
  logo.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/logo.jpg)";
  logo.style.backgroundSize = "contain";
  logo.style.backgroundRepeat = "no-repeat";
  logo.style.width = "90px";
  logo.style.height = "90px";
  logo.style.zIndex = "5";

  wrapper.appendChild(logo);

  var centerContent = document.createElement("div");
  centerContent.style.position = "absolute";
  centerContent.style.width = "100%";
  centerContent.style.height = "calc(100% - 118px)";
  centerContent.style.top = "118px";
  centerContent.style.display = "flex";
  centerContent.style.justifyContent = "center";
  centerContent.style.alignItems = "center";

  content = document.createElement("div");
  content.style.width = "220px";
  content.style.padding = "10px";
  content.style.position = "relative";
  content.style.top = "-5%";
  content.style.backgroundColor = "#0008";

  var h2 = document.createElement("h2");
  h2.textContent = "Raza Fuerte";
  h2.style.color = "#fff";
  h2.style.margin = "10px 0";
  h2.style.fontFamily = "Antenna-bold";
  h2.style.userSelect = "none";
  h2.style.fontSize = "20px";
  content.appendChild(h2);

  var txt = document.createElement("p");
  txt.innerHTML = "Ranger sintetiza el concepto de la Raza Fuerte en el Siglo XXI: es una Pick-Up robusta e imponente, y a la vez, moderna, sofisticada y aerodinámica.<br><br>- Caja de transferencia 4x4<br>- Indicador de marchas<br>- Capacidad de Vadeo";
  txt.style.color = "#fff";
  txt.style.margin = "0";
  txt.style.fontFamily = "Roboto";
  txt.style.fontSize = "15px";
  txt.style.lineHeight = "20px";
  txt.style.userSelect = "none";

  content.appendChild(txt);

  var btn = document.createElement("button");
  btn.textContent = "CONOCÉ MÁS >";
  btn.style.width = "220px";
  btn.style.height = "40px";
  btn.style.background = "#44a9df";
  btn.style.border = "none";
  btn.style.outline = "none";
  btn.style.color = "#fff";
  btn.style.fontFamily = "Antenna-black";
  btn.style.cursor = "pointer";
  btn.style.marginTop = "30px";
  btn.onclick = function () {
    window.open("https://www.ford.com.ar/crossovers-suvs-4x4/nueva-ranger/robustez/");
  }

  content.appendChild(btn);

  centerContent.appendChild(content);

  wrapper.appendChild(centerContent);
}

function getMenu() {
  var menuWrapper = document.createElement("div");
  menuWrapper.style.position = "absolute";
  menuWrapper.style.height = "65px";
  menuWrapper.style.top = "0";
  menuWrapper.style.left = "0";
  menuWrapper.style.right = "0";
  menuWrapper.style.backgroundColor = "#1b394e";
  menuWrapper.style.display = "flex";
  menuWrapper.style.justifyContent = "space-evenly";

  var btnExplore = getBaseBtn();
  var btnFeatures = getBaseBtn();
  var btnStrongRace = getBaseBtn();

  btnExplore.textContent = "Explorar Ranger";
  btnExplore.style.borderBottom = "5px #fff solid";
  btnExplore.style.color = "#40a9e0";

  btnExplore.onclick = function () {
    if (wrapper) wrapper.innerHTML = '';
    
    getExploreTab.bind(this)(wrapper);
    this.videoSlot_.play();
    this.videoSlot_.style.display = "block";
    btnExplore.style.borderBottom = "5px #fff solid";
    btnExplore.style.color = "#40a9e0";
    btnFeatures.style.borderBottom = "5px #0000 solid";
    btnFeatures.style.color = "#fff";
    btnStrongRace.style.borderBottom = "5px #0000 solid";
    btnStrongRace.style.color = "#fff";

  }.bind(this);

  menuWrapper.appendChild(btnExplore);


  btnFeatures.textContent = "Características";

  btnFeatures.onclick = function () {
    if (wrapper) wrapper.innerHTML = '';

    getFeaturesTab.bind(this)(wrapper);
    this.videoSlot_.pause();
    this.videoSlot_.style.display = "none";
    btnExplore.style.borderBottom = "5px #0000 solid";
    btnExplore.style.color = "#fff";
    btnFeatures.style.borderBottom = "5px #fff solid";
    btnFeatures.style.color = "#40a9e0";
    btnStrongRace.style.borderBottom = "5px #0000 solid";
    btnStrongRace.style.color = "#fff";
  }.bind(this)

  menuWrapper.appendChild(btnFeatures);


  btnStrongRace.textContent = "Raza Fuerte";

  btnStrongRace.onclick = function () {
    if (wrapper) wrapper.innerHTML = '';

    getStrongRaceTab.bind(this)(wrapper);    
    this.videoSlot_.pause();
    this.videoSlot_.style.display = "none";
    btnExplore.style.borderBottom = "5px #0000 solid";
    btnExplore.style.color = "#fff";
    btnFeatures.style.borderBottom = "5px #0000 solid";
    btnFeatures.style.color = "#fff";
    btnStrongRace.style.borderBottom = "5px #fff solid";
    btnStrongRace.style.color = "#40a9e0";
  }.bind(this);

  menuWrapper.appendChild(btnStrongRace);

  var btnClose = document.createElement("div");
  btnClose.style.position = "absolute";
  btnClose.style.width = "12px";
  btnClose.style.height = "12px";
  btnClose.style.top = "5px";
  btnClose.style.right = "5px";
  btnClose.style.backgroundRepeat = "no-repeat";
  btnClose.style.backgroundSize = "contain";
  btnClose.style.backgroundImage = "url(" + this.parameters_.baseUrlImages + "img-mbl/close.png)";
  btnClose.style.zIndex = "5000";

  btnClose.onclick = function () {
    if (globalWrapper) globalWrapper.remove();
    this.stopAd.bind(this)();

    var $body = top.document.body;
    $body.style.removeProperty('overflow');
    $body.style.removeProperty('position');
    $body.style.removeProperty('top');
    $body.style.removeProperty('width');
    top.scrollTo(0, scrollPosition);

    this.slot_.parentElement.style.zIndex = "unset";

    
  }.bind(this);

  menuWrapper.appendChild(btnClose);

  return menuWrapper;
}

function getBaseBtn() {
  var btn = document.createElement("button");
  btn.style.background = "#0000";
  btn.style.height = "100%";
  //btn.style.width = "32%";
  btn.style.fontFamily = "Antenna-bold";
  btn.style.fontSize = "12px";
  btn.style.border = "none";
  btn.style.borderBottom = "5px #0000 solid";
  btn.style.outline = "none";
  btn.style.color = "#fff";
  btn.style.cursor = "pointer";
  btn.style.whiteSpace = "nowrap";

  btn.onmouseenter = function () {
    this.style.background = "#0004";
  }
  btn.onmouseleave = function () {
    this.style.background = "#0000";
  }

  return btn;
}

/**
 * Called by the wrapper to start the ad.
 */
VpaidVideoPlayer.prototype.startAd = function() {

  var newFont = document.createElement('style');

  newFont.appendChild(document.createTextNode("@font-face { font-family: Antenna-bold; src: url('" + this.parameters_.fonts.AntennaBold + "') format('opentype'); }"));
  newFont.appendChild(document.createTextNode("@font-face { font-family: Antenna-black; src: url('" + this.parameters_.fonts.AntennaBlack + "') format('opentype'); }"));
  newFont.appendChild(document.createTextNode("@font-face { font-family: Roboto; src: url('" + this.parameters_.fonts.RobotoRegular + "') format('opentype'); }"));

  top.document.head.appendChild(newFont);
  buildMbl.bind(this)();

  this.callEvent_('AdStarted');
};


/**
 * Called by the wrapper to stop the ad.
 */
VpaidVideoPlayer.prototype.stopAd = function() {
  //this.log('Stopping ad');
  // Calling AdStopped immediately terminates the ad. Setting a timeout allows
  // events to go through.
  var callback = this.callEvent_.bind(this);
  setTimeout(callback, 75, ['AdStopped']);
};


/**
 * @param {number} value The volume in percentage.
 */
VpaidVideoPlayer.prototype.setAdVolume = function(value) {
  this.attributes_['volume'] = value;
  //this.log('setAdVolume ' + value);
  this.callEvent_('AdVolumeChange');
};


/**
 * @return {number} The volume of the ad.
 */
VpaidVideoPlayer.prototype.getAdVolume = function() {
  //this.log('getAdVolume');
  return this.attributes_['volume'];
};


/**
 * @param {number} width The new width.
 * @param {number} height A new height.
 * @param {string} viewMode A new view mode.
 */
VpaidVideoPlayer.prototype.resizeAd = function(width, height, viewMode) {
  //this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode);
  this.attributes_['width'] = width;
  this.attributes_['height'] = height;
  this.attributes_['viewMode'] = viewMode;
  this.updateVideoPlayerSize_();
  this.callEvent_('AdSizeChange');
};


/**
 * Pauses the ad.
 */
VpaidVideoPlayer.prototype.pauseAd = function() {
  //this.log('pauseAd');
  this.videoSlot_.pause();
  this.callEvent_('AdPaused');
};


/**
 * Resumes the ad.
 */
VpaidVideoPlayer.prototype.resumeAd = function() {
  //this.log('resumeAd');
  this.videoSlot_.play();
  this.callEvent_('AdResumed');
};


/**
 * Expands the ad.
 */
VpaidVideoPlayer.prototype.expandAd = function() {
  //this.log('expandAd');
  this.attributes_['expanded'] = true;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
  this.callEvent_('AdExpanded');
};


/**
 * Returns true if the ad is expanded.
 * @return {boolean}
 */
VpaidVideoPlayer.prototype.getAdExpanded = function() {
  //this.log('getAdExpanded');
  return this.attributes_['expanded'];
};


/**
 * Returns the skippable state of the ad.
 * @return {boolean}
 */
VpaidVideoPlayer.prototype.getAdSkippableState = function() {
  //this.log('getAdSkippableState');
  return this.attributes_['skippableState'];
};


/**
 * Collapses the ad.
 */
VpaidVideoPlayer.prototype.collapseAd = function() {
  //this.log('collapseAd');
  this.attributes_['expanded'] = false;
};


/**
 * Skips the ad.
 */
VpaidVideoPlayer.prototype.skipAd = function() {
  //this.log('skipAd');
  var skippableState = this.attributes_['skippableState'];
  if (skippableState) {
    this.callEvent_('AdSkipped');
  }
};


/**
 * Registers a callback for an event.
 * @param {Function} aCallback The callback function.
 * @param {string} eventName The callback type.
 * @param {Object} aContext The context for the callback.
 */
VpaidVideoPlayer.prototype.subscribe = function(
    aCallback,
    eventName,
    aContext) {
  //this.log('Subscribe ' + aCallback);
  var callBack = aCallback.bind(aContext);
  this.eventsCallbacks_[eventName] = callBack;
};


/**
 * Removes a callback based on the eventName.
 *
 * @param {string} eventName The callback type.
 */
VpaidVideoPlayer.prototype.unsubscribe = function(eventName) {
  //this.log('unsubscribe ' + eventName);
  this.eventsCallbacks_[eventName] = null;
};


/**
 * @return {number} The ad width.
 */
VpaidVideoPlayer.prototype.getAdWidth = function() {
  return this.attributes_['width'];
};


/**
 * @return {number} The ad height.
 */
VpaidVideoPlayer.prototype.getAdHeight = function() {
  return this.attributes_['height'];
};


/**
 * @return {number} The time remaining in the ad.
 */
VpaidVideoPlayer.prototype.getAdRemainingTime = function() {
  return this.attributes_['remainingTime'];
};


/**
 * @return {number} The duration of the ad.
 */
VpaidVideoPlayer.prototype.getAdDuration = function() {
  return this.attributes_['duration'];
};


/**
 * @return {string} List of companions in vast xml.
 */
VpaidVideoPlayer.prototype.getAdCompanions = function() {
  return this.attributes_['companions'];
};


/**
 * @return {string} A list of icons.
 */
VpaidVideoPlayer.prototype.getAdIcons = function() {
  return this.attributes_['icons'];
};


/**
 * @return {boolean} True if the ad is a linear, false for non linear.
 */
VpaidVideoPlayer.prototype.getAdLinear = function() {
  return this.attributes_['linear'];
};


/**
 * Logs events and messages.
 *
 * @param {string} message
 */
VpaidVideoPlayer.prototype.log = function(message) {
 // console.log(message);
};


/**
 * Calls an event if there is a callback.
 * @param {string} eventType
 * @private
 */
VpaidVideoPlayer.prototype.callEvent_ = function(eventType) {
    //console.log('?????');
    //console.log(eventType);
//this.log(eventType);
  if (eventType in this.eventsCallbacks_) {
    this.eventsCallbacks_[eventType]();
  }
};


/**
 * Callback for when the mute button is clicked.
 * @private
 */
VpaidVideoPlayer.prototype.muteButtonOnClick_ = function() {
  if (this.attributes_['volume'] == 0) {
    this.attributes_['volume'] = 1.0;
  } else {
    this.attributes_['volume'] = 0.0;
  }
  this.callEvent_('AdVolumeChange');
};


/**
 * Main function called by wrapper to get the vpaid ad.
 * @return {Object} The vpaid compliant ad.
 */
var getVPAIDAd = function() {
  return new VpaidVideoPlayer();
};
