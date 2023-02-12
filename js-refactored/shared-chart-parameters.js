
let width = 500; //document.getElementById("chart").offsetWidth
let height = 250; // document.getElementById("chart").offsetWidth / 2
let colors = ["#003f5c", "#7a5195", "#ef5675", "#ffa600"];
let x_axis_resolution = 201;

const NUMBER_OF_GUESSES = 6;

const NUM_Y_TICKS = 5;

// The limits _within_ the plot (not in coordinate space)
const xmin = 5;
const xmax = 50;
const ymin = 120;
const ymax = 20 * (NUM_Y_TICKS) + ymin;

// == Settings for the Gaussian Process

// Kernel Standard Deviation Parameter
const sigma = 0.46 * ((ymax - ymin) / 2);
// Lengthscale Parameter
const ell = 7.0 //1.5 
// Noise variance (or standard deviation, not sure)
const delta = 0.00001  // Does 0 noise break anything??
const kernel = squared_exponential_kernel_constructor(sigma, ell);
const mean_function = constant_mean_function_constructor((ymax - ymin) / 2 + ymin)


// The evenly spaced grid of points along the x-axis to use for plotting
let xtilde = [...Array(x_axis_resolution).keys()].map((i) => xmin + (i / (x_axis_resolution-1) * (xmax - xmin)))

const margin = ({top:20, right:30, bottom: 50, left: 55})

function xscaleFunction (width, margin_ = margin) {
  return d3.scaleLinear()
	.domain([xmin, xmax])
	.range([margin_.left, width - margin_.right]);
}

function yscaleFunction (height, margin_ = margin) {
  return d3.scaleLinear()
  .domain([ymin, ymax])
  .range([height - margin_.bottom, margin_.top]);
}

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

const yAxis = (g, height) => {

  // Redefine xscale for correct height / width specified for plot
  let yscale = yscaleFunction(height);

  return g
  .attr("transform", `translate(${margin.left},0)`)
  .attr("pointer-events", "none")
  .attr('stroke-width', 0)
  .call(d3.axisLeft(yscale)
          .ticks(NUM_Y_TICKS));
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


const yGrid = (g, height, width, classname = "horizontalGrid") => {

  // Redefine xscale for correct height / width specified for plot
  let yscale = yscaleFunction(height);

  return g
  .selectAll(`.${classname}`)
  .data(yscale.ticks(NUM_Y_TICKS))
  .enter()
  .append("line")
  .attr("stroke", "lightgray")  // colour the line
  .attr("class", classname)
  .attr("x1", margin.left)
  .attr("x2", width - margin.right)
  .attr("y1", d => yscale(d))
  .attr("y2", d => yscale(d));
            // "shape-rendering" : "crispEdges",
  };


// ============================
// Drawing Gaussian Process
// ============================



/**
 * 
 * @param {Number} constant 
 * @returns 
 */
function constant_mean_function_constructor (constant) {
  return (x) => constant;
}
const zero_mean_function = constant_mean_function_constructor(0)

/**
 * A squared exponential kernel function constructor
 * @param {number} sigma 
 * @param {number} ell 
 * @returns {Function} A kernel function that takes a pair of points and returns a float
 */
function squared_exponential_kernel_constructor (sigma, ell) {
  const sigmasq = Math.pow(sigma, 2);
  const ellsq = 2 * Math.pow(ell, 2);
  return (x1, x2) => sigmasq * Math.exp(-Math.pow(x1 - x2, 2) / ellsq)
}

/**
 * Apply a kernel to two vectors of to compute the cross-covariance matrix
 * @param {Array<number>} x1s 
 * @param {Array<number>} x2s 
 * @param {Function} kernel 
 * @returns {Array<Array<number>>} a covariance matrix
 */
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

/**
 * Get the conditional distribution from a GP for each point in xtilde, given initial observations
 * (x, y)
 * @param {*} x x-coordinates of initial obs.
 * @param {*} y y-coordinates of initial obs.
 * @param {*} xtilde grid of points along which to return the conditional distribution
 * @param {*} kernel the kernel to use for the GP
 * @returns Two arrays of points {mean: mean, variance: variance}
 */
function conditional_distribution (x, y, xtilde, kernel, mean_func = zero_mean_function) {
  // Returns the mean and variance of the GP at points xtilde conditioned on observations (x, y)
  if(x.length == 0) {
    const prior_variance = apply_kernel([0], [0], kernel)._data[0][0];
    const mean = xtilde.map((d) => mean_func(d));
    const variance = xtilde.map((d) => prior_variance);
    return {mean: mean, variance: variance};
  }
  const Sigma = math.add(apply_kernel(x, x, kernel), math.multiply(math.identity(x.length), delta));
  const Sigmainv = math.inv(Sigma);
  const Omega = apply_kernel(xtilde, xtilde, kernel);
  const K = apply_kernel(x, xtilde, kernel);
  const preConditioner = math.multiply(math.transpose(K), Sigmainv);
  
  const mean = math.add(
    xtilde.map(mean_func),
    math.multiply(preConditioner, math.subtract(y, x.map(mean_func)))
  )._data;
  
  const variance = math.diag(math.subtract(Omega, math.multiply(preConditioner, K)))
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
/**
 * Computes the mean and lower and upper confidence intervals of the predictive distribution from a Gaussian Process (GP)
 * given the x and y coordinates of an initial set of points, a grid along the x-axis and a specified kernel.
 * 
 * @param {Array} x - The x-coordinates of the initial points.
 * @param {Array} y - The y-coordinates of the initial points.
 * @param {Array} xtilde - The x-grid along which the summary statistics for each x point will be returned.
 * @param {Function} kernel - The kernel to use for the GP.
 * 
 * @returns {Array<{x: number, mean: number, lower: number, lower2: number, upper: number, upper2: number}>}
 *                   An array of objects, each representing a point on the x-grid with attributes:
 *                   {x: x, mean: mean, lower: lower, upper: upper, lower2: lower2, upper2: upper2},
 *                   where each attribute has a float value.
 */
const conditional_dist_with_confidence_intervals = (x, y, xtilde, kernel, mean_func = zero_mean_function) => {
  const dist = conditional_distribution(x, y, xtilde, kernel, mean_func);
  return conditional_dist_to_plottable_confidence_intervals(xtilde, dist.mean, dist.variance);
}

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

function sample_from_gp_prior (xtilde, kernel, mean_func = zero_mean_function) {
  const cov_matrix = apply_kernel(xtilde, xtilde, kernel);
  const cov_matrix_with_jitter = math.add(cov_matrix, math.multiply(math.identity(xtilde.length), 0.000000001))._data
  const L = cholesky(cov_matrix_with_jitter);
  const y = math.add(
    math.multiply(L, sample_random_normal_array(xtilde.length)),
    xtilde.map(mean_func)
  );
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

/**
 * Computes a heatmap for the conditional density p(y | x) on a grid of points (xgrid, ygrid).
 * 
 * @param {Array} x - The x-coordinates of the initial points.
 * @param {Array} y - The y-coordinates of the initial points.
 * @param {Array} xgrid - The x-coordinates of the grid points.
 * @param {Array} ygrid - The y-coordinates of the grid points.
 * @param {Function} kernel - The kernel to use for the GP.
 * 
 * @returns {Array<{x: number, y: number, density: number}>} 
 *                   An array of objects, each representing a point on the grid with attributes:
 *                   {x: x, y: y, density: density}, where (x, y) represent the location,
 *                   and "density" represents the value of p(y | x) from the GP.
 */
function conditional_distribution_density_heatmap (x, y, xgrid, ygrid, kernel) {
  const dist = conditional_distribution(x, y, xgrid, kernel);
  let densities = [];
  for (let i = 0; i < xgrid.length; i++) {
    for (let j = 0; j < ygrid.length; j++) {
      densities.push({
        x: xgrid[i],
        y: ygrid[j],
        density: normal_pdf(ygrid[j], dist.mean[i], math.sqrt(dist.variance[i]))
      });
    }
  }
  return densities;
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
  // Map from pixel coordinates to "plot" coordinates
	return points.map((d) => ({x: xscale.invert(d.x), y: yscale.invert(d.y)}));
}

/**
 * Possibly squeeze values in array 'points' to ensure they are within the range [range_min, range_max]
 * @param {Array<number>} points 
 * @param {number} range_min 
 * @param {number} range_max 
 * @returns {Array<number>}
 */
function squeeze_to_range(points, range_min, range_max) {
  let sample_max = d3.max(points);
  let sample_min = d3.min(points);
  let target_min = Math.max(sample_min, range_min);
  let target_max = Math.min(sample_max, range_max);
  return math.add(
    target_min,
    math.multiply(
      ((target_max - target_min) / (sample_max - sample_min)) ,
      math.add(points, -sample_min)
    )
  )
}

/**
 * Fit values in array 'points' so that the maximum and minimum are coincident with [range_min, range_max]
 * @param {Array<number>} points 
 * @param {number} range_min 
 * @param {number} range_max 
 * @returns {Array<number>}
 */
function fit_to_range(points, range_min, range_max) {
  let sample_max = d3.max(points);
  let sample_min = d3.min(points);
  return math.add(
    range_min,
    math.multiply(
      ((range_max - range_min) / (sample_max - sample_min)) ,
      math.add(points, -sample_min)
    )
  )
}

function get_length_of(arr) {
  return d3.max(arr) - d3.min(arr);
}