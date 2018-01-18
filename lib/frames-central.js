let fs = require("fs");

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
			columns: ['lat','lon','ascent','isoTime','isVideo','pitch','roll','yaw'],
			data: []
		};
		this.isVideo = 0;
		Object.keys(types).forEach(key => {
			let type = types[key];
			this.lastFrames[type] = [];
			parser.on(type, this.newFrame.bind(this, type));
		});
	}

	newFrame(type, obj) {
		this.lastFrames[type].push(obj);
		// gimbal frames have the lowest frequency from the wanted frames
		if ("GIMBAL" === type) {
			this.processEntries();
		}
	}

	clearLastFrames() {
		Object.keys(this.lastFrames).forEach(key => {
			this.lastFrames[key] = [];
		});
	}

	isRecording(isVideo) {
		switch (isVideo) {
			case 1:
				this.isVideo = 1;
				break;
			case 2:
				this.isVideo = 0;
				break;
		}
		return this.isVideo;
	}

	processEntries() {
		// using the last value so far, should maybe interpolate
		let osd = this.lastFrames["OSD"].pop();
		let rc = this.lastFrames["RC"].pop();
		let custom = this.lastFrames["CUSTOM"].pop();
		let gimbal = this.lastFrames["GIMBAL"].pop();
		if (osd && rc && custom && gimbal) {
			let lat = osd.getLatitude();
			let lon = osd.getLongitude();
			let ascent = osd.getHeight();
			let isoTime = custom.getDateTime();
			let isVideo = this.isRecording(custom.getIsVideo());
			let pitch = gimbal.getPitch() / 10;
			let roll = gimbal.getRoll() / 10;
			let yaw = gimbal.getYaw() / 10;
			// this.entries.push(
			// 	`${lat},${lon},${ascent},${isoTime},${isVideo},${pitch},${roll},${yaw}`
			// );
			this.entries.data.push({
				lat,
				lon,
				ascent,
				isoTime,
				isVideo,
				pitch,
				roll,
				yaw
			});
			this.clearLastFrames();
		}
	}

	saveToJSON(path) {
		fs.writeFileSync(path, JSON.stringify(this.entries));
	}
}