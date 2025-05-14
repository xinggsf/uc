// ==UserScript==
// @name            newtab-config.uc.js
// @description     Restore browser.newtab.url in about:config
// @author          TheRealPSV
// @include         main
// @Shutdown        window.NewTabConfig.destroy();
// @onlyonce
// @compatibility   Firefox 115+
// @version         1.0.0
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==

// const { AboutNewTab } = ChromeUtils.importESModule("resource:///modules/AboutNewTab.sys.mjs");
window.NewTabConfig = {
	NEW_TAB_PATH: "browser.newtab.url",
	init() {
		AboutNewTab.newTabURL = Services.prefs.getStringPref(this.NEW_TAB_PATH, "about:blank");
		this.prefObserver = {
			observe: (subject, topic, data) => {
				if (topic === "nsPref:changed") {
					AboutNewTab.newTabURL = Services.prefs.getStringPref(this.NEW_TAB_PATH, "about:blank");
				}
			}
		};
		try {
			Services.prefs.addObserver(this.NEW_TAB_PATH, this.prefObserver);
		} catch (e) {
			console.error(e);
		}
	},
	destroy() {
		Services.prefs.removeObserver(this.NEW_TAB_PATH, this.prefObserver);
		delete this;
	}
};
window.NewTabConfig.init();

/* 另一UC脚本的简易实现 -----------------------------
if (Number(Services.appinfo.version.slice(0,3)) > 114) {
	AboutNewTab.newTabURL = 'https://www.hao123.com/';
} */