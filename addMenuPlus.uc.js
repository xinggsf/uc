// ==UserScript==
// @name           addMenuPlus.uc.js
// @description    通过配置文件增加修改菜单，修改版
// @namespace      http://d.hatena.ne.jp/Griever/
// @author         Ryan, ywzhaiqi, Griever
// @include        main
// @license        MIT
// @compatibility  Firefox 136
// @charset        UTF-8
// @version        0.2.1 r4
// @shutdown       window.addMenu.destroy();
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @reviewURL      https://bbs.kafan.cn/thread-2246475-1-1.html
// @note           0.2.1 r3 新增 command 菜单跟随原菜单的 disabled/collapsed/hidden 属性，标签页右键菜单支持，无 command 二级菜单在第一个子菜单为 disabled 点击该二级菜单不再执行该子菜单的 command
// @note           0.2.1 fix openUILinkIn was removed, Bug 1820534 - Move front-end to modern flexbox, 修复 about:neterror 页面获取的地址不对, Bug 1815439 - Remove useless loadURI wrapper from browser.js, 扩展 %FAVICON% %FAVICON_BASE64% 的应用范围, condition 支持多个条件，支持 resource url 获取选中文本，支持 %sl 选中文本或者链接文本，openCommand 函数增加额外参数, Bug 1870644 - Provide a single function for obtaining icon URLs from search engines，dom 属性 image 转换为css 属性 list-style-image，强制 enableContentAreaContextMenuCompact 在 Firefox 版本号小于 90 时无效，移除 openScriptInScratchpad，移除 getSelection、getRangeAll、getInputSelection、focusedWindow、$$，修复大部分小书签兼容性问题（因为 CSP 有效部分还是不能运行）
// @note           0.2.0 采用 JSWindowActor 与内容进程通信（替代 e10s 时代的 loadFrameScript，虽然目前还能用），修复 onshowing 仅在页面右键生效的 bug，修复合并窗口后 CSS 失效的问题
// ==/UserScript==

/***** 説明 *****
 * _addMenu.js Demo: https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS/addMenuPlus/_addmenu.js
 */
if (typeof window == "undefined" || globalThis !== window) {
    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["AddMenuParent"];
        try {
            const actorParams = {
                parent: {
                    moduleURI: __URI__,
                },
                child: {
                    moduleURI: __URI__,
                    events: {},
                },
                allFrames: true,
                messageManagerGroups: ["browsers"],
                matches: ["*://*/*", "file:///*", "about:*", "view-source:*", "moz-extension://*/*"],
            };
            ChromeUtils.registerWindowActor("AddMenu", actorParams);
        } catch (e) { console.error(e) }

        this.AddMenuParent = class extends JSWindowActorParent {
            receiveMessage ({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
                let browser = windowGlobal.rootFrameLoader.ownerElement;
                let win = browser.ownerGlobal;
                let addMenu = win.addMenu;
                switch (name) {
                    case "AM:SetSeletedText":
                        addMenu.setSelectedText(data.text);
                        break;
                    case "AM:FaviconLink":
                        if (data?.href && data.hash) {
                            win.gBrowser.tabs.forEach(t => {
                                t.faviconHash === data.hash && (t.faviconUrl = data.href)
                            });
                        }
                        break;
                    case "AM:ExectueScriptEnd":
                        break;
                    case "AM:OnElement":
                        Object.assign(win.addMenu.ContextMenu, data);
                        break;
                }
            }
        }
    }
    else {
        this.EXPORTED_SYMBOLS = ["AddMenuChild"];

        this.AddMenuChild = class extends JSWindowActorChild {
            actorCreated () {
                const win = this.contentWindow;
                if (window.addMenu) return;
                win.addMenu = {};
                const { console, document: doc } = window;
                const actor = win.windowGlobalChild.getActor("AddMenu");;
                doc.addEventListener("mouseup", function(event) {
                    var selectedText = getSelectedText();
                    if (selectedText) {
                        actor.sendAsyncMessage("AM:SetSeletedText", {
                            text: selectedText,
                            isEditableElement: isEditableElement()
                        });
                    }
                });

                doc.addEventListener("contextmenu", function(event) {
                    let data = {
                        onSvg: event.target.namespaceURI === "http://www.w3.org/2000/svg"
                    }

                    if (event.target.namespaceURI === "http://www.w3.org/2000/svg") {
                        data.svg = event.target.closest('svg')?.outerHTML;
                    }
                    actor.sendAsyncMessage("AM:OnElement", data);
                });

                function getSelectedText() {
                    var text = "";
                    if (win.getSelection) {
                        text = win.getSelection().toString();
                    } else if (doc?.selection?.type != "Control") {
                        text = doc.selection.createRange().text;
                    }
                    return text;
                }

                function isEditableElement() {
                    var el = win.getSelection().focusNode.parentNode;
                    return el.isContentEditable || el.matches('input,textarea');
                }
            }
            receiveMessage ({ name, data }) {
                const win = this.contentWindow;
                const { console, document: doc } = win;
                const actor = win.windowGlobalChild.getActor("AddMenu");
                switch (name) {
				case "AM:GetFaviconLink":
					if (!doc.head || doc.location.href.startsWith("about:")) return;
					let link = doc.head.querySelector('[rel~="shortcut"],[rel="icon"]');
					let href = "";
					if (link) {
						href = processRelLink(link.getAttribute("href"));
					} else {
						href = `${doc.location.protocol}//${doc.location.host}/favicon.ico`;
					}
					actor.sendAsyncMessage("AM:FaviconLink", { href, hash: data.hash });
					function processRelLink(href) {
						if (href.startsWith("//")) {
							return doc.location.protocol + href;
						}
						if (/^(https?|chrome|resource|data):/.test(href)) {
							return href;
						}
						const { protocol, host } = doc.location;
						if (/^\.?\//.test(href)) {
							return protocol + "//" + host + href.replace(/^\./, "");
						}
						return `${protocol}//${host}/${href}`;
					}
					break;
				case "AM:ExectueScript":
					if (data?.script) {
						eval('(' + decodeURIComponent(atob(data.script)) + ').call(this, doc, win, actor)');
					}
					break;
                }
            }
        }
    }
}
else {
    try {
        let fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
        let scriptPath = Components.stack.filename;
        if (scriptPath.startsWith("chrome")) {
            scriptPath = resolveChromeURL(scriptPath);
            function resolveChromeURL(str) {
                const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                try {
                    return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec;
                } catch (e) {
                    console.error(e);
                    return ""
                }
            }
        }
        let scriptFile = fileHandler.getFileFromURLSpec(scriptPath);
        let resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
        if (!resourceHandler.hasSubstitution("addmenu-ucjs")) {
            resourceHandler.setSubstitution("addmenu-ucjs", Services.io.newFileURI(scriptFile.parent));
        }
        try {
            // ChromeUtils.import(
            ChromeUtils.importESModule(`resource://addmenu-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        } catch (e) {
            Cu.reportError(e);
        }
    } catch (e) { console.log(e) }

    (function(css, getURLSpecFromFile, loadText, versionGE, isFirefoxSupportedImageMime) {
        const {SelectionUtils} = ChromeUtils.importESModule("resource://gre/modules/SelectionUtils.sys.mjs");

        var enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
        var onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
        var enableidentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单
        var enableContentAreaContextMenuCompact = true; // Photon 界面下右键菜单兼容开关（网页右键隐藏非纯图标菜单的图标，Firefox 版本号小于90无效）
        var enableConvertImageAttrToListStyleImage = true; // 将图片属性转换为 css 属性 list-style-image

        window?.addMenu?.destroy();

        // i18n
        const _LANG = {
            'zh': {
                'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                    '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件\n\n' +
                    'tab({\n    label: "addMenuPlus 配置",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
                'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
                'addmenuplus label': 'addMenuPlus',
                'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
                'custom showing method error': 'addMenuPlus 自定义显示错误',
                'url is invalid': 'URL 不正确: %s',
                'config file': '配置文件',
                'not exists': ' 不存在',
                'check config file with line': '\n请重新检查配置文件第 %s 行',
                'file not found': '文件不存在: %s',
                'config has reload': '配置已经重新载入',
                'please set editor path': '请先设置编辑器的路径!!!',
                'set global editor': '设置全局脚本编辑器',
                'could not load': '无法载入：%s'
            },
            'en': {
                'config example': '// This is an addMenuPlus configuration file.\n' +
                    '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                    '\n\n' +
                    'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
                'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
                'addmenuplus label': 'addMenuPlus',
                'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
                'custom showing method error': 'addMenuPlus customize popupshow error',
                'url is invalid': 'URL is invalid: %s',
                'check config file with line': '\nPlease recheck line %s of the configuration file',
                'file not found': 'File not found: %s',
                'config has reload': 'The configuration has been reloaded',
                'please set editor path': 'Please set the path to the editor first!!!',
                'set global editor': 'Setting up the global script editor',
                'could not load': 'Could not load：%s'
            },
        };
        const _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN").split('-')[0];
        const LANG = _LANG[_LOCALE] || _LANG.en;

        // 增加菜单类型请在这里加入插入点，名称不能是 ident 或者 group
        const MENU_ATTRS = {
            tab: {
                insRef: $("context_closeTab"),
                current: "tab",
                submenu: "TabMenu",
                groupmenu: "TabGroup"
            },
            page: {
                insRef: $("context-viewsource"),
                current: "page",
                submenu: "PageMenu",
                groupmenu: "PageGroup"
            },
            tool: {
                insRef: $("#prefSep, #webDeveloperMenu"),
                current: "tool",
                submenu: "ToolMenu",
                groupmenu: "ToolGroup"
            },
            app: {
                insRef: $("#appmenu-quit,#appMenu-quit-button,#appMenu-quit-button2,#menu_FileQuitItem"),
                current: "app",
                submenu: "AppMenu",
                groupmenu: "AppGroup"
            },
            nav: {
                insRef: $("#toolbar-context-undoCloseTab, #toolbarItemsMenuSeparator"),
                current: "nav",
                submenu: "NavMenu",
                groupmenu: "NavGroup"
            }
        };

        window.addMenu = {
            _selectedText: "",
            ContextMenu: { svg: null, onSvg: false },
            error, log,
            get prefs() {
                delete this.prefs;
                return this.prefs = Services.prefs.getBranch("addMenu.")
            },
            get platform() {
                return AppConstants.platform;
            },
            get FILE() {
                delete this.FILE;
                let path;
                try {
                    path = this.prefs.getStringPref("FILE_PATH")
                } catch (e) {
                    path = '_addmenu.js';
                }

                const aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);

                if (!aFile.exists()) {
                    saveFile(aFile, $L('config example'));
                    alert($L('example is empty'));
                    addMenu.openCommand({
                        target: this
                    }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
                }

                this._modifiedTime = aFile.lastModifiedTime;
                return this.FILE = aFile;
            },
            get supportLocalization() {
                return typeof Localization == "function";
            },
            get locale() {
                return _LOCALE || "en";
            },
            get panelId() {
                return this.panelId = Math.floor(Math.random() * 900000 + 99999);
            },
            init() {
                this.win = window;
                // prepare regex
                let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
                let rTITLE = "%TITLE" + he + "%|%t\\b";
                let rTITLES = "%TITLES" + he + "%|%t\\b";
                let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
                let rHOST = "%HOST" + he + "%|%h\\b";
                let rSEL = "%SEL" + he + "%|%s\\b";
                let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
                let rIMAGE = "%IMAGE(?:_URL|_ALT|_TITLE)" + he + "%|%i\\b";
                let rIMAGE_BASE64 = "%IMAGE_BASE64" + he + "%|%i\\b";
                let rSVG_BASE64 = "%SVG_BASE64" + he + "%|%i\\b";
                let rMEDIA = "%MEDIA_URL" + he + "%|%m\\b";
                let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
                let rFAVICON = "%FAVICON" + he + "%";
                let rEMAIL = "%EMAIL" + he + "%";
                let rExt = "%EOL" + he + "%";

                let rFAVICON_BASE64 = "%FAVICON_BASE64" + he + "%";
                let rRLT_OR_UT = "%RLT_OR_UT" + he + "%"; // 链接文本或网页标题
                let rSEL_OR_LT = "%(?:SEL_OR_LINK_TEXT|SEL_OR_LT)" + he + "%|%sl\\b"; // 选中文本或者链接文本

                this.rTITLE = new RegExp(rTITLE, "i");
                this.rTITLES = new RegExp(rTITLES, "i");
                this.rURL = new RegExp(rURL, "i");
                this.rHOST = new RegExp(rHOST, "i");
                this.rSEL = new RegExp(rSEL, "i");
                this.rLINK = new RegExp(rLINK, "i");
                this.rIMAGE = new RegExp(rIMAGE, "i");
                this.rMEDIA = new RegExp(rMEDIA, "i");
                this.rCLIPBOARD = new RegExp(rCLIPBOARD, "i");
                this.rFAVICON = new RegExp(rFAVICON, "i");
                this.rEMAIL = new RegExp(rEMAIL, "i");
                this.rExt = new RegExp(rExt, "i");
                this.rFAVICON_BASE64 = new RegExp(rFAVICON_BASE64, "i");
                this.rIMAGE_BASE64 = new RegExp(rIMAGE_BASE64, "i");
                this.rSVG_BASE64 = new RegExp(rSVG_BASE64, "i");
                this.rRLT_OR_UT = new RegExp(rRLT_OR_UT, "i");
                this.rSEL_OR_LT = new RegExp(rSEL_OR_LT, "i");

                this.regexp = new RegExp(
                    [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rIMAGE, rIMAGE_BASE64, rMEDIA, rSVG_BASE64, rCLIPBOARD, rFAVICON, rFAVICON_BASE64, rEMAIL, rExt, rRLT_OR_UT, rSEL_OR_LT].join("|"), "ig");

                // add menuitem insertpoint
                for (let type in MENU_ATTRS) {
                    let ins = MENU_ATTRS[type].insRef;
                    if (ins) {
                        let tag = ins.localName.startsWith("menu") ? "menuseparator" : "toolbarseparator";
                        let insertPoint = $C(tag, {
                            id: `addMenu-${type}-insertpoint`,
                            class: "addMenu-insert-point",
                            hidden: true
                        })
                        MENU_ATTRS[type].insertId = insertPoint.id;
                        ins.after(insertPoint);
                        delete MENU_ATTRS[type].insRef;
                    } else {
                        delete MENU_ATTRS[type];
                    }
                }

                // old style groupmenu compatibility
                MENU_ATTRS['group'] = {
                    current: "group",
                    submenu: "GroupMenu",
                    insertId: "addMenu-page-insertpoint"
                };

                $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
                $("tabContextMenu").addEventListener("popupshowing", this, false);
                $("toolbar-context-menu").addEventListener("popupshowing", this, false);
                $("menu_FilePopup").addEventListener("popupshowing", this, false);
                $("menu_ToolsPopup").addEventListener("popupshowing", this, false);

                // move menuitems to Hamburger menu when firstly clicks the PanelUI button
                PanelUI.mainView.addEventListener("ViewShowing", this.moveToAppMenu, { once: true });

                // PanelUI 增加 CustomShowing 支持
                PanelUI.mainView.addEventListener("ViewShowing", this);

                this.APP_LITENER_REMOVER = function() {
                    PanelUI.mainView.removeEventListener("ViewShowing", this);
                };

                this.identityBox = $('#identity-icon, #identity-box');
                if (enableidentityBoxContextMenu && this.identityBox) {
                    // SSL 小锁右键菜单
                    this.identityBox.addEventListener("click", this, false);
                    this.identityBox.setAttribute('contextmenu', false);
                    const popup = $C('menupopup', {
                        id: 'identity-box-contextmenu'
                    });
                    popup.appendChild($C("menuseparator", {
                        id: "addMenu-identity-insertpoint",
                        class: "addMenu-insert-point",
                        hidden: true
                    }));
                    $("mainPopupSet").appendChild(popup);
                    popup.addEventListener("popupshowing", this, false);
                    MENU_ATTRS['ident'] = {
                        current: "ident",
                        submenu: "IdentMenu",
                        groupmenu: "IdentGroup",
                        insertId: 'addMenu-identity-insertpoint'
                    }
                }

                // 增加工具菜单
                $("devToolsSeparator")?.before($C("menuitem", {
                    id: "addMenu-rebuild",
                    label: $L('addmenuplus label'),
                    tooltiptext: $L('addmenuplus tooltip'),
                    oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
                    onclick: "if (event.button == 2) { event.preventDefault(); addMenu.edit(addMenu.FILE); }",
                }));

                // Photon Compact
                if (enableContentAreaContextMenuCompact && versionGE("90a1")) {
                    $("contentAreaContextMenu").setAttribute("photoncompact", "true");
                    $("tabContextMenu").setAttribute("photoncompact", "true");
                }

                // 响应鼠标键释放事件（eg：获取选中文本）
                gBrowser.tabpanels.addEventListener("mouseup", this, false);
                // 响应标签修改事件
                gBrowser.tabContainer.addEventListener('TabAttrModified', this);

                this.style = addStyle(css);
                this.rebuild();
            },
            destroy() {
                ChromeUtils.unregisterWindowActor('AddMenu');
                $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
                $("contentAreaContextMenu").removeEventListener("popuphiding", this, false);
                $("tabContextMenu").removeEventListener("popupshowing", this, false);
                $("toolbar-context-menu").removeEventListener("popupshowing", this, false);
                $("menu_FilePopup").removeEventListener("popupshowing", this, false);
                $("menu_ToolsPopup").removeEventListener("popupshowing", this, false);
                $("contentAreaContextMenu").removeAttribute("photoncompact");
                if (typeof this.APP_LITENER_REMOVER === "function")
                    this.APP_LITENER_REMOVER();
                gBrowser.tabpanels.removeEventListener("mouseup", this, false);
                gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
                this.removeMenuitem();
                $$('#addMenu-rebuild, .addMenu-insert-point').forEach(function(e) {
                    e.remove()
                });
                $('identity-box-contextmenu')?.remove();
                this.identityBox?.removeAttribute('contextmenu');
                this.identityBox?.removeEventListener("click", this, false);
                this.style?.remove();
                this.style2?.remove();
                delete window.addMenu;
            },
            handleEvent(event) {
                switch (event.type) {
                case "ViewShowing":
                case "popupshowing":
                    if (event.target != event.currentTarget) return;
                    if (enableFileRefreshing) {
                        this.updateModifiedFile();
                    }

                    for (const m of $$(`.addMenu`, event.target)) {
                        // 强制去除隐藏属性
                        m.removeAttribute("hidden");
                        // 显示时自动更新标签
                        if (m.hasAttribute('onshowinglabel')) {
                            onshowinglabelMaxLength ||= 15;
                            let sel = addMenu.convertText(m.getAttribute('onshowinglabel'));
                            if (sel?.length > 15) sel = sel.substr(0, 15) + "...";
                            m.setAttribute('label', sel);
                        }
                    }

                    let insertPoint = "";

                    if (gContextMenu && event.target.id == 'contentAreaContextMenu') {
                        var state = [];
                        if (gContextMenu.onTextInput)
                            state.push("input");
                        if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                            state.push("select");
                        if (gContextMenu.onLink || event.target.matches("#context-openlinkincurrent:not([hidden=true])"))
                            state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                        if (gContextMenu.onCanvas)
                            state.push("canvas image");
                        if (gContextMenu.onImage)
                            state.push("image");
                        if (gContextMenu.onVideo || gContextMenu.onAudio)
                            state.push("media");
                        event.currentTarget.setAttribute("addMenu", state.join(" "));

                        insertPoint = "addMenu-page-insertpoint";
                    }

                    if (event.target.id === "toolbar-context-menu") {
                        const triggerNode = event.target.triggerNode;
                        const state = [];
                        const map = {
                            'toolbar-menubar': 'menubar',
                            'TabsToolbar': 'tabs',
                            'nav-bar': 'navbar',
                            'PersonalToolbar': 'personal',
                        };
                        Object.keys(map).forEach(i => $(i).contains(triggerNode) && state.push(map[i]));
                        if (triggerNode?.matches("toolbarbutton")) {
                            state.push("button");
                        }
                        event.currentTarget.setAttribute("addMenu", state.join(" "));

                        insertPoint = "addMenu-nav-insertpoint";
                    }

                    if (event.target.id === "tabContextMenu") {
                        insertPoint = "addMenu-tab-insertpoint";
                        triggerFavMsg(TabContextMenu.contextTab);
                    }

                    if (event.target.id === "identity-box-contextmenu") {
                        insertPoint = "addMenu-identity-insertpoint";
                    }

                    if (event.target.matches('#menu_FilePopup, #appMenu-protonMainView')) {
                        insertPoint = "addMenu-app-insertpoint";
                    }

                    if (event.target.id === "menu_ToolsPopup") {
                        insertPoint = "addMenu-tool-insertpoint";
                    }

                    this.customShowings?.forEach(function(obj) {
                        if (obj.insertPoint !== insertPoint) return;
                        let {item, fnSource: fn} = obj;
                        if (typeof fn == 'function') fn = fn.toString();
                        if (!fn.startsWith('function')) fn = 'function ' + fn;
                        try {
                            eval(`(${fn}).call(item, item)`);
                        } catch (ex) {
                            error($L('custom showing method error'), fn, ex);
                        }
                    });

                    setTimeout(_ => {
                        event.target.querySelectorAll('.addMenu[command]').forEach(elem => {
                            if (elem.parentNode.matches('menugroup')) return;
                            let original = $(elem.getAttribute('command'));
                            if (original) {
                                elem.hidden = original.hidden;
                                elem.collapsed = original.collapsed;
                                elem.disabled = original.disabled;
                            }
                        });
                        event.target.querySelectorAll('menugroup.addMenu').forEach(group => {
                            [...group.children].forEach(elem => {
                                if (!elem.matches(`menu [command], menuitem[command]`)) return;
								elem.removeAttribute('hidden');
								const oringal = $(elem.getAttribute('command'));
								if (oringal) elem.disabled = oringal.hidden;
                            });
                        });
                    }, 9);
                    break;
                case "popuphiding":
                    if (event.target != event.currentTarget) return;
                    if (event.target.id === "contentAreaContextMenu") {
                        Object.assign(this.ContextMenu, {
                            svg: null, onSvg: false
                        });
                    }
                    break;
                case 'mouseup':
                    // get selected text
                    if (event.button === 0 && content) {
                        // 内置页面
                        this.setSelectedText(SelectionUtils.getSelectionDetails(content).fullText);
                    }
                    break;
                case 'click':
                    if (event.button == 2 && event.target.id === this.identityBox.id)
                        $("identity-box-contextmenu").openPopup(event.target, "after_pointer", 0, 0, true, false);
                    break;
                case 'TabAttrModified':
                    triggerFavMsg(event.target);
                    break;
                }

                function triggerFavMsg(tab) {
                    if (content) return;
                    if (tab === void 0) return;
                    const browser = gBrowser.getBrowserForTab(tab);
                    const URI = browser.currentURI || browser.documentURI;
                    if (!URI || !/^(f|ht)tps?:/.test(URI.spec)) return;
                    try {
                        let hash = calculateHashFromStr(URI.spec);
                        tab.faviconHash = hash;
                        let actor = browser.browsingContext.currentWindowGlobal.getActor("AddMenu");
                        actor.sendAsyncMessage("AM:GetFaviconLink", { hash });
                    } catch (error) { }
                }
                function calculateHashFromStr(data) {
                    // Lazily create a reusable hasher
                    let gCryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);

                    gCryptoHash.init(gCryptoHash.MD5);

                    // Convert the data to a byte array for hashing
                    gCryptoHash.update(
                        data.split("").map(c => c.charCodeAt(0)),
                        data.length
                    );
                    // Request the has result as ASCII base64
                    return gCryptoHash.finish(true);
                }
            },
            updateModifiedFile() {
                if (!this.FILE.exists()) return;

                if (this._modifiedTime != this.FILE.lastModifiedTime) {
                    this._modifiedTime = this.FILE.lastModifiedTime;

                    setTimeout(function() {
                        addMenu.rebuild(true);
                    }, 10);
                }
            },
            onCommand(event) {
                var menuitem = event.target;
                var text = menuitem.getAttribute("text") || "";
                var keyword = menuitem.getAttribute("keyword") || "";
                var url = menuitem.getAttribute("url") || "";
                var where = menuitem.getAttribute("where") || "";
                var exec = menuitem.getAttribute("exec") || "";

                if (keyword) {
                    let param = text ? (text = this.convertText(text)) : "";
                    let engine = keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(keyword);
                    engine.then((engine) => {
                        let submission = engine.getSubmission(param);
                        this.openCommand(event, submission.uri.spec, where);
                    }).catch(() => {
                        PlacesUtils.keywords.fetch(keyword).then(entry => {
                            if (!entry) return;
                            let newurl = entry.url.href.replace('%s', encodeURIComponent(param));
                            this.openCommand(event, newurl, where);
                        });
                    })
                }
                else if (url)
                    this.openCommand(event, this.convertText(url), where);
                else if (exec)
                    this.exec(exec, this.convertText(text));
                else if (text)
                    this.copy(this.convertText(text));
            },
            openCommand(event, url, aWhere = 'tab', aAllowThirdPartyFixup, aPostData, aReferrerInfo) {
                const isJavaScriptURL = url.startsWith("javascript:");
                const isWebURL = /^(f|ht)tps?:/.test(url);
                if (aWhere?.includes('tab') && gBrowser.selectedTab.isEmpty) {
                    // reuse empty tab
                    aWhere = 'current';
                }
                const where = event.button === 1 ? 'tab' : aWhere;

                // Assign values to allowThirdPartyFixup if provided, or initialize with an empty object
                const allowThirdPartyFixup = { ...aAllowThirdPartyFixup };

                // 遵循容器设定
                if (!allowThirdPartyFixup.userContextId && isWebURL) {
                    allowThirdPartyFixup.userContextId = gBrowser.contentPrincipal.userContextId || gBrowser.selectedBrowser.contentPrincipal.userContextId || null;
                }

                if (aPostData) allowThirdPartyFixup.postData = aPostData;
                if (aReferrerInfo) allowThirdPartyFixup.referrerInfo = aReferrerInfo;

                // Set triggeringPrincipal based on 'where' and URL scheme
                allowThirdPartyFixup.triggeringPrincipal = (() => {
                    if (where === 'current' && !isJavaScriptURL) {
                        return gBrowser.selectedBrowser.contentPrincipal;
                    }

                    return isWebURL ? Services.scriptSecurityManager
                        .createNullPrincipal({ userContextId: allowThirdPartyFixup.userContextId }) :
                        Services.scriptSecurityManager.getSystemPrincipal();
                })();

                if (isJavaScriptURL) {
                    openTrustedLinkIn(url, 'current', {
                        allowPopups: true,
                        inBackground: allowThirdPartyFixup.inBackground || false,
                        allowInheritPrincipal: true,
                        private: PrivateBrowsingUtils.isWindowPrivate(window),
                        userContextId: allowThirdPartyFixup.userContextId,
                    });
                } else if (where || event.button === 1) {
                    openTrustedLinkIn(url, where, allowThirdPartyFixup);
                } else {
                    openUILink(url, event, {
                        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                    });
                }
            },
            exec(path, arg = []) {
                var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
                try {
                    var a;
                    if (typeof arg == 'string' || arg instanceof String) {
                        a = arg.split(/\s+/)
                    } else if (Array.isArray(arg)) {
                        a = arg;
                    } else {
                        a = [arg];
                    }

                    file.initWithPath(path);
                    if (!file.exists()) {
                        error($L("file not found", path));
                        return;
                    }

                    // Linux 下目录也是 executable
                    if (!file.isDirectory() && file.isExecutable()) {
                        process.init(file);
                        process.run(false, a, a.length);
                    } else {
                        file.launch();
                    }
                } catch (e) { log(e) }
            },
            handleRelativePath(path, parentPath) {
                if (path) {
                    var ffdir = parentPath || Cc['@mozilla.org/file/directory_service;1']
						.getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
                    // windows 的目录分隔符不一样
                    if (this.platform === "win") {
                        path = path.replace(/\//g, '\\');
                        if (/^(\\)/.test(path)) {
                            return ffdir + path;
                        }
                    } else {
                        path = path.replace(/\\/g, '//');
                        if (/^(\/\/)/.test(path)) {
                            return ffdir + path.replace(/^\/\//, "/");
                        }
                    }
                    return path;
                }
            },
            moveToAppMenu() {
                let ins = $('addMenu-app-insertpoint');
                if (ins?.matches('menuseparator')) {
                    let separator = $('appMenu-quit-button2')?.previousSibling;
                    if (separator) {
                        ins.remove();
                        // addMenu.removeMenuitem();
                        separator.before($C('toolbarseparator', {
                            'id': 'addMenu-app-insertpoint',
                            class: "addMenu-insert-point",
                            hidden: true
                        }));
                        addMenu.rebuild();
                    }
                }
            },
            rebuild(isAlert) {
                const aFile = this.FILE;
                if (!aFile?.exists() || !aFile.isFile()) {
                    log(aFile ? aFile.path : U($L('config file')) + U($L('not exists')));
                    return;
                }

                var data = loadText(aFile.path);
                var sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
                Object.assign(sandbox, {
                    Cc, Ci, Cr, Cu, Services, $, $L, loadText,
                    locale: this.locale,
                    'addMenu': this,
                    _css: [],
                    gBrowser: gBrowser
                });
                sandbox.Components = Components;

                var includeSrc = "";
                sandbox.include = function(aLeafName) {
                    var file = addMenu.FILE.parent.clone();
                    file.appendRelativePath(aLeafName);
                    var data = loadText(file.path);
                    if (data) includeSrc += data + "\n";
                };

                Object.values(MENU_ATTRS).forEach(({ current, submenu, groupmenu }) => {
                    sandbox["_" + current] = [];
                    if (submenu !== "GroupMenu") {
                        sandbox[current] = function(itemObj) {
                            ps(itemObj, sandbox["_" + current]);
                        }
                    }
                    sandbox[submenu] = function(menuObj = {}) {
                        menuObj._items = [];
                        if (submenu == 'GroupMenu') menuObj._group = true;
                        sandbox["_" + current].push(menuObj);
                        return function(itemObj) {
                            ps(itemObj, menuObj._items);
                        }
                    }
                    if (isDef(groupmenu)) sandbox[groupmenu] = function(menuObj = {}) {
                        menuObj._items = [];
                        menuObj._group = true;
                        sandbox["_" + current].push(menuObj);
                        return function(itemObj) {
                            ps(itemObj, menuObj._items);
                        }
                    }
                });

                function ps(item, a) {
                    Array.isArray(item) ? a.push.apply(a, item) : a.push(item);
                }

                try {
                    var lineFinder = new Error();
                    Cu.evalInSandbox("function css(code){ this._css.push(code+'') };"+ data, sandbox);
                    Cu.evalInSandbox(includeSrc, sandbox, "latest");
                } catch (e) {
                    let line = e.lineNumber - lineFinder.lineNumber - 1;
                    this.alert(e + $L("check config file with line", line), null, function() {
                        addMenu.edit(addMenu.FILE, line);
                    });
                    return log(e);
                }
                this.style2?.remove();
                if (sandbox._css.length) this.style2 = addStyle(sandbox._css.join("\n"));

                this.removeMenuitem();
                this.customShowings = [];
                this.customFrameResult = [];

                Object.values(MENU_ATTRS).forEach(function({ current, insertId }) {
                    if (!sandbox["_" + current]?.length) return;
                    this.createMenuitem(sandbox["_" + current], $(insertId));
                }, this);

                if (isAlert) this.alert(U($L('config has reload')));
            },
            newGroupMenu(menuObj, opt) {
                const group = $C('menugroup');

                // 增加 onshowing 事件
                if (menuObj.onshowing) {
                    this.customShowings.push({
                        item: group,
                        insertPoint: opt.insertPoint.id,
                        fnSource: menuObj.onshowing
                    });
                    delete menuObj.onshowing;
                }
                this.procFrameScript(menuObj);

                Object.keys(menuObj).forEach((key) => {
                    if (key === "_items") return;
                    if (key === "_group") return;
                    var val = menuObj[key];
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);";
                    group.setAttribute(key, val);
                });
                group.classList.add('addMenu');

                this.setCondition(group, menuObj, opt);
                // Sync condition attribute to child menus
                menuObj._items.forEach((obj) => {
                    if (!("condition" in obj)) {
                        obj.condition = group.getAttribute("condition");
                    }
                    group.appendChild(this.newMenuitem(obj, {
                        isMenuGroup: true
                    }));
                });
                return group;
            },
            newMenu(menuObj, opt = {}) {
                if (menuObj._group) {
                    return this.newGroupMenu(menuObj, opt);
                }
                const isAppMenu = opt.insertPoint?.matches('toolbarseparator#addMenu-app-insertpoint'),
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menu",
                    menu = $C(menuitemType);
                let popup, panelId;

                // fix for appmenu
                const viewCache = $('appMenu-viewCache')?.content || $('appMenu-multiView');
                if (isAppMenu && viewCache) {
                    menu.setAttribute('closemenu', "none");
                    panelId = menuObj.id ? menuObj.id + "-panel" : "addMenu-panel-" + this.panelId++;
                    popup = viewCache.appendChild($C('panelview', {
                        'id': panelId,
                        'class': 'addMenu PanelUI-subView'
                    }));
                    popup = popup.appendChild($C('vbox', {
                        class: 'panel-subview-body',
                        panelId: panelId
                    }));
                } else {
                    popup = menu.appendChild($C("menupopup"));
                }

                if (menuObj.onshowing) {
                    this.customShowings.push({
                        item: menu,
                        insertPoint: opt.insertPoint.id,
                        fnSource: menuObj.onshowing.toString()
                    });
                    delete menuObj.onshowing;
                }
                this.procFrameScript(menuObj);
                for (let key in menuObj) {
                    if (key === "_items") continue;
                    let val = menuObj[key];
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);"
                    menu.setAttribute(key, val);
                }

                let cls = menu.classList;
                cls.add("addMenu");
                if (isAppMenu) {
                    cls.add("subviewbutton");
                    cls.add("subviewbutton-nav");
                } else {
                    cls.add("menu-iconic");
                }

                this.setCondition(menu, menuObj, opt);

                menuObj._items?.forEach(obj => {
                    popup.appendChild(this.newMenuitem(obj, opt))
                });

                // menu に label が無い場合、最初の menuitem の label 等を持ってくる
                // menu 部分をクリックで実行できるようにする(splitmenu みたいな感じ)
                if (isAppMenu) {
                    menu.setAttribute('oncommand', `PanelUI.showSubView('${panelId}', this)`);
                } else if (!menu.hasAttribute('label')) {
                    let firstItem = menu.querySelector('menuitem');
                    if (firstItem) {
                        let command = firstItem.getAttribute('command');
                        if (firstItem.matches('.copy')) {
                            menu.classList.add('copy');
                        }
                        if (command) firstItem = $(command) || firstItem;
                        ['label', 'data-l10n-href', 'data-l10n-id', 'accesskey', 'icon', 'tooltiptext'].forEach(function(n) {
                            if (!menu.hasAttribute(n) && firstItem.hasAttribute(n))
                                menu.setAttribute(n, firstItem.getAttribute(n));
                        }, this);
                        setImage(menu, menuObj.image || firstItem.getAttribute("image") || firstItem.style.listStyleImage.slice(4, -1));
                        menu.setAttribute('onclick', `
                        if (event.target != event.currentTarget) return;
                        var firstItem = event.currentTarget.querySelector('menuitem');
                        if (!firstItem) return;
                        if (event.button === 1) {
                            checkForMiddleClick(firstItem, event);
                        } else {
                            if (firstItem.disabled) return;
                            firstItem.doCommand();
                            closeMenus(event.currentTarget);
                        }`);
                    }
                }

                return menu;
            },
            procFrameScript(menuObj) {
                let r = menuObj.framescript;
                if (!r) return;
                if (typeof r == "function") r = r.toString();
                else if (r instanceof Object) {
                    const { keyword, result, script } = r;
                    if (keyword && result && script) {
                        this.customFrameResult.push({ keyword, result });
                    }
                    if (script) r = script.toString();
                }
                menuObj.framescript = btoa(encodeURIComponent(r));
            },
            newMenuitem(obj, opt = {}) {
                const isAppMenu = opt.insertPoint?.matches('toolbarseparator#addMenu-app-insertpoint'),
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menuitem";
                let menuitem, noDefaultLabel = false;

                if (obj.label === "separator" ||
                    (!obj.label && !obj.image && !obj.text && !obj.keyword && !obj.url && !obj.oncommand && !obj.command && !obj['data-l10n-id'])) {
                    menuitem = $C(separatorType);
                }
                else if (obj.oncommand || obj.command) {
                    let org = obj.command ? $(obj.command) : null;
                    if (org?.localName === separatorType) {
                        menuitem = $C(separatorType);
                    } else {
                        menuitem = $C(menuitemType);
                        if (obj.command)
                            menuitem.setAttribute("command", obj.command);

                        noDefaultLabel = !obj.label;
                        if (noDefaultLabel)
                            obj.label = org ? org.getAttribute("label") : obj.command || obj.oncommand;

                        obj.class?.split(" ").forEach(c => menuitem.classList.add(c));
                    }
                }
                else {
                    menuitem = $C(menuitemType);

                    // property fix
                    noDefaultLabel = !obj.label;
                    if (noDefaultLabel)
                        obj.label = obj.exec || obj.keyword || obj.url || obj.text;

                    if (obj.keyword && !obj.text) {
                        let index = obj.keyword.search(/\s+/);
                        if (index > 0) {
                            obj.text = obj.keyword.substr(index).trim();
                            obj.keyword = obj.keyword.substr(0, index);
                        }
                    }

                    if (obj.where && /\b(tab|tabshifted|window|current)\b/i.test(obj.where))
                        obj.where = RegExp.$1.toLowerCase();
                    if (obj.where && !("acceltext" in obj))
                        obj.acceltext = obj.where;

                    if (!obj.condition && (obj.url || obj.text)) {
                        let condition = "", s = obj.url || obj.text;
                        if (this.rSEL.test(s)) condition += " select";
                        if (this.rLINK.test(s)) condition += " link";
                        if (this.rEMAIL.test(s)) condition += " mailto";
                        if (this.rIMAGE.test(s)) condition += " image";
                        if (this.rMEDIA.test(s)) condition += " media";
                        if (condition) obj.condition = condition;
                    }

                    if (obj.exec) {
                        obj.exec = this.handleRelativePath(obj.exec);
                    }
                }

                // 右键第一层菜单添加 onpopupshowing 事件
                if (opt.isTopMenuitem && obj.onshowing) {
                    this.customShowings.push({
                        item: menuitem,
                        insertPoint: opt.insertPoint.id,
                        fnSource: obj.onshowing.toString()
                    });
                    delete obj.onshowing;
                }

                this.procFrameScript(obj);
                for (let key in obj) {
                    let val = obj[key];
                    if (key === "command") continue;
                    if (typeof val == "function")
                        obj[key] = val = "(" + val.toString() + ").call(this, event);";
                    menuitem.setAttribute(key, val);
                }

                if (noDefaultLabel && menuitem.localName !== separatorType) {
                    if (this.supportLocalization && obj["data-l10n-href"]?.endsWith(".ftl") && obj['data-l10n-id']) {
                        // Localization 支持
                        const label = new Localization([obj["data-l10n-href"]], true) // 第二个参数为 true 则是同步返回
                            .formatValueSync([obj['data-l10n-id']]);
                        label && menuitem.setAttribute('label', label);
                    }
                    else if (obj.keyword) {
                        // 调用搜索引擎 Label hack
                        const engine = obj.keyword === "@default"
                            ? Services.search.getDefault()
                            : Services.search.getEngineByAlias(obj.keyword);
                        engine.then(s => {
                            if (s?._name) menuitem.setAttribute('label', s._name);
                        });
                    }
                }

                var cls = menuitem.classList;
                cls.add("addMenu");
                if (isAppMenu) {
                    if (menuitem.localName == "toolbarbutton") cls.add("subviewbutton");
                } else {
                    cls.add("menuitem-iconic");
                }

                this.setCondition(menuitem, obj, opt);
                if (menuitem.localName == "menuseparator") return menuitem;

                if (!obj.onclick)
                    menuitem.setAttribute("onclick", "checkForMiddleClick(this, event)");

                // 给 MenuGroup 的菜单加上 tooltiptext
                if (opt.isMenuGroup && !obj.tooltiptext && obj.label) {
                    menuitem.setAttribute('tooltiptext', obj.label);
                }

                // 如果没有 command 和 oncommand 则增加 oncommand
                if (!(obj.oncommand || obj.command)) {
                    menuitem.setAttribute("oncommand", "addMenu.onCommand(event);");
                }

                this.setIcon(menuitem, obj);
                return menuitem;
            },
            createMenuitem(itemArray, insertPoint) {
                const chldren = [...insertPoint.parentNode.children];
                for (let obj of itemArray) {
                    if (!obj) continue;
                    let menuitem;

                    // clone menuitem and set attribute
                    if (obj.id && (menuitem = $(obj.id))) {
                        let dupMenuitem;
                        const isDupMenu = obj.clone != false;
                        if (isDupMenu) {
                            dupMenuitem = menuitem.cloneNode(true);
                            // 隐藏原菜单
                            // menuitem.classList.add("addMenuHide");
                        } else {
                            dupMenuitem = menuitem;
                            // 增加用于还原已移动菜单的标记
							dupMenuitem.before($C(insertPoint.localName, {
								'original-id': dupMenuitem.id,
								hidden: true,
								class: 'addMenuOriginal'
							}));
                        }
                        this.procFrameScript(obj);
                        for (let key in obj) {
                            let val = obj[key];
                            if (typeof val == "function")
                                obj[key] = val = "(" + val.toString() + ").call(this, event);";
                            dupMenuitem.setAttribute(key, val);
                        }

                        // 如果没有则添加 menuitem-iconic 或 menu-iconic，给菜单添加图标用。
                        const { nodeName: type, classList: cls } = dupMenuitem;
                        if (/^menu(item)?$/i.test(type) && !cls.contains(type + '-iconic'))
                            cls.add(type + '-iconic');
                        if (!cls.contains('addMenu'))
                            cls.add('addMenu');
                        if (!isDupMenu && !cls.contains('addMenuNot'))
                            cls.add('addMenuNot');

                        insertMenuItem(obj, dupMenuitem, !isDupMenu);
                        continue;
                    }

                    const cfg = { insertPoint };
					if (obj._items) cfg.isTopMenuitem = true;
                    insertMenuItem(obj, this.newMenu(obj, cfg));
                }

                function insertMenuItem(obj, menuitem, noMove) {
                    if (obj.parent) {
                        $(obj.parent)?.appendChild(menuitem);
                        return;
                    }
                    if (obj.insertAfter) {
                        $(obj.insertAfter)?.after(menuitem);
                        return;
                    }
                    if (obj.insertBefore) {
                        $(obj.insertBefore)?.before(menuitem);
                        return;
                    }
                    if (obj.position > 0) {
                        (chldren[obj.position-1] || insertPoint).before(menuitem);
                        return;
                    }
                    if (!noMove) {
                        insertPoint.before(menuitem);
                    }
                }
            },
            removeMenuitem() {
                const remove = function(e) {
                    !e.matches('.addMenuNot') && e.remove();
                };

                $$('.addMenuOriginal').forEach((e) => {
                    let id = e.getAttribute('original-id');
                    if (id && $(id)) e.before($(id));
                    e.remove();
                });

                $$('menu.addMenu, menugroup.addMenu').forEach(remove);
                $$('.addMenu').forEach(remove);
                // 恢复原隐藏菜单
                $$('.addMenuHide').forEach(function (e) {
                    e.classList.remove('addMenuHide');
                });
            },
            setIcon(menu, obj) {
                if (menu.hasAttribute("src") || menu.hasAttribute("icon"))
                    return;

                if (obj.image && /-iconic/.test(menu.className)) {
                    setImage(menu, obj.image);
                    return;
                }

                if (obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(obj.exec);
                    } catch (e) {
                        return;
                    }
                    // if (!aFile.exists() || !aFile.isExecutable()) {
                    if (!aFile.exists()) {
                        menu.setAttribute("disabled", "true");
                    } else if (aFile.isFile()) {
                        setImage(menu, "moz-icon://" + getURLSpecFromFile(aFile) + "?size=16");
                    } else {
                        setImage(menu, "chrome://global/skin/icons/folder.svg");
                    }
                    return;
                }

                if (obj.keyword) {
                    let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                    engine.then(function(engine) {
                        setImage(menu, getIconURL(engine));
                    });
                    return;
                    function getIconURL(engine) {
                        // Bug 1870644 - Provide a single function for obtaining icon URLs from search engines
                        return (engine._iconURI || engine.iconURI)?.spec || "chrome://browser/skin/search-engine-placeholder.png";
                    }
                }
                const setIconCallback = function(url) {
                    if (!url) return;
                    let uri;
                    try {
                        uri = Services.io.newURI(url, null, null);
                    } catch (e) {
                        return log(url, e)
                    }

                    menu.setAttribute("scheme", uri.scheme);
                    PlacesUtils.favicons.getFaviconDataForPage(uri, {
                        onComplete(aURI, aDataLen, aData, aMimeType) {
                            try {
                                let iconURL = "page-icon:" + (aURI?.spec || uri.spec);
                                setImage(menu, iconURL);
                            } catch (e) { }
                        }
                    });
                };

                PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                    const url = entry ? entry.url.href :
                        (obj.url + '').replace(this.regexp, "");
                    setIconCallback(url);
                }).catch(error);
            },
            setCondition(menu, { condition }, opt = {}) {
                if (condition) {
                    const tagList = ["select", "link", "mailto", "image", "canvas", "media", "input"];
                    const conditions = condition.split(' ').filter(c =>
                        c === "normal" || tagList.includes(c.replace(/^no/, ""))
                    );
                    if (conditions.length) {
                        menu.setAttribute("condition", conditions.join(" "));
                    }
                } else if (opt.insertPoint?.id === "addMenu-page-insertpoint") {
                    menu.setAttribute("condition", "normal");
                }
            },
            convertText(text) {
                var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                    link: {
                        href: "",
                        host: ""
                    },
                    target: {
                        alt: "",
                        title: ""
                    },
                    __noSuchMethod__(id, args) {
                        return ""
                    },
                };
                let tab = TabContextMenu.contextTab || gBrowser.selectedTab || document.popupNode;
                var bw = gContextMenu ? context.browser : tab.linkedBrowser;

                return text.replace(this.regexp, function (str) {
                    str = str.toUpperCase().replace("%LINK", "%RLINK");
                    if (str.includes("_HTML"))
                        return htmlEscape(convert(str.replace(/_HTML(IFIED)?/, "")));
                    if (str.includes("_ENCODE"))
                        return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                    return convert(str);
                });

                function convert(str) {
                    switch (str) {
                        case "%T":
                            return bw.contentTitle;
                        case "%TITLE%":
                            return bw.contentTitle;
                        case "%TITLES%":
                            return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "");
                        case "%U":
                            return getUrl();
                        case "%URL%":
                            return getUrl();
                        case "%H":
                            return getUrl();
                        case "%HOST%":
                            return getUrl();
                        case "%S":
                            return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || "";
                        case "%SEL%":
                            return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || "";
                        case "%SL":
                        case "%SEL_OR_LT%":
                        case "%SEL_OR_LINK_TEXT%":
                            return (gContextMenu ? context.selectionInfo.fullText : addMenu.getSelectedText()) || context.linkText();
                        case "%L":
                            return context.linkURL || "";
                        case "%RLINK%":
                            return context.linkURL || "";
                        case "%RLINK_HOST%":
                            return context.link.host || "";
                        case "%RLINK_TEXT%":
                            return context.linkText() || "";
                        case "%RLINK_OR_URL%":
                            return context?.linkURL || getUrl() || "";
                        case "%RLT_OR_UT%":
                            return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                        case "%IMAGE_ALT%":
                            return context.target.alt || "";
                        case "%IMAGE_TITLE%":
                            return context.target.title || "";
                        case "%I":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_URL%":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_BASE64%":
                            let imageURL;
                            if (gContextMenu?.onImage) {
                                imageURL = context.mediaURL;
                            } else {
                                let url = addMenu.convertText("%RLINK_OR_URL%");
                                if (/\.(?:jpe?g|png|gif|bmp|webp|ico|jxl)$/i.test(url)) {
                                    imageURL = url;
                                }
                            }
                            return imageURL ? img2base64(imageURL) : "";
                        case "%SVG_BASE64%":
                            if (addMenu.ContextMenu.onSvg && addMenu.ContextMenu.svg) {
                                return svg2base64(addMenu.ContextMenu.svg);
                            } else {
                                let imageURL = addMenu.convertText("%RLINK_OR_URL%");
                                if (gContextMenu?.onImage) {
                                    imageURL = addMenu.convertText("%i");
                                }
                                if (imageURL.startsWith("data:image/svg+xml")) return imageURL;
                                return imageURL.endsWith("svg") ? svg2base64(imageURL) : "";
                            }
                        case "%M":
                            return context.mediaURL || "";
                        case "%MEDIA_URL%":
                            return context.mediaURL || "";
                        case "%P":
                            return readFromClipboard() || "";
                        case "%CLIPBOARD%":
                            return readFromClipboard() || "";
                        case "%FAVICON%":
                            return tab.faviconUrl || gBrowser.getIcon(tab ? tab : null) || "";
                        case "%FAVICON_BASE64%":
                            let image = tab.faviconUrl || gBrowser.getIcon(tab ? tab : null);
                            if (image && image.startsWith("data:image")) return image;
                            return img2base64(image);
                        case "%EMAIL%":
                            return getEmailAddress() || "";
                        case "%EOL%":
                            return "\r\n";
                    }
                    return str;
                }

                function htmlEscape(s) {
                    return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
                }

                function getUrl() {
                    const URI = bw.currentURI;
                    if (URI.schemeIs("about") && URI.filePath =="neterror") {
                        return new URLSearchParams(URI.query).get('u');
                    }
                    return URI.spec;
                }

                function getEmailAddress() {
                    var url = context.linkURL;
                    if (!url || !/^mailto:([^?]+).*/i.test(url)) return "";
                    var addresses = RegExp.$1;
                    try {
                        var characterSet = context.target.ownerDocument.characterSet;
                        const textToSubURI = Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI);
                        addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
                    } catch (ex) { }
                    return addresses;
                }

                function img2base64(imgSrc, imgType = "image/png") {
                    if (imgSrc === void 0) return "";
                    if (imgType === "image/svg+xml" || imgSrc.endsWith(".svg")) return svg2base64(imgSrc);
                    const NSURI = "http://www.w3.org/1999/xhtml";
                    var img = new Image();
                    var canvas, isCompleted = false;
                    img.onload = function() {
                        canvas = document.createElementNS(NSURI, "canvas");
                        canvas.width = this.naturalWidth;
                        canvas.height = this.naturalHeight;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(this, 0, 0);
                        isCompleted = true;
                    };
                    img.onerror = function () {
                        addMenu.error($L('could not load', imgSrc));
                        isCompleted = true;
                    };
                    img.src = imgSrc;

                    var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                    while (!isCompleted) {
                        thread.processNextEvent(true);
                    }

                    var data = canvas ? canvas.toDataURL(imgType) : "";
                    canvas = null;
                    return data;
                }

                function svg2base64(svgSrc) {
                    if (svgSrc === void 0) return "";
                    if (!isSVGSource(svgSrc)) {
                        var xmlhttp = new XMLHttpRequest();
                        xmlhttp.open("GET", svgSrc, false);
                        xmlhttp.send();
                        svgSrc = xmlhttp.responseText;
                    }
                    if (!isSVGSource(svgSrc)) return "";
                    // svg string to data url
                    return "data:image/svg+xml;base64," + btoa(svgSrc);
                }

                function isSVGSource(str) {
                    str = str.trim();
                    return /<svg\b[^>]*>([\s\S]*?)<\/svg>/i.test(str);
                }
            },
            setSelectedText(text) {
                this._selectedText = text;
            },
            getSelectedText() {
                return this._selectedText;
            },
            edit(aFile, lineNumber) {
                if (!aFile?.exists() || !aFile.isFile()) return;

                let editor;
                try {
                    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                } catch (e) { }

                if (!editor?.exists()) {
                    alert($L('please set editor path'));
                    var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                    // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
                    fp.init("inIsolatedMozBrowser" in window.browsingContext.originAttributes
                        ? window : window.browsingContext,
						$L('set global editor'), fp.modeOpen);
                    fp.appendFilters(Ci.nsIFilePicker.filterApps);

                    if (fp.show !== void 0) {
                        if (fp.show() == fp.returnCancel || !fp.file) return;
						Services.prefs.setCharPref("view_source.editor.path", fp.file.path);
                    } else {
                        fp.open(res => {
                            if (res != Ci.nsIFilePicker.returnOK) return;
                            Services.prefs.setCharPref("view_source.editor.path", fp.file.path);
                        });
                    }
                }

                var aDocument = null;
                var aCallBack = null;
                var aPageDescriptor = null;
                gViewSourceUtils.openInExternalEditor(
                    { lineNumber, URL: getURLSpecFromFile(aFile) },
                    aPageDescriptor, aDocument, lineNumber, aCallBack);
            },
            copy(aText) {
                Cc["@mozilla.org/widget/clipboardhelper;1"]
					.getService(Ci.nsIClipboardHelper).copyString(aText);
            },
            copyLink(copyURL, copyLabel) {
                // generate the Unicode and HTML versions of the Link
                const textUnicode = copyURL;
                const textHtml = `<a href="${copyURL}">${copyLabel}</a>`;
                // add Unicode & HTML flavors to the transferable widget
                const trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
                if (!trans) return false; //no transferable widget found
                const clipboard = Cc["@mozilla.org/widget/clipboard;1"].getService(Ci.nsIClipboard);
                if (!clipboard) return false; // couldn't get the clipboard
                // make a copy of the Unicode
                const str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
                if (!str) return false; // couldn't get string obj
                str.data = textUnicode; // unicode string?
                // make a copy of the HTML
                const htmlstring = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
                htmlstring.data = textHtml;

                trans.addDataFlavor("text/unicode");
                trans.setTransferData("text/unicode", str, textUnicode.length * 2); // *2 because it's unicode
                trans.addDataFlavor("text/html");
                trans.setTransferData("text/html", htmlstring, textHtml.length * 2);

                clipboard.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
                return true;
            },
            copyImage(base64URI, imageMime) {
                // https://searchfox.org/mozilla-central/rev/d5ed9df049e40f12d058a5b7c2f3451ed778163b/devtools/client/shared/screenshot.js#293-325
                if (!(/^data:image\/(jpeg|png|gif|bmp|webp|svg|ico|x-jxl|x-jxlp|x-icon);base64,/i.test(base64URI))) return;
                if (!isFirefoxSupportedImageMime(imageMime)) return;
                try {
                    const imageTools = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools);
                    const data = atob(base64URI.split(";base64,")[1]);
                    const img = imageTools.decodeImageFromBuffer(data, data.length, imageMime);
                    const transferable = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
                    transferable.init(null);
                    transferable.addDataFlavor(imageMime);
                    transferable.setTransferData(imageMime, img);
                    Services.clipboard.setData(
                        transferable,
                        null,
                        Services.clipboard.kGlobalClipboard
                    );
                } catch (e) {
                    error(e);
                }
            },
            alert(aMsg, aTitle, aCallback) {
                var callback = aCallback ? {
                    observe(subject, topic, data) {
                        if ("alertclickcallback" == topic) aCallback.call(null);
                    }
                } : null;
                var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
                alertsService.showAlertNotification("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || "addMenuPlus",
                    aMsg + "", !!callback, "", callback);
            },
        };

        function $(id, doc = document) {
            if (!id) return;
            if (/[, \>\.\[\(]|^:/.test(id)) return doc.querySelector(id);
            return doc.getElementById(id.startsWith("#") ? id.substring(1) : id);
        }

        function $$(exp, doc = document) {
            return Array.prototype.slice.call(doc.querySelectorAll(exp));
        }

        function log(...args) {
            console.log(...args);
        }

        function error(...args) {
            console.error(...args);
        }

        function U(text) {
            return 1 < 'あ'.length ? decodeURIComponent(escape(text)) : text
        };

        function $C(name, attr) {
            const el = document.createXULElement(name);
            if (attr) Object.keys(attr).forEach(function(n) {
                el.setAttribute(n, attr[n])
            });
            return el;
        }

        function addStyle(css) {
            var pi = document.createProcessingInstruction(
                'xml-stylesheet',
                'type="text/css" href="data:text/css;utf-8,'+ encodeURIComponent(css) +'"'
            );
            return document.documentElement.appendChild(pi);
        }

        function saveFile(fileOrName, data) {
            var file;
            if (typeof fileOrName == "string") {
                file = Services.dirsvc.get('UChrm', Ci.nsIFile);
                file.appendRelativePath(fileOrName);
            } else {
                file = fileOrName;
            }

            var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            suConverter.charset = 'UTF-8';
            data = suConverter.ConvertFromUnicode(data);

            var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
            foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0);
            foStream.write(data, data.length);
            foStream.close();
        }
        // 首字母大写
        function capitalize(s) {
            return s && s[0].toUpperCase() + s.slice(1);
        }

        function $L(key, ...repl) {
            let i = 0;
            return LANG[key]?.replaceAll('%s', x => repl[i++]) || capitalize(key);
        }

        function isDef(v) {
            return v !== void 0 && v !== null
        }

        function setImage(menu, imageUrl) {
            if (imageUrl) {
                if (enableConvertImageAttrToListStyleImage) {
                    menu.style.listStyleImage = `url(${imageUrl})`;
                    menu.removeAttribute("image");
                } else {
                    menu.setAttribute("image", imageUrl);
                }
            }
        }

        window.addMenu.init();
    })(`
    .addMenuHide {
        display: none !important;
        visibility: collsapse !important;
    }
    #contentAreaContextMenu > .addMenu:not(menugroup),
    #contentAreaContextMenu > menugroup > .addMenu[condition],
    #contentAreaContextMenu menugroup.addMenu[condition] {
        display: none;
        visibility: collsapse;
    }
    #contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="link"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="mailto"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="image"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="canvas"] .addMenu[condition~="canvas"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="media"]  .addMenu[condition~="media"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="input"]  .addMenu[condition~="input"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu~="select"]  .addMenu[condition~="select"]:not([hidden="true"]),
    #contentAreaContextMenu[addMenu=""] .addMenu[condition~="normal"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="select"]) .addMenu[condition~="noselect"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="link"])   .addMenu[condition~="nolink"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="mailto"]) .addMenu[condition~="nomailto"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="image"])  .addMenu[condition~="noimage"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="canvas"])  .addMenu[condition~="nocanvas"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="media"])  .addMenu[condition~="nomedia"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="input"])  .addMenu[condition~="noinput"]:not([hidden="true"]),
    #contentAreaContextMenu:not([addMenu~="select"])  .addMenu[condition~="noselect"]:not([hidden="true"]) {
        display: flex !important; display: -moz-box !important;
    }
    #toolbar-context-menu:not([addMenu~="menubar"]) .addMenu[condition~="menubar"],
    #toolbar-context-menu:not([addMenu~="tabs"]) .addMenu[condition~="tabs"],
    #toolbar-context-menu:not([addMenu~="navbar"]) .addMenu[condition~="navbar"],
    #toolbar-context-menu:not([addMenu~="personal"]) .addMenu[condition~="personal"],
    #toolbar-context-menu:not([addMenu~="button"]) .addMenu[condition~="button"],
    #toolbar-context-menu[addMenu~="menubar"] .addMenu[condition~="nomenubar"],
    #toolbar-context-menu[addMenu~="tabs"] .addMenu[condition~="notabs"],
    #toolbar-context-menu[addMenu~="navbar"] .addMenu[condition~="nonavbar"],
    #toolbar-context-menu[addMenu~="personal"] .addMenu[condition~="nopersonal"],
    #toolbar-context-menu[addMenu~="button"] .addMenu[condition~="nobutton"],
    #toolbar-context-menu:not([addMenu=""]) .addMenu[condition~="normal"] {
        display: none !important;
    }
    .addMenu-insert-point,
    toolbarseparator:not(.addMenu-insert-point)+toolbarseparator {
        display: none !important;
    }
    .addMenu[collapsed="true"] {
        display: none !important;
    }
    .addMenu.exec,
    .addMenu[exec] {
        list-style-image: url("data:image/svg+xml;base64,PCEtLSBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljCiAgIC0gTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcwogICAtIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9ImNvbnRleHQtZmlsbCI+CiAgPHBhdGggZD0iTTEgM2ExIDEgMCAwMTEtMWgxMmExIDEgMCAwMTEgMXYxMGExIDEgMCAwMS0xIDFIMmExIDEgMCAwMS0xLTFWM3ptMTMgMEgydjJoMTJWM3ptMCAzSDJ2N2gxMlY2eiIvPgo8L3N2Zz4K");
    }
    .addMenu.copy,
    menuitem.addMenu[text]:not([url]):not([keyword]):not([exec]) {
        list-style-image: url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTYgMTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE2IDE2OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4NCjxwYXRoIGQ9Ik0yLjUsMUMxLjcsMSwxLDEuNywxLDIuNXY4QzEsMTEuMywxLjcsMTIsMi41LDEySDR2MC41QzQsMTMuMyw0LjcsMTQsNS41LDE0aDhjMC44LDAsMS41LTAuNywxLjUtMS41di04DQoJQzE1LDMuNywxNC4zLDMsMTMuNSwzSDEyVjIuNUMxMiwxLjcsMTEuMywxLDEwLjUsMUgyLjV6IE0yLjUsMmg4QzEwLjgsMiwxMSwyLjIsMTEsMi41djhjMCwwLjMtMC4yLDAuNS0wLjUsMC41aC04DQoJQzIuMiwxMSwyLDEwLjgsMiwxMC41di04QzIsMi4yLDIuMiwyLDIuNSwyeiBNMTIsNGgxLjVDMTMuOCw0LDE0LDQuMiwxNCw0LjV2OGMwLDAuMy0wLjIsMC41LTAuNSwwLjVoLThDNS4yLDEzLDUsMTIuOCw1LDEyLjVWMTINCgloNS41YzAuOCwwLDEuNS0wLjcsMS41LTEuNVY0eiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjUuMiIgeDI9IjkuMiIgeTI9IjUuMiIvPg0KPGxpbmUgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6Y3VycmVudENvbG9yO3N0cm9rZS1taXRlcmxpbWl0OjEwOyIgeDE9IjMuOCIgeTE9IjgiIHgyPSI5LjIiIHkyPSI4Ii8+DQo8L3N2Zz4NCg==);
      -moz-image-region: rect(0pt, 16px, 16px, 0px);
    }
    .addMenu.checkbox .menu-iconic-icon {
        -moz-appearance: checkbox;
    }
    .addMenu > .menu-iconic-left {
        -moz-appearance: menuimage;
    }
    .addMenu > .menu-iconic-left > .menu-iconic-icon {
        -moz-context-properties: fill, fill-opacity !important;
        fill: currentColor !important;
    }
    :is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > .addMenu:is(menu, menuitem) > .menu-iconic-left,
    :is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu >.addMenu.showText > .menu-iconic-left,
    :is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showText >.addMenu > .menu-iconic-left,
    :is(#contentAreaContextMenu, #tabContextMenu)[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu.showFirstText > .menuitem-iconic:first-child > .menu-iconic-left {
        visibility: collapse;
    }
    menugroup.addMenu > .menuitem-iconic.fixedSize {
        -moz-box-flex: 0;
        flex-grow: 0;
        flex-shrink: 0;
        padding-inline-end: 8px;
    }
    menugroup.addMenu > .menuitem-iconic {
        -moz-box-flex: 1;
        -moz-box-pack: center;
        -moz-box-align: center;
        flex-grow: 1;
        justify-content: center;
        align-items: center;
        padding-block: 6px;
        padding-inline-start: 1em;
    }
    menugroup.addMenu > .menuitem-iconic > .menu-iconic-left {
        -moz-appearance: none;
        padding-top: 0;
    }
    menugroup.addMenu > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
        width: 16px;
        height: 16px;
    }
    menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-text,
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child) > .menu-iconic-text,
    menugroup.addMenu > .menuitem-iconic > .menu-accel-container {
        display: none;
    }
    menugroup.addMenu > .menuitem-iconic {
        padding-inline-end: 1em;
    }
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText),
    menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) {
        padding-left: 0;
        -moz-box-flex: 0;
        flex-grow: 0;
        flex-shrink: 0;
        padding-inline-end: 0;
    }
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > .menu-iconic-left,
    menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-left {
        margin-inline-start: 8px;
        margin-inline-end: 8px;
    }`,
    (function() {
        //  fix for 92+ port Bug 1723723 - Switch JS consumers from getURLSpecFromFile to either getURLSpecFromActualFile or getURLSpecFromDir
        const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);

        return "getURLSpecFromFile" in fph ?
            f => fph.getURLSpecFromFile(f) :
            f => fph.getURLSpecFromActualFile(f);
    })(),
    (function() {
        return "IOUtils" in window ? function(path) {
            let isCompleted = false, data = "";
            IOUtils.readUTF8(path).then((d) => {
                data = d;
            }).catch((e) => {
                console.error(e);
            }).finally(() => {
                isCompleted = true;
            });
            var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
            while (!isCompleted) {
                thread.processNextEvent(true);
            }
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) { }
            return data;
        }
        : function(path) {
            var aFile = Cc["@mozilla.org/file/directory_service;1"]
                .getService(Ci.nsIDirectoryService)
                .QueryInterface(Ci.nsIProperties)
                .get('UChrm', Ci.nsIFile);
            aFile.initWithPath(path);
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);
            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) { }
            sstream.close();
            fstream.close();
            return data;
        }
    })(),
    function(v) {
        return Services.vc.compare(Services.appinfo.version, v) >= 0;
    },
    function(mime) {
        const firefoxSupportedImageMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/webp',
            'image/svg+xml',
            'image/vnd.microsoft.icon', // .ico
            'image/jxl', // JPEG XL
        ];
        return firefoxSupportedImageMimes.includes(mime.toLowerCase());
    }
)
}