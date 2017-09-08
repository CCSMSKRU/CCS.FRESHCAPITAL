(function(){
    MB.Core.listeners = [];
    var EventEmiter = function(){};

    EventEmiter.prototype = {
        on: function(name, callback){
            var self = this;
            var obj;

            if(MB.Core.listeners.length == 0){
                obj = {
                    name: name,
                    callbacks: [callback]
                };
                MB.Core.listeners.push(obj);
            }else{
                for(var i in MB.Core.listeners){
                    if(MB.Core.listeners[i].name == name){
                        MB.Core.listeners[i].callbacks.push(callback);
                    }else{
                        if(i == MB.Core.listeners.length-1){
                            obj = {name: name, callbacks: [callback]};
                            MB.Core.listeners[i].push(obj);
                        }
                    }
                }
            }
        },
        off: function(name, callback){
            var self = this;
            var obj;
            if(MB.Core.listeners.length == 0){
                return false;
            }else{
                for(var i in MB.Core.listeners){
                    if(MB.Core.listeners[i].name == name){
                        //MB.Core.listeners[i].callbacks.push(callback);
                    }else{
                        if(i == MB.Core.listeners.length-1){
                            //obj = {name: name, callbacks: [callback]};
                            //MB.Core.listeners[i].push(obj);
                        }
                    }
                }
            }
        },
        once: function(name, callback){

        },
        emit: function(name){
            for(var i in MB.Core.listeners){
                if(MB.Core.listeners[i].name == name){
                    for(var k in MB.Core.listeners[i].callbacks){
                        MB.Core.listeners[i].callbacks[k]();
                    }
                }
            }
        }
    };


    MB.Core.EE = EventEmiter;

}());
