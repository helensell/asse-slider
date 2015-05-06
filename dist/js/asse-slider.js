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
          eventPassthrough: false,
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
                return $(this).data('item_index') === index + parseInt(self.options.carousel);
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
          return self.goToSlide($(this).data('item_index') + parseInt(self.options.carousel));
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

//# sourceMappingURL=data:application/json;base64,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QVEsU0FBQSxHQUFBO0FBRWxCLFlBQUEsWUFBQTtBQUFBLFFBRm1CLHVCQUFRLDREQUUzQixDQUFBO2VBQUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFDLEtBQUQsR0FBQTtBQUNKLGNBQUEsV0FBQTtBQUFBLFVBQUEsS0FBQSxHQUFRLENBQUEsQ0FBRSxJQUFGLENBQVIsQ0FBQTtBQUFBLFVBQ0EsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsUUFBWCxDQURQLENBQUE7QUFHQSxVQUFBLElBQUcsQ0FBQSxJQUFIO0FBQ0UsWUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsRUFBcUIsQ0FBQyxJQUFBLEdBQVcsSUFBQSxNQUFBLENBQU8sSUFBUCxFQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBWixDQUFyQixDQUFBLENBREY7V0FIQTtBQU1BLFVBQUEsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixRQUFwQjtBQUNFLG1CQUFPLElBQUssQ0FBQSxNQUFBLENBQU8sQ0FBQyxLQUFiLENBQW1CLElBQW5CLEVBQXlCLElBQXpCLENBQVAsQ0FERjtXQVBJO1FBQUEsQ0FBTixFQUZrQjtNQUFBLENBQVI7S0FBWixFQTFnQkQ7RUFBQSxDQUFELENBQUEsQ0F1aEJFLE1BQU0sQ0FBQyxNQXZoQlQsRUF1aEJpQixNQXZoQmpCLENBQUEsQ0FBQTtBQUFBIiwiZmlsZSI6ImFzc2Utc2xpZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiI1xuIyBTbGlkZXIgalF1ZXJ5IHBsdWdpblxuIyBBdXRob3I6IFRob21hcyBLbG9rb3NjaCA8bWFpbEB0aG9tYXNrbG9rb3NjaC5jb20+XG4jXG4oKCQsIHdpbmRvdykgLT5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luIGNsYXNzXG4gIGNsYXNzIFNsaWRlclxuXG4gICAgaVNjcm9sbDogbnVsbFxuICAgIG51bWJlck9mU2xpZGVzOiBudWxsXG4gICAgY3VycmVudFNsaWRlOiAwXG4gICAgaW50ZXJ2YWw6IG51bGxcblxuICAgICRzbGlkZXI6IG51bGxcbiAgICAkc2xpZGVDb250YWluZXI6IG51bGxcbiAgICAkc2xpZGVzOiBudWxsXG4gICAgJHNsaWRlck5hdmlnYXRpb246IG51bGxcbiAgICAkc2xpZGVyTGlzdGVuZXJzOiBudWxsXG4gICAgJHNsaWRlc0luQ29udGFpbmVyOiBudWxsXG5cbiAgICBkZWZhdWx0czpcbiAgICAgIGF1dG9zY3JvbGw6IHRydWVcbiAgICAgIHNwZWVkOiA1MDBcbiAgICAgIGludGVydmFsOiA1MDAwXG4gICAgICBkZWJ1ZzogdHJ1ZVxuICAgICAgc25hcDogdHJ1ZVxuXG4gICAgICAjIEluIHRoaXMgc3RhdGUsIHRoZSBzbGlkZXIgaW5zdGFuY2Ugc2hvdWxkIG5ldmVyIGZvcndhcmQgZXZlbnRzIHRvXG4gICAgICAjIHRoZSBpU2Nyb2xsIGNvbXBvbmVudCwgZS5nLiB3aGVuIHRoZSBzbGlkZXIgaXMgbm90IHZpc2libGUgKGRpc3BsYXk6bm9uZSlcbiAgICAgICMgYW5kIHRoZXJlZm9yZSBpU2Nyb2xsIGNhbid0IGdldC9zY3JvbGwgdGhlIHNsaWRlIGVsZW1lbnRzXG4gICAgICBkaXNhYmxlZDogZmFsc2VcblxuICAgICAgIyBOYXZpZ2F0aW9uIGVsZW1lbnQgYXJyYXlcbiAgICAgICMgZWl0aGVyICdpbmRleCcgZm9yIG9uLXNsaWRlciBuYXZpZ2F0aW9uLCBhIGpRdWVyeSBzZWxlY3RvciBmb3IgYSB0aHVtYm5haWxcbiAgICAgICMgbmF2aWdhdGlvbiBvciBhbm90aGVyIHNsaWRlciBlbGVtZW50IGZvciBhIHNsaWRlciBhY3RpbmcgYXMgYSBzeW5jZWQgcmVtb3RlXG4gICAgICAjIG5hdmlnYXRpb24gdG8gdGhpcyBzbGlkZXIgaW5zdGFuY2VcbiAgICAgIG5hdmlnYXRpb246IFsnaW5kZXgnXVxuXG4gICAgICAjIEluZGV4IG5hdmlnYXRpb24gZGVmYXVsdCB0ZW1wbGF0ZVxuICAgICAgaW5kZXhOYXZpZ2F0aW9uVGVtcGxhdGU6IF8udGVtcGxhdGUoJzx1bCBjbGFzcz1cInNsaWRlck5hdmlnYXRpb25cIj5cbiAgICAgICAgPCUgXy5lYWNoKHNsaWRlcywgZnVuY3Rpb24oZWxlbWVudCxpbmRleCl7ICU+XG4gICAgICAgICAgPCUgaWYoIWNhcm91c2VsIHx8IChpbmRleD49Y2Fyb3VzZWwgJiYgKGluZGV4KzEpPD1zbGlkZXMubGVuZ3RoLWNhcm91c2VsKSl7ICU+XG4gICAgICAgICAgICA8bGkgZGF0YS1pdGVtX2luZGV4PVwiPCU9IGluZGV4ICU+XCIgY2xhc3M9XCJzbGlkZXJfbmF2aWdhdGlvbkl0ZW0gZmEgZmEtY2lyY2xlLW9cIj48L2xpPlxuICAgICAgICAgIDwlIH0gJT5cbiAgICAgICAgPCUgfSk7ICU+XG4gICAgICA8L3VsPicpXG5cbiAgICAgIHByZXZOZXh0QnV0dG9uczogdHJ1ZVxuICAgICAgcHJldk5leHRCdXR0b25zVGVtcGxhdGU6IF8udGVtcGxhdGUoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmV2IGZhIGZhLWFuZ2xlLWxlZnRcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5leHQgZmEgZmEtYW5nbGUtcmlnaHRcIj48L3NwYW4+JylcblxuICAgICAgc2xpZGVDb250YWluZXJTZWxlY3RvcjogJy5zbGlkZUNvbnRhaW5lcidcbiAgICAgIHNsaWRlU2VsZWN0b3I6ICd1bC5zbGlkZXMgPiBsaSdcblxuICAgICAgIyBPcGFjaXR5IG9mIHNsaWRlcyBvdGhlciB0aGFuIHRoZSBjdXJyZW50XG4gICAgICAjIE9ubHkgYXBwbGljYWJsZSBpZiB0aGUgc2xpZGVyIGVsZW1lbnQgaGFzIG92ZXJmbG93OiB2aXNpYmxlXG4gICAgICAjIGFuZCBpbmFjdGl2ZSBzbGlkZXMgYXJlIHNob3duIG5leHQgdG8gdGhlIGN1cnJlbnRcbiAgICAgIGluYWN0aXZlU2xpZGVPcGFjaXR5OiBudWxsXG5cbiAgICAgICMgTWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBzbGlkZXMgaW4gcGl4ZWxzXG4gICAgICBzbGlkZU1hcmdpbjogMFxuXG4gICAgICAjIFdpZHRoIG9mIHRoZSBzbGlkZSwgZGVmYXVsdHMgdG8gYXV0bywgdGFrZXMgYSAxMDAlIHNsaWRlciB3aWR0aFxuICAgICAgc2xpZGVXaWR0aDogJ2F1dG8nXG5cbiAgICAgICMgRmFrZSBhIGNhcm91c2VsIGVmZmVjdCBieSBzaG93aW5nIHRoZSBsYXN0IHNsaWRlIG5leHQgdG8gdGhlIGZpcnN0XG4gICAgICAjIHRoYXQgY2FuJ3QgYmUgbmF2aWdhdGVkIHRvIGJ1dCBmb3J3YXJkcyB0byB0aGUgZW5kIG9mIHRoZSBzbGlkZXJcbiAgICAgICMgTnVtYmVyIGluZGljYXRlcyBudW1iZXIgb2Ygc2xpZGVzIHBhZGRpbmcgbGVmdCBhbmQgcmlnaHRcbiAgICAgIGNhcm91c2VsOiAwXG5cbiAgICAgICMgU2xpZGUgY2xpY2sgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgIG9uU2xpZGVDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgb25OZXh0Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ05leHQnXG5cbiAgICAgIG9uUHJldkNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdQcmV2J1xuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgaW5kZXhcbiAgICAgIEAkc2xpZGVyLmFkZENsYXNzICdzbGlkZXJfJytpbmRleFxuICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uID0gW11cbiAgICAgIEAkc2xpZGVyTGlzdGVuZXJzID0gW11cbiAgICAgIEAkc2xpZGVzSW5Db250YWluZXIgPSBudWxsXG5cbiAgICAgIEBvcHRpb25zLm9uU2xpZGVDbGljayA9IChldmVudCktPlxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lciA9IEAkc2xpZGVyLmZpbmQgQG9wdGlvbnMuc2xpZGVDb250YWluZXJTZWxlY3RvclxuICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICBAYWRkQ2Fyb3VzZWxTbGlkZXMoKVxuICAgICAgICBAcmVmcmVzaFNsaWRlcygpXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICAjIEVuYWJsZSBzbGlkZXMgdHJvdWdoIENTU1xuICAgICAgQGVuYWJsZVNsaWRlcygpXG5cbiAgICAgIEBpU2Nyb2xsID0gbmV3IElTY3JvbGwgZWwsXG4gICAgICAgIHNjcm9sbFg6IHRydWVcbiAgICAgICAgc2Nyb2xsWTogZmFsc2VcbiAgICAgICAgc25hcDogQG9wdGlvbnMuc25hcFxuICAgICAgICBzbmFwU3BlZWQ6IDQwMFxuICAgICAgICB0YXA6IHRydWVcbiAgICAgICAgbW9tZW50dW06IGZhbHNlXG4gICAgICAgIGV2ZW50UGFzc3Rocm91Z2g6IGZhbHNlXG4gICAgICAgIG9uQmVmb3JlU2Nyb2xsU3RhcnQ6IChlKS0+XG4gICAgICAgICAgcG9pbnQgPSBlLnRvdWNoZXNbMF1cbiAgICAgICAgICBwb2ludFN0YXJ0WCA9IHBvaW50LnBhZ2VYXG4gICAgICAgICAgcG9pbnRTdGFydFkgPSBwb2ludC5wYWdlWVxuICAgICAgICAgIG51bGxcbiAgICAgICAgb25CZWZvcmVTY3JvbGxNb3ZlOiAoZSktPlxuICAgICAgICAgIGRlbHRhWCA9IE1hdGguYWJzKHBvaW50LnBhZ2VYIC0gcG9pbnRTdGFydFgpXG4gICAgICAgICAgZGVsdGFZID0gTWF0aC5hYnMocG9pbnQucGFnZVkgLSBwb2ludFN0YXJ0WSlcbiAgICAgICAgICBpZiBkZWx0YVggPj0gZGVsdGFZXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBudWxsXG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuICAgICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgQCRzbGlkZXIuYXBwZW5kIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1RlbXBsYXRlKClcblxuXG4gICAgIyBBZGQgbmF2aWdhdGlvblxuICAgIHJlbmRlck5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgRGVsZXRlIG9sZCBzbGlkZXIgbmF2aWdhdGlvbiBlbGVtZW50c1xuICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4KS0+XG4gICAgICAgIGlmICFlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG4gICAgICAgICAgJChlbGVtZW50KS5yZW1vdmUoKVxuXG4gICAgICBfLmVhY2ggQG9wdGlvbnMubmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4LCBsaXN0KT0+XG5cbiAgICAgICAgaWYgZWxlbWVudCA9PSAnaW5kZXgnXG5cbiAgICAgICAgICAjIENyZWF0ZSBhIGpRdWVyeSBvYmplY3QgZGlyZWN0bHkgZnJvbSBzbGlkZXIgY29kZVxuICAgICAgICAgIG5ld0VsZW1lbnQgPSBAb3B0aW9ucy5pbmRleE5hdmlnYXRpb25UZW1wbGF0ZSh7J3NsaWRlcyc6IEAkc2xpZGVzLCAnY2Fyb3VzZWwnOiBAb3B0aW9ucy5jYXJvdXNlbH0pXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggJChuZXdFbGVtZW50KVxuXG4gICAgICAgICAgIyBBcHBlbmQgaXQgdG8gc2xpZGVyIGVsZW1lbnRcbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbilcblxuICAgICAgICAgICMgUmVzaXplIG5hdmlnYXRpb25cbiAgICAgICAgICBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jc3NcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6IC0oXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikud2lkdGgoKSAvIDIpXG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgICAgICBzZWxmLnJlZ2lzdGVyTGlzdGVuZXIgZWxlbWVudFxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleCtwYXJzZUludChzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpXG4gICAgICAgICAgICAgIGl0ZW0uYWRkQ2xhc3MgJ3NsaWRlcl9uYXZpZ2F0aW9uSXRlbSdcbiAgICAgICAgICAgICAgaXRlbS5vbiAnY2xpY2snLCAoZXZlbnQpLT5cbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKVxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgUmVnaXN0ZXIgbGlzdGVuZXJcbiAgICByZWdpc3Rlckxpc3RlbmVyOiAobGlzdGVuZXIpLT5cblxuICAgICAgQCRzbGlkZXJMaXN0ZW5lcnMucHVzaCBsaXN0ZW5lclxuXG5cbiAgICAjIFVwZGF0ZSBuYXZpZ2F0aW9uIHN0YXR1c1xuICAgIHVwZGF0ZU5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyICgpLT4gJChAKS5kYXRhKCdpdGVtX2luZGV4JykgPT0gaW5kZXgrcGFyc2VJbnQoc2VsZi5vcHRpb25zLmNhcm91c2VsKVxuICAgICAgICAgICAgICAuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBVcGRhdGUgc2xpZGUgcHJvcGVydGllcyB0byBjdXJyZW50IHNsaWRlciBzdGF0ZVxuICAgIHVwZGF0ZVNsaWRlczogKGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICAjIEZhZGUgaW5hY3RpdmUgc2xpZGVzIHRvIGEgc3BlY2lmaWMgb3BhY2l0eSB2YWx1ZVxuICAgICAgaWYgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHkgJiYgYW5pbWF0ZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIGZhbHNlXG5cbiAgICAgIEAkc2xpZGVzLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFNldCBzbGlkZSBvcGFjaXR5IGZvciBhY3RpdmUgYW5kIGluYWN0aXZlIHNsaWRlc1xuICAgIHNldFNsaWRlT3BhY2l0eTogKGFjdGl2ZSwgaW5hY3RpdmUsIGFuaW1hdGU9dHJ1ZSktPlxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogaW5hY3RpdmVcblxuICAgICAgICBAJHNsaWRlcy5lcShAY3VycmVudFNsaWRlKS5zdG9wKCkuY3NzXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG5cblxuICAgICMgRXZlbnQgY2FsbGJhY2sgb24gc2Nyb2xsIGVuZFxuICAgIG9uU2Nyb2xsRW5kOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIElmIFNsaWRlciBzaG93cyBtb3JlIHRoYW4gb25lIHNsaWRlIHBlciBwYWdlXG4gICAgICAjIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnRTbGlkZSBpcyBvbiB0aGVcbiAgICAgICMgbGFzdCBwYWdlIGFuZCBoaWdoZXIgdGhhbiB0aGUgb25lIHNuYXBwZWQgdG9cbiAgICAgIGlmIEBzbGlkZXNJbkNvbnRhaW5lciA+IDFcbiAgICAgICAgaWYgQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVggPCBAbnVtYmVyT2ZTbGlkZXMgLSBAc2xpZGVzSW5Db250YWluZXJcbiAgICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcbiAgICAgIGVsc2VcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICMgSWYgbGFzdCBzbGlkZSwgcmV0dXJuIHRvIGZpcnN0XG4gICAgICAgIGlmIEBjdXJyZW50U2xpZGUgPj0gQG51bWJlck9mU2xpZGVzLUBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAb3B0aW9ucy5jYXJvdXNlbCwgZmFsc2VcbiAgICAgICAgIyBJZiBmaXJzdCBzbGlkZSwgbW92ZSB0byBsYXN0XG4gICAgICAgIGVsc2UgaWYgQGN1cnJlbnRTbGlkZSA8IEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAbnVtYmVyT2ZTbGlkZXMgLSAoQG9wdGlvbnMuY2Fyb3VzZWwrMSksIGZhbHNlXG5cbiAgICAgIF8uZWFjaCBAJHNsaWRlckxpc3RlbmVycywgKGxpc3RlbmVyKS0+XG5cbiAgICAgICAgIyBVcGRhdGUgcmVtb3RlIHNsaWRlclxuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ3N0b3BBdXRvU2Nyb2xsJ1xuICAgICAgICBsaXN0ZW5lci5TbGlkZXIgJ2dvVG9TbGlkZScsIHNlbGYuY3VycmVudFNsaWRlIC0gc2VsZi5vcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAnY2xpY2snLCAnc3Bhbi5uZXh0JywgKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ2NsaWNrJywgJ3NwYW4ucHJldicsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEAkc2xpZGVyLm9uICdjbGljaycsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpK3BhcnNlSW50KHNlbGYub3B0aW9ucy5jYXJvdXNlbClcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIC0+XG4gICAgICAgIHNlbGYucmVzaXplKClcbiAgICAgICAgIyMjXG4gICAgICAgIGlmIEByZXNpemVUb1xuICAgICAgICAgIGNsZWFyVGltZW91dCBAcmVzaXplVGltZW91dFxuICAgICAgICBAcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQgLT5cbiAgICAgICAgLCAyMDBcbiAgICAgICAgIyMjXG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gKEBjdXJyZW50U2xpZGUrMSlcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAoQGN1cnJlbnRTbGlkZSsxKVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IDBcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHByZXZpb3VzIHNsaWRlXG4gICAgcHJldlNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAY3VycmVudFNsaWRlLTEgPj0gMFxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBjdXJyZW50U2xpZGUtMVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBudW1iZXJPZlNsaWRlcy0xXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBzbGlkZSBpbmRleFxuICAgIGdvVG9TbGlkZTogKGluZGV4LCBhbmltYXRlPXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgaW5kZXggLSBzZWxmLm9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=