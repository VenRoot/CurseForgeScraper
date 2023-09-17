import Scraper from "./Scraper";
import fs from "fs";

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
            ]
        }, null, 2));
    }
    process.exit(1);
}

const file = fs.readFileSync("./config.json").toString();
let mods: {mods: string[]};
try {
    mods = JSON.parse(file) as {mods: string[]};
}
catch(err) {
    console.log("Invalid config.json file");
    console.log("Please make sure it is valid JSON");
    process.exit(1);
}

if(!mods.mods || !Array.isArray(mods.mods)) {
    console.log("Invalid config.json file");
    console.log("Please make sure it is valid JSON and refer to the example file");
    process.exit(1);
}

const modNames = JSON.parse(fs.readFileSync("./config.json").toString()).mods;

const scraper = new Scraper(baseURL, path, parameters, modNames);

console.log(scraper.URLs);

scraper.scrape().then((mods) => {
    scraper.displayIncompatibleMods(mods, "1.20");
    scraper.displayIncompatibleMods(mods, "1.19");
    scraper.displayIncompatibleMods(mods, "1.18");
    scraper.save(mods);
})