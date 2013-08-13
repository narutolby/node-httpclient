var HttpClient= require('./HttpClient.js');
  var url = process.argv[2];
  if(!url){
    console.warn("请输入URL!");
	return;
  }
  HttpClient.request("GET",process.argv[2],function(data){
	   console.log(data);
  });
