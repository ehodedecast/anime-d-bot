const fs = require("fs");

const en = require("../lang/en.json");
const pt = require("../lang/pt.json");


const languages = {
    en,
    pt
};

const configPath = './data/config.json';

function getGuildLanguage(guildId) {
    try {
        if (!fs.existsSync(configPath)) {
            return "en";
        }

        const config = JSON.parse(
            fs.readFileSync(configPath)
        );

        return config[guildId]?.language || "en";
    } catch (err) {
        console.error("Language system error:", err);
        return "en";
    }
}

function t(guildId, key) {
    const lang = getGuildLanguage(guildId);

    return (
        languages[lang]?.[key] ||
        languages.en[key] ||
        key
    );
}

module.exports = {
    t,
    getGuildLanguage
};