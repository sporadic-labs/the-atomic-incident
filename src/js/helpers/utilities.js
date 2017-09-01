exports.default = function(value, defaultValue) {
  return value !== undefined ? value : defaultValue;
};

exports.defaultProperties = function(object, properties) {
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      var value = exports.default(properties[key].value, properties[key].default);
      object[key] = value;
    }
  }
  return object;
};

exports.randomBoolean = function() {
  return Boolean(Math.floor(Math.random() * 2));
};

exports.pointFromAngle = function(angle, isDegrees) {
  var radians = isDegrees ? angle * Math.PI / 180 : angle;
  return new Phaser.Point(Math.cos(radians), Math.sin(radians));
};

exports.map = function(num, min1, max1, min2, max2, options) {
  var mapped = (num - min1) / (max1 - min1) * (max2 - min2) + min2;
  if (!options) return mapped;
  if (options.round && options.round === true) {
    mapped = Math.round(mapped);
  }
  if (options.floor && options.floor === true) {
    mapped = Math.floor(mapped);
  }
  if (options.ceil && options.ceil === true) {
    mapped = Math.ceil(mapped);
  }
  if (options.clamp && options.clamp === true) {
    mapped = Math.min(mapped, max2);
    mapped = Math.max(mapped, min2);
  }
  return mapped;
};

exports.tiledColorToRgb = function(hexColor) {
  // Tiled colors are in the format #AARRGGBB
  var a = parseInt(hexColor.substring(1, 3), 16);
  var r = parseInt(hexColor.substring(3, 5), 16);
  var g = parseInt(hexColor.substring(5, 7), 16);
  var b = parseInt(hexColor.substring(7), 16);
  return Phaser.Color.getColor32(a, r, g, b);
};

/** 
 * Fisher-Yates algorithm to shuffle an array in place. 
 * Source: https://bost.ocks.org/mike/shuffle/ 
 * */
exports.shuffleArray = function(array) {
  for (var i = array.length - 1; i > 0; i -= 1) {
    // Random element between 0 (inclusive) and i (exclusive)
    var j = Math.floor(Math.random() * i);
    // Swap elements i and j
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
