(function(){

var Counter = this.Counter = new Class({

	Implements: [Options, Events],

	options: {
		interval: 500,
		speed: 500,
		unitClass: 'value',
		letterSpacing: 0,
		transition: 'quart:in:out',
		autostart: true
	},

	// Includes commas - used for repositioning
	elements: [],
	// Number values only, used for incremental stuff
	values: [],

	running: true,
	animating: false,

	initialize: function(element, options){
		this.element = document.id(element);
		if (!this.element) return;

		this.options.textAlign = (this.element.getStyle('text-align') === 'auto') ? 'left' : this.element.getStyle('text-align');
		this.options.letterSpacing = (this.element.getStyle('letter-spacing') === 'normal') ? 0 : this.element.getStyle('letter-spacing');
		this.setOptions(options);

		if (this.element.getStyle('position') === 'static') this.element.setStyle('position', 'relative');
		if (!this.options.autostart) this.running = false;

		this.setupElements();

		return this;
	},

	setupElements: function(addBlank){
		this.elements = [];
		this.values = [];

		var display = this.element.get('text'),
			fn = function(str, i){
				var el = new Element('span', {
					'class': this.options.unitClass,
					text: str
				}).inject(this.element);

				if (i === 0 && str === 0)
					el.setStyle('opacity', 0);

				if (str === ' ') el.set('html', '&nbsp;');
				else el.set('text', str);

				this.elements.push(el);
				if (str === ',') return;
				this.values.push(el);
			};

		this.element.empty();
		this.value = Counter.getValue(display);

		display = display.split('');
		if (addBlank && display.length % 4 === 3) display.splice(0,0,',');
		if (addBlank) display.splice(0, 0, 0);
		display.each(fn, this);

		this.values = new Elements(this.values);
		this.elements = new Elements(this.elements);

		this.positionElements();
		if (addBlank) return;
		if (this.running) this.iterateValues.delay(this.options.interval, this);
	},

	positionElements: function(){
		var pos, els = Array.clone(this.elements);
		if (this.options.textAlign === 'right') {
			els.reverse();
			pos = 0;
		} else if (this.options.textAlign === 'center') var center = pos = (this.element.getSize().x / 2);
		else pos = 0;

		els.each(function(el, i){
			el.setStyles({
				position: 'absolute',
				display: 'block',
				top: 0
			});

			if (this.options.textAlign === 'right') {
				el.setStyle('right', pos);
				pos += el.getSize().x;
			} else {
				el.setStyle('left', pos);
				pos += el.getSize().x;
			}
		}, this);

		this.element.setStyle('height', this.elements[0].getStyle('height'));

		if (this.options.textAlign === 'center') {
			var offset = (pos - center) / 2;
			els.each(function(el){
				var newLeft = parseInt(el.getStyle('left'), 10) - offset;
				el.setStyle('left', newLeft);
			}, this);
		}
	},

	iterateValues: function(){
		if (!this.running || this.animating) return;
		this.animating = true;
		this.value++;

		var value = (this.value + '').split(''),
			display = (Counter.getValue(this.element.get('text')) + '').split(''),
			animCount = 0, animObj = {}, animEls = [], stop = false,
			fn = function(val, i){
				if (stop) return;

				if (val == display[i]) return stop = true;

				var height = (this.values[this.values.length - 1 - i].getSize().y) / 1.5,
					left = this.values[this.values.length - 1 - i].getPosition(this.element).x;

				var el = new Element('span', {
					'class': this.options.unitClass,
					text: val,
					styles: {
						position: 'absolute',
						display: 'block',
						opacity: 0,
						top: height,
						left: left
					}
				}).inject(this.values[this.values.length - 1 - i], 'after');

				animEls.push(this.values[this.values.length - 1 - i]);
				animEls.push(el);

				animObj[animCount] = {
					opacity: 0,
					top: -(height)
				};
				animCount++;
				animObj[animCount] = {
					opacity: 1,
					top: 0
				};
				animCount++;
			};

		if (value.length !== display.length)
			this.setupElements(true);

		value.reverse();
		display.reverse();

		value.each(fn, this);

		new Fx.Elements(animEls, {
			duration: this.options.speed,
			fps: 1000,
			transition: this.options.transition,
			onComplete: this.iterateComplete.bind(this, [animEls])
		}).start(animObj);

		this.fireEvent('iterateStart', this.value);
	},

	iterateComplete: function(animEls){
		var toAdd = [],
			clean = function(el, i){
				if (i % 2 === 1) return toAdd.push(el);
				el.destroy();
			},
			insert = function(el, i){
				var index = this.values.length - 1 - i;
				this.values[index] = el;
			};

		animEls.each(clean, this);
		toAdd.each(insert, this);

		this.fireEvent('iterateFinish', this.value);
		this.animating = false;
		if (this.running) this.iterateValues.delay(this.options.interval, this);
	},

	start: function(){
		if (this.running) return;
		this.running = true;
		this.fireEvent('start', this.value);
		if (!this.animating) this.iterateValues();
		return this;
	},

	stop: function(){
		if (!this.running) return;
		this.running = false;
		this.fireEvent('stop', this.value);
		return this;
	}
});

Counter.extend('getValue', function(str){
	str = str.replace(/,/g, '');
	return parseInt(str, 10);
});

})();