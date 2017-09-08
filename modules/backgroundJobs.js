var api = require('../libs/api');

var daily = {
    updateAges:function(){
        api('updateUserAges', 'user', {},function(err,result){
            if (err){
                console.log(err);
            }else{
                console.log('Обновлено ',result, ' пользователей.');
            }
        });
    },
    actionAutoFinish: function(){
        console.log('actionAutoFinish');
        api('autoFinish', 'action', {},function(err,result){
            if (err){
                console.log(err);
            }else{
                console.log('Обновлено ',result, ' мероприятий.');
            }
        });
    },
    actionPartAutoFinish: function(){
        console.log('actionPartAutoFinish');
        api('autoFinish', 'action_part', {},function(err,result){
            if (err){
                console.log(err);
            }else{
                console.log('Обновлено ',result, ' этапов мероприятий.');
            }
        });
    }
};
module.exports.daily = daily;