import {dateMinuteToDate, getPercChange} from "./util.js";

export class Ohlc {
	constructor(gas) {
		this.gas = gas;
		this.svg = d3.select("svg#ohlc-vis");
		let svg_width = parseInt(this.svg.style("width"));
		let svg_height = parseInt(this.svg.style("height"));
		this.bounds = {
			minX: 50,
			maxX: svg_width - 50,
			minY: 20,
			maxY: svg_height - 50,
		};


        this.updateXScale();
        this.updateYScale();
        this.updateXAxis();
        this.updateYAxis();

        this.gas.addEventListenerToEvent("selectedSingleCompany", _ => this.updateOhlcChart(gas.selectedSingleCompany));

    }


    /*    
     * updates this.scaleX which takes a date and maps it to the x position*/

    updateXScale() {
        let domain = this.gas.dateValueRange;
        let range = [this.bounds.minX, this.bounds.maxX];
        this.scaleX = d3.scaleTime().domain(domain).range(range);

        //let testrow = this.gas.data[0].chart[0];
        //console.log(this.scaleX(dateMinuteToDate(testrow.date, testrow.minute)))
    }

    updateYScale() {
        let domain = this.gas.yValueDataRange;
        let range = [this.bounds.maxY, this.bounds.minY];
        this.scaleY = d3.scaleLinear().domain(domain).range(range);
    }

    updateXAxis() {
        let axisG = this.svg.select("g#x-axis")
            .attr("transform", `translate(0 ${this.bounds.maxY})`);
        let xAxis = d3.axisBottom(this.scaleX);
        axisG.call(xAxis);
    }

    updateYAxis() {
        let axisG = this.svg.select("g#y-axis")
            .attr("transform", `translate(${this.bounds.minX} 0)`);
        let yAxis = d3.axisLeft(this.scaleY);
        axisG.call(yAxis);
    }

    updateOhlcChart(company) {


        console.log(company.chart);

        let domain = d3.extent(company.chart, d => d[this.gas.yValueName]);
        let range = [this.bounds.maxY, this.bounds.minY];
        this.scaleY = d3.scaleLinear().domain(domain).range(range);

        this.updateYAxis();

        let series = this.svg.selectAll('.ohlc-series').append('g').classed('ohlc-series', true);
        series.selectAll("g.ohlc-bar")
            .data(company.chart)
            .join("g")
            .classed("ohlc-bar", true);

	    //console.log(series)

       

        let bars = series.selectAll('.ohlc-bar')
            .data(company.chart, function (d) {
                return d.date;
            });

        bars.enter()
            .append('open-close-line')
            .classed('bar', true);

        var lines = bars
            .selectAll('.open-close-line')
            .data(function (d) {
                return [d];
            });

        lines.enter().append('line')
            .attr("stroke", "black")
            .attr("stroke-width", "1")
            .attr("x1", d => this.scaleX(dateMinuteToDate(d.date, d.minute)))
            .attr("y1", d => this.scaleY(d.open))
            .attr("x2", d => this.scaleX(dateMinuteToDate(d.date, d.minute)))
            .attr("y2", d => this.scaleY(d.close));

    }

}
