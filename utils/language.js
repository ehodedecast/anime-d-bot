const fs = require("fs");

const en = require("../lang/en.json");
const pt = require("../lang/pt.json");
const es = require("../lang/es.json");


const languages = {
    en,
    pt,
    es
};
    
const configPath = './data/config.json';
const userProfilesPath = './data/userProfiles.json';

const supportedLanguages = new Set([
    'en',
    'pt',
    'es'
]);

function normalizeLanguage(language) {
    return supportedLanguages.has(language)
        ? language
        : null;
}

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

function getUserLanguage(userId, fallbackGuildId = null) {
    try {
        if (!fs.existsSync(userProfilesPath)) {
            return getGuildLanguage(fallbackGuildId);
        }

        const profiles = JSON.parse(
            fs.readFileSync(userProfilesPath)
        );

        return (
            normalizeLanguage(
                profiles[userId]?.preferences?.language
            ) ||
            getGuildLanguage(fallbackGuildId)
        );
    } catch (err) {
        console.error("User language system error:", err);
        return getGuildLanguage(fallbackGuildId);
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

function tServer(guildId, key) {
    return t(guildId, key);
}

function tUser(userId, key, fallbackGuildId = null) {
    const lang = getUserLanguage(
        userId,
        fallbackGuildId
    );

    return (
        languages[lang]?.[key] ||
        languages.en[key] ||
        key
    );
}

module.exports = {
    t,
    tServer,
    tUser,
    getGuildLanguage,
    getUserLanguage,
    normalizeLanguage
};
