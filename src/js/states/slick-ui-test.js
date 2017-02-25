/**
 * UI Test State
 */

module.exports = SlickTestUI;

function SlickTestUI() {}

SlickTestUI.prototype.create = function () {
    // Shorthands
    var game = this.game;
    var globals = game.globals;

    // NOTE(rex): Testing the Slick UI...
    var panel;
    var slickUI = globals.plugins.slickUI;
    var SlickUI = globals.plugins.SlickUI;
    game.add.sprite(0,-125,'backdrop');
    var panel;
    slickUI.add(panel = new SlickUI.Element.Panel(8, 8, game.width - 16, game.height - 16));
    panel.add(new SlickUI.Element.Text(10,10, "Text input")).centerHorizontally().text.alpha = 0.5;
    panel.add(new SlickUI.Element.Text(12,34, "Your name"));
    var textField = panel.add(new SlickUI.Element.TextField(10,58, panel.width - 20, 40));
    textField.events.onOK.add(function () {
        alert('Your name is: ' + textField.value);
    });
    textField.events.onToggle.add(function (open) {
        console.log('You just ' + (open ? 'opened' : 'closed') + ' the virtual keyboard');
    });
    textField.events.onKeyPress.add(function(key) {
        console.log('You pressed: ' + key);
    });
};