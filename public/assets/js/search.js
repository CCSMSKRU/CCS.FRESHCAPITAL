$(document).ready(function(){

    $("#FastSearch").select2({
        placeholder: "Поиск...",
        minimumInputLength: 2,
        ajax: {
            url: "/cgi-bin/b2e",
            dataType: "json",
            data: function (term) {
                var options = {
                    command: "get",
                    object: "main_search",
                    sid: MB.User.sid,
                    search_string:term
                    /*where:"upper(SEARCH_FIELD) like upper('|percent|"+term+"|percent|')"*/
                };
                return {request : MB.Core.makeQuery(options)};
            },
            results: function (data) {
                var obj = data;
                var res = [];
                for (var i in obj.results[0].data) {
                    o = {
                        // id: obj.results[0].data[i][0]+"||"+obj.results[0].data[i][3],
                        // text: obj.results[0].data[i][1] +' - '+ obj.results[0].data[i][2]
                        id: obj.results[0].data[i][obj.results[0].data_columns.indexOf("OBJ_ID")],
                        text: obj.results[0].data[i][obj.results[0].data_columns.indexOf("INFO")],
                        object: obj.results[0].data[i][obj.results[0].data_columns.indexOf("OPEN_FORM_CLIENT_OBJECT")]
                        
                    };
                    res.push(o);
                }
                MB.searchResult = res;
                return {results: res};
                /*
                var res = [];
                res.push({id: res.DATA[i][0], text: res.DATA[i][1]});
                */
                //return {results: data.movies};
                //return {results: MB.Table.parseforselect2data(data)};
            }
        }
    });

    $("#FastSearch").on("change", function(e) {
        console.log(e);
        // $(".sidebar-search").find(".select2-chosen").html("Search...");
        //var arr = e.val.split("||");
        // var sel2Data = $(this).select2('data');
        // console.info(sel2Data);
        // var arr = sel2Data.id.split('||');
        // var id = arr[0];
        // var formName = arr[1];
        var id = e.added.id;
        var name = e.added.object;

        // alert(formName);
        MB.Core.switchModal({ 
            type: "form",
            isNewModal: true,
            ids: [id],
            name: name
            // params:{
            //     where: "ORDER_TICKET_ID = "+id
            // }
        });
    });
/*
    $("#FastSearch").change(function () {
        var data = $("#e8").select2("data");
        log(data)
    });
*/

    
//    $(".sidebar-search").find("")

    // $("#e8").select2("val");


    /*
    $("div.sidebar-search input").keyup(function(e){
        if(e.keyCode == 13){
            var val = $(this).val();
            MB.Core.sendQuery({command:"get",object:"main_search",sid:MB.User.sid,params:{where:"obj_id like '|percent|"+val+"|percent|'"}},function(result){
                var obj = MB.Core.jsonToObj(result);
                var html = '';
                for(var i in obj){
                    html+= ''+
                    '<div>'+
                        '<span>'+obj[i]['OBJ_ID']+'</span>'+
                        '<span>'+obj[i]['OBJ_TYPE_RU']+'</span>'+
                        '<span>'+obj[i]['INFO']+'</span>'+
                    '</div>';
                }
                $(".searchResult").html(html);
            });

            App.init();
            FormEditable.init();
        }
    });
        */
        /*
        if(e.keyCode == 13){
            var val = $(this).val();
            $("div.sidebar-search input").select2({
                placeholder: val,
                minimumInputLength: 1,
                ajax: {
                    url: "/cgi-bin/b2cJ",
                    dataType: "json",
                    data: function (term, page) {
                        var options = {
                            command: "get",
                            object: "main_search",
                            sid: MB.User.sid,
                            where:"obj_id like '|percent|"+val+"|percent|'"
                        };
                        return {p_xml: MB.Core.makeQuery(options)};
                    },
                    results: function (data, page) {
                        //return {results: MB.Table.parseforselect2data(data)};
                    }
                }
                // tags:["red", "green", "blue"],
            });
        }
        */
    
});
