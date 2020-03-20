const exec = require('@actions/exec');
const core = require('@actions/core');
const { writeFileSync } = require("fs");

const firebaseJsonTemplate = require("./firebase-template.json");
const firebasercTemplate = require("./firebaserc-template.json");

run = () => {
    const firebase_token = process.env.FIREBASE_TOKEN;

    const firebase_project = core.getInput("firebase_project");
    const firebase_target = core.getInput("firebase_target");
    const firebase_hosting = core.getInput("firebase_hosting");
    const firebase_predeploy = core.getInput("firebase_predeploy");

    const app_dist = core.getInput("app_dist");
    const app_version = core.getInput("app_version");

    const config = {
        firebase_project,
        firebase_target,
        firebase_hosting,
        app_dist,
        firebase_predeploy
    };

    const firebasercContent = transforme(JSON.stringify(firebasercTemplate), config);
    writeFileSync(".firebaserc", firebasercContent);

    const firebaseJsonContent = transforme(JSON.stringify(firebaseJsonTemplate), config);
    writeFileSync("firebase.json", firebaseJsonContent);

    const cmd = `node node_modules/firebase-tools/lib/bin/firebase.js deploy --only hosting:${firebase_target} --token ${firebase_token} -m "${app_version}"`;
    exec.exec(cmd).catch((error) => {
        console.log(error.message);
    });
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