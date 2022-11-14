import { dateMinuteToDate, getPercChange } from "./util";
import {
	scaleDiscontinuous,
	discontinuitySkipWeekends,
	discontinuityProvider,
} from "d3fc-discontinuous-scale";
import * as d3 from "d3";

/*
 * Global app events are contained here. Also, logic for controlling the ticking of the data index.
 */

export class GlobalAppState {
	constructor(data) {
		this.initializeEvents(data);
	}

	/*
	 * https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
	 * Note to future readers, detail is a property of the Event, so assign any data you want to access at the other end to it and access by event.detail. +1 – /
	 *
	 * Create and add an event to this GlobalAppState
	 * The GlobalAppState will contain a field with valueName, and a set_valueName function.
	 * 	Also, an event listener will be added to the document called on_valueNameChange
	 *
	 * Please don't mutate the fields added to the GlobalAppState. Instead use set_valueName.
	 *
	 *
	 * functions_to_add are all added as events with the parameters being the event e.
	 */
	addEventValueToGlobalAppState(
		valueName: string,
		default_value = null,
		functions_to_add: { (e: CustomEvent): void }[] = [],
		shouldLog = true
	) {
		this["set_" + valueName] = (value: any) => {
			this[valueName] = value;
			let _event = new CustomEvent("on_" + valueName + "Change", {
				detail: value,
			});
			document.dispatchEvent(_event);
		};
		if (shouldLog) {
			document.addEventListener("on_" + valueName + "Change", (e) => {
				let value = (<CustomEvent>e).detail;
				console.log("Event happened.", valueName, "Changed to: ", value);
			});
		}
		for (let f of functions_to_add) {
			document.addEventListener("on_" + valueName + "Change", (e) => {
				f(<CustomEvent>e);
			});
		}

		if (default_value !== null) {
			this["set_" + valueName](default_value);
		}
	}

	addEventListenerToEvent(eventName: string, f: { (e: CustomEvent) }) {
		document.addEventListener("on_" + eventName + "Change", (e) =>
			f(<CustomEvent>e)
		);
	}

	initializeEvents(data) {
		/*  ------------Data and bounds---------------------    */
		this.addEventValueToGlobalAppState("dateValueRange", null);
		this.addEventValueToGlobalAppState("data", data, [
			(e) => {
				// looks at all of the dates of the first value in data
				this.set_dateValueRange(
					d3.extent(e.detail[0].chart, (d) => {
						return dateMinuteToDate(d.date, d.minute);
					})
				);
			},
		]);
		this.addEventValueToGlobalAppState("selectedSingleCompany", null);
		this.addEventValueToGlobalAppState("percentYValueRange", null);
		this.addEventValueToGlobalAppState("yValueDataRange", null);
		this.addEventValueToGlobalAppState("yValueName", "close", [
			(_) => {
				let range = [
					d3.min(this.data, (x) => d3.min(x.chart, (y) => y[this.yValueName])),
					d3.max(this.data, (x) => d3.max(x.chart, (y) => y[this.yValueName])),
				];
				console.log("Data range: ", range);
				this.set_yValueDataRange(range);
			},
		]);
		let update_percentYValueRange = () => {
			let perc_min = d3.min(this.data, (d) =>
				d3.min(d3.range(d.chart.length), (i) =>
					getPercChange(d, i, this.yValueName)
				)
			);
			let perc_max = d3.max(this.data, (d) =>
				d3.max(d3.range(d.chart.length), (i) =>
					getPercChange(d, i, this.yValueName)
				)
			);
			this.set_percentYValueRange([perc_min, perc_max]);
		};
		this.addEventListenerToEvent("data", (_) => update_percentYValueRange(_));
		update_percentYValueRange();
		// The zValue is the marketCap, which determines the radius in the beeswarm
		// This zValue is local to the first list dimension, (the ticker)
		this.addEventValueToGlobalAppState("zValueDataRange", null);
		this.addEventValueToGlobalAppState("zValueName", "marketcap", [
			(_) => {
				this.set_zValueDataRange(
					d3.extent(this.data, (d) => d[this.zValueName])
				);
			},
		]);
		console.log(this.zValueDataRange);

		/*  -----------Time series and tick controls--------    */
		this.addEventValueToGlobalAppState("date", null, [], true);
		this.addEventValueToGlobalAppState(
			"index",
			null,
			[
				(e) => {
					let datarow = this.data[0].chart[this.index];
					this.set_date(dateMinuteToDate(datarow.date, datarow.minute));
				},
			],
			false
		);
		this.set_index(0);

		let calculate_date_domain = () => {
			let start_date = dateMinuteToDate(
				this.data[0].chart[0].date,
				this.data[0].chart[0].minute
			);
			let chart_length = this.data[0].chart.length;
			let end_date = dateMinuteToDate(
				this.data[0].chart[chart_length - 1].date,
				this.data[0].chart[chart_length - 1].minute
			);
			console.log("Start date", start_date, "End date", end_date);
			return scaleDiscontinuous(d3.scaleTime())
				.discontinuityProvider(discontinuitySkipWeekends())
				.domain([start_date, end_date]);
		};
		this.addEventValueToGlobalAppState("dateDomain", calculate_date_domain());
		this.addEventListenerToEvent(
			"data",
			this.set_dateDomain(calculate_date_domain())
		);
		// When the playhead moves, this will store its estimated current speed.
		this.addEventValueToGlobalAppState("playHeadMovementSpeed", 0);
		this.addEventValueToGlobalAppState("playing", false, [
			(e) => {
				if (e.detail === true) {
					// Playback has started
					this.__interval_id = setInterval(
						() => this.updateIndex(),
						this._frequency
					);
				} else {
					// Playback has stopped
					clearInterval(this.__interval_id);
				}
			},
		]);

		/// This is in units of seconds, and measures how long it would take for the
		/// entire data series to be iterated through.
		///
		/// For now, when the animationUpdateSpeed changes, the playback will pause
		this.addEventValueToGlobalAppState("playbackSpeed", null, [
			(e) => {
				let time_for_playback = e.detail;
				// EX: If there are 30 datapoints and we want the
				// playback to play from start to finish in 10 seconds,
				// there should be 0.3333 seconds between each index
				// increment.
				let frequency = (time_for_playback / this.data.length) * 1000;
				this._frequency = frequency;
				this.set_playing(false);
			},
		]);
		this.set_playbackSpeed(10.0);

		/*  ----------------Group By Controls---------------    */

		let domain = [...new Set(this.data.map((d) => d.sector))];
		/// This is a list of all of the sectors
		this.addEventValueToGlobalAppState("allSectors", [...domain.keys()]);
		let map = Object.assign({}, ...domain.map((d, i) => ({ [<string>d]: i })));
		let color_func = d3.interpolateRainbow;
		/// This is a function that colors a row of data.
		/// It takes as input the sector and returns a color.
		console.log("domain", domain);
		this.addEventValueToGlobalAppState(
			"colorFunc",
			(sector: string) => color_func(map[sector] / domain.length),
			[],
			true
		);

		this.addEventValueToGlobalAppState("groupingBySector", false);
		/// selectedSectors is a set of the selectedSectors
		this.addEventValueToGlobalAppState("selectedSectors", new Set(), [
			(e) => {
				if (e.detail.size === 0) {
					this.set_groupingBySector(false);
				} else {
					this.set_groupingBySector(true);
				}
			},
		]);
	}

	// Will loop by default.
	updateIndex() {
		if (this.index === this.data[0].chart.length - 1) {
			this.set_index(0);
		} else {
			this.set_index(this.index + 1);
		}
	}
}
