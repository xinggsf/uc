// ==UserScript==
// @name           delayLoad.uc
// @description    延时加载FX扩展
// @include        chrome://browser/content/browser.xul
// @updateURL      https://github.com/xinggsf/uc/raw/master/delayLoad.uc.js
// @compatibility  Firefox 34.0+
// @author         modify by xinggsf
// @version        2015.8.28
// ==UserScript==

location == "chrome://browser/content/browser.xul" && (() => {        
	let {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} =Components;
	Cu.import("resource://gre/modules/AddonManager.jsm");

	function toggleDelay(disable) {
		let id,
		a = [
			'{fe272bd1-5f76-4ea4-8501-a05d35d823fc}',//ABE
			//{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}, ABP
			//'firebug@software.joehewitt.com'
		];
		for(id of a) AddonManager.getAddonByID(id, 
			addon => addon.userDisabled = disable);
	}

	//启用 延迟加载扩展
	this._timer && clearTimeout(this._timer);
	this._timer = setTimeout(() => toggleDelay(false), 1500);

	// firefox关闭时禁用 延迟加载扩展
	window.addEventListener("unload", () => toggleDelay(true), false);
})();