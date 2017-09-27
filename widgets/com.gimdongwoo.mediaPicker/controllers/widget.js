var MediaPickerModule = require('ti.mediapicker');

var Element = require(WPATH('element'));
var NAVIGATION = require(WPATH('navigation'));

// button events
$.backBtn.addEventListener('click', NAVIGATION.closeAll);
$.rightBtn.addEventListener('click', NAVIGATION.selectDone);

// window title
var LANG = {
  photos: 'Images',
  videos: 'Videos'
};

/**
* gotAssetGroups
*/
function gotAssetGroups(e) {
  var data = [];
  var nr = 0;

  var sortedKeys = Object.keys(e.items).sort(function (a, b) {
    return a - b;
  });

  _.each(sortedKeys || [], function (key) {
    var obj = e.items[key];
    var row = Ti.UI.createTableViewRow({ hasChild: true, height: 55, caption: obj.name, width: Ti.UI.FILL, layout: 'horizontal', cnt: obj.count, nr: OS_IOS ? nr : key });

    if (obj.count) {
      new Element('ImageView', {
        image: obj.image,
        width: 55,
        height: 55,
        left: 0,
        autorotate: true
      }).addTo(row);
    } else {
      // no image
      new Element('View', {
        width: 55,
        height: 55,
        left: 0,
        backgroundColor: '#F9F9F9'
      }).add(new Element('Label', {
        font: { fontFamily: 'themify', fontSize: '30dp' },
        color: '#F9F9F9',
        text: '\uE64E'
      }).element).addTo(row);
    }

    new Element('Label', {
      text: obj.name,
      font: { fontFamily: 'Helvetica Neue', fontSize: '16dp', fontWeight: 'bold' },
      color: '#000',
      height: 55,
      left: 10,
      top: 0
    }).addTo(row);

    new Element('Label', {
      text: ' (' + obj.count + ')',
      font: { fontFamily: 'Helvetica Neue', fontSize: '16dp' },
      color: '#000',
      height: 55,
      left: 5,
      top: 0
    }).addTo(row);

    data.push(row);
    nr++;
  });

  $.assetsTable.setData(data);

  // then table row clicked, open winAssets window.
  $.assetsTable.addEventListener('click', function (evt) {
    var gotAssets = function gotAssets(_evt) {
      Widget.createController('winAssets', { title: evt.rowData.caption }).gotAssets(_evt);
    };

    MediaPickerModule.getPhotos({
      nr: evt.rowData.nr,
      type: NAVIGATION.type,
      success: gotAssets
    });
  });
}

exports.show = function (_ref) {
  var callback = _ref.callback,
      max = _ref.max,
      type = _ref.type,
      titleDone = _ref.titleDone,
      maxAlertMsg = _ref.maxAlertMsg;

  // init NAVIGATION
  NAVIGATION.callback = callback;
  NAVIGATION.max = max || 10;
  NAVIGATION.maxAlertMsg = maxAlertMsg || 'maximum number of images selected!';
  NAVIGATION.type = type || 'photos';
  NAVIGATION.titleDone = titleDone || 'Done';
  NAVIGATION.selectedItems = [];

  // texts
  $.navTitle.text = LANG[NAVIGATION.type];
  if (NAVIGATION.titleDone) $.rightBtnLabel.text = NAVIGATION.titleDone;

  // display asset groups
  MediaPickerModule.getAssetGroups({ type: NAVIGATION.type,
    success: gotAssetGroups,
    error: function error() {
      alert('Sorry, something wrong.');
    }
  });

  // open
  NAVIGATION.open($.winAssetGroups);
};

// get image blob
exports.getImageByURL = function (opt) {
  if (OS_IOS) MediaPickerModule.getImageByURL(opt);else {
    var payload = opt.payload || {};
    if (opt.payload) delete opt.payload; // eslint-disable-line
    MediaPickerModule.getImageByURL(opt, payload);
  }
};
