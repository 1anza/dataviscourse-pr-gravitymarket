import {
	dateMinuteToDate,
	getPercChange,
	removeVanguardPrefixFromSector,
} from "./util.js";
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
	constructor(companyData, sp500Data, sectorData) {
		this.initializeEvents(companyData, sp500Data, sectorData);
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
		valueName,
		default_value = null,
		functions_to_add = [],
		shouldLog = true
	) {
		this["set_" + valueName] = (value) => {
			this[valueName] = value;
			let _event = new CustomEvent("on_" + valueName + "Change", {
				detail: value,
			});
			document.dispatchEvent(_event);
		};
		if (shouldLog) {
			document.addEventListener("on_" + valueName + "Change", (e) => {
				let value = e.detail;
				console.log("Event happened.", valueName, "Changed to: ", value);
			});
		}
		for (let f of functions_to_add) {
			document.addEventListener("on_" + valueName + "Change", (e) => {
				f(e);
			});
		}

		if (default_value !== null) {
			this["set_" + valueName](default_value);
		}
	}

	addEventListenerToEvent(eventName, f) {
		document.addEventListener("on_" + eventName + "Change", (e) => f(e));
	}

	initializeEvents(companyData, sp500Data, sectorData) {
		/*  ------------Data and bounds---------------------    */
		this.addEventValueToGlobalAppState("dateValueRange", null);
		this.addEventValueToGlobalAppState("data", companyData, [
			(e) => {
				// looks at all of the dates of the first value in data
				this.set_dateValueRange(
					d3.extent(e.detail[0].chart, (d) => {
						return dateMinuteToDate(d.date, d.minute);
					})
				);
			},
		]);
		this.addEventValueToGlobalAppState("sp500Data", sp500Data);
		this.addEventValueToGlobalAppState("sectorDataDict", null);
		this.addEventValueToGlobalAppState("sectorData", sectorData, [
			(_) => {
				let sector_data_dict = {};
				this.sectorData.forEach(
					(d) =>
						(sector_data_dict[removeVanguardPrefixFromSector(d.company)] = d)
				);
				this.set_sectorDataDict(sector_data_dict);
			},
		]);

		this.addEventValueToGlobalAppState("selectedSingleCompany", null);
		this.addEventValueToGlobalAppState("selectedSingleCompanyDetails", null);
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
		this.addEventValueToGlobalAppState(
			"indexPlottedRange",
			[0, this.data[0].chart.length],
			[
				(_) => {
					if (this.index < this.indexPlottedRange[0]) {
						this.set_index(this.indexPlottedRange[0]);
					}
					if (this.index > this.indexPlottedRange[1]) {
						this.set_index(this.indexPlottedRange[1]);
					}
				},
			]
		);

		// Uses scalePoint, which has as the range only dates which exist in the data.
		let calculate_date_domain = () => {
			return d3
				.scalePoint()
				.domain(
					this.data[0].chart.map((d) => dateMinuteToDate(d.date, d.minute))
				);
		};
		this.addEventValueToGlobalAppState("genDateDomain", calculate_date_domain);
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
				let was_playing = this.playing;
				let time_for_playback = e.detail;
				// EX: If there are 30 datapoints and we want the
				// playback to play from start to finish in 10 seconds,
				// there should be 0.3333 seconds between each index
				// increment.
				let frequency = (time_for_playback / this.data.length) * 1000;
				this._frequency = frequency;
				this.set_playing(false);
				this.set_playing(was_playing);
			},
		]);
		this.set_playbackSpeed(10.0);

		/*  ----------------Group By Controls---------------    */

		let domain = [...new Set(this.data.map((d) => d.sector))];
		/// This is a list of all of the sectors
		this.addEventValueToGlobalAppState("allSectors", [...domain.values()]);
		let map = Object.assign({}, ...domain.map((d, i) => ({ [d]: i })));
		let color_func = d3.interpolateRainbow;
		/// This is a function that colors a row of data.
		/// It takes as input the sector and returns a color.
		console.log("domain", domain);
		this.addEventValueToGlobalAppState(
			"colorFunc",
			(sector) => {
				if (sector === "Index") {
					return color_func(0.5);
				} else {
					return color_func(map[sector] / domain.length);
				}
			},
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

		// The zValue is the marketCap, which determines the radius in the beeswarm
		// This zValue is local to the first list dimension, (the ticker)
		let updateZValueDataRange = (_) => {
			let data_to_get_range;
			if (this.selectedSectors.size > 0) {
				data_to_get_range = this.data.filter((d) =>
					this.selectedSectors.has(d.sector)
				);
			} else {
				data_to_get_range = this.data;
			}
			console.log("DATA TO GET RANGE", data_to_get_range);
			this.set_zValueDataRange(
				d3.extent(data_to_get_range, (d) => d[this.zValueName])
			);
		};
		this.addEventValueToGlobalAppState("zValueDataRange", null);
		this.addEventValueToGlobalAppState("zValueName", "marketcap", [
			(_) => updateZValueDataRange(),
		]);
		this.addEventListenerToEvent("selectedSectors", (_) =>
			updateZValueDataRange()
		);

		// This value stores a running estimate of the extent of the
		// data being plotted. It is not updated every time the index
		// is incremented to save performance.
		let update_runningPercentYValueRange_every_n_index = 10;
		let update_runningPercentYValueRange = () => {
			let data_to_get_range;
			if (this.groupingBySector) {
				data_to_get_range = this.sectorData.filter((d) =>
					this.selectedSectors.has(removeVanguardPrefixFromSector(d.company))
				);
			} else {
				data_to_get_range = [this.sp500Data];
			}
			console.log("data_to_get_range", data_to_get_range);
			console.log("groupingBySector", this.groupingBySector);

			// The amount that runningPercentYValueRange will look ahead
			// and behind to get the extent of the percent
			let index_padding = 50;
			let index_range = [
				this.index - index_padding,
				this.index + index_padding,
			];
			if (index_range[0] < 0) {
				index_range[0] = 0;
			}
			if (index_range[1] > data_to_get_range[0].chart.length) {
				index_range[1] = data_to_get_range[0].chart.length;
			}

			let perc_min = d3.min(data_to_get_range, (d) =>
				d3.min(d3.range(...index_range), (i) =>
					getPercChange(d, i, this.yValueName)
				)
			);
			let perc_max = d3.max(data_to_get_range, (d) =>
				d3.max(d3.range(...index_range), (i) =>
					getPercChange(d, i, this.yValueName)
				)
			);
			return [perc_min, perc_max];
		};
		this.addEventValueToGlobalAppState(
			"runningPercentYValueRange",
			update_runningPercentYValueRange()
		);
		this.addEventListenerToEvent("index", (_) => {
			if (this.index % update_runningPercentYValueRange_every_n_index === 0) {
				this.set_runningPercentYValueRange(update_runningPercentYValueRange());
			}
		});
		this.addEventListenerToEvent("selectedSectors", (_) => {
			this.set_runningPercentYValueRange(update_runningPercentYValueRange());
		});
		console.log(this.indexPlottedRange);
		this.addEventListenerToEvent("indexPlottedRange", (_) =>
			this.set_runningPercentYValueRange(update_runningPercentYValueRange())
		);
	}

	// Will loop by default.
	updateIndex() {
		if (this.index >= this.indexPlottedRange[1] - 1) {
			this.set_index(this.indexPlottedRange[0]);
		} else {
			this.set_index(this.index + 1);
		}
	}
}
