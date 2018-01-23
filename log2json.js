module.exports = function(logfile, toFile, outputPath) {
	return new Promise((resolve, reject) => {
		if (toFile && !outputPath) {
			reject("no file path provided!");
		}
		let DJIParser = require("./lib/index");
		let fs = require("fs");
		let FramesCentral = require("./lib/frames-central");

		let parser = new DJIParser();

		let framesCentral = new FramesCentral(parser);

		// details is the last frame
		parser.on("DETAILS", () => {
			if (toFile) {
				framesCentral.saveToJSON(outputPath);
				resolve(`file saved to ${outputPath}`);
			} else {
				resolve(framesCentral.getEntries());
			}
		});

		parser.parse(fs.readFileSync(logfile));
	});
}