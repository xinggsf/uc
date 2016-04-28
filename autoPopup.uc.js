// ==UserScript==
// @name           autoPopup.uc.js
// @description    Auto popup menulist/menupopup
// @updateURL      https://raw.githubusercontent.com/xinggsf/uc/master/autoPopup.uc.js
// @namespace      autoPopup@gmail.com
// @include        chrome://browser/content/browser.xul
// @compatibility  Firefox 34.0+
// @author         GOLF-AT, xinggsf
// @version        2016.4.27
//以下所注释内容由xinggsf改进
// @note           2016.1.2限定脚本作用在FX内部
// @note           2015.12.10用setter控制，防止弹出多个菜单;新增多个omnibar内的图标白名单
// @note           2015.11.8取消书签的自动弹出，因为我的任务栏也是左竖栏
// @note           2015.8.8增加白名单功能，用之处理omnibar内的多个图标
// ==/UserScript==

-function (doc) {
	let nDelay = 290;
	let _overElt = null;
	let popElt = null;
	let popTimer = null;
	let hideTimer = null;
	let searchBar = null;

	//by xinggsf,支持Fx的CSS所有语法: #表示id，. 表示class
	let blackIDs = ['.bookmark-item'];

	//by xinggsf, 白名单，及触发动作
	let whiteIDs = [{
	//放在omnibar中的搜索引擎图标
		id: 'omnibar-defaultEngine',
		popMemu: 'omnibar-engine-menu',
		/*run: function(overElem){
			$('omnibar-in-urlbar').click(0);
		}*/
	},
	{
		id: 'SimpleMusicPlayer',
		popMemu: 'SimpleMusicPlayer-popup',
		run: null
	},
	{
		id: 'uAutoPagerize-icon',
		popMemu: 'uAutoPagerize-popup',
	},
	{//弹出页面信息窗口
		id: 'verticaltoolbar-page-info-button',
		run: function(overElem){
			BrowserPageInfo();
		}
	},
	{
		id: 'readLater',
		popMemu: 'readLater-popup',
		//function(overElem){ popElt.popup();}
	},
	{
		id: 'foxyproxy-toolbar-icon',
		popMemu: 'foxyproxy-toolbarbutton-popup',
	}];
	let whitesInx = -1;

	let popupPos = ['after_start', 'end_before', 'before_start', 'start_before'];

	let menuPanelID = 'PanelUI-popup';
	let downPanelID = 'downloadsPanel';
	let widgetPanelID = 'customizationui-widget-panel';

	let ppmContainer = $('mainPopupSet');
	function $(id) {
		return doc.getElementById(id);
	}
	
	function isWidgetBtn(elt) {
		try {
			return elt.hasAttribute('widget-id')
				&& elt.getAttribute('widget-type') === 'view';
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
		if (!elt) return null;
		if (whitesInx > -1 && popElt) return popElt;
		let s = elt.getAttribute('popup') || elt.getAttribute('context');
		if (s) return $(s);
		s = elt.ownerDocument.getAnonymousNodes(elt);
		for (let k of s) {
			if (k.localName === 'menupopup')
				return k;
		}
		return null;
	}

	function isBlackNode(elt) {
		return blackIDs.some(css => elt.mozMatchesSelector(css));
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
			if (h >= 45 && h >= 3 * w) {
				pos = 9;
				break;
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
		if (whitesInx !== -1 && popElt)
			return popElt;
		let elt, s,
		isPop = !1, //Node isn't Popup node
		r = /menupopup|popup|menulist/;

		for (; node != null; node = node.parentNode) {
			if (node == popElt) return node;

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
		if (popElt && node && popElt.contains(node))
			return popElt;
		return isPop ? node : null;
	}

	function popupMenu(btn, m) {
		try {
			let pos = getPopupPos(btn);
			m.openPopup(btn, pos, 0, 0, false, false, null);
		} catch (e) {}
	}
	function autoPopup() {
		popTimer = null;
		if (!_overElt) return;

		_hidePopup();

		if (whitesInx > -1) {
			if (whiteIDs[whitesInx].run)
				whiteIDs[whitesInx].run(overElt);
			else if (popElt)
				popupMenu(overElt, popElt);
			return;
		}
		if (!popElt) popElt = overElt;

		if (overElt.localName == 'dropmarker')
			popElt.showPopup();
		else if (overElt.localName == 'menulist')
			overElt.open = true;
		else if (isNewMenuBtn(overElt)) {
			PanelUI.show();
			popElt = $(menuPanelID);
		} else if (isWidgetBtn(overElt)) {
			let cmdEvent = doc.createEvent('xulcommandevent');
			cmdEvent.initCommandEvent("command", true, true, window, 0, false,
				false, false, false, null);
			overElt.dispatchEvent(cmdEvent);
			popElt = $(widgetPanelID);
		} else if (isDownloadBtn(overElt)) {
			popElt = $(downPanelID);
			DownloadsPanel.showPanel();
		} else if (isSearchBtn(overElt)) {
			searchBar.openSuggestionsPanel();
		} else {
			popElt = getPopupMenu(overElt);
			popElt ? popupMenu(overElt, popElt) : overElt.click();
		}
	}

	function _hidePopup() {
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
		}
		catch (e) {}
		finally {hideTimer = null;}
	}

	function hidePopup() {
		_hidePopup();
		_overElt = popElt = null;
	}

	function mouseOver(ev) {
		if (!doc.hasFocus()) {
			_overElt && hidePopup();
			return;
		}
		let popNode, e = ev.target;
		//console.log(e.firstChild);		
		if (e.closest('menupopup,menulist,popupset')) return;
		//if ('menuitem' === e.nodeName) return;
		//if (e.closest('#mainPopupSet')) return;//ppmContainer.contains(e)

		whitesInx = e.hasAttribute('id') ?
			whiteIDs.findIndex(k => k.id === e.id) : -1;
		if (whitesInx > -1) {
			overElt = e;
			if (whiteIDs[whitesInx].popMemu)
				popElt = $(whiteIDs[whitesInx].popMemu);
			popTimer = setTimeout(autoPopup, nDelay);
			return;
		}

		popNode = getPopupNode(e);
		if (isAutoComplete(popNode)) return;
		if (!popNode || (popNode && popNode.disabled) || isBlackNode(popNode)) {
			mouseOut();
			return;
		}

		if (hideTimer) {
			window.clearTimeout(hideTimer);
			hideTimer = null;
		}

		if (popElt && popNode == popElt && popElt != overElt) return;
		if (overElt && popNode != overElt) hidePopup();
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

    this.__defineGetter__("overElt", function(){
        return _overElt;
    });
    this.__defineSetter__("overElt", function(x){
        if (x === _overElt) return;
		if (_overElt) _hidePopup();
		_overElt = x;
    });
	searchBar = BrowserSearch.SearchBar;
	window.addEventListener('mouseover', mouseOver, false);
}(document);