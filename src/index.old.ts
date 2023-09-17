import Scraper from "./Scraper";
import fs from "fs";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

const baseURL = "https://curseforge.com";
const path = "/api/v1/mods/search?";
const parameters: Record<string, string> = {
    "gameId": "432", // 432 = Minecraft
    "index": "0",
    "classId": "6", //Only show mods
    "filterText": "", // The search query
    "pageSize": "20",
    "sortField": "1" 
};

if(!fs.existsSync("./config.json"))
{
    console.log("Please create a config.json file with your mods");
    if(fs.existsSync("./config.example.json")) {
        console.log("A config.example.json file is provided as an example");
        console.log("Please edit it and rename it to config.json");
    }
    else {
        console.log("No config.example.json file found");
        console.log("A config example will be created...");
        fs.writeFileSync("./config.example.json", JSON.stringify({
            "mods": [
                "mod1",
                "mod2"
            ],
            "versions": [
                "1.5.2",
                "1.7.2",
                "1.8.9",
                "1.20",
            ],
            "modIds": [
                1234,
                5678
            ]
        }, null, 2));
    }
    process.exit(1);
}

const file = fs.readFileSync("./config.json").toString();
let config: {mods: string[], gameVersions: string[]};
try {
    config = JSON.parse(file) as {mods: string[], gameVersions: string[]};
}
catch(err) {
    console.log("Invalid config.json file");
    console.log("Please make sure it is valid JSON");
    process.exit(1);
}

if(!config.mods || !Array.isArray(config.mods)) {
    console.log("Invalid config.json file");
    console.log("Please make sure it is valid JSON and refer to the example file");
    process.exit(1);
}

const modNames = config.mods;

const scraper = new Scraper(baseURL, path, parameters, modNames, config.gameVersions);

console.log(scraper.URLs);

scraper.scrape().then((mods) => {
    scraper.displayIncompatibleMods(mods);
    scraper.save(mods);
})