(function () {
    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formInstance = tableInstance.parentObject;
    var formWrapper = $('#mw-' + formInstance.id);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Проставить внешние id во внутренней схеме (Крокус)',
            disabled: function () {
                return false;
            },
            callback: function () {
                var o = {
                    command: 'updateHallSchemeByExt'
                };

                o[tableInstance.primary_keys[0]] = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex][tableInstance.primary_keys[0]];

                toastr['info']('Запущен процесс установки соответствй идентификаторов внутренней и внешней схем...');

                DOQuery(o, function (r) {
                    if (r.err) console.log(r.err);
                    console.log(r);
                    toastr[r.type](r.message);
                    tableInstance.reload();
                });
            }
        }
    ];

}());
