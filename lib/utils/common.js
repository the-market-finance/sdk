export var setLocalStorage = function (data) {
    data.forEach(function (item) { return localStorage.setItem(item.key, item.value); });
};
export var getLocalStorage = function (key) {
    return localStorage.getItem(key);
};
export var setAttribute = function (el, name, value) {
    var _a;
    (_a = document.querySelector(el)) === null || _a === void 0 ? void 0 : _a.setAttribute(name, value);
};
