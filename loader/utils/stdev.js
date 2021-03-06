module.exports = {
  stdev: function standardDeviation(values) {
    var avg = this.average(values);

    var squareDiffs = values.map(function(value) {
      var diff = value - avg;
      var sqrDiff = diff * diff;
      return sqrDiff;
    });

    var avgSquareDiff = this.average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
  },

  average: function average(data) {
    var sum = data.reduce(function(sum, value) {
      return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
  }
};
