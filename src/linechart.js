import * as d3 from "d3";
import {
	dateMinuteToDate,
	getPercChange,
	removeVanguardPrefixFromSector,
} from "./util.js";

/*
 * If nothing is selected in selectedSectors, only data[0] the S&P 500 line, will be shown.
 *
 * If any sectors are specified in selectedSectors, then those sectors will be shown
 */
export class Linechart {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#linechart-vis");

		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 50,
			maxX: svg_width - 50,
			minY: 20,
			maxY: svg_height - 50,
			// The linechart uses virtual pixels to render the whole
			// range of lines, which is really wide and won't fit on
			// the entire screen at a time. These values are the
			// min and max virutal X coordinates used
			virtualMaxX: 1000,
			virtualMinX: -1000,
		};

		this.textRotation = 45;

		this.updateScaleX();
		this.updateScaleY();
		this.updateAxisX();
		this.updateAxisY();

		this.updateLines();

		this.updatePlayheadLine();

		this.gas.addEventListenerToEvent("date", (_) => {
			this.updatePlayheadLine();
		});
		this.gas.addEventListenerToEvent("runningPercentYValueRange", (_) => {
			console.log("Updateing scaleY!");
			this.updateScaleY();
			this.updateLines();
			this.updateAxisY();
		});

		this.gas.addEventListenerToEvent("selectedSectors", (_) => {
			this.updateScaleY();
			this.updateAxisY();
			this.updateLines();
		});
	}

	/*
	 * Moves the playhead line to the this.gas.date
	 *
	 * Moves the data on screen to be centered at the playhead
	 */
	updatePlayheadLine() {
		// There is a lag when transitioning soley based on the gas._frequency
		// This compensates for that delay by making the transitions slightly longer.
		let delay_compensation = 1.0;
		this.svg
			.select("g#playback-follow")
			.transition()
			.duration(this.gas._frequency * delay_compensation)
			.attr("transform", `translate(${this.scaleX(this.gas.date)} 0)`)
			.select("line#playback-line")
			.attr("x1", 0)
			.attr("x2", 0)
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY);

		let virt_center_coord =
			this.bounds.virtualMaxX -
			this.scaleX(this.gas.date) +
			this.bounds.virtualMinX +
			(this.bounds.maxX - this.bounds.minX) / 2;

		this.svg
			.select("g#plotted-zoomable")
			.transition()
			.duration(this.gas._frequency * delay_compensation)
			.attr("transform", `translate(${virt_center_coord} 0)`);

		this.svg
			.select("g#y-axis")
			.select("mask#y-axis-mask")
			.select("rect")
			.attr("width", this.bounds.maxX)
			.transition()
			.duration(this.gas._frequency * delay_compensation)
			.attr("x", -virt_center_coord);
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
		let scale = this.gas.genDateDomain();
		let range = [this.bounds.virtualMinX, this.bounds.virtualMaxX];
		this.scaleX = scale.range(range);
	}

	/*
	 * updates this.scaleY which takes a percent change and maps it to a y position
	 *
	 * The domain for the scaleY depends on the viewable range of the data which is viewable from the current linechart - the width of the date range viewable is
	 */
	updateScaleY() {
		let domain = this.gas.runningPercentYValueRange;
		console.log("domain", domain);
		let range = [this.bounds.maxY, this.bounds.minY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);
	}

	updateAxisX() {
		let axisG = this.svg
			.select("g#x-axis")
			.attr("transform", `translate(0 ${this.bounds.maxY})`);
		let xAxis = d3
			.axisBottom()
			.scale(this.scaleX)
			.ticks(d3.utcDay.every(2))
			.tickFormat(d3.timeFormat("%d %b"));
		axisG
			.call(xAxis)
			.selectAll("text")
			.attr("y", 15)
			.attr("x", 25)
			.attr("transform", `rotate(${this.textRotation})`)
			.classed(".dateaxis-text", true);
	}

	/*
	 * Updates the y axis and the mask for the linechart lines
	 */
	updateAxisY() {
		let axisG = this.svg
			.select("g#y-axis")
			.attr("transform", `translate(${this.bounds.maxX} 0)`);
		let yAxis = d3.axisRight(this.scaleY).tickSize(-1000).ticks(10).tickFormat(d => `${d}%`);
		axisG.call(yAxis)
			.selectAll("g.tick")
			.attr("a", d => console.log("FDSFDS",d))
			.classed("linechart-positive-tick", d => d > 0)
			.classed("linechart-negative-tick", d => d < 0)
			.classed("linechart-neutral-tick", d => d === 0)
			.select("line")
			.attr("stroke", null);
	}

	updateLines() {
		let datatoplot;
		if (this.gas.groupingBySector) {
			datatoplot = this.gas.sectorData.filter((d) => {
				return this.gas.selectedSectors.has(
					removeVanguardPrefixFromSector(d.company)
				);
			});
		} else {
			datatoplot = [this.gas.sp500Data];
		}
		console.log("linechart datatoplot", datatoplot);
		let paths = this.svg.select("g#lines").selectAll("path").data(datatoplot);
		paths
			.join("path")
			.attr("stroke", (d) =>
				this.gas.colorFunc(removeVanguardPrefixFromSector(d.company))
			)
			.classed("linechart-path", true)
			.attr("d", (d) => {
				return d3
					.line()
					.x((d_m) => this.scaleX(dateMinuteToDate(d_m.date, d_m.minute)))
					.y((_, i) => this.scaleY(getPercChange(d, i, this.gas.yValueName)))(
					d.chart
				);
			});
	}
}
