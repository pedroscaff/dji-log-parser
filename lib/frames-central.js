let fs = require("fs");
let once = require("lodash.once");

function getLast(arr) {
	return arr[arr.length - 1];
}

const types = {
	1: "OSD",
	2: "HOME",
	3: "GIMBAL",
	4: "RC",
	5: "CUSTOM",
	6: "DEFORM",
	7: "CENTER_BATTERY",
	8: "SMART_BATTERY",
	9: "APP_TIP",
	10: "APP_WARN",
	11: "RC_GPS",
	12: "RC_DEBUG",
	13: "RECOVER",
	14: "APP_GPS",
	15: "FIRMWARE",
	16: "OFDM_DEBUG",
	17: "VISION_GROUP",
	18: "VISION_WARN",
	19: "MC_PARAM",
	20: "APP_OPERATION",
	255: "END",
	254: "OTHER"
};

module.exports = class FramesCentral {
	constructor(parser) {
		this.lastFrames = {};
		this.entries = {
			data: []
		};
		this.isVideo = 0;
		Object.keys(types).forEach(key => {
			let type = types[key];
			this.lastFrames[type] = [];
			parser.on(type, this.newFrame.bind(this, type));
		});
		// save start in milliseconds
		// to later calculate the elapsed time
		parser.on("CUSTOM", once(obj => {
			this.startTime = obj.getDate().getTime();
		}));
	}

	newFrame(type, obj) {
		this.lastFrames[type].push(obj);
		// this.processEntries();
		// gimbal frames have the lowest frequency from the wanted frames
		if (["GIMBAL", "RC"].includes(type)) {
			this.processEntries();
		}
		// if ("GIMBAL" === type) {
		// 	this.processEntries();
		// }
	}

	clearLastFrames() {
		Object.keys(this.lastFrames).forEach(key => {
			this.lastFrames[key] = [];
		});
	}

	isRecording(isVideo, elapsedTime, lat, lon, date) {
		switch (isVideo) {
			case 1:
				if (0 === this.isVideo) {
					console.log(`video starts: ${elapsedTime} date: ${date}, lat: ${lat}, lon: ${lon}`);
				}
				this.isVideo = 1;
				break;
			case 2:
				if (1 === this.isVideo) {
					console.log(`video finishes: ${elapsedTime} date: ${date}, lat: ${lat}, lon: ${lon}`);
				}
				this.isVideo = 0;
				break;
		}
		return this.isVideo;
	}

	processEntries() {
		// using the last value so far, should maybe interpolate
		let osd = getLast(this.lastFrames["OSD"]);
		let rc = getLast(this.lastFrames["RC"]);
		let custom = getLast(this.lastFrames["CUSTOM"]);
		let gimbal = getLast(this.lastFrames["GIMBAL"]);
		if (osd && rc && custom && gimbal) {
			let lat = osd.getLatitude();
			let lon = osd.getLongitude();
			let ascent = osd.getHeight();
			let date = custom.getDate();
			let isoDate = date.toISOString();
			let elapsedTime = date.getTime() - this.startTime;
			let isVideo = this.isRecording(custom.getIsVideo(), elapsedTime, lat, lon, date);
			let pitch = gimbal.getPitch() / 10;
			let roll = gimbal.getRoll() / 10;
			let yaw = gimbal.getYaw() / 10;
			this.entries.data.push({
				lat,
				lon,
				ascent,
				elapsedTime,
				isoDate,
				isVideo,
				pitch,
				roll,
				yaw
			});
			// this.clearLastFrames();
		}
	}

	getEntries() {
		return this.entries.data;
	}

	saveToJSON(outputPath) {
		fs.writeFileSync(outputPath, JSON.stringify(this.entries));
	}
}