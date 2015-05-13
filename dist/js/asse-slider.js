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
        prevButtonSelector: null,
        nextButtonSelector: null,
        slideContainerSelector: '.slideContainer',
        slideSelector: 'ul.slides > li',
        inactiveSlideOpacity: null,
        slideMargin: 0,
        slideWidth: 'auto',
        carousel: 0,
        onStart: function(event) {},
        onSlideClick: function(event) {},
        onNextClick: function(event) {},
        onPrevClick: function(event) {},
        onScrollEnd: function(event) {}
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
        this.$slider.data('index', this.options.index ? 'slider_' + this.options.index : 'slider_' + index);
        this.$slider.addClass(this.options.index ? 'slider_' + this.options.index : 'slider_' + index);
        this.$sliderNavigation = [];
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
          preventDefault: false
        });
        if (this.options.autoscroll) {
          this.startAutoScroll();
        }
        this.addPrevNextButtons();
        if (_.size(this.options.navigation)) {
          this.renderNavigation();
        }
        this.resize();
        this.goToSlide(this.currentSlide, false);
        this.bindEvents();
        this.debug();
        if (typeof self.options.onStart === 'function') {
          self.options.onStart.apply(this, [event]);
        }
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
        var handleNextEvent, handlePrevEvent, self;
        self = this;
        handleNextEvent = function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.nextSlide();
          if (typeof self.options.onNextClick === 'function') {
            return self.options.onNextClick.apply(this, [event, self]);
          }
        };
        handlePrevEvent = function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            return self.options.onPrevClick.apply(this, [event, self]);
          }
        };
        if (this.options.prevNextButtons) {
          if (this.options.prevButtonSelector || this.options.nextButtonSelector) {
            if (this.options.prevButtonSelector) {
              $('body').on('click', this.options.prevButtonSelector, handlePrevEvent);
            }
            if (this.options.nextButtonSelector) {
              return $('body').on('click', this.options.nextButtonSelector, handleNextEvent);
            }
          } else {
            this.$slider.append(this.options.prevNextButtonsTemplate());
            this.$slider.on('tap', 'span.prev', handlePrevEvent);
            return this.$slider.on('tap', 'span.next', handleNextEvent);
          }
        }
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
                  return item.on('tap', function(event) {
                    event.stopPropagation();
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
            this.goToSlide(this.options.carousel + (this.currentSlide - (this.numberOfSlides - this.options.carousel)), false, false);
          } else if (this.currentSlide < this.options.carousel) {
            this.goToSlide(this.numberOfSlides - (this.options.carousel + 1), false, false);
          }
        }
        if (typeof self.options.onScrollEnd === 'function') {
          self.options.onScrollEnd.apply(this, [event, self]);
        }
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
          event.stopPropagation();
          self.stopAutoScroll();
          if (typeof self.options.onSlideClick === 'function') {
            return self.options.onSlideClick.apply(this, [event, self]);
          }
        });
        this.$slider.on('tap', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('item_index'));
        });
        return $(window).bind('resize', function() {
          return self.resize();
        });
      };

      Slider.prototype.nextSlide = function() {
        var nextSlideIndex, self;
        self = this;
        if (this.numberOfSlides > this.currentSlide + 1) {
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

      Slider.prototype.goToSlide = function(index, animate, triggerEvent) {
        var ref, ref1, self;
        if (animate == null) {
          animate = true;
        }
        if (triggerEvent == null) {
          triggerEvent = true;
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
        if (triggerEvent) {
          $('body').trigger(this.$slider.data('index') + '#goToSlide', index - this.options.carousel);
        }
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

      Slider.prototype.listenTo = function(index) {
        var self;
        self = this;
        return $('body').on('slider_' + index + '#goToSlide', function(event, index) {
          self.stopAutoScroll();
          return self.goToSlide(index + self.options.carousel, true, false);
        });
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
        if (option === 'listenTo') {
          this.listenTo(value);
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

//# sourceMappingURL=data:application/json;base64,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QUssQ0FBQyxJQUFOLENBQVcsUUFBWCxFQUFxQixDQUFDLElBQUEsR0FBVyxJQUFBLE1BQUEsQ0FBTyxJQUFQLEVBQVUsTUFBVixFQUFrQixLQUFsQixDQUFaLENBQXJCLENBQUEsQ0FERjtXQUhBO0FBTUEsVUFBQSxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBQ0UsbUJBQU8sSUFBSyxDQUFBLE1BQUEsQ0FBTyxDQUFDLEtBQWIsQ0FBbUIsSUFBbkIsRUFBeUIsSUFBekIsQ0FBUCxDQURGO1dBUEk7UUFBQSxDQUFOLEVBRmtCO01BQUEsQ0FBUjtLQUFaLEVBaGlCRDtFQUFBLENBQUQsQ0FBQSxDQTZpQkUsTUFBTSxDQUFDLE1BN2lCVCxFQTZpQmlCLE1BN2lCakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcbiAgICAkc2xpZGVyTmF2aWdhdGlvbjogbnVsbFxuICAgICRzbGlkZXJMaXN0ZW5lcnM6IG51bGxcbiAgICAkc2xpZGVzSW5Db250YWluZXI6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogdHJ1ZVxuICAgICAgc3BlZWQ6IDUwMFxuICAgICAgaW50ZXJ2YWw6IDUwMDBcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgICBzbmFwOiB0cnVlXG5cbiAgICAgICMgSW4gdGhpcyBzdGF0ZSwgdGhlIHNsaWRlciBpbnN0YW5jZSBzaG91bGQgbmV2ZXIgZm9yd2FyZCBldmVudHMgdG9cbiAgICAgICMgdGhlIGlTY3JvbGwgY29tcG9uZW50LCBlLmcuIHdoZW4gdGhlIHNsaWRlciBpcyBub3QgdmlzaWJsZSAoZGlzcGxheTpub25lKVxuICAgICAgIyBhbmQgdGhlcmVmb3JlIGlTY3JvbGwgY2FuJ3QgZ2V0L3Njcm9sbCB0aGUgc2xpZGUgZWxlbWVudHNcbiAgICAgIGRpc2FibGVkOiBmYWxzZVxuXG4gICAgICAjIE5hdmlnYXRpb24gZWxlbWVudCBhcnJheVxuICAgICAgIyBlaXRoZXIgJ2luZGV4JyBmb3Igb24tc2xpZGVyIG5hdmlnYXRpb24sIGEgalF1ZXJ5IHNlbGVjdG9yIGZvciBhIHRodW1ibmFpbFxuICAgICAgIyBuYXZpZ2F0aW9uIG9yIGFub3RoZXIgc2xpZGVyIGVsZW1lbnQgZm9yIGEgc2xpZGVyIGFjdGluZyBhcyBhIHN5bmNlZCByZW1vdGVcbiAgICAgICMgbmF2aWdhdGlvbiB0byB0aGlzIHNsaWRlciBpbnN0YW5jZVxuICAgICAgbmF2aWdhdGlvbjogWydpbmRleCddXG5cbiAgICAgICMgSW5kZXggbmF2aWdhdGlvbiBkZWZhdWx0IHRlbXBsYXRlXG4gICAgICBpbmRleE5hdmlnYXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPHVsIGNsYXNzPVwic2xpZGVyTmF2aWdhdGlvblwiPlxuICAgICAgICA8JSBfLmVhY2goc2xpZGVzLCBmdW5jdGlvbihlbGVtZW50LGluZGV4KXsgJT5cbiAgICAgICAgICA8JSBpZighY2Fyb3VzZWwgfHwgKGluZGV4Pj1jYXJvdXNlbCAmJiAoaW5kZXgrMSk8PXNsaWRlcy5sZW5ndGgtY2Fyb3VzZWwpKXsgJT5cbiAgICAgICAgICAgIDxsaSBkYXRhLWl0ZW1faW5kZXg9XCI8JT0gaW5kZXggJT5cIiBjbGFzcz1cInNsaWRlcl9uYXZpZ2F0aW9uSXRlbSBmYSBmYS1jaXJjbGUtb1wiPjwvbGk+XG4gICAgICAgICAgPCUgfSAlPlxuICAgICAgICA8JSB9KTsgJT5cbiAgICAgIDwvdWw+JylcblxuICAgICAgcHJldk5leHRCdXR0b25zOiB0cnVlXG4gICAgICBwcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByZXYgZmEgZmEtYW5nbGUtbGVmdFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmV4dCBmYSBmYS1hbmdsZS1yaWdodFwiPjwvc3Bhbj4nKVxuXG4gICAgICAjIElmIG9uZSBvZiB0aGVzZSB2YXJpYWJsZXMgaXMgYSBqUXVlcnkgc2VsZWN0b3IsIHRoZXkgYXJlIHVzZWQgaW5zdGVhZFxuICAgICAgIyBvZiByZW5kZXJpbmcgdGhlIGFib3ZlIHRlbXBsYXRlXG4gICAgICBwcmV2QnV0dG9uU2VsZWN0b3I6IG51bGxcbiAgICAgIG5leHRCdXR0b25TZWxlY3RvcjogbnVsbFxuXG4gICAgICBzbGlkZUNvbnRhaW5lclNlbGVjdG9yOiAnLnNsaWRlQ29udGFpbmVyJ1xuICAgICAgc2xpZGVTZWxlY3RvcjogJ3VsLnNsaWRlcyA+IGxpJ1xuXG4gICAgICAjIE9wYWNpdHkgb2Ygc2xpZGVzIG90aGVyIHRoYW4gdGhlIGN1cnJlbnRcbiAgICAgICMgT25seSBhcHBsaWNhYmxlIGlmIHRoZSBzbGlkZXIgZWxlbWVudCBoYXMgb3ZlcmZsb3c6IHZpc2libGVcbiAgICAgICMgYW5kIGluYWN0aXZlIHNsaWRlcyBhcmUgc2hvd24gbmV4dCB0byB0aGUgY3VycmVudFxuICAgICAgaW5hY3RpdmVTbGlkZU9wYWNpdHk6IG51bGxcblxuICAgICAgIyBNYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIHNsaWRlcyBpbiBwaXhlbHNcbiAgICAgIHNsaWRlTWFyZ2luOiAwXG5cbiAgICAgICMgV2lkdGggb2YgdGhlIHNsaWRlLCBkZWZhdWx0cyB0byBhdXRvLCB0YWtlcyBhIDEwMCUgc2xpZGVyIHdpZHRoXG4gICAgICBzbGlkZVdpZHRoOiAnYXV0bydcblxuICAgICAgIyBGYWtlIGEgY2Fyb3VzZWwgZWZmZWN0IGJ5IHNob3dpbmcgdGhlIGxhc3Qgc2xpZGUgbmV4dCB0byB0aGUgZmlyc3RcbiAgICAgICMgdGhhdCBjYW4ndCBiZSBuYXZpZ2F0ZWQgdG8gYnV0IGZvcndhcmRzIHRvIHRoZSBlbmQgb2YgdGhlIHNsaWRlclxuICAgICAgIyBOdW1iZXIgaW5kaWNhdGVzIG51bWJlciBvZiBzbGlkZXMgcGFkZGluZyBsZWZ0IGFuZCByaWdodFxuICAgICAgY2Fyb3VzZWw6IDBcblxuICAgICAgIyBDYWxsYmFjayBvbiBzbGlkZXIgaW5pdGlhbGl6YXRpb25cbiAgICAgIG9uU3RhcnQ6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1N0YXJ0J1xuXG4gICAgICAjIFNsaWRlIGNsaWNrIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICBvblNsaWRlQ2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG5cbiAgICAgIG9uTmV4dENsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdOZXh0J1xuXG4gICAgICBvblByZXZDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnUHJldidcblxuICAgICAgb25TY3JvbGxFbmQ6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ0VuZCdcblxuXG4gICAgZGVidWdUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICA8ZGl2IGNsYXNzPVwiZGVidWdcIj5cbiAgICAgICAgPHNwYW4+U2xpZGVyOiA8JT0gc2xpZGVyX2luZGV4ICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIHNsaWRlczogPCU9IG51bWJlcl9vZl9zbGlkZXMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkN1cnJlbnQgc2xpZGU6IDwlPSBjdXJyZW50X3NsaWRlICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5BdXRvc2Nyb2xsOiA8JT0gYXV0b3Njcm9sbCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBuYXZpZ2F0aW9uczogPCU9IG51bWJlcl9vZl9uYXZpZ2F0aW9ucyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+U2xpZGVyIHdpZHRoOiA8JT0gc2xpZGVyX3dpZHRoICU+PC9zcGFuPlxuICAgICAgPC9kaXY+JylcblxuXG4gICAgIyBDb25zdHJ1Y3RvclxuICAgIGNvbnN0cnVjdG9yOiAoZWwsIG9wdGlvbnMsIGluZGV4ID0gbnVsbCkgLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgQG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQGRlZmF1bHRzLCBvcHRpb25zKVxuXG4gICAgICBAJHNsaWRlciA9ICQoZWwpXG4gICAgICBAJHNsaWRlci5kYXRhICdpbmRleCcsIGlmIEBvcHRpb25zLmluZGV4IHRoZW4gJ3NsaWRlcl8nK0BvcHRpb25zLmluZGV4IGVsc2UgJ3NsaWRlcl8nK2luZGV4XG4gICAgICBAJHNsaWRlci5hZGRDbGFzcyBpZiBAb3B0aW9ucy5pbmRleCB0aGVuICdzbGlkZXJfJytAb3B0aW9ucy5pbmRleCBlbHNlICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uID0gW11cbiAgICAgIEAkc2xpZGVzSW5Db250YWluZXIgPSBudWxsXG5cbiAgICAgIEBvcHRpb25zLm9uU2xpZGVDbGljayA9IChldmVudCktPlxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lciA9IEAkc2xpZGVyLmZpbmQgQG9wdGlvbnMuc2xpZGVDb250YWluZXJTZWxlY3RvclxuICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICBAYWRkQ2Fyb3VzZWxTbGlkZXMoKVxuICAgICAgICBAcmVmcmVzaFNsaWRlcygpXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICAjIEVuYWJsZSBzbGlkZXMgdHJvdWdoIENTU1xuICAgICAgQGVuYWJsZVNsaWRlcygpXG5cbiAgICAgIEBpU2Nyb2xsID0gbmV3IElTY3JvbGwgZWwsXG4gICAgICAgIHNjcm9sbFg6IHRydWVcbiAgICAgICAgc2Nyb2xsWTogZmFsc2VcbiAgICAgICAgc25hcDogQG9wdGlvbnMuc25hcFxuICAgICAgICBzbmFwU3BlZWQ6IDQwMFxuICAgICAgICB0YXA6IHRydWVcbiAgICAgICAgbW9tZW50dW06IGZhbHNlXG4gICAgICAgIGV2ZW50UGFzc3Rocm91Z2g6IHRydWVcbiAgICAgICAgcHJldmVudERlZmF1bHQ6IGZhbHNlXG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgIEBhZGRQcmV2TmV4dEJ1dHRvbnMoKVxuXG4gICAgICBpZiBfLnNpemUoQG9wdGlvbnMubmF2aWdhdGlvbilcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAcmVzaXplKClcbiAgICAgIEBnb1RvU2xpZGUgQGN1cnJlbnRTbGlkZSwgZmFsc2VcbiAgICAgIEBiaW5kRXZlbnRzKClcbiAgICAgIEBkZWJ1ZygpXG5cbiAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25TdGFydCA9PSAnZnVuY3Rpb24nXG4gICAgICAgIHNlbGYub3B0aW9ucy5vblN0YXJ0LmFwcGx5KEAsIFtldmVudF0pXG5cbiAgICAgIEBcblxuXG4gICAgIyBSZWZyZXNoIHNsaWRlc1xuICAgIHJlZnJlc2hTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzID0gQCRzbGlkZUNvbnRhaW5lci5maW5kIEBvcHRpb25zLnNsaWRlU2VsZWN0b3JcbiAgICAgIEBudW1iZXJPZlNsaWRlcyA9IEAkc2xpZGVzLmxlbmd0aFxuXG5cbiAgICAjIEVuYWJsZSBzbGlkZXMgdmlhIENTU1xuICAgIGVuYWJsZVNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMuY3NzXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaydcblxuXG4gICAgIyBBZGQgcHJldiBuZXh0IGJ1dHRvbnNcbiAgICBhZGRQcmV2TmV4dEJ1dHRvbnM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgTmV4dCBldmVudCBmdW5jdGlvblxuICAgICAgaGFuZGxlTmV4dEV2ZW50ID0gKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgIyBQcmV2IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVQcmV2RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYucHJldlNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uUHJldkNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBpZiBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNcblxuICAgICAgICAjIENoZWNrIGlmIHByZXYvbmV4dCBidXR0b24gc2VsZWN0b3JzIGFyZSBzZXQgaW4gb3B0aW9ucyxcbiAgICAgICAgIyBhbmQgaWYgc28sIHVzZSB0aGVtIGluc3RlYWQgb2YgcmVuZGVyaW5nIHRlbXBsYXRlXG4gICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciBvciBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcblxuICAgICAgICAgICMgV2UgY2FuJ3QgdXNlIHRoZSBjdXN0b20gJ3RhcCcgZXZlbnQgb3V0c2lkZSBvZiB0aGUgaVNjcm9sbCBlbGVtZW50XG4gICAgICAgICAgIyBUaGVyZWZvcmUgd2UgaGF2ZSB0byBiaW5kIGNsaWNrIGFuZCB0b3VjaHN0YXJ0IGV2ZW50cyBib3RoIHRvXG4gICAgICAgICAgIyB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgICAgICBpZiBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3IsIGhhbmRsZVByZXZFdmVudFxuXG4gICAgICAgICAgaWYgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yXG4gICAgICAgICAgICAkKCdib2R5Jykub24gJ2NsaWNrJywgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yLCBoYW5kbGVOZXh0RXZlbnRcblxuICAgICAgICAjIE5vIHNlbGVjdG9ycyBzZXQsIHJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgQG9wdGlvbnMucHJldk5leHRCdXR0b25zVGVtcGxhdGUoKVxuXG4gICAgICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICdzcGFuLnByZXYnLCBoYW5kbGVQcmV2RXZlbnRcbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ubmV4dCcsIGhhbmRsZU5leHRFdmVudFxuXG5cbiAgICAjIEFkZCBuYXZpZ2F0aW9uXG4gICAgcmVuZGVyTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBEZWxldGUgb2xkIHNsaWRlciBuYXZpZ2F0aW9uIGVsZW1lbnRzXG4gICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgpLT5cbiAgICAgICAgaWYgIWVsZW1lbnQuZGF0YSgnU2xpZGVyJylcbiAgICAgICAgICAkKGVsZW1lbnQpLnJlbW92ZSgpXG5cbiAgICAgIF8uZWFjaCBAb3B0aW9ucy5uYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgsIGxpc3QpPT5cblxuICAgICAgICBpZiBlbGVtZW50ID09ICdpbmRleCdcblxuICAgICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgICAgbmV3RWxlbWVudCA9IEBvcHRpb25zLmluZGV4TmF2aWdhdGlvblRlbXBsYXRlKHsnc2xpZGVzJzogQCRzbGlkZXMsICdjYXJvdXNlbCc6IEBvcHRpb25zLmNhcm91c2VsfSlcbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCAkKG5ld0VsZW1lbnQpXG5cbiAgICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKVxuXG4gICAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICAgIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNzc1xuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLShfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS53aWR0aCgpIC8gMilcblxuICAgICAgICBlbHNlIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoIGVsZW1lbnRcbiAgICAgICAgICBuYXZpZ2F0aW9uSXRlbXMgPSBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jaGlsZHJlbigpXG5cbiAgICAgICAgICBAJHNsaWRlcy5lYWNoIChpbmRleCxzbGlkZSk9PlxuICAgICAgICAgICAgaXRlbSA9IG5hdmlnYXRpb25JdGVtcy5lcShpbmRleClcbiAgICAgICAgICAgIGlmIGl0ZW1cbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdzbGlkZXJfaW5kZXgnLCBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdpdGVtX2luZGV4JywgaW5kZXgrcGFyc2VJbnQoc2VsZi5vcHRpb25zLmNhcm91c2VsKVxuICAgICAgICAgICAgICBpdGVtLmFkZENsYXNzICdzbGlkZXJfbmF2aWdhdGlvbkl0ZW0nXG4gICAgICAgICAgICAgIGl0ZW0ub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG5cbiAgICAjIFVwZGF0ZSBuYXZpZ2F0aW9uIHN0YXR1c1xuICAgIHVwZGF0ZU5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyICgpLT4gJChAKS5kYXRhKCdpdGVtX2luZGV4JykgPT0gaW5kZXhcbiAgICAgICAgICAgICAgLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgVXBkYXRlIHNsaWRlIHByb3BlcnRpZXMgdG8gY3VycmVudCBzbGlkZXIgc3RhdGVcbiAgICB1cGRhdGVTbGlkZXM6IChhbmltYXRlPXRydWUpLT5cblxuICAgICAgIyBGYWRlIGluYWN0aXZlIHNsaWRlcyB0byBhIHNwZWNpZmljIG9wYWNpdHkgdmFsdWVcbiAgICAgIGlmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5ICYmIGFuaW1hdGVcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCBmYWxzZVxuXG4gICAgICBAJHNsaWRlcy5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBTZXQgc2xpZGUgb3BhY2l0eSBmb3IgYWN0aXZlIGFuZCBpbmFjdGl2ZSBzbGlkZXNcbiAgICBzZXRTbGlkZU9wYWNpdHk6IChhY3RpdmUsIGluYWN0aXZlLCBhbmltYXRlPXRydWUpLT5cblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuXG5cbiAgICAjIEV2ZW50IGNhbGxiYWNrIG9uIHNjcm9sbCBlbmRcbiAgICBvblNjcm9sbEVuZDogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBJZiBTbGlkZXIgc2hvd3MgbW9yZSB0aGFuIG9uZSBzbGlkZSBwZXIgcGFnZVxuICAgICAgIyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50U2xpZGUgaXMgb24gdGhlXG4gICAgICAjIGxhc3QgcGFnZSBhbmQgaGlnaGVyIHRoYW4gdGhlIG9uZSBzbmFwcGVkIHRvXG4gICAgICBpZiBAc2xpZGVzSW5Db250YWluZXIgPiAxXG4gICAgICAgIGlmIEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYIDwgQG51bWJlck9mU2xpZGVzIC0gQHNsaWRlc0luQ29udGFpbmVyXG4gICAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAjIElmIGxhc3Qgc2xpZGUsIHJldHVybiB0byBmaXJzdFxuICAgICAgICBpZiBAY3VycmVudFNsaWRlID49IEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG9wdGlvbnMuY2Fyb3VzZWwgKyAoQGN1cnJlbnRTbGlkZSAtIChAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWwpKSwgZmFsc2UsIGZhbHNlXG4gICAgICAgICMgSWYgZmlyc3Qgc2xpZGUsIG1vdmUgdG8gbGFzdFxuICAgICAgICBlbHNlIGlmIEBjdXJyZW50U2xpZGUgPCBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG51bWJlck9mU2xpZGVzIC0gKEBvcHRpb25zLmNhcm91c2VsKzEpLCBmYWxzZSwgZmFsc2VcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZCA9PSAnZnVuY3Rpb24nXG4gICAgICAgIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZC5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIC0+XG4gICAgICAgIHNlbGYucmVzaXplKClcblxuXG4gICAgIyBHbyB0byBuZXh0IHNsaWRlXG4gICAgbmV4dFNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAbnVtYmVyT2ZTbGlkZXMgPiBAY3VycmVudFNsaWRlKzFcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlKzFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAwXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBwcmV2aW91cyBzbGlkZVxuICAgIHByZXZTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZS0xID49IDBcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlLTFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAbnVtYmVyT2ZTbGlkZXMtMVxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gc2xpZGUgaW5kZXhcbiAgICBnb1RvU2xpZGU6IChpbmRleCwgYW5pbWF0ZT10cnVlLCB0cmlnZ2VyRXZlbnQ9dHJ1ZSk9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgQG9wdGlvbnMuc3BlZWRcbiAgICAgIGVsc2VcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCAwXG5cbiAgICAgIEBjdXJyZW50U2xpZGUgPSBpbmRleFxuICAgICAgQHVwZGF0ZVNsaWRlcyhhbmltYXRlKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG4gICAgICBpZiB0cmlnZ2VyRXZlbnRcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgQCRzbGlkZXIuZGF0YSgnaW5kZXgnKSsnI2dvVG9TbGlkZScsIGluZGV4IC0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIExpc3RlbiB0byBhbm90aGVyIHNsaWRlciBmb3IgbmF2aWdhdGlvblxuICAgICMgUGFzcyB0aGUgc2xpZGVyIGluZGV4IGZvciB0aGUgZXZlbnQgYmluZGluZyBzZWxlY3RvclxuICAgIGxpc3RlblRvOiAoaW5kZXgpLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgJCgnYm9keScpLm9uICdzbGlkZXJfJytpbmRleCsnI2dvVG9TbGlkZScsIChldmVudCwgaW5kZXgpLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlIChpbmRleCArIHNlbGYub3B0aW9ucy5jYXJvdXNlbCksIHRydWUsIGZhbHNlXG5cblxuICAgICMgQWRkIGRlYnVnIG91dHB1dCB0byBzbGlkZXJcbiAgICBkZWJ1ZzogPT5cblxuICAgICAgaWYgQG9wdGlvbnMuZGVidWdcbiAgICAgICAgQCRzbGlkZXIuZmluZCgnLmRlYnVnJykucmVtb3ZlKClcbiAgICAgICAgQCRzbGlkZXIuYXBwZW5kIEBkZWJ1Z1RlbXBsYXRlXG4gICAgICAgICAgJ3NsaWRlcl9pbmRleCc6IEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICdudW1iZXJfb2Zfc2xpZGVzJzogQG51bWJlck9mU2xpZGVzXG4gICAgICAgICAgJ2N1cnJlbnRfc2xpZGUnOiBAaVNjcm9sbC5jdXJyZW50UGFnZT8ucGFnZVhcbiAgICAgICAgICAnYXV0b3Njcm9sbCc6IGlmIEBpbnRlcnZhbCB0aGVuICdlbmFibGVkJyBlbHNlICdkaXNhYmxlZCdcbiAgICAgICAgICAnbnVtYmVyX29mX25hdmlnYXRpb25zJzogQCRzbGlkZXJOYXZpZ2F0aW9uLmxlbmd0aFxuICAgICAgICAgICdzbGlkZXJfd2lkdGgnOiBAJHNsaWRlci53aWR0aCgpXG5cblxuICAgICMgUHJpbnQgb3B0aW9uIHRvIGNvbnNvbGVcbiAgICAjIENhbid0IGp1c3QgcmV0dXJuIHRoZSB2YWx1ZSB0byBkZWJ1ZyBpdCBiZWNhdXNlXG4gICAgIyBpdCB3b3VsZCBicmVhayBjaGFpbmluZyB3aXRoIHRoZSBqUXVlcnkgb2JqZWN0XG4gICAgIyBFdmVyeSBtZXRob2QgY2FsbCByZXR1cm5zIGEgalF1ZXJ5IG9iamVjdFxuICAgIGdldDogKG9wdGlvbikgLT5cbiAgICAgIGNvbnNvbGUubG9nICdvcHRpb246ICcrb3B0aW9uKycgaXMgJytAb3B0aW9uc1tvcHRpb25dXG4gICAgICBAb3B0aW9uc1tvcHRpb25dXG5cblxuICAgICMgU2V0IG9wdGlvbiB0byB0aGlzIGluc3RhbmNlcyBvcHRpb25zIGFycmF5XG4gICAgc2V0OiAob3B0aW9uLCB2YWx1ZSkgLT5cblxuICAgICAgIyBTZXQgb3B0aW9ucyB2YWx1ZVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXSA9IHZhbHVlXG5cbiAgICAgICMgSWYgbm8gaW50ZXJ2YWwgaXMgY3VycmVudGx5IHByZXNlbnQsIHN0YXJ0IGF1dG9zY3JvbGxcbiAgICAgIGlmIG9wdGlvbiA9PSAnYXV0b3Njcm9sbCcgJiYgIUBpbnRlcnZhbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgIyBUT0RPOiBVcGRhdGUgc2xpZGUgbWFyZ2luXG4gICAgICAjaWYgb3B0aW9uID09ICdzbGlkZU1hcmdpbidcbiAgICAgICAgIyBjYWNoZSBzbGlkZU1hcmdpbiBDU1Mgb24gZWxlbWVudD9cbiAgICAgICAgIyB3aGF0IGlmIHRoZSB1c2VyIHdhbnRzIHRvIHN3aXRjaCBiYWNrXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnaW5hY3RpdmVTbGlkZU9wYWNpdHknICYmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcblxuICAgICAgaWYgb3B0aW9uID09ICduYXZpZ2F0aW9uJ1xuICAgICAgICBAcmVuZGVyTmF2aWdhdGlvbigpXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbGlzdGVuVG8nXG4gICAgICAgIEBsaXN0ZW5UbyB2YWx1ZVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=