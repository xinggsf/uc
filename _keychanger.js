//修改自Firefox 自定义快捷 RunningCheese 版 for 90+
// 函数内 this 即chrome窗口

//F1-12键 ----------------------------------------------------------------------------------------------
// 上一个标签页 (内置命令演示)
keys['F2'] = {
    oncommand: "internal",
    params: ['tab','prev']
};
// 下一个标签页
keys['F3'] = {
    oncommand: "internal",
    params: ['tab','next']
    /*
    gBrowser.getFindBar().then(findBar => {
        if (findBar.getAttribute('hidden')) {
            gBrowser.tabContainer.advanceSelectedTab(1, true);
        } else {
            findBar.getElement('find-next').doCommand();
        }
    }); */
};
keys['F4'] = {//克隆当前标签
    oncommand: "internal",
    params: ['tab','duplicate']
};
//keys['F7'] =""; // 原生功能：启用浏览光标
keys['F8'] = function(e) { //编辑当前页面
    KeyChanger.loadURI("javascript:document.body.contentEditable='true';document.designMode='on';void%200");
};
//keys['F9'] = function() {};// 原生功能：进入阅读模式
keys['F10'] = function() { //解除网页限制
    KeyChanger.loadURI("javascript:(function(bookmarklets)%7Bfor(var%20i=0;i%3Cbookmarklets.length;i++)%7Bvar%20code=bookmarklets%5Bi%5D.url;if(code.indexOf(%22javascript:%22)!=-1)%7Bcode=code.replace(%22javascript:%22,%22%22);eval(code)%7Delse%7Bcode=code.replace(/%5Es+%7Cs+$/g,%22%22);if(code.length%3E0)%7Bwindow.open(code)%7D%7D%7D%7D)(%5B%7Btitle:%22%E7%A0%B4%E9%99%A4%E5%8F%B3%E9%94%AE%E8%8F%9C%E5%8D%95%E9%99%90%E5%88%B6%22,url:%22javascript:function%20applyWin(a)%7Bif(typeof%20a.__nnANTImm__===%5Cx22undefined%5Cx22)%7Ba.__nnANTImm__=%7B%7D;a.__nnANTImm__.evts=%5B%5Cx22mousedown%5Cx22,%5Cx22mousemove%5Cx22,%5Cx22copy%5Cx22,%5Cx22contextmenu%5Cx22%5D;a.__nnANTImm__.initANTI=function()%7Ba.__nnantiflag__=true;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.addEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__)%7D;a.__nnANTImm__.clearANTI=function()%7Bdelete%20a.__nnantiflag__;a.__nnANTImm__.evts.forEach(function(c,b,d)%7Ba.removeEventListener(c,this.fnANTI,true)%7D,a.__nnANTImm__);delete%20a.__nnANTImm__%7D;a.__nnANTImm__.fnANTI=function(b)%7Bb.stopPropagation();return%20true%7D;a.addEventListener(%5Cx22unload%5Cx22,function(b)%7Ba.removeEventListener(%5Cx22unload%5Cx22,arguments.callee,false);if(a.__nnantiflag__===true)%7Ba.__nnANTImm__.clearANTI()%7D%7D,false)%7Da.__nnantiflag__===true?a.__nnANTImm__.clearANTI():a.__nnANTImm__.initANTI()%7DapplyWin(top);var%20fs=top.document.querySelectorAll(%5Cx22frame,%20iframe%5Cx22);for(var%20i=0,len=fs.length;i%3Clen;i++)%7Bvar%20win=fs%5Bi%5D.contentWindow;try%7Bwin.document%7Dcatch(ex)%7Bcontinue%7DapplyWin(fs%5Bi%5D.contentWindow)%7D;void%200;%22%7D,%7Btitle:%22%E7%A0%B4%E9%99%A4%E9%80%89%E6%8B%A9%E5%A4%8D%E5%88%B6%E9%99%90%E5%88%B6%22,url:%22javascript:(function()%7Bvar%20doc=document;var%20bd=doc.body;bd.onselectstart=bd.oncopy=bd.onpaste=bd.onkeydown=bd.oncontextmenu=bd.onmousemove=bd.onselectstart=bd.ondragstart=doc.onselectstart=doc.oncopy=doc.onpaste=doc.onkeydown=doc.oncontextmenu=null;doc.onselectstart=doc.oncontextmenu=doc.onmousedown=doc.onkeydown=function%20()%7Breturn%20true;%7D;with(document.wrappedJSObject%7C%7Cdocument)%7Bonmouseup=null;onmousedown=null;oncontextmenu=null;%7Dvar%20arAllElements=document.getElementsByTagName(%5Cx27*%5Cx27);for(var%20i=arAllElements.length-1;i%3E=0;i--)%7Bvar%20elmOne=arAllElements;with(elmOne.wrappedJSObject%7C%7CelmOne)%7Bonmouseup=null;onmousedown=null;%7D%7Dvar%20head=document.getElementsByTagName(%5Cx27head%5Cx27)%5B0%5D;if(head)%7Bvar%20style=document.createElement(%5Cx27style%5Cx27);style.type=%5Cx27text/css%5Cx27;style.innerHTML=%5Cx22html,*%7B-moz-user-select:auto!important;%7D%5Cx22;head.appendChild(style);%7Dvoid(0);%7D)();%22%7D%5D)");
};

//Shift 组合键
keys['Shift+F1'] = function(event) {//打开调试窗口
    if (!document.getElementById('menu_browserToolbox')) {
        let { require } = ChromeUtils.import("resource://devtools/shared/loader/Loader.jsm", {});
        require("devtools/client/framework/devtools-browser");
    };
    document.getElementById('menu_browserToolbox').click();
};

//Alt 组合键------------------------------------------------------------------------------------------------------
keys["Alt+F1"] = {//关闭当前标签页
    oncommand: "internal",
    params: ['tab','close','current']
};
keys["Alt+F2"] = {//关闭右侧所有标签页
    oncommand: "internal",
    params: ['tab','close','toEnd']
};
keys["Alt+F3"] = {//关闭其他标签页
    oncommand: "internal",
    params: ['tab','close','other']
};

keys['Alt+F'] = function() { //显示或隐藏书签栏，自带按键 Ctrl+Shift+B，FX占用
    var bar = document.getElementById("PersonalToolbar");
    bar.collapsed = !bar.collapsed;
};
keys['Alt+G'] = function({target}) { //Google站内搜索
    let sel = KeyChanger.getSelectedText();
    if (!sel.length) {
        const title = Services.locale.appLocaleAsBCP47.startsWith("zh-") ? '请输入搜索的关键词:' : 'Please input keyword:';
        sel = prompt(title, '');
    }
    if (sel) {
        let url = encodeURIComponent(gBrowser.currentURI.host);
        url = `https://www.google.com/search?q=site:${url} ${sel}`;
        KeyChanger.openCommand(url);
    }
};
keys['Alt+N'] = function(event) {//bing站内搜索
    let sel = KeyChanger.getSelectedText();
    if (!sel.length) {
        sel = prompt(Services.locale.appLocaleAsBCP47.startsWith("zh-") ? '请输入搜索的关键词:' : 'Please input keyword:', '');
    }
    if (sel) {
        let url = encodeURIComponent(gBrowser.currentURI.host);
        url = `https://cn.bing.com/search?q=site:${url} ${sel}`;
        KeyChanger.openCommand(url);
    }
};
keys['Alt+I'] = function() { //查看页面信息
    // BrowserPageInfo();
    BrowserCommands.pageInfo();
};
keys['Alt+Z'] = { //恢复关闭标签页
    oncommand: "internal",
    params: ['tab','undo']
};
keys['Ctrl+Alt+V'] = function(e) { //打开剪切板地址
    let url = readFromClipboard();
    try {
        switchToTabHavingURI(url, true);
    } catch (ex) {
        url = decodeURIComponent(url);
        const reg = /\b\w[-\w]{0,66}(\.\w[-\w]{0,66}){1,8}\b/;
        if (reg.test(url)) {
            if (!/^https?:\/\//i.test(url)) url = 'http://'+ url;
        } else {
            url = 'https://cn.bing.com/search?q='+ url;
        }
        switchToTabHavingURI(url, true);
    }
    //e.preventDefault();
    //e.stopPropagation();
};
keys['Ctrl+Alt+C'] = function() { //复制当前网页 Markdown 链接
    const url = gBrowser.currentURI.spec;
    const title = gBrowser.contentTitle;
    KeyChanger.copy(`[${title}](${url})`);
};
keys['Ctrl+Shift+Alt+C'] = function() { //复制所有标签页 Markdown 链接
    const txt = gBrowser.tabs.map(function(tab) {
        const url = gBrowser.getBrowserForTab(tab).currentURI.spec;
        return `[${tab.label}](${url})`;
    }).join('\n');
    KeyChanger.copy(txt);
};
//Ctrl+Shift 组合键 --------------------------------------------------------------------------------------------------------
keys['Ctrl+Shift+F5'] = { //刷新所有标签页
    oncommand: "internal",
    params: ['tab','reload','all']
};
//keys['Ctrl+Shift+A'] = 原生快捷键：打开附加组件栏
//keys['Ctrl+Shift+S'] = 原生快捷键：打开火狐自带的截图功能
//keys['Ctrl+Shift+D'] = 原生快捷键：保存当前所有标签
// keys['Ctrl+Shift+N'] = function () {
//     document.getElementById("Tools:PrivateBrowsing").doCommand();
// };

//Ctrl+Alt 组合键 ---------------------------------------------------------------------------------------------------------------
keys['Ctrl+Alt+P'] = { // 固定标签页
    oncommand: "internal",
    params: ['tab','toggle-pin','current']
};
keys['Ctrl+Shift+Q'] = (event) => {
    if (event.target.ownerGlobal === window) {
        console.log(KeyChanger.getSelectedText());
    }
};