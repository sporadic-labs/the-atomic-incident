exports.default = function (value, defaultValue) {
    return (value !== undefined) ? value : defaultValue;
};

exports.defaultProperties = function defaultProperties (object, properties) {
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            var value = exports.default(properties[key].value, 
                properties[key].default);
            object[key] = value;
        }
    }
    return object;
};

exports.map = function (num, min1, max1, min2, max2, options) {
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