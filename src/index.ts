import Main from "./Main";
import minimist from "minimist";
const argv = minimist(process.argv.slice(2), {
    alias: {
        file: "f",
        help: "h",
        id: "i",
        version: "v"
    }
});

const main = new Main(argv);