'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Greeter = exports.deposit = void 0;
var actions_1 = require('./actions');
Object.defineProperty(exports, 'deposit', {
  enumerable: true,
  get: function () {
    return actions_1.deposit;
  },
});
var Greeter = function (name) {
  return 'Hello ' + name;
};
exports.Greeter = Greeter;
