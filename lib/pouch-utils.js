'use strict';

/* istanbul ignore next */
function _interopDefault (ex) { 
  if(ex && (typeof ex === 'object') && 'default' in ex) {
    return ex['default'];
  }
  return ex;
}

/* istanbul ignore next */
function _getPromise() {
  if(typeof Promise === 'function') {
    return Promise;
  }
  return _interopDefault(require('pouchdb-promise'));
}

var Promise = _getPromise();

/* istanbul ignore next */
exports.once = function (fun) {
  var called = false;
  return exports.getArguments(function (args) {
    if (called) {
      console.trace();
      throw new Error('once called  more than once');
    } else {
      called = true;
      fun.apply(this, args);
    }
  });
};
/* istanbul ignore next */
exports.getArguments = function (fun) {
  return function () {
    var len = arguments.length;
    var args = new Array(len);
    var i = -1;
    while (++i < len) {
      args[i] = arguments[i];
    }
    return fun.call(this, args);
  };
};
/* istanbul ignore next */
exports.toPromise = function (func) {
  //create the function we will be returning
  return exports.getArguments(function (args) {
    var self = this;
    var tempCB = (typeof args[args.length - 1] === 'function') ? args.pop() : false;
    // if the last argument is a function, assume its a callback
    var usedCB;
    if (tempCB) {
      // if it was a callback, create a new callback which calls it,
      // but do so async so we don't trap any errors
      usedCB = function (err, resp) {
        process.nextTick(function () {
          tempCB(err, resp);
        });
      };
    }
    var promise = new Promise(function (fulfill, reject) {
      try {
        var callback = exports.once(function (err, mesg) {
          if (err) {
            reject(err);
          } else {
            fulfill(mesg);
          }
        });
        // create a callback for this invocation
        // apply the function in the orig context
        args.push(callback);
        func.apply(self, args);
      } catch (e) {
        reject(e);
      }
    });
    // if there is a callback, call it back
    if (usedCB) {
      promise.then(function (result) {
        usedCB(null, result);
      }, usedCB);
    }
    promise.cancel = function () {
      return this;
    };
    return promise;
  });
};

// execute some promises in a chain
exports.series = function (promiseFactories) {
  var chain = exports.Promise.resolve();
  var overallRes = new Array(promiseFactories.length);
  promiseFactories.forEach(function (promiseFactory, i) {
    chain = chain.then(promiseFactories[i]).then(function (res) {
      overallRes[i] = res;
    });
  });
  return chain.then(function () {
    return overallRes;
  });
};

exports.inherits = require('inherits');
exports.Promise = Promise;
exports.extend = require('pouchdb-extend');
