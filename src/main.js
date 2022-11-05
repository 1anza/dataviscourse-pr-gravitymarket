function main() {
	d3.json("/data/data.json").then((data) => {
		console.log("Loaded data.");
		console.log(data);

		let gas = new GlobalAppState(data);

		createPlaybackControls(gas);
	});
}

main();
