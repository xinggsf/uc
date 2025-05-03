// ==UserScript==
// @name            AutoCopySelectionText.uc.js
// @description     自动复制选中文本（ScrLk 亮起时不复制）
// @author          Ryan
// @version         2025.03.17
// @compatibility   Firefox 136
// @charset         UTF-8
// @system          windows
// @license         MIT
// @include         main
// @shutdown        window.AutoCopySelectionText.destroy();
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// @note            2025.03.17 临时改回 FrameScript 模式
// ==/UserScript==

(function(css) {
    const ACST_COPY_SUCCESS_NOTICE = "Auto Copied!";
    const ACST_WAIT_TIME = 990; // Change it to any number as you want
    const ACST_BLACK_LIST = "input,textarea"; // disable auto copy when focus on textboxes
    const ACST_SHOW_SUCCESS_NOTICE = true; // show notice on webpace when copyed successful
    const ACST_COPY_WITHOUT_RELEASE_KEY = true; // when the popup appears you can release the mouse button (work is not perfect, need to set ACST_WAIT_TIME as a reasonable number)
    const ACST_COPY_AS_PLAIN_TEXT = false; // copy as plain text

	const { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
    const { SelectionUtils } = ChromeUtils.importESModule("resource://gre/modules/SelectionUtils.sys.mjs");

    window.AutoCopySelectionText = {
        // 将变量声明为对象的属性
        START_COPY: null,
        TIMEOUT_ID: null,
        LONG_PRESS: null,
        DBL_NOTICE: null,
        get sss() {
            delete this.sss;
            return this.sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
        },
        get style() {
            delete this.style;
            return this.style = Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(css));
        },
        init() {
            if (!this.sss.sheetRegistered(this.style, this.sss.USER_SHEET))
                this.sss.loadAndRegisterSheet(this.style, this.sss.USER_SHEET);

            let user32;
            try {
                user32 = ctypes.open("user32.dll");
                this.getKeyState = user32.declare('GetKeyState', ctypes.winapi_abi, ctypes.bool, ctypes.int);
            } catch (e) {
                console.error("Failed to open user32.dll:", e);
                return; // 如果无法加载 user32.dll，则退出
            }

            ["mousedown", "mousemove", "dblclick", "mouseup"].forEach(type => {
                gBrowser.tabpanels.addEventListener(type, this, false);
            });

            function frameScript(ACST_BLACK_LIST, ACST_showSuccessInfo) {
                /**
                 * 检查当前节点是否在黑名单中
                 * @param {HTMLElement} el
                 */
                function ACST_ifItemTagInBackList(el) {
                    // if (el.matches(ACST_BLACK_LIST)) return true;
                    return el.closest(ACST_BLACK_LIST);
                }

                const ACST_Child = {
                    init() {
                        addMessageListener("acst_copy", this);
                        addMessageListener("acst_copy_success", this);
                        addMessageListener("acst_destroy", this);
                    },
                    destroy() {
                        removeMessageListener("acst_copy", this);
                        removeMessageListener("acst_copy_success", this);
                        removeMessageListener("acst_destroy", this);
                    },
                    receiveMessage(message) {
                        switch (message.name) {
						case "acst_copy":
							let selectedText = content.getSelection().toString();
							if (selectedText) {
								let currentNode = content.getSelection().anchorNode;
								if (currentNode.nodeType === 3) currentNode = currentNode.parentNode;
								if (ACST_ifItemTagInBackList(currentNode)) return;
								sendAsyncMessage("acst_selectionData", { selectedText });
							}
							break;
						case "acst_copy_success":
							if (message.data.text) {
								ACST_showSuccessInfo(content, message.data.text);
							}
							break;
						case "acst_destroy":
							this.destroy();
							break;
                        }
                    },
                }

                ACST_Child.init();
            }

			let frameScriptURI = 'data:application/javascript,'+ encodeURIComponent(
				`(${frameScript})(${ACST_BLACK_LIST},${ACST_showSuccessInfo})`);
            window.messageManager.loadFrameScript(frameScriptURI, true);
            window.messageManager.addMessageListener("acst_selectionData", this); // 监听来自 frame script 的消息
        },

        handleEvent(event) {
            if (this.getKeyState(0x91)) return;  // 检查 Scroll Lock
            const { clearTimeout, setTimeout } = event.target.ownerGlobal;

            switch (event.type) {
			case 'mousedown':
				this.START_COPY = true;
				if (this.DBL_NOTICE) {
					setTimeout(_ => {
						this.LONG_PRESS = true;
					}, ACST_WAIT_TIME);
				}
				break;
			case 'mousemove':
				if (this.LONG_PRESS) return;
				if (event.button !== 0) return;
				clearTimeout(this.TIMEOUT_ID);
				this.TIMEOUT_ID = setTimeout(_ => {
					this.LONG_PRESS = true;
					if (ACST_COPY_WITHOUT_RELEASE_KEY) {
						if (!this.START_COPY) return;
						this.copyText();
						this.START_COPY = false;
					}
				}, ACST_WAIT_TIME);
				break;
			case 'dblclick':
			case 'mouseup':
				if (!this.START_COPY) return;
				if (this.LONG_PRESS && !ACST_COPY_WITHOUT_RELEASE_KEY) {
					this.copyText();
				}

				this.START_COPY = false;
				this.DBL_NOTICE = true;
				setTimeout(_ => {
					this.DBL_NOTICE = false;
				}, 150);
				break;
            }
            this.LONG_PRESS = false;
        },
        copyText() {
            if (ACST_COPY_AS_PLAIN_TEXT) {
                if (content) {
                    // 内置页面，直接获取
                    let info = content.getSelection();
                    // 黑名单不获取选中文本
                    if (info?.anchorNode?.activeElement && ACST_ifItemTagInBackList(info.anchorNode.activeElement)) return;
                    let text = SelectionUtils.getSelectionDetails(content).fullText;
                    if (text?.length) {
                        copyTextToClipboard(text);
                        ACST_SHOW_SUCCESS_NOTICE && ACST_showSuccessInfo(content, ACST_COPY_SUCCESS_NOTICE);
                    }
                } else {
                    gBrowser.selectedBrowser.messageManager.sendAsyncMessage("acst_copy");
                }
            } else {
				goDoCommand('cmd_copy');
				if (ACST_COPY_SUCCESS_NOTICE)
                gBrowser.selectedBrowser.messageManager.sendAsyncMessage('acst_copy_success', {
                    text: ACST_COPY_SUCCESS_NOTICE
                });
            }
        },
        receiveMessage({name, target, data: {selectedText}}) {
            switch (name) {
			case 'acst_selectionData':
				if (this.getKeyState(0x91)) return;
				if (selectedText) {
					copyTextToClipboard(selectedText, target);
				}
				break;
            }
        },
        destroy() {
            this.sss.unregisterSheet(this.style, this.sss.USER_SHEET);
            ["mousedown", "mousemove", "dblclick", "mouseup"].forEach(type => {
                gBrowser.tabpanels.removeEventListener(type, this, false);
            });
            window.messageManager.broadcastAsyncMessage("acst_destroy");
            window.messageManager.removeMessageListener("acst_selectionData", this);
            delete window.AutoCopySelectionText;
        }
    }

    function ACST_ifItemTagInBackList(el) {
        return el.matches(ACST_BLACK_LIST) || el.closest(ACST_BLACK_LIST);
    }

    function copyTextToClipboard(text, browser) {
        if (text) {
            Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(text);
            if (ACST_COPY_SUCCESS_NOTICE && browser)
                browser.messageManager.sendAsyncMessage('acst_copy_success', {
                    text: ACST_COPY_SUCCESS_NOTICE
                });
        }
    }

    function ACST_showSuccessInfo(win, text) {
        let { document } = win;
        let main = document.querySelector("body") || document.documentElement;
        let wrapper = document.querySelector("#acst-success-info-wrapper");
        if (!wrapper) {
            let wEl = document.createElement("div");
            wEl.setAttribute("id", "acst-success-info-wrapper");
            wrapper = main.appendChild(wEl);
        }
        let div = document.createElement("div");
        div.innerText = text;
        wrapper.appendChild(div);
		div.addEventListener("click", (ev) => ev.target.remove());
        win.setTimeout(_ => div.remove(), 2000);
    }

    window.AutoCopySelectionText.init();
})(`
#acst-success-info-wrapper {
    z-index: 9999999;
	position: fixed;
	top: 20px; right: 20px;
	display: none;
	pointer-events: none;
	transition: all .2s;
}
#acst-success-info-wrapper:has(>div) {
    display: flex;
}
#acst-success-info-wrapper > div {
    pointer-events: initial;
    cursor: pointer;
    position: relative; opacity: 1;
    transition:all .2s;
    margin-top: 10px;
    padding: 10px 20px;
    color: white;
    background-color: #4ade80;
    border-radius: 5px;
    flex-direction: column;
}
`)