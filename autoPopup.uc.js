// ==UserScript==
// @name           autoPopup++
// @description    Auto popup/close menu/panel
// @updateURL      https://raw.githubusercontent.com/xinggsf/uc/master/autoPopup.uc.js
// @namespace      autoPopup-plus.xinggsf
// @include        chrome://browser/content/browser.xul
// @compatibility  Firefox 45+
// @author         xinggsf
// @version        2016.5.11
// @note  2016.5.11  fix:在定制窗取消搜索框后脚本失效；撤消按钮菜单不能自动隐藏
// @note  2016.5.10  修正原始搜索框图标按钮自动菜单
// @note  2016.5.9   增加对firefox英文版的支持。fix bug: widget按钮的菜单不能自动隐藏；有时不能自动弹出菜单；菜单之右键菜单导致误隐藏！
// @note  2016.5.8   OOP封装：以清晰、简单的逻辑，真正实现自动弹出和关闭菜单
// ==/UserScript==

function clone(src){//浅克隆
	if (!src) return src;
	let r = src.constructor === Object ?
		new src.constructor() :
		new src.constructor(src.valueOf());
	for (let key in src){
		if ( r[key] !== src[key] ){
			r[key] = src[key];
		}
	}
	r.toString = src.toString;
	r.valueOf = src.valueOf;
	return r;
}
function $(id) {
	return document.getElementById(id);
}
function getPopupPos(elt) {
	let box, w, h, b = !1,
	x = elt.boxObject.screenX,
	y = elt.boxObject.screenY;

	while (elt = elt.parentNode.closest('toolbar,hbox,vbox')) {
		h = elt.boxObject.height;
		w = elt.boxObject.width;
		if (h >= 45 && h >= 3 * w) {
			b = !0;
			break;
		}
		if (w >= 45 && w >= 3 * h) break;
	}
	if (!elt) return ppmPos[0];
	box = elt.boxObject;
	x = b ? (x <= w / 2 + box.screenX ? 1 : 3) :
			(y <= h / 2 + box.screenY ? 0 : 2);
	return ppmPos[x];
}
const nDelay = 290,
ppmPos = ['after_start','end_before','before_start','start_before'],
//禁止自动弹出的(按钮)黑名单。CSS语法: #表示id  .表示class
blackIDs = ['#back-button','#forward-button'];//'.bookmark-item',
//by xinggsf, 白名单，及触发动作
let whiteIDs = [{
	//放在omnibar中的搜索引擎图标
	id: 'omnibar-defaultEngine',//设定按钮ID
	popMenu: 'omnibar-engine-menu',//设定菜单ID
	run: btn => $('omnibar-in-urlbar').click()
},{
	id: 'alertbox_tb_action',
	popMenu: 'alertbox_menu_panel',
}];

class MenuAct {//菜单动作基类－抽象类
	constructor() {
		if (new.target === MenuAct)
			throw new Error('MenuAct类不能实例化');
	}
	isButton(e) {
		let r = this._isButton(e);
		if (!r) return r;
		this.btn = e;
		this.ppm = this.getPopupMenu(e);
		return r;
	}
	getPopupMenu(e) {
		let s = e.getAttribute('context') || e.getAttribute('popup');
		if (s) return $(s);
		return e.querySelector('menupopup,menulist');
	}
	open(){
		let m = this.ppm;
		//console.log(m);
		if (m) {
			if (m.openPopup)
				m.openPopup(this.btn, getPopupPos(this.btn));
			else if (m.showPopup)
				m.showPopup();
			else if (m.popupBoxObject)
				m.popupBoxObject.showPopup();
		}
		else this.btn.click();
	}
	close(){
		if (this.ppm) {
			if (this.ppm.hidePopup)
				this.ppm.hidePopup();
			else if (this.ppm.popupBoxObject)
				this.ppm.popupBoxObject.hidePopup();
			else if (this.btn.closePopup)
				this.btn.closePopup();
		}
	}
}
let btnSearch, menuActContainer = [
	new class extends MenuAct{//处理白名单
		_isButton(e) {
			this.idx = e.hasAttribute('id') ?
				whiteIDs.findIndex(k => k.id === e.id) : -1;
			return this.idx !== -1;
		}
		getPopupMenu(e) {
			let id = whiteIDs[this.idx].popMenu;
			return (id && $(id)) || super.getPopupMenu(e);
		}
		open() {
			let fn = whiteIDs[this.idx].run;
			fn ? fn(this.btn) : super.open();
		}
	}(),
	new class extends MenuAct{//处理黑名单
		_isButton(e) {
			return blackIDs.some(css => e.mozMatchesSelector(css));//matches
		}
		open() {}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.localName === 'menulist';
		}
		getPopupMenu(e) {
			return this.btn;
		}
		close() {
			this.btn.open = !1;
		}
		open() {
			this.btn.open = !0;
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.id === 'PanelUI-menu-button';
		}
		getPopupMenu(e) {
			return $('PanelUI-popup');
		}
		close() {
			PanelUI.hide();
		}
		open() {
			PanelUI.show();
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.id === 'downloads-button';
		}
		getPopupMenu(e) {
			return $('downloadsPanel');
		}
		close() {
			DownloadsPanel.hidePanel();
		}
		open() {
			DownloadsPanel.showPanel();
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.matches('[widget-id][widget-type=view]');
		}
		open() {
			this.btn.click();
			this.ppm = $('customizationui-widget-panel'); //'#nav-bar>panel[id$=-widget-panel]'
		}
		getPopupMenu(e) {return null;}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.matches('[widget-id][widget-type=button]');
		}
		open() {
			super.open();
			this.ppm = $('customizationui-widget-panel');
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			if (!e.closest('#searchbar')) return !1;
			let x = btnSearch.boxObject;
			x = x.screenX + x.width;
			return scrX < x;
		}
		getPopupMenu(e) {
			return $('PopupSearchAutoComplete');
		}
		close() {
			BrowserSearch.searchBar.textbox.closePopup();
		}
		open() {
			BrowserSearch.searchBar.openSuggestionsPanel();
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return /toolbarbutton|button/.test(e.localName) && this.getPopupMenu(e);
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.closest('toolbar') && this.getPopupMenu(e) &&
			('image' === e.nodeName || e.matches('[src^="data:image"]'));
		}
	}(),
];
let btnManager, ppmManager;
class AutoPop {
	constructor() {
		this.timer = 0;
		this.act = null;//MenuAct
	}
	clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = 0;
		}
	}
	clean() {
		if (!this.act) return;
		this.clearTimer();
		this.act = null;
	}
	inMenu(e) {
		let s = e.ownerDocument.URL;
		if (!s.startsWith('chrome://')) return !1;
		if (e.nodeName === 'menuitem') return !0;
		let a = ppmManager.act;
		if (!a || !a.ppm) return !1;
		return e === a.btn || a.ppm.contains(e) || s.endsWith('/popup.html');
	}
}
btnManager = new class extends AutoPop {
	setTimer() {
		this.timer = setTimeout(() => {
			this.act.open();
			ppmManager.clean();
			ppmManager.act = clone(this.act);
			this.clean();
		}, nDelay +9);
	}
	mouseOver(e) {
		this.clean();
		if (this.inMenu(e) || e.disabled)
			return;
		for (let k of menuActContainer) {
			if (k.isButton(e)) {
				this.act = k;
				this.setTimer();
				break;
			}
		}
	}
}();
ppmManager = new class extends AutoPop {
	clean() {
		if (this.act) {
			this.act.close();
			super.clean();
		}
	}
	setTimer() {
		if (!this.timer) this.timer = setTimeout(() => {
			this.clean();
		}, nDelay);
	}
	mouseOver(e) {
		if (this.inMenu(e)) {
			this.clearTimer();
			return;
		}
		if (this.act) this.setTimer();
	}
}();

let scrX, prevElt = null;
function mouseOver(ev) {
	if (!document.hasFocus()) {
		ppmManager.clean();
		return;
	}
	let e = ev.target;
	if (e === prevElt) return;
	prevElt = e;
	scrX = ev.screenX;
	btnManager.mouseOver(e);
	ppmManager.mouseOver(e);
}

if (!BrowserSearch.searchBar || $('omnibar-defaultEngine'))
	menuActContainer.splice(-3, 1);
else
	btnSearch = BrowserSearch.searchBar.textbox
	.querySelector('[anonid=searchbar-search-button]');
window.addEventListener('mouseover', mouseOver, !1);