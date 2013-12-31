'use strict';

/**
 * "goto" 's background scrupt.
 * @constructor
 */
var Background = function() {
  this.setEvents_();


  this.childTemplate = '<li data-tab-id="<%= id %>"><p><%= title %></p><p><%= url %></p></li>'

  /**
   * The port to connect to frontend
   * @type {Port}
   */
  this.port = null;


  /**
   * The cache of tabs.
   * @type {!Array}
   * @private
   */
  this.tabCache_ = []


  /**
   * The cache of html.
   * @type {String}
   * @private
   */
  this.childrenHtmlCache_ = '';


  /**
   * Whether caches is cleaned up.
   * @type {Boolean}
   * @private
   */
  this.cleanedup_ = false;


  /**
   * The option which is used in fuzzy search.
   * @type {Object}
   */
  this.fuseOption_ = {
    keys: ['title', 'url']
  }

  this.fuse_ = null;
  this.isSearching_ = false
};

var p = Background.prototype;

/**
 * Set Events.
 * @private
 */
p.setEvents_ = function() {
  chrome.extension.onConnect.addListener(this.onConnect_.bind(this));
  // add event listeners for tab changes
  chrome.tabs.onCreated.addListener(this.onTabUpdate_.bind(this));
  // chrome.tabs.onUpdated.addListener(this.onTabUpdate_.bind(this));
  chrome.tabs.onRemoved.addListener(this.onTabUpdate_.bind(this));
  chrome.tabs.onReplaced.addListener(this.onTabUpdate_.bind(this));
};


/**
 * Set Event that is called when this script is connected from frontend.
 * @private
 */
p.onConnect_ = function(port) {
  this.port = port;
  this.port.onMessage.addListener(this.onMessage_.bind(this));
};


/**
 * The method that is called when message is sent from frontend.
 * @param  {Object} message the message that is sent from frontend.
 */
p.onMessage_ = function(message) {
  var key = message.key
  switch(key) {
    case 'tabs':
      this.getCurrentTabs();
      break;
    case 'isChanged':
      this.port.postMessage({isTabChanged: this.cleanedup_});
      this.cleanedup_ = false;
      break;
    case 'search':
      this.search_(message.query);
      break;
    case 'tabUpdate':
      chrome.tabs.executeScript(message.id, {
        "file": "../content_scripts/keymaps.js" //Inject Code
      }, function(){
        console.log('test');
        chrome.tabs.executeScript(message.id, {
          "file": "../content_scripts/ui.js" //Inject Code
        }, function(){
          console.log('test');
          chrome.tabs.insertCSS(message.id, {
            "file": "../content_scripts/default.js" //Inject Code
          }, function() {
            console.log('test');
            chrome.tabs.update(message.id, {selected: true}, function() {});
          });
        });
      });
      break;
  }
};

/**
 * The method that is called when one of tabs has changed
 * @private
 */
p.onTabUpdate_ = function() {
  this.tabCache_ = [];
  this.childrenHtmlCache_ = '';
  this.cleanedup_ = true;
}


/**
 * Search tabs by query.
 * @param  {!String} query query.
 */
p.search_ = function(query) {
  if(this.isSearching_){
    return;
  }
  var result = this.fuse_.search(query);
  var htmlResult = '';
  for (var i = 0, tab; tab = result[i]; i++) {
    htmlResult += _.template(this.childTemplate,{id: tab.id, title: tab.title, url: tab.url});
  }
  this.port.postMessage({searchResult: htmlResult});
}

/**
 * Get tabs which are currently opened.
 */
p.getCurrentTabs = function() {
  if (!!this.tabCache_.length && !!this.childrenHtmlCache_) {
    this.port.postMessage({html: this.childrenHtmlCache_, tabsArray: this.tabCache_});
  } else {
    chrome.tabs.query({}, function(tabsArray) {
      for (var i = 0, tab; tab = tabsArray[i]; i++) {
        this.tabCache_.push(_.pick(tab,'url', 'title', 'id'));
      };
      for (var i = 0, tab; tab = this.tabCache_[i]; i++) {
        this.childrenHtmlCache_ += _.template(this.childTemplate,{id: tab.id, title: tab.title, url: tab.url});
      }
      this.port.postMessage({html: this.childrenHtmlCache_, tabsArray: this.tabCache_});
      this.fuse_ = new Fuse(this.tabCache_, this.fuseOption_);
    }.bind(this))
  }
};


var background = new Background();
