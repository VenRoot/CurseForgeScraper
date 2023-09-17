import Main from "./Main";
import minimist from "minimist";
const argv = minimist(process.argv.slice(2));

const main = new Main(argv);