(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  (function($, window) {
    var Slider;
    Slider = (function() {
      Slider.prototype.iScroll = null;

      Slider.prototype.numberOfSlides = null;

      Slider.prototype.currentSlide = 0;

      Slider.prototype.interval = null;

      Slider.prototype.$slider = null;

      Slider.prototype.$slideContainer = null;

      Slider.prototype.$slides = null;

      Slider.prototype.$sliderNavigation = null;

      Slider.prototype.$sliderListeners = null;

      Slider.prototype.$slidesInContainer = null;

      Slider.prototype.defaults = {
        autoscroll: true,
        speed: 500,
        interval: 5000,
        debug: true,
        snap: true,
        disabled: false,
        navigation: ['index'],
        indexNavigationTemplate: _.template('<ul class="sliderNavigation"> <% _.each(slides, function(element,index){ %> <% if(!carousel || (index>=carousel && (index+1)<=slides.length-carousel)){ %> <li data-item_index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li> <% } %> <% }); %> </ul>'),
        prevNextButtons: true,
        prevNextButtonsTemplate: _.template('<span class="prev fa fa-angle-left"></span> <span class="next fa fa-angle-right"></span>'),
        slideContainerSelector: '.slideContainer',
        slideSelector: 'ul.slides > li',
        inactiveSlideOpacity: null,
        slideMargin: 0,
        slideWidth: 'auto',
        carousel: 0,
        onSlideClick: function(event) {},
        onNextClick: function(event) {},
        onPrevClick: function(event) {}
      };

      Slider.prototype.debugTemplate = _.template('<div class="debug"> <span>Slider: <%= slider_index %></span> <span># of slides: <%= number_of_slides %></span> <span>Current slide: <%= current_slide %></span> <span>Autoscroll: <%= autoscroll %></span> <span># of navigations: <%= number_of_navigations %></span> <span>Slider width: <%= slider_width %></span> </div>');

      function Slider(el, options, index) {
        var self;
        if (index == null) {
          index = null;
        }
        this.debug = bind(this.debug, this);
        this.stopAutoScroll = bind(this.stopAutoScroll, this);
        this.startAutoScroll = bind(this.startAutoScroll, this);
        this.goToSlide = bind(this.goToSlide, this);
        this.prevSlide = bind(this.prevSlide, this);
        this.nextSlide = bind(this.nextSlide, this);
        this.resize = bind(this.resize, this);
        this.onBeforeScrollStart = bind(this.onBeforeScrollStart, this);
        this.onScrollEnd = bind(this.onScrollEnd, this);
        self = this;
        this.options = $.extend({}, this.defaults, options);
        this.$slider = $(el);
        this.$slider.data('index', index);
        this.$slider.addClass('slider_' + index);
        this.$sliderNavigation = [];
        this.$sliderListeners = [];
        this.$slidesInContainer = null;
        this.options.onSlideClick = function(event) {
          return self.goToSlide($(event.currentTarget).index());
        };
        this.$slideContainer = this.$slider.find(this.options.slideContainerSelector);
        this.refreshSlides();
        if (this.options.carousel) {
          this.addCarouselSlides();
          this.refreshSlides();
          this.currentSlide = this.options.carousel;
        }
        this.enableSlides();
        this.iScroll = new IScroll(el, {
          scrollX: true,
          scrollY: false,
          snap: this.options.snap,
          snapSpeed: 400,
          tap: true,
          momentum: false,
          eventPassthrough: true,
          preventDefault: false,
          onBeforeScrollStart: function(e) {
            var point, pointStartX, pointStartY;
            point = e.touches[0];
            pointStartX = point.pageX;
            pointStartY = point.pageY;
            return null;
          },
          onBeforeScrollMove: function(e) {
            var deltaX, deltaY;
            deltaX = Math.abs(point.pageX - pointStartX);
            deltaY = Math.abs(point.pageY - pointStartY);
            if (deltaX >= deltaY) {
              return e.preventDefault();
            } else {
              return null;
            }
          }
        });
        if (this.options.autoscroll) {
          this.startAutoScroll();
        }
        if (this.options.prevNextButtons) {
          this.addPrevNextButtons();
        }
        if (_.size(this.options.navigation)) {
          this.renderNavigation();
        }
        this.resize();
        this.goToSlide(this.currentSlide, false);
        this.bindEvents();
        this.debug();
        this;
      }

      Slider.prototype.refreshSlides = function() {
        this.$slides = this.$slideContainer.find(this.options.slideSelector);
        return this.numberOfSlides = this.$slides.length;
      };

      Slider.prototype.enableSlides = function() {
        return this.$slides.css({
          display: 'block'
        });
      };

      Slider.prototype.addPrevNextButtons = function() {
        return this.$slider.append(this.options.prevNextButtonsTemplate());
      };

      Slider.prototype.renderNavigation = function() {
        var self;
        self = this;
        _.each(this.$sliderNavigation, function(element, index) {
          if (!element.data('Slider')) {
            return $(element).remove();
          }
        });
        _.each(this.options.navigation, (function(_this) {
          return function(element, index, list) {
            var navigationItems, newElement;
            if (element === 'index') {
              newElement = _this.options.indexNavigationTemplate({
                'slides': _this.$slides,
                'carousel': _this.options.carousel
              });
              _this.$sliderNavigation.push($(newElement));
              _this.$slider.append(_.last(_this.$sliderNavigation));
              return _.last(_this.$sliderNavigation).css({
                'margin-left': -(_.last(_this.$sliderNavigation).width() / 2)
              });
            } else if (element.data('Slider')) {
              return self.registerListener(element);
            } else if (element instanceof jQuery) {
              _this.$sliderNavigation.push(element);
              navigationItems = _.last(_this.$sliderNavigation).children();
              return _this.$slides.each(function(index, slide) {
                var item;
                item = navigationItems.eq(index);
                if (item) {
                  item.data('slider_index', _this.$slider.data('index'));
                  item.data('item_index', index + parseInt(self.options.carousel));
                  item.addClass('slider_navigationItem');
                  return item.on('click', function(event) {
                    self.stopAutoScroll();
                    return self.goToSlide($(this).data('item_index'));
                  });
                }
              });
            }
          };
        })(this));
        return this.updateNavigation();
      };

      Slider.prototype.registerListener = function(listener) {
        return this.$sliderListeners.push(listener);
      };

      Slider.prototype.updateNavigation = function() {
        var index, self;
        self = this;
        index = this.currentSlide;
        if (!this.options.disabled) {
          return _.each(this.$sliderNavigation, function(element) {
            if (element instanceof jQuery) {
              return $(element).find('.slider_navigationItem').removeClass('active').filter(function() {
                return $(this).data('item_index') === index;
              }).addClass('active');
            }
          });
        }
      };

      Slider.prototype.updateSlides = function(animate) {
        if (animate == null) {
          animate = true;
        }
        if (this.options.inactiveSlideOpacity && animate) {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity, true);
        } else {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity, false);
        }
        this.$slides.removeClass('active');
        return this.$slides.eq(this.currentSlide).addClass('active');
      };

      Slider.prototype.setSlideOpacity = function(active, inactive, animate) {
        if (animate == null) {
          animate = true;
        }
        if (animate) {
          this.$slides.stop().animate({
            opacity: inactive
          });
          return this.$slides.eq(this.currentSlide).stop().animate({
            opacity: active
          });
        } else {
          this.$slides.stop().css({
            opacity: inactive
          });
          return this.$slides.eq(this.currentSlide).stop().css({
            opacity: active
          });
        }
      };

      Slider.prototype.onScrollEnd = function() {
        var self;
        self = this;
        if (this.slidesInContainer > 1) {
          if (this.iScroll.currentPage.pageX < this.numberOfSlides - this.slidesInContainer) {
            this.currentSlide = this.iScroll.currentPage.pageX;
          }
        } else {
          this.currentSlide = this.iScroll.currentPage.pageX;
        }
        if (this.options.carousel) {
          if (this.currentSlide >= this.numberOfSlides - this.options.carousel) {
            this.goToSlide(this.options.carousel, false);
          } else if (this.currentSlide < this.options.carousel) {
            this.goToSlide(this.numberOfSlides - (this.options.carousel + 1), false);
          }
        }
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', self.currentSlide - self.options.carousel);
        });
        this.updateSlides();
        this.updateNavigation();
        return this.debug();
      };

      Slider.prototype.onBeforeScrollStart = function() {
        return this.stopAutoScroll();
      };

      Slider.prototype.resize = function() {
        var containerWidth, slideWidth;
        this.stopAutoScroll();
        if (this.options.slideWidth === 'auto') {
          this.$slides.width(this.$slider.outerWidth());
        } else {
          this.$slides.width(parseInt(this.options.slideWidth) + 'px');
        }
        slideWidth = this.$slides.outerWidth() + (this.options.slideMargin * 2);
        containerWidth = slideWidth * this.numberOfSlides;
        containerWidth -= this.options.slideMargin * 2;
        containerWidth += parseFloat(this.$slides.first().css('margin-left'));
        containerWidth += parseFloat(this.$slides.last().css('margin-right'));
        this.slidesInContainer = Math.ceil(this.$slider.width() / slideWidth);
        this.$slideContainer.width(containerWidth);
        this.$slideContainer.height(this.$slider.height());
        if (this.iScroll) {
          this.iScroll.refresh();
        }
        if (this.options.autoscroll) {
          return this.startAutoScroll();
        }
      };

      Slider.prototype.bindEvents = function() {
        var self;
        self = this;
        this.iScroll.on('scrollEnd', this.onScrollEnd);
        this.iScroll.on('beforeScrollStart', this.onBeforeScrollStart);
        this.$slides.on('tap', function(event) {
          self.stopAutoScroll();
          if (typeof self.options.onSlideClick === 'function') {
            return self.options.onSlideClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'span.next', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.nextSlide();
          if (typeof self.options.onNextClick === 'function') {
            return self.options.onNextClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'span.prev', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            return self.options.onPrevClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('click', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('item_index'));
        });
        return $(window).bind('resize', function() {
          return self.resize();

          /*
          if @resizeTo
            clearTimeout @resizeTimeout
          @resizeTimeout = setTimeout ->
          , 200
           */
        });
      };

      Slider.prototype.nextSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.numberOfSlides > (this.currentSlide + 1)) {
          nextSlideIndex = this.currentSlide + 1;
        } else {
          nextSlideIndex = 0;
        }
        return this.goToSlide(nextSlideIndex);
      };

      Slider.prototype.prevSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.currentSlide - 1 >= 0) {
          nextSlideIndex = this.currentSlide - 1;
        } else {
          nextSlideIndex = this.numberOfSlides - 1;
        }
        return this.goToSlide(nextSlideIndex);
      };

      Slider.prototype.goToSlide = function(index, animate) {
        var ref, ref1, self;
        if (animate == null) {
          animate = true;
        }
        self = this;
        if (animate) {
          if ((ref = this.iScroll) != null) {
            ref.goToPage(index, 0, this.options.speed);
          }
        } else {
          if ((ref1 = this.iScroll) != null) {
            ref1.goToPage(index, 0, 0);
          }
        }
        this.currentSlide = index;
        this.updateSlides(animate);
        this.updateNavigation();
        _.each(this.$sliderListeners, function(listener) {
          listener.Slider('stopAutoScroll');
          return listener.Slider('goToSlide', index - self.options.carousel);
        });
        return this.debug();
      };

      Slider.prototype.addCarouselSlides = function() {
        this.$startElements = this.$slides.slice(-this.options.carousel).clone();
        this.$endElements = this.$slides.slice(0, this.options.carousel).clone();
        this.$slides.parent().prepend(this.$startElements);
        return this.$slides.parent().append(this.$endElements);
      };

      Slider.prototype.startAutoScroll = function() {
        return this.interval = setInterval(this.nextSlide, this.options.interval);
      };

      Slider.prototype.stopAutoScroll = function() {
        clearInterval(this.interval);
        return this.interval = null;
      };

      Slider.prototype.debug = function() {
        var ref;
        if (this.options.debug) {
          this.$slider.find('.debug').remove();
          return this.$slider.append(this.debugTemplate({
            'slider_index': this.$slider.data('index'),
            'number_of_slides': this.numberOfSlides,
            'current_slide': (ref = this.iScroll.currentPage) != null ? ref.pageX : void 0,
            'autoscroll': this.interval ? 'enabled' : 'disabled',
            'number_of_navigations': this.$sliderNavigation.length,
            'slider_width': this.$slider.width()
          }));
        }
      };

      Slider.prototype.get = function(option) {
        console.log('option: ' + option + ' is ' + this.options[option]);
        return this.options[option];
      };

      Slider.prototype.set = function(option, value) {
        this.options[option] = value;
        if (option === 'autoscroll' && !this.interval) {
          this.startAutoScroll();
        }
        if (option === 'inactiveSlideOpacity' && this.options.inactiveSlideOpacity) {
          this.setSlideOpacity(1, this.options.inactiveSlideOpacity);
        }
        if (option === 'navigation') {
          this.renderNavigation();
        }
        return this.debug();
      };

      return Slider;

    })();
    return $.fn.extend({
      Slider: function() {
        var args, option;
        option = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return this.each(function(index) {
          var $this, data;
          $this = $(this);
          data = $this.data('Slider');
          if (!data) {
            $this.data('Slider', (data = new Slider(this, option, index)));
          }
          if (typeof option === 'string') {
            return data[option].apply(data, args);
          }
        });
      }
    });
  })(window.jQuery, window);

}).call(this);

//# sourceMappingURL=data:application/json;base64,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LENBQUEsSUFBRCxDQUFNLFNBQUMsS0FBRCxHQUFBO0FBQ0osY0FBQSxXQUFBO0FBQUEsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsVUFDQSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLENBRFAsQ0FBQTtBQUdBLFVBQUEsSUFBRyxDQUFBLElBQUg7QUFDRSxZQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxFQUFxQixDQUFDLElBQUEsR0FBVyxJQUFBLE1BQUEsQ0FBTyxJQUFQLEVBQVUsTUFBVixFQUFrQixLQUFsQixDQUFaLENBQXJCLENBQUEsQ0FERjtXQUhBO0FBTUEsVUFBQSxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBQ0UsbUJBQU8sSUFBSyxDQUFBLE1BQUEsQ0FBTyxDQUFDLEtBQWIsQ0FBbUIsSUFBbkIsRUFBeUIsSUFBekIsQ0FBUCxDQURGO1dBUEk7UUFBQSxDQUFOLEVBRmtCO01BQUEsQ0FBUjtLQUFaLEVBM2dCRDtFQUFBLENBQUQsQ0FBQSxDQXdoQkUsTUFBTSxDQUFDLE1BeGhCVCxFQXdoQmlCLE1BeGhCakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcbiAgICAkc2xpZGVyTmF2aWdhdGlvbjogbnVsbFxuICAgICRzbGlkZXJMaXN0ZW5lcnM6IG51bGxcbiAgICAkc2xpZGVzSW5Db250YWluZXI6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogdHJ1ZVxuICAgICAgc3BlZWQ6IDUwMFxuICAgICAgaW50ZXJ2YWw6IDUwMDBcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgICBzbmFwOiB0cnVlXG5cbiAgICAgICMgSW4gdGhpcyBzdGF0ZSwgdGhlIHNsaWRlciBpbnN0YW5jZSBzaG91bGQgbmV2ZXIgZm9yd2FyZCBldmVudHMgdG9cbiAgICAgICMgdGhlIGlTY3JvbGwgY29tcG9uZW50LCBlLmcuIHdoZW4gdGhlIHNsaWRlciBpcyBub3QgdmlzaWJsZSAoZGlzcGxheTpub25lKVxuICAgICAgIyBhbmQgdGhlcmVmb3JlIGlTY3JvbGwgY2FuJ3QgZ2V0L3Njcm9sbCB0aGUgc2xpZGUgZWxlbWVudHNcbiAgICAgIGRpc2FibGVkOiBmYWxzZVxuXG4gICAgICAjIE5hdmlnYXRpb24gZWxlbWVudCBhcnJheVxuICAgICAgIyBlaXRoZXIgJ2luZGV4JyBmb3Igb24tc2xpZGVyIG5hdmlnYXRpb24sIGEgalF1ZXJ5IHNlbGVjdG9yIGZvciBhIHRodW1ibmFpbFxuICAgICAgIyBuYXZpZ2F0aW9uIG9yIGFub3RoZXIgc2xpZGVyIGVsZW1lbnQgZm9yIGEgc2xpZGVyIGFjdGluZyBhcyBhIHN5bmNlZCByZW1vdGVcbiAgICAgICMgbmF2aWdhdGlvbiB0byB0aGlzIHNsaWRlciBpbnN0YW5jZVxuICAgICAgbmF2aWdhdGlvbjogWydpbmRleCddXG5cbiAgICAgICMgSW5kZXggbmF2aWdhdGlvbiBkZWZhdWx0IHRlbXBsYXRlXG4gICAgICBpbmRleE5hdmlnYXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPHVsIGNsYXNzPVwic2xpZGVyTmF2aWdhdGlvblwiPlxuICAgICAgICA8JSBfLmVhY2goc2xpZGVzLCBmdW5jdGlvbihlbGVtZW50LGluZGV4KXsgJT5cbiAgICAgICAgICA8JSBpZighY2Fyb3VzZWwgfHwgKGluZGV4Pj1jYXJvdXNlbCAmJiAoaW5kZXgrMSk8PXNsaWRlcy5sZW5ndGgtY2Fyb3VzZWwpKXsgJT5cbiAgICAgICAgICAgIDxsaSBkYXRhLWl0ZW1faW5kZXg9XCI8JT0gaW5kZXggJT5cIiBjbGFzcz1cInNsaWRlcl9uYXZpZ2F0aW9uSXRlbSBmYSBmYS1jaXJjbGUtb1wiPjwvbGk+XG4gICAgICAgICAgPCUgfSAlPlxuICAgICAgICA8JSB9KTsgJT5cbiAgICAgIDwvdWw+JylcblxuICAgICAgcHJldk5leHRCdXR0b25zOiB0cnVlXG4gICAgICBwcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByZXYgZmEgZmEtYW5nbGUtbGVmdFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmV4dCBmYSBmYS1hbmdsZS1yaWdodFwiPjwvc3Bhbj4nKVxuXG4gICAgICBzbGlkZUNvbnRhaW5lclNlbGVjdG9yOiAnLnNsaWRlQ29udGFpbmVyJ1xuICAgICAgc2xpZGVTZWxlY3RvcjogJ3VsLnNsaWRlcyA+IGxpJ1xuXG4gICAgICAjIE9wYWNpdHkgb2Ygc2xpZGVzIG90aGVyIHRoYW4gdGhlIGN1cnJlbnRcbiAgICAgICMgT25seSBhcHBsaWNhYmxlIGlmIHRoZSBzbGlkZXIgZWxlbWVudCBoYXMgb3ZlcmZsb3c6IHZpc2libGVcbiAgICAgICMgYW5kIGluYWN0aXZlIHNsaWRlcyBhcmUgc2hvd24gbmV4dCB0byB0aGUgY3VycmVudFxuICAgICAgaW5hY3RpdmVTbGlkZU9wYWNpdHk6IG51bGxcblxuICAgICAgIyBNYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIHNsaWRlcyBpbiBwaXhlbHNcbiAgICAgIHNsaWRlTWFyZ2luOiAwXG5cbiAgICAgICMgV2lkdGggb2YgdGhlIHNsaWRlLCBkZWZhdWx0cyB0byBhdXRvLCB0YWtlcyBhIDEwMCUgc2xpZGVyIHdpZHRoXG4gICAgICBzbGlkZVdpZHRoOiAnYXV0bydcblxuICAgICAgIyBGYWtlIGEgY2Fyb3VzZWwgZWZmZWN0IGJ5IHNob3dpbmcgdGhlIGxhc3Qgc2xpZGUgbmV4dCB0byB0aGUgZmlyc3RcbiAgICAgICMgdGhhdCBjYW4ndCBiZSBuYXZpZ2F0ZWQgdG8gYnV0IGZvcndhcmRzIHRvIHRoZSBlbmQgb2YgdGhlIHNsaWRlclxuICAgICAgIyBOdW1iZXIgaW5kaWNhdGVzIG51bWJlciBvZiBzbGlkZXMgcGFkZGluZyBsZWZ0IGFuZCByaWdodFxuICAgICAgY2Fyb3VzZWw6IDBcblxuICAgICAgIyBTbGlkZSBjbGljayBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgb25TbGlkZUNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBvbk5leHRDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnTmV4dCdcblxuICAgICAgb25QcmV2Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1ByZXYnXG5cblxuICAgIGRlYnVnVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgPGRpdiBjbGFzcz1cImRlYnVnXCI+XG4gICAgICAgIDxzcGFuPlNsaWRlcjogPCU9IHNsaWRlcl9pbmRleCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBzbGlkZXM6IDwlPSBudW1iZXJfb2Zfc2xpZGVzICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5DdXJyZW50IHNsaWRlOiA8JT0gY3VycmVudF9zbGlkZSAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+QXV0b3Njcm9sbDogPCU9IGF1dG9zY3JvbGwgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2YgbmF2aWdhdGlvbnM6IDwlPSBudW1iZXJfb2ZfbmF2aWdhdGlvbnMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPlNsaWRlciB3aWR0aDogPCU9IHNsaWRlcl93aWR0aCAlPjwvc3Bhbj5cbiAgICAgIDwvZGl2PicpXG5cblxuICAgICMgQ29uc3RydWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKGVsLCBvcHRpb25zLCBpbmRleCA9IG51bGwpIC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0cywgb3B0aW9ucylcblxuICAgICAgQCRzbGlkZXIgPSAkKGVsKVxuICAgICAgQCRzbGlkZXIuZGF0YSAnaW5kZXgnLCBpbmRleFxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgJ3NsaWRlcl8nK2luZGV4XG4gICAgICBAJHNsaWRlck5hdmlnYXRpb24gPSBbXVxuICAgICAgQCRzbGlkZXJMaXN0ZW5lcnMgPSBbXVxuICAgICAgQCRzbGlkZXNJbkNvbnRhaW5lciA9IG51bGxcblxuICAgICAgQG9wdGlvbnMub25TbGlkZUNsaWNrID0gKGV2ZW50KS0+XG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyID0gQCRzbGlkZXIuZmluZCBAb3B0aW9ucy5zbGlkZUNvbnRhaW5lclNlbGVjdG9yXG4gICAgICBAcmVmcmVzaFNsaWRlcygpXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgIEBhZGRDYXJvdXNlbFNsaWRlcygpXG4gICAgICAgIEByZWZyZXNoU2xpZGVzKClcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgICMgRW5hYmxlIHNsaWRlcyB0cm91Z2ggQ1NTXG4gICAgICBAZW5hYmxlU2xpZGVzKClcblxuICAgICAgQGlTY3JvbGwgPSBuZXcgSVNjcm9sbCBlbCxcbiAgICAgICAgc2Nyb2xsWDogdHJ1ZVxuICAgICAgICBzY3JvbGxZOiBmYWxzZVxuICAgICAgICBzbmFwOiBAb3B0aW9ucy5zbmFwXG4gICAgICAgIHNuYXBTcGVlZDogNDAwXG4gICAgICAgIHRhcDogdHJ1ZVxuICAgICAgICBtb21lbnR1bTogZmFsc2VcbiAgICAgICAgZXZlbnRQYXNzdGhyb3VnaDogdHJ1ZVxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcbiAgICAgICAgb25CZWZvcmVTY3JvbGxTdGFydDogKGUpLT5cbiAgICAgICAgICBwb2ludCA9IGUudG91Y2hlc1swXVxuICAgICAgICAgIHBvaW50U3RhcnRYID0gcG9pbnQucGFnZVhcbiAgICAgICAgICBwb2ludFN0YXJ0WSA9IHBvaW50LnBhZ2VZXG4gICAgICAgICAgbnVsbFxuICAgICAgICBvbkJlZm9yZVNjcm9sbE1vdmU6IChlKS0+XG4gICAgICAgICAgZGVsdGFYID0gTWF0aC5hYnMocG9pbnQucGFnZVggLSBwb2ludFN0YXJ0WClcbiAgICAgICAgICBkZWx0YVkgPSBNYXRoLmFicyhwb2ludC5wYWdlWSAtIHBvaW50U3RhcnRZKVxuICAgICAgICAgIGlmIGRlbHRhWCA+PSBkZWx0YVlcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIG51bGxcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgQG9wdGlvbnMucHJldk5leHRCdXR0b25zXG4gICAgICAgIEBhZGRQcmV2TmV4dEJ1dHRvbnMoKVxuXG4gICAgICBpZiBfLnNpemUoQG9wdGlvbnMubmF2aWdhdGlvbilcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAcmVzaXplKClcbiAgICAgIEBnb1RvU2xpZGUgQGN1cnJlbnRTbGlkZSwgZmFsc2VcbiAgICAgIEBiaW5kRXZlbnRzKClcbiAgICAgIEBkZWJ1ZygpXG4gICAgICBAXG5cblxuICAgICMgUmVmcmVzaCBzbGlkZXNcbiAgICByZWZyZXNoU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcyA9IEAkc2xpZGVDb250YWluZXIuZmluZCBAb3B0aW9ucy5zbGlkZVNlbGVjdG9yXG4gICAgICBAbnVtYmVyT2ZTbGlkZXMgPSBAJHNsaWRlcy5sZW5ndGhcblxuXG4gICAgIyBFbmFibGUgc2xpZGVzIHZpYSBDU1NcbiAgICBlbmFibGVTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzLmNzc1xuICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG5cblxuICAgICMgQWRkIHByZXYgbmV4dCBidXR0b25zXG4gICAgYWRkUHJldk5leHRCdXR0b25zOiAtPlxuXG4gICAgICBAJHNsaWRlci5hcHBlbmQgQG9wdGlvbnMucHJldk5leHRCdXR0b25zVGVtcGxhdGUoKVxuXG5cbiAgICAjIEFkZCBuYXZpZ2F0aW9uXG4gICAgcmVuZGVyTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBEZWxldGUgb2xkIHNsaWRlciBuYXZpZ2F0aW9uIGVsZW1lbnRzXG4gICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgpLT5cbiAgICAgICAgaWYgIWVsZW1lbnQuZGF0YSgnU2xpZGVyJylcbiAgICAgICAgICAkKGVsZW1lbnQpLnJlbW92ZSgpXG5cbiAgICAgIF8uZWFjaCBAb3B0aW9ucy5uYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgsIGxpc3QpPT5cblxuICAgICAgICBpZiBlbGVtZW50ID09ICdpbmRleCdcblxuICAgICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgICAgbmV3RWxlbWVudCA9IEBvcHRpb25zLmluZGV4TmF2aWdhdGlvblRlbXBsYXRlKHsnc2xpZGVzJzogQCRzbGlkZXMsICdjYXJvdXNlbCc6IEBvcHRpb25zLmNhcm91c2VsfSlcbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCAkKG5ld0VsZW1lbnQpXG5cbiAgICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKVxuXG4gICAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICAgIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNzc1xuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLShfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS53aWR0aCgpIC8gMilcblxuICAgICAgICBlbHNlIGlmIGVsZW1lbnQuZGF0YSgnU2xpZGVyJylcblxuICAgICAgICAgIHNlbGYucmVnaXN0ZXJMaXN0ZW5lciBlbGVtZW50XG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5XG5cbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCBlbGVtZW50XG4gICAgICAgICAgbmF2aWdhdGlvbkl0ZW1zID0gXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY2hpbGRyZW4oKVxuXG4gICAgICAgICAgQCRzbGlkZXMuZWFjaCAoaW5kZXgsc2xpZGUpPT5cbiAgICAgICAgICAgIGl0ZW0gPSBuYXZpZ2F0aW9uSXRlbXMuZXEoaW5kZXgpXG4gICAgICAgICAgICBpZiBpdGVtXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnc2xpZGVyX2luZGV4JywgQCRzbGlkZXIuZGF0YSAnaW5kZXgnXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnaXRlbV9pbmRleCcsIGluZGV4K3BhcnNlSW50KHNlbGYub3B0aW9ucy5jYXJvdXNlbClcbiAgICAgICAgICAgICAgaXRlbS5hZGRDbGFzcyAnc2xpZGVyX25hdmlnYXRpb25JdGVtJ1xuICAgICAgICAgICAgICBpdGVtLm9uICdjbGljaycsIChldmVudCktPlxuICAgICAgICAgICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICAgICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuXG4gICAgIyBSZWdpc3RlciBsaXN0ZW5lclxuICAgIHJlZ2lzdGVyTGlzdGVuZXI6IChsaXN0ZW5lciktPlxuXG4gICAgICBAJHNsaWRlckxpc3RlbmVycy5wdXNoIGxpc3RlbmVyXG5cblxuICAgICMgVXBkYXRlIG5hdmlnYXRpb24gc3RhdHVzXG4gICAgdXBkYXRlTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcbiAgICAgIGluZGV4ID0gQGN1cnJlbnRTbGlkZVxuXG4gICAgICBpZiAhQG9wdGlvbnMuZGlzYWJsZWRcblxuICAgICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCktPlxuXG4gICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5zbGlkZXJfbmF2aWdhdGlvbkl0ZW0nKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgIC5maWx0ZXIgKCktPiAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKSA9PSBpbmRleFxuICAgICAgICAgICAgICAuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogKGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHkgJiYgYW5pbWF0ZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIGZhbHNlXG5cbiAgICAgIEAkc2xpZGVzLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFNldCBzbGlkZSBvcGFjaXR5IGZvciBhY3RpdmUgYW5kIGluYWN0aXZlIHNsaWRlc1xuICAgIHNldFNsaWRlT3BhY2l0eTogKGFjdGl2ZSwgaW5hY3RpdmUsIGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG5cblxuICAgICMgRXZlbnQgY2FsbGJhY2sgb24gc2Nyb2xsIGVuZFxuICAgIG9uU2Nyb2xsRW5kOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIElmIFNsaWRlciBzaG93cyBtb3JlIHRoYW4gb25lIHNsaWRlIHBlciBwYWdlXG4gICAgICAjIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnRTbGlkZSBpcyBvbiB0aGVcbiAgICAgICMgbGFzdCBwYWdlIGFuZCBoaWdoZXIgdGhhbiB0aGUgb25lIHNuYXBwZWQgdG9cbiAgICAgIGlmIEBzbGlkZXNJbkNvbnRhaW5lciA+IDFcbiAgICAgICAgaWYgQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVggPCBAbnVtYmVyT2ZTbGlkZXMgLSBAc2xpZGVzSW5Db250YWluZXJcbiAgICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcbiAgICAgIGVsc2VcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICMgSWYgbGFzdCBzbGlkZSwgcmV0dXJuIHRvIGZpcnN0XG4gICAgICAgIGlmIEBjdXJyZW50U2xpZGUgPj0gQG51bWJlck9mU2xpZGVzLUBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAb3B0aW9ucy5jYXJvdXNlbCwgZmFsc2VcbiAgICAgICAgIyBJZiBmaXJzdCBzbGlkZSwgbW92ZSB0byBsYXN0XG4gICAgICAgIGVsc2UgaWYgQGN1cnJlbnRTbGlkZSA8IEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAbnVtYmVyT2ZTbGlkZXMgLSAoQG9wdGlvbnMuY2Fyb3VzZWwrMSksIGZhbHNlXG5cbiAgICAgIF8uZWFjaCBAJHNsaWRlckxpc3RlbmVycywgKGxpc3RlbmVyKS0+XG5cbiAgICAgICAgIyBVcGRhdGUgcmVtb3RlIHNsaWRlclxuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ3N0b3BBdXRvU2Nyb2xsJ1xuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ2dvVG9TbGlkZScsIHNlbGYuY3VycmVudFNsaWRlIC0gc2VsZi5vcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAnY2xpY2snLCAnc3Bhbi5uZXh0JywgKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ2NsaWNrJywgJ3NwYW4ucHJldicsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEAkc2xpZGVyLm9uICdjbGljaycsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG4gICAgICAgICMjI1xuICAgICAgICBpZiBAcmVzaXplVG9cbiAgICAgICAgICBjbGVhclRpbWVvdXQgQHJlc2l6ZVRpbWVvdXRcbiAgICAgICAgQHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0IC0+XG4gICAgICAgICwgMjAwXG4gICAgICAgICMjI1xuXG5cbiAgICAjIEdvIHRvIG5leHQgc2xpZGVcbiAgICBuZXh0U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBudW1iZXJPZlNsaWRlcyA+IChAY3VycmVudFNsaWRlKzEpXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gKEBjdXJyZW50U2xpZGUrMSlcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAwXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBwcmV2aW91cyBzbGlkZVxuICAgIHByZXZTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZS0xID49IDBcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlLTFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAbnVtYmVyT2ZTbGlkZXMtMVxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gc2xpZGUgaW5kZXhcbiAgICBnb1RvU2xpZGU6IChpbmRleCwgYW5pbWF0ZT10cnVlKT0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCBAb3B0aW9ucy5zcGVlZFxuICAgICAgZWxzZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIDBcblxuICAgICAgQGN1cnJlbnRTbGlkZSA9IGluZGV4XG4gICAgICBAdXBkYXRlU2xpZGVzKGFuaW1hdGUpXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cbiAgICAgIF8uZWFjaCBAJHNsaWRlckxpc3RlbmVycywgKGxpc3RlbmVyKS0+XG5cbiAgICAgICAgIyBVcGRhdGUgcmVtb3RlIHNsaWRlclxuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ3N0b3BBdXRvU2Nyb2xsJ1xuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ2dvVG9TbGlkZScsIGluZGV4IC0gc2VsZi5vcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgQWRkIGZha2UgY2Fyb3VzZWwgc2xpZGVzXG4gICAgYWRkQ2Fyb3VzZWxTbGlkZXM6IC0+XG5cbiAgICAgIEAkc3RhcnRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKC1Ab3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuICAgICAgQCRlbmRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKDAsQG9wdGlvbnMuY2Fyb3VzZWwpLmNsb25lKClcblxuICAgICAgQCRzbGlkZXMucGFyZW50KCkucHJlcGVuZCBAJHN0YXJ0RWxlbWVudHNcbiAgICAgIEAkc2xpZGVzLnBhcmVudCgpLmFwcGVuZCBAJGVuZEVsZW1lbnRzXG5cblxuICAgICMgU3RhcnQgYXV0b3Njcm9sbFxuICAgIHN0YXJ0QXV0b1Njcm9sbDogPT5cblxuICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQG5leHRTbGlkZSwgQG9wdGlvbnMuaW50ZXJ2YWxcblxuXG4gICAgIyBTdG9wIGF1dG9zY3JvbGxcbiAgICBzdG9wQXV0b1Njcm9sbDogPT5cblxuICAgICAgY2xlYXJJbnRlcnZhbCBAaW50ZXJ2YWxcbiAgICAgIEBpbnRlcnZhbCA9IG51bGxcblxuXG4gICAgIyBBZGQgZGVidWcgb3V0cHV0IHRvIHNsaWRlclxuICAgIGRlYnVnOiA9PlxuXG4gICAgICBpZiBAb3B0aW9ucy5kZWJ1Z1xuICAgICAgICBAJHNsaWRlci5maW5kKCcuZGVidWcnKS5yZW1vdmUoKVxuICAgICAgICBAJHNsaWRlci5hcHBlbmQgQGRlYnVnVGVtcGxhdGVcbiAgICAgICAgICAnc2xpZGVyX2luZGV4JzogQCRzbGlkZXIuZGF0YSAnaW5kZXgnXG4gICAgICAgICAgJ251bWJlcl9vZl9zbGlkZXMnOiBAbnVtYmVyT2ZTbGlkZXNcbiAgICAgICAgICAnY3VycmVudF9zbGlkZSc6IEBpU2Nyb2xsLmN1cnJlbnRQYWdlPy5wYWdlWFxuICAgICAgICAgICdhdXRvc2Nyb2xsJzogaWYgQGludGVydmFsIHRoZW4gJ2VuYWJsZWQnIGVsc2UgJ2Rpc2FibGVkJ1xuICAgICAgICAgICdudW1iZXJfb2ZfbmF2aWdhdGlvbnMnOiBAJHNsaWRlck5hdmlnYXRpb24ubGVuZ3RoXG4gICAgICAgICAgJ3NsaWRlcl93aWR0aCc6IEAkc2xpZGVyLndpZHRoKClcblxuXG4gICAgIyBQcmludCBvcHRpb24gdG8gY29uc29sZVxuICAgICMgQ2FuJ3QganVzdCByZXR1cm4gdGhlIHZhbHVlIHRvIGRlYnVnIGl0IGJlY2F1c2VcbiAgICAjIGl0IHdvdWxkIGJyZWFrIGNoYWluaW5nIHdpdGggdGhlIGpRdWVyeSBvYmplY3RcbiAgICAjIEV2ZXJ5IG1ldGhvZCBjYWxsIHJldHVybnMgYSBqUXVlcnkgb2JqZWN0XG4gICAgZ2V0OiAob3B0aW9uKSAtPlxuICAgICAgY29uc29sZS5sb2cgJ29wdGlvbjogJytvcHRpb24rJyBpcyAnK0BvcHRpb25zW29wdGlvbl1cbiAgICAgIEBvcHRpb25zW29wdGlvbl1cblxuXG4gICAgIyBTZXQgb3B0aW9uIHRvIHRoaXMgaW5zdGFuY2VzIG9wdGlvbnMgYXJyYXlcbiAgICBzZXQ6IChvcHRpb24sIHZhbHVlKSAtPlxuXG4gICAgICAjIFNldCBvcHRpb25zIHZhbHVlXG4gICAgICBAb3B0aW9uc1tvcHRpb25dID0gdmFsdWVcblxuICAgICAgIyBJZiBubyBpbnRlcnZhbCBpcyBjdXJyZW50bHkgcHJlc2VudCwgc3RhcnQgYXV0b3Njcm9sbFxuICAgICAgaWYgb3B0aW9uID09ICdhdXRvc2Nyb2xsJyAmJiAhQGludGVydmFsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICAjIFRPRE86IFVwZGF0ZSBzbGlkZSBtYXJnaW5cbiAgICAgICNpZiBvcHRpb24gPT0gJ3NsaWRlTWFyZ2luJ1xuICAgICAgICAjIGNhY2hlIHNsaWRlTWFyZ2luIENTUyBvbiBlbGVtZW50P1xuICAgICAgICAjIHdoYXQgaWYgdGhlIHVzZXIgd2FudHMgdG8gc3dpdGNoIGJhY2tcblxuICAgICAgaWYgb3B0aW9uID09ICdpbmFjdGl2ZVNsaWRlT3BhY2l0eScgJiYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuXG4gICAgICBpZiBvcHRpb24gPT0gJ25hdmlnYXRpb24nXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQGRlYnVnKClcblxuXG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpblxuICAkLmZuLmV4dGVuZCBTbGlkZXI6IChvcHRpb24sIGFyZ3MuLi4pIC0+XG5cbiAgICBAZWFjaCAoaW5kZXgpLT5cbiAgICAgICR0aGlzID0gJChAKVxuICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgIGlmICFkYXRhXG4gICAgICAgICR0aGlzLmRhdGEgJ1NsaWRlcicsIChkYXRhID0gbmV3IFNsaWRlcihALCBvcHRpb24sIGluZGV4KSlcblxuICAgICAgaWYgdHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJ1xuICAgICAgICByZXR1cm4gZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpXG5cblxuKSB3aW5kb3cualF1ZXJ5LCB3aW5kb3dcblxuIl19