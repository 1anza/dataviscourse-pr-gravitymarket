function main() {
	d3.json("/data/data.json").then((data) => {
		console.log("Loaded data.");
		console.log(data);


		let gas = new GlobalAppState(data);

		// These are the values used when calculating percent change
		let referenceValues = data.map(x => x.chart[0].marketClose);
		let referenceValuesMap = {};
		referenceValues.forEach((x, i) => {referenceValuesMap[data[i].ticker] = x});
		gas.addEventValueToGlobalAppState("referenceValuesMap", referenceValuesMap);

		createPlaybackControls(gas);
		let beeswarm = new Beeswarm(gas);
	});
}

main();
