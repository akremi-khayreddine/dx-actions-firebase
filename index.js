const exec = require('@actions/exec');
const core = require('@actions/core');
const { post } = require("axios").default;
const { writeFileSync, readFileSync } = require("fs");
const { google } = require('googleapis');

function getAccessToken(private_key, client_email) {
    return new Promise(function (resolve, reject) {
        var jwtClient = new google.auth.JWT(
            client_email,
            null,
            private_key,
            ["https://www.googleapis.com/auth/firebase.hosting", "https://www.googleapis.com/auth/cloud-platform"],
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}

run = async () => {
    const firebase_token = "1//03W8MhNPLrnvWCgYIARAAGAMSNwF-L9IrtMsPyYYAlKOBIrXnrI-AQvAsNm8t0pKMqDDXQLwCiWnOVnWutsaVDT6-CAV1YDQvsrM";

    const firebase_project = core.getInput("firebase_project");
    const firebase_target = core.getInput("firebase_target");
    const firebase_hosting = core.getInput("firebase_hosting");
    const firebase_predeploy = core.getInput("firebase_predeploy");

    const app_dist = core.getInput("app_dist");
    const app_version = core.getInput("app_version") ? core.getInput("app_version") : "0.0.1";

    const config = {
        firebase_project,
        firebase_target,
        firebase_hosting,
        app_dist,
        firebase_predeploy
    };

    //const firebasercTemplate = readFileSync("firebaserc.template");
    //const firebasercContent = transforme(firebasercTemplate.toString(), config);
    //writeFileSync(".firebaserc", firebasercContent);

    //const firebaseJsonTemplate = readFileSync("firebase.template");
    //const firebaseJsonContent = transforme(firebaseJsonTemplate.toString(), config);
    //writeFileSync("firebase.json", firebaseJsonContent);

    core.startGroup("Firebase deploy");
    await getAccessToken(process.env.GOOGLE_PRIVATE_KEY, process.env.GOOGLE_CLIENT_EMAIL).then(token => {
        return post(`https://firebasehosting.googleapis.com/v1beta1/sites/dl-ui-dev/versions`, {
        }, {
            headers: {
                'authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': '134'
            }
        }).then(result => {
            console.log(result);
        }).catch(error => {
            console.log(error.message);
        });
    });
    core.endGroup();
}

transforme = (item, configurations) => {
    if (hasPlaceholder(item)) {
        const placeholder = getPlaceholder(item);
        const value = getPlaceholderValue(
            configurations,
            placeholder,
            item
        );
        return value;
    } else {
        return item;
    }
}

hasPlaceholder = (value) => {
    return value.indexOf("${{") !== -1;
}

getPlaceholder = (value) => {
    const start = value.indexOf("${{");
    const end = value.indexOf("}}");
    const result = value.substring(start, end + 2).trim();
    return result;
}

trimPlaceholder = (value) => {
    return value
        .replace("${{", "")
        .replace("}}", "")
        .trim();
}

getPlaceholderValue = (item, placeholder, value) => {
    const placeholderValue = item[trimPlaceholder(placeholder)];
    const result = value.replace(placeholder, placeholderValue);
    if (hasPlaceholder(result)) {
        const newplaceholder = getPlaceholder(result);
        return getPlaceholderValue(item, newplaceholder, result);
    }
    return result;
}

run();