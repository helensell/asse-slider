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

//# sourceMappingURL=data:application/json;base64,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QUMsSUFBTixDQUFXLFFBQVgsRUFBcUIsQ0FBQyxJQUFBLEdBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBWixDQUFyQixDQUFBLENBREY7V0FIQTtBQU1BLFVBQUEsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixRQUFwQjtBQUNFLG1CQUFPLElBQUssQ0FBQSxNQUFBLENBQU8sQ0FBQyxLQUFiLENBQW1CLElBQW5CLEVBQXlCLElBQXpCLENBQVAsQ0FERjtXQVBJO1FBQUEsQ0FBTixFQUZrQjtNQUFBLENBQVI7S0FBWixFQWhpQkQ7RUFBQSxDQUFELENBQUEsQ0E2aUJFLE1BQU0sQ0FBQyxNQTdpQlQsRUE2aUJpQixNQTdpQmpCLENBQUEsQ0FBQTtBQUFBIiwiZmlsZSI6ImFzc2Utc2xpZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiI1xuIyBTbGlkZXIgalF1ZXJ5IHBsdWdpblxuIyBBdXRob3I6IFRob21hcyBLbG9rb3NjaCA8bWFpbEB0aG9tYXNrbG9rb3NjaC5jb20+XG4jXG4oKCQsIHdpbmRvdykgLT5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luIGNsYXNzXG4gIGNsYXNzIFNsaWRlclxuXG4gICAgaVNjcm9sbDogbnVsbFxuICAgIG51bWJlck9mU2xpZGVzOiBudWxsXG4gICAgY3VycmVudFNsaWRlOiAwXG4gICAgaW50ZXJ2YWw6IG51bGxcblxuICAgICRzbGlkZXI6IG51bGxcbiAgICAkc2xpZGVDb250YWluZXI6IG51bGxcbiAgICAkc2xpZGVzOiBudWxsXG4gICAgJHNsaWRlck5hdmlnYXRpb246IG51bGxcbiAgICAkc2xpZGVyTGlzdGVuZXJzOiBudWxsXG4gICAgJHNsaWRlc0luQ29udGFpbmVyOiBudWxsXG5cbiAgICBkZWZhdWx0czpcbiAgICAgIGF1dG9zY3JvbGw6IHRydWVcbiAgICAgIHNwZWVkOiA1MDBcbiAgICAgIGludGVydmFsOiA1MDAwXG4gICAgICBkZWJ1ZzogdHJ1ZVxuICAgICAgc25hcDogdHJ1ZVxuXG4gICAgICAjIEluIHRoaXMgc3RhdGUsIHRoZSBzbGlkZXIgaW5zdGFuY2Ugc2hvdWxkIG5ldmVyIGZvcndhcmQgZXZlbnRzIHRvXG4gICAgICAjIHRoZSBpU2Nyb2xsIGNvbXBvbmVudCwgZS5nLiB3aGVuIHRoZSBzbGlkZXIgaXMgbm90IHZpc2libGUgKGRpc3BsYXk6bm9uZSlcbiAgICAgICMgYW5kIHRoZXJlZm9yZSBpU2Nyb2xsIGNhbid0IGdldC9zY3JvbGwgdGhlIHNsaWRlIGVsZW1lbnRzXG4gICAgICBkaXNhYmxlZDogZmFsc2VcblxuICAgICAgIyBOYXZpZ2F0aW9uIGVsZW1lbnQgYXJyYXlcbiAgICAgICMgZWl0aGVyICdpbmRleCcgZm9yIG9uLXNsaWRlciBuYXZpZ2F0aW9uLCBhIGpRdWVyeSBzZWxlY3RvciBmb3IgYSB0aHVtYm5haWxcbiAgICAgICMgbmF2aWdhdGlvbiBvciBhbm90aGVyIHNsaWRlciBlbGVtZW50IGZvciBhIHNsaWRlciBhY3RpbmcgYXMgYSBzeW5jZWQgcmVtb3RlXG4gICAgICAjIG5hdmlnYXRpb24gdG8gdGhpcyBzbGlkZXIgaW5zdGFuY2VcbiAgICAgIG5hdmlnYXRpb246IFsnaW5kZXgnXVxuXG4gICAgICAjIEluZGV4IG5hdmlnYXRpb24gZGVmYXVsdCB0ZW1wbGF0ZVxuICAgICAgaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGU6IF8udGVtcGxhdGUoJzx1bCBjbGFzcz1cInNsaWRlck5hdmlnYXRpb25cIj5cbiAgICAgICAgPCUgXy5lYWNoKHNsaWRlcywgZnVuY3Rpb24oZWxlbWVudCxpbmRleCl7ICU+XG4gICAgICAgICAgPCUgaWYoIWNhcm91c2VsIHx8IChpbmRleD49Y2Fyb3VzZWwgJiYgKGluZGV4KzEpPD1zbGlkZXMubGVuZ3RoLWNhcm91c2VsKSl7ICU+XG4gICAgICAgICAgICA8bGkgZGF0YS1pdGVtX2luZGV4PVwiPCU9IGluZGV4ICU+XCIgY2xhc3M9XCJzbGlkZXJfbmF2aWdhdGlvbkl0ZW0gZmEgZmEtY2lyY2xlLW9cIj48L2xpPlxuICAgICAgICAgIDwlIH0gJT5cbiAgICAgICAgPCUgfSk7ICU+XG4gICAgICA8L3VsPicpXG5cbiAgICAgIHByZXZOZXh0QnV0dG9uczogdHJ1ZVxuICAgICAgcHJldk5leHRCdXR0b25zVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2IGZhIGZhLWFuZ2xlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5leHQgZmEgZmEtYW5nbGUtcmlnaHRcIj48L3NwYW4+JylcblxuICAgICAgIyBJZiBvbmUgb2YgdGhlc2UgdmFyaWFibGVzIGlzIGEgalF1ZXJ5IHNlbGVjdG9yLCB0aGV5IGFyZSB1c2VkIGluc3RlYWRcbiAgICAgICMgb2YgcmVuZGVyaW5nIHRoZSBhYm92ZSB0ZW1wbGF0ZVxuICAgICAgcHJldkJ1dHRvblNlbGVjdG9yOiBudWxsXG4gICAgICBuZXh0QnV0dG9uU2VsZWN0b3I6IG51bGxcblxuICAgICAgc2xpZGVDb250YWluZXJTZWxlY3RvcjogJy5zbGlkZUNvbnRhaW5lcidcbiAgICAgIHNsaWRlU2VsZWN0b3I6ICd1bC5zbGlkZXMgPiBsaSdcblxuICAgICAgIyBPcGFjaXR5IG9mIHNsaWRlcyBvdGhlciB0aGFuIHRoZSBjdXJyZW50XG4gICAgICAjIE9ubHkgYXBwbGljYWJsZSBpZiB0aGUgc2xpZGVyIGVsZW1lbnQgaGFzIG92ZXJmbG93OiB2aXNpYmxlXG4gICAgICAjIGFuZCBpbmFjdGl2ZSBzbGlkZXMgYXJlIHNob3duIG5leHQgdG8gdGhlIGN1cnJlbnRcbiAgICAgIGluYWN0aXZlU2xpZGVPcGFjaXR5OiBudWxsXG5cbiAgICAgICMgTWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBzbGlkZXMgaW4gcGl4ZWxzXG4gICAgICBzbGlkZU1hcmdpbjogMFxuXG4gICAgICAjIFdpZHRoIG9mIHRoZSBzbGlkZSwgZGVmYXVsdHMgdG8gYXV0bywgdGFrZXMgYSAxMDAlIHNsaWRlciB3aWR0aFxuICAgICAgc2xpZGVXaWR0aDogJ2F1dG8nXG5cbiAgICAgICMgRmFrZSBhIGNhcm91c2VsIGVmZmVjdCBieSBzaG93aW5nIHRoZSBsYXN0IHNsaWRlIG5leHQgdG8gdGhlIGZpcnN0XG4gICAgICAjIHRoYXQgY2FuJ3QgYmUgbmF2aWdhdGVkIHRvIGJ1dCBmb3J3YXJkcyB0byB0aGUgZW5kIG9mIHRoZSBzbGlkZXJcbiAgICAgICMgTnVtYmVyIGluZGljYXRlcyBudW1iZXIgb2Ygc2xpZGVzIHBhZGRpbmcgbGVmdCBhbmQgcmlnaHRcbiAgICAgIGNhcm91c2VsOiAwXG5cbiAgICAgICMgQ2FsbGJhY2sgb24gc2xpZGVyIGluaXRpYWxpemF0aW9uXG4gICAgICBvblN0YXJ0OiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdTdGFydCdcblxuICAgICAgIyBTbGlkZSBjbGljayBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgb25TbGlkZUNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBvbk5leHRDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnTmV4dCdcblxuICAgICAgb25QcmV2Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ1ByZXYnXG5cbiAgICAgIG9uU2Nyb2xsRW5kOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdFbmQnXG5cblxuICAgIGRlYnVnVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgPGRpdiBjbGFzcz1cImRlYnVnXCI+XG4gICAgICAgIDxzcGFuPlNsaWRlcjogPCU9IHNsaWRlcl9pbmRleCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBzbGlkZXM6IDwlPSBudW1iZXJfb2Zfc2xpZGVzICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5DdXJyZW50IHNsaWRlOiA8JT0gY3VycmVudF9zbGlkZSAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+QXV0b3Njcm9sbDogPCU9IGF1dG9zY3JvbGwgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2YgbmF2aWdhdGlvbnM6IDwlPSBudW1iZXJfb2ZfbmF2aWdhdGlvbnMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPlNsaWRlciB3aWR0aDogPCU9IHNsaWRlcl93aWR0aCAlPjwvc3Bhbj5cbiAgICAgIDwvZGl2PicpXG5cblxuICAgICMgQ29uc3RydWN0b3JcbiAgICBjb25zdHJ1Y3RvcjogKGVsLCBvcHRpb25zLCBpbmRleCA9IG51bGwpIC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBvcHRpb25zID0gJC5leHRlbmQoe30sIEBkZWZhdWx0cywgb3B0aW9ucylcblxuICAgICAgQCRzbGlkZXIgPSAkKGVsKVxuICAgICAgQCRzbGlkZXIuZGF0YSAnaW5kZXgnLCBpZiBAb3B0aW9ucy5pbmRleCB0aGVuICdzbGlkZXJfJytAb3B0aW9ucy5pbmRleCBlbHNlICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgaWYgQG9wdGlvbnMuaW5kZXggdGhlbiAnc2xpZGVyXycrQG9wdGlvbnMuaW5kZXggZWxzZSAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbiA9IFtdXG4gICAgICBAJHNsaWRlc0luQ29udGFpbmVyID0gbnVsbFxuXG4gICAgICBAb3B0aW9ucy5vblNsaWRlQ2xpY2sgPSAoZXZlbnQpLT5cbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIgPSBAJHNsaWRlci5maW5kIEBvcHRpb25zLnNsaWRlQ29udGFpbmVyU2VsZWN0b3JcbiAgICAgIEByZWZyZXNoU2xpZGVzKClcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgQGFkZENhcm91c2VsU2xpZGVzKClcbiAgICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgIyBFbmFibGUgc2xpZGVzIHRyb3VnaCBDU1NcbiAgICAgIEBlbmFibGVTbGlkZXMoKVxuXG4gICAgICBAaVNjcm9sbCA9IG5ldyBJU2Nyb2xsIGVsLFxuICAgICAgICBzY3JvbGxYOiB0cnVlXG4gICAgICAgIHNjcm9sbFk6IGZhbHNlXG4gICAgICAgIHNuYXA6IEBvcHRpb25zLnNuYXBcbiAgICAgICAgc25hcFNwZWVkOiA0MDBcbiAgICAgICAgdGFwOiB0cnVlXG4gICAgICAgIG1vbWVudHVtOiBmYWxzZVxuICAgICAgICBldmVudFBhc3N0aHJvdWdoOiB0cnVlXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuXG4gICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU3RhcnQgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBzZWxmLm9wdGlvbnMub25TdGFydC5hcHBseShALCBbXSlcblxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBOZXh0IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVOZXh0RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYubmV4dFNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25OZXh0Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICAjIFByZXYgZXZlbnQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZVByZXZFdmVudCA9IChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuXG4gICAgICAgICMgQ2hlY2sgaWYgcHJldi9uZXh0IGJ1dHRvbiBzZWxlY3RvcnMgYXJlIHNldCBpbiBvcHRpb25zLFxuICAgICAgICAjIGFuZCBpZiBzbywgdXNlIHRoZW0gaW5zdGVhZCBvZiByZW5kZXJpbmcgdGVtcGxhdGVcbiAgICAgICAgaWYgQG9wdGlvbnMucHJldkJ1dHRvblNlbGVjdG9yIG9yIEBvcHRpb25zLm5leHRCdXR0b25TZWxlY3RvclxuXG4gICAgICAgICAgIyBXZSBjYW4ndCB1c2UgdGhlIGN1c3RvbSAndGFwJyBldmVudCBvdXRzaWRlIG9mIHRoZSBpU2Nyb2xsIGVsZW1lbnRcbiAgICAgICAgICAjIFRoZXJlZm9yZSB3ZSBoYXZlIHRvIGJpbmQgY2xpY2sgYW5kIHRvdWNoc3RhcnQgZXZlbnRzIGJvdGggdG9cbiAgICAgICAgICAjIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvclxuICAgICAgICAgICAgJCgnYm9keScpLm9uICdjbGljaycsIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciwgaGFuZGxlUHJldkV2ZW50XG5cbiAgICAgICAgICBpZiBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3IsIGhhbmRsZU5leHRFdmVudFxuXG4gICAgICAgICMgTm8gc2VsZWN0b3JzIHNldCwgcmVuZGVyIHRlbXBsYXRlXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNUZW1wbGF0ZSgpXG5cbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ucHJldicsIGhhbmRsZVByZXZFdmVudFxuICAgICAgICAgIEAkc2xpZGVyLm9uICd0YXAnLCAnc3Bhbi5uZXh0JywgaGFuZGxlTmV4dEV2ZW50XG5cblxuICAgICMgQWRkIG5hdmlnYXRpb25cbiAgICByZW5kZXJOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIERlbGV0ZSBvbGQgc2xpZGVyIG5hdmlnYXRpb24gZWxlbWVudHNcbiAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCktPlxuICAgICAgICBpZiAhZWxlbWVudC5kYXRhKCdTbGlkZXInKVxuICAgICAgICAgICQoZWxlbWVudCkucmVtb3ZlKClcblxuICAgICAgXy5lYWNoIEBvcHRpb25zLm5hdmlnYXRpb24sIChlbGVtZW50LCBpbmRleCwgbGlzdCk9PlxuXG4gICAgICAgIGlmIGVsZW1lbnQgPT0gJ2luZGV4J1xuXG4gICAgICAgICAgIyBDcmVhdGUgYSBqUXVlcnkgb2JqZWN0IGRpcmVjdGx5IGZyb20gc2xpZGVyIGNvZGVcbiAgICAgICAgICBuZXdFbGVtZW50ID0gQG9wdGlvbnMuaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGUoeydzbGlkZXMnOiBAJHNsaWRlcywgJ2Nhcm91c2VsJzogQG9wdGlvbnMuY2Fyb3VzZWx9KVxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoICQobmV3RWxlbWVudClcblxuICAgICAgICAgICMgQXBwZW5kIGl0IHRvIHNsaWRlciBlbGVtZW50XG4gICAgICAgICAgQCRzbGlkZXIuYXBwZW5kIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pXG5cbiAgICAgICAgICAjIFJlc2l6ZSBuYXZpZ2F0aW9uXG4gICAgICAgICAgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY3NzXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAtKF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLndpZHRoKCkgLyAyKVxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleCtwYXJzZUludChzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpXG4gICAgICAgICAgICAgIGl0ZW0uYWRkQ2xhc3MgJ3NsaWRlcl9uYXZpZ2F0aW9uSXRlbSdcbiAgICAgICAgICAgICAgaXRlbS5vbiAndGFwJywgKGV2ZW50KS0+XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKVxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgVXBkYXRlIG5hdmlnYXRpb24gc3RhdHVzXG4gICAgdXBkYXRlTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcbiAgICAgIGluZGV4ID0gQGN1cnJlbnRTbGlkZVxuXG4gICAgICBpZiAhQG9wdGlvbnMuZGlzYWJsZWRcblxuICAgICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCktPlxuXG4gICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5zbGlkZXJfbmF2aWdhdGlvbkl0ZW0nKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgICAgICAgICAgIC5maWx0ZXIgKCktPiAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKSA9PSBpbmRleFxuICAgICAgICAgICAgICAuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogKGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHkgJiYgYW5pbWF0ZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIGZhbHNlXG5cbiAgICAgIEAkc2xpZGVzLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFNldCBzbGlkZSBvcGFjaXR5IGZvciBhY3RpdmUgYW5kIGluYWN0aXZlIHNsaWRlc1xuICAgIHNldFNsaWRlT3BhY2l0eTogKGFjdGl2ZSwgaW5hY3RpdmUsIGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG5cblxuICAgICMgRXZlbnQgY2FsbGJhY2sgb24gc2Nyb2xsIGVuZFxuICAgIG9uU2Nyb2xsRW5kOiAoZXZlbnQpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBJZiBTbGlkZXIgc2hvd3MgbW9yZSB0aGFuIG9uZSBzbGlkZSBwZXIgcGFnZVxuICAgICAgIyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50U2xpZGUgaXMgb24gdGhlXG4gICAgICAjIGxhc3QgcGFnZSBhbmQgaGlnaGVyIHRoYW4gdGhlIG9uZSBzbmFwcGVkIHRvXG4gICAgICBpZiBAc2xpZGVzSW5Db250YWluZXIgPiAxXG4gICAgICAgIGlmIEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYIDwgQG51bWJlck9mU2xpZGVzIC0gQHNsaWRlc0luQ29udGFpbmVyXG4gICAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAjIElmIGxhc3Qgc2xpZGUsIHJldHVybiB0byBmaXJzdFxuICAgICAgICBpZiBAY3VycmVudFNsaWRlID49IEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG9wdGlvbnMuY2Fyb3VzZWwgKyAoQGN1cnJlbnRTbGlkZSAtIChAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWwpKSwgZmFsc2UsIGZhbHNlXG4gICAgICAgICMgSWYgZmlyc3Qgc2xpZGUsIG1vdmUgdG8gbGFzdFxuICAgICAgICBlbHNlIGlmIEBjdXJyZW50U2xpZGUgPCBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG51bWJlck9mU2xpZGVzIC0gKEBvcHRpb25zLmNhcm91c2VsKzEpLCBmYWxzZSwgZmFsc2VcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZCA9PSAnZnVuY3Rpb24nXG4gICAgICAgIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZC5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIC0+XG4gICAgICAgIHNlbGYucmVzaXplKClcblxuXG4gICAgIyBHbyB0byBuZXh0IHNsaWRlXG4gICAgbmV4dFNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAbnVtYmVyT2ZTbGlkZXMgPiBAY3VycmVudFNsaWRlKzFcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlKzFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAwXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBwcmV2aW91cyBzbGlkZVxuICAgIHByZXZTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZS0xID49IDBcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlLTFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAbnVtYmVyT2ZTbGlkZXMtMVxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gc2xpZGUgaW5kZXhcbiAgICBnb1RvU2xpZGU6IChpbmRleCwgYW5pbWF0ZT10cnVlLCB0cmlnZ2VyRXZlbnQ9dHJ1ZSk9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgQG9wdGlvbnMuc3BlZWRcbiAgICAgIGVsc2VcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCAwXG5cbiAgICAgIEBjdXJyZW50U2xpZGUgPSBpbmRleFxuICAgICAgQHVwZGF0ZVNsaWRlcyhhbmltYXRlKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG4gICAgICBpZiB0cmlnZ2VyRXZlbnRcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgQCRzbGlkZXIuZGF0YSgnaW5kZXgnKSsnI2dvVG9TbGlkZScsIGluZGV4IC0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIExpc3RlbiB0byBhbm90aGVyIHNsaWRlciBmb3IgbmF2aWdhdGlvblxuICAgICMgUGFzcyB0aGUgc2xpZGVyIGluZGV4IGZvciB0aGUgZXZlbnQgYmluZGluZyBzZWxlY3RvclxuICAgIGxpc3RlblRvOiAoaW5kZXgpLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgJCgnYm9keScpLm9uICdzbGlkZXJfJytpbmRleCsnI2dvVG9TbGlkZScsIChldmVudCwgaW5kZXgpLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlIChpbmRleCArIHNlbGYub3B0aW9ucy5jYXJvdXNlbCksIHRydWUsIGZhbHNlXG5cblxuICAgICMgQWRkIGRlYnVnIG91dHB1dCB0byBzbGlkZXJcbiAgICBkZWJ1ZzogPT5cblxuICAgICAgaWYgQG9wdGlvbnMuZGVidWdcbiAgICAgICAgQCRzbGlkZXIuZmluZCgnLmRlYnVnJykucmVtb3ZlKClcbiAgICAgICAgQCRzbGlkZXIuYXBwZW5kIEBkZWJ1Z1RlbXBsYXRlXG4gICAgICAgICAgJ3NsaWRlcl9pbmRleCc6IEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICdudW1iZXJfb2Zfc2xpZGVzJzogQG51bWJlck9mU2xpZGVzXG4gICAgICAgICAgJ2N1cnJlbnRfc2xpZGUnOiBAaVNjcm9sbC5jdXJyZW50UGFnZT8ucGFnZVhcbiAgICAgICAgICAnYXV0b3Njcm9sbCc6IGlmIEBpbnRlcnZhbCB0aGVuICdlbmFibGVkJyBlbHNlICdkaXNhYmxlZCdcbiAgICAgICAgICAnbnVtYmVyX29mX25hdmlnYXRpb25zJzogQCRzbGlkZXJOYXZpZ2F0aW9uLmxlbmd0aFxuICAgICAgICAgICdzbGlkZXJfd2lkdGgnOiBAJHNsaWRlci53aWR0aCgpXG5cblxuICAgICMgUHJpbnQgb3B0aW9uIHRvIGNvbnNvbGVcbiAgICAjIENhbid0IGp1c3QgcmV0dXJuIHRoZSB2YWx1ZSB0byBkZWJ1ZyBpdCBiZWNhdXNlXG4gICAgIyBpdCB3b3VsZCBicmVhayBjaGFpbmluZyB3aXRoIHRoZSBqUXVlcnkgb2JqZWN0XG4gICAgIyBFdmVyeSBtZXRob2QgY2FsbCByZXR1cm5zIGEgalF1ZXJ5IG9iamVjdFxuICAgIGdldDogKG9wdGlvbikgLT5cbiAgICAgIGNvbnNvbGUubG9nICdvcHRpb246ICcrb3B0aW9uKycgaXMgJytAb3B0aW9uc1tvcHRpb25dXG4gICAgICBAb3B0aW9uc1tvcHRpb25dXG5cblxuICAgICMgU2V0IG9wdGlvbiB0byB0aGlzIGluc3RhbmNlcyBvcHRpb25zIGFycmF5XG4gICAgc2V0OiAob3B0aW9uLCB2YWx1ZSkgLT5cblxuICAgICAgIyBTZXQgb3B0aW9ucyB2YWx1ZVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXSA9IHZhbHVlXG5cbiAgICAgICMgSWYgbm8gaW50ZXJ2YWwgaXMgY3VycmVudGx5IHByZXNlbnQsIHN0YXJ0IGF1dG9zY3JvbGxcbiAgICAgIGlmIG9wdGlvbiA9PSAnYXV0b3Njcm9sbCcgJiYgIUBpbnRlcnZhbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgIyBUT0RPOiBVcGRhdGUgc2xpZGUgbWFyZ2luXG4gICAgICAjaWYgb3B0aW9uID09ICdzbGlkZU1hcmdpbidcbiAgICAgICAgIyBjYWNoZSBzbGlkZU1hcmdpbiBDU1Mgb24gZWxlbWVudD9cbiAgICAgICAgIyB3aGF0IGlmIHRoZSB1c2VyIHdhbnRzIHRvIHN3aXRjaCBiYWNrXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnaW5hY3RpdmVTbGlkZU9wYWNpdHknICYmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcblxuICAgICAgaWYgb3B0aW9uID09ICduYXZpZ2F0aW9uJ1xuICAgICAgICBAcmVuZGVyTmF2aWdhdGlvbigpXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbGlzdGVuVG8nXG4gICAgICAgIEBsaXN0ZW5UbyB2YWx1ZVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=