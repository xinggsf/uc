// ==UserScript==
// @name            newtab-config.uc.js
// @description     Restore browser.newtab.url in about:config
// @author          TheRealPSV
// @include         main
// @Shutdown        window.NewTabAboutConfig.destroy();
// @onlyonce
// @compatibility   Firefox 136
// @version         1.0.0
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==

if (!window.NewTabConfig) {
	const { AboutNewTab } = ChromeUtils.importESModule("resource:///modules/AboutNewTab.sys.mjs");

	window.NewTabAboutConfig = {
		NEW_TAB_CONFIG_PATH: "browser.newtab.url",
		init() {
			AboutNewTab.newTabURL = Services.prefs.getStringPref(this.NEW_TAB_CONFIG_PATH, "about:blank");
			this.prefObserver = {
				observe: (subject, topic, data) => {
					if (topic === "nsPref:changed" && data === this.NEW_TAB_CONFIG_PATH) {
						AboutNewTab.newTabURL = Services.prefs.getStringPref(this.NEW_TAB_CONFIG_PATH, "about:blank");
					}
				}
			};
			try {
				Services.prefs.addObserver(this.NEW_TAB_CONFIG_PATH, this.prefObserver);
			} catch (e) {
				console.error(e);
			}
		},
		destroy() {
			Services.prefs.removeObserver(this.NEW_TAB_CONFIG_PATH, this.prefObserver);
		}
	};
	window.NewTabConfig.init();
}