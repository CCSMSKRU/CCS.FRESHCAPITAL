var uiUl = function () {

	var shiftState = undefined;

    $('body').off('click').on('click', 'ul.newUl.selectable li, ul.selectableList li, ul.sc_selectable li', function(){
        var parent = $(this).parents('ul').eq(0),
            liCollection = parent.children(),
            isWasSelected = $(this).hasClass('selected'),
            isCtrlSelectable = parent.hasClass('ctrlSelectable');

        if (isCtrlSelectable) {
            if (shiftState == 17) {
                if (isWasSelected) {
                    return false;
                } else {
                    $(this).addClass('selected');
                }
            } else {
                if (isWasSelected) {
                    return false;
                } else {
                    liCollection.removeClass('selected');
                    $(this).addClass('selected');
                }
            }
        } else {
            if (isWasSelected) {
                if (parent.hasClass('toggleable')) {
                    $(this).removeClass('selected');
                } else {
                    return false;
                }
            } else {
                liCollection.removeClass('selected');
                $(this).addClass('selected');
            }
        }
    });

//	$('ul.newUl.selectable, ul.selectableList, ul.sc_selectable').off('click').on('click', 'li', function () {
//		var parent = $(this).parents('ul').eq(0),
//			liCollection = parent.children(),
//			isWasSelected = $(this).hasClass('selected'),
//			isCtrlSelectable = parent.hasClass('ctrlSelectable');
//
//		if (isCtrlSelectable) {
//			if (shiftState == 17) {
//				if (isWasSelected) {
//					return false;
//				} else {
//					$(this).addClass('selected');
//				}
//			} else {
//				if (isWasSelected) {
//					return false;
//				} else {
//					liCollection.removeClass('selected');
//					$(this).addClass('selected');
//				}
//			}
//		} else {
//			if (isWasSelected) {
//				if (parent.hasClass('toggleable')) {
//					$(this).removeClass('selected');
//				} else {
//					return false;
//				}
//			} else {
//				liCollection.removeClass('selected');
//				$(this).addClass('selected');
//			}
//		}
//
//
//	});

	$(document).on('click', '.newSelectable .newSelectableItem', function () {

		var parent = $(this).parents('.newSelectable'),
			itemsCollection = parent.find('.newSelectableItem'),
			isWasSelected = $(this).hasClass('selected');



		if (isWasSelected) {
			return false;
		} else {
			itemsCollection.removeClass('selected');
			$(this).addClass('selected');
		}

	});

	$(document).on("keydown", function (e) {
		if (e.which == shiftState) return;
		shiftState = e.which;
	});

	$(document).on("keyup", function (e) {
		if (shiftState == e.which) {
			shiftState = 0;
		} else {
			shiftState = e.which;
		}
	});
};
