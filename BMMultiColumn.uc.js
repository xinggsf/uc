// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, star-ray, ding
// @include         main
// @ignorecache
// @charset         UTF-8
// @version         2025.05.13
// @async
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @note            2025.05.13 code整体架构改进，不污染window命名空间；精简code, 去除大量定时器；ylcs006 改进CSS使得书签菜单更紧凑美观
// @note            2025.03.27 修复 Height Width 弄混导致宽度异常，支持纵向滚轮
// @note            2024.04.20 修复在【不支持 @include main注释】的UC环境里的一处报错
// @note            2022.12.22 融合 bookmarksmenu_scrollbar.uc.js，修复没超过最大宽度也会显示横向滚动条的 bug，支持主菜单的书签菜单
// @note            2022.12.17 修复宽度异常，书签栏太多的话无法横向滚动，需要搭配 bookmarksmenu_scrollbar.uc.js 使用
// @note            2022.09.02 修复菜单延迟调整宽度的 BUG
// @note            修复边距问题，支持书签工具栏溢出菜单
// ==/UserScript==

((
    css = `
    #PlacesToolbarItems menupopup {
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 129px);
        & > * {
            scroll-snap-align: start;
        }
    }`,
    sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
    $ = (id, doc=document) => doc.getElementById(id),
    $$ = (css, doc=document) => doc.querySelectorAll(css),
    calcWidth = (offset) => {
        if (typeof offset == 'number') {
            return window.innerWidth + offset;
        }
        if (/^-?(\d+)px$/.test(offset.trim())) {
            return window.innerWidth + parseInt(RegExp.$1);
        }
        throw 'Invalid offset value';
    }
) => ({
    menuPopups: '#historyMenuPopup,#bookmarksMenuPopup,#PlacesToolbar,#BMB_bookmarksPopup',
    async init() {
        await delayedStartupPromise;
        this.style = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
        sss.loadAndRegisterSheet(this.style, 2);
        window.addEventListener('unload', this, false);
        this.ppms = $$(this.menuPopups);
        for (let e of this.ppms) {
            e.addEventListener('popupshowing', this, false);
        }
    },
    destroy() {
        window.removeEventListener('unload', this, false);
        for (let e of this.ppms) {
            e.removeEventListener('popupshowing', this, false);
        }
        sss.unregisterSheet(this.style, 2);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    popupshowing({ target, originalTarget: el }) {
        let menupopup;
        if (target.matches('menu,toolbarbutton')) {
            menupopup = target.menupopup;
        } else if (target.tagName == 'menupopup') {
            menupopup = target;
        } else return;
        this.initHorizontalScroll(el.scrollBox);
        this.initMultiColumn(menupopup);
    },
    unload() {
        this.destroy();
    },
    initHorizontalScroll(scrollBox) {
        const s = scrollBox.scrollbox.style;
        s.setProperty("overflow-y", "auto", "important");
        s.setProperty("margin-top", "0", "important");
        s.setProperty("margin-bottom", "0", "important");
        s.setProperty("padding-top", "0", "important");
        s.setProperty("padding-bottom", "0", "important");

        scrollBox._scrollButtonUp.style.display = "none";
        scrollBox._scrollButtonDown.style.display = "none";
    },
    initMultiColumn(menupopup) {
        menupopup.style.maxWidth = "calc(100vw - 20px)";
        let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
        let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part=scrollbox]');
        if (!scrollbox) return;
        Object.assign(scrollbox.style, {
            minHeight: "21px",
            height: "auto",
            display: "flex",
            flexFlow: "column wrap",
            overflow: "-moz-hidden-unscrollable",
            width: "unset",
            scrollSnapType: "x mandatory"
        });
        arrowscrollbox.style.width = "auto";
        arrowscrollbox.style.maxHeight = "calc(100vh - 129px)";
        let slot = scrollbox.querySelector('slot');
        slot.style.display = "contents";
        let maxWidth = calcWidth(-129);
        if (maxWidth < scrollbox.scrollWidth) {
            scrollbox.style.setProperty("overflow-x", "auto", "important");
            scrollbox.style.setProperty("width", maxWidth + "px");
        } else {
            scrollbox.style.setProperty("width", scrollbox.scrollWidth + "px", "important");
            scrollbox.clientWidth = scrollbox.scrollWidth;
        }
        if (!scrollbox._bmMultiColumnWheelHandler) {
            scrollbox._bmMultiColumnWheelHandler = (e) => {
                e.preventDefault();
                const delta = e.deltaY || e.detail || e.wheelDelta;
                scrollbox.scrollLeft += delta * 50;
            };
            scrollbox.addEventListener('wheel', scrollbox._bmMultiColumnWheelHandler, { passive: false });
        }
    }
}).init())();