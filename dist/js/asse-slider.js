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
              $('body').on('touchstart', this.options.prevButtonSelector, handlePrevEvent);
            }
            if (this.options.nextButtonSelector) {
              $('body').on('click', this.options.nextButtonSelector, handleNextEvent);
              return $('body').on('touchstart', this.options.nextButtonSelector, handleNextEvent);
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

//# sourceMappingURL=data:application/json;base64,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QyxDQUFBLE9BQU8sQ0FBQyxvQkFBN0IsQ0FBQSxDQURGO1NBWEE7QUFjQSxRQUFBLElBQUcsTUFBQSxLQUFVLFlBQWI7QUFDRSxVQUFBLElBQUMsQ0FBQSxnQkFBRCxDQUFBLENBQUEsQ0FERjtTQWRBO2VBaUJBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFwQkc7TUFBQSxDQTVmTCxDQUFBOztvQkFBQTs7UUFGRixDQUFBO1dBdWhCQSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQUwsQ0FBWTtBQUFBLE1BQUEsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUVsQixZQUFBLFlBQUE7QUFBQSxRQUZtQix1QkFBUSw0REFFM0IsQ0FBQTtlQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxLQUFELEdBQUE7QUFDSixjQUFBLFdBQUE7QUFBQSxVQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFBQSxVQUNBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsQ0FEUCxDQUFBO0FBR0EsVUFBQSxJQUFHLENBQUEsSUFBSDtBQUNFLFlBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBQXFCLENBQUMsSUFBQSxHQUFXLElBQUEsTUFBQSxDQUFPLElBQVAsRUFBVSxNQUFWLEVBQWtCLEtBQWxCLENBQVosQ0FBckIsQ0FBQSxDQURGO1dBSEE7QUFNQSxVQUFBLElBQUcsTUFBQSxDQUFBLE1BQUEsS0FBaUIsUUFBcEI7QUFDRSxtQkFBTyxJQUFLLENBQUEsTUFBQSxDQUFPLENBQUMsS0FBYixDQUFtQixJQUFuQixFQUF5QixJQUF6QixDQUFQLENBREY7V0FQSTtRQUFBLENBQU4sRUFGa0I7TUFBQSxDQUFSO0tBQVosRUExaEJEO0VBQUEsQ0FBRCxDQUFBLENBdWlCRSxNQUFNLENBQUMsTUF2aUJULEVBdWlCaUIsTUF2aUJqQixDQUFBLENBQUE7QUFBQSIsImZpbGUiOiJhc3NlLXNsaWRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiNcbiMgU2xpZGVyIGpRdWVyeSBwbHVnaW5cbiMgQXV0aG9yOiBUaG9tYXMgS2xva29zY2ggPG1haWxAdGhvbWFza2xva29zY2guY29tPlxuI1xuKCgkLCB3aW5kb3cpIC0+XG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpbiBjbGFzc1xuICBjbGFzcyBTbGlkZXJcblxuICAgIGlTY3JvbGw6IG51bGxcbiAgICBudW1iZXJPZlNsaWRlczogbnVsbFxuICAgIGN1cnJlbnRTbGlkZTogMFxuICAgIGludGVydmFsOiBudWxsXG5cbiAgICAkc2xpZGVyOiBudWxsXG4gICAgJHNsaWRlQ29udGFpbmVyOiBudWxsXG4gICAgJHNsaWRlczogbnVsbFxuICAgICRzbGlkZXJOYXZpZ2F0aW9uOiBudWxsXG4gICAgJHNsaWRlckxpc3RlbmVyczogbnVsbFxuICAgICRzbGlkZXNJbkNvbnRhaW5lcjogbnVsbFxuXG4gICAgZGVmYXVsdHM6XG4gICAgICBhdXRvc2Nyb2xsOiB0cnVlXG4gICAgICBzcGVlZDogNTAwXG4gICAgICBpbnRlcnZhbDogNTAwMFxuICAgICAgZGVidWc6IHRydWVcbiAgICAgIHNuYXA6IHRydWVcblxuICAgICAgIyBJbiB0aGlzIHN0YXRlLCB0aGUgc2xpZGVyIGluc3RhbmNlIHNob3VsZCBuZXZlciBmb3J3YXJkIGV2ZW50cyB0b1xuICAgICAgIyB0aGUgaVNjcm9sbCBjb21wb25lbnQsIGUuZy4gd2hlbiB0aGUgc2xpZGVyIGlzIG5vdCB2aXNpYmxlIChkaXNwbGF5Om5vbmUpXG4gICAgICAjIGFuZCB0aGVyZWZvcmUgaVNjcm9sbCBjYW4ndCBnZXQvc2Nyb2xsIHRoZSBzbGlkZSBlbGVtZW50c1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlXG5cbiAgICAgICMgTmF2aWdhdGlvbiBlbGVtZW50IGFycmF5XG4gICAgICAjIGVpdGhlciAnaW5kZXgnIGZvciBvbi1zbGlkZXIgbmF2aWdhdGlvbiwgYSBqUXVlcnkgc2VsZWN0b3IgZm9yIGEgdGh1bWJuYWlsXG4gICAgICAjIG5hdmlnYXRpb24gb3IgYW5vdGhlciBzbGlkZXIgZWxlbWVudCBmb3IgYSBzbGlkZXIgYWN0aW5nIGFzIGEgc3luY2VkIHJlbW90ZVxuICAgICAgIyBuYXZpZ2F0aW9uIHRvIHRoaXMgc2xpZGVyIGluc3RhbmNlXG4gICAgICBuYXZpZ2F0aW9uOiBbJ2luZGV4J11cblxuICAgICAgIyBJbmRleCBuYXZpZ2F0aW9uIGRlZmF1bHQgdGVtcGxhdGVcbiAgICAgIGluZGV4TmF2aWdhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8dWwgY2xhc3M9XCJzbGlkZXJOYXZpZ2F0aW9uXCI+XG4gICAgICAgIDwlIF8uZWFjaChzbGlkZXMsIGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgpeyAlPlxuICAgICAgICAgIDwlIGlmKCFjYXJvdXNlbCB8fCAoaW5kZXg+PWNhcm91c2VsICYmIChpbmRleCsxKTw9c2xpZGVzLmxlbmd0aC1jYXJvdXNlbCkpeyAlPlxuICAgICAgICAgICAgPGxpIGRhdGEtaXRlbV9pbmRleD1cIjwlPSBpbmRleCAlPlwiIGNsYXNzPVwic2xpZGVyX25hdmlnYXRpb25JdGVtIGZhIGZhLWNpcmNsZS1vXCI+PC9saT5cbiAgICAgICAgICA8JSB9ICU+XG4gICAgICAgIDwlIH0pOyAlPlxuICAgICAgPC91bD4nKVxuXG4gICAgICBwcmV2TmV4dEJ1dHRvbnM6IHRydWVcbiAgICAgIHByZXZOZXh0QnV0dG9uc1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJldiBmYSBmYS1hbmdsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZXh0IGZhIGZhLWFuZ2xlLXJpZ2h0XCI+PC9zcGFuPicpXG5cbiAgICAgICMgSWYgb25lIG9mIHRoZXNlIHZhcmlhYmxlcyBpcyBhIGpRdWVyeSBzZWxlY3RvciwgdGhleSBhcmUgdXNlZCBpbnN0ZWFkXG4gICAgICAjIG9mIHJlbmRlcmluZyB0aGUgYWJvdmUgdGVtcGxhdGVcbiAgICAgIHByZXZCdXR0b25TZWxlY3RvcjogbnVsbFxuICAgICAgbmV4dEJ1dHRvblNlbGVjdG9yOiBudWxsXG5cbiAgICAgIHNsaWRlQ29udGFpbmVyU2VsZWN0b3I6ICcuc2xpZGVDb250YWluZXInXG4gICAgICBzbGlkZVNlbGVjdG9yOiAndWwuc2xpZGVzID4gbGknXG5cbiAgICAgICMgT3BhY2l0eSBvZiBzbGlkZXMgb3RoZXIgdGhhbiB0aGUgY3VycmVudFxuICAgICAgIyBPbmx5IGFwcGxpY2FibGUgaWYgdGhlIHNsaWRlciBlbGVtZW50IGhhcyBvdmVyZmxvdzogdmlzaWJsZVxuICAgICAgIyBhbmQgaW5hY3RpdmUgc2xpZGVzIGFyZSBzaG93biBuZXh0IHRvIHRoZSBjdXJyZW50XG4gICAgICBpbmFjdGl2ZVNsaWRlT3BhY2l0eTogbnVsbFxuXG4gICAgICAjIE1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgc2xpZGVzIGluIHBpeGVsc1xuICAgICAgc2xpZGVNYXJnaW46IDBcblxuICAgICAgIyBXaWR0aCBvZiB0aGUgc2xpZGUsIGRlZmF1bHRzIHRvIGF1dG8sIHRha2VzIGEgMTAwJSBzbGlkZXIgd2lkdGhcbiAgICAgIHNsaWRlV2lkdGg6ICdhdXRvJ1xuXG4gICAgICAjIEZha2UgYSBjYXJvdXNlbCBlZmZlY3QgYnkgc2hvd2luZyB0aGUgbGFzdCBzbGlkZSBuZXh0IHRvIHRoZSBmaXJzdFxuICAgICAgIyB0aGF0IGNhbid0IGJlIG5hdmlnYXRlZCB0byBidXQgZm9yd2FyZHMgdG8gdGhlIGVuZCBvZiB0aGUgc2xpZGVyXG4gICAgICAjIE51bWJlciBpbmRpY2F0ZXMgbnVtYmVyIG9mIHNsaWRlcyBwYWRkaW5nIGxlZnQgYW5kIHJpZ2h0XG4gICAgICBjYXJvdXNlbDogMFxuXG4gICAgICAjIFNsaWRlIGNsaWNrIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICBvblNsaWRlQ2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG5cbiAgICAgIG9uTmV4dENsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdOZXh0J1xuXG4gICAgICBvblByZXZDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnUHJldidcblxuXG4gICAgZGVidWdUZW1wbGF0ZTogXy50ZW1wbGF0ZSgnXG4gICAgICA8ZGl2IGNsYXNzPVwiZGVidWdcIj5cbiAgICAgICAgPHNwYW4+U2xpZGVyOiA8JT0gc2xpZGVyX2luZGV4ICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIHNsaWRlczogPCU9IG51bWJlcl9vZl9zbGlkZXMgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkN1cnJlbnQgc2xpZGU6IDwlPSBjdXJyZW50X3NsaWRlICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5BdXRvc2Nyb2xsOiA8JT0gYXV0b3Njcm9sbCAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+IyBvZiBuYXZpZ2F0aW9uczogPCU9IG51bWJlcl9vZl9uYXZpZ2F0aW9ucyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+U2xpZGVyIHdpZHRoOiA8JT0gc2xpZGVyX3dpZHRoICU+PC9zcGFuPlxuICAgICAgPC9kaXY+JylcblxuXG4gICAgIyBDb25zdHJ1Y3RvclxuICAgIGNvbnN0cnVjdG9yOiAoZWwsIG9wdGlvbnMsIGluZGV4ID0gbnVsbCkgLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgQG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQGRlZmF1bHRzLCBvcHRpb25zKVxuXG4gICAgICBAJHNsaWRlciA9ICQoZWwpXG4gICAgICBAJHNsaWRlci5kYXRhICdpbmRleCcsIGluZGV4XG4gICAgICBAJHNsaWRlci5hZGRDbGFzcyAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbiA9IFtdXG4gICAgICBAJHNsaWRlckxpc3RlbmVycyA9IFtdXG4gICAgICBAJHNsaWRlc0luQ29udGFpbmVyID0gbnVsbFxuXG4gICAgICBAb3B0aW9ucy5vblNsaWRlQ2xpY2sgPSAoZXZlbnQpLT5cbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIgPSBAJHNsaWRlci5maW5kIEBvcHRpb25zLnNsaWRlQ29udGFpbmVyU2VsZWN0b3JcbiAgICAgIEByZWZyZXNoU2xpZGVzKClcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcbiAgICAgICAgQGFkZENhcm91c2VsU2xpZGVzKClcbiAgICAgICAgQHJlZnJlc2hTbGlkZXMoKVxuICAgICAgICBAY3VycmVudFNsaWRlID0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgIyBFbmFibGUgc2xpZGVzIHRyb3VnaCBDU1NcbiAgICAgIEBlbmFibGVTbGlkZXMoKVxuXG4gICAgICBAaVNjcm9sbCA9IG5ldyBJU2Nyb2xsIGVsLFxuICAgICAgICBzY3JvbGxYOiB0cnVlXG4gICAgICAgIHNjcm9sbFk6IGZhbHNlXG4gICAgICAgIHNuYXA6IEBvcHRpb25zLnNuYXBcbiAgICAgICAgc25hcFNwZWVkOiA0MDBcbiAgICAgICAgdGFwOiB0cnVlXG4gICAgICAgIG1vbWVudHVtOiBmYWxzZVxuICAgICAgICBldmVudFBhc3N0aHJvdWdoOiB0cnVlXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuICAgICAgQFxuXG5cbiAgICAjIFJlZnJlc2ggc2xpZGVzXG4gICAgcmVmcmVzaFNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMgPSBAJHNsaWRlQ29udGFpbmVyLmZpbmQgQG9wdGlvbnMuc2xpZGVTZWxlY3RvclxuICAgICAgQG51bWJlck9mU2xpZGVzID0gQCRzbGlkZXMubGVuZ3RoXG5cblxuICAgICMgRW5hYmxlIHNsaWRlcyB2aWEgQ1NTXG4gICAgZW5hYmxlU2xpZGVzOiAtPlxuXG4gICAgICBAJHNsaWRlcy5jc3NcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuXG5cbiAgICAjIEFkZCBwcmV2IG5leHQgYnV0dG9uc1xuICAgIGFkZFByZXZOZXh0QnV0dG9uczogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBOZXh0IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVOZXh0RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYubmV4dFNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25OZXh0Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICAjIFByZXYgZXZlbnQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZVByZXZFdmVudCA9IChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIGlmIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1xuXG4gICAgICAgICMgQ2hlY2sgaWYgcHJldi9uZXh0IGJ1dHRvbiBzZWxlY3RvcnMgYXJlIHNldCBpbiBvcHRpb25zLFxuICAgICAgICAjIGFuZCBpZiBzbywgdXNlIHRoZW0gaW5zdGVhZCBvZiByZW5kZXJpbmcgdGVtcGxhdGVcbiAgICAgICAgaWYgQG9wdGlvbnMucHJldkJ1dHRvblNlbGVjdG9yIG9yIEBvcHRpb25zLm5leHRCdXR0b25TZWxlY3RvclxuXG4gICAgICAgICAgIyBXZSBjYW4ndCB1c2UgdGhlIGN1c3RvbSAndGFwJyBldmVudCBvdXRzaWRlIG9mIHRoZSBpU2Nyb2xsIGVsZW1lbnRcbiAgICAgICAgICAjIFRoZXJlZm9yZSB3ZSBoYXZlIHRvIGJpbmQgY2xpY2sgYW5kIHRvdWNoc3RhcnQgZXZlbnRzIGJvdGggdG9cbiAgICAgICAgICAjIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvclxuICAgICAgICAgICAgJCgnYm9keScpLm9uICdjbGljaycsIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciwgaGFuZGxlUHJldkV2ZW50XG4gICAgICAgICAgICAkKCdib2R5Jykub24gJ3RvdWNoc3RhcnQnLCBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3IsIGhhbmRsZVByZXZFdmVudFxuXG4gICAgICAgICAgaWYgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yXG4gICAgICAgICAgICAkKCdib2R5Jykub24gJ2NsaWNrJywgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yLCBoYW5kbGVOZXh0RXZlbnRcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAndG91Y2hzdGFydCcsIEBvcHRpb25zLm5leHRCdXR0b25TZWxlY3RvciwgaGFuZGxlTmV4dEV2ZW50XG5cbiAgICAgICAgIyBObyBzZWxlY3RvcnMgc2V0LCByZW5kZXIgdGVtcGxhdGVcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgQCRzbGlkZXIuYXBwZW5kIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1RlbXBsYXRlKClcblxuICAgICAgICAgIEAkc2xpZGVyLm9uICd0YXAnLCAnc3Bhbi5wcmV2JywgaGFuZGxlUHJldkV2ZW50XG4gICAgICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICdzcGFuLm5leHQnLCBoYW5kbGVOZXh0RXZlbnRcblxuXG4gICAgIyBBZGQgbmF2aWdhdGlvblxuICAgIHJlbmRlck5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgRGVsZXRlIG9sZCBzbGlkZXIgbmF2aWdhdGlvbiBlbGVtZW50c1xuICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4KS0+XG4gICAgICAgIGlmICFlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG4gICAgICAgICAgJChlbGVtZW50KS5yZW1vdmUoKVxuXG4gICAgICBfLmVhY2ggQG9wdGlvbnMubmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4LCBsaXN0KT0+XG5cbiAgICAgICAgaWYgZWxlbWVudCA9PSAnaW5kZXgnXG5cbiAgICAgICAgICAjIENyZWF0ZSBhIGpRdWVyeSBvYmplY3QgZGlyZWN0bHkgZnJvbSBzbGlkZXIgY29kZVxuICAgICAgICAgIG5ld0VsZW1lbnQgPSBAb3B0aW9ucy5pbmRleE5hdmlnYXRpb25UZW1wbGF0ZSh7J3NsaWRlcyc6IEAkc2xpZGVzLCAnY2Fyb3VzZWwnOiBAb3B0aW9ucy5jYXJvdXNlbH0pXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggJChuZXdFbGVtZW50KVxuXG4gICAgICAgICAgIyBBcHBlbmQgaXQgdG8gc2xpZGVyIGVsZW1lbnRcbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbilcblxuICAgICAgICAgICMgUmVzaXplIG5hdmlnYXRpb25cbiAgICAgICAgICBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jc3NcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6IC0oXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikud2lkdGgoKSAvIDIpXG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgICAgICBzZWxmLnJlZ2lzdGVyTGlzdGVuZXIgZWxlbWVudFxuXG4gICAgICAgIGVsc2UgaWYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeVxuXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggZWxlbWVudFxuICAgICAgICAgIG5hdmlnYXRpb25JdGVtcyA9IF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNoaWxkcmVuKClcblxuICAgICAgICAgIEAkc2xpZGVzLmVhY2ggKGluZGV4LHNsaWRlKT0+XG4gICAgICAgICAgICBpdGVtID0gbmF2aWdhdGlvbkl0ZW1zLmVxKGluZGV4KVxuICAgICAgICAgICAgaWYgaXRlbVxuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ3NsaWRlcl9pbmRleCcsIEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICAgICBpdGVtLmRhdGEgJ2l0ZW1faW5kZXgnLCBpbmRleCtwYXJzZUludChzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpXG4gICAgICAgICAgICAgIGl0ZW0uYWRkQ2xhc3MgJ3NsaWRlcl9uYXZpZ2F0aW9uSXRlbSdcbiAgICAgICAgICAgICAgaXRlbS5vbiAndGFwJywgKGV2ZW50KS0+XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgICAgICAgICBzZWxmLmdvVG9TbGlkZSAkKEApLmRhdGEoJ2l0ZW1faW5kZXgnKVxuXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG5cblxuICAgICMgUmVnaXN0ZXIgbGlzdGVuZXJcbiAgICByZWdpc3Rlckxpc3RlbmVyOiAobGlzdGVuZXIpLT5cblxuICAgICAgQCRzbGlkZXJMaXN0ZW5lcnMucHVzaCBsaXN0ZW5lclxuXG5cbiAgICAjIFVwZGF0ZSBuYXZpZ2F0aW9uIHN0YXR1c1xuICAgIHVwZGF0ZU5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyICgpLT4gJChAKS5kYXRhKCdpdGVtX2luZGV4JykgPT0gaW5kZXhcbiAgICAgICAgICAgICAgLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgVXBkYXRlIHNsaWRlIHByb3BlcnRpZXMgdG8gY3VycmVudCBzbGlkZXIgc3RhdGVcbiAgICB1cGRhdGVTbGlkZXM6IChhbmltYXRlPXRydWUpLT5cblxuICAgICAgIyBGYWRlIGluYWN0aXZlIHNsaWRlcyB0byBhIHNwZWNpZmljIG9wYWNpdHkgdmFsdWVcbiAgICAgIGlmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5ICYmIGFuaW1hdGVcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCBmYWxzZVxuXG4gICAgICBAJHNsaWRlcy5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBTZXQgc2xpZGUgb3BhY2l0eSBmb3IgYWN0aXZlIGFuZCBpbmFjdGl2ZSBzbGlkZXNcbiAgICBzZXRTbGlkZU9wYWNpdHk6IChhY3RpdmUsIGluYWN0aXZlLCBhbmltYXRlPXRydWUpLT5cblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuXG5cbiAgICAjIEV2ZW50IGNhbGxiYWNrIG9uIHNjcm9sbCBlbmRcbiAgICBvblNjcm9sbEVuZDogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBJZiBTbGlkZXIgc2hvd3MgbW9yZSB0aGFuIG9uZSBzbGlkZSBwZXIgcGFnZVxuICAgICAgIyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50U2xpZGUgaXMgb24gdGhlXG4gICAgICAjIGxhc3QgcGFnZSBhbmQgaGlnaGVyIHRoYW4gdGhlIG9uZSBzbmFwcGVkIHRvXG4gICAgICBpZiBAc2xpZGVzSW5Db250YWluZXIgPiAxXG4gICAgICAgIGlmIEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYIDwgQG51bWJlck9mU2xpZGVzIC0gQHNsaWRlc0luQ29udGFpbmVyXG4gICAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAjIElmIGxhc3Qgc2xpZGUsIHJldHVybiB0byBmaXJzdFxuICAgICAgICBpZiBAY3VycmVudFNsaWRlID49IEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG9wdGlvbnMuY2Fyb3VzZWwsIGZhbHNlXG4gICAgICAgICMgSWYgZmlyc3Qgc2xpZGUsIG1vdmUgdG8gbGFzdFxuICAgICAgICBlbHNlIGlmIEBjdXJyZW50U2xpZGUgPCBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG51bWJlck9mU2xpZGVzIC0gKEBvcHRpb25zLmNhcm91c2VsKzEpLCBmYWxzZVxuXG4gICAgICBfLmVhY2ggQCRzbGlkZXJMaXN0ZW5lcnMsIChsaXN0ZW5lciktPlxuXG4gICAgICAgICMgVXBkYXRlIHJlbW90ZSBzbGlkZXJcbiAgICAgICAgbGlzdGVuZXIuU2xpZGVyICdzdG9wQXV0b1Njcm9sbCdcbiAgICAgICAgbGlzdGVuZXIuU2xpZGVyICdnb1RvU2xpZGUnLCBzZWxmLmN1cnJlbnRTbGlkZSAtIHNlbGYub3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICBAdXBkYXRlU2xpZGVzKClcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgVXNlciB0b3VjaGVzIHRoZSBzY3JlZW4gYnV0IHNjcm9sbGluZyBkaWRuJ3Qgc3RhcnQgeWV0XG4gICAgb25CZWZvcmVTY3JvbGxTdGFydDogPT5cblxuICAgICAgQHN0b3BBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBSZXNpemUgc2xpZGVyXG4gICAgcmVzaXplOiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG4gICAgICBpZiBAb3B0aW9ucy5zbGlkZVdpZHRoID09ICdhdXRvJ1xuICAgICAgICBAJHNsaWRlcy53aWR0aCBAJHNsaWRlci5vdXRlcldpZHRoKClcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMud2lkdGggcGFyc2VJbnQoQG9wdGlvbnMuc2xpZGVXaWR0aCkgKyAncHgnXG5cbiAgICAgICMgQ2FsY3VsYXRlIGNvbnRhaW5lciB3aWR0aFxuICAgICAgIyBBIHBvc3NpYmxlIG1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgZWxlbWVudHMgbWFrZXMgdGhpc1xuICAgICAgIyBhIGxpdHRsZSBtb3JlIHRyaWNreSB0aGFuIGl0IHNlZW1zLCB3ZSBkbyBub3Qgb25seSBuZWVkIHRvXG4gICAgICAjIG11bHRpcGx5IGFsbCBlbGVtZW50cyArIHRoZWlyIHJlc3BlY3RpdmUgc2lkZSBtYXJnaW5zIGxlZnQgYW5kXG4gICAgICAjIHJpZ2h0LCB3ZSBhbHNvIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQgdGhhdCB0aGUgZmlyc3QgYW5kIGxhc3RcbiAgICAgICMgZWxlbWVudCBtaWdodCBoYXZlIGEgZGlmZmVyZW50IG1hcmdpbiB0b3dhcmRzIHRoZSBiZWdpbm5pbmcgYW5kXG4gICAgICAjIGVuZCBvZiB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICBzbGlkZVdpZHRoID0gKEAkc2xpZGVzLm91dGVyV2lkdGgoKSArIChAb3B0aW9ucy5zbGlkZU1hcmdpbiAqIDIpKVxuICAgICAgY29udGFpbmVyV2lkdGggPSAgc2xpZGVXaWR0aCAqIEBudW1iZXJPZlNsaWRlc1xuXG4gICAgICAjIFJlbW92ZSBsYXN0IGFuZCBmaXJzdCBlbGVtZW50IGJvcmRlciBtYXJnaW5zXG4gICAgICBjb250YWluZXJXaWR0aCAtPSBAb3B0aW9ucy5zbGlkZU1hcmdpbiAqIDJcblxuICAgICAgIyBBZGQgd2hhdGV2ZXIgbWFyZ2luIHRoZXNlIHR3byBlbGVtZW50cyBoYXZlXG4gICAgICBjb250YWluZXJXaWR0aCArPSBwYXJzZUZsb2F0IEAkc2xpZGVzLmZpcnN0KCkuY3NzKCdtYXJnaW4tbGVmdCcpXG4gICAgICBjb250YWluZXJXaWR0aCArPSBwYXJzZUZsb2F0IEAkc2xpZGVzLmxhc3QoKS5jc3MoJ21hcmdpbi1yaWdodCcpXG5cbiAgICAgICMgRGV0ZXJtaW5lIHRoZSBhbW91bnQgb2Ygc2xpZGVzIHRoYXQgY2FuIGZpdCBpbnNpZGUgdGhlIHNsaWRlIGNvbnRhaW5lclxuICAgICAgIyBXZSBuZWVkIHRoaXMgZm9yIHRoZSBvblNjcm9sbEVuZCBldmVudCwgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnQgc2xpZGVcbiAgICAgICMgaXMgYWxyZWFkeSBvbiB0aGUgbGFzdCBwYWdlXG4gICAgICBAc2xpZGVzSW5Db250YWluZXIgPSBNYXRoLmNlaWwgQCRzbGlkZXIud2lkdGgoKSAvIHNsaWRlV2lkdGhcblxuICAgICAgQCRzbGlkZUNvbnRhaW5lci53aWR0aCBjb250YWluZXJXaWR0aFxuICAgICAgQCRzbGlkZUNvbnRhaW5lci5oZWlnaHQgQCRzbGlkZXIuaGVpZ2h0KClcblxuICAgICAgaWYgQGlTY3JvbGxcbiAgICAgICAgQGlTY3JvbGwucmVmcmVzaCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLmF1dG9zY3JvbGxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cblxuICAgICMgQmluZCBldmVudHNcbiAgICBiaW5kRXZlbnRzOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAaVNjcm9sbC5vbiAnc2Nyb2xsRW5kJywgQG9uU2Nyb2xsRW5kXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdiZWZvcmVTY3JvbGxTdGFydCcsIEBvbkJlZm9yZVNjcm9sbFN0YXJ0XG5cbiAgICAgIEAkc2xpZGVzLm9uICd0YXAnLCAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25TbGlkZUNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25TbGlkZUNsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICd1bC5zbGlkZXJOYXZpZ2F0aW9uIGxpJywgLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgICQod2luZG93KS5iaW5kICdyZXNpemUnLCAtPlxuICAgICAgICBzZWxmLnJlc2l6ZSgpXG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gKEBjdXJyZW50U2xpZGUrMSlcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAoQGN1cnJlbnRTbGlkZSsxKVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IDBcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHByZXZpb3VzIHNsaWRlXG4gICAgcHJldlNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAY3VycmVudFNsaWRlLTEgPj0gMFxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBjdXJyZW50U2xpZGUtMVxuICAgICAgZWxzZVxuICAgICAgICBuZXh0U2xpZGVJbmRleCA9IEBudW1iZXJPZlNsaWRlcy0xXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBzbGlkZSBpbmRleFxuICAgIGdvVG9TbGlkZTogKGluZGV4LCBhbmltYXRlPXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgXy5lYWNoIEAkc2xpZGVyTGlzdGVuZXJzLCAobGlzdGVuZXIpLT5cblxuICAgICAgICAjIFVwZGF0ZSByZW1vdGUgc2xpZGVyXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnc3RvcEF1dG9TY3JvbGwnXG4gICAgICAgIGxpc3RlbmVyLlNsaWRlciAnZ29Ub1NsaWRlJywgaW5kZXggLSBzZWxmLm9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=