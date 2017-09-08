var sendFeedback = require('../modules/sendMail').sendFeedback;
var funcs = require('../libs/functions');
module.exports.post = function(req, res, next){
    var html = req.body.html;
    if (!html){
        return res.status(500).send('Не передан параметр html');
    }
    sendFeedback({html:html},function(err){
        if (err){
            console.log(err);
            return res.status(200).send(funcs.formatResponse(-1, 'error', 'При отправки почты возникли проблемы. Попробуйте повторить попытку позже.'));
        }
        return res.status(200).send(funcs.formatResponse(0, 'success', 'Сообщение успешно отправлено'));
    })
};