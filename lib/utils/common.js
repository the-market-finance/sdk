"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAttribute = exports.getLocalStorage = exports.setLocalStorage = void 0;
const setLocalStorage = (data) => {
    data.forEach((item) => localStorage.setItem(item.key, item.value));
};
exports.setLocalStorage = setLocalStorage;
const getLocalStorage = (key) => {
    return localStorage.getItem(key);
};
exports.getLocalStorage = getLocalStorage;
const setAttribute = (el, name, value) => {
    document.querySelector(el)?.setAttribute(name, value);
};
exports.setAttribute = setAttribute;
