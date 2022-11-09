function main() {
	d3.json("/data/data.json").then((data) => {
		console.log("Loaded data.");

		let gas = new GlobalAppState(data);

		createPlaybackControls(gas);

		let beeswarm = new Beeswarm(gas);
		let linechart = new Linechart(gas);

		// TODO Test setting sectors
		addDevTools(gas);
	});
}

main();
