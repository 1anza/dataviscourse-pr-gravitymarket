import * as d3 from "d3";
import {dateMinuteToDate, getPercChange} from "./util";

export class Linechart {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#linechart-vis");

		// These indeces indicate the index funds in the data; these are plotted as a 
		// special case if no gas.selectedSectors have been picked
		this.motherlineDataIndexRange = [0, 12];

		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 50,
			maxX: svg_width - 50,
			minY: 20,
			maxY: svg_height - 50,
		};

		this.updateScaleX();
		this.updateScaleY();
		this.updateAxisX();
		this.updateAxisY();

		this.updateLines();

		this.updatePlayheadLine();
		this.gas.addEventListenerToEvent("date", (_) => this.updatePlayheadLine());
	}

	/*
	 * Moves the playhead line to the this.gas.date
	 */
	updatePlayheadLine() {
		this.svg
			.select("g#playback-follow")
			.attr("transform", `translate(${this.scaleX(this.gas.date)} 0)`)
			.select("line#playback-line")
			.attr("x1", 0)
			.attr("x2", 0)
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY);
	}

	/*
	 * updates this.scaleX which takes a date and maps it to the x position
	 */
	updateScaleX() {
		let domain = this.gas.data[0].chart.map((d) =>
			dateMinuteToDate(d.date, d.minute)
		);
		let range = [this.bounds.minX, this.bounds.maxX];
		this.scaleX = d3.scalePoint().domain(domain).range(range);
	}

	/*
	 * updates this.scaleY which takes a percent change and maps it to a y position
	 */
	updateScaleY() {
		let data_to_get_range;
		if (this.gas.groupingBySector) {
			data_to_get_range = this.gas.data.filter(d => this.gas.selectedSectors.has(d.sector));
		} else {
			data_to_get_range = this.gas.data.slice(this.motherlineDataIndexRange[0], this.motherlineDataIndexRange[1]);
		}
		let perc_min = d3.min(data_to_get_range, d => d3.min(d3.range(d.chart.length), i => getPercChange(d, i, this.gas.yValueName)));
		let perc_max = d3.max(data_to_get_range, d => d3.max(d3.range(d.chart.length), i => getPercChange(d, i, this.gas.yValueName)));
		let domain = [perc_min, perc_max];
		let range = [this.bounds.maxY, this.bounds.minY];
		this.scaleY = d3.scaleLinear().domain(domain).range(range);
	}

	updateAxisX() {
		let axisG = this.svg
			.select("g#x-axis")
			.attr("transform", `translate(0 ${this.bounds.maxY})`);
		let xAxis = d3.axisBottom().scale(this.scaleX).tickValues(this.scaleX.domain().filter((d, i) => i % 25 === 0)).tickFormat(d3.timeFormat("%B %d, %Y"));
		axisG.call(xAxis);
	}

	updateAxisY() {
		let axisG = this.svg
			.select("g#y-axis")
			.attr("transform", `translate(${this.bounds.minX} 0)`);

		let yAxis = d3.axisLeft(this.scaleY);
		axisG.call(yAxis);
	}

	updateLines() {
		let datatoplot;
		if (this.gas.groupingBySector) {
			datatoplot = this.gas.data.filter(d => this.gas.selectedSectors.has(d.sector));
		} else {
			datatoplot = this.gas.data.slice(this.motherlineDataIndexRange[0], this.motherlineDataIndexRange[1]);
		}
		let paths = this.svg
			.select("g#lines")
			.selectAll("path")
			.data(datatoplot);
		paths
			.join("path")
			.attr("stroke", (d) => this.gas.colorFunc(d.sector))
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
