var MediaPickerModule = require('ti.mediapicker');
var AvImageview = require('av.imageview');

var Element = require(WPATH('element'));
var NAVIGATION = require(WPATH('navigation'));

var CONFIG = arguments[0] || {};

// texts
$.navTitle.text = CONFIG.title;
if (NAVIGATION.titleDone) $.rightBtnLabel.text = NAVIGATION.titleDone;

// button events
$.backBtn.addEventListener('click', function () {
  $.winAssets.close();
});
$.rightBtn.addEventListener('click', NAVIGATION.selectDone);

// size helper
var ENV = {};
ENV.ldf = OS_IOS ? 1 : Ti.Platform.displayCaps.logicalDensityFactor;
ENV.width = function () {
  return Ti.Platform.displayCaps.platformWidth / this.ldf;
};
ENV.height = function () {
  return Ti.Platform.displayCaps.platformHeight / this.ldf;
};

var SIZE = ENV.width() / 4 - 5;

var rowsPerScreen = Math.floor(ENV.height() / (SIZE + 4));
var perrow = Math.floor(ENV.width() / (SIZE + 4));

// statics, variables
var assets = [];

var loadedRows = 0;
var to = false;
var queue = 0;
var lazy = [];

var rows = [];
var lastRow = false;

function findUrl(url) {
  for (var i = NAVIGATION.selectedItems.length - 1; i >= 0; i--) {
    if (url === NAVIGATION.selectedItems[i].url) return i;
  }
  return -1;
}

/**
* gotAssets
*/
function gotAssets(e) {
  lastRow = false;
  for (var i = e.items.length - 1, j = 0; i >= 0; i--) {
    var rownr = Math.floor(j / perrow);
    j++;

    if (!assets[rownr]) assets[rownr] = [];
    var metadata = {};
    if (e.items[i].width) {
      metadata = { width: e.items[i].width, height: e.items[i].height };
    }
    if (e.items[i].duration) {
      metadata.duration = e.items[i].duration;
    }

    assets[rownr].push({ id: e.items[i].id, url: e.items[i].url, metadata: metadata });
  }

  var len = assets.length;
  if (OS_IOS) {
    var data = [];
    for (var _i2 = 0; _i2 < rowsPerScreen * 2; _i2++) {
      data.push(addRow(true)); // this sets the initial screen
    }
    $.grid.setData(data);
  } else {
    $.grid.setContentHeight(len * (SIZE + 4) * ENV.ldf);
  }

  NAVIGATION.open($.winAssets);

  // startscreen trigger
  if (!OS_IOS) $.grid.fireEvent('scroll', { y: 0 });
  lazyLoad();
}

// scroll event for continous load
var firstRow = -1;
$.grid.addEventListener('scroll', function (e) {
  if (OS_IOS) {
    this.y = e.contentOffset.y;
    if (rows.length * (SIZE + 4) - this.y - ENV.height() <= SIZE + 4) {
      addRow();
    }
    return;
  }

  var len = assets.length;
  var row = Math.floor(e.y / ENV.ldf / (SIZE + 4));

  if (row !== firstRow) {
    //Ti.API.info('scrollpos ' + row);
    for (var i = 0; i <= rowsPerScreen + 2; i++) {
      var check = row + i;

      if (!rows[check] && check < len && check >= 0) {
        lazy.push(check);
        loadedRows++;
        rows[check] = true;
        // if (lazy.length > 8) {
        //   var job = lazy.splice(0, 1)[0];
        //   rows[job] = false;
        //   loadedRows--;
        // }
      }
    }

    if (NAVIGATION.type === 'photos' && loadedRows > rowsPerScreen * 2) {
      for (var _i3 = 0; _i3 < rows.length; _i3++) {
        if (rows[_i3] === true && (_i3 < row || _i3 > row + rowsPerScreen + 5)) {
          rows[_i3] = false;
          loadedRows--;

          for (var j = 0; j < assets[_i3].length; j++) {
            var iv = assets[_i3][j].iv;
            if (iv) iv.setImage(null);
          }
        }
      }
    }
    firstRow = row;
  }
});

// cleanup
$.winAssets.addEventListener('close', function () {
  clearTimeout(to);
  for (var i = 0; i < assets.length; i++) {
    for (var j = 0; j < assets[i].length; j++) {
      var iv = assets[i][j].iv;
      if (iv) {
        iv.image = null;
        if (OS_IOS) rows[iv.row].remove(iv);else $.grid.remove(iv);
        iv = null;
      }
    }
  }
});

// addRow
function addRow(ret) {
  var toAdd = assets[rows.length];
  if (!toAdd) return false;

  var row = Ti.UI.createTableViewRow({ height: SIZE + 4 });

  var fastScroll = new Date().getTime() - lastRow < 100 && rows.length > rowsPerScreen * 2;
  if (fastScroll) {
    $.grid.fastScroll = fastScroll;
    clearTimeout(to);
    to = setTimeout(lazyLoad, 600);
  }

  lastRow = new Date().getTime();
  lazy.push(rows.length);
  rows.push(row);
  for (var i = 0; i < toAdd.length; i++) {
    var iv = createIV(rows.length - 1, i);
    row.add(iv);
  }
  if (ret) {
    return row;
  }

  $.grid.appendRow(row);
}

// load images for lazyload
function loadImages(row, lzy) {
  var toAdd = assets[row];
  if (!toAdd) return false;

  for (var i = 0; i < toAdd.length; i++) {
    iterater(i);
  }

  function iterater(i) {
    var iv = void 0;
    if (toAdd[i].iv) {
      if (OS_ANDROID) {
        toAdd[i].iv.setImage('file://' + toAdd[i].iv.assetUrl);
        if (!queue && lzy && !$.grid.fastScroll) lazyLoad();
        return;
      }
      iv = toAdd[i].iv;
    } else {
      iv = createIV(row, i);
      if (OS_IOS) {
        rows[row].add(iv);
      } else $.grid.add(iv);
    }

    if (OS_ANDROID) {
      iv.setImage('file://' + iv.assetUrl);
      if (!queue && lzy && !$.grid.fastScroll) lazyLoad();
      setMetadata(iv.row, iv.i);
      return;
    }

    queue++;
    var url = OS_ANDROID && NAVIGATION.type === 'photos' ? iv.id : iv.assetUrl;
    MediaPickerModule.getThumb({ url: url,
      success: function success(e) {
        queue--;
        if (!e.image) return;

        if (e.width && !assets[iv.row][iv.i].metadata.width) {
          assets[iv.row][iv.i].metadata = { width: e.width, height: e.height };
          if (e.duration) assets[iv.row][iv.i].metadata.duration = e.duration;
        }
        if (e.size) {
          assets[iv.row][iv.i].metadata.size = e.size;
        }
        iv.setImage(e.image);
        setMetadata(iv.row, iv.i);

        if (!queue && lzy && !$.grid.fastScroll) lazyLoad();
      }
    });
  }
}

// lazyLoad
function lazyLoad() {
  clearTimeout(to);
  if ($.grid) $.grid.fastScroll = false;
  if (!lazy.length) {
    to = setTimeout(lazyLoad, 600);
    return;
  }
  var job = lazy.splice(lazy.length > 1 ? -2 : -1, 1)[0];

  loadImages(job, true);
}

// create image element
function createIV(row, i) {
  var toAdd = assets[row];
  var iv = AvImageview.createImageView({
    contentMode: AvImageview.CONTENT_MODE_ASPECT_FILL,
    image: null,
    top: OS_IOS ? 4 : 4 + row * (SIZE + 4),
    left: 4 + i % perrow * (SIZE + 4),
    width: SIZE,
    height: SIZE,
    assetUrl: toAdd[i].url,
    id: toAdd[i].id,
    row: row,
    i: i,
    autorotate: true
  });
  toAdd[i].iv = iv;

  iv.addEventListener(OS_IOS ? 'singletap' : 'click', function (e) {
    if (e.source.longpress) {
      e.source.longpress = false;
      return;
    }
    var _iv = e.source;
    if (e.source.overlay) {
      e.source.overlay.image = null;
      e.source.getParent().remove(e.source.overlay);
      e.source.overlay = null;
      var pos = findUrl(_iv.assetUrl);
      if (pos >= 0) NAVIGATION.selectedItems.splice(pos, 1);
    } else {
      if (NAVIGATION.max === 1 && NAVIGATION.selectedItems.length > 0) {
        for (var _i = 0; _i < NAVIGATION.selectedItems.length; _i++) {
          var obj = NAVIGATION.selectedItems[_i];
          var source = assets[obj.row][obj._i].__iv;
          source.overlay._image = null;
          source.getParent().remove(source.overlay);
          source.overlay = null;
        }
        NAVIGATION.selectedItems = [];
      } else if (NAVIGATION.max && NAVIGATION.selectedItems.length === NAVIGATION.max) {
        alert(NAVIGATION.maxAlertMsg);
        return;
      }

      addOverlay(e.source);
      NAVIGATION.selectedItems.push({ url: _iv.assetUrl, id: _iv.id, row: _iv.row, i: _iv.i, metadata: assets[_iv.row][_iv.i].metadata });
    }
    // if (NAVIGATION.selectedItems.length == 0) {
    //   done.setTitle('OK');
    // } else {
    //   done.setTitle('OK ('+NAVIGATION.selectedItems.length+')');
    // }
  });
  iv.addEventListener('longpress', function (e) {
    e.source.longpress = true;
    if (NAVIGATION.type === 'videos') {
      var winVideo = Ti.UI.createWindow({ title: 'Video' });
      var activeMovie = Ti.Media.createVideoPlayer({
        backgroundColor: '#000',
        mediaControlStyle: Titanium.Media.VIDEO_CONTROL_FULLSCREEN,
        scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT,
        autoplay: true,
        top: 0,
        left: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.FILL
      });

      var button = new Element('Button', { title: 'Back' }).addClick(function () {
        activeMovie.stop();
        activeMovie.release();
        activeMovie = null;
        winVideo.close();
      }).element;
      winVideo.setLeftNavButton(button);

      var _iv = e.source;
      if (OS_IOS) activeMovie.media = assets[_iv.row][_iv.i].url;else activeMovie.url = 'file://' + assets[_iv.row][_iv.i].url;

      activeMovie.addEventListener('complete', function () {
        if (e.reason === Ti.Media.VIDEO_FINISH_REASON_USER_EXITED && activeMovie) {
          activeMovie.stop();
          activeMovie.release();
          activeMovie = null;
          winVideo.close();
        }
      });
      winVideo.add(activeMovie);
      winVideo.open({ fullscreen: true, barColor: 'black' });
      // photo
    } else if (OS_ANDROID) {
      var view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL, backgroundColor: '#000' });
      var imageView = Ti.UI.createImageView({ image: 'file://' + this.assetUrl, touchEnabled: false, autorotate: true });

      var _closeFn = function closeFn() {
        $.winAssets.removeEventListener('androidback', _closeFn);
        view.removeEventListener('click', _closeFn);

        $.winAssets.remove(view);
        imageView = null;
        view = null;
        _closeFn = null;
      };
      $.winAssets.addEventListener('androidback', _closeFn);
      view.addEventListener('click', _closeFn);

      view.add(imageView);
      $.winAssets.add(view);
    } else {
      getImageByURL({
        key: this.assetUrl,
        id: this.id,
        success: function success(res) {
          var view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL, backgroundColor: '#000' });
          var imageView = Ti.UI.createImageView({ image: res.image, touchEnabled: false, autorotate: true });

          view.addEventListener('click', function () {
            $.winAssets.remove(view);
            imageView = null;
            view = null;
          });
          view.add(imageView);
          $.winAssets.add(view);
        }
      });
    }
  });
  return iv;
}

// display on image element
function setMetadata(row, i) {
  var r = OS_IOS ? rows[row] : $.grid;
  var ass = assets[row][i];
  var iv = ass.iv;
  var md = ass.metadata;
  if (md.width) {
    var landscape = md.width > md.height;

    r.add(Ti.UI.createView({
      top: iv.top + 5,
      left: iv.left + 5,
      width: !landscape ? 8 : 12,
      height: !landscape ? 12 : 8,
      //opacity: 0.75,
      backgroundColor: '#cccccc',
      touchEnabled: false,
      zIndex: 99
    }));

    // if (NAVIGATION.type === 'photos' && CONFIG.dpi_warning && Math.min(md.width, md.height) < CONFIG.dpi_warning) {
    //   iv.dpi = true;
    //   r.add(Ti.UI.createImageView({ image: WPATH('/images/warning.png'), width: 16, height: 16, top: iv.top + 5, left: (iv.left + SIZE) - 21, touchEnabled: false }));
    // }
    if (NAVIGATION.type === 'videos' && md.duration) {
      // duration
      var sec = Math.round(md.duration % 60);
      var min = Math.floor(md.duration / 60);
      r.add(Ti.UI.createLabel({
        text: min + ':' + (sec < 10 ? '0' : '') + sec,
        textAlign: 'center',
        color: '#fff',
        backgroundColor: '#000',
        opacity: 0.75,
        height: 15,
        width: SIZE / 2,
        font: { fontFamily: 'Helvetica Neue', fontSize: '12dp', fontWeight: 'bold' },
        top: iv.top + SIZE - 15,
        left: iv.left,
        touchEnabled: false
      }));
    }
  }

  // repop selected
  var pos = findUrl(ass.url);
  if (pos >= 0) {
    addOverlay(iv);
  }
}

// selected icon
function addOverlay(iv) {
  iv.overlay = new Element('View', {
    left: iv.left,
    top: iv.top,
    touchEnabled: false,
    width: SIZE,
    height: SIZE
  }).addTo(iv.getParent()).element;

  var _width = SIZE / 4;
  new Element('View', {
    width: _width,
    height: _width,
    right: _width / 2,
    bottom: _width / 2,
    backgroundColor: '#1c93ef',
    borderRadius: _width / 2
  }).add(new Element('Label', {
    font: { fontFamily: 'themify', fontSize: '16dp' },
    color: 'white',
    text: '\uE64C'
  }).element).addTo(iv.overlay);
}

// get image blob
function getImageByURL(opt) {
  if (OS_IOS) MediaPickerModule.getImageByURL(opt);else {
    var payload = opt.payload || {};
    if (opt.payload) delete opt.payload; // eslint-disable-line
    MediaPickerModule.getImageByURL(opt, payload);
  }
}

exports.gotAssets = gotAssets;
