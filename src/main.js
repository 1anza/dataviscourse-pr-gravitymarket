function main() {
	d3.json("/data/data.json").then(data => {
		console.log("Loaded data.");
		console.log(data)

		let gas = new GlobalAppState(data);

		//gas.set_playing(true);
		createPlaybackControls(gas);
	});
}

main()
