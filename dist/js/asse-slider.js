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

//# sourceMappingURL=data:application/json;base64,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QUMsQ0FBQSxnQkFBRCxDQUFBLENBQUEsQ0FERjtTQWRBO0FBaUJBLFFBQUEsSUFBRyxNQUFBLEtBQVUsVUFBYjtBQUNFLFVBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQUEsQ0FERjtTQWpCQTtlQW9CQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBdkJHO01BQUEsQ0FqZkwsQ0FBQTs7b0JBQUE7O1FBRkYsQ0FBQTtXQStnQkEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFMLENBQVk7QUFBQSxNQUFBLE1BQUEsRUFBUSxTQUFBLEdBQUE7QUFFbEIsWUFBQSxZQUFBO0FBQUEsUUFGbUIsdUJBQVEsNERBRTNCLENBQUE7ZUFBQSxJQUFDLENBQUEsSUFBRCxDQUFNLFNBQUMsS0FBRCxHQUFBO0FBQ0osY0FBQSxXQUFBO0FBQUEsVUFBQSxLQUFBLEdBQVEsQ0FBQSxDQUFFLElBQUYsQ0FBUixDQUFBO0FBQUEsVUFDQSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLENBRFAsQ0FBQTtBQUdBLFVBQUEsSUFBRyxDQUFBLElBQUg7QUFDRSxZQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxFQUFxQixDQUFDLElBQUEsR0FBVyxJQUFBLE1BQUEsQ0FBTyxJQUFQLEVBQVUsTUFBVixFQUFrQixLQUFsQixDQUFaLENBQXJCLENBQUEsQ0FERjtXQUhBO0FBTUEsVUFBQSxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLFFBQXBCO0FBQ0UsbUJBQU8sSUFBSyxDQUFBLE1BQUEsQ0FBTyxDQUFDLEtBQWIsQ0FBbUIsSUFBbkIsRUFBeUIsSUFBekIsQ0FBUCxDQURGO1dBUEk7UUFBQSxDQUFOLEVBRmtCO01BQUEsQ0FBUjtLQUFaLEVBbGhCRDtFQUFBLENBQUQsQ0FBQSxDQStoQkUsTUFBTSxDQUFDLE1BL2hCVCxFQStoQmlCLE1BL2hCakIsQ0FBQSxDQUFBO0FBQUEiLCJmaWxlIjoiYXNzZS1zbGlkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIjXG4jIFNsaWRlciBqUXVlcnkgcGx1Z2luXG4jIEF1dGhvcjogVGhvbWFzIEtsb2tvc2NoIDxtYWlsQHRob21hc2tsb2tvc2NoLmNvbT5cbiNcbigoJCwgd2luZG93KSAtPlxuXG4gICMgRGVmaW5lIHRoZSBwbHVnaW4gY2xhc3NcbiAgY2xhc3MgU2xpZGVyXG5cbiAgICBpU2Nyb2xsOiBudWxsXG4gICAgbnVtYmVyT2ZTbGlkZXM6IG51bGxcbiAgICBjdXJyZW50U2xpZGU6IDBcbiAgICBpbnRlcnZhbDogbnVsbFxuXG4gICAgJHNsaWRlcjogbnVsbFxuICAgICRzbGlkZUNvbnRhaW5lcjogbnVsbFxuICAgICRzbGlkZXM6IG51bGxcbiAgICAkc2xpZGVyTmF2aWdhdGlvbjogbnVsbFxuICAgICRzbGlkZXJMaXN0ZW5lcnM6IG51bGxcbiAgICAkc2xpZGVzSW5Db250YWluZXI6IG51bGxcblxuICAgIGRlZmF1bHRzOlxuICAgICAgYXV0b3Njcm9sbDogdHJ1ZVxuICAgICAgc3BlZWQ6IDUwMFxuICAgICAgaW50ZXJ2YWw6IDUwMDBcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgICBzbmFwOiB0cnVlXG5cbiAgICAgICMgSW4gdGhpcyBzdGF0ZSwgdGhlIHNsaWRlciBpbnN0YW5jZSBzaG91bGQgbmV2ZXIgZm9yd2FyZCBldmVudHMgdG9cbiAgICAgICMgdGhlIGlTY3JvbGwgY29tcG9uZW50LCBlLmcuIHdoZW4gdGhlIHNsaWRlciBpcyBub3QgdmlzaWJsZSAoZGlzcGxheTpub25lKVxuICAgICAgIyBhbmQgdGhlcmVmb3JlIGlTY3JvbGwgY2FuJ3QgZ2V0L3Njcm9sbCB0aGUgc2xpZGUgZWxlbWVudHNcbiAgICAgIGRpc2FibGVkOiBmYWxzZVxuXG4gICAgICAjIE5hdmlnYXRpb24gZWxlbWVudCBhcnJheVxuICAgICAgIyBlaXRoZXIgJ2luZGV4JyBmb3Igb24tc2xpZGVyIG5hdmlnYXRpb24sIGEgalF1ZXJ5IHNlbGVjdG9yIGZvciBhIHRodW1ibmFpbFxuICAgICAgIyBuYXZpZ2F0aW9uIG9yIGFub3RoZXIgc2xpZGVyIGVsZW1lbnQgZm9yIGEgc2xpZGVyIGFjdGluZyBhcyBhIHN5bmNlZCByZW1vdGVcbiAgICAgICMgbmF2aWdhdGlvbiB0byB0aGlzIHNsaWRlciBpbnN0YW5jZVxuICAgICAgbmF2aWdhdGlvbjogWydpbmRleCddXG5cbiAgICAgICMgSW5kZXggbmF2aWdhdGlvbiBkZWZhdWx0IHRlbXBsYXRlXG4gICAgICBpbmRleE5hdmlnYXRpb25UZW1wbGF0ZTogXy50ZW1wbGF0ZSgnPHVsIGNsYXNzPVwic2xpZGVyTmF2aWdhdGlvblwiPlxuICAgICAgICA8JSBfLmVhY2goc2xpZGVzLCBmdW5jdGlvbihlbGVtZW50LGluZGV4KXsgJT5cbiAgICAgICAgICA8JSBpZighY2Fyb3VzZWwgfHwgKGluZGV4Pj1jYXJvdXNlbCAmJiAoaW5kZXgrMSk8PXNsaWRlcy5sZW5ndGgtY2Fyb3VzZWwpKXsgJT5cbiAgICAgICAgICAgIDxsaSBkYXRhLWl0ZW1faW5kZXg9XCI8JT0gaW5kZXggJT5cIiBjbGFzcz1cInNsaWRlcl9uYXZpZ2F0aW9uSXRlbSBmYSBmYS1jaXJjbGUtb1wiPjwvbGk+XG4gICAgICAgICAgPCUgfSAlPlxuICAgICAgICA8JSB9KTsgJT5cbiAgICAgIDwvdWw+JylcblxuICAgICAgcHJldk5leHRCdXR0b25zOiB0cnVlXG4gICAgICBwcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByZXYgZmEgZmEtYW5nbGUtbGVmdFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibmV4dCBmYSBmYS1hbmdsZS1yaWdodFwiPjwvc3Bhbj4nKVxuXG4gICAgICAjIElmIG9uZSBvZiB0aGVzZSB2YXJpYWJsZXMgaXMgYSBqUXVlcnkgc2VsZWN0b3IsIHRoZXkgYXJlIHVzZWQgaW5zdGVhZFxuICAgICAgIyBvZiByZW5kZXJpbmcgdGhlIGFib3ZlIHRlbXBsYXRlXG4gICAgICBwcmV2QnV0dG9uU2VsZWN0b3I6IG51bGxcbiAgICAgIG5leHRCdXR0b25TZWxlY3RvcjogbnVsbFxuXG4gICAgICBzbGlkZUNvbnRhaW5lclNlbGVjdG9yOiAnLnNsaWRlQ29udGFpbmVyJ1xuICAgICAgc2xpZGVTZWxlY3RvcjogJ3VsLnNsaWRlcyA+IGxpJ1xuXG4gICAgICAjIE9wYWNpdHkgb2Ygc2xpZGVzIG90aGVyIHRoYW4gdGhlIGN1cnJlbnRcbiAgICAgICMgT25seSBhcHBsaWNhYmxlIGlmIHRoZSBzbGlkZXIgZWxlbWVudCBoYXMgb3ZlcmZsb3c6IHZpc2libGVcbiAgICAgICMgYW5kIGluYWN0aXZlIHNsaWRlcyBhcmUgc2hvd24gbmV4dCB0byB0aGUgY3VycmVudFxuICAgICAgaW5hY3RpdmVTbGlkZU9wYWNpdHk6IG51bGxcblxuICAgICAgIyBNYXJnaW4gbGVmdCBhbmQgcmlnaHQgb2YgdGhlIHNsaWRlcyBpbiBwaXhlbHNcbiAgICAgIHNsaWRlTWFyZ2luOiAwXG5cbiAgICAgICMgV2lkdGggb2YgdGhlIHNsaWRlLCBkZWZhdWx0cyB0byBhdXRvLCB0YWtlcyBhIDEwMCUgc2xpZGVyIHdpZHRoXG4gICAgICBzbGlkZVdpZHRoOiAnYXV0bydcblxuICAgICAgIyBGYWtlIGEgY2Fyb3VzZWwgZWZmZWN0IGJ5IHNob3dpbmcgdGhlIGxhc3Qgc2xpZGUgbmV4dCB0byB0aGUgZmlyc3RcbiAgICAgICMgdGhhdCBjYW4ndCBiZSBuYXZpZ2F0ZWQgdG8gYnV0IGZvcndhcmRzIHRvIHRoZSBlbmQgb2YgdGhlIHNsaWRlclxuICAgICAgIyBOdW1iZXIgaW5kaWNhdGVzIG51bWJlciBvZiBzbGlkZXMgcGFkZGluZyBsZWZ0IGFuZCByaWdodFxuICAgICAgY2Fyb3VzZWw6IDBcblxuICAgICAgIyBTbGlkZSBjbGljayBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgb25TbGlkZUNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBvbk5leHRDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnTmV4dCdcblxuICAgICAgb25QcmV2Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1ByZXYnXG5cblxuICAgIGRlYnVnVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgPGRpdiBjbGFzcz1cImRlYnVnXCI+XG4gICAgICAgIDxzcGFuPlNsaWRlcjogPCU9IHNsaWRlcl9pbmRleCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBzbGlkZXM6IDwlPSBudW1iZXJfb2Zfc2xpZGVzICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5DdXJyZW50IHNsaWRlOiA8JT0gY3VycmVudF9zbGlkZSAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+QXV0b3Njcm9sbDogPCU9IGF1dG9zY3JvbGwgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2YgbmF2aWdhdGlvbnM6IDwlPSBudW1iZXJfb2ZfbmF2aWdhdGlvbnMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPlNsaWRlciB3aWR0aDogPCU9IHNsaWRlcl93aWR0aCAlPjwvc3Bhbj5cbiAgICAgIDwvZGl2PicpXG5cblxuICAgICMgQ29uc3RydWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKGVsLCBvcHRpb25zLCBpbmRleCA9IG51bGwpIC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0cywgb3B0aW9ucylcblxuICAgICAgQCRzbGlkZXIgPSAkKGVsKVxuICAgICAgQCRzbGlkZXIuZGF0YSAnaW5kZXgnLCBpZiBAb3B0aW9ucy5pbmRleCB0aGVuICdzbGlkZXJfJytAb3B0aW9ucy5pbmRleCBlbHNlICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgaWYgQG9wdGlvbnMuaW5kZXggdGhlbiAnc2xpZGVyXycrQG9wdGlvbnMuaW5kZXggZWxzZSAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbiA9IFtdXG4gICAgICBAJHNsaWRlc0luQ29udGFpbmVyID0gbnVsbFxuXG4gICAgICBAb3B0aW9ucy5vblNsaWRlQ2xpY2sgPSAoZXZlbnQpLT5cbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIgPSBAJHNsaWRlci5maW5kIEBvcHRpb25zLnNsaWRlQ29udGFpbmVyU2VsZWN0b3JcbiAgICAgIEByZWZyZXNoU2xpZGVzKClcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgQGFkZENhcm91c2VsU2xpZGVzKClcbiAgICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgIyBFbmFibGUgc2xpZGVzIHRyb3VnaCBDU1NcbiAgICAgIEBlbmFibGVTbGlkZXMoKVxuXG4gICAgICBAaVNjcm9sbCA9IG5ldyBJU2Nyb2xsIGVsLFxuICAgICAgICBzY3JvbGxYOiB0cnVlXG4gICAgICAgIHNjcm9sbFk6IGZhbHNlXG4gICAgICAgIHNuYXA6IEBvcHRpb25zLnNuYXBcbiAgICAgICAgc25hcFNwZWVkOiA0MDBcbiAgICAgICAgdGFwOiB0cnVlXG4gICAgICAgIG1vbWVudHVtOiBmYWxzZVxuICAgICAgICBldmVudFBhc3N0aHJvdWdoOiB0cnVlXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBOZXh0IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVOZXh0RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYubmV4dFNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25OZXh0Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICAjIFByZXYgZXZlbnQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZVByZXZFdmVudCA9IChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuXG4gICAgICAgICMgQ2hlY2sgaWYgcHJldi9uZXh0IGJ1dHRvbiBzZWxlY3RvcnMgYXJlIHNldCBpbiBvcHRpb25zLFxuICAgICAgICAjIGFuZCBpZiBzbywgdXNlIHRoZW0gaW5zdGVhZCBvZiByZW5kZXJpbmcgdGVtcGxhdGVcbiAgICAgICAgaWYgQG9wdGlvbnMucHJldkJ1dHRvblNlbGVjdG9yIG9yIEBvcHRpb25zLm5leHRCdXR0b25TZWxlY3RvclxuXG4gICAgICAgICAgIyBXZSBjYW4ndCB1c2UgdGhlIGN1c3RvbSAndGFwJyBldmVudCBvdXRzaWRlIG9mIHRoZSBpU2Nyb2xsIGVsZW1lbnRcbiAgICAgICAgICAjIFRoZXJlZm9yZSB3ZSBoYXZlIHRvIGJpbmQgY2xpY2sgYW5kIHRvdWNoc3RhcnQgZXZlbnRzIGJvdGggdG9cbiAgICAgICAgICAjIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvclxuICAgICAgICAgICAgJCgnYm9keScpLm9uICdjbGljaycsIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciwgaGFuZGxlUHJldkV2ZW50XG5cbiAgICAgICAgICBpZiBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3IsIGhhbmRsZU5leHRFdmVudFxuXG4gICAgICAgICMgTm8gc2VsZWN0b3JzIHNldCwgcmVuZGVyIHRlbXBsYXRlXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZSgpXG5cbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ucHJldicsIGhhbmRsZVByZXZFdmVudFxuICAgICAgICAgIEAkc2xpZGVyLm9uICd0YXAnLCAnc3Bhbi5uZXh0JywgaGFuZGxlTmV4dEV2ZW50XG5cblxuICAgICMgQWRkIG5hdmlnYXRpb25cbiAgICByZW5kZXJOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIERlbGV0ZSBvbGQgc2xpZGVyIG5hdmlnYXRpb24gZWxlbWVudHNcbiAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCktPlxuICAgICAgICBpZiAhZWxlbWVudC5kYXRhKCdTbGlkZXInKVxuICAgICAgICAgICQoZWxlbWVudCkucmVtb3ZlKClcblxuICAgICAgXy5lYWNoIEBvcHRpb25zLm5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCwgbGlzdCk9PlxuXG4gICAgICAgIGlmIGVsZW1lbnQgPT0gJ2luZGV4J1xuXG4gICAgICAgICAgIyBDcmVhdGUgYSBqUXVlcnkgb2JqZWN0IGRpcmVjdGx5IGZyb20gc2xpZGVyIGNvZGVcbiAgICAgICAgICBuZXdFbGVtZW50ID0gQG9wdGlvbnMuaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGUoeydzbGlkZXMnOiBAJHNsaWRlcywgJ2Nhcm91c2VsJzogQG9wdGlvbnMuY2Fyb3VzZWx9KVxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoICQobmV3RWxlbWVudClcblxuICAgICAgICAgICMgQXBwZW5kIGl0IHRvIHNsaWRlciBlbGVtZW50XG4gICAgICAgICAgQCRzbGlkZXIuYXBwZW5kIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pXG5cbiAgICAgICAgICAjIFJlc2l6ZSBuYXZpZ2F0aW9uXG4gICAgICAgICAgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY3NzXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAtKF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLndpZHRoKCkgLyAyKVxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleCtwYXJzZUludChzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpXG4gICAgICAgICAgICAgIGl0ZW0uYWRkQ2xhc3MgJ3NsaWRlcl9uYXZpZ2F0aW9uSXRlbSdcbiAgICAgICAgICAgICAgaXRlbS5vbiAndGFwJywgKGV2ZW50KS0+XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKVxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgVXBkYXRlIG5hdmlnYXRpb24gc3RhdHVzXG4gICAgdXBkYXRlTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcbiAgICAgIGluZGV4ID0gQGN1cnJlbnRTbGlkZVxuXG4gICAgICBpZiAhQG9wdGlvbnMuZGlzYWJsZWRcblxuICAgICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCktPlxuXG4gICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5zbGlkZXJfbmF2aWdhdGlvbkl0ZW0nKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgIC5maWx0ZXIgKCktPiAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKSA9PSBpbmRleFxuICAgICAgICAgICAgICAuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogKGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHkgJiYgYW5pbWF0ZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIGZhbHNlXG5cbiAgICAgIEAkc2xpZGVzLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFNldCBzbGlkZSBvcGFjaXR5IGZvciBhY3RpdmUgYW5kIGluYWN0aXZlIHNsaWRlc1xuICAgIHNldFNsaWRlT3BhY2l0eTogKGFjdGl2ZSwgaW5hY3RpdmUsIGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG5cblxuICAgICMgRXZlbnQgY2FsbGJhY2sgb24gc2Nyb2xsIGVuZFxuICAgIG9uU2Nyb2xsRW5kOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIElmIFNsaWRlciBzaG93cyBtb3JlIHRoYW4gb25lIHNsaWRlIHBlciBwYWdlXG4gICAgICAjIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnRTbGlkZSBpcyBvbiB0aGVcbiAgICAgICMgbGFzdCBwYWdlIGFuZCBoaWdoZXIgdGhhbiB0aGUgb25lIHNuYXBwZWQgdG9cbiAgICAgIGlmIEBzbGlkZXNJbkNvbnRhaW5lciA+IDFcbiAgICAgICAgaWYgQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVggPCBAbnVtYmVyT2ZTbGlkZXMgLSBAc2xpZGVzSW5Db250YWluZXJcbiAgICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcbiAgICAgIGVsc2VcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICMgSWYgbGFzdCBzbGlkZSwgcmV0dXJuIHRvIGZpcnN0XG4gICAgICAgIGlmIEBjdXJyZW50U2xpZGUgPj0gQG51bWJlck9mU2xpZGVzLUBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAb3B0aW9ucy5jYXJvdXNlbCArIChAY3VycmVudFNsaWRlIC0gKEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbCkpLCBmYWxzZSwgZmFsc2VcbiAgICAgICAgIyBJZiBmaXJzdCBzbGlkZSwgbW92ZSB0byBsYXN0XG4gICAgICAgIGVsc2UgaWYgQGN1cnJlbnRTbGlkZSA8IEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAbnVtYmVyT2ZTbGlkZXMgLSAoQG9wdGlvbnMuY2Fyb3VzZWwrMSksIGZhbHNlLCBmYWxzZVxuXG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgVXNlciB0b3VjaGVzIHRoZSBzY3JlZW4gYnV0IHNjcm9sbGluZyBkaWRuJ3Qgc3RhcnQgeWV0XG4gICAgb25CZWZvcmVTY3JvbGxTdGFydDogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBSZXNpemUgc2xpZGVyXG4gICAgcmVzaXplOiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5zbGlkZVdpZHRoID09ICdhdXRvJ1xuICAgICAgICBAJHNsaWRlcy53aWR0aCBAJHNsaWRlci5vdXRlcldpZHRoKClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMud2lkdGggcGFyc2VJbnQoQG9wdGlvbnMuc2xpZGVXaWR0aCkgKyAncHgnXG5cbiAgICAgICMgQ2FsY3VsYXRlIGNvbnRhaW5lciB3aWR0aFxuICAgICAgIyBBIHBvc3NpYmxlIG1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgZWxlbWVudHMgbWFrZXMgdGhpc1xuICAgICAgIyBhIGxpdHRsZSBtb3JlIHRyaWNreSB0aGFuIGl0IHNlZW1zLCB3ZSBkbyBub3Qgb25seSBuZWVkIHRvXG4gICAgICAjIG11bHRpcGx5IGFsbCBlbGVtZW50cyArIHRoZWlyIHJlc3BlY3RpdmUgc2lkZSBtYXJnaW5zIGxlZnQgYW5kXG4gICAgICAjIHJpZ2h0LCB3ZSBhbHNvIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQgdGhhdCB0aGUgZmlyc3QgYW5kIGxhc3RcbiAgICAgICMgZWxlbWVudCBtaWdodCBoYXZlIGEgZGlmZmVyZW50IG1hcmdpbiB0b3dhcmRzIHRoZSBiZWdpbm5pbmcgYW5kXG4gICAgICAjIGVuZCBvZiB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICBzbGlkZVdpZHRoID0gKEAkc2xpZGVzLm91dGVyV2lkdGgoKSArIChAb3B0aW9ucy5zbGlkZU1hcmdpbiAqIDIpKVxuICAgICAgY29udGFpbmVyV2lkdGggPSAgc2xpZGVXaWR0aCAqIEBudW1iZXJPZlNsaWRlc1xuXG4gICAgICAjIFJlbW92ZSBsYXN0IGFuZCBmaXJzdCBlbGVtZW50IGJvcmRlciBtYXJnaW5zXG4gICAgICBjb250YWluZXJXaWR0aCAtPSBAb3B0aW9ucy5zbGlkZU1hcmdpbiAqIDJcblxuICAgICAgIyBBZGQgd2hhdGV2ZXIgbWFyZ2luIHRoZXNlIHR3byBlbGVtZW50cyBoYXZlXG4gICAgICBjb250YWluZXJXaWR0aCArPSBwYXJzZUZsb2F0IEAkc2xpZGVzLmZpcnN0KCkuY3NzKCdtYXJnaW4tbGVmdCcpXG4gICAgICBjb250YWluZXJXaWR0aCArPSBwYXJzZUZsb2F0IEAkc2xpZGVzLmxhc3QoKS5jc3MoJ21hcmdpbi1yaWdodCcpXG5cbiAgICAgICMgRGV0ZXJtaW5lIHRoZSBhbW91bnQgb2Ygc2xpZGVzIHRoYXQgY2FuIGZpdCBpbnNpZGUgdGhlIHNsaWRlIGNvbnRhaW5lclxuICAgICAgIyBXZSBuZWVkIHRoaXMgZm9yIHRoZSBvblNjcm9sbEVuZCBldmVudCwgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnQgc2xpZGVcbiAgICAgICMgaXMgYWxyZWFkeSBvbiB0aGUgbGFzdCBwYWdlXG4gICAgICBAc2xpZGVzSW5Db250YWluZXIgPSBNYXRoLmNlaWwgQCRzbGlkZXIud2lkdGgoKSAvIHNsaWRlV2lkdGhcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lci53aWR0aCBjb250YWluZXJXaWR0aFxuICAgICAgQCRzbGlkZUNvbnRhaW5lci5oZWlnaHQgQCRzbGlkZXIuaGVpZ2h0KClcblxuICAgICAgaWYgQGlTY3JvbGxcbiAgICAgICAgQGlTY3JvbGwucmVmcmVzaCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cblxuICAgICMgQmluZCBldmVudHNcbiAgICBiaW5kRXZlbnRzOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAaVNjcm9sbC5vbiAnc2Nyb2xsRW5kJywgQG9uU2Nyb2xsRW5kXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdiZWZvcmVTY3JvbGxTdGFydCcsIEBvbkJlZm9yZVNjcm9sbFN0YXJ0XG5cbiAgICAgIEAkc2xpZGVzLm9uICd0YXAnLCAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25TbGlkZUNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25TbGlkZUNsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gQGN1cnJlbnRTbGlkZSsxXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZSsxXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gMFxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gcHJldmlvdXMgc2xpZGVcbiAgICBwcmV2U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBjdXJyZW50U2xpZGUtMSA+PSAwXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZS0xXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQG51bWJlck9mU2xpZGVzLTFcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHNsaWRlIGluZGV4XG4gICAgZ29Ub1NsaWRlOiAoaW5kZXgsIGFuaW1hdGU9dHJ1ZSwgdHJpZ2dlckV2ZW50PXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgaWYgdHJpZ2dlckV2ZW50XG4gICAgICAgICQoJ2JvZHknKS50cmlnZ2VyIEAkc2xpZGVyLmRhdGEoJ2luZGV4JykrJyNnb1RvU2xpZGUnLCBpbmRleCAtIEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgQWRkIGZha2UgY2Fyb3VzZWwgc2xpZGVzXG4gICAgYWRkQ2Fyb3VzZWxTbGlkZXM6IC0+XG5cbiAgICAgIEAkc3RhcnRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKC1Ab3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuICAgICAgQCRlbmRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKDAsQG9wdGlvbnMuY2Fyb3VzZWwpLmNsb25lKClcblxuICAgICAgQCRzbGlkZXMucGFyZW50KCkucHJlcGVuZCBAJHN0YXJ0RWxlbWVudHNcbiAgICAgIEAkc2xpZGVzLnBhcmVudCgpLmFwcGVuZCBAJGVuZEVsZW1lbnRzXG5cblxuICAgICMgU3RhcnQgYXV0b3Njcm9sbFxuICAgIHN0YXJ0QXV0b1Njcm9sbDogPT5cblxuICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQG5leHRTbGlkZSwgQG9wdGlvbnMuaW50ZXJ2YWxcblxuXG4gICAgIyBTdG9wIGF1dG9zY3JvbGxcbiAgICBzdG9wQXV0b1Njcm9sbDogPT5cblxuICAgICAgY2xlYXJJbnRlcnZhbCBAaW50ZXJ2YWxcbiAgICAgIEBpbnRlcnZhbCA9IG51bGxcblxuXG4gICAgIyBMaXN0ZW4gdG8gYW5vdGhlciBzbGlkZXIgZm9yIG5hdmlnYXRpb25cbiAgICAjIFBhc3MgdGhlIHNsaWRlciBpbmRleCBmb3IgdGhlIGV2ZW50IGJpbmRpbmcgc2VsZWN0b3JcbiAgICBsaXN0ZW5UbzogKGluZGV4KS0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICQoJ2JvZHknKS5vbiAnc2xpZGVyXycraW5kZXgrJyNnb1RvU2xpZGUnLCAoZXZlbnQsIGluZGV4KS0+XG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAoaW5kZXggKyBzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpLCB0cnVlLCBmYWxzZVxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBpZiBvcHRpb24gPT0gJ2xpc3RlblRvJ1xuICAgICAgICBAbGlzdGVuVG8gdmFsdWVcblxuICAgICAgQGRlYnVnKClcblxuXG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpblxuICAkLmZuLmV4dGVuZCBTbGlkZXI6IChvcHRpb24sIGFyZ3MuLi4pIC0+XG5cbiAgICBAZWFjaCAoaW5kZXgpLT5cbiAgICAgICR0aGlzID0gJChAKVxuICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgIGlmICFkYXRhXG4gICAgICAgICR0aGlzLmRhdGEgJ1NsaWRlcicsIChkYXRhID0gbmV3IFNsaWRlcihALCBvcHRpb24sIGluZGV4KSlcblxuICAgICAgaWYgdHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJ1xuICAgICAgICByZXR1cm4gZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpXG5cblxuKSB3aW5kb3cualF1ZXJ5LCB3aW5kb3dcblxuIl19