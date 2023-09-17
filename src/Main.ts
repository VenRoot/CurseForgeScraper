import fs from "fs";
import minimist from "minimist";
import path from "path";
import ini from "ini";
import Scraper from "./Scraper";

interface Arguments {
    file?: string;
    help?: boolean;
    version?: boolean;
}

interface Config {
    mods: string[];
    gameVersions: string[];
}


export default class Main {

    private readonly baseURL = "https://curseforge.com";
    private readonly path = "/api/v1/mods/search?";
    private readonly parameters: Record<string, string> = {
        "gameId": "432", // 432 = Minecraft
        "index": "0",
        "classId": "6", //Only show mods
        "filterText": "", // The search query
        "pageSize": "20",
        "sortField": "1" 
    };
    private arguments: Arguments;
    private config: Config;

    private parseArguments(argv: minimist.ParsedArgs): Arguments {
        const args: Arguments = {
            file: argv.file,
            help: argv.help,
            version: argv.version
        }
        return args;
    }

    private createExample() {
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

        fs.writeFileSync("./config.example.ini", ini.stringify({
            "mods": ["mod1, mod2"],
            "gameVersions": ["1.5.2, 1.7.2, 1.8.9, 1.20"],
            "modIDs": [1234, 5678]
        }))
    }

    private parseFile(_file: string, withIds = false): {success: boolean, message: string, config?: Config} {
        // Check if file is valid JSON or INI
        if(path.extname(_file) === ".ini")
        {
            const result = {
                gameVersions: [] as string[],
                mods: [] as string[],
                modIDs: [] as string[]
            }
            // Parse INI
            const file = fs.readFileSync(_file).toString();
            const config = ini.parse(file) as {mods: string[], gameVersions: string[], modIDs: string[]};
            
            if(withIds) {
                if(!Array.isArray(config.modIDs)) {
                    this.createExample();
                    return {success: false, message: "Invalid config file. You used the --useid flag but no modIDs were found. Please refer to the example file"};
                }
                if(!Array.isArray(config.modIDs) || !Array.isArray(config.gameVersions)) {
                    this.createExample();
                    return {success: false, message: "Invalid config file. Please refer to the example file"};
                }
                result.modIDs = config.modIDs;
            }
            else {
                if(!Array.isArray(config.mods) || !Array.isArray(config.gameVersions)) {
                    this.createExample();
                    return {success: false, message: "Invalid config file. Please refer to the example file"};
                }
                result.mods = config.mods;
            }

            result.gameVersions = config.gameVersions;

            return {success: true, message: "ini", config: result};
        }
        else if(path.extname(_file) === ".json")
        {
            // Parse JSON
            const file = fs.readFileSync(_file).toString();
            let config: {mods: string[], gameVersions: string[]};
            try {
                config = JSON.parse(file) as Config;
            }
            catch(err) {
                return {success: false, message: "Invalid config file. Please make sure it is valid JSON"};
            }
            if(!config.mods || !Array.isArray(config.mods)) {
                return {success: false, message: "Invalid config file. Please refer to the example file"};
            }
            if(!config.gameVersions || !Array.isArray(config.gameVersions)) {
                return {success: false, message: "Invalid config file. Please refer to the example file"};
            }
            return {success: true, message: "json", config: config};
        }
        else {
            return {success: false, message: "Invalid file type. Only .ini and .json are supported"};
        }
    }

    private checkConfigFiles(): {success: boolean, message: string} {

        if(this.arguments.file)
        {
            if(path.extname(this.arguments.file) === ".ini" || path.extname(this.arguments.file) === ".json") {
                return {success: true, message: path.extname(this.arguments.file).slice(1)};
            }
            else {
                return {success: false, message: "Invalid file type. Only .ini and .json are supported"};
            }
        }

        const iniExists = fs.existsSync("./config.ini");
        const jsonExists = fs.existsSync("./config.json");


        if(iniExists && jsonExists)
        {
            return {success: false, message: "Both config.ini and config.json exist. Please specify with -f or --file or delete one of them"};
        }

        if(!iniExists && !jsonExists)
        {
            this.createExample();
            return {success: false, message: "Neither config.ini nor config.json exist. Please create one of them or specify with -f or --file\n\nA config example file is provided as an example\nPlease edit it and rename it to config.json or config.ini"};
        }

        if(iniExists)
        {
            return {success: true, message: "./config.ini"};
        }

        return {success: true, message: "./config.json"};
    }

    public constructor(argv: minimist.ParsedArgs)
    {
        this.arguments = this.parseArguments(argv);
        const configFiles = this.checkConfigFiles();
        if(!configFiles.success)
        {
            console.log(configFiles.message);
            process.exit(1);
        }

        const parseResult = this.parseFile(configFiles.message, argv.useid);
        if(!parseResult.success) {
            console.log(parseResult.message);
            process.exit(1);
        }

        this.config = parseResult.config!;

        console.log(this.config.gameVersions);

        const scraper = new Scraper(this.baseURL, this.path, this.parameters, this.config.mods, this.config.gameVersions);

        scraper.scrape().then((mods) => {
            if(mods === undefined) {
                console.log("An error occured while scraping");
                process.exit(1);
            }
            scraper.displayIncompatibleMods(mods);
            scraper.save(mods);

            console.log("Your mods have been saved to mods.json")
        });

    }
}