// ==UserScript==
// @name            ucf_autoPopup.uc.js
// @description     自动弹出菜单，来自于 Mozilla-Russia 论坛
// @author          Vitaliy V, modify by star-ray
// @include         main
// @version         2025.5.1
// @homepageURL     https://forum.mozilla-russia.org/viewtopic.php?pid=810204#p810204
// @onlyonce
// ==/UserScript==
(async (
    delay = 300,
    hidedelay = 800, //禁用自动隐藏，设为 0
    btnSelectors = [
        "#PanelUI-menu-button",
        "#library-button",
        "#nav-bar-overflow-button",
        "#fxa-toolbar-menu-button",
        "#star-button-box",
        "#pageActionButton",
        "#unified-extensions-button",
        "#downloads-button",
        "#alltabs-button",
        "#redirector-icon",
        "[widget-type=view]",
        ".toolbarbutton-combined-buttons-dropmarker"
    ],
    excludeBtnSelectors = [
        //":is(menupopup,panel) :scope",
        "#tabs-newtab-button",
        "#new-tab-button",
        "#back-button",
        "#forward-button",
    ],
    areaSelectors = ["toolbar"],
    $ = css => document.querySelectorAll(css),
    $id = id => document.getElementById(id)
) => ({
    timer: null,
    hidetimer: null,
    open_: false,
    inMemu_: false,
    prevBtn: null,
    popups: new Set(),
    async init() {
        await delayedStartupPromise;
        this.btnSelectors = btnSelectors.join(",");
        this.exclude = excludeBtnSelectors.join(",");
        this.ExtensionParent = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs").ExtensionParent;
        this.browserActionFor = this.ExtensionParent.apiManager.global.browserActionFor;
        for (let elm of (this.areasList = $(areaSelectors.join(",")))) {
            elm.addEventListener("mouseover", this);
            elm.addEventListener("mousedown", this);
        }
        for (let elm of (this.popupsList = $("toolbar,popupset"))) {
            elm.addEventListener("popupshown", this);
            elm.addEventListener("popuphidden", this);
        }
    	this.setHideTimer = this.setHideTimer.bind(this);
        gBrowser.tabpanels.addEventListener("mouseenter", this.setHideTimer);
        window.addEventListener('unload', _ => this.destructor());
    },
    destructor() {
        gBrowser.tabpanels.removeEventListener("mouseenter", this.setHideTimer);
        for (let elm of this.areasList) {
            elm.removeEventListener("mouseover", this);
            elm.removeEventListener("mousedown", this);
        }
        for (let elm of this.popupsList) {
            elm.removeEventListener("popupshown", this);
            elm.removeEventListener("popuphidden", this);
        }
    },
    handleEvent(e) {
        this[e.type](e);
    },
    popuphidden({ target }) {
        if (!this.prevBtn || target.localName === "tooltip") return;
        this.popups.delete(target);
        this.open_ = this.inMemu_ = this.popups.size > 0;
    },
    popupshown({ target }) {
        if (!this.prevBtn || target.localName === "tooltip") return;
		target.addEventListener("mouseenter", this, {once:true});
		target.addEventListener("mouseout", this, {once:true});
        this.open_ = true;
        this.popups.add(target);
    },
    mouseenter() {  //只处理菜单事件
        this.inMemu_ = true;
		clearTimeout(this.timer);
		clearTimeout(this.hidetimer);
    },
    mouseout() { //只处理菜单事件
        this.inMemu_ = false;
    },
    hidePopup() {
        this.popups.forEach(p => p.hidePopup?.());
        this.popups.clear();
    },
    mousedown() {
        clearTimeout(this.hidetimer);
        clearTimeout(this.timer);
    },
    extensionCanPopup(el) {
        const ID = el.dataset?.extensionid;
        return ID && this.browserActionFor(this.ExtensionParent.WebExtensionPolicy.getByID(ID).extension)
            .action.tabContext.get(gBrowser.selectedTab).popup;
    },
    setHideTimer() {
        if (!hidedelay) return;
        clearTimeout(this.hidetimer);
        this.hidetimer = setTimeout(() => {
            this.hidePopup();
            this.open_ = false;
            this.prevBtn = null;
        }, hidedelay);
    },
    mouseover({ target }) {
        if (this.prevBtn === target) {
			this.open_ && clearTimeout(this.hidetimer);
        	return;
        }
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (
                this.inMemu_ || !target?.matches
                || target.hasAttribute("open")
                || target.matches(this.exclude)
            ) return;
            const isPop = target.matches(this.btnSelectors) ||
				!!(target.parentElement.matches(this.btnSelectors) && (target = target.parentElement));
            if (isPop || target.menupopup || this.extensionCanPopup(target)) {
            	this.prevBtn = target;
                this.hidePopup();
                target.addEventListener('mouseout', this.setHideTimer, {once:true});
                if (target.hasAttribute('popup')) {
                    // const rect = target.getBoundingClientRect();
                    $id(target.getAttribute('popup')).openPopup(target,'before_start');
                    // $id(target.getAttribute('popup')).openPopupAtScreen(screenX,screenY);
                }
				else target.click();
                //let params = { bubbles: false, cancelable: true };
                //target.dispatchEvent(new MouseEvent("click", params));
            }
        }, delay);
    }
}).init())();