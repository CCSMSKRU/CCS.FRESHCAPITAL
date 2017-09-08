MBOOKER.Classes.Row = function (obj) {

	this.subcommand 		= obj.subcommand;
	this.numberOfCells 		= obj.numberOfCells;
	this.data 				= obj.data;
	this.visibilityOfCells 	= obj.visibilityOfCells;
	this.typesOfEditors 	= obj.typesOfEditors;
	this.columnNamesDb		= obj.columnNamesDb
	this.primaryKey 		= obj.primaryKey;

};

MBOOKER.Classes.Row.prototype.render = function () {

	var _this = this;
	var html = "";

	html += "<tr>";

	for (var i = 0; i < this.numberOfCells; i++) {

		var visibility = "";
		this.visibilityOfCells[i] === true ? visibility = "visible" : visibility = "hidden";

		var editor = this.typesOfEditors[i];

		var columnNameDb = this.columnNamesDb[i];

		var key = "";

		if (this.primaryKey.length === 1) {
			key = this.columnNamesDb.indexOf(this.primaryKey[0]);
		} else {

		}

		if (editor) {
			html 	+= "<td data-visibilitystatus='" 
					+ visibility 
					+ "' class='" + this.columnNamesDb[i] + "'><a href='#' data-row='" 
					+ this.data[key] 
					+ "' data-column='" 
					+ columnNameDb 
					+ "' class='editable editable-click editable-disabled' id='addressx" 
					+ i 
					+ "' data-type='" 
					+ editor 
					+ "' tabindex='-1'>" 
					+ this.data[i] 
					+ "</a></td>";
		} else {
			html += "<td data-visibilitystatus='" + visibility + "' class='" + this.columnNamesDb[i] + "'>" + this.data[i]+ "</td>";
		}
				
	};

	html += "</tr>";
	return html;

};