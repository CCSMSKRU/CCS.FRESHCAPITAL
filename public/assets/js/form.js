(function() {
  var MB;

  MB = window.MB;

  MB = MB || {};

  MB.Form = function(options) {
    var key, ref, value;
    this.type = 'form';
    this.name = options.name;
    this.world = "modal";
    this.ids = options.ids;
    this.activeId = options.ids[0];
    this.prevActiveId = null;
    this.mode = options.mode != null ? options.mode : null;
    if (options.params) {
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
    res = MB.Core.parseFormat(res);
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
    var _columns, general, html, i, instance, j, k, len, len1, list, ref, value;
    instance = this;
    general = instance.profile.general;
    _columns = instance.profile.columns;
    html = "";
    html += "<div class='row'> <div class='col-md-12'> <div class='portlet box grey'> <div class='form-portlet-title portlet-title'> <a href='#' class='bt-menu-trigger'> <span>Menu</span> </a> <div class='caption'> <i class='fa fa-reorder'></i> <span></span> </div> <div class='actions'>";
    list = [];
    ref = _columns.refclientobj;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      value = ref[i];
      if (value) {
        list.push(value);
      }
    }
    if (list.length > 0) {
      html += "<div class='btn-group'> <a class='btn green' href='#' data-toggle='dropdown'> <i class='fa fa-cogs'></i> Перейти в справочник... <i class='fa fa-angle-down'></i> </a> <ul class='dropdown-menu pull-right gotos-wrapper'>";
      for (i = k = 0, len1 = list.length; k < len1; i = ++k) {
        value = list[i];
        html += "<li data-goto='" + value + "'> <a href='#' class='xls-converter'> <i class='fa fa-pencil'></i> " + value + " </a> </li>";
      }
      html += "</ul> </div>";
    }
    if (general.newcommand.bool()) {
      html += "<button type='button' class='btn blue form-create-button'> <i class='fa fa-plus'></i> Создать </button> <button type='button' class='btn btn-primary form-create-button'> <i class='fa fa-copy'></i> Дублировать </button>";
    }
    if (general.newcommand.bool() || general.modifycommand.bool()) {
      html += "<button type='button' class='btn green form-save-button'> <i class='fa fa-save'></i> Сохранить </button>";
    }
    if (general.removecommand.bool()) {
      html += "<button type='button' class='btn red form-delete-button'> <i class='fa fa-times'></i> Удалить </button>";
    }
    html += "<button class=\"btn dark tools reload\" style=\"margin-left: 15px;\"> <i class=\"fa fa-refresh reload\"></i> </button> </div> </div> <div class='portlet-body'></div> </div> </div> </div> <div class='row'> <div class='col-md-12'> <div class='btn-group control-buttons btn-group-solid'></div> </div> </div>";
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
      object: "user_profile",
      client_object: instance.name,
      sid: MB.User.sid
    };
    return MB.Core.sendQuery(o, function(res) {
      return callback(res);
    });
  };

  MB.Form.prototype.getdata = function(id, callback) {
    var instance, o;
    console.log("id", id);
    instance = this;
    o = {
      command: "get",
      object: instance.profile.general.getobject,
      where: instance.profile.general.primarykey + " = '" + id + "'",
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
    instance.profile.columns.required = parsedprofile.REQUIRED;
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
    } else if (part === "data add") {
      return instance.distributedata(data, function() {
        instance.ids.unshift("new");
        instance.prevActiveId = instance.activeId;
        instance.activeId = "new";
        instance.addingStorage = {
          command: "new",
          object: instance.profile.general.object,
          sid: MB.User.sid
        };
        return callback();
      });
    } else if (part === "add") {
      instance.ids.unshift("new");
      instance.prevActiveId = instance.activeId;
      instance.activeId = "new";
      instance.addingStorage = {
        command: "new",
        object: instance.profile.general.object,
        sid: MB.User.sid
      };
      return callback();
    }
  };

  MB.Form.prototype.create = function(callback) {
    var instance;
    console.log(56756756);
    instance = this;
    if (instance.mode === "add") {
      return instance.makedir(function() {
        return instance.getprofile(function(res) {
          return instance.updatemodel("profile", res, function() {
            return instance.makecontainer(function() {
              return instance.makeportletcontainer(function() {
                return instance.loadhtml(function() {
                  instance.addingStorage = {
                    command: "new",
                    object: instance.profile.general.object,
                    sid: MB.User.sid
                  };
                  return instance.updateview("addinit", function() {
                    return instance.updatecontroller("addinit", function() {
                      return callback();
                    });
                  });
                });
              });
            });
          });
        });
      });
    } else {
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
    }
  };

  MB.Form.prototype.updateview = function(part, callback) {
    var $container, $fw, $input, $toggler, active, column, columns, data, editable, editor, general, html, i, id, insertable, instance, isprimary, j, k, l, len, len1, len10, len11, len2, len3, len4, len5, len6, len7, len8, len9, m, n, p, prepareInsertExists, prepareInsertIndex, q, r, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, required, result, returnscolumn, returnscolumnid, s, t, table, text, u, updatable, v, val, value;
    instance = this;
    general = this.profile.general;
    columns = this.profile.columns;
    data = this.data;
    $container = this.$container;
    console.log('PART fff222', part);
    switch (part) {
      case "addinit":
        data = {
          names: columns.columnsdb
        };
        instance.mode = "add";
        ref = data.names;
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          column = ref[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          editable = columns.editability[i].bool();
          editor = columns.editor[i];
          insertable = columns.insertability[i].bool();
          isprimary = $fw.hasClass("primarykey");
          prepareInsertIndex = general.prepareInsert.NAMES.indexOf(column);
          prepareInsertExists = prepareInsertIndex > -1 ? true : false;
          required = columns.required[i].bool();
          val = prepareInsertExists ? general.prepareInsert.DATA[prepareInsertIndex] : "";
          if (prepareInsertExists) {
            instance.addingStorage[column] = val;
          }
          if (!isprimary) {
            if (editable && insertable) {
              if (editor === "checkbox") {
                $fw.html("<input type='checkbox' class='field'>");
              } else if (editor === "select2" || editor === "select2withEmptyValue" || editor === "select2FreeType") {
                $fw.html("<input type='hidden' class='select2input field'>");
              } else if (editor === "File") {
                $fw.html("<input type='text' class='field  form-control uploadFile' value='Выберите файл'>");
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
            switch (editor) {
              case "checkbox":
                $input.prop("checked", (val === "" ? false : val.bool()));
                break;
              default:
                $input.val(val);
            }
          } else {
            result = "<select class='id-toggler form-control'>";
            html = "";
            active = "";
            ref1 = instance.ids;
            for (k = 0, len1 = ref1.length; k < len1; k++) {
              value = ref1[k];
              if (value === instance.activeId) {
                active += "<option value='" + value + "'>" + value + "</option>";
              } else {
                html += "<option value='" + value + "'>" + value + "</option>";
              }
            }
            result += active + html + "</select>";
            $fw.html(result);
          }
          if (required) {
            $fw.parents(".form-group").find("label").append("<span class='label-star'>*</span>");
          }
          $(".column-wrapper[data-column='COLOR']").each(function(index, elem) {
            var elemBlock, elemColor, elemInput;
            elemInput = $(elem).find('input');
            elemColor = elemInput.val();
            elemBlock = '<div class="colorView" style="background-color:' + elemColor + '"></div>';
            return $(elem).prepend(elemBlock);
          });
        }
        return callback();
      case "init":
        instance.mode = "edit";
        if (!general.modifycommand.bool()) {
          ref2 = data.names;
          for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
            column = ref2[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            isprimary = $fw.hasClass("primarykey");
            required = columns.required[i].bool();
            if (!isprimary) {
              editor = columns.editor[i];
              val = data.data[0][i];
              switch (editor) {
                case "checkbox":
                  $fw.html("<input type='checkbox' class='field' readonly>");
                  break;
                default:
                  $fw.html("<input type='text' class='field form-control' readonly>");
              }
              $input = $fw.find("input");
              switch (editor) {
                case "checkbox":
                  $input.prop("checked", val.bool());
                  break;
                default:
                  $input.val(val);
              }
            } else {
              result = "<select class='id-toggler form-control'>";
              html = "";
              active = "";
              ref3 = instance.ids;
              for (m = 0, len3 = ref3.length; m < len3; m++) {
                value = ref3[m];
                if (value === instance.activeId) {
                  active += "<option value='" + value + "'>" + value + "</option>";
                } else {
                  html += "<option value='" + value + "'>" + value + "</option>";
                }
              }
              result += active + html + "</select>";
              $fw.html(result);
            }
            if (required) {
              $fw.parents(".form-group").find("label").append("<span class='label-star'>*</span>");
            }
          }
        } else {
          ref4 = data.names;
          for (i = n = 0, len4 = ref4.length; n < len4; i = ++n) {
            column = ref4[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            isprimary = $fw.hasClass("primarykey");
            required = columns.required[i].bool();
            if (!isprimary) {
              editor = columns.editor[i];
              editable = columns.editability[i].bool();
              updatable = columns.updatability[i].bool();
              val = data.data[0][i];
              if (editable && updatable) {
                if (editor === "checkbox") {
                  $fw.html("<input type='checkbox' class='field'>");
                } else if (editor === "select2" || editor === "select2withEmptyValue" || editor === "select2FreeType") {
                  $fw.html("<input type='hidden' class='select2input field'>");
                } else if (editor === "File") {
                  $fw.html("<input type='text' class='field form-control uploadFile' value='Выберите файл'>");
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
              switch (editor) {
                case "checkbox":
                  $input.prop("checked", val.bool());
                  break;
                default:
                  $input.val(val);
              }
            } else {
              result = "<select class='id-toggler form-control'>";
              html = "";
              active = "";
              ref5 = instance.ids;
              for (p = 0, len5 = ref5.length; p < len5; p++) {
                value = ref5[p];
                if (value === instance.activeId) {
                  active += "<option value='" + value + "'>" + value + "</option>";
                } else {
                  html += "<option value='" + value + "'>" + value + "</option>";
                }
              }
              result += active + html + "</select>";
              $fw.html(result);
            }
            if (required) {
              $fw.parents(".form-group").find("label").append("<span class='label-star'>*</span>");
            }
          }
          $(".column-wrapper[data-column='COLOR']").each(function(index, elem) {
            var elemBlock, elemColor, elemInput;
            elemInput = $(elem).find('input');
            elemColor = elemInput.val();
            elemBlock = '<div class="colorView" style="background-color:' + elemColor + '"></div>';
            return $(elem).prepend(elemBlock);
          });
        }
        if (general.childobject) {
          table = new MB.Table({
            world: instance.name,
            name: general.childobject,
            params: {
              parent: instance
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
        instance.mode = "edit";
        ref6 = data.names;
        for (i = q = 0, len6 = ref6.length; q < len6; i = ++q) {
          column = ref6[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          isprimary = $fw.hasClass("primarykey");
          if (!isprimary) {
            editor = columns.editor[i];
            val = data.data[0][i];
            $input = $fw.find("input");
            switch (editor) {
              case "checkbox":
                $input.prop("checked", val.bool());
                break;
              case "select2":
                returnscolumn = columns.returnscolumn[i];
                id = data.data[0][data.names.indexOf(returnscolumn)];
                text = val;
                $input.select2("data", {
                  id: id,
                  text: text
                });
                break;
              case "select2withEmptyValue":
                returnscolumn = columns.returnscolumn[i];
                id = data.data[0][data.names.indexOf(returnscolumn)];
                text = val;
                $input.select2("data", {
                  id: id,
                  text: text
                });
                break;
              default:
                $input.val(val);
            }
          } else {
            $toggler = $fw.find(".id-toggler");
            html = "";
            active = "";
            ref7 = this.ids;
            for (r = 0, len7 = ref7.length; r < len7; r++) {
              value = ref7[r];
              if (value === this.activeId) {
                active += "<option value='" + value + "'>" + value + "</option>";
              } else {
                html += "<option value='" + value + "'>" + value + "</option>";
              }
            }
            result = active + html;
            $toggler.html(result);
          }
        }
        if (general.childobject) {
          if (MB.O.tables[general.childobject] != null) {
            return table = MB.O.tables[general.childobject].reload("data", function() {
              return callback();
            });
          }
        } else {
          return callback();
        }
        break;
      case "data after add":
        instance.mode = "edit";
        ref8 = data.names;
        for (i = s = 0, len8 = ref8.length; s < len8; i = ++s) {
          column = ref8[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          isprimary = $fw.hasClass("primarykey");
          if (!isprimary) {
            editor = columns.editor[i];
            val = data.data[0][i];
            $input = $fw.find("input");
            switch (editor) {
              case "checkbox":
                $input.prop("checked", val.bool());
                break;
              case "select2":
                returnscolumn = columns.returnscolumn[i];
                id = data.data[0][data.names.indexOf(returnscolumn)];
                text = val;
                $input.select2("data", {
                  id: id,
                  text: text
                });
                break;
              case "select2withEmptyValue":
                returnscolumn = columns.returnscolumn[i];
                id = data.data[0][data.names.indexOf(returnscolumn)];
                text = val;
                $input.select2("data", {
                  id: id,
                  text: text
                });
                break;
              default:
                $input.val(val);
            }
          } else {
            $toggler = $fw.find(".id-toggler");
            html = "";
            active = "";
            ref9 = this.ids;
            for (t = 0, len9 = ref9.length; t < len9; t++) {
              value = ref9[t];
              if (value === this.activeId) {
                active += "<option value='" + value + "'>" + value + "</option>";
              } else {
                html += "<option value='" + value + "'>" + value + "</option>";
              }
            }
            result = active + html;
            $toggler.html(result);
          }
        }
        if (general.childobject) {
          if (MB.O.tables[general.childobject] != null) {
            return table = MB.O.tables[general.childobject].reload("data", function() {
              return callback();
            });
          } else {
            return callback();
          }
        } else {
          return callback();
        }
        break;
      case "add":
        instance.mode = "add";
        ref10 = data.names;
        for (i = u = 0, len10 = ref10.length; u < len10; i = ++u) {
          column = ref10[i];
          editable = columns.editability[i].bool;
          editor = columns.editor[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          $input = $fw.find("input");
          insertable = columns.insertability[i].bool;
          prepareInsertIndex = general.prepareInsert.NAMES.indexOf(column);
          prepareInsertExists = prepareInsertIndex > -1 ? true : false;
          if (prepareInsertExists) {
            val = general.prepareInsert.DATA[prepareInsertIndex];
            instance.addingStorage[column] = val;
          } else {
            val = "";
          }
          val = prepareInsertExists ? general.prepareInsert.DATA[prepareInsertIndex] : "";
          isprimary = $fw.hasClass("primarykey");
          if (editable) {
            if (!isprimary) {
              if (!insertable) {
                if (editor === "select2" || editor === "select2withEmptyValue") {
                  $input.select2("readonly", true);
                } else {
                  $input.attr("readonly");
                }
              }
            } else {
              $toggler = $fw.find(".id-toggler");
              html = "";
              active = "";
              ref11 = this.ids;
              for (v = 0, len11 = ref11.length; v < len11; v++) {
                value = ref11[v];
                if (value === this.activeId) {
                  active += "<option value='" + value + "'>" + value + "</option>";
                } else {
                  html += "<option value='" + value + "'>" + value + "</option>";
                }
              }
              result = active + html;
              $toggler.html(result);
            }
          } else {
            if (editor === "select2" || editor === "select2withEmptyValue") {
              $input.select2("readonly", true);
            } else {
              $input.attr("readonly");
            }
          }
          switch (editor) {
            case "checkbox":
              $input.prop("checked", (val === "" ? false : val.bool()));
              break;
            case "select2":
              if (val === "") {
                $input.select2("val", "");
              } else {
                returnscolumn = columns.returnscolumn[i];
                returnscolumnid = general.prepareInsert.DATA[general.prepareInsert.NAMES.indexOf(returnscolumn)];
                $input.select2("data", {
                  id: returnscolumnid,
                  text: val
                });
              }
              break;
            case "select2withEmptyValue":
              if (val === "") {
                $input.select2("val", "");
              } else {
                returnscolumn = columns.returnscolumn[i];
                returnscolumnid = general.prepareInsert.DATA[general.prepareInsert.NAMES.indexOf(returnscolumn)];
                $input.select2("data", {
                  id: returnscolumnid,
                  text: val
                });
              }
              break;
            default:
              $input.val(val);
          }
        }
        return callback();
    }
  };

  MB.Form.prototype.updatecontroller = function(part, callback) {
    var $container, changeDate, column, columns, data, fn, fn1, fn2, fn3, general, handleSelect2, handleSelect2ForActionForm, handleSelect2FreeType, i, initSelect2, initSelect2ForActionForm, initSelect2FreeType, instance, j, k, l, len, len1, len2, len3, m, process, ref, ref1, ref2, ref3;
    instance = this;
    general = this.profile.general;
    data = this.data;
    columns = this.profile.columns;
    $container = this.$container;
    $container.find(".bt-menu-trigger").on("click", function(e) {
      return alert(777);
    });
    process = function(type, column, value) {
      console.log(type, column, value);
      if (column === 'COLOR') {
        $(".column-wrapper[data-column='COLOR'] .colorView").css('backgroundColor', value);
      }
      switch (type) {
        case "edit":
          if (instance.editingStorage == null) {
            instance.editingStorage = {
              command: "modify",
              object: general.object,
              sid: MB.User.sid
            };
            if (general.object === 'action') {
              if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data') !== null) {
                if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id !== $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text) {
                  if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id.indexOf('new_') === '-1') {
                    console.log('11-11-11', $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id, $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text);
                    instance.editingStorage.SHOW_ID = $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id;
                  }
                }
              }
            }
            instance.editingStorage.OBJVERSION = $container.find(".column-wrapper[data-column='OBJVERSION'] input").val();
            instance.editingStorage[general.primarykey] = instance.activeId;
            instance.editingStorage[column] = value;
            $container.find(".form-save-button").removeClass("disabled");
          } else {
            instance.editingStorage[column] = value;
            if (general.object === 'action') {
              if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data') !== null) {
                if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id !== $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text) {
                  if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id.indexOf('new_') === '-1') {
                    console.log('22-22-22', $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id, $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text);
                    instance.editingStorage.SHOW_ID = $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id;
                  }
                }
              }
            }
          }
          break;
        case "add":
          if (!instance.addingStorage) {
            instance.addingStorage = {};
          }
          instance.addingStorage[column] = value;
          if (general.object === 'action') {
            if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data') !== null) {
              if ($container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id.substr(4) !== $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text) {
                console.log('add-add-add', $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id.substr(4), $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').text);
                instance.addingStorage.SHOW_ID = $container.find(".column-wrapper[data-column='NAME'] div.form-control").select2('data').id;
              }
            }
          }
      }
      return console.log(instance);
    };
    handleSelect2 = function($input, column, i, isSelect2withEmptyValue, editOrAdd, isAfterAdd) {
      if (isAfterAdd) {
        $input.off("change");
      }
      return $input.on("change", function(e) {
        var accolumns, acobject, acreturnscolumns, ii, j, len, o, results, returnscolumn, val, value, where;
        console.log(e);
        console.log(isSelect2withEmptyValue);
        returnscolumn = columns.returnscolumn[i];
        if (isSelect2withEmptyValue) {
          val = e.val === "empty" ? "" : e.val;
        } else {
          val = e.val;
        }
        console.log(77777777, val);
        process(editOrAdd, returnscolumn, val);
        acreturnscolumns = columns.acreturnscolumns[i].split(",");
        if (isSelect2withEmptyValue && val === "") {
          results = [];
          for (ii = j = 0, len = acreturnscolumns.length; j < len; ii = ++j) {
            value = acreturnscolumns[ii];
            results.push(instance.$container.find("[data-column='" + value + "'] input").val(""));
          }
          return results;
        } else if (columns.accolumns[i] && val !== "") {
          acobject = columns.accommands[i];
          accolumns = columns.accolumns[i];
          where = returnscolumn + " = '" + e.val + "'";
          o = {
            command: "get",
            object: acobject,
            sid: MB.User.sid,
            columns: accolumns,
            where: where
          };
          return MB.Core.sendQuery(o, function(res) {
            var k, len1, results1;
            results1 = [];
            for (ii = k = 0, len1 = acreturnscolumns.length; k < len1; ii = ++k) {
              value = acreturnscolumns[ii];
              results1.push(instance.$container.find("[data-column='" + value + "'] input").val(res.DATA[0][ii]).trigger('change'));
            }
            return results1;
          });
        }
      });
    };
    handleSelect2ForActionForm = function($input, column, i, editOrAdd, isAfterAdd) {
      console.log(arguments);
      if (isAfterAdd) {
        $input.off("change");
      }
      return $input.on("change", function(e) {
        var _columns, accolumns, acobject, acreturnscolumns, o, pattern, returnscolumn, returnscolumnForStorage, test, val, valForStorage, where;
        _columns = instance.profile.columns;
        returnscolumnForStorage = _columns.returnscolumn[i].split(',')[1];
        returnscolumn = _columns.returnscolumn[i].split(',')[0];
        val = e.val;
        valForStorage = e.added.text;
        pattern = new RegExp("new_");
        test = pattern.test(val);
        if (test) {
          val = val.slice(4, val.length);
          return process(editOrAdd, column, val);
        } else {
          process(editOrAdd, returnscolumnForStorage, valForStorage);
          acreturnscolumns = _columns.acreturnscolumns[i].split(",");
          if (_columns.accolumns[i]) {
            acobject = _columns.accommands[i];
            accolumns = _columns.accolumns[i];
            where = returnscolumn + " = '" + e.val + "'";
            o = {
              command: "get",
              object: acobject,
              sid: MB.User.sid,
              columns: accolumns,
              where: where
            };
            return MB.Core.sendQuery(o, function(res) {
              var editorType, ii, j, len, ref, results, value;
              ref = res.NAMES;
              results = [];
              for (ii = j = 0, len = ref.length; j < len; ii = ++j) {
                value = ref[ii];
                editorType = instance.profile.columns.editor[instance.profile.columns.columnsdb.indexOf(value)];
                switch (editorType) {
                  case "select2":
                  case "select2withEmptyValue":
                  case "select2FreeType":
                    results.push(instance.$container.find("[data-column='" + value + "'] input").select2("data", {
                      id: res.DATA[0][ii],
                      text: res.DATA[0][ii]
                    }));
                    break;
                  default:
                    results.push(instance.$container.find("[data-column='" + value + "'] input").val(res.DATA[0][ii]).trigger('change'));
                }
              }
              return results;
            });
          }
        }
      });
    };
    handleSelect2FreeType = function($input, column, i, editOrAdd, isAfterAdd) {
      console.log(arguments);
      if (isAfterAdd) {
        $input.off("change");
      }
      return $input.on("change", function(e) {
        var accolumns, acobject, acreturnscolumns, o, pattern, returnscolumn, test, val, where;
        returnscolumn = columns.returnscolumn[i];
        val = e.val;
        pattern = new RegExp("new_");
        test = pattern.test(val);
        if (test) {
          val = val.slice(4, val.length);
          return process(editOrAdd, column, val);
        } else {
          process(editOrAdd, returnscolumn, val);
          acreturnscolumns = columns.acreturnscolumns[i].split(",");
          if (columns.accolumns[i]) {
            acobject = columns.accommands[i];
            accolumns = columns.accolumns[i];
            where = returnscolumn + " = '" + e.val + "'";
            o = {
              command: "get",
              object: acobject,
              sid: MB.User.sid,
              columns: accolumns,
              where: where
            };
            return MB.Core.sendQuery(o, function(res) {
              var editorType, ii, j, len, results, value;
              results = [];
              for (ii = j = 0, len = acreturnscolumns.length; j < len; ii = ++j) {
                value = acreturnscolumns[ii];
                editorType = instance.profile.columns.editor[instance.profile.columns.columnsdb.indexOf(value)];
                switch (editorType) {
                  case "select2":
                  case "select2withEmptyValue":
                  case "select2FreeType":
                    results.push(instance.$container.find("[data-column='" + value + "'] input").select2("data", {
                      id: res.DATA[0][ii],
                      text: res.DATA[0][ii]
                    }));
                    break;
                  default:
                    results.push(instance.$container.find("[data-column='" + value + "'] input").val(res.DATA[0][ii]).trigger('change'));
                }
              }
              return results;
            });
          }
        }
      });
    };
    initSelect2ForActionForm = function($input, column, i, mode) {
      var refcolumns, reference, returnscolumn;
      refcolumns = columns.refcolumns[i];
      console.log(refcolumns);
      reference = columns.references[i];
      returnscolumn = columns.returnscolumn[i];
      return $input.select2({
        placeholder: "Выберите...",
        alllowClear: true,
        initSelection: function(element, callback) {
          var text;
          text = $(element).val();
          return callback({
            id: text,
            text: text
          });
        },
        query: function(options) {
          return (function(i) {
            var o, refcolumn, refcolumnForSearch, result;
            console.log("options", options);
            result = {
              results: []
            };
            refcolumn = columns.refcolumns[i];
            refcolumnForSearch = columns.refcolumns[i].split(',')[1];
            reference = columns.references[i];
            returnscolumn = columns.returnscolumn[i];
            if (options.term !== "") {
              o = {
                command: "get",
                object: reference,
                columns: refcolumns,
                sid: MB.User.sid,
                where: "upper(" + refcolumnForSearch + ") like upper('%" + options.term + "%')"
              };
              return MB.Core.sendQuery(o, function(res) {
                var j, len, ref, value;
                ref = res.DATA;
                for (i = j = 0, len = ref.length; j < len; i = ++j) {
                  value = ref[i];
                  result.results.push({
                    id: value[0],
                    text: value[1]
                  });
                }
                result.results.push({
                  id: "new_" + options.term,
                  text: options.term
                });
                return options.callback(result);
              });
            } else {
              o = {
                command: "get",
                object: reference,
                columns: refcolumns,
                sid: MB.User.sid
              };
              return MB.Core.sendQuery(o, function(res) {
                var j, len, ref, value;
                result.results.push({
                  id: "",
                  text: ""
                });
                ref = res.DATA;
                for (i = j = 0, len = ref.length; j < len; i = ++j) {
                  value = ref[i];
                  result.results.push({
                    id: value[0],
                    text: value[1]
                  });
                }
                return options.callback(result);
              });
            }
          })(i);
        }
      });
    };
    initSelect2FreeType = function($input, column, i, mode) {
      var refcolumns, reference, returnscolumn;
      refcolumns = columns.refcolumns[i];
      reference = columns.references[i];
      returnscolumn = columns.returnscolumn[i];
      return $input.select2({
        placeholder: "Выберите...",
        alllowClear: true,
        initSelection: function(element, callback) {
          var id, text;
          if (mode === "add") {
            id = general.prepareInsert.DATA[general.prepareInsert.NAMES.indexOf(returnscolumn)];
          } else {
            id = data.data[0][data.names.indexOf(returnscolumn)];
          }
          text = $(element).val();
          return callback({
            id: id,
            text: text
          });
        },
        query: function(options) {
          return (function(i) {
            var o, result;
            console.log("options", options);
            result = {
              results: []
            };
            refcolumns = columns.refcolumns[i];
            reference = columns.references[i];
            returnscolumn = columns.returnscolumn[i];
            if (options.term !== "") {
              o = {
                command: "get",
                object: reference,
                columns: refcolumns,
                sid: MB.User.sid,
                where: "upper(" + (refcolumns.split(",")[1]) + ") like upper('%" + options.term + "%')"
              };
              return MB.Core.sendQuery(o, function(res) {
                var j, len, ref, value;
                ref = res.DATA;
                for (i = j = 0, len = ref.length; j < len; i = ++j) {
                  value = ref[i];
                  result.results.push({
                    id: value[0],
                    text: value[1]
                  });
                }
                result.results.push({
                  id: "new_" + options.term,
                  text: options.term
                });
                return options.callback(result);
              });
            } else {
              o = {
                command: "get",
                object: reference,
                columns: refcolumns,
                sid: MB.User.sid
              };
              return MB.Core.sendQuery(o, function(res) {
                var j, len, ref, value;
                result.results.push({
                  id: "",
                  text: ""
                });
                ref = res.DATA;
                for (i = j = 0, len = ref.length; j < len; i = ++j) {
                  value = ref[i];
                  result.results.push({
                    id: value[0],
                    text: value[1]
                  });
                }
                return options.callback(result);
              });
            }
          })(i);
        }
      });
    };
    initSelect2 = function($input, column, i, isSelect2withEmptyValue, mode) {
      var refcolumns, reference, returnscolumn;
      refcolumns = columns.refcolumns[i];
      reference = columns.references[i];
      returnscolumn = columns.returnscolumn[i];
      return $input.select2({
        placeholder: "Выберите...",
        alllowClear: true,
        initSelection: function(element, callback) {
          var id, text;
          if (mode === "add") {
            id = general.prepareInsert.DATA[general.prepareInsert.NAMES.indexOf(returnscolumn)];
          } else {
            id = data.data[0][data.names.indexOf(returnscolumn)];
          }
          text = $(element).val();
          return callback({
            id: id,
            text: text
          });
        },
        ajax: {
          url: "/cgi-bin/b2e",
          dataType: "json",
          data: function(term, page) {
            var o, where, whereColumn;
            o = {
              command: "get",
              object: reference,
              columns: refcolumns,
              sid: MB.User.sid
            };
            if (columns.selectwhere[i]) {
              where = '';
              whereColumn = columns.selectwhere[i];
              if (instance.addingStorage && instance.addingStorage.hasOwnProperty(columns.selectwhere[i])) {
                where = columns.selectwhere[i] + " = '" + instance.addingStorage[whereColumn] + "'";
              }
              o.where = where;
            }
            console.log(MB.Core.makeQuery(o));
            return {
              request: MB.Core.makeQuery(o)
            };
          },
          results: function(data, page) {
            console.log(data);
            data = MB.Form.parseforselect2data(data);
            if (isSelect2withEmptyValue) {
              data.unshift({
                id: "empty",
                text: ""
              });
            }
            if (!instance.dropdowns) {
              instance.dropdowns = {};
            }
            instance.dropdowns[returnscolumn] = data;
            return {
              results: data
            };
          }
        }
      });
    };
    changeDate = function(column, e, mode) {
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
      return process(mode, column, result);
    };
    console.log('PART fff', part);
    switch (part) {
      case "addinit":
        $container.find(".bt-menu-trigger").on("click", function(e) {
          return alert(777);
        });
        data = {
          names: columns.columnsdb
        };
        ref = data.names;
        fn = function(column, i) {
          var $fw, $input, editable, editor;
          editable = columns.editability[i].bool();
          editor = columns.editor[i];
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          $input = $fw.find("input");
          switch (editor) {
            case "File":
              return $input.on("change", function(e) {
                var addOrEditHere;
                addOrEditHere = instance.activeId === 'new' ? "add" : "edit";
                return process(addOrEditHere, column, $input.val());
              });
            case "checkbox":
              return $input.on("change", function(e) {
                var checked;
                checked = $(e.target).prop("checked");
                if (checked) {
                  return process("add", column, "TRUE");
                } else {
                  return process("edit", column, "FALSE");
                }
              });
            case "select2":
              initSelect2($input, column, i, false, "add");
              return handleSelect2($input, column, i, false, "add", false);
            case "select2withEmptyValue":
              initSelect2($input, column, i, true, "add");
              return handleSelect2($input, column, i, true, "add", false);
            case "select2FreeType":
              initSelect2FreeType($input, column, i, "add");
              return handleSelect2FreeType($input, column, i, "add", false);
            case "select2ForActionForm":
              initSelect2ForActionForm($input, column, i, "add");
              return handleSelect2ForActionForm($input, column, i, "add", false);
            case "datetime":
              return $input.datetimepicker({
                format: "dd.mm.yyyy hh:ii",
                autoclose: true,
                todayHighlight: true,
                startDate: new Date,
                minuteStep: 10,
                keyboardNavigation: true,
                todayBtn: true,
                firstDay: 1,
                weekStart: 1,
                language: "ru"
              }).on("changeDate", function(e) {
                return changeDate(column, e, "add");
              });
            case "colorpicker":
              return $input.colorpicker().on("changeColor", function(e) {
                var val;
                val = e.color.toHex();
                return process("add", column, val);
              });
            default:
              return $input.on("keyup change", function(e) {
                return process("add", column, e.target.value);
              });
          }
        };
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          column = ref[i];
          fn(column, i);
        }
        $container.find(".portlet-title").on("click", function(e) {
          var $target;
          $target = $(e.target);
          if ($target.hasClass("reload")) {
            return alert("Нельзя обновить запись в режиме добавления!");
          }
        });
        $container.find(".form-create-button").on("click", function(e) {
          return alert("Вы уже в режиме создания");
        });
        $container.find(".form-delete-button").on("click", function(e) {
          return alert("Нельзя ...");
        });
        $container.find(".form-save-button").on("click", function() {
          return MB.Core.sendQuery(instance.addingStorage, function(res) {
            var id;
            toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
            if (parseInt(res.RC) === 0) {
              id = res.ID;
              delete instance.addingStorage;
              instance.ids[0] = id;
              instance.prevActiveId = instance.activeId;
              instance.activeId = id;
              if (instance.parentobject) {
                MB.O.tables[instance.parentobject].reload("data");
              }
              return instance.reload("data after add");
            }
          });
        });
        if (general.custom.bool()) {
          return $.getScript("html/forms/" + instance.name + "/" + instance.name + ".js", function(data, status, xhr) {
            return instance.custom(function() {
              instance.tabs = new TabsClass({
                instance: instance
              });
              instance.tabs.updateState("addinit");
              return callback();
            });
          });
        } else {
          return callback();
        }
        break;
      case "init":
        ref1 = data.names;
        fn1 = function(column, i) {
          var $fw, $input, editable, editor;
          editable = columns.editability[i].bool();
          if (editable) {
            editor = columns.editor[i];
            $fw = $container.find(".column-wrapper[data-column='" + column + "']");
            $input = $fw.find("input");
            switch (editor) {
              case "File":
                return $input.on("change", function(e) {
                  return process("edit", column, $input.val());
                });
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
                initSelect2($input, column, i, false, "edit");
                return handleSelect2($input, column, i, false, "edit", false);
              case "select2withEmptyValue":
                initSelect2($input, column, i, true, "edit");
                return handleSelect2($input, column, i, true, "edit", false);
              case "select2FreeType":
                initSelect2FreeType($input, column, i, "edit");
                return handleSelect2FreeType($input, column, i, "edit", false);
              case "select2ForActionForm":
                initSelect2ForActionForm($input, column, i, "edit");
                return handleSelect2ForActionForm($input, column, i, "edit", false);
              case "datetime":
                return $input.datetimepicker({
                  format: "dd.mm.yyyy hh:ii",
                  autoclose: true,
                  todayHighlight: true,
                  minuteStep: 10,
                  keyboardNavigation: true,
                  todayBtn: true,
                  firstDay: 1,
                  weekStart: 1,
                  language: "ru"
                }).on("changeDate", function(e) {
                  return changeDate(column, e, "edit");
                });
              case "colorpicker":
                return $input.colorpicker().on("changeColor", function(e) {
                  var val;
                  val = e.color.toHex();
                  return process("edit", column, val);
                });
              default:
                return $input.on("keyup change", function(e) {
                  return process("edit", column, e.target.value);
                });
            }
          }
        };
        for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
          column = ref1[i];
          fn1(column, i);
        }
        $container.find(".gotos-wrapper li").on("click", function(e) {
          var o, object;
          object = $(this).data("goto");
          o = {
            type: "table",
            name: object
          };
          return MB.Core.switchModal(o);
        });
        $container.find(".portlet-title").on("click", function(e) {
          var $target;
          $target = $(e.target);
          if ($target.hasClass("reload")) {
            if (instance.addingStorage != null) {
              return alert("Нельзя обновить запись в режиме добавления!");
            } else if (instance.editingStorage != null) {
              return bootbox.dialog({
                message: "Вы уверены что не хотите сохранить изменения?",
                title: "Есть не сохраннные изменения",
                buttons: {
                  success: {
                    label: "Да",
                    assName: "green",
                    callback: function() {
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
              return instance.reload("data");
            }
          }
        });
        $container.find(".bt-menu-trigger").on("click", function(e) {
          return alert(777);
        });
        $container.find(".id-toggler").off().on("change", function(e) {
          var $toggler, val;
          $toggler = $(e.target);
          val = $toggler.val();
          if (instance.addingStorage != null) {
            return bootbox.dialog({
              message: "Новая запись будет утерена. Вы уверены что хотите продолжить?",
              title: "Есть не сохраннные изменения",
              buttons: {
                success: {
                  label: "Да",
                  assName: "green",
                  callback: function() {
                    delete instance.addingStorage;
                    return instance.reload("data after add");
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
            instance.prevActiveId = instance.activeId;
            instance.activeId = val;
            instance.ids.unshift;
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
                    return instance.updatemodel("add", null, function() {
                      return instance.updateview("add", function() {
                        return instance.updatecontroller("add", function() {});
                      });
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
            return instance.updatemodel("add", null, function() {
              return instance.updateview("add", function() {
                return instance.updatecontroller("add", function() {});
              });
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
        if (general.custom.bool()) {
          return $.getScript("html/forms/" + instance.name + "/" + instance.name + ".js", function(data, status, xhr) {
            return instance.custom(function() {
              instance.tabs = new TabsClass({
                instance: instance
              });
              instance.tabs.updateState("init");
              return callback();
            });
          });
        } else {
          return callback();
        }
        break;
      case "data":
        instance.tabs.updateState("edit");
        if (general.custom.bool()) {
          return $.getScript("html/forms/" + instance.name + "/" + instance.name + ".js", function(data, status, xhr) {
            return instance.custom(function() {
              instance.tabs = new TabsClass({
                instance: instance
              });
              instance.tabs.updateState("init");
              return callback();
            });
          });
        } else {
          return callback();
        }
        break;
      case "data after add":
        instance.tabs.updateState("edit");
        ref2 = data.names;
        fn2 = function(column, i) {
          var $fw, $input, editable, editor, updatable;
          editable = columns.editability[i].bool();
          $fw = $container.find(".column-wrapper[data-column='" + column + "']");
          $input = $fw.find("input");
          if (editable) {
            updatable = columns.updatability[i].bool;
            editor = columns.editor[i];
            if (updatable) {
              switch (editor) {
                case "File":
                  return $input.on("change", function(e) {
                    return process("edit", column, $input.val());
                  });
                case "checkbox":
                  return $input.off("change").on("change", function(e) {
                    var checked;
                    checked = $(e.target).prop("checked");
                    if (checked) {
                      return process("edit", column, "TRUE");
                    } else {
                      return process("edit", column, "FALSE");
                    }
                  });
                case "select2":
                  return handleSelect2($input, column, i, false, "edit", true);
                case "select2withEmptyValue":
                  return handleSelect2($input, column, i, true, "edit", true);
                case "select2FreeType":
                  return handleSelect2FreeType($input, column, i, false, "edit", true);
                case "select2ForActionForm":
                  return handleSelect2ForActionForm($input, column, i, false, "edit", true);
                case "datetime":
                  return $input.off("changeDate").on("changeDate", function(e) {
                    return changeDate(column, e, "edit");
                  });
                default:
                  return $input.off("keyup").on("keyup change", function(e) {
                    return process("edit", column, e.target.value);
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
          fn2(column, i);
        }
        $container.find(".portlet-title").off("click").on("click", function(e) {
          var $target;
          $target = $(e.target);
          if ($target.hasClass("reload")) {
            if (instance.addingStorage != null) {
              return alert("Нельзя обновить запись в режиме добавления!");
            } else if (instance.editingStorage != null) {
              return bootbox.dialog({
                message: "Вы уверены что не хотите сохранить изменения?",
                title: "Есть не сохраннные изменения",
                buttons: {
                  success: {
                    label: "Да",
                    assName: "green",
                    callback: function() {
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
              return instance.reload("data");
            }
          }
        });
        $container.find(".id-toggler").off("change").on("change", function(e) {
          var $toggler, val;
          $toggler = $(e.target);
          val = $toggler.val();
          if (instance.addingStorage != null) {
            return bootbox.dialog({
              message: "Новая запись будет утерена. Вы уверены что хотите продолжить?",
              title: "Есть не сохраннные изменения",
              buttons: {
                success: {
                  label: "Да",
                  assName: "green",
                  callback: function() {
                    delete instance.addingStorage;
                    return instance.reload("data after add");
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
            instance.prevActiveId = instance.activeId;
            instance.activeId = val;
            instance.ids.unshift;
            return instance.reload("data");
          }
        });
        $container.find(".form-create-button").off("click").on("click", function(e) {
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
                    return instance.updatemodel("add", null, function() {
                      return instance.updateview("add", function() {
                        return instance.updatecontroller("add", function() {});
                      });
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
            return instance.updatemodel("add", null, function() {
              return instance.updateview("add", function() {
                return instance.updatecontroller("add", function() {});
              });
            });
          }
        });
        $container.find(".form-delete-button").off("click").on("click", function(e) {
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
        if (general.custom.bool()) {
          return $.getScript("html/forms/" + instance.name + "/" + instance.name + ".js", function(data, status, xhr) {
            return instance.custom(function() {
              return callback();
            });
          });
        } else {
          return callback();
        }
        break;
      case "add":
        ref3 = data.names;
        fn3 = function(column, i) {
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
                  var newval, returnscolumn;
                  returnscolumn = columns.returnscolumn[i];
                  newval = e.val;
                  return process("add", returnscolumn, newval);
                });
              } else if (editor === "datetime") {
                return $input.off("changeDate").on("changeDate", function(e) {
                  return changeDate(column, e, "add");
                });
              } else {
                return $input.off("keyup").on("keyup", function(e) {
                  return process("add", column, e.target.value);
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
        for (i = m = 0, len3 = ref3.length; m < len3; i = ++m) {
          column = ref3[i];
          fn3(column, i);
        }
        $container.find(".form-save-button").off("click").on("click", function() {
          return MB.Core.sendQuery(instance.addingStorage, function(res) {
            var id;
            toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
            id = res.ID;
            delete instance.addingStorage;
            instance.ids.shift();
            instance.ids.unshift(id);
            instance.prevActiveId = instance.activeId;
            instance.activeId = id;
            return instance.reload("data after add");
          });
        });
        instance.tabs.updateState("edit");
        return callback();
    }
  };

  MB.Form.prototype.reload = function(part, callback) {
    var instance;
    instance = this;
    switch (part) {
      case "data":
        return instance.getdata(instance.activeId, function(res) {
          return instance.updatemodel("data", res, function() {
            return instance.updateview("data", function() {
              return instance.updatecontroller("data", function() {
                if (instance.profile.general.childobject) {
                  MB.O.tables[instance.profile.general.childobject].reload("data");
                }
                if (instance.parentobject) {
                  MB.O.tables[instance.parentobject].reload("data");
                }
                if (callback) {
                  return callback();
                }
              });
            });
          });
        });
      case "data after add":
        return instance.getdata(instance.activeId, function(res) {
          return instance.updatemodel("data", res, function() {
            return instance.updateview("data after add", function() {
              return instance.updatecontroller("data after add", function() {
                if (callback) {
                  return callback();
                }
              });
            });
          });
        });
    }
  };

}).call(this);
