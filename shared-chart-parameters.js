
let width = 300; //document.getElementById("chart").offsetWidth
let height = 150; // document.getElementById("chart").offsetWidth / 2


let xtilde = [...Array(201).keys()].map((i) => i / 200 * 10)

const margin = ({top:20, right:30, bottom: 20, left: 30})

const xscale = d3.scaleLinear()
	.domain([0,10])
	.range([margin.left, width - margin.right])

const yscale = d3.scaleLinear()
  .domain([-1, 1])
  .range([height - margin.bottom, margin.top])

const xAxis = g => g
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .attr("pointer-events", "none")
  .call(d3.axisBottom(xscale))

const yAxis = g => g
  .attr("transform", `translate(${margin.left},0)`)
  .attr("pointer-events", "none")
  .call(d3.axisLeft(yscale))