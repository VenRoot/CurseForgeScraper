import ResponseData from "./curseforge.type";
import fs from "fs/promises";

export default class Scraper {
  private baseURL: string;
  private path: string;
  private parameters: Record<string, string>;
  public URLs: string[];
  private gameVersions: string[];
  private useId: boolean;

  constructor(
    baseURL: string,
    path: string,
    parameters: Record<string, string>,
    modNames: string[],
    gameVersions: string[],
    useId = false
  ) {
    this.baseURL = baseURL;
    this.path = path;
    this.parameters = parameters;
    this.URLs = [];
    this.gameVersions = gameVersions;
    this.useId = useId;

    modNames.forEach((modName) => {
      const parameter: Record<string, string> = {
        ...this.parameters,
        filterText: modName,
      };
      const url =
        this.baseURL + this.path + new URLSearchParams(parameter).toString();
        this.URLs.push(url);
    });
  }

  public addVersions(versions: string[]) {
    this.parameters.gameVersion = versions.join(",");
  }

  private getGameVersionsFromResponse(data: ModResponse): [string[], string] {
    let gameVersionsSet: Set<string> = new Set();
    let flavor: Set<"Fabric" | "Forge" | "Both"> = new Set();
  
    for (const recentFile of data.data[0].websiteRecentFiles) {
      for (const file of recentFile.files) {
        for (const version of file.gameVersions) {
          // Use a regex to check if the element is a game version
          if (/^\d+\.\d+(\.\d+)?$/.test(version)) {
            gameVersionsSet.add(version);
          }
          else if(version === "Fabric" || version === "Forge") {
            flavor.add(version);
          }
        }
      }
    }

    return [Array.from(gameVersionsSet), flavor.size === 2 ? "Both" : flavor.values().next().value as "Fabric" | "Forge" | "Both"];
  }

  private getFlavor() {

  }

  public async findAllMods(modIDs: string[]) {
    const parameters: Record<string, string> = {
      "gameId": "432", // 432 = Minecraft
      "classId": "6", //Only show mods
      "index": "0",
      "pageSize": "50",
      "sortField": "1" 
    };

    const results = [] as {modId: number, found: boolean}[];
    for(const modId of modIDs) {
      results.push({modId: parseInt(modId), found: false});
    }

    const params = new URLSearchParams(parameters);
    const mods = [] as ModInfo[];
    console.log("Fetching all mods... this may take a while");
    while(results.some((result) => !result.found)) {
      const response = await fetch(this.baseURL + this.path + params.toString());
      const json = (await response.json()) as ModResponse;
      if(json.data === undefined) {
        // End of results
        break;
      }
      else {
        console.log(json.pagination.index);
        json.data.find(mod => {
          const result = results.find(result => result.modId === mod.id);
          if(result !== undefined) {
            const versions = this.getGameVersionsFromResponse(json);
            result.found = true;
            mods.push({
              name: mod.name,
              id: mod.id,
              gameVersions: versions[0],
              url: "https://www.curseforge.com/minecraft/mc-mods/"+mod.slug,
              flavor: versions[1] as "Fabric" | "Forge" | "Both"
            });
          }
        });
        params.set("index", (json.pagination.index + 1).toString());
      }

    }
    console.log("Done!");
    return mods;
  }

  public async scrapeWithId(modIDs: string[]): Promise<ModInfo[]> {
    const mods = await this.findAllMods(modIDs);
    console.log("Found "+mods.length+" mods");
    return mods;
  }
  

  public async scrape(): Promise<ModInfo[]> {
    const mods: ModInfo[] = [];

    await Promise.all(
      this.URLs.map(async (url) => {
        const response = await fetch(url);
        const json = (await response.json()) as ModResponse;
        if(json.data.length === 0)
        {
          console.log(`No mod found for ${url}`);
          return;
        }

        this.gameVersions = this.getGameVersionsFromResponse(json)[0];
        

        const mod: ModInfo = {
          name: json.data[0].name,
          id: json.data[0].id,
          // gameVersions: json.data[0].latestFileDetails.gameVersions,
          gameVersions: this.gameVersions,
          url: "https://www.curseforge.com/minecraft/mc-mods/"+json.data[0].slug,
          flavor: this.gameVersions[1] as "Fabric" | "Forge" | "Both"
        };

        mods.push(mod);
      })
    );
    return mods;
  }

  public async save(mods: ModInfo[]) {
    const json = JSON.stringify(mods, null, 2);
    await fs.writeFile("./mods.json", json);
  }

  public getMostCommonGameVersion(mods: ModInfo[]): [string, number] {
    const versionCounts: { [version: string]: number } = {};

    for (const mod of mods) {
      for (const version of mod.gameVersions) {
        if (version in versionCounts) {
          versionCounts[version]++;
        } else {
          versionCounts[version] = 1;
        }
      }
    }

    let mostCommonVersion = "";
    let maxCount = 0;

    for (const [version, count] of Object.entries(versionCounts)) {
      if (count > maxCount) {
        mostCommonVersion = version;
        maxCount = count;
      }
    }

    return [mostCommonVersion, maxCount];
  }

  public displayIncompatibleMods(mods: ModInfo[]) {
    this.gameVersions.forEach((gameVersion) => {
      let localMods = mods.filter((mod) => mod.gameVersions.includes(gameVersion));
      let fabricMods = localMods.filter((mod) => mod.flavor === "Fabric");
      let forgeMods = localMods.filter((mod) => mod.flavor === "Forge");
      let bothMods = localMods.filter((mod) => mod.flavor === "Both");
      console.log(`Mods compatible with ${gameVersion}: (${localMods.length +"/"+ mods.length}) (Fabric: ${fabricMods.length}) (Forge: ${forgeMods.length}) (Both: ${bothMods.length})`);

      for (const mod of localMods) {
          console.log(`- ${mod.name} (ID: ${mod.id}) (ModLoader: ${mod.flavor})`);
      }
      console.log("\n");
    })
    
  }
}


interface ModResponse {
  data: ResponseData[];
  pagination: {
    index: number;
    pageSize: number;
    totalCount: number;
  };
}

interface ModInfo {
  name: string;
  id: number;
  gameVersions: string[];
  url: string;
  flavor: "Fabric" | "Forge" | "Both";
}
