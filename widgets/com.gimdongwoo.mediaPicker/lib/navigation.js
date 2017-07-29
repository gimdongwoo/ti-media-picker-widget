'use strict';

var LAVIGATION = {
  stack: [],
  callback: null,
  max: 10,
  type: 'photos',
  titleDone: 'Done',
  maxAlertMsg: 'maximum number of images selected!',
  selectedItems: [],
  android: Titanium.Platform.name === 'android',
  ios: Titanium.Platform.name === 'iPhone OS',
  init: function init() {
    this.closeAll = this.closeAll.bind(this);
    this.selectDone = this.selectDone.bind(this);
  },
  open: function open(win) {
    var _this = this;

    this.stack.push(win);

    win.addEventListener('close', function () {
      _this.stack.pop();
    });

    if (this.android) {
      win.open();
    } else if (this.stack.length === 1) {
      this.navGroup = Ti.UI.iOS.createNavigationWindow({
        window: win
      });
      this.navGroup.open();
    } else {
      this.navGroup.openWindow(win);
    }
  },
  closeAll: function closeAll() {
    if (this.ios) {
      this.navGroup.close();
    } else {
      for (var i = this.stack.length - 1; i >= 0; i--) {
        this.stack[i].close();
      }
    }
    this.stack = [];
  },
  selectDone: function selectDone() {
    this.closeAll();
    if (typeof this.callback === 'function') this.callback(this.selectedItems);
  }
};
LAVIGATION.init();

module.exports = LAVIGATION;
