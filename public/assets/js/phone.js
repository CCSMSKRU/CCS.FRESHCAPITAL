(function(){
	$.fn.phoneIt = function(){
		if(typeof this == 'object'){
			this.each(function(){
				$(this).mask('9 (999) 999-9999');
			});
		}
		return this;
	}
}());