import ResponseData from "./curseforge.type";
import fs from "fs/promises";
export default class Scraper {
  private baseURL: string;
  private path: string;
  private parameters: Record<string, string>;
  private modNames: string[];
  public URLs: string[];

  constructor(
    baseURL: string,
    path: string,
    parameters: Record<string, string>,
    modNames: string[]
  ) {
    this.baseURL = baseURL;
    this.path = path;
    this.parameters = parameters;
    this.modNames = modNames;
    this.URLs = [];

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

  private getAllGameVersions(data: ModResponse): string[] {
    let gameVersionsSet: Set<string> = new Set();
  
    for (const recentFile of data.data[0].websiteRecentFiles) {
      for (const file of recentFile.files) {
        for (const version of file.gameVersions) {
          // Use a regex to check if the element is a game version
          if (/^\d+\.\d+(\.\d+)?$/.test(version)) {
            gameVersionsSet.add(version);
          }
        }
      }
    }
  
    return Array.from(gameVersionsSet);
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

        let gameVersions = this.getAllGameVersions(json);

        const mod: ModInfo = {
          name: json.data[0].name,
          id: json.data[0].id,
          // gameVersions: json.data[0].latestFileDetails.gameVersions,
          gameVersions: gameVersions,
          url: "https://www.curseforge.com/minecraft/mc-mods/"+json.data[0].slug
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

  public displayIncompatibleMods(mods: ModInfo[], gameVersion: string) {
    let localMods = mods.filter((mod) => mod.gameVersions.includes(gameVersion));
    console.log(`Mods incompatible with ${gameVersion}: (${localMods.length})`);

    for (const mod of localMods) {
        console.log(`- ${mod.name} (ID: ${mod.id})`);
    }
    console.log("\n");
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
}
