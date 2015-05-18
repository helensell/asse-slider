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
        onSlideClick: function(event) {
          return this.goToSlide($(event.currentTarget).index());
        },
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
        this.$slideContainer = this.$slider.find(this.options.slideContainerSelector);
        this.refreshSlides();
        if (this.options.carousel) {
          if (this.options.carousel > this.$slideContainer.find(this.options.slideSelector).length) {
            this.options.carousel = this.$slideContainer.find(this.options.slideSelector).length;
          }
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
          self.options.onStart.apply(this, []);
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

      Slider.prototype.onScrollEnd = function(event) {
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
            return self.options.onSlideClick.apply(self, [event]);
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

//# sourceMappingURL=data:application/json;base64,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QSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLFVBQ0EsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQURQLENBQUE7QUFHQSxVQUFBLElBQUcsQ0FBQSxJQUFIO0FBQ0UsWUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsRUFBcUIsQ0FBQyxJQUFBLEdBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBWixDQUFyQixDQUFBLENBREY7V0FIQTtBQU1BLFVBQUEsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixRQUFwQjtBQUNFLG1CQUFPLElBQUssQ0FBQSxNQUFBLENBQU8sQ0FBQyxLQUFiLENBQW1CLElBQW5CLEVBQXlCLElBQXpCLENBQVAsQ0FERjtXQVBJO1FBQUEsQ0FBTixFQUZrQjtNQUFBLENBQVI7S0FBWixFQWppQkQ7RUFBQSxDQUFELENBQUEsQ0E4aUJFLE1BQU0sQ0FBQyxNQTlpQlQsRUE4aUJpQixNQTlpQmpCLENBQUEsQ0FBQTtBQUFBIiwiZmlsZSI6ImFzc2Utc2xpZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiI1xuIyBTbGlkZXIgalF1ZXJ5IHBsdWdpblxuIyBBdXRob3I6IFRob21hcyBLbG9rb3NjaCA8bWFpbEB0aG9tYXNrbG9rb3NjaC5jb20+XG4jXG4oKCQsIHdpbmRvdykgLT5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luIGNsYXNzXG4gIGNsYXNzIFNsaWRlclxuXG4gICAgaVNjcm9sbDogbnVsbFxuICAgIG51bWJlck9mU2xpZGVzOiBudWxsXG4gICAgY3VycmVudFNsaWRlOiAwXG4gICAgaW50ZXJ2YWw6IG51bGxcblxuICAgICRzbGlkZXI6IG51bGxcbiAgICAkc2xpZGVDb250YWluZXI6IG51bGxcbiAgICAkc2xpZGVzOiBudWxsXG4gICAgJHNsaWRlck5hdmlnYXRpb246IG51bGxcbiAgICAkc2xpZGVyTGlzdGVuZXJzOiBudWxsXG4gICAgJHNsaWRlc0luQ29udGFpbmVyOiBudWxsXG5cbiAgICBkZWZhdWx0czpcbiAgICAgIGF1dG9zY3JvbGw6IHRydWVcbiAgICAgIHNwZWVkOiA1MDBcbiAgICAgIGludGVydmFsOiA1MDAwXG4gICAgICBkZWJ1ZzogdHJ1ZVxuICAgICAgc25hcDogdHJ1ZVxuXG4gICAgICAjIEluIHRoaXMgc3RhdGUsIHRoZSBzbGlkZXIgaW5zdGFuY2Ugc2hvdWxkIG5ldmVyIGZvcndhcmQgZXZlbnRzIHRvXG4gICAgICAjIHRoZSBpU2Nyb2xsIGNvbXBvbmVudCwgZS5nLiB3aGVuIHRoZSBzbGlkZXIgaXMgbm90IHZpc2libGUgKGRpc3BsYXk6bm9uZSlcbiAgICAgICMgYW5kIHRoZXJlZm9yZSBpU2Nyb2xsIGNhbid0IGdldC9zY3JvbGwgdGhlIHNsaWRlIGVsZW1lbnRzXG4gICAgICBkaXNhYmxlZDogZmFsc2VcblxuICAgICAgIyBOYXZpZ2F0aW9uIGVsZW1lbnQgYXJyYXlcbiAgICAgICMgZWl0aGVyICdpbmRleCcgZm9yIG9uLXNsaWRlciBuYXZpZ2F0aW9uLCBhIGpRdWVyeSBzZWxlY3RvciBmb3IgYSB0aHVtYm5haWxcbiAgICAgICMgbmF2aWdhdGlvbiBvciBhbm90aGVyIHNsaWRlciBlbGVtZW50IGZvciBhIHNsaWRlciBhY3RpbmcgYXMgYSBzeW5jZWQgcmVtb3RlXG4gICAgICAjIG5hdmlnYXRpb24gdG8gdGhpcyBzbGlkZXIgaW5zdGFuY2VcbiAgICAgIG5hdmlnYXRpb246IFsnaW5kZXgnXVxuXG4gICAgICAjIEluZGV4IG5hdmlnYXRpb24gZGVmYXVsdCB0ZW1wbGF0ZVxuICAgICAgaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGU6IF8udGVtcGxhdGUoJzx1bCBjbGFzcz1cInNsaWRlck5hdmlnYXRpb25cIj5cbiAgICAgICAgPCUgXy5lYWNoKHNsaWRlcywgZnVuY3Rpb24oZWxlbWVudCxpbmRleCl7ICU+XG4gICAgICAgICAgPCUgaWYoIWNhcm91c2VsIHx8IChpbmRleD49Y2Fyb3VzZWwgJiYgKGluZGV4KzEpPD1zbGlkZXMubGVuZ3RoLWNhcm91c2VsKSl7ICU+XG4gICAgICAgICAgICA8bGkgZGF0YS1pdGVtX2luZGV4PVwiPCU9IGluZGV4ICU+XCIgY2xhc3M9XCJzbGlkZXJfbmF2aWdhdGlvbkl0ZW0gZmEgZmEtY2lyY2xlLW9cIj48L2xpPlxuICAgICAgICAgIDwlIH0gJT5cbiAgICAgICAgPCUgfSk7ICU+XG4gICAgICA8L3VsPicpXG5cbiAgICAgIHByZXZOZXh0QnV0dG9uczogdHJ1ZVxuICAgICAgcHJldk5leHRCdXR0b25zVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2IGZhIGZhLWFuZ2xlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5leHQgZmEgZmEtYW5nbGUtcmlnaHRcIj48L3NwYW4+JylcblxuICAgICAgIyBJZiBvbmUgb2YgdGhlc2UgdmFyaWFibGVzIGlzIGEgalF1ZXJ5IHNlbGVjdG9yLCB0aGV5IGFyZSB1c2VkIGluc3RlYWRcbiAgICAgICMgb2YgcmVuZGVyaW5nIHRoZSBhYm92ZSB0ZW1wbGF0ZVxuICAgICAgcHJldkJ1dHRvblNlbGVjdG9yOiBudWxsXG4gICAgICBuZXh0QnV0dG9uU2VsZWN0b3I6IG51bGxcblxuICAgICAgc2xpZGVDb250YWluZXJTZWxlY3RvcjogJy5zbGlkZUNvbnRhaW5lcidcbiAgICAgIHNsaWRlU2VsZWN0b3I6ICd1bC5zbGlkZXMgPiBsaSdcblxuICAgICAgIyBPcGFjaXR5IG9mIHNsaWRlcyBvdGhlciB0aGFuIHRoZSBjdXJyZW50XG4gICAgICAjIE9ubHkgYXBwbGljYWJsZSBpZiB0aGUgc2xpZGVyIGVsZW1lbnQgaGFzIG92ZXJmbG93OiB2aXNpYmxlXG4gICAgICAjIGFuZCBpbmFjdGl2ZSBzbGlkZXMgYXJlIHNob3duIG5leHQgdG8gdGhlIGN1cnJlbnRcbiAgICAgIGluYWN0aXZlU2xpZGVPcGFjaXR5OiBudWxsXG5cbiAgICAgICMgTWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBzbGlkZXMgaW4gcGl4ZWxzXG4gICAgICBzbGlkZU1hcmdpbjogMFxuXG4gICAgICAjIFdpZHRoIG9mIHRoZSBzbGlkZSwgZGVmYXVsdHMgdG8gYXV0bywgdGFrZXMgYSAxMDAlIHNsaWRlciB3aWR0aFxuICAgICAgc2xpZGVXaWR0aDogJ2F1dG8nXG5cbiAgICAgICMgRmFrZSBhIGNhcm91c2VsIGVmZmVjdCBieSBzaG93aW5nIHRoZSBsYXN0IHNsaWRlIG5leHQgdG8gdGhlIGZpcnN0XG4gICAgICAjIHRoYXQgY2FuJ3QgYmUgbmF2aWdhdGVkIHRvIGJ1dCBmb3J3YXJkcyB0byB0aGUgZW5kIG9mIHRoZSBzbGlkZXJcbiAgICAgICMgTnVtYmVyIGluZGljYXRlcyBudW1iZXIgb2Ygc2xpZGVzIHBhZGRpbmcgbGVmdCBhbmQgcmlnaHRcbiAgICAgIGNhcm91c2VsOiAwXG5cbiAgICAgICMgQ2FsbGJhY2sgb24gc2xpZGVyIGluaXRpYWxpemF0aW9uXG4gICAgICBvblN0YXJ0OiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdTdGFydCdcblxuICAgICAgIyBTbGlkZSBjbGljayBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgb25TbGlkZUNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgQGdvVG9TbGlkZSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcbiAgICAgICAgI2NvbnNvbGUubG9nICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBvbk5leHRDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnTmV4dCdcblxuICAgICAgb25QcmV2Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1ByZXYnXG5cbiAgICAgIG9uU2Nyb2xsRW5kOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdFbmQnXG5cblxuICAgIGRlYnVnVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgPGRpdiBjbGFzcz1cImRlYnVnXCI+XG4gICAgICAgIDxzcGFuPlNsaWRlcjogPCU9IHNsaWRlcl9pbmRleCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBzbGlkZXM6IDwlPSBudW1iZXJfb2Zfc2xpZGVzICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5DdXJyZW50IHNsaWRlOiA8JT0gY3VycmVudF9zbGlkZSAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+QXV0b3Njcm9sbDogPCU9IGF1dG9zY3JvbGwgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2YgbmF2aWdhdGlvbnM6IDwlPSBudW1iZXJfb2ZfbmF2aWdhdGlvbnMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPlNsaWRlciB3aWR0aDogPCU9IHNsaWRlcl93aWR0aCAlPjwvc3Bhbj5cbiAgICAgIDwvZGl2PicpXG5cblxuICAgICMgQ29uc3RydWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKGVsLCBvcHRpb25zLCBpbmRleCA9IG51bGwpIC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0cywgb3B0aW9ucylcblxuICAgICAgQCRzbGlkZXIgPSAkKGVsKVxuICAgICAgQCRzbGlkZXIuZGF0YSAnaW5kZXgnLCBpZiBAb3B0aW9ucy5pbmRleCB0aGVuICdzbGlkZXJfJytAb3B0aW9ucy5pbmRleCBlbHNlICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgaWYgQG9wdGlvbnMuaW5kZXggdGhlbiAnc2xpZGVyXycrQG9wdGlvbnMuaW5kZXggZWxzZSAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbiA9IFtdXG4gICAgICBAJHNsaWRlc0luQ29udGFpbmVyID0gbnVsbFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyID0gQCRzbGlkZXIuZmluZCBAb3B0aW9ucy5zbGlkZUNvbnRhaW5lclNlbGVjdG9yXG4gICAgICBAcmVmcmVzaFNsaWRlcygpXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWwgPiBAJHNsaWRlQ29udGFpbmVyLmZpbmQoQG9wdGlvbnMuc2xpZGVTZWxlY3RvcikubGVuZ3RoXG4gICAgICAgICAgQG9wdGlvbnMuY2Fyb3VzZWwgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQoQG9wdGlvbnMuc2xpZGVTZWxlY3RvcikubGVuZ3RoXG5cbiAgICAgICAgQGFkZENhcm91c2VsU2xpZGVzKClcbiAgICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgIyBFbmFibGUgc2xpZGVzIHRyb3VnaCBDU1NcbiAgICAgIEBlbmFibGVTbGlkZXMoKVxuXG4gICAgICBAaVNjcm9sbCA9IG5ldyBJU2Nyb2xsIGVsLFxuICAgICAgICBzY3JvbGxYOiB0cnVlXG4gICAgICAgIHNjcm9sbFk6IGZhbHNlXG4gICAgICAgIHNuYXA6IEBvcHRpb25zLnNuYXBcbiAgICAgICAgc25hcFNwZWVkOiA0MDBcbiAgICAgICAgdGFwOiB0cnVlXG4gICAgICAgIG1vbWVudHVtOiBmYWxzZVxuICAgICAgICBldmVudFBhc3N0aHJvdWdoOiB0cnVlXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuXG4gICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU3RhcnQgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBzZWxmLm9wdGlvbnMub25TdGFydC5hcHBseShALCBbXSlcblxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBOZXh0IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVOZXh0RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYubmV4dFNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25OZXh0Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICAjIFByZXYgZXZlbnQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZVByZXZFdmVudCA9IChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuXG4gICAgICAgICMgQ2hlY2sgaWYgcHJldi9uZXh0IGJ1dHRvbiBzZWxlY3RvcnMgYXJlIHNldCBpbiBvcHRpb25zLFxuICAgICAgICAjIGFuZCBpZiBzbywgdXNlIHRoZW0gaW5zdGVhZCBvZiByZW5kZXJpbmcgdGVtcGxhdGVcbiAgICAgICAgaWYgQG9wdGlvbnMucHJldkJ1dHRvblNlbGVjdG9yIG9yIEBvcHRpb25zLm5leHRCdXR0b25TZWxlY3RvclxuXG4gICAgICAgICAgIyBXZSBjYW4ndCB1c2UgdGhlIGN1c3RvbSAndGFwJyBldmVudCBvdXRzaWRlIG9mIHRoZSBpU2Nyb2xsIGVsZW1lbnRcbiAgICAgICAgICAjIFRoZXJlZm9yZSB3ZSBoYXZlIHRvIGJpbmQgY2xpY2sgYW5kIHRvdWNoc3RhcnQgZXZlbnRzIGJvdGggdG9cbiAgICAgICAgICAjIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvclxuICAgICAgICAgICAgJCgnYm9keScpLm9uICdjbGljaycsIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciwgaGFuZGxlUHJldkV2ZW50XG5cbiAgICAgICAgICBpZiBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3IsIGhhbmRsZU5leHRFdmVudFxuXG4gICAgICAgICMgTm8gc2VsZWN0b3JzIHNldCwgcmVuZGVyIHRlbXBsYXRlXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZSgpXG5cbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ucHJldicsIGhhbmRsZVByZXZFdmVudFxuICAgICAgICAgIEAkc2xpZGVyLm9uICd0YXAnLCAnc3Bhbi5uZXh0JywgaGFuZGxlTmV4dEV2ZW50XG5cblxuICAgICMgQWRkIG5hdmlnYXRpb25cbiAgICByZW5kZXJOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIERlbGV0ZSBvbGQgc2xpZGVyIG5hdmlnYXRpb24gZWxlbWVudHNcbiAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCktPlxuICAgICAgICBpZiAhZWxlbWVudC5kYXRhKCdTbGlkZXInKVxuICAgICAgICAgICQoZWxlbWVudCkucmVtb3ZlKClcblxuICAgICAgXy5lYWNoIEBvcHRpb25zLm5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCwgbGlzdCk9PlxuXG4gICAgICAgIGlmIGVsZW1lbnQgPT0gJ2luZGV4J1xuXG4gICAgICAgICAgIyBDcmVhdGUgYSBqUXVlcnkgb2JqZWN0IGRpcmVjdGx5IGZyb20gc2xpZGVyIGNvZGVcbiAgICAgICAgICBuZXdFbGVtZW50ID0gQG9wdGlvbnMuaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGUoeydzbGlkZXMnOiBAJHNsaWRlcywgJ2Nhcm91c2VsJzogQG9wdGlvbnMuY2Fyb3VzZWx9KVxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoICQobmV3RWxlbWVudClcblxuICAgICAgICAgICMgQXBwZW5kIGl0IHRvIHNsaWRlciBlbGVtZW50XG4gICAgICAgICAgQCRzbGlkZXIuYXBwZW5kIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pXG5cbiAgICAgICAgICAjIFJlc2l6ZSBuYXZpZ2F0aW9uXG4gICAgICAgICAgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY3NzXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAtKF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLndpZHRoKCkgLyAyKVxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleCtwYXJzZUludChzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpXG4gICAgICAgICAgICAgIGl0ZW0uYWRkQ2xhc3MgJ3NsaWRlcl9uYXZpZ2F0aW9uSXRlbSdcbiAgICAgICAgICAgICAgaXRlbS5vbiAnY2xpY2snLCAoZXZlbnQpLT5cbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKVxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgVXBkYXRlIG5hdmlnYXRpb24gc3RhdHVzXG4gICAgdXBkYXRlTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcbiAgICAgIGluZGV4ID0gQGN1cnJlbnRTbGlkZVxuXG4gICAgICBpZiAhQG9wdGlvbnMuZGlzYWJsZWRcblxuICAgICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCktPlxuXG4gICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5zbGlkZXJfbmF2aWdhdGlvbkl0ZW0nKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgIC5maWx0ZXIgKCktPiAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKSA9PSBpbmRleFxuICAgICAgICAgICAgICAuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogKGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHkgJiYgYW5pbWF0ZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIGZhbHNlXG5cbiAgICAgIEAkc2xpZGVzLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFNldCBzbGlkZSBvcGFjaXR5IGZvciBhY3RpdmUgYW5kIGluYWN0aXZlIHNsaWRlc1xuICAgIHNldFNsaWRlT3BhY2l0eTogKGFjdGl2ZSwgaW5hY3RpdmUsIGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG5cblxuICAgICMgRXZlbnQgY2FsbGJhY2sgb24gc2Nyb2xsIGVuZFxuICAgIG9uU2Nyb2xsRW5kOiAoZXZlbnQpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBJZiBTbGlkZXIgc2hvd3MgbW9yZSB0aGFuIG9uZSBzbGlkZSBwZXIgcGFnZVxuICAgICAgIyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50U2xpZGUgaXMgb24gdGhlXG4gICAgICAjIGxhc3QgcGFnZSBhbmQgaGlnaGVyIHRoYW4gdGhlIG9uZSBzbmFwcGVkIHRvXG4gICAgICBpZiBAc2xpZGVzSW5Db250YWluZXIgPiAxXG4gICAgICAgIGlmIEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYIDwgQG51bWJlck9mU2xpZGVzIC0gQHNsaWRlc0luQ29udGFpbmVyXG4gICAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAjIElmIGxhc3Qgc2xpZGUsIHJldHVybiB0byBmaXJzdFxuICAgICAgICBpZiBAY3VycmVudFNsaWRlID49IEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG9wdGlvbnMuY2Fyb3VzZWwgKyAoQGN1cnJlbnRTbGlkZSAtIChAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWwpKSwgZmFsc2UsIGZhbHNlXG4gICAgICAgICMgSWYgZmlyc3Qgc2xpZGUsIG1vdmUgdG8gbGFzdFxuICAgICAgICBlbHNlIGlmIEBjdXJyZW50U2xpZGUgPCBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG51bWJlck9mU2xpZGVzIC0gKEBvcHRpb25zLmNhcm91c2VsKzEpLCBmYWxzZSwgZmFsc2VcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZCA9PSAnZnVuY3Rpb24nXG4gICAgICAgIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZC5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoc2VsZiwgW2V2ZW50XSlcblxuICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gQGN1cnJlbnRTbGlkZSsxXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZSsxXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gMFxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gcHJldmlvdXMgc2xpZGVcbiAgICBwcmV2U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBjdXJyZW50U2xpZGUtMSA+PSAwXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZS0xXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQG51bWJlck9mU2xpZGVzLTFcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHNsaWRlIGluZGV4XG4gICAgZ29Ub1NsaWRlOiAoaW5kZXgsIGFuaW1hdGU9dHJ1ZSwgdHJpZ2dlckV2ZW50PXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgaWYgdHJpZ2dlckV2ZW50XG4gICAgICAgICQoJ2JvZHknKS50cmlnZ2VyIEAkc2xpZGVyLmRhdGEoJ2luZGV4JykrJyNnb1RvU2xpZGUnLCBpbmRleCAtIEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgQWRkIGZha2UgY2Fyb3VzZWwgc2xpZGVzXG4gICAgYWRkQ2Fyb3VzZWxTbGlkZXM6IC0+XG5cbiAgICAgIEAkc3RhcnRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKC1Ab3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuICAgICAgQCRlbmRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKDAsQG9wdGlvbnMuY2Fyb3VzZWwpLmNsb25lKClcblxuICAgICAgQCRzbGlkZXMucGFyZW50KCkucHJlcGVuZCBAJHN0YXJ0RWxlbWVudHNcbiAgICAgIEAkc2xpZGVzLnBhcmVudCgpLmFwcGVuZCBAJGVuZEVsZW1lbnRzXG5cblxuICAgICMgU3RhcnQgYXV0b3Njcm9sbFxuICAgIHN0YXJ0QXV0b1Njcm9sbDogPT5cblxuICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQG5leHRTbGlkZSwgQG9wdGlvbnMuaW50ZXJ2YWxcblxuXG4gICAgIyBTdG9wIGF1dG9zY3JvbGxcbiAgICBzdG9wQXV0b1Njcm9sbDogPT5cblxuICAgICAgY2xlYXJJbnRlcnZhbCBAaW50ZXJ2YWxcbiAgICAgIEBpbnRlcnZhbCA9IG51bGxcblxuXG4gICAgIyBMaXN0ZW4gdG8gYW5vdGhlciBzbGlkZXIgZm9yIG5hdmlnYXRpb25cbiAgICAjIFBhc3MgdGhlIHNsaWRlciBpbmRleCBmb3IgdGhlIGV2ZW50IGJpbmRpbmcgc2VsZWN0b3JcbiAgICBsaXN0ZW5UbzogKGluZGV4KS0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICQoJ2JvZHknKS5vbiAnc2xpZGVyXycraW5kZXgrJyNnb1RvU2xpZGUnLCAoZXZlbnQsIGluZGV4KS0+XG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAoaW5kZXggKyBzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpLCB0cnVlLCBmYWxzZVxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBpZiBvcHRpb24gPT0gJ2xpc3RlblRvJ1xuICAgICAgICBAbGlzdGVuVG8gdmFsdWVcblxuICAgICAgQGRlYnVnKClcblxuXG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpblxuICAkLmZuLmV4dGVuZCBTbGlkZXI6IChvcHRpb24sIGFyZ3MuLi4pIC0+XG5cbiAgICBAZWFjaCAoaW5kZXgpLT5cbiAgICAgICR0aGlzID0gJChAKVxuICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgIGlmICFkYXRhXG4gICAgICAgICR0aGlzLmRhdGEgJ1NsaWRlcicsIChkYXRhID0gbmV3IFNsaWRlcihALCBvcHRpb24sIGluZGV4KSlcblxuICAgICAgaWYgdHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJ1xuICAgICAgICByZXR1cm4gZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpXG5cblxuKSB3aW5kb3cualF1ZXJ5LCB3aW5kb3dcblxuIl19