// ==UserScript==
// @name TabPlus.uc.js
// @description 自用整合版标签增强
// @updateURL  https://raw.githubusercontent.com/xinggsf/uc/master/tabPlus.uc.js
// @namespace TabPlus@gmail.com
// @include chrome://browser/content/browser.xul
// @include chrome://browser/content/bookmarks/bookmarksPanel.xul
// @include chrome://browser/content/history/history-panel.xul
// @include chrome://browser/content/places/places.xul
// @startup        tabPlusManager.startup();
// @shutdown       tabPlusManager.shutdown();
// @version 2017.5.22
// @Note xinggsf 2017.5.20  修正新建标签按钮右键新开网址后弹出菜单，修正“关闭当前标签页回到左边标签”失效
// @Note xinggsf 2016.5.15  用API判断是否为FX可用地址
// @Note xinggsf 2015.12.18 增加右击新建按钮新开剪贴板中的网址
// @Note xinggsf 2015.1.28 整合，并去掉经常产生BUG的地址栏输入新开功能
// @Note 2014.09.18 最后一次修正整合 by defpt
// ==/UserScript==

(function () {
	Cu.import('resource://gre/modules/Services.jsm');
	/* 下列代码firefox 47+失效，注释之
	// 新标签打开:书签、历史、搜索栏
	try {
		eval('openLinkIn=' + openLinkIn.toString().replace(
				'w.gBrowser.selectedTab.pinned', '(!w.isTabEmpty(w.gBrowser.selectedTab) || $&)')
			.replace(/&&\s+w\.gBrowser\.currentURI\.host != uriObj\.host/, ''));
	} catch (e) {}
	//地址栏新标签打开
	try {
	location=="chrome://browser/content/browser.xul" &&
	eval("gURLBar.handleCommand="+gURLBar.handleCommand.toString().replace(/^\s*(load.+);/gm,
	"if(/^javascript:/.test(url)||isTabEmpty(gBrowser.selectedTab)){loadCurrent();}else{this.handleRevert();gBrowser.loadOneTab(url, {postData: postData, inBackground: false, allowThirdPartyFixup: true});}"));
	}catch(e){}
	//自动关闭下载产生的空白标签
	eval("gBrowser.mTabProgressListener = " + gBrowser.mTabProgressListener.toString().replace(/(?=var location)/, '\
		if (aWebProgress.DOMWindow.document.documentURI == "about:blank"\
		&& aRequest.QueryInterface(nsIChannel).URI.spec != "about:blank") {\
		aWebProgress.DOMWindow.setTimeout(function() {\
		!aWebProgress.isLoadingDocument && aWebProgress.DOMWindow.close();\
		}, 100);\
		}\
	'));
	// 关闭当前标签页回到左边标签，firefox 47+失效，改用tabclose事件
	try {
		eval("gBrowser._blurTab = " + gBrowser._blurTab.toString()
			.replace('this.selectedTab = tab;',
			"this.selectedTab = aTab.previousSibling || tab;"));
	} catch (e) {}
	*/
	//中键点击bookmark菜单不关闭
	try {
		eval('BookmarksEventHandler.onClick =' + BookmarksEventHandler.onClick
			.toString().replace('node.hidePopup()', ''));
		eval('checkForMiddleClick =' + checkForMiddleClick.toString()
			.replace('closeMenus(event.target);', ''));
	} catch (e) {}

	if (location.href === "chrome://browser/content/browser.xul") {
		//当地址栏失去焦点后恢复原来的地址
		gURLBar.addEventListener("blur", function () {
			this.handleRevert();
		}, !1);
		//中键点击地址栏自动复制网址
		gURLBar.addEventListener("click", function (e) {
			if (e.button === 1) goDoCommand('cmd_copy');
		}, !1);
		//当搜索栏失去焦点后清空
		if (BrowserSearch.searchBar && !document.getElementById('omnibar-defaultEngine')) {
			BrowserSearch.searchBar.addEventListener("blur", function () {
				this.value = "";
			}, !1);
		}
	}

	class TabPlus{
		constructor(wnd) {
			this.window = wnd;
			this.tab = null;
			wnd.gBrowser.tabContainer.addEventListener('mouseover', this, !1);
			wnd.gBrowser.tabContainer.addEventListener('mouseout', this, !1);
			wnd.gBrowser.tabContainer.addEventListener('click', this, !1);
			wnd.gBrowser.tabContainer.addEventListener('TabClose', this, !1);
			wnd.gBrowser.tabContainer.addEventListener('contextmenu', this, !1);
		}
		destroy(){
			this.window.gBrowser.tabContainer.removeEventListener('mouseover', this);
			this.window.gBrowser.tabContainer.removeEventListener('mouseout', this);
			this.window.gBrowser.tabContainer.removeEventListener('click', this);
			this.window.gBrowser.tabContainer.removeEventListener('TabClose', this);
			this.window.gBrowser.tabContainer.removeEventListener('contextmenu', this);
		}
		handleEvent(ev) {
			const t = ev.target;
			switch (ev.type) {
			case "mouseover":
				if (this.tab !== t && t.tagName === 'tab') {
					this.tab = t;
					this.tid = setTimeout(() => {
						if (this.tab) {
							this.window.gBrowser.selectedTab = this.tab;
							this.tab = null;
						}
					}, 300);//delay 300ms
				}
				break;
			case "mouseout":
				this.tab = null;
				if (this.tid) {
					clearTimeout(this.tid);
					this.tid = null;
				}
				break;
			case "TabClose"://关闭当前标签页回到左边标签
				if (this.window.gBrowser.selectedTab === t) {
					this.window.gBrowser.tabContainer.selectedIndex--;
					ev.preventDefault();
					ev.stopPropagation();
				}
				break;
			case "click":
				//中键恢复关闭的标签页,中键默认关闭标签页
				if (ev.button === 1) {
					ev.preventDefault();
					this.window.undoCloseTab();
					ev.stopPropagation();
				}
				//右键关闭标签页，ctrl+右键打开菜单
				else if (ev.button === 2 && t.tagName === "tab" && !ev.ctrlKey) {
					ev.preventDefault();
					this.window.gBrowser.removeTab(t);
					ev.stopPropagation();
				}
				break;
			case 'contextmenu':
				//右键点击新建按钮打开剪贴板中的网址
				if (ev.button === 2 && ev.originalTarget.matches(".tabs-newtab-button")) {
					/*
					openNewTabWith('about:blank');
					gURLBar.select();
					goDoCommand('cmd_paste');
					gBrowser.loadOneTab(url, {inBackground:false});
					*/
					const reg = /^([\w\-]+\.)+[a-z]{2,3}(:\d+)?(\/\S*)?$/;
					let url = readFromClipboard();
					if (reg.test(url))
						url = 'http://' + url;
					try {
						switchToTabHavingURI(url, true);
					} catch (ex) {
						BrowserSearch.loadSearchFromContext(url);
					}
					ev.preventDefault();
					ev.stopPropagation();
				}
				break;
			}
		}
	}

	const _winList = new Map();
	const WindowListener = {
		onOpenWindow(xulWindow) {
			const window = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
			function onWindowLoad() {
				window.removeEventListener('load', onWindowLoad);
				if (window.document.documentElement.getAttribute('windowtype') == 'navigator:browser') {
					_winList.set(window, new TabPlus(window));
				}
			}
			window.addEventListener('load', onWindowLoad);
		},
		onCloseWindow(xulWindow) {
			const window = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
			if (_winList.has(window)) {
				_winList.get(window).destroy();
				_winList.delete(window);
			}
		},
		onWindowTitleChange(xulWindow, newTitle) {}
	};

	window.tabPlusManager = {
		startup() {
			const windows = Services.wm.getEnumerator('navigator:browser');
			while (windows.hasMoreElements()) {
				const domwindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
				domwindow && _winList.set(domwindow, new TabPlus(domwindow));
			}
			Services.wm.addListener(WindowListener);
		},
		shutdown() {
			for (let obj of _winList) {
				obj.destroy();
			}
			//_winList.clear();
			_winList = null;
			Services.wm.removeListener(WindowListener);
		}
	};
})();

tabPlusManager.startup();