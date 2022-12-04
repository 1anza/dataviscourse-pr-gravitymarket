import * as d3 from "d3";
import percentile from "percentile";
import {
	dateMinuteToDate,
	getPercChange,
	removeVanguardPrefixFromSector,
} from "./util.js";
import { GlobalAppState } from "./globalAppState.js";
import { SectorControls } from "./sectorControls.js";

export class Beeswarm {
	constructor(gas) {
		this.gas = gas;
		let svg_width = parseInt(d3.select("svg#beeswarm-vis").style("width"));
		let svg_height = parseInt(d3.select("svg#beeswarm-vis").style("height"));
		this.bounds = {
			minX: 30,
			maxX: svg_width - 90,
			minY: 35,
			maxY: svg_height - 20,
		};
		this.parseTime = d3.timeParse("%Y-%m-%d %H:%M");

		// When selectedSectors changes we need to redraw the grid, and update the simulation x forces
		this.updateScaleX();
		this.updateScaleY();
		this.updateScaleRadius();

		this.updateRadiusKey();

		this.drawYAxis();
		this.drawXAxis();

		this.initColorScales(); //red/green gradient
		this.initTooltip();
		this.drawCircles();

		this.simulationSettings = {
			globalForceScale: 1.0,
			forceXScale: 0,
			forceYScale: 0.7,
			collisionStrength: 1.2,
		};

		this.startSimulation();
		this.gas.addEventListenerToEvent("index", (_) => {
			this.updateSimulationY();
			this.updateTooltip();
		});

		this.sectorControls = new SectorControls(this.gas, svg_width, svg_height);
		this.sectorControls.updateSectorControls(this.scaleX);

		this.updateBigcompanyLabels();

		this.circles.attr("visibility", (d) =>
			this.gas.selectedSectors.has(d.sector) ? "visible" : "hidden"
		);

		// positions the tutorial in the middle.
		let tutorial = d3
			.select("svg#beeswarm-vis")
			.select("g#tutorial")
			.attr(
				"transform",
				`translate(${(this.bounds.maxX - this.bounds.minX) / 2 + 50} ${
					(this.bounds.maxY - this.bounds.minY) / 2
				})`
			);
		tutorial.attr(
			"visibility",
			this.gas.groupingBySector ? "hidden" : "visible"
		);

		this.gas.addEventListenerToEvent("groupingBySector", (_) => {
			tutorial.attr(
				"visibility",
				this.gas.groupingBySector ? "hidden" : "visible"
			);
		});

		// We keep track of the previousSelectedSectors so that we know what was just added
		this.previousSelectedSectors = structuredClone(this.gas.selectedSectors);
		this.gas.addEventListenerToEvent("zValueDataRange", (_) => {
			// Sets the visibility of all circles, hiding all ones not in the selectedSectors.
			this.updateScaleX();
			this.circles.attr("visibility", (d) =>
				this.gas.selectedSectors.has(d.sector) ? "visible" : "hidden"
			);
			this.drawXAxis();

			this.updateScaleRadius();
			this.updateRadiusKey();
			this.circles
				.select("circle")
				.attr("r", (d) => this.scaleRadius(d[this.gas.zValueName]));

			this.updateCollisions();
			this.updateSimulationX();
			// previousSelectedSectors' union selectedSectors
			let newlyAdded = new Set();
			this.gas.selectedSectors.forEach((sector) =>
				this.previousSelectedSectors.has(sector) ? _ : newlyAdded.add(sector)
			);
			this.previousSelectedSectors = structuredClone(this.gas.selectedSectors);
			this.teleportCircles(
				this.circles.filter((d) => newlyAdded.has(d.sector))
			);

			this.sectorControls.updateSectorControls(this.scaleX);

			this.updateScaleY();
			this.drawYAxis();
			this.updateSimulationY();

			this.updateBigcompanyLabels();
		});

		// Runs an expensive computation occasionally to replot the y values.
		let update_y_scale_every = 10;
		this.gas.addEventListenerToEvent("index", (_) => {
			if (this.gas.index % update_y_scale_every === 0) {
				this.updateScaleY();
				this.drawYAxis();
				this.updateSimulationY();
			}
		});

		// Applies the class to the selected ticker
		this.gas.addEventListenerToEvent("selectedSingleCompany", (_) => {
			this.circles.classed(
				"beeswarm-single-selected-ticker",
				(d) => this.gas.selectedSingleCompany.ticker === d.ticker
			);
		});

		this.gas.addEventListenerToEvent("indexPlottedRange", (_) => {
			this.updateScaleY();
			this.drawYAxis();
			this.updateSimulationY();
		});
	}

	/*  ----------------Data scales---------------------    */

	/*
	 * Sets this.scaleRadius to a function that maps the z value range as an area into a radius
	 *
	 * Only examines the companies that are visible with the currenly selected sectors
	 */
	updateScaleRadius(minRadius = 3, maxRadius = 25) {
		let zValueRadiusRange = this.gas.zValueDataRange.map((x) =>
			Math.pow(x / Math.PI, 0.5)
		);
		let areaScale = d3
			.scaleLinear()
			.domain(zValueRadiusRange)
			.range([minRadius, maxRadius]);
		this.scaleRadius = (x) => areaScale(Math.pow(x / Math.PI, 0.5));
	}

	/*
	 * Draws a key for the radius
	 */
	updateRadiusKey() {
		// By default, the two values plotted are the max/2 and max of the data
		let ticks = structuredClone(this.gas.zValueDataRange);
		ticks[0] = ticks[1] / 10;
		let rad_key_offset = [-75, -10];
		let rad_key = d3.select("g#radius-key");
		rad_key
			.attr(
				"transform",
				`translate(${this.bounds.maxX + rad_key_offset[0]} ${
					this.bounds.maxY + rad_key_offset[1]
				})`
			)
			.selectAll("circle")
			.data(ticks)
			.join("circle")
			.attr("r", (d) => this.scaleRadius(d))
			.attr("id", "beeswarm-key-circle");

		// Angle in radians
		let theta = Math.PI / 3;
		// Small offset
		let offset = [5, 5];
		let format = d3.format(",.2r");
		rad_key
			.selectAll("text#beeswarm-key-text")
			.data(ticks)
			.join("text")
			.attr("x", (d) => this.scaleRadius(d) * Math.cos(theta) + offset[0])
			.attr("y", (d) => this.scaleRadius(d) * Math.sin(theta) + offset[1])
			.text((d) => `$${format(d / 1e9)}B`)
			.attr("id", "beeswarm-key-text");
	}

	updateScaleX() {
		if (this.gas.groupingBySector) {
			let step =
				(this.bounds.maxX - this.bounds.minX) /
				(this.gas.selectedSectors.size + 1);
			let x_range = d3.range(
				this.bounds.minX + step,
				this.bounds.maxX + step + 0.001,
				step
			);
			let x_domain_map = {};
			// Hacky way to get a dict of {sector: index}
			let i = 0;
			for (let sec of this.gas.selectedSectors.keys()) {
				x_domain_map[sec] = i;
				i += 1;
			}
			// This is a function sector => coordinate
			this.scaleX = (sector) => x_range[x_domain_map[sector]];
		} else {
			this.scaleX = (_) => (this.bounds.maxX - this.bounds.minX) / 2;
		}
	}

	/*
	 * Updates this.scaleY
	 * Checks the extent of the percentages plotted by the data using an expensive calculation
	 */
	updateScaleY() {
		// Checks the percetiles of the data to plot, with a given
		// padding amount, checking all values falling outside of this
		// range
		let data_to_get_range;
		if (!this.gas.groupingBySector) {
			data_to_get_range = this.gas.data;
		} else {
			data_to_get_range = this.gas.data.filter((d) =>
				this.gas.selectedSectors.has(d.sector)
			);
		}
		// This is the 'lookahead' and 'lookbehind' amount.
		// When calculating the extent of the percentages to be plotted,
		// this padding gives the width of the rows to include.
		// Higher values of this will include more future and past data points
		// in the calculation of the data extent
		let index_padding = 10;
		let index_range = [
			this.gas.index - index_padding,
			this.gas.index + index_padding,
		];
		if (index_range[0] < 0) {
			index_range[0] = 0;
		}
		if (index_range[1] > data_to_get_range[0].chart.length) {
			index_range[1] = data_to_get_range[0].chart.length;
		}
		// uses percentiles to find the domain of the data to plot
		let min_p = 0.0;
		let max_p = 100.0;
		let min = data_to_get_range.map((d) =>
			d3.min(d3.range(index_range[0], index_range[1], 1), (i) =>
				getPercChange(d, i, this.gas.yValueName, this.gas.indexPlottedRange[0])
			)
		);
		let percentile_min = percentile(min_p, min);
		let max = data_to_get_range.map((d) =>
			d3.max(d3.range(index_range[0], index_range[1], 1), (i) =>
				getPercChange(d, i, this.gas.yValueName, this.gas.indexPlottedRange[0])
			)
		);
		let percentile_max = percentile(max_p, max);

		let domain = [percentile_min, percentile_max];

		// Asserts that the domain always contains 0
		if (domain[0] > 0) {
			domain[0] = -1;
		}
		if (domain[1] < 0) {
			domain[1] = 1;
		}
		// We want the origin (0%) to always be in the middle of the chart.
		// To do this, we assert that both boundaries of the domain are
		// equidistant from 0. That is, abs(domain[0]) = abs(domain[1]),
		// 		or -1 * domain[0] = domain[1]
		if (-1 * domain[0] > domain[1]) {
			domain[1] = -1 * domain[0];
		} else {
			domain[0] = -1 * domain[1];
		}

		this.scaleY = d3
			.scaleLinear()
			.domain(domain)
			.range([this.bounds.maxY, this.bounds.minY]);
	}

	/*  ----------------Rendering-----------------------    */

	/*
	 * Draws and positions the Y axis grid lines
	 */
	drawYAxis() {
		let tick_step;
		let domain = this.scaleY.domain();
		let domain_distance = Math.abs(domain[1] - domain[0]);
		if (domain_distance < 9) {
			tick_step = 1;
		} else if (domain_distance < 50) {
			tick_step = 5;
		} else if (domain_distance < 80) {
			tick_step = 10;
		} else {
			tick_step = 20;
		}
		let ticks = d3.range(-200, 200.01, tick_step);

		let anim_duration = 100;

		let grid = d3.select("svg#beeswarm-vis").select("g#grid");
		let lines = grid
			.selectAll("line#horizontal")
			.data(ticks)
			.join("line")
			.attr("id", "horizontal")
			.attr("x1", this.bounds.minX)
			.classed("beeswarm-gridline", true)
			.classed("beeswarm-gridline-0line", (d) => d === 0)
			.attr("stroke", (d) => (d > 0 ? "green" : "red"))
			.attr("x2", this.bounds.maxX)
			.transition()
			.duration(anim_duration)
			.attr("y1", (d) => this.scaleY(d))
			.attr("y2", (d) => this.scaleY(d));

		let axis_labels = grid
			.selectAll("text#axis-label-y")
			.data(ticks)
			.join("text")
			.attr("id", "axis-label-y")
			.attr("x", this.bounds.maxX)
			.transition()
			.duration(anim_duration)
			.attr("y", (d) => this.scaleY(d))
			.text((d) => `${d}%`);
	}

	drawXAxis() {
		let grid = d3.select("svg#beeswarm-vis").select("g#grid");
		let data_to_bind;
		if (this.gas.groupingBySector) {
			data_to_bind = this.gas.selectedSectors;
		} else {
			data_to_bind = [""];
		}
		let lines = grid.selectAll("line#vertical").data(data_to_bind);
		lines.exit().remove();
		lines
			.join("line")
			.attr("id", "vertical")
			.attr("x1", (d) => this.scaleX(d))
			.attr("x2", (d) => this.scaleX(d))
			.attr("y1", this.bounds.minY)
			.attr("y2", this.bounds.maxY)
			.classed("beeswarm-gridline", true);
	}

	// gradient
	getValues() {}
	//gradient
	initColorScales() {
		this.maxPercentChange = d3.max(this.gas.data, function (d) {
			return d3.max(d.chart, function (e) {
				return e.percentChange;
			});
		});
		this.minPercentChange = d3.min(this.gas.data, function (d) {
			return d3.min(d.chart, function (e) {
				return e.percentChange;
			});
		});
		this.colorPositive = d3
			.scaleLinear()
			.domain([0, this.maxPercentChange])
			.range(["#E9EDEB", "#244C3B"]);
		this.colorNegative = d3
			.scaleLinear()
			.domain([this.minPercentChange, 0])
			.range(["#5a1214", "#EEE7E7"]);
	}

	initTooltip() {
		this.tooltip = d3
			.select("div#beeswarm")
			.append("div")
			.attr("id", "beeswarm-tooltip")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("pointer-events", "none");
	}

	drawCircles() {
		let tooltip = this.tooltip;
		this.circles = d3
			.select("svg#beeswarm-vis")
			.select("g#swarm")
			.selectAll("g#circle")
			.data(this.gas.data);
		this.circles.exit().remove();
		let that = this;
		this.circles = this.circles.join("g").attr("id", "circle");

		this.circles
			.append("circle")
			.attr("fill", (d) => this.gas.colorFunc(d.sector))
			.attr("r", (d) => this.scaleRadius(d[this.gas.zValueName]))
			.classed("swarm-circ", true)
			.attr("stroke", (d) => d3.color(this.gas.colorFunc(d.sector)).darker())
			.on("mouseover", function (_) {
				let hovered = d3.select(this);
				let _data = hovered._groups[0][0].__data__;
				that.updateTooltip(_data);
				hovered.classed("hovered-swarm-circ", true);
			})
			.on("mousemove", (e) => {
				tooltip
					.style("left", `${e.pageX + 10}px`)
					.style("top", `${e.pageY + 10}px`);
			})
			.on("mouseleave", function (_) {
				let hovered = d3.select(this);
				tooltip.style("opacity", 0);
				hovered.classed("hovered-swarm-circ", false);
				that._prev_selected_data = null;
			});

		// Recolors old companies that are deselected from selectedSingleCompany
		let old_selectedSingleCompanyCircle;

		let updateSelectedCircle = (_new) => {
			console.log("UPDATE SLEECETED SCIRLCE");
			console.log(old_selectedSingleCompanyCircle);
			console.log(_new);
			if (old_selectedSingleCompanyCircle) {
				old_selectedSingleCompanyCircle
					.select("circle")
					.attr("fill", (d) => this.gas.colorFunc(d.sector));
			}
			_new
				.select("circle")
				.attr("fill", (d) => d3.color(this.gas.colorFunc(d.sector)).brighter());
			old_selectedSingleCompanyCircle = _new;
		};

		this.circles.on("click", function () {
			let clicked = d3.select(this);
			let clicked_ = clicked._groups[0][0].__data__;
			clicked.classed("clicked-swarm-circ", true);
			var filteredDateData =
				clicked._groups[0][0].__data__.chart[that.gas.index];
			var valuesToDisplay = {
				open: filteredDateData.open,
				close: filteredDateData.close,
				high: filteredDateData.high,
				low: filteredDateData.low,
				volume: filteredDateData.volume,
				pe: clicked_.pe,
				eps: clicked_.eps,
				beta: clicked_.beta,
				dividend: clicked_.dividend,
				earnings: clicked_.earnings,
				marketcap: clicked_.marketcap,
			};
			that.gas.set_selectedSingleCompany(clicked_);
			updateSelectedCircle(clicked);
			that.updateBigcompanyLabels();
		});

		this.circles
			.append("text")
			.classed("beeswarm-circle-company-label", true)
			.attr("y", 4);
	}

	updateTooltip(_data) {
		if (!_data) {
			_data = this._prev_selected_data;
		}
		if (!_data) {
			return;
		}
		let close_perc = getPercChange(
			_data,
			this.gas.index,
			this.gas.yValueName,
			this.gas.indexPlottedRange[0]
		);
		let marketcap_format = d3.format(",.3r");
		let html = `Ticker: ${_data.ticker} <div> Company: ${
			_data.company
		} <div> Market Cap: $${marketcap_format(
			_data.marketcap / 1e9
		)}B <div> Perc.: ${d3.format(".1f")(close_perc)}%`;
		// Sets tooltip to be visible
		this.tooltip.style("opacity", 1).html(html);
		this._prev_selected_data = _data;
	}

	/*  ----------------Simulation----------------------    */

	startSimulation() {
		this.simulation = d3
			.forceSimulation(this.gas.data)
			.alphaTarget(0.07)
			.velocityDecay(0.27)
			.on("tick", (_) => {
				this.circles.attr("transform", (d) => `translate(${d.x} ${d.y})`);
			});

		// Teleports with custom y spread
		let spread_var = (this.bounds.maxX - this.bounds.minX) / 10;
		let spread = d3.randomNormal(0, spread_var);
		this.teleportCircles(this.circles, spread_var);
		this.circles.datum((d) => {
			d.y = spread() * 2;
			return d;
		});

		this.updateCollisions();
		this.updateSimulationX();
		this.updateSimulationY();
		console.log("simulation", this.simulation);
	}

	/*
	 * Updates text labels for companies that have a large radius
	 */
	updateBigcompanyLabels() {
		let thresh = this.gas.zValueDataRange[1] * 0.15;
		this.circles.selectAll("text.beeswarm-circle-company-label").text((d) => {
			if (
				d[this.gas.zValueName] > thresh ||
				(this.gas.selectedSingleCompany &&
					this.gas.selectedSingleCompany.ticker === d.ticker)
			) {
				return d.ticker;
			} else {
				("");
			}
		});
	}

	/*
	 * Enables collisions only for datapoints that are in the selectedSectors
	 */
	updateCollisions() {
		this.simulation.force(
			"collide",
			d3
				.forceCollide()
				.radius((d) => {
					if (this.gas.groupingBySector) {
						return this.gas.selectedSectors.has(d.sector)
							? this.scaleRadius(d[this.gas.zValueName])
							: 0;
					} else {
						return this.scaleRadius(d[this.gas.zValueName]);
					}
				})
				.iterations(3)
				.strength(this.simulationSettings.collisionStrength)
		);
	}

	/*
	 * Sets an X force, only for datapoints that are in the selectedSectors
	 */
	updateSimulationX() {
		this.simulation.force(
			"x",
			d3
				.forceX()
				.x((d) => {
					if (
						this.gas.groupingBySector &&
						!this.gas.selectedSectors.has(d.sector)
					) {
						return 0;
					} else {
						return this.scaleX(d.sector);
					}
				})
				.strength(
					this.simulationSettings.globalForceScale *
						this.simulationSettings.forceXScale
				)
		);
	}

	updateSimulationY() {
		this.simulation.force(
			"y",
			d3
				.forceY()
				.y((d) =>
					this.scaleY(
						getPercChange(
							d,
							this.gas.index,
							this.gas.yValueName,
							this.gas.indexPlottedRange[0]
						)
					)
				)
				.strength(
					this.simulationSettings.globalForceScale *
						this.simulationSettings.forceYScale
				)
		);
	}

	/*
	 * Takes a selection of circles, and sets their x and y values based on
	 * their data
	 */
	teleportCircles(circles, spread_var = null) {
		if (spread_var === null) {
			spread_var = (this.bounds.maxX - this.bounds.minX) / 40;
		}
		// Puts them with some random x values
		let spread = d3.randomNormal(0, spread_var);
		circles.datum((d) => {
			d.x = this.scaleX(d.sector) + spread();
			d.y = this.scaleY(
				getPercChange(
					d,
					this.gas.index,
					this.gas.yValueName,
					this.gas.indexPlottedRange[0]
				)
			);
			return d;
		});
	}
}
