function createPlaybackControls(gas) {
	console.log("createPlaybackControls()");

	// Sets up the playpause button
	let playpauseSelection = d3.select("div#playback-div")
		.select("button#playpause")
		.on("click", _ => {
			gas.set_playing(!gas.playing);
		});
}
