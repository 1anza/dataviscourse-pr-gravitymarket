function main() {
	d3.json("data/Nov2021-Nov2022.json").then((data) => {
		console.log("Loaded data.");

		let gas = new GlobalAppState(data);

		createPlaybackControls(gas);

		let beeswarm = new Beeswarm(gas);
		let linechart = new Linechart(gas);
		let ohlc = new Ohlc(gas);

		// TODO Test setting sectors
		addDevTools(gas);
	});
}

main();
