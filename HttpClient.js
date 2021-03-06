var net = require('net');
module.exports = (function() {
    var http = {
        version: "1.0",
        port: 80,
        host: "127.0.0.1",
        regExp: /http[s]?:\/\/([\w\.]+)(?:\:([\d]*))?.*/,
        stExp: /(?:HTTP\/.*?\s+?(\d+))|(Location:(.*))/g,
        cookieExp: /(?:Set-Cookie:)(.*?)(?=;)/g,
        method: "GET",
        cookie: "",
        redirectTimes: 0,
        getHeader: function() {
            var header = this.method + " " + this.url.val + " HTTP/1.1\n" + 
                         "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\n" + 
                         "Host: " + http.host + ":" + http.port + "\n" + "Cache-Control: max-age=0\n" + 
                         "Connection: close\n" + "Accept-Language: zh-cn,zh;q=0.8\n" + 
                         "User-Agent: Mozilla/5.0 (Macintosh;Intel Mac OS X 10_8_0) AppleWebKit/537.36 (KHTML,like Gecko) Chrome/28.0.1500.95 Safari/537.36\n" + 
                         (http.cookie.trim() != "" ? "Cookie: " + http.cookie: "") + "\n\n";
            return header;
        },
        clear: function() {
            this.port = 80;
            this.host = "127.0.0.1";
            this.method = "GET";
            this.cookie = "";
            this.redirectTimes = 0;
        },
        url: {
            val: "",
            parse: function(url) {
                this.val = url;
                var matches = url.match(http.regExp);
                if (matches) {
                    matches[1] && (http.host = matches[1]);
                    matches[2] && (http.port = matches[2]);
                    return true;
                } else {
                    return false;
                }
            }
        },
        parseCookie: function(responseHeader) {
            var cookies = '',
            r;
            while ((r = http.cookieExp.exec(responseHeader)) != null) {
                cookies += r[1];
            }
            http.cookie = cookies;
        },
        createClient: function() {
            return {
                send: function(params, callback) {
                    var socket = new net.Socket();
                    socket.setEncoding("UTF-8");
                    socket.connect(http.port, http.host,
                    function() {
                        console.log("\n%s", "*****Request Header Start*****");
                        console.log(http.getHeader().trim());
                        console.log("%s\n", "*****Request Header End*****");
                        socket.write(http.getHeader());
                    });
                    var html = "";
                    socket.on('data',
                    function(data) {
                        html += data;
                    }).on('end',
                    function() {
                        socket.destroy();
                        var match = html.match(http.stExp);
                        if (match) {
                            var index = html.indexOf('\r\n\r\n');
                            var header = html.substring(0, index),
                            body = html.substring(index);
                            console.log("*****Response Header Start*****");
                            console.log(header);
                            var cookies = http.parseCookie(header);
                            console.log("%s\n", "*****Response Header End*****");
                            var status = match[0] && match[0].split(" ")[1],
                            location = match[1] && match[1].split(" ")[1];
                        }
                        if ((status == 302 || status == 301) && location) {
                            if (http.redirectTimes == 10) {
                                console.warn("\n%s", "Redirect too times!");
                                http.clear();
                                return;
                            }
                            http.redirectTimes++;
                            ep.request("GET", location, callback);
                            return;
                        }
                        callback(body);
                        http.clear();
                    }).on('error',function(e){
                        console.warn( "oops! Connection Error!" ) ;
					});
                    socket.setTimeout(10000,
                    function() {
                        console.log("Request time out!");
                        socket.destroy();
                        http.clear();
                    });
                }
            }
        }
    };
    var ep = {
        request: function(method, url, callback) {
            if (method === "GET") {
                this.get(url, callback);
            } else if (method === "POST") {
                this.post(url, callback);
            }
        },
        get: function(url, callback, method) {
            var correct = http.url.parse(url);
            if (!correct) {
                console.warn("URL is not correct!");
                return;
            }
            method && (http.method = method);
            var client = http.createClient();
            var params = {}
            client.send(params, callback);
        },
        post: function(url, callback) {
            http.url.parse(url);
            this.get(url, callback, "POST");
        }
    };
    return ep;
})();
