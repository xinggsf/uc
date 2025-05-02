// ==UserScript==
// @name            redirector_ui.uc.js
// @namespace       redirector@haoutil.com
// @description     Redirect your requests.
// @include         main
// @author          harv.c
// @homepage        http://haoutil.com
// @shutdown        Redirector.off();
// @version         1.6.4
// ==/UserScript==

// https://raw.githubusercontent.com/Harv/userChromeJS/master/redirector_ui.uc.js
(function() {
    const { XPCOMUtils,Services,NetUtil,FileUtils } = globalThis;
	const $ = id => document.getElementById(id);
	const $$ = (css, context = document) => context.querySelectorAll(css);

	class Redirector {
		constructor() {
			this.rules = [];
			this.redirectUrls = {};
			this.QueryInterface = (ChromeUtils.generateQI || XPCOMUtils.generateQI)([Ci.nsIObserver, Ci.nsIFactory, Ci.nsISupports]);
		}
        on() {
            Services.obs.addObserver(this, "http-on-modify-request", false);
            // Services.obs.addObserver(this, "http-on-examine-response", false);
        }
        off() {
            Services.obs.removeObserver(this, "http-on-modify-request", false);
            // Services.obs.removeObserver(this, "http-on-examine-response", false);
        }
        getRedirectUrl(originUrl) {
            let redirectUrl = this.redirectUrls[originUrl];
            if(redirectUrl !== void 0) {
                return redirectUrl;
            }
            redirectUrl = null;
            for (let rule of this.rules) {
                if (rule.state === void 0) rule.state = true;
                if (!rule.state) continue;

                let {regex, from, to, exclude, decode} = rule.computed || rule;
                if (!rule.computed) {
                    regex ||=  rule.wildcard;
                    if (rule.wildcard) {
                        from = this.wildcardToRegex(rule.from);
                    }
                    rule.computed = {regex, from, to, exclude, decode};
                }
                let url = decode ? decodeURIComponent(originUrl) : originUrl;
                let redirect = regex
                    ? from.test(url) ? !(!exclude ? false : typeof exclude == 'string' ? url.includes(exclude) : exclude.test(url)) : false
                    : from == url ? !(exclude && exclude == url) : false;
                if (redirect) {
                    url = typeof to === "function"
                        ? regex ? to(url.match(from)) : to(from)
                        : regex ? url.replace(from, to) : to;
                    redirectUrl = {
                        url : decode ? url : decodeURIComponent(url),    // 避免二次解码
                        resp: rule.resp
                    };
                    break;
                }
            }
            this.redirectUrls[originUrl] = redirectUrl;
            return redirectUrl;
        }
        wildcardToRegex(wildcard) {
            const r = new RegExp("[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]", "g");
            return new RegExp('^'+(wildcard +"").replace(r,"\\$&").replace(/\\\*/g,"(.*)"));
        }
        // nsIObserver interface implementation
        observe(subject, topic, data, additional) {
            switch (topic) {
                case "http-on-modify-request": {
                    const channel = ChannelWrapper.get(subject);
                    // console.log(channel);
                    const redirectUrl = this.getRedirectUrl(channel.channel.URI.spec);
                    if (redirectUrl/* && !redirectUrl.resp*/) {						
                        channel.channel.cancel(Cr.NS_BINDING_REDIRECTED); // NS_BINDING_ABORTED
                        let loadingContext = (channel.channel.notificationCallbacks || channel.channel.loadGroup.notificationCallbacks).getInterface(Ci.nsILoadContext);
                        let webNavigation = loadingContext.topFrameElement.webNavigation;
                        let loadURI = webNavigation.fixupAndLoadURIString || webNavigation.loadURI;
                        loadURI.call(webNavigation, redirectUrl.url, {
                            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}),
                        });
                        /* 
						channel.channel.suspend();
                        const newURI = Services.io.newURI(redirectUrl.url);
                        channel.redirectTo(newURI);
                        ChromeUtils.addProfilerMarker(
							"Extension Redirected",
							{ category: "Network" },
							`${channel.type} ${channel.finalURL} redirected by uBlock0@raymondhill.net (chanId: ${channel.id})`
                        );
                        channel.channel.QueryInterface(Ci.nsIWritablePropertyBag)
                            .setProperty("redirectedByExtension", 'uBlock0@raymondhill.net');
                        channel.loadInfo.allowInsecureRedirectToDataURI = true;
                        channel.channel.resume(); */
                    }
                    break;
                }
            }
        }
        // nsIFactory interface implementation
        createInstance(outer, iid) {
            if (outer) throw Cr.NS_ERROR_NO_AGGREGATION;
            return this.QueryInterface(iid);
        }
    }

    class RedirectorUI {
		constructor() {
			this.hash = Date.now();
			this.rules = "local/_redirector.js".split("/"); // 规则文件路径
			this.state = true;                              // 是否启用脚本
			this.addIcon = 2;                               // 添加到 0 不添加 1 地址栏图标 2 导航栏按钮 3 工具栏菜单
			this.enableIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABZ0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMDvo9WkAAAI2SURBVDhPbVPNahNRGP3uzORvMhNCy7RJmGziICEtZOuiNbjRB5CgD+AyG1e6i4ib0m4KbhRKEemu1oUgbgTzAhXBjd2IUJBuopKCGjJzPSe5GWLpB5f5fs45uffcG7kYzWZzuVAo9DKZzJHjOB+5mBeLxV4YhksGdmlYnuc9tG37HLkG8Qz5wLKsAXP2OCuVSg+IJSGNTqfj+L5/hFTncrlBpVLp9Pv9FMScvWw2O0Cpie12u/ZsikDjCT4aW9/5vrpa1CLl+UrCsICvIo5C+IEdYg1HJIqiK0qpvyC/01qrROQZCHq+YqUSrNPEtm8TT5F8Pv+WHHIF5myjSOr1+hoBCwKPkN8dO859rdTPRKnRWRB4xMDMdXLg2bZA7TPOdswBYy6A76ZpCciv2fvl+1dNS8ghV+Dwb7i7Z/qLAntYfWz/KdY4tqxP6KfGkkOu4I4nKJ6b/qLAEMQJtk8fDs5dt2Ig0yAHAhMKfEXy3vT/O8Ifz2vh+wNHOB2JrBjINHAbH8gVuP8CamM4GnCwKMB6Ylk91rFtv2TNaDQaK3hgY3iwL0EQbMBRDUd3ObwocBJFORzhG+oEjOvsua67Sw65rHkTr9CIsZsuyBsA38M3PTOu8hp7eAs38JTvEEuOGYu0Wq0lkE+wrRgvbAtPu2xGabTb7TLezBYwCXbwhRwzmkWtVluG6huk/CONYNIhvHnMBbOYw0fRxBA7JV0W1Wr1FskQGaLELSoKDtnDmW/OUPMQ+QfYiMmtP0QQSQAAAABJRU5ErkJggg==";
			this.disableIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABZ0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMDvo9WkAAAHuSURBVDhPfVM7S4JRGP6832kKFVOLnIwckuZWaWrwfkG0hn5CY9HWEDgE4qBD0BSFuLRESdjWWIRTQ0u1BVEYZc9zPJ/5KfXAy3nPezvv7Sjj8Hq9UavVWjUajV1QD/RhMpnuIKt4PJ6wNJtEOBx22my2Q51O1zcYDJ9ms7mNswqqgb/W6/Vf0H05HI6DUChkkW4DSOcbOsOgGggEvFI1RDAYnIXNEdi+0+m8iEajpoEGgFODzlCsx+PxuWQyuaxSNptdLJfLLmmq2O32LRy03RMCvLYkU6vznk6nG6D+GL1nMpkN4QCgH02U1GNWfL2KyyfqmqESxmqAIjPI5/Nr4F9Ab8Vi0Uobn88XYcYul2tXQYe7aNIVFYQagM5SRNklZaVSaVqKFEznHn4dBuix21I+mkFL8me8o4SmNBFA1icI8igCgKlJ+TBAKpW6xfkqnfdjsZhmdPA5VQN0kUFbyjUlFAqFAPhn0FMul9OM1mKxsPSOaCIaMtFEtQfgN3lHFtwBATYRRx97scPVFWPERTNGNUAikTDj/gD6RpAVyvB6azhGYmSR+FoEhqtwnBJKALIFyqiD7TZEv4tEuN1uyB3qKtfVckbh9/vnsUDHYDn/c80qEwyCMkQmf30mEla5MuE8iv++M9Z+7Dsryg+nccGV4H85ngAAAABJRU5ErkJggg==";
            this.state = this.redirector.state;
            this.loadRule();
            this.drawUI();
            // register self as a messagelistener
            Services.cpmm.addMessageListener("redirector:toggle", this);
            Services.cpmm.addMessageListener("redirector:toggle-item", this);
            Services.cpmm.addMessageListener("redirector:reload", this);
		}
        get redirector() {
            if (!Services.redirector) {
                let state = this.state;
                XPCOMUtils.defineLazyGetter(Services, "redirector", function() {
                    let redirector = new Redirector();
                    redirector.clearCache = function() {
                        this.redirectUrls = {};
                    };
                    redirector.state = state;
                    return redirector;
                });
                if (state) {
                    Services.redirector.on();
                }
            }
            return Services.redirector;
        }
        destroy() {
            this.destoryUI();
            // Services.cpmm.removeMessageListener("redirector:toggle", this);
            // Services.cpmm.removeMessageListener("redirector:toggle-item", this);
            // Services.cpmm.removeMessageListener("redirector:reload", this);
        }
        drawUI() {
            if (this.addIcon > 0 && !$("redirector-icon")) {
                // add menu
                const menu = document.createXULElement("menupopup");
                menu.setAttribute("id", "redirector-menupopup");
                let menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Enable");
                menuitem.setAttribute("id", "redirector-toggle");
                menuitem.setAttribute("type", "checkbox");
                menuitem.setAttribute("autocheck", "false");
                menuitem.setAttribute("key", "redirector-toggle-key");
                menuitem.setAttribute("checked", this.state);
                menuitem.setAttribute("oncommand", "Redirector.toggle();");
                menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Reload");
                menuitem.setAttribute("id", "redirector-reload");
                menuitem.setAttribute("oncommand", "Redirector.reload();");
                menuitem = menu.appendChild(document.createXULElement("menuitem"));
                menuitem.setAttribute("label", "Edit");
                menuitem.setAttribute("id", "redirector-edit");
                menuitem.setAttribute("oncommand", "Redirector.edit();");
                let menuseparator = menu.appendChild(document.createXULElement("menuseparator"));
                menuseparator.setAttribute("id", "redirector-separator");
                // add icon
				let icon;
                if (this.addIcon == 1) {
                    icon = document.createXULElement("image");
                    icon.setAttribute("context", "redirector-menupopup");
                    icon.setAttribute("onclick", "Redirector.iconClick(event);");
                    icon.setAttribute("tooltiptext", "Redirector");
                    $("urlbar-icons").appendChild(icon);
                } else if (this.addIcon == 2) {
                    icon = $("nav-bar-customization-target").appendChild(document.createXULElement("toolbarbutton"));
                    icon.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
                    icon.setAttribute("tooltiptext", "Redirector");
					icon.setAttribute("label", "Redirector");
                    icon.setAttribute("removable", true);
                    icon.setAttribute("popup", "redirector-menupopup");
                } else if (this.addIcon == 3) {
                    icon = $("devToolsSeparator").parentNode.appendChild(document.createXULElement("menu"));
					icon.setAttribute("class", "menu-iconic");
					icon.setAttribute("label", "Redirector");
                    icon.appendChild(menu);
                }
				icon.setAttribute("id", "redirector-icon");
				const picB64 = this.state ? this.enableIcon : this.disableIcon;
				icon.setAttribute("style", `list-style-image: url(${picB64})`);
                // add rule items
                this.buildItems(menu);
                $("mainPopupSet").appendChild(menu);
            }
            if (!$("redirector-toggle-key")) {
                // add shortcuts
                const key = document.createXULElement("key");
                key.setAttribute("id", "redirector-toggle-key");
                key.setAttribute("oncommand", "Redirector.toggle();");
                key.setAttribute("key", "r");
                key.setAttribute("modifiers", "shift");
				$("mainKeyset").appendChild(key);
            }
        }
        destoryUI() {
            $("redirector-icon")?.remove();
            $("redirector-menupopup")?.remove();
            $("redirector-toggle-key")?.remove();
        }
        buildItems(menu) {
            menu ||= $("redirector-menupopup");
            if (menu) for (let [i, k] of this.redirector.rules.entries()) {
                let menuitem = document.createXULElement("menuitem");
                menuitem.setAttribute("label", k.name);
                menuitem.setAttribute("id", "redirector-item-" + i);
                menuitem.setAttribute("class", "redirector-item");
                menuitem.setAttribute("type", "checkbox");
                menuitem.setAttribute("autocheck", "false");
                menuitem.setAttribute("checked", k.state ?? true);
                menuitem.setAttribute("oncommand", `Redirector.toggle('${i}');`);
                menuitem.setAttribute("disabled", !this.state);
                menu.appendChild(menuitem);
            }
        }
        clearItems() {
            for (let k of $$("#redirector-menupopup > menuitem[id|=redirector-item]")) {
                k.remove();
            }
        }
        loadRule(forceLoadRule) {
            if (!forceLoadRule && this.redirector.rules.length > 0) {
                return;
            }
            const aFile = FileUtils.getDir("UChrm", this.rules, true);
            if (!aFile.exists() || !aFile.isFile()) return null;
            const fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            const sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);
            let data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) {}
            sstream.close();
            fstream.close();
            if (!data) return;
            const sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
            try {
                Cu.evalInSandbox(data, sandbox, "latest");
            } catch (e) {
                return;
            }
            this.redirector.rules = sandbox.rules;
        }
        toggle(i, callfromMessage=false) {
            if (i) {
				const rule = this.redirector.rules[i];
                if (!callfromMessage) {
                    rule.state = !rule.state;
                }
                // update checkbox state
                $("redirector-item-" + i)?.setAttribute("checked", rule.state);
                // clear cache
                this.redirector.clearCache();
                if (!callfromMessage) {
                    // notify other windows to update
                    Services.ppmm.broadcastAsyncMessage("redirector:toggle-item", {hash: this.hash, item: i});
                }
            } else {
                this.redirector.state = this.state = !this.state;
				if (!callfromMessage) {
					this.state ? this.redirector.on() : this.redirector.off();
				}
				for (let k of $$("menuitem[id|=redirector-item]")) k.setAttribute("disabled", !this.state);
                // update checkbox state
                $("redirector-toggle")?.setAttribute("checked", this.state);
                // update icon state
				$("redirector-icon").style.listStyleImage = `url(${this.state ? this.enableIcon : this.disableIcon})`;
                if (!callfromMessage) {
                    // notify other windows to update
                    Services.ppmm.broadcastAsyncMessage("redirector:toggle", {hash: this.hash});
                }
            }
        }
        reload(callfromMessage) {
            if (!callfromMessage) {
                this.redirector.clearCache();
            }
            this.clearItems();
            this.loadRule(true);
            this.buildItems();
            if (!callfromMessage) {
                // notify other windows to update
                Services.ppmm.broadcastAsyncMessage("redirector:reload", {hash: this.hash});
            }
        }
        edit() {
            let editor,aFile = FileUtils.getDir("UChrm", this.rules, true);
            if (!aFile || !aFile.exists() || !aFile.isFile()) return;
            try {
                editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
            } catch (e) {
                alert("Please set editor path.\nabout:config?filter=view_source.editor.path");
                openTrustedLinkIn('about:config?filter=view_source.editor.path', "tab");
                return;
            }
            const UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            UI.charset = "UTF-8";
            const process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                const path = UI.ConvertFromUnicode(aFile.path);
                const args = [path];
                process.init(editor);
                process.run(false, args, args.length);
            } catch (e) {
                alert("editor error.")
            }
        }
        iconClick({ button, screenX, screenY }) {
            switch(button) {
                case 1:
                    $("redirector-toggle").doCommand();
                    break;
                default:
                    $("redirector-menupopup").openPopupAtScreen(screenX,screenY); //.openPopup($('redirector-icon'), 'before_start');
            }
            event.preventDefault();
        }
        // nsIMessageListener interface implementation
        receiveMessage(message) {
            if (this.hash == message.data.hash) return;
            switch (message.name) {
                case "redirector:toggle":
                    this.toggle(null, true);
                    break;
                case "redirector:toggle-item":
                    this.toggle(message.data.item, true);
                    break;
                case "redirector:reload":
                    this.reload(true);
                    break;
            }
        }
    }

    window.Redirector?.destroy();
    window.Redirector = new RedirectorUI();
})();