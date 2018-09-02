import {Directive, ElementRef, OnInit, Renderer2} from '@angular/core';
import $ from 'jquery';

@Directive({
  selector: '[autoinputresize]'
})
export class AutoInputResizeDirective {

  constructor(el: ElementRef, private renderer: Renderer2) {
    this.renderer.listen(el.nativeElement, 'keydown', recalculateInputWidth.bind(el.nativeElement));
    this.renderer.listen(el.nativeElement, 'keyup', recalculateInputWidth.bind(el.nativeElement));
    this.renderer.listen(el.nativeElement, 'blur', recalculateInputWidth.bind(el.nativeElement));
    this.renderer.listen(el.nativeElement, 'update', recalculateInputWidth.bind(el.nativeElement));

    setTimeout(function() {recalculateInputWidth.bind(el.nativeElement)({target: el.nativeElement})});
  }

}

function recalculateInputWidth(event) {
  if (event.metaKey || event.altKey || !event.target) return;

  var input = $(this);
  var value = input.val();
  if (event.type && event.type.toLowerCase() === 'keydown')
    value = processValueAfterPressedKey(value, getSelection(input), event.keyCode, event.shiftKey);

  // if there is NO value in the input, it means that in the input there can be
  // a placeholder value. and if placeholder is not empty then use its value to measure
  var placeholder = input.attr('placeholder') || '';
  if (!value.length && placeholder.length > 0) {
    value = placeholder;
  }

  // finally measure input value's width and update input's width
  var measureContainer = createInputStringMeasureContainer(input);
  var width = measureString(value, measureContainer) + 4;
  input.css('width', width + 'px');
  input.triggerHandler('resize');
  measureContainer.remove();
}

/**
 * Creates and returns a container in the DOM where string can be stored to measure its length.
 *
 * @param {object} parentElement Element (input box) from where properties will be copied to match
 *                               the styles (font-size, font-family, etc.) to make a proper string measurement
 * @returns {object} Created element where string can be stored to measure string length
 */
function createInputStringMeasureContainer(parentElement) {
  var body = document.querySelector('body');
  var stringMeasureElement = $('<div id="tokenInputStringMeasure">');
  stringMeasureElement.css({
    position: 'absolute',
    top: '-99999px',
    left: '-99999px',
    width: 'auto',
    padding: 0,
    whiteSpace: 'pre'
  });
  $('body').append(stringMeasureElement);

  transferStyles(parentElement, stringMeasureElement, [
    'letterSpacing',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'textTransform'
  ]);

  return stringMeasureElement;
}

/**
 * Copies CSS properties from one element to another.
 *
 * @param {object} from
 * @param {object} to
 * @param {string[]|Array} properties
 */
function transferStyles(from, to, properties) {
  var i, n, styles = {};
  if (properties) {
    for (i = 0, n = properties.length; i < n; i++) {
      styles[properties[i]] = css(from[0], properties[i]);
    }
  } else {
    styles = from.css();
  }
  to.css(styles);
}

/**
 * Gets the proper value of the given CSS property.
 *
 * @param {object} element
 * @param {string} name
 * @returns {string|undefined}
 */
function css(element, name) {
  var val;
  if (typeof element.currentStyle !== 'undefined') { // for old IE
    val = element.currentStyle[name];
  } else if (typeof window.getComputedStyle !== 'undefined') { // for modern browsers
    val = element.ownerDocument.defaultView.getComputedStyle(element, null)[name];
  } else {
    val = element.style[name];
  }
  return (val === '') ? undefined : val;
}

/**
 * Measures the width of a string within a parent element (in pixels).
 *
 * @param {string} str String to be measured
 * @param {object} measureContainer jQuery/jqlite object
 * @returns {int}
 */
function measureString(str, measureContainer) {
  measureContainer.text(str);
  var width = measureContainer.prop('offsetWidth');
  measureContainer.text('');
  return width;
}

/**
 * Determines the current selection within a text input control.
 * Returns an object containing:
 *   - start  Where selection started
 *   - length How many characters were selected
 *
 * @param {object} inputElement
 * @returns {{start: int, length: int}}
 */
function getSelection(inputElement) {
  var selection = { start: 0, length: 0 };

  if ('selectionStart' in inputElement) {
    selection.start  = inputElement.selectionStart;
    selection.length = inputElement.selectionEnd - inputElement.selectionStart;

  } else if (document.selection) {
    inputElement.focus();
    var sel = document.selection.createRange();
    var selLen = document.selection.createRange().text.length;
    sel.moveStart('character', inputElement.value.length * -1);
    selection.start  = sel.text.length - selLen;
    selection.length = selLen;
  }

  return selection;
}

/**
 * Removes value based on the cursor position. If there is something selected then
 * this selected text will be removed, otherwise if no selection, but BACKSPACE key
 * has been pressed, then previous character will be removed, or if DELETE key has
 * been pressed when next character will be removed.
 *
 * @param {string} value The input value
 * @param {object} selection Current selection in the input
 * @param {int} pressedKeyCode Key that was pressed by a user
 * @returns {string}
 */
function removeValueByCursorPosition(value, selection, pressedKeyCode) {

  if (selection.length) {
    return value.substring(0, selection.start) + value.substring(selection.start + selection.length);

  } else if (pressedKeyCode === 8 /* "BACKSPACE" */ && selection.start) {
    return value.substring(0, selection.start - 1) + value.substring(selection.start + 1);

  } else if (pressedKeyCode === 46 /* "DELETE" */ && typeof selection.start !== 'undefined') {
    return value.substring(0, selection.start) + value.substring(selection.start + 1);
  }

  return value;
}

/**
 * Checks if given key code is a-z, or A-Z, or 1-9 or space.
 *
 * @param {number} keyCode
 * @returns {boolean} True if key code in the [a-zA-Z0-9 ] range or not
 */
function isPrintableKey(keyCode) {
  return ((keyCode >= 97 && keyCode <= 122) || // a-z
    (keyCode >= 65 && keyCode <= 90)  || // A-Z
    (keyCode >= 48 && keyCode <= 57)  || // 0-9
    keyCode === 32 // space
  );
}

/**
 * Checks if given key code is "removing key" (e.g. backspace or delete).
 *
 * @param {number} keyCode
 * @returns {boolean}
 */
function isRemovingKey(keyCode) {
  return keyCode === 46 || keyCode === 8; // "DELETE" or "BACKSPACE"
}

/**
 * Processes a value after some key has been pressed by a user.
 *
 * @param {string} value
 * @param {{ start: number, length: number }} selection Position where user selected a text
 * @param {number} keyCode The code of the key that has been pressed
 * @param {boolean} shiftKey Indicates if shift key has been pressed or not
 * @returns {string}
 */
function processValueAfterPressedKey(value, selection, keyCode, shiftKey) {

  if (isRemovingKey(keyCode))
    return removeValueByCursorPosition(value, selection, keyCode);

  if (isPrintableKey(keyCode)) {
    var character = String.fromCharCode(keyCode);
    character = shiftKey ? character.toUpperCase() : character.toLowerCase();
    return value + character;
  }

  return value;
}
