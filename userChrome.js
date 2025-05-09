/* :::::::: Sub-Script/Overlay Loader v3.0.79mod no bind version ::::::::::::::: */

// automatically includes all files ending in .uc.xul and .uc.js from the profile's chrome folder

// New Features:
// supports Greasemonkey-style metadata for userChrome scripts and overlays
// supports a "main" shortcut for the main browser window in include/exclude lines
// supports regexes in the include/exclude lines
// scripts without metadata will run only on the main browser window, for backwards compatibility
//
// 1.Including function of UCJS_loader.
// 2.Compatible with Fx2 and Fx3.0b5pre
// 3.Cached script data (path, leafname, regex)
// 4.Support window.userChrome_js.loadOverlay(overlay [,observer]) //
// Modified by Alice0775
//
// @version       2025/01/05 fix error handler
// @version       2025/01/03 use ChromeUtils.compileScript if async
// @version       2024/12/25 load script async if meta has @async true. nolonger use @charset
// @version       2023/09/07 remove to use nsIScriptableUnicodeConverter and AUTOREMOVEBOM
// @version       2022/03/15 fix UCJS_loader
// @version       2022/08/26 Bug 1695435 - Remove @@hasInstance for IDL interfaces in chrome context
// @version       2022/08/26 fix load sidebar
// @version       2022/04/01 remove nsIIOService
// @version       2021/08/05 fix for 92+ port Bug 1723723 - Switch JS consumers from getURLSpecFromFile to either getURLSpecFromActualFile or getURLSpecFromDir
// @version       2021/06/25 skip for in-content dialog etc.
// @version       2019/12/11 fix for 73 Bug 1601094 - Rename remaining .xul files to .xhtml in browser and Bug 1601093 - Rename remaining .xul files to .xhtml in toolkit
// Date 2019/12/11 01:30 fix 72 revert the code for sidebar, use "load" in config.js(2019/12/11 01:30),
// Date 2019/08/11 21:30 fix 70.0a1  Bug 1551344 - Remove XULDocument code
// Date 2019/05/21 08:30 fix 69.0a1 Bug 1534407 - Enable browser.xhtml by default, Bug 1551320 - Replace all CreateElement calls in XUL documents with CreateXULElement

(function () {
    "use strict";
    const {classes:Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;
    var { AppConstants } = AppConstants || ChromeUtils.importESModule(
        "resource://gre/modules/AppConstants.sys.mjs"
    );
    // -- config --
    const EXCLUDE_CHROMEHIDDEN = false; //chromehiddenなwindow(popup等)ではロード: しないtrue, する[false]
    const USE_0_63_FOLDER = false; //0.63のフォルダ規則を使う[true], 使わないfalse
    const FORCESORTSCRIPT = AppConstants.platform != "win";
    const REPLACECACHE = true; //スクリプトの更新日付によりキャッシュを更新する: true , しない:[false]
    //=====================USE_0_63_FOLDER = falseの時===================
    const UCJS = ["UCJSFiles", "userContent", "userMenu"]; //UCJS Loader 仕様を適用 (NoScriptでfile:///を許可しておく)
    const arrSubdir = ["root", "xul", "SubScript", "UCJSFiles", "userContent", "userMenu", "UserChromeJS"];
    //===================================================================
    const ALWAYSEXECUTE = ['rebuild_userChrome.uc.xul', 'rebuild_userChrome.uc.js']; //常に実行するスクリプト
    const INFO = true;
    const BROWSERCHROME = "chrome://browser/content/browser.xhtml"; //Firefox
    //"chrome://browser/content/browser.xul"; //Firefox
    // -- config --
    /* USE_0_63_FOLDER true の時
     * chrome直下およびchrome/xxx.uc 内の *.uc.js および *.uc.xul
     * chrome/xxx.xul 内の  *.uc.js , *.uc.xul および *.xul
     * chrome/xxx.ucjs 内の *.uc.js は 特別に UCJS Loader 仕様を適用(NoScriptでfile:///を許可しておく)
     */

    /* USE_0.63_FOLDER false の時
     *[ フォルダは便宜上複数のフォルダに分けているだけで任意。 下のarrSubdirで指定する ]
     *[ UCJS Loaderを適用するフォルダをUCJSで指定する                                  ]
      プロファイル-+-chrome-+-userChrome.js(このファイル)
                            +-*.uc.jsまたは*.uc.xul群
                            |
                            +-SubScript--------+-*.uc.jsまたは*.uc.xul群
                            |
                            +-UCJSFiles--------+-*.uc.jsまたは*.uc.xul群
                            | (UCJS_loaderでしか動かないもの JavaScript Version 1.7/日本語)
                            |
                            +-xul--------------+-*.xul, *.uc.xulおよび付随File
                            |
                            +-userCrome.js.0.8-+-*.uc.jsまたは*.uc.xul群 (綴りが変なのはなぜかって? )
     */

    //chrome/aboutでないならスキップ
    if (!/chrome|about/.test(location.protocol)) return;
    if (/^about:(blank|newtab|home)/i.test(location.href)) return;
    if (location.href.startsWith('chrome://global/content/commonDialog.x')) return;
    if (location.href.startsWith('chrome://global/content/selectDialog.x')) return;
    if (location.href.startsWith('chrome://global/content/alerts/alert.x')) return;
    if (/\.html?$/i.test(location.pathname)) return;
    window.userChrome_js = {
        USE_0_63_FOLDER: USE_0_63_FOLDER,
        UCJS: UCJS,
        arrSubdir: arrSubdir,
        FORCESORTSCRIPT: FORCESORTSCRIPT,
        ALWAYSEXECUTE: ALWAYSEXECUTE,
        INFO: INFO,
        BROWSERCHROME: BROWSERCHROME,
        EXCLUDE_CHROMEHIDDEN: EXCLUDE_CHROMEHIDDEN,
        REPLACECACHE: REPLACECACHE,

        getScripts() {
            const fph = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            const ds = Services.dirsvc;
            const Start = Date.now();
            //getdir
            if (this.USE_0_63_FOLDER) {
                var o = [""];
                this.UCJS = [];
                this.arrSubdir = [];
                var workDir = ds.get("UChrm", Ci.nsIFile);
                var dir = workDir.directoryEntries;
                while (dir.hasMoreElements()) {
                    var file = dir.getNext().QueryInterface(Ci.nsIFile);
                    if (!file.isDirectory()) continue;
                    var dirName = file.leafName;
                    if (/(uc|xul|ucjs)$/i.test(dirName)) {
                        o.push(dirName);
                        if (/ucjs$/i.test(dirName)) {
                            this.UCJS.push(dirName);
                        }
                    }
                }
                if (this.FORCESORTSCRIPT) {
                    o.sort(cmp_name);
                }
                [].push.apply(this.arrSubdir, o);
            }

            var mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);
            if (mediator.getMostRecentWindow("navigator:browser"))
                var mainWindowURL = BROWSERCHROME;
            else if (mediator.getMostRecentWindow("mail:3pane"))
                var mainWindowURL = "chrome://messenger/content/messenger.xul";

            this.dirDisable = restoreState(getPref("userChrome.disable.directory", "str", "").split(','));
            this.scriptDisable = restoreState(getPref("userChrome.disable.script", "str", "").split(','));
            this.scripts = [];
            this.overlays = [];

            const findNextRe = /^\/\/ @(include|exclude)[ \t]+(\S+)/gm;
            this.directory = { name: [], UCJS: [], enable: [] };
            for (const dir of this.arrSubdir) {
                const s = [], o = [];
                try {
                    this.directory.name.push(dir);
                    this.directory.UCJS.push(checkUCJS(dir));

                    const workDir = ds.get("UChrm", Ci.nsIFile);
                    workDir.append(dir);
                    const files = workDir.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
                    while (files.hasMoreElements()) {
                        const file = files.getNext().QueryInterface(Ci.nsIFile);
                        if (/\.uc\.js$/i.test(file.leafName) // 此判断式结果有点不可预测
                            || /\.xul$/i.test(file.leafName) && /\xul$/i.test(dir)) {
                            const script = getScriptData(
                                this.AUTOREMOVEBOM ? deleteBOMreadFile(file) : readFile(file, true)
                                , file);
                            script.dir = dir;
                            if (/\.uc\.js$/i.test(script.filename)) {
                                script.ucjs = checkUCJS(script.file.path);
                                s.push(script);
                            } else {
                                script.xul = `<?xul-overlay href="${script.url}"?>\n`;
                                o.push(script);
                            }
                        }
                    }
                } catch (e) { }
                if (this.FORCESORTSCRIPT) {
                    s.sort(cmp_fname);
                    o.sort(cmp_fname);
                }
                [].push.apply(this.scripts, s);
                [].push.apply(this.overlays, o);
            }
            this.debug('Parsing getScripts: ' + (Date.now() - Start) + 'msec');

            //nameを比較する関数
            function cmp_name(a, b) {
                const [_a, _b] = [a.toLowerCase(), b.toLowerCase()];
                if (_a == _b) return a < b ? -1 : 1;
                return _a < _b ? -1 : 1;
            }
            function cmp_fname(a, b) {
                return cmp_name(a.filename, b.filename);
            }

            //UCJSローダ必要か
            function checkUCJS(aPath) {
                return UCJS.some(k => aPath.includes(k));
            }

            //メタデータ収集
            function getScriptData(aContent, aFile) {
                let match, description, fullDescription;
                const header = aContent.match(/^\/\/ ==UserScript==(.+?)\/\/ ==\/UserScript==/s)?.[1]?.trim() || "";
                const rex = { include: [], exclude: [] };
                while ((match = findNextRe.exec(header))) {
                    rex[match[1]].push(match[2]
                        .replace(/^main$/i, mainWindowURL)
                        .replace(/\W/g, "\\$&")
                        .replace(/\\\*/g, ".*?")
                    );
                }
                if (rex.include.length == 0) rex.include.push(mainWindowURL);
                var exclude = rex.exclude.length > 0 ? "(?!" + rex.exclude.join("$|") + "$)" : "";

                const charset = header.match(/\/\/ @charset\s+(\S+)/i)?.[1] || "";
                const async_ = /\/\/ @async\b/i.test(header);

                const isLongDescription = /^\/\/ @long-description/im.test(header);
                description = isLongDescription
                    ? header.match(/\/\/ @description\s+.*?\/\*\s*(.+?)\s*\*\//is)?.[1]
                    : header.match(/\/\/ @description\s+(.+)\s*$/im)?.[1];

                if (!description) {
                    description = aFile.leafName;
                } else {
                    fullDescription = description;
                    if (isLongDescription) description = getFirstLine(description);
                }

                function getFirstLine(text) {
                    const i = text.indexOf('\n');
                    return i == -1 ? text : text.slice(0, i).trim();
                }

                return {
                    filename: aFile.leafName,
                    file: aFile,
                    url: fph.getURLSpecFromActualFile(aFile),
                    //namespace: "",
                    charset: charset,
                    'async': async_,
                    description: description,
                    //code: aContent.replace(header, ""),
                    regex: new RegExp("^" + exclude + "(" + (rex.include.join("|") || ".*") + ")$", "i"),
                    onlyonce: /\/\/ @onlyonce\b/.test(header),
                    icon: header.match(/\/\/ @icon\s+(.+)\s*$/im)?.[1],
                    homepageURL: header.match(/\/\/ @homepage(URL)?\s+(.+)\s*$/im)?.[2],
                    downloadURL: header.match(/\/\/ @downloadURL\s+(.+)\s*$/im)?.[1],
                    optionsURL: header.match(/\/\/ @optionsURL\s+(.+)\s*$/im)?.[1],
                    startup: header.match(/\/\/ @startup\s+(.+)\s*$/im)?.[1],
                    license: header.match(/\/\/ @license\s+(.+)\s*$/im)?.[1],
                    fullDescription
                }
            }

            //スクリプトファイル読み込み
            function readFile(aFile, metaOnly = false) {
                var stream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
                stream.init(aFile, 0x01, 0, 0);
                var cvstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
                cvstream.init(stream, "UTF-8", 1024, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
                var content = "", data = {};
                while (cvstream.readString(4096, data)) {
                    content += data.value;
                    if (metaOnly && content.includes('// ==/UserScript=='))
                        break;
                }
                cvstream.close();
                return content.replace(/\r\n?/g, "\n");
            }

            //バイナリ読み込み
            function readBinary(aFile) {
                var istream = Cc["@mozilla.org/network/file-input-stream;1"]
                    .createInstance(Ci.nsIFileInputStream);
                istream.init(aFile, -1, -1, false);

                var bstream = Cc["@mozilla.org/binaryinputstream;1"]
                    .createInstance(Ci.nsIBinaryInputStream);
                bstream.setInputStream(istream);
                return bstream.readBytes(bstream.available());
            }

            //バイナリ書き込み
            function writeFile(aFile, aData) {
                var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                    .createInstance(Ci.nsIFileOutputStream);
                // ファイル追記の際は、0x02 | 0x10 を使う
                foStream.init(aFile, 0x02 | 0x08 | 0x20, parseInt(664, 8), 0); // write, create, truncate
                foStream.write(aData, aData.length);
                foStream.close();
                return aData;
            }

            //prefを読み込み
            function getPref(aPrefString, aPrefType, aDefault) {
                const xpPref = Cc['@mozilla.org/preferences-service;1']
                    .getService(Ci.nsIPrefService);
                try {
                    switch (aPrefType) {
                        case 'complex':
                            return xpPref.getComplexValue(aPrefString, Ci.nsILocalFile);
                        case 'str':
                            return unescape(xpPref.getCharPref(aPrefString).toString());
                        case 'int':
                            return xpPref.getIntPref(aPrefString);
                        case 'bool':
                        default:
                            return xpPref.getBoolPref(aPrefString);
                    }
                } catch (e) {
                }
                return aDefault;
            }

            //pref文字列変換
            function restoreState(a) {
                try {
                    const sd = [];
                    for (const k of a) sd[unescape(k)] = true;
                    return sd;
                }
                catch (e) { return [] }
            }
        },

        getLastModifiedTime(aScriptFile) {
            if (this.REPLACECACHE) {
                return aScriptFile.lastModifiedTime;
            }
            return "";
        },

        //window.userChrome_js.loadOverlay
        shutdown: false,
        overlayWait: 0,
        overlayUrl: [],
        loadOverlay(url, observer, doc) {
            window.userChrome_js.overlayUrl.push([url, observer, doc]);
            if (!window.userChrome_js.overlayWait) window.userChrome_js.load(++window.userChrome_js.overlayWait);
        },

        load() {
            if (!window.userChrome_js.overlayUrl.length) return --window.userChrome_js.overlayWait;
            var [url, aObserver, doc = document] = this.overlayUrl.shift();
            if (!!aObserver && typeof aObserver == 'function') {
                aObserver.observe = aObserver;
            }
            /*if (!(doc instanceof XULDocument))
              return 0;*/
            var observer = {
                observe(subject, topic, data) {
                    if (topic == 'xul-overlay-merged') {
                        //XXX We just caused localstore.rdf to be re-applied (bug 640158)
                        window?.retrieveToolbarIconsizesFromTheme();
                        if (!!aObserver && typeof aObserver.observe == 'function') {
                            try {
                                aObserver.observe(subject, topic, data);
                            } catch (ex) {
                                window.userChrome_js.error(url, ex);
                            }
                        }
                        window.userChrome_js?.load();
                    }
                },
                QueryInterface(iid) {
                    if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIObserver)) return this;
                    throw Cr.NS_ERROR_NO_INTERFACE;
                }
            };
            //if (this.INFO) this.debug("document.loadOverlay: " + url);
            try {
                if (window.userChrome_js.shutdown) return;
                doc.loadOverlay(url, observer);
            } catch (ex) {
                window.userChrome_js.error(url, ex);
            }
            return 0;
        },

        //xulを読み込む
        runOverlays(doc) {
            try {
                var dochref = doc.location.href.replace(/#.*$/, "");
            } catch (e) {
                return;
            }

            for (const overlay of this.overlays) {
                if (!this.ALWAYSEXECUTE.includes(overlay.filename)
                    && (!!this.dirDisable['*']
                        || !!this.dirDisable[overlay.dir]
                        || !!this.scriptDisable[overlay.filename])) continue;

                // decide whether to run the script
                if (overlay.regex.test(dochref)) {
                    if (this.INFO) this.debug("loadOverlay: " + overlay.filename);
                    this.loadOverlay(overlay.url + "?" + this.getLastModifiedTime(overlay.file), null, doc);
                }
            }
        },

        //uc.jsを読み込む
        runScripts(doc) {
            if (!HTMLDocument.isInstance(doc)) return;
            try {
                var dochref = doc.location.href.replace(/#.*$/, "");
            } catch (e) {
                return;
            }

            for (const script of this.scripts) {
                if (!this.ALWAYSEXECUTE.includes(script.filename)
                    && (!!this.dirDisable['*']
                        || !!this.dirDisable[script.dir]
                        || !!this.scriptDisable[script.filename])) continue;
                if (!script.regex.test(dochref)) continue;
                if (script.onlyonce && script.isRunning) {
                    if (script.startup) {
                        eval(script.startup);
                    }
                    continue;
                }

                if (script.ucjs) { //for UCJS_loader
                    if (this.INFO) this.debug("loadUCJSSubScript: " + script.filename);
                    const src = doc.createElementNS("http://www.w3.org/1999/xhtml", "script");
                    src.type = "text/javascript";
                    src.src = script.url + "?" + this.getLastModifiedTime(script.file);
                    try {
                        doc.documentElement.appendChild(src);
                    } catch (ex) {
                        this.error(script.filename, ex);
                    }
                } else { //Not for UCJS_loader
                    if (this.INFO) this.debug("loadSubScript: " + script.filename);
                    let target = doc.defaultView;
                    if (!script.async) {
                        try {
                            Services.scriptloader.loadSubScript(
                                script.url + "?" + this.getLastModifiedTime(script.file),
                                script.onlyonce ? { window: target } : target, script.charset);

                            script.isRunning = true;
                            if (script.startup) {
                                eval(script.startup);
                            }
                        } catch (ex) {
                            this.error(script.filename, ex);
                        }
                    } else {
                        ChromeUtils.compileScript(
                            script.url + "?" + this.getLastModifiedTime(script.file)
                        ).then((r) => {
                            r.executeInGlobal(/*global*/ target, { reportExceptions: true });
                        }).catch((ex) => {
                            this.error(script.filename, ex);
                        });
                    }
                }
            }
        },

        debug(aMsg) {
            Cc["@mozilla.org/consoleservice;1"]
                .getService(Ci.nsIConsoleService)
                .logStringMessage(aMsg);
        },

        error(aMsg, err) {
            const cs = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
            const error = Cc['@mozilla.org/scripterror;1'].createInstance(Ci.nsIScriptError);
            if (typeof err == 'object') error.init(aMsg + '\n' + err.name + ' : ' + err.message, err.fileName || null, null, err.lineNumber, null, 2, err.name);
            else error.init(aMsg + '\n' + err + '\n', null, null, null, null, 2, null);
            cs.logMessage(error);
        }
    };

    const f = Services.dirsvc.get('UChrm', Ci.nsIFile);
    f.append('locales');
    if (f.exists()) {
        f.append('en-US');
        if (f.exists()) {
            const locales = Services.locale.appLocalesAsBCP47;
            if (!locales.includes("en-US"))
                locales.push("en-US");
            const reg = new L10nRegistry();
            reg.registerSources([
                new L10nFileSource(
                    "userchrome",
                    "app",
                    locales,
                    "chrome://userchrome/content/locales/{locale}/"
                ),
            ]);

            Reflect.defineProperty(userChrome_js, "L10nRegistry", {
                value: reg,
                writable: false,
                enumerable: true,
                configurable: false
            });
        }
    }

    //少しでも速くするためスクリプトデータの再利用
    const prefObj = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
    try {
        var pref = prefObj.getBoolPref("userChrome.enable.reuse");
    } catch (e) {
        var pref = true;
    }


    const that = window.userChrome_js;
    window.addEventListener("unload", function() {
        that.shutdown = true;
    }, false);

    window.xxdebug = that.debug;
    //that.debug(typeof that.getScriptsDone);
    if (pref) {
        //現在のメインウィンドウは一度もuserChrome.jsのスクリプトで初期化されていない?
        if (!that.getScriptsDone) {
            //Firefox or Thunderbard?
            var mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
                .getService(Ci.nsIWindowMediator);
            if (mediator.getMostRecentWindow("navigator:browser"))
                var windowType = "navigator:browser";
            else if (mediator.getMostRecentWindow("mail:3pane"))
                var windowType = "mail:3pane";
            var enumerator = mediator.getEnumerator(windowType);
            //他の身内のメインウィンドウではどうかな?
            while (enumerator.hasMoreElements()) {
                var win = enumerator.getNext();
                //身内のメインウインドウは初期状態でない?
                if (win.userChrome_js?.getScriptsDone) {
                    //オブジェクトはたぶんこのウインドウのを複製すりゃいいんじゃぁないかな
                    that.UCJS = win.userChrome_js.UCJS;
                    that.arrSubdir = win.userChrome_js.arrSubdir;
                    that.scripts = win.userChrome_js.scripts;
                    that.overlays = win.userChrome_js.overlays;
                    that.dirDisable = win.userChrome_js.dirDisable;
                    that.scriptDisable = win.userChrome_js.scriptDisable;
                    that.getScriptsDone = true;
                    break;
                }
            }
        }
    }

    if (!that.getScriptsDone) {
        if (that.INFO) that.debug("getScripts");
        that.getScripts();
        that.getScriptsDone = true;
    } else {
        if (that.INFO) that.debug("skip getScripts");
    }

    var href = location.href;
    var doc = document;

    //Bug 330458 Cannot dynamically load an overlay using document.loadOverlay
    //until a previous overlay is completely loaded

    if (that.INFO) that.debug("load " + href);

    //chromehiddenならロードしない
    if (location.href === that.BROWSERCHROME &&
        that.EXCLUDE_CHROMEHIDDEN &&
        document.documentElement.getAttribute("chromehidden") != "")
        return;

    if (typeof gBrowser != undefined) {
        that.runScripts(doc);
        setTimeout(function (doc) { that.runOverlays(doc); }, 0, doc);
    } else {
        setTimeout(function (doc) {
            that.runScripts(doc);
            setTimeout(function (doc) { that.runOverlays(doc); }, 0, doc);
        }, 0, doc);
    }


    //Sidebar for Trunc
    if (location.href != that.BROWSERCHROME) return;
    window.document.addEventListener("load", function({originalTarget: doc}) {
        if (!doc.location) return;
        const href = doc.location.href;
        if (/^(about:(blank|newtab|home))/i.test(href)) return;
        if (!/^(about|chrome):/.test(href)) return;
        // skip for in-content dialog etc.
        if (href.endsWith('Dialog.xhtml')) return;
        if (href == 'chrome://global/content/alerts/alert.xhtml') return;

        if (that.INFO) that.debug("load Sidebar " + href);
        setTimeout(function(doc) {
            that.runScripts(doc);
            setTimeout(function (doc) { that.runOverlays(doc); }, 0, doc);
        }, 0, doc);
        if (href != "chrome://browser/content/web-panels.xul") return;
        if (!window.document.getElementById("sidebar")) return;
        var sidebarWindow = window.document.getElementById("sidebar").contentWindow;
        if (sidebarWindow) {
            loadInWebpanel.init(sidebarWindow);
        }
    }, true);

    var loadInWebpanel = {
        init(sidebarWindow) {
            this.sidebarWindow = sidebarWindow;
            this.sidebarWindow.document.getElementById("web-panels-browser").addEventListener("load", this, true);
            this.sidebarWindow.addEventListener("unload", this, false);
        },
        handleEvent(event) {
            this[event.type](event);
        },
        unload(event) {
            this.sidebarWindow.document.getElementById("web-panels-browser").removeEventListener("load", this, true);
            this.sidebarWindow.removeEventListener("unload", this, false);
        },
        load({originalTarget: doc}) {
            const href = doc.location.href;
            if (that.INFO) that.debug("load Webpanel " + href);
            setTimeout(function (doc) {
                that.runScripts(doc);
                setTimeout(function (doc) { that.runOverlays(doc); }, 0, doc);
            }, 0, doc);
        }
    }
})();
