import { GlobalAppState } from "./globalAppState.js";
import { createPlaybackControls } from "./playbackControls.js";
import { Beeswarm } from "./beeswarm.js";
import { Linechart } from "./linechart.js";
import { Ohlc } from "./ohlc.js";
import { Table } from "./table.js";
import { DateRangeBrush } from "./daterangebrush.js";
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

		gas.set_selectedSectors(new Set());
		let beeswarm = new Beeswarm(gas);
		let linechart = new Linechart(gas);
		let ohlc = new Ohlc(gas);
		let table = new Table(gas);
		let daterangebrush = new DateRangeBrush(gas);

		let resize_vis = (_) => {
			beeswarm.updateBounds();
			beeswarm.updateScaleX();
			beeswarm.updateScaleY();
			beeswarm.updateSimulationX();
			beeswarm.updateSimulationY();
			beeswarm.drawXAxis();
			beeswarm.drawYAxis();

			linechart.updateBounds();
			linechart.updateScaleX();
			linechart.updateScaleY();
			linechart.updateLines();
			linechart.updatePlayheadLine();
			linechart.updateAxisX();
			linechart.updateAxisY();

			ohlc.updateBounds();
			ohlc.updateXAxis();
			ohlc.updateYAxis();
			ohlc.updatePlayheadLine();
			ohlc.updateOhlcChart(gas.selectedSingleCompany);

			daterangebrush.updateBounds();
			daterangebrush.updateScaleX();
			daterangebrush.drawXAxis();
			daterangebrush.updatePlaybackHead();
			daterangebrush.createBrush();
		};

		window.onresize = (_) => resize_vis();
	});
}

main();
