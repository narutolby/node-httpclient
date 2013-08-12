var net = require('net');

module.exports= (function(){
	var http = {
		version : "1.0",
		port :  80,
	    host : "127.0.0.1",
	  regExp : /http[s]?:\/\/([\w\.]+)(?:\:([\d]*))?.*/,
	   stExp : /(?:HTTP\/.*?\s+?(\d+))|(Location:(.*))/g,
	  method : "GET",
	  getHeader : function(  ){
		 var header =  this.method + " " + this.url.val+ " HTTP/1.1\n"  
	     + "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\n"  
	     + "Accept-Encoding: gzip,deflate,sdch\n"
	     + "Host: " +  http.host + ":" + http.port + "\n"  
	     + "Cache-Control: max-age=0\n"
	     + "Connection: close\n"
	     + "Accept-Language: zh-cn,zh;q=0.8\n"  
	     + "User-Agent: Mozilla/5.0 (Macintosh;Intel Mac OS X 10_8_0) AppleWebKit/537.36 (KHTML,like Gecko) Chrome/28.0.1500.95 Safari/537.36\n\n";
	    return header;
	  },
	    url: {
			val : "",
            parse : function( url ){
				        this.val = url;
						var matches = url.match(http.regExp) ;
						if(matches){
							matches[1] && ( http.host = matches[1] );
							matches[2] && ( http.port = matches[2] );
							return true;
                        }else{
							return false;
						}
					}
		},
	  createClient : function(  ){
			   return {
                  send : function(params,callback){
							 var socket = new net.Socket( );
							 socket.setEncoding( "UTF-8" );
							 socket.connect(http.port,http.host,function(  ){
                             console.log("******************Request Header Start*******************");
							 console.log(http.getHeader());
                             console.log("%s\n","******************Request Header End*********************");
							 socket.write(http.getHeader());
							 });
							 socket.on('data',function(data){
								 var match = data.match(http.stExp);
								 if(match){
									 console.log("******************Response Header Start*******************");
									 var array = data.split('\r\n\r\n');  
									 var header = array[0],body = array[1];
									 console.log(header);
									 console.log("%s\n","******************Response Header End*********************");
									 var status = match[0] && match[0].split(" ")[1],
										location = match[1] && match[1].split(" ")[1];
								 }
							     if((status==302 || status==301) && location )  {
										 socket.destroy( );
                                         ep.request("GET",location,callback);
										 return;
								 }
								 if(body && body.trim( )=="") return;
								 //console.log("******************Response Body Start*******************");
								 if(match ){
									 callback(body);
								 }else{
                                     callback(data);
								 }
								 //console.log("******************Response Body End*********************");
							 });
							 socket.setTimeout(20000,function( ) {
								console.log("Request time out!") ;
								socket.destroy( );
							 });
						 }
			   }
					 }
	};
	var ep = {
		request : function ( method,url,callback )   {
					  if( method === "GET" ) {
						  this.get( url,callback );
					  }else if( method === "POST" ) {
						  this.post( url,callback );
					  }
				  },
	get : function(url,callback,method){
			 var correct = http.url.parse( url );
			 if(!correct){
                 console.warn("您输入的URL不正确!" );
				 return;
			 }
			 method && (http.method = method); 
		     var client = http.createClient( );
			 var params = {
			 }
			 client.send(params,callback);
		  },
	post : function(url,callback){
			   http.url.parse( url );
			   this.get(url,callback,"POST");
		   }
	};
	return ep;
})();
