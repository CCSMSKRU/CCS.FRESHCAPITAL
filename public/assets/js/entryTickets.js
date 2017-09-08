var EntryTickets = function (params) {
	this.map = params.map;
	this.parent = params.parent;
	this.actionId = params.actionId;
	this.ticketZones = [];
	this.wrapper = null;
	this.confirmButton = null;
	this.canvasHeight = params.canvasHeight;
	this.selection = {};
	this.oldSelection = {};
	this.currentMode = null;
	this.listIsShow = false;
	this.frame = params.frame;
	this.limit = params.limit;
    this.isConfirmButton = false;
};

//external methods

EntryTickets.prototype.init = function(callback) {
	var me = this;
	me.getTicketZone(function(){
		callback();
	});
};

EntryTickets.prototype.check = function(mode, notResize, isActionSKD) {
	var me = this;
	var isZones = me.checkTicketZones();
	var ticketZonesBySector = [];

	if(isZones) {
		me.currentMode = mode;
		if(mode == "squares") {
			if(me.map) ticketZonesBySector = me.getTicketZoneByName();
			else ticketZonesBySector = me.ticketZones;
			me.removeList();

			if(ticketZonesBySector.length) {
				me.renderList(ticketZonesBySector, notResize, isActionSKD);
			}
			else me.setScale();
		}
		else if(mode == "sectors") {
			ticketZonesBySector = me.getTicketZoneByName();
			if(ticketZonesBySector.length) {
				me.renderAllTickets(ticketZonesBySector, isActionSKD);
				if(!notResize) me.setScale();
			}
		}
	}

	return isZones;
};

EntryTickets.prototype.close = function() {
	var me = this;
	me.removeList();
	me.map.container.show();
	me.setScale();
};

EntryTickets.prototype.updateTickets = function(ticketZoneId, count, updateCount) {
	var me = this;
	var selectedTicketZone = me.selection[ticketZoneId] || {count: 0};
    var ticketZone = me.getTicketZoneById(ticketZoneId);

    if(!updateCount) {
        if(count > me.limit) count = me.limit;
        else if(count <= 0) count = 0;

        if(count > 0) selectedTicketZone.count = count;
        else me.selection[ticketZoneId].count = 0;
    }
    else {
		for (var i in me.selection) {
			ticketZone = me.getTicketZoneById(i);
			ticketZone.FREE_TICKET_COUNT = ticketZone.BASE_FREE_TICKET_COUNT - me.selection[i].count;
		}
	}

    me.checkUpdate();
};

EntryTickets.prototype.clearTickets = function(all) {
	var me = this;
	me.selection = {};

    if(all) {
        me.getTicketZone(function(){
            me.checkUpdate();
        });
    }
	else me.checkUpdate();
};

//external methods

EntryTickets.prototype.getTicketZoneByName = function() {
	var me = this;
	var ticketZonesBySector = [];
	var sectorName = "";

	if(me.currentMode == "squares") {
		for (var i in me.map.sectors){
			var sector = me.map.sectors[i];
			if(sector.selected) {
				sectorName = sector.name;
				break;
			}
		}
		ticketZonesBySector = me.getTicketZoneBySector(sectorName);
	}
	else if(me.currentMode == "sectors") {
		ticketZonesBySector = me.getTicketZoneBySector("");
	}

	return ticketZonesBySector;
};

EntryTickets.prototype.getTicketZone = function(callback) {
	var me = this;
	var response = function(data) {
		var list = jsonToObj(JSON.parse(data)['results'][0]);
        me.ticketZones = [];
		for (var i in list) {
            list[i].BASE_FREE_TICKET_COUNT = list[i].FREE_TICKET_COUNT;
			me.ticketZones.push(list[i]);
		}
		callback();
	};
	var o;

	if(me.frame) {
		o = {
			command: 'get_action_scheme_ticket_zone',
			params: {
				action_id: me.actionId,
				frame: me.frame
			}
		};
	}
	else {
		o = {
			command: "get",
			object: "action_scheme_ticket_zone",
			params: {
				where: "ACTION_ID = "+me.actionId
			}
		};
	}

	socketQuery(o, function (data) {
		response(data);
	});
};

EntryTickets.prototype.getTicketZoneBySector = function(name) {
	var me = this;
	var ticketZones = [];

	for (var i in me.ticketZones) {
		var ticketZone = me.ticketZones[i];
		if(ticketZone.AREA_GROUP_NAME == name) ticketZones.push(ticketZone);
	}

	return ticketZones;
};

EntryTickets.prototype.getTicketZoneById = function(id) {
	var me = this;

	for (var i in me.ticketZones) {
		var ticketZone = me.ticketZones[i];
		if(ticketZone.ACTION_SCHEME_TICKET_ZONE_ID == id) return ticketZone;
	}
};

EntryTickets.prototype.getAllFreeTickets = function(list) {
	var allFreeCount = 0;

	for (var i in list) {
		allFreeCount += list[i].FREE_TICKET_COUNT;
	}

	return allFreeCount;
};

EntryTickets.prototype.checkTicketZones = function() {
	var me = this;

	for (var i in me.ticketZones) return true;

	return false
};

EntryTickets.prototype.checkSelection = function() {
	var me = this;

	for (var i in me.selection) return true;

	return false
};

EntryTickets.prototype.setScale = function() {
	var me = this;
	var container = me.map.container;
	var mode = me.currentMode;
	var height;

	if(!me.wrapper) return;

	height = (mode == "squares")?(me.canvasHeight - me.wrapper.height())+"px":me.canvasHeight+"px";
	container.css("height",height);
	me.map.resize({width: container.width(), height: container.height()});
};

EntryTickets.prototype.renderAllTickets = function(data, isActionSKD) {
	var me = this;
	var tpl = "<div class='entry-tickets-wrapper entry-tickets-all'>" +
		"<span>Входные Билеты (</span>" +
		"<span class='entry-tickets-all-count'>{{allFreeCount}}</span>" +
		"<span> шт)</span>" +
		"</div>";
	var mo = {
		allFreeCount: me.getAllFreeTickets(data)
	};
	var containerParent = me.map.container.parent();
	me.removeList();

    if(!isActionSKD) {
        containerParent.append(Mustache.to_html(tpl, mo));
    }

	me.wrapper = $('.entry-tickets-wrapper');

	me.setHandlers();
};

EntryTickets.prototype.renderList = function(data, notResize, isActionSKD) {
	var me = this;
	var tplWrapper = "<div class='entry-tickets-wrapper entry-tickets-mixed''>" +
		"<div class='entry-tickets-title'><span>Входные билеты: </span>{{#isConfirmButton}}<span class='entry-tickets-confirm'><i class='fa fa-check'></i>Подтвердить</span>{{/isConfirmButton}}</div>" +
		"<div class='entry-tickets-list'></div>" +
		"</div>";
	var tplItem = "<div class='entry-tickets-item' data-id='{{id}}'>" +
		"<div class='entry-tickets-item-selector'>" +
		"<div class='entry-tickets-item-selector-button minus'><i class='fa fa-minus'></i></div>" +
		"<div class='entry-tickets-item-selector-field'>" +
		"<input type='text' value='{{count}}'/>" +
		"</div>" +
		"<div class='entry-tickets-item-selector-button plus'><i class='fa fa-plus'></i></div>" +
		"</div>" +
		"<div class='entry-tickets-item-price'>" +
		"{{#name}}" +
		"<span>{{name}}</span>" +
		"<span> - </span>" +
		"{{/name}}" +
		"<span>{{price}}</span>" +
		"<span> руб.</span>" +
		"</div>" +
		"<div class='entry-tickets-item-place'>"+
		"<span>{{freeTicketCount}}</span>" +
		"<span> мест.</span>" +
		"</div>" +
		"</div>";
    var tplItemSKD = "<div class='entry-tickets-item' data-id='{{id}}'>" +

        "<div class='entry-tickets-item-price entry-tickets-item-price-skd'>" +
        "{{#name}}" +
        "<span>{{name}}</span>" +
        "<span> - </span>" +
        "{{/name}}" +
        "<span>{{price}}</span>" +
        "<span> руб.</span>" +
        "</div>" +

        "<div class='entry-tickets-item-place entry-tickets-item-place-skd'>"+
        "<span class='entry-tickets-item-place-title-skd'>Не прошло: </span>" +
        "<span>{{not_entered_places}}</span>" +
        "<span> чел.</span>" +
        "</div>" +

        "<div class='entry-tickets-item-place entry-tickets-item-place-skd'>"+
        "<span class='entry-tickets-item-place-title-skd'>Прошло: </span>" +
        "<span>{{entered_places}}</span>" +
        "<span> чел.</span>" +
        "</div>" +

        "<div class='entry-tickets-item-place entry-tickets-item-place-skd'>"+
        "<span class='entry-tickets-item-place-title-skd'>Продано: </span>" +
        "<span>{{sold_places}}</span>" +
        "<span> бил.</span>" +
        "</div>" +

        "<div class='entry-tickets-item-place entry-tickets-item-place-skd'>"+
        "<span class='entry-tickets-item-place-title-skd'>Всего: </span>" +
        "<span>{{freeTicketCount}}</span>" +
        "<span> мест.</span>" +
        "</div>" +

        "</div>";
	var containerParent = (me.map)?me.map.container.parent(): me.parent;
	var list;

	me.removeList();

	containerParent.append(Mustache.to_html(tplWrapper, {isConfirmButton: me.isConfirmButton}));
	list = $('.entry-tickets-list');

	if(!data || notResize){
		list.css("max-height","100%");
		list.css("height",(me.canvasHeight-42)+"px");
		if(!data) data = me.getTicketZoneByName();
	}
	else list.css("max-height",250+"px");
    console.log("data:", data);
	for (var i in data) {
		var ticketZone = data[i];
		var mO = {
			id: ticketZone.ACTION_SCHEME_TICKET_ZONE_ID,
			name: ticketZone.NAME,
			price: ticketZone.TICKET_PRICE,
			freeTicketCount: ticketZone.FREE_TICKET_COUNT,
			count: 0,
            sold_places: ticketZone.sold_places,
            entered_places: ticketZone.entered_places,
            not_entered_places: ticketZone.not_entered_places
		};

		for (var j in me.selection) {
			if(ticketZone.ACTION_SCHEME_TICKET_ZONE_ID == j) {
				mO.count = me.selection[j].count;
				break;
			}
		}

        if (isActionSKD) {
            list.append(Mustache.to_html(tplItemSKD, mO));
        } else {
            list.append(Mustache.to_html(tplItem, mO));
        }
	}

	me.wrapper = $('.entry-tickets-wrapper');
	me.confirmButton = me.wrapper.find('.entry-tickets-confirm');

	me.setHandlers();

	me.listIsShow = true;

	if(!notResize) me.setScale();
};

EntryTickets.prototype.selectTicket = function(ticketZone, count) {
	var me = this;
	var ticketZoneId = ticketZone.ACTION_SCHEME_TICKET_ZONE_ID;
    var total = ticketZone.BASE_FREE_TICKET_COUNT;

	if(count > 0 && count <= total) {
		me.selection[ticketZoneId] = {};
		me.selection[ticketZoneId].count = count;
		me.selection[ticketZoneId].price = ticketZone.TICKET_PRICE;
		me.selection[ticketZoneId].name = ticketZone.NAME;
		me.selection[ticketZoneId].sector = ticketZone.AREA_GROUP_NAME;
		me.selectedTicket(ticketZoneId);
    }
	else if(count <= 0) {
        me.selection[ticketZoneId].count = 0;
		me.selectedTicket(ticketZoneId);
    }
};

EntryTickets.prototype.selectedTicket = function(ticketZoneId) {
	var me = this;

    if(me.isConfirmButton) {
        if(me.checkSelection()) me.confirmButton.addClass("active");
        else me.confirmButton.removeClass("active");
    }
	else me.parent.trigger('selected_ticket');
};

EntryTickets.prototype.checkUpdate = function() {
	var me = this;
	var ticketZonesBySector;

	if(me.listIsShow) {
		if(me.currentMode == "squares") {
			if(me.map) ticketZonesBySector = me.getTicketZoneByName();
			else ticketZonesBySector = me.ticketZones;

			me.renderList(ticketZonesBySector, !me.map);
		}
		else me.renderList();
	}
};

EntryTickets.prototype.setHandlers = function() {
	var me = this;
	var wrapper = me.wrapper;
	var elements = {
		field: wrapper.find('.entry-tickets-item-selector-field input'),
		btnMinus:  wrapper.find('.entry-tickets-item-selector-button.minus'),
		btnPlus:  wrapper.find('.entry-tickets-item-selector-button.plus'),
		ticketsAll: $('.entry-tickets-all')
	};
	var checkNumber = function(e) {
		if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
				// Allow: Ctrl+A, Command+A
			(e.keyCode == 65 && ( e.ctrlKey === true || e.metaKey === true ) ) ||
				// Allow: home, end, left, right, down, up
			(e.keyCode >= 35 && e.keyCode <= 40)) {
			// let it happen, don't do anything
			return;
		}
		// Ensure that it is a number and stop the keypress
		if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		}
	};
	var checkTotal = function(elem) {
		var ticketZoneId = getTicketZoneId(elem);
		var ticketZone = me.getTicketZoneById(ticketZoneId);
		var val = parseFloat(elem.val());
        var total = ticketZone.BASE_FREE_TICKET_COUNT;

		if(isNaN(val)) val = 0;

        if(val > total) val = total;
		else if(val > me.limit) val = me.limit;
		else if(val < 0) val = 0;

		elem.val(val);

        return val;
    };

	var getTicketZoneId = function(elem) {
		return $(elem).closest(".entry-tickets-item").data("id");
	};

	elements.ticketsAll.off('click').on('click', function () {
		me.removeList();
		me.renderList();
		me.map.container.hide();
		me.parent.trigger("show_tickets_list");
	});

	elements.field.off('keydown paste').on('keydown paste', function (event) {
		return checkNumber(event);
	});

	elements.field.off('input').on('input', function () {
        var elem = $(this);
        checkTotal(elem);
	});

    elements.field.off('blur').on('blur', function () {
        var elem = $(this);
        var ticketZoneId = getTicketZoneId(elem);
        var ticketZone = me.getTicketZoneById(ticketZoneId);
        var val = elem.val();

        me.selectTicket(ticketZone, val);
    });

	elements.btnMinus.off('click').on('click', function () {
		var field = $(this).closest(".entry-tickets-item").find('.entry-tickets-item-selector-field input');
        var ticketZoneId = getTicketZoneId(field);
        var ticketZone = me.getTicketZoneById(ticketZoneId);
		var val = +field.val();
		field.val(val -= 1);
        val = checkTotal(field);

        me.selectTicket(ticketZone, val);
	});

	elements.btnPlus.off('click').on('click', function () {
		var field = $(this).closest(".entry-tickets-item").find('.entry-tickets-item-selector-field input');
        var ticketZoneId = getTicketZoneId(field);
        var ticketZone = me.getTicketZoneById(ticketZoneId);
        var val = +field.val();
        field.val(val += 1);
        val = checkTotal(field);

        me.selectTicket(ticketZone, val);
	});

	if(me.confirmButton) {
		me.confirmButton.off('click').on('click', function () {
			var selection = me.selection;
			var elem = $(this);

			if(!elem.hasClass("active")) return;

			me.parent.trigger('selected_ticket');

			me.oldSelection = {};

			for (var i in selection) {
				me.oldSelection[i] = me.selection[i];
			}
		});
	}
};

EntryTickets.prototype.removeList = function() {
	var me = this;
	if(me.wrapper) me.wrapper.remove();

	me.listIsShow = false;
};