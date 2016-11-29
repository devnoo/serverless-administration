var google = require('googleapis');
var googleAuth = require('google-auth-library');
var _ = require('lodash');

var SCOPES = ['https://www.googleapis.com/auth/drive'];
module.exports = function (jwtKey, defaultParentFolder) {
    var jwtClient = createJsonWebTokenClient(jwtKey)

    return {
        createFile: _.partial(createFile, jwtClient, _, _, _, defaultParentFolder),
        createTextFile: _.partial(createFile, jwtClient, _, _, "plain/text", defaultParentFolder)

    };
};

function createFile(auth, fileName, content, mimeType, parentId) {
    var service = google.drive('v3');
    service.files.create({
        auth: auth,
        resource: {
            name: fileName,
            mimeType: mimeType,
            parents: [parentId]
        },
        media: {
            mimeType: mimeType,
            body: content
        }
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function createJsonWebTokenClient(key) {
    // var redirectUrl = credentials.installed.redirect_uris[0];

    var jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        SCOPES,
        null
    );

    return jwtClient;
}

