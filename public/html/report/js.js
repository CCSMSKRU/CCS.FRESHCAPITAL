function in_arr_key(arr,key, obj) {
    for(i in arr) {
        if (arr[i][key] == obj) return true;
    }
}
function send_query(params,callback,url,complite){
    MB.Core.sendQuery(params,callback)
    // if (typeof params != "object") return false;
    // var p_xml = "<query>";
    // if (params.sid != undefined){
    //     p_xml += "<sid>"+params.sid+"</sid>"
    // }
    // if (params.command == undefined) return false;
    // p_xml += "<command>"+params.command+"</command>";
    // if (params.object != undefined){
    //     p_xml += "<object>"+params.object+"</object>";

    // }
    // if (typeof params.params == "object"){
    //     for(var key in params.params){
    //         p_xml += "<"+key+">"+params.params[key]+"</"+key+">"
    //     }
    // }
    // p_xml += "</query>";
    // //log("/cgi-bin/b2c"+"?p_xml="+p_xml);
    // if(url == undefined)
    //     url = "/cgi-bin/b2c";
    // $.get(url,{p_xml:p_xml},function(data){
    //     if(+$(data).find("result").find('rc').text()==-2) {
    //         logout();
    //         return;
    //     }

    //     if (typeof callback != "function") return data;
    //     callback(data);
    // }).complete(function(data){
    //         if (complite != undefined)
    //             callback(data.responseText);
    //     });
    // return true;
}

function parseResult(result){
    result = result['DATA'];
    return result;
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

function emptyObject(obj){
    for(var i in obj){
        return true
    }
    return false;
}

function log(obj){
    console.log(obj);
}

function thiDate(){
    log("GOAL")
    send_query({command:"sys_date"},function(result){
        $(".fromDate,.toDate").val();
    })
    
}


jsonToObj = function(obj){
    var obj_true = {};
    var objIndex = {};
    if(obj['DATA']!=undefined){
        for (i in obj['DATA']){
            for(var index in obj['NAMES']){
                if(obj_true[i] == undefined){obj_true[i] = {};}
                obj_true[i][obj['NAMES'][index]] = obj['DATA'][i][index];
            }
        }
    }
    else if(obj['data']!=undefined) {
        for (i in obj['data']){
            if(obj['names']!=undefined){
                for(var index in obj['names']){
                    if(obj_true[i] == undefined){obj_true[i] = {};}
                    obj_true[i][obj['names'][index]] = obj['data'][i][index];
                }
            }else if(obj['data_columns']!=undefined){
                for(var index in obj['data_columns']){
                    if(obj_true[i] == undefined){obj_true[i] = {};}
                    obj_true[i][obj['data_columns'][index]] = obj['data'][i][index];
                }
            }

        }
    }

    return obj_true;
};

