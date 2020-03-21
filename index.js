const core = require('@actions/core');
const cli = require("firebase-tools");
const { writeFileSync, readFileSync } = require("fs");

run = async () => {
    try {
        const token = process.env.FIREBASE_TOKEN;

        const version = core.getInput("version") ? core.getInput("version") : "0.0.1";
        const app_dist = core.getInput("app_dist");
        const firebase_project = core.getInput("firebase_project");
        const firebase_target = core.getInput("firebase_target");
        const firebase_hosting = core.getInput("firebase_hosting");
        const firebase_predeploy = core.getInput("firebase_predeploy");
        const firebase_postdeploy = core.getInput("firebase_postdeploy");

        const config = {
            firebase_project,
            firebase_target,
            firebase_hosting,
            app_dist,
            firebase_predeploy,
            firebase_postdeploy
        };

        core.startGroup("Set up templates");
        const firebasercTemplate = readFileSync(".firebaserc");
        const firebasercContent = transforme(firebasercTemplate.toString(), config);
        writeFileSync(".firebaserc", firebasercContent);

        const firebaseJsonTemplate = readFileSync("firebase.json");
        const firebaseJsonContent = transforme(firebaseJsonTemplate.toString(), config);
        writeFileSync("firebase.json", firebaseJsonContent);

        core.endGroup();
        core.startGroup("Firebase deploy");

        await cli.deploy({
            token,
            only: `hosting:${firebase_target}`,
            message: `${version}`
        });

        core.endGroup();
    } catch (error) {
        core.setFailed(error.message);
    };
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