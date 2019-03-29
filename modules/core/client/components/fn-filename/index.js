'use strict';

(function() {
  var NOT_ALLOWED = 'Some characters are not in the list of accepted cahracters for file names: letters, numbers, underscore, period, dash, and space.';
  var NO_CONTROL = 'Control characters are not allowed';
  var NO_PERIOD_OR_SPACE = "Names shouldn't begin with a period or spaces";
  var RESERVED = 'Can not use reserved file names like COM0, PRN, etc';
  var NO_ALL_PERIOD = 'Names can not be just periods';
  var NO_TRAILING_SPACE = 'Names can not end with spaces';
  var REQUIRED = 'Required';
  var OVER_CAHAR_LIMIT = 'File nemes should be below 175 characters';

  angular.module('core')
  // fn-filename
    .directive('fnFilename', function () {
      return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attributes, ngModel) {
          var extension = attributes.fnExtension; // fn-extension
          var $error;
          if (attributes.fnError) { // fn-error
            var errorId = "#" + attributes.fnError;
            $error = angular.element(document.querySelector(errorId));
          }
          element.on('focus', function () {
            if (extension) {
              var m = element.val();
              m = m.substring(0, m.indexOf(extension) - 1);
              element.val(m);
            }
          });
          element.on('blur', function () {
            if (extension) {
              var m = element.val() + '.' + extension;
              // set both the display and the model values
              element.val(m);
              ngModel.$setViewValue( m );
            }
          });
          ngModel.$validators.filename = function (modelValue) {
            var input = modelValue;
            var errMsg = '';
            if (extension && input === '.'+ extension) {
              errMsg = REQUIRED;
            } else if (input) {
              errMsg = validateFilename(input, extension);
            }
            if ($error) {
              $error.text(errMsg);
            }
            return errMsg === '';
          };
        }
      };

      function validateFilename(input, extension) {
        // Validation can happen twice. Once without the file extension and once with.
        // Make sure the tests work in both cases.
        // eslint-disable-next-line no-useless-escape
        var illegalRe = /[^a-zA-Z0-9_\.\-\s]/g; // white list of accepted file name characters
        // eslint-disable-next-line no-control-regex
        var controlRe = /[\x00-\x1f\x80-\x9f]/g; // no control characters
        var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
        // eslint-disable-next-line no-useless-escape
        var leadingRe = /^[\.\s]+/; // no names beginning with . or whitespace
        var reservedRe = /^\.+$/; // no names like ".", ".."
        var reservedEnd = /\s+$/; // no names with spaces at end without extension
        var reservedEndWExt = extension ? new RegExp('\\s+\\.' + extension + '$') : undefined; // no names with spaces before extension
        var result = '';

        // remove file extension for character count
        var fileName = input;
        var fileNameArr = fileName.split(".");
        if (fileNameArr[fileNameArr.length-1] == 'pdf'){
          fileName = fileName.substring(0, fileName.length-4);
        }

        if (input.match(illegalRe)) {
          result = NOT_ALLOWED;
        } else if (input.match(controlRe)) {
          result = NO_CONTROL;
        } else if (input.match(leadingRe)) {
          result = NO_PERIOD_OR_SPACE;
        } else if (input.match(reservedEnd)) {
          result = NO_TRAILING_SPACE;
        } else if (extension && input.match(reservedEndWExt)) {
          result = NO_TRAILING_SPACE;
        } else if (!extension && input.match(windowsReservedRe)) {
          result = RESERVED;
        } else if (input.match(reservedRe)) {
          result = NO_ALL_PERIOD;
        }else if (fileName.length>=175) { //character count cannot be over 175
          result = OVER_CAHAR_LIMIT;
        }
        return result;
      }
    });
})();
