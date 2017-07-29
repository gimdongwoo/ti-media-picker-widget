# ti-media-picker-widget

**Titanium Mobile MediaPicker Widget for iOS and Android**

Developed as a widget for easy use with [TiMediaPicker](https://github.com/lowb1rd/TiMediaPicker).

## Features
- Multiple selections are possible.
- Fastscroll support for large galleries.
- UI is completely develop of Titanium Alloy.

## ScreenShot

![](./screenshot.png)

## Demo Video

[https://youtu.be/F1bCNAG0iYw](https://youtu.be/F1bCNAG0iYw)

[![](https://img.youtube.com/vi/F1bCNAG0iYw/0.jpg)](https://www.youtube.com/watch?v=F1bCNAG0iYw)

## How to use

```
var MediaPicker = Alloy.createWidget('com.gimdongwoo.mediaPicker');

function callback(items) {
  var photoInfos = [];
  var iterate = function iterate(item) {
    var _name = item.url.substring(item.url.lastIndexOf('/') + 1);
    if (_name.indexOf('?') > -1) _name = _name.substring(0, _name.indexOf('?'));
    MediaPicker.getImageByURL({
      key: item.url,
      id: item.id,
      success: function success(e) {
        photoInfos.push({
          url: item.url,
          id: item.id,
          name: _name,
          blob: e.image.apiName === 'Ti.Blob' ? e.image : null,
          file: e.image.apiName === 'Ti.Blob' ? null : 'file://' + e.image,
          width: e.width,
          height: e.height
        });
        
        if (items.length) iterate(items.splice(0, 1)[0]);
        else {
          // END
          Ti.API.info('success', photoInfos);
        }
      }
    });
  };
  if (items.length) iterate(items.splice(0, 1)[0]);
}

MediaPicker.show({
  callback: callback,
  // The following are optional
  max: 10,
  type: 'photos',
  titleDone: 'Done',
  maxAlertMsg: 'maximum number of images selected!'
});
```

## Quick Start

1. Download this repository as a ZIP file.
2. Copy `widget` and `modules` to your project.
3. Copy `themify.ttf` from `font` to `app/assets/fonts`
4. Add the widget as a dependency to your `app/config.json` file:

	```
	"dependencies": {
	  "com.gimdongwoo.mediaPicker": "1.0.0"
	}
	
	```
5. Add the module as a modules to your `tiapp.xml` file:

	```
	<modules>
	  <module platform="iphone">ti.mediapicker</module>
	  <module platform="android">ti.mediapicker</module>
	</modules>
	```

## Reference

1. [TiMediaPicker Module](https://github.com/lowb1rd/TiMediaPicker)
	- [My fork repository](https://github.com/gimdongwoo/TiMediaPicker)
2. [Themify Icon Font](https://themify.me/themify-icons)

## Changelog

### Version 1.0.0
- Initial Release