$(document).ready(function(){
    $("#TAB_shows_part").click(function(){
        var html = ''+
        '<br/>'+
        '<div id="show_part_table_wrapper"></div>'+
        '<table id="shows_part_table"></table>'+
        '<div id="shows_part_table_nav"></div>';
        $("#shows_part").html(html);
        /*
        var page = "show_part"; 
        var o = {
            subcommand: page
        };
        var table = new MBOOKER.Tables.Table(o);
        MBOOKER.Tables.tables[page] = table;
        MBOOKER.Tables.tables[page].rows = {};

        MBOOKER.Tables.tables[page].init();
        */
    });
});