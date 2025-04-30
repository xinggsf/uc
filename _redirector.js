rules = [{
    name: "about:haoutil",                  // 规则名称
    from: "about:haoutil",                  // 需要重定向的地址
    to: "https://haoutil.googlecode.com",   // 目标地址
                                            // 支持函数(function(matches){}),返回必须是字符串
                                            // 参数 matches: 正则,匹配结果数组(match函数结果); 通配符,整个网址和(*)符号匹配结果组成的数组; 字符串,整个网址
    wildcard: false,                        // 可选，true 表示 from 是通配符, 默认 false
    regex: false,                           // 可选，true 表示 from 是正则表达式, 默认 false
    resp: false,                            // 可选，true 表示替换 response body, 默认 false
    decode: false,                          // 可选，true 表示尝试对 from 解码, 默认 false
    state: false                            // 可选，true 表示该条规则生效, 默认 true
},{
    name: "斗鱼小水管",
    from: "*.bytefcdnrd.com/live/*.flv?*",  // 通配符模式时，从字符串头开始处理，即转译成正则时添加 ^
    exclude: "00.flv?",                     // 可选，排除例外规则:可以是字符串或正则表达式
    to: "$1.bytefcdnrd.com/live/$2_900.flv?$3",
    wildcard: true,
    state: false
},{
    name: "google搜索结果禁止跳转",
    from: /^https:\/\/www\.google\.com\/url\?.*url=([^&]*)/,
    to: "$1",
    regex: true,
    state: true
}];