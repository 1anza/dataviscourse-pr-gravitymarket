class Ohlc {
    constructor(gas) {
        this.gas = gas;
        this.svg = d3.select("svg#ohlc-vis");
        this.bounds = {
            minX: 50,
            maxX: 475,
            minY: 10,
            maxY: 200,
        };


        this.updateXScale();
        this.updateYScale();
        this.updateXAxis();
        this.updateYAxis();

        this.updateOhlcChart();

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

    updateOhlcChart(selected) {
    }

}
