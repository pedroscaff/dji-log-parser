"use strict";

var DJIBuffer = require("../djibuffer");


function Custom(buffer, index, key) {
    DJIBuffer.call(this, buffer, index, key);
}

Custom.prototype = Object.create(DJIBuffer.prototype);

Custom.prototype.getDistance = function() {
    return this.readFloat(6,4);
};

Custom.prototype.getHSpeed = function() {
    return this.readFloat(2,4);
};

Custom.prototype.getDateTime = function() {
    return new Date(parseInt(this.readLong(10, 8).toString())).toISOString();
};

Custom.prototype.getIsVideo = function() {
	return this.readByte(1);
}

Custom.prototype.getIsImage = function() {
	// still haven't checked but it is probably correct
	return this.readByte(0);
}

module.exports = Custom;