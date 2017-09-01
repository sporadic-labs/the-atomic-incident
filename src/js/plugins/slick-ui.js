/* eslint-disable */

/** 
 * SlickUI module.
 * This is a light wrapper around SlickUI's dist file so that it plays nicely
 * with our module structure. Updating
 *  1. Copy and paste the latest slick-ui.min.js into the IIFE below. Grab it 
 *     from mikewesthad/slick-ui/ which has a couple of bug fixes.
 *  2. Remove the "SlickUI = {};" line at the beginning of the pasted contents.
 * 
 * @module SlickUI 
 */

var SlickUI = {};
module.exports = SlickUI;

(function() {
  // slick-ui.js v0.1

  SlickUI.namespace = function(namespace) {
    var parts = namespace.split(".");
    var context = SlickUI;
    for (var i in parts) {
      var part = parts[i];
      context = context[part] = context[part] ? context[part] : {};
    }
    return SlickUI[namespace];
  };

  Phaser.Plugin.SlickUI = function(game, parent) {
    Phaser.Plugin.call(this, game, parent);
    this.defaultRenderer = {
      button: "SlickUI.Element.Renderer.ButtonRenderer",
      checkbox: "SlickUI.Element.Renderer.CheckboxRenderer",
      panel: "SlickUI.Element.Renderer.PanelRenderer",
      slider: "SlickUI.Element.Renderer.SliderRenderer",
      text_field: "SlickUI.Element.Renderer.TextFieldRenderer",
      keyboard: "SlickUI.Element.Renderer.KeyboardRenderer",
      key: "SlickUI.Element.Renderer.KeyRenderer"
    };
    this.renderer = {};
  };

  Phaser.Plugin.SlickUI.prototype = Object.create(Phaser.Plugin.prototype);

  Phaser.Plugin.SlickUI.prototype.constructor = Phaser.Plugin.SamplePlugin;

  Phaser.Plugin.SlickUI.prototype.load = function(theme) {
    this.container = new SlickUI.Container.Container(this);
    var themePath = theme.replace(/\/[^\/]+$/, "/");
    this.game.load.json("slick-ui-theme", theme);
    this.game.load.resetLocked = true;
    this.game.load.start();
    var isQueued = false;
    var queueAssets = function() {
      if (!this.game.cache.checkJSONKey("slick-ui-theme") || isQueued) {
        return;
      }
      var theme = this.game.cache.getJSON("slick-ui-theme");
      for (var k in theme.images) {
        this.game.load.image("slick-ui-" + k, themePath + theme.images[k]);
      }
      for (k in theme.fonts) {
        this.game.load.bitmapFont(k, themePath + theme.fonts[k][0], themePath + theme.fonts[k][1]);
      }
      isQueued = true;
      this.game.load.onFileComplete.remove(queueAssets);
    };
    this.game.load.onFileComplete.add(queueAssets, this);
  };

  Phaser.Plugin.SlickUI.prototype.add = function(element) {
    return this.container.add(element);
  };

  Phaser.Plugin.SlickUI.prototype.getRenderer = function(name) {
    if (typeof this.renderer[name] != "undefined") {
      return this.renderer[name];
    }
    var theme = this.game.cache.getJSON("slick-ui-theme");
    var resolveObject = function(name) {
      var namespace = name.split(".");
      var context = SlickUI;
      if (namespace[0] == "SlickUI") namespace.shift();
      for (var i in namespace) {
        context = context[namespace[i]];
      }
      return context;
    };
    if (typeof theme.renderer == "undefined" || typeof theme.renderer[name] == "undefined") {
      if (typeof this.defaultRenderer[name] == "undefined") {
        throw new Error("Trying to access undefined renderer '" + name + "'.");
      }
      return (this.renderer[name] = new (resolveObject(this.defaultRenderer[name]))(this.game));
    }
    return (this.renderer[name] = new (resolveObject(theme.renderer[name]))(this.game));
  };

  SlickUI.namespace("Container");

  SlickUI.Container.Container = function(parent) {
    this.root = null;
    if (!(parent instanceof SlickUI.Container.Container)) {
      this.root = parent;
      parent = null;
    }
    this.parent = parent;
    this.children = [];
    if (parent) {
      this.root = parent.root;
      this.displayGroup = this.root.game.add.group();
      parent.displayGroup.add(this.displayGroup);
      this.x = parent.x;
      this.y = parent.y;
      this.width = parent.width;
      this.height = parent.height;
    } else {
      this.displayGroup = this.root.game.add.group();
      this.x = 0;
      this.y = 0;
      this.width = this.root.game.width;
      this.height = this.root.game.height;
    }
  };

  SlickUI.Container.Container.prototype.add = function(element) {
    element.setContainer(this);
    if (typeof element.init == "function") {
      element.init();
    }
    this.root.game.world.bringToTop(this.displayGroup);
    this.children.push(element);
    return element;
  };

  SlickUI.namespace("Element");

  SlickUI.Element.Button = function(x, y, width, height) {
    this._x = x;
    this._y = y;
    this._offsetX = x;
    this._offsetY = y;
    this._width = width;
    this._height = height;
    this.container = null;
  };

  SlickUI.Element.Button.prototype.setContainer = function(container) {
    this.container = new SlickUI.Container.Container(container);
  };

  SlickUI.Element.Button.prototype.init = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    var x = (this.container.x = this.container.parent.x + this._x);
    var y = (this.container.y = this.container.parent.y + this._y);
    var width = (this.container.width = Math.min(
      this.container.parent.width - this._x,
      this._width
    ));
    var height = (this.container.height = Math.min(
      this.container.parent.height - this._y,
      this._height
    ));
    this.container.x += Math.round(theme.button["border-x"] / 2);
    this.container.y += Math.round(theme.button["border-y"] / 2);
    this.container.width -= theme.button["border-x"];
    this.container.height -= theme.button["border-y"];
    var renderedSprites = this.container.root.getRenderer("button").render(width, height);
    this.spriteOff = renderedSprites[0];
    this.spriteOn = renderedSprites[1];
    this.sprite = this.container.root.game.make.button(x, y);
    this.sprite.loadTexture(this.spriteOff.texture);
    this.container.displayGroup.add(this.sprite);
    this.sprite.x = x;
    this.sprite.y = y;
    this._offsetX = x;
    this._offsetY = y;
    this.sprite.fixedToCamera = true;
    var hover = false;
    this.sprite.events.onInputOver.add(function() {
      hover = true;
    }, this);
    this.sprite.events.onInputOut.add(function() {
      hover = false;
    }, this);
    this.sprite.events.onInputDown.add(function() {
      this.sprite.loadTexture(this.spriteOn.texture);
    }, this);
    this.sprite.events.onInputUp.add(function() {
      this.sprite.loadTexture(this.spriteOff.texture);
      if (!hover) {
        this.sprite.events.onInputUp.halt();
      }
    }, this);
    this.events = this.sprite.events;
  };

  SlickUI.Element.Button.prototype.add = function(element) {
    return this.container.add(element);
  };

  Object.defineProperty(SlickUI.Element.Button.prototype, "x", {
    get: function() {
      return this._x - this.container.parent.x;
    },
    set: function(value) {
      this._x = value;
      this.container.displayGroup.x = this.container.parent.x + value - this._offsetX;
    }
  });

  Object.defineProperty(SlickUI.Element.Button.prototype, "y", {
    get: function() {
      return this._y - this.container.parent.y;
    },
    set: function(value) {
      this._y = value;
      this.container.displayGroup.y = this.container.parent.y + value - this._offsetY;
    }
  });

  Object.defineProperty(SlickUI.Element.Button.prototype, "visible", {
    get: function() {
      return this.container.displayGroup.visible;
    },
    set: function(value) {
      this.container.displayGroup.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Button.prototype, "alpha", {
    get: function() {
      return this.container.displayGroup.alpha;
    },
    set: function(value) {
      this.container.displayGroup.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Button.prototype, "width", {
    get: function() {
      return this.container.width;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._width = Math.round(value + theme.button["border-x"]);
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  Object.defineProperty(SlickUI.Element.Button.prototype, "height", {
    get: function() {
      return this.container.height;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._height = Math.round(value + theme.button["border-y"]);
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  SlickUI.namespace("Element");

  SlickUI.Element.Checkbox = function(x, y, type) {
    this._x = x;
    this._y = y;
    this.container = null;
    this._checked = false;
    this.type = type;
    if (typeof type == "undefined") {
      this.type = SlickUI.Element.Checkbox.TYPE_CHECKBOX;
    }
  };

  SlickUI.Element.Checkbox.TYPE_CHECKBOX = 0;

  SlickUI.Element.Checkbox.TYPE_RADIO = 1;

  SlickUI.Element.Checkbox.TYPE_CROSS = 2;

  SlickUI.Element.Checkbox.prototype.setContainer = function(container) {
    this.container = container;
  };

  SlickUI.Element.Checkbox.prototype.init = function() {
    var x = this.container.x + this._x;
    var y = this.container.y + this._y;
    var key;
    switch (this.type) {
      case SlickUI.Element.Checkbox.TYPE_RADIO:
        key = "radio";
        break;

      case SlickUI.Element.Checkbox.TYPE_CROSS:
        key = "cross";
        break;

      default:
        key = "check";
        break;
    }
    var sprites = this.container.root.getRenderer("checkbox").render(key);
    this.sprite = this.container.root.game.make.sprite(0, 0, sprites[0].texture);
    this.sprite.x = x;
    this.sprite.y = y;
    this._spriteOff = sprites[0];
    this._spriteOn = sprites[1];
    this.displayGroup = this.container.root.game.add.group();
    this.displayGroup.add(this.sprite);
    this.container.displayGroup.add(this.displayGroup);
    this.sprite.inputEnabled = true;
    this.sprite.fixedToCamera = true;
    this.input.useHandCursor = true;
    this.events.onInputDown.add(function() {
      this.checked = !this.checked;
    }, this);
  };

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "x", {
    get: function() {
      return this.displayGroup.x + this._x;
    },
    set: function(value) {
      this.displayGroup.x = value - this._x;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "y", {
    get: function() {
      return this.displayGroup.y + this._y;
    },
    set: function(value) {
      this.displayGroup.y = value - this._y;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "checked", {
    get: function() {
      return this._checked;
    },
    set: function(value) {
      this._checked = value;
      if (value) {
        this.sprite.loadTexture(this._spriteOn.texture);
      } else {
        this.sprite.loadTexture(this._spriteOff.texture);
      }
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "visible", {
    get: function() {
      return this.sprite.visible;
    },
    set: function(value) {
      this.sprite.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "alpha", {
    get: function() {
      return this.sprite.alpha;
    },
    set: function(value) {
      this.sprite.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "events", {
    get: function() {
      return this.sprite.events;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "input", {
    get: function() {
      return this.sprite.input;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "width", {
    get: function() {
      return this.sprite.width;
    },
    set: function(value) {
      this.sprite.width = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Checkbox.prototype, "height", {
    get: function() {
      return this.sprite.height;
    },
    set: function(value) {
      this.sprite.height = value;
    }
  });

  SlickUI.namespace("Element");

  SlickUI.Element.DisplayObject = function(x, y, displayObject, width, height) {
    this._x = x;
    this._y = y;
    this._offsetX = x;
    this._offsetY = y;
    this.displayObject = displayObject;
    this.container = null;
    this._width = width;
    this._height = height;
  };

  SlickUI.Element.DisplayObject.prototype.setContainer = function(container) {
    this.container = new SlickUI.Container.Container(container);
    if (typeof this._width == "undefined") {
      this._width = this.container.root.game.width;
    }
    if (typeof this._height == "undefined") {
      this._height = this.container.root.game.height;
    }
  };

  SlickUI.Element.DisplayObject.prototype.init = function() {
    var x = (this.container.x = this.container.parent.x + this._x);
    var y = (this.container.y = this.container.parent.y + this._y);
    this.container.width = Math.min(this.container.parent.width - this._x, this._width);
    this.container.height = Math.min(this.container.parent.height - this._y, this._height);
    if (!this.displayObject instanceof Phaser.Sprite) {
      this.sprite = this.container.root.game.make.sprite(x, y, this.displayObject);
    } else {
      this.sprite = this.displayObject;
    }
    this.container.displayGroup.add(this.sprite);
    this.sprite.x = x;
    this.sprite.y = y;
    this._offsetX = x;
    this._offsetY = y;
    this.sprite.fixedToCamera = true;
  };

  SlickUI.Element.DisplayObject.prototype.add = function(element) {
    return this.container.add(element);
  };

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "x", {
    get: function() {
      return this._x - this.container.parent.x;
    },
    set: function(value) {
      this._x = value;
      this.container.displayGroup.x = this.container.parent.x + value - this._offsetX;
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "y", {
    get: function() {
      return this._y - this.container.parent.y;
    },
    set: function(value) {
      this._y = value;
      this.container.displayGroup.y = this.container.parent.y + value - this._offsetY;
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "visible", {
    get: function() {
      return this.container.displayGroup.visible;
    },
    set: function(value) {
      this.container.displayGroup.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "alpha", {
    get: function() {
      return this.container.displayGroup.alpha;
    },
    set: function(value) {
      this.container.displayGroup.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "inputEnabled", {
    get: function() {
      return this.sprite.inputEnabled;
    },
    set: function(value) {
      this.sprite.inputEnabled = value;
      if (value) {
        this.input = this.sprite.input;
      } else {
        this.input = null;
      }
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "events", {
    get: function() {
      return this.sprite.events;
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "width", {
    get: function() {
      return this.container.width;
    },
    set: function(value) {
      this._width = value;
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  Object.defineProperty(SlickUI.Element.DisplayObject.prototype, "height", {
    get: function() {
      return this.container.height;
    },
    set: function(value) {
      this._height = value;
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  SlickUI.namespace("Element");

  SlickUI.Element.Panel = function(x, y, width, height) {
    this._x = x;
    this._y = y;
    this._offsetX = x;
    this._offsetY = y;
    this._width = width;
    this._height = height;
    this.container = null;
  };

  SlickUI.Element.Panel.prototype.setContainer = function(container) {
    this.container = new SlickUI.Container.Container(container);
  };

  SlickUI.Element.Panel.prototype.init = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    var x = (this.container.x = this.container.parent.x + this._x);
    var y = (this.container.y = this.container.parent.y + this._y);
    var width = (this.container.width = Math.min(
      this.container.parent.width - this._x,
      this._width
    ));
    var height = (this.container.height = Math.min(
      this.container.parent.height - this._y,
      this._height
    ));
    this.container.x += Math.round(theme.panel["border-x"] / 2);
    this.container.y += Math.round(theme.panel["border-y"] / 2);
    this.container.width -= theme.panel["border-x"];
    this.container.height -= theme.panel["border-y"];
    this._sprite = this.container.displayGroup.add(
      this.container.root.getRenderer("panel").render(width, height)
    );
    this._sprite.x = x;
    this._sprite.y = y;
    this._sprite.fixedToCamera = true;
    this._offsetX = x;
    this._offsetY = y;
  };

  SlickUI.Element.Panel.prototype.add = function(element) {
    return this.container.add(element);
  };

  SlickUI.Element.Panel.prototype.destroy = function() {
    this.container.displayGroup.removeAll(true);
    this.container.displayGroup.destroy();
    this.container.children = [];
    this.container = undefined;
    this.sprite = undefined;
  };

  Object.defineProperty(SlickUI.Element.Panel.prototype, "x", {
    get: function() {
      return this._x - this.container.parent.x;
    },
    set: function(value) {
      this._x = value;
      this.container.displayGroup.x = this.container.parent.x + value - this._offsetX;
    }
  });

  Object.defineProperty(SlickUI.Element.Panel.prototype, "y", {
    get: function() {
      return this._y - this.container.parent.y;
    },
    set: function(value) {
      this._y = value;
      this.container.displayGroup.y = this.container.parent.y + value - this._offsetY;
    }
  });

  Object.defineProperty(SlickUI.Element.Panel.prototype, "visible", {
    get: function() {
      return this.container.displayGroup.visible;
    },
    set: function(value) {
      this.container.displayGroup.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Panel.prototype, "alpha", {
    get: function() {
      return this.container.displayGroup.alpha;
    },
    set: function(value) {
      this.container.displayGroup.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Panel.prototype, "width", {
    get: function() {
      return this.container.width;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._width = Math.round(value + theme.panel["border-x"]);
      this._sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this._sprite);
    }
  });

  Object.defineProperty(SlickUI.Element.Panel.prototype, "height", {
    get: function() {
      return this.container.height;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._height = Math.round(value + theme.panel["border-y"]);
      this._sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this._sprite);
    }
  });

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.ButtonRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.ButtonRenderer.prototype.render = function(width, height) {
    var theme = this.game.cache.getJSON("slick-ui-theme");
    var context = this;
    var cutSprite = function(button) {
      var bmd = context.game.add.bitmapData(width, height);
      bmd.copyRect(
        button,
        new Phaser.Rectangle(0, 0, theme.button["border-x"], theme.button["border-y"])
      );
      bmd.copy(
        button,
        theme.button["border-x"] + 1,
        0,
        1,
        theme.button["border-y"],
        theme.button["border-x"],
        0,
        width - theme.button["border-x"] * 2,
        theme.button["border-y"]
      );
      bmd.copyRect(
        button,
        new Phaser.Rectangle(
          button.width - theme.button["border-x"],
          0,
          theme.button["border-x"],
          theme.button["border-y"]
        ),
        width - theme.button["border-x"]
      );
      bmd.copy(
        button,
        0,
        theme.button["border-y"] + 1,
        theme.button["border-x"],
        1,
        0,
        theme.button["border-y"],
        theme.button["border-x"],
        height - theme.button["border-y"] * 2
      );
      bmd.copy(
        button,
        button.width - theme.button["border-x"],
        theme.button["border-y"] + 1,
        theme.button["border-x"],
        1,
        width - theme.button["border-x"],
        theme.button["border-y"],
        theme.button["border-x"],
        height - theme.button["border-y"] * 2
      );
      bmd.copyRect(
        button,
        new Phaser.Rectangle(
          0,
          button.height - theme.button["border-y"],
          theme.button["border-x"],
          theme.button["border-y"]
        ),
        0,
        height - theme.button["border-y"]
      );
      bmd.copyRect(
        button,
        new Phaser.Rectangle(
          button.width - theme.button["border-x"],
          button.height - theme.button["border-y"],
          theme.button["border-x"],
          theme.button["border-y"]
        ),
        width - theme.button["border-x"],
        height - theme.button["border-y"]
      );
      bmd.copy(
        button,
        theme.button["border-x"] + 1,
        button.height - theme.button["border-y"],
        1,
        theme.button["border-y"],
        theme.button["border-x"],
        height - theme.button["border-y"],
        width - theme.button["border-x"] * 2,
        theme.button["border-y"]
      );
      bmd.copy(
        button,
        theme.button["border-x"],
        theme.button["border-y"],
        1,
        1,
        theme.button["border-x"],
        theme.button["border-y"],
        width - theme.button["border-x"] * 2,
        height - theme.button["border-y"] * 2
      );
      return context.game.make.sprite(0, 0, bmd);
    };
    var off = cutSprite(this.game.make.sprite(0, 0, "slick-ui-button_off"));
    var on = cutSprite(this.game.make.sprite(0, 0, "slick-ui-button_on"));
    return [off, on];
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.CheckboxRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.CheckboxRenderer.prototype.render = function(key) {
    var off = this.game.make.sprite(0, 0, "slick-ui-" + key + "_off");
    var on = this.game.make.sprite(0, 0, "slick-ui-" + key + "_on");
    return [off, on];
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.KeyRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.KeyRenderer.prototype.render = function(width, height) {
    var graphicsUp = this.game.make.graphics(0, 0);
    graphicsUp.beginFill(13619151);
    graphicsUp.drawRoundedRect(0, 0, width, height, 5);
    graphicsUp.beginFill(16777215);
    graphicsUp.drawRoundedRect(1, 1, width - 2, height - 2, 5);
    var graphicsDown = this.game.make.graphics(0, 0);
    graphicsDown.beginFill(1542840);
    graphicsDown.drawRoundedRect(0, 0, width, height, 5);
    graphicsDown.beginFill(2074593);
    graphicsDown.drawRoundedRect(1, 1, width - 2, height - 2, 5);
    var keyUp = this.game.make.sprite(0, 0, graphicsUp.generateTexture());
    var keyDown = this.game.make.sprite(0, 0, graphicsDown.generateTexture());
    return [keyUp, keyDown];
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.KeyboardRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.KeyboardRenderer.prototype.render = function(height) {
    var bmd = this.game.make.bitmapData(this.game.width, height);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, this.game.width, height);
    bmd.ctx.fillStyle = "#cccccc";
    bmd.ctx.fill();
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 2, this.game.width, height - 2);
    bmd.ctx.fillStyle = "#f0f0f0";
    bmd.ctx.fill();
    return this.game.make.sprite(0, 0, bmd);
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.PanelRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.PanelRenderer.prototype.render = function(width, height) {
    var theme = this.game.cache.getJSON("slick-ui-theme");
    var bmd = this.game.add.bitmapData(this.game.width, this.game.height);
    var panel = this.game.make.sprite(0, 0, "slick-ui-panel");
    bmd.copyRect(
      panel,
      new Phaser.Rectangle(0, 0, theme.panel["border-x"], theme.panel["border-y"])
    );
    bmd.copy(
      panel,
      theme.panel["border-x"] + 1,
      0,
      1,
      theme.panel["border-y"],
      theme.panel["border-x"],
      0,
      width - theme.panel["border-x"] * 2,
      theme.panel["border-y"]
    );
    bmd.copyRect(
      panel,
      new Phaser.Rectangle(
        panel.width - theme.panel["border-x"],
        0,
        theme.panel["border-x"],
        theme.panel["border-y"]
      ),
      width - theme.panel["border-x"]
    );
    bmd.copy(
      panel,
      0,
      theme.panel["border-y"] + 1,
      theme.panel["border-x"],
      1,
      0,
      theme.panel["border-y"],
      theme.panel["border-x"],
      height - theme.panel["border-y"] * 2
    );
    bmd.copy(
      panel,
      panel.width - theme.panel["border-x"],
      theme.panel["border-y"] + 1,
      theme.panel["border-x"],
      1,
      width - theme.panel["border-x"],
      theme.panel["border-y"],
      theme.panel["border-x"],
      height - theme.panel["border-y"] * 2
    );
    bmd.copyRect(
      panel,
      new Phaser.Rectangle(
        0,
        panel.height - theme.panel["border-y"],
        theme.panel["border-x"],
        theme.panel["border-y"]
      ),
      0,
      height - theme.panel["border-y"]
    );
    bmd.copyRect(
      panel,
      new Phaser.Rectangle(
        panel.width - theme.panel["border-x"],
        panel.height - theme.panel["border-y"],
        theme.panel["border-x"],
        theme.panel["border-y"]
      ),
      width - theme.panel["border-x"],
      height - theme.panel["border-y"]
    );
    bmd.copy(
      panel,
      theme.panel["border-x"] + 1,
      panel.height - theme.panel["border-y"],
      1,
      theme.panel["border-y"],
      theme.panel["border-x"],
      height - theme.panel["border-y"],
      width - theme.panel["border-x"] * 2,
      theme.panel["border-y"]
    );
    bmd.copy(
      panel,
      theme.panel["border-x"],
      theme.panel["border-y"],
      1,
      1,
      theme.panel["border-x"],
      theme.panel["border-y"],
      width - theme.panel["border-x"] * 2,
      height - theme.panel["border-y"] * 2
    );
    return this.game.make.sprite(0, 0, bmd);
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.SliderRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.SliderRenderer.prototype.render = function(size, vertical) {
    var theme = this.game.cache.getJSON("slick-ui-theme");
    var sprite_base = this.game.make.sprite(0, 0, "slick-ui-slider_base");
    var sprite_end = this.game.make.sprite(0, 0, "slick-ui-slider_end");
    var bmd = this.game.add.bitmapData(size, sprite_end.height);
    bmd.copy(
      sprite_base,
      0,
      0,
      1,
      sprite_base.height,
      0,
      Math.round(sprite_end.height / 4),
      size,
      sprite_base.height
    );
    bmd.copy(
      sprite_end,
      0,
      0,
      sprite_end.width,
      sprite_end.height,
      0,
      0,
      sprite_end.width,
      sprite_end.height
    );
    bmd.copy(
      sprite_end,
      0,
      0,
      sprite_end.width,
      sprite_end.height,
      size - sprite_end.width,
      0,
      sprite_end.width,
      sprite_end.height
    );
    var handle_off = this.game.make.sprite(0, 0, "slick-ui-slider_handle_off");
    var handle_on = this.game.make.sprite(0, 0, "slick-ui-slider_handle_on");
    sprite_base = this.game.make.sprite(0, 0, bmd);
    if (vertical) {
      sprite_base.angle = 90;
    }
    return [sprite_base, handle_off, handle_on];
  };

  SlickUI.namespace("Element.Renderer");

  SlickUI.Element.Renderer.TextFieldRenderer = function(game) {
    this.game = game;
  };

  SlickUI.Element.Renderer.TextFieldRenderer.prototype.render = function(width, height) {
    var theme = this.game.cache.getJSON("slick-ui-theme");
    var bmd = this.game.add.bitmapData(width, height);
    var textField = this.game.make.sprite(0, 0, "slick-ui-text_field");
    bmd.copyRect(
      textField,
      new Phaser.Rectangle(0, 0, theme.text_field["border-x"], theme.text_field["border-y"])
    );
    bmd.copy(
      textField,
      theme.text_field["border-x"] + 1,
      0,
      1,
      theme.text_field["border-y"],
      theme.text_field["border-x"],
      0,
      width - theme.text_field["border-x"] * 2,
      theme.text_field["border-y"]
    );
    bmd.copyRect(
      textField,
      new Phaser.Rectangle(
        textField.width - theme.text_field["border-x"],
        0,
        theme.text_field["border-x"],
        theme.text_field["border-y"]
      ),
      width - theme.text_field["border-x"]
    );
    bmd.copy(
      textField,
      0,
      theme.text_field["border-y"] + 1,
      theme.text_field["border-x"],
      1,
      0,
      theme.text_field["border-y"],
      theme.text_field["border-x"],
      height - theme.text_field["border-y"] * 2
    );
    bmd.copy(
      textField,
      textField.width - theme.text_field["border-x"],
      theme.text_field["border-y"] + 1,
      theme.text_field["border-x"],
      1,
      width - theme.text_field["border-x"],
      theme.text_field["border-y"],
      theme.text_field["border-x"],
      height - theme.text_field["border-y"] * 2
    );
    bmd.copyRect(
      textField,
      new Phaser.Rectangle(
        0,
        textField.height - theme.text_field["border-y"],
        theme.text_field["border-x"],
        theme.text_field["border-y"]
      ),
      0,
      height - theme.text_field["border-y"]
    );
    bmd.copyRect(
      textField,
      new Phaser.Rectangle(
        textField.width - theme.text_field["border-x"],
        textField.height - theme.text_field["border-y"],
        theme.text_field["border-x"],
        theme.text_field["border-y"]
      ),
      width - theme.text_field["border-x"],
      height - theme.text_field["border-y"]
    );
    bmd.copy(
      textField,
      theme.text_field["border-x"] + 1,
      textField.height - theme.text_field["border-y"],
      1,
      theme.text_field["border-y"],
      theme.text_field["border-x"],
      height - theme.text_field["border-y"],
      width - theme.text_field["border-x"] * 2,
      theme.text_field["border-y"]
    );
    bmd.copy(
      textField,
      theme.text_field["border-x"],
      theme.text_field["border-y"],
      1,
      1,
      theme.text_field["border-x"],
      theme.text_field["border-y"],
      width - theme.text_field["border-x"] * 2,
      height - theme.text_field["border-y"] * 2
    );
    return this.game.make.sprite(0, 0, bmd);
  };

  SlickUI.namespace("Element");

  SlickUI.Element.Slider = function(x, y, size, value, vertical) {
    this._x = x;
    this._y = y;
    this._size = size;
    this._value = value;
    this._vertical = true === vertical;
    this.container = null;
    if (typeof value == "undefined") {
      this._value = 1;
    }
    if (this._vertical) {
      this._value = Math.abs(this._value - 1);
    }
  };

  SlickUI.Element.Slider.prototype.setContainer = function(container) {
    this.container = container;
  };

  SlickUI.Element.Slider.prototype.init = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    this.onDragStart = new Phaser.Signal();
    this.onDrag = new Phaser.Signal();
    this.onDragStop = new Phaser.Signal();
    this.displayGroup = this.container.root.game.add.group();
    var x = this.container.x + this._x;
    var y = this.container.y + this._y;
    var position = this._vertical ? y : x;
    var modulatingVariable = this._vertical ? "y" : "x";
    var size = Math.min(this.container.width - this._x, this._size);
    if (this._vertical) {
      size = Math.min(this.container.height - this._y, this._size);
    }
    var initialPosition = Math.min(1, Math.max(0, this._value)) * size + position;
    var renderedSprites = this.container.root.getRenderer("slider").render(size, this._vertical);
    var sprite_base = renderedSprites[0];
    var handle_off = renderedSprites[1];
    var handle_on = renderedSprites[2];
    sprite_base.x = x;
    sprite_base.y = y;
    var sprite_handle = this.container.root.game.make.sprite(
      this._vertical ? x : initialPosition,
      this._vertical ? initialPosition : y,
      handle_off.texture
    );
    sprite_handle.anchor.setTo(0.5);
    if (this._vertical) {
      sprite_handle.angle = 270;
    }
    sprite_base.fixedToCamera = true;
    sprite_handle.fixedToCamera = true;
    sprite_handle.inputEnabled = true;
    sprite_handle.input.useHandCursor = true;
    var dragging = false;
    var getValue = function() {
      var value = (sprite_handle.cameraOffset[modulatingVariable] - position) / size;
      if (this._vertical) {
        value = Math.abs(value - 1);
      }
      return value;
    };
    sprite_handle.events.onInputDown.add(function() {
      sprite_handle.loadTexture(handle_on.texture);
      dragging = true;
      this.onDragStart.dispatch(getValue.apply(this));
    }, this);
    sprite_handle.events.onInputUp.add(function() {
      sprite_handle.loadTexture(handle_off.texture);
      dragging = false;
      this.onDragStop.dispatch(getValue.apply(this));
    }, this);
    this.container.root.game.input.addMoveCallback(function(pointer, pointer_x, pointer_y) {
      if (!dragging) {
        return;
      }
      var _pos = (this._vertical ? pointer_y : pointer_x) - this.displayGroup[modulatingVariable];
      sprite_handle.cameraOffset[modulatingVariable] = Math.min(
        position + size,
        Math.max(position, _pos - this.container.displayGroup[modulatingVariable])
      );
      this.onDrag.dispatch(getValue.apply(this));
    }, this);
    this.displayGroup.add(sprite_base);
    this.displayGroup.add(sprite_handle);
    this.container.displayGroup.add(this.displayGroup);
  };

  Object.defineProperty(SlickUI.Element.Slider.prototype, "x", {
    get: function() {
      return this.displayGroup.x + this._x;
    },
    set: function(value) {
      this.displayGroup.x = value - this._x;
    }
  });

  Object.defineProperty(SlickUI.Element.Slider.prototype, "y", {
    get: function() {
      return this.displayGroup.y + this._y;
    },
    set: function(value) {
      this.displayGroup.y = value - this._y;
    }
  });

  Object.defineProperty(SlickUI.Element.Slider.prototype, "alpha", {
    get: function() {
      return this.displayGroup.alpha;
    },
    set: function(value) {
      this.displayGroup.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Slider.prototype, "visible", {
    get: function() {
      return this.displayGroup.visible;
    },
    set: function(value) {
      this.displayGroup.visible = value;
    }
  });

  SlickUI.namespace("Element");

  SlickUI.Element.Text = function(x, y, value, size, font, width, height) {
    this._x = x;
    this._y = y;
    this._value = value;
    this.width = width;
    this.height = height;
    this.font = font;
    this.size = size;
    this.container = null;
  };

  SlickUI.Element.Text.prototype.setContainer = function(container) {
    this.container = container;
    if (typeof this.width == "undefined") {
      this.width = this.container.root.game.width;
    }
    if (typeof this.height == "undefined") {
      this.height = this.container.root.game.height;
    }
    if (typeof this.size == "undefined") {
      this.size = 16;
    }
  };

  SlickUI.Element.Text.prototype.reset = function(x, y, recalculateWidth) {
    var width, height;
    width = Math.min(this.container.width - x, this.width);
    height = Math.min(this.container.height - y, this.height);
    if (typeof this.text != "undefined") {
      if (recalculateWidth === false) {
        width = this.text.maxWidth;
        height = this.text.maxHeight;
      }
      this.text.destroy();
    }
    x += this.container.x;
    y += this.container.y;
    this.text = this.container.root.game.make.bitmapText(x, y, this.font, this._value, this.size);
    this.text.maxWidth = width;
    this.text.maxHeight = height;
    this.container.displayGroup.add(this.text);
    this.text.fixedToCamera = true;
  };

  SlickUI.Element.Text.prototype.init = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    if (typeof this.font == "undefined") {
      this.font = Object.keys(theme.fonts)[Object.keys(theme.fonts).length - 1];
    }
    this.reset(this._x, this._y);
  };

  SlickUI.Element.Text.prototype.centerHorizontally = function() {
    this.text.cameraOffset.x = this.text.maxWidth / 2 - this.text.width / 2 + this.container.x;
    return this;
  };

  SlickUI.Element.Text.prototype.centerVertically = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    this.text.cameraOffset.y =
      this.container.height / 2 -
      this.text.height / 2 -
      Math.round(theme.button["border-y"] / 2) +
      this.container.y;
    return this;
  };

  SlickUI.Element.Text.prototype.center = function() {
    this.centerHorizontally();
    this.centerVertically();
    return this;
  };

  Object.defineProperty(SlickUI.Element.Text.prototype, "x", {
    get: function() {
      return this.text.cameraOffset.x - this.container.x;
    },
    set: function(value) {
      this.text.cameraOffset.x = value + this.container.x;
    }
  });

  Object.defineProperty(SlickUI.Element.Text.prototype, "y", {
    get: function() {
      return this.text.cameraOffset.y - this.container.y;
    },
    set: function(value) {
      this.text.cameraOffset.y = value + this.container.y;
    }
  });

  Object.defineProperty(SlickUI.Element.Text.prototype, "alpha", {
    get: function() {
      return this.text.alpha;
    },
    set: function(value) {
      this.text.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Text.prototype, "visible", {
    get: function() {
      return this.text.visible;
    },
    set: function(value) {
      this.text.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.Text.prototype, "value", {
    get: function() {
      return this.text.text;
    },
    set: function(value) {
      this.text.text = value;
    }
  });

  SlickUI.namespace("Element");

  SlickUI.Element.TextField = function(x, y, width, height, maxChars) {
    if (typeof maxChars == "undefined") {
      maxChars = 7;
    }
    this._x = x;
    this._y = y;
    this._offsetX = x;
    this._offsetY = y;
    this._width = width;
    this._height = height;
    this.maxChars = maxChars;
    this.container = null;
    this.value = "";
    this.events = {
      onOK: new Phaser.Signal(),
      onToggle: new Phaser.Signal(),
      onKeyPress: new Phaser.Signal()
    };
  };

  SlickUI.Element.TextField.prototype.setContainer = function(container) {
    this.container = new SlickUI.Container.Container(container);
  };

  SlickUI.Element.TextField.prototype.init = function() {
    var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
    var x = (this.container.x = this.container.parent.x + this._x);
    var y = (this.container.y = this.container.parent.y + this._y);
    var width = (this.container.width = Math.min(
      this.container.parent.width - this._x,
      this._width
    ));
    var height = (this.container.height = Math.min(
      this.container.parent.height - this._y,
      this._height
    ));
    this.container.x += Math.round(theme.text_field["border-x"] / 2);
    this.container.y += Math.round(theme.text_field["border-y"] / 2);
    this.container.width -= theme.text_field["border-x"];
    this.container.height -= theme.text_field["border-y"];
    this.sprite = this.container.root.game.make.sprite(
      x,
      y,
      this.container.root.getRenderer("text_field").render(width, height).texture
    );
    this.sprite.inputEnabled = true;
    this.sprite.input.useHandCursor = true;
    this.container.displayGroup.add(this.sprite);
    this.sprite.x = x;
    this.sprite.y = y;
    this._offsetX = x;
    this._offsetY = y;
    this.sprite.fixedToCamera = true;
    var hover = false;
    this.sprite.events.onInputOver.add(function() {
      hover = true;
    }, this);
    this.sprite.events.onInputOut.add(function() {
      hover = false;
    }, this);
    var kb = new SlickUI.Keyboard.Keyboard(
      this.container.root,
      Object.keys(theme.fonts)[Object.keys(theme.fonts).length - 1]
    );
    kb.group.cameraOffset.y = this.container.root.game.height;
    kb.group.visible = false;
    var kbAnimating = false;
    this.sprite.events.onInputDown.add(function() {
      if (kbAnimating) {
        return;
      }
      kbAnimating = true;
      if (!kb.group.visible) {
        kb.group.visible = true;
        this.container.root.game.add
          .tween(kb.group.cameraOffset)
          .to(
            {
              y: this.container.root.game.height - kb.height
            },
            500,
            Phaser.Easing.Exponential.Out,
            true
          )
          .onComplete.add(function() {
            kbAnimating = false;
          });
        this.events.onToggle.dispatch(true);
      } else {
        this.container.root.game.add
          .tween(kb.group.cameraOffset)
          .to(
            {
              y: this.container.root.game.height
            },
            500,
            Phaser.Easing.Exponential.Out,
            true
          )
          .onComplete.add(function() {
            kbAnimating = false;
            kb.group.visible = false;
          });
        this.events.onToggle.dispatch(false);
      }
    }, this);
    this.text = this.add(new SlickUI.Element.Text(8, 0, "A"));
    this.text.centerVertically();
    this.text.text.text = this.value;
    kb.events.onKeyPress.add(function(key) {
      if (key == "DEL") {
        this.value = this.value.substr(0, this.value.length - 1);
      } else {
        this.value = (this.value + key).substr(0, this.maxChars);
      }
      this.text.text.text = this.value;
      this.events.onKeyPress.dispatch(key);
    }, this);
    kb.events.onOK.add(function() {
      this.sprite.events.onInputDown.dispatch();
      this.events.onOK.dispatch();
    }, this);
  };

  SlickUI.Element.TextField.prototype.add = function(element) {
    return this.container.add(element);
  };

  Object.defineProperty(SlickUI.Element.TextField.prototype, "x", {
    get: function() {
      return this._x - this.container.parent.x;
    },
    set: function(value) {
      this._x = value;
      this.container.displayGroup.x = this.container.parent.x + value - this._offsetX;
    }
  });

  Object.defineProperty(SlickUI.Element.TextField.prototype, "y", {
    get: function() {
      return this._y - this.container.parent.y;
    },
    set: function(value) {
      this._y = value;
      this.container.displayGroup.y = this.container.parent.y + value - this._offsetY;
    }
  });

  Object.defineProperty(SlickUI.Element.TextField.prototype, "visible", {
    get: function() {
      return this.container.displayGroup.visible;
    },
    set: function(value) {
      this.container.displayGroup.visible = value;
    }
  });

  Object.defineProperty(SlickUI.Element.TextField.prototype, "alpha", {
    get: function() {
      return this.container.displayGroup.alpha;
    },
    set: function(value) {
      this.container.displayGroup.alpha = value;
    }
  });

  Object.defineProperty(SlickUI.Element.TextField.prototype, "width", {
    get: function() {
      return this.container.width;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._width = Math.round(value + theme.text_field["border-x"]);
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  Object.defineProperty(SlickUI.Element.TextField.prototype, "height", {
    get: function() {
      return this.container.height;
    },
    set: function(value) {
      var theme = this.container.root.game.cache.getJSON("slick-ui-theme");
      this._height = Math.round(value + theme.text_field["border-y"]);
      this.sprite.destroy();
      this.init();
      this.container.displayGroup.sendToBack(this.sprite);
    }
  });

  SlickUI.namespace("Keyboard");

  SlickUI.Keyboard.Key = function(plugin, x, y, width, height, font, fontSize, text) {
    this.group = plugin.game.add.group();
    this.font = font;
    this._x = x;
    this._y = y;
    this.plugin = plugin;
    this._width = width;
    this._height = height;
    this.fontSize = fontSize;
    this.text = text;
  };

  SlickUI.Keyboard.Key.prototype.init = function() {
    var sprites = this.plugin.getRenderer("key").render(this._width, this._height);
    var keyUp = sprites[0];
    var keyDown = sprites[1];
    var base = this.plugin.game.make.sprite(this._x, this._y, keyUp.texture);
    var hover = false;
    base.inputEnabled = true;
    base.input.useHandCursor = true;
    base.events.onInputDown.add(function() {
      base.loadTexture(keyDown.texture);
    });
    base.events.onInputUp.add(function() {
      base.loadTexture(keyUp.texture);
      if (!hover) {
        base.events.onInputUp.halt();
      }
    });
    base.events.onInputOver.add(function() {
      hover = true;
    }, this);
    base.events.onInputOut.add(function() {
      hover = false;
    }, this);
    var text = this.plugin.game.make.bitmapText(
      this._x,
      this._y,
      this.font,
      this.text,
      this.fontSize
    );
    text.x += this._width / 2 - text.width / 2;
    text.y += this._height / 2 - this.fontSize / 2 - 4;
    this.group.add(base);
    this.group.add(text);
    this.events = base.events;
  };

  SlickUI.namespace("Keyboard");

  SlickUI.Keyboard.Keyboard = function(plugin, font, fontSize, initialize) {
    this.group = plugin.game.add.group();
    this.keyGroupLower = plugin.game.make.group();
    this.keyGroupUpper = plugin.game.make.group();
    this.keyGroupCurrent = this.keyGroupLower;
    this.keyGroupUpper.visible = false;
    this.group.fixedToCamera = true;
    this.font = font;
    this.plugin = plugin;
    this.fontSize = fontSize;
    this.height = 160;
    this.events = {
      onKeyPress: new Phaser.Signal(),
      onOK: new Phaser.Signal()
    };
    if (typeof fontSize == "undefined") {
      this.fontSize = 16;
    }
    if (false !== initialize) {
      this.create();
    }
  };

  SlickUI.Keyboard.Keyboard.prototype.create = function() {
    var base = this.plugin.getRenderer("keyboard").render(this.height);
    this.group.add(base);
    this.group.add(this.keyGroupLower);
    this.group.add(this.keyGroupUpper);
    var keyboardWidth = 440;
    var offsetX = Math.round(this.plugin.game.width / 2 - keyboardWidth / 2);
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 16, 32, 32, this.font, this.fontSize, "1"),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 36,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "2"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 72,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "3"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "4"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "5"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "6"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "7"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "8"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "9"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        16,
        32,
        32,
        this.font,
        this.fontSize,
        "0"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 360,
        16,
        64,
        32,
        this.font,
        this.fontSize,
        "DEL"
      ),
      this.group
    );
    offsetX += 16;
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 52, 32, 32, this.font, this.fontSize, "q")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 36, 52, 32, 32, this.font, this.fontSize, "w")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 72, 52, 32, 32, this.font, this.fontSize, "e")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "r"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "t"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "y"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "u"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "i"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "o"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "p"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 360,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "!"
      ),
      this.group
    );
    offsetX += 16;
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 88, 32, 32, this.font, this.fontSize, "a")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 36, 88, 32, 32, this.font, this.fontSize, "s")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 72, 88, 32, 32, this.font, this.fontSize, "d")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "f"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "g"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "h"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "j"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "k"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "l"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        88,
        80,
        32,
        this.font,
        this.fontSize,
        "UPPER"
      )
    );
    offsetX += 16;
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX - 40,
        124,
        36,
        32,
        this.font,
        this.fontSize,
        "OK"
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 124, 32, 32, this.font, this.fontSize, "z")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 36,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "x"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 72,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "c"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "v"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "b"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "n"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "m"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        ","
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "."
      ),
      this.group
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        " "
      ),
      this.group
    );
    offsetX -= 32;
    this.keyGroupCurrent = this.keyGroupUpper;
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 52, 32, 32, this.font, this.fontSize, "Q")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 36, 52, 32, 32, this.font, this.fontSize, "W")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 72, 52, 32, 32, this.font, this.fontSize, "E")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "R"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "T"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "Y"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "U"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "I"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "O"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        52,
        32,
        32,
        this.font,
        this.fontSize,
        "P"
      )
    );
    offsetX += 16;
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 88, 32, 32, this.font, this.fontSize, "A")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 36, 88, 32, 32, this.font, this.fontSize, "S")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX + 72, 88, 32, 32, this.font, this.fontSize, "D")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "F"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "G"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "H"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "J"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 252,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "K"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 288,
        88,
        32,
        32,
        this.font,
        this.fontSize,
        "L"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 324,
        88,
        80,
        32,
        this.font,
        this.fontSize,
        "lower"
      )
    );
    offsetX += 16;
    this.addKey(
      new SlickUI.Keyboard.Key(this.plugin, offsetX, 124, 32, 32, this.font, this.fontSize, "Z")
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 36,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "X"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 72,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "C"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 108,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "V"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 144,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "B"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 180,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "N"
      )
    );
    this.addKey(
      new SlickUI.Keyboard.Key(
        this.plugin,
        offsetX + 216,
        124,
        32,
        32,
        this.font,
        this.fontSize,
        "M"
      )
    );
  };

  SlickUI.Keyboard.Keyboard.prototype.addKey = function(key, group) {
    key.init();
    if (typeof group == "undefined") {
      group = this.keyGroupCurrent;
    }
    group.add(key.group);
    key.events.onInputUp.add(function() {
      if (key.text == "UPPER" || key.text == "lower") {
        this.toggleMode();
        return;
      }
      if (key.text == "OK") {
        this.events.onOK.dispatch();
        return;
      }
      this.events.onKeyPress.dispatch(key.text);
    }, this);
  };

  SlickUI.Keyboard.Keyboard.prototype.toggleMode = function() {
    this.keyGroupUpper.visible = !this.keyGroupUpper.visible;
    this.keyGroupLower.visible = !this.keyGroupLower.visible;
  };
})();
