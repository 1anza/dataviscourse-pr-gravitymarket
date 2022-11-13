export function createPlaybackControls(gas) {
	console.log("createPlaybackControls()");

	let playbackdiv = d3.select("div#playback-div");

	// Sets up the playpause button
	let button = playbackdiv.select("button#playpause").on("click", function () {
		gas.set_playing(!gas.playing);
		let button = d3.select(this);
		updatePlayButton(button, gas);
	});
	updatePlayButton(button, gas);
	gas.addEventListenerToEvent("playing", (_) => updatePlayButton(button, gas));

	// Sets up the speed controls
	let n_speed_options = 9;
	let max_speed = 100.0;
	let min_speed = 10.0;
	let speed_options = d3.range(
		min_speed,
		max_speed + 0.001,
		(max_speed - min_speed) / n_speed_options
	);
	let playback_speed = playbackdiv.select("select#playback-speed");
	playback_speed
		.selectAll("option")
		.data(speed_options)
		.enter()
		.append("option")
		.attr("value", (d) => d)
		.html((d) => d3.format(".1f")(d));

	playback_speed.on("change", (e) => {
		let new_val = +e.target.value;
		if (!(gas.playbackSpeed === new_val)) {
			gas.set_playbackSpeed(new_val);
		}
	});
	gas.set_playbackSpeed(+playback_speed._groups[0][0].value);

	// Sets up the rewind button
	playbackdiv.select("button#go-to-start").on("click", (_) => {
		gas.set_playing(false);
		gas.set_index(0);
	});

	// Sets up the date monitor
	let updateDate = (_) => playbackdiv.select("div#current-date").html(gas.date);
	updateDate();
	gas.addEventListenerToEvent("date", (e) => {
		updateDate();
	});
}

function updatePlayButton(button, gas) {
	if (gas.playing) {
		button.select("i#play").style("display", "none");
		button.select("i#pause").style("display", null);
	} else {
		button.select("i#pause").style("display", "none");
		button.select("i#play").style("display", null);
	}
}
