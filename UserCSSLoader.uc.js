// ==UserScript==
// @name           UserCSSLoader
// @description    Stylish みたいなもの
// @namespace      https://github.com/benzBrake/FirefoxCustomize
// @author         Ryan, Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 80
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @downloadURL    https://github.com/benzBrake/FirefoxCustomize/raw/master/userChromeJS/UserCSSLoader/UserCSSLoader.uc.js
// @shutdown       window.UserCSSLoader.unload(true);
// @version        0.0.5r5
// @charset        UTF-8
// @note           0.0.5r5 Bug 1937080 Block inline event handlers in Nightly and collect telemetry
// @note           0.0.5r4 新增 Alt+R 重载所有样式
// @note           0.0.5r3 修正翻译问题
// @note           0.0.5r2 修复多个窗口的时候关闭一个窗口 CSS 就失效，以及有一个菜单没有翻译的问题
// @note           0.0.5r1 修复退出编辑器后不能自动更新
// @note           0.0.5   FileUtils 改为 IOUtils，不兼容Fireofox 80以下，把主菜单项目改成工具按钮了。
// ==/UserScript==

/****** 使い方 ******

默认从 profileDir\chrome\UserSyles 读取样式

.as.css/.ag.css结尾的是 AGENT_SHEET
.us.css 结尾的是 USER_SHEET
其他.css是 AUTHOR_SHEET (默认)
不忘忘记添加 @namespace 此脚本不会检查 css 内容

支持关闭编辑器后自动重载 CSS，建议使用非多标签的独立编辑器比如 notepad2.exe 作为默认编辑器

about:config
"view_source.editor.path" 指定编辑器路径
"userChromeJS.UserCSSLoader.FOLDER" CSS 文件夹路径，相对于 chrome 文件夹
"userChromeJS.UserCSSLoader.reloadOnEdit" 编辑的时候只要文件修改时间发生变化就重载 (true/false， 默认为 true)
"userChromeJS.UserCSSLoader.showInToolsMenu" 显示在工具菜单中，开发中，不可用 (true/false， 默认为 false)

 **** 説明終わり ****/
(function(css) {
  const CustomizableUI = globalThis.CustomizableUI || ChromeUtils.import("resource://modules/CustomizableUI.jsm").CustomizableUI;
  const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  const DIR_SEPARATOR = Services.appinfo.OS === "WINNT" ? "\\" : "/";
  const STYLES_NAME_MAP = {
    0: {
      name: "AGENT_SHEET",
      ext: ".ag.css",
    },
    1: {
      name: "USER_SHEET",
      ext: ".us.css",
    },
    2: {
      name: "AUTHOR_SHEET",
      ext: ".css",
    }
  }

  window.UserCSSLoader = {
    BTN_ID: 'UserCSSLoader-btn',
    AGENT_SHEET: sss.AGENT_SHEET,
    USER_SHEET: sss.USER_SHEET,
    AUTHOR_SHEET: sss.AUTHOR_SHEET,
    DEFAULT_FOLDER: "UserStyles",
    KEY_PREFIX: "userChromeJS.UserCSSLoader.",
    KEY_FOLDER: "FOLDER",
    KEY_ALL_DISABLED: "allDisabled",
    KEY_DISABLED_STYLES: "stylesDisabled",
    KEY_SHOW_IN_TOOLS_MENU: "showInToolsMenu",
    KEY_RELOAD_ON_EDIT: "reloadOnEdit",
    CSSEntries: [],
    customShowings: [],
    I18N: {
			format(key, ...args) {
				let i = 0;
				return this[key]?.replaceAll(/%[ds]/g, x => args[i++]) || key;
			},
			"ucl-style-type-not-exists": "Style type not exists",
			"ucl-create-style-prompt-title": "Creating %s style",
			"ucl-create-style-prompt-text": "What would you like to name your %s style?",
			"ucl-file-not-exists": "File %s not exists",
			"ucl-choose-style-editor": "Choose style editor",
			"ucl-cannot-edit-style-notice": "Cannot edit style %s",
			"user-css-loader": "User CSS Loader",
			"ucl-delete-style": "Delete style",
			"ucl-delete-style-prompt-message": "Are you sure to delete style %s?",
			"ucl-enabled": "Enabled",
			"ucl-disabled": "Disabled"
		},

    get allDisabled() {
      return this.prefs.getBoolPref(this.KEY_ALL_DISABLED, false);
    },

    set allDisabled(val) {
      this.prefs.setBoolPref(this.KEY_ALL_DISABLED, val);
    },

    get showInToolsMenu() {
      return this.prefs.getBoolPref(this.KEY_SHOW_IN_TOOLS_MENU, false);
    },

    get reloadOnEdit() {
      return this.prefs.getBoolPref(this.KEY_RELOAD_ON_EDIT, true);
    },

    get STYLE() {
      delete this.STYLE;
      return this.STYLE = {
        url: makeURI("data:text/css;charset=utf-8," + encodeURIComponent(css.replaceAll("{BTN_ID}", this.BTN_ID))),
        type: this.AUTHOR_SHEET
      }
    },

    get prefs() {
      delete this.prefs;
      return this.prefs = Services.prefs.getBranch(this.KEY_PREFIX);
    },

    get FOLDER() {
      delete this.FOLDER;
      var path = this.prefs.getStringPref(this.KEY_FOLDER, this.DEFAULT_FOLDER)
      var aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
      aFile.appendRelativePath(path);
      if (!aFile.exists()) {
        aFile.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
      }
      let resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
      if (!resourceHandler.hasSubstitution("usercssloader")) {
        resourceHandler.setSubstitution("usercssloader", Services.io.newFileURI(aFile));
      }
      return this.FOLDER = aFile;
    },

    async init() {
      if (typeof userChrome_js === "object" && "L10nRegistry" in userChrome_js) {
        this.l10n = new DOMLocalization(["UserCSSLoader.ftl"], false, userChrome_js.L10nRegistry);
        const keys = ["ucl-style-type-not-exists", "ucl-create-style-prompt-title", "ucl-create-style-prompt-text", "ucl-file-not-exists", "ucl-choose-style-editor", "ucl-cannot-edit-style-notice", "user-css-loader", "ucl-delete-style", "ucl-delete-style-prompt-message", "ucl-enabled", "ucl-disabled"];
        const messages = await this.l10n.formatValues(keys);
        Object.assign(this.I18N, messages);
      } else {
        this.l10n = {
          formatValue: async () => "",
          formatMessages: async () => "",
          translateRoots() { },
          connectRoot() { }
        }
      }

      if (!sss.sheetRegistered(this.STYLE.url, this.STYLE.type)) {
        sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
      }

      this.disabledStyles = new DisabledSet(
        JSON.parse(this.prefs.getStringPref(this.KEY_DISABLED_STYLES, "[]"))
        .sort((a, b) => a[0].localeCompare(b[0])));

      if (this.showInToolsMenu) {
        let ins = document.getElementById("devToolsSeparator");
        this.MENU = createElement(document, "menu", {
          label: "UserCSSLoader",
          class: "menu-iconic",
          'data-l10n-id': 'user-css-loader'
        });
        ins.before(this.MENU);
        let menupopup = createElement(document, "menupopup", {
          id: this.BTN_ID + "-popup",
          class: this.BTN_ID + "-popup"
        });
        this.menupopup = this.MENU.appendChild(menupopup);
        this.l10n.connectRoot(this.MENU);
      } else {
        if (!CustomizableUI.getWidget(this.BTN_ID)?.forWindow(window)?.node) {
          CustomizableUI.createWidget({
            id: this.BTN_ID,
            removable: true,
            defaultArea: CustomizableUI.AREA_NAVBAR,
            type: "custom",
            onBuild: doc => this.createButton(doc)
          });
        }

        let reloadKeyItem = window.MozXULElement.parseXULToFragment(
          `<key id="ucl-rebuild-key" key="R" modifiers="alt"/>`);
        reloadKeyItem.addEventListener('command', () => {
          this.rebuild();
        });
        document.getElementById("mainKeyset").appendChild(reloadKeyItem);

        this.BTN = CustomizableUI.getWidget(this.BTN_ID).forWindow(window).node;
        this.BTN.addEventListener("mouseover", this, false);
        this.BTN.addEventListener("click", this, false);
        this.menupopup = this.BTN.querySelector(`#${this.BTN_ID}-popup`);
        this.l10n.connectRoot(this.BTN);
      }

      this.menupopup.addEventListener("popupshowing", this, false);

      this.rebuild();

      Services.prefs.addObserver(this.KEY_PREFIX, this);
      window.addEventListener("unload", this);
    },
    createButton(doc) {
      let btn = createElement(doc, 'toolbarbutton', {
        id: this.BTN_ID,
        label: "User CSS Loader",
        'data-l10n-id': 'user-css-loader',
        type: 'menu',
        class: 'toolbarbutton-1 chromeclass-toolbar-additional'
      });

      let menupopup = createElement(doc, "menupopup", {
        id: this.BTN_ID + "-popup",
        class: this.BTN_ID + "-popup"
      });

      btn.appendChild(menupopup);
      return btn;
    },
    initMenu(popup) {
      let popup_ = popup || this.menupopup || document.getElementById(this.BTN_ID + "-popup"), that = this;
      if (!popup_) return;
      if (popup_.matches("[initalized=true]")) return;
      let doc = popup_.ownerDocument;
      const { I18N } = this;
      popup_.innerHTML = '';

      [{
        label: !this.prefs.getBoolPref("allDisabled", false) ? I18N.format('ucl-enabled') : I18N.format('ucl-disabled'),
        class: "menuitem menuitem-iconic",
        type: "checkbox",
        oncommand: "UserCSSLoader.allDisabled = !UserCSSLoader.allDisabled;",
        onshowing: function () {
          const { I18N } = UserCSSLoader;
          this.setAttribute("label", !UserCSSLoader.allDisabled ? I18N.format('ucl-enabled') : I18N.format('ucl-disabled'));
          this.setAttribute("checked", !UserCSSLoader.allDisabled);
        }
      }, {}, {
        label: "Reload all styles",
        'data-l10n-id': 'ucl-reload-all-styles',
        class: "menuitem menuitem-iconic",
        oncommand: "window.UserCSSLoader.rebuild();"
      }, {
        label: "Open Style Folder",
        'data-l10n-id': 'ucl-open-style-folder',
        class: "menuitem menuitem-iconic",
        oncommand: "window.UserCSSLoader.openFolder();"
      }, {
        label: "Create Style",
        'data-l10n-id': 'ucl-create-style',
        class: "menu menu-iconic",
        popup: [{
          label: "AUTHOR_SHEET",
          'data-l10n-id': 'ucl-author-sheet',
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.AUTHOR_SHEET)"
        }, {
          label: "USER_SHEET",
          'data-l10n-id': 'ucl-user-sheet',
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.USER_SHEET)"
        }, {
          label: "AGENT_SHEET",
          'data-l10n-id': 'ucl-agent-sheet',
          class: "menuitem menuitem-iconic",
          oncommand: "window.UserCSSLoader.createStyle(window.UserCSSLoader.AGENT_SHEET)"
        }]
      }, {

      }, {
        content: "Middle click to keep menu open",
        'data-l10n-id': "ucl-middle-click-to-keep-menu-open",
        type: "html:h2",
        class: "subview-subheader",
        style: "text-align: center"
      }].forEach(menuObj => {
        popup_.appendChild(createMenu(doc, menuObj));
      });
      if (!doc.getElementById("ucl-change-style-popup")) {
        let changeTypePopup = createElement(doc, "menupopup", {
          id: "ucl-change-style-popup"
        });
        [{
          type: "html:h2",
          'data-l10n-id': "ucl-change-style-popup-header",
          class: "subview-subheader",
          content: "Change style type",
          style: "text-align: center;"
        }, {
          label: "AUTHOR_SHEET",
          'data-l10n-id': 'ucl-author-sheet',
          flag: "AUTHOR_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "UserCSSLoader.changeStyleType(event, UserCSSLoader.AUTHOR_SHEET)"
        }, {
          label: "USER_SHEET",
          'data-l10n-id': 'ucl-user-sheet',
          flag: "USER_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: "UserCSSLoader.changeStyleType(event, UserCSSLoader.USER_SHEET)"
        }, {
          label: "AGENT_SHEET",
          'data-l10n-id': 'ucl-agent-sheet',
          flag: "AGENT_SHEET",
          class: "menuitem menuitem-iconic",
          oncommand: 'UserCSSLoader.changeStyleType(event, UserCSSLoader.AGENT_SHEET)'
        }].forEach(menuObj => {
          changeTypePopup.appendChild(createMenu(doc, menuObj));
        });
        this.l10n.connectRoot(doc.getElementById("mainPopupSet").appendChild(changeTypePopup));
      }

      popup_.setAttribute("initalized", true);

      function createMenu(doc, menuObj) {
        if ((!menuObj.label && !menuObj['data-l10n-id']) && !menuObj.type || menuObj.type?.endsWith("separator")) {
          return createElement(doc, "menuseparator");
        }
        let isMenu = menuObj.popup && Array.isArray(menuObj.popup) && menuObj.popup.length;
        let menu = createElement(doc, menuObj.type?.startsWith("html") ? menuObj.type : isMenu ? "menu" : "menuitem", menuObj, ["showing", "popup"]);
        if (menuObj.onshowing) {
          that.customShowings.push({
            item: menu,
            fnSource: menuObj.onshowing.toString()
          });
        }
        if (isMenu) {
          let menupopup = createElement(doc, "menupopup");
          menuObj.popup.forEach(obj => {
            menupopup.appendChild(createElement(doc, "menuitem", obj));
          });
          menu.appendChild(menupopup);
        }
        return menu;
      }
    },
    refreshCSSEntries(popup) {
      if (!popup) return;
      if (popup.getAttribute("css-initalized") === "true") return;

      popup.querySelectorAll(".ucl-dynamic").forEach(item => {
        item?.parentNode?.removeChild(item);
      });
      const doc = popup.ownerDocument;
      this.CSSEntries.forEach(entry => {
        let group = createElement(doc, "menugroup", {
          class: 'ucl-dynamic showFirstText',
        });
        let item = createElement(doc, 'menuitem', {
          label: entry.name,
          type: "checkbox",
          class: "menuitem menuitem-iconic",
          checked: !entry.disabled,
          fullName: entry.fullName,
          css: true,
          closemenu: 'none',
          oncommand: `window.UserCSSLoader.toggleStyle(event, "${entry.fullName}");`
        });
        if (typeof entry.icon == "string" && /^(data|chrome|resource):/.test(entry)) {
          item.style.setProperty('--icon', `url(${entry.icon})`);
        }
        group.appendChild(item);
        if (entry.homepageURL) {
          let homePage = createElement(doc, 'menuitem', {
            label: "Open homepage",
            tooltiptext: "Open homepage",
            class: "menuitem menuitem-iconic homepage",
            'data-l10n-id': 'ucl-open-homepage-btn',
            fullName: entry.fullName,
            closemenu: 'none',
            oncommand: `window.UserCSSLoader.openHomePage(event, "${entry.homepageURL}");`
          });
          group.appendChild(homePage);
        }
        let type = createElement(doc, 'menuitem', {
          label: "Change style type",
          tooltiptext: "Change style type",
          class: "menuitem menuitem-iconic style-flag",
          'data-l10n-id': 'ucl-change-style-btn',
          flag: STYLES_NAME_MAP[entry.type]['name'],
          fullName: entry.fullName,
          closemenu: 'none',
          oncommand(event) {
            UserCSSLoader.changeStyleType(event, entry.fullName);
          }
        });
        let edit = createElement(popup.ownerDocument, 'menuitem', {
          label: "Edit style",
          tooltiptext: "Edit style",
          'data-l10n-id': 'ucl-edit-style-btn',
          class: "menuitem menuitem-iconic edit",
          oncommand(event) {
            UserCSSLoader.editStyle(entry.fullName);
          }
        });
        let del = createElement(popup.ownerDocument, 'menuitem', {
          label: "Delete style",
          tooltiptext: "Delete style",
          'data-l10n-id': 'ucl-delete-style-btn',
          class: "menuitem menuitem-iconic delete",
          oncommand(event) {
            UserCSSLoader.deleteStyle(entry.fullName);
          }
        });
        group.append(type, edit, del);
        popup.appendChild(group);
      });
      popup.setAttribute("css-initalized", true);
    },
    refreshMenuItemStatus(popup) {
      if (!popup) return;
      this.customShowings.forEach(function(obj) {
        var curItem = obj.item;
        try {
          eval('(' + obj.fnSource + ').call(curItem, curItem)');
        } catch (ex) {
          console.error('custom showing method error', obj.fnSource, ex);
        }
      });
      popup.querySelectorAll('[type="checkbox"][css]').forEach(item => {
        let entry = this.CSSEntries.find(entry => entry.fullName === item.getAttribute("fullName"));
        if (!entry) return;
        item.setAttribute("checked", !entry.disabled);
      });
    },
    uninit(force = false) {
      let windows = Services.wm.getEnumerator(null), i = 0;
      while (windows.hasMoreElements()) {
        let win = windows.getNext();
        if (win.UserCSSLoader) i++;
      }
      if (i < 1 || force) {
        this.CSSEntries.forEach(entry => {
          entry.unregister();
        });
      }
      window.removeEventListener("unload", this);
    },
    destroy(force = false) {
      doc.getElementById("ucl-change-style-popup")?.remove();
      doc.getElementById("ucl-rebuild-key")?.remove();

      if (this.BTN)
        CustomizableUI.removeWidget(this.BTN_ID); // destroyWidget
      else
        this.MENU?.remove();
      this.uninit(force);
      delete this;
    },
    handleEvent(event) {
      switch (event.type) {
        case "mouseover":
          if (event.target.id !== this.BTN_ID) return;
          let win = event.target.ownerGlobal;
          event.target.querySelector(":scope>menupopup")?.setAttribute("position",
            event.clientY > (win.innerHeight / 2) ? "before_start" : "after_end");
          break;
        case "click":
          if (event.target.id !== this.BTN_ID) return;
          if (event.button === 1) {
            this.allDisabled = !this.allDisabled;
          }
          break;
        case "popupshowing":
          if (event.target.id !== this.BTN_ID + "-popup") return;
          this.initMenu(event.target);
          this.refreshCSSEntries(event.target);
          this.refreshMenuItemStatus(event.target);
          this.l10n.translateRoots();
          break;
        case "unload":
          this.uninit();
          break;
      }
    },
    observe(aSubject, aTopic, aData) {
      switch (aTopic) {
        case "nsPref:changed":
          switch (aData) {
            case this.KEY_PREFIX + this.KEY_ALL_DISABLED:
              this.BTN.classList.toggle("icon-disabled");
              this.rebuild();
          }
          break;
      }
    },
    async rebuild() {
      if (this.initalizing) return;
      this.initalizing = true;
      this.CSSEntries.forEach(css => css.unregister());
      this.CSSEntries = [];
      let files = this.FOLDER.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
      while (files.hasMoreElements()) {
        let file = files.getNext().QueryInterface(Ci.nsIFile);
        if (file.leafName.endsWith('.css')) {
          let entry = new CSSEntry(file);
          if (!this.allDisabled) entry.register();
          this.CSSEntries.push(entry);
        }
      }
      this.initalizing = false;
      this.menupopup?.setAttribute("css-initalized", false);
    },
    openFolder() {
      this.FOLDER.launch();
    },
    async createStyle(type) {
      const { I18N } = this;
      if (STYLES_NAME_MAP[type] === undefined) {
        console.error(I18N.format('ucl-style-type-not-exists', type));
        return;
      }
      let result = { value: Date.now() },
      aTitle = I18N.format('ucl-create-style-prompt-title', STYLES_NAME_MAP[type].name),
      aDetail = I18N.format('ucl-create-style-prompt-text', STYLES_NAME_MAP[type].name);
      if (Services.prompt.prompt(
        window, aTitle, aDetail, result, null, {}
      )) {
        const name = result.value + STYLES_NAME_MAP[type]['ext'];
        if (!this.FOLDER.exists()) {
          this.FOLDER.create(Ci.nsIFile.DIRECTORY_TYPE, 0o755);
        }
        try {
          const file = await this.newStyleFile(name);
          const entry = new CSSEntry(file);
          this.CSSEntries.push(entry);
          entry.register();
          this.menupopup?.setAttribute("css-initalized", false);
          await this.editStyle(entry.fullName);
        } catch (err) {
          console.error(err);
        }
      }
    },
    async newStyleFile(fileName) {
      const path = this.FOLDER.path + DIR_SEPARATOR + fileName;
      if (await IOUtils.exists(path)) {
        throw UserCSSLoader.I18N.format('ucl-file-not-exists', path);
      }

      await IOUtils.writeUTF8(path, "");
      return await IOUtils.getFile(path);
    },
    toggleStyle(event, fullName) {
      let entry = this.CSSEntries.find(e => e.fullName === fullName);
      if (entry) {
        entry.toggleStyle();
        if (event.button !== 1) {
          closeMenus(event.target);
        }
      }
    },
    editStyle(fullName) {
      let entry = this.CSSEntries.find(e => e.fullName === fullName);
      if (entry) {
        if (this.reloadOnEdit) {
          entry.startObserver();
        }
        this._editCSSEntry(entry).then(_ => {
          entry.stopObserver();
          this.rebuild();
        });
      }
    },
    async _editCSSEntry(entry) {
      let editor;
      try {
        editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
      } catch (e) { }
      if (!editor?.exists()) {
        editor = await new Promise(async resolve => {
          const { I18N } = UserCSSLoader;
          let fpTitle = I18N.format('ucl-choose-style-editor');
          let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
          // Bug 1878401 Always pass BrowsingContext to nsIFilePicker::Init
          fp.init(!("inIsolatedMozBrowser" in window.browsingContext.originAttributes)
            ? window.browsingContext : window,
            fpTitle, Ci.nsIFilePicker.modeOpen);
          fp.appendFilters(Ci.nsIFilePicker.filterApps);
          fp.appendFilters(Ci.nsIFilePicker.filterAll);
          fp.open(async (result) => {
            if (result == Ci.nsIFilePicker.returnOK) {
              Services.prefs.setComplexValue("view_source.editor.path", Ci.nsIFile, fp.file);
              resolve(fp.file);
            } else {
              resolve(null);
            }
          })
        });
      }
      if (editor) {
        let args = [entry.path];
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        try {
          process.init(editor);
          return await new Promise(async (resolve, reject) => {
            await process.runwAsync(
              args,
              args.length,
              this._processObserver(resolve, reject)
            );
          });
        } catch (e) {
          console.error(e);
          this.alert(
            this.I18N.format('ucl-cannot-edit-style-notice'),
            this.I18N.format('user-css-loader'),
            function() {
              this.openFolder();
          });
        }
      }
    },
    openHomePage(e, url) {
      openTrustedLinkIn(url, "tab");
    },
    // 监视：等待进程结束
    _processObserver(resolve, reject) {
      return {
        observe(subject, topic) {
          switch (topic) {
            case "process-finished":
              try {
                // Wait 1s after process to resolve
                setTimeout(resolve, 1000);
              } catch (ex) {
                reject(ex);
              }
              break;
            default:
              reject(topic);
              break;
          }
        }
      };
    },
    changeTypePopup({target}) {
      let popup = document.getElementById("ucl-change-style-popup");
      if (popup) {
        popup.querySelectorAll('[disabled="true"]').forEach(el => el.removeAttribute("disabled"));
        if (popup.state !== "closed") {
          popup.hidePopup();
        }
        let flag = target.getAttribute("flag");
        popup.querySelector(`[flag="${flag}"]`)?.setAttribute("disabled", true);
        popup.openPopup(target, "after_end", 0, 0, false, false)
      }
    },
    async changeStyleType(event, type) {
      if (STYLES_NAME_MAP[type] === undefined) {
        console.error(this.I18N.format('ucl-style-type-not-exists', type));
        return;
      }
      let { anchorNode } = event.target.closest("menupopup");
      let entry = this.CSSEntries.find(e => e.fullName === anchorNode.getAttribute("fullName"));
      if (!entry) return;
			let { file } = entry;
			try {
				entry.unregister();
				let newFilename = entry.name + STYLES_NAME_MAP[type]['ext'];
				let newPath = file.parent.path + DIR_SEPARATOR + newFilename;
				const i = this.CSSEntries.findIndex(e => e.fullName == entry.fullName);

				await IOUtils.move(file.path, newPath);
				entry = new CSSEntry(await IOUtils.getFile(newPath));
				this.CSSEntries[i] = entry;
				entry.register();
				this.menupopup?.setAttribute("css-initalized", false);
			} catch (e) {
				console.error(e);
			}
    },
    async deleteStyle(fullName) {
      const { I18N } = this;
      let aTitle = I18N.format('ucl-delete-style'),
      aMsg = I18N.format('ucl-delete-style-prompt-message', fullName);
      if (Services.prompt.confirm(window, aTitle, aMsg, false)) {
        let entry = this.CSSEntries.find(e => e.fullName === fullName);
        if (entry) {
          entry.unregister();
          entry.file.remove(false);
          this.disabledStyles.delete(fullName);
          this.rebuild();
        }
      }
    },
    alert(aMsg, aTitle, aCallback) {
      var callback = aCallback ? {
        observe(subject, topic, data) {
          if ("alertclickcallback" == topic) aCallback.call(null);
        }
      } : null;
      var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
      alertsService.showAlertNotification(
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=", aTitle || this.I18N.format('user-css-loader'),
        aMsg + "", !!callback, "", callback);
    },
  };

  class DisabledSet extends Set {
    constructor(iterable) {
      super(iterable);
    }

    add(item) {
      let cache_add = Set.prototype.add.call(this, item);
      UserCSSLoader.prefs.setStringPref(UserCSSLoader.KEY_DISABLED_STYLES, JSON.stringify([...this]));
      return cache_add;
    }

    delete(item) {
      let cache_delete = Set.prototype.delete.call(this, item);
      UserCSSLoader.prefs.setStringPref(UserCSSLoader.KEY_DISABLED_STYLES, JSON.stringify([...this]));
      return cache_delete;
    }
  }

  function CSSEntry(aFile) {
    this.type = /\.us(er)?\.css$/.test(aFile.leafName) ? sss.USER_SHEET :
      /\.a[gs]\.css$/.test(aFile.leafName) ? sss.AGENT_SHEET : sss.AUTHOR_SHEET;

    this.file = aFile;
    this.fullName = aFile.leafName;
    this.name = aFile.leafName.replace(/(?:\.(?:us(er)?|a[gs]))?\.css$/, '');
    this.path = aFile.path;
    this.url = Services.io.newURI("resource://usercssloader/" + this.fullName, null, null);
    this.lastModifiedTime = aFile.lastModifiedTime;
    this.readStyleInfo();
  }

  CSSEntry.prototype = {
    isRunning: false,
    get disabled() {
      return UserCSSLoader.disabledStyles.has(this.fullName);
    },
    set disabled(bool) {
      if (bool) {
        UserCSSLoader.disabledStyles.add(this.fullName);
        this.unregister();
      } else {
        UserCSSLoader.disabledStyles.delete(this.fullName);
        this.register();
      }
    },
    readStyleInfo() {
      if (!this.file.exists()) return;
      let header = readFile(this.path).match(/^\/\*\s*==UserStyle==\s+(.+?)==\/UserStyle==/s)?.[1];
      if (header) {
        this.name = header.match(/(\/\/|\*) @name\s+(.+)\s*$/im)?.[2];
        this.icon = header.match(/(\/\/|\*) @icon\s+(.+)\s*$/im)?.[2];
        this.description = header.match(/(\/\/|\*) @description\s+(.+)\s*$/im)?.[2];
        this.downloadURL = header.match(/(\/\/|\*) @downloadURL\s+(.+)\s*$/im)?.[2];
        this.homepageURL = header.match(/(\/\/|\*) @homepage(URL)?\s+(.+)\s*$/im)?.[3];
        this.license = header.match(/(\/\/|\*) @license\s+(.+)\s*$/im)?.[2];
      }
    },
    toggleStyle() {
      this.disabled = !this.disabled;
    },
    reloadStyle() {
      this.unregister();
      this.register();
    },
    startObserver() {
      this.timer = setInterval(() => {
        if (this.lastModifiedTime !== this.file.lastModifiedTime) {
          this.lastModifiedTime = this.file.lastModifiedTime;
          this.reloadStyle();
        }
      }, 500);
    },
    stopObserver() {
      clearInterval(this.timer);
    },
    register() {
      if (!this.disabled) {
        IOUtils.stat(this.path).then((value) => {
          if (sss.sheetRegistered(this.url, this.type)) {
            if (this.lastModifiedTime != value.lastModified) {
              sss.unregisterSheet(this.url, this.SHEET);
              sss.loadAndRegisterSheet(this.url, this.type);
              this.isRunning = true;
            }
          } else {
            sss.loadAndRegisterSheet(this.url, this.type);
            this.isRunning = true;
          }
        });
      }
    },
    unregister() {
      if (sss.sheetRegistered(this.url, this.type)) {
        sss.unregisterSheet(this.url, this.type);
      }
      this.isRunning = false;
    }
  };

  /**
   * 创建 DOM 元素
   *
   * @param {Document} d HTML 文档
   * @param {string} t DOM 元素标签
   * @param {Object} o DOM 元素属性键值对
   * @param {Array} s 跳过属性
   * @returns
   */
  function createElement(d, t, o = {}, s = []) {
    if (!d) return;
    let e = /^html:/.test(t) ? d.createElement(t) : d.createXULElement(t);
    return applyAttr(e, o, s);
  }

  /**
   * 给 DOM 元素应用属性
   *
   * @param {HTMLElement} e DOM 元素
   * @param {Object|null} o 属性键值对，使用 Object 方式存储
   * @param {Object|null} s 跳过属性
   * @returns
   */
  function applyAttr(e, o = {}, s = []) {
    for (let [k, v] of Object.entries(o)) {
      if (s.includes(k)) continue;
      if (k == "content") {
        e.innerHTML = v;
        continue;
      }
      if (k.startsWith('on') && typeof v == 'function') {
        e.addEventListener(k.slice(2).toLocaleLowerCase(), v);
      } else {
        e.setAttribute(k, v);
      }
    }
    return e;
  }

  /**
   * 同步读取文件内容
   *
   * @param {string} path
   * @returns
   */
  function readFile(path) {
    let isCompleted = false, content = '';
    IOUtils.readUTF8(path).then(data => {
      isCompleted = true;
      content = data;
    }).finally(() => {
      isCompleted = true;
    })
    var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
    while (!isCompleted) {
      thread.processNextEvent(true);
    }

    return content;
  }

  UserCSSLoader.init();
})(`
#{BTN_ID} > .toolbarbutton-icon {
  list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDE2IDE2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPgogICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMjg3LDAsMCwxLjMyODcsLTIuNjI5NTksLTIuNDYzNSkiPgogICAgICAgIDxwYXRoIGQ9Ik03LjkxNSwyLjI1QzkuNTEzLDIuMjUgMTEuOTQ1LDIuOTIgMTEuOTQ1LDQuNDcyQzExLjk0NSw1LjE1NSAxMS4zODksNS43NSAxMC43MDYsNS43NUM5LjUwNiw1Ljc1IDkuNDk3LDQuMjUgNy44NDMsNC4yNUM2LjkxOCw0LjI1IDYuNDk4LDQuNzg1IDYuNDk4LDUuMjgzQzYuNDk4LDUuODEgNi42NDcsNi4xOTUgNy43Myw2LjQyMkw5LjQ2Nyw2Ljc5M0MxMS42NDYsNy4yNjMgMTIuNSw4LjM3NCAxMi41LDkuOTgzQzEyLjUsMTEuODA2IDExLjM2MSwxMy41IDguMDE0LDEzLjVDNS44NzIsMTMuNSAzLjUsMTIuODkgMy41LDExLjIzNkMzLjUsMTAuNTI0IDQuMDg0LDEwLjA1NCA0Ljc5NiwxMC4wNTRDNi4wMDQsMTAuMDU0IDYuMTkxLDExLjI1IDcuOSwxMS4yNUM5LjA0LDExLjI1IDkuNzUsMTAuODUxIDkuNzUsMTAuMTY4QzkuNzUsOS42NjkgOS4zODEsOS4zMjggOC4zNTYsOS4xMTRMNi42MDUsOC43NDRDNC42MTEsOC4zMTcgMy43NSw3LjMxOSAzLjc1LDUuNTU0QzMuNzUsMy42ODggNS4xOCwyLjI1IDcuOTE1LDIuMjVaIiBzdHlsZT0iZmlsbDp1cmwoI19MaW5lYXIxKTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgIDwvZz4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iX0xpbmVhcjEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCg2LjQ5NDYxZS0xNiwtMTAuNjA2NSwxMC42MDY1LDYuNDk0NjFlLTE2LDgsMTMpIj48c3RvcCBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOnJnYigyMSw5MiwyMjIpO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIwLjI4IiBzdHlsZT0ic3RvcC1jb2xvcjpyZ2IoMzEsMTI3LDIyOSk7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjAuNTciIHN0eWxlPSJzdG9wLWNvbG9yOnJnYigzOSwxNTYsMjM1KTtzdG9wLW9wYWNpdHk6MSIvPjxzdG9wIG9mZnNldD0iMC44MiIgc3R5bGU9InN0b3AtY29sb3I6cmdiKDQ0LDE3NSwyMzkpO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjpyZ2IoNDYsMTgxLDI0MCk7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PgogICAgPC9kZWZzPgo8L3N2Zz4K)
}
#{BTN_ID}.icon-disabled .toolbarbutton-icon {
  filter: grayscale(1);
}
#{BTN_ID}-popup menugroup.ucl-dynamic > .menuitem-iconic {
    -moz-box-flex: 1;
    -moz-box-pack: center;
    -moz-box-align: center;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    padding-block: 6px;
    padding-inline: 1em;
}
#{BTN_ID}-popup menugroup.ucl-dynamic > .menuitem-iconic > .menu-iconic-left {
  -moz-appearance: none;
  padding-top: 0;
}
#{BTN_ID}-popup menugroup.ucl-dynamic > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
  display: -moz-box;
  display: flex;
  width: 16px;
  height: 16px;
}
#{BTN_ID}-popup .showFirstText > menuitem:first-child {
  -moz-box-flex: 1;
  -moz-box-pack: center;
  -moz-box-align: center;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
}
#{BTN_ID}-popup .showFirstText > .menuitem-iconic:not(:first-child) {
  -moz-box-flex: 0;
  flex-grow: 0;
  flex-shrink: 0;
  padding-inline-end: 0;
}
#{BTN_ID}-popup .showFirstText > .menuitem-iconic:not(:first-child) .menu-iconic-left {
  margin-right: .25em;
}
#{BTN_ID}-popup .showFirstText > menuitem:not(:first-child) > :is(.menu-iconic-text,.menu-iconic-highlightable-text,.menu-accel-container) {
  display: none;
}
#{BTN_ID}-popup .showFirstText > menuitem:not(:first-child) {
  padding-inline-start: .25em;
}
#{BTN_ID}-popup menugroup.ucl-dynamic > menuitem[css][checked="true"] {
  color:blue;
}
#{BTN_ID}-popup menugroup.ucl-dynamic > menuitem[css][checked="true"] > .menu-iconic-text:after {
  content: '√';
  margin-inline-start: .4px;
  display: flex;
}
#{BTN_ID}-popup menugroup.ucl-dynamic > menuitem[css] > .menu-iconic-left {
  list-style-image: var(--icon, url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiIHRyYW5zZm9ybT0ic2NhbGUoMS4zKSI+PHBhdGggZD0iTTQuNSAyQzMuNjc3NDY4NiAyIDMgMi42Nzc0Njg2IDMgMy41TDMgOEw0IDhMNCAzLjVDNCAzLjIxODUzMTQgNC4yMTg1MzE0IDMgNC41IDNMOSAzTDkgNkwxMiA2TDEyIDhMMTMgOEwxMyA1LjI5Mjk2ODhMOS43MDcwMzEyIDJMNC41IDIgeiBNIDEwIDMuNzA3MDMxMkwxMS4yOTI5NjkgNUwxMCA1TDEwIDMuNzA3MDMxMiB6IE0gNC41IDlDMy42Nzc0Njg2IDkgMyA5LjY3NzQ2ODYgMyAxMC41TDMgMTEuNUwzIDEyLjVDMyAxMy4zMjI1MzEgMy42Nzc0Njg2IDE0IDQuNSAxNEM1LjMyMjUzMTQgMTQgNiAxMy4zMjI1MzEgNiAxMi41TDUgMTIuNUM1IDEyLjc4MTQ2OSA0Ljc4MTQ2ODYgMTMgNC41IDEzQzQuMjE4NTMxNCAxMyA0IDEyLjc4MTQ2OSA0IDEyLjVMNCAxMS41TDQgMTAuNUM0IDEwLjIxODUzMSA0LjIxODUzMTQgMTAgNC41IDEwQzQuNzgxNDY4NiAxMCA1IDEwLjIxODUzMSA1IDEwLjVMNiAxMC41QzYgOS42Nzc0Njg2IDUuMzIyNTMxNCA5IDQuNSA5IHogTSA4LjUgOUM3LjkxIDkgNy41NjQ5MDYyIDkuMjM4NDUzMSA3LjM3ODkwNjIgOS40Mzk0NTMxQzYuOTY3OTA2MyA5Ljg4MjQ1MzEgNi45OTg5NTMxIDEwLjQ3MiA3LjAwMTk1MzEgMTAuNUM3LjAwMTk1MzEgMTEuMzA4IDcuNzM2NDM3NSAxMS42NzI0NTMgOC4yNzM0Mzc1IDExLjkzOTQ1M0M4LjY5OTQzNzUgMTIuMTUwNDUzIDkgMTIuMzEzODEyIDkgMTIuNTA3ODEyQzkgMTIuNTA5ODEzIDguOTkwMzc1IDEyLjc1MTc2NiA4Ljg1OTM3NSAxMi44ODQ3NjZDOC44MzAzNzUgMTIuOTEzNzY2IDguNzQ3IDEzIDguNSAxM0w3LjA5MTc5NjkgMTNDNy4xNTE3OTY5IDEzLjE5MSA3LjI0NzY4NzUgMTMuNDAyODkxIDcuNDI5Njg3NSAxMy41ODc4OTFDNy42MTQ2ODc1IDEzLjc3NTg5MSA3Ljk1MSAxNCA4LjUgMTRDOS4wNDkgMTQgOS4zODYyNjU2IDEzLjc3NDkzNyA5LjU3MjI2NTYgMTMuNTg1OTM4QzkuOTk4MjY1NiAxMy4xNTI5MzggOS45OTkwNDY5IDEyLjU1OCA5Ljk5ODA0NjkgMTIuNUM5Ljk5ODA0NjkgMTEuNjggOS4yNTc3OTY5IDExLjMxMTk2OSA4LjcxNjc5NjkgMTEuMDQyOTY5QzguMjk3Nzk2OSAxMC44MzQ5NjkgOC4wMDI5NTMxIDEwLjY3Mzc1IDguMDAxOTUzMSAxMC40Njg3NUM4LjAwMTk1MzEgMTAuNDY2NzUgNy45OTMyODEyIDEwLjI0MjE4NyA4LjExMzI4MTIgMTAuMTE3MTg4QzguMTg3MjgxMiAxMC4wNDAxODggOC4zMTggMTAgOC41IDEwTDkuOTE0MDYyNSAxMEM5Ljc0NjA2MjUgOS40OTcgOS4zMTYgOSA4LjUgOSB6IE0gMTIuNSA5QzExLjkxIDkgMTEuNTYyOTUzIDkuMjM4NDUzMSAxMS4zNzY5NTMgOS40Mzk0NTMxQzEwLjk2NTk1MyA5Ljg4MjQ1MzEgMTAuOTk4OTUzIDEwLjQ3MiAxMS4wMDE5NTMgMTAuNUMxMS4wMDE5NTMgMTEuMzA4IDExLjczNDQ4NCAxMS42NzI0NTMgMTIuMjcxNDg0IDExLjkzOTQ1M0MxMi42OTc0ODQgMTIuMTUwNDUzIDEyLjk5ODA0NyAxMi4zMTM4MTIgMTIuOTk4MDQ3IDEyLjUwNzgxMkMxMi45OTgwNDcgMTIuNTA5ODEzIDEyLjk5MDM3NSAxMi43NTE3NjYgMTIuODU5Mzc1IDEyLjg4NDc2NkMxMi44MzEzNzUgMTIuOTEzNzY2IDEyLjc0NyAxMyAxMi41IDEzTDExLjA5MTc5NyAxM0MxMS4xNTE3OTcgMTMuMTkxIDExLjI0NzY4NyAxMy40MDI4OTEgMTEuNDI5Njg4IDEzLjU4Nzg5MUMxMS42MTQ2ODggMTMuNzc1ODkxIDExLjk1MSAxNCAxMi41IDE0QzEzLjA0OSAxNCAxMy4zODYyNjYgMTMuNzc0OTM3IDEzLjU3MjI2NiAxMy41ODU5MzhDMTMuOTk4MjY2IDEzLjE1MjkzOCAxMy45OTkwNDcgMTIuNTU4IDEzLjk5ODA0NyAxMi41QzEzLjk5ODA0NyAxMS42OCAxMy4yNTc3OTcgMTEuMzExOTY5IDEyLjcxNjc5NyAxMS4wNDI5NjlDMTIuMjk3Nzk3IDEwLjgzNDk2OSAxMi4wMDI5NTMgMTAuNjczNzUgMTIuMDAxOTUzIDEwLjQ2ODc1QzEyLjAwMTk1MyAxMC40NjY3NSAxMS45OTMyODEgMTAuMjQyMTg3IDEyLjExMzI4MSAxMC4xMTcxODhDMTIuMTg3MjgxIDEwLjA0MDE4OCAxMi4zMTggMTAgMTIuNSAxMEwxMy45MTQwNjIgMTBDMTMuNzQ2MDYzIDkuNDk4IDEzLjMxNiA5IDEyLjUgOSB6Ii8+PC9zdmc+));
}
#{BTN_ID}-popup .homepage {
  list-style-image: url(chrome://browser/skin/home.svg);
}
#{BTN_ID}-popup .edit {
  list-style-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIg0KCSB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHRyYW5zZm9ybT0ic2NhbGUoMS4xNSkiPg0KPHBhdGggZD0iTTE5MC4zLDQ1LjJMOTgsMTM3LjVINjQuN3YtMzMuM0wxNTcsMTEuOWMxLjMtMS4zLDMtMS45LDQuNy0xLjljMS43LDAsMy40LDAuNiw0LjcsMS45bDIzLjksMjMuOWMxLjMsMS4zLDEuOSwzLDEuOSw0LjcNCglDMTkyLjIsNDIuMiwxOTEuNiw0My45LDE5MC4zLDQ1LjJ6IE0xNjEuNywyOS40bC04MC40LDgwLjR2MTEuMWgxMS4xbDgwLjQtODAuNEwxNjEuNywyOS40TDE2MS43LDI5LjR6IE0xMDAuNywzNy43SDMxLjR2MTMzaDEzMw0KCXYtNjkuM2MwLTQuNiwzLjctOC4zLDguMy04LjNjNC42LDAsOC4zLDMuNyw4LjMsOC4zdjc0LjhjMCw2LjEtNSwxMS4xLTExLjEsMTEuMUgyNS45Yy02LjEsMC0xMS4xLTUtMTEuMS0xMS4xVjMyLjINCgljMC02LjEsNS0xMS4xLDExLjEtMTEuMWg3NC44YzQuNiwwLDguMywzLjcsOC4zLDguM1MxMDUuMywzNy43LDEwMC43LDM3Ljd6Ii8+DQo8L3N2Zz4NCg==);
}
#{BTN_ID}-popup .delete {
  list-style-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iY29udGV4dC1maWxsIiBmaWxsLW9wYWNpdHk9ImNvbnRleHQtZmlsbC1vcGFjaXR5Ij4KICA8cGF0aCBkPSJNOCAuNUEyLjUgMi41IDAgMCAwIDUuNSAzSDFhLjUuNSAwIDAgMC0uNS41bC4wMDguMDlBLjUuNSAwIDAgMCAxIDRoLjU1M0wyLjg1IDE0LjIyOUEyIDIgMCAwIDAgNC44MzYgMTZoNi4zMjhhMiAyIDAgMCAwIDEuOTg2LTEuNzcxTDE0LjQ0NSA0SDE1YS41LjUgMCAwIDAgMC0xaC00LjVBMi41IDIuNSAwIDAgMCA4IC41em0wIDFBMS41IDEuNSAwIDAgMSA5LjUgM2gtM0ExLjUgMS41IDAgMCAxIDggMS41ek0yLjU2IDRoMTAuODc3bC0xLjI4IDEwLjExNmEuOTk4Ljk5OCAwIDAgMS0uOTkzLjg4NEg0LjgzNmEuOTk4Ljk5OCAwIDAgMS0uOTkyLS44ODR6TTYuNSA2LjVjLS4yNzYgMC0uNS4xOTYtLjUuNDM4djUuMTI0bC4wMDguMDc4Yy4wNDIuMjA0LjI0Ny4zNi40OTIuMzYuMjc2IDAgLjUtLjE5Ni41LS40MzhWNi45MzhsLS4wMDgtLjA3OUM2Ljk1IDYuNjU1IDYuNzQ1IDYuNSA2LjUgNi41em0zIDBjLS4yNzYgMC0uNS4xOTYtLjUuNDM4djUuMTI0bC4wMDguMDc4Yy4wNDIuMjA0LjI0Ny4zNi40OTIuMzYuMjc2IDAgLjUtLjE5Ni41LS40MzhWNi45MzhsLS4wMDgtLjA3OUM5Ljk1IDYuNjU1IDkuNzQ1IDYuNSA5LjUgNi41eiIvPgo8L3N2Zz4K);
}
#{BTN_ID}-popup .style-flag .menu-iconic-left{
  position: relative;
}
#{BTN_ID}-popup .style-flag .menu-iconic-icon {
  visibility: hidden;
}
#{BTN_ID}-popup .style-flag .menu-iconic-left:after {
  content: "AS";
  position: absolute;
  display: -moz-box;
  display: flex;
  color: var(--panel-disabled-color);
  font-weight: bold;
}
#{BTN_ID}-popup .style-flag[flag="AGENT_SHEET"] .menu-iconic-left:after {
  content: "AG";
  color: #2a9fa2;
}
#{BTN_ID}-popup .style-flag[flag="USER_SHEET"] .menu-iconic-left:after {
  content: "US";
  color: #5b89f6;
}
`);