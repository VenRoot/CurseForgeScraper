import fs from "fs";
import minimist from "minimist";
import path from "path";
import ini from "ini";
import Scraper from "./Scraper";

interface Arguments {
    file?: string;
    help?: boolean;
    useid?: boolean;
    version?: boolean;
}

interface Config {
    mods: string[];
    gameVersions: string[];
    modIDs?: string[];
}

interface ParseResult {
    success: boolean;
    message: string;
    config?: Config;
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
            useid: argv.id,
            help: argv.help,
            version: argv.version
        }
        return args;
    }

    private createExample() {

        const example = {
            mods: [
                "mod1",
                "mod2"
            ],
            versions: [
                "1.5.2",
                "1.7.2",
                "1.8.9",
                "1.20",
            ],
            modIds: [
                1234,
                5678
            ]
        }

        console.log("A config example will be created...");
        fs.writeFileSync("./config.example.json", JSON.stringify(example, null, 2));

        fs.writeFileSync("./config.example.ini", ini.stringify(example))
    }
    // Hauptmethode, die Dateien parsed
    private parseFile(_file: string): ParseResult {
        const extension = path.extname(_file);
        console.log(_file);

        if (extension === '.ini') {
            return this.parseIniFile(_file);
        } else if (extension === '.json') {
            return this.parseJsonFile(_file);
        } else {
            return { success: false, message: "[parseFile] Invalid file type. Only .ini and .json are supported" };
        }
    }

    // Methode für das Parsen von INI-Dateien
    private parseIniFile(filePath: string): ParseResult {
        console.log("Parsing INI file");
        const fileContents = fs.readFileSync(filePath).toString();
        const config = ini.parse(fileContents) as Config;

        if (this.arguments.useid) {
            return this.validateConfigWithIDs(config);
        } else {
            return this.validateConfigWithMods(config, "ini");
        }
    }

    // Methode für das Parsen von JSON-Dateien
    private parseJsonFile(filePath: string): ParseResult {
        console.log("Parsing JSON file");
        const fileContents = fs.readFileSync(filePath).toString();
        let config: Config;

        try {
            config = JSON.parse(fileContents);
        } catch (err) {
            return { success: false, message: "Invalid config file. Please make sure it is valid JSON" };
        }

        if(this.arguments.useid) {
            return this.validateConfigWithIDs(config);
        }
        
        return this.validateConfigWithMods(config, "json");
    }

    // Validierung für den Fall, dass IDs verwendet werden
    private validateConfigWithIDs(config: Config): ParseResult {
        if (!Array.isArray(config.gameVersions)) {
            this.createExample();
            return { success: false, message: "Invalid config file. Please refer to the example file" };
        }
        if(!Array.isArray(config.modIDs) && this.arguments.useid) {
            this.createExample();
            return { success: false, message: "You used the -i flag, but didn't configure any modIDs. Please refer to the example file" };
        }

        return { success: true, message: "ini", config: { modIDs: config.modIDs, gameVersions: config.gameVersions, mods: config.mods } };
    }

    // Validierung für den Fall, dass Mods verwendet werden
    private validateConfigWithMods(config: Config, filetype: "json" | "ini"): ParseResult {
        console.log("validating config json file");
        if (!Array.isArray(config.mods) || !Array.isArray(config.gameVersions)) {
            this.createExample();
            return { success: false, message: "Invalid config file. Please refer to the example file" };
        }

        return { success: true, message: filetype, config: { mods: config.mods, gameVersions: config.gameVersions } };
    }

    private checkConfigFiles(): {success: boolean, message: string} {

        if(this.arguments.file) {
            if(path.extname(this.arguments.file) === ".ini" || path.extname(this.arguments.file) === ".json") {
                return {success: true, message: this.arguments.file};
            }
            else {
                return {success: false, message: "Invalid file type. Only .ini and .json are supported"};
            }
        }

        const iniExists = fs.existsSync("./config.ini");
        const jsonExists = fs.existsSync("./config.json");


        console.log(iniExists, jsonExists);

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
        if(this.arguments.help) {
            console.log("Usage: curseforge-scraper [options]");
            console.log("Options:");
            console.log("  -f, --file <file>    Specify a config file");
            console.log("  -h, --help           Display this help message");
            console.log("  -i, --id             Use mod IDs instead of names");
            console.log("  -v, --version        Display the version");
            process.exit(0);
        }
        if(this.arguments.version) {
            const packageJson = JSON.parse(fs.readFileSync("./package.json").toString());
            console.log(packageJson.version);
            process.exit(0);
        }
        if(this.arguments.useid) {
            console.log("Using mod IDs instead of names");
        }
        const configFiles = this.checkConfigFiles();
        if(!configFiles.success)
        {
            console.log("[checkConfigFiles]: "+configFiles.message);
            process.exit(1);
        }
        const parseResult = this.parseFile(configFiles.message);
        if(!parseResult.success) {
            console.log("[parseFile]: "+parseResult.message);
            process.exit(1);
        }
        this.config = parseResult.config!;

        if(this.config.modIDs === undefined && this.arguments.useid) {
            console.log("No mod IDs found in config file");
            process.exit(1);
        }

        console.log(this.config.gameVersions);
        const scraper = new Scraper(this.baseURL, this.path, this.parameters, this.config.mods ?? this.config.modIDs, this.config.gameVersions, this.arguments.useid);

        this.arguments.useid ? scraper.scrapeWithId(this.config.modIDs!).then((mods) => {
            if(mods === undefined) {
                console.log("An error occured while scraping");
                process.exit(1);
            }
            scraper.displayIncompatibleMods(mods);
            scraper.save(mods);

            console.log("Your mods have been saved to mods.json")
        }) : scraper.scrape().then((mods) => {
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