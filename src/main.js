import { GlobalAppState } from "./globalAppState.js";
import { createPlaybackControls } from "./playbackControls.js";
import { Beeswarm } from "./beeswarm.js";
import { Linechart } from "./linechart.js";
import { Ohlc } from "./ohlc.js";
import { addDevTools } from "./dev.js";
import * as d3 from "d3";

function main() {
	d3.json("Nov2021-Nov2022.json").then((data) => {
		console.log("---- Loaded data ----");
		// s&p500 data and sectorData is hardcoded as indeces in the json
		let sp500Data = data[0];
		let sectorData = data.slice(1, 12);
		let companyData = data.slice(12);
		let gas = new GlobalAppState(companyData, sp500Data, sectorData);

		createPlaybackControls(gas);

		let beeswarm = new Beeswarm(gas);
		let linechart = new Linechart(gas);
		let ohlc = new Ohlc(gas);

		// TODO Test setting sectors
		//addDevTools(gas);
	});
}

main();
