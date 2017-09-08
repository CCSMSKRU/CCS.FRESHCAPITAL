(function(){
    MB = MB || {};
    MB.Core = MB.Core || {};

    MB.Core.validator = {
        int: function(val){
            var reg = new RegExp(/^\s*[0-9]+\s*$/);
            return reg.test(val);
        },
        float: function(val){
            var reg = new RegExp(/^\s*[0-9]+[\.]?[0-9]+\s*$/);
            return reg.test(val);
        },
        time: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\:[0-9][0-9]\s*$/);
            return reg.test(val);
        },
        date: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s*$/);
            return reg.test(val);
        },
        datetime: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s+[0-9][0-9]\:[0-9][0-9]\s*$/);
            return reg.test(val);
        }
    };

}());


