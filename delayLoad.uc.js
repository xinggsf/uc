// ==UserScript==
// @name           delayLoad.uc
// @namespace      delayLoad.xinggsf
// @description    延时加载Firefox扩展,支持e10s
// @include        chrome://browser/content/browser.xul
// @updateURL      https://raw.githubusercontent.com/xinggsf/uc/master/delayLoad.uc.js
// @compatibility  Firefox 34+
// @author         xinggsf
// @version        2016.7.17
// ==/UserScript==
 
-function() {
    Cu.import('resource://gre/modules/AddonManager.jsm');
    let tool = {
        addons: [//about:support 可看到所有扩展ID
            '{A065A84F-95B6-433A-A0C8-4C040B77CE8A}',//pan
            //'uBlock0@raymondhill.net',//uBlock Origin
            //'{fe272bd1-5f76-4ea4-8501-a05d35d823fc}',//ABE
            //'{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}',//ABP
            //'firebug@software.joehewitt.com',
            //'sowatchmk2@jc3213.github',//soWatch! mk2
        ],
        toggleDelay: function(disable) {
            for(let id of this.addons)
                AddonManager.getAddonByID(id, a => a.userDisabled = disable);
        },
        //sessionstore-windows-restored final-ui-startup content-document-global-created
        observe: function(aSubject, aTopic, aData) {
            if ('quit-application' === aTopic) this.shutdown();
        },
        startup: function() {
            //延迟加载扩展
            setTimeout(() => this.toggleDelay(!1), 900);
            Services.obs.addObserver(this, 'quit-application', false);
        },
        shutdown: function() {
            this.toggleDelay(!0);
            Services.obs.removeObserver(this, 'quit-application');
        }
    }
 
    tool.startup();
}();
