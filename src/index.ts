import Scraper from "./Scraper";

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



const modNames = [
    "ambient sound 5",
    "auditory",
    "better biome blend",
    "effective",
    "enhanced visuals",
    "extra sounds",
    "fabric seasons",
    "blur",
    "falling leaves",
    "illuminations",
    "immersive weathering",
    "lambda better grass",
    "more mob variants",
    "presence footsteps",
    "sound physics remastered",
    "vanilla tweaks",
    "more axolotl variants",
    "visuality",
    "advancement plaques",
    "anvil restoration",
    "apple skin",
    "areas",
    "axolotl bucket fix",
    "basic shields",
    "bedspreads",
    "better advancements",
    "better animations collection",
    "better statistics screen",
    "better third person",
    "better tridents",
    "camera overhaul",
    "camera utils",
    "comforts",
    "connectible chains",
    "customizable elytra",
    "damage tilt",
    "deepslate cutting",
    "diagonal fences",
    "display case",
    "easy anvils",
    "easy magic",
    "eating animation",
    "emerald apple",
    "enchantment descriptions",
    "first-person model",
    "gilded armor",
    "herds panic",
    "inmis",
    "inmis addon",
    "inventory profiles next",
    "inv mode",
    "iron bows",
    "leaves be gone",
    "mod name tooltip",
    "more banner features",
    "mouse wheelie",
    "not enough animations",
    "physics mod pro",
    "random village names",
    "repurposed structures",
    "right click harvest",
    "ruined equipment",
    "shulker box tooltip",
    "skinned lanterns",
    "smooth swapping",
    "soul fired",
    "terralith",
    "nyf's spiders",
    "tooltip rareness",
    "trinkets",
    "universal bone meal",
    "village bell recipe",
    "villager names",
    "void totem",
    "ydm's weapon master",
    "yung's extras",
    "yung's better dungeons",
    "yung's better mineshafts",
    "yung's better strongholds",
    "cherished worlds",
    "cloth config api",
    "cherished worlds",
    "collective",
    "continuity",
    "creative core",
    "creative fly",
    "dashloader",
    "fabric api",
    "fabric language kotlin",
    "fabric shield lib",
    "ferrite core",
    "forge config api port",
    "iceberg",
    "indium",
    "iris",
    "jam lib",
    "kiwi",
    "lazydfu",
    "lib ipn",
    "lithium",
    "mod menu",
    "moonlight lib",
    "paxi",
    "puzzles lib",
    "replay mod",
    "sodium",
    "yung's api"
];



const scraper = new Scraper(baseURL, path, parameters, modNames);

console.log(scraper.URLs);

scraper.scrape().then((mods) => {
    scraper.displayIncompatibleMods(mods, "1.20");
    scraper.displayIncompatibleMods(mods, "1.19");
    scraper.displayIncompatibleMods(mods, "1.18");
    scraper.save(mods);
})