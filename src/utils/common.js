'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.setAttribute = exports.getLocalStorage = exports.setLocalStorage = void 0;
var setLocalStorage = function (data) {
  data.forEach(function (item) {
    return localStorage.setItem(item.key, item.value);
  });
};
exports.setLocalStorage = setLocalStorage;
var getLocalStorage = function (key) {
  return localStorage.getItem(key);
};
exports.getLocalStorage = getLocalStorage;
var setAttribute = function (el, name, value) {
  var _a;
  (_a = document.querySelector(el)) === null || _a === void 0 ? void 0 : _a.setAttribute(name, value);
};
exports.setAttribute = setAttribute;
