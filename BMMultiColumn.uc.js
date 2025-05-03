// ==UserScript==
// @name            BMMultiColumn.uc.js
// @description     书签菜单自动分列显示（先上下后左右）
// @author          Ryan, star-ray, ding
// @include         main
// @charset         UTF-8
// @version         2025.03.27
// @async
// @shutdown        window.BMMultiColumn.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/blob/master/userChromeJS
// @note            2025.03.27 修复 Height Width 弄混导致宽度异常，支持纵向滚轮
// @note            2025.02.19 fx133
// @note            2024.04.20 修复在【不支持 @include main注释】的UC环境里的一处报错
// @note            2022.12.22 融合 bookmarksmenu_scrollbar.uc.js，修复没超过最大宽度也会显示横向滚动条的 bug，支持主菜单的书签菜单
// @note            2022.12.17 修复宽度异常，书签栏太多的话无法横向滚动，需要搭配 bookmarksmenu_scrollbar.uc.js 使用
// @note            2022.11.19 fx108 不完美修复
// @note            2022.09.02 修复菜单延迟调整宽度的 BUG
// @note            修复边距问题，支持书签工具栏溢出菜单
// @ignorecache
// ==/UserScript==

(function(css, $, $$, calcWidth) {
    // window.BMMultiColumn?.destroy();
    window.BMMultiColumn = {
        menuPopups: '#historyMenuPopup,#bookmarksMenuPopup,#PlacesToolbar,#BMB_bookmarksPopup',
        sss: Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService),
		async init() {
			await delayedStartupPromise;
            this.style = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
            this.sss.loadAndRegisterSheet(this.style, 2);
            window.addEventListener('unload', this, false);
            // window.addEventListener("aftercustomization", this, false);
            this.delayedStartup();
        },
        delayedStartup() {
			this.ppms = $$(this.menuPopups);
			for (let e of this.ppms) {
				e.addEventListener('popupshowing', this, false);
				// e.addEventListener('DOMMenuItemActive', this, false);
			}
        },
        uninit() {
			for (let e of this.ppms) {
				e.removeEventListener('popupshowing', this, false);
				// e.removeEventListener('DOMMenuItemActive', this, false);
			}
        },
        destroy() {
            window.removeEventListener('unload', this, false);
            // window.removeEventListener("aftercustomization", this, false);
            this.uninit();
            this.sss.unregisterSheet(this.style, 2);
			delete window.BMMultiColumn;
        },
        handleEvent(event) {
            switch (event.type) {
			case 'popupshowing':
				let menupopup;
				if (event.target.matches('menu,toolbarbutton')) {
					menupopup = event.target.menupopup;
				} else if (event.target.tagName == 'menupopup') {
					menupopup = event.target;
				} else return;
				this.initHorizontalScroll(event);
				this.initMultiColumn(menupopup, event);
				break;
			case 'unload':
				this.destroy();
				break;
            }
        },
        initHorizontalScroll({originalTarget: el}) {
            const scrollBox = el.scrollBox;
			const s = scrollBox.scrollbox.style;
            s.setProperty("overflow-y", "auto", "important");
            s.setProperty("margin-top", "0", "important");
            s.setProperty("margin-bottom", "0", "important");
            s.setProperty("padding-top", "0", "important");
            s.setProperty("padding-bottom", "0", "important");

            el.on_DOMMenuItemActive = function({target: elt}) {
                // if (super.on_DOMMenuItemActive) {
					// super.on_DOMMenuItemActive(event);
                // }
                if (elt.parentNode != this || !window.XULBrowserWindow) return;

				const placesNode = elt._placesNode;
				let linkURI;
				if (placesNode && PlacesUtils.nodeIsURI(placesNode)) {
					linkURI = placesNode.uri;
				} else if (elt.hasAttribute("targetURI")) {
					linkURI = elt.getAttribute("targetURI");
				}

				if (linkURI) {
					window.XULBrowserWindow.setOverLink(linkURI);
				}
            }.bind(el);
            scrollBox._scrollButtonUp.style.display = "none";
            scrollBox._scrollButtonDown.style.display = "none";
        },
        initMultiColumn(menupopup, event) {
            menupopup.style.maxWidth = "calc(100vw - 20px)";
            let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part=scrollbox]');
            if (scrollbox) {
                Object.assign(scrollbox.style, {
                    minHeight: "21px",
                    height: "auto",
                    display: "flex",
                    flexFlow: "column wrap",
                    overflow: "-moz-hidden-unscrollable",
                    width: "unset"
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
                bindWheelEvent(scrollbox);
            }
            function bindWheelEvent(item) {
                if (item._bmMultiColumnWheelHandler) return;
                const wheelHandler = (e) => {
                    e.preventDefault();
                    const delta = e.deltaY || e.detail || e.wheelDelta;
                    item.scrollLeft += delta * 2;
                };
                item.addEventListener('wheel', wheelHandler, { passive: false });
                item._bmMultiColumnWheelHandler = wheelHandler;
            }
        },
        resetPopup(menupopup) {
            let arrowscrollbox = menupopup.shadowRoot.querySelector("::part(arrowscrollbox)");
            if (!arrowscrollbox) return;
            arrowscrollbox.style.maxHeight = "";
            let scrollbox = arrowscrollbox.shadowRoot.querySelector('[part=scrollbox]');

            if (!scrollbox) return;
            if (scrollbox._bmMultiColumnWheelHandler) {
                scrollbox.removeEventListener('wheel', scrollbox._bmMultiColumnWheelHandler);
                delete scrollbox._bmMultiColumnWheelHandler;
            }
            Object.assign(scrollbox.style, {
                minHeight: "",
                height: "",
                display: "",
                flexFlow: "",
                overflow: "",
                maxHeight: "",
                width: ""
            });

            let menuitem = menupopup.lastChild;
            while (menuitem) {
                menuitem.style.width = "";
                menuitem = menuitem.previousSibling;
            }
        }
    }

    window.BMMultiColumn.init();
})(`
#PlacesToolbarItems menupopup {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 129px);
}`,
(id, doc=document) => doc.getElementById(id),
(css, doc=document) => doc.querySelectorAll(css),
(offset) => {
	if (typeof offset == 'number') {
		return window.innerWidth + offset;
	}
	if (typeof offset == 'string' &&
		/^-?(\d+)px$/.test(offset.trim())) {
		return window.innerWidth + parseInt(RegExp.$1);
	}
	throw 'Invalid offset value';
}
)