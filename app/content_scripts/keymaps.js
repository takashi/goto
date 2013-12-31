/**
 * The port to connect to backlground script.
 * @type {Port}
 */
var port = chrome.extension.connect({name: "goto"});
var ui = new UI(port);
var hasSelectorShown = false;
var isCtrlPressed = false;

// Add event listener for keydowm event to open overlay.
window.onkeydown = function(e) {
  var keyCode = +e.keyCode;
  // open tab list
  if (keyCode === 17) {
    isCtrlPressed = true;
  }
  if (keyCode === 79 && isCtrlPressed) {
    if (!hasSelectorShown) {
      port.postMessage({key: 'tabs'});
    } else {
      ui.toggleSelector();
    }
    return false;
  }
}

window.onkeyup = function(e) {
  var keyCode = +e.keyCode;
  if (keyCode === 17) {
    isCtrlPressed = false;
  }
}


port.onMessage.addListener(function(message) {
  if(!!message.html){
    ui.appendSelector(message);
    hasSelectorShown = true;
  }
});