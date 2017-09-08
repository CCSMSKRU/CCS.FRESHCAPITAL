(function() {
  var MB;

  MB = window.MB;

  MB = MB || {};

  MB.Form = function(option) {
    var key, ref, value;
    this.name = option.name;
    this.world = option.world;
    this.ids = option.ids;
    this.activeId = option.ids[0];
    if (option.params) {
      ref = options.params;
      for (key in ref) {
        value = ref[key];
        this[key] = value;
      }
    }
  };

  MB.Form.parseprofile = function(data, callback) {
    var i, i2, j, k, key, len, len1, parsedprofile, ref, ref1, ref2, value, value2;
    parsedprofile = {};
    ref = data.OBJECT_PROFILE;
    for (key in ref) {
      value = ref[key];
      parsedprofile[key] = value;
    }
    ref1 = data.NAMES;
    for (i = j = 0, len = ref1.length; j < len; i = ++j) {
      value = ref1[i];
      parsedprofile[value] = [];
      ref2 = data.DATA;
      for (i2 = k = 0, len1 = ref2.length; k < len1; i2 = ++k) {
        value2 = ref2[i2];
        parsedprofile[value].push(value2[i]);
      }
    }
    return callback(parsedprofile);
  };

  MB.Form.parseforselect2data = function(res, option) {
    var data, i, j, len, ref, value;
    data = [];
    if (res.NAMES.length !== 2) {
      console.log("В parseforselect2data приходит не 2 колонки!");
    } else {
      ref = res.DATA;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        value = ref[i];
        data.push({
          id: value[0],
          text: value[1]
        });
      }
    }
    if ((option != null) && option === "empty") {
      data.unshift({
        id: " ",
        text: "Empty value"
      });
    }
    return data;
  };

  MB.Form.hasloaded = function(name) {
    return MB.O.forms.hasOwnProperty(name);
  };

  MB.Form.find = function(name) {
    return MB.O.forms[name];
  };

  MB.Form.prototype.getfielddata = function(field) {
    return this.$container.find("[data-column='" + field + "'] input").val();
  };

  MB.Form.prototype.hidecontrols = function() {
    return this.$container.find(".control-buttons").hide();
  };

  MB.Form.prototype.showcontrols = function() {
    return this.$container.find(".control-buttons").show();
  };

  MB.Form.prototype.makedir = function(callback) {
    MB.O.forms[this.name] = this;
    return callback();
  };

  MB.Form.prototype.makecontainer = function(callback) {
    var $container, $worldcontainer, instance;
    instance = this;
    $worldcontainer = $("." + instance.world + "-content-wrapper");
    $container = $("<div id='" + instance.world + "_" + instance.name + "_wrapper' class='" + instance.world + "-item'></div>");
    $worldcontainer.append($container);
    instance.$worldcontainer = $worldcontainer;
    instance.$container = $container;
    return callback();
  };

  MB.Form.prototype.makeportletcontainer = function(callback) {
    var html, instance;
    instance = this;
    html = "";
    html += "<div class='row'><div class='col-md-12'><div class='portlet box grey'><div class='form-portlet-title portlet-title'><a href='#' class='bt-menu-trigger'><span>Menu</span></a><div class='caption'><i class='fa fa-reorder'></i><span></span></div>";
    html += "<div class='actions'>";
    html += (instance.profile.general.newcommand.bool() ? "<button type='button' class='btn blue form-create-button'><i class='fa fa-plus'></i> Создать</button>" : "");
    html += (instance.profile.general.newcommand.bool() ? "<button type='button' class='btn btn-primary form-create-button'><i class='fa fa-copy'></i> Дублировать</button>" : "");
    html += (instance.profile.general.newcommand.bool() || instance.profile.general.modifycommand.bool() ? "<button type='button' class='btn green form-save-button'><i class='fa fa-save'></i> Сохранить</button>" : "");
    html += (instance.profile.general.removecommand.bool() ? "<button type='button' class='btn red form-delete-button'><i class='fa fa-times'></i> Удалить</button>" : "");
    html += "<button class=\"btn dark tools reload\" style=\"margin-left: 15px;\"><i class=\"fa fa-refresh reload\"></i></button>";
    html += "</div></div><div class='portlet-body'></div></div></div></div><div class='row'><div class='col-md-12'>";
    html += "<div class='btn-group control-buttons btn-group-solid'>";
    html += "</div></div></div>";
    instance.$container.html(html);
    borderMenu();
    return callback();
  };

  MB.Form.prototype.loadhtml = function(callback) {
    var instance, url;
    instance = this;
    url = "html/forms/" + instance.name + "/" + instance.name + ".html";
    instance.url = url;
    return instance.$container.find(".portlet-body").load(url, function(res, status, xhr) {
      return callback();
    });
  };

  MB.Form.prototype.getprofile = function(callback) {
    var instance, o;
    instance = this;
    o = {
      command: "get",
      object: "user_object_profile",
      client_object: instance.name,
      sid: MB.User.sid
    };
    return MB.Core.sendQuery(o, function(res) {
      return callback(res);
    });
  };

  MB.Form.prototype.getdata = function(id, callback) {
    var instance, o;
    instance = this;
    o = {
      command: "get",
      object: instance.profile.general.getobject,
      where: instance.profile.general.primarykey + " = " + "'" + id + "'",
      order_by: instance.profile.general.orderby,
      client_object: instance.name,
      rows_max_num: instance.profile.general.rowsmaxnum,
      page_no: instance.profile.general.pageno,
      sid: MB.User.sid
    };
    return MB.Core.sendQuery(o, function(res) {
      return callback(res);
    });
  };

  MB.Form.prototype.distributeprofile = function(parsedprofile, callback) {
    var instance;
    instance = this;
    instance.profile = {};
    instance.profile.general = {};
    instance.profile.columns = {};
    instance.profile.general.childobject = parsedprofile.CHILD_CLIENT_OBJECT;
    instance.profile.general.custom = parsedprofile.ADDITIONAL_FUNCTIONALITY;
    instance.profile.general.getobject = parsedprofile.GET_OBJECT_COMMAND;
    instance.profile.general.modifycommand = parsedprofile.MODIFY_COMMAND;
    instance.profile.general.newcommand = parsedprofile.NEW_COMMAND;
    instance.profile.general.object = parsedprofile.OBJECT_COMMAND;
    instance.profile.general.objectname = parsedprofile.CLIENT_OBJECT_NAME;
    instance.profile.general.orderby = parsedprofile.DEFAULT_ORDER_BY;
    instance.profile.general.pageno = 1;
    instance.profile.general.prepareInsert = parsedprofile.PREPARE_INSERT;
    instance.profile.general.primarykey = parsedprofile.PRIMARY_KEY;
    instance.profile.general.removecommand = parsedprofile.REMOVE_COMMAND;
    instance.profile.general.rowsmaxnum = parsedprofile.ROWS_MAX_NUM;
    instance.profile.general.where = parsedprofile.DEFAULT_WHERE;
    instance.profile.columns.accolumns = parsedprofile.AC_COLUMNS;
    instance.profile.columns.accommands = parsedprofile.AC_COMMAND;
    instance.profile.columns.accommands = parsedprofile.AC_COMMAND;
    instance.profile.columns.acreturnscolumns = parsedprofile.AC_RETURN_TO_COLUMN;
    instance.profile.columns.acwhere = parsedprofile.AC_WHERE;
    instance.profile.columns.align = parsedprofile.ALIGN;
    instance.profile.columns.clientnames = parsedprofile.NAME;
    instance.profile.columns.columnsdb = parsedprofile.COLUMN_NAME;
    instance.profile.columns.editability = parsedprofile.EDITABLE;
    instance.profile.columns.editor = parsedprofile.TYPE_OF_EDITOR;
    instance.profile.columns.refclientobj = parsedprofile.REFERENCE_CLIENT_OBJECT;
    instance.profile.columns.refcolumns = parsedprofile.LOV_COLUMNS;
    instance.profile.columns.references = parsedprofile.LOV_COMMAND;
    instance.profile.columns.returnscolumn = parsedprofile.LOV_RETURN_TO_COLUMN;
    instance.profile.columns.selectwhere = parsedprofile.LOV_WHERE;
    instance.profile.columns.visibility = parsedprofile.VISIBLE;
    instance.profile.columns.insertability = parsedprofile.INSERTABLE;
    instance.profile.columns.updatability = parsedprofile.UPDATABLE;
    instance.profile.columns.width = parsedprofile.WIDTH;
    instance.profile.columns.requirable = parsedprofile.REQUIRED;
    return callback();
  };

  MB.Form.prototype.distributedata = function(data, callback) {
    var instance;
    instance = this;
    instance.data = {};
    instance.data.data = data.DATA;
    instance.data.names = data.NAMES;
    instance.data.info = data.INFO;
    return callback();
  };

  MB.Form.prototype.updatemodel = function(part, data, callback) {
    var instance;
    instance = this;
    if (part === "profile") {
      return MB.Form.parseprofile(data, function(parsedprofile) {
        return instance.distributeprofile(parsedprofile, function() {
          return callback();
        });
      });
    } else if (part === "data") {
      return instance.distributedata(data, function() {
        return callback();
      });
    }
  };

  MB.Form.prototype.create = function(callback) {
    var instance;
    instance = this;
    return instance.makedir(function() {
      return instance.getprofile(function(res) {
        return instance.updatemodel("profile", res, function() {
          return instance.getdata(instance.activeId, function(res) {
            return instance.updatemodel("data", res, function() {
              return instance.makecontainer(function() {
                return instance.makeportletcontainer(function() {
                  return instance.loadhtml(function() {
                    return instance.updateview("init", function() {
                      return instance.updatecontroller("init", function() {
                        return callback();
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  MB.Form.prototype.updateview = function(part, callback) {
    var $container, $fw, $input, column, columns, data, editable, editor, general, html, i, insertable, instance, isprimary, j, k, l, len, len1, len2, len3, len4, len5, m, n, p, prepareInsertExists, prepareInsertIndex, prepareInsertValue, ref, ref1, ref2, ref3, ref4, ref5, table, updatable, val, value;
    instance = this;
    general = this.profile.general;
    data = this.data;
    columns = this.profile.columns;
    $container = this.$container;
    switch (part) {
      case "init":
        if (!general.modifycommand.bool()) {
          ref = data.names;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            column = ref[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            isprimary = $fw.hasClass("primarykey");
            if (!isprimary) {
              editor = columns.editor[i];
              val = data.data[0][i];
              switch (editor) {
                case "checkbox":
                  $fw.html("<input type='checkbox' class='field' readonly>");
                  break;
                default:
                  $fw.html("<input type='text' class='field' readonly>");
              }
              $input = $fw.find("input");
              if ($input.attr("type" === "checkbox")) {
                $input.prop("checked", val.bool());
              } else {
                $input.val(val);
              }
            } else {
              $fw.html("<select class='id-toggler form-control'></select>");
              html = "";
              ref1 = this.ids;
              for (k = 0, len1 = ref1.length; k < len1; k++) {
                value = ref1[k];
                html += "<option value='" + value + "'>" + value + "</option>";
              }
              $fw.find("select").html(html);
            }
          }
        } else {
          ref2 = data.names;
          for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
            column = ref2[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            isprimary = $fw.hasClass("primarykey");
            if (!isprimary) {
              editor = columns.editor[i];
              editable = columns.editability[i].bool;
              updatable = columns.updatability[i].bool;
              val = data.data[0][i];
              if (editable && updatable) {
                if (editor === "checkbox") {
                  $fw.html("<input type='checkbox' class='field'>");
                } else if (editor === "select2" || editor === "select2withEmptyValue") {
                  $fw.html("<input type='hidden' class='select2input field'>");
                } else {
                  $fw.html("<input type='text' class='field form-control'>");
                }
              } else {
                if (editor === "checkbox") {
                  $fw.html("<input type='checkbox' class='field' readonly>");
                } else {
                  $fw.html("<input type='text' class='field form-control' readonly>");
                }
              }
              $input = $fw.find("input");
              if ($input.attr("type" === "checkbox")) {
                $input.prop("checked", val.bool());
              } else {
                $input.val(val);
              }
            } else {
              $fw.html("<select class='id-toggler form-control'></select>");
              ref3 = this.ids;
              for (m = 0, len3 = ref3.length; m < len3; m++) {
                value = ref3[m];
                html += "<option value='" + value + "'>" + value + "</option>";
              }
              $fw.find("select").html(html);
            }
          }
        }
        if (general.childobject) {
          table = new MB.Table({
            world: instance.name,
            name: general.childobject,
            params: {
              parentkeyvalue: instance.activeId,
              parentobject: instance.name,
              parentobjecttype: "form"
            }
          });
          return table.create(function() {
            return callback();
          });
        } else {
          return callback();
        }
        break;
      case "data":
        ref4 = data.names;
        for (i = n = 0, len4 = ref4.length; n < len4; i = ++n) {
          column = ref4[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          isprimary = $fw.hasClass("primarykey");
          if (!isprimary) {
            editor = columns.editor[i];
            val = data.data[0][i];
            $input = $fw.find("input");
            if (editor === "checkbox") {
              $input.prop("checked", val.bool());
            } else {
              $input.val(val);
            }
          }
        }
        if (general.childobject) {
          return table = MB.O.tables[general.childobject].reload("data", function() {
            return callback();
          });
        } else {
          return callback();
        }
        break;
      case "add":
        ref5 = data.names;
        for (i = p = 0, len5 = ref5.length; p < len5; i = ++p) {
          column = ref5[i];
          editable = columns.editability[i].bool;
          if (editable) {
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            $input = $fw.find("input");
            insertable = columns.insertability[i].bool;
            if (prepareInsertIndex > -1) {
              prepareInsertExists = true;
            }
            prepareInsertIndex = general.prepareInsert.NAMES.indexOf(column);
            if (prepareInsertExists) {
              prepareInsertValue = general.prepareInsert.DATA[prepareInsertIndex];
            }
            val = prepareInsertExists ? prepareInsertValue : "";
            isprimary = $fw.hasClass("primarykey");
            if (!isprimary) {
              if (!insertable) {
                if (editor === "select2" || editor === "select2withEmptyValue") {
                  $input.select2("readonly", true);
                } else {
                  $input.attr("readonly");
                }
              }
            } else {
              alert("Поле " + column + " является primarykey и отмечено как editable");
            }
            if (editor === "checkbox") {
              $input.prop("checked", val.bool());
            } else {
              $input.val(val);
            }
          }
        }
        $container.find(".id-toggler").prepend("<option value='new'>new</option>");
        return callback();
    }
  };

  MB.Form.prototype.updatecontroller = function(part, callback) {
    var $container, column, columns, data, fn, fn1, fn2, general, i, instance, j, k, l, len, len1, len2, process, ref, ref1, ref2;
    instance = this;
    general = this.profile.general;
    data = this.data;
    columns = this.profile.columns;
    $container = this.$container;
    process = function(type, column, value) {
      switch (type) {
        case "edit":
          if (instance.editingStorage == null) {
            instance.editingStorage = {
              command: "modify",
              object: general.object,
              sid: MB.User.sid
            };
            instance.editingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
            instance.editingStorage[general.primarykey] = instance.activeId;
            instance.editingStorage[column] = value;
            return $container.find(".form-save-button").removeClass("disabled");
          } else {
            return instance.editingStorage[column] = value;
          }
          break;
        case "add":
          if (instance.addingStorage == null) {
            instance.addingStorage = {
              command: "new",
              object: general.object,
              sid: MB.User.sid
            };
            instance.addingStorage[column] = value;
            return $container.find(".form-save-button").removeClass("disabled");
          } else {
            return instance.addingStorage[column] = value;
          }
      }
    };
    switch (part) {
      case "init":
        ref = data.names;
        fn = function(i) {
          var $fw, $input, editable, editor, refcolumns, reference, returnscolumn, val;
          editable = columns.editability[i].bool();
          if (editable) {
            editor = columns.editor[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            $input = $fw.find("input");
            switch (editor) {
              case "checkbox":
                return $input.on("change", function(e) {
                  var checked;
                  checked = $(e.target).prop("checked");
                  if (checked) {
                    return process("edit", column, "TRUE");
                  } else {
                    return process("edit", column, "FALSE");
                  }
                });
              case "select2":
                val = $input.val();
                refcolumns = columns.refcolumns[i];
                reference = columns.references[i];
                returnscolumn = columns.returnscolumn[i];
                return $input.select2({
                  placeholder: val,
                  ajax: {
                    url: "/cgi-bin/b2cJ",
                    dataType: "json",
                    data: function(term, page) {
                      var o, where;
                      o = {
                        command: "get",
                        object: reference,
                        columns: refcolumns,
                        sid: MB.User.sid
                      };
                      if (columns.selectwhere[i] != null) {
                        where = columns.selectwhere[i] + " = " + (instance.getfielddata(columns.selectwhere[i]));
                      }
                      o.where = where;
                      return {
                        p_xml: MB.Core.makeQuery(o)
                      };
                    },
                    results: function(data, page) {
                      return {
                        results: MB.Form.parseforselect2data(data)
                      };
                    }
                  }
                }).on("change", function(e) {
                  var newval;
                  newval = e.val;
                  return process("edit", column, newval);
                });
              case "select2withEmptyValue":
                val = $input.val();
                refcolumns = columns.refcolumns[i];
                reference = columns.references[i];
                returnscolumn = columns.returnscolumn[i];
                return $input.select2({
                  placeholder: val,
                  ajax: {
                    url: "/cgi-bin/b2cJ",
                    dataType: "json",
                    data: function(term, page) {
                      var o, where;
                      o = {
                        command: "get",
                        object: reference,
                        columns: refcolumns,
                        sid: MB.User.sid
                      };
                      if (columns.selectwhere[i] != null) {
                        where = columns.selectwhere[i] + " = " + (instance.getfielddata(columns.selectwhere[i]));
                      }
                      o.where = where;
                      return {
                        p_xml: MB.Core.makeQuery(o)
                      };
                    },
                    results: function(data, page) {
                      return {
                        results: MB.Form.parseforselect2data(data)
                      };
                    }
                  }
                }).on("change", function(e) {
                  var newval;
                  newval = e.val;
                  return process("edit", column, newval);
                });
              case "datetime":
                return $input.datetimepicker({
                  format: "dd.mm.yyyy hh:ii",
                  autoclose: true,
                  todayHighlight: true,
                  minuteStep: 10,
                  keyboardNavigation: true,
                  todayBtn: true,
                  language: "ru"
                }).on("changeDate", function(e) {
                  var date, dd, hh, ii, mm, result, timestamp, yyyy;
                  timestamp = e.date.valueOf() - 14400000;
                  date = new Date(timestamp);
                  dd = date.getDate();
                  mm = date.getMonth() + 1;
                  yyyy = date.getFullYear();
                  hh = date.getHours();
                  ii = date.getMinutes();
                  if (dd < 10) {
                    dd = "0" + dd;
                  }
                  if (mm < 10) {
                    mm = "0" + mm;
                  }
                  if (hh < 10) {
                    hh = "0" + hh;
                  }
                  if (ii < 10) {
                    ii = "0" + ii;
                  }
                  result = dd + "." + mm + "." + yyyy + " " + hh + ":" + ii;
                  return process("edit", column, result);
                });
              default:
                return $input.on("change", function(e) {
                  return process("edit", column, e.val);
                });
            }
          }
        };
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          column = ref[i];
          fn(i);
        }
        $container.find(".portlet-title").on("click", function(e) {
          var $target;
          $target = $(e.target);
          if ($target.hasClass("reload")) {
            return instance.reload("data");
          }
        });
        $container.find(".id-toggler").off().on("change", function(e) {
          var $toggler, val;
          $toggler = $(e.target);
          if (instance.editingStorage != null) {
            return bootbox.dialog({
              message: "Вы уверены что хотите перейти к другой записи не сохранив внесенные изменения?",
              title: "Есть не сохраннные изменения",
              buttons: {
                success: {
                  label: "Да",
                  assName: "green",
                  callback: function() {
                    var val;
                    val = $toggler.val();
                    instance.activeId = val;
                    return instance.reload("data");
                  }
                },
                danger: {
                  label: "Нет",
                  className: "red",
                  callback: function() {}
                }
              }
            });
          } else {
            val = $toggler.val();
            instance.activeId = val;
            return instance.reload("data");
          }
        });
        $container.find(".form-create-button").on("click", function(e) {
          if (instance.editingStorage != null) {
            return bootbox.dialog({
              message: "Вы уверены что хотите создать еще новую запись не сохранив старую?",
              title: "Есть не сохраннные изменения",
              buttons: {
                success: {
                  label: "Да",
                  assName: "green",
                  callback: function() {
                    delete instance.editingStorage;
                    return instance.updateview("add", function() {
                      return instance.updatecontroller("add", function() {});
                    });
                  }
                },
                danger: {
                  label: "Нет",
                  className: "red",
                  callback: function() {}
                }
              }
            });
          } else {
            return instance.updateview("add", function() {
              return instance.updatecontroller("add", function() {});
            });
          }
        });
        $container.find(".form-delete-button").on("click", function(e) {
          if (instance.editingStorage != null) {
            return bootbox.dialog({
              message: "Вы уверены что хотите удалить запись с несохраненными изменениями?",
              title: "Есть не сохраннные изменения",
              buttons: {
                success: {
                  label: "Да",
                  assName: "green",
                  callback: function() {
                    if (instance.ids.length === 1) {
                      instance.deletingStorage = {
                        command: "remove",
                        object: instance.profile.general.object,
                        sid: MB.User.sid
                      };
                      instance.deletingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
                      instance.deletingStorage[general.primarykey] = instance.activeId;
                      return MB.Core.sendQuery(instance.deletingStorage, function(res) {
                        toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
                        MB.O.tables[instance.parentobject].reload("data");
                        return MB.Modal.closefull();
                      });
                    } else {
                      instance.deletingStorage = {
                        command: "remove",
                        object: general.object,
                        sid: MB.User.sid
                      };
                      instance.deletingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
                      instance.deletingStorage[general.primarykey] = instance.activeId;
                      instance.ids.splice(instance.ids.indexOf(instance.activeId), 1);
                      instance.activeId = instance.ids[0];
                      return MB.Core.sendQuery(instance.deletingStorage, function(res) {
                        toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
                        return instance.reload("data");
                      });
                    }
                  }
                }
              }
            });
          } else {
            if (instance.ids.length === 1) {
              instance.deletingStorage = {
                command: "remove",
                object: instance.profile.general.object,
                sid: MB.User.sid
              };
              instance.deletingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
              instance.deletingStorage[general.primarykey] = instance.activeId;
              return MB.Core.sendQuery(instance.deletingStorage, function(res) {
                toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
                MB.O.tables[instance.parentobject].reload("data");
                return MB.Modal.closefull();
              });
            } else {
              instance.deletingStorage = {
                command: "remove",
                object: general.object,
                sid: MB.User.sid
              };
              instance.deletingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
              instance.deletingStorage[general.primarykey] = instance.activeId;
              instance.ids.splice(instance.ids.indexOf(instance.activeId), 1);
              instance.activeId = instance.ids[0];
              return MB.Core.sendQuery(instance.deletingStorage, function(res) {
                toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
                return instance.reload("data");
              });
            }
          }
        });
        $container.find(".form-save-button").on("click", function() {
          if (instance.editingStorage != null) {
            return MB.Core.sendQuery(instance.editingStorage, function(res) {
              toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
              delete instance.editingStorage;
              return instance.reload("data");
            });
          } else {
            return alert("Нет изменений для сохранения");
          }
        });
        if (general.custom.bool) {
          return $.getScript("html/forms/" + instance.name + "/" + instance.name + ".js", function(data, status, xhr) {
            return instance.custom(function() {
              return callback();
            });
          });
        } else {
          return callback();
        }
        break;
      case "data":
        console.log(part);
        return callback();
      case "data after add":
        ref1 = data.names;
        fn1 = function(i) {
          var $fw, $input, editable, editor, updatable;
          editable = columns.editability[i].bool();
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          $input = $fw.find("input");
          if (editable) {
            updatable = columns.updatability[i].bool;
            editor = columns.editor[i];
            if (updatable) {
              if (editor === "checkbox") {
                return $input.off("change").on("change", function(e) {
                  var checked;
                  checked = $(e.target).prop("checked");
                  if (checked) {
                    return process("edit", column, "TRUE");
                  } else {
                    return process("edit", column, "FALSE");
                  }
                });
              } else if (editor === "select2" || editor === "select2withEmptyValue") {
                return $input.off("change").on("change", function(e) {
                  var newval;
                  newval = e.val;
                  return process("edit", column, newval);
                });
              } else if (editor === "datetime") {
                return $input.off("changeDate").on("changeDate", function(e) {
                  var date, dd, hh, ii, mm, result, timestamp, yyyy;
                  timestamp = e.date.valueOf() - 14400000;
                  date = new Date(timestamp);
                  dd = date.getDate();
                  mm = date.getMonth() + 1;
                  yyyy = date.getFullYear();
                  hh = date.getHours();
                  ii = date.getMinutes();
                  if (dd < 10) {
                    dd = "0" + dd;
                  }
                  if (mm < 10) {
                    mm = "0" + mm;
                  }
                  if (hh < 10) {
                    hh = "0" + hh;
                  }
                  if (ii < 10) {
                    ii = "0" + ii;
                  }
                  result = dd + "." + mm + "." + yyyy + " " + hh + ":" + ii;
                  return process("edit", column, result);
                });
              } else {
                return $input.off("change").on("change", function(e) {
                  return process("edit", column, e.val);
                });
              }
            } else {
              if (editor === "datetime") {
                return $input.off("changeDate");
              } else {
                return $input.off("change");
              }
            }
          }
        };
        for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
          column = ref1[i];
          fn1(i);
        }
        $container.find(".form-save-button").off("click").on("click", function() {
          if (instance.editingStorage != null) {
            return MB.Core.sendQuery(instance.editingStorage, function(res) {
              toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
              delete instance.editingStorage;
              return instance.reload("data");
            });
          } else {
            return alert("Нет изменений для сохранения");
          }
        });
        return callback();
      case "add":
        ref2 = data.names;
        fn2 = function(i) {
          var $fw, $input, editable, editor, insertable;
          editable = columns.editability[i].bool();
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          $input = $fw.find("input");
          if (editable) {
            insertable = columns.insertability[i].bool;
            editor = columns.editor[i];
            if (insertable) {
              if (editor === "checkbox") {
                return $input.off("change").on("change", function(e) {
                  var checked;
                  checked = $(e.target).prop("checked");
                  if (checked) {
                    return process("add", column, "TRUE");
                  } else {
                    return process("add", column, "FALSE");
                  }
                });
              } else if (editor === "select2" || editor === "select2withEmptyValue") {
                return $input.off("change").on("change", function(e) {
                  var newval;
                  newval = e.val;
                  return process("add", column, newval);
                });
              } else if (editor === "datetime") {
                return $input.off("changeDate").on("changeDate", function(e) {
                  var date, dd, hh, ii, mm, result, timestamp, yyyy;
                  timestamp = e.date.valueOf() - 14400000;
                  date = new Date(timestamp);
                  dd = date.getDate();
                  mm = date.getMonth() + 1;
                  yyyy = date.getFullYear();
                  hh = date.getHours();
                  ii = date.getMinutes();
                  if (dd < 10) {
                    dd = "0" + dd;
                  }
                  if (mm < 10) {
                    mm = "0" + mm;
                  }
                  if (hh < 10) {
                    hh = "0" + hh;
                  }
                  if (ii < 10) {
                    ii = "0" + ii;
                  }
                  result = dd + "." + mm + "." + yyyy + " " + hh + ":" + ii;
                  return process("add", column, result);
                });
              } else {
                return $input.off("change").on("change", function(e) {
                  return process("add", column, e.val);
                });
              }
            } else {
              if (editor === "datetime") {
                return $input.off("changeDate");
              } else {
                return $input.off("change");
              }
            }
          }
        };
        for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
          column = ref2[i];
          fn2(i);
        }
        $container.find(".form-save-button").off("click").on("click", function() {
          if (instance.addingStorage != null) {
            return MB.Core.sendQuery(instance.addingStorage, function(res) {
              toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
              delete instance.addingStorage;
              return instance.reload("data after add");
            });
          } else {
            return alert("Нет изменений для сохранения");
          }
        });
        return callback();
    }
  };

}).call(this);
