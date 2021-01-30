
let width = 500; //document.getElementById("chart").offsetWidth
let height = 250; // document.getElementById("chart").offsetWidth / 2
let colors = ["#003f5c", "#7a5195", "#ef5675", "#ffa600"];
let x_axis_resolution = 201;

const NUMBER_OF_GUESSES = 6;

const NUM_Y_TICKS = 5;

let xtilde = [...Array(x_axis_resolution).keys()].map((i) => 5 + (i / (x_axis_resolution-1) * 45))

const margin = ({top:20, right:30, bottom: 50, left: 55})

const xscaleFunction = width => d3.scaleLinear()
	.domain([5,50])
	.range([margin.left, width - margin.right])

const yscaleFunction = height => d3.scaleLinear()
  .domain([-1, 1])
  .range([height - margin.bottom, margin.top]);

const xscale = xscaleFunction(width);
const yscale = yscaleFunction(height);

const xAxis = (g, height, width) => {

  // Redefine xscale for correct height / width specified for plot
  let xscale = xscaleFunction(width);

  return g
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .attr("pointer-events", "none")
    .call(d3.axisBottom(xscale));
}

// Scale values between [-1,1] to [120,160] to emulate F1 cornering speeds
const scaleYVals = (n) => {
  return 20*(n+1)+120;
};

const yAxis = (g, height) => {

  // Redefine xscale for correct height / width specified for plot
  let yscale = yscaleFunction(height);

  return g
  .attr("transform", `translate(${margin.left},0)`)
  .attr("pointer-events", "none")
  .attr('stroke-width', 0)
  .call(d3.axisLeft(yscale)
          .ticks(NUM_Y_TICKS)
          .tickFormat( d => scaleYVals(d) ));
}
    
const xLabel = (g, height, width) => g
  .append("text")
  .attr("y", height - margin.bottom / 2)
  .attr("x", (width + margin.left - margin.right) / 2)
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("Wing span (cm)");  

const yLabel = (g, height) => g
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0)
  .attr("x", -(height + margin.top - margin.bottom) / 2)
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("Cornering speed (km/h)");  


const yGrid = (g, height, width) => {

  // Redefine xscale for correct height / width specified for plot
  let yscale = yscaleFunction(height);

  return g
  .selectAll(".horizontalGrid")
  .data(yscale.ticks(NUM_Y_TICKS))
  .enter()
  .append("line")
  .attr("stroke", "lightgray")  // colour the line
  .attr("class", "horizontalGrid")
  .attr("x1", margin.left)
  .attr("x2", width - margin.right)
  .attr("y1", d => yscale(d))
  .attr("y2", d => yscale(d));
            // "shape-rendering" : "crispEdges",
  };


// ============================
// Drawing Gaussian Process
// ============================

// const sigma = 0.35//0.25
// const ell = 4//6.75 //1.5 
// const delta = 0.005
// Kernel Variance Parameter
const sigma = 0.36
// Lengthscale Parameter
const ell = 7.0 //1.5 
// Noise variance (or standard deviation, not sure)
const delta = 0.00001  // Does 0 noise break anything??

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

// TODO: Delete this code (removed during Bruno refactor)
// const conditional_distribution = (x, y, xtilde, kernel) => {
//   if(x.length == 0) return ({ mean: [{ x: 0, y: 0 }] });
//   const Sigma = math.add(apply_kernel(x, x, kernel), math.multiply(math.identity(x.length), delta));
//   const Sigmainv = math.inv(Sigma);
//   const Omega = apply_kernel(xtilde, xtilde, kernel);
//   const K = apply_kernel(x, xtilde, kernel);
  
//   const mean = math.multiply(math.multiply(math.transpose(K), Sigmainv), y)
//     ._data;
  
//   const variance = math.diag(math.subtract(Omega, math.multiply(math.multiply(math.transpose(K), Sigmainv), K)))
//     ._data;
  
//   const sd = math.sqrt(variance);
  
//   return mean.map((d, i) => ({ 
//     x: xtilde[i], 
//     mean: d, 
//     var: variance[i], 
//     sd: sd[i], 
//     lower: d - 1.96 * sd[i], 
//     upper: d + 1.96 * sd[i],
//     lower2: d - 1.28 * sd[i],
//     upper2: d + 1.28 * sd[i]
//   }));
// }

// NEW BRUNO CODE FROM REFACTOR
function conditional_distribution (x, y, xtilde, kernel) {
  // Returns the mean and variance of the GP at points xtilde conditioned on observations (x, y)
  if(x.length == 0) {
    const prior_variance = apply_kernel([0], [0], kernel)._data[0][0];
    const mean = xtilde.map((d) => 0);
    const variance = xtilde.map((d) => prior_variance);
    return {mean: mean, variance: variance};
  }
  const Sigma = math.add(apply_kernel(x, x, kernel), math.multiply(math.identity(x.length), delta));
  const Sigmainv = math.inv(Sigma);
  const Omega = apply_kernel(xtilde, xtilde, kernel);
  const K = apply_kernel(x, xtilde, kernel);
  
  const mean = math.multiply(math.multiply(math.transpose(K), Sigmainv), y)
    ._data;
  
  const variance = math.diag(math.subtract(Omega, math.multiply(math.multiply(math.transpose(K), Sigmainv), K)))
    ._data;
  
  return {
    mean: mean,
    variance: variance
  };
}

const conditional_dist_to_plottable_confidence_intervals = (xtilde, mean, variance) => {
  // Take an array of values of X xtilde, and the corresponding means and variances of the GP at these points
  // and return a dict with confidence intervals marked
    const sd = math.sqrt(variance);
    return mean.map((d, i) => ({ 
    x: xtilde[i], 
    mean: d,
    lower: d - 1.96 * sd[i],    
    upper: d + 1.96 * sd[i],
    lower2: d - 1.28 * sd[i],
    upper2: d + 1.28 * sd[i]
  }));
}

const conditional_dist_with_confidence_intervals = (x, y, xtilde, kernel) => {
  const dist = conditional_distribution(x, y, xtilde, kernel);
  return conditional_dist_to_plottable_confidence_intervals(xtilde, dist.mean, dist.variance);
}

const kernel = squared_exponential_kernel(sigma, ell);

// ============================
// Gaussian sampling
// ============================

const cholesky = (array) => {
  // Returns Cholesky decomposition of array
	const zeros = [...Array(array.length)].map( _ => Array(array.length).fill(0));
	const L = zeros.map((row, r, xL) => row.map((v, c) => {
		const sum = row.reduce((s, _, i) => i < c ? s + xL[r][i] * xL[c][i] : s, 0);
		return xL[r][c] = c < r + 1 ? r === c ? Math.sqrt(array[r][r] - sum) : (array[r][c] - sum) / xL[c][c] : v;
	}));
	return L;
}

function sample_random_normal() {
  // Box-muller method for sampling from a Gaussian
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function sample_random_normal_array(size) {
  // Sample an array of random normally distributed variables:
  let samples = [];
  for (let i = 0; i < size; i++) {
    samples.push(sample_random_normal());
  }
  return samples;
}

const sample_from_gp_prior = (xtilde, kernel) => {
  const cov_matrix = apply_kernel(xtilde, xtilde, kernel);
  const cov_matrix_with_jitter = math.add(cov_matrix, math.multiply(math.identity(xtilde.length), 0.000000001))._data
  const L = cholesky(cov_matrix_with_jitter);
  const y = math.multiply(L, sample_random_normal_array(xtilde.length));
  return y;
}

function gaussian_confidence_intervals(mean, variance, N) {
  // Returns points [mean - std*N, mean-std* (N-1), ..., mean, mean + std, mean + std*2, ... mean + std * N]
  // from a Gaussian with a given mean and variance
  const std = math.sqrt(variance);
  let samples = [mean];
  for (let i = 1; i <= N; i++) {
    samples.unshift(mean - std*i);
    samples.push(mean + std*i);
  }
  return samples;
}

// ============================
// Expected improvement
// ============================

function normal_pdf (x, mean, std) {
  const scaling_factor = math.dotMultiply(std, math.sqrt(math.dotMultiply(2, math.PI)));
  const exponential_term = math.exp(math.dotDivide(math.dotMultiply(-1, math.dotPow(math.subtract(x, mean), 2)), (math.dotMultiply(2, math.dotPow(std, 2)))))
  return math.dotDivide(exponential_term, scaling_factor);
}

function normal_cdf (x) {
	return math.add(0.5,math.dotMultiply(0.5, math.erf(x)));
}

// TODO: Check if x argument is redundant here
function expected_improvement(mean_pred, std_pred, max_pred_hereto) {
// function expected_improvement(x, mean_pred, std_pred, max_pred_hereto) {
  // Based on eq. 44 in https://www.cs.ox.ac.uk/people/nando.defreitas/publications/BayesOptLoop.pdf
  const term1 = math.dotMultiply(math.subtract(mean_pred, max_pred_hereto), normal_cdf(math.dotDivide((math.subtract(mean_pred, max_pred_hereto)),std_pred)));
  const term2 = math.dotMultiply(std_pred, normal_pdf(max_pred_hereto, mean_pred, std_pred));
   
  return math.add(term1, term2);
}

// ============================
// Generic helpers
// ============================

function scale_invert_points(points, xscale, yscale) {
	return points.map((d) => ({x: xscale.invert(d.x), y: yscale.invert(d.y)}));
}