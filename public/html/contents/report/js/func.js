function in_arr_key(arr,key, obj) {
    for(i in arr) {
        if (arr[i][key] == obj) return true;
    }
}
function send_query(params,callback,url,complite){
    if (typeof params != "object") return false;
    var p_xml = "<query>";
    if (params.sid != undefined){
        p_xml += "<sid>"+params.sid+"</sid>"
    }
    if (params.command == undefined) return false;
    p_xml += "<command>"+params.command+"</command>";
    if (params.object != undefined){
        p_xml += "<object>"+params.object+"</object>";

    }
    if (typeof params.params == "object"){
        for(var key in params.params){
            p_xml += "<"+key+">"+params.params[key]+"</"+key+">"
        }
    }
    p_xml += "</query>";
    //log("/cgi-bin/b2c"+"?p_xml="+p_xml);
    if(url == undefined)
        url = "/cgi-bin/b2c";
    $.get(url,{p_xml:p_xml},function(data){
        if(+$(data).find("result").find('rc').text()==-2) {
            logout();
            return;
        }

        if (typeof callback != "function") return data;
        callback(data);
    }).complete(function(data){
            if (complite != undefined)
                callback(data.responseText);
        });
    return true;
}
function xmlToObject(xml,rows_name,fields) {
    var obj = {};
    $(xml).find(rows_name).each(function(index) {
        obj[index] = {};
        if(fields==undefined){
            $(this).find("*").each(function(){
                var key = this.tagName;
                var val = $(this).text();
                if(key!=undefined){
                    obj[index][key]=val;
                }
            });
        }
        else {
            for (var key in fields){
                obj[index][fields[key]] = $(this).find(fields[key]).text();
            }
        }
        
    });
    return obj;
}
function GET(){
  var $_GET = {};
  document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
    function decode(s) {
      return decodeURIComponent(s.split("+").join(" "));
    }
    $_GET[decode(arguments[1])] = decode(arguments[2]);
  });
  return $_GET;
}