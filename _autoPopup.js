nDelay = 290;//延迟毫秒数
//禁止自动弹出的(按钮)黑名单。CSS语法: #表示id  .表示class
blackIDs = ['#back-button','#forward-button','#pocket-button','#alltabs-button']; //'.bookmark-item',
//by xinggsf, 白名单，及触发动作
whiteIDs = [
{//三道杠按钮、面板
	id : 'PanelUI-menu-button', //必填：按钮ID
	popMenu : 'PanelUI-popup', //菜单ID
	open: btn => PanelUI.show(),//要使用菜单DOM: $('PanelUI-popup')
	close: menu => PanelUI.hide(),
},
{//下载面板
	id : 'downloads-button',
	popMenu : 'downloadsPanel',
	open: btn => DownloadsPanel.showPanel(),
	close: menu => DownloadsPanel.hidePanel(),
},
{
	id : 'alertbox_tb_action',
	popMenu : 'alertbox_menu_panel',
	open : btn => btn.click(),
},
];