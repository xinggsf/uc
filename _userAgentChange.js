DISPLAY_TYPE =1; // 0显示列表为radiobox, 1显示为ua图标列表

SITE_LIST =[
	//直接可以看kankan视频，无需高清组件
	{url : /^http:\/\/vod\.kankan\.com\//, Name : "Safari"}, 
	{url : /^http:\/\/v\.huya\.com\/play\//, Name : "iPad2"},
	{url : /^http:\/\/www\.meipai\.com\/media\/\d+/, Name : "iPad2"},
	{url : /^http:\/\/wap\./, Name : "UCBrowser"}, //WAP用UC浏览器
],

UA_LIST=[
{name: "分隔线",},

    //伪装 IE8 - Windows7
    {  name: "IE8",//此处文字显示在右键菜单上，中文字符请转换成javascript编码，否则乱码(推荐http://rishida.net/tools/conversion/)
    ua: "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)",
    label: "IE8",//此处文字显示在状态栏上，如果你设置状态栏不显示图标
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABaklEQVQ4jb1SPUtDUQwtIiIdOok4ipMoOPh6EwcpRcTJQQpuIkWkuBQKVrC+l4sODp2cREp/gYiIo5OTSAdHcXSyfrT3JYt0kKKDSN99/bAuBs6UnOQkOZHIf8RM/mUUPF5RHqcwa2J9kdA1c0iSR+Jz1PKBWipInEOSkpOpRrsSnUJ9ErTcopbPIEBLE4jL6JklcGvxzlMLZgq1mDA5hFe18zbWgb4/gJrvWoX8BMTrjuvPK+Ij0NL8ySnigzZ63ONkcJKzJ7OWOpLjQN5Mr94PWQ2A5DBQ0ADyizb4ousAJ1ONgpbaL7tbUJ4sBuTxRqjAqF2Z6IXx9ONwQD6fAcmV9TbPX7ZvwBq1VFBLBUhO7f0133wbhy9bf+d3IL+oiNNAcmo1J9m0/09SUi4nnO3qCGp56LU7EJfbDZQ1MSTOKfLXlMsJIDlBLY2QE5+B/K0OBuocmDUx8GRBeZyKu3WIJK8H+yb/Jb4Ar9hPAAb57PoAAAAASUVORK5CYII="},
    {name: "分隔线",},

    //伪装 Apple iPad 2
    {  name: "iPad2",
    ua: "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25",
    label : "Apple iPad 2",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACuUlEQVQ4jY3Pz0+SARwGcA5MkSFgsMBCnS1735f35fVFYWLhNBF6BVEEAiaggKAkmpK/IpzadDXz0Ja1VjMX4eaYqw5tdXDTNsdaW4dWm1un1ur/eLrUJTj0bN/j97PnEQj+xGw2D2s09cW6uvrjhobGY4KgipzeUOzouFzk+b6ixxsoDo+Mfognkh9nZhbcgn9D0fReRaUIYkkNJDIllKp6NDYxYFvacbHDiit2Nzy+MIKhKMaTk49KAC3DFEQSBfQGHsb2fphtPlicw+gZjMEVnMToVAZj6XV4/BFEo/EnpYCWKVRJVTBZg+h2X4N1cAS9vjH4U4uIzq0iPruGicwmbE4//IFQKUBpmYJEUYd21wRaB6fAR+bQn1zC0PQDxOYfI7S0jejyNi71DMDhGCidQFHaQs2Z87AmVmFJ3YMrvQlfZguh7A5iKzkE7u4ieOcFDF0OdHZaygOaCyzGVx5geuMZUg9fI/30LRaeHyCTP0R29xDZ/AFau3phNJrKAzpDG+7vvsLOmyO8PP6Md5++4fDLd7w/+Ymjk184+PoDXbwTDMOVAiSp3W/WkdhYv4nl7DyWbi0gEQ0jlYxjMZ3C9dQ4hoN+nK2tBUXT5QG1+jQcdhvsfXZ4vC64XA74fAPwePvhcvfBauuGUqkAQVClAEFq91VqFXinA31eL9yhEAaGgrgaiWIoMYbAaBzucBhqjQYEQZQHqsQS1J9rQiOhRRPDgeQMoPRG0AYTaKMJVEsbquU15QGKogqVoioYIrPonlrG6PwaYnO3kZxNIDYZQWasFzciFoiqxOUn0DS9JxQKIZHKUC2TQyaX45RCCYVCAZlcDplMCpm0GkKhECRJbpUAPM93sRyX0+ma8wzL5hiGyXOcPsdx+hzD6PIMw+ZYlsuxLJdzOp2mcg0qBAKB+P+Orvj79xu+Qj/xKTUSxAAAAABJRU5ErkJggg=="},
    {name: "分隔线",},

    // 伪装 Nokia E72
    { name: "Nokia",
    ua: "Mozilla/5.0 (SymbianOS/9.3; Series60/3.2 NokiaE72-1/021.021; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.1.16352",
    label: "Nokia",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC/UlEQVQ4jaXTTUzTdwDG8e6ymO0wjdE5rPZf+f/+f0p9x2haeVkt4EsDCMqLOkAgWFGIOxg1MwozzrEpFCxvFYpS0FCoSGs0S8BNtxBFUEzIdBU06RZC0gU1btnFw9db1cRdtsNzeC6f0/NogA/+TzRvF9fAk0/sLSMlOTVD7rRTt4YtlTeC1sofgylVP41lnxnq3e28c8Decke8F+j5JRRnOTrwq1oWINruR7b7UfcFEGUB1LIAyl4/8l4/5kM/zGw9eTP/HSAUejHHVjkQXFzow2jvR190Gbm4D32RD22+F6nQR8yeKxjt/ailfawqv/oq88SgKQIcbBku0X/hxVDsQ93dQ0H1ILYjVyn8bpC26w8pd95CLvBiKO7FUOIjpqiXdeX+zgiws2rw/JK8SxgKupFyPNx/+JS//n5JeCbM71NTwD80+O4i5XSh5nej5ncTV+p7FAE+3+8bETmdqHldSJnnGR6f5PnLZ2yuuMiCTY10XhshPBMmdocHJfciSm4XKwovTUWAVbs8E0rWBWK2dyCltTL26ClXbtxnfmozC21uDpy+znR4muV57chZHajbOjDmembeANnuCTXDjZrhRtrUzOh4EE//baKSm9FudFFxKkDojxBLs84h0tyIDDexWe1vgOXpzjHZ1opic6FLdnJ7dJz23p9ZaHGitTay/+s+Hk8+Zml6M/JmF8LmIja9bToCGCxVXpHqQkltYlFSHXdHH+Dpucln8XVoE+upON7Dk8nfMG5xEm1tQk5pwrilJRgB5kXbKmJSWhGWsyxJdFB68ALZ9lZ0CXXok85iyW6g/CsP6gYHssWJYm1CWV/ljQAazSydMJ/8UyQ1IBJq0a6pRrv2e0SCA5HgQDKdISquGjm+FpFYj5pUz3x528Z3pvzRbDUjet03z9X4RpT19cgmB4qpBsVUgzDXIsx1qPENCHMNn+ozj773TJoP5xrmRCV/qzXuG9KtOByUVh8LSauPh3Qrj0wsWvblvXm6rY2zPl5s/dc3/pe8BiACa2LAfOYnAAAAAElFTkSuQmCC"},
    {name: "分隔线",},

    //伪装 iPhone，查询http://www.zytrax.com/tech/web/mobile_ids.html
    {  name: "iPhone",
    ua: "Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_1_2 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7D11 Safari/528.16",
    label: "iPhone",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACmElEQVQ4jZWSXUiTARiFTyNKVMKQQrqJakSi0aDMyn6pTNefWa6ay234k9lmhRazZk43i6I0TJlYuZkrwxKLqZQkEoNKZk2zb1if2ZxmeNGFREhInC66sknYgffuPQ+HwwFmoE1pt9cujLPYAEhm8j9F6ReebFaXtE+ErK8YAzDnvwHqQmfnFt1TQnbdPaMEUSlVoTmWxxvkmqoIAFijtH+aE2f7GRyty5Ymmub9yyvJq3phKKp1fzff6WZR9avJM1c7rTGq+57UorbxwltuGipdkydKntRJY/WBIH1Zh9FY30tTXR/N9e9pcQi01L9nsUPgxXqB52t6eLbSzdNXOxiZeK15ilmmKQ87Ze36kX9XoNHhZUnjR5qbRJofiTQ1irzg6Gd+TR/15V2UpdjGEL51xRSA0uiUZ1S/5Umbl/kNH3n+8SCNLT4anT4WNH9mXoPIkzUC1ZdfUhJ59lxAfEVhq0Jx08O0Gi+z7g5Q1zTEXOcIc50j1DX7mXVvkGnWfh4sfk0sz0sKAMRmNW7ccaWbeyu8PFQ9QKXDT1XjFx57OMrUB1+osA0xqUJkosnDpfvs5YH9bzWFhmie/1xW8I6brojcafUzoXaUCfav3FU7yp3WYcaWDnBRpofY1jqBVWXxAYxg1bNWZL4h1AKD9Z8YbvBzgXGE8wuGOTfXR2g/EId7CbmLWGv/hZCYiCmAsKPOpFnpbiLDS6QPENk+Isf/5477CK1IHOkjElzE6sphTDNrSZDS5Ua2QGSIhGaQ0PgI7RCh/UyoROJAL7GlhZDqTwf2ACB094PoWSkvv0EtEMlvie1t44jv+Ib9ArGnh9jWTkQZ6wDMnhYAAIgySLHuRimWHFcBmAcgCCtNcsgulWKxJvlv82+U/lYlYeHqeAAAAABJRU5ErkJggg=="},
    {name: "分隔线",},

    //伪装 Opera 10.60
    {  name: "Opera",
    ua: "Opera/9.80 (Windows NT 6.1; U) Presto/2.6.30 Version/10.60",
    label: "Opera",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACEElEQVQ4jY2SPWhTURiGnxsuSQhBxFxCaAi0GRTlTjaYwdAMuXRI1VEcLqn/FYdC5VKapbRUzRI6FESig25iQYtCVEiNwR/IDxQsKKRTrIV0KnQMpXwdPEINSfGFjwPnPd/7/ZwXesMF+IDjKnzq7r/gi4B5C+YXgsGVhWBw5QbMhuCMEjoSx8bgynI83m5ls7KTz8tOPi+tbFaW4/F2Gi4D/n7J7hEYfZdM7m47jrQdRz6l03uVdHqv7Tiy7ThSTCZ3E2AB7l4CoaXBwW8t25ZN25ZyKtU5DzcTcLucSnU2bVtati1LQ0NfgFB3sj4Co+VYTDYsS5qWJffD4SIwAAw8DIeLTcuSDcuS1eHhfdWFfljAO+F2zzdMU9ZNU6qmKRmXa0YtzZdxuWaqiqubpkzo+izgPSzgn/J4ClXDkJphyPtAQMbAVrO6L0DmQyAgNcOQqmHIlMdT6F6mfxIeVzRNPmuavNE0uQhX/wpcgutvFVfRNJmER90C3mvglEC+gnwEuQMP1CP/XciVFbcKkoF73SPoJ+HcK+jUQeogT6AGRIHoU2g0QBogr6EThRg9nGnMwcvvID9A1kByUMhBYQ3kJ8g6yBy8AE708oEeAfMZNFsgv0F+qdhS53NoRsDs/sJ/dnEKYotQqqvErT+t7y9C6TSc7Z69F9xAKAHWOEyPw7QyTog+Fu4HXVXzHtXyARjCxvwhp3ZcAAAAAElFTkSuQmCC"},
    {name: "分隔线",},

    //伪装 Safari - Mac OS X
   {  name: "Safari",
    ua: "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10_5_8; ja-jp) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16",
    label: "Safari",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADNUlEQVQ4jX2TbUhTexzH/0ziVnoXWPhC6AFuDSHrQkaBUUjC4RZZIGYQJJHeGhIuY4TCynphRZAvbqRWNI+ttYbHTnOaWzqXuQd3trWdPelpc7bVsrH5kOYLifG9L3ogsPq8/fH9fX/8+H4JWY6IECIuLS2VyGSyfXK5vISiqAJCiPjr7LfkaDSaCjc/ZgqMxxY8Y+9g4+Ow89EFx6vgMMMwlYSQnJ8q8/Pz1426PB1WX/xzjzUCi2cSQ84IVP1B0L0BdPT68YKPZTi3VyWRSNYtcx51eTqMrjd4Yp8EY41CbfSjayiEVl0A/7F+3GR8oNs6QQ/4MMLx6h8vEWm12kqz581nxjaJB8NRdL6M4pY+BO9EGs2MH1e0PNhLdWhqvIa6zle4oQtkDAZD1befiEecfnObUUDrYBi3BiJo6RPQ8kxA+MM82voDGL5wBPeqDuAkzePEHS+O33ZDbxcchBAxoSiqQGsKLpxXOiFX8zit8kHRPQ65NoSSxh64aneAq1iP+k476tkwmh4JuPs8DpU1tlRdXV1IGhoaSi4/cEJSxSK78gnWnjGiiX2Nvy7aYGQZ8HV7UXezAyPxWdQMvsXfF13YeoHDv2wE7e3tB4lCodh/tsWOZlUQx65zaDG/RU9oGjpfEkI4jLOtWtRbEigbTGBXfwJ/KidAbgso10W/LCgrKytQ0O7F8mYOWxQOrG724igThTck4FK3FVc9SdS6UjjmSGPnixRWdr0HeRjDOWtiSSqVFhJCiPi+yW8VNdqRdcOPjcoIum0BFN4dxXrdFGzJRWwYSGMPN4sixxzEhjT+ePoej4Nxd25urpgQQkR6vf74P5rXmaw2AacYN/LoALJ7U8gxTqN8eAZr+qax27uALc55ZA/NoIJLZSwWS82P0c7p5fyabeoxbGImsMqQxgrTLFb2zaBcPYUiegqbXZ+Qx81jh30atvEJ9pv7d4qLi/P6PWNdB0aSmSxjCsQ8B5FpDhJ1EruezWCN/SMawnMZR3iSpSgq75dlMplMJ7Whd+7G0OxSVXAep4MfoU4sLpljSY/FYqlZ5vwTRIQQsVQqLVQqlYdomj4sk8m2fxUuq/P/nxMTfuJ9rdkAAAAASUVORK5CYII="},
    {name: "分隔线",},

    // 伪装 Chrome22.0.1219.0 - Windows7
    {  name: "Chrome",
    ua: "Mozilla/5.0 (Windows NT 6.1;) AppleWebKit/537.3 (KHTML, like Gecko) Chrome/22.0.1219.0 Safari/537.3",
    label: "Chrome",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACwUlEQVQ4jY2TW0iTYRzGP7xYTVMGolSmTl2e3ZLpDp5zh286pTxhURBYqUhXBtFFiXYTlTWWyjpIFpGSTqeiW0mkmUHDGTtoMYa6uWY5kRL5QvqEpwt1IKj0wHP3Pr+X9/9/XoLYX35b/n+ZsvgRC+VylffCaftKdRm9crGE/lFZYHcpc1QmflLEvuGZVF6VR5JB/SzOh7dMDm+FAt4yOZaK87Eoy4JbnEbZEhOrdg2bo6OrXDwu3EI+PFlCLOaJsZifAU+eGJ4sAdwCPhZ4XDjjEmAOj9wJEWlE7CfnU6k5Thyc8YlwJSdjgceFWyyCO1sIlyAJLn48nLxYOFM4mEuJpkZFLLYPIOuRqMu1MhgTOJhjH4fzRDq+dvZDZ/yO/kkPHNO9WPkQg9UJFihjINanArDy6YDaN2myX+YoMijQeE0A27EofHmuxaWnVlQ/m0FNxwwut1vhsHdiw8r0eW3yoGN7QwzFgIxW6hUoHiLRl8vFHd00lHeNKFWZUKoyQXnPCNXQN9C2EGxYmaAtTKxP+tMEQTAIgiAYZJ+UVuoVKDIoUPuIxI2uKQgaxpDZNI7MpnEIG8ZwS2sBbQv1AajPgT6An+SVZLZwiITSsAlRj/YgoV6H2PpBxNYPIvFqP4ymdl/4rzkAy+9Zs76S5Why2gr6SCj1m5DKkXLcH+lCTYseta0GPDR04pc5HLSFCdrijz9GFmZ7Q9p8W0iqS+JIO6RUgY6EcpjE9nMq3pagZOAUHhvitm7eDC8ZjlDdjUGcHV3gN6bXSTqkUGjlKBzcAg2TOKPLxepUENZNQVibCIZXH4aPLYfrdiujH+962pXs1pOU9IUUZJcc5Gs5Bg1x+D0aiuU3YXB2R1Lvmo/WEft9MPbZ2HjeTZFGcDt7/pw6g7a/jKGt7VHzEw/Ymubq4Pg9g7uIQRDEoS0z9jr0DywYmXah5y/TAAAAAElFTkSuQmCC"},
    {name: "分隔线",},

    // 伪装 Android Droid
    { name: "Android",
    ua: "Mozilla/5.0 (Linux; U; Android 2.0; en-us; Droid Build/ESD20) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
    label: "Android",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASElEQVQ4jWNgQANLjln+RxcjRg5D4apTrv+XHLNEwURrhtHomgkagq4JF6adAWQBdD8S6wI4e9SA/1gDdODTAbpCkhMQXQ0AAEsuZja4+pi7AAAAAElFTkSuQmCC"},
    {name: "分隔线",},

    //伪装 日本DoCoMo手机
    { name: "DoCoMo",
    ua: "DoCoMo/1.0/P502i/c10 (Google CHTML Proxy/1.0)",
    label: "DoCoMo",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAXElEQVQ4jWM4w2D8nxLMMGoAwoCXk1f+P8Ng/P//////X05c/v+2Zy5pBvz//598F7ycuPw/DMDY14xjUPjYaLgBMHDbMxcrfcsDuzhRLoApRKYxXDA4onEEGwAAOydBL6/POBgAAAAASUVORK5CYII="},
    {name: "分隔线",},

    //伪装 Google 爬虫
    { name: "Googlebot",
    ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    label:"Googlebot",
    img:       "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACg0lEQVQ4jWNgIADmNzBwEFKDAhoaGJiurzPyubVCduneCULNyxs4FIjWfGmZpcabXbrHrywSv72kms+CJJuvb7C0+rRX/ePxaYLHC0P5hJDlJhoby003MHDo1tTUaWBgYMLQfGSuodTn/ZqvL80TfNyTxiACE59namq1QlPj+DI52f/LxMX+r5SU+L9ISurmBFFROxQDXuzSm/15h9j/NQ18MTCx+YZ6EYukpX43cnIeLWRnzyji4Eho4uZePpuH9+8ifr7vrVxcRgwMDAwMDg4MLB/3qHy8t0LgZ0MaAxcDAwPDRG1tuUXSUl/L2Nl7GRgYmNQijUUUogwMGBgYGGzkfYp6RZT+T+PiOsrAwMDAoJ1gKnFijfL/BysE3sJsnyMvX9LJzXWWAepfvRxHP9lkvRKoNJOSWf39HkHp/ykMDDIMCg4KHK7VRr+fbBD5v7aBU4aBgYFhEh9fXQUHRxLMQINSp52i4WoVML6sY/9GW+30/3ksLFYMDAwMDDLpBlt963X+75gjMZ+BgYGhhI1NJ5mdXYWBgYHBvtKvSDnH7L+wu4wZzAAV9ynnhUw7/pvxaqgxMDAwMAiGK+vIZOp/1yw2/e9SYbXRusQ9zK7KN8y6xnetRpH1f7EAlcUwzSYBnWbyrjP+8+tV3EWJCeFgNReJRO3ncjlG/1WKLP6rFFr8l0rS/SvqqzSVQZuBjYGBgcHcs4FPx2/GVWGLrv/cqkkJGOmBwViKS8hHMUTYX6lCxFsxTcBCQgEu5dsgYhA086iYTf9/Xs3MxZia8QCz0MlOWj4zHgqbNv/lVU/vZmBwYCFKI592loqUZe1SCcuGh7zaubPZFIP1SLIZYhN+2wDQXLmCAAfloQAAAABJRU5ErkJggg=="},
    {name: "分隔线",},

    //伪装 UC 浏览器
    { name: "UcBrowser",
    ua: "NOKIA5700/ UCWEB7.0.2.37/28/999",
    label:"UcBrowser",
    img:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABFklEQVQ4jc2TsWoCQRCG9w0sgqX4CHZpfQrxGkOwC1jZKDY2NhIUUgTsghDBQgsLW21EqyuuEeGuMQge6+7tDcT6t7hweuqdB7GwGGaHYT6Y/59ljDFGRAjE7/72mwjs6nCMwdM6HBAz7gQQNlxjGmyaOmhjHevtGmrSgxp3QMv5GWC1AM8/gYTt7yiqWajRB4gIatIDf0lBfr7BGb5DtotngOU8HGAZ4FoS7mIUIaKphwKcfgO7UubSicgViI6Abg2i/HxDRFMHzyVAPyu/sStloMYduLMhuJYEWUa0jaKahWxqcI0pnK8K+Gvad0G2Ch5wNgCZupcv7kDYvsLOdz1o4Z8TslWAbGpe/8Eu8T+AyB8ZY/gAY1aTwt2Ru2IAAAAASUVORK5CYII="},
    {name: "分隔线",},

    //伪装 firefox10.0 - Windows7
    {  name: "firefox10.0",
    ua: "Mozilla/5.0 (Windows NT 6.1; rv:10.0.6) Gecko/20120716 Firefox/10.0.6",
    label: "firefox10.0",
    img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB4ElEQVQ4jY1Sv2sUURCeffvj1qy57ImIBAWRICISgvUhQUKwsBArSREklYWIhX/AWojFvZl3d3tHsMgfcEWqlEFSiKQIFhbB6rCwFLncvhlCEDmLaLxb34ED08zM982PbwAc9i2fmS+6tbrtpHeLbq1etGr1IVUvuGon7Hv73BWbz907MnPXx+N72XLA+cU16aQbA5Om/wAthc+4naxys7YIAMDNaLHozN4Yr5H86jxTtCMI/UIH9QkCQW+fNXxmUj0hf5vJ+5hloMqNCh3dFPTeC4LlvLr2l4BUXxBGY95nCu7bRnS7TPIlg5i190k0HA9MmgKbeKUEPnUNJ5bCp65bSXNmUxBGbOIVYPS3XASFiR5OOzZreCcII24lb4Ap7JXBbIKXQ6osuMADk6ZC3oEgjIT8bWDyd8sE1kSPAAD2MgjKkrKpvBANJ4IwYlQtsBS/cuz/U9D7IBq+CoJwM1wHAMgyUIyqcTYphuvAJllyHpGCA0a1dWTiswm4PfuEtXf4u8kP7iaXTxOONVh7h5aix3bz/KUhVReE/LcTeVK90oOAOCdxOCMMBya+NqktVh6IhuP/IBCmYNWpr5jwjqC3P7Uz+btWR7em/ceYVMmSRfWcUTUsqdeC/kZZzj/2C7Xqd/NLI9L5AAAAAElFTkSuQmCC" },
    {name: "分隔线",},
]
