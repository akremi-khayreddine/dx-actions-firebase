const exec = require('@actions/exec');
const core = require('@actions/core');
const { join } = require("path");
const { writeFileSync, readFileSync } = require("fs");

run = async () => {
    try {
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

        const firebasercTemplate = readFileSync("firebaserc.template");
        const firebasercContent = transforme(firebasercTemplate.toString(), config);
        writeFileSync(".firebaserc", firebasercContent);

        const firebaseJsonTemplate = readFileSync("firebase.template");
        const firebaseJsonContent = transforme(firebaseJsonTemplate.toString(), config);
        writeFileSync("firebase.json", firebaseJsonContent);

        core.startGroup("Firebase deploy");
        const firebaseCliPath = "node_modules/firebase-tools/lib/bin/firebase.js";
        const cmd = `node ${firebaseCliPath} deploy --only hosting:${firebase_target} --token ${firebase_token} -m "${app_version}"`;
        exec.exec(cmd).then((result) => {
            console.log(result);
        }).catch((error) => {
            console.log(error);
        });
        core.endGroup();
    } catch (error) {
        core.setFailed(error);
    }
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