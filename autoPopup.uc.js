// ==UserScript==
// @name           autoPopup.uc.js
// @description    Auto popup menulist/menupopup
// @updateURL      https://github.com/xinggsf/uc/raw/master/autoPopup.uc.js
// @compatibility  Firefox 34.0+
// @author         GOLF-AT, modify by xinggsf
// @version        2015.8.28
// ==UserScript==

-function (doc) {
	let nDelay = 360;
	let overElt = null;
	let popElt = null;
	let popTimer = null;
	let hideTimer = null;
	let searchBar = null;
	let alwaysPop = false;

	//by xinggsf,支持Fx的CSS所有语法: #表示id，. 表示class，或[id='demo']
	let blackIDs = [];

	//by xinggsf, 白名单，及触发动作
	let whiteIDs = [{
		id: 'omnibar-defaultEngine',
		popMemu: 'omnibar-engine-menu',
		run: function(overElem){
			doc.getElementById('omnibar-in-urlbar').click(0);
		}
	},
	{
		id: 'readLater',
		popMemu: 'readLater-popup',
		run: null
		//function(overElem){ popElt.popup();}
	},
	{
		id: 'foxyproxy-toolbar-icon',
		popMemu: 'foxyproxy-toolbarbutton-popup',
		run: null
	}];
	let whitesInx = -1;

	let popupPos = ['after_start', 'end_before', 'before_start', 				'start_before'];

	let menuPanelID = 'PanelUI-popup';
	let downPanelID = 'downloadsPanel';
	let widgetPanelID = 'customizationui-widget-panel';

	function isWidgetBtn(elt) {
		try {
			return elt.hasAttribute('widget-id')
				&& elt.getAttribute('widget-type') == 'view';
		} catch (e) {
			return false;
		}
	}

	function isSearchBtn(elt) {
		try {
			return whitesInx === 0 ||
			elt.getAttribute("anonid") === 'searchbar-search-button';
		} catch (e) {
			return false;
		}
	}

	function isNewMenuBtn(elt) {
		try {
			return elt.id == 'PanelUI-menu-button';
		} catch (e) {
			return false;
		}
	}

	function isDownloadBtn(elt) {
		try {
			return elt.localName == 'toolbarbutton'
			&& elt.id == 'downloads-button';
		} catch (e) {
			return false;
		}
	}

	function isAutoComplete(elt) {
		try {
			return elt.getAttribute('type').startsWith('autocomplete');
		} catch (e) {
			return false;
		}
	}

	function getPopupMenu(elt) {
		if (whitesInx > -1 && popElt)
			return popElt;
		let nodes = elt ? elt.ownerDocument.getAnonymousNodes(elt) : null;
		for (let k of nodes) {
			if (k.localName == 'menupopup')
				return k;
		}

		let s = elt.getAttribute('popup');
		return s ? doc.getElementById(s) : null;
	}

	function isBlackNode(elt) {
		return blackIDs.some(css => css.length && doc.querySelector(css));
	}

	function getPopupPos(elt) {
		let pos, box, w, h,
		r = /toolbar|hbox|vbox/,
		x = elt.boxObject.screenX,
		y = elt.boxObject.screenY;

		for (pos = 0; elt != null; elt = elt.parentNode)
		{
			if (elt.localName == 'window' || !elt.parentNode)
				break;
			else if (!r.test(elt.localName))
				continue;
			h = elt.boxObject.height;
			w = elt.boxObject.width;
			if (h >= 3 * w) {
				if (h >= 45) {
					pos = 9;
					break;
				}
			} else if (w >= 45 && w >= 3 * h) {
				pos = 8;
				break;
			}
		}
		try {
			box = elt.boxObject;
			x = (pos & 1) ? (x <= box.width / 2 + box.screenX ? 1 : 3) :
							(y <= box.height / 2 + box.screenY ? 0 : 2);
		} catch (e) {
			x = 0;
		}
		return popupPos[x];
	}

	function getPopupNode(node) {
		if (whitesInx > -1 && popElt)
			return popElt;
		let elt, isPop, s,
		r = /menupopup|popup|menulist/;

		for (; node != null; node = node.parentNode) {
			if (node == popElt) return node;

			isPop = false; //Node isn't Popup node
			s = node.localName;
			if (r.test(s) || isAutoComplete(node) || IsMenuButton(node))
				isPop = true;
			else if (s == 'dropmarker') {
				if (node.getAttribute('type') === 'menu') {
					elt = node.parentNode;
					isPop = elt.firstChild.localName === 'menupopup';
				}
				else if (node.className==='autocomplete-history-dropmarker')
					isPop = true;
				else {
					try {
						isPop = node.parentNode.id === 'urlbar';
					} catch (ex) {}
				}
			} else if (s == 'menu')
				isPop = 'menubar' === node.parentNode.localName;
			else if (IsButton(node)) {
				for (elt = node; (elt = elt.nextSibling) != null;) {
					if (elt.localName === 'dropmarker' &&
						elt.boxObject.width > 0 &&
						elt.boxObject.height > 0)
						break;
				}
				if (elt) break;
			}
			if (isPop) break;
		}
		if (popElt && node) {
			//Whether node is child of popElt
			for (elt = node.parentNode; elt != null; elt = elt.parentNode) {
				if (elt === popElt) return popElt;
			}
		}
		return isPop ? node : null;
	}

	function autoPopup() {
		popTimer = null;
		if (!overElt) return;

		if (whitesInx > -1 && popElt && whiteIDs[whitesInx].run) {
			whiteIDs[whitesInx].run(overElt);
			return;
		}
		!popElt && (popElt = overElt);

		if (overElt.localName == 'dropmarker')
			popElt.showPopup();
		else if (overElt.localName == 'menulist')
			overElt.open = true;
		else if (isNewMenuBtn(overElt)) {
			PanelUI.show();
			popElt = doc.getElementById(menuPanelID);
		} else if (isWidgetBtn(overElt)) {
			let cmdEvent = doc.createEvent('xulcommandevent');
			cmdEvent.initCommandEvent("command", true, true, window, 0, false,
				false, false, false, null);
			overElt.dispatchEvent(cmdEvent);
			popElt = doc.getElementById(widgetPanelID);
		} else if (isDownloadBtn(overElt)) {
			popElt = doc.getElementById(downPanelID);
			DownloadsPanel.showPanel();
		} else if (isSearchBtn(overElt)) {
			searchBar.openSuggestionsPanel();
			//console.log('search click!');
		} else {
			popElt = getPopupMenu(overElt);
			try {
				let Pos = getPopupPos(overElt);
				popElt.openPopup(overElt, Pos, 0, 0, false, false, null);
			} catch (e) {
				popElt = null;
			}
		}
	}

	function hidePopup() {
		try {
			if (overElt.localName == 'dropmarker')
				popElt.parentNode.closePopup();
			else if (overElt.localName == 'menulist')
				overElt.open = false;
			else if (isDownloadBtn(overElt))
				DownloadsPanel.hidePanel();
			//else if (isNewMenuBtn(overElt) || isWidgetBtn(overElt))
			else if (popElt && popElt.hidePopup)
				popElt.hidePopup();
			else if (popElt.popupBoxObject)
				popElt.popupBoxObject.hidePopup();
			 else if (isSearchBtn(overElt))
				 searchBar.textbox.closePopup();
		} catch (e) {}

		hideTimer = null;
		overElt = popElt = null;
	}

	function mouseOver(e) {
		if (!alwaysPop && !doc.hasFocus())
			return;
		let popNode, n = e.originalTarget;
		//xinggsf：数组遍历方法接受第二个参数，表作用域this，无须call
		whitesInx = n.hasAttribute('id') ?
			whiteIDs.findIndex(k => k.id === n.id) : -1;
		if (whitesInx > -1) {
			overElt = n;
			popElt = doc.getElementById(whiteIDs[whitesInx].popMemu);
			popTimer = setTimeout(autoPopup, nDelay);
			return;
		}

		popNode = getPopupNode(n);
		if (!popNode || (popNode && popNode.disabled) || isBlackNode(popNode)) {
			mouseOut();
			return;
		}

		if (hideTimer) {
			window.clearTimeout(hideTimer);
			hideTimer = null;
		}
		try {
			if (isAutoComplete(popNode)) return;

			let elt = popNode,
			r = /menupopup|popup/;
			for (;elt != null; elt = elt.parentNode) {
				if (r.test(elt.localName)) return;
			}
		} catch (ex) {}

		if (popElt && popNode == popElt && popElt != overElt)
			return;
		if (overElt && popNode != overElt)
			hidePopup();
		overElt = popNode;
		popElt = null;
		popTimer = setTimeout(autoPopup, nDelay);
	}

	function mouseOut(e) {
		if (popTimer) {
			clearTimeout(popTimer);
			popTimer = null;
		}
		if (!hideTimer && popElt)
			hideTimer = setTimeout(hidePopup, nDelay);
	}

	function IsButton(elt) {
		try {
			return /toolbarbutton|button/.test(elt.localName);
		} catch (e) {
			return false;
		}
	}

	function IsMenuButton(elt) {
		return isNewMenuBtn(elt) || isDownloadBtn(elt) || isWidgetBtn(elt)
			|| (IsButton(elt) && getPopupMenu(elt));
	}

	searchBar = BrowserSearch.SearchBar;
	window.addEventListener('mouseover', mouseOver, false);
}(document);
