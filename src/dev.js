// attaches dev elements

function addDevTools(gas) {
	d3.select("div#playback-div")
		.append("div")
		.text("toggle grouping")
		.append("input")
		.attr("type", "checkbox")
		.on("change", e => {
			if(e.target.checked) {
				gas.set_selectedSectors(new Set(["Health Care", "Industrials"]));
			} else {
				gas.set_selectedSectors(new Set([]));
			}
		})
}
