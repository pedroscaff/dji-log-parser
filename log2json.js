let DJIParser = require("./index");
let fs = require("fs");
let argv = require("minimist")(process.argv.slice(2));
let FramesCentral = require("./lib/frames-central");

let parser = new DJIParser();

let framesCentral = new FramesCentral(parser);

// details is the last frame
parser.on("DETAILS", () => {
	framesCentral.saveToJSON(argv.output);
});

parser.parse(fs.readFileSync(argv.logfile));
