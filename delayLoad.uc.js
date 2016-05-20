// ==UserScript==
// @name           delayLoad.uc
// @namespace      delayLoad.xinggsf
// @description    延时加载FX扩展
// @include        chrome://browser/content/browser.xul
// @updateURL      https://raw.githubusercontent.com/xinggsf/uc/master/delayLoad.uc.js
// @compatibility  Firefox 34+
// @author         xinggsf
// @version        2016.5.21
// ==/UserScript==

Cu.import("resource://gre/modules/AddonManager.jsm");
-function() {
	let timer, addons = [//about:support 可看到所有扩展ID
		'{A065A84F-95B6-433A-A0C8-4C040B77CE8A}',//pan
		//'uBlock0@raymondhill.net',//uBlock Origin
		//'{fe272bd1-5f76-4ea4-8501-a05d35d823fc}',//ABE
		//'{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}',//ABP
		'firebug@software.joehewitt.com',
		//'sowatchmk2@jc3213.github',//soWatch! mk2
	];

	function toggleDelay(disable) {
		for(let id of addons)
			AddonManager.getAddonByID(id, a => a.userDisabled = disable);
	}

	timer && clearTimeout(timer);
	timer = setTimeout(() => toggleDelay(!1), 1500);
	//禁止Firefox Hello扩展
	AddonManager.getAddonByID('loop@mozilla.org', a => a.userDisabled = true);

	window.addEventListener("unload", () => {
		if (!Application.windows.length) toggleDelay(true);
	}, !1);
}();