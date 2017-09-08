(function(){

    var inherits = function(childCtor, parentCtor) { /** @constructor */

    function tempCtor(){}

        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor(); /** @override */
        childCtor.prototype.constructor = childCtor;
    };

    MB.Core.inherits = inherits;
}());