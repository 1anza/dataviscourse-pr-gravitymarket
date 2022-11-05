function createPlaybackControls(gas) {
	console.log("createPlaybackControls()");

	// Sets up the playpause button
	let button = d3
		.select("div#playback-div")
		.select("button#playpause")
		.on("click", function () {
			gas.set_playing(!gas.playing);
			let button = d3.select(this);
			updateButton(button, gas);
		});
	updateButton(button, gas);
}

function updateButton(button, gas) {
	if (gas.playing) {
		button.select("i#play").style("display", "none");
		button.select("i#pause").style("display", null);
	} else {
		button.select("i#pause").style("display", "none");
		button.select("i#play").style("display", null);
	}
}
