/********* Auto formatter - V1 - Start **********/
(function (doc, win) {

	/***** Vars *****/

	var phChar = '#',	/* Define which char will be used in format attribute. ie: <input ... data-format="##/##/####" /> for a date. */
		phReg = new RegExp(phChar, 'gi'), /* Create mask char regexp fo future uses */
		noActionKeys = [16, 17, 35, 36, 37, 38, 39, 40], /* List of keyCode that must not trigger the format function. ie: Start, End, Arrow, etc... */
		splitterReg = null; /* Var initialisation to store RegExp splitter */

	/***** Utils *****/

	/* Sort the Array and then use custom filter function that return false when previous index is the same */
	/* [0,5,6,8,4,6,8,5,4] -> Sort -> [0,4,4,5,5,6,6,8,8] -> Filter "false if same -1" -> [0,4,5,6,8] */
	var uniq = function (array) {
		    return array.sort().filter(function (item, pos, ary) {
			    return !pos || item != ary[pos - 1];
		    })
	    },

	/* Get input selection information */
		getSelection = function () {
			if (document.selection) this.focus();
			var selection = {
				start: 'selectionStart' in this ? this.selectionStart : '' || Math.abs(document.selection.createRange().moveStart('character', -this.value.length)),
				end: 'selectionEnd' in this ? this.selectionEnd : '' || Math.abs(this.value.length - document.selection.createRange().moveEnd('character', this.value.length))
			};
			selection.length = selection.end - selection.start;
			return selection;
		},
	/* Set caret position in a field */
		setCaretPosition = function (pos) {
			if (this.createTextRange) {
				var range = this.createTextRange();
				range.move('character', pos);
				range.select();
			} else if (this.selectionStart) {
				this.focus();
				this.setSelectionRange(pos, pos);
			} else {
				this.focus();
			};
		},
	/* Event proxy to filter document delegated event */
		eventProxy = function (e, func) {
			if (e.target.getAttribute('data-format')) {
				func.call(e.target, e);
			};
		};

	/***** Methods *****/

	/* Get a simplified array of cahracters that are used in the format attribute */
	var getSeps = function () {
		    return uniq(this.getAttribute('data-format').replace(phReg, '').split(''));
	    },

	/* Remove seperator chars from a string */
		clearString = function (str) {
			/* Vars */
			var seps = getSeps.call(this).join('|'),
				reg = new RegExp(seps, 'gi'),
				cleared = str ? str.replace(reg, '') : '';
			return cleared;
		},

	/* Set selection state on keydown to update the selectionReg var */
		setSelectionState = function (e) {
			/* Default range */
			var current = getSelection.call(this),
				before = this.value.substring(0, current.start),
				after = this.value.substring(current.end, this.value.length);
			/* With Delete / Suprr hit with no selection length need offest to be forced */
			if (!current.length && e) {
				if (e.keyCode == 8) before = before.substring(0, before.length - 1);
				if (e.keyCode == 46) after = after.substring(1);
			};
			/* Update splitter RegExp */
			splitterReg = new RegExp('^(' + before + ')(.*)(' + after + ')$', 'gi');
		},
	/* Format field value */
		format = function (e) {

			/* Prevent format to be performed with specified keys */
			if (e && noActionKeys.indexOf(e.keyCode) != -1 || e && e.ctrlKey && e.keyCode == '65') return;

			/* Vars */
			var pattern = this.getAttribute('data-format'),
				split = this.value.replace(splitterReg, '$1' + phChar + '$2' + phChar + '$3').split(phChar),
				seps = getSeps.call(this).join('|'),
				remover = new RegExp('(' + seps + ')*$', 'gi'),
				/* Build output format, before, new and then after */
				before = clearString.call(this, split[0]).split(''),
				middle = clearString.call(this, split[1]).split(''),
				after = clearString.call(this, split[2]).split(''),

			    output = '',
				caretPos = (!before.length && !middle.length) ? 0 : null;

			/* Build */
			output = pattern.replace(phReg, function (match, number) {
				/* Pick first char from the three arrays before, middle and then after. In that order to fill the format pattern */
				var next = before.shift() || middle.shift() || after.shift() || '';
				if (!before.length && !middle.length && caretPos == null) {
					caretPos = number + 1;
				};
				return next;
			}).replace(remover, '');

			/* Check if caret is in value length limit */
			if (null == caretPos) {
				caretPos = output.length;
			};

			/* Update value */
			this.value = output;
			setCaretPosition.call(this, caretPos);

		},
	/* Sync with back if has */
		sync = function () {
			var sync = this.getAttribute('data-sync');
			if (sync) {
				var syncedField = doc.getElementById(sync);
				syncedField.value = clearString.call(this, this.value);
				var eventType = syncedField.getAttribute('data-trigger') || 'keyup';
				/* jQuery event trigger */
				if (jQuery) {
					jQuery(syncedField).trigger(eventType);
				};
			};
		};

	/* Init */
	var inputs = doc.querySelectorAll('input[data-format]'),
		i = 0;
	while (inputs[i]) {
		setSelectionState.call(inputs[i]);
		format.call(inputs[i]);
		sync.call(inputs[i]);
		i++;
	};


	/* Event */
	if (doc.addEventListener) {
		doc.addEventListener('keydown', function (e) { eventProxy(e, setSelectionState); }, false);
		doc.addEventListener('keyup', function (e) { eventProxy(e, format); }, false);
		doc.addEventListener('keyup', function (e) { eventProxy(e, sync); }, false);
	} else {
		doc.attachEvent('onkeydown', function (e) { eventProxy(e, setSelectionState); });
		doc.attachEvent('onkeyup', function (e) { eventProxy(e, format); });
		doc.attachEvent('onkeyup', function (e) { eventProxy(e, sync); });
	};

})(document, window);
/********** Auto formatter - V1 - End *********/
