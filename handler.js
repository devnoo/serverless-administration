'use strict';

var AWS = require('aws-sdk');
var Promise = require('bluebird');
AWS.config.setPromisesDependency(require('bluebird'));


var fs = Promise.promisifyAll(require('fs'));
var s3 = new AWS.S3();
var MailParser = require("mailparser").MailParser;
var GoogleDriveApi = require('./google-drive-api.js')

var mailparser = new MailParser();

var orderIdRegex = new RegExp(".*#([0-9]*)");

var kms =  new AWS.KMS({region: 'eu-west-1'});



// successful response
// })
;
var driveApiPromise = fs.readFileAsync('./google-key')
    .then(function (key) {
        return kms.decrypt({CiphertextBlob: key}).promise();
    })
    .then(function (jsonKey) {
        console.log(jsonKey);
        return new GoogleDriveApi(JSON.parse(jsonKey['Plaintext']), "0BwU1vZ744B5tRVFoVzgyQklTT2s")
    });

module.exports.processInvoice = function (event, context, callback) {
    console.log('Process email');

    var sesNotification = event.Records[0].ses;

    s3.getObject({
        Bucket: "emails-invoice-copy",
        Key: sesNotification.mail.messageId
    }).promise()
        .then(processRawEmail)
        .then(processParsedEmail)
        .then(saveToDrive);

    callback(null, {"disposition": "CONTINUE"});
};

function saveToDrive(parsedEmail) {
    driveApiPromise.then(function (driveApi) {
        driveApi.createTextFile(parsedEmail.orderId + ".txt", parsedEmail.text);
    });
}
function processParsedEmail(mail_object) {
    var text = mail_object.text;
    var parsedMail = {};
    parsedMail.orderId = orderIdRegex.exec(mail_object.subject)[1];
    parsedMail.text = mail_object.body;
    return parsedMail;
}

function processRawEmail(data) {
    console.log("Raw email:\n" + data.Body);
    console.log(data.body);

    var promise = new Promise(function (resolve, reject) {
        mailparser.on("end", resolve);
    });

    mailparser.write(data.Body);
    mailparser.end();
    return promise;
}
