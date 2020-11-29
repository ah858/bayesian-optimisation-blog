
let width = 500; //document.getElementById("chart").offsetWidth
let height = 250; // document.getElementById("chart").offsetWidth / 2


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

// ============================
// Drawing Gaussian Process
// ============================

const sigma = 0.25
const ell = 1.5
const delta = 0.005

const squared_exponential_kernel = (sigma, ell) => {
  const sigmasq = Math.pow(sigma, 2);
  const ellsq = 2 * Math.pow(ell, 2);
  return (x1, x2) => sigmasq * Math.exp(-Math.pow(x1 - x2, 2) / ellsq)
}

const apply_kernel = (x1s, x2s, kernel) => {
  const covariance = [];
  for(let i = 0; i < x1s.length; i++) {
    covariance.push([]);
    for(let j = 0; j < x2s.length; j++) {
      covariance[i][j] = kernel(x1s[i], x2s[j]);
    }
  }
  return math.matrix(covariance);
}

const conditional_distribution = (x, y, xtilde, kernel) => {
  if(x.length == 0) return ({ mean: [{ x: 0, y: 0 }] });
  const Sigma = math.add(apply_kernel(x, x, kernel), math.multiply(math.identity(x.length), delta));
  const Sigmainv = math.inv(Sigma);
  const Omega = apply_kernel(xtilde, xtilde, kernel);
  const K = apply_kernel(x, xtilde, kernel);
  
  const mean = math.multiply(math.multiply(math.transpose(K), Sigmainv), y)
    ._data;
  
  const variance = math.diag(math.subtract(Omega, math.multiply(math.multiply(math.transpose(K), Sigmainv), K)))
    ._data;
  
  const sd = math.sqrt(variance);
  
  return mean.map((d, i) => ({ 
    x: xtilde[i], 
    mean: d, 
    var: variance[i], 
    sd: sd[i], 
    lower: d - 1.96 * sd[i], 
    upper: d + 1.96 * sd[i],
    lower2: d - 1.28 * sd[i],
    upper2: d + 1.28 * sd[i]
  }));
}

const kernel = squared_exponential_kernel(sigma, ell);