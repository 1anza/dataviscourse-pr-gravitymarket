import {GlobalAppState} from './globalAppState.ts';
import {createPlaybackControls} from './playbackControls.ts';
import {Beeswarm} from './beeswarm.ts';
import {Linechart} from './linechart.ts';
import {Ohlc} from './ohlc.ts';
import {addDevTools} from './dev.ts';

function main() {
	d3.json("fromMay2022.json").then((data) => {
		console.log("---- Loaded data ----");

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
