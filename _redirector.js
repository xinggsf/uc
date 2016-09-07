rules = [
/*
 	{
		name : "about:haoutil", // 规则名称
		from : "about:haoutil", // 需要重定向的地址
		to : "https://code.google.com/p/haoutil/", // 目标地址
		wildcard : false, // 可选，true 表示 from 是通配符
		regex : false, // 可选，true 表示 from 是正则表达式
		resp : false, // 可选，true 表示替换 response body
		state : false, // 可选，true 表示该条规则生效
		decode : false, // 可选，true 表示尝试对 from 解码 http://opengg.guodafanli.com/adkiller/sohu_live.swf
	}, */
	{
		name : "swf >> 本地",
		from : 'http://opengg.guodafanli.com/adkiller/*',
		to : "file:///D:/swf/$1",
		resp : true,
		state : !1,
		wildcard : true
	}, {
		name : "youku player",
		from : /^http:\/\/static\.youku\.com\/v.+(?:play|load)er.*\.swf/,
		to : "file:///D:/swf/player.swf",
		resp : true,
		regex : true
	}, {
		name : "sohu player",
		from : "http://tv.sohu.com/upload/swf/*/Main.swf",
		to : "file:///D:/swf/sohu_live.swf",
		resp : true,
		state : !1,
		wildcard : true
	}, {
		name : "跳过google搜索结果重定向",
		from : /^https?:\/\/www\.google(?:\.\w+)+\/url\?.*?&url=([^&]+)/,
		to : "$1",
		decode : true,
		regex : true
	}, {
		name : "【https】Google快照",
		from : /^http:\/\/(\w+\.googleusercontent\.com\/.+)$/i,
		to : "https://$1",
		regex : true
	}, {
		name : "gg >> HK",
		from : /^https?:\/\/www\.google\.\w+\/(.*)/,
		to : "https://www.google.com.hk/$1",
		regex : true
	}, {
		name : "新浪",
		from : "http://www.sina.com/",
		to : "http://www.sina.com.cn/",
		wildcard : true
	}, {
		name : "推特",
		from : /^https?:\/\/www\.twitter\.com\/(.*)/,
		to : "https://twitter.com/$1",
		regex : true
	}, {
		name : "163 mail免验证",
		from : /^http:\/\/msas\.mail\.163\.com\/msas\/vcode\/showvcode\.do\?uid=.+?&returl=(.+)/,
		to : "$1",
		decode : true,
		state : false,
		regex : true
	}, {
		name : "贴吧-->旧版",
		from : /(^http:\/\/tieba\.baidu\.com\/f\?(?:ie=utf-?8&)?kw=[^&]+$)/,
		to : "$1&tp=2",
		regex : true
	}, {
		name : "贴吧帖子",
		from : /(^http:\/\/tieba\.baidu\.com\/p\/\d+$)/,
		to : "$1?tp=2",
		regex : true
	}, {
		name : "贴吧帖子翻页",
		from : /(^http:\/\/tieba\.baidu\.com\/p\/\d+\?pn=\d+$)/,
		to : "$1&tp=2",
		regex : true
	}, {
		name : "音悦台自动跳html5播放",
		from : /^http:\/\/(?:v|www)\.yinyuetai\.com\/video\/(\d+)/,
		to : "http://v.yinyuetai.com/video/h5/$1",
		regex : true
	}, {
		name : "防百度诈骗",
		from : "http://www.badu.com/*",
		to : "http://www.baidu.com/",
		wildcard : true
	},
	//Google服務轉國內鏡像
	{
		name : "ajax|fonts(http) >> useso",
		from : /^http:\/\/(ajax|fonts)\.googleapis\.com\/(.*)$/,
		to : "http://$1.useso.com/$2",
		regex : true
	}, {
		//参考：https://servers.ustclug.org/2014/06/blog-googlefonts-speedup/
		name : "ajax|fonts(https) >> 科大",
		from : /^https:\/\/(ajax|fonts)\.googleapis\.com\/(.*)$/,
		to : "https://$1.lug.ustc.edu.cn/$2",
		regex : true
	}, {
		name : "themes >> 科大",
		from : /^https?:\/\/themes\.googleusercontent\.com\/(.*)$/,
		to : "https://google-themes.lug.ustc.edu.cn/$1",
		regex : true
	}, {
		name : "fonts-gstatic >> 科大",
		from : /^https?:\/\/fonts\.gstatic\.com\/(.*)$/,
		to : "https://fonts-gstatic.lug.ustc.edu.cn/$1",
		regex : true
	}, {
		name : "twitter.com/widgets.js >> github",
		from : /^https?:\/\/platform\.twitter\.com\/widgets.js(.*)/i,
		to : "https://raw.githubusercontent.com/dupontjoy/customization/master/twitter/widgets.js",
		regex : true
	}, {
		name : "apis.google.com/js/api.js和plusone.js >> github",
		from : /^https?:\/\/apis\.google\.com\/js\/(api\.js|plusone\.js)(.*)/i,
		to : "https://raw.githubusercontent.com/dupontjoy/customization/master/google/apis/$1",
		regex : true
	},
];
