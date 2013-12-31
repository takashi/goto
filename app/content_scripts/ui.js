/**
 * @constructor
 */
var UI = function(port) {
  /**
   * the template html string.
   * @type {String}
   */
  this.parentTemplate_ = '<div id="goto__selector" class="goto__selector__wrapper"><div class="goto__input__wrapper"><input type="text" id="js-selector-input" class="goto__selector__input"></div><ul id="js-goto-lists" class="goto__lists"></ul></div>'

  this.appendedElement = null;

  this.port = port;

  this.port.onMessage.addListener(function(message) {
    if(message.isTabChanged === undefined) {
      if(message.searchResult == undefined) return;
      this.appendedElement.querySelector('#js-goto-lists').innerHTML = message.searchResult;
      this.setTabUpdateEvents();
    } else {
      if (message.isTabChanged === true) {
        document.body.removeChild(document.querySelector('#goto__selector'));
        port.postMessage({key: 'tabs'});
      } else {
        this.appendedElement.style.display = 'block';
        this.focusOnInput();
      }
    }
  }.bind(this))
};

var p = UI.prototype;

p.appendSelector = function(data) {
  this.appendedElement = this.createElementFromString(this.parentTemplate_);
  this.appendedElement.querySelector('#js-goto-lists').innerHTML = data.html;
  this.appendedElement.querySelector('#js-selector-input').onkeydown =
    this.onInputKeyDown_.bind(this);
  this.tabsArray_ = data.tabsArray
  document.body.appendChild(this.appendedElement);
  this.setTabUpdateEvents();
  this.focusOnInput();
};

p.toggleSelector = function() {
  var appearance = (this.appendedElement.style.display === 'none') ? false : true;
  if (appearance) {
    this.appendedElement.style.display = 'none';
  } else {
    this.checkTabChanged_();
  }
};

p.setTabUpdateEvents = function() {
  for(var i = 0, el; el = this.appendedElement.querySelectorAll('#js-goto-lists>li')[i]; i++) {
    el.addEventListener('click', function(e) {
      var id = +e.currentTarget.dataset.tabId;
      this.port.postMessage({key: 'tabUpdate', id: id});
    }.bind(this))
  }
};


p.checkTabChanged_ = function() {
  this.port.postMessage({key: 'isChanged'});
}

p.focusOnInput = function() {
  var input = this.appendedElement.querySelector('#js-selector-input');
  input.focus();
};

p.onInputKeyDown_ = function(e) {
  var keyCode = +e.keyCode;
  var query = e.currentTarget.value;
  console.log(keyCode);
  if ( query > 32) {
    return;
  }
  // ESC
  if (keyCode === 27) {
    this.toggleSelector();
  }
  this.port.postMessage({key: 'search', query: e.currentTarget.value});
}

p.createElementFromString = function(string) {
  var tmp = document.createElement("div");
  tmp.innerHTML = string;
  return tmp.firstChild;
};

window.UI = UI;
