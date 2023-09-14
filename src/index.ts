import fs from "fs";
import type CurseForgeResponse from "./curseforge.type";

const baseURL = "https://curseforge.com";
const path = "/v1/mods/search";
// const APIKey = "$2a$10$LlNNC67NDOE/dP9m0ydZEuaMHTGSlyfrAsXfBuaplAJMYN6nVu6vu";

const parameters: Record<string, string> = {
    "gameId": "432", // 432 = Minecraft
    "searchFilter": "",
    "index": "0",
    "filterText": "20",
    "categoryIds[0]": "421",
    "classId": "6" //Only show mods

}

const query = new URLSearchParams(parameters).toString();

fetch(baseURL + "/api/v1/mods/search?"+query, {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
}).then(async (response) => {
    if(response.ok)
    {
        const json = await response.json();
        console.log(json);
        fs.writeFileSync("./games.json", JSON.stringify(json, null, 2));
    }
    else
    {
        console.log(response.statusText);
    }
});



// fetch(baseURL + path + "?gameId=" + parameters.gameId + "&searchFilter=" + parameters.searchFilter + "&APIKey=" + APIKey)

