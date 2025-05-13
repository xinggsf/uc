// ==UserScript==
// @name                 Mousegestures.uc.js
// @namespace            Mousegestures@gmail.com
// @description          自定义鼠标手势
// @author               紫云飞&黒仪大螃蟹&star-ray
// @version              2025.5.1
// @homepageURL          http://www.cnblogs.com/ziyunfei/archive/2011/12/15/2289504.html
// @include              main
// @charset              UTF-8
// @onlyonce
// ==/UserScript==
(() => {
	'use strict';
	const { XPCOMUtils,Services,NetUtil,FileUtils } = globalThis;
	const $ = id => document.getElementById(id);
	const GESTURES = {
		'L': {
			name: '后退',
			cmd: () => gBrowser.canGoBack && gBrowser.goBack()
		},
		'R': {
			name: '前进',
			cmd: () => gBrowser.canGoForward && gBrowser.goForward()
		},
		'U': {
			name: '向上滚动',
			cmd: () => goDoCommand('cmd_scrollPageUp')
		},
		'D': {
			name: '向下滚动',
			cmd: () => goDoCommand('cmd_scrollPageDown')
		},
		'UD': {
			name: '刷新当前页面',
			cmd: () => gBrowser.reload()
		},
		'DU': {
			name: '网址根目录',
			cmd() {
				const u = Services.io.newURI("javascript:location.replace(location.origin);");
				gBrowser.loadURI(u, {
					triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
				});
			},
		},
		'UDUD': {
			name: '跳过缓存刷新当前页面',
			cmd: () => $("Browser:ReloadSkipCache").doCommand()
		},
		'RL': {
			name: '打开新标签',
			cmd: () => BrowserCommands.openTab()
		},
		'LR': {
			name: '恢复关闭的标签',
			cmd() {
				try {
            undoCloseTab();
        } catch (ex) {
            $('History:UndoCloseTab').doCommand();
				}
			}
		},
		'UL': {
			name: '激活左边的标签页',
			cmd(event) {
				gBrowser.tabContainer.advanceSelectedTab(-1, true);
			}
		},
		'UR': {
			name: '激活右边的标签页',
			cmd(event) {
				gBrowser.tabContainer.advanceSelectedTab(1, true);
			}
		},
		'ULU': {
			name: '激活第一个标签页',
			cmd(event) {
				gBrowser.selectedTab = (gBrowser.visibleTabs || gBrowser.mTabs)[0];
			}
		},
		'URU': {
			name: '激活最后一个标签页',
			cmd(event) {
				const ts = gBrowser.visibleTabs || gBrowser.mTabs;
				gBrowser.selectedTab = ts[ts.length - 1];
			}
		},
		'DL': {
			name: '添加书签',
			cmd: () => $("Browser:AddBookmarkAs").doCommand()
		},
		'DR': {
			name: '关闭当前标签',
			cmd: () => gBrowser.removeCurrentTab()
		},
		'RU': {
			name: '转到页首',
			cmd: () => goDoCommand('cmd_scrollTop')
		},
		'RD': {
			name: '转到页尾',
			cmd: () => goDoCommand('cmd_scrollBottom')
		},
		'URD': {
			name: '打开附加组件',
			cmd: () => BrowserOpenAddonsMgr()
		},
		'DRU': {
			name: '打开选项',
			cmd: () => openPreferences()
		},
		'LU': {
			name: '查看页面信息',
			cmd: () => BrowserCommands.pageInfo()
		},
		'LD': {
			name: '侧边栏打开当前页',
			cmd(event) {
				$("pageActionButton").click();
				setTimeout(function() {
					$("pageAction-panel-side-view_mozilla_org").click();
				}, 6);
			}
		},
		'LDR': {
			name: '打开历史窗口(侧边栏)',
			cmd(event) {
				SidebarController.toggle("viewHistorySidebar");
			}
		},
		'RDL': {
			name: '打开书签工具栏',
			cmd(event) {
				const bar = $("PlacesToolbar");
				bar.collapsed = !bar.collapsed;
			}
		},
		'RLRL': {
			name: '重启浏览器',
			cmd(event) {
				Services.startup.quit(Services.startup.eRestart | Services.startup.eAttemptQuit);
			}
		},
		'URDLU': {
			name: '关闭浏览器',
			cmd(event) {
				goQuitApplication();
			}
		},
		'RULD': {
			name: '添加到稍后阅读',
			cmd(event) {
				$("pageAction-urlbar-_cd7e22de-2e34-40f0-aeff-cec824cbccac_").click();
			}
		},
		'LDL': {
			name: '关闭左侧标签页',
			cmd(event) {
				gBrowser.removeTabsToTheStartFrom(gBrowser.selectedTab);
				// for (let i = gBrowser.selectedTab._tPos - 1; i >= 0; i--)
				// if (!gBrowser.tabs[i].pinned) {
					// gBrowser.removeTab(gBrowser.tabs[i], {animate: true});
				// }
			}
		},
		'RDR': {
			name: '关闭右侧标签页',
			cmd(event) {
				gBrowser.removeTabsToTheEndFrom(gBrowser.selectedTab);
			}
		},
		'LDRUL': {
			name: '打开鼠标手势设置文件',
			cmd(event) {
				FileUtils.getDir('UChrm', ['SubScript', 'MouseGestures.uc.js']).launch();
			}
		},
		'RLD': {
			name: '将当前窗口置顶',
			cmd(event) {
				TabStickOnTop();
			}
		}
	};
	GESTURES.LRLR = GESTURES.RLRL;

	const mouseGestures = {
		lastX: 0,
		lastY: 0,
		directionChain: '',
		isMouseDownL: false,
		isMouseDownR: false,
		hideFireContext: false,
		shouldFireContext: false,
		init() {
			['mousedown', 'mousemove', 'mouseup', 'contextmenu', 'DOMMouseScroll'].forEach(type => {
				gBrowser.tabpanels.addEventListener(type, this, true);
			});
			gBrowser.tabpanels.addEventListener('unload', () => {
				['mousedown', 'mousemove', 'mouseup', 'contextmenu', 'DOMMouseScroll'].forEach(type => {
					gBrowser.tabpanels.removeEventListener(type, this, true);
				});
			});
		},
		handleEvent(e) {
			this[e.type](e);
		},
		mousedown({button,screenX,screenY}) {
			if (button == 2) {
				this.isMouseDownR = true;
				this.hideFireContext = false;
				[this.lastX, this.lastY, this.directionChain] = [screenX, screenY, ''];
			}
			if (button == 0) {
				this.isMouseDownR = false;
				this.stopGesture();
			}
		},
		mousemove({screenX,screenY}) {
			if (!this.isMouseDownR) return;
			const [subX, subY] = [screenX - this.lastX, screenY - this.lastY];
			const [distX, distY] = [Math.abs(subX), Math.abs(subY)];
			if (distX < 9 && distY < 9) return;
			const direction = distX > distY
				? (subX < 0 ? 'L' : 'R')
				: subY < 0 ? 'U' : 'D';
			if (!this.xdTrailArea) {
				this.xdTrailArea = document.createElement('hbox');
				const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
				canvas.setAttribute('width', screen.width);
				canvas.setAttribute('height', screen.height);
				this.xdTrailAreaContext = canvas.getContext('2d');
				this.xdTrailArea.style.cssText = '-moz-user-focus: none !important;-moz-user-select: none !important;display: -moz-box !important;box-sizing: border-box !important;pointer-events: none !important;margin: 0 !important;padding: 0 !important;width: 100% !important;height: 100% !important;border: none !important;box-shadow: none !important;overflow: hidden !important;background: none !important;opacity: 0.9 !important;position: fixed !important;z-index: 2147483647 !important;';
				this.xdTrailArea.appendChild(canvas);
				gBrowser.selectedBrowser.after(this.xdTrailArea);
			}
			if (this.xdTrailAreaContext) {
				this.hideFireContext = true;
				this.xdTrailAreaContext.strokeStyle = '#0065FF';
				this.xdTrailAreaContext.lineJoin = 'round';
				this.xdTrailAreaContext.lineCap = 'round';
				this.xdTrailAreaContext.lineWidth = 2;
				this.xdTrailAreaContext.beginPath();
				const {screenX: x, screenY: y} =  gBrowser.selectedBrowser;
				this.xdTrailAreaContext.moveTo(this.lastX - x, this.lastY - y);
				this.xdTrailAreaContext.lineTo(screenX - x, screenY - y);
				this.xdTrailAreaContext.closePath();
				this.xdTrailAreaContext.stroke();
				this.lastX = screenX;
				this.lastY = screenY;
			}
			if (direction != this.directionChain.charAt(this.directionChain.length - 1)) {
				this.directionChain += direction;
				StatusPanel._label = GESTURES[this.directionChain]
					? `手势:${this.directionChain} ${GESTURES[this.directionChain].name}`
					: '未知手势:' + this.directionChain;
			}
		},
		mouseup({button}) {
			if (this.isMouseDownR && button == 2) {
				this.isMouseDownR = false;
				if (this.directionChain) {
					this.shouldFireContext = false;
					this.stopGesture();
				}
			}
		},
		contextmenu(event) {
			if (this.isMouseDownR || this.hideFireContext) {
				this.shouldFireContext = true;
				this.hideFireContext = false;
				event.preventDefault();
				event.stopPropagation();
			}
		},
		DOMMouseScroll({detail}) {
			if (!this.isMouseDownR) return;
			this.shouldFireContext = false;
			this.hideFireContext = true;
			this.directionChain = 'W' + (detail > 0 ? '+' : '-');
			this.stopGesture();
		},
		stopGesture() {
			GESTURES[this.directionChain]?.cmd();
			if (this.xdTrailArea) {
				this.xdTrailArea.remove();
				this.xdTrailArea = this.xdTrailAreaContext = null;
			}
			this.directionChain = '';
			setTimeout(() => StatusPanel._label = '', 2000);
			this.hideFireContext = true;
		}
	};
	mouseGestures.init();

//将当前窗口置顶
function TabStickOnTop() {
	try {
		const { ctypes, ctypes: {
			int32_t: i32
		}} = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
		const lib = ctypes.open("user32.dll");
		let funcActiveWindow = 0;
		let funcSetWindowPos = 0;
		try {
			funcActiveWindow = lib.declare("GetActiveWindow", ctypes.winapi_abi, i32);
			funcSetWindowPos = lib.declare("SetWindowPos", ctypes.winapi_abi, ctypes.bool, i32, i32, i32, i32, i32, i32, ctypes.uint32_t);
		}
		catch (ex) {
			funcActiveWindow = lib.declare("GetActiveWindow", ctypes.stdcall_abi, i32);
			funcSetWindowPos = lib.declare("SetWindowPos", ctypes.stdcall_abi, ctypes.bool, i32, i32, i32, i32, i32, i32, ctypes.uint32_t);
		}
		if (funcActiveWindow != 0) {
			const win = $('main-window');
			const onTop = !win.hasAttribute('ontop');
			if (!onTop) win.removeAttribute('ontop');
			else win.setAttribute('ontop', 'true');

			const hwndAfter = onTop ? -1 : -2;
			funcSetWindowPos(funcActiveWindow(), hwndAfter, 0, 0, 0, 0, 19);
		}
		lib.close();
	} catch (ex) { }
}
})();