// boilerplate js for defining a new module

define('module', [], function() {
	
  console.log('Function : Module');

  // constructor
  function Module() {
  }
  // attach an object with additional methods
  // to the prototype of the constructor
  Module.prototype=  {
  	// 1st method
  	init: function() {
  	},
  	// 2nd method
  	destroy: function() {
  	}
  };

  // return module to give access to constructor and methods
  return Module;

});