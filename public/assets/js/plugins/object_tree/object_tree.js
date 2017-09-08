(function(){

    MB = MB || {};
    MB.Core = MB.Core || {};


    $.fn.object_tree = function(){



        var Object_tree = function(params){

            this.id =               params.id;
            this.wrapper =          params.wrapper;
            this.data =             {};

        };

        Object_tree.prototype.init = function () {


            var _t = this;
            _t.getData(function(){
                _t.populate();
                //_t.setHandlers();
            });
        };

        Object_tree.prototype.getData = function (cb) {
            var _t = this;

            var ro = {
                nodes: [
                    {
                        id: '1',
                        name: 'upper node',
                        nodes: [
                            {
                                id: '12',
                                name: 'inner node',
                                nodes: [
                                    {
                                        id: '13',
                                        name: 'deeper node',
                                        nodes: []
                                    }
                                ]

                            }
                        ]
                    },
                    {
                        id: '2',
                        name: 'upper node 2',
                        nodes: [
                            {
                                id: '21',
                                name: 'inner node 2',
                                nodes: []
                            }
                        ]
                    }
                ]
            };

            _t.data = ro;

            if(typeof cb == 'function'){
                cb();
            }
        };

        Object_tree.prototype.populate = function () {
            var _t = this;


            var tpl = '';

            var gTpl = '';

            //function renderTree(parent, node){
            //
            //    for(var i in node.nodes){
            //        var n = node.nodes[i];
            //
            //        console.log(parent);
            //
            //        parent.append('<div data-id="'+ n.id+'"><span>'+ n.name+'</span>'+renderTree($('[data-id="'+ n.id+'"]'), n)+'</div>');//
            //    }
            //
            //
            //    //return;
            //    //
            //    //for(var i in node.nodes){
            //    //
            //    //    var n = node.nodes[i];
            //    //
            //    //    if(n.nodes.length > 0){
            //    //
            //    //        tpl += '<div data-id="'+n.id+'"><div class="title">'+n.name+'</div><div class="childs">'+ renderTree(_t.wrapper, n) +'</div></div>';
            //    //
            //    //    }else{
            //    //
            //    //        tpl += '<div data-id="'+n.id+'"><div class="title">'+n.name+'</div><div class="childs"></div></div>';
            //    //
            //    //    }
            //    //}
            //    //
            //    //return tpl;
            //
            //}
            //
            //renderTree($('body'), _t.data);

            //$('body').html(tpl);


            //return;
            //
            //
            //
            //var html = '<div class="ot-wrapper">';
            //var tpl = '';
            //
            //function rec(nodes){
            //    console.log(nodes);
            //    if(nodes.length > 0){
            //        for(var i in nodes){
            //            var node = nodes[i];
            //            tpl += '<div class="ot-node" data-id="'+node.id+'"><div class="ot-node-inner"><div class="ot-node-title">'+node.name+'</div><div class="ot-node-nodes">';
            //            tpl += rec(node.nodes);
            //            tpl += '</div>';
            //
            //            console.log(tpl);
            //
            //        }
            //    }else{
            //        tpl += '</div>';
            //    }
            //    return tpl;
            //}
            //
            //html += rec(_t.data) + '</div>';
            //
            //console.log(html);

        };

        var ot = new Object_tree({
            id: MB.Core.guid(),
            wrapper: $(document)
        });
        ot.init();

    };

    $('body').object_tree();

}());