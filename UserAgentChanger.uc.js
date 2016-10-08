// ==UserScript==
// @name UserAgentChangeModLite.uc
// @namespace UserAgentChangeModLite_xinggsf
// @downloadUrl     https://raw.githubusercontent.com/xinggsf/uc/master/UserAgentChanger.uc.js
// @charset     utf-8
// @note  2016-10-6 xinggsf: 完善 _blank link 单击事件的处理
// @note  2016-10-4 xinggsf: 自定义站点全部使用正则表达式；[fix bug] 新增自定义站点并重载配置后出错
// @note  2016-09-26 xinggsf: [fix bug] click blank link
// @note  modify by lastdream2013 at 20130616 mino fix
// @note  modify by lastdream2013 at 20130409 sitelist : change SITELIST idx to Name
// @include chrome://browser/content/browser.xul
// ==/UserScript==

var ucjs_UAChanger = {
	//现有版本firefox的图标
	NOW_UA_IMG : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAABtUlEQVQ4ja2UP2hUQRDGJ2Ih2mnE1kotkrSCoATEwlIbtQgmJDzudlbBu3DvfYP3+KaylhQpLYOFCGIhgqC1TQJWmkQtUgSxuSYmilrcXXh3e4L/BqbZP7/Z/b7ZlQifU3BL4Z0/T25H81sSzX/8a4rC9wYH+VnhzyP8pZo/U/MnCj5UcEXNPyQQ+BdReKc3sBnNn0bz9Qh+jOALNe5UNryN4FIEl6oQhXf2IQp/E/P2ZABbwbwZCr8xXFXBNRGROtrnFf4tgUT4apbxsPRCwUYAW9F8vVL1uxqvi4io8UECqRunpBIKHAs5zyn4flADPu7O+0wC6W/OmhyvGSdCwTDKiVD4NRGRWsGTCWR6mgdFROaA4xl4Zsixr/tXsvJir95YAsmaHK/ocUrBhlp5af4Oj0Yje8JuzSwuHhERqefl5VHu3OwieGDB7ETNOKE5Lyi4UnGn0S/Ut3oIwndVYWdneUgLLkT4agQfBfDqgPDGV6nFXeXvyW+EFp6PbLbKke+LyNivAMG4nHRsNO6O6MwNLRyK9tl66+5pLcorCpZqfJ2sNe78r1fM2wpu/9V/YvykoP0E9a4dzemYDMIAAAAASUVORK5CYII=",
	//其他版本firefox的图标
	EXT_FX_LIST_IMG : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABVElEQVQ4jZ3SsSvtcRjH8Vcy3HQyGXQz3cGgm0GSQSZJBoN0p5MM8heYJKukMxgkk0Ey3gySZDDodJIkyaCTTqfb6aSbJLvh9xx+/Thn8KmnX9/f93nez9Pn+dJc7fgZ0d4i75N6MYVJDEZMxL/eVt1mMRYF3RhHLhULKKGAH1nACOpYxVwkjmUAXfiDM2xiOA2Yxiv+o4ob5CMpl4k87rCbBuzhCbW4LOEIS18ABnCB8zSgEt0ruMQJ1tHZBHCAh7QXjfHLOMayxPlscQ7z2MdLnInRG4AL7KAfo2HcrxRgK5q8oKMBOA0PqrhGMXwoYtvHSoewETm1tAeLQSzjPqbYx4xkfTn04RB/8Rj37+qSvINimFPGbRQUYuxSxHk0G5FRHs+Sh3IfoKpkMw/4F+A61rLFDc2FmU8RdR8GP8d3BW3NANATSWfRvYYriXm/WxV+S289KV50Q9KsmwAAAABJRU5ErkJggg==",

	UANameIdxHash : [],

	// ----- 下面设置开始 -----
	// defautl: ステータスバーの右端に表示する
	TARGET : null,
	// 定义一个target，用来调整状态栏顺序,null为空
	ADD_OTHER_FX : true,
	// true:自动添加其他版本firefox的ua  false:不添加
	//2种版本firefox，下面请勿修改
	EXT_FX_LIST : [
		{
			name : "Firefox4.0",
			ua : "Mozilla/5.0 (Windows; Windows NT 6.1; rv:2.0b2) Gecko/20100720 Firefox/4.0b2",
			label : "Fx4.0",
			img : ""
		}, {
			name : "Firefox3.6.8",
			ua : "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.9.2.8) Gecko/20100722 Firefox/3.6.8",
			label : "Fx3.6",
			img : ""
		}
	],
	// ----------------------
	// UA リストのインデックス
	def_idx : 0,
	Current_idx : 0,

	init : function () {
		this.clickUrl = {};
		this.reload();
		this.mkData(); // UA データ(UA_LIST)を作る
		let uaBtn = document.createElement("toolbarbutton");//若添加到菜单可改为创建menu，相应class属性得改为menu-iconic
		uaBtn.setAttribute("id", "ucjs_UserAgentChanger");
		uaBtn.setAttribute('type', 'menu');
		uaBtn.setAttribute('class', 'toolbarbutton-1 chromeclass-toolbar-additional');
		uaBtn.setAttribute("label", "UserAgentChange");
		uaBtn.setAttribute("tooltiptext", '左键：弹出菜单\n中键：重载配置\n右键：编辑配置');
		uaBtn.setAttribute("image", this.UA_LIST[this.def_idx].img);
		uaBtn.setAttribute('onclick', 'if (event.button == 2) {event.preventDefault();closeMenus(event.currentTarget); ucjs_UAChanger.edit();}if(event.button == 1) { ucjs_UAChanger.reload(true);}');
		let insPos = document.getElementById('urlbar-icons');
		insPos.appendChild(uaBtn);
		this.mkPanel(); // 生成菜单、面板
		this.setSiteIdx();

		let os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		os.addObserver(this, "http-on-modify-request", false);
		os.addObserver(this, "content-document-global-created", false);
		let contentArea = document.getElementById("appcontent");
		contentArea.addEventListener("load", this, true);
		contentArea.addEventListener("select", this, false);
		contentArea.addEventListener("click", this, false);
		let contentBrowser = this.getContentBrowser();
		contentBrowser.tabContainer.addEventListener("TabClose", this, false);
		window.addEventListener("unload", this, false);
		window.getBrowser().addProgressListener(this);
	},
	checkUARule : function (url) {
		for (let i of this.SITE_LIST) {
			if (i.url.test(url)) return this.UA_LIST[i.idx].ua;
		}
		return null;
	},
	reload : function (isAlert) {
		let data = this.importUserAgentChange();
		if (!data)
			return this.alert('Load Error: 配置文件不存在');
		let sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));
		try {
			Cu.evalInSandbox(data, sandbox, "1.8");
		} catch (e) {
			this.alert('Error: ' + e + '\n请重新检查配置文件');
			return;
		}
		this.DISPLAY_TYPE = sandbox.DISPLAY_TYPE;
		this.SITE_LIST = sandbox.SITE_LIST;
		this.UA_LIST = sandbox.UA_LIST;
		try {
			document.getElementById("ucjs_UserAgentChanger").removeChild(document.getElementById("uac_popup"));
			this.mkData();
			this.mkPanel();
		} catch (e) {}
		this.setSiteIdx();
		if (isAlert)
			this.alert('配置已经重新载入');
	},
	alert : function (aString, aTitle) {
		Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService)
			.showAlertNotification("", aTitle || "UserAgentChanger", aString, false, "", null);
	},

	userAgentChangeFile : function () {
		let aFile = Services.dirsvc.get("UChrm", Ci.nsILocalFile);
		aFile.appendRelativePath("Local");
		aFile.appendRelativePath("_userAgentChange.js");
		if (!aFile.exists() || !aFile.isFile()) return null;
		return aFile;
	},

	importUserAgentChange : function () {
		let file = this.userAgentChangeFile();
		let fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
		let sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
		fstream.init(file, -1, 0, 0);
		sstream.init(fstream);
		let data = sstream.read(sstream.available());
		try {
			data = decodeURIComponent(escape(data));
		} catch (e) {}
		sstream.close();
		fstream.close();
		return data;
	},

	edit : function () {
		let aFile = this.userAgentChangeFile();
		if (!aFile || !aFile.exists() || !aFile.isFile())
			return;
		let editor;
		try {
			editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsILocalFile);
		} catch (e) {
			this.alert("请设置编辑器的路径。\nview_source.editor.path");
			toOpenWindowByType('pref:pref', 'about:config?filter=view_source.editor.path');
			return;
		}
		let UI = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
		UI.charset = window.navigator.platform.toLowerCase().indexOf("win") >= 0 ? "gbk" : "UTF-8";
		let process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);

		try {
			let path = UI.ConvertFromUnicode(aFile.path);
			let args = [path];
			process.init(editor);
			process.run(false, args, args.length);
		} catch (e) {
			this.alert("编辑器不正确！")
		}
	},
	getPlatformString: function(userAgent) {
		if (!userAgent) return;
		let s = userAgent.toLowerCase();
		if (s.indexOf("Win64") > -1) return "Win64";
		if (s.indexOf("windows") > -1) return "Win32";
		if (s.indexOf("android") > -1) return "Linux armv7l";
		if (s.indexOf("linux") > -1) return "Linux i686";
		if (s.indexOf("iphone") > -1) return "iPhone";
		if (s.indexOf("ipad") > -1) return "iPad";
		if (s.indexOf("mac os x") > -1) return "MacIntel";
	},

	// UA データを作る
	mkData : function () {
		let ver = this.getVer(); // 現在使っている Firefox のバージョン
		// 現在使っている Firefox のデータを作る
		let tmp = [];
		tmp.name = "Firefox" + ver;
		tmp.ua = "";
		tmp.img = this.NOW_UA_IMG;
		tmp.label = "Fx" + (this.ADD_OTHER_FX ? ver : "");
		this.UA_LIST.unshift(tmp);
		// Fx のバージョンを見て UA を追加する
		if (this.ADD_OTHER_FX) {
			if (ver == 3.6) { // Fx3.6 の場合 Fx4 を追加する
				this.EXT_FX_LIST[0].img = this.EXT_FX_LIST_IMG;
				this.UA_LIST.push(this.EXT_FX_LIST[0]);
			} else { // Fx3.6 以外では Fx3.6 を追加する
				this.EXT_FX_LIST[1].img = this.EXT_FX_LIST_IMG;
				this.UA_LIST.push(this.EXT_FX_LIST[1]);
			}
		}
		// 起動時の UA を 初期化 (general.useragent.override の値が有るかチェック 07/03/02)
		let ps = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("");
		if (ps.getPrefType("general.useragent.override") != 0) {
			let ua =ps.getCharPref("general.useragent.override");
			this.def_idx = this.UA_LIST.findIndex(x => ua === x.ua);
			if (this.def_idx <0) this.def_idx = 0;
		}
	},
	// UA パネルを作る
	mkPanel : function () {
		// UA パネルのコンテクストメニューを作る
		let mi, ppm = document.createElement("menupopup");
		ppm.setAttribute("id", "uac_popup");
		this.UA_LIST.forEach((k, i) => {
			if (k.name == "分隔线") {
				mi = document.createElement("menuseparator");
			} else {
				mi = document.createElement("menuitem");

				mi.setAttribute('label', k.name);
				mi.setAttribute('tooltiptext', k.ua);
				mi.setAttribute('oncommand', "ucjs_UAChanger.setUA(" + i + ");");

				if (this.DISPLAY_TYPE) {
					mi.setAttribute('class', 'menuitem-iconic');
					mi.setAttribute('image', k.img);
				} else {
					mi.setAttribute("type", "radio");
					mi.setAttribute("checked", i === this.def_idx);
				}
				if (i === this.def_idx) {
					mi.setAttribute("style", 'font-weight: bold;');
					mi.style.color = 'red';
				} else {
					mi.setAttribute("style", 'font-weight: normal;');
					mi.style.color = 'black';
				}
				mi.setAttribute("uac-generated", true);
			}
			ppm.appendChild(mi);
		});
		mi = document.createElement("menuseparator");
		ppm.appendChild(mi);
		mi = document.createElement("menuitem");
		mi.setAttribute('id', 'ucjs_UAChangerConfig');
		mi.setAttribute('label', '重载UA配置');
		mi.setAttribute("tooltiptext", '左键重载；右键编辑');
		mi.setAttribute('oncommand', 'event.preventDefault(); ucjs_UAChanger.reload(true);');
		mi.setAttribute('onclick', 'if (event.button == 2) {event.preventDefault(); closeMenus(event.currentTarget); ucjs_UAChanger.edit(); }');
		ppm.appendChild(mi);
		let menu = document.getElementById("ucjs_UserAgentChanger");
		menu.addEventListener("popupshowing", this, false);
		menu.appendChild(ppm);
	},
	observe : function (subject, topic, data) {
		if (topic === "http-on-modify-request") {
			let http = subject.QueryInterface(Ci.nsIHttpChannel);
			let ua = this.checkUARule(http.URI.spec);
			if (ua) http.setRequestHeader("User-Agent", ua, false);
		}
		else if (topic === "content-document-global-created") {
			let aSubject, aChannel;
			if (subject.defaultView) aSubject = subject.defaultView;
			if (subject.QueryInterface && subject.document) {//subject可能是iframe
				aSubject = subject;
			}
			if (aSubject) aChannel = aSubject.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation)
				.QueryInterface(Ci.nsIDocShell)
				.currentDocumentChannel;
			if (aChannel instanceof Ci.nsIHttpChannel) {
				let navigator = aSubject.navigator;
				let ua = this.checkUARule(aChannel.URI.spec) || aChannel.getRequestHeader("User-Agent");
				//console.log(aChannel.URI.spec, ua);
				if (navigator.userAgent !== ua)
					Object.defineProperty(XPCNativeWrapper.unwrap(navigator), "userAgent", {
						value : ua,
						enumerable : true
					});
				let platform = this.getPlatformString(ua);
				if (platform) {
					Object.defineProperty(XPCNativeWrapper.unwrap(navigator), 'platform', {
						value: platform,
						enumerable: true
					});
				}
			}
			else {
				let ua, blankWin = subject.content,// .content取chrome窗口的网页窗口
				url = blankWin.document.URL;
				//console.log(url, blankWin.navigator.userAgent);
				if (this.nextBlankUA && url.startsWith('about:')) {
					Object.defineProperty(XPCNativeWrapper.unwrap(blankWin.navigator), "userAgent", {
						value : this.nextBlankUA,
						enumerable : true
					});
					this.nextBlankUA = null;
				}
			}
		}
	},
	handleEvent : function (aEvent) {
		let contentBrowser;
		switch (aEvent.type) {
		case "click":
            if (!aEvent.ctrlKey && 0 === aEvent.button) {
                let ua, a = aEvent.target.closest('a[href][target=_blank]');
                if (a && (ua = this.checkUARule(a.href))) {
					this.clickUrl[a.href] = ua;
					this.nextBlankUA = ua;
				}
            }
			break;
		case "popupshowing":
			// コンテクスト・メニュー・ポップアップ時にチェック・マークを更新する
			Array.prototype.forEach.call(aEvent.target.childNodes, (k, i) => {
				if (i == this.Current_idx) {
					k.setAttribute("style", 'font-weight: bold;');
					k.style.color = 'red';
					if (!this.DISPLAY_TYPE)
						k.setAttribute("checked", true);
				} else {
					k.setAttribute("style", 'font-weight: normal;');
					k.style.color = 'black';
				}
			});
			break;
		case "load":
		case "select":
		case "TabClose":
			contentBrowser = this.getContentBrowser();
			let x = this.SITE_LIST.find(k => k.url.test(contentBrowser.currentURI.spec));
			x =  x ? x.idx : this.def_idx;
			this.setImage(x);
			break;

		case "unload":
			let os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			os.removeObserver(this, "http-on-modify-request");
			os.removeObserver(this, "content-document-global-created");
			let contentArea = document.getElementById("appcontent");
			contentArea.removeEventListener("load", this, true);
			contentArea.removeEventListener("select", this, false);
			contentBrowser = this.getContentBrowser();
			if (contentBrowser)
				contentBrowser.tabContainer.removeEventListener("TabClose", this, false);
			let ppm = document.getElementById("uac_popup");
			ppm.removeEventListener("popupshowing", this, false);
			window.removeEventListener("unload", this, false);
			window.getBrowser().removeProgressListener(this);
			break;
		}
	},
	setUA : function (i) {
		let ps = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("");
		if (i == 0) { // オリジナル UA にする場合
			// 既にオリジナル UA の場合は何もしない
			if (ps.getPrefType("general.useragent.override") == 0)
				return;
			ps.clearUserPref("general.useragent.override");
		} else { // 指定した UA にする場合
			ps.setCharPref("general.useragent.override", this.UA_LIST[i].ua);
		}
		this.def_idx = i;
		this.setImage(i);
	},
	setImage : function (i) {
		let menu = document.getElementById("ucjs_UserAgentChanger");

		menu.setAttribute("image", this.UA_LIST[i].img);
		menu.setAttribute("label", this.UA_LIST[i].name);
		menu.style.padding = "0px 2px";

		this.Current_idx = i;
	},
	// アプリケーションのバージョンを取得する(Alice0775 氏のスクリプトから頂きました。)
	getVer : function () {
		let info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
		let ver = parseInt(info.version.substr(0, 3) * 10, 10) / 10;
		return ver;
	},
	setSiteIdx : function () {
		this.UA_LIST.forEach((k, i) => {
			this.UANameIdxHash[k.name] = i;
		});
		for (let k of this.SITE_LIST) {
			k.idx = this.UANameIdxHash[k.Name] || this.def_idx;
		}
	},
	// 現在のブラウザオブジェクトを得る。
	getContentBrowser : function () {
		let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
		let top = wm.getMostRecentWindow("navigator:browser");
		if (top)
			return top.document.getElementById("content");
		return null;
	}
}
ucjs_UAChanger.init();
