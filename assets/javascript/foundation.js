'use strict';

window.whatInput = function () {

  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // `input` types that don't accept text
  var nonTypingInputs = ['button', 'checkbox', 'file', 'image', 'radio', 'reset', 'submit'];

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  var mouseWheel = detectWheel();

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  var ignoreMap = [16, // shift
  17, // control
  18, // alt
  91, // Windows key / left Apple cmd
  93 // Windows menu / right Apple cmd
  ];

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'keyup': 'keyboard',
    'mousedown': 'mouse',
    'mousemove': 'mouse',
    'MSPointerDown': 'pointer',
    'MSPointerMove': 'pointer',
    'pointerdown': 'pointer',
    'pointermove': 'pointer',
    'touchstart': 'touch'
  };

  // add correct mouse wheel event mapping to `inputMap`
  inputMap[detectWheel()] = 'mouse';

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to a common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  // allows events that are also triggered to be filtered out for `touchstart`
  function eventBuffer() {
    clearTimer();
    setInput(event);

    buffer = true;
    timer = window.setTimeout(function () {
      buffer = false;
    }, 650);
  }

  function bufferedEvent(event) {
    if (!buffer) setInput(event);
  }

  function unBufferedEvent(event) {
    clearTimer();
    setInput(event);
  }

  function clearTimer() {
    window.clearTimeout(timer);
  }

  function setInput(event) {
    var eventKey = key(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    // don't do anything if the value matches the input type already set
    if (currentInput !== value) {
      var eventTarget = target(event);
      var eventTargetNode = eventTarget.nodeName.toLowerCase();
      var eventTargetType = eventTargetNode === 'input' ? eventTarget.getAttribute('type') : null;

      if ( // only if the user flag to allow typing in form fields isn't set
      !body.hasAttribute('data-whatinput-formtyping') &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' && (

      // only if the target is a form input that accepts text
      eventTargetNode === 'textarea' || eventTargetNode === 'select' || eventTargetNode === 'input' && nonTypingInputs.indexOf(eventTargetType) < 0) ||
      // ignore modifier keys
      ignoreMap.indexOf(eventKey) > -1) {
        // ignore keyboard typing
      } else {
          switchInput(value);
        }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function switchInput(string) {
    currentInput = string;
    body.setAttribute('data-whatinput', currentInput);

    if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType];
    } else {
      return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
    }
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {
    body = document.body;

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      body.addEventListener('pointerdown', bufferedEvent);
      body.addEventListener('pointermove', bufferedEvent);
    } else if (window.MSPointerEvent) {
      body.addEventListener('MSPointerDown', bufferedEvent);
      body.addEventListener('MSPointerMove', bufferedEvent);
    } else {

      // mouse events
      body.addEventListener('mousedown', bufferedEvent);
      body.addEventListener('mousemove', bufferedEvent);

      // touch events
      if ('ontouchstart' in window) {
        body.addEventListener('touchstart', eventBuffer);
      }
    }

    // mouse wheel
    body.addEventListener(mouseWheel, bufferedEvent);

    // keyboard events
    body.addEventListener('keydown', unBufferedEvent);
    body.addEventListener('keyup', unBufferedEvent);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    utilities
    ---------------
  */

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  function detectWheel() {
    return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
  }

  /*
    ---------------
    init
      don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {

    // if the dom is already ready already (script was placed at bottom of <body>)
    if (document.body) {
      bindEvents();

      // otherwise wait for the dom to load (script was placed in the <head>)
    } else {
        document.addEventListener('DOMContentLoaded', bindEvents);
      }
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function () {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function () {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function () {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: switchInput
  };
}();
;!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.1';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function (event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function (event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
          // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
          if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
        }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled.apply();
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled.apply();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function ($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function (componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function () {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        self.queries.push({
          name: key,
          value: 'only screen and (min-width: ' + namedQueries[key] + ')'
        });
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function (size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function (size) {
      for (var i in this.queries) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function () {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function () {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize();

        if (newSize !== _this.current) {
          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, _this.current]);

          // Change the current media query
          _this.current = newSize;
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function (media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function (menu) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? 'zf' : arguments[1];

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function (menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('*').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        cb();
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

		$.spotSwipe = {
				version: '1.0.0',
				enabled: 'ontouchstart' in document.documentElement,
				preventDefault: false,
				moveThreshold: 75,
				timeThreshold: 200
		};

		var startPosX,
		    startPosY,
		    startTime,
		    elapsedTime,
		    isMoving = false;

		function onTouchEnd() {
				//  alert(this);
				this.removeEventListener('touchmove', onTouchMove);
				this.removeEventListener('touchend', onTouchEnd);
				isMoving = false;
		}

		function onTouchMove(e) {
				if ($.spotSwipe.preventDefault) {
						e.preventDefault();
				}
				if (isMoving) {
						var x = e.touches[0].pageX;
						var y = e.touches[0].pageY;
						var dx = startPosX - x;
						var dy = startPosY - y;
						var dir;
						elapsedTime = new Date().getTime() - startTime;
						if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
								dir = dx > 0 ? 'left' : 'right';
						}
						// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
						//   dir = dy > 0 ? 'down' : 'up';
						// }
						if (dir) {
								e.preventDefault();
								onTouchEnd.call(this);
								$(this).trigger('swipe', dir).trigger('swipe' + dir);
						}
				}
		}

		function onTouchStart(e) {
				if (e.touches.length == 1) {
						startPosX = e.touches[0].pageX;
						startPosY = e.touches[0].pageY;
						isMoving = true;
						startTime = new Date().getTime();
						this.addEventListener('touchmove', onTouchMove, false);
						this.addEventListener('touchend', onTouchEnd, false);
				}
		}

		function init() {
				this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
		}

		function teardown() {
				this.removeEventListener('touchstart', onTouchStart);
		}

		$.event.special.swipe = { setup: init };

		$.each(['left', 'up', 'down', 'right'], function () {
				$.event.special['swipe' + this] = { setup: function () {
								$(this).on('swipe', $.noop);
						} };
		});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
		$.fn.addTouch = function () {
				this.each(function (i, el) {
						$(el).bind('touchstart touchmove touchend touchcancel', function () {
								//we pass the original event object because the jQuery event
								//object is normalized to w3c specs and does not provide the TouchList
								handleTouch(event);
						});
				});

				var handleTouch = function (event) {
						var touches = event.changedTouches,
						    first = touches[0],
						    eventTypes = {
								touchstart: 'mousedown',
								touchmove: 'mousemove',
								touchend: 'mouseup'
						},
						    type = eventTypes[event.type],
						    simulatedEvent;

						if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
								simulatedEvent = window.MouseEvent(type, {
										'bubbles': true,
										'cancelable': true,
										'screenX': first.screenX,
										'screenY': first.screenY,
										'clientX': first.clientX,
										'clientY': first.clientY
								});
						} else {
								simulatedEvent = document.createEvent('MouseEvent');
								simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
						}
						first.target.dispatchEvent(simulatedEvent);
				};
		};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function (el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).load(function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  var Abide = function () {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Abide(element) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _classCallCheck(this, Abide);

      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */


    _createClass(Abide, [{
      key: '_init',
      value: function _init() {
        this.$inputs = this.$element.find('input, textarea, select').not('[data-abide-ignore]');

        this._events();
      }

      /**
       * Initializes events for Abide.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        this.$element.off('.abide').on('reset.zf.abide', function () {
          _this2.resetForm();
        }).on('submit.zf.abide', function () {
          return _this2.validateForm();
        });

        if (this.options.validateOn === 'fieldChange') {
          this.$inputs.off('change.zf.abide').on('change.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.liveValidate) {
          this.$inputs.off('input.zf.abide').on('input.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }
      }

      /**
       * Calls necessary functions to update Abide upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        this._init();
      }

      /**
       * Checks whether or not a form element has the required attribute and if it's checked or not
       * @param {Object} element - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'requiredCheck',
      value: function requiredCheck($el) {
        if (!$el.attr('required')) return true;

        var isGood = true;

        switch ($el[0].type) {
          case 'select':
          case 'select-one':
          case 'select-multiple':
            var opt = $el.find('option:selected');
            if (!opt.length || !opt.val()) isGood = false;
            break;

          default:
            if (!$el.val() || !$el.val().length) isGood = false;
        }

        return isGood;
      }

      /**
       * Based on $el, get the first element with selector in this order:
       * 1. The element's direct sibling('s).
       * 3. The element's parent's children.
       *
       * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
       *
       * @param {Object} $el - jQuery object to use as reference to find the form error selector.
       * @returns {Object} jQuery object with the selector.
       */

    }, {
      key: 'findFormError',
      value: function findFormError($el) {
        var $error = $el.siblings(this.options.formErrorSelector);

        if (!$error.length) {
          $error = $el.parent().find(this.options.formErrorSelector);
        }

        return $error;
      }

      /**
       * Get the first element in this order:
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findLabel',
      value: function findLabel($el) {
        var id = $el[0].id;
        var $label = this.$element.find('label[for="' + id + '"]');

        if (!$label.length) {
          return $el.closest('label');
        }

        return $label;
      }

      /**
       * Get the set of labels associated with a set of radio els in this order
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findRadioLabels',
      value: function findRadioLabels($els) {
        var _this3 = this;

        var labels = $els.map(function (i, el) {
          var id = el.id;
          var $label = _this3.$element.find('label[for="' + id + '"]');

          if (!$label.length) {
            $label = $(el).closest('label');
          }
          return $label[0];
        });

        return $(labels);
      }

      /**
       * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
       * @param {Object} $el - jQuery object to add the class to
       */

    }, {
      key: 'addErrorClasses',
      value: function addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.addClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.addClass(this.options.formErrorClass);
        }

        $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
      }

      /**
       * Remove CSS error classes etc from an entire radio button group
       * @param {String} groupName - A string that specifies the name of a radio button group
       *
       */

    }, {
      key: 'removeRadioErrorClasses',
      value: function removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(':radio[name="' + groupName + '"]');
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
          $labels.removeClass(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
          $formErrors.removeClass(this.options.formErrorClass);
        }

        $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Removes CSS error class as specified by the Abide settings from the label, input, and the form
       * @param {Object} $el - jQuery object to remove the class from
       */

    }, {
      key: 'removeErrorClasses',
      value: function removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
          return this.removeRadioErrorClasses($el.attr('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.removeClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.removeClass(this.options.formErrorClass);
        }

        $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
       * @fires Abide#invalid
       * @fires Abide#valid
       * @param {Object} element - jQuery object to validate, should be an HTML input
       * @returns {Boolean} goodToGo - If the input is valid or not.
       */

    }, {
      key: 'validateInput',
      value: function validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.attr('data-validator'),
            equalTo = true;

        switch ($el[0].type) {
          case 'radio':
            validated = this.validateRadio($el.attr('name'));
            break;

          case 'checkbox':
            validated = clearRequire;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            validated = clearRequire;
            break;

          default:
            validated = this.validateText($el);
        }

        if (validator) {
          customValidator = this.matchValidation($el, validator, $el.attr('required'));
        }

        if ($el.attr('data-equalto')) {
          equalTo = this.options.validators.equalTo($el);
        }

        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
      }

      /**
       * Goes through a form and if there are any invalid inputs, it will display the form error element
       * @returns {Boolean} noError - true if no errors were detected...
       * @fires Abide#formvalid
       * @fires Abide#forminvalid
       */

    }, {
      key: 'validateForm',
      value: function validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
          acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
      }

      /**
       * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
       * @param {Object} $el - jQuery object to validate, should be a text input HTML element
       * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
       * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
       */

    }, {
      key: 'validateText',
      value: function validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = pattern || $el.attr('pattern') || $el.attr('type');
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
          // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
          if (this.options.patterns.hasOwnProperty(pattern)) {
            valid = this.options.patterns[pattern].test(inputText);
          }
          // If the pattern name isn't also the type attribute of the field, then test it as a regexp
          else if (pattern !== $el.attr('type')) {
              valid = new RegExp(pattern).test(inputText);
            } else {
              valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
          }

        return valid;
      }

      /**
       * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
       * @param {String} groupName - A string that specifies the name of a radio button group
       * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
       */

    }, {
      key: 'validateRadio',
      value: function validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(':radio[name="' + groupName + '"]');
        var valid = false;

        // .attr() returns undefined if no elements in $group have the attribute "required"
        if ($group.attr('required') === undefined) {
          valid = true;
        }

        // For the group to be valid, at least one radio needs to be checked
        $group.each(function (i, e) {
          if ($(e).prop('checked')) {
            valid = true;
          }
        });

        return valid;
      }

      /**
       * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
       * @param {Object} $el - jQuery input element.
       * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
       * @param {Boolean} required - self explanatory?
       * @returns {Boolean} - true if validations passed.
       */

    }, {
      key: 'matchValidation',
      value: function matchValidation($el, validators, required) {
        var _this4 = this;

        required = required ? true : false;

        var clear = validators.split(' ').map(function (v) {
          return _this4.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
      }

      /**
       * Resets form inputs and styles
       * @fires Abide#formreset
       */

    }, {
      key: 'resetForm',
      value: function resetForm() {
        var $form = this.$element,
            opts = this.options;

        $('.' + opts.labelErrorClass, $form).not('small').removeClass(opts.labelErrorClass);
        $('.' + opts.inputErrorClass, $form).not('small').removeClass(opts.inputErrorClass);
        $(opts.formErrorSelector + '.' + opts.formErrorClass).removeClass(opts.formErrorClass);
        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, [data-abide-ignore]').val('').removeAttr('data-invalid');
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
      }

      /**
       * Destroys an instance of Abide.
       * Removes error styles and classes from elements, without resetting their values.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        var _this = this;
        this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

        this.$inputs.off('.abide').each(function () {
          _this.removeErrorClasses($(this));
        });

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Abide;
  }();

  /**
   * Default settings for plugin
   */


  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @example 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @example 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @example 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @example '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @example 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @example false
     */
    liveValidate: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function (el, required, parent) {
        return $('#' + el.attr('data-equalto')).val() === el.val();
      }
    }
  };

  // Window exports
  Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  var Accordion = function () {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */

    function Accordion(element, options) {
      _classCallCheck(this, Accordion);

      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */


    _createClass(Accordion, [{
      key: '_init',
      value: function _init() {
        this.$element.attr('role', 'tablist');
        this.$tabs = this.$element.children('li, [data-accordion-item]');

        this.$tabs.each(function (idx, el) {
          var $el = $(el),
              $content = $el.children('[data-tab-content]'),
              id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
              linkId = el.id || id + '-label';

          $el.find('a:first').attr({
            'aria-controls': id,
            'role': 'tab',
            'id': linkId,
            'aria-expanded': false,
            'aria-selected': false
          });

          $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
        });
        var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
        if ($initActive.length) {
          this.down($initActive, true);
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the accordion.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$tabs.each(function () {
          var $elem = $(this);
          var $tabContent = $elem.children('[data-tab-content]');
          if ($tabContent.length) {
            $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
              // $(this).children('a').on('click.zf.accordion', function(e) {
              e.preventDefault();
              if ($elem.hasClass('is-active')) {
                if (_this.options.allowAllClosed || $elem.siblings().hasClass('is-active')) {
                  _this.up($tabContent);
                }
              } else {
                _this.down($tabContent);
              }
            }).on('keydown.zf.accordion', function (e) {
              Foundation.Keyboard.handleKey(e, 'Accordion', {
                toggle: function () {
                  _this.toggle($tabContent);
                },
                next: function () {
                  var $a = $elem.next().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                previous: function () {
                  var $a = $elem.prev().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                handled: function () {
                  e.preventDefault();
                  e.stopPropagation();
                }
              });
            });
          }
        });
      }

      /**
       * Toggles the selected content pane's open/close state.
       * @param {jQuery} $target - jQuery object of the pane to toggle.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if ($target.parent().hasClass('is-active')) {
          if (this.options.allowAllClosed || $target.parent().siblings().hasClass('is-active')) {
            this.up($target);
          } else {
            return;
          }
        } else {
          this.down($target);
        }
      }

      /**
       * Opens the accordion tab defined by `$target`.
       * @param {jQuery} $target - Accordion pane to open.
       * @param {Boolean} firstTime - flag to determine if reflow should happen.
       * @fires Accordion#down
       * @function
       */

    }, {
      key: 'down',
      value: function down($target, firstTime) {
        var _this2 = this;

        if (!this.options.multiExpand && !firstTime) {
          var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
          if ($currentActive.length) {
            this.up($currentActive);
          }
        }

        $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

        $target.slideDown(this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done opening.
           * @event Accordion#down
           */
          _this2.$element.trigger('down.zf.accordion', [$target]);
        });

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': true,
          'aria-selected': true
        });
      }

      /**
       * Closes the tab defined by `$target`.
       * @param {jQuery} $target - Accordion tab to close.
       * @fires Accordion#up
       * @function
       */

    }, {
      key: 'up',
      value: function up($target) {
        var $aunts = $target.parent().siblings(),
            _this = this;
        var canClose = this.options.multiExpand ? $aunts.hasClass('is-active') : $target.parent().hasClass('is-active');

        if (!this.options.allowAllClosed && !canClose) {
          return;
        }

        // Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideUp(_this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done collapsing up.
           * @event Accordion#up
           */
          _this.$element.trigger('up.zf.accordion', [$target]);
        });
        // });

        $target.attr('aria-hidden', true).parent().removeClass('is-active');

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': false,
          'aria-selected': false
        });
      }

      /**
       * Destroys an instance of an accordion.
       * @fires Accordion#destroyed
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-tab-content]').slideUp(0).css('display', '');
        this.$element.find('a').off('.zf.accordion');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Accordion;
  }();

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var AccordionMenu = function () {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function AccordionMenu(element, options) {
      _classCallCheck(this, AccordionMenu);

      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */


    _createClass(AccordionMenu, [{
      key: '_init',
      value: function _init() {
        this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
        this.$element.attr({
          'role': 'tablist',
          'aria-multiselectable': this.options.multiOpen
        });

        this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
        this.$menuLinks.each(function () {
          var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
              $elem = $(this),
              $sub = $elem.children('[data-submenu]'),
              subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
              isActive = $sub.hasClass('is-active');
          $elem.attr({
            'aria-controls': subId,
            'aria-expanded': isActive,
            'role': 'tab',
            'id': linkId
          });
          $sub.attr({
            'aria-labelledby': linkId,
            'aria-hidden': !isActive,
            'role': 'tabpanel',
            'id': subId
          });
        });
        var initPanes = this.$element.find('.is-active');
        if (initPanes.length) {
          var _this = this;
          initPanes.each(function () {
            _this.down($(this));
          });
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the menu.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.find('li').each(function () {
          var $submenu = $(this).children('[data-submenu]');

          if ($submenu.length) {
            $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              e.preventDefault();

              _this.toggle($submenu);
            });
          }
        }).on('keydown.zf.accordionmenu', function (e) {
          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement,
              $target = $element.children('[data-submenu]');

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

              if ($(this).children('[data-submenu]:visible').length) {
                // has open sub menu
                $nextElement = $element.find('li:first-child').find('a').first();
              }
              if ($(this).is(':first-child')) {
                // is first element of sub menu
                $prevElement = $element.parents('li').first().find('a').first();
              } else if ($prevElement.children('[data-submenu]:visible').length) {
                // if previous element has open sub menu
                $prevElement = $prevElement.find('li:last-child').find('a').first();
              }
              if ($(this).is(':last-child')) {
                // is last element of sub menu
                $nextElement = $element.parents('li').first().next('li').find('a').first();
              }

              return;
            }
          });
          Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
            open: function () {
              if ($target.is(':hidden')) {
                _this.down($target);
                $target.find('li').first().find('a').first().focus();
              }
            },
            close: function () {
              if ($target.length && !$target.is(':hidden')) {
                // close active sub of this item
                _this.up($target);
              } else if ($element.parent('[data-submenu]').length) {
                // close currently open sub
                _this.up($element.parent('[data-submenu]'));
                $element.parents('li').first().find('a').first().focus();
              }
            },
            up: function () {
              $prevElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            toggle: function () {
              if ($element.children('[data-submenu]').length) {
                _this.toggle($element.children('[data-submenu]'));
              }
            },
            closeAll: function () {
              _this.hideAll();
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); //.attr('tabindex', 0);
      }

      /**
       * Closes all panes of the menu.
       * @function
       */

    }, {
      key: 'hideAll',
      value: function hideAll() {
        this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
      }

      /**
       * Toggles the open/close state of a submenu.
       * @function
       * @param {jQuery} $target - the submenu to toggle
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if (!$target.is(':animated')) {
          if (!$target.is(':hidden')) {
            this.up($target);
          } else {
            this.down($target);
          }
        }
      }

      /**
       * Opens the sub-menu defined by `$target`.
       * @param {jQuery} $target - Sub-menu to open.
       * @fires AccordionMenu#down
       */

    }, {
      key: 'down',
      value: function down($target) {
        var _this = this;

        if (!this.options.multiOpen) {
          this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
        }

        $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideDown(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done opening.
             * @event AccordionMenu#down
             */
            _this.$element.trigger('down.zf.accordionMenu', [$target]);
          });
        });
      }

      /**
       * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
       * @param {jQuery} $target - Sub-menu to close.
       * @fires AccordionMenu#up
       */

    }, {
      key: 'up',
      value: function up($target) {
        var _this = this;
        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideUp(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done collapsing up.
             * @event AccordionMenu#up
             */
            _this.$element.trigger('up.zf.accordionMenu', [$target]);
          });
        });

        var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
      }

      /**
       * Destroys an instance of accordion menu.
       * @fires AccordionMenu#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-submenu]').slideDown(0).css('display', '');
        this.$element.find('a').off('click.zf.accordionMenu');

        Foundation.Nest.Burn(this.$element, 'accordion');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return AccordionMenu;
  }();

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Drilldown module.
   * @module foundation.drilldown
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var Drilldown = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Drilldown(element, options) {
      _classCallCheck(this, Drilldown);

      this.$element = element;
      this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'drilldown');

      this._init();

      Foundation.registerPlugin(this, 'Drilldown');
      Foundation.Keyboard.register('Drilldown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the drilldown by creating jQuery collections of elements
     * @private
     */


    _createClass(Drilldown, [{
      key: '_init',
      value: function _init() {
        this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
        this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
        this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');

        this._prepareMenu();

        this._keyboardEvents();
      }

      /**
       * prepares drilldown menu by setting attributes to links and elements
       * sets a min height to prevent content jumping
       * wraps the element if not already wrapped
       * @private
       * @function
       */

    }, {
      key: '_prepareMenu',
      value: function _prepareMenu() {
        var _this = this;
        // if(!this.options.holdOpen){
        //   this._menuLinkEvents();
        // }
        this.$submenuAnchors.each(function () {
          var $sub = $(this);
          var $link = $sub.find('a:first');
          if (_this.options.parentLink) {
            $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
          }
          $link.data('savedHref', $link.attr('href')).removeAttr('href');
          $sub.children('[data-submenu]').attr({
            'aria-hidden': true,
            'tabindex': 0,
            'role': 'menu'
          });
          _this._events($sub);
        });
        this.$submenus.each(function () {
          var $menu = $(this),
              $back = $menu.find('.js-drilldown-back');
          if (!$back.length) {
            $menu.prepend(_this.options.backButton);
          }
          _this._back($menu);
        });
        if (!this.$element.parent().hasClass('is-drilldown')) {
          this.$wrapper = $(this.options.wrapper).addClass('is-drilldown').css(this._getMaxDims());
          this.$element.wrap(this.$wrapper);
        }
      }

      /**
       * Adds event handlers to elements in the menu.
       * @function
       * @private
       * @param {jQuery} $elem - the current menu item to add handlers to.
       */

    }, {
      key: '_events',
      value: function _events($elem) {
        var _this = this;

        $elem.off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }

          // if(e.target !== e.currentTarget.firstElementChild){
          //   return false;
          // }
          _this._show($elem.parent('li'));

          if (_this.options.closeOnClick) {
            var $body = $('body').not(_this.$wrapper);
            $body.off('.zf.drilldown').on('click.zf.drilldown', function (e) {
              e.preventDefault();
              _this._hideAll();
              $body.off('.zf.drilldown');
            });
          }
        });
      }

      /**
       * Adds keydown event listener to `li`'s in the menu.
       * @private
       */

    }, {
      key: '_keyboardEvents',
      value: function _keyboardEvents() {
        var _this = this;

        this.$menuItems.add(this.$element.find('.js-drilldown-back > a')).on('keydown.zf.drilldown', function (e) {

          var $element = $(this),
              $elements = $element.parent('li').parent('ul').children('li').children('a'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1));
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              return;
            }
          });

          Foundation.Keyboard.handleKey(e, 'Drilldown', {
            next: function () {
              if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            previous: function () {
              _this._hide($element.parent('li').parent('ul'));
              $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                setTimeout(function () {
                  $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                }, 1);
              });
              e.preventDefault();
            },
            up: function () {
              $prevElement.focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.focus();
              e.preventDefault();
            },
            close: function () {
              _this._back();
              //_this.$menuItems.first().focus(); // focus to first element
            },
            open: function () {
              if (!$element.is(_this.$menuItems)) {
                // not menu item means back button
                _this._hide($element.parent('li').parent('ul'));
                $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                  setTimeout(function () {
                    $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                  }, 1);
                });
                e.preventDefault();
              } else if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); // end keyboardAccess
      }

      /**
       * Closes all open elements, and returns to root menu.
       * @function
       * @fires Drilldown#closed
       */

    }, {
      key: '_hideAll',
      value: function _hideAll() {
        var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
        $elem.one(Foundation.transitionend($elem), function (e) {
          $elem.removeClass('is-active is-closing');
        });
        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        this.$element.trigger('closed.zf.drilldown');
      }

      /**
       * Adds event listener for each `back` button, and closes open menus.
       * @function
       * @fires Drilldown#back
       * @param {jQuery} $elem - the current sub-menu to add `back` event.
       */

    }, {
      key: '_back',
      value: function _back($elem) {
        var _this = this;
        $elem.off('click.zf.drilldown');
        $elem.children('.js-drilldown-back').on('click.zf.drilldown', function (e) {
          e.stopImmediatePropagation();
          // console.log('mouseup on back');
          _this._hide($elem);
        });
      }

      /**
       * Adds event listener to menu items w/o submenus to close open menus on click.
       * @function
       * @private
       */

    }, {
      key: '_menuLinkEvents',
      value: function _menuLinkEvents() {
        var _this = this;
        this.$menuItems.not('.is-drilldown-submenu-parent').off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          // e.stopImmediatePropagation();
          setTimeout(function () {
            _this._hideAll();
          }, 0);
        });
      }

      /**
       * Opens a submenu.
       * @function
       * @fires Drilldown#open
       * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
       */

    }, {
      key: '_show',
      value: function _show($elem) {
        $elem.children('[data-submenu]').addClass('is-active');

        this.$element.trigger('open.zf.drilldown', [$elem]);
      }
    }, {
      key: '_hide',


      /**
       * Hides a submenu
       * @function
       * @fires Drilldown#hide
       * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
       */
      value: function _hide($elem) {
        var _this = this;
        $elem.addClass('is-closing').one(Foundation.transitionend($elem), function () {
          $elem.removeClass('is-active is-closing');
          $elem.blur();
        });
        /**
         * Fires when the submenu is has closed.
         * @event Drilldown#hide
         */
        $elem.trigger('hide.zf.drilldown', [$elem]);
      }

      /**
       * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
       * Prevents content jumping.
       * @function
       * @private
       */

    }, {
      key: '_getMaxDims',
      value: function _getMaxDims() {
        var max = 0,
            result = {};
        this.$submenus.add(this.$element).each(function () {
          var numOfElems = $(this).children('li').length;
          max = numOfElems > max ? numOfElems : max;
        });

        result['min-height'] = max * this.$menuItems[0].getBoundingClientRect().height + 'px';
        result['max-width'] = this.$element[0].getBoundingClientRect().width + 'px';

        return result;
      }

      /**
       * Destroys the Drilldown Menu
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._hideAll();
        Foundation.Nest.Burn(this.$element, 'drilldown');
        this.$element.unwrap().find('.js-drilldown-back, .is-submenu-parent-item').remove().end().find('.is-active, .is-closing, .is-drilldown-submenu').removeClass('is-active is-closing is-drilldown-submenu').end().find('[data-submenu]').removeAttr('aria-hidden tabindex role').off('.zf.drilldown').end().off('zf.drilldown');
        this.$element.find('a').each(function () {
          var $link = $(this);
          if ($link.data('savedHref')) {
            $link.attr('href', $link.data('savedHref')).removeData('savedHref');
          } else {
            return;
          }
        });
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Drilldown;
  }();

  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\li><\a>Back<\/a><\/li>'
     */
    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\div class="is-drilldown"><\/div>'
     */
    wrapper: '<div></div>',
    /**
     * Adds the parent link to the submenu.
     * @option
     * @example false
     */
    parentLink: false,
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @example false
     */
    closeOnClick: false
    // holdOpen: false
  };

  // Window exports
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Dropdown = function () {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */


    _createClass(Dropdown, [{
      key: '_init',
      value: function _init() {
        var $id = this.$element.attr('id');

        this.$anchor = $('[data-toggle="' + $id + '"]') || $('[data-open="' + $id + '"]');
        this.$anchor.attr({
          'aria-controls': $id,
          'data-is-focus': false,
          'data-yeti-box': $id,
          'aria-haspopup': true,
          'aria-expanded': false

        });

        this.options.positionClass = this.getPositionClass();
        this.counter = 4;
        this.usedPositions = [];
        this.$element.attr({
          'aria-hidden': 'true',
          'data-yeti-box': $id,
          'data-resize': $id,
          'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
        });
        this._events();
      }

      /**
       * Helper function to determine current orientation of dropdown pane.
       * @function
       * @returns {String} position - string value of a position class.
       */

    }, {
      key: 'getPositionClass',
      value: function getPositionClass() {
        var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
        verticalPosition = verticalPosition ? verticalPosition[0] : '';
        var horizontalPosition = /float-(.+)\s/.exec(this.$anchor[0].className);
        horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
        var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;
        return position;
      }

      /**
       * Adjusts the dropdown panes orientation by adding/removing positioning classes.
       * @function
       * @private
       * @param {String} position - position class to remove.
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');
        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.$element.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.$element.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.$element.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * Sets the position and orientation of the dropdown pane, checks for collisions.
       * Recursively calls itself if a collision is detected, with a new position class.
       * @function
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        if (this.$anchor.attr('aria-expanded') === 'false') {
          return false;
        }
        var position = this.getPositionClass(),
            $eleDims = Foundation.Box.GetDimensions(this.$element),
            $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
            _this = this,
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

        if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
          this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $eleDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          this.classChanged = true;
          return false;
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * Adds event listeners to the element utilizing the triggers utility library.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': this._setPosition.bind(this)
        });

        if (this.options.hover) {
          this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
          if (this.options.hoverPane) {
            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function () {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
          }
        }
        this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

          var $target = $(this),
              visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

          Foundation.Keyboard.handleKey(e, 'Dropdown', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(0).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(-1).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            open: function () {
              if ($target.is(_this.$anchor)) {
                _this.open();
                _this.$element.attr('tabindex', -1).focus();
                e.preventDefault();
              }
            },
            close: function () {
              _this.close();
              _this.$anchor.focus();
            }
          });
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body).not(this.$element),
            _this = this;
        $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
          if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
            return;
          }
          if (_this.$element.find(e.target).length) {
            return;
          }
          _this.close();
          $body.off('click.zf.dropdown');
        });
      }

      /**
       * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
       * @function
       * @fires Dropdown#closeme
       * @fires Dropdown#show
       */

    }, {
      key: 'open',
      value: function open() {
        // var _this = this;
        /**
         * Fires to close other open dropdowns
         * @event Dropdown#closeme
         */
        this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
        this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
        // this.$element/*.show()*/;
        this._setPosition();
        this.$element.addClass('is-open').attr({ 'aria-hidden': false });

        if (this.options.autoFocus) {
          var $focusable = Foundation.Keyboard.findFocusable(this.$element);
          if ($focusable.length) {
            $focusable.eq(0).focus();
          }
        }

        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }

        /**
         * Fires once the dropdown is visible.
         * @event Dropdown#show
         */
        this.$element.trigger('show.zf.dropdown', [this.$element]);
      }

      /**
       * Closes the open dropdown pane.
       * @function
       * @fires Dropdown#hide
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.$element.hasClass('is-open')) {
          return false;
        }
        this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

        this.$anchor.removeClass('hover').attr('aria-expanded', false);

        if (this.classChanged) {
          var curPositionClass = this.getPositionClass();
          if (curPositionClass) {
            this.$element.removeClass(curPositionClass);
          }
          this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({ height: '', width: '' });
          this.classChanged = false;
          this.counter = 4;
          this.usedPositions.length = 0;
        }
        this.$element.trigger('hide.zf.dropdown', [this.$element]);
      }

      /**
       * Toggles the dropdown pane's visibility.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.$element.hasClass('is-open')) {
          if (this.$anchor.data('hover')) return;
          this.close();
        } else {
          this.open();
        }
      }

      /**
       * Destroys the dropdown.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger').hide();
        this.$anchor.off('.zf.dropdown');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Dropdown;
  }();

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_events',

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', function (e) {
            var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
                hasSub = $elem.hasClass(parClass),
                hasClicked = $elem.attr('data-is-click') === 'true',
                $sub = $elem.children('.is-dropdown-submenu');

            if (hasSub) {
              if (hasClicked) {
                if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                  return;
                } else {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  _this._hide($elem);
                }
              } else {
                e.preventDefault();
                e.stopImmediatePropagation();
                _this._show($elem.children('.is-dropdown-submenu'));
                $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
              }
            } else {
              return;
            }
          });
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            e.stopImmediatePropagation();
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function () {
            if (!$element.is(':last-child')) $nextElement.children('a:first').focus();
          },
              prevSibling = function () {
            $prevElement.children('a:first').focus();
          },
              openSub = function () {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
            } else {
              return;
            }
          },
              closeSub = function () {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            //}
          };
          var functions = {
            open: openSub,
            close: function () {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
            },
            handled: function () {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this.vertical) {
              // vertical menu
              if (_this.options.alignment === 'left') {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              } else {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              }
            } else {
              // horizontal menu
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          } else {
            // not tabs -> one sub
            if (_this.options.alignment === 'left') {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   */

  var Equalizer = function () {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Equalizer(element, options) {
      _classCallCheck(this, Equalizer);

      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Equalizer, [{
      key: '_init',
      value: function _init() {
        var eqId = this.$element.attr('data-equalizer') || '';
        var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');

        this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
        this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));

        this.hasNested = this.$element.find('[data-equalizer]').length > 0;
        this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
        this.isOn = false;

        var imgs = this.$element.find('img');
        var tooSmall;
        if (this.options.equalizeOn) {
          tooSmall = this._checkMQ();
          $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
        } else {
          this._events();
        }
        if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
          if (imgs.length) {
            Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
          } else {
            this._reflow();
          }
        }
      }

      /**
       * Removes event listeners if the breakpoint is too small.
       * @private
       */

    }, {
      key: '_pauseEvents',
      value: function _pauseEvents() {
        this.isOn = false;
        this.$element.off('.zf.equalizer resizeme.zf.trigger');
      }

      /**
       * Initializes events for Equalizer.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this._pauseEvents();
        if (this.hasNested) {
          this.$element.on('postequalized.zf.equalizer', function (e) {
            if (e.target !== _this.$element[0]) {
              _this._reflow();
            }
          });
        } else {
          this.$element.on('resizeme.zf.trigger', this._reflow.bind(this));
        }
        this.isOn = true;
      }

      /**
       * Checks the current breakpoint to the minimum required size.
       * @private
       */

    }, {
      key: '_checkMQ',
      value: function _checkMQ() {
        var tooSmall = !Foundation.MediaQuery.atLeast(this.options.equalizeOn);
        if (tooSmall) {
          if (this.isOn) {
            this._pauseEvents();
            this.$watched.css('height', 'auto');
          }
        } else {
          if (!this.isOn) {
            this._events();
          }
        }
        return tooSmall;
      }

      /**
       * A noop version for the plugin
       * @private
       */

    }, {
      key: '_killswitch',
      value: function _killswitch() {
        return;
      }

      /**
       * Calls necessary functions to update Equalizer upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        if (!this.options.equalizeOnStack) {
          if (this._isStacked()) {
            this.$watched.css('height', 'auto');
            return false;
          }
        }
        if (this.options.equalizeByRow) {
          this.getHeightsByRow(this.applyHeightByRow.bind(this));
        } else {
          this.getHeights(this.applyHeight.bind(this));
        }
      }

      /**
       * Manually determines if the first 2 elements are *NOT* stacked.
       * @private
       */

    }, {
      key: '_isStacked',
      value: function _isStacked() {
        return this.$watched[0].offsetTop !== this.$watched[1].offsetTop;
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} heights - An array of heights of children within Equalizer container
       */

    }, {
      key: 'getHeights',
      value: function getHeights(cb) {
        var heights = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          heights.push(this.$watched[i].offsetHeight);
        }
        cb(heights);
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       */

    }, {
      key: 'getHeightsByRow',
      value: function getHeightsByRow(cb) {
        var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
            groups = [],
            group = 0;
        //group by Row
        groups[group] = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          //maybe could use this.$watched[i].offsetTop
          var elOffsetTop = $(this.$watched[i]).offset().top;
          if (elOffsetTop != lastElTopOffset) {
            group++;
            groups[group] = [];
            lastElTopOffset = elOffsetTop;
          }
          groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
        }

        for (var j = 0, ln = groups.length; j < ln; j++) {
          var heights = $(groups[j]).map(function () {
            return this[1];
          }).get();
          var max = Math.max.apply(null, heights);
          groups[j].push(max);
        }
        cb(groups);
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest
       * @param {array} heights - An array of heights of children within Equalizer container
       * @fires Equalizer#preequalized
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeight',
      value: function applyHeight(heights) {
        var max = Math.max.apply(null, heights);
        /**
         * Fires before the heights are applied
         * @event Equalizer#preequalized
         */
        this.$element.trigger('preequalized.zf.equalizer');

        this.$watched.css('height', max);

        /**
         * Fires when the heights have been applied
         * @event Equalizer#postequalized
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
       * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       * @fires Equalizer#preequalized
       * @fires Equalizer#preequalizedRow
       * @fires Equalizer#postequalizedRow
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeightByRow',
      value: function applyHeightByRow(groups) {
        /**
         * Fires before the heights are applied
         */
        this.$element.trigger('preequalized.zf.equalizer');
        for (var i = 0, len = groups.length; i < len; i++) {
          var groupsILength = groups[i].length,
              max = groups[i][groupsILength - 1];
          if (groupsILength <= 2) {
            $(groups[i][0][0]).css({ 'height': 'auto' });
            continue;
          }
          /**
            * Fires before the heights per row are applied
            * @event Equalizer#preequalizedRow
            */
          this.$element.trigger('preequalizedrow.zf.equalizer');
          for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
            $(groups[i][j][0]).css({ 'height': max });
          }
          /**
            * Fires when the heights per row have been applied
            * @event Equalizer#postequalizedRow
            */
          this.$element.trigger('postequalizedrow.zf.equalizer');
        }
        /**
         * Fires when the heights have been applied
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Destroys an instance of Equalizer.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._pauseEvents();
        this.$watched.css('height', 'auto');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Equalizer;
  }();

  /**
   * Default settings for plugin
   */


  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: true,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  var Interchange = function () {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Interchange(element, options) {
      _classCallCheck(this, Interchange);

      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */


    _createClass(Interchange, [{
      key: '_init',
      value: function _init() {
        this._addBreakpoints();
        this._generateRules();
        this._reflow();
      }

      /**
       * Initializes events for Interchange.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        $(window).on('resize.zf.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
      }

      /**
       * Calls necessary functions to update Interchange upon DOM change
       * @function
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        var match;

        // Iterate through each rule, but only save the last match
        for (var i in this.rules) {
          var rule = this.rules[i];

          if (window.matchMedia(rule.query).matches) {
            match = rule;
          }
        }

        if (match) {
          this.replace(match.path);
        }
      }

      /**
       * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
       * @function
       * @private
       */

    }, {
      key: '_addBreakpoints',
      value: function _addBreakpoints() {
        for (var i in Foundation.MediaQuery.queries) {
          var query = Foundation.MediaQuery.queries[i];
          Interchange.SPECIAL_QUERIES[query.name] = query.value;
        }
      }

      /**
       * Checks the Interchange element for the provided media query + content pairings
       * @function
       * @private
       * @param {Object} element - jQuery object that is an Interchange instance
       * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
       */

    }, {
      key: '_generateRules',
      value: function _generateRules(element) {
        var rulesList = [];
        var rules;

        if (this.options.rules) {
          rules = this.options.rules;
        } else {
          rules = this.$element.data('interchange').match(/\[.*?\]/g);
        }

        for (var i in rules) {
          var rule = rules[i].slice(1, -1).split(', ');
          var path = rule.slice(0, -1).join('');
          var query = rule[rule.length - 1];

          if (Interchange.SPECIAL_QUERIES[query]) {
            query = Interchange.SPECIAL_QUERIES[query];
          }

          rulesList.push({
            path: path,
            query: query
          });
        }

        this.rules = rulesList;
      }

      /**
       * Update the `src` property of an image, or change the HTML of a container, to the specified path.
       * @function
       * @param {String} path - Path to the image or HTML partial.
       * @fires Interchange#replaced
       */

    }, {
      key: 'replace',
      value: function replace(path) {
        if (this.currentPath === path) return;

        var _this = this,
            trigger = 'replaced.zf.interchange';

        // Replacing images
        if (this.$element[0].nodeName === 'IMG') {
          this.$element.attr('src', path).load(function () {
            _this.currentPath = path;
          }).trigger(trigger);
        }
        // Replacing background images
        else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
            this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
          }
          // Replacing HTML
          else {
              $.get(path, function (response) {
                _this.$element.html(response).trigger(trigger);
                $(response).foundation();
                _this.currentPath = path;
              });
            }

        /**
         * Fires when content in an Interchange element is done being loaded.
         * @event Interchange#replaced
         */
        // this.$element.trigger('replaced.zf.interchange');
      }

      /**
       * Destroys an instance of interchange.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this.
      }
    }]);

    return Interchange;
  }();

  /**
   * Default settings for plugin
   */


  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Magellan module.
   * @module foundation.magellan
   */

  var Magellan = function () {
    /**
     * Creates a new instance of Magellan.
     * @class
     * @fires Magellan#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Magellan(element, options) {
      _classCallCheck(this, Magellan);

      this.$element = element;
      this.options = $.extend({}, Magellan.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Magellan');
    }

    /**
     * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Magellan, [{
      key: '_init',
      value: function _init() {
        var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan');
        var _this = this;
        this.$targets = $('[data-magellan-target]');
        this.$links = this.$element.find('a');
        this.$element.attr({
          'data-resize': id,
          'data-scroll': id,
          'id': id
        });
        this.$active = $();
        this.scrollPos = parseInt(window.pageYOffset, 10);

        this._events();
      }

      /**
       * Calculates an array of pixel values that are the demarcation lines between locations on the page.
       * Can be invoked if new elements are added or the size of a location changes.
       * @function
       */

    }, {
      key: 'calcPoints',
      value: function calcPoints() {
        var _this = this,
            body = document.body,
            html = document.documentElement;

        this.points = [];
        this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
        this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

        this.$targets.each(function () {
          var $tar = $(this),
              pt = Math.round($tar.offset().top - _this.options.threshold);
          $tar.targetPoint = pt;
          _this.points.push(pt);
        });
      }

      /**
       * Initializes events for Magellan.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            $body = $('html, body'),
            opts = {
          duration: _this.options.animationDuration,
          easing: _this.options.animationEasing
        };
        $(window).one('load', function () {
          if (_this.options.deepLinking) {
            if (location.hash) {
              _this.scrollToLoc(location.hash);
            }
          }
          _this.calcPoints();
          _this._updateActive();
        });

        this.$element.on({
          'resizeme.zf.trigger': this.reflow.bind(this),
          'scrollme.zf.trigger': this._updateActive.bind(this)
        }).on('click.zf.magellan', 'a[href^="#"]', function (e) {
          e.preventDefault();
          var arrival = this.getAttribute('href');
          _this.scrollToLoc(arrival);
        });
      }

      /**
       * Function to scroll to a given location on the page.
       * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
       * @function
       */

    }, {
      key: 'scrollToLoc',
      value: function scrollToLoc(loc) {
        var scrollPos = Math.round($(loc).offset().top - this.options.threshold / 2 - this.options.barOffset);

        $('html, body').stop(true).animate({ scrollTop: scrollPos }, this.options.animationDuration, this.options.animationEasing);
      }

      /**
       * Calls necessary functions to update Magellan upon DOM change
       * @function
       */

    }, {
      key: 'reflow',
      value: function reflow() {
        this.calcPoints();
        this._updateActive();
      }

      /**
       * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
       * @private
       * @function
       * @fires Magellan#update
       */

    }, {
      key: '_updateActive',
      value: function _updateActive() /*evt, elem, scrollPos*/{
        var winPos = /*scrollPos ||*/parseInt(window.pageYOffset, 10),
            curIdx;

        if (winPos + this.winHeight === this.docHeight) {
          curIdx = this.points.length - 1;
        } else if (winPos < this.points[0]) {
          curIdx = 0;
        } else {
          var isDown = this.scrollPos < winPos,
              _this = this,
              curVisible = this.points.filter(function (p, i) {
            return isDown ? p <= winPos : p - _this.options.threshold <= winPos; //&& winPos >= _this.points[i -1] - _this.options.threshold;
          });
          curIdx = curVisible.length ? curVisible.length - 1 : 0;
        }

        this.$active.removeClass(this.options.activeClass);
        this.$active = this.$links.eq(curIdx).addClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.scrollPos = winPos;
        /**
         * Fires when magellan is finished updating to the new active element.
         * @event Magellan#update
         */
        this.$element.trigger('update.zf.magellan', [this.$active]);
      }

      /**
       * Destroys an instance of Magellan and resets the url of the window.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger .zf.magellan').find('.' + this.options.activeClass).removeClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          window.location.hash.replace(hash, '');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Magellan;
  }();

  /**
   * Default settings for plugin
   */


  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations.
     * @option
     * @example 'ease-in-out'
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @example 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @example 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @example true
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @example 25
     */
    barOffset: 0
  };

  // Window exports
  Foundation.plugin(Magellan, 'Magellan');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  var OffCanvas = function () {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function OffCanvas(element, options) {
      _classCallCheck(this, OffCanvas);

      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */


    _createClass(OffCanvas, [{
      key: '_init',
      value: function _init() {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        // Find triggers that affect this element and add aria-expanded to them
        $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

        // Add a close trigger over the body if necessary
        if (this.options.closeOnClick) {
          if ($('.js-off-canvas-exit').length) {
            this.$exiter = $('.js-off-canvas-exit');
          } else {
            var exiter = document.createElement('div');
            exiter.setAttribute('class', 'js-off-canvas-exit');
            $('[data-off-canvas-content]').append(exiter);

            this.$exiter = $(exiter);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
        }
      }

      /**
       * Adds event handlers to the off-canvas wrapper and the exit overlay.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
        });

        if (this.options.closeOnClick && this.$exiter.length) {
          this.$exiter.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
       * Applies event listener for elements that will reveal at certain breakpoints.
       * @private
       */

    }, {
      key: '_setMQChecker',
      value: function _setMQChecker() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
       * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
       * @param {Boolean} isRevealed - true if element should be revealed.
       * @function
       */

    }, {
      key: 'reveal',
      value: function reveal(isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          // if (!this.options.forceTop) {
          //   var scrollPos = parseInt(window.pageYOffset);
          //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
          // }
          // if (this.options.isSticky) { this._stick(); }
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {
            $closer.hide();
          }
        } else {
          this.isRevealed = false;
          // if (this.options.isSticky || !this.options.forceTop) {
          //   this.$element[0].style.transform = '';
          //   $(window).off('scroll.zf.offcanvas');
          // }
          this.$element.on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this)
          });
          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
       * Opens the off-canvas menu.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       * @fires OffCanvas#opened
       */

    }, {
      key: 'open',
      value: function open(event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }
        var _this = this,
            $body = $(document.body);

        if (this.options.forceTop) {
          $('body').scrollTop(0);
        }
        // window.pageYOffset = 0;

        // if (!this.options.forceTop) {
        //   var scrollPos = parseInt(window.pageYOffset);
        //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   if (this.$exiter.length) {
        //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   }
        // }
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#opened
         */
        Foundation.Move(this.options.transitionTime, this.$element, function () {
          $('[data-off-canvas-wrapper]').addClass('is-off-canvas-open is-open-' + _this.options.position);

          _this.$element.addClass('is-open');

          // if (_this.options.isSticky) {
          //   _this._stick();
          // }
        });
        this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

        if (this.options.closeOnClick) {
          this.$exiter.addClass('is-visible');
        }

        if (trigger) {
          this.$lastTrigger = trigger.attr('aria-expanded', 'true');
        }

        if (this.options.autoFocus) {
          this.$element.one(Foundation.transitionend(this.$element), function () {
            _this.$element.find('a, button').eq(0).focus();
          });
        }

        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').attr('tabindex', '-1');
          this._trapFocus();
        }
      }

      /**
       * Traps focus within the offcanvas on open.
       * @private
       */

    }, {
      key: '_trapFocus',
      value: function _trapFocus() {
        var focusable = Foundation.Keyboard.findFocusable(this.$element),
            first = focusable.eq(0),
            last = focusable.eq(-1);

        focusable.off('.zf.offcanvas').on('keydown.zf.offcanvas', function (e) {
          if (e.which === 9 || e.keycode === 9) {
            if (e.target === last[0] && !e.shiftKey) {
              e.preventDefault();
              first.focus();
            }
            if (e.target === first[0] && e.shiftKey) {
              e.preventDefault();
              last.focus();
            }
          }
        });
      }

      /**
       * Allows the offcanvas to appear sticky utilizing translate properties.
       * @private
       */
      // OffCanvas.prototype._stick = function() {
      //   var elStyle = this.$element[0].style;
      //
      //   if (this.options.closeOnClick) {
      //     var exitStyle = this.$exiter[0].style;
      //   }
      //
      //   $(window).on('scroll.zf.offcanvas', function(e) {
      //     console.log(e);
      //     var pageY = window.pageYOffset;
      //     elStyle.transform = 'translate(0,' + pageY + 'px)';
      //     if (exitStyle !== undefined) { exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
      //   });
      //   // this.$element.trigger('stuck.zf.offcanvas');
      // };
      /**
       * Closes the off-canvas menu.
       * @function
       * @param {Function} cb - optional cb to fire after closure.
       * @fires OffCanvas#closed
       */

    }, {
      key: 'close',
      value: function close(cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }

        var _this = this;

        //  Foundation.Move(this.options.transitionTime, this.$element, function() {
        $('[data-off-canvas-wrapper]').removeClass('is-off-canvas-open is-open-' + _this.options.position);
        _this.$element.removeClass('is-open');
        // Foundation._reflow();
        // });
        this.$element.attr('aria-hidden', 'true')
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#closed
         */
        .trigger('closed.zf.offcanvas');
        // if (_this.options.isSticky || !_this.options.forceTop) {
        //   setTimeout(function() {
        //     _this.$element[0].style.transform = '';
        //     $(window).off('scroll.zf.offcanvas');
        //   }, this.options.transitionTime);
        // }
        if (this.options.closeOnClick) {
          this.$exiter.removeClass('is-visible');
        }

        this.$lastTrigger.attr('aria-expanded', 'false');
        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').removeAttr('tabindex');
        }
      }

      /**
       * Toggles the off-canvas menu open or closed.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       */

    }, {
      key: 'toggle',
      value: function toggle(event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else {
          this.open(event, trigger);
        }
      }

      /**
       * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
       * @function
       * @private
       */

    }, {
      key: '_handleKeyboard',
      value: function _handleKeyboard(event) {
        if (event.which !== 27) return;

        event.stopPropagation();
        event.preventDefault();
        this.close();
        this.$lastTrigger.focus();
      }

      /**
       * Destroys the offcanvas plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$exiter.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return OffCanvas;
  }();

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Direction the offcanvas opens from. Determines class applied to body.
     * @option
     * @example left
     */
    position: 'left',

    /**
     * Force the page to scroll to top on open.
     * @option
     * @example true
     */
    forceTop: true,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Orbit module.
   * @module foundation.orbit
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.timerAndImageLoader
   * @requires foundation.util.touch
   */

  var Orbit = function () {
    /**
    * Creates a new instance of an orbit carousel.
    * @class
    * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
    * @param {Object} options - Overrides to the default plugin settings.
    */

    function Orbit(element, options) {
      _classCallCheck(this, Orbit);

      this.$element = element;
      this.options = $.extend({}, Orbit.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Orbit');
      Foundation.Keyboard.register('Orbit', {
        'ltr': {
          'ARROW_RIGHT': 'next',
          'ARROW_LEFT': 'previous'
        },
        'rtl': {
          'ARROW_LEFT': 'next',
          'ARROW_RIGHT': 'previous'
        }
      });
    }

    /**
    * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
    * @function
    * @private
    */


    _createClass(Orbit, [{
      key: '_init',
      value: function _init() {
        this.$wrapper = this.$element.find('.' + this.options.containerClass);
        this.$slides = this.$element.find('.' + this.options.slideClass);
        var $images = this.$element.find('img'),
            initActive = this.$slides.filter('.is-active');

        if (!initActive.length) {
          this.$slides.eq(0).addClass('is-active');
        }

        if (!this.options.useMUI) {
          this.$slides.addClass('no-motionui');
        }

        if ($images.length) {
          Foundation.onImagesLoaded($images, this._prepareForOrbit.bind(this));
        } else {
          this._prepareForOrbit(); //hehe
        }

        if (this.options.bullets) {
          this._loadBullets();
        }

        this._events();

        if (this.options.autoPlay && this.$slides.length > 1) {
          this.geoSync();
        }

        if (this.options.accessible) {
          // allow wrapper to be focusable to enable arrow navigation
          this.$wrapper.attr('tabindex', 0);
        }
      }

      /**
      * Creates a jQuery collection of bullets, if they are being used.
      * @function
      * @private
      */

    }, {
      key: '_loadBullets',
      value: function _loadBullets() {
        this.$bullets = this.$element.find('.' + this.options.boxOfBullets).find('button');
      }

      /**
      * Sets a `timer` object on the orbit, and starts the counter for the next slide.
      * @function
      */

    }, {
      key: 'geoSync',
      value: function geoSync() {
        var _this = this;
        this.timer = new Foundation.Timer(this.$element, {
          duration: this.options.timerDelay,
          infinite: false
        }, function () {
          _this.changeSlide(true);
        });
        this.timer.start();
      }

      /**
      * Sets wrapper and slide heights for the orbit.
      * @function
      * @private
      */

    }, {
      key: '_prepareForOrbit',
      value: function _prepareForOrbit() {
        var _this = this;
        this._setWrapperHeight(function (max) {
          _this._setSlideHeight(max);
        });
      }

      /**
      * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
      * @function
      * @private
      * @param {Function} cb - a callback function to fire when complete.
      */

    }, {
      key: '_setWrapperHeight',
      value: function _setWrapperHeight(cb) {
        //rewrite this to `for` loop
        var max = 0,
            temp,
            counter = 0;

        this.$slides.each(function () {
          temp = this.getBoundingClientRect().height;
          $(this).attr('data-slide', counter);

          if (counter) {
            //if not the first slide, set css position and display property
            $(this).css({ 'position': 'relative', 'display': 'none' });
          }
          max = temp > max ? temp : max;
          counter++;
        });

        if (counter === this.$slides.length) {
          this.$wrapper.css({ 'height': max }); //only change the wrapper height property once.
          cb(max); //fire callback with max height dimension.
        }
      }

      /**
      * Sets the max-height of each slide.
      * @function
      * @private
      */

    }, {
      key: '_setSlideHeight',
      value: function _setSlideHeight(height) {
        this.$slides.each(function () {
          $(this).css('max-height', height);
        });
      }

      /**
      * Adds event listeners to basically everything within the element.
      * @function
      * @private
      */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        //***************************************
        //**Now using custom event - thanks to:**
        //**      Yohai Ararat of Toronto      **
        //***************************************
        if (this.$slides.length > 1) {

          if (this.options.swipe) {
            this.$slides.off('swipeleft.zf.orbit swiperight.zf.orbit').on('swipeleft.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(true);
            }).on('swiperight.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(false);
            });
          }
          //***************************************

          if (this.options.autoPlay) {
            this.$slides.on('click.zf.orbit', function () {
              _this.$element.data('clickedOn', _this.$element.data('clickedOn') ? false : true);
              _this.timer[_this.$element.data('clickedOn') ? 'pause' : 'start']();
            });

            if (this.options.pauseOnHover) {
              this.$element.on('mouseenter.zf.orbit', function () {
                _this.timer.pause();
              }).on('mouseleave.zf.orbit', function () {
                if (!_this.$element.data('clickedOn')) {
                  _this.timer.start();
                }
              });
            }
          }

          if (this.options.navButtons) {
            var $controls = this.$element.find('.' + this.options.nextClass + ', .' + this.options.prevClass);
            $controls.attr('tabindex', 0)
            //also need to handle enter/return and spacebar key presses
            .on('click.zf.orbit touchend.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide($(this).hasClass(_this.options.nextClass));
            });
          }

          if (this.options.bullets) {
            this.$bullets.on('click.zf.orbit touchend.zf.orbit', function () {
              if (/is-active/g.test(this.className)) {
                return false;
              } //if this is active, kick out of function.
              var idx = $(this).data('slide'),
                  ltr = idx > _this.$slides.filter('.is-active').data('slide'),
                  $slide = _this.$slides.eq(idx);

              _this.changeSlide(ltr, $slide, idx);
            });
          }

          this.$wrapper.add(this.$bullets).on('keydown.zf.orbit', function (e) {
            // handle keyboard event with keyboard util
            Foundation.Keyboard.handleKey(e, 'Orbit', {
              next: function () {
                _this.changeSlide(true);
              },
              previous: function () {
                _this.changeSlide(false);
              },
              handled: function () {
                // if bullet is focused, make sure focus moves
                if ($(e.target).is(_this.$bullets)) {
                  _this.$bullets.filter('.is-active').focus();
                }
              }
            });
          });
        }
      }

      /**
      * Changes the current slide to a new one.
      * @function
      * @param {Boolean} isLTR - flag if the slide should move left to right.
      * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
      * @param {Number} idx - the index of the new slide in its collection, if one chosen.
      * @fires Orbit#slidechange
      */

    }, {
      key: 'changeSlide',
      value: function changeSlide(isLTR, chosenSlide, idx) {
        var $curSlide = this.$slides.filter('.is-active').eq(0);

        if (/mui/g.test($curSlide[0].className)) {
          return false;
        } //if the slide is currently animating, kick out of the function

        var $firstSlide = this.$slides.first(),
            $lastSlide = this.$slides.last(),
            dirIn = isLTR ? 'Right' : 'Left',
            dirOut = isLTR ? 'Left' : 'Right',
            _this = this,
            $newSlide;

        if (!chosenSlide) {
          //most of the time, this will be auto played or clicked from the navButtons.
          $newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
          this.options.infiniteWrap ? $curSlide.next('.' + this.options.slideClass).length ? $curSlide.next('.' + this.options.slideClass) : $firstSlide : $curSlide.next('.' + this.options.slideClass) : //pick next slide if moving left to right
          this.options.infiniteWrap ? $curSlide.prev('.' + this.options.slideClass).length ? $curSlide.prev('.' + this.options.slideClass) : $lastSlide : $curSlide.prev('.' + this.options.slideClass); //pick prev slide if moving right to left
        } else {
            $newSlide = chosenSlide;
          }

        if ($newSlide.length) {
          if (this.options.bullets) {
            idx = idx || this.$slides.index($newSlide); //grab index to update bullets
            this._updateBullets(idx);
          }

          if (this.options.useMUI) {
            Foundation.Motion.animateIn($newSlide.addClass('is-active').css({ 'position': 'absolute', 'top': 0 }), this.options['animInFrom' + dirIn], function () {
              $newSlide.css({ 'position': 'relative', 'display': 'block' }).attr('aria-live', 'polite');
            });

            Foundation.Motion.animateOut($curSlide.removeClass('is-active'), this.options['animOutTo' + dirOut], function () {
              $curSlide.removeAttr('aria-live');
              if (_this.options.autoPlay && !_this.timer.isPaused) {
                _this.timer.restart();
              }
              //do stuff?
            });
          } else {
              $curSlide.removeClass('is-active is-in').removeAttr('aria-live').hide();
              $newSlide.addClass('is-active is-in').attr('aria-live', 'polite').show();
              if (this.options.autoPlay && !this.timer.isPaused) {
                this.timer.restart();
              }
            }
          /**
          * Triggers when the slide has finished animating in.
          * @event Orbit#slidechange
          */
          this.$element.trigger('slidechange.zf.orbit', [$newSlide]);
        }
      }

      /**
      * Updates the active state of the bullets, if displayed.
      * @function
      * @private
      * @param {Number} idx - the index of the current slide.
      */

    }, {
      key: '_updateBullets',
      value: function _updateBullets(idx) {
        var $oldBullet = this.$element.find('.' + this.options.boxOfBullets).find('.is-active').removeClass('is-active').blur(),
            span = $oldBullet.find('span:last').detach(),
            $newBullet = this.$bullets.eq(idx).addClass('is-active').append(span);
      }

      /**
      * Destroys the carousel and hides the element.
      * @function
      */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.orbit').find('*').off('.zf.orbit').end().hide();
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Orbit;
  }();

  Orbit.defaults = {
    /**
    * Tells the JS to look for and loadBullets.
    * @option
    * @example true
    */
    bullets: true,
    /**
    * Tells the JS to apply event listeners to nav buttons
    * @option
    * @example true
    */
    navButtons: true,
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-right'
    */
    animInFromRight: 'slide-in-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-right'
    */
    animOutToRight: 'slide-out-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-left'
    *
    */
    animInFromLeft: 'slide-in-left',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-left'
    */
    animOutToLeft: 'slide-out-left',
    /**
    * Allows Orbit to automatically animate on page load.
    * @option
    * @example true
    */
    autoPlay: true,
    /**
    * Amount of time, in ms, between slide transitions
    * @option
    * @example 5000
    */
    timerDelay: 5000,
    /**
    * Allows Orbit to infinitely loop through the slides
    * @option
    * @example true
    */
    infiniteWrap: true,
    /**
    * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
    * @option
    * @example true
    */
    swipe: true,
    /**
    * Allows the timing function to pause animation on hover.
    * @option
    * @example true
    */
    pauseOnHover: true,
    /**
    * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
    * @option
    * @example true
    */
    accessible: true,
    /**
    * Class applied to the container of Orbit
    * @option
    * @example 'orbit-container'
    */
    containerClass: 'orbit-container',
    /**
    * Class applied to individual slides.
    * @option
    * @example 'orbit-slide'
    */
    slideClass: 'orbit-slide',
    /**
    * Class applied to the bullet container. You're welcome.
    * @option
    * @example 'orbit-bullets'
    */
    boxOfBullets: 'orbit-bullets',
    /**
    * Class applied to the `next` navigation button.
    * @option
    * @example 'orbit-next'
    */
    nextClass: 'orbit-next',
    /**
    * Class applied to the `previous` navigation button.
    * @option
    * @example 'orbit-previous'
    */
    prevClass: 'orbit-previous',
    /**
    * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatability.
    * @option
    * @example true
    */
    useMUI: true
  };

  // Window exports
  Foundation.plugin(Orbit, 'Orbit');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', this._update.bind(this));

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this...
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */

    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isiOS = iPhoneSniff();

        if (this.isiOS) {
          this.$element.addClass('is-ios');
        }

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');

        if (this.$anchor.length) {
          var anchorId = this.$anchor[0].id || Foundation.GetYoDigits(6, 'reveal');

          this.$anchor.attr({
            'aria-controls': this.id,
            'id': anchorId,
            'aria-haspopup': true,
            'tabindex': 0
          });
          this.$element.attr({ 'aria-labelledby': anchorId });
        }

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($('body'));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay(id) {
        var $overlay = $('<div></div>').addClass('reveal-overlay').attr({ 'tabindex': -1, 'aria-hidden': true }).appendTo('body');
        return $overlay;
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left, top;
        if (this.options.hOffset === 'auto') {
          left = parseInt((outerWidth - width) / 2, 10);
        } else {
          left = parseInt(this.options.hOffset, 10);
        }
        if (this.options.vOffset === 'auto') {
          if (height > outerHeight) {
            top = parseInt(Math.min(100, outerHeight / 10), 10);
          } else {
            top = parseInt((outerHeight - height) / 4, 10);
          }
        } else {
          top = parseInt(this.options.vOffset, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay or we havea  horizontal offset,
        // otherwise we're perfectly in the middle
        if (!this.$overlay || this.options.hOffset !== 'auto') {
          this.$element.css({ left: left + 'px' });
          this.$element.css({ margin: '0px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function () {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this2 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }

        // Motion UI method of reveal
        if (this.options.animationIn) {
          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            _this2.focusableElements = Foundation.Keyboard.findFocusable(_this2.$element);
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        if (this.isiOS) {
          var scrollPos = window.pageYOffset;
          $('html, body').addClass('is-reveal-open').scrollTop(scrollPos);
        } else {
          $('body').addClass('is-reveal-open');
        }

        $('body').addClass('is-reveal-open').attr('aria-hidden', this.options.overlay || this.options.fullScreen ? true : false);

        setTimeout(function () {
          _this2._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function () {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                _this.focusableElements.eq(0).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                _this.focusableElements.eq(-1).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            open: function () {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {
            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }

            this.$element.hide(this.options.hideDelay);
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isiOS) {
            $('html, body').removeClass('is-reveal-open');
          } else {
            $('body').removeClass('is-reveal-open');
          }

          $('body').attr({
            'aria-hidden': false,
            'tabindex': ''
          });

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState("", document.title, window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$element.appendTo($('body')); // move $element outside of $overlay to prevent error unregisterPlugin()
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false
  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Slider module.
   * @module foundation.slider
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   * @requires foundation.util.keyboard
   * @requires foundation.util.touch
   */

  var Slider = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Slider(element, options) {
      _classCallCheck(this, Slider);

      this.$element = element;
      this.options = $.extend({}, Slider.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Slider');
      Foundation.Keyboard.register('Slider', {
        'ltr': {
          'ARROW_RIGHT': 'increase',
          'ARROW_UP': 'increase',
          'ARROW_DOWN': 'decrease',
          'ARROW_LEFT': 'decrease',
          'SHIFT_ARROW_RIGHT': 'increase_fast',
          'SHIFT_ARROW_UP': 'increase_fast',
          'SHIFT_ARROW_DOWN': 'decrease_fast',
          'SHIFT_ARROW_LEFT': 'decrease_fast'
        },
        'rtl': {
          'ARROW_LEFT': 'increase',
          'ARROW_RIGHT': 'decrease',
          'SHIFT_ARROW_LEFT': 'increase_fast',
          'SHIFT_ARROW_RIGHT': 'decrease_fast'
        }
      });
    }

    /**
     * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
     * @function
     * @private
     */


    _createClass(Slider, [{
      key: '_init',
      value: function _init() {
        this.inputs = this.$element.find('input');
        this.handles = this.$element.find('[data-slider-handle]');

        this.$handle = this.handles.eq(0);
        this.$input = this.inputs.length ? this.inputs.eq(0) : $('#' + this.$handle.attr('aria-controls'));
        this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);

        var isDbl = false,
            _this = this;
        if (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) {
          this.options.disabled = true;
          this.$element.addClass(this.options.disabledClass);
        }
        if (!this.inputs.length) {
          this.inputs = $().add(this.$input);
          this.options.binding = true;
        }
        this._setInitAttr(0);
        this._events(this.$handle);

        if (this.handles[1]) {
          this.options.doubleSided = true;
          this.$handle2 = this.handles.eq(1);
          this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : $('#' + this.$handle2.attr('aria-controls'));

          if (!this.inputs[1]) {
            this.inputs = this.inputs.add(this.$input2);
          }
          isDbl = true;

          this._setHandlePos(this.$handle, this.options.initialStart, true, function () {

            _this._setHandlePos(_this.$handle2, _this.options.initialEnd, true);
          });
          // this.$handle.triggerHandler('click.zf.slider');
          this._setInitAttr(1);
          this._events(this.$handle2);
        }

        if (!isDbl) {
          this._setHandlePos(this.$handle, this.options.initialStart, true);
        }
      }

      /**
       * Sets the position of the selected handle and fill bar.
       * @function
       * @private
       * @param {jQuery} $hndl - the selected handle to move.
       * @param {Number} location - floating point between the start and end values of the slider bar.
       * @param {Function} cb - callback function to fire on completion.
       * @fires Slider#moved
       * @fires Slider#changed
       */

    }, {
      key: '_setHandlePos',
      value: function _setHandlePos($hndl, location, noInvert, cb) {
        //might need to alter that slightly for bars that will have odd number selections.
        location = parseFloat(location); //on input change events, convert string to number...grumble.

        // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
        if (location < this.options.start) {
          location = this.options.start;
        } else if (location > this.options.end) {
          location = this.options.end;
        }

        var isDbl = this.options.doubleSided;

        if (isDbl) {
          //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
          if (this.handles.index($hndl) === 0) {
            var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
            location = location >= h2Val ? h2Val - this.options.step : location;
          } else {
            var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
            location = location <= h1Val ? h1Val + this.options.step : location;
          }
        }

        //this is for single-handled vertical sliders, it adjusts the value to account for the slider being "upside-down"
        //for click and drag events, it's weird due to the scale(-1, 1) css property
        if (this.options.vertical && !noInvert) {
          location = this.options.end - location;
        }

        var _this = this,
            vert = this.options.vertical,
            hOrW = vert ? 'height' : 'width',
            lOrT = vert ? 'top' : 'left',
            handleDim = $hndl[0].getBoundingClientRect()[hOrW],
            elemDim = this.$element[0].getBoundingClientRect()[hOrW],

        //percentage of bar min/max value based on click or drag point
        pctOfBar = percent(location - this.options.start, this.options.end - this.options.start).toFixed(2),

        //number of actual pixels to shift the handle, based on the percentage obtained above
        pxToMove = (elemDim - handleDim) * pctOfBar,

        //percentage of bar to shift the handle
        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
        //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
        location = parseFloat(location.toFixed(this.options.decimal));
        // declare empty object for css adjustments, only used with 2 handled-sliders
        var css = {};

        this._setValues($hndl, location);

        // TODO update to calculate based on values set to respective inputs??
        if (isDbl) {
          var isLeftHndl = this.handles.index($hndl) === 0,

          //empty variable, will be used for min-height/width for fill bar
          dim,

          //percentage w/h of the handle compared to the slider bar
          handlePct = ~ ~(percent(handleDim, elemDim) * 100);
          //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
          if (isLeftHndl) {
            //left or top percentage value to apply to the fill bar.
            css[lOrT] = movement + '%';
            //calculate the new min-height/width for the fill bar.
            dim = parseFloat(this.$handle2[0].style[lOrT]) - movement + handlePct;
            //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
            //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
            if (cb && typeof cb === 'function') {
              cb();
            } //this is only needed for the initialization of 2 handled sliders
          } else {
              //just caching the value of the left/bottom handle's left/top property
              var handlePos = parseFloat(this.$handle[0].style[lOrT]);
              //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
              //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
              dim = movement - (isNaN(handlePos) ? this.options.initialStart / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
            }
          // assign the min-height/width to our css object
          css['min-' + hOrW] = dim + '%';
        }

        this.$element.one('finished.zf.animate', function () {
          /**
           * Fires when the handle is done moving.
           * @event Slider#moved
           */
          _this.$element.trigger('moved.zf.slider', [$hndl]);
        });

        //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
        var moveTime = this.$element.data('dragging') ? 1000 / 60 : this.options.moveTime;

        Foundation.Move(moveTime, $hndl, function () {
          //adjusting the left/top property of the handle, based on the percentage calculated above
          $hndl.css(lOrT, movement + '%');

          if (!_this.options.doubleSided) {
            //if single-handled, a simple method to expand the fill bar
            _this.$fill.css(hOrW, pctOfBar * 100 + '%');
          } else {
            //otherwise, use the css object we created above
            _this.$fill.css(css);
          }
        });

        /**
         * Fires when the value has not been change for a given time.
         * @event Slider#changed
         */
        clearTimeout(_this.timeout);
        _this.timeout = setTimeout(function () {
          _this.$element.trigger('changed.zf.slider', [$hndl]);
        }, _this.options.changedDelay);
      }

      /**
       * Sets the initial attribute for the slider element.
       * @function
       * @private
       * @param {Number} idx - index of the current handle/input to use.
       */

    }, {
      key: '_setInitAttr',
      value: function _setInitAttr(idx) {
        var id = this.inputs.eq(idx).attr('id') || Foundation.GetYoDigits(6, 'slider');
        this.inputs.eq(idx).attr({
          'id': id,
          'max': this.options.end,
          'min': this.options.start,
          'step': this.options.step
        });
        this.handles.eq(idx).attr({
          'role': 'slider',
          'aria-controls': id,
          'aria-valuemax': this.options.end,
          'aria-valuemin': this.options.start,
          'aria-valuenow': idx === 0 ? this.options.initialStart : this.options.initialEnd,
          'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
          'tabindex': 0
        });
      }

      /**
       * Sets the input and `aria-valuenow` values for the slider element.
       * @function
       * @private
       * @param {jQuery} $handle - the currently selected handle.
       * @param {Number} val - floating point of the new value.
       */

    }, {
      key: '_setValues',
      value: function _setValues($handle, val) {
        var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
        this.inputs.eq(idx).val(val);
        $handle.attr('aria-valuenow', val);
      }

      /**
       * Handles events on the slider element.
       * Calculates the new location of the current handle.
       * If there are two handles and the bar was clicked, it determines which handle to move.
       * @function
       * @private
       * @param {Object} e - the `event` object passed from the listener.
       * @param {jQuery} $handle - the current handle to calculate for, if selected.
       * @param {Number} val - floating point number for the new value of the slider.
       * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
       */

    }, {
      key: '_handleEvent',
      value: function _handleEvent(e, $handle, val) {
        var value, hasVal;
        if (!val) {
          //click or drag events
          e.preventDefault();
          var _this = this,
              vertical = this.options.vertical,
              param = vertical ? 'height' : 'width',
              direction = vertical ? 'top' : 'left',
              pageXY = vertical ? e.pageY : e.pageX,
              halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
              barDim = this.$element[0].getBoundingClientRect()[param],
              barOffset = this.$element.offset()[direction] - pageXY,

          //if the cursor position is less than or greater than the elements bounding coordinates, set coordinates within those bounds
          barXY = barOffset > 0 ? -halfOfHandle : barOffset - halfOfHandle < -barDim ? barDim : Math.abs(barOffset),
              offsetPct = percent(barXY, barDim);
          value = (this.options.end - this.options.start) * offsetPct + this.options.start;

          // turn everything around for RTL, yay math!
          if (Foundation.rtl() && !this.options.vertical) {
            value = this.options.end - value;
          }

          value = _this._adjustValue(null, value);
          //boolean flag for the setHandlePos fn, specifically for vertical sliders
          hasVal = false;

          if (!$handle) {
            //figure out which handle it is, pass it to the next function.
            var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
                secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
            $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
          }
        } else {
          //change event on input
          value = this._adjustValue(null, val);
          hasVal = true;
        }

        this._setHandlePos($handle, value, hasVal);
      }

      /**
       * Adjustes value for handle in regard to step value. returns adjusted value
       * @function
       * @private
       * @param {jQuery} $handle - the selected handle.
       * @param {Number} value - value to adjust. used if $handle is falsy
       */

    }, {
      key: '_adjustValue',
      value: function _adjustValue($handle, value) {
        var val,
            step = this.options.step,
            div = parseFloat(step / 2),
            left,
            prev_val,
            next_val;
        if (!!$handle) {
          val = parseFloat($handle.attr('aria-valuenow'));
        } else {
          val = value;
        }
        left = val % step;
        prev_val = val - left;
        next_val = prev_val + step;
        if (left === 0) {
          return val;
        }
        val = val >= prev_val + div ? next_val : prev_val;
        return val;
      }

      /**
       * Adds event listeners to the slider elements.
       * @function
       * @private
       * @param {jQuery} $handle - the current handle to apply listeners to.
       */

    }, {
      key: '_events',
      value: function _events($handle) {
        if (this.options.disabled) {
          return false;
        }

        var _this = this,
            curHandle,
            timer;

        this.inputs.off('change.zf.slider').on('change.zf.slider', function (e) {
          var idx = _this.inputs.index($(this));
          _this._handleEvent(e, _this.handles.eq(idx), $(this).val());
        });

        if (this.options.clickSelect) {
          this.$element.off('click.zf.slider').on('click.zf.slider', function (e) {
            if (_this.$element.data('dragging')) {
              return false;
            }

            if (!$(e.target).is('[data-slider-handle]')) {
              if (_this.options.doubleSided) {
                _this._handleEvent(e);
              } else {
                _this._handleEvent(e, _this.$handle);
              }
            }
          });
        }

        if (this.options.draggable) {
          this.handles.addTouch();

          var $body = $('body');
          $handle.off('mousedown.zf.slider').on('mousedown.zf.slider', function (e) {
            $handle.addClass('is-dragging');
            _this.$fill.addClass('is-dragging'); //
            _this.$element.data('dragging', true);

            curHandle = $(e.currentTarget);

            $body.on('mousemove.zf.slider', function (e) {
              e.preventDefault();

              _this._handleEvent(e, curHandle);
            }).on('mouseup.zf.slider', function (e) {
              _this._handleEvent(e, curHandle);

              $handle.removeClass('is-dragging');
              _this.$fill.removeClass('is-dragging');
              _this.$element.data('dragging', false);

              $body.off('mousemove.zf.slider mouseup.zf.slider');
            });
          });
        }

        $handle.off('keydown.zf.slider').on('keydown.zf.slider', function (e) {
          var _$handle = $(this),
              idx = _this.options.doubleSided ? _this.handles.index(_$handle) : 0,
              oldValue = parseFloat(_this.inputs.eq(idx).val()),
              newValue;

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Slider', {
            decrease: function () {
              newValue = oldValue - _this.options.step;
            },
            increase: function () {
              newValue = oldValue + _this.options.step;
            },
            decrease_fast: function () {
              newValue = oldValue - _this.options.step * 10;
            },
            increase_fast: function () {
              newValue = oldValue + _this.options.step * 10;
            },
            handled: function () {
              // only set handle pos when event was handled specially
              e.preventDefault();
              _this._setHandlePos(_$handle, newValue, true);
            }
          });
          /*if (newValue) { // if pressed key has special function, update value
            e.preventDefault();
            _this._setHandlePos(_$handle, newValue);
          }*/
        });
      }

      /**
       * Destroys the slider plugin.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.handles.off('.zf.slider');
        this.inputs.off('.zf.slider');
        this.$element.off('.zf.slider');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Slider;
  }();

  Slider.defaults = {
    /**
     * Minimum value for the slider scale.
     * @option
     * @example 0
     */
    start: 0,
    /**
     * Maximum value for the slider scale.
     * @option
     * @example 100
     */
    end: 100,
    /**
     * Minimum value change per change event.
     * @option
     * @example 1
     */
    step: 1,
    /**
     * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
     * @option
     * @example 0
     */
    initialStart: 0,
    /**
     * Value at which the right handle/second input should be set to on initialization.
     * @option
     * @example 100
     */
    initialEnd: 100,
    /**
     * Allows the input to be located outside the container and visible. Set to by the JS
     * @option
     * @example false
     */
    binding: false,
    /**
     * Allows the user to click/tap on the slider bar to select a value.
     * @option
     * @example true
     */
    clickSelect: true,
    /**
     * Set to true and use the `vertical` class to change alignment to vertical.
     * @option
     * @example false
     */
    vertical: false,
    /**
     * Allows the user to drag the slider handle(s) to select a value.
     * @option
     * @example true
     */
    draggable: true,
    /**
     * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
     * @option
     * @example false
     */
    disabled: false,
    /**
     * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
     * @option
     * @example false
     */
    doubleSided: false,
    /**
     * Potential future feature.
     */
    // steps: 100,
    /**
     * Number of decimal places the plugin should go to for floating point precision.
     * @option
     * @example 2
     */
    decimal: 2,
    /**
     * Time delay for dragged elements.
     */
    // dragDelay: 0,
    /**
     * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
     * @option
     * @example 200
     */
    moveTime: 200, //update this if changing the transition time in the sass
    /**
     * Class applied to disabled sliders.
     * @option
     * @example 'disabled'
     */
    disabledClass: 'disabled',
    /**
     * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
     * @option
     * @example false
     */
    invertVertical: false,
    /**
     * Milliseconds before the `changed.zf-slider` event is triggered after value change. 
     * @option
     * @example 500
     */
    changedDelay: 500
  };

  function percent(frac, num) {
    return frac / num;
  }
  function absPosition($handle, dir, clickPos, param) {
    return Math.abs($handle.position()[dir] + $handle[param]() / 2 - clickPos);
  }

  // Window exports
  Foundation.plugin(Slider, 'Slider');
}(jQuery);

//*********this is in case we go to static, absolute positions instead of dynamic positioning********
// this.setSteps(function() {
//   _this._events();
//   var initStart = _this.options.positions[_this.options.initialStart - 1] || null;
//   var initEnd = _this.options.initialEnd ? _this.options.position[_this.options.initialEnd - 1] : null;
//   if (initStart || initEnd) {
//     _this._handleEvent(initStart, initEnd);
//   }
// });

//***********the other part of absolute positions*************
// Slider.prototype.setSteps = function(cb) {
//   var posChange = this.$element.outerWidth() / this.options.steps;
//   var counter = 0
//   while(counter < this.options.steps) {
//     if (counter) {
//       this.options.positions.push(this.options.positions[counter - 1] + posChange);
//     } else {
//       this.options.positions.push(posChange);
//     }
//     counter++;
//   }
//   cb();
// };
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Sticky module.
   * @module foundation.sticky
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  var Sticky = function () {
    /**
     * Creates a new instance of a sticky thing.
     * @class
     * @param {jQuery} element - jQuery object to make sticky.
     * @param {Object} options - options object passed when creating the element programmatically.
     */

    function Sticky(element, options) {
      _classCallCheck(this, Sticky);

      this.$element = element;
      this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Sticky');
    }

    /**
     * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
     * @function
     * @private
     */


    _createClass(Sticky, [{
      key: '_init',
      value: function _init() {
        var $parent = this.$element.parent('[data-sticky-container]'),
            id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
            _this = this;

        if (!$parent.length) {
          this.wasWrapped = true;
        }
        this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
        this.$container.addClass(this.options.containerClass);

        this.$element.addClass(this.options.stickyClass).attr({ 'data-resize': id });

        this.scrollCount = this.options.checkEvery;
        this.isStuck = false;
        $(window).one('load.zf.sticky', function () {
          if (_this.options.anchor !== '') {
            _this.$anchor = $('#' + _this.options.anchor);
          } else {
            _this._parsePoints();
          }

          _this._setSizes(function () {
            _this._calc(false);
          });
          _this._events(id.split('-').reverse().join('-'));
        });
      }

      /**
       * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
       * @function
       * @private
       */

    }, {
      key: '_parsePoints',
      value: function _parsePoints() {
        var top = this.options.topAnchor,
            btm = this.options.btmAnchor,
            pts = [top, btm],
            breaks = {};
        if (top && btm) {

          for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
            var pt;
            if (typeof pts[i] === 'number') {
              pt = pts[i];
            } else {
              var place = pts[i].split(':'),
                  anchor = $('#' + place[0]);

              pt = anchor.offset().top;
              if (place[1] && place[1].toLowerCase() === 'bottom') {
                pt += anchor[0].getBoundingClientRect().height;
              }
            }
            breaks[i] = pt;
          }
        } else {
          breaks = { 0: 1, 1: document.documentElement.scrollHeight };
        }

        this.points = breaks;
        return;
      }

      /**
       * Adds event handlers for the scrolling element.
       * @private
       * @param {String} id - psuedo-random id for unique scroll event listener.
       */

    }, {
      key: '_events',
      value: function _events(id) {
        var _this = this,
            scrollListener = this.scrollListener = 'scroll.zf.' + id;
        if (this.isOn) {
          return;
        }
        if (this.canStick) {
          this.isOn = true;
          $(window).off(scrollListener).on(scrollListener, function (e) {
            if (_this.scrollCount === 0) {
              _this.scrollCount = _this.options.checkEvery;
              _this._setSizes(function () {
                _this._calc(false, window.pageYOffset);
              });
            } else {
              _this.scrollCount--;
              _this._calc(false, window.pageYOffset);
            }
          });
        }

        this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function (e, el) {
          _this._setSizes(function () {
            _this._calc(false);
            if (_this.canStick) {
              if (!_this.isOn) {
                _this._events(id);
              }
            } else if (_this.isOn) {
              _this._pauseListeners(scrollListener);
            }
          });
        });
      }

      /**
       * Removes event handlers for scroll and change events on anchor.
       * @fires Sticky#pause
       * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
       */

    }, {
      key: '_pauseListeners',
      value: function _pauseListeners(scrollListener) {
        this.isOn = false;
        $(window).off(scrollListener);

        /**
         * Fires when the plugin is paused due to resize event shrinking the view.
         * @event Sticky#pause
         * @private
         */
        this.$element.trigger('pause.zf.sticky');
      }

      /**
       * Called on every `scroll` event and on `_init`
       * fires functions based on booleans and cached values
       * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
       * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
       */

    }, {
      key: '_calc',
      value: function _calc(checkSizes, scroll) {
        if (checkSizes) {
          this._setSizes();
        }

        if (!this.canStick) {
          if (this.isStuck) {
            this._removeSticky(true);
          }
          return false;
        }

        if (!scroll) {
          scroll = window.pageYOffset;
        }

        if (scroll >= this.topPoint) {
          if (scroll <= this.bottomPoint) {
            if (!this.isStuck) {
              this._setSticky();
            }
          } else {
            if (this.isStuck) {
              this._removeSticky(false);
            }
          }
        } else {
          if (this.isStuck) {
            this._removeSticky(true);
          }
        }
      }

      /**
       * Causes the $element to become stuck.
       * Adds `position: fixed;`, and helper classes.
       * @fires Sticky#stuckto
       * @function
       * @private
       */

    }, {
      key: '_setSticky',
      value: function _setSticky() {
        var stickTo = this.options.stickTo,
            mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
            notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
            css = {};

        css[mrgn] = this.options[mrgn] + 'em';
        css[stickTo] = 0;
        css[notStuckTo] = 'auto';
        css['left'] = this.$container.offset().left + parseInt(window.getComputedStyle(this.$container[0])["padding-left"], 10);
        this.isStuck = true;
        this.$element.removeClass('is-anchored is-at-' + notStuckTo).addClass('is-stuck is-at-' + stickTo).css(css)
        /**
         * Fires when the $element has become `position: fixed;`
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
         * @event Sticky#stuckto
         */
        .trigger('sticky.zf.stuckto:' + stickTo);
      }

      /**
       * Causes the $element to become unstuck.
       * Removes `position: fixed;`, and helper classes.
       * Adds other helper classes.
       * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
       * @fires Sticky#unstuckfrom
       * @private
       */

    }, {
      key: '_removeSticky',
      value: function _removeSticky(isTop) {
        var stickTo = this.options.stickTo,
            stickToTop = stickTo === 'top',
            css = {},
            anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
            mrgn = stickToTop ? 'marginTop' : 'marginBottom',
            notStuckTo = stickToTop ? 'bottom' : 'top',
            topOrBottom = isTop ? 'top' : 'bottom';

        css[mrgn] = 0;

        if (isTop && !stickToTop || stickToTop && !isTop) {
          css[stickTo] = anchorPt;
          css[notStuckTo] = 0;
        } else {
          css[stickTo] = 0;
          css[notStuckTo] = anchorPt;
        }

        css['left'] = '';
        this.isStuck = false;
        this.$element.removeClass('is-stuck is-at-' + stickTo).addClass('is-anchored is-at-' + topOrBottom).css(css)
        /**
         * Fires when the $element has become anchored.
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
         * @event Sticky#unstuckfrom
         */
        .trigger('sticky.zf.unstuckfrom:' + topOrBottom);
      }

      /**
       * Sets the $element and $container sizes for plugin.
       * Calls `_setBreakPoints`.
       * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
       * @private
       */

    }, {
      key: '_setSizes',
      value: function _setSizes(cb) {
        this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);
        if (!this.canStick) {
          cb();
        }
        var _this = this,
            newElemWidth = this.$container[0].getBoundingClientRect().width,
            comp = window.getComputedStyle(this.$container[0]),
            pdng = parseInt(comp['padding-right'], 10);

        if (this.$anchor && this.$anchor.length) {
          this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
        } else {
          this._parsePoints();
        }

        this.$element.css({
          'max-width': newElemWidth - pdng + 'px'
        });

        var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
        this.containerHeight = newContainerHeight;
        this.$container.css({
          height: newContainerHeight
        });
        this.elemHeight = newContainerHeight;

        if (this.isStuck) {
          this.$element.css({ "left": this.$container.offset().left + parseInt(comp['padding-left'], 10) });
        }

        this._setBreakPoints(newContainerHeight, function () {
          if (cb) {
            cb();
          }
        });
      }

      /**
       * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
       * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
       * @param {Function} cb - optional callback function to be called on completion.
       * @private
       */

    }, {
      key: '_setBreakPoints',
      value: function _setBreakPoints(elemHeight, cb) {
        if (!this.canStick) {
          if (cb) {
            cb();
          } else {
            return false;
          }
        }
        var mTop = emCalc(this.options.marginTop),
            mBtm = emCalc(this.options.marginBottom),
            topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
            bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,

        // topPoint = this.$anchor.offset().top || this.points[0],
        // bottomPoint = topPoint + this.anchorHeight || this.points[1],
        winHeight = window.innerHeight;

        if (this.options.stickTo === 'top') {
          topPoint -= mTop;
          bottomPoint -= elemHeight + mTop;
        } else if (this.options.stickTo === 'bottom') {
          topPoint -= winHeight - (elemHeight + mBtm);
          bottomPoint -= winHeight - mBtm;
        } else {
          //this would be the stickTo: both option... tricky
        }

        this.topPoint = topPoint;
        this.bottomPoint = bottomPoint;

        if (cb) {
          cb();
        }
      }

      /**
       * Destroys the current sticky element.
       * Resets the element to the top position first.
       * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._removeSticky(true);

        this.$element.removeClass(this.options.stickyClass + ' is-anchored is-at-top').css({
          height: '',
          top: '',
          bottom: '',
          'max-width': ''
        }).off('resizeme.zf.trigger');

        this.$anchor.off('change.zf.sticky');
        $(window).off(this.scrollListener);

        if (this.wasWrapped) {
          this.$element.unwrap();
        } else {
          this.$container.removeClass(this.options.containerClass).css({
            height: ''
          });
        }
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Sticky;
  }();

  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '&lt;div data-sticky-container class="small-6 columns"&gt;&lt;/div&gt;'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em) {
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }

  // Window exports
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tabs module.
   * @module foundation.tabs
   * @requires foundation.util.keyboard
   * @requires foundation.util.timerAndImageLoader if tabs contain images
   */

  var Tabs = function () {
    /**
     * Creates a new instance of tabs.
     * @class
     * @fires Tabs#init
     * @param {jQuery} element - jQuery object to make into tabs.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Tabs(element, options) {
      _classCallCheck(this, Tabs);

      this.$element = element;
      this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

      this._init();
      Foundation.registerPlugin(this, 'Tabs');
      Foundation.Keyboard.register('Tabs', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'previous',
        'ARROW_DOWN': 'next',
        'ARROW_LEFT': 'previous'
        // 'TAB': 'next',
        // 'SHIFT_TAB': 'previous'
      });
    }

    /**
     * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
     * @private
     */


    _createClass(Tabs, [{
      key: '_init',
      value: function _init() {
        var _this = this;

        this.$tabTitles = this.$element.find('.' + this.options.linkClass);
        this.$tabContent = $('[data-tabs-content="' + this.$element[0].id + '"]');

        this.$tabTitles.each(function () {
          var $elem = $(this),
              $link = $elem.find('a'),
              isActive = $elem.hasClass('is-active'),
              hash = $link[0].hash.slice(1),
              linkId = $link[0].id ? $link[0].id : hash + '-label',
              $tabContent = $('#' + hash);

          $elem.attr({ 'role': 'presentation' });

          $link.attr({
            'role': 'tab',
            'aria-controls': hash,
            'aria-selected': isActive,
            'id': linkId
          });

          $tabContent.attr({
            'role': 'tabpanel',
            'aria-hidden': !isActive,
            'aria-labelledby': linkId
          });

          if (isActive && _this.options.autoFocus) {
            $link.focus();
          }
        });

        if (this.options.matchHeight) {
          var $images = this.$tabContent.find('img');

          if ($images.length) {
            Foundation.onImagesLoaded($images, this._setHeight.bind(this));
          } else {
            this._setHeight();
          }
        }

        this._events();
      }

      /**
       * Adds event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this._addKeyHandler();
        this._addClickHandler();

        if (this.options.matchHeight) {
          $(window).on('changed.zf.mediaquery', this._setHeight.bind(this));
        }
      }

      /**
       * Adds click handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addClickHandler',
      value: function _addClickHandler() {
        var _this = this;

        this.$element.off('click.zf.tabs').on('click.zf.tabs', '.' + this.options.linkClass, function (e) {
          e.preventDefault();
          e.stopPropagation();
          if ($(this).hasClass('is-active')) {
            return;
          }
          _this._handleTabChange($(this));
        });
      }

      /**
       * Adds keyboard event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addKeyHandler',
      value: function _addKeyHandler() {
        var _this = this;
        var $firstTab = _this.$element.find('li:first-of-type');
        var $lastTab = _this.$element.find('li:last-of-type');

        this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function (e) {
          if (e.which === 9) return;
          e.stopPropagation();
          e.preventDefault();

          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              if (_this.options.wrapOnKeys) {
                $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
                $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
              } else {
                $prevElement = $elements.eq(Math.max(0, i - 1));
                $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              }
              return;
            }
          });

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Tabs', {
            open: function () {
              $element.find('[role="tab"]').focus();
              _this._handleTabChange($element);
            },
            previous: function () {
              $prevElement.find('[role="tab"]').focus();
              _this._handleTabChange($prevElement);
            },
            next: function () {
              $nextElement.find('[role="tab"]').focus();
              _this._handleTabChange($nextElement);
            }
          });
        });
      }

      /**
       * Opens the tab `$targetContent` defined by `$target`.
       * @param {jQuery} $target - Tab to open.
       * @fires Tabs#change
       * @function
       */

    }, {
      key: '_handleTabChange',
      value: function _handleTabChange($target) {
        var $tabLink = $target.find('[role="tab"]'),
            hash = $tabLink[0].hash,
            $targetContent = this.$tabContent.find(hash),
            $oldTab = this.$element.find('.' + this.options.linkClass + '.is-active').removeClass('is-active').find('[role="tab"]').attr({ 'aria-selected': 'false' });

        $('#' + $oldTab.attr('aria-controls')).removeClass('is-active').attr({ 'aria-hidden': 'true' });

        $target.addClass('is-active');

        $tabLink.attr({ 'aria-selected': 'true' });

        $targetContent.addClass('is-active').attr({ 'aria-hidden': 'false' });

        /**
         * Fires when the plugin has successfully changed tabs.
         * @event Tabs#change
         */
        this.$element.trigger('change.zf.tabs', [$target]);
      }

      /**
       * Public method for selecting a content pane to display.
       * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
       * @function
       */

    }, {
      key: 'selectTab',
      value: function selectTab(elem) {
        var idStr;

        if (typeof elem === 'object') {
          idStr = elem[0].id;
        } else {
          idStr = elem;
        }

        if (idStr.indexOf('#') < 0) {
          idStr = '#' + idStr;
        }

        var $target = this.$tabTitles.find('[href="' + idStr + '"]').parent('.' + this.options.linkClass);

        this._handleTabChange($target);
      }
    }, {
      key: '_setHeight',

      /**
       * Sets the height of each panel to the height of the tallest panel.
       * If enabled in options, gets called on media query change.
       * If loading content via external source, can be called directly or with _reflow.
       * @function
       * @private
       */
      value: function _setHeight() {
        var max = 0;
        this.$tabContent.find('.' + this.options.panelClass).css('height', '').each(function () {
          var panel = $(this),
              isActive = panel.hasClass('is-active');

          if (!isActive) {
            panel.css({ 'visibility': 'hidden', 'display': 'block' });
          }

          var temp = this.getBoundingClientRect().height;

          if (!isActive) {
            panel.css({
              'visibility': '',
              'display': ''
            });
          }

          max = temp > max ? temp : max;
        }).css('height', max + 'px');
      }

      /**
       * Destroys an instance of an tabs.
       * @fires Tabs#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('.' + this.options.linkClass).off('.zf.tabs').hide().end().find('.' + this.options.panelClass).hide();

        if (this.options.matchHeight) {
          $(window).off('changed.zf.mediaquery');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tabs;
  }();

  Tabs.defaults = {
    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * @option
     * @example false
     */
    autoFocus: false,

    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,

    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,

    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',

    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel'
  };

  function checkClass($elem) {
    return $elem.hasClass('is-active');
  }

  // Window exports
  Foundation.plugin(Tabs, 'Tabs');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  var Toggler = function () {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Toggler(element, options) {
      _classCallCheck(this, Toggler);

      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */


    _createClass(Toggler, [{
      key: '_init',
      value: function _init() {
        var input;
        // Parse animation classes if they were set
        if (this.options.animate) {
          input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }
        // Otherwise, parse toggle class
        else {
            input = this.$element.data('toggler');
            // Allow for a . at the beginning of the string
            this.className = input[0] === '.' ? input.slice(1) : input;
          }

        // Add ARIA attributes to triggers
        var id = this.$element[0].id;
        $('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id);
        // If the target is hidden, add aria-hidden
        this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
      }

      /**
       * Initializes events for the toggle trigger.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
      }

      /**
       * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
       * @function
       * @fires Toggler#on
       * @fires Toggler#off
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
      }
    }, {
      key: '_toggleClass',
      value: function _toggleClass() {
        this.$element.toggleClass(this.className);

        var isOn = this.$element.hasClass(this.className);
        if (isOn) {
          /**
           * Fires if the target element has the class after a toggle.
           * @event Toggler#on
           */
          this.$element.trigger('on.zf.toggler');
        } else {
          /**
           * Fires if the target element does not have the class after a toggle.
           * @event Toggler#off
           */
          this.$element.trigger('off.zf.toggler');
        }

        this._updateARIA(isOn);
      }
    }, {
      key: '_toggleAnimate',
      value: function _toggleAnimate() {
        var _this = this;

        if (this.$element.is(':hidden')) {
          Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
            _this._updateARIA(true);
            this.trigger('on.zf.toggler');
          });
        } else {
          Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
            _this._updateARIA(false);
            this.trigger('off.zf.toggler');
          });
        }
      }
    }, {
      key: '_updateARIA',
      value: function _updateARIA(isOn) {
        this.$element.attr('aria-expanded', isOn ? true : false);
      }

      /**
       * Destroys the instance of Toggler on the element.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.toggler');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Toggler;
  }();

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tooltip module.
   * @module foundation.tooltip
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Tooltip = function () {
    /**
     * Creates a new instance of a Tooltip.
     * @class
     * @fires Tooltip#init
     * @param {jQuery} element - jQuery object to attach a tooltip to.
     * @param {Object} options - object to extend the default configuration.
     */

    function Tooltip(element, options) {
      _classCallCheck(this, Tooltip);

      this.$element = element;
      this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

      this.isActive = false;
      this.isClick = false;
      this._init();

      Foundation.registerPlugin(this, 'Tooltip');
    }

    /**
     * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
     * @private
     */


    _createClass(Tooltip, [{
      key: '_init',
      value: function _init() {
        var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

        this.options.positionClass = this._getPositionClass(this.$element);
        this.options.tipText = this.options.tipText || this.$element.attr('title');
        this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

        this.template.appendTo(document.body).text(this.options.tipText).hide();

        this.$element.attr({
          'title': '',
          'aria-describedby': elemId,
          'data-yeti-box': elemId,
          'data-toggle': elemId,
          'data-resize': elemId
        }).addClass(this.triggerClass);

        //helper variables to track movement on collisions
        this.usedPositions = [];
        this.counter = 4;
        this.classChanged = false;

        this._events();
      }

      /**
       * Grabs the current positioning class, if present, and returns the value or an empty string.
       * @private
       */

    }, {
      key: '_getPositionClass',
      value: function _getPositionClass(element) {
        if (!element) {
          return '';
        }
        // var position = element.attr('class').match(/top|left|right/g);
        var position = element[0].className.match(/\b(top|left|right)\b/g);
        position = position ? position[0] : '';
        return position;
      }
    }, {
      key: '_buildTemplate',

      /**
       * builds the tooltip element, adds attributes, and returns the template.
       * @private
       */
      value: function _buildTemplate(id) {
        var templateClasses = (this.options.tooltipClass + ' ' + this.options.positionClass + ' ' + this.options.templateClasses).trim();
        var $template = $('<div></div>').addClass(templateClasses).attr({
          'role': 'tooltip',
          'aria-hidden': true,
          'data-is-active': false,
          'data-is-focus': false,
          'id': id
        });
        return $template;
      }

      /**
       * Function that gets called if a collision event is detected.
       * @param {String} position - positioning class to try
       * @private
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');

        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.template.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.template.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.template.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.template.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
       * if the tooltip is larger than the screen width, default to full width - any user selected margin
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        var position = this._getPositionClass(this.template),
            $tipDims = Foundation.Box.GetDimensions(this.template),
            $anchorDims = Foundation.Box.GetDimensions(this.$element),
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset,
            _this = this;

        if ($tipDims.width >= $tipDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.template)) {
          this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $anchorDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          return false;
        }

        this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.template) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * reveals the tooltip, and fires an event to close any other open tooltips on the page
       * @fires Tooltip#closeme
       * @fires Tooltip#show
       * @function
       */

    }, {
      key: 'show',
      value: function show() {
        if (this.options.showOn !== 'all' && !Foundation.MediaQuery.atLeast(this.options.showOn)) {
          // console.error('The screen is too small to display this tooltip');
          return false;
        }

        var _this = this;
        this.template.css('visibility', 'hidden').show();
        this._setPosition();

        /**
         * Fires to close all other open tooltips on the page
         * @event Closeme#tooltip
         */
        this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));

        this.template.attr({
          'data-is-active': true,
          'aria-hidden': false
        });
        _this.isActive = true;
        // console.log(this.template);
        this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function () {
          //maybe do stuff?
        });
        /**
         * Fires when the tooltip is shown
         * @event Tooltip#show
         */
        this.$element.trigger('show.zf.tooltip');
      }

      /**
       * Hides the current tooltip, and resets the positioning class if it was changed due to collision
       * @fires Tooltip#hide
       * @function
       */

    }, {
      key: 'hide',
      value: function hide() {
        // console.log('hiding', this.$element.data('yeti-box'));
        var _this = this;
        this.template.stop().attr({
          'aria-hidden': true,
          'data-is-active': false
        }).fadeOut(this.options.fadeOutDuration, function () {
          _this.isActive = false;
          _this.isClick = false;
          if (_this.classChanged) {
            _this.template.removeClass(_this._getPositionClass(_this.template)).addClass(_this.options.positionClass);

            _this.usedPositions = [];
            _this.counter = 4;
            _this.classChanged = false;
          }
        });
        /**
         * fires when the tooltip is hidden
         * @event Tooltip#hide
         */
        this.$element.trigger('hide.zf.tooltip');
      }

      /**
       * adds event listeners for the tooltip and its anchor
       * TODO combine some of the listeners like focus and mouseenter, etc.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        var $template = this.template;
        var isFocus = false;

        if (!this.options.disableHover) {

          this.$element.on('mouseenter.zf.tooltip', function (e) {
            if (!_this.isActive) {
              _this.timeout = setTimeout(function () {
                _this.show();
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.tooltip', function (e) {
            clearTimeout(_this.timeout);
            if (!isFocus || !_this.isClick && _this.options.clickOpen) {
              _this.hide();
            }
          });
        }

        if (this.options.clickOpen) {
          this.$element.on('mousedown.zf.tooltip', function (e) {
            e.stopImmediatePropagation();
            if (_this.isClick) {
              _this.hide();
              // _this.isClick = false;
            } else {
                _this.isClick = true;
                if ((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive) {
                  _this.show();
                }
              }
          });
        }

        if (!this.options.disableForTouch) {
          this.$element.on('tap.zf.tooltip touchend.zf.tooltip', function (e) {
            _this.isActive ? _this.hide() : _this.show();
          });
        }

        this.$element.on({
          // 'toggle.zf.trigger': this.toggle.bind(this),
          // 'close.zf.trigger': this.hide.bind(this)
          'close.zf.trigger': this.hide.bind(this)
        });

        this.$element.on('focus.zf.tooltip', function (e) {
          isFocus = true;
          // console.log(_this.isClick);
          if (_this.isClick) {
            return false;
          } else {
            // $(window)
            _this.show();
          }
        }).on('focusout.zf.tooltip', function (e) {
          isFocus = false;
          _this.isClick = false;
          _this.hide();
        }).on('resizeme.zf.trigger', function () {
          if (_this.isActive) {
            _this._setPosition();
          }
        });
      }

      /**
       * adds a toggle method, in addition to the static show() & hide() functions
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.hide();
        } else {
          this.show();
        }
      }

      /**
       * Destroys an instance of tooltip, removes template element from the view.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.attr('title', this.template.text()).off('.zf.trigger .zf.tootip')
        //  .removeClass('has-tip')
        .removeAttr('aria-describedby').removeAttr('data-yeti-box').removeAttr('data-toggle').removeAttr('data-resize');

        this.template.remove();

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tooltip;
  }();

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @example 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @example 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @example 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @example 'my-cool-tip-class'
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @example 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @example 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @example 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @example '&lt;div class="tooltip"&gt;&lt;/div&gt;'
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @example 'Some cool space fact here.'
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @example true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @example 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @example 12
     */
    hOffset: 12
  };

  /**
   * TODO utilize resize event trigger
   */

  // Window exports
  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;'use strict';

jQuery('iframe[src*="youtube.com"]').wrap("<div class='flex-video widescreen'/>");
jQuery('iframe[src*="vimeo.com"]').wrap("<div class='flex-video widescreen vimeo'/>");
;"use strict";

jQuery(document).foundation();
;'use strict';

// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;"use strict";
;'use strict';

$(window).bind(' load resize orientationChange ', function () {
   var footer = $("#footer-container");
   var pos = footer.position();
   var height = $(window).height();
   height = height - pos.top;
   height = height - footer.height() - 1;

   function stickyFooter() {
      footer.css({
         'margin-top': height + 'px'
      });
   }

   if (height > 0) {
      stickyFooter();
   }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uYWJpZGUuanMiLCJmb3VuZGF0aW9uLmFjY29yZGlvbi5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uTWVudS5qcyIsImZvdW5kYXRpb24uZHJpbGxkb3duLmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bi5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLmludGVyY2hhbmdlLmpzIiwiZm91bmRhdGlvbi5tYWdlbGxhbi5qcyIsImZvdW5kYXRpb24ub2ZmY2FudmFzLmpzIiwiZm91bmRhdGlvbi5vcmJpdC5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnJldmVhbC5qcyIsImZvdW5kYXRpb24uc2xpZGVyLmpzIiwiZm91bmRhdGlvbi5zdGlja3kuanMiLCJmb3VuZGF0aW9uLnRhYnMuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJmb3VuZGF0aW9uLnRvb2x0aXAuanMiLCJtb3Rpb24tdWkuanMiLCJmbGV4LXZpZGVvLmpzIiwiaW5pdC1mb3VuZGF0aW9uLmpzIiwiam95cmlkZS1kZW1vLmpzIiwib2ZmQ2FudmFzLmpzIiwic3RpY2t5Zm9vdGVyLmpzIl0sIm5hbWVzIjpb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LE9BQWQsRUFBdUIsU0FBdkIsRUFBa0MsRUFBbEMsRUFEMEM7R0FBakM7O0FBSVgsY0FBWSxVQUFTLE9BQVQsRUFBa0IsU0FBbEIsRUFBNkIsRUFBN0IsRUFBaUM7QUFDM0MsWUFBUSxLQUFSLEVBQWUsT0FBZixFQUF3QixTQUF4QixFQUFtQyxFQUFuQyxFQUQyQztHQUFqQztDQUxWOzs7QUNoR0osT0FBUSw0QkFBUixFQUFzQyxJQUF0QyxDQUEyQyxzQ0FBM0M7QUFDQSxPQUFRLDBCQUFSLEVBQW9DLElBQXBDLENBQXlDLDRDQUF6Qzs7O0FDREEsT0FBTyxRQUFQLEVBQWlCLFVBQWpCOzs7O0FDQ0EsRUFBRSxXQUFGLEVBQWUsRUFBZixDQUFrQixPQUFsQixFQUEyQixZQUFXO0FBQ3BDLElBQUUsUUFBRixFQUFZLFVBQVosQ0FBdUIsU0FBdkIsRUFBaUMsT0FBakMsRUFEb0M7Q0FBWCxDQUEzQjtDQ0RBOzs7QUNDQSxFQUFFLE1BQUYsRUFBVSxJQUFWLENBQWUsaUNBQWYsRUFBa0QsWUFBWTtBQUMzRCxPQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFULENBRHVEO0FBRTNELE9BQUksTUFBTSxPQUFPLFFBQVAsRUFBTixDQUZ1RDtBQUczRCxPQUFJLFNBQVMsRUFBRSxNQUFGLEVBQVUsTUFBVixFQUFULENBSHVEO0FBSTNELFlBQVMsU0FBUyxJQUFJLEdBQUosQ0FKeUM7QUFLM0QsWUFBUyxTQUFTLE9BQU8sTUFBUCxFQUFULEdBQTBCLENBQTFCLENBTGtEOztBQU8zRCxZQUFTLFlBQVQsR0FBd0I7QUFDdEIsYUFBTyxHQUFQLENBQVc7QUFDUCx1QkFBYyxTQUFTLElBQVQ7T0FEbEIsRUFEc0I7SUFBeEI7O0FBTUEsT0FBSSxTQUFTLENBQVQsRUFBWTtBQUNkLHFCQURjO0lBQWhCO0NBYitDLENBQWxEIiwiZmlsZSI6ImZvdW5kYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cud2hhdElucHV0ID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAgIHZhcmlhYmxlc1xyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgKi9cclxuXHJcbiAgLy8gYXJyYXkgb2YgYWN0aXZlbHkgcHJlc3NlZCBrZXlzXHJcbiAgdmFyIGFjdGl2ZUtleXMgPSBbXTtcclxuXHJcbiAgLy8gY2FjaGUgZG9jdW1lbnQuYm9keVxyXG4gIHZhciBib2R5O1xyXG5cclxuICAvLyBib29sZWFuOiB0cnVlIGlmIHRvdWNoIGJ1ZmZlciB0aW1lciBpcyBydW5uaW5nXHJcbiAgdmFyIGJ1ZmZlciA9IGZhbHNlO1xyXG5cclxuICAvLyB0aGUgbGFzdCB1c2VkIGlucHV0IHR5cGVcclxuICB2YXIgY3VycmVudElucHV0ID0gbnVsbDtcclxuXHJcbiAgLy8gYGlucHV0YCB0eXBlcyB0aGF0IGRvbid0IGFjY2VwdCB0ZXh0XHJcbiAgdmFyIG5vblR5cGluZ0lucHV0cyA9IFtcclxuICAgICdidXR0b24nLFxyXG4gICAgJ2NoZWNrYm94JyxcclxuICAgICdmaWxlJyxcclxuICAgICdpbWFnZScsXHJcbiAgICAncmFkaW8nLFxyXG4gICAgJ3Jlc2V0JyxcclxuICAgICdzdWJtaXQnXHJcbiAgXTtcclxuXHJcbiAgLy8gZGV0ZWN0IHZlcnNpb24gb2YgbW91c2Ugd2hlZWwgZXZlbnQgdG8gdXNlXHJcbiAgLy8gdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxyXG4gIHZhciBtb3VzZVdoZWVsID0gZGV0ZWN0V2hlZWwoKTtcclxuXHJcbiAgLy8gbGlzdCBvZiBtb2RpZmllciBrZXlzIGNvbW1vbmx5IHVzZWQgd2l0aCB0aGUgbW91c2UgYW5kXHJcbiAgLy8gY2FuIGJlIHNhZmVseSBpZ25vcmVkIHRvIHByZXZlbnQgZmFsc2Uga2V5Ym9hcmQgZGV0ZWN0aW9uXHJcbiAgdmFyIGlnbm9yZU1hcCA9IFtcclxuICAgIDE2LCAvLyBzaGlmdFxyXG4gICAgMTcsIC8vIGNvbnRyb2xcclxuICAgIDE4LCAvLyBhbHRcclxuICAgIDkxLCAvLyBXaW5kb3dzIGtleSAvIGxlZnQgQXBwbGUgY21kXHJcbiAgICA5MyAgLy8gV2luZG93cyBtZW51IC8gcmlnaHQgQXBwbGUgY21kXHJcbiAgXTtcclxuXHJcbiAgLy8gbWFwcGluZyBvZiBldmVudHMgdG8gaW5wdXQgdHlwZXNcclxuICB2YXIgaW5wdXRNYXAgPSB7XHJcbiAgICAna2V5ZG93bic6ICdrZXlib2FyZCcsXHJcbiAgICAna2V5dXAnOiAna2V5Ym9hcmQnLFxyXG4gICAgJ21vdXNlZG93bic6ICdtb3VzZScsXHJcbiAgICAnbW91c2Vtb3ZlJzogJ21vdXNlJyxcclxuICAgICdNU1BvaW50ZXJEb3duJzogJ3BvaW50ZXInLFxyXG4gICAgJ01TUG9pbnRlck1vdmUnOiAncG9pbnRlcicsXHJcbiAgICAncG9pbnRlcmRvd24nOiAncG9pbnRlcicsXHJcbiAgICAncG9pbnRlcm1vdmUnOiAncG9pbnRlcicsXHJcbiAgICAndG91Y2hzdGFydCc6ICd0b3VjaCdcclxuICB9O1xyXG5cclxuICAvLyBhZGQgY29ycmVjdCBtb3VzZSB3aGVlbCBldmVudCBtYXBwaW5nIHRvIGBpbnB1dE1hcGBcclxuICBpbnB1dE1hcFtkZXRlY3RXaGVlbCgpXSA9ICdtb3VzZSc7XHJcblxyXG4gIC8vIGFycmF5IG9mIGFsbCB1c2VkIGlucHV0IHR5cGVzXHJcbiAgdmFyIGlucHV0VHlwZXMgPSBbXTtcclxuXHJcbiAgLy8gbWFwcGluZyBvZiBrZXkgY29kZXMgdG8gYSBjb21tb24gbmFtZVxyXG4gIHZhciBrZXlNYXAgPSB7XHJcbiAgICA5OiAndGFiJyxcclxuICAgIDEzOiAnZW50ZXInLFxyXG4gICAgMTY6ICdzaGlmdCcsXHJcbiAgICAyNzogJ2VzYycsXHJcbiAgICAzMjogJ3NwYWNlJyxcclxuICAgIDM3OiAnbGVmdCcsXHJcbiAgICAzODogJ3VwJyxcclxuICAgIDM5OiAncmlnaHQnLFxyXG4gICAgNDA6ICdkb3duJ1xyXG4gIH07XHJcblxyXG4gIC8vIG1hcCBvZiBJRSAxMCBwb2ludGVyIGV2ZW50c1xyXG4gIHZhciBwb2ludGVyTWFwID0ge1xyXG4gICAgMjogJ3RvdWNoJyxcclxuICAgIDM6ICd0b3VjaCcsIC8vIHRyZWF0IHBlbiBsaWtlIHRvdWNoXHJcbiAgICA0OiAnbW91c2UnXHJcbiAgfTtcclxuXHJcbiAgLy8gdG91Y2ggYnVmZmVyIHRpbWVyXHJcbiAgdmFyIHRpbWVyO1xyXG5cclxuXHJcbiAgLypcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb25zXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAqL1xyXG5cclxuICAvLyBhbGxvd3MgZXZlbnRzIHRoYXQgYXJlIGFsc28gdHJpZ2dlcmVkIHRvIGJlIGZpbHRlcmVkIG91dCBmb3IgYHRvdWNoc3RhcnRgXHJcbiAgZnVuY3Rpb24gZXZlbnRCdWZmZXIoKSB7XHJcbiAgICBjbGVhclRpbWVyKCk7XHJcbiAgICBzZXRJbnB1dChldmVudCk7XHJcblxyXG4gICAgYnVmZmVyID0gdHJ1ZTtcclxuICAgIHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgIGJ1ZmZlciA9IGZhbHNlO1xyXG4gICAgfSwgNjUwKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJ1ZmZlcmVkRXZlbnQoZXZlbnQpIHtcclxuICAgIGlmICghYnVmZmVyKSBzZXRJbnB1dChldmVudCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1bkJ1ZmZlcmVkRXZlbnQoZXZlbnQpIHtcclxuICAgIGNsZWFyVGltZXIoKTtcclxuICAgIHNldElucHV0KGV2ZW50KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNsZWFyVGltZXIoKSB7XHJcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNldElucHV0KGV2ZW50KSB7XHJcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xyXG4gICAgdmFyIHZhbHVlID0gaW5wdXRNYXBbZXZlbnQudHlwZV07XHJcbiAgICBpZiAodmFsdWUgPT09ICdwb2ludGVyJykgdmFsdWUgPSBwb2ludGVyVHlwZShldmVudCk7XHJcblxyXG4gICAgLy8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHZhbHVlIG1hdGNoZXMgdGhlIGlucHV0IHR5cGUgYWxyZWFkeSBzZXRcclxuICAgIGlmIChjdXJyZW50SW5wdXQgIT09IHZhbHVlKSB7XHJcbiAgICAgIHZhciBldmVudFRhcmdldCA9IHRhcmdldChldmVudCk7XHJcbiAgICAgIHZhciBldmVudFRhcmdldE5vZGUgPSBldmVudFRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICB2YXIgZXZlbnRUYXJnZXRUeXBlID0gKGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ2lucHV0JykgPyBldmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSA6IG51bGw7XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgKC8vIG9ubHkgaWYgdGhlIHVzZXIgZmxhZyB0byBhbGxvdyB0eXBpbmcgaW4gZm9ybSBmaWVsZHMgaXNuJ3Qgc2V0XHJcbiAgICAgICAgIWJvZHkuaGFzQXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dC1mb3JtdHlwaW5nJykgJiZcclxuXHJcbiAgICAgICAgLy8gb25seSBpZiBjdXJyZW50SW5wdXQgaGFzIGEgdmFsdWVcclxuICAgICAgICBjdXJyZW50SW5wdXQgJiZcclxuXHJcbiAgICAgICAgLy8gb25seSBpZiB0aGUgaW5wdXQgaXMgYGtleWJvYXJkYFxyXG4gICAgICAgIHZhbHVlID09PSAna2V5Ym9hcmQnICYmXHJcblxyXG4gICAgICAgIC8vIG5vdCBpZiB0aGUga2V5IGlzIGBUQUJgXHJcbiAgICAgICAga2V5TWFwW2V2ZW50S2V5XSAhPT0gJ3RhYicgJiZcclxuXHJcbiAgICAgICAgLy8gb25seSBpZiB0aGUgdGFyZ2V0IGlzIGEgZm9ybSBpbnB1dCB0aGF0IGFjY2VwdHMgdGV4dFxyXG4gICAgICAgIChcclxuICAgICAgICAgICBldmVudFRhcmdldE5vZGUgPT09ICd0ZXh0YXJlYScgfHxcclxuICAgICAgICAgICBldmVudFRhcmdldE5vZGUgPT09ICdzZWxlY3QnIHx8XHJcbiAgICAgICAgICAgKGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ2lucHV0JyAmJiBub25UeXBpbmdJbnB1dHMuaW5kZXhPZihldmVudFRhcmdldFR5cGUpIDwgMClcclxuICAgICAgICApKSB8fCAoXHJcbiAgICAgICAgICAvLyBpZ25vcmUgbW9kaWZpZXIga2V5c1xyXG4gICAgICAgICAgaWdub3JlTWFwLmluZGV4T2YoZXZlbnRLZXkpID4gLTFcclxuICAgICAgICApXHJcbiAgICAgICkge1xyXG4gICAgICAgIC8vIGlnbm9yZSBrZXlib2FyZCB0eXBpbmdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzd2l0Y2hJbnB1dCh2YWx1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodmFsdWUgPT09ICdrZXlib2FyZCcpIGxvZ0tleXMoZXZlbnRLZXkpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc3dpdGNoSW5wdXQoc3RyaW5nKSB7XHJcbiAgICBjdXJyZW50SW5wdXQgPSBzdHJpbmc7XHJcbiAgICBib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS13aGF0aW5wdXQnLCBjdXJyZW50SW5wdXQpO1xyXG5cclxuICAgIGlmIChpbnB1dFR5cGVzLmluZGV4T2YoY3VycmVudElucHV0KSA9PT0gLTEpIGlucHV0VHlwZXMucHVzaChjdXJyZW50SW5wdXQpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24ga2V5KGV2ZW50KSB7XHJcbiAgICByZXR1cm4gKGV2ZW50LmtleUNvZGUpID8gZXZlbnQua2V5Q29kZSA6IGV2ZW50LndoaWNoO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdGFyZ2V0KGV2ZW50KSB7XHJcbiAgICByZXR1cm4gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwb2ludGVyVHlwZShldmVudCkge1xyXG4gICAgaWYgKHR5cGVvZiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgcmV0dXJuIHBvaW50ZXJNYXBbZXZlbnQucG9pbnRlclR5cGVdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChldmVudC5wb2ludGVyVHlwZSA9PT0gJ3BlbicpID8gJ3RvdWNoJyA6IGV2ZW50LnBvaW50ZXJUeXBlOyAvLyB0cmVhdCBwZW4gbGlrZSB0b3VjaFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8ga2V5Ym9hcmQgbG9nZ2luZ1xyXG4gIGZ1bmN0aW9uIGxvZ0tleXMoZXZlbnRLZXkpIHtcclxuICAgIGlmIChhY3RpdmVLZXlzLmluZGV4T2Yoa2V5TWFwW2V2ZW50S2V5XSkgPT09IC0xICYmIGtleU1hcFtldmVudEtleV0pIGFjdGl2ZUtleXMucHVzaChrZXlNYXBbZXZlbnRLZXldKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVuTG9nS2V5cyhldmVudCkge1xyXG4gICAgdmFyIGV2ZW50S2V5ID0ga2V5KGV2ZW50KTtcclxuICAgIHZhciBhcnJheVBvcyA9IGFjdGl2ZUtleXMuaW5kZXhPZihrZXlNYXBbZXZlbnRLZXldKTtcclxuXHJcbiAgICBpZiAoYXJyYXlQb3MgIT09IC0xKSBhY3RpdmVLZXlzLnNwbGljZShhcnJheVBvcywgMSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBiaW5kRXZlbnRzKCkge1xyXG4gICAgYm9keSA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgLy8gcG9pbnRlciBldmVudHMgKG1vdXNlLCBwZW4sIHRvdWNoKVxyXG4gICAgaWYgKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGJ1ZmZlcmVkRXZlbnQpO1xyXG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgYnVmZmVyZWRFdmVudCk7XHJcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCkge1xyXG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBidWZmZXJlZEV2ZW50KTtcclxuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgYnVmZmVyZWRFdmVudCk7XHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgLy8gbW91c2UgZXZlbnRzXHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgYnVmZmVyZWRFdmVudCk7XHJcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgYnVmZmVyZWRFdmVudCk7XHJcblxyXG4gICAgICAvLyB0b3VjaCBldmVudHNcclxuICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykge1xyXG4gICAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGV2ZW50QnVmZmVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG1vdXNlIHdoZWVsXHJcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIobW91c2VXaGVlbCwgYnVmZmVyZWRFdmVudCk7XHJcblxyXG4gICAgLy8ga2V5Ym9hcmQgZXZlbnRzXHJcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB1bkJ1ZmZlcmVkRXZlbnQpO1xyXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHVuQnVmZmVyZWRFdmVudCk7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHVuTG9nS2V5cyk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLypcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgdXRpbGl0aWVzXHJcbiAgICAtLS0tLS0tLS0tLS0tLS1cclxuICAqL1xyXG5cclxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcclxuICAvLyB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3doZWVsXHJcbiAgZnVuY3Rpb24gZGV0ZWN0V2hlZWwoKSB7XHJcbiAgICByZXR1cm4gbW91c2VXaGVlbCA9ICdvbndoZWVsJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSA/XHJcbiAgICAgICd3aGVlbCcgOiAvLyBNb2Rlcm4gYnJvd3NlcnMgc3VwcG9ydCBcIndoZWVsXCJcclxuXHJcbiAgICAgIGRvY3VtZW50Lm9ubW91c2V3aGVlbCAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAnbW91c2V3aGVlbCcgOiAvLyBXZWJraXQgYW5kIElFIHN1cHBvcnQgYXQgbGVhc3QgXCJtb3VzZXdoZWVsXCJcclxuICAgICAgICAnRE9NTW91c2VTY3JvbGwnOyAvLyBsZXQncyBhc3N1bWUgdGhhdCByZW1haW5pbmcgYnJvd3NlcnMgYXJlIG9sZGVyIEZpcmVmb3hcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBpbml0XHJcblxyXG4gICAgZG9uJ3Qgc3RhcnQgc2NyaXB0IHVubGVzcyBicm93c2VyIGN1dHMgdGhlIG11c3RhcmQsXHJcbiAgICBhbHNvIHBhc3NlcyBpZiBwb2x5ZmlsbHMgYXJlIHVzZWRcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICovXHJcblxyXG4gIGlmIChcclxuICAgICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3cgJiZcclxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mXHJcbiAgKSB7XHJcblxyXG4gICAgLy8gaWYgdGhlIGRvbSBpcyBhbHJlYWR5IHJlYWR5IGFscmVhZHkgKHNjcmlwdCB3YXMgcGxhY2VkIGF0IGJvdHRvbSBvZiA8Ym9keT4pXHJcbiAgICBpZiAoZG9jdW1lbnQuYm9keSkge1xyXG4gICAgICBiaW5kRXZlbnRzKCk7XHJcblxyXG4gICAgLy8gb3RoZXJ3aXNlIHdhaXQgZm9yIHRoZSBkb20gdG8gbG9hZCAoc2NyaXB0IHdhcyBwbGFjZWQgaW4gdGhlIDxoZWFkPilcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBiaW5kRXZlbnRzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBhcGlcclxuICAgIC0tLS0tLS0tLS0tLS0tLVxyXG4gICovXHJcblxyXG4gIHJldHVybiB7XHJcblxyXG4gICAgLy8gcmV0dXJucyBzdHJpbmc6IHRoZSBjdXJyZW50IGlucHV0IHR5cGVcclxuICAgIGFzazogZnVuY3Rpb24oKSB7IHJldHVybiBjdXJyZW50SW5wdXQ7IH0sXHJcblxyXG4gICAgLy8gcmV0dXJucyBhcnJheTogY3VycmVudGx5IHByZXNzZWQga2V5c1xyXG4gICAga2V5czogZnVuY3Rpb24oKSB7IHJldHVybiBhY3RpdmVLZXlzOyB9LFxyXG5cclxuICAgIC8vIHJldHVybnMgYXJyYXk6IGFsbCB0aGUgZGV0ZWN0ZWQgaW5wdXQgdHlwZXNcclxuICAgIHR5cGVzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGlucHV0VHlwZXM7IH0sXHJcblxyXG4gICAgLy8gYWNjZXB0cyBzdHJpbmc6IG1hbnVhbGx5IHNldCB0aGUgaW5wdXQgdHlwZVxyXG4gICAgc2V0OiBzd2l0Y2hJbnB1dFxyXG4gIH07XHJcblxyXG59KCkpO1xyXG4iLCIhZnVuY3Rpb24oJCkge1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuMi4xJztcclxuXHJcbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxyXG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XHJcbnZhciBGb3VuZGF0aW9uID0ge1xyXG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcclxuXHJcbiAgLyoqXHJcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXHJcbiAgICovXHJcbiAgX3BsdWdpbnM6IHt9LFxyXG5cclxuICAvKipcclxuICAgKiBTdG9yZXMgZ2VuZXJhdGVkIHVuaXF1ZSBpZHMgZm9yIHBsdWdpbiBpbnN0YW5jZXNcclxuICAgKi9cclxuICBfdXVpZHM6IFtdLFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3IgUlRMIHN1cHBvcnRcclxuICAgKi9cclxuICBydGw6IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gJCgnaHRtbCcpLmF0dHIoJ2RpcicpID09PSAncnRsJztcclxuICB9LFxyXG4gIC8qKlxyXG4gICAqIERlZmluZXMgYSBGb3VuZGF0aW9uIHBsdWdpbiwgYWRkaW5nIGl0IHRvIHRoZSBgRm91bmRhdGlvbmAgbmFtZXNwYWNlIGFuZCB0aGUgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUgd2hlbiByZWZsb3dpbmcuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIFRoZSBjb25zdHJ1Y3RvciBvZiB0aGUgcGx1Z2luLlxyXG4gICAqL1xyXG4gIHBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKSB7XHJcbiAgICAvLyBPYmplY3Qga2V5IHRvIHVzZSB3aGVuIGFkZGluZyB0byBnbG9iYWwgRm91bmRhdGlvbiBvYmplY3RcclxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcclxuICAgIHZhciBjbGFzc05hbWUgPSAobmFtZSB8fCBmdW5jdGlvbk5hbWUocGx1Z2luKSk7XHJcbiAgICAvLyBPYmplY3Qga2V5IHRvIHVzZSB3aGVuIHN0b3JpbmcgdGhlIHBsdWdpbiwgYWxzbyB1c2VkIHRvIGNyZWF0ZSB0aGUgaWRlbnRpZnlpbmcgZGF0YSBhdHRyaWJ1dGUgZm9yIHRoZSBwbHVnaW5cclxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXHJcbiAgICB2YXIgYXR0ck5hbWUgID0gaHlwaGVuYXRlKGNsYXNzTmFtZSk7XHJcblxyXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcclxuICAgIHRoaXMuX3BsdWdpbnNbYXR0ck5hbWVdID0gdGhpc1tjbGFzc05hbWVdID0gcGx1Z2luO1xyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogUG9wdWxhdGVzIHRoZSBfdXVpZHMgYXJyYXkgd2l0aCBwb2ludGVycyB0byBlYWNoIGluZGl2aWR1YWwgcGx1Z2luIGluc3RhbmNlLlxyXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cclxuICAgKiBBbHNvIGZpcmVzIHRoZSBpbml0aWFsaXphdGlvbiBldmVudCBmb3IgZWFjaCBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZWRpdGl2ZSBjb2RlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxyXG4gICAqIEBmaXJlcyBQbHVnaW4jaW5pdFxyXG4gICAqL1xyXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xyXG4gICAgdmFyIHBsdWdpbk5hbWUgPSBuYW1lID8gaHlwaGVuYXRlKG5hbWUpIDogZnVuY3Rpb25OYW1lKHBsdWdpbi5jb25zdHJ1Y3RvcikudG9Mb3dlckNhc2UoKTtcclxuICAgIHBsdWdpbi51dWlkID0gdGhpcy5HZXRZb0RpZ2l0cyg2LCBwbHVnaW5OYW1lKTtcclxuXHJcbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApKXsgcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWAsIHBsdWdpbi51dWlkKTsgfVxyXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpKXsgcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJywgcGx1Z2luKTsgfVxyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxyXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNpbml0XHJcbiAgICAgICAgICAgKi9cclxuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKGBpbml0LnpmLiR7cGx1Z2luTmFtZX1gKTtcclxuXHJcbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcclxuXHJcbiAgICByZXR1cm47XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxyXG4gICAqIFJlbW92ZXMgdGhlIHpmUGx1Z2luIGRhdGEgYXR0cmlidXRlLCBhcyB3ZWxsIGFzIHRoZSBkYXRhLXBsdWdpbi1uYW1lIGF0dHJpYnV0ZS5cclxuICAgKiBBbHNvIGZpcmVzIHRoZSBkZXN0cm95ZWQgZXZlbnQgZm9yIHRoZSBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZWRpdGl2ZSBjb2RlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cclxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxyXG4gICAqL1xyXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XHJcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGh5cGhlbmF0ZShmdW5jdGlvbk5hbWUocGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykuY29uc3RydWN0b3IpKTtcclxuXHJcbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xyXG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApLnJlbW92ZURhdGEoJ3pmUGx1Z2luJylcclxuICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cclxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jZGVzdHJveWVkXHJcbiAgICAgICAgICAgKi9cclxuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xyXG4gICAgZm9yKHZhciBwcm9wIGluIHBsdWdpbil7XHJcbiAgICAgIHBsdWdpbltwcm9wXSA9IG51bGw7Ly9jbGVhbiB1cCBzY3JpcHQgdG8gcHJlcCBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uLlxyXG4gICAgfVxyXG4gICAgcmV0dXJuO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwbHVnaW5zIC0gb3B0aW9uYWwgc3RyaW5nIG9mIGFuIGluZGl2aWR1YWwgcGx1Z2luIGtleSwgYXR0YWluZWQgYnkgY2FsbGluZyBgJChlbGVtZW50KS5kYXRhKCdwbHVnaW5OYW1lJylgLCBvciBzdHJpbmcgb2YgYSBwbHVnaW4gY2xhc3MgaS5lLiBgJ2Ryb3Bkb3duJ2BcclxuICAgKiBAZGVmYXVsdCBJZiBubyBhcmd1bWVudCBpcyBwYXNzZWQsIHJlZmxvdyBhbGwgY3VycmVudGx5IGFjdGl2ZSBwbHVnaW5zLlxyXG4gICAqL1xyXG4gICByZUluaXQ6IGZ1bmN0aW9uKHBsdWdpbnMpe1xyXG4gICAgIHZhciBpc0pRID0gcGx1Z2lucyBpbnN0YW5jZW9mICQ7XHJcbiAgICAgdHJ5e1xyXG4gICAgICAgaWYoaXNKUSl7XHJcbiAgICAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xyXG4gICAgICAgICB9KTtcclxuICAgICAgIH1lbHNle1xyXG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxyXG4gICAgICAgICBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgIGZucyA9IHtcclxuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XHJcbiAgICAgICAgICAgICBwbGdzLmZvckVhY2goZnVuY3Rpb24ocCl7XHJcbiAgICAgICAgICAgICAgIHAgPSBoeXBoZW5hdGUocCk7XHJcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcclxuICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICBwbHVnaW5zID0gaHlwaGVuYXRlKHBsdWdpbnMpO1xyXG4gICAgICAgICAgICAgJCgnW2RhdGEtJysgcGx1Z2lucyArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgJ3VuZGVmaW5lZCc6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICB0aGlzWydvYmplY3QnXShPYmplY3Qua2V5cyhfdGhpcy5fcGx1Z2lucykpO1xyXG4gICAgICAgICAgIH1cclxuICAgICAgICAgfTtcclxuICAgICAgICAgZm5zW3R5cGVdKHBsdWdpbnMpO1xyXG4gICAgICAgfVxyXG4gICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgIH1maW5hbGx5e1xyXG4gICAgICAgcmV0dXJuIHBsdWdpbnM7XHJcbiAgICAgfVxyXG4gICB9LFxyXG5cclxuICAvKipcclxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge051bWJlcn0gbGVuZ3RoIC0gbnVtYmVyIG9mIHJhbmRvbSBiYXNlLTM2IGRpZ2l0cyBkZXNpcmVkLiBJbmNyZWFzZSBmb3IgbW9yZSByYW5kb20gc3RyaW5ncy5cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXHJcbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IC0gdW5pcXVlIGlkXHJcbiAgICovXHJcbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcclxuICAgIGxlbmd0aCA9IGxlbmd0aCB8fCA2O1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IHBsdWdpbnMgLSBBIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplLiBMZWF2ZSB0aGlzIG91dCB0byBpbml0aWFsaXplIGV2ZXJ5dGhpbmcuXHJcbiAgICovXHJcbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XHJcblxyXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXHJcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLl9wbHVnaW5zKTtcclxuICAgIH1cclxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBwbHVnaW5cclxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XHJcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cclxuICAgICAgdmFyIHBsdWdpbiA9IF90aGlzLl9wbHVnaW5zW25hbWVdO1xyXG5cclxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxyXG4gICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLmZpbmQoJ1tkYXRhLScrbmFtZSsnXScpLmFkZEJhY2soJ1tkYXRhLScrbmFtZSsnXScpO1xyXG5cclxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XHJcbiAgICAgICRlbGVtLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcclxuICAgICAgICAvLyBEb24ndCBkb3VibGUtZGlwIG9uIHBsdWdpbnNcclxuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGluaXRpYWxpemUgXCIrbmFtZStcIiBvbiBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBoYXMgYSBGb3VuZGF0aW9uIHBsdWdpbi5cIik7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZigkZWwuYXR0cignZGF0YS1vcHRpb25zJykpe1xyXG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcclxuICAgICAgICAgICAgdmFyIG9wdCA9IGUuc3BsaXQoJzonKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gZWwudHJpbSgpOyB9KTtcclxuICAgICAgICAgICAgaWYob3B0WzBdKSBvcHRzW29wdFswXV0gPSBwYXJzZVZhbHVlKG9wdFsxXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XHJcbiAgICAgICAgfWNhdGNoKGVyKXtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXIpO1xyXG4gICAgICAgIH1maW5hbGx5e1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxyXG4gIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uKCRlbGVtKXtcclxuICAgIHZhciB0cmFuc2l0aW9ucyA9IHtcclxuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXHJcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxyXG4gICAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcclxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xyXG4gICAgfTtcclxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXHJcbiAgICAgICAgZW5kO1xyXG5cclxuICAgIGZvciAodmFyIHQgaW4gdHJhbnNpdGlvbnMpe1xyXG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcclxuICAgICAgICBlbmQgPSB0cmFuc2l0aW9uc1t0XTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoZW5kKXtcclxuICAgICAgcmV0dXJuIGVuZDtcclxuICAgIH1lbHNle1xyXG4gICAgICBlbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgJGVsZW0udHJpZ2dlckhhbmRsZXIoJ3RyYW5zaXRpb25lbmQnLCBbJGVsZW1dKTtcclxuICAgICAgfSwgMSk7XHJcbiAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuRm91bmRhdGlvbi51dGlsID0ge1xyXG4gIC8qKlxyXG4gICAqIEZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGRlYm91bmNlIGVmZmVjdCB0byBhIGZ1bmN0aW9uIGNhbGwuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cclxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgLSBUaW1lIGluIG1zIHRvIGRlbGF5IHRoZSBjYWxsIG9mIGBmdW5jYC5cclxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHRocm90dGxlOiBmdW5jdGlvbiAoZnVuYywgZGVsYXkpIHtcclxuICAgIHZhciB0aW1lciA9IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xyXG5cclxuICAgICAgaWYgKHRpbWVyID09PSBudWxsKSB7XHJcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgICB0aW1lciA9IG51bGw7XHJcbiAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxyXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcclxuLyoqXHJcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxyXG4gKi9cclxudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXHJcbiAgICAgICRtZXRhID0gJCgnbWV0YS5mb3VuZGF0aW9uLW1xJyksXHJcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XHJcblxyXG4gIGlmKCEkbWV0YS5sZW5ndGgpe1xyXG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XHJcbiAgfVxyXG4gIGlmKCRub0pTLmxlbmd0aCl7XHJcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcclxuICB9XHJcblxyXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cclxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xyXG4gICAgRm91bmRhdGlvbi5yZWZsb3codGhpcyk7XHJcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxyXG4gICAgdmFyIHBsdWdDbGFzcyA9IHRoaXMuZGF0YSgnemZQbHVnaW4nKTsvL2RldGVybWluZSB0aGUgY2xhc3Mgb2YgcGx1Z2luXHJcblxyXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxyXG4gICAgICBpZih0aGlzLmxlbmd0aCA9PT0gMSl7Ly9pZiB0aGVyZSdzIG9ubHkgb25lLCBjYWxsIGl0IGRpcmVjdGx5LlxyXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGVsKXsvL290aGVyd2lzZSBsb29wIHRocm91Z2ggdGhlIGpRdWVyeSBjb2xsZWN0aW9uIGFuZCBpbnZva2UgdGhlIG1ldGhvZCBvbiBlYWNoXHJcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXHJcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcclxuICAgIH1cclxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFdlJ3JlIHNvcnJ5LCAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIHBhcmFtZXRlci4gWW91IG11c3QgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWV0aG9kIHlvdSB3aXNoIHRvIGludm9rZS5gKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XHJcbiQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XHJcblxyXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbihmdW5jdGlvbigpIHtcclxuICBpZiAoIURhdGUubm93IHx8ICF3aW5kb3cuRGF0ZS5ub3cpXHJcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XHJcblxyXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XHJcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XHJcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xyXG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xyXG4gIH1cclxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxyXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xyXG4gICAgdmFyIGxhc3RUaW1lID0gMDtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XHJcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcclxuICAgIH07XHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XHJcbiAgfVxyXG4gIC8qKlxyXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxyXG4gICAqL1xyXG4gIGlmKCF3aW5kb3cucGVyZm9ybWFuY2UgfHwgIXdpbmRvdy5wZXJmb3JtYW5jZS5ub3cpe1xyXG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xyXG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcclxuICAgICAgbm93OiBmdW5jdGlvbigpeyByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnQ7IH1cclxuICAgIH07XHJcbiAgfVxyXG59KSgpO1xyXG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxyXG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFBcmdzICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxyXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxyXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxyXG4gICAgICAgIGZCb3VuZCAgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXHJcbiAgICAgICAgICAgICAgICAgPyB0aGlzXHJcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcclxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XHJcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxyXG4gICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xyXG4gICAgfVxyXG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XHJcblxyXG4gICAgcmV0dXJuIGZCb3VuZDtcclxuICB9O1xyXG59XHJcbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxyXG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcclxuICBpZiAoRnVuY3Rpb24ucHJvdG90eXBlLm5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcclxuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcclxuICAgIHJldHVybiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDEpID8gcmVzdWx0c1sxXS50cmltKCkgOiBcIlwiO1xyXG4gIH1cclxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIGZuLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgcmV0dXJuIGZuLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gIH1cclxufVxyXG5mdW5jdGlvbiBwYXJzZVZhbHVlKHN0cil7XHJcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XHJcbiAgZWxzZSBpZigvZmFsc2UvLnRlc3Qoc3RyKSkgcmV0dXJuIGZhbHNlO1xyXG4gIGVsc2UgaWYoIWlzTmFOKHN0ciAqIDEpKSByZXR1cm4gcGFyc2VGbG9hdChzdHIpO1xyXG4gIHJldHVybiBzdHI7XHJcbn1cclxuLy8gQ29udmVydCBQYXNjYWxDYXNlIHRvIGtlYmFiLWNhc2VcclxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXHJcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcclxuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XHJcbn1cclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbkZvdW5kYXRpb24uQm94ID0ge1xyXG4gIEltTm90VG91Y2hpbmdZb3U6IEltTm90VG91Y2hpbmdZb3UsXHJcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcclxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb21wYXJlcyB0aGUgZGltZW5zaW9ucyBvZiBhbiBlbGVtZW50IHRvIGEgY29udGFpbmVyIGFuZCBkZXRlcm1pbmVzIGNvbGxpc2lvbiBldmVudHMgd2l0aCBjb250YWluZXIuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cclxuICogQHBhcmFtIHtqUXVlcnl9IHBhcmVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIGJvdW5kaW5nIGNvbnRhaW5lci5cclxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cclxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cclxuICogQGRlZmF1bHQgaWYgbm8gcGFyZW50IG9iamVjdCBwYXNzZWQsIGRldGVjdHMgY29sbGlzaW9ucyB3aXRoIGB3aW5kb3dgLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gSW1Ob3RUb3VjaGluZ1lvdShlbGVtZW50LCBwYXJlbnQsIGxyT25seSwgdGJPbmx5KSB7XHJcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxyXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XHJcblxyXG4gIGlmIChwYXJlbnQpIHtcclxuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xyXG5cclxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XHJcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XHJcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcclxuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcclxuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xyXG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0KTtcclxuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcclxuXHJcbiAgaWYgKGxyT25seSkge1xyXG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRiT25seSkge1xyXG4gICAgcmV0dXJuIHRvcCA9PT0gYm90dG9tID09PSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGFsbERpcnMuaW5kZXhPZihmYWxzZSkgPT09IC0xO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZXMgbmF0aXZlIG1ldGhvZHMgdG8gcmV0dXJuIGFuIG9iamVjdCBvZiBkaW1lbnNpb24gdmFsdWVzLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtqUXVlcnkgfHwgSFRNTH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3Qgb3IgRE9NIGVsZW1lbnQgZm9yIHdoaWNoIHRvIGdldCB0aGUgZGltZW5zaW9ucy4gQ2FuIGJlIGFueSBlbGVtZW50IG90aGVyIHRoYXQgZG9jdW1lbnQgb3Igd2luZG93LlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG5lc3RlZCBvYmplY3Qgb2YgaW50ZWdlciBwaXhlbCB2YWx1ZXNcclxuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBHZXREaW1lbnNpb25zKGVsZW0sIHRlc3Qpe1xyXG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xyXG5cclxuICBpZiAoZWxlbSA9PT0gd2luZG93IHx8IGVsZW0gPT09IGRvY3VtZW50KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcclxuICB9XHJcblxyXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgICAgcGFyUmVjdCA9IGVsZW0ucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgICAgd2luUmVjdCA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXHJcbiAgICAgIHdpblggPSB3aW5kb3cucGFnZVhPZmZzZXQ7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcclxuICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXHJcbiAgICBvZmZzZXQ6IHtcclxuICAgICAgdG9wOiByZWN0LnRvcCArIHdpblksXHJcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHdpblhcclxuICAgIH0sXHJcbiAgICBwYXJlbnREaW1zOiB7XHJcbiAgICAgIHdpZHRoOiBwYXJSZWN0LndpZHRoLFxyXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxyXG4gICAgICBvZmZzZXQ6IHtcclxuICAgICAgICB0b3A6IHBhclJlY3QudG9wICsgd2luWSxcclxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB3aW5kb3dEaW1zOiB7XHJcbiAgICAgIHdpZHRoOiB3aW5SZWN0LndpZHRoLFxyXG4gICAgICBoZWlnaHQ6IHdpblJlY3QuaGVpZ2h0LFxyXG4gICAgICBvZmZzZXQ6IHtcclxuICAgICAgICB0b3A6IHdpblksXHJcbiAgICAgICAgbGVmdDogd2luWFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcclxuICogc3VjaCBhczogVG9vbHRpcCwgUmV2ZWFsLCBhbmQgRHJvcGRvd25cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cclxuICogQHBhcmFtIHtqUXVlcnl9IGFuY2hvciAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50J3MgYW5jaG9yIHBvaW50LlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBhIHN0cmluZyByZWxhdGluZyB0byB0aGUgZGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCwgcmVsYXRpdmUgdG8gaXQncyBhbmNob3JcclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGhPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgaG9yaXpvbnRhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzT3ZlcmZsb3cgLSBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZCwgc2V0cyB0byB0cnVlIHRvIGRlZmF1bHQgdGhlIGVsZW1lbnQgdG8gZnVsbCB3aWR0aCAtIGFueSBkZXNpcmVkIG9mZnNldC5cclxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXHJcbiAqL1xyXG5mdW5jdGlvbiBHZXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIHtcclxuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxyXG4gICAgICAkYW5jaG9yRGltcyA9IGFuY2hvciA/IEdldERpbWVuc2lvbnMoYW5jaG9yKSA6IG51bGw7XHJcblxyXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcclxuICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdsZWZ0JzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxyXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncmlnaHQnOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxyXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnY2VudGVyIHRvcCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdjZW50ZXIgYm90dG9tJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnY2VudGVyIGxlZnQnOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXHJcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ2NlbnRlciByaWdodCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxyXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdjZW50ZXInOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcclxuICAgICAgICB0b3A6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyAoJGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3JldmVhbCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxyXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgdk9mZnNldFxyXG4gICAgICB9XHJcbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCxcclxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAncmlnaHQgYm90dG9tJzpcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCAtICRlbGVEaW1zLndpZHRoLFxyXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodFxyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXHJcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxyXG4gICAgICB9XHJcbiAgfVxyXG59XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXHJcbiAqIFRoaXMgdXRpbCB3YXMgY3JlYXRlZCBieSBNYXJpdXMgT2xiZXJ0eiAqXHJcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXHJcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuY29uc3Qga2V5Q29kZXMgPSB7XHJcbiAgOTogJ1RBQicsXHJcbiAgMTM6ICdFTlRFUicsXHJcbiAgMjc6ICdFU0NBUEUnLFxyXG4gIDMyOiAnU1BBQ0UnLFxyXG4gIDM3OiAnQVJST1dfTEVGVCcsXHJcbiAgMzg6ICdBUlJPV19VUCcsXHJcbiAgMzk6ICdBUlJPV19SSUdIVCcsXHJcbiAgNDA6ICdBUlJPV19ET1dOJ1xyXG59XHJcblxyXG52YXIgY29tbWFuZHMgPSB7fVxyXG5cclxudmFyIEtleWJvYXJkID0ge1xyXG4gIGtleXM6IGdldEtleUNvZGVzKGtleUNvZGVzKSxcclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2VzIHRoZSAoa2V5Ym9hcmQpIGV2ZW50IGFuZCByZXR1cm5zIGEgU3RyaW5nIHRoYXQgcmVwcmVzZW50cyBpdHMga2V5XHJcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXHJcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXHJcbiAgICogQHJldHVybiBTdHJpbmcga2V5IC0gU3RyaW5nIHRoYXQgcmVwcmVzZW50cyB0aGUga2V5IHByZXNzZWRcclxuICAgKi9cclxuICBwYXJzZUtleShldmVudCkge1xyXG4gICAgdmFyIGtleSA9IGtleUNvZGVzW2V2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQud2hpY2gpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xyXG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XHJcbiAgICBpZiAoZXZlbnQuYWx0S2V5KSBrZXkgPSBgQUxUXyR7a2V5fWA7XHJcbiAgICByZXR1cm4ga2V5O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcclxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcclxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXHJcbiAgICovXHJcbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xyXG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcclxuICAgICAga2V5Q29kZSA9IHRoaXMucGFyc2VLZXkoZXZlbnQpLFxyXG4gICAgICBjbWRzLFxyXG4gICAgICBjb21tYW5kLFxyXG4gICAgICBmbjtcclxuXHJcbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxyXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcclxuICAgIH0gZWxzZSB7IC8vIG1lcmdlIGx0ciBhbmQgcnRsOiBpZiBkb2N1bWVudCBpcyBydGwsIHJ0bCBvdmVyd3JpdGVzIGx0ciBhbmQgdmljZSB2ZXJzYVxyXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcclxuXHJcbiAgICAgICAgZWxzZSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0LnJ0bCwgY29tbWFuZExpc3QubHRyKTtcclxuICAgIH1cclxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xyXG5cclxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xyXG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcclxuICAgICAgZm4uYXBwbHkoKTtcclxuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcclxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkLmFwcGx5KCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcclxuICAgICAgICAgIGZ1bmN0aW9ucy51bmhhbmRsZWQuYXBwbHkoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmRzIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIHRoZSBnaXZlbiBgJGVsZW1lbnRgXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBzZWFyY2ggd2l0aGluXHJcbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxyXG4gICAqL1xyXG4gIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcclxuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoISQodGhpcykuaXMoJzp2aXNpYmxlJykgfHwgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcpIDwgMCkgeyByZXR1cm4gZmFsc2U7IH0gLy9vbmx5IGhhdmUgdmlzaWJsZSBlbGVtZW50cyBhbmQgdGhvc2UgdGhhdCBoYXZlIGEgdGFiaW5kZXggZ3JlYXRlciBvciBlcXVhbCAwXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IG5hbWUgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXHJcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxyXG4gICAqL1xyXG5cclxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XHJcbiAgICBjb21tYW5kc1tjb21wb25lbnROYW1lXSA9IGNtZHM7XHJcbiAgfVxyXG59XHJcblxyXG4vKlxyXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXHJcbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XHJcbiAgdmFyIGsgPSB7fTtcclxuICBmb3IgKHZhciBrYyBpbiBrY3MpIGtba2NzW2tjXV0gPSBrY3Nba2NdO1xyXG4gIHJldHVybiBrO1xyXG59XHJcblxyXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXHJcbmNvbnN0IGRlZmF1bHRRdWVyaWVzID0ge1xyXG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXHJcbiAgbGFuZHNjYXBlIDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxyXG4gIHBvcnRyYWl0IDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXHJcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcclxuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXHJcbiAgICAnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xyXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXHJcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcclxuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXHJcbn07XHJcblxyXG52YXIgTWVkaWFRdWVyeSA9IHtcclxuICBxdWVyaWVzOiBbXSxcclxuXHJcbiAgY3VycmVudDogJycsXHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBtZWRpYSBxdWVyeSBoZWxwZXIsIGJ5IGV4dHJhY3RpbmcgdGhlIGJyZWFrcG9pbnQgbGlzdCBmcm9tIHRoZSBDU1MgYW5kIGFjdGl2YXRpbmcgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGV4dHJhY3RlZFN0eWxlcyA9ICQoJy5mb3VuZGF0aW9uLW1xJykuY3NzKCdmb250LWZhbWlseScpO1xyXG4gICAgdmFyIG5hbWVkUXVlcmllcztcclxuXHJcbiAgICBuYW1lZFF1ZXJpZXMgPSBwYXJzZVN0eWxlVG9PYmplY3QoZXh0cmFjdGVkU3R5bGVzKTtcclxuXHJcbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZWRRdWVyaWVzKSB7XHJcbiAgICAgIHNlbGYucXVlcmllcy5wdXNoKHtcclxuICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgdmFsdWU6IGBvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogJHtuYW1lZFF1ZXJpZXNba2V5XX0pYFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xyXG5cclxuICAgIHRoaXMuX3dhdGNoZXIoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgaWYgdGhlIHNjcmVlbiBpcyBhdCBsZWFzdCBhcyB3aWRlIGFzIGEgYnJlYWtwb2ludC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2suXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0J3Mgc21hbGxlci5cclxuICAgKi9cclxuICBhdExlYXN0KHNpemUpIHtcclxuICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0KHNpemUpO1xyXG5cclxuICAgIGlmIChxdWVyeSkge1xyXG4gICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxyXG4gICAqL1xyXG4gIGdldChzaXplKSB7XHJcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xyXG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XHJcbiAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxyXG4gICAqL1xyXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcclxuICAgIHZhciBtYXRjaGVkO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcclxuXHJcbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xyXG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbWF0Y2hlZCA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgcmV0dXJuIG1hdGNoZWQubmFtZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBtYXRjaGVkO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfd2F0Y2hlcigpIHtcclxuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XHJcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcclxuXHJcbiAgICAgIGlmIChuZXdTaXplICE9PSB0aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIFtuZXdTaXplLCB0aGlzLmN1cnJlbnRdKTtcclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3U2l6ZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcclxuXHJcbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cclxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2Vcclxud2luZG93Lm1hdGNoTWVkaWEgfHwgKHdpbmRvdy5tYXRjaE1lZGlhID0gZnVuY3Rpb24oKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyBGb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IG1hdGNoTWVkaXVtIGFwaSBzdWNoIGFzIElFIDkgYW5kIHdlYmtpdFxyXG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XHJcblxyXG4gIC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cclxuICBpZiAoIXN0eWxlTWVkaWEpIHtcclxuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcclxuICAgIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdLFxyXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xyXG5cclxuICAgIHN0eWxlLnR5cGUgID0gJ3RleHQvY3NzJztcclxuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcclxuXHJcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7XHJcblxyXG4gICAgLy8gJ3N0eWxlLmN1cnJlbnRTdHlsZScgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnd2luZG93LmdldENvbXB1dGVkU3R5bGUnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcclxuICAgIGluZm8gPSAoJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdykgJiYgd2luZG93LmdldENvbXB1dGVkU3R5bGUoc3R5bGUsIG51bGwpIHx8IHN0eWxlLmN1cnJlbnRTdHlsZTtcclxuXHJcbiAgICBzdHlsZU1lZGlhID0ge1xyXG4gICAgICBtYXRjaE1lZGl1bShtZWRpYSkge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcclxuXHJcbiAgICAgICAgLy8gJ3N0eWxlLnN0eWxlU2hlZXQnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3N0eWxlLnRleHRDb250ZW50JyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXHJcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcclxuICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHRleHQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxyXG4gICAgICAgIHJldHVybiBpbmZvLndpZHRoID09PSAnMXB4JztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcclxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXHJcbiAgICB9O1xyXG4gIH1cclxufSgpKTtcclxuXHJcbi8vIFRoYW5rIHlvdTogaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9xdWVyeS1zdHJpbmdcclxuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xyXG4gIHZhciBzdHlsZU9iamVjdCA9IHt9O1xyXG5cclxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcclxuICAgIHJldHVybiBzdHlsZU9iamVjdDtcclxuICB9XHJcblxyXG4gIHN0ciA9IHN0ci50cmltKCkuc2xpY2UoMSwgLTEpOyAvLyBicm93c2VycyByZS1xdW90ZSBzdHJpbmcgc3R5bGUgdmFsdWVzXHJcblxyXG4gIGlmICghc3RyKSB7XHJcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XHJcbiAgfVxyXG5cclxuICBzdHlsZU9iamVjdCA9IHN0ci5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbihyZXQsIHBhcmFtKSB7XHJcbiAgICB2YXIgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpO1xyXG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xyXG4gICAgdmFyIHZhbCA9IHBhcnRzWzFdO1xyXG4gICAga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleSk7XHJcblxyXG4gICAgLy8gbWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcclxuICAgIC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcclxuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xyXG5cclxuICAgIGlmICghcmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgcmV0W2tleV0gPSB2YWw7XHJcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmV0W2tleV0pKSB7XHJcbiAgICAgIHJldFtrZXldLnB1c2godmFsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldFtrZXldID0gW3JldFtrZXldLCB2YWxdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJldDtcclxuICB9LCB7fSk7XHJcblxyXG4gIHJldHVybiBzdHlsZU9iamVjdDtcclxufVxyXG5cclxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBNb3Rpb24gbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXHJcbiAqL1xyXG5cclxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xyXG5jb25zdCBhY3RpdmVDbGFzc2VzID0gWydtdWktZW50ZXItYWN0aXZlJywgJ211aS1sZWF2ZS1hY3RpdmUnXTtcclxuXHJcbmNvbnN0IE1vdGlvbiA9IHtcclxuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcclxuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XHJcbiAgfSxcclxuXHJcbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xyXG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBNb3ZlKGR1cmF0aW9uLCBlbGVtLCBmbil7XHJcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcclxuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xyXG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XHJcbiAgICBwcm9nID0gdHMgLSBzdGFydDtcclxuICAgIGZuLmFwcGx5KGVsZW0pO1xyXG5cclxuICAgIGlmKHByb2cgPCBkdXJhdGlvbil7IGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUsIGVsZW0pOyB9XHJcbiAgICBlbHNle1xyXG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XHJcbiAgICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gYW5pbWF0aW9uIC0gQ1NTIGNsYXNzIHRvIHVzZS5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXHJcbiAqL1xyXG5mdW5jdGlvbiBhbmltYXRlKGlzSW4sIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcclxuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcclxuXHJcbiAgaWYgKCFlbGVtZW50Lmxlbmd0aCkgcmV0dXJuO1xyXG5cclxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XHJcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xyXG5cclxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxyXG4gIHJlc2V0KCk7XHJcblxyXG4gIGVsZW1lbnRcclxuICAgIC5hZGRDbGFzcyhhbmltYXRpb24pXHJcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcclxuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcclxuICB9KTtcclxuXHJcbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xyXG4gICAgZWxlbWVudFxyXG4gICAgICAuY3NzKCd0cmFuc2l0aW9uJywgJycpXHJcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xyXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTtcclxuXHJcbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xyXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcclxuICAgIGlmICghaXNJbikgZWxlbWVudC5oaWRlKCk7XHJcbiAgICByZXNldCgpO1xyXG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcclxuICB9XHJcblxyXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xyXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xyXG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhgJHtpbml0Q2xhc3N9ICR7YWN0aXZlQ2xhc3N9ICR7YW5pbWF0aW9ufWApO1xyXG4gIH1cclxufVxyXG5cclxuRm91bmRhdGlvbi5Nb3ZlID0gTW92ZTtcclxuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG5jb25zdCBOZXN0ID0ge1xyXG4gIEZlYXRoZXIobWVudSwgdHlwZSA9ICd6ZicpIHtcclxuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XHJcblxyXG4gICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLmF0dHIoeydyb2xlJzogJ21lbnVpdGVtJ30pLFxyXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxyXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXHJcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XHJcblxyXG4gICAgbWVudS5maW5kKCdhOmZpcnN0JykuYXR0cigndGFiaW5kZXgnLCAwKTtcclxuXHJcbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xyXG5cclxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XHJcbiAgICAgICAgJGl0ZW1cclxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcclxuICAgICAgICAgIC5hdHRyKHtcclxuICAgICAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxyXG4gICAgICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxyXG4gICAgICAgICAgICAnYXJpYS1sYWJlbCc6ICRpdGVtLmNoaWxkcmVuKCdhOmZpcnN0JykudGV4dCgpXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJHN1YlxyXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXHJcbiAgICAgICAgICAuYXR0cih7XHJcbiAgICAgICAgICAgICdkYXRhLXN1Ym1lbnUnOiAnJyxcclxuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcclxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xyXG4gICAgICAgICRpdGVtLmFkZENsYXNzKGBpcy1zdWJtZW51LWl0ZW0gJHtzdWJJdGVtQ2xhc3N9YCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybjtcclxuICB9LFxyXG5cclxuICBCdXJuKG1lbnUsIHR5cGUpIHtcclxuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpLFxyXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxyXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXHJcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XHJcblxyXG4gICAgbWVudVxyXG4gICAgICAuZmluZCgnKicpXHJcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHtzdWJNZW51Q2xhc3N9ICR7c3ViSXRlbUNsYXNzfSAke2hhc1N1YkNsYXNzfSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudSBpcy1hY3RpdmVgKVxyXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKCAgICAgIG1lbnUuZmluZCgnLicgKyBzdWJNZW51Q2xhc3MgKyAnLCAuJyArIHN1Ykl0ZW1DbGFzcyArICcsIC5oYXMtc3VibWVudSwgLmlzLXN1Ym1lbnUtaXRlbSwgLnN1Ym1lbnUsIFtkYXRhLXN1Ym1lbnVdJylcclxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXHJcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcclxuICAgIC8vIGl0ZW1zLmVhY2goZnVuY3Rpb24oKXtcclxuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcclxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcclxuICAgIC8vICAgaWYoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCl7XHJcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gICBpZigkc3ViLmxlbmd0aCl7XHJcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XHJcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfSk7XHJcbiAgfVxyXG59XHJcblxyXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuZnVuY3Rpb24gVGltZXIoZWxlbSwgb3B0aW9ucywgY2IpIHtcclxuICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cclxuICAgICAgbmFtZVNwYWNlID0gT2JqZWN0LmtleXMoZWxlbS5kYXRhKCkpWzBdIHx8ICd0aW1lcicsXHJcbiAgICAgIHJlbWFpbiA9IC0xLFxyXG4gICAgICBzdGFydCxcclxuICAgICAgdGltZXI7XHJcblxyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZW1haW4gPSAtMTtcclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgfVxyXG5cclxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcbiAgICAvLyBpZighZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xyXG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCBmYWxzZSk7XHJcbiAgICBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgaWYob3B0aW9ucy5pbmZpbml0ZSl7XHJcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxyXG4gICAgICB9XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9LCByZW1haW4pO1xyXG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnN0YXJ0LnpmLiR7bmFtZVNwYWNlfWApO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXHJcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcclxuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xyXG4gICAgcmVtYWluID0gcmVtYWluIC0gKGVuZCAtIHN0YXJ0KTtcclxuICAgIGVsZW0udHJpZ2dlcihgdGltZXJwYXVzZWQuemYuJHtuYW1lU3BhY2V9YCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogUnVucyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gaW1hZ2VzIGFyZSBmdWxseSBsb2FkZWQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbWFnZXMgLSBJbWFnZShzKSB0byBjaGVjayBpZiBsb2FkZWQuXHJcbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxyXG4gKi9cclxuZnVuY3Rpb24gb25JbWFnZXNMb2FkZWQoaW1hZ2VzLCBjYWxsYmFjayl7XHJcbiAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICB1bmxvYWRlZCA9IGltYWdlcy5sZW5ndGg7XHJcblxyXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xyXG4gICAgY2FsbGJhY2soKTtcclxuICB9XHJcblxyXG4gIGltYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMuY29tcGxldGUpIHtcclxuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLm5hdHVyYWxXaWR0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5uYXR1cmFsV2lkdGggPiAwKSB7XHJcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XHJcbiAgICB1bmxvYWRlZC0tO1xyXG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XHJcbiAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5Gb3VuZGF0aW9uLlRpbWVyID0gVGltZXI7XHJcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4vLyoqV29yayBpbnNwaXJlZCBieSBtdWx0aXBsZSBqcXVlcnkgc3dpcGUgcGx1Z2lucyoqXHJcbi8vKipEb25lIGJ5IFlvaGFpIEFyYXJhdCAqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4oZnVuY3Rpb24oJCkge1xyXG5cclxuICAkLnNwb3RTd2lwZSA9IHtcclxuICAgIHZlcnNpb246ICcxLjAuMCcsXHJcbiAgICBlbmFibGVkOiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXHJcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXHJcbiAgICBtb3ZlVGhyZXNob2xkOiA3NSxcclxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxyXG4gIH07XHJcblxyXG4gIHZhciAgIHN0YXJ0UG9zWCxcclxuICAgICAgICBzdGFydFBvc1ksXHJcbiAgICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICAgIGVsYXBzZWRUaW1lLFxyXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XHJcbiAgICAvLyAgYWxlcnQodGhpcyk7XHJcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcclxuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcclxuICAgIGlzTW92aW5nID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XHJcbiAgICBpZiAoJC5zcG90U3dpcGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XHJcbiAgICBpZihpc01vdmluZykge1xyXG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgdmFyIHkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XHJcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XHJcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XHJcbiAgICAgIHZhciBkaXI7XHJcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XHJcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcclxuICAgICAgICBkaXIgPSBkeCA+IDAgPyAnbGVmdCcgOiAncmlnaHQnO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xyXG4gICAgICAvLyAgIGRpciA9IGR5ID4gMCA/ICdkb3duJyA6ICd1cCc7XHJcbiAgICAgIC8vIH1cclxuICAgICAgaWYoZGlyKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIG9uVG91Y2hFbmQuY2FsbCh0aGlzKTtcclxuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZSkge1xyXG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICBzdGFydFBvc1ggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XHJcbiAgICAgIHN0YXJ0UG9zWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcclxuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xyXG4gICAgICBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xyXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciAmJiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xyXG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcclxuICB9XHJcblxyXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcclxuXHJcbiAgJC5lYWNoKFsnbGVmdCcsICd1cCcsICdkb3duJywgJ3JpZ2h0J10sIGZ1bmN0aW9uICgpIHtcclxuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xyXG4gICAgICAkKHRoaXMpLm9uKCdzd2lwZScsICQubm9vcCk7XHJcbiAgICB9IH07XHJcbiAgfSk7XHJcbn0pKGpRdWVyeSk7XHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXHJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiFmdW5jdGlvbigkKXtcclxuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLGVsKXtcclxuICAgICAgJChlbCkuYmluZCgndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnLGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XHJcbiAgICAgICAgLy9vYmplY3QgaXMgbm9ybWFsaXplZCB0byB3M2Mgc3BlY3MgYW5kIGRvZXMgbm90IHByb3ZpZGUgdGhlIFRvdWNoTGlzdFxyXG4gICAgICAgIGhhbmRsZVRvdWNoKGV2ZW50KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgIHZhciB0b3VjaGVzID0gZXZlbnQuY2hhbmdlZFRvdWNoZXMsXHJcbiAgICAgICAgICBmaXJzdCA9IHRvdWNoZXNbMF0sXHJcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xyXG4gICAgICAgICAgICB0b3VjaHN0YXJ0OiAnbW91c2Vkb3duJyxcclxuICAgICAgICAgICAgdG91Y2htb3ZlOiAnbW91c2Vtb3ZlJyxcclxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHR5cGUgPSBldmVudFR5cGVzW2V2ZW50LnR5cGVdLFxyXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcclxuICAgICAgICA7XHJcblxyXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHNpbXVsYXRlZEV2ZW50ID0gd2luZG93Lk1vdXNlRXZlbnQodHlwZSwge1xyXG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxyXG4gICAgICAgICAgJ2NhbmNlbGFibGUnOiB0cnVlLFxyXG4gICAgICAgICAgJ3NjcmVlblgnOiBmaXJzdC5zY3JlZW5YLFxyXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxyXG4gICAgICAgICAgJ2NsaWVudFgnOiBmaXJzdC5jbGllbnRYLFxyXG4gICAgICAgICAgJ2NsaWVudFknOiBmaXJzdC5jbGllbnRZXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xyXG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XHJcbiAgICAgIH1cclxuICAgICAgZmlyc3QudGFyZ2V0LmRpc3BhdGNoRXZlbnQoc2ltdWxhdGVkRXZlbnQpO1xyXG4gICAgfTtcclxuICB9O1xyXG59KGpRdWVyeSk7XHJcblxyXG5cclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxyXG4vLyoqbmVlZCB0byByZWNyZWF0ZSBmdW5jdGlvbmFsaXR5KipcclxuLy8qKmFuZCB0cnkgdG8gaW1wcm92ZSBpZiBwb3NzaWJsZSoqXHJcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuLyogUmVtb3ZpbmcgdGhlIGpRdWVyeSBmdW5jdGlvbiAqKioqXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuKGZ1bmN0aW9uKCAkLCB3aW5kb3csIHVuZGVmaW5lZCApIHtcclxuXHJcblx0dmFyICRkb2N1bWVudCA9ICQoIGRvY3VtZW50ICksXHJcblx0XHQvLyBzdXBwb3J0VG91Y2ggPSAkLm1vYmlsZS5zdXBwb3J0LnRvdWNoLFxyXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXHJcblx0XHR0b3VjaFN0b3BFdmVudCA9ICd0b3VjaGVuZCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hlbmRcIiA6IFwibW91c2V1cFwiLFxyXG5cdFx0dG91Y2hNb3ZlRXZlbnQgPSAndG91Y2htb3ZlJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaG1vdmVcIiA6IFwibW91c2Vtb3ZlXCI7XHJcblxyXG5cdC8vIHNldHVwIG5ldyBldmVudCBzaG9ydGN1dHNcclxuXHQkLmVhY2goICggXCJ0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCBcIiArXHJcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XHJcblxyXG5cdFx0JC5mblsgbmFtZSBdID0gZnVuY3Rpb24oIGZuICkge1xyXG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcclxuXHRcdH07XHJcblxyXG5cdFx0Ly8galF1ZXJ5IDwgMS44XHJcblx0XHRpZiAoICQuYXR0ckZuICkge1xyXG5cdFx0XHQkLmF0dHJGblsgbmFtZSBdID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcclxuXHRcdHZhciBvcmlnaW5hbFR5cGUgPSBldmVudC50eXBlO1xyXG5cdFx0ZXZlbnQudHlwZSA9IGV2ZW50VHlwZTtcclxuXHRcdGlmICggYnViYmxlICkge1xyXG5cdFx0XHQkLmV2ZW50LnRyaWdnZXIoIGV2ZW50LCB1bmRlZmluZWQsIG9iaiApO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XHJcblx0XHR9XHJcblx0XHRldmVudC50eXBlID0gb3JpZ2luYWxUeXBlO1xyXG5cdH1cclxuXHJcblx0Ly8gYWxzbyBoYW5kbGVzIHRhcGhvbGRcclxuXHJcblx0Ly8gQWxzbyBoYW5kbGVzIHN3aXBlbGVmdCwgc3dpcGVyaWdodFxyXG5cdCQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHtcclxuXHJcblx0XHQvLyBNb3JlIHRoYW4gdGhpcyBob3Jpem9udGFsIGRpc3BsYWNlbWVudCwgYW5kIHdlIHdpbGwgc3VwcHJlc3Mgc2Nyb2xsaW5nLlxyXG5cdFx0c2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZDogMzAsXHJcblxyXG5cdFx0Ly8gTW9yZSB0aW1lIHRoYW4gdGhpcywgYW5kIGl0IGlzbid0IGEgc3dpcGUuXHJcblx0XHRkdXJhdGlvblRocmVzaG9sZDogMTAwMCxcclxuXHJcblx0XHQvLyBTd2lwZSBob3Jpem9udGFsIGRpc3BsYWNlbWVudCBtdXN0IGJlIG1vcmUgdGhhbiB0aGlzLlxyXG5cdFx0aG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcclxuXHJcblx0XHQvLyBTd2lwZSB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBsZXNzIHRoYW4gdGhpcy5cclxuXHRcdHZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxyXG5cclxuXHRcdGdldExvY2F0aW9uOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG5cdFx0XHR2YXIgd2luUGFnZVggPSB3aW5kb3cucGFnZVhPZmZzZXQsXHJcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXHJcblx0XHRcdFx0eCA9IGV2ZW50LmNsaWVudFgsXHJcblx0XHRcdFx0eSA9IGV2ZW50LmNsaWVudFk7XHJcblxyXG5cdFx0XHRpZiAoIGV2ZW50LnBhZ2VZID09PSAwICYmIE1hdGguZmxvb3IoIHkgKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VZICkgfHxcclxuXHRcdFx0XHRldmVudC5wYWdlWCA9PT0gMCAmJiBNYXRoLmZsb29yKCB4ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWCApICkge1xyXG5cclxuXHRcdFx0XHQvLyBpT1M0IGNsaWVudFgvY2xpZW50WSBoYXZlIHRoZSB2YWx1ZSB0aGF0IHNob3VsZCBoYXZlIGJlZW5cclxuXHRcdFx0XHQvLyBpbiBwYWdlWC9wYWdlWS4gV2hpbGUgcGFnZVgvcGFnZS8gaGF2ZSB0aGUgdmFsdWUgMFxyXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XHJcblx0XHRcdFx0eSA9IHkgLSB3aW5QYWdlWTtcclxuXHRcdFx0fSBlbHNlIGlmICggeSA8ICggZXZlbnQucGFnZVkgLSB3aW5QYWdlWSkgfHwgeCA8ICggZXZlbnQucGFnZVggLSB3aW5QYWdlWCApICkge1xyXG5cclxuXHRcdFx0XHQvLyBTb21lIEFuZHJvaWQgYnJvd3NlcnMgaGF2ZSB0b3RhbGx5IGJvZ3VzIHZhbHVlcyBmb3IgY2xpZW50WC9ZXHJcblx0XHRcdFx0Ly8gd2hlbiBzY3JvbGxpbmcvem9vbWluZyBhIHBhZ2UuIERldGVjdGFibGUgc2luY2UgY2xpZW50WC9jbGllbnRZXHJcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxyXG5cdFx0XHRcdHggPSBldmVudC5wYWdlWCAtIHdpblBhZ2VYO1xyXG5cdFx0XHRcdHkgPSBldmVudC5wYWdlWSAtIHdpblBhZ2VZO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdHg6IHgsXHJcblx0XHRcdFx0eTogeVxyXG5cdFx0XHR9O1xyXG5cdFx0fSxcclxuXHJcblx0XHRzdGFydDogZnVuY3Rpb24oIGV2ZW50ICkge1xyXG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XHJcblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxyXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcclxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXSxcclxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdH0sXHJcblxyXG5cdFx0c3RvcDogZnVuY3Rpb24oIGV2ZW50ICkge1xyXG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XHJcblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxyXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcclxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdH0sXHJcblxyXG5cdFx0aGFuZGxlU3dpcGU6IGZ1bmN0aW9uKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApIHtcclxuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXHJcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZCAmJlxyXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDEgXSAtIHN0b3AuY29vcmRzWyAxIF0gKSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS52ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkICkge1xyXG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xyXG5cclxuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIFwic3dpcGVcIiwgJC5FdmVudCggXCJzd2lwZVwiLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9KSwgdHJ1ZSApO1xyXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8gVGhpcyBzZXJ2ZXMgYXMgYSBmbGFnIHRvIGVuc3VyZSB0aGF0IGF0IG1vc3Qgb25lIHN3aXBlIGV2ZW50IGV2ZW50IGlzXHJcblx0XHQvLyBpbiB3b3JrIGF0IGFueSBnaXZlbiB0aW1lXHJcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxyXG5cclxuXHRcdHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGV2ZW50cyxcclxuXHRcdFx0XHR0aGlzT2JqZWN0ID0gdGhpcyxcclxuXHRcdFx0XHQkdGhpcyA9ICQoIHRoaXNPYmplY3QgKSxcclxuXHRcdFx0XHRjb250ZXh0ID0ge307XHJcblxyXG5cdFx0XHQvLyBSZXRyaWV2ZSB0aGUgZXZlbnRzIGRhdGEgZm9yIHRoaXMgZWxlbWVudCBhbmQgYWRkIHRoZSBzd2lwZSBjb250ZXh0XHJcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcclxuXHRcdFx0aWYgKCAhZXZlbnRzICkge1xyXG5cdFx0XHRcdGV2ZW50cyA9IHsgbGVuZ3RoOiAwIH07XHJcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZXZlbnRzLmxlbmd0aCsrO1xyXG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xyXG5cclxuXHRcdFx0Y29udGV4dC5zdGFydCA9IGZ1bmN0aW9uKCBldmVudCApIHtcclxuXHJcblx0XHRcdFx0Ly8gQmFpbCBpZiB3ZSdyZSBhbHJlYWR5IHdvcmtpbmcgb24gYSBzd2lwZSBldmVudFxyXG5cdFx0XHRcdGlmICggJC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyApIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IHRydWU7XHJcblxyXG5cdFx0XHRcdHZhciBzdG9wLFxyXG5cdFx0XHRcdFx0c3RhcnQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RhcnQoIGV2ZW50ICksXHJcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxyXG5cdFx0XHRcdFx0ZW1pdHRlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdFx0XHRpZiAoICFzdGFydCB8fCBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSApIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHN0b3AgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RvcCggZXZlbnQgKTtcclxuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XHJcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaGFuZGxlU3dpcGUoIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICk7XHJcblx0XHRcdFx0XHRcdGlmICggZW1pdHRlZCApIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XHJcblx0XHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyBwcmV2ZW50IHNjcm9sbGluZ1xyXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcclxuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHRjb250ZXh0LnN0b3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XHJcblxyXG5cdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcclxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XHJcblx0XHRcdFx0XHRcdGNvbnRleHQubW92ZSA9IG51bGw7XHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0JGRvY3VtZW50Lm9uKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlIClcclxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcclxuXHRcdFx0fTtcclxuXHRcdFx0JHRoaXMub24oIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xyXG5cdFx0fSxcclxuXHJcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XHJcblxyXG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XHJcblx0XHRcdGlmICggZXZlbnRzICkge1xyXG5cdFx0XHRcdGNvbnRleHQgPSBldmVudHMuc3dpcGU7XHJcblx0XHRcdFx0ZGVsZXRlIGV2ZW50cy5zd2lwZTtcclxuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XHJcblx0XHRcdFx0aWYgKCBldmVudHMubGVuZ3RoID09PSAwICkge1xyXG5cdFx0XHRcdFx0JC5yZW1vdmVEYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xyXG5cdFx0XHRcdGlmICggY29udGV4dC5zdGFydCApIHtcclxuXHRcdFx0XHRcdCQoIHRoaXMgKS5vZmYoIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGNvbnRleHQubW92ZSApIHtcclxuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0b3AgKSB7XHJcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHQkLmVhY2goe1xyXG5cdFx0c3dpcGVsZWZ0OiBcInN3aXBlLmxlZnRcIixcclxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxyXG5cdH0sIGZ1bmN0aW9uKCBldmVudCwgc291cmNlRXZlbnQgKSB7XHJcblxyXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xyXG5cdFx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCggdGhpcyApLmJpbmQoIHNvdXJjZUV2ZW50LCAkLm5vb3AgKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQoIHRoaXMgKS51bmJpbmQoIHNvdXJjZUV2ZW50ICk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblx0fSk7XHJcbn0pKCBqUXVlcnksIHRoaXMgKTtcclxuKi9cclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xyXG4gIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3dbYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmBdO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn0oKSk7XHJcblxyXG5jb25zdCB0cmlnZ2VycyA9IChlbCwgdHlwZSkgPT4ge1xyXG4gIGVsLmRhdGEodHlwZSkuc3BsaXQoJyAnKS5mb3JFYWNoKGlkID0+IHtcclxuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xyXG4gIH0pO1xyXG59O1xyXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxyXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1vcGVuXScsIGZ1bmN0aW9uKCkge1xyXG4gIHRyaWdnZXJzKCQodGhpcyksICdvcGVuJyk7XHJcbn0pO1xyXG5cclxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zZV0gd2lsbCBjbG9zZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cclxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cclxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VdJywgZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCdjbG9zZScpO1xyXG4gIGlmIChpZCkge1xyXG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ2Nsb3NlJyk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZS56Zi50cmlnZ2VyJyk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtdG9nZ2xlXSB3aWxsIHRvZ2dsZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cclxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xyXG4gIHRyaWdnZXJzKCQodGhpcyksICd0b2dnbGUnKTtcclxufSk7XHJcblxyXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NhYmxlXSB3aWxsIHJlc3BvbmQgdG8gY2xvc2UuemYudHJpZ2dlciBldmVudHMuXHJcbiQoZG9jdW1lbnQpLm9uKCdjbG9zZS56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NhYmxlXScsIGZ1bmN0aW9uKGUpe1xyXG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgbGV0IGFuaW1hdGlvbiA9ICQodGhpcykuZGF0YSgnY2xvc2FibGUnKTtcclxuXHJcbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XHJcbiAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KCQodGhpcyksIGFuaW1hdGlvbiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XHJcbiAgICB9KTtcclxuICB9ZWxzZXtcclxuICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xyXG4gIH1cclxufSk7XHJcblxyXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xyXG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgndG9nZ2xlLWZvY3VzJyk7XHJcbiAgJChgIyR7aWR9YCkudHJpZ2dlckhhbmRsZXIoJ3RvZ2dsZS56Zi50cmlnZ2VyJywgWyQodGhpcyldKTtcclxufSk7XHJcblxyXG4vKipcclxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXHJcbiogQGZ1bmN0aW9uXHJcbiogQHByaXZhdGVcclxuKi9cclxuJCh3aW5kb3cpLmxvYWQoKCkgPT4ge1xyXG4gIGNoZWNrTGlzdGVuZXJzKCk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcnMoKSB7XHJcbiAgZXZlbnRzTGlzdGVuZXIoKTtcclxuICByZXNpemVMaXN0ZW5lcigpO1xyXG4gIHNjcm9sbExpc3RlbmVyKCk7XHJcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XHJcbn1cclxuXHJcbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcclxuZnVuY3Rpb24gY2xvc2VtZUxpc3RlbmVyKHBsdWdpbk5hbWUpIHtcclxuICB2YXIgeWV0aUJveGVzID0gJCgnW2RhdGEteWV0aS1ib3hdJyksXHJcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcclxuXHJcbiAgaWYocGx1Z2luTmFtZSl7XHJcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xyXG4gICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcclxuICAgIH1lbHNlIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcGx1Z2luTmFtZVswXSA9PT0gJ3N0cmluZycpe1xyXG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsdWdpbiBuYW1lcyBtdXN0IGJlIHN0cmluZ3MnKTtcclxuICAgIH1cclxuICB9XHJcbiAgaWYoeWV0aUJveGVzLmxlbmd0aCl7XHJcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xyXG4gICAgICByZXR1cm4gYGNsb3NlbWUuemYuJHtuYW1lfWA7XHJcbiAgICB9KS5qb2luKCcgJyk7XHJcblxyXG4gICAgJCh3aW5kb3cpLm9mZihsaXN0ZW5lcnMpLm9uKGxpc3RlbmVycywgZnVuY3Rpb24oZSwgcGx1Z2luSWQpe1xyXG4gICAgICBsZXQgcGx1Z2luID0gZS5uYW1lc3BhY2Uuc3BsaXQoJy4nKVswXTtcclxuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XHJcblxyXG4gICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICBfdGhpcy50cmlnZ2VySGFuZGxlcignY2xvc2UuemYudHJpZ2dlcicsIFtfdGhpc10pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzaXplTGlzdGVuZXIoZGVib3VuY2Upe1xyXG4gIGxldCB0aW1lcixcclxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtcmVzaXplXScpO1xyXG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xyXG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxyXG4gICAgLm9uKCdyZXNpemUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cclxuXHJcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxyXG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSByZXNpemUgZXZlbnRcclxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcclxuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgcmVzaXplIGV2ZW50XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcclxuICBsZXQgdGltZXIsXHJcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICBpZigkbm9kZXMubGVuZ3RoKXtcclxuICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi50cmlnZ2VyJylcclxuICAgIC5vbignc2Nyb2xsLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKXtcclxuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XHJcblxyXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcclxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XHJcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJzY3JvbGxcIik7XHJcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHNjcm9sbCBldmVudFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBldmVudHNMaXN0ZW5lcigpIHtcclxuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxyXG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcclxuXHJcbiAgLy9lbGVtZW50IGNhbGxiYWNrXHJcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbihtdXRhdGlvblJlY29yZHNMaXN0KSB7XHJcbiAgICB2YXIgJHRhcmdldCA9ICQobXV0YXRpb25SZWNvcmRzTGlzdFswXS50YXJnZXQpO1xyXG4gICAgLy90cmlnZ2VyIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdHlwZVxyXG4gICAgc3dpdGNoICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSkge1xyXG5cclxuICAgICAgY2FzZSBcInJlc2l6ZVwiIDpcclxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBcInNjcm9sbFwiIDpcclxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAvLyBjYXNlIFwibXV0YXRlXCIgOlxyXG4gICAgICAvLyBjb25zb2xlLmxvZygnbXV0YXRlJywgJHRhcmdldCk7XHJcbiAgICAgIC8vICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ211dGF0ZS56Zi50cmlnZ2VyJyk7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIC8vbWFrZSBzdXJlIHdlIGRvbid0IGdldCBzdHVjayBpbiBhbiBpbmZpbml0ZSBsb29wIGZyb20gc2xvcHB5IGNvZGVpbmdcclxuICAgICAgLy8gaWYgKCR0YXJnZXQuaW5kZXgoJ1tkYXRhLW11dGF0ZV0nKSA9PSAkKFwiW2RhdGEtbXV0YXRlXVwiKS5sZW5ndGgtMSkge1xyXG4gICAgICAvLyAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIoKTtcclxuICAgICAgLy8gfVxyXG4gICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgIGRlZmF1bHQgOlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIC8vbm90aGluZ1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYobm9kZXMubGVuZ3RoKXtcclxuICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgKG9yIGNvbWluZyBzb29uIG11dGF0aW9uKSBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aC0xOyBpKyspIHtcclxuICAgICAgbGV0IGVsZW1lbnRPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24pO1xyXG4gICAgICBlbGVtZW50T2JzZXJ2ZXIub2JzZXJ2ZShub2Rlc1tpXSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IGZhbHNlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTpmYWxzZSwgYXR0cmlidXRlRmlsdGVyOltcImRhdGEtZXZlbnRzXCJdfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbi8vIFtQSF1cclxuLy8gRm91bmRhdGlvbi5DaGVja1dhdGNoZXJzID0gY2hlY2tXYXRjaGVycztcclxuRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xyXG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcclxuLy8gRm91bmRhdGlvbi5JRmVlbFlvdSA9IGNsb3NlbWVMaXN0ZW5lcjtcclxuXHJcbn0oalF1ZXJ5KTtcclxuXHJcbi8vIGZ1bmN0aW9uIGRvbU11dGF0aW9uT2JzZXJ2ZXIoZGVib3VuY2UpIHtcclxuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cclxuLy8gICB2YXIgdGltZXIsXHJcbi8vICAgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tdXRhdGVdJyk7XHJcbi8vICAgLy9cclxuLy8gICBpZiAobm9kZXMubGVuZ3RoKSB7XHJcbi8vICAgICAvLyB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XHJcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xyXG4vLyAgICAgLy8gICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xyXG4vLyAgICAgLy8gICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcclxuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xyXG4vLyAgICAgLy8gICAgIH1cclxuLy8gICAgIC8vICAgfVxyXG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XHJcbi8vICAgICAvLyB9KCkpO1xyXG4vL1xyXG4vL1xyXG4vLyAgICAgLy9mb3IgdGhlIGJvZHksIHdlIG5lZWQgdG8gbGlzdGVuIGZvciBhbGwgY2hhbmdlcyBlZmZlY3RpbmcgdGhlIHN0eWxlIGFuZCBjbGFzcyBhdHRyaWJ1dGVzXHJcbi8vICAgICB2YXIgYm9keU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoYm9keU11dGF0aW9uKTtcclxuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xyXG4vL1xyXG4vL1xyXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXHJcbi8vICAgICBmdW5jdGlvbiBib2R5TXV0YXRpb24obXV0YXRlKSB7XHJcbi8vICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGlvbiBldmVudFxyXG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxyXG4vL1xyXG4vLyAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcclxuLy8gICAgICAgICAkKCdbZGF0YS1tdXRhdGVdJykuYXR0cignZGF0YS1ldmVudHMnLFwibXV0YXRlXCIpO1xyXG4vLyAgICAgICB9LCBkZWJvdW5jZSB8fCAxNTApO1xyXG4vLyAgICAgfVxyXG4vLyAgIH1cclxuLy8gfVxyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIEFiaWRlIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFiaWRlXHJcbiAqL1xyXG5cclxuY2xhc3MgQWJpZGUge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgQWJpZGUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEFiaWRlI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zID0ge30pIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBBYmlkZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBYmlkZScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEFiaWRlIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBBYmlkZSBmdW5jdGlvbmluZyBvbiBsb2FkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLiRpbnB1dHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0Jykubm90KCdbZGF0YS1hYmlkZS1pZ25vcmVdJyk7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEFiaWRlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuYWJpZGUnKVxyXG4gICAgICAub24oJ3Jlc2V0LnpmLmFiaWRlJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMucmVzZXRGb3JtKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5vbignc3VibWl0LnpmLmFiaWRlJywgKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlRm9ybSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnZhbGlkYXRlT24gPT09ICdmaWVsZENoYW5nZScpIHtcclxuICAgICAgdGhpcy4kaW5wdXRzXHJcbiAgICAgICAgLm9mZignY2hhbmdlLnpmLmFiaWRlJylcclxuICAgICAgICAub24oJ2NoYW5nZS56Zi5hYmlkZScsIChlKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLnZhbGlkYXRlSW5wdXQoJChlLnRhcmdldCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMubGl2ZVZhbGlkYXRlKSB7XHJcbiAgICAgIHRoaXMuJGlucHV0c1xyXG4gICAgICAgIC5vZmYoJ2lucHV0LnpmLmFiaWRlJylcclxuICAgICAgICAub24oJ2lucHV0LnpmLmFiaWRlJywgKGUpID0+IHtcclxuICAgICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBBYmlkZSB1cG9uIERPTSBjaGFuZ2VcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9yZWZsb3coKSB7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3Mgd2hldGhlciBvciBub3QgYSBmb3JtIGVsZW1lbnQgaGFzIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgYW5kIGlmIGl0J3MgY2hlY2tlZCBvciBub3RcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcclxuICAgKi9cclxuICByZXF1aXJlZENoZWNrKCRlbCkge1xyXG4gICAgaWYgKCEkZWwuYXR0cigncmVxdWlyZWQnKSkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgdmFyIGlzR29vZCA9IHRydWU7XHJcblxyXG4gICAgc3dpdGNoICgkZWxbMF0udHlwZSkge1xyXG4gICAgICBjYXNlICdzZWxlY3QnOlxyXG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcclxuICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcclxuICAgICAgICB2YXIgb3B0ID0gJGVsLmZpbmQoJ29wdGlvbjpzZWxlY3RlZCcpO1xyXG4gICAgICAgIGlmICghb3B0Lmxlbmd0aCB8fCAhb3B0LnZhbCgpKSBpc0dvb2QgPSBmYWxzZTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYoISRlbC52YWwoKSB8fCAhJGVsLnZhbCgpLmxlbmd0aCkgaXNHb29kID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzR29vZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJhc2VkIG9uICRlbCwgZ2V0IHRoZSBmaXJzdCBlbGVtZW50IHdpdGggc2VsZWN0b3IgaW4gdGhpcyBvcmRlcjpcclxuICAgKiAxLiBUaGUgZWxlbWVudCdzIGRpcmVjdCBzaWJsaW5nKCdzKS5cclxuICAgKiAzLiBUaGUgZWxlbWVudCdzIHBhcmVudCdzIGNoaWxkcmVuLlxyXG4gICAqXHJcbiAgICogVGhpcyBhbGxvd3MgZm9yIG11bHRpcGxlIGZvcm0gZXJyb3JzIHBlciBpbnB1dCwgdGhvdWdoIGlmIG5vbmUgYXJlIGZvdW5kLCBubyBmb3JtIGVycm9ycyB3aWxsIGJlIHNob3duLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIHJlZmVyZW5jZSB0byBmaW5kIHRoZSBmb3JtIGVycm9yIHNlbGVjdG9yLlxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgc2VsZWN0b3IuXHJcbiAgICovXHJcbiAgZmluZEZvcm1FcnJvcigkZWwpIHtcclxuICAgIHZhciAkZXJyb3IgPSAkZWwuc2libGluZ3ModGhpcy5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKTtcclxuXHJcbiAgICBpZiAoISRlcnJvci5sZW5ndGgpIHtcclxuICAgICAgJGVycm9yID0gJGVsLnBhcmVudCgpLmZpbmQodGhpcy5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJGVycm9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBmaXJzdCBlbGVtZW50IGluIHRoaXMgb3JkZXI6XHJcbiAgICogMi4gVGhlIDxsYWJlbD4gd2l0aCB0aGUgYXR0cmlidXRlIGBbZm9yPVwic29tZUlucHV0SWRcIl1gXHJcbiAgICogMy4gVGhlIGAuY2xvc2VzdCgpYCA8bGFiZWw+XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxyXG4gICAqL1xyXG4gIGZpbmRMYWJlbCgkZWwpIHtcclxuICAgIHZhciBpZCA9ICRlbFswXS5pZDtcclxuICAgIHZhciAkbGFiZWwgPSB0aGlzLiRlbGVtZW50LmZpbmQoYGxhYmVsW2Zvcj1cIiR7aWR9XCJdYCk7XHJcblxyXG4gICAgaWYgKCEkbGFiZWwubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiAkZWwuY2xvc2VzdCgnbGFiZWwnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJGxhYmVsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBzZXQgb2YgbGFiZWxzIGFzc29jaWF0ZWQgd2l0aCBhIHNldCBvZiByYWRpbyBlbHMgaW4gdGhpcyBvcmRlclxyXG4gICAqIDIuIFRoZSA8bGFiZWw+IHdpdGggdGhlIGF0dHJpYnV0ZSBgW2Zvcj1cInNvbWVJbnB1dElkXCJdYFxyXG4gICAqIDMuIFRoZSBgLmNsb3Nlc3QoKWAgPGxhYmVsPlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcclxuICAgKi9cclxuICBmaW5kUmFkaW9MYWJlbHMoJGVscykge1xyXG4gICAgdmFyIGxhYmVscyA9ICRlbHMubWFwKChpLCBlbCkgPT4ge1xyXG4gICAgICB2YXIgaWQgPSBlbC5pZDtcclxuICAgICAgdmFyICRsYWJlbCA9IHRoaXMuJGVsZW1lbnQuZmluZChgbGFiZWxbZm9yPVwiJHtpZH1cIl1gKTtcclxuXHJcbiAgICAgIGlmICghJGxhYmVsLmxlbmd0aCkge1xyXG4gICAgICAgICRsYWJlbCA9ICQoZWwpLmNsb3Nlc3QoJ2xhYmVsJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuICRsYWJlbFswXTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiAkKGxhYmVscyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIHRoZSBDU1MgZXJyb3IgY2xhc3MgYXMgc3BlY2lmaWVkIGJ5IHRoZSBBYmlkZSBzZXR0aW5ncyB0byB0aGUgbGFiZWwsIGlucHV0LCBhbmQgdGhlIGZvcm1cclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIGNsYXNzIHRvXHJcbiAgICovXHJcbiAgYWRkRXJyb3JDbGFzc2VzKCRlbCkge1xyXG4gICAgdmFyICRsYWJlbCA9IHRoaXMuZmluZExhYmVsKCRlbCk7XHJcbiAgICB2YXIgJGZvcm1FcnJvciA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWwpO1xyXG5cclxuICAgIGlmICgkbGFiZWwubGVuZ3RoKSB7XHJcbiAgICAgICRsYWJlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJGZvcm1FcnJvci5sZW5ndGgpIHtcclxuICAgICAgJGZvcm1FcnJvci5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgICRlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzKS5hdHRyKCdkYXRhLWludmFsaWQnLCAnJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgQ1NTIGVycm9yIGNsYXNzZXMgZXRjIGZyb20gYW4gZW50aXJlIHJhZGlvIGJ1dHRvbiBncm91cFxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBncm91cE5hbWUgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxyXG4gICAqXHJcbiAgICovXHJcblxyXG4gIHJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyICRlbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYDpyYWRpb1tuYW1lPVwiJHtncm91cE5hbWV9XCJdYCk7XHJcbiAgICB2YXIgJGxhYmVscyA9IHRoaXMuZmluZFJhZGlvTGFiZWxzKCRlbHMpO1xyXG4gICAgdmFyICRmb3JtRXJyb3JzID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbHMpO1xyXG5cclxuICAgIGlmICgkbGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAkbGFiZWxzLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZm9ybUVycm9ycy5sZW5ndGgpIHtcclxuICAgICAgJGZvcm1FcnJvcnMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICAkZWxzLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgQ1NTIGVycm9yIGNsYXNzIGFzIHNwZWNpZmllZCBieSB0aGUgQWJpZGUgc2V0dGluZ3MgZnJvbSB0aGUgbGFiZWwsIGlucHV0LCBhbmQgdGhlIGZvcm1cclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byByZW1vdmUgdGhlIGNsYXNzIGZyb21cclxuICAgKi9cclxuICByZW1vdmVFcnJvckNsYXNzZXMoJGVsKSB7XHJcbiAgICAvLyByYWRpb3MgbmVlZCB0byBjbGVhciBhbGwgb2YgdGhlIGVsc1xyXG4gICAgaWYoJGVsWzBdLnR5cGUgPT0gJ3JhZGlvJykge1xyXG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVSYWRpb0Vycm9yQ2xhc3NlcygkZWwuYXR0cignbmFtZScpKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgJGxhYmVsID0gdGhpcy5maW5kTGFiZWwoJGVsKTtcclxuICAgIHZhciAkZm9ybUVycm9yID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbCk7XHJcblxyXG4gICAgaWYgKCRsYWJlbC5sZW5ndGgpIHtcclxuICAgICAgJGxhYmVsLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZm9ybUVycm9yLmxlbmd0aCkge1xyXG4gICAgICAkZm9ybUVycm9yLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgJGVsLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR29lcyB0aHJvdWdoIGEgZm9ybSB0byBmaW5kIGlucHV0cyBhbmQgcHJvY2VlZHMgdG8gdmFsaWRhdGUgdGhlbSBpbiB3YXlzIHNwZWNpZmljIHRvIHRoZWlyIHR5cGVcclxuICAgKiBAZmlyZXMgQWJpZGUjaW52YWxpZFxyXG4gICAqIEBmaXJlcyBBYmlkZSN2YWxpZFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB2YWxpZGF0ZSwgc2hvdWxkIGJlIGFuIEhUTUwgaW5wdXRcclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gZ29vZFRvR28gLSBJZiB0aGUgaW5wdXQgaXMgdmFsaWQgb3Igbm90LlxyXG4gICAqL1xyXG4gIHZhbGlkYXRlSW5wdXQoJGVsKSB7XHJcbiAgICB2YXIgY2xlYXJSZXF1aXJlID0gdGhpcy5yZXF1aXJlZENoZWNrKCRlbCksXHJcbiAgICAgICAgdmFsaWRhdGVkID0gZmFsc2UsXHJcbiAgICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0b3IgPSAkZWwuYXR0cignZGF0YS12YWxpZGF0b3InKSxcclxuICAgICAgICBlcXVhbFRvID0gdHJ1ZTtcclxuXHJcbiAgICBzd2l0Y2ggKCRlbFswXS50eXBlKSB7XHJcbiAgICAgIGNhc2UgJ3JhZGlvJzpcclxuICAgICAgICB2YWxpZGF0ZWQgPSB0aGlzLnZhbGlkYXRlUmFkaW8oJGVsLmF0dHIoJ25hbWUnKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdjaGVja2JveCc6XHJcbiAgICAgICAgdmFsaWRhdGVkID0gY2xlYXJSZXF1aXJlO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSAnc2VsZWN0JzpcclxuICAgICAgY2FzZSAnc2VsZWN0LW9uZSc6XHJcbiAgICAgIGNhc2UgJ3NlbGVjdC1tdWx0aXBsZSc6XHJcbiAgICAgICAgdmFsaWRhdGVkID0gY2xlYXJSZXF1aXJlO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB2YWxpZGF0ZWQgPSB0aGlzLnZhbGlkYXRlVGV4dCgkZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh2YWxpZGF0b3IpIHtcclxuICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdGhpcy5tYXRjaFZhbGlkYXRpb24oJGVsLCB2YWxpZGF0b3IsICRlbC5hdHRyKCdyZXF1aXJlZCcpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJGVsLmF0dHIoJ2RhdGEtZXF1YWx0bycpKSB7XHJcbiAgICAgIGVxdWFsVG8gPSB0aGlzLm9wdGlvbnMudmFsaWRhdG9ycy5lcXVhbFRvKCRlbCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHZhciBnb29kVG9HbyA9IFtjbGVhclJlcXVpcmUsIHZhbGlkYXRlZCwgY3VzdG9tVmFsaWRhdG9yLCBlcXVhbFRvXS5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XHJcbiAgICB2YXIgbWVzc2FnZSA9IChnb29kVG9HbyA/ICd2YWxpZCcgOiAnaW52YWxpZCcpICsgJy56Zi5hYmlkZSc7XHJcblxyXG4gICAgdGhpc1tnb29kVG9HbyA/ICdyZW1vdmVFcnJvckNsYXNzZXMnIDogJ2FkZEVycm9yQ2xhc3NlcyddKCRlbCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBpbnB1dCBpcyBkb25lIGNoZWNraW5nIGZvciB2YWxpZGF0aW9uLiBFdmVudCB0cmlnZ2VyIGlzIGVpdGhlciBgdmFsaWQuemYuYWJpZGVgIG9yIGBpbnZhbGlkLnpmLmFiaWRlYFxyXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgRE9NIGVsZW1lbnQgb2YgdGhlIGlucHV0LlxyXG4gICAgICogQGV2ZW50IEFiaWRlI3ZhbGlkXHJcbiAgICAgKiBAZXZlbnQgQWJpZGUjaW52YWxpZFxyXG4gICAgICovXHJcbiAgICAkZWwudHJpZ2dlcihtZXNzYWdlLCBbJGVsXSk7XHJcblxyXG4gICAgcmV0dXJuIGdvb2RUb0dvO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR29lcyB0aHJvdWdoIGEgZm9ybSBhbmQgaWYgdGhlcmUgYXJlIGFueSBpbnZhbGlkIGlucHV0cywgaXQgd2lsbCBkaXNwbGF5IHRoZSBmb3JtIGVycm9yIGVsZW1lbnRcclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gbm9FcnJvciAtIHRydWUgaWYgbm8gZXJyb3JzIHdlcmUgZGV0ZWN0ZWQuLi5cclxuICAgKiBAZmlyZXMgQWJpZGUjZm9ybXZhbGlkXHJcbiAgICogQGZpcmVzIEFiaWRlI2Zvcm1pbnZhbGlkXHJcbiAgICovXHJcbiAgdmFsaWRhdGVGb3JtKCkge1xyXG4gICAgdmFyIGFjYyA9IFtdO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiRpbnB1dHMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgYWNjLnB1c2goX3RoaXMudmFsaWRhdGVJbnB1dCgkKHRoaXMpKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgbm9FcnJvciA9IGFjYy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAobm9FcnJvciA/ICdub25lJyA6ICdibG9jaycpKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGZvcm0gaXMgZmluaXNoZWQgdmFsaWRhdGluZy4gRXZlbnQgdHJpZ2dlciBpcyBlaXRoZXIgYGZvcm12YWxpZC56Zi5hYmlkZWAgb3IgYGZvcm1pbnZhbGlkLnpmLmFiaWRlYC5cclxuICAgICAqIFRyaWdnZXIgaW5jbHVkZXMgdGhlIGVsZW1lbnQgb2YgdGhlIGZvcm0uXHJcbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybXZhbGlkXHJcbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybWludmFsaWRcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKChub0Vycm9yID8gJ2Zvcm12YWxpZCcgOiAnZm9ybWludmFsaWQnKSArICcuemYuYWJpZGUnLCBbdGhpcy4kZWxlbWVudF0pO1xyXG5cclxuICAgIHJldHVybiBub0Vycm9yO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIGEgbm90IGEgdGV4dCBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB0aGUgcGF0dGVybiBzcGVjaWZpZWQgaW4gdGhlIGF0dHJpYnV0ZS4gSWYgbm8gbWF0Y2hpbmcgcGF0dGVybiBpcyBmb3VuZCwgcmV0dXJucyB0cnVlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHZhbGlkYXRlLCBzaG91bGQgYmUgYSB0ZXh0IGlucHV0IEhUTUwgZWxlbWVudFxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXR0ZXJuIC0gc3RyaW5nIHZhbHVlIG9mIG9uZSBvZiB0aGUgUmVnRXggcGF0dGVybnMgaW4gQWJpZGUub3B0aW9ucy5wYXR0ZXJuc1xyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgdGhlIGlucHV0IHZhbHVlIG1hdGNoZXMgdGhlIHBhdHRlcm4gc3BlY2lmaWVkXHJcbiAgICovXHJcbiAgdmFsaWRhdGVUZXh0KCRlbCwgcGF0dGVybikge1xyXG4gICAgLy8gQSBwYXR0ZXJuIGNhbiBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgb3IgaXQgd2lsbCBiZSBpbmZlcmVkIGZyb20gdGhlIGlucHV0J3MgXCJwYXR0ZXJuXCIgYXR0cmlidXRlLCBvciBpdCdzIFwidHlwZVwiIGF0dHJpYnV0ZVxyXG4gICAgcGF0dGVybiA9IChwYXR0ZXJuIHx8ICRlbC5hdHRyKCdwYXR0ZXJuJykgfHwgJGVsLmF0dHIoJ3R5cGUnKSk7XHJcbiAgICB2YXIgaW5wdXRUZXh0ID0gJGVsLnZhbCgpO1xyXG4gICAgdmFyIHZhbGlkID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKGlucHV0VGV4dC5sZW5ndGgpIHtcclxuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50IGlzIGluIEFiaWRlJ3MgbGlzdCBvZiBwYXR0ZXJucywgdGhlbiB0ZXN0IHRoYXQgcmVnZXhwXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGF0dGVybnMuaGFzT3duUHJvcGVydHkocGF0dGVybikpIHtcclxuICAgICAgICB2YWxpZCA9IHRoaXMub3B0aW9ucy5wYXR0ZXJuc1twYXR0ZXJuXS50ZXN0KGlucHV0VGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gbmFtZSBpc24ndCBhbHNvIHRoZSB0eXBlIGF0dHJpYnV0ZSBvZiB0aGUgZmllbGQsIHRoZW4gdGVzdCBpdCBhcyBhIHJlZ2V4cFxyXG4gICAgICBlbHNlIGlmIChwYXR0ZXJuICE9PSAkZWwuYXR0cigndHlwZScpKSB7XHJcbiAgICAgICAgdmFsaWQgPSBuZXcgUmVnRXhwKHBhdHRlcm4pLnRlc3QoaW5wdXRUZXh0KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB2YWxpZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEFuIGVtcHR5IGZpZWxkIGlzIHZhbGlkIGlmIGl0J3Mgbm90IHJlcXVpcmVkXHJcbiAgICBlbHNlIGlmICghJGVsLnByb3AoJ3JlcXVpcmVkJykpIHtcclxuICAgICAgdmFsaWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWxpZDtcclxuICAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSByYWRpbyBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB3aGV0aGVyIG9yIG5vdCBpdCBpcyByZXF1aXJlZCBhbmQgc2VsZWN0ZWQuIEFsdGhvdWdoIHRoZSBmdW5jdGlvbiB0YXJnZXRzIGEgc2luZ2xlIGA8aW5wdXQ+YCwgaXQgdmFsaWRhdGVzIGJ5IGNoZWNraW5nIHRoZSBgcmVxdWlyZWRgIGFuZCBgY2hlY2tlZGAgcHJvcGVydGllcyBvZiBhbGwgcmFkaW8gYnV0dG9ucyBpbiBpdHMgZ3JvdXAuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGdyb3VwTmFtZSAtIEEgc3RyaW5nIHRoYXQgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIGEgcmFkaW8gYnV0dG9uIGdyb3VwXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdCBsZWFzdCBvbmUgcmFkaW8gaW5wdXQgaGFzIGJlZW4gc2VsZWN0ZWQgKGlmIGl0J3MgcmVxdWlyZWQpXHJcbiAgICovXHJcbiAgdmFsaWRhdGVSYWRpbyhncm91cE5hbWUpIHtcclxuICAgIC8vIElmIGF0IGxlYXN0IG9uZSByYWRpbyBpbiB0aGUgZ3JvdXAgaGFzIHRoZSBgcmVxdWlyZWRgIGF0dHJpYnV0ZSwgdGhlIGdyb3VwIGlzIGNvbnNpZGVyZWQgcmVxdWlyZWRcclxuICAgIC8vIFBlciBXM0Mgc3BlYywgYWxsIHJhZGlvIGJ1dHRvbnMgaW4gYSBncm91cCBzaG91bGQgaGF2ZSBgcmVxdWlyZWRgLCBidXQgd2UncmUgYmVpbmcgbmljZVxyXG4gICAgdmFyICRncm91cCA9IHRoaXMuJGVsZW1lbnQuZmluZChgOnJhZGlvW25hbWU9XCIke2dyb3VwTmFtZX1cIl1gKTtcclxuICAgIHZhciB2YWxpZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIC5hdHRyKCkgcmV0dXJucyB1bmRlZmluZWQgaWYgbm8gZWxlbWVudHMgaW4gJGdyb3VwIGhhdmUgdGhlIGF0dHJpYnV0ZSBcInJlcXVpcmVkXCJcclxuICAgIGlmICgkZ3JvdXAuYXR0cigncmVxdWlyZWQnKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHZhbGlkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3IgdGhlIGdyb3VwIHRvIGJlIHZhbGlkLCBhdCBsZWFzdCBvbmUgcmFkaW8gbmVlZHMgdG8gYmUgY2hlY2tlZFxyXG4gICAgJGdyb3VwLmVhY2goKGksIGUpID0+IHtcclxuICAgICAgaWYgKCQoZSkucHJvcCgnY2hlY2tlZCcpKSB7XHJcbiAgICAgICAgdmFsaWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdmFsaWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIGlmIGEgc2VsZWN0ZWQgaW5wdXQgcGFzc2VzIGEgY3VzdG9tIHZhbGlkYXRpb24gZnVuY3Rpb24uIE11bHRpcGxlIHZhbGlkYXRpb25zIGNhbiBiZSB1c2VkLCBpZiBwYXNzZWQgdG8gdGhlIGVsZW1lbnQgd2l0aCBgZGF0YS12YWxpZGF0b3I9XCJmb28gYmFyIGJhelwiYCBpbiBhIHNwYWNlIHNlcGFyYXRlZCBsaXN0ZWQuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBpbnB1dCBlbGVtZW50LlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWxpZGF0b3JzIC0gYSBzdHJpbmcgb2YgZnVuY3Rpb24gbmFtZXMgbWF0Y2hpbmcgZnVuY3Rpb25zIGluIHRoZSBBYmlkZS5vcHRpb25zLnZhbGlkYXRvcnMgb2JqZWN0LlxyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVxdWlyZWQgLSBzZWxmIGV4cGxhbmF0b3J5P1xyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgdmFsaWRhdGlvbnMgcGFzc2VkLlxyXG4gICAqL1xyXG4gIG1hdGNoVmFsaWRhdGlvbigkZWwsIHZhbGlkYXRvcnMsIHJlcXVpcmVkKSB7XHJcbiAgICByZXF1aXJlZCA9IHJlcXVpcmVkID8gdHJ1ZSA6IGZhbHNlO1xyXG5cclxuICAgIHZhciBjbGVhciA9IHZhbGlkYXRvcnMuc3BsaXQoJyAnKS5tYXAoKHYpID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy52YWxpZGF0b3JzW3ZdKCRlbCwgcmVxdWlyZWQsICRlbC5wYXJlbnQoKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBjbGVhci5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXNldHMgZm9ybSBpbnB1dHMgYW5kIHN0eWxlc1xyXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtcmVzZXRcclxuICAgKi9cclxuICByZXNldEZvcm0oKSB7XHJcbiAgICB2YXIgJGZvcm0gPSB0aGlzLiRlbGVtZW50LFxyXG4gICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnM7XHJcblxyXG4gICAgJChgLiR7b3B0cy5sYWJlbEVycm9yQ2xhc3N9YCwgJGZvcm0pLm5vdCgnc21hbGwnKS5yZW1vdmVDbGFzcyhvcHRzLmxhYmVsRXJyb3JDbGFzcyk7XHJcbiAgICAkKGAuJHtvcHRzLmlucHV0RXJyb3JDbGFzc31gLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKG9wdHMuaW5wdXRFcnJvckNsYXNzKTtcclxuICAgICQoYCR7b3B0cy5mb3JtRXJyb3JTZWxlY3Rvcn0uJHtvcHRzLmZvcm1FcnJvckNsYXNzfWApLnJlbW92ZUNsYXNzKG9wdHMuZm9ybUVycm9yQ2xhc3MpO1xyXG4gICAgJGZvcm0uZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcclxuICAgICQoJzppbnB1dCcsICRmb3JtKS5ub3QoJzpidXR0b24sIDpzdWJtaXQsIDpyZXNldCwgOmhpZGRlbiwgW2RhdGEtYWJpZGUtaWdub3JlXScpLnZhbCgnJykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGZvcm0gaGFzIGJlZW4gcmVzZXQuXHJcbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybXJlc2V0XHJcbiAgICAgKi9cclxuICAgICRmb3JtLnRyaWdnZXIoJ2Zvcm1yZXNldC56Zi5hYmlkZScsIFskZm9ybV0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgQWJpZGUuXHJcbiAgICogUmVtb3ZlcyBlcnJvciBzdHlsZXMgYW5kIGNsYXNzZXMgZnJvbSBlbGVtZW50cywgd2l0aG91dCByZXNldHRpbmcgdGhlaXIgdmFsdWVzLlxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAub2ZmKCcuYWJpZGUnKVxyXG4gICAgICAuZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJylcclxuICAgICAgICAuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcclxuXHJcbiAgICB0aGlzLiRpbnB1dHNcclxuICAgICAgLm9mZignLmFiaWRlJylcclxuICAgICAgLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3RoaXMucmVtb3ZlRXJyb3JDbGFzc2VzKCQodGhpcykpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAqL1xyXG5BYmlkZS5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBUaGUgZGVmYXVsdCBldmVudCB0byB2YWxpZGF0ZSBpbnB1dHMuIENoZWNrYm94ZXMgYW5kIHJhZGlvcyB2YWxpZGF0ZSBpbW1lZGlhdGVseS5cclxuICAgKiBSZW1vdmUgb3IgY2hhbmdlIHRoaXMgdmFsdWUgZm9yIG1hbnVhbCB2YWxpZGF0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnZmllbGRDaGFuZ2UnXHJcbiAgICovXHJcbiAgdmFsaWRhdGVPbjogJ2ZpZWxkQ2hhbmdlJyxcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgdG8gYmUgYXBwbGllZCB0byBpbnB1dCBsYWJlbHMgb24gZmFpbGVkIHZhbGlkYXRpb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdpcy1pbnZhbGlkLWxhYmVsJ1xyXG4gICAqL1xyXG4gIGxhYmVsRXJyb3JDbGFzczogJ2lzLWludmFsaWQtbGFiZWwnLFxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0cyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2lzLWludmFsaWQtaW5wdXQnXHJcbiAgICovXHJcbiAgaW5wdXRFcnJvckNsYXNzOiAnaXMtaW52YWxpZC1pbnB1dCcsXHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIHNlbGVjdG9yIHRvIHVzZSB0byB0YXJnZXQgRm9ybSBFcnJvcnMgZm9yIHNob3cvaGlkZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJy5mb3JtLWVycm9yJ1xyXG4gICAqL1xyXG4gIGZvcm1FcnJvclNlbGVjdG9yOiAnLmZvcm0tZXJyb3InLFxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyBhZGRlZCB0byBGb3JtIEVycm9ycyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2lzLXZpc2libGUnXHJcbiAgICovXHJcbiAgZm9ybUVycm9yQ2xhc3M6ICdpcy12aXNpYmxlJyxcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRvIHRydWUgdG8gdmFsaWRhdGUgdGV4dCBpbnB1dHMgb24gYW55IHZhbHVlIGNoYW5nZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBsaXZlVmFsaWRhdGU6IGZhbHNlLFxyXG5cclxuICBwYXR0ZXJuczoge1xyXG4gICAgYWxwaGEgOiAvXlthLXpBLVpdKyQvLFxyXG4gICAgYWxwaGFfbnVtZXJpYyA6IC9eW2EtekEtWjAtOV0rJC8sXHJcbiAgICBpbnRlZ2VyIDogL15bLStdP1xcZCskLyxcclxuICAgIG51bWJlciA6IC9eWy0rXT9cXGQqKD86W1xcLlxcLF1cXGQrKT8kLyxcclxuXHJcbiAgICAvLyBhbWV4LCB2aXNhLCBkaW5lcnNcclxuICAgIGNhcmQgOiAvXig/OjRbMC05XXsxMn0oPzpbMC05XXszfSk/fDVbMS01XVswLTldezE0fXw2KD86MDExfDVbMC05XVswLTldKVswLTldezEyfXwzWzQ3XVswLTldezEzfXwzKD86MFswLTVdfFs2OF1bMC05XSlbMC05XXsxMX18KD86MjEzMXwxODAwfDM1XFxkezN9KVxcZHsxMX0pJC8sXHJcbiAgICBjdnYgOiAvXihbMC05XSl7Myw0fSQvLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL3N0YXRlcy1vZi10aGUtdHlwZS1hdHRyaWJ1dGUuaHRtbCN2YWxpZC1lLW1haWwtYWRkcmVzc1xyXG4gICAgZW1haWwgOiAvXlthLXpBLVowLTkuISMkJSYnKitcXC89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSskLyxcclxuXHJcbiAgICB1cmwgOiAvXihodHRwcz98ZnRwfGZpbGV8c3NoKTpcXC9cXC8oKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oXFwjKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxcXC98XFw/KSopPyQvLFxyXG4gICAgLy8gYWJjLmRlXHJcbiAgICBkb21haW4gOiAvXihbYS16QS1aMC05XShbYS16QS1aMC05XFwtXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsOH0kLyxcclxuXHJcbiAgICBkYXRldGltZSA6IC9eKFswLTJdWzAtOV17M30pXFwtKFswLTFdWzAtOV0pXFwtKFswLTNdWzAtOV0pVChbMC01XVswLTldKVxcOihbMC01XVswLTldKVxcOihbMC01XVswLTldKShafChbXFwtXFwrXShbMC0xXVswLTldKVxcOjAwKSkkLyxcclxuICAgIC8vIFlZWVktTU0tRERcclxuICAgIGRhdGUgOiAvKD86MTl8MjApWzAtOV17Mn0tKD86KD86MFsxLTldfDFbMC0yXSktKD86MFsxLTldfDFbMC05XXwyWzAtOV0pfCg/Oig/ITAyKSg/OjBbMS05XXwxWzAtMl0pLSg/OjMwKSl8KD86KD86MFsxMzU3OF18MVswMl0pLTMxKSkkLyxcclxuICAgIC8vIEhIOk1NOlNTXHJcbiAgICB0aW1lIDogL14oMFswLTldfDFbMC05XXwyWzAtM10pKDpbMC01XVswLTldKXsyfSQvLFxyXG4gICAgZGF0ZUlTTyA6IC9eXFxkezR9W1xcL1xcLV1cXGR7MSwyfVtcXC9cXC1dXFxkezEsMn0kLyxcclxuICAgIC8vIE1NL0REL1lZWVlcclxuICAgIG1vbnRoX2RheV95ZWFyIDogL14oMFsxLTldfDFbMDEyXSlbLSBcXC8uXSgwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dXFxkezR9JC8sXHJcbiAgICAvLyBERC9NTS9ZWVlZXHJcbiAgICBkYXlfbW9udGhfeWVhciA6IC9eKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl0oMFsxLTldfDFbMDEyXSlbLSBcXC8uXVxcZHs0fSQvLFxyXG5cclxuICAgIC8vICNGRkYgb3IgI0ZGRkZGRlxyXG4gICAgY29sb3IgOiAvXiM/KFthLWZBLUYwLTldezZ9fFthLWZBLUYwLTldezN9KSQvXHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogT3B0aW9uYWwgdmFsaWRhdGlvbiBmdW5jdGlvbnMgdG8gYmUgdXNlZC4gYGVxdWFsVG9gIGJlaW5nIHRoZSBvbmx5IGRlZmF1bHQgaW5jbHVkZWQgZnVuY3Rpb24uXHJcbiAgICogRnVuY3Rpb25zIHNob3VsZCByZXR1cm4gb25seSBhIGJvb2xlYW4gaWYgdGhlIGlucHV0IGlzIHZhbGlkIG9yIG5vdC4gRnVuY3Rpb25zIGFyZSBnaXZlbiB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcclxuICAgKiBlbCA6IFRoZSBqUXVlcnkgZWxlbWVudCB0byB2YWxpZGF0ZS5cclxuICAgKiByZXF1aXJlZCA6IEJvb2xlYW4gdmFsdWUgb2YgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBiZSBwcmVzZW50IG9yIG5vdC5cclxuICAgKiBwYXJlbnQgOiBUaGUgZGlyZWN0IHBhcmVudCBvZiB0aGUgaW5wdXQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqL1xyXG4gIHZhbGlkYXRvcnM6IHtcclxuICAgIGVxdWFsVG86IGZ1bmN0aW9uIChlbCwgcmVxdWlyZWQsIHBhcmVudCkge1xyXG4gICAgICByZXR1cm4gJChgIyR7ZWwuYXR0cignZGF0YS1lcXVhbHRvJyl9YCkudmFsKCkgPT09IGVsLnZhbCgpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oQWJpZGUsICdBYmlkZScpO1xyXG5cclxufShqUXVlcnkpO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIEFjY29yZGlvbiBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKi9cclxuXHJcbmNsYXNzIEFjY29yZGlvbiB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBhIHBsYWluIG9iamVjdCB3aXRoIHNldHRpbmdzIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9wdGlvbnMuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbicpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignQWNjb3JkaW9uJywge1xyXG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcclxuICAgICAgJ1NQQUNFJzogJ3RvZ2dsZScsXHJcbiAgICAgICdBUlJPV19ET1dOJzogJ25leHQnLFxyXG4gICAgICAnQVJST1dfVVAnOiAncHJldmlvdXMnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gYnkgYW5pbWF0aW5nIHRoZSBwcmVzZXQgYWN0aXZlIHBhbmUocykuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigncm9sZScsICd0YWJsaXN0Jyk7XHJcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignbGksIFtkYXRhLWFjY29yZGlvbi1pdGVtXScpO1xyXG5cclxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbihpZHgsIGVsKSB7XHJcbiAgICAgIHZhciAkZWwgPSAkKGVsKSxcclxuICAgICAgICAgICRjb250ZW50ID0gJGVsLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKSxcclxuICAgICAgICAgIGlkID0gJGNvbnRlbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjb3JkaW9uJyksXHJcbiAgICAgICAgICBsaW5rSWQgPSBlbC5pZCB8fCBgJHtpZH0tbGFiZWxgO1xyXG5cclxuICAgICAgJGVsLmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1jb250cm9scyc6IGlkLFxyXG4gICAgICAgICdyb2xlJzogJ3RhYicsXHJcbiAgICAgICAgJ2lkJzogbGlua0lkLFxyXG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgICRjb250ZW50LmF0dHIoeydyb2xlJzogJ3RhYnBhbmVsJywgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCwgJ2FyaWEtaGlkZGVuJzogdHJ1ZSwgJ2lkJzogaWR9KTtcclxuICAgIH0pO1xyXG4gICAgdmFyICRpbml0QWN0aXZlID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWN0aXZlJykuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xyXG4gICAgaWYoJGluaXRBY3RpdmUubGVuZ3RoKXtcclxuICAgICAgdGhpcy5kb3duKCRpbml0QWN0aXZlLCB0cnVlKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBhY2NvcmRpb24uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciAkZWxlbSA9ICQodGhpcyk7XHJcbiAgICAgIHZhciAkdGFiQ29udGVudCA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcclxuICAgICAgaWYgKCR0YWJDb250ZW50Lmxlbmd0aCkge1xyXG4gICAgICAgICRlbGVtLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb24ga2V5ZG93bi56Zi5hY2NvcmRpb24nKVxyXG4gICAgICAgICAgICAgICAub24oJ2NsaWNrLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvLyAkKHRoaXMpLmNoaWxkcmVuKCdhJykub24oJ2NsaWNrLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGlmICgkZWxlbS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCB8fCAkZWxlbS5zaWJsaW5ncygpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSl7XHJcbiAgICAgICAgICAgICAgX3RoaXMudXAoJHRhYkNvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFiQ29udGVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uJywge1xyXG4gICAgICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkdGFiQ29udGVudCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIHZhciAkYSA9ICRlbGVtLm5leHQoKS5maW5kKCdhJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQpIHtcclxuICAgICAgICAgICAgICAgICRhLnRyaWdnZXIoJ2NsaWNrLnpmLmFjY29yZGlvbicpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgdmFyICRhID0gJGVsZW0ucHJldigpLmZpbmQoJ2EnKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xyXG4gICAgICAgICAgICAgICAgJGEudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJylcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBzZWxlY3RlZCBjb250ZW50IHBhbmUncyBvcGVuL2Nsb3NlIHN0YXRlLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgcGFuZSB0byB0b2dnbGUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgdG9nZ2xlKCR0YXJnZXQpIHtcclxuICAgIGlmKCR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XHJcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCB8fCAkdGFyZ2V0LnBhcmVudCgpLnNpYmxpbmdzKCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKXtcclxuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xyXG4gICAgICB9IGVsc2UgeyByZXR1cm47IH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIHRoZSBhY2NvcmRpb24gdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHBhbmUgdG8gb3Blbi5cclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGZpcnN0VGltZSAtIGZsYWcgdG8gZGV0ZXJtaW5lIGlmIHJlZmxvdyBzaG91bGQgaGFwcGVuLlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jZG93blxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRvd24oJHRhcmdldCwgZmlyc3RUaW1lKSB7XHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCAmJiAhZmlyc3RUaW1lKSB7XHJcbiAgICAgIHZhciAkY3VycmVudEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XHJcbiAgICAgIGlmKCRjdXJyZW50QWN0aXZlLmxlbmd0aCl7XHJcbiAgICAgICAgdGhpcy51cCgkY3VycmVudEFjdGl2ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAkdGFyZ2V0XHJcbiAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKVxyXG4gICAgICAucGFyZW50KCdbZGF0YS10YWItY29udGVudF0nKVxyXG4gICAgICAuYWRkQmFjaygpXHJcbiAgICAgIC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgJHRhcmdldC5zbGlkZURvd24odGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICgpID0+IHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIG9wZW5pbmcuXHJcbiAgICAgICAqIEBldmVudCBBY2NvcmRpb24jZG93blxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbicsIFskdGFyZ2V0XSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xyXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IHRydWUsXHJcbiAgICAgICdhcmlhLXNlbGVjdGVkJzogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIHRhYiBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiB0YWIgdG8gY2xvc2UuXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiN1cFxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHVwKCR0YXJnZXQpIHtcclxuICAgIHZhciAkYXVudHMgPSAkdGFyZ2V0LnBhcmVudCgpLnNpYmxpbmdzKCksXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyIGNhbkNsb3NlID0gdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kID8gJGF1bnRzLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSA6ICR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgIGlmKCF0aGlzLm9wdGlvbnMuYWxsb3dBbGxDbG9zZWQgJiYgIWNhbkNsb3NlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxyXG4gICAgICAgICAqIEBldmVudCBBY2NvcmRpb24jdXBcclxuICAgICAgICAgKi9cclxuICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cC56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xyXG4gICAgICB9KTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgICR0YXJnZXQuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKVxyXG4gICAgICAgICAgIC5wYXJlbnQoKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgJChgIyR7JHRhcmdldC5hdHRyKCdhcmlhLWxhYmVsbGVkYnknKX1gKS5hdHRyKHtcclxuICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxyXG4gICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2VcclxuICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiNkZXN0cm95ZWRcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10YWItY29udGVudF0nKS5zbGlkZVVwKDApLmNzcygnZGlzcGxheScsICcnKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnYScpLm9mZignLnpmLmFjY29yZGlvbicpO1xyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcbkFjY29yZGlvbi5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGFuIGFjY29yZGlvbiBwYW5lLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAyNTBcclxuICAgKi9cclxuICBzbGlkZVNwZWVkOiAyNTAsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIGFjY29yZGlvbiB0byBoYXZlIG11bHRpcGxlIG9wZW4gcGFuZXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgbXVsdGlFeHBhbmQ6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gY2xvc2UgYWxsIHBhbmVzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGFsbG93QWxsQ2xvc2VkOiBmYWxzZVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogQWNjb3JkaW9uTWVudSBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XHJcbiAqL1xyXG5cclxuY2xhc3MgQWNjb3JkaW9uTWVudSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24gbWVudS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnQWNjb3JkaW9uTWVudScpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignQWNjb3JkaW9uTWVudScsIHtcclxuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXHJcbiAgICAgICdTUEFDRSc6ICd0b2dnbGUnLFxyXG4gICAgICAnQVJST1dfUklHSFQnOiAnb3BlbicsXHJcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXHJcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxyXG4gICAgICAnQVJST1dfTEVGVCc6ICdjbG9zZScsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnLFxyXG4gICAgICAnVEFCJzogJ2Rvd24nLFxyXG4gICAgICAnU0hJRlRfVEFCJzogJ3VwJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLm5vdCgnLmlzLWFjdGl2ZScpLnNsaWRlVXAoMCk7Ly8uZmluZCgnYScpLmNzcygncGFkZGluZy1sZWZ0JywgJzFyZW0nKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICdyb2xlJzogJ3RhYmxpc3QnLFxyXG4gICAgICAnYXJpYS1tdWx0aXNlbGVjdGFibGUnOiB0aGlzLm9wdGlvbnMubXVsdGlPcGVuXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLiRtZW51TGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKTtcclxuICAgIHRoaXMuJG1lbnVMaW5rcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciBsaW5rSWQgPSB0aGlzLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcclxuICAgICAgICAgICRlbGVtID0gJCh0aGlzKSxcclxuICAgICAgICAgICRzdWIgPSAkZWxlbS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSxcclxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2MtbWVudScpLFxyXG4gICAgICAgICAgaXNBY3RpdmUgPSAkc3ViLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgJGVsZW0uYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBzdWJJZCxcclxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGlzQWN0aXZlLFxyXG4gICAgICAgICdyb2xlJzogJ3RhYicsXHJcbiAgICAgICAgJ2lkJzogbGlua0lkXHJcbiAgICAgIH0pO1xyXG4gICAgICAkc3ViLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWQsXHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxyXG4gICAgICAgICdyb2xlJzogJ3RhYnBhbmVsJyxcclxuICAgICAgICAnaWQnOiBzdWJJZFxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGluaXRQYW5lcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpO1xyXG4gICAgaWYoaW5pdFBhbmVzLmxlbmd0aCl7XHJcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgIGluaXRQYW5lcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgX3RoaXMuZG93bigkKHRoaXMpKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgbWVudS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgJHN1Ym1lbnUgPSAkKHRoaXMpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xyXG5cclxuICAgICAgaWYgKCRzdWJtZW51Lmxlbmd0aCkge1xyXG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnKS5vbignY2xpY2suemYuYWNjb3JkaW9uTWVudScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICBfdGhpcy50b2dnbGUoJHN1Ym1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb25tZW51JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQsXHJcbiAgICAgICAgICAkdGFyZ2V0ID0gJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XHJcblxyXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSkuZmluZCgnYScpLmZpcnN0KCk7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5taW4oaSsxLCAkZWxlbWVudHMubGVuZ3RoLTEpKS5maW5kKCdhJykuZmlyc3QoKTtcclxuXHJcbiAgICAgICAgICBpZiAoJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBoYXMgb3BlbiBzdWIgbWVudVxyXG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5maW5kKCdsaTpmaXJzdC1jaGlsZCcpLmZpbmQoJ2EnKS5maXJzdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpmaXJzdC1jaGlsZCcpKSB7IC8vIGlzIGZpcnN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcclxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaWYgcHJldmlvdXMgZWxlbWVudCBoYXMgb3BlbiBzdWIgbWVudVxyXG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkcHJldkVsZW1lbnQuZmluZCgnbGk6bGFzdC1jaGlsZCcpLmZpbmQoJ2EnKS5maXJzdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpsYXN0LWNoaWxkJykpIHsgLy8gaXMgbGFzdCBlbGVtZW50IG9mIHN1YiBtZW51XHJcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5uZXh0KCdsaScpLmZpbmQoJ2EnKS5maXJzdCgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uTWVudScsIHtcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHtcclxuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcclxuICAgICAgICAgICAgJHRhcmdldC5maW5kKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0Lmxlbmd0aCAmJiAhJHRhcmdldC5pcygnOmhpZGRlbicpKSB7IC8vIGNsb3NlIGFjdGl2ZSBzdWIgb2YgdGhpcyBpdGVtXHJcbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7IC8vIGNsb3NlIGN1cnJlbnRseSBvcGVuIHN1YlxyXG4gICAgICAgICAgICBfdGhpcy51cCgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykpO1xyXG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZUFsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgYWxsIHBhbmVzIG9mIHRoZSBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGhpZGVBbGwoKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlIHN0YXRlIG9mIGEgc3VibWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIHRoZSBzdWJtZW51IHRvIHRvZ2dsZVxyXG4gICAqL1xyXG4gIHRvZ2dsZSgkdGFyZ2V0KXtcclxuICAgIGlmKCEkdGFyZ2V0LmlzKCc6YW5pbWF0ZWQnKSkge1xyXG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBvcGVuLlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cclxuICAgKi9cclxuICBkb3duKCR0YXJnZXQpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgaWYoIXRoaXMub3B0aW9ucy5tdWx0aU9wZW4pIHtcclxuICAgICAgdGhpcy51cCh0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5ub3QoJHRhcmdldC5wYXJlbnRzVW50aWwodGhpcy4kZWxlbWVudCkuYWRkKCR0YXJnZXQpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KVxyXG4gICAgICAucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XHJcblxyXG4gICAgICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICR0YXJnZXQuc2xpZGVEb3duKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGRvbmUgb3BlbmluZy5cclxuICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I2Rvd25cclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignZG93bi56Zi5hY2NvcmRpb25NZW51JywgWyR0YXJnZXRdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLiBBbGwgc3ViLW1lbnVzIGluc2lkZSB0aGUgdGFyZ2V0IHdpbGwgYmUgY2xvc2VkIGFzIHdlbGwuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBjbG9zZS5cclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSN1cFxyXG4gICAqL1xyXG4gIHVwKCR0YXJnZXQpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGRvbmUgY29sbGFwc2luZyB1cC5cclxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSN1cFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcclxuXHJcbiAgICAkbWVudXMucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rlc3Ryb3llZFxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVEb3duKDApLmNzcygnZGlzcGxheScsICcnKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uTWVudScpO1xyXG5cclxuICAgIEZvdW5kYXRpb24uTmVzdC5CdXJuKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gYW5pbWF0ZSB0aGUgb3BlbmluZyBvZiBhIHN1Ym1lbnUgaW4gbXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDI1MFxyXG4gICAqL1xyXG4gIHNsaWRlU3BlZWQ6IDI1MCxcclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgbWVudSB0byBoYXZlIG11bHRpcGxlIG9wZW4gcGFuZXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBtdWx0aU9wZW46IHRydWVcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKEFjY29yZGlvbk1lbnUsICdBY2NvcmRpb25NZW51Jyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogRHJpbGxkb3duIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyaWxsZG93blxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubmVzdFxyXG4gKi9cclxuXHJcbmNsYXNzIERyaWxsZG93biB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyaWxsZG93biBtZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uIG1lbnUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyaWxsZG93bi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcmlsbGRvd24nKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJpbGxkb3duJyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcmlsbGRvd24nLCB7XHJcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcclxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxyXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXHJcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXHJcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxyXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxyXG4gICAgICAnVEFCJzogJ2Rvd24nLFxyXG4gICAgICAnU0hJRlRfVEFCJzogJ3VwJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgZHJpbGxkb3duIGJ5IGNyZWF0aW5nIGpRdWVyeSBjb2xsZWN0aW9ucyBvZiBlbGVtZW50c1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLiRzdWJtZW51QW5jaG9ycyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJ2EnKTtcclxuICAgIHRoaXMuJHN1Ym1lbnVzID0gdGhpcy4kc3VibWVudUFuY2hvcnMucGFyZW50KCdsaScpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xyXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaScpLm5vdCgnLmpzLWRyaWxsZG93bi1iYWNrJykuYXR0cigncm9sZScsICdtZW51aXRlbScpLmZpbmQoJ2EnKTtcclxuXHJcbiAgICB0aGlzLl9wcmVwYXJlTWVudSgpO1xyXG5cclxuICAgIHRoaXMuX2tleWJvYXJkRXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBwcmVwYXJlcyBkcmlsbGRvd24gbWVudSBieSBzZXR0aW5nIGF0dHJpYnV0ZXMgdG8gbGlua3MgYW5kIGVsZW1lbnRzXHJcbiAgICogc2V0cyBhIG1pbiBoZWlnaHQgdG8gcHJldmVudCBjb250ZW50IGp1bXBpbmdcclxuICAgKiB3cmFwcyB0aGUgZWxlbWVudCBpZiBub3QgYWxyZWFkeSB3cmFwcGVkXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBfcHJlcGFyZU1lbnUoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgLy8gaWYoIXRoaXMub3B0aW9ucy5ob2xkT3Blbil7XHJcbiAgICAvLyAgIHRoaXMuX21lbnVMaW5rRXZlbnRzKCk7XHJcbiAgICAvLyB9XHJcbiAgICB0aGlzLiRzdWJtZW51QW5jaG9ycy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkc3ViID0gJCh0aGlzKTtcclxuICAgICAgdmFyICRsaW5rID0gJHN1Yi5maW5kKCdhOmZpcnN0Jyk7XHJcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMucGFyZW50TGluayl7XHJcbiAgICAgICAgJGxpbmsuY2xvbmUoKS5wcmVwZW5kVG8oJHN1Yi5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSkud3JhcCgnPGxpIGNsYXNzPVwiaXMtc3VibWVudS1wYXJlbnQtaXRlbSBpcy1zdWJtZW51LWl0ZW0gaXMtZHJpbGxkb3duLXN1Ym1lbnUtaXRlbVwiIHJvbGU9XCJtZW51LWl0ZW1cIj48L2xpPicpO1xyXG4gICAgICB9XHJcbiAgICAgICRsaW5rLmRhdGEoJ3NhdmVkSHJlZicsICRsaW5rLmF0dHIoJ2hyZWYnKSkucmVtb3ZlQXR0cignaHJlZicpO1xyXG4gICAgICAkc3ViLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpXHJcbiAgICAgICAgICAuYXR0cih7XHJcbiAgICAgICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXHJcbiAgICAgICAgICAgICd0YWJpbmRleCc6IDAsXHJcbiAgICAgICAgICAgICdyb2xlJzogJ21lbnUnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgX3RoaXMuX2V2ZW50cygkc3ViKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kc3VibWVudXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgJG1lbnUgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJGJhY2sgPSAkbWVudS5maW5kKCcuanMtZHJpbGxkb3duLWJhY2snKTtcclxuICAgICAgaWYoISRiYWNrLmxlbmd0aCl7XHJcbiAgICAgICAgJG1lbnUucHJlcGVuZChfdGhpcy5vcHRpb25zLmJhY2tCdXR0b24pO1xyXG4gICAgICB9XHJcbiAgICAgIF90aGlzLl9iYWNrKCRtZW51KTtcclxuICAgIH0pO1xyXG4gICAgaWYoIXRoaXMuJGVsZW1lbnQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWRyaWxsZG93bicpKXtcclxuICAgICAgdGhpcy4kd3JhcHBlciA9ICQodGhpcy5vcHRpb25zLndyYXBwZXIpLmFkZENsYXNzKCdpcy1kcmlsbGRvd24nKS5jc3ModGhpcy5fZ2V0TWF4RGltcygpKTtcclxuICAgICAgdGhpcy4kZWxlbWVudC53cmFwKHRoaXMuJHdyYXBwZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byBlbGVtZW50cyBpbiB0aGUgbWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IG1lbnUgaXRlbSB0byBhZGQgaGFuZGxlcnMgdG8uXHJcbiAgICovXHJcbiAgX2V2ZW50cygkZWxlbSkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAkZWxlbS5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpXHJcbiAgICAub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICBpZigkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgJ2xpJykuaGFzQ2xhc3MoJ2lzLWRyaWxsZG93bi1zdWJtZW51LXBhcmVudCcpKXtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gaWYoZS50YXJnZXQgIT09IGUuY3VycmVudFRhcmdldC5maXJzdEVsZW1lbnRDaGlsZCl7XHJcbiAgICAgIC8vICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIF90aGlzLl9zaG93KCRlbGVtLnBhcmVudCgnbGknKSk7XHJcblxyXG4gICAgICBpZihfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayl7XHJcbiAgICAgICAgdmFyICRib2R5ID0gJCgnYm9keScpLm5vdChfdGhpcy4kd3JhcHBlcik7XHJcbiAgICAgICAgJGJvZHkub2ZmKCcuemYuZHJpbGxkb3duJykub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgX3RoaXMuX2hpZGVBbGwoKTtcclxuICAgICAgICAgICRib2R5Lm9mZignLnpmLmRyaWxsZG93bicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMga2V5ZG93biBldmVudCBsaXN0ZW5lciB0byBgbGlgJ3MgaW4gdGhlIG1lbnUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfa2V5Ym9hcmRFdmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgXHJcbiAgICB0aGlzLiRtZW51SXRlbXMuYWRkKHRoaXMuJGVsZW1lbnQuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrID4gYScpKS5vbigna2V5ZG93bi56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgXHJcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLmNoaWxkcmVuKCdhJyksXHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQ7XHJcblxyXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSk7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5taW4oaSsxLCAkZWxlbWVudHMubGVuZ3RoLTEpKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0RyaWxsZG93bicsIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50LnBhcmVudCgnbGknKSk7XHJcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykuZmluZCgndWwgbGkgYScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpKTtcclxuICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJykuY2hpbGRyZW4oJ2EnKS5maXJzdCgpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRvd246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJG5leHRFbGVtZW50LmZvY3VzKCk7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5fYmFjaygpO1xyXG4gICAgICAgICAgLy9fdGhpcy4kbWVudUl0ZW1zLmZpcnN0KCkuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoISRlbGVtZW50LmlzKF90aGlzLiRtZW51SXRlbXMpKSB7IC8vIG5vdCBtZW51IGl0ZW0gbWVhbnMgYmFjayBidXR0b25cclxuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKSk7XHJcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpLmNoaWxkcmVuKCdhJykuZmlyc3QoKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgICAgICBcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50LnBhcmVudCgnbGknKSk7XHJcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykuZmluZCgndWwgbGkgYScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pOyAvLyBlbmQga2V5Ym9hcmRBY2Nlc3NcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyBhbGwgb3BlbiBlbGVtZW50cywgYW5kIHJldHVybnMgdG8gcm9vdCBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jY2xvc2VkXHJcbiAgICovXHJcbiAgX2hpZGVBbGwoKSB7XHJcbiAgICB2YXIgJGVsZW0gPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1kcmlsbGRvd24tc3VibWVudS5pcy1hY3RpdmUnKS5hZGRDbGFzcygnaXMtY2xvc2luZycpO1xyXG4gICAgJGVsZW0ub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbSksIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWNsb3NpbmcnKTtcclxuICAgIH0pO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZnVsbHkgY2xvc2VkLlxyXG4gICAgICAgICAqIEBldmVudCBEcmlsbGRvd24jY2xvc2VkXHJcbiAgICAgICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlZC56Zi5kcmlsbGRvd24nKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXIgZm9yIGVhY2ggYGJhY2tgIGJ1dHRvbiwgYW5kIGNsb3NlcyBvcGVuIG1lbnVzLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jYmFja1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IHN1Yi1tZW51IHRvIGFkZCBgYmFja2AgZXZlbnQuXHJcbiAgICovXHJcbiAgX2JhY2soJGVsZW0pIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAkZWxlbS5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpO1xyXG4gICAgJGVsZW0uY2hpbGRyZW4oJy5qcy1kcmlsbGRvd24tYmFjaycpXHJcbiAgICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnbW91c2V1cCBvbiBiYWNrJyk7XHJcbiAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXIgdG8gbWVudSBpdGVtcyB3L28gc3VibWVudXMgdG8gY2xvc2Ugb3BlbiBtZW51cyBvbiBjbGljay5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9tZW51TGlua0V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLiRtZW51SXRlbXMubm90KCcuaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50JylcclxuICAgICAgICAub2ZmKCdjbGljay56Zi5kcmlsbGRvd24nKVxyXG4gICAgICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAvLyBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBfdGhpcy5faGlkZUFsbCgpO1xyXG4gICAgICAgICAgfSwgMCk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgYSBzdWJtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jb3BlblxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gb3BlbiwgaS5lLiB0aGUgYGxpYCB0YWcuXHJcbiAgICovXHJcbiAgX3Nob3coJGVsZW0pIHtcclxuICAgICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29wZW4uemYuZHJpbGxkb3duJywgWyRlbGVtXSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZXMgYSBzdWJtZW51XHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyaWxsZG93biNoaWRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgc3ViLW1lbnUgdG8gaGlkZSwgaS5lLiB0aGUgYHVsYCB0YWcuXHJcbiAgICovXHJcbiAgX2hpZGUoJGVsZW0pIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAkZWxlbS5hZGRDbGFzcygnaXMtY2xvc2luZycpXHJcbiAgICAgICAgIC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAkZWxlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWNsb3NpbmcnKTtcclxuICAgICAgICAgICAkZWxlbS5ibHVyKCk7XHJcbiAgICAgICAgIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzdWJtZW51IGlzIGhhcyBjbG9zZWQuXHJcbiAgICAgKiBAZXZlbnQgRHJpbGxkb3duI2hpZGVcclxuICAgICAqL1xyXG4gICAgJGVsZW0udHJpZ2dlcignaGlkZS56Zi5kcmlsbGRvd24nLCBbJGVsZW1dKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIG5lc3RlZCBtZW51cyB0byBjYWxjdWxhdGUgdGhlIG1pbi1oZWlnaHQsIGFuZCBtYXgtd2lkdGggZm9yIHRoZSBtZW51LlxyXG4gICAqIFByZXZlbnRzIGNvbnRlbnQganVtcGluZy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9nZXRNYXhEaW1zKCkge1xyXG4gICAgdmFyIG1heCA9IDAsIHJlc3VsdCA9IHt9O1xyXG4gICAgdGhpcy4kc3VibWVudXMuYWRkKHRoaXMuJGVsZW1lbnQpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIG51bU9mRWxlbXMgPSAkKHRoaXMpLmNoaWxkcmVuKCdsaScpLmxlbmd0aDtcclxuICAgICAgbWF4ID0gbnVtT2ZFbGVtcyA+IG1heCA/IG51bU9mRWxlbXMgOiBtYXg7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXN1bHRbJ21pbi1oZWlnaHQnXSA9IGAke21heCAqIHRoaXMuJG1lbnVJdGVtc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHR9cHhgO1xyXG4gICAgcmVzdWx0WydtYXgtd2lkdGgnXSA9IGAke3RoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGh9cHhgO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgRHJpbGxkb3duIE1lbnVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5faGlkZUFsbCgpO1xyXG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2RyaWxsZG93bicpO1xyXG4gICAgdGhpcy4kZWxlbWVudC51bndyYXAoKVxyXG4gICAgICAgICAgICAgICAgIC5maW5kKCcuanMtZHJpbGxkb3duLWJhY2ssIC5pcy1zdWJtZW51LXBhcmVudC1pdGVtJykucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgICAuZW5kKCkuZmluZCgnLmlzLWFjdGl2ZSwgLmlzLWNsb3NpbmcsIC5pcy1kcmlsbGRvd24tc3VibWVudScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZyBpcy1kcmlsbGRvd24tc3VibWVudScpXHJcbiAgICAgICAgICAgICAgICAgLmVuZCgpLmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykucmVtb3ZlQXR0cignYXJpYS1oaWRkZW4gdGFiaW5kZXggcm9sZScpXHJcbiAgICAgICAgICAgICAgICAgLm9mZignLnpmLmRyaWxsZG93bicpLmVuZCgpLm9mZignemYuZHJpbGxkb3duJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkbGluayA9ICQodGhpcyk7XHJcbiAgICAgIGlmKCRsaW5rLmRhdGEoJ3NhdmVkSHJlZicpKXtcclxuICAgICAgICAkbGluay5hdHRyKCdocmVmJywgJGxpbmsuZGF0YSgnc2F2ZWRIcmVmJykpLnJlbW92ZURhdGEoJ3NhdmVkSHJlZicpO1xyXG4gICAgICB9ZWxzZXsgcmV0dXJuOyB9XHJcbiAgICB9KTtcclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9O1xyXG59XHJcblxyXG5EcmlsbGRvd24uZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogTWFya3VwIHVzZWQgZm9yIEpTIGdlbmVyYXRlZCBiYWNrIGJ1dHRvbi4gUHJlcGVuZGVkIHRvIHN1Ym1lbnUgbGlzdHMgYW5kIGRlbGV0ZWQgb24gYGRlc3Ryb3lgIG1ldGhvZCwgJ2pzLWRyaWxsZG93bi1iYWNrJyBjbGFzcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICc8XFxsaT48XFxhPkJhY2s8XFwvYT48XFwvbGk+J1xyXG4gICAqL1xyXG4gIGJhY2tCdXR0b246ICc8bGkgY2xhc3M9XCJqcy1kcmlsbGRvd24tYmFja1wiPjxhIHRhYmluZGV4PVwiMFwiPkJhY2s8L2E+PC9saT4nLFxyXG4gIC8qKlxyXG4gICAqIE1hcmt1cCB1c2VkIHRvIHdyYXAgZHJpbGxkb3duIG1lbnUuIFVzZSBhIGNsYXNzIG5hbWUgZm9yIGluZGVwZW5kZW50IHN0eWxpbmc7IHRoZSBKUyBhcHBsaWVkIGNsYXNzOiBgaXMtZHJpbGxkb3duYCBpcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICc8XFxkaXYgY2xhc3M9XCJpcy1kcmlsbGRvd25cIj48XFwvZGl2PidcclxuICAgKi9cclxuICB3cmFwcGVyOiAnPGRpdj48L2Rpdj4nLFxyXG4gIC8qKlxyXG4gICAqIEFkZHMgdGhlIHBhcmVudCBsaW5rIHRvIHRoZSBzdWJtZW51LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIHBhcmVudExpbms6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIHJldHVybiB0byByb290IGxpc3Qgb24gYm9keSBjbGljay5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXHJcbiAgLy8gaG9sZE9wZW46IGZhbHNlXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihEcmlsbGRvd24sICdEcmlsbGRvd24nKTtcclxuXHJcbn0oalF1ZXJ5KTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG4hZnVuY3Rpb24oJCkge1xyXG5cclxuLyoqXHJcbiAqIERyb3Bkb3duIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKi9cclxuXHJcbmNsYXNzIERyb3Bkb3duIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgZHJvcGRvd24uXHJcbiAgICogQGNsYXNzXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duLlxyXG4gICAqICAgICAgICBPYmplY3Qgc2hvdWxkIGJlIG9mIHRoZSBkcm9wZG93biBwYW5lbCwgcmF0aGVyIHRoYW4gaXRzIGFuY2hvci5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bicpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd24nLCB7XHJcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcclxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxyXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcclxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXHJcbiAgICAgICdTSElGVF9UQUInOiAndGFiX2JhY2t3YXJkJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyICRpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcclxuXHJcbiAgICB0aGlzLiRhbmNob3IgPSAkKGBbZGF0YS10b2dnbGU9XCIkeyRpZH1cIl1gKSB8fCAkKGBbZGF0YS1vcGVuPVwiJHskaWR9XCJdYCk7XHJcbiAgICB0aGlzLiRhbmNob3IuYXR0cih7XHJcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogJGlkLFxyXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxyXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcclxuICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxyXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlXHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcclxuICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICdhcmlhLWhpZGRlbic6ICd0cnVlJyxcclxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXHJcbiAgICAgICdkYXRhLXJlc2l6ZSc6ICRpZCxcclxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdkZC1hbmNob3InKVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgY3VycmVudCBvcmllbnRhdGlvbiBvZiBkcm9wZG93biBwYW5lLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHBvc2l0aW9uIC0gc3RyaW5nIHZhbHVlIG9mIGEgcG9zaXRpb24gY2xhc3MuXHJcbiAgICovXHJcbiAgZ2V0UG9zaXRpb25DbGFzcygpIHtcclxuICAgIHZhciB2ZXJ0aWNhbFBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyh0b3B8bGVmdHxyaWdodHxib3R0b20pL2cpO1xyXG4gICAgICAgIHZlcnRpY2FsUG9zaXRpb24gPSB2ZXJ0aWNhbFBvc2l0aW9uID8gdmVydGljYWxQb3NpdGlvblswXSA6ICcnO1xyXG4gICAgdmFyIGhvcml6b250YWxQb3NpdGlvbiA9IC9mbG9hdC0oLispXFxzLy5leGVjKHRoaXMuJGFuY2hvclswXS5jbGFzc05hbWUpO1xyXG4gICAgICAgIGhvcml6b250YWxQb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvblsxXSA6ICcnO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gaG9yaXpvbnRhbFBvc2l0aW9uID8gaG9yaXpvbnRhbFBvc2l0aW9uICsgJyAnICsgdmVydGljYWxQb3NpdGlvbiA6IHZlcnRpY2FsUG9zaXRpb247XHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGp1c3RzIHRoZSBkcm9wZG93biBwYW5lcyBvcmllbnRhdGlvbiBieSBhZGRpbmcvcmVtb3ZpbmcgcG9zaXRpb25pbmcgY2xhc3Nlcy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uIGNsYXNzIHRvIHJlbW92ZS5cclxuICAgKi9cclxuICBfcmVwb3NpdGlvbihwb3NpdGlvbikge1xyXG4gICAgdGhpcy51c2VkUG9zaXRpb25zLnB1c2gocG9zaXRpb24gPyBwb3NpdGlvbiA6ICdib3R0b20nKTtcclxuICAgIC8vZGVmYXVsdCwgdHJ5IHN3aXRjaGluZyB0byBvcHBvc2l0ZSBzaWRlXHJcbiAgICBpZighcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA8IDApKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygndG9wJyk7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA8IDApKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcclxuICAgICAgICAgIC5hZGRDbGFzcygncmlnaHQnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiBkZWZhdWx0IGNoYW5nZSBkaWRuJ3Qgd29yaywgdHJ5IGJvdHRvbSBvciBsZWZ0IGZpcnN0XHJcbiAgICBlbHNlIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcclxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xyXG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1cclxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXHJcbiAgICBlbHNle1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcclxuICAgIHRoaXMuY291bnRlci0tO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSBkcm9wZG93biBwYW5lLCBjaGVja3MgZm9yIGNvbGxpc2lvbnMuXHJcbiAgICogUmVjdXJzaXZlbHkgY2FsbHMgaXRzZWxmIGlmIGEgY29sbGlzaW9uIGlzIGRldGVjdGVkLCB3aXRoIGEgbmV3IHBvc2l0aW9uIGNsYXNzLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldFBvc2l0aW9uKCkge1xyXG4gICAgaWYodGhpcy4kYW5jaG9yLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ2ZhbHNlJyl7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCksXHJcbiAgICAgICAgJGVsZURpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxyXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRhbmNob3IpLFxyXG4gICAgICAgIF90aGlzID0gdGhpcyxcclxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcclxuICAgICAgICBwYXJhbSA9IChkaXJlY3Rpb24gPT09ICd0b3AnKSA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcclxuICAgICAgICBvZmZzZXQgPSAocGFyYW0gPT09ICdoZWlnaHQnKSA/IHRoaXMub3B0aW9ucy52T2Zmc2V0IDogdGhpcy5vcHRpb25zLmhPZmZzZXQ7XHJcblxyXG5cclxuXHJcbiAgICBpZigoJGVsZURpbXMud2lkdGggPj0gJGVsZURpbXMud2luZG93RGltcy53aWR0aCkgfHwgKCF0aGlzLmNvdW50ZXIgJiYgIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCkpKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcclxuICAgICAgICAnd2lkdGgnOiAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICogMiksXHJcbiAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsIHBvc2l0aW9uLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQpKTtcclxuXHJcbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50LCBmYWxzZSwgdHJ1ZSkgJiYgdGhpcy5jb3VudGVyKXtcclxuICAgICAgdGhpcy5fcmVwb3NpdGlvbihwb3NpdGlvbik7XHJcbiAgICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgZWxlbWVudCB1dGlsaXppbmcgdGhlIHRyaWdnZXJzIHV0aWxpdHkgbGlicmFyeS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XHJcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcclxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXHJcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXHJcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fc2V0UG9zaXRpb24uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmhvdmVyKXtcclxuICAgICAgdGhpcy4kYW5jaG9yLm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcclxuICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICBfdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIHRydWUpO1xyXG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xyXG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5ob3ZlclBhbmUpe1xyXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxyXG4gICAgICAgICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XHJcblxyXG4gICAgICB2YXIgJHRhcmdldCA9ICQodGhpcyksXHJcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcclxuXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bicsIHtcclxuICAgICAgICB0YWJfZm9yd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKSkpIHsgLy8gbGVmdCBtb2RhbCBkb3dud2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxyXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHsgLy8gaWYgZm9jdXMgaXMgbm90IHRyYXBwZWQsIGNsb3NlIGRyb3Bkb3duIG9uIGZvY3VzIG91dFxyXG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHRhYl9iYWNrd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCBfdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxyXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgtMSkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGlmIGZvY3VzIGlzIG5vdCB0cmFwcGVkLCBjbG9zZSBkcm9wZG93biBvbiBmb2N1cyBvdXRcclxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKF90aGlzLiRhbmNob3IpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcclxuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xyXG4gICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSkubm90KHRoaXMuJGVsZW1lbnQpLFxyXG4gICAgICAgICBfdGhpcyA9IHRoaXM7XHJcbiAgICAgJGJvZHkub2ZmKCdjbGljay56Zi5kcm9wZG93bicpXHJcbiAgICAgICAgICAub24oJ2NsaWNrLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgIGlmKF90aGlzLiRhbmNob3IuaXMoZS50YXJnZXQpIHx8IF90aGlzLiRhbmNob3IuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKF90aGlzLiRlbGVtZW50LmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJyk7XHJcbiAgICAgICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIHRoZSBkcm9wZG93biBwYW5lLCBhbmQgZmlyZXMgYSBidWJibGluZyBldmVudCB0byBjbG9zZSBvdGhlciBkcm9wZG93bnMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyb3Bkb3duI2Nsb3NlbWVcclxuICAgKiBAZmlyZXMgRHJvcGRvd24jc2hvd1xyXG4gICAqL1xyXG4gIG9wZW4oKSB7XHJcbiAgICAvLyB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBvdGhlciBvcGVuIGRyb3Bkb3duc1xyXG4gICAgICogQGV2ZW50IERyb3Bkb3duI2Nsb3NlbWVcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLmRyb3Bkb3duJywgdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpKTtcclxuICAgIHRoaXMuJGFuY2hvci5hZGRDbGFzcygnaG92ZXInKVxyXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcclxuICAgIC8vIHRoaXMuJGVsZW1lbnQvKi5zaG93KCkqLztcclxuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcclxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKXtcclxuICAgICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XHJcbiAgICAgIGlmKCRmb2N1c2FibGUubGVuZ3RoKXtcclxuICAgICAgICAkZm9jdXNhYmxlLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgb25jZSB0aGUgZHJvcGRvd24gaXMgdmlzaWJsZS5cclxuICAgICAqIEBldmVudCBEcm9wZG93biNzaG93XHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIG9wZW4gZHJvcGRvd24gcGFuZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJvcGRvd24jaGlkZVxyXG4gICAqL1xyXG4gIGNsb3NlKCkge1xyXG4gICAgaWYoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSl7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKVxyXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSk7XHJcblxyXG4gICAgdGhpcy4kYW5jaG9yLnJlbW92ZUNsYXNzKCdob3ZlcicpXHJcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XHJcblxyXG4gICAgaWYodGhpcy5jbGFzc0NoYW5nZWQpe1xyXG4gICAgICB2YXIgY3VyUG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xyXG4gICAgICBpZihjdXJQb3NpdGlvbkNsYXNzKXtcclxuICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGN1clBvc2l0aW9uQ2xhc3MpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MpXHJcbiAgICAgICAgICAvKi5oaWRlKCkqLy5jc3Moe2hlaWdodDogJycsIHdpZHRoOiAnJ30pO1xyXG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmNvdW50ZXIgPSA0O1xyXG4gICAgICB0aGlzLnVzZWRQb3NpdGlvbnMubGVuZ3RoID0gMDtcclxuICAgIH1cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBkcm9wZG93biBwYW5lJ3MgdmlzaWJpbGl0eS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICB0b2dnbGUoKSB7XHJcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xyXG4gICAgICBpZih0aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInKSkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlcicpLmhpZGUoKTtcclxuICAgIHRoaXMuJGFuY2hvci5vZmYoJy56Zi5kcm9wZG93bicpO1xyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcbkRyb3Bkb3duLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAyNTBcclxuICAgKi9cclxuICBob3ZlckRlbGF5OiAyNTAsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgc3VibWVudXMgdG8gb3BlbiBvbiBob3ZlciBldmVudHNcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBob3ZlcjogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogRG9uJ3QgY2xvc2UgZHJvcGRvd24gd2hlbiBob3ZlcmluZyBvdmVyIGRyb3Bkb3duIHBhbmVcclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGhvdmVyUGFuZTogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDFcclxuICAgKi9cclxuICB2T2Zmc2V0OiAxLFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxXHJcbiAgICovXHJcbiAgaE9mZnNldDogMSxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGFkanVzdCBvcGVuIHBvc2l0aW9uLiBKUyB3aWxsIHRlc3QgYW5kIGZpbGwgdGhpcyBpbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3RvcCdcclxuICAgKi9cclxuICBwb3NpdGlvbkNsYXNzOiAnJyxcclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHRyYXAgZm9jdXMgdG8gdGhlIGRyb3Bkb3duIHBhbmUgaWYgb3BlbmVkIHdpdGgga2V5Ym9hcmQgY29tbWFuZHMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgdHJhcEZvY3VzOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHNldCBmb2N1cyB0byB0aGUgZmlyc3QgZm9jdXNhYmxlIGVsZW1lbnQgd2l0aGluIHRoZSBwYW5lLCByZWdhcmRsZXNzIG9mIG1ldGhvZCBvZiBvcGVuaW5nLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keSB0byBjbG9zZSB0aGUgZHJvcGRvd24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgY2xvc2VPbkNsaWNrOiBmYWxzZVxyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93biwgJ0Ryb3Bkb3duJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogRHJvcGRvd25NZW51IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duLW1lbnVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcclxuICovXHJcblxyXG5jbGFzcyBEcm9wZG93bk1lbnUge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRHJvcGRvd25NZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjaW5pdFxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcm9wZG93bk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bk1lbnUnKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duTWVudScsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiwgYW5kIGNhbGxzIF9wcmVwYXJlTWVudVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgc3VicyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKCdmaXJzdC1zdWInKTtcclxuXHJcbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcclxuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XHJcbiAgICB0aGlzLiR0YWJzLmZpbmQoJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudmVydGljYWxDbGFzcyk7XHJcblxyXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnJpZ2h0Q2xhc3MpIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdyaWdodCcgfHwgRm91bmRhdGlvbi5ydGwoKSB8fCB0aGlzLiRlbGVtZW50LnBhcmVudHMoJy50b3AtYmFyLXJpZ2h0JykuaXMoJyonKSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ3JpZ2h0JztcclxuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtbGVmdCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byBlbGVtZW50cyB3aXRoaW4gdGhlIG1lbnVcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGhhc1RvdWNoID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IHx8ICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCAhPT0gJ3VuZGVmaW5lZCcpLFxyXG4gICAgICAgIHBhckNsYXNzID0gJ2lzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JztcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3BlbiB8fCBoYXNUb3VjaCkge1xyXG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaHN0YXJ0LnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgJGVsZW0gPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgYC4ke3BhckNsYXNzfWApLFxyXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyksXHJcbiAgICAgICAgICAgIGhhc0NsaWNrZWQgPSAkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyxcclxuICAgICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpO1xyXG5cclxuICAgICAgICBpZiAoaGFzU3ViKSB7XHJcbiAgICAgICAgICBpZiAoaGFzQ2xpY2tlZCkge1xyXG4gICAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrIHx8ICghX3RoaXMub3B0aW9ucy5jbGlja09wZW4gJiYgIWhhc1RvdWNoKSB8fCAoX3RoaXMub3B0aW9ucy5mb3JjZUZvbGxvdyAmJiBoYXNUb3VjaCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKSk7XHJcbiAgICAgICAgICAgICRlbGVtLmFkZCgkZWxlbS5wYXJlbnRzVW50aWwoX3RoaXMuJGVsZW1lbnQsIGAuJHtwYXJDbGFzc31gKSkuYXR0cignZGF0YS1pcy1jbGljaycsIHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcclxuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcclxuXHJcbiAgICAgICAgaWYgKGhhc1N1Yikge1xyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcclxuICAgICAgICAgIF90aGlzLmRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xyXG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XHJcbiAgICAgICAgaWYgKGhhc1N1YiAmJiBfdGhpcy5vcHRpb25zLmF1dG9jbG9zZSkge1xyXG4gICAgICAgICAgaWYgKCRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnICYmIF90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XHJcbiAgICAgICAgICBfdGhpcy5kZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcclxuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRtZW51SXRlbXMub24oJ2tleWRvd24uemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgJ1tyb2xlPVwibWVudWl0ZW1cIl0nKSxcclxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXHJcbiAgICAgICAgICAkZWxlbWVudHMgPSBpc1RhYiA/IF90aGlzLiR0YWJzIDogJGVsZW1lbnQuc2libGluZ3MoJ2xpJykuYWRkKCRlbGVtZW50KSxcclxuICAgICAgICAgICRwcmV2RWxlbWVudCxcclxuICAgICAgICAgICRuZXh0RWxlbWVudDtcclxuXHJcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShpLTEpO1xyXG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGkrMSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBuZXh0U2libGluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghJGVsZW1lbnQuaXMoJzpsYXN0LWNoaWxkJykpICRuZXh0RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XHJcbiAgICAgIH0sIHByZXZTaWJsaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJHByZXZFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgfSwgb3BlblN1YiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcclxuICAgICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcclxuICAgICAgICAgIF90aGlzLl9zaG93KCRzdWIpO1xyXG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgICB9IGVsc2UgeyByZXR1cm47IH1cclxuICAgICAgfSwgY2xvc2VTdWIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvL2lmICgkZWxlbWVudC5pcygnOmZpcnN0LWNoaWxkJykpIHtcclxuICAgICAgICB2YXIgY2xvc2UgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpO1xyXG4gICAgICAgICAgY2xvc2UuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xyXG4gICAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICB9O1xyXG4gICAgICB2YXIgZnVuY3Rpb25zID0ge1xyXG4gICAgICAgIG9wZW46IG9wZW5TdWIsXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuX2hpZGUoX3RoaXMuJGVsZW1lbnQpO1xyXG4gICAgICAgICAgX3RoaXMuJG1lbnVJdGVtcy5maW5kKCdhOmZpcnN0JykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChpc1RhYikge1xyXG4gICAgICAgIGlmIChfdGhpcy52ZXJ0aWNhbCkgeyAvLyB2ZXJ0aWNhbCBtZW51XHJcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JykgeyAvLyBsZWZ0IGFsaWduZWRcclxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XHJcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXHJcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxyXG4gICAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXHJcbiAgICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgYWxpZ25lZFxyXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcclxuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcclxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXHJcbiAgICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXHJcbiAgICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gaG9yaXpvbnRhbCBtZW51XHJcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcclxuICAgICAgICAgICAgbmV4dDogbmV4dFNpYmxpbmcsXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBwcmV2U2libGluZyxcclxuICAgICAgICAgICAgZG93bjogb3BlblN1YixcclxuICAgICAgICAgICAgdXA6IGNsb3NlU3ViXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7IC8vIG5vdCB0YWJzIC0+IG9uZSBzdWJcclxuICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JykgeyAvLyBsZWZ0IGFsaWduZWRcclxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xyXG4gICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxyXG4gICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWIsXHJcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxyXG4gICAgICAgICAgICB1cDogcHJldlNpYmxpbmdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIHJpZ2h0IGFsaWduZWRcclxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xyXG4gICAgICAgICAgICBuZXh0OiBjbG9zZVN1YixcclxuICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWIsXHJcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxyXG4gICAgICAgICAgICB1cDogcHJldlNpYmxpbmdcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd25NZW51JywgZnVuY3Rpb25zKTtcclxuXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfYWRkQm9keUhhbmRsZXIoKSB7XHJcbiAgICB2YXIgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpLFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JylcclxuICAgICAgICAgLm9uKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XHJcbiAgICAgICAgICAgaWYgKCRsaW5rLmxlbmd0aCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgX3RoaXMuX2hpZGUoKTtcclxuICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpO1xyXG4gICAgICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE9wZW5zIGEgZHJvcGRvd24gcGFuZSwgYW5kIGNoZWNrcyBmb3IgY29sbGlzaW9ucyBmaXJzdC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHN1YiAtIHVsIGVsZW1lbnQgdGhhdCBpcyBhIHN1Ym1lbnUgdG8gc2hvd1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNzaG93XHJcbiAgICovXHJcbiAgX3Nob3coJHN1Yikge1xyXG4gICAgdmFyIGlkeCA9IHRoaXMuJHRhYnMuaW5kZXgodGhpcy4kdGFicy5maWx0ZXIoZnVuY3Rpb24oaSwgZWwpIHtcclxuICAgICAgcmV0dXJuICQoZWwpLmZpbmQoJHN1YikubGVuZ3RoID4gMDtcclxuICAgIH0pKTtcclxuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xyXG4gICAgdGhpcy5faGlkZSgkc2licywgaWR4KTtcclxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXHJcbiAgICAgICAgLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJylcclxuICAgICAgICAuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XHJcbiAgICB2YXIgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xyXG4gICAgaWYgKCFjbGVhcikge1xyXG4gICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAnLXJpZ2h0JyA6ICctbGVmdCcsXHJcbiAgICAgICAgICAkcGFyZW50TGkgPSAkc3ViLnBhcmVudCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XHJcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMke29sZENsYXNzfWApLmFkZENsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCk7XHJcbiAgICAgIGNsZWFyID0gRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSgkc3ViLCBudWxsLCB0cnVlKTtcclxuICAgICAgaWYgKCFjbGVhcikge1xyXG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICAkc3ViLmNzcygndmlzaWJpbGl0eScsICcnKTtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7IHRoaXMuX2FkZEJvZHlIYW5kbGVyKCk7IH1cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbmV3IGRyb3Bkb3duIHBhbmUgaXMgdmlzaWJsZS5cclxuICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjc2hvd1xyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Nob3cuemYuZHJvcGRvd25tZW51JywgWyRzdWJdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhpZGVzIGEgc2luZ2xlLCBjdXJyZW50bHkgb3BlbiBkcm9wZG93biBwYW5lLCBpZiBwYXNzZWQgYSBwYXJhbWV0ZXIsIG90aGVyd2lzZSwgaGlkZXMgZXZlcnl0aGluZy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSBlbGVtZW50IHdpdGggYSBzdWJtZW51IHRvIGhpZGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlICR0YWJzIGNvbGxlY3Rpb24gdG8gaGlkZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2hpZGUoJGVsZW0sIGlkeCkge1xyXG4gICAgdmFyICR0b0Nsb3NlO1xyXG4gICAgaWYgKCRlbGVtICYmICRlbGVtLmxlbmd0aCkge1xyXG4gICAgICAkdG9DbG9zZSA9ICRlbGVtO1xyXG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAkdG9DbG9zZSA9IHRoaXMuJHRhYnMubm90KGZ1bmN0aW9uKGksIGVsKSB7XHJcbiAgICAgICAgcmV0dXJuIGkgPT09IGlkeDtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xyXG4gICAgfVxyXG4gICAgdmFyIHNvbWV0aGluZ1RvQ2xvc2UgPSAkdG9DbG9zZS5oYXNDbGFzcygnaXMtYWN0aXZlJykgfHwgJHRvQ2xvc2UuZmluZCgnLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDA7XHJcblxyXG4gICAgaWYgKHNvbWV0aGluZ1RvQ2xvc2UpIHtcclxuICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtYWN0aXZlJykuYWRkKCR0b0Nsb3NlKS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxyXG4gICAgICAgICdkYXRhLWlzLWNsaWNrJzogZmFsc2VcclxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgICAgJHRvQ2xvc2UuZmluZCgndWwuanMtZHJvcGRvd24tYWN0aXZlJykuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZVxyXG4gICAgICB9KS5yZW1vdmVDbGFzcygnanMtZHJvcGRvd24tYWN0aXZlJyk7XHJcblxyXG4gICAgICBpZiAodGhpcy5jaGFuZ2VkIHx8ICR0b0Nsb3NlLmZpbmQoJ29wZW5zLWlubmVyJykubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcclxuICAgICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZCgkdG9DbG9zZSlcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhgb3BlbnMtaW5uZXIgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYG9wZW5zLSR7b2xkQ2xhc3N9YCk7XHJcbiAgICAgICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9wZW4gbWVudXMgYXJlIGNsb3NlZC5cclxuICAgICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNoaWRlXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd25tZW51JywgWyR0b0Nsb3NlXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgcGx1Z2luLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRtZW51SXRlbXMub2ZmKCcuemYuZHJvcGRvd25tZW51JykucmVtb3ZlQXR0cignZGF0YS1pcy1jbGljaycpXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy1yaWdodC1hcnJvdyBpcy1sZWZ0LWFycm93IGlzLWRvd24tYXJyb3cgb3BlbnMtcmlnaHQgb3BlbnMtbGVmdCBvcGVucy1pbm5lcicpO1xyXG4gICAgJChkb2N1bWVudC5ib2R5KS5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKTtcclxuICAgIEZvdW5kYXRpb24uTmVzdC5CdXJuKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxyXG4gKi9cclxuRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIERpc2FsbG93cyBob3ZlciBldmVudHMgZnJvbSBvcGVuaW5nIHN1Ym1lbnVzXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gYXV0b21hdGljYWxseSBjbG9zZSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQsIGlmIG5vdCBjbGlja2VkIG9wZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBhdXRvY2xvc2U6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwXHJcbiAgICovXHJcbiAgaG92ZXJEZWxheTogNTAsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIG9wZW4vcmVtYWluIG9wZW4gb24gcGFyZW50IGNsaWNrIGV2ZW50LiBBbGxvd3MgY3Vyc29yIHRvIG1vdmUgYXdheSBmcm9tIG1lbnUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBjbGlja09wZW46IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IGNsb3NpbmcgYSBzdWJtZW51IG9uIGEgbW91c2VsZWF2ZSBldmVudC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgNTAwXHJcbiAgICovXHJcblxyXG4gIGNsb3NpbmdUaW1lOiA1MDAsXHJcbiAgLyoqXHJcbiAgICogUG9zaXRpb24gb2YgdGhlIG1lbnUgcmVsYXRpdmUgdG8gd2hhdCBkaXJlY3Rpb24gdGhlIHN1Ym1lbnVzIHNob3VsZCBvcGVuLiBIYW5kbGVkIGJ5IEpTLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnbGVmdCdcclxuICAgKi9cclxuICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAvKipcclxuICAgKiBBbGxvdyBjbGlja3Mgb24gdGhlIGJvZHkgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBjbG9zZU9uQ2xpY2s6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgYXBwbGllZCB0byB2ZXJ0aWNhbCBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGB2ZXJ0aWNhbGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAndmVydGljYWwnXHJcbiAgICovXHJcbiAgdmVydGljYWxDbGFzczogJ3ZlcnRpY2FsJyxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHJpZ2h0LXNpZGUgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgYWxpZ24tcmlnaHRgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2FsaWduLXJpZ2h0J1xyXG4gICAqL1xyXG4gIHJpZ2h0Q2xhc3M6ICdhbGlnbi1yaWdodCcsXHJcbiAgLyoqXHJcbiAgICogQm9vbGVhbiB0byBmb3JjZSBvdmVyaWRlIHRoZSBjbGlja2luZyBvZiBsaW5rcyB0byBwZXJmb3JtIGRlZmF1bHQgYWN0aW9uLCBvbiBzZWNvbmQgdG91Y2ggZXZlbnQgZm9yIG1vYmlsZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBmb3JjZUZvbGxvdzogdHJ1ZVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd25NZW51LCAnRHJvcGRvd25NZW51Jyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogRXF1YWxpemVyIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmVxdWFsaXplclxyXG4gKi9cclxuXHJcbmNsYXNzIEVxdWFsaXplciB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBFcXVhbGl6ZXIuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEVxdWFsaXplciNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucyl7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgRXF1YWxpemVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0VxdWFsaXplcicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEVxdWFsaXplciBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgZXF1YWxpemVyIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHZhciBlcUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWVxdWFsaXplcicpIHx8ICcnO1xyXG4gICAgdmFyICR3YXRjaGVkID0gdGhpcy4kZWxlbWVudC5maW5kKGBbZGF0YS1lcXVhbGl6ZXItd2F0Y2g9XCIke2VxSWR9XCJdYCk7XHJcblxyXG4gICAgdGhpcy4kd2F0Y2hlZCA9ICR3YXRjaGVkLmxlbmd0aCA/ICR3YXRjaGVkIDogdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXItd2F0Y2hdJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtcmVzaXplJywgKGVxSWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnZXEnKSkpO1xyXG5cclxuICAgIHRoaXMuaGFzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcclxuICAgIHRoaXMuaXNOZXN0ZWQgPSB0aGlzLiRlbGVtZW50LnBhcmVudHNVbnRpbChkb2N1bWVudC5ib2R5LCAnW2RhdGEtZXF1YWxpemVyXScpLmxlbmd0aCA+IDA7XHJcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcclxuXHJcbiAgICB2YXIgaW1ncyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW1nJyk7XHJcbiAgICB2YXIgdG9vU21hbGw7XHJcbiAgICBpZih0aGlzLm9wdGlvbnMuZXF1YWxpemVPbil7XHJcbiAgICAgIHRvb1NtYWxsID0gdGhpcy5fY2hlY2tNUSgpO1xyXG4gICAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX2NoZWNrTVEuYmluZCh0aGlzKSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgICB9XHJcbiAgICBpZigodG9vU21hbGwgIT09IHVuZGVmaW5lZCAmJiB0b29TbWFsbCA9PT0gZmFsc2UpIHx8IHRvb1NtYWxsID09PSB1bmRlZmluZWQpe1xyXG4gICAgICBpZihpbWdzLmxlbmd0aCl7XHJcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZChpbWdzLCB0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSk7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuX3JlZmxvdygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGV2ZW50IGxpc3RlbmVycyBpZiB0aGUgYnJlYWtwb2ludCBpcyB0b28gc21hbGwuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcGF1c2VFdmVudHMoKSB7XHJcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYuZXF1YWxpemVyIHJlc2l6ZW1lLnpmLnRyaWdnZXInKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgRXF1YWxpemVyLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2V2ZW50cygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xyXG4gICAgaWYodGhpcy5oYXNOZXN0ZWQpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGlmKGUudGFyZ2V0ICE9PSBfdGhpcy4kZWxlbWVudFswXSl7IF90aGlzLl9yZWZsb3coKTsgfVxyXG4gICAgICB9KTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgdGhpcy5fcmVmbG93LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5pc09uID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBicmVha3BvaW50IHRvIHRoZSBtaW5pbXVtIHJlcXVpcmVkIHNpemUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfY2hlY2tNUSgpIHtcclxuICAgIHZhciB0b29TbWFsbCA9ICFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuZXF1YWxpemVPbik7XHJcbiAgICBpZih0b29TbWFsbCl7XHJcbiAgICAgIGlmKHRoaXMuaXNPbil7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcclxuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgIGlmKCF0aGlzLmlzT24pe1xyXG4gICAgICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG9vU21hbGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIG5vb3AgdmVyc2lvbiBmb3IgdGhlIHBsdWdpblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2tpbGxzd2l0Y2goKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBFcXVhbGl6ZXIgdXBvbiBET00gY2hhbmdlXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcmVmbG93KCkge1xyXG4gICAgaWYoIXRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uU3RhY2spe1xyXG4gICAgICBpZih0aGlzLl9pc1N0YWNrZWQoKSl7XHJcbiAgICAgICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmVxdWFsaXplQnlSb3cpIHtcclxuICAgICAgdGhpcy5nZXRIZWlnaHRzQnlSb3codGhpcy5hcHBseUhlaWdodEJ5Um93LmJpbmQodGhpcykpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuZ2V0SGVpZ2h0cyh0aGlzLmFwcGx5SGVpZ2h0LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTWFudWFsbHkgZGV0ZXJtaW5lcyBpZiB0aGUgZmlyc3QgMiBlbGVtZW50cyBhcmUgKk5PVCogc3RhY2tlZC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pc1N0YWNrZWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kd2F0Y2hlZFswXS5vZmZzZXRUb3AgIT09IHRoaXMuJHdhdGNoZWRbMV0ub2Zmc2V0VG9wO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cclxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGhlaWdodHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyXHJcbiAgICovXHJcbiAgZ2V0SGVpZ2h0cyhjYikge1xyXG4gICAgdmFyIGhlaWdodHMgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xyXG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcclxuICAgICAgaGVpZ2h0cy5wdXNoKHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0KTtcclxuICAgIH1cclxuICAgIGNiKGhlaWdodHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cclxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGdyb3VwcyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXIgZ3JvdXBlZCBieSByb3cgd2l0aCBlbGVtZW50LGhlaWdodCBhbmQgbWF4IGFzIGxhc3QgY2hpbGRcclxuICAgKi9cclxuICBnZXRIZWlnaHRzQnlSb3coY2IpIHtcclxuICAgIHZhciBsYXN0RWxUb3BPZmZzZXQgPSAodGhpcy4kd2F0Y2hlZC5sZW5ndGggPyB0aGlzLiR3YXRjaGVkLmZpcnN0KCkub2Zmc2V0KCkudG9wIDogMCksXHJcbiAgICAgICAgZ3JvdXBzID0gW10sXHJcbiAgICAgICAgZ3JvdXAgPSAwO1xyXG4gICAgLy9ncm91cCBieSBSb3dcclxuICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xyXG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcclxuICAgICAgLy9tYXliZSBjb3VsZCB1c2UgdGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRUb3BcclxuICAgICAgdmFyIGVsT2Zmc2V0VG9wID0gJCh0aGlzLiR3YXRjaGVkW2ldKS5vZmZzZXQoKS50b3A7XHJcbiAgICAgIGlmIChlbE9mZnNldFRvcCE9bGFzdEVsVG9wT2Zmc2V0KSB7XHJcbiAgICAgICAgZ3JvdXArKztcclxuICAgICAgICBncm91cHNbZ3JvdXBdID0gW107XHJcbiAgICAgICAgbGFzdEVsVG9wT2Zmc2V0PWVsT2Zmc2V0VG9wO1xyXG4gICAgICB9XHJcbiAgICAgIGdyb3Vwc1tncm91cF0ucHVzaChbdGhpcy4kd2F0Y2hlZFtpXSx0aGlzLiR3YXRjaGVkW2ldLm9mZnNldEhlaWdodF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGogPSAwLCBsbiA9IGdyb3Vwcy5sZW5ndGg7IGogPCBsbjsgaisrKSB7XHJcbiAgICAgIHZhciBoZWlnaHRzID0gJChncm91cHNbal0pLm1hcChmdW5jdGlvbigpeyByZXR1cm4gdGhpc1sxXTsgfSkuZ2V0KCk7XHJcbiAgICAgIHZhciBtYXggICAgICAgICA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xyXG4gICAgICBncm91cHNbal0ucHVzaChtYXgpO1xyXG4gICAgfVxyXG4gICAgY2IoZ3JvdXBzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0XHJcbiAgICogQHBhcmFtIHthcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxyXG4gICAqL1xyXG4gIGFwcGx5SGVpZ2h0KGhlaWdodHMpIHtcclxuICAgIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIGFyZSBhcHBsaWVkXHJcbiAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3ByZWVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcclxuXHJcbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgbWF4KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcclxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxyXG4gICAgICovXHJcbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3QgYnkgcm93XHJcbiAgICogQHBhcmFtIHthcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXHJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRSb3dcclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRSb3dcclxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcclxuICAgKi9cclxuICBhcHBseUhlaWdodEJ5Um93KGdyb3Vwcykge1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZ3JvdXBzLmxlbmd0aDsgaSA8IGxlbiA7IGkrKykge1xyXG4gICAgICB2YXIgZ3JvdXBzSUxlbmd0aCA9IGdyb3Vwc1tpXS5sZW5ndGgsXHJcbiAgICAgICAgICBtYXggPSBncm91cHNbaV1bZ3JvdXBzSUxlbmd0aCAtIDFdO1xyXG4gICAgICBpZiAoZ3JvdXBzSUxlbmd0aDw9Mikge1xyXG4gICAgICAgICQoZ3JvdXBzW2ldWzBdWzBdKS5jc3MoeydoZWlnaHQnOidhdXRvJ30pO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcbiAgICAgIC8qKlxyXG4gICAgICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIHBlciByb3cgYXJlIGFwcGxpZWRcclxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkUm93XHJcbiAgICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWRyb3cuemYuZXF1YWxpemVyJyk7XHJcbiAgICAgIGZvciAodmFyIGogPSAwLCBsZW5KID0gKGdyb3Vwc0lMZW5ndGgtMSk7IGogPCBsZW5KIDsgaisrKSB7XHJcbiAgICAgICAgJChncm91cHNbaV1bal1bMF0pLmNzcyh7J2hlaWdodCc6bWF4fSk7XHJcbiAgICAgIH1cclxuICAgICAgLyoqXHJcbiAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIHBlciByb3cgaGF2ZSBiZWVuIGFwcGxpZWRcclxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xyXG4gICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxyXG4gICAgICovXHJcbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xyXG4gICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxyXG4gKi9cclxuRXF1YWxpemVyLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEVuYWJsZSBoZWlnaHQgZXF1YWxpemF0aW9uIHdoZW4gc3RhY2tlZCBvbiBzbWFsbGVyIHNjcmVlbnMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBlcXVhbGl6ZU9uU3RhY2s6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gcm93IGJ5IHJvdy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBlcXVhbGl6ZUJ5Um93OiBmYWxzZSxcclxuICAvKipcclxuICAgKiBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSB0aGUgcGx1Z2luIHNob3VsZCBlcXVhbGl6ZSBoZWlnaHRzIG9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xyXG4gICAqL1xyXG4gIGVxdWFsaXplT246ICcnXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihFcXVhbGl6ZXIsICdFcXVhbGl6ZXInKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcmNoYW5nZSBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5pbnRlcmNoYW5nZVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXHJcbiAqL1xyXG5cclxuY2xhc3MgSW50ZXJjaGFuZ2Uge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgSW50ZXJjaGFuZ2UuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEludGVyY2hhbmdlI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBJbnRlcmNoYW5nZS5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICB0aGlzLnJ1bGVzID0gW107XHJcbiAgICB0aGlzLmN1cnJlbnRQYXRoID0gJyc7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnSW50ZXJjaGFuZ2UnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBJbnRlcmNoYW5nZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgaW50ZXJjaGFuZ2UgZnVuY3Rpb25pbmcgb24gbG9hZC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdGhpcy5fYWRkQnJlYWtwb2ludHMoKTtcclxuICAgIHRoaXMuX2dlbmVyYXRlUnVsZXMoKTtcclxuICAgIHRoaXMuX3JlZmxvdygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBJbnRlcmNoYW5nZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5pbnRlcmNoYW5nZScsIEZvdW5kYXRpb24udXRpbC50aHJvdHRsZSh0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSwgNTApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEludGVyY2hhbmdlIHVwb24gRE9NIGNoYW5nZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3JlZmxvdygpIHtcclxuICAgIHZhciBtYXRjaDtcclxuXHJcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlLCBidXQgb25seSBzYXZlIHRoZSBsYXN0IG1hdGNoXHJcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucnVsZXMpIHtcclxuICAgICAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2ldO1xyXG5cclxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHJ1bGUucXVlcnkpLm1hdGNoZXMpIHtcclxuICAgICAgICBtYXRjaCA9IHJ1bGU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgdGhpcy5yZXBsYWNlKG1hdGNoLnBhdGgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgRm91bmRhdGlvbiBicmVha3BvaW50cyBhbmQgYWRkcyB0aGVtIHRvIHRoZSBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgb2JqZWN0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2FkZEJyZWFrcG9pbnRzKCkge1xyXG4gICAgZm9yICh2YXIgaSBpbiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcykge1xyXG4gICAgICB2YXIgcXVlcnkgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllc1tpXTtcclxuICAgICAgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5Lm5hbWVdID0gcXVlcnkudmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3MgdGhlIEludGVyY2hhbmdlIGVsZW1lbnQgZm9yIHRoZSBwcm92aWRlZCBtZWRpYSBxdWVyeSArIGNvbnRlbnQgcGFpcmluZ3NcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0aGF0IGlzIGFuIEludGVyY2hhbmdlIGluc3RhbmNlXHJcbiAgICogQHJldHVybnMge0FycmF5fSBzY2VuYXJpb3MgLSBBcnJheSBvZiBvYmplY3RzIHRoYXQgaGF2ZSAnbXEnIGFuZCAncGF0aCcga2V5cyB3aXRoIGNvcnJlc3BvbmRpbmcga2V5c1xyXG4gICAqL1xyXG4gIF9nZW5lcmF0ZVJ1bGVzKGVsZW1lbnQpIHtcclxuICAgIHZhciBydWxlc0xpc3QgPSBbXTtcclxuICAgIHZhciBydWxlcztcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1bGVzKSB7XHJcbiAgICAgIHJ1bGVzID0gdGhpcy5vcHRpb25zLnJ1bGVzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdpbnRlcmNoYW5nZScpLm1hdGNoKC9cXFsuKj9cXF0vZyk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSBpbiBydWxlcykge1xyXG4gICAgICB2YXIgcnVsZSA9IHJ1bGVzW2ldLnNsaWNlKDEsIC0xKS5zcGxpdCgnLCAnKTtcclxuICAgICAgdmFyIHBhdGggPSBydWxlLnNsaWNlKDAsIC0xKS5qb2luKCcnKTtcclxuICAgICAgdmFyIHF1ZXJ5ID0gcnVsZVtydWxlLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgaWYgKEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV0pIHtcclxuICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJ1bGVzTGlzdC5wdXNoKHtcclxuICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXNMaXN0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIHRoZSBgc3JjYCBwcm9wZXJ0eSBvZiBhbiBpbWFnZSwgb3IgY2hhbmdlIHRoZSBIVE1MIG9mIGEgY29udGFpbmVyLCB0byB0aGUgc3BlY2lmaWVkIHBhdGguXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBQYXRoIHRvIHRoZSBpbWFnZSBvciBIVE1MIHBhcnRpYWwuXHJcbiAgICogQGZpcmVzIEludGVyY2hhbmdlI3JlcGxhY2VkXHJcbiAgICovXHJcbiAgcmVwbGFjZShwYXRoKSB7XHJcbiAgICBpZiAodGhpcy5jdXJyZW50UGF0aCA9PT0gcGF0aCkgcmV0dXJuO1xyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgdHJpZ2dlciA9ICdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZSc7XHJcblxyXG4gICAgLy8gUmVwbGFjaW5nIGltYWdlc1xyXG4gICAgaWYgKHRoaXMuJGVsZW1lbnRbMF0ubm9kZU5hbWUgPT09ICdJTUcnKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignc3JjJywgcGF0aCkubG9hZChmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVwbGFjaW5nIGJhY2tncm91bmQgaW1hZ2VzXHJcbiAgICBlbHNlIGlmIChwYXRoLm1hdGNoKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZ3xzdmd8dGlmZikoWz8jXS4qKT8vaSkpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5jc3MoeyAnYmFja2dyb3VuZC1pbWFnZSc6ICd1cmwoJytwYXRoKycpJyB9KVxyXG4gICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XHJcbiAgICB9XHJcbiAgICAvLyBSZXBsYWNpbmcgSFRNTFxyXG4gICAgZWxzZSB7XHJcbiAgICAgICQuZ2V0KHBhdGgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuaHRtbChyZXNwb25zZSlcclxuICAgICAgICAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xyXG4gICAgICAgICQocmVzcG9uc2UpLmZvdW5kYXRpb24oKTtcclxuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBjb250ZW50IGluIGFuIEludGVyY2hhbmdlIGVsZW1lbnQgaXMgZG9uZSBiZWluZyBsb2FkZWQuXHJcbiAgICAgKiBAZXZlbnQgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcclxuICAgICAqL1xyXG4gICAgLy8gdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgaW50ZXJjaGFuZ2UuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIC8vVE9ETyB0aGlzLlxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxyXG4gKi9cclxuSW50ZXJjaGFuZ2UuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogUnVsZXMgdG8gYmUgYXBwbGllZCB0byBJbnRlcmNoYW5nZSBlbGVtZW50cy4gU2V0IHdpdGggdGhlIGBkYXRhLWludGVyY2hhbmdlYCBhcnJheSBub3RhdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICovXHJcbiAgcnVsZXM6IG51bGxcclxufTtcclxuXHJcbkludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFUyA9IHtcclxuICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcclxuICAncG9ydHJhaXQnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXHJcbiAgJ3JldGluYSc6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihJbnRlcmNoYW5nZSwgJ0ludGVyY2hhbmdlJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogTWFnZWxsYW4gbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubWFnZWxsYW5cclxuICovXHJcblxyXG5jbGFzcyBNYWdlbGxhbiB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBNYWdlbGxhbi5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgTWFnZWxsYW4jaW5pdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBNYWdlbGxhbi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdNYWdlbGxhbicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1hZ2VsbGFuIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdtYWdlbGxhbicpO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuJHRhcmdldHMgPSAkKCdbZGF0YS1tYWdlbGxhbi10YXJnZXRdJyk7XHJcbiAgICB0aGlzLiRsaW5rcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnYScpO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcclxuICAgICAgJ2RhdGEtcmVzaXplJzogaWQsXHJcbiAgICAgICdkYXRhLXNjcm9sbCc6IGlkLFxyXG4gICAgICAnaWQnOiBpZFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRhY3RpdmUgPSAkKCk7XHJcbiAgICB0aGlzLnNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCwgMTApO1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsY3VsYXRlcyBhbiBhcnJheSBvZiBwaXhlbCB2YWx1ZXMgdGhhdCBhcmUgdGhlIGRlbWFyY2F0aW9uIGxpbmVzIGJldHdlZW4gbG9jYXRpb25zIG9uIHRoZSBwYWdlLlxyXG4gICAqIENhbiBiZSBpbnZva2VkIGlmIG5ldyBlbGVtZW50cyBhcmUgYWRkZWQgb3IgdGhlIHNpemUgb2YgYSBsb2NhdGlvbiBjaGFuZ2VzLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGNhbGNQb2ludHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGJvZHkgPSBkb2N1bWVudC5ib2R5LFxyXG4gICAgICAgIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG4gICAgdGhpcy5wb2ludHMgPSBbXTtcclxuICAgIHRoaXMud2luSGVpZ2h0ID0gTWF0aC5yb3VuZChNYXRoLm1heCh3aW5kb3cuaW5uZXJIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0KSk7XHJcbiAgICB0aGlzLmRvY0hlaWdodCA9IE1hdGgucm91bmQoTWF0aC5tYXgoYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkub2Zmc2V0SGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KSk7XHJcblxyXG4gICAgdGhpcy4kdGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkdGFyID0gJCh0aGlzKSxcclxuICAgICAgICAgIHB0ID0gTWF0aC5yb3VuZCgkdGFyLm9mZnNldCgpLnRvcCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkKTtcclxuICAgICAgJHRhci50YXJnZXRQb2ludCA9IHB0O1xyXG4gICAgICBfdGhpcy5wb2ludHMucHVzaChwdCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgTWFnZWxsYW4uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICAkYm9keSA9ICQoJ2h0bWwsIGJvZHknKSxcclxuICAgICAgICBvcHRzID0ge1xyXG4gICAgICAgICAgZHVyYXRpb246IF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgICBlYXNpbmc6ICAgX3RoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmdcclxuICAgICAgICB9O1xyXG4gICAgJCh3aW5kb3cpLm9uZSgnbG9hZCcsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuZGVlcExpbmtpbmcpe1xyXG4gICAgICAgIGlmKGxvY2F0aW9uLmhhc2gpe1xyXG4gICAgICAgICAgX3RoaXMuc2Nyb2xsVG9Mb2MobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIF90aGlzLmNhbGNQb2ludHMoKTtcclxuICAgICAgX3RoaXMuX3VwZGF0ZUFjdGl2ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XHJcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5yZWZsb3cuYmluZCh0aGlzKSxcclxuICAgICAgJ3Njcm9sbG1lLnpmLnRyaWdnZXInOiB0aGlzLl91cGRhdGVBY3RpdmUuYmluZCh0aGlzKVxyXG4gICAgfSkub24oJ2NsaWNrLnpmLm1hZ2VsbGFuJywgJ2FbaHJlZl49XCIjXCJdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB2YXIgYXJyaXZhbCAgID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcclxuICAgICAgICBfdGhpcy5zY3JvbGxUb0xvYyhhcnJpdmFsKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRnVuY3Rpb24gdG8gc2Nyb2xsIHRvIGEgZ2l2ZW4gbG9jYXRpb24gb24gdGhlIHBhZ2UuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGxvYyAtIGEgcHJvcGVybHkgZm9ybWF0dGVkIGpRdWVyeSBpZCBzZWxlY3Rvci4gRXhhbXBsZTogJyNmb28nXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgc2Nyb2xsVG9Mb2MobG9jKSB7XHJcbiAgICB2YXIgc2Nyb2xsUG9zID0gTWF0aC5yb3VuZCgkKGxvYykub2Zmc2V0KCkudG9wIC0gdGhpcy5vcHRpb25zLnRocmVzaG9sZCAvIDIgLSB0aGlzLm9wdGlvbnMuYmFyT2Zmc2V0KTtcclxuXHJcbiAgICAkKCdodG1sLCBib2R5Jykuc3RvcCh0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBzY3JvbGxQb3MgfSwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uLCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRWFzaW5nKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIE1hZ2VsbGFuIHVwb24gRE9NIGNoYW5nZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHJlZmxvdygpIHtcclxuICAgIHRoaXMuY2FsY1BvaW50cygpO1xyXG4gICAgdGhpcy5fdXBkYXRlQWN0aXZlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSB2aXNpYmlsaXR5IG9mIGFuIGFjdGl2ZSBsb2NhdGlvbiBsaW5rLCBhbmQgdXBkYXRlcyB0aGUgdXJsIGhhc2ggZm9yIHRoZSBwYWdlLCBpZiBkZWVwTGlua2luZyBlbmFibGVkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIE1hZ2VsbGFuI3VwZGF0ZVxyXG4gICAqL1xyXG4gIF91cGRhdGVBY3RpdmUoLypldnQsIGVsZW0sIHNjcm9sbFBvcyovKSB7XHJcbiAgICB2YXIgd2luUG9zID0gLypzY3JvbGxQb3MgfHwqLyBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQsIDEwKSxcclxuICAgICAgICBjdXJJZHg7XHJcblxyXG4gICAgaWYod2luUG9zICsgdGhpcy53aW5IZWlnaHQgPT09IHRoaXMuZG9jSGVpZ2h0KXsgY3VySWR4ID0gdGhpcy5wb2ludHMubGVuZ3RoIC0gMTsgfVxyXG4gICAgZWxzZSBpZih3aW5Qb3MgPCB0aGlzLnBvaW50c1swXSl7IGN1cklkeCA9IDA7IH1cclxuICAgIGVsc2V7XHJcbiAgICAgIHZhciBpc0Rvd24gPSB0aGlzLnNjcm9sbFBvcyA8IHdpblBvcyxcclxuICAgICAgICAgIF90aGlzID0gdGhpcyxcclxuICAgICAgICAgIGN1clZpc2libGUgPSB0aGlzLnBvaW50cy5maWx0ZXIoZnVuY3Rpb24ocCwgaSl7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0Rvd24gPyBwIDw9IHdpblBvcyA6IHAgLSBfdGhpcy5vcHRpb25zLnRocmVzaG9sZCA8PSB3aW5Qb3M7Ly8mJiB3aW5Qb3MgPj0gX3RoaXMucG9pbnRzW2kgLTFdIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQ7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgY3VySWR4ID0gY3VyVmlzaWJsZS5sZW5ndGggPyBjdXJWaXNpYmxlLmxlbmd0aCAtIDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGFjdGl2ZS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xyXG4gICAgdGhpcy4kYWN0aXZlID0gdGhpcy4kbGlua3MuZXEoY3VySWR4KS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XHJcbiAgICAgIHZhciBoYXNoID0gdGhpcy4kYWN0aXZlWzBdLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgICBpZih3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpe1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBoYXNoKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zY3JvbGxQb3MgPSB3aW5Qb3M7XHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbWFnZWxsYW4gaXMgZmluaXNoZWQgdXBkYXRpbmcgdG8gdGhlIG5ldyBhY3RpdmUgZWxlbWVudC5cclxuICAgICAqIEBldmVudCBNYWdlbGxhbiN1cGRhdGVcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cGRhdGUuemYubWFnZWxsYW4nLCBbdGhpcy4kYWN0aXZlXSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBNYWdlbGxhbiBhbmQgcmVzZXRzIHRoZSB1cmwgb2YgdGhlIHdpbmRvdy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5tYWdlbGxhbicpXHJcbiAgICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5hY3RpdmVDbGFzc31gKS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XHJcbiAgICAgIHZhciBoYXNoID0gdGhpcy4kYWN0aXZlWzBdLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKGhhc2gsICcnKTtcclxuICAgIH1cclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAqL1xyXG5NYWdlbGxhbi5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBBbW91bnQgb2YgdGltZSwgaW4gbXMsIHRoZSBhbmltYXRlZCBzY3JvbGxpbmcgc2hvdWxkIHRha2UgYmV0d2VlbiBsb2NhdGlvbnMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwMFxyXG4gICAqL1xyXG4gIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsXHJcbiAgLyoqXHJcbiAgICogQW5pbWF0aW9uIHN0eWxlIHRvIHVzZSB3aGVuIHNjcm9sbGluZyBiZXR3ZWVuIGxvY2F0aW9ucy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2Vhc2UtaW4tb3V0J1xyXG4gICAqL1xyXG4gIGFuaW1hdGlvbkVhc2luZzogJ2xpbmVhcicsXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBpeGVscyB0byB1c2UgYXMgYSBtYXJrZXIgZm9yIGxvY2F0aW9uIGNoYW5nZXMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwXHJcbiAgICovXHJcbiAgdGhyZXNob2xkOiA1MCxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBhY3RpdmUgbG9jYXRpb25zIGxpbmsgb24gdGhlIG1hZ2VsbGFuIGNvbnRhaW5lci5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2FjdGl2ZSdcclxuICAgKi9cclxuICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSBzY3JpcHQgdG8gbWFuaXB1bGF0ZSB0aGUgdXJsIG9mIHRoZSBjdXJyZW50IHBhZ2UsIGFuZCBpZiBzdXBwb3J0ZWQsIGFsdGVyIHRoZSBoaXN0b3J5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgZGVlcExpbmtpbmc6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBwaXhlbHMgdG8gb2Zmc2V0IHRoZSBzY3JvbGwgb2YgdGhlIHBhZ2Ugb24gaXRlbSBjbGljayBpZiB1c2luZyBhIHN0aWNreSBuYXYgYmFyLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAyNVxyXG4gICAqL1xyXG4gIGJhck9mZnNldDogMFxyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihNYWdlbGxhbiwgJ01hZ2VsbGFuJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogT2ZmQ2FudmFzIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9mZmNhbnZhc1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKi9cclxuXHJcbmNsYXNzIE9mZkNhbnZhcyB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIE9mZkNhbnZhcyNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9mZkNhbnZhcy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnT2ZmQ2FudmFzJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XHJcblxyXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAgIC5maW5kKCdbZGF0YS1vcGVuPVwiJytpZCsnXCJdLCBbZGF0YS1jbG9zZT1cIicraWQrJ1wiXSwgW2RhdGEtdG9nZ2xlPVwiJytpZCsnXCJdJylcclxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxyXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcclxuXHJcbiAgICAvLyBBZGQgYSBjbG9zZSB0cmlnZ2VyIG92ZXIgdGhlIGJvZHkgaWYgbmVjZXNzYXJ5XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xyXG4gICAgICBpZiAoJCgnLmpzLW9mZi1jYW52YXMtZXhpdCcpLmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuJGV4aXRlciA9ICQoJy5qcy1vZmYtY2FudmFzLWV4aXQnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgZXhpdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgZXhpdGVyLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnanMtb2ZmLWNhbnZhcy1leGl0Jyk7XHJcbiAgICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmFwcGVuZChleGl0ZXIpO1xyXG5cclxuICAgICAgICB0aGlzLiRleGl0ZXIgPSAkKGV4aXRlcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9IHRoaXMub3B0aW9ucy5pc1JldmVhbGVkIHx8IG5ldyBSZWdFeHAodGhpcy5vcHRpb25zLnJldmVhbENsYXNzLCAnZycpLnRlc3QodGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMucmV2ZWFsT24gPSB0aGlzLm9wdGlvbnMucmV2ZWFsT24gfHwgdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyhyZXZlYWwtZm9yLW1lZGl1bXxyZXZlYWwtZm9yLWxhcmdlKS9nKVswXS5zcGxpdCgnLScpWzJdO1xyXG4gICAgICB0aGlzLl9zZXRNUUNoZWNrZXIoKTtcclxuICAgIH1cclxuICAgIGlmICghdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9IHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIG9mZi1jYW52YXMgd3JhcHBlciBhbmQgdGhlIGV4aXQgb3ZlcmxheS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpLm9uKHtcclxuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxyXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcclxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcclxuICAgICAgJ2tleWRvd24uemYub2ZmY2FudmFzJzogdGhpcy5faGFuZGxlS2V5Ym9hcmQuYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgdGhpcy4kZXhpdGVyLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLiRleGl0ZXIub24oeydjbGljay56Zi5vZmZjYW52YXMnOiB0aGlzLmNsb3NlLmJpbmQodGhpcyl9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGxpZXMgZXZlbnQgbGlzdGVuZXIgZm9yIGVsZW1lbnRzIHRoYXQgd2lsbCByZXZlYWwgYXQgY2VydGFpbiBicmVha3BvaW50cy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9zZXRNUUNoZWNrZXIoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xyXG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBfdGhpcy5yZXZlYWwoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICB9KS5vbmUoJ2xvYWQuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xyXG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzUmV2ZWFsZWQgLSB0cnVlIGlmIGVsZW1lbnQgc2hvdWxkIGJlIHJldmVhbGVkLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHJldmVhbChpc1JldmVhbGVkKSB7XHJcbiAgICB2YXIgJGNsb3NlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJyk7XHJcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xyXG4gICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IHRydWU7XHJcbiAgICAgIC8vIGlmICghdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XHJcbiAgICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XHJcbiAgICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIC8vIGlmICh0aGlzLm9wdGlvbnMuaXNTdGlja3kpIHsgdGhpcy5fc3RpY2soKTsgfVxyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZignb3Blbi56Zi50cmlnZ2VyIHRvZ2dsZS56Zi50cmlnZ2VyJyk7XHJcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5pc1JldmVhbGVkID0gZmFsc2U7XHJcbiAgICAgIC8vIGlmICh0aGlzLm9wdGlvbnMuaXNTdGlja3kgfHwgIXRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xyXG4gICAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgICAgIC8vICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xyXG4gICAgICAvLyB9XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcclxuICAgICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHtcclxuICAgICAgICAkY2xvc2VyLnNob3coKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXHJcbiAgICogQGZpcmVzIE9mZkNhbnZhcyNvcGVuZWRcclxuICAgKi9cclxuICBvcGVuKGV2ZW50LCB0cmlnZ2VyKSB7XHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcclxuICAgICAgJCgnYm9keScpLnNjcm9sbFRvcCgwKTtcclxuICAgIH1cclxuICAgIC8vIHdpbmRvdy5wYWdlWU9mZnNldCA9IDA7XHJcblxyXG4gICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcclxuICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XHJcbiAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcclxuICAgIC8vICAgaWYgKHRoaXMuJGV4aXRlci5sZW5ndGgpIHtcclxuICAgIC8vICAgICB0aGlzLiRleGl0ZXJbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXHJcbiAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI29wZW5lZFxyXG4gICAgICovXHJcbiAgICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lLCB0aGlzLiRlbGVtZW50LCBmdW5jdGlvbigpIHtcclxuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0nKyBfdGhpcy5vcHRpb25zLnBvc2l0aW9uKTtcclxuXHJcbiAgICAgIF90aGlzLiRlbGVtZW50XHJcbiAgICAgICAgLmFkZENsYXNzKCdpcy1vcGVuJylcclxuXHJcbiAgICAgIC8vIGlmIChfdGhpcy5vcHRpb25zLmlzU3RpY2t5KSB7XHJcbiAgICAgIC8vICAgX3RoaXMuX3N0aWNrKCk7XHJcbiAgICAgIC8vIH1cclxuICAgIH0pO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXHJcbiAgICAgICAgLnRyaWdnZXIoJ29wZW5lZC56Zi5vZmZjYW52YXMnKTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xyXG4gICAgICB0aGlzLiRleGl0ZXIuYWRkQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHJpZ2dlcikge1xyXG4gICAgICB0aGlzLiRsYXN0VHJpZ2dlciA9IHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKHRoaXMuJGVsZW1lbnQpLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy4kZWxlbWVudC5maW5kKCdhLCBidXR0b24nKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xyXG4gICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcclxuICAgICAgdGhpcy5fdHJhcEZvY3VzKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmFwcyBmb2N1cyB3aXRoaW4gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3RyYXBGb2N1cygpIHtcclxuICAgIHZhciBmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCksXHJcbiAgICAgICAgZmlyc3QgPSBmb2N1c2FibGUuZXEoMCksXHJcbiAgICAgICAgbGFzdCA9IGZvY3VzYWJsZS5lcSgtMSk7XHJcblxyXG4gICAgZm9jdXNhYmxlLm9mZignLnpmLm9mZmNhbnZhcycpLm9uKCdrZXlkb3duLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgaWYgKGUud2hpY2ggPT09IDkgfHwgZS5rZXljb2RlID09PSA5KSB7XHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBsYXN0WzBdICYmICFlLnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBmaXJzdC5mb2N1cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZS50YXJnZXQgPT09IGZpcnN0WzBdICYmIGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGxhc3QuZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSBvZmZjYW52YXMgdG8gYXBwZWFyIHN0aWNreSB1dGlsaXppbmcgdHJhbnNsYXRlIHByb3BlcnRpZXMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICAvLyBPZmZDYW52YXMucHJvdG90eXBlLl9zdGljayA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vICAgdmFyIGVsU3R5bGUgPSB0aGlzLiRlbGVtZW50WzBdLnN0eWxlO1xyXG4gIC8vXHJcbiAgLy8gICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xyXG4gIC8vICAgICB2YXIgZXhpdFN0eWxlID0gdGhpcy4kZXhpdGVyWzBdLnN0eWxlO1xyXG4gIC8vICAgfVxyXG4gIC8vXHJcbiAgLy8gICAkKHdpbmRvdykub24oJ3Njcm9sbC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbihlKSB7XHJcbiAgLy8gICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gIC8vICAgICB2YXIgcGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XHJcbiAgLy8gICAgIGVsU3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBwYWdlWSArICdweCknO1xyXG4gIC8vICAgICBpZiAoZXhpdFN0eWxlICE9PSB1bmRlZmluZWQpIHsgZXhpdFN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgcGFnZVkgKyAncHgpJzsgfVxyXG4gIC8vICAgfSk7XHJcbiAgLy8gICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3N0dWNrLnpmLm9mZmNhbnZhcycpO1xyXG4gIC8vIH07XHJcbiAgLyoqXHJcbiAgICogQ2xvc2VzIHRoZSBvZmYtY2FudmFzIG1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYiB0byBmaXJlIGFmdGVyIGNsb3N1cmUuXHJcbiAgICogQGZpcmVzIE9mZkNhbnZhcyNjbG9zZWRcclxuICAgKi9cclxuICBjbG9zZShjYikge1xyXG4gICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgLy8gIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUsIHRoaXMuJGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xyXG4gICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpLnJlbW92ZUNsYXNzKGBpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0ke190aGlzLm9wdGlvbnMucG9zaXRpb259YCk7XHJcbiAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAvLyBGb3VuZGF0aW9uLl9yZWZsb3coKTtcclxuICAgIC8vIH0pO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cclxuICAgICAgICogQGV2ZW50IE9mZkNhbnZhcyNjbG9zZWRcclxuICAgICAgICovXHJcbiAgICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcclxuICAgIC8vIGlmIChfdGhpcy5vcHRpb25zLmlzU3RpY2t5IHx8ICFfdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XHJcbiAgICAvLyAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAvLyAgICAgX3RoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgICAvLyAgICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xyXG4gICAgLy8gICB9LCB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUpO1xyXG4gICAgLy8gfVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcclxuICAgICAgdGhpcy4kZXhpdGVyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kbGFzdFRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMpIHtcclxuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxyXG4gICAqL1xyXG4gIHRvZ2dsZShldmVudCwgdHJpZ2dlcikge1xyXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xyXG4gICAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaGFuZGxlS2V5Ym9hcmQoZXZlbnQpIHtcclxuICAgIGlmIChldmVudC53aGljaCAhPT0gMjcpIHJldHVybjtcclxuXHJcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIG9mZmNhbnZhcyBwbHVnaW4uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2xvc2UoKTtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XHJcbiAgICB0aGlzLiRleGl0ZXIub2ZmKCcuemYub2ZmY2FudmFzJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuT2ZmQ2FudmFzLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEFsbG93IHRoZSB1c2VyIHRvIGNsaWNrIG91dHNpZGUgb2YgdGhlIG1lbnUgdG8gY2xvc2UgaXQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBjbG9zZU9uQ2xpY2s6IHRydWUsXHJcblxyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lIGluIG1zIHRoZSBvcGVuIGFuZCBjbG9zZSB0cmFuc2l0aW9uIHJlcXVpcmVzLiBJZiBub25lIHNlbGVjdGVkLCBwdWxscyBmcm9tIGJvZHkgc3R5bGUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwMFxyXG4gICAqL1xyXG4gIHRyYW5zaXRpb25UaW1lOiAwLFxyXG5cclxuICAvKipcclxuICAgKiBEaXJlY3Rpb24gdGhlIG9mZmNhbnZhcyBvcGVucyBmcm9tLiBEZXRlcm1pbmVzIGNsYXNzIGFwcGxpZWQgdG8gYm9keS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgbGVmdFxyXG4gICAqL1xyXG4gIHBvc2l0aW9uOiAnbGVmdCcsXHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb24gb3Blbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGZvcmNlVG9wOiB0cnVlLFxyXG5cclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGlzUmV2ZWFsZWQ6IGZhbHNlLFxyXG5cclxuICAvKipcclxuICAgKiBCcmVha3BvaW50IGF0IHdoaWNoIHRvIHJldmVhbC4gSlMgd2lsbCB1c2UgYSBSZWdFeHAgdG8gdGFyZ2V0IHN0YW5kYXJkIGNsYXNzZXMsIGlmIGNoYW5naW5nIGNsYXNzbmFtZXMsIHBhc3MgeW91ciBjbGFzcyB3aXRoIHRoZSBgcmV2ZWFsQ2xhc3NgIG9wdGlvbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgcmV2ZWFsLWZvci1sYXJnZVxyXG4gICAqL1xyXG4gIHJldmVhbE9uOiBudWxsLFxyXG5cclxuICAvKipcclxuICAgKiBGb3JjZSBmb2N1cyB0byB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uIElmIHRydWUsIHdpbGwgZm9jdXMgdGhlIG9wZW5pbmcgdHJpZ2dlciBvbiBjbG9zZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGF1dG9Gb2N1czogdHJ1ZSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIFRPRE8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cclxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXHJcbiAgICovXHJcbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLScsXHJcblxyXG4gIC8qKlxyXG4gICAqIFRyaWdnZXJzIG9wdGlvbmFsIGZvY3VzIHRyYXBwaW5nIHdoZW4gb3BlbmluZyBhbiBvZmZjYW52YXMuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIHRyYXBGb2N1czogZmFsc2VcclxufVxyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oT2ZmQ2FudmFzLCAnT2ZmQ2FudmFzJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogT3JiaXQgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ub3JiaXRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXJcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50b3VjaFxyXG4gKi9cclxuXHJcbmNsYXNzIE9yYml0IHtcclxuICAvKipcclxuICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gb3JiaXQgY2Fyb3VzZWwuXHJcbiAgKiBAY2xhc3NcclxuICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gT3JiaXQgQ2Fyb3VzZWwuXHJcbiAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKXtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9yYml0LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ09yYml0Jyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdPcmJpdCcsIHtcclxuICAgICAgJ2x0cic6IHtcclxuICAgICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXHJcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnXHJcbiAgICAgIH0sXHJcbiAgICAgICdydGwnOiB7XHJcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnbmV4dCcsXHJcbiAgICAgICAgJ0FSUk9XX1JJR0hUJzogJ3ByZXZpb3VzJ1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiBieSBjcmVhdGluZyBqUXVlcnkgY29sbGVjdGlvbnMsIHNldHRpbmcgYXR0cmlidXRlcywgYW5kIHN0YXJ0aW5nIHRoZSBhbmltYXRpb24uXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5jb250YWluZXJDbGFzc31gKTtcclxuICAgIHRoaXMuJHNsaWRlcyA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCk7XHJcbiAgICB2YXIgJGltYWdlcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW1nJyksXHJcbiAgICBpbml0QWN0aXZlID0gdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpO1xyXG5cclxuICAgIGlmICghaW5pdEFjdGl2ZS5sZW5ndGgpIHtcclxuICAgICAgdGhpcy4kc2xpZGVzLmVxKDApLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy51c2VNVUkpIHtcclxuICAgICAgdGhpcy4kc2xpZGVzLmFkZENsYXNzKCduby1tb3Rpb251aScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkaW1hZ2VzLmxlbmd0aCkge1xyXG4gICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKCRpbWFnZXMsIHRoaXMuX3ByZXBhcmVGb3JPcmJpdC5iaW5kKHRoaXMpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX3ByZXBhcmVGb3JPcmJpdCgpOy8vaGVoZVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xyXG4gICAgICB0aGlzLl9sb2FkQnVsbGV0cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgdGhpcy4kc2xpZGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdGhpcy5nZW9TeW5jKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hY2Nlc3NpYmxlKSB7IC8vIGFsbG93IHdyYXBwZXIgdG8gYmUgZm9jdXNhYmxlIHRvIGVuYWJsZSBhcnJvdyBuYXZpZ2F0aW9uXHJcbiAgICAgIHRoaXMuJHdyYXBwZXIuYXR0cigndGFiaW5kZXgnLCAwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogQ3JlYXRlcyBhIGpRdWVyeSBjb2xsZWN0aW9uIG9mIGJ1bGxldHMsIGlmIHRoZXkgYXJlIGJlaW5nIHVzZWQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICBfbG9hZEJ1bGxldHMoKSB7XHJcbiAgICB0aGlzLiRidWxsZXRzID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYm94T2ZCdWxsZXRzfWApLmZpbmQoJ2J1dHRvbicpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBTZXRzIGEgYHRpbWVyYCBvYmplY3Qgb24gdGhlIG9yYml0LCBhbmQgc3RhcnRzIHRoZSBjb3VudGVyIGZvciB0aGUgbmV4dCBzbGlkZS5cclxuICAqIEBmdW5jdGlvblxyXG4gICovXHJcbiAgZ2VvU3luYygpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLnRpbWVyID0gbmV3IEZvdW5kYXRpb24uVGltZXIoXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgIHtcclxuICAgICAgICBkdXJhdGlvbjogdGhpcy5vcHRpb25zLnRpbWVyRGVsYXksXHJcbiAgICAgICAgaW5maW5pdGU6IGZhbHNlXHJcbiAgICAgIH0sXHJcbiAgICAgIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKHRydWUpO1xyXG4gICAgICB9KTtcclxuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogU2V0cyB3cmFwcGVyIGFuZCBzbGlkZSBoZWlnaHRzIGZvciB0aGUgb3JiaXQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICBfcHJlcGFyZUZvck9yYml0KCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuX3NldFdyYXBwZXJIZWlnaHQoZnVuY3Rpb24obWF4KXtcclxuICAgICAgX3RoaXMuX3NldFNsaWRlSGVpZ2h0KG1heCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogQ2FsdWxhdGVzIHRoZSBoZWlnaHQgb2YgZWFjaCBzbGlkZSBpbiB0aGUgY29sbGVjdGlvbiwgYW5kIHVzZXMgdGhlIHRhbGxlc3Qgb25lIGZvciB0aGUgd3JhcHBlciBoZWlnaHQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZmlyZSB3aGVuIGNvbXBsZXRlLlxyXG4gICovXHJcbiAgX3NldFdyYXBwZXJIZWlnaHQoY2IpIHsvL3Jld3JpdGUgdGhpcyB0byBgZm9yYCBsb29wXHJcbiAgICB2YXIgbWF4ID0gMCwgdGVtcCwgY291bnRlciA9IDA7XHJcblxyXG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRlbXAgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcclxuICAgICAgJCh0aGlzKS5hdHRyKCdkYXRhLXNsaWRlJywgY291bnRlcik7XHJcblxyXG4gICAgICBpZiAoY291bnRlcikgey8vaWYgbm90IHRoZSBmaXJzdCBzbGlkZSwgc2V0IGNzcyBwb3NpdGlvbiBhbmQgZGlzcGxheSBwcm9wZXJ0eVxyXG4gICAgICAgICQodGhpcykuY3NzKHsncG9zaXRpb24nOiAncmVsYXRpdmUnLCAnZGlzcGxheSc6ICdub25lJ30pO1xyXG4gICAgICB9XHJcbiAgICAgIG1heCA9IHRlbXAgPiBtYXggPyB0ZW1wIDogbWF4O1xyXG4gICAgICBjb3VudGVyKys7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY291bnRlciA9PT0gdGhpcy4kc2xpZGVzLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLiR3cmFwcGVyLmNzcyh7J2hlaWdodCc6IG1heH0pOyAvL29ubHkgY2hhbmdlIHRoZSB3cmFwcGVyIGhlaWdodCBwcm9wZXJ0eSBvbmNlLlxyXG4gICAgICBjYihtYXgpOyAvL2ZpcmUgY2FsbGJhY2sgd2l0aCBtYXggaGVpZ2h0IGRpbWVuc2lvbi5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogU2V0cyB0aGUgbWF4LWhlaWdodCBvZiBlYWNoIHNsaWRlLlxyXG4gICogQGZ1bmN0aW9uXHJcbiAgKiBAcHJpdmF0ZVxyXG4gICovXHJcbiAgX3NldFNsaWRlSGVpZ2h0KGhlaWdodCkge1xyXG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICQodGhpcykuY3NzKCdtYXgtaGVpZ2h0JywgaGVpZ2h0KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byBiYXNpY2FsbHkgZXZlcnl0aGluZyB3aXRoaW4gdGhlIGVsZW1lbnQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8qKk5vdyB1c2luZyBjdXN0b20gZXZlbnQgLSB0aGFua3MgdG86KipcclxuICAgIC8vKiogICAgICBZb2hhaSBBcmFyYXQgb2YgVG9yb250byAgICAgICoqXHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgaWYgKHRoaXMuJHNsaWRlcy5sZW5ndGggPiAxKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN3aXBlKSB7XHJcbiAgICAgICAgdGhpcy4kc2xpZGVzLm9mZignc3dpcGVsZWZ0LnpmLm9yYml0IHN3aXBlcmlnaHQuemYub3JiaXQnKVxyXG4gICAgICAgIC5vbignc3dpcGVsZWZ0LnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcclxuICAgICAgICB9KS5vbignc3dpcGVyaWdodC56Zi5vcmJpdCcsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUoZmFsc2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIC8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QbGF5KSB7XHJcbiAgICAgICAgdGhpcy4kc2xpZGVzLm9uKCdjbGljay56Zi5vcmJpdCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJywgX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJykgPyBmYWxzZSA6IHRydWUpO1xyXG4gICAgICAgICAgX3RoaXMudGltZXJbX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJykgPyAncGF1c2UnIDogJ3N0YXJ0J10oKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXVzZU9uSG92ZXIpIHtcclxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQub24oJ21vdXNlZW50ZXIuemYub3JiaXQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMudGltZXIucGF1c2UoKTtcclxuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICghX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJykpIHtcclxuICAgICAgICAgICAgICBfdGhpcy50aW1lci5zdGFydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubmF2QnV0dG9ucykge1xyXG4gICAgICAgIHZhciAkY29udHJvbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5uZXh0Q2xhc3N9LCAuJHt0aGlzLm9wdGlvbnMucHJldkNsYXNzfWApO1xyXG4gICAgICAgICRjb250cm9scy5hdHRyKCd0YWJpbmRleCcsIDApXHJcbiAgICAgICAgLy9hbHNvIG5lZWQgdG8gaGFuZGxlIGVudGVyL3JldHVybiBhbmQgc3BhY2ViYXIga2V5IHByZXNzZXNcclxuICAgICAgICAub24oJ2NsaWNrLnpmLm9yYml0IHRvdWNoZW5kLnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XHJcblx0ICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSgkKHRoaXMpLmhhc0NsYXNzKF90aGlzLm9wdGlvbnMubmV4dENsYXNzKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xyXG4gICAgICAgIHRoaXMuJGJ1bGxldHMub24oJ2NsaWNrLnpmLm9yYml0IHRvdWNoZW5kLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoL2lzLWFjdGl2ZS9nLnRlc3QodGhpcy5jbGFzc05hbWUpKSB7IHJldHVybiBmYWxzZTsgfS8vaWYgdGhpcyBpcyBhY3RpdmUsIGtpY2sgb3V0IG9mIGZ1bmN0aW9uLlxyXG4gICAgICAgICAgdmFyIGlkeCA9ICQodGhpcykuZGF0YSgnc2xpZGUnKSxcclxuICAgICAgICAgIGx0ciA9IGlkeCA+IF90aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZGF0YSgnc2xpZGUnKSxcclxuICAgICAgICAgICRzbGlkZSA9IF90aGlzLiRzbGlkZXMuZXEoaWR4KTtcclxuXHJcbiAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZShsdHIsICRzbGlkZSwgaWR4KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy4kd3JhcHBlci5hZGQodGhpcy4kYnVsbGV0cykub24oJ2tleWRvd24uemYub3JiaXQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxyXG4gICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdPcmJpdCcsIHtcclxuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHsgLy8gaWYgYnVsbGV0IGlzIGZvY3VzZWQsIG1ha2Ugc3VyZSBmb2N1cyBtb3Zlc1xyXG4gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuaXMoX3RoaXMuJGJ1bGxldHMpKSB7XHJcbiAgICAgICAgICAgICAgX3RoaXMuJGJ1bGxldHMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogQ2hhbmdlcyB0aGUgY3VycmVudCBzbGlkZSB0byBhIG5ldyBvbmUuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNMVFIgLSBmbGFnIGlmIHRoZSBzbGlkZSBzaG91bGQgbW92ZSBsZWZ0IHRvIHJpZ2h0LlxyXG4gICogQHBhcmFtIHtqUXVlcnl9IGNob3NlblNsaWRlIC0gdGhlIGpRdWVyeSBlbGVtZW50IG9mIHRoZSBzbGlkZSB0byBzaG93IG5leHQsIGlmIG9uZSBpcyBzZWxlY3RlZC5cclxuICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSB0aGUgaW5kZXggb2YgdGhlIG5ldyBzbGlkZSBpbiBpdHMgY29sbGVjdGlvbiwgaWYgb25lIGNob3Nlbi5cclxuICAqIEBmaXJlcyBPcmJpdCNzbGlkZWNoYW5nZVxyXG4gICovXHJcbiAgY2hhbmdlU2xpZGUoaXNMVFIsIGNob3NlblNsaWRlLCBpZHgpIHtcclxuICAgIHZhciAkY3VyU2xpZGUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZXEoMCk7XHJcblxyXG4gICAgaWYgKC9tdWkvZy50ZXN0KCRjdXJTbGlkZVswXS5jbGFzc05hbWUpKSB7IHJldHVybiBmYWxzZTsgfSAvL2lmIHRoZSBzbGlkZSBpcyBjdXJyZW50bHkgYW5pbWF0aW5nLCBraWNrIG91dCBvZiB0aGUgZnVuY3Rpb25cclxuXHJcbiAgICB2YXIgJGZpcnN0U2xpZGUgPSB0aGlzLiRzbGlkZXMuZmlyc3QoKSxcclxuICAgICRsYXN0U2xpZGUgPSB0aGlzLiRzbGlkZXMubGFzdCgpLFxyXG4gICAgZGlySW4gPSBpc0xUUiA/ICdSaWdodCcgOiAnTGVmdCcsXHJcbiAgICBkaXJPdXQgPSBpc0xUUiA/ICdMZWZ0JyA6ICdSaWdodCcsXHJcbiAgICBfdGhpcyA9IHRoaXMsXHJcbiAgICAkbmV3U2xpZGU7XHJcblxyXG4gICAgaWYgKCFjaG9zZW5TbGlkZSkgeyAvL21vc3Qgb2YgdGhlIHRpbWUsIHRoaXMgd2lsbCBiZSBhdXRvIHBsYXllZCBvciBjbGlja2VkIGZyb20gdGhlIG5hdkJ1dHRvbnMuXHJcbiAgICAgICRuZXdTbGlkZSA9IGlzTFRSID8gLy9pZiB3cmFwcGluZyBlbmFibGVkLCBjaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYSBgbmV4dGAgb3IgYHByZXZgIHNpYmxpbmcsIGlmIG5vdCwgc2VsZWN0IHRoZSBmaXJzdCBvciBsYXN0IHNsaWRlIHRvIGZpbGwgaW4uIGlmIHdyYXBwaW5nIG5vdCBlbmFibGVkLCBhdHRlbXB0IHRvIHNlbGVjdCBgbmV4dGAgb3IgYHByZXZgLCBpZiB0aGVyZSdzIG5vdGhpbmcgdGhlcmUsIHRoZSBmdW5jdGlvbiB3aWxsIGtpY2sgb3V0IG9uIG5leHQgc3RlcC4gQ1JBWlkgTkVTVEVEIFRFUk5BUklFUyEhISEhXHJcbiAgICAgICh0aGlzLm9wdGlvbnMuaW5maW5pdGVXcmFwID8gJGN1clNsaWRlLm5leHQoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApLmxlbmd0aCA/ICRjdXJTbGlkZS5uZXh0KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSA6ICRmaXJzdFNsaWRlIDogJGN1clNsaWRlLm5leHQoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApKS8vcGljayBuZXh0IHNsaWRlIGlmIG1vdmluZyBsZWZ0IHRvIHJpZ2h0XHJcbiAgICAgIDpcclxuICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUucHJldihgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkubGVuZ3RoID8gJGN1clNsaWRlLnByZXYoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApIDogJGxhc3RTbGlkZSA6ICRjdXJTbGlkZS5wcmV2KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSk7Ly9waWNrIHByZXYgc2xpZGUgaWYgbW92aW5nIHJpZ2h0IHRvIGxlZnRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICRuZXdTbGlkZSA9IGNob3NlblNsaWRlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkbmV3U2xpZGUubGVuZ3RoKSB7XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xyXG4gICAgICAgIGlkeCA9IGlkeCB8fCB0aGlzLiRzbGlkZXMuaW5kZXgoJG5ld1NsaWRlKTsgLy9ncmFiIGluZGV4IHRvIHVwZGF0ZSBidWxsZXRzXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlQnVsbGV0cyhpZHgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnVzZU1VSSkge1xyXG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbihcclxuICAgICAgICAgICRuZXdTbGlkZS5hZGRDbGFzcygnaXMtYWN0aXZlJykuY3NzKHsncG9zaXRpb24nOiAnYWJzb2x1dGUnLCAndG9wJzogMH0pLFxyXG4gICAgICAgICAgdGhpcy5vcHRpb25zW2BhbmltSW5Gcm9tJHtkaXJJbn1gXSxcclxuICAgICAgICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICRuZXdTbGlkZS5jc3Moeydwb3NpdGlvbic6ICdyZWxhdGl2ZScsICdkaXNwbGF5JzogJ2Jsb2NrJ30pXHJcbiAgICAgICAgICAgIC5hdHRyKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoXHJcbiAgICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLFxyXG4gICAgICAgICAgdGhpcy5vcHRpb25zW2BhbmltT3V0VG8ke2Rpck91dH1gXSxcclxuICAgICAgICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICRjdXJTbGlkZS5yZW1vdmVBdHRyKCdhcmlhLWxpdmUnKTtcclxuICAgICAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5hdXRvUGxheSAmJiAhX3RoaXMudGltZXIuaXNQYXVzZWQpe1xyXG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnJlc3RhcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL2RvIHN0dWZmP1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgJGN1clNsaWRlLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtaW4nKS5yZW1vdmVBdHRyKCdhcmlhLWxpdmUnKS5oaWRlKCk7XHJcbiAgICAgICAgJG5ld1NsaWRlLmFkZENsYXNzKCdpcy1hY3RpdmUgaXMtaW4nKS5hdHRyKCdhcmlhLWxpdmUnLCAncG9saXRlJykuc2hvdygpO1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgIXRoaXMudGltZXIuaXNQYXVzZWQpIHtcclxuICAgICAgICAgIHRoaXMudGltZXIucmVzdGFydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgLyoqXHJcbiAgICAqIFRyaWdnZXJzIHdoZW4gdGhlIHNsaWRlIGhhcyBmaW5pc2hlZCBhbmltYXRpbmcgaW4uXHJcbiAgICAqIEBldmVudCBPcmJpdCNzbGlkZWNoYW5nZVxyXG4gICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzbGlkZWNoYW5nZS56Zi5vcmJpdCcsIFskbmV3U2xpZGVdKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogVXBkYXRlcyB0aGUgYWN0aXZlIHN0YXRlIG9mIHRoZSBidWxsZXRzLCBpZiBkaXNwbGF5ZWQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqIEBwcml2YXRlXHJcbiAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IHNsaWRlLlxyXG4gICovXHJcbiAgX3VwZGF0ZUJ1bGxldHMoaWR4KSB7XHJcbiAgICB2YXIgJG9sZEJ1bGxldCA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLmJveE9mQnVsbGV0c31gKVxyXG4gICAgLmZpbmQoJy5pcy1hY3RpdmUnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuYmx1cigpLFxyXG4gICAgc3BhbiA9ICRvbGRCdWxsZXQuZmluZCgnc3BhbjpsYXN0JykuZGV0YWNoKCksXHJcbiAgICAkbmV3QnVsbGV0ID0gdGhpcy4kYnVsbGV0cy5lcShpZHgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKS5hcHBlbmQoc3Bhbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAqIERlc3Ryb3lzIHRoZSBjYXJvdXNlbCBhbmQgaGlkZXMgdGhlIGVsZW1lbnQuXHJcbiAgKiBAZnVuY3Rpb25cclxuICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLm9yYml0JykuZmluZCgnKicpLm9mZignLnpmLm9yYml0JykuZW5kKCkuaGlkZSgpO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuT3JiaXQuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgKiBUZWxscyB0aGUgSlMgdG8gbG9vayBmb3IgYW5kIGxvYWRCdWxsZXRzLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgYnVsbGV0czogdHJ1ZSxcclxuICAvKipcclxuICAqIFRlbGxzIHRoZSBKUyB0byBhcHBseSBldmVudCBsaXN0ZW5lcnMgdG8gbmF2IGJ1dHRvbnNcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIG5hdkJ1dHRvbnM6IHRydWUsXHJcbiAgLyoqXHJcbiAgKiBtb3Rpb24tdWkgYW5pbWF0aW9uIGNsYXNzIHRvIGFwcGx5XHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tcmlnaHQnXHJcbiAgKi9cclxuICBhbmltSW5Gcm9tUmlnaHQ6ICdzbGlkZS1pbi1yaWdodCcsXHJcbiAgLyoqXHJcbiAgKiBtb3Rpb24tdWkgYW5pbWF0aW9uIGNsYXNzIHRvIGFwcGx5XHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LXJpZ2h0J1xyXG4gICovXHJcbiAgYW5pbU91dFRvUmlnaHQ6ICdzbGlkZS1vdXQtcmlnaHQnLFxyXG4gIC8qKlxyXG4gICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ3NsaWRlLWluLWxlZnQnXHJcbiAgKlxyXG4gICovXHJcbiAgYW5pbUluRnJvbUxlZnQ6ICdzbGlkZS1pbi1sZWZ0JyxcclxuICAvKipcclxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlICdzbGlkZS1vdXQtbGVmdCdcclxuICAqL1xyXG4gIGFuaW1PdXRUb0xlZnQ6ICdzbGlkZS1vdXQtbGVmdCcsXHJcbiAgLyoqXHJcbiAgKiBBbGxvd3MgT3JiaXQgdG8gYXV0b21hdGljYWxseSBhbmltYXRlIG9uIHBhZ2UgbG9hZC5cclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIGF1dG9QbGF5OiB0cnVlLFxyXG4gIC8qKlxyXG4gICogQW1vdW50IG9mIHRpbWUsIGluIG1zLCBiZXR3ZWVuIHNsaWRlIHRyYW5zaXRpb25zXHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSA1MDAwXHJcbiAgKi9cclxuICB0aW1lckRlbGF5OiA1MDAwLFxyXG4gIC8qKlxyXG4gICogQWxsb3dzIE9yYml0IHRvIGluZmluaXRlbHkgbG9vcCB0aHJvdWdoIHRoZSBzbGlkZXNcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIGluZmluaXRlV3JhcDogdHJ1ZSxcclxuICAvKipcclxuICAqIEFsbG93cyB0aGUgT3JiaXQgc2xpZGVzIHRvIGJpbmQgdG8gc3dpcGUgZXZlbnRzIGZvciBtb2JpbGUsIHJlcXVpcmVzIGFuIGFkZGl0aW9uYWwgdXRpbCBsaWJyYXJ5XHJcbiAgKiBAb3B0aW9uXHJcbiAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgKi9cclxuICBzd2lwZTogdHJ1ZSxcclxuICAvKipcclxuICAqIEFsbG93cyB0aGUgdGltaW5nIGZ1bmN0aW9uIHRvIHBhdXNlIGFuaW1hdGlvbiBvbiBob3Zlci5cclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcclxuICAvKipcclxuICAqIEFsbG93cyBPcmJpdCB0byBiaW5kIGtleWJvYXJkIGV2ZW50cyB0byB0aGUgc2xpZGVyLCB0byBhbmltYXRlIGZyYW1lcyB3aXRoIGFycm93IGtleXNcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlIHRydWVcclxuICAqL1xyXG4gIGFjY2Vzc2libGU6IHRydWUsXHJcbiAgLyoqXHJcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBjb250YWluZXIgb2YgT3JiaXRcclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlICdvcmJpdC1jb250YWluZXInXHJcbiAgKi9cclxuICBjb250YWluZXJDbGFzczogJ29yYml0LWNvbnRhaW5lcicsXHJcbiAgLyoqXHJcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgc2xpZGVzLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ29yYml0LXNsaWRlJ1xyXG4gICovXHJcbiAgc2xpZGVDbGFzczogJ29yYml0LXNsaWRlJyxcclxuICAvKipcclxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGJ1bGxldCBjb250YWluZXIuIFlvdSdyZSB3ZWxjb21lLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ29yYml0LWJ1bGxldHMnXHJcbiAgKi9cclxuICBib3hPZkJ1bGxldHM6ICdvcmJpdC1idWxsZXRzJyxcclxuICAvKipcclxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGBuZXh0YCBuYXZpZ2F0aW9uIGJ1dHRvbi5cclxuICAqIEBvcHRpb25cclxuICAqIEBleGFtcGxlICdvcmJpdC1uZXh0J1xyXG4gICovXHJcbiAgbmV4dENsYXNzOiAnb3JiaXQtbmV4dCcsXHJcbiAgLyoqXHJcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBgcHJldmlvdXNgIG5hdmlnYXRpb24gYnV0dG9uLlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgJ29yYml0LXByZXZpb3VzJ1xyXG4gICovXHJcbiAgcHJldkNsYXNzOiAnb3JiaXQtcHJldmlvdXMnLFxyXG4gIC8qKlxyXG4gICogQm9vbGVhbiB0byBmbGFnIHRoZSBqcyB0byB1c2UgbW90aW9uIHVpIGNsYXNzZXMgb3Igbm90LiBEZWZhdWx0IHRvIHRydWUgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5LlxyXG4gICogQG9wdGlvblxyXG4gICogQGV4YW1wbGUgdHJ1ZVxyXG4gICovXHJcbiAgdXNlTVVJOiB0cnVlXHJcbn07XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihPcmJpdCwgJ09yYml0Jyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogUmVzcG9uc2l2ZU1lbnUgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5hY2NvcmRpb25NZW51XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJpbGxkb3duXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJvcGRvd24tbWVudVxyXG4gKi9cclxuXHJcbmNsYXNzIFJlc3BvbnNpdmVNZW51IHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgcmVzcG9uc2l2ZSBtZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XHJcbiAgICB0aGlzLmN1cnJlbnRNcSA9IG51bGw7XHJcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBudWxsO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVNZW51Jyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgTWVudSBieSBwYXJzaW5nIHRoZSBjbGFzc2VzIGZyb20gdGhlICdkYXRhLVJlc3BvbnNpdmVNZW51JyBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIC8vIFRoZSBmaXJzdCB0aW1lIGFuIEludGVyY2hhbmdlIHBsdWdpbiBpcyBpbml0aWFsaXplZCwgdGhpcy5ydWxlcyBpcyBjb252ZXJ0ZWQgZnJvbSBhIHN0cmluZyBvZiBcImNsYXNzZXNcIiB0byBhbiBvYmplY3Qgb2YgcnVsZXNcclxuICAgIGlmICh0eXBlb2YgdGhpcy5ydWxlcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgbGV0IHJ1bGVzVHJlZSA9IHt9O1xyXG5cclxuICAgICAgLy8gUGFyc2UgcnVsZXMgZnJvbSBcImNsYXNzZXNcIiBwdWxsZWQgZnJvbSBkYXRhIGF0dHJpYnV0ZVxyXG4gICAgICBsZXQgcnVsZXMgPSB0aGlzLnJ1bGVzLnNwbGl0KCcgJyk7XHJcblxyXG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggZXZlcnkgcnVsZSBmb3VuZFxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgbGV0IHJ1bGUgPSBydWxlc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGxldCBydWxlU2l6ZSA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMF0gOiAnc21hbGwnO1xyXG4gICAgICAgIGxldCBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XHJcblxyXG4gICAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgcnVsZXNUcmVlW3J1bGVTaXplXSA9IE1lbnVQbHVnaW5zW3J1bGVQbHVnaW5dO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzVHJlZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISQuaXNFbXB0eU9iamVjdCh0aGlzLnJ1bGVzKSkge1xyXG4gICAgICB0aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgTWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xyXG4gICAgfSk7XHJcbiAgICAvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5SZXNwb25zaXZlTWVudScsIGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcclxuICAgIC8vIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IHNjcmVlbiB3aWR0aCBhZ2FpbnN0IGF2YWlsYWJsZSBtZWRpYSBxdWVyaWVzLiBJZiB0aGUgbWVkaWEgcXVlcnkgaGFzIGNoYW5nZWQsIGFuZCB0aGUgcGx1Z2luIG5lZWRlZCBoYXMgY2hhbmdlZCwgdGhlIHBsdWdpbnMgd2lsbCBzd2FwIG91dC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcclxuICAgIHZhciBtYXRjaGVkTXEsIF90aGlzID0gdGhpcztcclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUgYW5kIGZpbmQgdGhlIGxhc3QgbWF0Y2hpbmcgcnVsZVxyXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3Qoa2V5KSkge1xyXG4gICAgICAgIG1hdGNoZWRNcSA9IGtleTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcclxuICAgIGlmICghbWF0Y2hlZE1xKSByZXR1cm47XHJcblxyXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcclxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4gaW5zdGFuY2VvZiB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKSByZXR1cm47XHJcblxyXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xyXG4gICAgJC5lYWNoKE1lbnVQbHVnaW5zLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHZhbHVlLmNzc0NsYXNzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCB0aGUgQ1NTIGNsYXNzIGZvciB0aGUgbmV3IHBsdWdpblxyXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgbmV3IHBsdWdpblxyXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcclxuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG5ldyB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKHRoaXMuJGVsZW1lbnQsIHt9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBpbnN0YW5jZSBvZiB0aGUgY3VycmVudCBwbHVnaW4gb24gdGhpcyBlbGVtZW50LCBhcyB3ZWxsIGFzIHRoZSB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdGhhdCBzd2l0Y2hlcyB0aGUgcGx1Z2lucyBvdXQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XHJcbiAgICAkKHdpbmRvdykub2ZmKCcuemYuUmVzcG9uc2l2ZU1lbnUnKTtcclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XHJcblxyXG4vLyBUaGUgcGx1Z2luIG1hdGNoZXMgdGhlIHBsdWdpbiBjbGFzc2VzIHdpdGggdGhlc2UgcGx1Z2luIGluc3RhbmNlcy5cclxudmFyIE1lbnVQbHVnaW5zID0ge1xyXG4gIGRyb3Bkb3duOiB7XHJcbiAgICBjc3NDbGFzczogJ2Ryb3Bkb3duJyxcclxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcclxuICB9LFxyXG4gZHJpbGxkb3duOiB7XHJcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXHJcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2RyaWxsZG93biddIHx8IG51bGxcclxuICB9LFxyXG4gIGFjY29yZGlvbjoge1xyXG4gICAgY3NzQ2xhc3M6ICdhY2NvcmRpb24tbWVudScsXHJcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2FjY29yZGlvbi1tZW51J10gfHwgbnVsbFxyXG4gIH1cclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVNZW51LCAnUmVzcG9uc2l2ZU1lbnUnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqL1xyXG5cclxuY2xhc3MgUmVzcG9uc2l2ZVRvZ2dsZSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUYWIgQmFyLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIHRhYiBiYXIgZnVuY3Rpb25hbGl0eSB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIHRhcmdldElEID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLXRvZ2dsZScpO1xyXG4gICAgaWYgKCF0YXJnZXRJRCkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdZb3VyIHRhYiBiYXIgbmVlZHMgYW4gSUQgb2YgYSBNZW51IGFzIHRoZSB2YWx1ZSBvZiBkYXRhLXRhYi1iYXIuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kdGFyZ2V0TWVudSA9ICQoYCMke3RhcmdldElEfWApO1xyXG4gICAgdGhpcy4kdG9nZ2xlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdG9nZ2xlXScpO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBuZWNlc3NhcnkgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSB0YWIgYmFyIHRvIHdvcmsuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLiR0b2dnbGVyLm9uKCdjbGljay56Zi5yZXNwb25zaXZlVG9nZ2xlJywgdGhpcy50b2dnbGVNZW51LmJpbmQodGhpcykpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5IHRvIGRldGVybWluZSBpZiB0aGUgdGFiIGJhciBzaG91bGQgYmUgdmlzaWJsZSBvciBoaWRkZW4uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfdXBkYXRlKCkge1xyXG4gICAgLy8gTW9iaWxlXHJcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnNob3coKTtcclxuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGVza3RvcFxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpO1xyXG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnNob3coKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIuIFRoZSB0b2dnbGUgb25seSBoYXBwZW5zIGlmIHRoZSBzY3JlZW4gaXMgc21hbGwgZW5vdWdoIHRvIGFsbG93IGl0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcclxuICAgKi9cclxuICB0b2dnbGVNZW51KCkge1xyXG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcclxuICAgICAgdGhpcy4kdGFyZ2V0TWVudS50b2dnbGUoMCk7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhciB0b2dnbGVzLlxyXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3RvZ2dsZWQuemYucmVzcG9uc2l2ZVRvZ2dsZScpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICAvL1RPRE8gdGhpcy4uLlxyXG4gIH1cclxufVxyXG5cclxuUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXHJcbiAgICovXHJcbiAgaGlkZUZvcjogJ21lZGl1bSdcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVUb2dnbGUsICdSZXNwb25zaXZlVG9nZ2xlJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogUmV2ZWFsIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJldmVhbFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uIGlmIHVzaW5nIGFuaW1hdGlvbnNcclxuICovXHJcblxyXG5jbGFzcyBSZXZlYWwge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgUmV2ZWFsLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgZm9yIHRoZSBtb2RhbC5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbmFsIHBhcmFtZXRlcnMuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmV2ZWFsLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmV2ZWFsJyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdSZXZlYWwnLCB7XHJcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcclxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxyXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcclxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXHJcbiAgICAgICdTSElGVF9UQUInOiAndGFiX2JhY2t3YXJkJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgbW9kYWwgYnkgYWRkaW5nIHRoZSBvdmVybGF5IGFuZCBjbG9zZSBidXR0b25zLCAoaWYgc2VsZWN0ZWQpLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLmlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xyXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5jYWNoZWQgPSB7bXE6IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5jdXJyZW50fTtcclxuICAgIHRoaXMuaXNpT1MgPSBpUGhvbmVTbmlmZigpO1xyXG5cclxuICAgIGlmKHRoaXMuaXNpT1MpeyB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1pb3MnKTsgfVxyXG5cclxuICAgIHRoaXMuJGFuY2hvciA9ICQoYFtkYXRhLW9wZW49XCIke3RoaXMuaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKSA6ICQoYFtkYXRhLXRvZ2dsZT1cIiR7dGhpcy5pZH1cIl1gKTtcclxuXHJcbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xyXG4gICAgICB2YXIgYW5jaG9ySWQgPSB0aGlzLiRhbmNob3JbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAncmV2ZWFsJyk7XHJcblxyXG4gICAgICB0aGlzLiRhbmNob3IuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiB0aGlzLmlkLFxyXG4gICAgICAgICdpZCc6IGFuY2hvcklkLFxyXG4gICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcclxuICAgICAgICAndGFiaW5kZXgnOiAwXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoeydhcmlhLWxhYmVsbGVkYnknOiBhbmNob3JJZH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdmdWxsJykpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gPSB0cnVlO1xyXG4gICAgICB0aGlzLm9wdGlvbnMub3ZlcmxheSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5ICYmICF0aGlzLiRvdmVybGF5KSB7XHJcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSB0aGlzLl9tYWtlT3ZlcmxheSh0aGlzLmlkKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xyXG4gICAgICAgICdyb2xlJzogJ2RpYWxvZycsXHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcclxuICAgICAgICAnZGF0YS15ZXRpLWJveCc6IHRoaXMuaWQsXHJcbiAgICAgICAgJ2RhdGEtcmVzaXplJzogdGhpcy5pZFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYodGhpcy4kb3ZlcmxheSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKHRoaXMuJG92ZXJsYXkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5kZXRhY2goKS5hcHBlbmRUbygkKCdib2R5JykpO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd3aXRob3V0LW92ZXJsYXknKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluayAmJiB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gKCBgIyR7dGhpcy5pZH1gKSkge1xyXG4gICAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnJldmVhbCcsIHRoaXMub3Blbi5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheSBkaXYgdG8gZGlzcGxheSBiZWhpbmQgdGhlIG1vZGFsLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX21ha2VPdmVybGF5KGlkKSB7XHJcbiAgICB2YXIgJG92ZXJsYXkgPSAkKCc8ZGl2PjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdyZXZlYWwtb3ZlcmxheScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoeyd0YWJpbmRleCc6IC0xLCAnYXJpYS1oaWRkZW4nOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgIHJldHVybiAkb3ZlcmxheTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgcG9zaXRpb24gb2YgbW9kYWxcclxuICAgKiBUT0RPOiAgRmlndXJlIG91dCBpZiB3ZSBhY3R1YWxseSBuZWVkIHRvIGNhY2hlIHRoZXNlIHZhbHVlcyBvciBpZiBpdCBkb2Vzbid0IG1hdHRlclxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3VwZGF0ZVBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHdpZHRoID0gdGhpcy4kZWxlbWVudC5vdXRlcldpZHRoKCk7XHJcbiAgICB2YXIgb3V0ZXJXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xyXG4gICAgdmFyIGhlaWdodCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcclxuICAgIHZhciBvdXRlckhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKTtcclxuICAgIHZhciBsZWZ0LCB0b3A7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmhPZmZzZXQgPT09ICdhdXRvJykge1xyXG4gICAgICBsZWZ0ID0gcGFyc2VJbnQoKG91dGVyV2lkdGggLSB3aWR0aCkgLyAyLCAxMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZWZ0ID0gcGFyc2VJbnQodGhpcy5vcHRpb25zLmhPZmZzZXQsIDEwKTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudk9mZnNldCA9PT0gJ2F1dG8nKSB7XHJcbiAgICAgIGlmIChoZWlnaHQgPiBvdXRlckhlaWdodCkge1xyXG4gICAgICAgIHRvcCA9IHBhcnNlSW50KE1hdGgubWluKDEwMCwgb3V0ZXJIZWlnaHQgLyAxMCksIDEwKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0b3AgPSBwYXJzZUludCgob3V0ZXJIZWlnaHQgLSBoZWlnaHQpIC8gNCwgMTApO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0b3AgPSBwYXJzZUludCh0aGlzLm9wdGlvbnMudk9mZnNldCwgMTApO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe3RvcDogdG9wICsgJ3B4J30pO1xyXG4gICAgLy8gb25seSB3b3JyeSBhYm91dCBsZWZ0IGlmIHdlIGRvbid0IGhhdmUgYW4gb3ZlcmxheSBvciB3ZSBoYXZlYSAgaG9yaXpvbnRhbCBvZmZzZXQsXHJcbiAgICAvLyBvdGhlcndpc2Ugd2UncmUgcGVyZmVjdGx5IGluIHRoZSBtaWRkbGVcclxuICAgIGlmKCF0aGlzLiRvdmVybGF5IHx8ICh0aGlzLm9wdGlvbnMuaE9mZnNldCAhPT0gJ2F1dG8nKSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7bGVmdDogbGVmdCArICdweCd9KTtcclxuICAgICAgdGhpcy4kZWxlbWVudC5jc3Moe21hcmdpbjogJzBweCd9KTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgbW9kYWwuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcclxuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxyXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcclxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcclxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcclxuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS53aGljaCA9PT0gMTMgfHwgZS53aGljaCA9PT0gMzIpIHtcclxuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xyXG4gICAgICB0aGlzLiRvdmVybGF5Lm9mZignLnpmLnJldmVhbCcpLm9uKCdjbGljay56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSB8fCAkLmNvbnRhaW5zKF90aGlzLiRlbGVtZW50WzBdLCBlLnRhcmdldCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XHJcbiAgICAgICQod2luZG93KS5vbihgcG9wc3RhdGUuemYucmV2ZWFsOiR7dGhpcy5pZH1gLCB0aGlzLl9oYW5kbGVTdGF0ZS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9oYW5kbGVTdGF0ZShlKSB7XHJcbiAgICBpZih3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gKCAnIycgKyB0aGlzLmlkKSAmJiAhdGhpcy5pc0FjdGl2ZSl7IHRoaXMub3BlbigpOyB9XHJcbiAgICBlbHNleyB0aGlzLmNsb3NlKCk7IH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgbW9kYWwgY29udHJvbGxlZCBieSBgdGhpcy4kYW5jaG9yYCwgYW5kIGNsb3NlcyBhbGwgb3RoZXJzIGJ5IGRlZmF1bHQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXHJcbiAgICogQGZpcmVzIFJldmVhbCNvcGVuXHJcbiAgICovXHJcbiAgb3BlbigpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcclxuICAgICAgdmFyIGhhc2ggPSBgIyR7dGhpcy5pZH1gO1xyXG5cclxuICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBoYXNoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGhhc2g7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBNYWtlIGVsZW1lbnRzIGludmlzaWJsZSwgYnV0IHJlbW92ZSBkaXNwbGF5OiBub25lIHNvIHdlIGNhbiBnZXQgc2l6ZSBhbmQgcG9zaXRpb25pbmdcclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxyXG4gICAgICAgIC5zaG93KClcclxuICAgICAgICAuc2Nyb2xsVG9wKDApO1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgIHRoaXMuJG92ZXJsYXkuY3NzKHsndmlzaWJpbGl0eSc6ICdoaWRkZW4nfSkuc2hvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAuaGlkZSgpXHJcbiAgICAgIC5jc3MoeyAndmlzaWJpbGl0eSc6ICcnIH0pO1xyXG5cclxuICAgIGlmKHRoaXMuJG92ZXJsYXkpIHtcclxuICAgICAgdGhpcy4kb3ZlcmxheS5jc3Moeyd2aXNpYmlsaXR5JzogJyd9KS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpcGxlT3BlbmVkKSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBGaXJlcyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIG1vZGFsIG9wZW5zLlxyXG4gICAgICAgKiBDbG9zZXMgYW55IG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxyXG4gICAgICAgKiBAZXZlbnQgUmV2ZWFsI2Nsb3NlbWVcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi5yZXZlYWwnLCB0aGlzLmlkKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIHJldmVhbFxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25Jbikge1xyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcclxuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcclxuICAgICAgfVxyXG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kZWxlbWVudCwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkluLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBqUXVlcnkgbWV0aG9kIG9mIHJldmVhbFxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xyXG4gICAgICAgIHRoaXMuJG92ZXJsYXkuc2hvdygwKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLiRlbGVtZW50LnNob3codGhpcy5vcHRpb25zLnNob3dEZWxheSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaGFuZGxlIGFjY2Vzc2liaWxpdHlcclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWhpZGRlbic6IGZhbHNlLFxyXG4gICAgICAgICd0YWJpbmRleCc6IC0xXHJcbiAgICAgIH0pXHJcbiAgICAgIC5mb2N1cygpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaGFzIHN1Y2Nlc3NmdWxseSBvcGVuZWQuXHJcbiAgICAgKiBAZXZlbnQgUmV2ZWFsI29wZW5cclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvcGVuLnpmLnJldmVhbCcpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzaU9TKSB7XHJcbiAgICAgIHZhciBzY3JvbGxQb3MgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XHJcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKS5zY3JvbGxUb3Aoc2Nyb2xsUG9zKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgJCgnYm9keScpXHJcbiAgICAgIC5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKVxyXG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCAodGhpcy5vcHRpb25zLm92ZXJsYXkgfHwgdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pID8gdHJ1ZSA6IGZhbHNlKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgdGhpcy5fZXh0cmFIYW5kbGVycygpO1xyXG4gICAgfSwgMCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV4dHJhIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgYm9keSBhbmQgd2luZG93IGlmIG5lY2Vzc2FyeS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9leHRyYUhhbmRsZXJzKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuZm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XHJcblxyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMub3ZlcmxheSAmJiB0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrICYmICF0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbikge1xyXG4gICAgICAkKCdib2R5Jykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cclxuICAgICAgICBfdGhpcy5jbG9zZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcclxuICAgICAgJCh3aW5kb3cpLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnUmV2ZWFsJywge1xyXG4gICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XHJcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9jayBmb2N1cyB3aXRoaW4gbW9kYWwgd2hpbGUgdGFiYmluZ1xyXG4gICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKTtcclxuICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxyXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnUmV2ZWFsJywge1xyXG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgtMSkpKSB7IC8vIGxlZnQgbW9kYWwgZG93bndhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcclxuICAgICAgICAgICAgX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoMCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmxlbmd0aCA9PT0gMCkgeyAvLyBubyBmb2N1c2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBtb2RhbCBhdCBhbGwsIHByZXZlbnQgdGFiYmluZyBpbiBnZW5lcmFsXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHRhYl9iYWNrd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XHJcbiAgICAgICAgICAgIF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKS5mb2N1cygpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJykpKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHNldCBmb2N1cyBiYWNrIHRvIGFuY2hvciBpZiBjbG9zZSBidXR0b24gaGFzIGJlZW4gYWN0aXZhdGVkXHJcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoJHRhcmdldC5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cykpIHsgLy8gZG9udCd0IHRyaWdnZXIgaWYgYWN1YWwgZWxlbWVudCBoYXMgZm9jdXMgKGkuZS4gaW5wdXRzLCBsaW5rcywgLi4uKVxyXG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIG1vZGFsLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBSZXZlYWwjY2xvc2VkXHJcbiAgICovXHJcbiAgY2xvc2UoKSB7XHJcbiAgICBpZiAoIXRoaXMuaXNBY3RpdmUgfHwgIXRoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIGhpZGluZ1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQpIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRvdmVybGF5LCAnZmFkZS1vdXQnLCBmaW5pc2hVcCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZmluaXNoVXAoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uT3V0KTtcclxuICAgIH1cclxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgaGlkaW5nXHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKDAsIGZpbmlzaFVwKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBmaW5pc2hVcCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUodGhpcy5vcHRpb25zLmhpZGVEZWxheSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29uZGl0aW9uYWxzIHRvIHJlbW92ZSBleHRyYSBldmVudCBsaXN0ZW5lcnMgYWRkZWQgb24gb3BlblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XHJcbiAgICAgICQod2luZG93KS5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMub3ZlcmxheSAmJiB0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XHJcbiAgICAgICQoJ2JvZHknKS5vZmYoJ2NsaWNrLnpmLnJldmVhbCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGZpbmlzaFVwKCkge1xyXG4gICAgICBpZiAoX3RoaXMuaXNpT1MpIHtcclxuICAgICAgICAkKCdodG1sLCBib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkKCdib2R5JykuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2UsXHJcbiAgICAgICAgJ3RhYmluZGV4JzogJydcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaXMgZG9uZSBjbG9zaW5nLlxyXG4gICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VkXHJcbiAgICAgICovXHJcbiAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlZC56Zi5yZXZlYWwnKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICogUmVzZXRzIHRoZSBtb2RhbCBjb250ZW50XHJcbiAgICAqIFRoaXMgcHJldmVudHMgYSBydW5uaW5nIHZpZGVvIHRvIGtlZXAgZ29pbmcgaW4gdGhlIGJhY2tncm91bmRcclxuICAgICovXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc2V0T25DbG9zZSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lmh0bWwodGhpcy4kZWxlbWVudC5odG1sKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcclxuICAgICBpZiAoX3RoaXMub3B0aW9ucy5kZWVwTGluaykge1xyXG4gICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSkge1xyXG4gICAgICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoXCJcIiwgZG9jdW1lbnQudGl0bGUsIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XHJcbiAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xyXG4gICAgICAgfVxyXG4gICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2VkIHN0YXRlIG9mIGEgbW9kYWwuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgdG9nZ2xlKCkge1xyXG4gICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcclxuICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYSBtb2RhbC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXBwZW5kVG8oJCgnYm9keScpKTsgLy8gbW92ZSAkZWxlbWVudCBvdXRzaWRlIG9mICRvdmVybGF5IHRvIHByZXZlbnQgZXJyb3IgdW5yZWdpc3RlclBsdWdpbigpXHJcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC5oaWRlKCkub2ZmKCk7XHJcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcclxuICAgICQod2luZG93KS5vZmYoYC56Zi5yZXZlYWw6JHt0aGlzLmlkfWApO1xyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9O1xyXG59XHJcblxyXG5SZXZlYWwuZGVmYXVsdHMgPSB7XHJcbiAgLyoqXHJcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3NsaWRlLWluLWxlZnQnXHJcbiAgICovXHJcbiAgYW5pbWF0aW9uSW46ICcnLFxyXG4gIC8qKlxyXG4gICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdzbGlkZS1vdXQtcmlnaHQnXHJcbiAgICovXHJcbiAgYW5pbWF0aW9uT3V0OiAnJyxcclxuICAvKipcclxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMFxyXG4gICAqL1xyXG4gIHNob3dEZWxheTogMCxcclxuICAvKipcclxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMFxyXG4gICAqL1xyXG4gIGhpZGVEZWxheTogMCxcclxuICAvKipcclxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsb3NlT25Fc2M6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBtdWx0aXBsZU9wZW5lZDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGF1dG9cclxuICAgKi9cclxuICB2T2Zmc2V0OiAnYXV0bycsXHJcbiAgLyoqXHJcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGluIGZyb20gdGhlIHNpZGUgb2YgdGhlIHNjcmVlbi5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgYXV0b1xyXG4gICAqL1xyXG4gIGhPZmZzZXQ6ICdhdXRvJyxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBmdWxsU2NyZWVuOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMTBcclxuICAgKi9cclxuICBidG1PZmZzZXRQY3Q6IDEwLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIG92ZXJsYXk6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLCBvdGhlcndpc2UsIHZpZGVvcyB3aWxsIGNvbnRpbnVlIHRvIHBsYXkgaW4gdGhlIGJhY2tncm91bmQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgcmVzZXRPbkNsb3NlOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFsdGVyIHRoZSB1cmwgb24gb3Blbi9jbG9zZSwgYW5kIGFsbG93cyB0aGUgdXNlIG9mIHRoZSBgYmFja2AgYnV0dG9uIHRvIGNsb3NlIG1vZGFscy4gQUxTTywgYWxsb3dzIGEgbW9kYWwgdG8gYXV0by1tYW5pYWNhbGx5IG9wZW4gb24gcGFnZSBsb2FkIElGIHRoZSBoYXNoID09PSB0aGUgbW9kYWwncyB1c2VyLXNldCBpZC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBkZWVwTGluazogZmFsc2VcclxufTtcclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFJldmVhbCwgJ1JldmVhbCcpO1xyXG5cclxuZnVuY3Rpb24gaVBob25lU25pZmYoKSB7XHJcbiAgcmV0dXJuIC9pUChhZHxob25lfG9kKS4qT1MvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpO1xyXG59XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogU2xpZGVyIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnNsaWRlclxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50b3VjaFxyXG4gKi9cclxuXHJcbmNsYXNzIFNsaWRlciB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyaWxsZG93biBtZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uIG1lbnUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFNsaWRlci5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdTbGlkZXInKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1NsaWRlcicsIHtcclxuICAgICAgJ2x0cic6IHtcclxuICAgICAgICAnQVJST1dfUklHSFQnOiAnaW5jcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19VUCc6ICdpbmNyZWFzZScsXHJcbiAgICAgICAgJ0FSUk9XX0RPV04nOiAnZGVjcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19MRUZUJzogJ2RlY3JlYXNlJyxcclxuICAgICAgICAnU0hJRlRfQVJST1dfUklHSFQnOiAnaW5jcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX1VQJzogJ2luY3JlYXNlX2Zhc3QnLFxyXG4gICAgICAgICdTSElGVF9BUlJPV19ET1dOJzogJ2RlY3JlYXNlX2Zhc3QnLFxyXG4gICAgICAgICdTSElGVF9BUlJPV19MRUZUJzogJ2RlY3JlYXNlX2Zhc3QnXHJcbiAgICAgIH0sXHJcbiAgICAgICdydGwnOiB7XHJcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnaW5jcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19SSUdIVCc6ICdkZWNyZWFzZScsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX0xFRlQnOiAnaW5jcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX1JJR0hUJzogJ2RlY3JlYXNlX2Zhc3QnXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlsaXplcyB0aGUgcGx1Z2luIGJ5IHJlYWRpbmcvc2V0dGluZyBhdHRyaWJ1dGVzLCBjcmVhdGluZyBjb2xsZWN0aW9ucyBhbmQgc2V0dGluZyB0aGUgaW5pdGlhbCBwb3NpdGlvbiBvZiB0aGUgaGFuZGxlKHMpLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLmlucHV0cyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQnKTtcclxuICAgIHRoaXMuaGFuZGxlcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc2xpZGVyLWhhbmRsZV0nKTtcclxuXHJcbiAgICB0aGlzLiRoYW5kbGUgPSB0aGlzLmhhbmRsZXMuZXEoMCk7XHJcbiAgICB0aGlzLiRpbnB1dCA9IHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzLmVxKDApIDogJChgIyR7dGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtY29udHJvbHMnKX1gKTtcclxuICAgIHRoaXMuJGZpbGwgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXNsaWRlci1maWxsXScpLmNzcyh0aGlzLm9wdGlvbnMudmVydGljYWwgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsIDApO1xyXG5cclxuICAgIHZhciBpc0RibCA9IGZhbHNlLFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZWQgfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMuZGlzYWJsZWRDbGFzcykpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuZGlzYWJsZWRDbGFzcyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuaW5wdXRzLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmlucHV0cyA9ICQoKS5hZGQodGhpcy4kaW5wdXQpO1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYmluZGluZyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9zZXRJbml0QXR0cigwKTtcclxuICAgIHRoaXMuX2V2ZW50cyh0aGlzLiRoYW5kbGUpO1xyXG5cclxuICAgIGlmICh0aGlzLmhhbmRsZXNbMV0pIHtcclxuICAgICAgdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkID0gdHJ1ZTtcclxuICAgICAgdGhpcy4kaGFuZGxlMiA9IHRoaXMuaGFuZGxlcy5lcSgxKTtcclxuICAgICAgdGhpcy4kaW5wdXQyID0gdGhpcy5pbnB1dHMubGVuZ3RoID4gMSA/IHRoaXMuaW5wdXRzLmVxKDEpIDogJChgIyR7dGhpcy4kaGFuZGxlMi5hdHRyKCdhcmlhLWNvbnRyb2xzJyl9YCk7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuaW5wdXRzWzFdKSB7XHJcbiAgICAgICAgdGhpcy5pbnB1dHMgPSB0aGlzLmlucHV0cy5hZGQodGhpcy4kaW5wdXQyKTtcclxuICAgICAgfVxyXG4gICAgICBpc0RibCA9IHRydWU7XHJcblxyXG4gICAgICB0aGlzLl9zZXRIYW5kbGVQb3ModGhpcy4kaGFuZGxlLCB0aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0LCB0cnVlLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgX3RoaXMuX3NldEhhbmRsZVBvcyhfdGhpcy4kaGFuZGxlMiwgX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kLCB0cnVlKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8vIHRoaXMuJGhhbmRsZS50cmlnZ2VySGFuZGxlcignY2xpY2suemYuc2xpZGVyJyk7XHJcbiAgICAgIHRoaXMuX3NldEluaXRBdHRyKDEpO1xyXG4gICAgICB0aGlzLl9ldmVudHModGhpcy4kaGFuZGxlMik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpc0RibCkge1xyXG4gICAgICB0aGlzLl9zZXRIYW5kbGVQb3ModGhpcy4kaGFuZGxlLCB0aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0LCB0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBzZWxlY3RlZCBoYW5kbGUgYW5kIGZpbGwgYmFyLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRobmRsIC0gdGhlIHNlbGVjdGVkIGhhbmRsZSB0byBtb3ZlLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsb2NhdGlvbiAtIGZsb2F0aW5nIHBvaW50IGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIG9mIHRoZSBzbGlkZXIgYmFyLlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gY2FsbGJhY2sgZnVuY3Rpb24gdG8gZmlyZSBvbiBjb21wbGV0aW9uLlxyXG4gICAqIEBmaXJlcyBTbGlkZXIjbW92ZWRcclxuICAgKiBAZmlyZXMgU2xpZGVyI2NoYW5nZWRcclxuICAgKi9cclxuICBfc2V0SGFuZGxlUG9zKCRobmRsLCBsb2NhdGlvbiwgbm9JbnZlcnQsIGNiKSB7XHJcbiAgLy9taWdodCBuZWVkIHRvIGFsdGVyIHRoYXQgc2xpZ2h0bHkgZm9yIGJhcnMgdGhhdCB3aWxsIGhhdmUgb2RkIG51bWJlciBzZWxlY3Rpb25zLlxyXG4gICAgbG9jYXRpb24gPSBwYXJzZUZsb2F0KGxvY2F0aW9uKTsvL29uIGlucHV0IGNoYW5nZSBldmVudHMsIGNvbnZlcnQgc3RyaW5nIHRvIG51bWJlci4uLmdydW1ibGUuXHJcblxyXG4gICAgLy8gcHJldmVudCBzbGlkZXIgZnJvbSBydW5uaW5nIG91dCBvZiBib3VuZHMsIGlmIHZhbHVlIGV4Y2VlZHMgdGhlIGxpbWl0cyBzZXQgdGhyb3VnaCBvcHRpb25zLCBvdmVycmlkZSB0aGUgdmFsdWUgdG8gbWluL21heFxyXG4gICAgaWYgKGxvY2F0aW9uIDwgdGhpcy5vcHRpb25zLnN0YXJ0KSB7IGxvY2F0aW9uID0gdGhpcy5vcHRpb25zLnN0YXJ0OyB9XHJcbiAgICBlbHNlIGlmIChsb2NhdGlvbiA+IHRoaXMub3B0aW9ucy5lbmQpIHsgbG9jYXRpb24gPSB0aGlzLm9wdGlvbnMuZW5kOyB9XHJcblxyXG4gICAgdmFyIGlzRGJsID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkO1xyXG5cclxuICAgIGlmIChpc0RibCkgeyAvL3RoaXMgYmxvY2sgaXMgdG8gcHJldmVudCAyIGhhbmRsZXMgZnJvbSBjcm9zc2luZyBlYWNob3RoZXIuIENvdWxkL3Nob3VsZCBiZSBpbXByb3ZlZC5cclxuICAgICAgaWYgKHRoaXMuaGFuZGxlcy5pbmRleCgkaG5kbCkgPT09IDApIHtcclxuICAgICAgICB2YXIgaDJWYWwgPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZTIuYXR0cignYXJpYS12YWx1ZW5vdycpKTtcclxuICAgICAgICBsb2NhdGlvbiA9IGxvY2F0aW9uID49IGgyVmFsID8gaDJWYWwgLSB0aGlzLm9wdGlvbnMuc3RlcCA6IGxvY2F0aW9uO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBoMVZhbCA9IHBhcnNlRmxvYXQodGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnKSk7XHJcbiAgICAgICAgbG9jYXRpb24gPSBsb2NhdGlvbiA8PSBoMVZhbCA/IGgxVmFsICsgdGhpcy5vcHRpb25zLnN0ZXAgOiBsb2NhdGlvbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vdGhpcyBpcyBmb3Igc2luZ2xlLWhhbmRsZWQgdmVydGljYWwgc2xpZGVycywgaXQgYWRqdXN0cyB0aGUgdmFsdWUgdG8gYWNjb3VudCBmb3IgdGhlIHNsaWRlciBiZWluZyBcInVwc2lkZS1kb3duXCJcclxuICAgIC8vZm9yIGNsaWNrIGFuZCBkcmFnIGV2ZW50cywgaXQncyB3ZWlyZCBkdWUgdG8gdGhlIHNjYWxlKC0xLCAxKSBjc3MgcHJvcGVydHlcclxuICAgIGlmICh0aGlzLm9wdGlvbnMudmVydGljYWwgJiYgIW5vSW52ZXJ0KSB7XHJcbiAgICAgIGxvY2F0aW9uID0gdGhpcy5vcHRpb25zLmVuZCAtIGxvY2F0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgdmVydCA9IHRoaXMub3B0aW9ucy52ZXJ0aWNhbCxcclxuICAgICAgICBoT3JXID0gdmVydCA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcclxuICAgICAgICBsT3JUID0gdmVydCA/ICd0b3AnIDogJ2xlZnQnLFxyXG4gICAgICAgIGhhbmRsZURpbSA9ICRobmRsWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2hPclddLFxyXG4gICAgICAgIGVsZW1EaW0gPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2hPclddLFxyXG4gICAgICAgIC8vcGVyY2VudGFnZSBvZiBiYXIgbWluL21heCB2YWx1ZSBiYXNlZCBvbiBjbGljayBvciBkcmFnIHBvaW50XHJcbiAgICAgICAgcGN0T2ZCYXIgPSBwZXJjZW50KGxvY2F0aW9uIC0gdGhpcy5vcHRpb25zLnN0YXJ0LCB0aGlzLm9wdGlvbnMuZW5kIC0gdGhpcy5vcHRpb25zLnN0YXJ0KS50b0ZpeGVkKDIpLFxyXG4gICAgICAgIC8vbnVtYmVyIG9mIGFjdHVhbCBwaXhlbHMgdG8gc2hpZnQgdGhlIGhhbmRsZSwgYmFzZWQgb24gdGhlIHBlcmNlbnRhZ2Ugb2J0YWluZWQgYWJvdmVcclxuICAgICAgICBweFRvTW92ZSA9IChlbGVtRGltIC0gaGFuZGxlRGltKSAqIHBjdE9mQmFyLFxyXG4gICAgICAgIC8vcGVyY2VudGFnZSBvZiBiYXIgdG8gc2hpZnQgdGhlIGhhbmRsZVxyXG4gICAgICAgIG1vdmVtZW50ID0gKHBlcmNlbnQocHhUb01vdmUsIGVsZW1EaW0pICogMTAwKS50b0ZpeGVkKHRoaXMub3B0aW9ucy5kZWNpbWFsKTtcclxuICAgICAgICAvL2ZpeGluZyB0aGUgZGVjaW1hbCB2YWx1ZSBmb3IgdGhlIGxvY2F0aW9uIG51bWJlciwgaXMgcGFzc2VkIHRvIG90aGVyIG1ldGhvZHMgYXMgYSBmaXhlZCBmbG9hdGluZy1wb2ludCB2YWx1ZVxyXG4gICAgICAgIGxvY2F0aW9uID0gcGFyc2VGbG9hdChsb2NhdGlvbi50b0ZpeGVkKHRoaXMub3B0aW9ucy5kZWNpbWFsKSk7XHJcbiAgICAgICAgLy8gZGVjbGFyZSBlbXB0eSBvYmplY3QgZm9yIGNzcyBhZGp1c3RtZW50cywgb25seSB1c2VkIHdpdGggMiBoYW5kbGVkLXNsaWRlcnNcclxuICAgIHZhciBjc3MgPSB7fTtcclxuXHJcbiAgICB0aGlzLl9zZXRWYWx1ZXMoJGhuZGwsIGxvY2F0aW9uKTtcclxuXHJcbiAgICAvLyBUT0RPIHVwZGF0ZSB0byBjYWxjdWxhdGUgYmFzZWQgb24gdmFsdWVzIHNldCB0byByZXNwZWN0aXZlIGlucHV0cz8/XHJcbiAgICBpZiAoaXNEYmwpIHtcclxuICAgICAgdmFyIGlzTGVmdEhuZGwgPSB0aGlzLmhhbmRsZXMuaW5kZXgoJGhuZGwpID09PSAwLFxyXG4gICAgICAgICAgLy9lbXB0eSB2YXJpYWJsZSwgd2lsbCBiZSB1c2VkIGZvciBtaW4taGVpZ2h0L3dpZHRoIGZvciBmaWxsIGJhclxyXG4gICAgICAgICAgZGltLFxyXG4gICAgICAgICAgLy9wZXJjZW50YWdlIHcvaCBvZiB0aGUgaGFuZGxlIGNvbXBhcmVkIHRvIHRoZSBzbGlkZXIgYmFyXHJcbiAgICAgICAgICBoYW5kbGVQY3QgPSAgfn4ocGVyY2VudChoYW5kbGVEaW0sIGVsZW1EaW0pICogMTAwKTtcclxuICAgICAgLy9pZiBsZWZ0IGhhbmRsZSwgdGhlIG1hdGggaXMgc2xpZ2h0bHkgZGlmZmVyZW50IHRoYW4gaWYgaXQncyB0aGUgcmlnaHQgaGFuZGxlLCBhbmQgdGhlIGxlZnQvdG9wIHByb3BlcnR5IG5lZWRzIHRvIGJlIGNoYW5nZWQgZm9yIHRoZSBmaWxsIGJhclxyXG4gICAgICBpZiAoaXNMZWZ0SG5kbCkge1xyXG4gICAgICAgIC8vbGVmdCBvciB0b3AgcGVyY2VudGFnZSB2YWx1ZSB0byBhcHBseSB0byB0aGUgZmlsbCBiYXIuXHJcbiAgICAgICAgY3NzW2xPclRdID0gYCR7bW92ZW1lbnR9JWA7XHJcbiAgICAgICAgLy9jYWxjdWxhdGUgdGhlIG5ldyBtaW4taGVpZ2h0L3dpZHRoIGZvciB0aGUgZmlsbCBiYXIuXHJcbiAgICAgICAgZGltID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGUyWzBdLnN0eWxlW2xPclRdKSAtIG1vdmVtZW50ICsgaGFuZGxlUGN0O1xyXG4gICAgICAgIC8vdGhpcyBjYWxsYmFjayBpcyBuZWNlc3NhcnkgdG8gcHJldmVudCBlcnJvcnMgYW5kIGFsbG93IHRoZSBwcm9wZXIgcGxhY2VtZW50IGFuZCBpbml0aWFsaXphdGlvbiBvZiBhIDItaGFuZGxlZCBzbGlkZXJcclxuICAgICAgICAvL3BsdXMsIGl0IG1lYW5zIHdlIGRvbid0IGNhcmUgaWYgJ2RpbScgaXNOYU4gb24gaW5pdCwgaXQgd29uJ3QgYmUgaW4gdGhlIGZ1dHVyZS5cclxuICAgICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH0vL3RoaXMgaXMgb25seSBuZWVkZWQgZm9yIHRoZSBpbml0aWFsaXphdGlvbiBvZiAyIGhhbmRsZWQgc2xpZGVyc1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vanVzdCBjYWNoaW5nIHRoZSB2YWx1ZSBvZiB0aGUgbGVmdC9ib3R0b20gaGFuZGxlJ3MgbGVmdC90b3AgcHJvcGVydHlcclxuICAgICAgICB2YXIgaGFuZGxlUG9zID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGVbMF0uc3R5bGVbbE9yVF0pO1xyXG4gICAgICAgIC8vY2FsY3VsYXRlIHRoZSBuZXcgbWluLWhlaWdodC93aWR0aCBmb3IgdGhlIGZpbGwgYmFyLiBVc2UgaXNOYU4gdG8gcHJldmVudCBmYWxzZSBwb3NpdGl2ZXMgZm9yIG51bWJlcnMgPD0gMFxyXG4gICAgICAgIC8vYmFzZWQgb24gdGhlIHBlcmNlbnRhZ2Ugb2YgbW92ZW1lbnQgb2YgdGhlIGhhbmRsZSBiZWluZyBtYW5pcHVsYXRlZCwgbGVzcyB0aGUgb3Bwb3NpbmcgaGFuZGxlJ3MgbGVmdC90b3AgcG9zaXRpb24sIHBsdXMgdGhlIHBlcmNlbnRhZ2Ugdy9oIG9mIHRoZSBoYW5kbGUgaXRzZWxmXHJcbiAgICAgICAgZGltID0gbW92ZW1lbnQgLSAoaXNOYU4oaGFuZGxlUG9zKSA/IHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQvKCh0aGlzLm9wdGlvbnMuZW5kLXRoaXMub3B0aW9ucy5zdGFydCkvMTAwKSA6IGhhbmRsZVBvcykgKyBoYW5kbGVQY3Q7XHJcbiAgICAgIH1cclxuICAgICAgLy8gYXNzaWduIHRoZSBtaW4taGVpZ2h0L3dpZHRoIHRvIG91ciBjc3Mgb2JqZWN0XHJcbiAgICAgIGNzc1tgbWluLSR7aE9yV31gXSA9IGAke2RpbX0lYDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uZSgnZmluaXNoZWQuemYuYW5pbWF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGhhbmRsZSBpcyBkb25lIG1vdmluZy5cclxuICAgICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU2xpZGVyI21vdmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignbW92ZWQuemYuc2xpZGVyJywgWyRobmRsXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAvL2JlY2F1c2Ugd2UgZG9uJ3Qga25vdyBleGFjdGx5IGhvdyB0aGUgaGFuZGxlIHdpbGwgYmUgbW92ZWQsIGNoZWNrIHRoZSBhbW91bnQgb2YgdGltZSBpdCBzaG91bGQgdGFrZSB0byBtb3ZlLlxyXG4gICAgdmFyIG1vdmVUaW1lID0gdGhpcy4kZWxlbWVudC5kYXRhKCdkcmFnZ2luZycpID8gMTAwMC82MCA6IHRoaXMub3B0aW9ucy5tb3ZlVGltZTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLk1vdmUobW92ZVRpbWUsICRobmRsLCBmdW5jdGlvbigpIHtcclxuICAgICAgLy9hZGp1c3RpbmcgdGhlIGxlZnQvdG9wIHByb3BlcnR5IG9mIHRoZSBoYW5kbGUsIGJhc2VkIG9uIHRoZSBwZXJjZW50YWdlIGNhbGN1bGF0ZWQgYWJvdmVcclxuICAgICAgJGhuZGwuY3NzKGxPclQsIGAke21vdmVtZW50fSVgKTtcclxuXHJcbiAgICAgIGlmICghX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCkge1xyXG4gICAgICAgIC8vaWYgc2luZ2xlLWhhbmRsZWQsIGEgc2ltcGxlIG1ldGhvZCB0byBleHBhbmQgdGhlIGZpbGwgYmFyXHJcbiAgICAgICAgX3RoaXMuJGZpbGwuY3NzKGhPclcsIGAke3BjdE9mQmFyICogMTAwfSVgKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvL290aGVyd2lzZSwgdXNlIHRoZSBjc3Mgb2JqZWN0IHdlIGNyZWF0ZWQgYWJvdmVcclxuICAgICAgICBfdGhpcy4kZmlsbC5jc3MoY3NzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSB2YWx1ZSBoYXMgbm90IGJlZW4gY2hhbmdlIGZvciBhIGdpdmVuIHRpbWUuXHJcbiAgICAgKiBAZXZlbnQgU2xpZGVyI2NoYW5nZWRcclxuICAgICAqLyAgICBcclxuICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZWQuemYuc2xpZGVyJywgWyRobmRsXSk7XHJcbiAgICB9LCBfdGhpcy5vcHRpb25zLmNoYW5nZWREZWxheSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBpbml0aWFsIGF0dHJpYnV0ZSBmb3IgdGhlIHNsaWRlciBlbGVtZW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGlkeCAtIGluZGV4IG9mIHRoZSBjdXJyZW50IGhhbmRsZS9pbnB1dCB0byB1c2UuXHJcbiAgICovXHJcbiAgX3NldEluaXRBdHRyKGlkeCkge1xyXG4gICAgdmFyIGlkID0gdGhpcy5pbnB1dHMuZXEoaWR4KS5hdHRyKCdpZCcpIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3NsaWRlcicpO1xyXG4gICAgdGhpcy5pbnB1dHMuZXEoaWR4KS5hdHRyKHtcclxuICAgICAgJ2lkJzogaWQsXHJcbiAgICAgICdtYXgnOiB0aGlzLm9wdGlvbnMuZW5kLFxyXG4gICAgICAnbWluJzogdGhpcy5vcHRpb25zLnN0YXJ0LFxyXG4gICAgICAnc3RlcCc6IHRoaXMub3B0aW9ucy5zdGVwXHJcbiAgICB9KTtcclxuICAgIHRoaXMuaGFuZGxlcy5lcShpZHgpLmF0dHIoe1xyXG4gICAgICAncm9sZSc6ICdzbGlkZXInLFxyXG4gICAgICAnYXJpYS1jb250cm9scyc6IGlkLFxyXG4gICAgICAnYXJpYS12YWx1ZW1heCc6IHRoaXMub3B0aW9ucy5lbmQsXHJcbiAgICAgICdhcmlhLXZhbHVlbWluJzogdGhpcy5vcHRpb25zLnN0YXJ0LFxyXG4gICAgICAnYXJpYS12YWx1ZW5vdyc6IGlkeCA9PT0gMCA/IHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQgOiB0aGlzLm9wdGlvbnMuaW5pdGlhbEVuZCxcclxuICAgICAgJ2FyaWEtb3JpZW50YXRpb24nOiB0aGlzLm9wdGlvbnMudmVydGljYWwgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnLFxyXG4gICAgICAndGFiaW5kZXgnOiAwXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGlucHV0IGFuZCBgYXJpYS12YWx1ZW5vd2AgdmFsdWVzIGZvciB0aGUgc2xpZGVyIGVsZW1lbnQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaGFuZGxlLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBvZiB0aGUgbmV3IHZhbHVlLlxyXG4gICAqL1xyXG4gIF9zZXRWYWx1ZXMoJGhhbmRsZSwgdmFsKSB7XHJcbiAgICB2YXIgaWR4ID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkID8gdGhpcy5oYW5kbGVzLmluZGV4KCRoYW5kbGUpIDogMDtcclxuICAgIHRoaXMuaW5wdXRzLmVxKGlkeCkudmFsKHZhbCk7XHJcbiAgICAkaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnLCB2YWwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBldmVudHMgb24gdGhlIHNsaWRlciBlbGVtZW50LlxyXG4gICAqIENhbGN1bGF0ZXMgdGhlIG5ldyBsb2NhdGlvbiBvZiB0aGUgY3VycmVudCBoYW5kbGUuXHJcbiAgICogSWYgdGhlcmUgYXJlIHR3byBoYW5kbGVzIGFuZCB0aGUgYmFyIHdhcyBjbGlja2VkLCBpdCBkZXRlcm1pbmVzIHdoaWNoIGhhbmRsZSB0byBtb3ZlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGUgLSB0aGUgYGV2ZW50YCBvYmplY3QgcGFzc2VkIGZyb20gdGhlIGxpc3RlbmVyLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnQgaGFuZGxlIHRvIGNhbGN1bGF0ZSBmb3IsIGlmIHNlbGVjdGVkLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBudW1iZXIgZm9yIHRoZSBuZXcgdmFsdWUgb2YgdGhlIHNsaWRlci5cclxuICAgKiBUT0RPIGNsZWFuIHRoaXMgdXAsIHRoZXJlJ3MgYSBsb3Qgb2YgcmVwZWF0ZWQgY29kZSBiZXR3ZWVuIHRoaXMgYW5kIHRoZSBfc2V0SGFuZGxlUG9zIGZuLlxyXG4gICAqL1xyXG4gIF9oYW5kbGVFdmVudChlLCAkaGFuZGxlLCB2YWwpIHtcclxuICAgIHZhciB2YWx1ZSwgaGFzVmFsO1xyXG4gICAgaWYgKCF2YWwpIHsvL2NsaWNrIG9yIGRyYWcgZXZlbnRzXHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICAgIHZlcnRpY2FsID0gdGhpcy5vcHRpb25zLnZlcnRpY2FsLFxyXG4gICAgICAgICAgcGFyYW0gPSB2ZXJ0aWNhbCA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcclxuICAgICAgICAgIGRpcmVjdGlvbiA9IHZlcnRpY2FsID8gJ3RvcCcgOiAnbGVmdCcsXHJcbiAgICAgICAgICBwYWdlWFkgPSB2ZXJ0aWNhbCA/IGUucGFnZVkgOiBlLnBhZ2VYLFxyXG4gICAgICAgICAgaGFsZk9mSGFuZGxlID0gdGhpcy4kaGFuZGxlWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW3BhcmFtXSAvIDIsXHJcbiAgICAgICAgICBiYXJEaW0gPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW3BhcmFtXSxcclxuICAgICAgICAgIGJhck9mZnNldCA9ICh0aGlzLiRlbGVtZW50Lm9mZnNldCgpW2RpcmVjdGlvbl0gLSAgcGFnZVhZKSxcclxuICAgICAgICAgIC8vaWYgdGhlIGN1cnNvciBwb3NpdGlvbiBpcyBsZXNzIHRoYW4gb3IgZ3JlYXRlciB0aGFuIHRoZSBlbGVtZW50cyBib3VuZGluZyBjb29yZGluYXRlcywgc2V0IGNvb3JkaW5hdGVzIHdpdGhpbiB0aG9zZSBib3VuZHNcclxuICAgICAgICAgIGJhclhZID0gYmFyT2Zmc2V0ID4gMCA/IC1oYWxmT2ZIYW5kbGUgOiAoYmFyT2Zmc2V0IC0gaGFsZk9mSGFuZGxlKSA8IC1iYXJEaW0gPyBiYXJEaW0gOiBNYXRoLmFicyhiYXJPZmZzZXQpLFxyXG4gICAgICAgICAgb2Zmc2V0UGN0ID0gcGVyY2VudChiYXJYWSwgYmFyRGltKTtcclxuICAgICAgdmFsdWUgPSAodGhpcy5vcHRpb25zLmVuZCAtIHRoaXMub3B0aW9ucy5zdGFydCkgKiBvZmZzZXRQY3QgKyB0aGlzLm9wdGlvbnMuc3RhcnQ7XHJcblxyXG4gICAgICAvLyB0dXJuIGV2ZXJ5dGhpbmcgYXJvdW5kIGZvciBSVEwsIHlheSBtYXRoIVxyXG4gICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSAmJiAhdGhpcy5vcHRpb25zLnZlcnRpY2FsKSB7dmFsdWUgPSB0aGlzLm9wdGlvbnMuZW5kIC0gdmFsdWU7fVxyXG5cclxuICAgICAgdmFsdWUgPSBfdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsdWUpO1xyXG4gICAgICAvL2Jvb2xlYW4gZmxhZyBmb3IgdGhlIHNldEhhbmRsZVBvcyBmbiwgc3BlY2lmaWNhbGx5IGZvciB2ZXJ0aWNhbCBzbGlkZXJzXHJcbiAgICAgIGhhc1ZhbCA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKCEkaGFuZGxlKSB7Ly9maWd1cmUgb3V0IHdoaWNoIGhhbmRsZSBpdCBpcywgcGFzcyBpdCB0byB0aGUgbmV4dCBmdW5jdGlvbi5cclxuICAgICAgICB2YXIgZmlyc3RIbmRsUG9zID0gYWJzUG9zaXRpb24odGhpcy4kaGFuZGxlLCBkaXJlY3Rpb24sIGJhclhZLCBwYXJhbSksXHJcbiAgICAgICAgICAgIHNlY25kSG5kbFBvcyA9IGFic1Bvc2l0aW9uKHRoaXMuJGhhbmRsZTIsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKTtcclxuICAgICAgICAgICAgJGhhbmRsZSA9IGZpcnN0SG5kbFBvcyA8PSBzZWNuZEhuZGxQb3MgPyB0aGlzLiRoYW5kbGUgOiB0aGlzLiRoYW5kbGUyO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHsvL2NoYW5nZSBldmVudCBvbiBpbnB1dFxyXG4gICAgICB2YWx1ZSA9IHRoaXMuX2FkanVzdFZhbHVlKG51bGwsIHZhbCk7XHJcbiAgICAgIGhhc1ZhbCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0SGFuZGxlUG9zKCRoYW5kbGUsIHZhbHVlLCBoYXNWYWwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRqdXN0ZXMgdmFsdWUgZm9yIGhhbmRsZSBpbiByZWdhcmQgdG8gc3RlcCB2YWx1ZS4gcmV0dXJucyBhZGp1c3RlZCB2YWx1ZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRoYW5kbGUgLSB0aGUgc2VsZWN0ZWQgaGFuZGxlLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSAtIHZhbHVlIHRvIGFkanVzdC4gdXNlZCBpZiAkaGFuZGxlIGlzIGZhbHN5XHJcbiAgICovXHJcbiAgX2FkanVzdFZhbHVlKCRoYW5kbGUsIHZhbHVlKSB7XHJcbiAgICB2YXIgdmFsLFxyXG4gICAgICBzdGVwID0gdGhpcy5vcHRpb25zLnN0ZXAsXHJcbiAgICAgIGRpdiA9IHBhcnNlRmxvYXQoc3RlcC8yKSxcclxuICAgICAgbGVmdCwgcHJldl92YWwsIG5leHRfdmFsO1xyXG4gICAgaWYgKCEhJGhhbmRsZSkge1xyXG4gICAgICB2YWwgPSBwYXJzZUZsb2F0KCRoYW5kbGUuYXR0cignYXJpYS12YWx1ZW5vdycpKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB2YWwgPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIGxlZnQgPSB2YWwgJSBzdGVwO1xyXG4gICAgcHJldl92YWwgPSB2YWwgLSBsZWZ0O1xyXG4gICAgbmV4dF92YWwgPSBwcmV2X3ZhbCArIHN0ZXA7XHJcbiAgICBpZiAobGVmdCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdmFsO1xyXG4gICAgfVxyXG4gICAgdmFsID0gdmFsID49IHByZXZfdmFsICsgZGl2ID8gbmV4dF92YWwgOiBwcmV2X3ZhbDtcclxuICAgIHJldHVybiB2YWw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgc2xpZGVyIGVsZW1lbnRzLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRoYW5kbGUgLSB0aGUgY3VycmVudCBoYW5kbGUgdG8gYXBwbHkgbGlzdGVuZXJzIHRvLlxyXG4gICAqL1xyXG4gIF9ldmVudHMoJGhhbmRsZSkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlZCkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGN1ckhhbmRsZSxcclxuICAgICAgICB0aW1lcjtcclxuXHJcbiAgICAgIHRoaXMuaW5wdXRzLm9mZignY2hhbmdlLnpmLnNsaWRlcicpLm9uKCdjaGFuZ2UuemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBfdGhpcy5pbnB1dHMuaW5kZXgoJCh0aGlzKSk7XHJcbiAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUsIF90aGlzLmhhbmRsZXMuZXEoaWR4KSwgJCh0aGlzKS52YWwoKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja1NlbGVjdCkge1xyXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdjbGljay56Zi5zbGlkZXInKS5vbignY2xpY2suemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICAgaWYgKCEkKGUudGFyZ2V0KS5pcygnW2RhdGEtc2xpZGVyLWhhbmRsZV0nKSkge1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCkge1xyXG4gICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgX3RoaXMuJGhhbmRsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlKSB7XHJcbiAgICAgIHRoaXMuaGFuZGxlcy5hZGRUb3VjaCgpO1xyXG5cclxuICAgICAgdmFyICRib2R5ID0gJCgnYm9keScpO1xyXG4gICAgICAkaGFuZGxlXHJcbiAgICAgICAgLm9mZignbW91c2Vkb3duLnpmLnNsaWRlcicpXHJcbiAgICAgICAgLm9uKCdtb3VzZWRvd24uemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgJGhhbmRsZS5hZGRDbGFzcygnaXMtZHJhZ2dpbmcnKTtcclxuICAgICAgICAgIF90aGlzLiRmaWxsLmFkZENsYXNzKCdpcy1kcmFnZ2luZycpOy8vXHJcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdkcmFnZ2luZycsIHRydWUpO1xyXG5cclxuICAgICAgICAgIGN1ckhhbmRsZSA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgICAkYm9keS5vbignbW91c2Vtb3ZlLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUsIGN1ckhhbmRsZSk7XHJcblxyXG4gICAgICAgICAgfSkub24oJ21vdXNldXAuemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgY3VySGFuZGxlKTtcclxuXHJcbiAgICAgICAgICAgICRoYW5kbGUucmVtb3ZlQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XHJcbiAgICAgICAgICAgIF90aGlzLiRmaWxsLnJlbW92ZUNsYXNzKCdpcy1kcmFnZ2luZycpO1xyXG4gICAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdkcmFnZ2luZycsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgICRib2R5Lm9mZignbW91c2Vtb3ZlLnpmLnNsaWRlciBtb3VzZXVwLnpmLnNsaWRlcicpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICRoYW5kbGUub2ZmKCdrZXlkb3duLnpmLnNsaWRlcicpLm9uKCdrZXlkb3duLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIF8kaGFuZGxlID0gJCh0aGlzKSxcclxuICAgICAgICAgIGlkeCA9IF90aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQgPyBfdGhpcy5oYW5kbGVzLmluZGV4KF8kaGFuZGxlKSA6IDAsXHJcbiAgICAgICAgICBvbGRWYWx1ZSA9IHBhcnNlRmxvYXQoX3RoaXMuaW5wdXRzLmVxKGlkeCkudmFsKCkpLFxyXG4gICAgICAgICAgbmV3VmFsdWU7XHJcblxyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdTbGlkZXInLCB7XHJcbiAgICAgICAgZGVjcmVhc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSAtIF90aGlzLm9wdGlvbnMuc3RlcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluY3JlYXNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgKyBfdGhpcy5vcHRpb25zLnN0ZXA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZWNyZWFzZV9mYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgLSBfdGhpcy5vcHRpb25zLnN0ZXAgKiAxMDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluY3JlYXNlX2Zhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSArIF90aGlzLm9wdGlvbnMuc3RlcCAqIDEwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7IC8vIG9ubHkgc2V0IGhhbmRsZSBwb3Mgd2hlbiBldmVudCB3YXMgaGFuZGxlZCBzcGVjaWFsbHlcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvKmlmIChuZXdWYWx1ZSkgeyAvLyBpZiBwcmVzc2VkIGtleSBoYXMgc3BlY2lhbCBmdW5jdGlvbiwgdXBkYXRlIHZhbHVlXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlKTtcclxuICAgICAgfSovXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBzbGlkZXIgcGx1Z2luLlxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmhhbmRsZXMub2ZmKCcuemYuc2xpZGVyJyk7XHJcbiAgICB0aGlzLmlucHV0cy5vZmYoJy56Zi5zbGlkZXInKTtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYuc2xpZGVyJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuU2xpZGVyLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIE1pbmltdW0gdmFsdWUgZm9yIHRoZSBzbGlkZXIgc2NhbGUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDBcclxuICAgKi9cclxuICBzdGFydDogMCxcclxuICAvKipcclxuICAgKiBNYXhpbXVtIHZhbHVlIGZvciB0aGUgc2xpZGVyIHNjYWxlLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMDBcclxuICAgKi9cclxuICBlbmQ6IDEwMCxcclxuICAvKipcclxuICAgKiBNaW5pbXVtIHZhbHVlIGNoYW5nZSBwZXIgY2hhbmdlIGV2ZW50LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxXHJcbiAgICovXHJcbiAgc3RlcDogMSxcclxuICAvKipcclxuICAgKiBWYWx1ZSBhdCB3aGljaCB0aGUgaGFuZGxlL2lucHV0ICoobGVmdCBoYW5kbGUvZmlyc3QgaW5wdXQpKiBzaG91bGQgYmUgc2V0IHRvIG9uIGluaXRpYWxpemF0aW9uLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAwXHJcbiAgICovXHJcbiAgaW5pdGlhbFN0YXJ0OiAwLFxyXG4gIC8qKlxyXG4gICAqIFZhbHVlIGF0IHdoaWNoIHRoZSByaWdodCBoYW5kbGUvc2Vjb25kIGlucHV0IHNob3VsZCBiZSBzZXQgdG8gb24gaW5pdGlhbGl6YXRpb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDEwMFxyXG4gICAqL1xyXG4gIGluaXRpYWxFbmQ6IDEwMCxcclxuICAvKipcclxuICAgKiBBbGxvd3MgdGhlIGlucHV0IHRvIGJlIGxvY2F0ZWQgb3V0c2lkZSB0aGUgY29udGFpbmVyIGFuZCB2aXNpYmxlLiBTZXQgdG8gYnkgdGhlIEpTXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgYmluZGluZzogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB1c2VyIHRvIGNsaWNrL3RhcCBvbiB0aGUgc2xpZGVyIGJhciB0byBzZWxlY3QgYSB2YWx1ZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIGNsaWNrU2VsZWN0OiB0cnVlLFxyXG4gIC8qKlxyXG4gICAqIFNldCB0byB0cnVlIGFuZCB1c2UgdGhlIGB2ZXJ0aWNhbGAgY2xhc3MgdG8gY2hhbmdlIGFsaWdubWVudCB0byB2ZXJ0aWNhbC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICB2ZXJ0aWNhbDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIHRoZSB1c2VyIHRvIGRyYWcgdGhlIHNsaWRlciBoYW5kbGUocykgdG8gc2VsZWN0IGEgdmFsdWUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBkcmFnZ2FibGU6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogRGlzYWJsZXMgdGhlIHNsaWRlciBhbmQgcHJldmVudHMgZXZlbnQgbGlzdGVuZXJzIGZyb20gYmVpbmcgYXBwbGllZC4gRG91YmxlIGNoZWNrZWQgYnkgSlMgd2l0aCBgZGlzYWJsZWRDbGFzc2AuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgZGlzYWJsZWQ6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgdXNlIG9mIHR3byBoYW5kbGVzLiBEb3VibGUgY2hlY2tlZCBieSB0aGUgSlMuIENoYW5nZXMgc29tZSBsb2dpYyBoYW5kbGluZy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBkb3VibGVTaWRlZDogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogUG90ZW50aWFsIGZ1dHVyZSBmZWF0dXJlLlxyXG4gICAqL1xyXG4gIC8vIHN0ZXBzOiAxMDAsXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIHRoZSBwbHVnaW4gc2hvdWxkIGdvIHRvIGZvciBmbG9hdGluZyBwb2ludCBwcmVjaXNpb24uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDJcclxuICAgKi9cclxuICBkZWNpbWFsOiAyLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUgZGVsYXkgZm9yIGRyYWdnZWQgZWxlbWVudHMuXHJcbiAgICovXHJcbiAgLy8gZHJhZ0RlbGF5OiAwLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUsIGluIG1zLCB0byBhbmltYXRlIHRoZSBtb3ZlbWVudCBvZiBhIHNsaWRlciBoYW5kbGUgaWYgdXNlciBjbGlja3MvdGFwcyBvbiB0aGUgYmFyLiBOZWVkcyB0byBiZSBtYW51YWxseSBzZXQgaWYgdXBkYXRpbmcgdGhlIHRyYW5zaXRpb24gdGltZSBpbiB0aGUgU2FzcyBzZXR0aW5ncy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMjAwXHJcbiAgICovXHJcbiAgbW92ZVRpbWU6IDIwMCwvL3VwZGF0ZSB0aGlzIGlmIGNoYW5naW5nIHRoZSB0cmFuc2l0aW9uIHRpbWUgaW4gdGhlIHNhc3NcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGRpc2FibGVkIHNsaWRlcnMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdkaXNhYmxlZCdcclxuICAgKi9cclxuICBkaXNhYmxlZENsYXNzOiAnZGlzYWJsZWQnLFxyXG4gIC8qKlxyXG4gICAqIFdpbGwgaW52ZXJ0IHRoZSBkZWZhdWx0IGxheW91dCBmb3IgYSB2ZXJ0aWNhbDxzcGFuIGRhdGEtdG9vbHRpcCB0aXRsZT1cIndobyB3b3VsZCBkbyB0aGlzPz8/XCI+IDwvc3Bhbj5zbGlkZXIuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgaW52ZXJ0VmVydGljYWw6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIE1pbGxpc2Vjb25kcyBiZWZvcmUgdGhlIGBjaGFuZ2VkLnpmLXNsaWRlcmAgZXZlbnQgaXMgdHJpZ2dlcmVkIGFmdGVyIHZhbHVlIGNoYW5nZS4gXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwMFxyXG4gICAqL1xyXG4gIGNoYW5nZWREZWxheTogNTAwXHJcbn07XHJcblxyXG5mdW5jdGlvbiBwZXJjZW50KGZyYWMsIG51bSkge1xyXG4gIHJldHVybiAoZnJhYyAvIG51bSk7XHJcbn1cclxuZnVuY3Rpb24gYWJzUG9zaXRpb24oJGhhbmRsZSwgZGlyLCBjbGlja1BvcywgcGFyYW0pIHtcclxuICByZXR1cm4gTWF0aC5hYnMoKCRoYW5kbGUucG9zaXRpb24oKVtkaXJdICsgKCRoYW5kbGVbcGFyYW1dKCkgLyAyKSkgLSBjbGlja1Bvcyk7XHJcbn1cclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFNsaWRlciwgJ1NsaWRlcicpO1xyXG5cclxufShqUXVlcnkpO1xyXG5cclxuLy8qKioqKioqKip0aGlzIGlzIGluIGNhc2Ugd2UgZ28gdG8gc3RhdGljLCBhYnNvbHV0ZSBwb3NpdGlvbnMgaW5zdGVhZCBvZiBkeW5hbWljIHBvc2l0aW9uaW5nKioqKioqKipcclxuLy8gdGhpcy5zZXRTdGVwcyhmdW5jdGlvbigpIHtcclxuLy8gICBfdGhpcy5fZXZlbnRzKCk7XHJcbi8vICAgdmFyIGluaXRTdGFydCA9IF90aGlzLm9wdGlvbnMucG9zaXRpb25zW190aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0IC0gMV0gfHwgbnVsbDtcclxuLy8gICB2YXIgaW5pdEVuZCA9IF90aGlzLm9wdGlvbnMuaW5pdGlhbEVuZCA/IF90aGlzLm9wdGlvbnMucG9zaXRpb25bX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kIC0gMV0gOiBudWxsO1xyXG4vLyAgIGlmIChpbml0U3RhcnQgfHwgaW5pdEVuZCkge1xyXG4vLyAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGluaXRTdGFydCwgaW5pdEVuZCk7XHJcbi8vICAgfVxyXG4vLyB9KTtcclxuXHJcbi8vKioqKioqKioqKip0aGUgb3RoZXIgcGFydCBvZiBhYnNvbHV0ZSBwb3NpdGlvbnMqKioqKioqKioqKioqXHJcbi8vIFNsaWRlci5wcm90b3R5cGUuc2V0U3RlcHMgPSBmdW5jdGlvbihjYikge1xyXG4vLyAgIHZhciBwb3NDaGFuZ2UgPSB0aGlzLiRlbGVtZW50Lm91dGVyV2lkdGgoKSAvIHRoaXMub3B0aW9ucy5zdGVwcztcclxuLy8gICB2YXIgY291bnRlciA9IDBcclxuLy8gICB3aGlsZShjb3VudGVyIDwgdGhpcy5vcHRpb25zLnN0ZXBzKSB7XHJcbi8vICAgICBpZiAoY291bnRlcikge1xyXG4vLyAgICAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25zLnB1c2godGhpcy5vcHRpb25zLnBvc2l0aW9uc1tjb3VudGVyIC0gMV0gKyBwb3NDaGFuZ2UpO1xyXG4vLyAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgdGhpcy5vcHRpb25zLnBvc2l0aW9ucy5wdXNoKHBvc0NoYW5nZSk7XHJcbi8vICAgICB9XHJcbi8vICAgICBjb3VudGVyKys7XHJcbi8vICAgfVxyXG4vLyAgIGNiKCk7XHJcbi8vIH07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbiFmdW5jdGlvbigkKSB7XHJcblxyXG4vKipcclxuICogU3RpY2t5IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnN0aWNreVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxyXG4gKi9cclxuXHJcbmNsYXNzIFN0aWNreSB7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHN0aWNreSB0aGluZy5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBzdGlja3kuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25zIG9iamVjdCBwYXNzZWQgd2hlbiBjcmVhdGluZyB0aGUgZWxlbWVudCBwcm9ncmFtbWF0aWNhbGx5LlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFN0aWNreS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdTdGlja3knKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBzdGlja3kgZWxlbWVudCBieSBhZGRpbmcgY2xhc3NlcywgZ2V0dGluZy9zZXR0aW5nIGRpbWVuc2lvbnMsIGJyZWFrcG9pbnRzIGFuZCBhdHRyaWJ1dGVzXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN0aWNreS1jb250YWluZXJdJyksXHJcbiAgICAgICAgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3N0aWNreScpLFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZiAoISRwYXJlbnQubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMud2FzV3JhcHBlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkcGFyZW50Lmxlbmd0aCA/ICRwYXJlbnQgOiAkKHRoaXMub3B0aW9ucy5jb250YWluZXIpLndyYXBJbm5lcih0aGlzLiRlbGVtZW50KTtcclxuICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnN0aWNreUNsYXNzKVxyXG4gICAgICAgICAgICAgICAgIC5hdHRyKHsnZGF0YS1yZXNpemUnOiBpZH0pO1xyXG5cclxuICAgIHRoaXMuc2Nyb2xsQ291bnQgPSB0aGlzLm9wdGlvbnMuY2hlY2tFdmVyeTtcclxuICAgIHRoaXMuaXNTdHVjayA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uZSgnbG9hZC56Zi5zdGlja3knLCBmdW5jdGlvbigpe1xyXG4gICAgICBpZihfdGhpcy5vcHRpb25zLmFuY2hvciAhPT0gJycpe1xyXG4gICAgICAgIF90aGlzLiRhbmNob3IgPSAkKCcjJyArIF90aGlzLm9wdGlvbnMuYW5jaG9yKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgX3RoaXMuX3BhcnNlUG9pbnRzKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpe1xyXG4gICAgICAgIF90aGlzLl9jYWxjKGZhbHNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgIF90aGlzLl9ldmVudHMoaWQuc3BsaXQoJy0nKS5yZXZlcnNlKCkuam9pbignLScpKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgdXNpbmcgbXVsdGlwbGUgZWxlbWVudHMgYXMgYW5jaG9ycywgY2FsY3VsYXRlcyB0aGUgdG9wIGFuZCBib3R0b20gcGl4ZWwgdmFsdWVzIHRoZSBzdGlja3kgdGhpbmcgc2hvdWxkIHN0aWNrIGFuZCB1bnN0aWNrIG9uLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3BhcnNlUG9pbnRzKCkge1xyXG4gICAgdmFyIHRvcCA9IHRoaXMub3B0aW9ucy50b3BBbmNob3IsXHJcbiAgICAgICAgYnRtID0gdGhpcy5vcHRpb25zLmJ0bUFuY2hvcixcclxuICAgICAgICBwdHMgPSBbdG9wLCBidG1dLFxyXG4gICAgICAgIGJyZWFrcyA9IHt9O1xyXG4gICAgaWYgKHRvcCAmJiBidG0pIHtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwdHMubGVuZ3RoOyBpIDwgbGVuICYmIHB0c1tpXTsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHB0O1xyXG4gICAgICAgIGlmICh0eXBlb2YgcHRzW2ldID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgcHQgPSBwdHNbaV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciBwbGFjZSA9IHB0c1tpXS5zcGxpdCgnOicpLFxyXG4gICAgICAgICAgICAgIGFuY2hvciA9ICQoYCMke3BsYWNlWzBdfWApO1xyXG5cclxuICAgICAgICAgIHB0ID0gYW5jaG9yLm9mZnNldCgpLnRvcDtcclxuICAgICAgICAgIGlmIChwbGFjZVsxXSAmJiBwbGFjZVsxXS50b0xvd2VyQ2FzZSgpID09PSAnYm90dG9tJykge1xyXG4gICAgICAgICAgICBwdCArPSBhbmNob3JbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVha3NbaV0gPSBwdDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnJlYWtzID0gezA6IDEsIDE6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHR9O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucG9pbnRzID0gYnJlYWtzO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNjcm9sbGluZyBlbGVtZW50LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkIC0gcHN1ZWRvLXJhbmRvbSBpZCBmb3IgdW5pcXVlIHNjcm9sbCBldmVudCBsaXN0ZW5lci5cclxuICAgKi9cclxuICBfZXZlbnRzKGlkKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIHNjcm9sbExpc3RlbmVyID0gdGhpcy5zY3JvbGxMaXN0ZW5lciA9IGBzY3JvbGwuemYuJHtpZH1gO1xyXG4gICAgaWYgKHRoaXMuaXNPbikgeyByZXR1cm47IH1cclxuICAgIGlmICh0aGlzLmNhblN0aWNrKSB7XHJcbiAgICAgIHRoaXMuaXNPbiA9IHRydWU7XHJcbiAgICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpXHJcbiAgICAgICAgICAgICAgIC5vbihzY3JvbGxMaXN0ZW5lciwgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgIGlmIChfdGhpcy5zY3JvbGxDb3VudCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgX3RoaXMuc2Nyb2xsQ291bnQgPSBfdGhpcy5vcHRpb25zLmNoZWNrRXZlcnk7XHJcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5fc2V0U2l6ZXMoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50LS07XHJcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSwgd2luZG93LnBhZ2VZT2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKVxyXG4gICAgICAgICAgICAgICAgIC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUsIGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmNhblN0aWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLmlzT24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2V2ZW50cyhpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChfdGhpcy5pc09uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgZXZlbnQgaGFuZGxlcnMgZm9yIHNjcm9sbCBhbmQgY2hhbmdlIGV2ZW50cyBvbiBhbmNob3IuXHJcbiAgICogQGZpcmVzIFN0aWNreSNwYXVzZVxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzY3JvbGxMaXN0ZW5lciAtIHVuaXF1ZSwgbmFtZXNwYWNlZCBzY3JvbGwgbGlzdGVuZXIgYXR0YWNoZWQgdG8gYHdpbmRvd2BcclxuICAgKi9cclxuICBfcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpIHtcclxuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9mZihzY3JvbGxMaXN0ZW5lcik7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaXMgcGF1c2VkIGR1ZSB0byByZXNpemUgZXZlbnQgc2hyaW5raW5nIHRoZSB2aWV3LlxyXG4gICAgICogQGV2ZW50IFN0aWNreSNwYXVzZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncGF1c2UuemYuc3RpY2t5Jyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgb24gZXZlcnkgYHNjcm9sbGAgZXZlbnQgYW5kIG9uIGBfaW5pdGBcclxuICAgKiBmaXJlcyBmdW5jdGlvbnMgYmFzZWQgb24gYm9vbGVhbnMgYW5kIGNhY2hlZCB2YWx1ZXNcclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGNoZWNrU2l6ZXMgLSB0cnVlIGlmIHBsdWdpbiBzaG91bGQgcmVjYWxjdWxhdGUgc2l6ZXMgYW5kIGJyZWFrcG9pbnRzLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGwgLSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBwYXNzZWQgZnJvbSBzY3JvbGwgZXZlbnQgY2IgZnVuY3Rpb24uIElmIG5vdCBwYXNzZWQsIGRlZmF1bHRzIHRvIGB3aW5kb3cucGFnZVlPZmZzZXRgLlxyXG4gICAqL1xyXG4gIF9jYWxjKGNoZWNrU2l6ZXMsIHNjcm9sbCkge1xyXG4gICAgaWYgKGNoZWNrU2l6ZXMpIHsgdGhpcy5fc2V0U2l6ZXMoKTsgfVxyXG5cclxuICAgIGlmICghdGhpcy5jYW5TdGljaykge1xyXG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNjcm9sbCkgeyBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7IH1cclxuXHJcbiAgICBpZiAoc2Nyb2xsID49IHRoaXMudG9wUG9pbnQpIHtcclxuICAgICAgaWYgKHNjcm9sbCA8PSB0aGlzLmJvdHRvbVBvaW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzU3R1Y2spIHtcclxuICAgICAgICAgIHRoaXMuX3NldFN0aWNreSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3koZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMuaXNTdHVjaykge1xyXG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgc3R1Y2suXHJcbiAgICogQWRkcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cclxuICAgKiBAZmlyZXMgU3RpY2t5I3N0dWNrdG9cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9zZXRTdGlja3koKSB7XHJcbiAgICB2YXIgc3RpY2tUbyA9IHRoaXMub3B0aW9ucy5zdGlja1RvLFxyXG4gICAgICAgIG1yZ24gPSBzdGlja1RvID09PSAndG9wJyA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXHJcbiAgICAgICAgbm90U3R1Y2tUbyA9IHN0aWNrVG8gPT09ICd0b3AnID8gJ2JvdHRvbScgOiAndG9wJyxcclxuICAgICAgICBjc3MgPSB7fTtcclxuXHJcbiAgICBjc3NbbXJnbl0gPSBgJHt0aGlzLm9wdGlvbnNbbXJnbl19ZW1gO1xyXG4gICAgY3NzW3N0aWNrVG9dID0gMDtcclxuICAgIGNzc1tub3RTdHVja1RvXSA9ICdhdXRvJztcclxuICAgIGNzc1snbGVmdCddID0gdGhpcy4kY29udGFpbmVyLm9mZnNldCgpLmxlZnQgKyBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLiRjb250YWluZXJbMF0pW1wicGFkZGluZy1sZWZ0XCJdLCAxMCk7XHJcbiAgICB0aGlzLmlzU3R1Y2sgPSB0cnVlO1xyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgaXMtYW5jaG9yZWQgaXMtYXQtJHtub3RTdHVja1RvfWApXHJcbiAgICAgICAgICAgICAgICAgLmFkZENsYXNzKGBpcy1zdHVjayBpcy1hdC0ke3N0aWNrVG99YClcclxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcclxuICAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSAkZWxlbWVudCBoYXMgYmVjb21lIGBwb3NpdGlvbjogZml4ZWQ7YFxyXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi5zdHVja3RvOnRvcGBcclxuICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU3RpY2t5I3N0dWNrdG9cclxuICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnN0dWNrdG86JHtzdGlja1RvfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgdW5zdHVjay5cclxuICAgKiBSZW1vdmVzIGBwb3NpdGlvbjogZml4ZWQ7YCwgYW5kIGhlbHBlciBjbGFzc2VzLlxyXG4gICAqIEFkZHMgb3RoZXIgaGVscGVyIGNsYXNzZXMuXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1RvcCAtIHRlbGxzIHRoZSBmdW5jdGlvbiBpZiB0aGUgJGVsZW1lbnQgc2hvdWxkIGFuY2hvciB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiBpdHMgJGFuY2hvciBlbGVtZW50LlxyXG4gICAqIEBmaXJlcyBTdGlja3kjdW5zdHVja2Zyb21cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9yZW1vdmVTdGlja3koaXNUb3ApIHtcclxuICAgIHZhciBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXHJcbiAgICAgICAgc3RpY2tUb1RvcCA9IHN0aWNrVG8gPT09ICd0b3AnLFxyXG4gICAgICAgIGNzcyA9IHt9LFxyXG4gICAgICAgIGFuY2hvclB0ID0gKHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gLSB0aGlzLnBvaW50c1swXSA6IHRoaXMuYW5jaG9ySGVpZ2h0KSAtIHRoaXMuZWxlbUhlaWdodCxcclxuICAgICAgICBtcmduID0gc3RpY2tUb1RvcCA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXHJcbiAgICAgICAgbm90U3R1Y2tUbyA9IHN0aWNrVG9Ub3AgPyAnYm90dG9tJyA6ICd0b3AnLFxyXG4gICAgICAgIHRvcE9yQm90dG9tID0gaXNUb3AgPyAndG9wJyA6ICdib3R0b20nO1xyXG5cclxuICAgIGNzc1ttcmduXSA9IDA7XHJcblxyXG4gICAgaWYgKChpc1RvcCAmJiAhc3RpY2tUb1RvcCkgfHwgKHN0aWNrVG9Ub3AgJiYgIWlzVG9wKSkge1xyXG4gICAgICBjc3Nbc3RpY2tUb10gPSBhbmNob3JQdDtcclxuICAgICAgY3NzW25vdFN0dWNrVG9dID0gMDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNzc1tzdGlja1RvXSA9IDA7XHJcbiAgICAgIGNzc1tub3RTdHVja1RvXSA9IGFuY2hvclB0O1xyXG4gICAgfVxyXG5cclxuICAgIGNzc1snbGVmdCddID0gJyc7XHJcbiAgICB0aGlzLmlzU3R1Y2sgPSBmYWxzZTtcclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxyXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgaXMtYW5jaG9yZWQgaXMtYXQtJHt0b3BPckJvdHRvbX1gKVxyXG4gICAgICAgICAgICAgICAgIC5jc3MoY3NzKVxyXG4gICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYW5jaG9yZWQuXHJcbiAgICAgICAgICAgICAgICAgICogTmFtZXNwYWNlZCB0byBgdG9wYCBvciBgYm90dG9tYCwgZS5nLiBgc3RpY2t5LnpmLnVuc3R1Y2tmcm9tOmJvdHRvbWBcclxuICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU3RpY2t5I3Vuc3R1Y2tmcm9tXHJcbiAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgLnRyaWdnZXIoYHN0aWNreS56Zi51bnN0dWNrZnJvbToke3RvcE9yQm90dG9tfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgJGVsZW1lbnQgYW5kICRjb250YWluZXIgc2l6ZXMgZm9yIHBsdWdpbi5cclxuICAgKiBDYWxscyBgX3NldEJyZWFrUG9pbnRzYC5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGZpcmUgb24gY29tcGxldGlvbiBvZiBgX3NldEJyZWFrUG9pbnRzYC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9zZXRTaXplcyhjYikge1xyXG4gICAgdGhpcy5jYW5TdGljayA9IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5zdGlja3lPbik7XHJcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHsgY2IoKTsgfVxyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICBuZXdFbGVtV2lkdGggPSB0aGlzLiRjb250YWluZXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgsXHJcbiAgICAgICAgY29tcCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuJGNvbnRhaW5lclswXSksXHJcbiAgICAgICAgcGRuZyA9IHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctcmlnaHQnXSwgMTApO1xyXG5cclxuICAgIGlmICh0aGlzLiRhbmNob3IgJiYgdGhpcy4kYW5jaG9yLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmFuY2hvckhlaWdodCA9IHRoaXMuJGFuY2hvclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9wYXJzZVBvaW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcclxuICAgICAgJ21heC13aWR0aCc6IGAke25ld0VsZW1XaWR0aCAtIHBkbmd9cHhgXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgbmV3Q29udGFpbmVySGVpZ2h0ID0gdGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgfHwgdGhpcy5jb250YWluZXJIZWlnaHQ7XHJcbiAgICB0aGlzLmNvbnRhaW5lckhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcclxuICAgIHRoaXMuJGNvbnRhaW5lci5jc3Moe1xyXG4gICAgICBoZWlnaHQ6IG5ld0NvbnRhaW5lckhlaWdodFxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmVsZW1IZWlnaHQgPSBuZXdDb250YWluZXJIZWlnaHQ7XHJcblxyXG4gIFx0aWYgKHRoaXMuaXNTdHVjaykge1xyXG4gIFx0XHR0aGlzLiRlbGVtZW50LmNzcyh7XCJsZWZ0XCI6dGhpcy4kY29udGFpbmVyLm9mZnNldCgpLmxlZnQgKyBwYXJzZUludChjb21wWydwYWRkaW5nLWxlZnQnXSwgMTApfSk7XHJcbiAgXHR9XHJcblxyXG4gICAgdGhpcy5fc2V0QnJlYWtQb2ludHMobmV3Q29udGFpbmVySGVpZ2h0LCBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKGNiKSB7IGNiKCk7IH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdXBwZXIgYW5kIGxvd2VyIGJyZWFrcG9pbnRzIGZvciB0aGUgZWxlbWVudCB0byBiZWNvbWUgc3RpY2t5L3Vuc3RpY2t5LlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbGVtSGVpZ2h0IC0gcHggdmFsdWUgZm9yIHN0aWNreS4kZWxlbWVudCBoZWlnaHQsIGNhbGN1bGF0ZWQgYnkgYF9zZXRTaXplc2AuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gY29tcGxldGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9zZXRCcmVha1BvaW50cyhlbGVtSGVpZ2h0LCBjYikge1xyXG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XHJcbiAgICAgIGlmIChjYikgeyBjYigpOyB9XHJcbiAgICAgIGVsc2UgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgIH1cclxuICAgIHZhciBtVG9wID0gZW1DYWxjKHRoaXMub3B0aW9ucy5tYXJnaW5Ub3ApLFxyXG4gICAgICAgIG1CdG0gPSBlbUNhbGModGhpcy5vcHRpb25zLm1hcmdpbkJvdHRvbSksXHJcbiAgICAgICAgdG9wUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzBdIDogdGhpcy4kYW5jaG9yLm9mZnNldCgpLnRvcCxcclxuICAgICAgICBib3R0b21Qb2ludCA9IHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gOiB0b3BQb2ludCArIHRoaXMuYW5jaG9ySGVpZ2h0LFxyXG4gICAgICAgIC8vIHRvcFBvaW50ID0gdGhpcy4kYW5jaG9yLm9mZnNldCgpLnRvcCB8fCB0aGlzLnBvaW50c1swXSxcclxuICAgICAgICAvLyBib3R0b21Qb2ludCA9IHRvcFBvaW50ICsgdGhpcy5hbmNob3JIZWlnaHQgfHwgdGhpcy5wb2ludHNbMV0sXHJcbiAgICAgICAgd2luSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ3RvcCcpIHtcclxuICAgICAgdG9wUG9pbnQgLT0gbVRvcDtcclxuICAgICAgYm90dG9tUG9pbnQgLT0gKGVsZW1IZWlnaHQgKyBtVG9wKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0aWNrVG8gPT09ICdib3R0b20nKSB7XHJcbiAgICAgIHRvcFBvaW50IC09ICh3aW5IZWlnaHQgLSAoZWxlbUhlaWdodCArIG1CdG0pKTtcclxuICAgICAgYm90dG9tUG9pbnQgLT0gKHdpbkhlaWdodCAtIG1CdG0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy90aGlzIHdvdWxkIGJlIHRoZSBzdGlja1RvOiBib3RoIG9wdGlvbi4uLiB0cmlja3lcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRvcFBvaW50ID0gdG9wUG9pbnQ7XHJcbiAgICB0aGlzLmJvdHRvbVBvaW50ID0gYm90dG9tUG9pbnQ7XHJcblxyXG4gICAgaWYgKGNiKSB7IGNiKCk7IH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBjdXJyZW50IHN0aWNreSBlbGVtZW50LlxyXG4gICAqIFJlc2V0cyB0aGUgZWxlbWVudCB0byB0aGUgdG9wIHBvc2l0aW9uIGZpcnN0LlxyXG4gICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzLCBKUy1hZGRlZCBjc3MgcHJvcGVydGllcyBhbmQgY2xhc3NlcywgYW5kIHVud3JhcHMgdGhlICRlbGVtZW50IGlmIHRoZSBKUyBhZGRlZCB0aGUgJGNvbnRhaW5lci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7dGhpcy5vcHRpb25zLnN0aWNreUNsYXNzfSBpcy1hbmNob3JlZCBpcy1hdC10b3BgKVxyXG4gICAgICAgICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnJyxcclxuICAgICAgICAgICAgICAgICAgIHRvcDogJycsXHJcbiAgICAgICAgICAgICAgICAgICBib3R0b206ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgJ21heC13aWR0aCc6ICcnXHJcbiAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAub2ZmKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XHJcblxyXG4gICAgdGhpcy4kYW5jaG9yLm9mZignY2hhbmdlLnpmLnN0aWNreScpO1xyXG4gICAgJCh3aW5kb3cpLm9mZih0aGlzLnNjcm9sbExpc3RlbmVyKTtcclxuXHJcbiAgICBpZiAodGhpcy53YXNXcmFwcGVkKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLiRjb250YWluZXIucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxufVxyXG5cclxuU3RpY2t5LmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEN1c3RvbWl6YWJsZSBjb250YWluZXIgdGVtcGxhdGUuIEFkZCB5b3VyIG93biBjbGFzc2VzIGZvciBzdHlsaW5nIGFuZCBzaXppbmcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICcmbHQ7ZGl2IGRhdGEtc3RpY2t5LWNvbnRhaW5lciBjbGFzcz1cInNtYWxsLTYgY29sdW1uc1wiJmd0OyZsdDsvZGl2Jmd0OydcclxuICAgKi9cclxuICBjb250YWluZXI6ICc8ZGl2IGRhdGEtc3RpY2t5LWNvbnRhaW5lcj48L2Rpdj4nLFxyXG4gIC8qKlxyXG4gICAqIExvY2F0aW9uIGluIHRoZSB2aWV3IHRoZSBlbGVtZW50IHN0aWNrcyB0by5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3RvcCdcclxuICAgKi9cclxuICBzdGlja1RvOiAndG9wJyxcclxuICAvKipcclxuICAgKiBJZiBhbmNob3JlZCB0byBhIHNpbmdsZSBlbGVtZW50LCB0aGUgaWQgb2YgdGhhdCBlbGVtZW50LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkJ1xyXG4gICAqL1xyXG4gIGFuY2hvcjogJycsXHJcbiAgLyoqXHJcbiAgICogSWYgdXNpbmcgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGFzIGFuY2hvciBwb2ludHMsIHRoZSBpZCBvZiB0aGUgdG9wIGFuY2hvci5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ2V4YW1wbGVJZDp0b3AnXHJcbiAgICovXHJcbiAgdG9wQW5jaG9yOiAnJyxcclxuICAvKipcclxuICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSBib3R0b20gYW5jaG9yLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOmJvdHRvbSdcclxuICAgKi9cclxuICBidG1BbmNob3I6ICcnLFxyXG4gIC8qKlxyXG4gICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSB0b3Agb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMVxyXG4gICAqL1xyXG4gIG1hcmdpblRvcDogMSxcclxuICAvKipcclxuICAgKiBNYXJnaW4sIGluIGBlbWAncyB0byBhcHBseSB0byB0aGUgYm90dG9tIG9mIHRoZSBlbGVtZW50IHdoZW4gaXQgYmVjb21lcyBzdGlja3kuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDFcclxuICAgKi9cclxuICBtYXJnaW5Cb3R0b206IDEsXHJcbiAgLyoqXHJcbiAgICogQnJlYWtwb2ludCBzdHJpbmcgdGhhdCBpcyB0aGUgbWluaW11bSBzY3JlZW4gc2l6ZSBhbiBlbGVtZW50IHNob3VsZCBiZWNvbWUgc3RpY2t5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xyXG4gICAqL1xyXG4gIHN0aWNreU9uOiAnbWVkaXVtJyxcclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBlbGVtZW50LCBhbmQgcmVtb3ZlZCBvbiBkZXN0cnVjdGlvbi4gRm91bmRhdGlvbiBkZWZhdWx0cyB0byBgc3RpY2t5YC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3N0aWNreSdcclxuICAgKi9cclxuICBzdGlja3lDbGFzczogJ3N0aWNreScsXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgYXBwbGllZCB0byBzdGlja3kgY29udGFpbmVyLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3ktY29udGFpbmVyYC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgJ3N0aWNreS1jb250YWluZXInXHJcbiAgICovXHJcbiAgY29udGFpbmVyQ2xhc3M6ICdzdGlja3ktY29udGFpbmVyJyxcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2Ygc2Nyb2xsIGV2ZW50cyBiZXR3ZWVuIHRoZSBwbHVnaW4ncyByZWNhbGN1bGF0aW5nIHN0aWNreSBwb2ludHMuIFNldHRpbmcgaXQgdG8gYDBgIHdpbGwgY2F1c2UgaXQgdG8gcmVjYWxjIGV2ZXJ5IHNjcm9sbCBldmVudCwgc2V0dGluZyBpdCB0byBgLTFgIHdpbGwgcHJldmVudCByZWNhbGMgb24gc2Nyb2xsLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSA1MFxyXG4gICAqL1xyXG4gIGNoZWNrRXZlcnk6IC0xXHJcbn07XHJcblxyXG4vKipcclxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGNhbGN1bGF0ZSBlbSB2YWx1ZXNcclxuICogQHBhcmFtIE51bWJlciB7ZW19IC0gbnVtYmVyIG9mIGVtJ3MgdG8gY2FsY3VsYXRlIGludG8gcGl4ZWxzXHJcbiAqL1xyXG5mdW5jdGlvbiBlbUNhbGMoZW0pIHtcclxuICByZXR1cm4gcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSwgbnVsbCkuZm9udFNpemUsIDEwKSAqIGVtO1xyXG59XHJcblxyXG4vLyBXaW5kb3cgZXhwb3J0c1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihTdGlja3ksICdTdGlja3knKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBUYWJzIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRhYnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIgaWYgdGFicyBjb250YWluIGltYWdlc1xyXG4gKi9cclxuXHJcbmNsYXNzIFRhYnMge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGFicy5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgVGFicyNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byB0YWJzLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBUYWJzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnVGFicycpO1xyXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignVGFicycsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3ByZXZpb3VzJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnbmV4dCcsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJ1xyXG4gICAgICAvLyAnVEFCJzogJ25leHQnLFxyXG4gICAgICAvLyAnU0hJRlRfVEFCJzogJ3ByZXZpb3VzJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgdGFicyBieSBzaG93aW5nIGFuZCBmb2N1c2luZyAoaWYgYXV0b0ZvY3VzPXRydWUpIHRoZSBwcmVzZXQgYWN0aXZlIHRhYi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiR0YWJUaXRsZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YCk7XHJcbiAgICB0aGlzLiR0YWJDb250ZW50ID0gJChgW2RhdGEtdGFicy1jb250ZW50PVwiJHt0aGlzLiRlbGVtZW50WzBdLmlkfVwiXWApO1xyXG5cclxuICAgIHRoaXMuJHRhYlRpdGxlcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAkbGluayA9ICRlbGVtLmZpbmQoJ2EnKSxcclxuICAgICAgICAgIGlzQWN0aXZlID0gJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpLFxyXG4gICAgICAgICAgaGFzaCA9ICRsaW5rWzBdLmhhc2guc2xpY2UoMSksXHJcbiAgICAgICAgICBsaW5rSWQgPSAkbGlua1swXS5pZCA/ICRsaW5rWzBdLmlkIDogYCR7aGFzaH0tbGFiZWxgLFxyXG4gICAgICAgICAgJHRhYkNvbnRlbnQgPSAkKGAjJHtoYXNofWApO1xyXG5cclxuICAgICAgJGVsZW0uYXR0cih7J3JvbGUnOiAncHJlc2VudGF0aW9uJ30pO1xyXG5cclxuICAgICAgJGxpbmsuYXR0cih7XHJcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcclxuICAgICAgICAnYXJpYS1jb250cm9scyc6IGhhc2gsXHJcbiAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBpc0FjdGl2ZSxcclxuICAgICAgICAnaWQnOiBsaW5rSWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAkdGFiQ29udGVudC5hdHRyKHtcclxuICAgICAgICAncm9sZSc6ICd0YWJwYW5lbCcsXHJcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxyXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZihpc0FjdGl2ZSAmJiBfdGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XHJcbiAgICAgICAgJGxpbmsuZm9jdXMoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KSB7XHJcbiAgICAgIHZhciAkaW1hZ2VzID0gdGhpcy4kdGFiQ29udGVudC5maW5kKCdpbWcnKTtcclxuXHJcbiAgICAgIGlmICgkaW1hZ2VzLmxlbmd0aCkge1xyXG4gICAgICAgIEZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQoJGltYWdlcywgdGhpcy5fc2V0SGVpZ2h0LmJpbmQodGhpcykpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NldEhlaWdodCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIHRhYnMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdGhpcy5fYWRkS2V5SGFuZGxlcigpO1xyXG4gICAgdGhpcy5fYWRkQ2xpY2tIYW5kbGVyKCk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xyXG4gICAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3NldEhlaWdodC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgY2xpY2sgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgdGFicy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9hZGRDbGlja0hhbmRsZXIoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLm9mZignY2xpY2suemYudGFicycpXHJcbiAgICAgIC5vbignY2xpY2suemYudGFicycsIGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWAsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCQodGhpcykpO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMga2V5Ym9hcmQgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgdGFicy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9hZGRLZXlIYW5kbGVyKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHZhciAkZmlyc3RUYWIgPSBfdGhpcy4kZWxlbWVudC5maW5kKCdsaTpmaXJzdC1vZi10eXBlJyk7XHJcbiAgICB2YXIgJGxhc3RUYWIgPSBfdGhpcy4kZWxlbWVudC5maW5kKCdsaTpsYXN0LW9mLXR5cGUnKTtcclxuXHJcbiAgICB0aGlzLiR0YWJUaXRsZXMub2ZmKCdrZXlkb3duLnpmLnRhYnMnKS5vbigna2V5ZG93bi56Zi50YWJzJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIGlmIChlLndoaWNoID09PSA5KSByZXR1cm47XHJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXHJcbiAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLFxyXG4gICAgICAgICRwcmV2RWxlbWVudCxcclxuICAgICAgICAkbmV4dEVsZW1lbnQ7XHJcblxyXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy53cmFwT25LZXlzKSB7XHJcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9IGkgPT09IDAgPyAkZWxlbWVudHMubGFzdCgpIDogJGVsZW1lbnRzLmVxKGktMSk7XHJcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9IGkgPT09ICRlbGVtZW50cy5sZW5ndGggLTEgPyAkZWxlbWVudHMuZmlyc3QoKSA6ICRlbGVtZW50cy5lcShpKzEpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xyXG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5taW4oaSsxLCAkZWxlbWVudHMubGVuZ3RoLTEpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxyXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnVGFicycsIHtcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRlbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcclxuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJGVsZW1lbnQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcclxuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJHByZXZFbGVtZW50KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJG5leHRFbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcclxuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJG5leHRFbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgdGFiIGAkdGFyZ2V0Q29udGVudGAgZGVmaW5lZCBieSBgJHRhcmdldGAuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYWIgdG8gb3Blbi5cclxuICAgKiBAZmlyZXMgVGFicyNjaGFuZ2VcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBfaGFuZGxlVGFiQ2hhbmdlKCR0YXJnZXQpIHtcclxuICAgIHZhciAkdGFiTGluayA9ICR0YXJnZXQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKSxcclxuICAgICAgICBoYXNoID0gJHRhYkxpbmtbMF0uaGFzaCxcclxuICAgICAgICAkdGFyZ2V0Q29udGVudCA9IHRoaXMuJHRhYkNvbnRlbnQuZmluZChoYXNoKSxcclxuICAgICAgICAkb2xkVGFiID0gdGhpcy4kZWxlbWVudC5cclxuICAgICAgICAgIGZpbmQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9LmlzLWFjdGl2ZWApXHJcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpXHJcbiAgICAgICAgICAuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKVxyXG4gICAgICAgICAgLmF0dHIoeyAnYXJpYS1zZWxlY3RlZCc6ICdmYWxzZScgfSk7XHJcblxyXG4gICAgJChgIyR7JG9sZFRhYi5hdHRyKCdhcmlhLWNvbnRyb2xzJyl9YClcclxuICAgICAgLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKVxyXG4gICAgICAuYXR0cih7ICdhcmlhLWhpZGRlbic6ICd0cnVlJyB9KTtcclxuXHJcbiAgICAkdGFyZ2V0LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAkdGFiTGluay5hdHRyKHsnYXJpYS1zZWxlY3RlZCc6ICd0cnVlJ30pO1xyXG5cclxuICAgICR0YXJnZXRDb250ZW50XHJcbiAgICAgIC5hZGRDbGFzcygnaXMtYWN0aXZlJylcclxuICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6ICdmYWxzZSd9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgc3VjY2Vzc2Z1bGx5IGNoYW5nZWQgdGFicy5cclxuICAgICAqIEBldmVudCBUYWJzI2NoYW5nZVxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2NoYW5nZS56Zi50YWJzJywgWyR0YXJnZXRdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1YmxpYyBtZXRob2QgZm9yIHNlbGVjdGluZyBhIGNvbnRlbnQgcGFuZSB0byBkaXNwbGF5LlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5IHwgU3RyaW5nfSBlbGVtIC0galF1ZXJ5IG9iamVjdCBvciBzdHJpbmcgb2YgdGhlIGlkIG9mIHRoZSBwYW5lIHRvIGRpc3BsYXkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgc2VsZWN0VGFiKGVsZW0pIHtcclxuICAgIHZhciBpZFN0cjtcclxuXHJcbiAgICBpZiAodHlwZW9mIGVsZW0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIGlkU3RyID0gZWxlbVswXS5pZDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlkU3RyID0gZWxlbTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaWRTdHIuaW5kZXhPZignIycpIDwgMCkge1xyXG4gICAgICBpZFN0ciA9IGAjJHtpZFN0cn1gO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciAkdGFyZ2V0ID0gdGhpcy4kdGFiVGl0bGVzLmZpbmQoYFtocmVmPVwiJHtpZFN0cn1cIl1gKS5wYXJlbnQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YCk7XHJcblxyXG4gICAgdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCR0YXJnZXQpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgaGVpZ2h0IG9mIGVhY2ggcGFuZWwgdG8gdGhlIGhlaWdodCBvZiB0aGUgdGFsbGVzdCBwYW5lbC5cclxuICAgKiBJZiBlbmFibGVkIGluIG9wdGlvbnMsIGdldHMgY2FsbGVkIG9uIG1lZGlhIHF1ZXJ5IGNoYW5nZS5cclxuICAgKiBJZiBsb2FkaW5nIGNvbnRlbnQgdmlhIGV4dGVybmFsIHNvdXJjZSwgY2FuIGJlIGNhbGxlZCBkaXJlY3RseSBvciB3aXRoIF9yZWZsb3cuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfc2V0SGVpZ2h0KCkge1xyXG4gICAgdmFyIG1heCA9IDA7XHJcbiAgICB0aGlzLiR0YWJDb250ZW50XHJcbiAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMucGFuZWxDbGFzc31gKVxyXG4gICAgICAuY3NzKCdoZWlnaHQnLCAnJylcclxuICAgICAgLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHBhbmVsID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgaXNBY3RpdmUgPSBwYW5lbC5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgICAgIGlmICghaXNBY3RpdmUpIHtcclxuICAgICAgICAgIHBhbmVsLmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJywgJ2Rpc3BsYXknOiAnYmxvY2snfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGVtcCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAoIWlzQWN0aXZlKSB7XHJcbiAgICAgICAgICBwYW5lbC5jc3Moe1xyXG4gICAgICAgICAgICAndmlzaWJpbGl0eSc6ICcnLFxyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICcnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1heCA9IHRlbXAgPiBtYXggPyB0ZW1wIDogbWF4O1xyXG4gICAgICB9KVxyXG4gICAgICAuY3NzKCdoZWlnaHQnLCBgJHttYXh9cHhgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIHRhYnMuXHJcbiAgICogQGZpcmVzIFRhYnMjZGVzdHJveWVkXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YClcclxuICAgICAgLm9mZignLnpmLnRhYnMnKS5oaWRlKCkuZW5kKClcclxuICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5wYW5lbENsYXNzfWApXHJcbiAgICAgIC5oaWRlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xyXG4gICAgICAkKHdpbmRvdykub2ZmKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknKTtcclxuICAgIH1cclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5UYWJzLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgd2luZG93IHRvIHNjcm9sbCB0byBjb250ZW50IG9mIGFjdGl2ZSBwYW5lIG9uIGxvYWQgaWYgc2V0IHRvIHRydWUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuXHJcbiAgLyoqXHJcbiAgICogQWxsb3dzIGtleWJvYXJkIGlucHV0IHRvICd3cmFwJyBhcm91bmQgdGhlIHRhYiBsaW5rcy5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAqL1xyXG4gIHdyYXBPbktleXM6IHRydWUsXHJcblxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgdGFiIGNvbnRlbnQgcGFuZXMgdG8gbWF0Y2ggaGVpZ2h0cyBpZiBzZXQgdG8gdHJ1ZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBtYXRjaEhlaWdodDogZmFsc2UsXHJcblxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYGxpYCdzIGluIHRhYiBsaW5rIGxpc3QuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICd0YWJzLXRpdGxlJ1xyXG4gICAqL1xyXG4gIGxpbmtDbGFzczogJ3RhYnMtdGl0bGUnLFxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBjb250ZW50IGNvbnRhaW5lcnMuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICd0YWJzLXBhbmVsJ1xyXG4gICAqL1xyXG4gIHBhbmVsQ2xhc3M6ICd0YWJzLXBhbmVsJ1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY2hlY2tDbGFzcygkZWxlbSl7XHJcbiAgcmV0dXJuICRlbGVtLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcclxufVxyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oVGFicywgJ1RhYnMnKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBUb2dnbGVyIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvZ2dsZXJcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKi9cclxuXHJcbmNsYXNzIFRvZ2dsZXIge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVG9nZ2xlci5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgVG9nZ2xlciNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9nZ2xlci5kZWZhdWx0cywgZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5jbGFzc05hbWUgPSAnJztcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb2dnbGVyJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgVG9nZ2xlciBwbHVnaW4gYnkgcGFyc2luZyB0aGUgdG9nZ2xlIGNsYXNzIGZyb20gZGF0YS10b2dnbGVyLCBvciBhbmltYXRpb24gY2xhc3NlcyBmcm9tIGRhdGEtYW5pbWF0ZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIGlucHV0O1xyXG4gICAgLy8gUGFyc2UgYW5pbWF0aW9uIGNsYXNzZXMgaWYgdGhleSB3ZXJlIHNldFxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRlKSB7XHJcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcclxuXHJcbiAgICAgIHRoaXMuYW5pbWF0aW9uSW4gPSBpbnB1dFswXTtcclxuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gT3RoZXJ3aXNlLCBwYXJzZSB0b2dnbGUgY2xhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICBpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZGF0YSgndG9nZ2xlcicpO1xyXG4gICAgICAvLyBBbGxvdyBmb3IgYSAuIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZ1xyXG4gICAgICB0aGlzLmNsYXNzTmFtZSA9IGlucHV0WzBdID09PSAnLicgPyBpbnB1dC5zbGljZSgxKSA6IGlucHV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCBBUklBIGF0dHJpYnV0ZXMgdG8gdHJpZ2dlcnNcclxuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQ7XHJcbiAgICAkKGBbZGF0YS1vcGVuPVwiJHtpZH1cIl0sIFtkYXRhLWNsb3NlPVwiJHtpZH1cIl0sIFtkYXRhLXRvZ2dsZT1cIiR7aWR9XCJdYClcclxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XHJcbiAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIGhpZGRlbiwgYWRkIGFyaWEtaGlkZGVuXHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0aGlzLiRlbGVtZW50LmlzKCc6aGlkZGVuJykgPyBmYWxzZSA6IHRydWUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgdG9nZ2xlIHRyaWdnZXIuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfZXZlbnRzKCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvZ2dsZS56Zi50cmlnZ2VyJykub24oJ3RvZ2dsZS56Zi50cmlnZ2VyJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSB0YXJnZXQgY2xhc3Mgb24gdGhlIHRhcmdldCBlbGVtZW50LiBBbiBldmVudCBpcyBmaXJlZCBmcm9tIHRoZSBvcmlnaW5hbCB0cmlnZ2VyIGRlcGVuZGluZyBvbiBpZiB0aGUgcmVzdWx0YW50IHN0YXRlIHdhcyBcIm9uXCIgb3IgXCJvZmZcIi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgVG9nZ2xlciNvblxyXG4gICAqIEBmaXJlcyBUb2dnbGVyI29mZlxyXG4gICAqL1xyXG4gIHRvZ2dsZSgpIHtcclxuICAgIHRoaXNbIHRoaXMub3B0aW9ucy5hbmltYXRlID8gJ190b2dnbGVBbmltYXRlJyA6ICdfdG9nZ2xlQ2xhc3MnXSgpO1xyXG4gIH1cclxuXHJcbiAgX3RvZ2dsZUNsYXNzKCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC50b2dnbGVDbGFzcyh0aGlzLmNsYXNzTmFtZSk7XHJcblxyXG4gICAgdmFyIGlzT24gPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMuY2xhc3NOYW1lKTtcclxuICAgIGlmIChpc09uKSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaGFzIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cclxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb25cclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb24uemYudG9nZ2xlcicpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgZG9lcyBub3QgaGF2ZSB0aGUgY2xhc3MgYWZ0ZXIgYSB0b2dnbGUuXHJcbiAgICAgICAqIEBldmVudCBUb2dnbGVyI29mZlxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3VwZGF0ZUFSSUEoaXNPbik7XHJcbiAgfVxyXG5cclxuICBfdG9nZ2xlQW5pbWF0ZSgpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25JbiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3RoaXMuX3VwZGF0ZUFSSUEodHJ1ZSk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25PdXQsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKGZhbHNlKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX3VwZGF0ZUFSSUEoaXNPbikge1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPbiA/IHRydWUgOiBmYWxzZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgVG9nZ2xlciBvbiB0aGUgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50b2dnbGVyJyk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG59XHJcblxyXG5Ub2dnbGVyLmRlZmF1bHRzID0ge1xyXG4gIC8qKlxyXG4gICAqIFRlbGxzIHRoZSBwbHVnaW4gaWYgdGhlIGVsZW1lbnQgc2hvdWxkIGFuaW1hdGVkIHdoZW4gdG9nZ2xlZC5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgKi9cclxuICBhbmltYXRlOiBmYWxzZVxyXG59O1xyXG5cclxuLy8gV2luZG93IGV4cG9ydHNcclxuRm91bmRhdGlvbi5wbHVnaW4oVG9nZ2xlciwgJ1RvZ2dsZXInKTtcclxuXHJcbn0oalF1ZXJ5KTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuIWZ1bmN0aW9uKCQpIHtcclxuXHJcbi8qKlxyXG4gKiBUb29sdGlwIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvb2x0aXBcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKi9cclxuXHJcbmNsYXNzIFRvb2x0aXAge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBUb29sdGlwLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBUb29sdGlwI2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIGEgdG9vbHRpcCB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9iamVjdCB0byBleHRlbmQgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBUb29sdGlwLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5pc0NsaWNrID0gZmFsc2U7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnVG9vbHRpcCcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRvb2x0aXAgYnkgc2V0dGluZyB0aGUgY3JlYXRpbmcgdGhlIHRpcCBlbGVtZW50LCBhZGRpbmcgaXQncyB0ZXh0LCBzZXR0aW5nIHByaXZhdGUgdmFyaWFibGVzIGFuZCBzZXR0aW5nIGF0dHJpYnV0ZXMgb24gdGhlIGFuY2hvci5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdmFyIGVsZW1JZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1kZXNjcmliZWRieScpIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3Rvb2x0aXAnKTtcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy4kZWxlbWVudCk7XHJcbiAgICB0aGlzLm9wdGlvbnMudGlwVGV4dCA9IHRoaXMub3B0aW9ucy50aXBUZXh0IHx8IHRoaXMuJGVsZW1lbnQuYXR0cigndGl0bGUnKTtcclxuICAgIHRoaXMudGVtcGxhdGUgPSB0aGlzLm9wdGlvbnMudGVtcGxhdGUgPyAkKHRoaXMub3B0aW9ucy50ZW1wbGF0ZSkgOiB0aGlzLl9idWlsZFRlbXBsYXRlKGVsZW1JZCk7XHJcblxyXG4gICAgdGhpcy50ZW1wbGF0ZS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KVxyXG4gICAgICAgIC50ZXh0KHRoaXMub3B0aW9ucy50aXBUZXh0KVxyXG4gICAgICAgIC5oaWRlKCk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcclxuICAgICAgJ3RpdGxlJzogJycsXHJcbiAgICAgICdhcmlhLWRlc2NyaWJlZGJ5JzogZWxlbUlkLFxyXG4gICAgICAnZGF0YS15ZXRpLWJveCc6IGVsZW1JZCxcclxuICAgICAgJ2RhdGEtdG9nZ2xlJzogZWxlbUlkLFxyXG4gICAgICAnZGF0YS1yZXNpemUnOiBlbGVtSWRcclxuICAgIH0pLmFkZENsYXNzKHRoaXMudHJpZ2dlckNsYXNzKTtcclxuXHJcbiAgICAvL2hlbHBlciB2YXJpYWJsZXMgdG8gdHJhY2sgbW92ZW1lbnQgb24gY29sbGlzaW9uc1xyXG4gICAgdGhpcy51c2VkUG9zaXRpb25zID0gW107XHJcbiAgICB0aGlzLmNvdW50ZXIgPSA0O1xyXG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdyYWJzIHRoZSBjdXJyZW50IHBvc2l0aW9uaW5nIGNsYXNzLCBpZiBwcmVzZW50LCBhbmQgcmV0dXJucyB0aGUgdmFsdWUgb3IgYW4gZW1wdHkgc3RyaW5nLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2dldFBvc2l0aW9uQ2xhc3MoZWxlbWVudCkge1xyXG4gICAgaWYgKCFlbGVtZW50KSB7IHJldHVybiAnJzsgfVxyXG4gICAgLy8gdmFyIHBvc2l0aW9uID0gZWxlbWVudC5hdHRyKCdjbGFzcycpLm1hdGNoKC90b3B8bGVmdHxyaWdodC9nKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC9cXGIodG9wfGxlZnR8cmlnaHQpXFxiL2cpO1xyXG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gPyBwb3NpdGlvblswXSA6ICcnO1xyXG4gICAgcmV0dXJuIHBvc2l0aW9uO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogYnVpbGRzIHRoZSB0b29sdGlwIGVsZW1lbnQsIGFkZHMgYXR0cmlidXRlcywgYW5kIHJldHVybnMgdGhlIHRlbXBsYXRlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX2J1aWxkVGVtcGxhdGUoaWQpIHtcclxuICAgIHZhciB0ZW1wbGF0ZUNsYXNzZXMgPSAoYCR7dGhpcy5vcHRpb25zLnRvb2x0aXBDbGFzc30gJHt0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzc30gJHt0aGlzLm9wdGlvbnMudGVtcGxhdGVDbGFzc2VzfWApLnRyaW0oKTtcclxuICAgIHZhciAkdGVtcGxhdGUgPSAgJCgnPGRpdj48L2Rpdj4nKS5hZGRDbGFzcyh0ZW1wbGF0ZUNsYXNzZXMpLmF0dHIoe1xyXG4gICAgICAncm9sZSc6ICd0b29sdGlwJyxcclxuICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcclxuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogZmFsc2UsXHJcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXHJcbiAgICAgICdpZCc6IGlkXHJcbiAgICB9KTtcclxuICAgIHJldHVybiAkdGVtcGxhdGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uaW5nIGNsYXNzIHRvIHRyeVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3JlcG9zaXRpb24ocG9zaXRpb24pIHtcclxuICAgIHRoaXMudXNlZFBvc2l0aW9ucy5wdXNoKHBvc2l0aW9uID8gcG9zaXRpb24gOiAnYm90dG9tJyk7XHJcblxyXG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcclxuICAgIGlmICghcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA8IDApKSB7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUuYWRkQ2xhc3MoJ3RvcCcpO1xyXG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA8IDApKSB7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pXHJcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcclxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxyXG4gICAgZWxzZSBpZiAoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcclxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xyXG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XHJcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSkge1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1cclxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XHJcbiAgICB0aGlzLmNvdW50ZXItLTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHNldHMgdGhlIHBvc2l0aW9uIGNsYXNzIG9mIGFuIGVsZW1lbnQgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBwb3NzaWJsZSBwb3NpdGlvbnMgdG8gYXR0ZW1wdCwgb3IgdGhlIHRvb2x0aXAgZWxlbWVudCBpcyBubyBsb25nZXIgY29sbGlkaW5nLlxyXG4gICAqIGlmIHRoZSB0b29sdGlwIGlzIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4gd2lkdGgsIGRlZmF1bHQgdG8gZnVsbCB3aWR0aCAtIGFueSB1c2VyIHNlbGVjdGVkIG1hcmdpblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgX3NldFBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyh0aGlzLnRlbXBsYXRlKSxcclxuICAgICAgICAkdGlwRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy50ZW1wbGF0ZSksXHJcbiAgICAgICAgJGFuY2hvckRpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxyXG4gICAgICAgIGRpcmVjdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogKChwb3NpdGlvbiA9PT0gJ3JpZ2h0JykgPyAnbGVmdCcgOiAndG9wJykpLFxyXG4gICAgICAgIHBhcmFtID0gKGRpcmVjdGlvbiA9PT0gJ3RvcCcpID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxyXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldCxcclxuICAgICAgICBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgaWYgKCgkdGlwRGltcy53aWR0aCA+PSAkdGlwRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSkpIHtcclxuICAgICAgdGhpcy50ZW1wbGF0ZS5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLnRlbXBsYXRlLCB0aGlzLiRlbGVtZW50LCAnY2VudGVyIGJvdHRvbScsIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCwgdHJ1ZSkpLmNzcyh7XHJcbiAgICAgIC8vIHRoaXMuJGVsZW1lbnQub2Zmc2V0KEZvdW5kYXRpb24uR2V0T2Zmc2V0cyh0aGlzLnRlbXBsYXRlLCB0aGlzLiRlbGVtZW50LCAnY2VudGVyIGJvdHRvbScsIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCwgdHJ1ZSkpLmNzcyh7XHJcbiAgICAgICAgJ3dpZHRoJzogJGFuY2hvckRpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxyXG4gICAgICAgICdoZWlnaHQnOiAnYXV0bydcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsJ2NlbnRlciAnICsgKHBvc2l0aW9uIHx8ICdib3R0b20nKSwgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0KSk7XHJcblxyXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy50ZW1wbGF0ZSkgJiYgdGhpcy5jb3VudGVyKSB7XHJcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xyXG4gICAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmV2ZWFscyB0aGUgdG9vbHRpcCwgYW5kIGZpcmVzIGFuIGV2ZW50IHRvIGNsb3NlIGFueSBvdGhlciBvcGVuIHRvb2x0aXBzIG9uIHRoZSBwYWdlXHJcbiAgICogQGZpcmVzIFRvb2x0aXAjY2xvc2VtZVxyXG4gICAqIEBmaXJlcyBUb29sdGlwI3Nob3dcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBzaG93KCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaG93T24gIT09ICdhbGwnICYmICFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuc2hvd09uKSkge1xyXG4gICAgICAvLyBjb25zb2xlLmVycm9yKCdUaGUgc2NyZWVuIGlzIHRvbyBzbWFsbCB0byBkaXNwbGF5IHRoaXMgdG9vbHRpcCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMudGVtcGxhdGUuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLnNob3coKTtcclxuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBhbGwgb3RoZXIgb3BlbiB0b29sdGlwcyBvbiB0aGUgcGFnZVxyXG4gICAgICogQGV2ZW50IENsb3NlbWUjdG9vbHRpcFxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYudG9vbHRpcCcsIHRoaXMudGVtcGxhdGUuYXR0cignaWQnKSk7XHJcblxyXG5cclxuICAgIHRoaXMudGVtcGxhdGUuYXR0cih7XHJcbiAgICAgICdkYXRhLWlzLWFjdGl2ZSc6IHRydWUsXHJcbiAgICAgICdhcmlhLWhpZGRlbic6IGZhbHNlXHJcbiAgICB9KTtcclxuICAgIF90aGlzLmlzQWN0aXZlID0gdHJ1ZTtcclxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMudGVtcGxhdGUpO1xyXG4gICAgdGhpcy50ZW1wbGF0ZS5zdG9wKCkuaGlkZSgpLmNzcygndmlzaWJpbGl0eScsICcnKS5mYWRlSW4odGhpcy5vcHRpb25zLmZhZGVJbkR1cmF0aW9uLCBmdW5jdGlvbigpIHtcclxuICAgICAgLy9tYXliZSBkbyBzdHVmZj9cclxuICAgIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSB0b29sdGlwIGlzIHNob3duXHJcbiAgICAgKiBAZXZlbnQgVG9vbHRpcCNzaG93XHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi50b29sdGlwJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIaWRlcyB0aGUgY3VycmVudCB0b29sdGlwLCBhbmQgcmVzZXRzIHRoZSBwb3NpdGlvbmluZyBjbGFzcyBpZiBpdCB3YXMgY2hhbmdlZCBkdWUgdG8gY29sbGlzaW9uXHJcbiAgICogQGZpcmVzIFRvb2x0aXAjaGlkZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIGhpZGUoKSB7XHJcbiAgICAvLyBjb25zb2xlLmxvZygnaGlkaW5nJywgdGhpcy4kZWxlbWVudC5kYXRhKCd5ZXRpLWJveCcpKTtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLnRlbXBsYXRlLnN0b3AoKS5hdHRyKHtcclxuICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcclxuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogZmFsc2VcclxuICAgIH0pLmZhZGVPdXQodGhpcy5vcHRpb25zLmZhZGVPdXREdXJhdGlvbiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIF90aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcbiAgICAgIF90aGlzLmlzQ2xpY2sgPSBmYWxzZTtcclxuICAgICAgaWYgKF90aGlzLmNsYXNzQ2hhbmdlZCkge1xyXG4gICAgICAgIF90aGlzLnRlbXBsYXRlXHJcbiAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoX3RoaXMuX2dldFBvc2l0aW9uQ2xhc3MoX3RoaXMudGVtcGxhdGUpKVxyXG4gICAgICAgICAgICAgLmFkZENsYXNzKF90aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyk7XHJcblxyXG4gICAgICAgX3RoaXMudXNlZFBvc2l0aW9ucyA9IFtdO1xyXG4gICAgICAgX3RoaXMuY291bnRlciA9IDQ7XHJcbiAgICAgICBfdGhpcy5jbGFzc0NoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvKipcclxuICAgICAqIGZpcmVzIHdoZW4gdGhlIHRvb2x0aXAgaXMgaGlkZGVuXHJcbiAgICAgKiBAZXZlbnQgVG9vbHRpcCNoaWRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi50b29sdGlwJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBhZGRzIGV2ZW50IGxpc3RlbmVycyBmb3IgdGhlIHRvb2x0aXAgYW5kIGl0cyBhbmNob3JcclxuICAgKiBUT0RPIGNvbWJpbmUgc29tZSBvZiB0aGUgbGlzdGVuZXJzIGxpa2UgZm9jdXMgYW5kIG1vdXNlZW50ZXIsIGV0Yy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9ldmVudHMoKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyICR0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGU7XHJcbiAgICB2YXIgaXNGb2N1cyA9IGZhbHNlO1xyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xyXG5cclxuICAgICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAub24oJ21vdXNlZW50ZXIuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoIV90aGlzLmlzQWN0aXZlKSB7XHJcbiAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMuc2hvdygpO1xyXG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5vbignbW91c2VsZWF2ZS56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICBpZiAoIWlzRm9jdXMgfHwgKCFfdGhpcy5pc0NsaWNrICYmIF90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSkge1xyXG4gICAgICAgICAgX3RoaXMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja09wZW4pIHtcclxuICAgICAgdGhpcy4kZWxlbWVudC5vbignbW91c2Vkb3duLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBpZiAoX3RoaXMuaXNDbGljaykge1xyXG4gICAgICAgICAgX3RoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgLy8gX3RoaXMuaXNDbGljayA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBfdGhpcy5pc0NsaWNrID0gdHJ1ZTtcclxuICAgICAgICAgIGlmICgoX3RoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIgfHwgIV90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JykpICYmICFfdGhpcy5pc0FjdGl2ZSkge1xyXG4gICAgICAgICAgICBfdGhpcy5zaG93KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlRm9yVG91Y2gpIHtcclxuICAgICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAub24oJ3RhcC56Zi50b29sdGlwIHRvdWNoZW5kLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgX3RoaXMuaXNBY3RpdmUgPyBfdGhpcy5oaWRlKCkgOiBfdGhpcy5zaG93KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAvLyAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgICAvLyAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuaGlkZS5iaW5kKHRoaXMpXHJcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5oaWRlLmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLm9uKCdmb2N1cy56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlzRm9jdXMgPSB0cnVlO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF90aGlzLmlzQ2xpY2spO1xyXG4gICAgICAgIGlmIChfdGhpcy5pc0NsaWNrKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vICQod2luZG93KVxyXG4gICAgICAgICAgX3RoaXMuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIC5vbignZm9jdXNvdXQuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpc0ZvY3VzID0gZmFsc2U7XHJcbiAgICAgICAgX3RoaXMuaXNDbGljayA9IGZhbHNlO1xyXG4gICAgICAgIF90aGlzLmhpZGUoKTtcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChfdGhpcy5pc0FjdGl2ZSkge1xyXG4gICAgICAgICAgX3RoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGFkZHMgYSB0b2dnbGUgbWV0aG9kLCBpbiBhZGRpdGlvbiB0byB0aGUgc3RhdGljIHNob3coKSAmIGhpZGUoKSBmdW5jdGlvbnNcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICB0b2dnbGUoKSB7XHJcbiAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xyXG4gICAgICB0aGlzLmhpZGUoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2hvdygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgdG9vbHRpcCwgcmVtb3ZlcyB0ZW1wbGF0ZSBlbGVtZW50IGZyb20gdGhlIHZpZXcuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigndGl0bGUnLCB0aGlzLnRlbXBsYXRlLnRleHQoKSlcclxuICAgICAgICAgICAgICAgICAub2ZmKCcuemYudHJpZ2dlciAuemYudG9vdGlwJylcclxuICAgICAgICAgICAgICAgIC8vICAucmVtb3ZlQ2xhc3MoJ2hhcy10aXAnKVxyXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JylcclxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS15ZXRpLWJveCcpXHJcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtdG9nZ2xlJylcclxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1yZXNpemUnKTtcclxuXHJcbiAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZSgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcbn1cclxuXHJcblRvb2x0aXAuZGVmYXVsdHMgPSB7XHJcbiAgZGlzYWJsZUZvclRvdWNoOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBUaW1lLCBpbiBtcywgYmVmb3JlIGEgdG9vbHRpcCBzaG91bGQgb3BlbiBvbiBob3Zlci5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMjAwXHJcbiAgICovXHJcbiAgaG92ZXJEZWxheTogMjAwLFxyXG4gIC8qKlxyXG4gICAqIFRpbWUsIGluIG1zLCBhIHRvb2x0aXAgc2hvdWxkIHRha2UgdG8gZmFkZSBpbnRvIHZpZXcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDE1MFxyXG4gICAqL1xyXG4gIGZhZGVJbkR1cmF0aW9uOiAxNTAsXHJcbiAgLyoqXHJcbiAgICogVGltZSwgaW4gbXMsIGEgdG9vbHRpcCBzaG91bGQgdGFrZSB0byBmYWRlIG91dCBvZiB2aWV3LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxNTBcclxuICAgKi9cclxuICBmYWRlT3V0RHVyYXRpb246IDE1MCxcclxuICAvKipcclxuICAgKiBEaXNhYmxlcyBob3ZlciBldmVudHMgZnJvbSBvcGVuaW5nIHRoZSB0b29sdGlwIGlmIHNldCB0byB0cnVlXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICovXHJcbiAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcclxuICAvKipcclxuICAgKiBPcHRpb25hbCBhZGR0aW9uYWwgY2xhc3NlcyB0byBhcHBseSB0byB0aGUgdG9vbHRpcCB0ZW1wbGF0ZSBvbiBpbml0LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnbXktY29vbC10aXAtY2xhc3MnXHJcbiAgICovXHJcbiAgdGVtcGxhdGVDbGFzc2VzOiAnJyxcclxuICAvKipcclxuICAgKiBOb24tb3B0aW9uYWwgY2xhc3MgYWRkZWQgdG8gdG9vbHRpcCB0ZW1wbGF0ZXMuIEZvdW5kYXRpb24gZGVmYXVsdCBpcyAndG9vbHRpcCcuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICd0b29sdGlwJ1xyXG4gICAqL1xyXG4gIHRvb2x0aXBDbGFzczogJ3Rvb2x0aXAnLFxyXG4gIC8qKlxyXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIHRvb2x0aXAgYW5jaG9yIGVsZW1lbnQuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdoYXMtdGlwJ1xyXG4gICAqL1xyXG4gIHRyaWdnZXJDbGFzczogJ2hhcy10aXAnLFxyXG4gIC8qKlxyXG4gICAqIE1pbmltdW0gYnJlYWtwb2ludCBzaXplIGF0IHdoaWNoIHRvIG9wZW4gdGhlIHRvb2x0aXAuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdzbWFsbCdcclxuICAgKi9cclxuICBzaG93T246ICdzbWFsbCcsXHJcbiAgLyoqXHJcbiAgICogQ3VzdG9tIHRlbXBsYXRlIHRvIGJlIHVzZWQgdG8gZ2VuZXJhdGUgbWFya3VwIGZvciB0b29sdGlwLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAnJmx0O2RpdiBjbGFzcz1cInRvb2x0aXBcIiZndDsmbHQ7L2RpdiZndDsnXHJcbiAgICovXHJcbiAgdGVtcGxhdGU6ICcnLFxyXG4gIC8qKlxyXG4gICAqIFRleHQgZGlzcGxheWVkIGluIHRoZSB0b29sdGlwIHRlbXBsYXRlIG9uIG9wZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdTb21lIGNvb2wgc3BhY2UgZmFjdCBoZXJlLidcclxuICAgKi9cclxuICB0aXBUZXh0OiAnJyxcclxuICB0b3VjaENsb3NlVGV4dDogJ1RhcCB0byBjbG9zZS4nLFxyXG4gIC8qKlxyXG4gICAqIEFsbG93cyB0aGUgdG9vbHRpcCB0byByZW1haW4gb3BlbiBpZiB0cmlnZ2VyZWQgd2l0aCBhIGNsaWNrIG9yIHRvdWNoIGV2ZW50LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgY2xpY2tPcGVuOiB0cnVlLFxyXG4gIC8qKlxyXG4gICAqIEFkZGl0aW9uYWwgcG9zaXRpb25pbmcgY2xhc3Nlcywgc2V0IGJ5IHRoZSBKU1xyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAndG9wJ1xyXG4gICAqL1xyXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxyXG4gIC8qKlxyXG4gICAqIERpc3RhbmNlLCBpbiBwaXhlbHMsIHRoZSB0ZW1wbGF0ZSBzaG91bGQgcHVzaCBhd2F5IGZyb20gdGhlIGFuY2hvciBvbiB0aGUgWSBheGlzLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSAxMFxyXG4gICAqL1xyXG4gIHZPZmZzZXQ6IDEwLFxyXG4gIC8qKlxyXG4gICAqIERpc3RhbmNlLCBpbiBwaXhlbHMsIHRoZSB0ZW1wbGF0ZSBzaG91bGQgcHVzaCBhd2F5IGZyb20gdGhlIGFuY2hvciBvbiB0aGUgWCBheGlzLCBpZiBhbGlnbmVkIHRvIGEgc2lkZS5cclxuICAgKiBAb3B0aW9uXHJcbiAgICogQGV4YW1wbGUgMTJcclxuICAgKi9cclxuICBoT2Zmc2V0OiAxMlxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRPRE8gdXRpbGl6ZSByZXNpemUgZXZlbnQgdHJpZ2dlclxyXG4gKi9cclxuXHJcbi8vIFdpbmRvdyBleHBvcnRzXHJcbkZvdW5kYXRpb24ucGx1Z2luKFRvb2x0aXAsICdUb29sdGlwJyk7XHJcblxyXG59KGpRdWVyeSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcclxuKGZ1bmN0aW9uKCkge1xyXG4gIGlmICghRGF0ZS5ub3cpXHJcbiAgICBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XHJcblxyXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XHJcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XHJcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xyXG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xyXG4gIH1cclxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxyXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xyXG4gICAgdmFyIGxhc3RUaW1lID0gMDtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XHJcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcclxuICAgIH07XHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxudmFyIGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcclxudmFyIGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xyXG5cclxuLy8gRmluZCB0aGUgcmlnaHQgXCJ0cmFuc2l0aW9uZW5kXCIgZXZlbnQgZm9yIHRoaXMgYnJvd3NlclxyXG52YXIgZW5kRXZlbnQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHRyYW5zaXRpb25zID0ge1xyXG4gICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXHJcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcclxuICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxyXG4gICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xyXG4gIH1cclxuICB2YXIgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbiAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3RdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbdF07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xyXG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xyXG5cclxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XHJcblxyXG4gIGlmIChlbmRFdmVudCA9PT0gbnVsbCkge1xyXG4gICAgaXNJbiA/IGVsZW1lbnQuc2hvdygpIDogZWxlbWVudC5oaWRlKCk7XHJcbiAgICBjYigpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xyXG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcclxuXHJcbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cclxuICByZXNldCgpO1xyXG4gIGVsZW1lbnQuYWRkQ2xhc3MoYW5pbWF0aW9uKTtcclxuICBlbGVtZW50LmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xyXG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xyXG4gICAgaWYgKGlzSW4pIGVsZW1lbnQuc2hvdygpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBTdGFydCB0aGUgYW5pbWF0aW9uXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xyXG4gICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcclxuICAgIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJycpO1xyXG4gICAgZWxlbWVudC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xyXG4gIGVsZW1lbnQub25lKCd0cmFuc2l0aW9uZW5kJywgZmluaXNoKTtcclxuXHJcbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xyXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcclxuICAgIGlmICghaXNJbikgZWxlbWVudC5oaWRlKCk7XHJcbiAgICByZXNldCgpO1xyXG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcclxuICB9XHJcblxyXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xyXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xyXG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhpbml0Q2xhc3MgKyAnICcgKyBhY3RpdmVDbGFzcyArICcgJyArIGFuaW1hdGlvbik7XHJcbiAgfVxyXG59XHJcblxyXG52YXIgTW90aW9uVUkgPSB7XHJcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XHJcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xyXG4gIH0sXHJcblxyXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcclxuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xyXG4gIH1cclxufVxyXG4iLCJqUXVlcnkoICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJykud3JhcChcIjxkaXYgY2xhc3M9J2ZsZXgtdmlkZW8gd2lkZXNjcmVlbicvPlwiKTtcclxualF1ZXJ5KCAnaWZyYW1lW3NyYyo9XCJ2aW1lby5jb21cIl0nKS53cmFwKFwiPGRpdiBjbGFzcz0nZmxleC12aWRlbyB3aWRlc2NyZWVuIHZpbWVvJy8+XCIpO1xyXG4iLCJqUXVlcnkoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcclxuIiwiLy8gSm95cmlkZSBkZW1vXHJcbiQoJyNzdGFydC1qcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oJ2pveXJpZGUnLCdzdGFydCcpO1xyXG59KTsiLG51bGwsIlxyXG4kKHdpbmRvdykuYmluZCgnIGxvYWQgcmVzaXplIG9yaWVudGF0aW9uQ2hhbmdlICcsIGZ1bmN0aW9uICgpIHtcclxuICAgdmFyIGZvb3RlciA9ICQoXCIjZm9vdGVyLWNvbnRhaW5lclwiKTtcclxuICAgdmFyIHBvcyA9IGZvb3Rlci5wb3NpdGlvbigpO1xyXG4gICB2YXIgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xyXG4gICBoZWlnaHQgPSBoZWlnaHQgLSBwb3MudG9wO1xyXG4gICBoZWlnaHQgPSBoZWlnaHQgLSBmb290ZXIuaGVpZ2h0KCkgLTE7XHJcblxyXG4gICBmdW5jdGlvbiBzdGlja3lGb290ZXIoKSB7XHJcbiAgICAgZm9vdGVyLmNzcyh7XHJcbiAgICAgICAgICdtYXJnaW4tdG9wJzogaGVpZ2h0ICsgJ3B4J1xyXG4gICAgIH0pO1xyXG4gICB9XHJcblxyXG4gICBpZiAoaGVpZ2h0ID4gMCkge1xyXG4gICAgIHN0aWNreUZvb3RlcigpO1xyXG4gICB9XHJcbn0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
