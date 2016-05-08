// ==UserScript==
// @name           autoPopup.uc.js
// @description    Auto popup menulist/menupopup
// @updateURL      https://raw.githubusercontent.com/xinggsf/uc/master/autoPopup.uc.js
// @namespace      autoPopup@gmail.com
// @include        chrome://browser/content/browser.xul
// @compatibility  Firefox 45+
// @author         xinggsf
// @version        2016.5.8
// 以下所注释内容由xinggsf改进
// @note           2016.5.8 OOP封装：以清晰、简单的逻辑，真正实现定时自动弹出和关闭菜单
// @note           2016.1.2限定脚本作用在FX内部
// @note           2015.12.10用setter控制，防止弹出多个菜单;新增多个omnibar内的图标白名单
// @note           2015.11.8取消书签的自动弹出，因为我的任务栏也是左竖栏
// @note           2015.8.8增加白名单功能，用之处理omnibar内的多个图标
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
const nDelay = 260,
//禁止自动弹出。CSS语法: #表示id，. 表示class
blackIDs = ['#back-button','#forward-button'];//'.bookmark-item',
//by xinggsf, 白名单，及触发动作
let whiteIDs = [{
//放在omnibar中的搜索引擎图标
	id: 'omnibar-defaultEngine',
	popMemu: 'omnibar-engine-menu',
	//run: overEle => $('omnibar-in-urlbar').click(0)
}, {
	id: 'ublock0-button',
	popMemu: 'ublock0-panel',
	run: overEle => overEle.click()
}];
//let ppmContainer = $('mainPopupSet');

class MenuAct {//菜单动作基类－抽象类
	//btn = null;ES6不支持实例属性这样定义
	//ppm = null;
	constructor() {
		if (new.target === MenuAct)
			throw new Error('MenuAct类不能实例化');
	}
	isButton(e) {//_isButton的装饰方法
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
		/* let r = /menupopup|menulist/,
		c = e.ownerDocument.getAnonymousNodes(e);
		for (let k of c)
			if (r.test(k.nodeName)) return k; */
	}
	open(){
		let m = this.ppm;
		if (m) {
			if (m.openPopup)
				m.openPopup(this.btn, null, 15, 15);
			else if (m.showPopup)
				m.showPopup();
			else if (m.popupBoxObject)
				m.popupBoxObject.showPopup();
			else this.btn.click();
		}
		else this.btn.click();
	}
	close(){
		if (this.ppm) {
			if (this.ppm.hidePopup)
				this.ppm.hidePopup();
			else if (this.ppm.popupBoxObject)
				this.ppm.popupBoxObject.hidePopup();
		}
	}
}
let menuActContainer = [
	new class extends MenuAct{//处理白名单
		_isButton(e) {
			this.idx = e.hasAttribute('id') ?
				whiteIDs.findIndex(k => k.id === e.id) : -1;
			return this.idx !== -1;
		}
		getPopupMenu(e) {
			let id = whiteIDs[this.idx].popMemu;
			return id ? $(id) : super.getPopupMenu(e);
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
		open() {}//弹出动作为空从而禁止自动弹出，但可定时关闭菜单
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.localName === 'dropmarker';
		}
		close() {
			this.ppm.parentNode.closePopup();
		}
		open() {
			this.ppm.showPopup();
		}
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
			return e.hasAttribute('widget-id') &&
				e.getAttribute('widget-type') === 'view';
		}
		open() {
			this.btn.click();
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return e.getAttribute("anonid") === 'searchbar-search-button';
		}
		close() {
			BrowserSearch.SearchBar.textbox.closePopup();
		}
		open() {
			BrowserSearch.SearchBar.openSuggestionsPanel();
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			return /toolbarbutton|button/.test(e.localName) &&
				this.getPopupMenu(e);;
		}
	}(),
	new class extends MenuAct{
		_isButton(e) {
			try {
				return e.closest('toolbar') &&
				('image' === e.nodeName || e.src.startsWith('data:image')) &&
				this.getPopupMenu(e);
			} catch (ex) {
				return false;
			}
		}
	}(),
];
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
}
let btnManager = new class extends AutoPop {
	setTimer() {
		this.timer = setTimeout(() => {
			this.act.open();
			ppmManager.clean();
			ppmManager.act = clone(this.act);
			this.clean();
		}, nDelay);
	}
	mouseOver(e) {
		this.clean();
		//',[type^=autocomplete],.autocomplete-history-dropmarker'
		if (e.closest('menupopup,menulist,popupset') || e.disabled)
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
let ppmManager = new class extends AutoPop {//菜单管理
	inMenu(e) {
		let a = this.act;
		this.isMenu = a && ((a.ppm && a.ppm.contains(e)) ||
			e.closest('menupopup,menulist,popupset'));//',[type^=autocomplete],.autocomplete-history-dropmarker'
		return this.isMenu;
	}
	clean() {
		if (this.act) {
			this.act.close();
			super.clean();
		}
	}
	setTimer() {//定时器司职关闭菜单
		if (!this.timer) this.timer = setTimeout(() => {
			this.clean();
		}, nDelay);
	}
	mouseOver(e) {
		if (this.inMenu(e) || (this.act && e === this.act.btn)) {
			this.clearTimer();
			return;
		}
		if (this.act) this.setTimer();
	}
}();

function getPopupPos(elt) {
	let box, w, h,
	b = !1,
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
	if (!elt) return 'after_start';
	box = elt.boxObject;
	x = b ? (x <= w / 2 + box.screenX ? 1 : 3) :
			(y <= h / 2 + box.screenY ? 0 : 2);
	return ['after_start','end_before','before_start','start_before'][x];
}

var prevElt = null;
function mouseOver(ev) {
	if (!document.hasFocus()) {
		ppmManager.clean();
		return;
	}
	let elt = ev.target;
	if (elt === prevElt) return;
	prevElt = elt;
	btnManager.mouseOver(elt);
	ppmManager.mouseOver(elt);
}

window.addEventListener('mouseover', mouseOver, false);