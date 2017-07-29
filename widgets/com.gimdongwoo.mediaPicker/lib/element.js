'use strict';

var Element = function Element(type, options) {
  this.element = Ti.UI['create' + type](options);

  return this;
};
Element.prototype.addClick = function (fn) {
  this.element.addEventListener('click', fn);

  return this;
};
Element.prototype.addTo = function (to) {
  to.add(this.element);

  return this;
};
Element.prototype.add = function (child) {
  this.element.add(child);

  return this;
};

module.exports = Element;
