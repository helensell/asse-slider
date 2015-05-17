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

//# sourceMappingURL=data:application/json;base64,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QU4sQ0FBVyxRQUFYLEVBQXFCLENBQUMsSUFBQSxHQUFXLElBQUEsTUFBQSxDQUFPLElBQVAsRUFBVSxNQUFWLEVBQWtCLEtBQWxCLENBQVosQ0FBckIsQ0FBQSxDQURGO1dBSEE7QUFNQSxVQUFBLElBQUcsTUFBQSxDQUFBLE1BQUEsS0FBaUIsUUFBcEI7QUFDRSxtQkFBTyxJQUFLLENBQUEsTUFBQSxDQUFPLENBQUMsS0FBYixDQUFtQixJQUFuQixFQUF5QixJQUF6QixDQUFQLENBREY7V0FQSTtRQUFBLENBQU4sRUFGa0I7TUFBQSxDQUFSO0tBQVosRUFoaUJEO0VBQUEsQ0FBRCxDQUFBLENBNmlCRSxNQUFNLENBQUMsTUE3aUJULEVBNmlCaUIsTUE3aUJqQixDQUFBLENBQUE7QUFBQSIsImZpbGUiOiJhc3NlLXNsaWRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiNcbiMgU2xpZGVyIGpRdWVyeSBwbHVnaW5cbiMgQXV0aG9yOiBUaG9tYXMgS2xva29zY2ggPG1haWxAdGhvbWFza2xva29zY2guY29tPlxuI1xuKCgkLCB3aW5kb3cpIC0+XG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpbiBjbGFzc1xuICBjbGFzcyBTbGlkZXJcblxuICAgIGlTY3JvbGw6IG51bGxcbiAgICBudW1iZXJPZlNsaWRlczogbnVsbFxuICAgIGN1cnJlbnRTbGlkZTogMFxuICAgIGludGVydmFsOiBudWxsXG5cbiAgICAkc2xpZGVyOiBudWxsXG4gICAgJHNsaWRlQ29udGFpbmVyOiBudWxsXG4gICAgJHNsaWRlczogbnVsbFxuICAgICRzbGlkZXJOYXZpZ2F0aW9uOiBudWxsXG4gICAgJHNsaWRlckxpc3RlbmVyczogbnVsbFxuICAgICRzbGlkZXNJbkNvbnRhaW5lcjogbnVsbFxuXG4gICAgZGVmYXVsdHM6XG4gICAgICBhdXRvc2Nyb2xsOiB0cnVlXG4gICAgICBzcGVlZDogNTAwXG4gICAgICBpbnRlcnZhbDogNTAwMFxuICAgICAgZGVidWc6IHRydWVcbiAgICAgIHNuYXA6IHRydWVcblxuICAgICAgIyBJbiB0aGlzIHN0YXRlLCB0aGUgc2xpZGVyIGluc3RhbmNlIHNob3VsZCBuZXZlciBmb3J3YXJkIGV2ZW50cyB0b1xuICAgICAgIyB0aGUgaVNjcm9sbCBjb21wb25lbnQsIGUuZy4gd2hlbiB0aGUgc2xpZGVyIGlzIG5vdCB2aXNpYmxlIChkaXNwbGF5Om5vbmUpXG4gICAgICAjIGFuZCB0aGVyZWZvcmUgaVNjcm9sbCBjYW4ndCBnZXQvc2Nyb2xsIHRoZSBzbGlkZSBlbGVtZW50c1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlXG5cbiAgICAgICMgTmF2aWdhdGlvbiBlbGVtZW50IGFycmF5XG4gICAgICAjIGVpdGhlciAnaW5kZXgnIGZvciBvbi1zbGlkZXIgbmF2aWdhdGlvbiwgYSBqUXVlcnkgc2VsZWN0b3IgZm9yIGEgdGh1bWJuYWlsXG4gICAgICAjIG5hdmlnYXRpb24gb3IgYW5vdGhlciBzbGlkZXIgZWxlbWVudCBmb3IgYSBzbGlkZXIgYWN0aW5nIGFzIGEgc3luY2VkIHJlbW90ZVxuICAgICAgIyBuYXZpZ2F0aW9uIHRvIHRoaXMgc2xpZGVyIGluc3RhbmNlXG4gICAgICBuYXZpZ2F0aW9uOiBbJ2luZGV4J11cblxuICAgICAgIyBJbmRleCBuYXZpZ2F0aW9uIGRlZmF1bHQgdGVtcGxhdGVcbiAgICAgIGluZGV4TmF2aWdhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8dWwgY2xhc3M9XCJzbGlkZXJOYXZpZ2F0aW9uXCI+XG4gICAgICAgIDwlIF8uZWFjaChzbGlkZXMsIGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgpeyAlPlxuICAgICAgICAgIDwlIGlmKCFjYXJvdXNlbCB8fCAoaW5kZXg+PWNhcm91c2VsICYmIChpbmRleCsxKTw9c2xpZGVzLmxlbmd0aC1jYXJvdXNlbCkpeyAlPlxuICAgICAgICAgICAgPGxpIGRhdGEtaXRlbV9pbmRleD1cIjwlPSBpbmRleCAlPlwiIGNsYXNzPVwic2xpZGVyX25hdmlnYXRpb25JdGVtIGZhIGZhLWNpcmNsZS1vXCI+PC9saT5cbiAgICAgICAgICA8JSB9ICU+XG4gICAgICAgIDwlIH0pOyAlPlxuICAgICAgPC91bD4nKVxuXG4gICAgICBwcmV2TmV4dEJ1dHRvbnM6IHRydWVcbiAgICAgIHByZXZOZXh0QnV0dG9uc1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJldiBmYSBmYS1hbmdsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZXh0IGZhIGZhLWFuZ2xlLXJpZ2h0XCI+PC9zcGFuPicpXG5cbiAgICAgICMgSWYgb25lIG9mIHRoZXNlIHZhcmlhYmxlcyBpcyBhIGpRdWVyeSBzZWxlY3RvciwgdGhleSBhcmUgdXNlZCBpbnN0ZWFkXG4gICAgICAjIG9mIHJlbmRlcmluZyB0aGUgYWJvdmUgdGVtcGxhdGVcbiAgICAgIHByZXZCdXR0b25TZWxlY3RvcjogbnVsbFxuICAgICAgbmV4dEJ1dHRvblNlbGVjdG9yOiBudWxsXG5cbiAgICAgIHNsaWRlQ29udGFpbmVyU2VsZWN0b3I6ICcuc2xpZGVDb250YWluZXInXG4gICAgICBzbGlkZVNlbGVjdG9yOiAndWwuc2xpZGVzID4gbGknXG5cbiAgICAgICMgT3BhY2l0eSBvZiBzbGlkZXMgb3RoZXIgdGhhbiB0aGUgY3VycmVudFxuICAgICAgIyBPbmx5IGFwcGxpY2FibGUgaWYgdGhlIHNsaWRlciBlbGVtZW50IGhhcyBvdmVyZmxvdzogdmlzaWJsZVxuICAgICAgIyBhbmQgaW5hY3RpdmUgc2xpZGVzIGFyZSBzaG93biBuZXh0IHRvIHRoZSBjdXJyZW50XG4gICAgICBpbmFjdGl2ZVNsaWRlT3BhY2l0eTogbnVsbFxuXG4gICAgICAjIE1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgc2xpZGVzIGluIHBpeGVsc1xuICAgICAgc2xpZGVNYXJnaW46IDBcblxuICAgICAgIyBXaWR0aCBvZiB0aGUgc2xpZGUsIGRlZmF1bHRzIHRvIGF1dG8sIHRha2VzIGEgMTAwJSBzbGlkZXIgd2lkdGhcbiAgICAgIHNsaWRlV2lkdGg6ICdhdXRvJ1xuXG4gICAgICAjIEZha2UgYSBjYXJvdXNlbCBlZmZlY3QgYnkgc2hvd2luZyB0aGUgbGFzdCBzbGlkZSBuZXh0IHRvIHRoZSBmaXJzdFxuICAgICAgIyB0aGF0IGNhbid0IGJlIG5hdmlnYXRlZCB0byBidXQgZm9yd2FyZHMgdG8gdGhlIGVuZCBvZiB0aGUgc2xpZGVyXG4gICAgICAjIE51bWJlciBpbmRpY2F0ZXMgbnVtYmVyIG9mIHNsaWRlcyBwYWRkaW5nIGxlZnQgYW5kIHJpZ2h0XG4gICAgICBjYXJvdXNlbDogMFxuXG4gICAgICAjIENhbGxiYWNrIG9uIHNsaWRlciBpbml0aWFsaXphdGlvblxuICAgICAgb25TdGFydDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnU3RhcnQnXG5cbiAgICAgICMgU2xpZGUgY2xpY2sgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgIG9uU2xpZGVDbGljazogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgb25OZXh0Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ05leHQnXG5cbiAgICAgIG9uUHJldkNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdQcmV2J1xuXG4gICAgICBvblNjcm9sbEVuZDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnRW5kJ1xuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgaWYgQG9wdGlvbnMuaW5kZXggdGhlbiAnc2xpZGVyXycrQG9wdGlvbnMuaW5kZXggZWxzZSAnc2xpZGVyXycraW5kZXhcbiAgICAgIEAkc2xpZGVyLmFkZENsYXNzIGlmIEBvcHRpb25zLmluZGV4IHRoZW4gJ3NsaWRlcl8nK0BvcHRpb25zLmluZGV4IGVsc2UgJ3NsaWRlcl8nK2luZGV4XG4gICAgICBAJHNsaWRlck5hdmlnYXRpb24gPSBbXVxuICAgICAgQCRzbGlkZXNJbkNvbnRhaW5lciA9IG51bGxcblxuICAgICAgQG9wdGlvbnMub25TbGlkZUNsaWNrID0gKGV2ZW50KS0+XG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoZXZlbnQuY3VycmVudFRhcmdldCkuaW5kZXgoKVxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyID0gQCRzbGlkZXIuZmluZCBAb3B0aW9ucy5zbGlkZUNvbnRhaW5lclNlbGVjdG9yXG4gICAgICBAcmVmcmVzaFNsaWRlcygpXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgIEBhZGRDYXJvdXNlbFNsaWRlcygpXG4gICAgICAgIEByZWZyZXNoU2xpZGVzKClcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgICMgRW5hYmxlIHNsaWRlcyB0cm91Z2ggQ1NTXG4gICAgICBAZW5hYmxlU2xpZGVzKClcblxuICAgICAgQGlTY3JvbGwgPSBuZXcgSVNjcm9sbCBlbCxcbiAgICAgICAgc2Nyb2xsWDogdHJ1ZVxuICAgICAgICBzY3JvbGxZOiBmYWxzZVxuICAgICAgICBzbmFwOiBAb3B0aW9ucy5zbmFwXG4gICAgICAgIHNuYXBTcGVlZDogNDAwXG4gICAgICAgIHRhcDogdHJ1ZVxuICAgICAgICBtb21lbnR1bTogZmFsc2VcbiAgICAgICAgZXZlbnRQYXNzdGhyb3VnaDogdHJ1ZVxuICAgICAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2VcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgQGFkZFByZXZOZXh0QnV0dG9ucygpXG5cbiAgICAgIGlmIF8uc2l6ZShAb3B0aW9ucy5uYXZpZ2F0aW9uKVxuICAgICAgICBAcmVuZGVyTmF2aWdhdGlvbigpXG5cbiAgICAgIEByZXNpemUoKVxuICAgICAgQGdvVG9TbGlkZSBAY3VycmVudFNsaWRlLCBmYWxzZVxuICAgICAgQGJpbmRFdmVudHMoKVxuICAgICAgQGRlYnVnKClcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblN0YXJ0ID09ICdmdW5jdGlvbidcbiAgICAgICAgc2VsZi5vcHRpb25zLm9uU3RhcnQuYXBwbHkoQCwgW10pXG5cbiAgICAgIEBcblxuXG4gICAgIyBSZWZyZXNoIHNsaWRlc1xuICAgIHJlZnJlc2hTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzID0gQCRzbGlkZUNvbnRhaW5lci5maW5kIEBvcHRpb25zLnNsaWRlU2VsZWN0b3JcbiAgICAgIEBudW1iZXJPZlNsaWRlcyA9IEAkc2xpZGVzLmxlbmd0aFxuXG5cbiAgICAjIEVuYWJsZSBzbGlkZXMgdmlhIENTU1xuICAgIGVuYWJsZVNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMuY3NzXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaydcblxuXG4gICAgIyBBZGQgcHJldiBuZXh0IGJ1dHRvbnNcbiAgICBhZGRQcmV2TmV4dEJ1dHRvbnM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgTmV4dCBldmVudCBmdW5jdGlvblxuICAgICAgaGFuZGxlTmV4dEV2ZW50ID0gKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgIyBQcmV2IGV2ZW50IGZ1bmN0aW9uXG4gICAgICBoYW5kbGVQcmV2RXZlbnQgPSAoZXZlbnQpLT5cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYucHJldlNsaWRlKClcblxuICAgICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uUHJldkNsaWNrID09ICdmdW5jdGlvbidcbiAgICAgICAgICBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBpZiBAb3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnNcblxuICAgICAgICAjIENoZWNrIGlmIHByZXYvbmV4dCBidXR0b24gc2VsZWN0b3JzIGFyZSBzZXQgaW4gb3B0aW9ucyxcbiAgICAgICAgIyBhbmQgaWYgc28sIHVzZSB0aGVtIGluc3RlYWQgb2YgcmVuZGVyaW5nIHRlbXBsYXRlXG4gICAgICAgIGlmIEBvcHRpb25zLnByZXZCdXR0b25TZWxlY3RvciBvciBAb3B0aW9ucy5uZXh0QnV0dG9uU2VsZWN0b3JcblxuICAgICAgICAgICMgV2UgY2FuJ3QgdXNlIHRoZSBjdXN0b20gJ3RhcCcgZXZlbnQgb3V0c2lkZSBvZiB0aGUgaVNjcm9sbCBlbGVtZW50XG4gICAgICAgICAgIyBUaGVyZWZvcmUgd2UgaGF2ZSB0byBiaW5kIGNsaWNrIGFuZCB0b3VjaHN0YXJ0IGV2ZW50cyBib3RoIHRvXG4gICAgICAgICAgIyB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgICAgICBpZiBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbiAnY2xpY2snLCBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3IsIGhhbmRsZVByZXZFdmVudFxuXG4gICAgICAgICAgaWYgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yXG4gICAgICAgICAgICAkKCdib2R5Jykub24gJ2NsaWNrJywgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yLCBoYW5kbGVOZXh0RXZlbnRcblxuICAgICAgICAjIE5vIHNlbGVjdG9ycyBzZXQsIHJlbmRlciB0ZW1wbGF0ZVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgQG9wdGlvbnMucHJldk5leHRCdXR0b25zVGVtcGxhdGUoKVxuXG4gICAgICAgICAgQCRzbGlkZXIub24gJ3RhcCcsICdzcGFuLnByZXYnLCBoYW5kbGVQcmV2RXZlbnRcbiAgICAgICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3NwYW4ubmV4dCcsIGhhbmRsZU5leHRFdmVudFxuXG5cbiAgICAjIEFkZCBuYXZpZ2F0aW9uXG4gICAgcmVuZGVyTmF2aWdhdGlvbjogLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBEZWxldGUgb2xkIHNsaWRlciBuYXZpZ2F0aW9uIGVsZW1lbnRzXG4gICAgICBfLmVhY2ggQCRzbGlkZXJOYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgpLT5cbiAgICAgICAgaWYgIWVsZW1lbnQuZGF0YSgnU2xpZGVyJylcbiAgICAgICAgICAkKGVsZW1lbnQpLnJlbW92ZSgpXG5cbiAgICAgIF8uZWFjaCBAb3B0aW9ucy5uYXZpZ2F0aW9uLCAoZWxlbWVudCwgaW5kZXgsIGxpc3QpPT5cblxuICAgICAgICBpZiBlbGVtZW50ID09ICdpbmRleCdcblxuICAgICAgICAgICMgQ3JlYXRlIGEgalF1ZXJ5IG9iamVjdCBkaXJlY3RseSBmcm9tIHNsaWRlciBjb2RlXG4gICAgICAgICAgbmV3RWxlbWVudCA9IEBvcHRpb25zLmluZGV4TmF2aWdhdGlvblRlbXBsYXRlKHsnc2xpZGVzJzogQCRzbGlkZXMsICdjYXJvdXNlbCc6IEBvcHRpb25zLmNhcm91c2VsfSlcbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCAkKG5ld0VsZW1lbnQpXG5cbiAgICAgICAgICAjIEFwcGVuZCBpdCB0byBzbGlkZXIgZWxlbWVudFxuICAgICAgICAgIEAkc2xpZGVyLmFwcGVuZCBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKVxuXG4gICAgICAgICAgIyBSZXNpemUgbmF2aWdhdGlvblxuICAgICAgICAgIF8ubGFzdChAJHNsaWRlck5hdmlnYXRpb24pLmNzc1xuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogLShfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS53aWR0aCgpIC8gMilcblxuICAgICAgICBlbHNlIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgIEAkc2xpZGVyTmF2aWdhdGlvbi5wdXNoIGVsZW1lbnRcbiAgICAgICAgICBuYXZpZ2F0aW9uSXRlbXMgPSBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jaGlsZHJlbigpXG5cbiAgICAgICAgICBAJHNsaWRlcy5lYWNoIChpbmRleCxzbGlkZSk9PlxuICAgICAgICAgICAgaXRlbSA9IG5hdmlnYXRpb25JdGVtcy5lcShpbmRleClcbiAgICAgICAgICAgIGlmIGl0ZW1cbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdzbGlkZXJfaW5kZXgnLCBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAgICAgaXRlbS5kYXRhICdpdGVtX2luZGV4JywgaW5kZXgrcGFyc2VJbnQoc2VsZi5vcHRpb25zLmNhcm91c2VsKVxuICAgICAgICAgICAgICBpdGVtLmFkZENsYXNzICdzbGlkZXJfbmF2aWdhdGlvbkl0ZW0nXG4gICAgICAgICAgICAgIGl0ZW0ub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgICAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG5cbiAgICAjIFVwZGF0ZSBuYXZpZ2F0aW9uIHN0YXR1c1xuICAgIHVwZGF0ZU5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG4gICAgICBpbmRleCA9IEBjdXJyZW50U2xpZGVcblxuICAgICAgaWYgIUBvcHRpb25zLmRpc2FibGVkXG5cbiAgICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQpLT5cblxuICAgICAgICAgIGlmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnlcblxuICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuc2xpZGVyX25hdmlnYXRpb25JdGVtJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICAgICAgICAuZmlsdGVyICgpLT4gJChAKS5kYXRhKCdpdGVtX2luZGV4JykgPT0gaW5kZXhcbiAgICAgICAgICAgICAgLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgVXBkYXRlIHNsaWRlIHByb3BlcnRpZXMgdG8gY3VycmVudCBzbGlkZXIgc3RhdGVcbiAgICB1cGRhdGVTbGlkZXM6IChhbmltYXRlPXRydWUpLT5cblxuICAgICAgIyBGYWRlIGluYWN0aXZlIHNsaWRlcyB0byBhIHNwZWNpZmljIG9wYWNpdHkgdmFsdWVcbiAgICAgIGlmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5ICYmIGFuaW1hdGVcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5LCBmYWxzZVxuXG4gICAgICBAJHNsaWRlcy5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuYWRkQ2xhc3MgJ2FjdGl2ZSdcblxuXG4gICAgIyBTZXQgc2xpZGUgb3BhY2l0eSBmb3IgYWN0aXZlIGFuZCBpbmFjdGl2ZSBzbGlkZXNcbiAgICBzZXRTbGlkZU9wYWNpdHk6IChhY3RpdmUsIGluYWN0aXZlLCBhbmltYXRlPXRydWUpLT5cblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAJHNsaWRlcy5zdG9wKCkuYW5pbWF0ZVxuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcbiAgICAgIGVsc2VcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGluYWN0aXZlXG5cbiAgICAgICAgQCRzbGlkZXMuZXEoQGN1cnJlbnRTbGlkZSkuc3RvcCgpLmNzc1xuICAgICAgICAgIG9wYWNpdHk6IGFjdGl2ZVxuXG5cbiAgICAjIEV2ZW50IGNhbGxiYWNrIG9uIHNjcm9sbCBlbmRcbiAgICBvblNjcm9sbEVuZDogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgIyBJZiBTbGlkZXIgc2hvd3MgbW9yZSB0aGFuIG9uZSBzbGlkZSBwZXIgcGFnZVxuICAgICAgIyB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBjdXJyZW50U2xpZGUgaXMgb24gdGhlXG4gICAgICAjIGxhc3QgcGFnZSBhbmQgaGlnaGVyIHRoYW4gdGhlIG9uZSBzbmFwcGVkIHRvXG4gICAgICBpZiBAc2xpZGVzSW5Db250YWluZXIgPiAxXG4gICAgICAgIGlmIEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYIDwgQG51bWJlck9mU2xpZGVzIC0gQHNsaWRlc0luQ29udGFpbmVyXG4gICAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG4gICAgICBlbHNlXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAaVNjcm9sbC5jdXJyZW50UGFnZS5wYWdlWFxuXG4gICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAjIElmIGxhc3Qgc2xpZGUsIHJldHVybiB0byBmaXJzdFxuICAgICAgICBpZiBAY3VycmVudFNsaWRlID49IEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG9wdGlvbnMuY2Fyb3VzZWwgKyAoQGN1cnJlbnRTbGlkZSAtIChAbnVtYmVyT2ZTbGlkZXMtQG9wdGlvbnMuY2Fyb3VzZWwpKSwgZmFsc2UsIGZhbHNlXG4gICAgICAgICMgSWYgZmlyc3Qgc2xpZGUsIG1vdmUgdG8gbGFzdFxuICAgICAgICBlbHNlIGlmIEBjdXJyZW50U2xpZGUgPCBAb3B0aW9ucy5jYXJvdXNlbFxuICAgICAgICAgIEBnb1RvU2xpZGUgQG51bWJlck9mU2xpZGVzIC0gKEBvcHRpb25zLmNhcm91c2VsKzEpLCBmYWxzZSwgZmFsc2VcblxuICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZCA9PSAnZnVuY3Rpb24nXG4gICAgICAgIHNlbGYub3B0aW9ucy5vblNjcm9sbEVuZC5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgIEB1cGRhdGVTbGlkZXMoKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBVc2VyIHRvdWNoZXMgdGhlIHNjcmVlbiBidXQgc2Nyb2xsaW5nIGRpZG4ndCBzdGFydCB5ZXRcbiAgICBvbkJlZm9yZVNjcm9sbFN0YXJ0OiA9PlxuXG4gICAgICBAc3RvcEF1dG9TY3JvbGwoKVxuXG5cbiAgICAjIFJlc2l6ZSBzbGlkZXJcbiAgICByZXNpemU6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuXG4gICAgIyBCaW5kIGV2ZW50c1xuICAgIGJpbmRFdmVudHM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdzY3JvbGxFbmQnLCBAb25TY3JvbGxFbmRcblxuICAgICAgQGlTY3JvbGwub24gJ2JlZm9yZVNjcm9sbFN0YXJ0JywgQG9uQmVmb3JlU2Nyb2xsU3RhcnRcblxuICAgICAgQCRzbGlkZXMub24gJ3RhcCcsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoQCwgW2V2ZW50LHNlbGZdKVxuXG4gICAgICBAJHNsaWRlci5vbiAndGFwJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIC0+XG4gICAgICAgIHNlbGYucmVzaXplKClcblxuXG4gICAgIyBHbyB0byBuZXh0IHNsaWRlXG4gICAgbmV4dFNsaWRlOiA9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBAbnVtYmVyT2ZTbGlkZXMgPiBAY3VycmVudFNsaWRlKzFcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlKzFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSAwXG5cbiAgICAgIEBnb1RvU2xpZGUgbmV4dFNsaWRlSW5kZXhcblxuXG4gICAgIyBHbyB0byBwcmV2aW91cyBzbGlkZVxuICAgIHByZXZTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQGN1cnJlbnRTbGlkZS0xID49IDBcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAY3VycmVudFNsaWRlLTFcbiAgICAgIGVsc2VcbiAgICAgICAgbmV4dFNsaWRlSW5kZXggPSBAbnVtYmVyT2ZTbGlkZXMtMVxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gc2xpZGUgaW5kZXhcbiAgICBnb1RvU2xpZGU6IChpbmRleCwgYW5pbWF0ZT10cnVlLCB0cmlnZ2VyRXZlbnQ9dHJ1ZSk9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBpZiBhbmltYXRlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgQG9wdGlvbnMuc3BlZWRcbiAgICAgIGVsc2VcbiAgICAgICAgQGlTY3JvbGw/LmdvVG9QYWdlIGluZGV4LCAwLCAwXG5cbiAgICAgIEBjdXJyZW50U2xpZGUgPSBpbmRleFxuICAgICAgQHVwZGF0ZVNsaWRlcyhhbmltYXRlKVxuICAgICAgQHVwZGF0ZU5hdmlnYXRpb24oKVxuXG4gICAgICBpZiB0cmlnZ2VyRXZlbnRcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgQCRzbGlkZXIuZGF0YSgnaW5kZXgnKSsnI2dvVG9TbGlkZScsIGluZGV4IC0gQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgQGRlYnVnKClcblxuXG4gICAgIyBBZGQgZmFrZSBjYXJvdXNlbCBzbGlkZXNcbiAgICBhZGRDYXJvdXNlbFNsaWRlczogLT5cblxuICAgICAgQCRzdGFydEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoLUBvcHRpb25zLmNhcm91c2VsKS5jbG9uZSgpXG4gICAgICBAJGVuZEVsZW1lbnRzID0gQCRzbGlkZXMuc2xpY2UoMCxAb3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuXG4gICAgICBAJHNsaWRlcy5wYXJlbnQoKS5wcmVwZW5kIEAkc3RhcnRFbGVtZW50c1xuICAgICAgQCRzbGlkZXMucGFyZW50KCkuYXBwZW5kIEAkZW5kRWxlbWVudHNcblxuXG4gICAgIyBTdGFydCBhdXRvc2Nyb2xsXG4gICAgc3RhcnRBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAbmV4dFNsaWRlLCBAb3B0aW9ucy5pbnRlcnZhbFxuXG5cbiAgICAjIFN0b3AgYXV0b3Njcm9sbFxuICAgIHN0b3BBdXRvU2Nyb2xsOiA9PlxuXG4gICAgICBjbGVhckludGVydmFsIEBpbnRlcnZhbFxuICAgICAgQGludGVydmFsID0gbnVsbFxuXG5cbiAgICAjIExpc3RlbiB0byBhbm90aGVyIHNsaWRlciBmb3IgbmF2aWdhdGlvblxuICAgICMgUGFzcyB0aGUgc2xpZGVyIGluZGV4IGZvciB0aGUgZXZlbnQgYmluZGluZyBzZWxlY3RvclxuICAgIGxpc3RlblRvOiAoaW5kZXgpLT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgJCgnYm9keScpLm9uICdzbGlkZXJfJytpbmRleCsnI2dvVG9TbGlkZScsIChldmVudCwgaW5kZXgpLT5cbiAgICAgICAgc2VsZi5zdG9wQXV0b1Njcm9sbCgpXG4gICAgICAgIHNlbGYuZ29Ub1NsaWRlIChpbmRleCArIHNlbGYub3B0aW9ucy5jYXJvdXNlbCksIHRydWUsIGZhbHNlXG5cblxuICAgICMgQWRkIGRlYnVnIG91dHB1dCB0byBzbGlkZXJcbiAgICBkZWJ1ZzogPT5cblxuICAgICAgaWYgQG9wdGlvbnMuZGVidWdcbiAgICAgICAgQCRzbGlkZXIuZmluZCgnLmRlYnVnJykucmVtb3ZlKClcbiAgICAgICAgQCRzbGlkZXIuYXBwZW5kIEBkZWJ1Z1RlbXBsYXRlXG4gICAgICAgICAgJ3NsaWRlcl9pbmRleCc6IEAkc2xpZGVyLmRhdGEgJ2luZGV4J1xuICAgICAgICAgICdudW1iZXJfb2Zfc2xpZGVzJzogQG51bWJlck9mU2xpZGVzXG4gICAgICAgICAgJ2N1cnJlbnRfc2xpZGUnOiBAaVNjcm9sbC5jdXJyZW50UGFnZT8ucGFnZVhcbiAgICAgICAgICAnYXV0b3Njcm9sbCc6IGlmIEBpbnRlcnZhbCB0aGVuICdlbmFibGVkJyBlbHNlICdkaXNhYmxlZCdcbiAgICAgICAgICAnbnVtYmVyX29mX25hdmlnYXRpb25zJzogQCRzbGlkZXJOYXZpZ2F0aW9uLmxlbmd0aFxuICAgICAgICAgICdzbGlkZXJfd2lkdGgnOiBAJHNsaWRlci53aWR0aCgpXG5cblxuICAgICMgUHJpbnQgb3B0aW9uIHRvIGNvbnNvbGVcbiAgICAjIENhbid0IGp1c3QgcmV0dXJuIHRoZSB2YWx1ZSB0byBkZWJ1ZyBpdCBiZWNhdXNlXG4gICAgIyBpdCB3b3VsZCBicmVhayBjaGFpbmluZyB3aXRoIHRoZSBqUXVlcnkgb2JqZWN0XG4gICAgIyBFdmVyeSBtZXRob2QgY2FsbCByZXR1cm5zIGEgalF1ZXJ5IG9iamVjdFxuICAgIGdldDogKG9wdGlvbikgLT5cbiAgICAgIGNvbnNvbGUubG9nICdvcHRpb246ICcrb3B0aW9uKycgaXMgJytAb3B0aW9uc1tvcHRpb25dXG4gICAgICBAb3B0aW9uc1tvcHRpb25dXG5cblxuICAgICMgU2V0IG9wdGlvbiB0byB0aGlzIGluc3RhbmNlcyBvcHRpb25zIGFycmF5XG4gICAgc2V0OiAob3B0aW9uLCB2YWx1ZSkgLT5cblxuICAgICAgIyBTZXQgb3B0aW9ucyB2YWx1ZVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXSA9IHZhbHVlXG5cbiAgICAgICMgSWYgbm8gaW50ZXJ2YWwgaXMgY3VycmVudGx5IHByZXNlbnQsIHN0YXJ0IGF1dG9zY3JvbGxcbiAgICAgIGlmIG9wdGlvbiA9PSAnYXV0b3Njcm9sbCcgJiYgIUBpbnRlcnZhbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgIyBUT0RPOiBVcGRhdGUgc2xpZGUgbWFyZ2luXG4gICAgICAjaWYgb3B0aW9uID09ICdzbGlkZU1hcmdpbidcbiAgICAgICAgIyBjYWNoZSBzbGlkZU1hcmdpbiBDU1Mgb24gZWxlbWVudD9cbiAgICAgICAgIyB3aGF0IGlmIHRoZSB1c2VyIHdhbnRzIHRvIHN3aXRjaCBiYWNrXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnaW5hY3RpdmVTbGlkZU9wYWNpdHknICYmIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHlcblxuICAgICAgaWYgb3B0aW9uID09ICduYXZpZ2F0aW9uJ1xuICAgICAgICBAcmVuZGVyTmF2aWdhdGlvbigpXG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbGlzdGVuVG8nXG4gICAgICAgIEBsaXN0ZW5UbyB2YWx1ZVxuXG4gICAgICBAZGVidWcoKVxuXG5cblxuICAjIERlZmluZSB0aGUgcGx1Z2luXG4gICQuZm4uZXh0ZW5kIFNsaWRlcjogKG9wdGlvbiwgYXJncy4uLikgLT5cblxuICAgIEBlYWNoIChpbmRleCktPlxuICAgICAgJHRoaXMgPSAkKEApXG4gICAgICBkYXRhID0gJHRoaXMuZGF0YSgnU2xpZGVyJylcblxuICAgICAgaWYgIWRhdGFcbiAgICAgICAgJHRoaXMuZGF0YSAnU2xpZGVyJywgKGRhdGEgPSBuZXcgU2xpZGVyKEAsIG9wdGlvbiwgaW5kZXgpKVxuXG4gICAgICBpZiB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnXG4gICAgICAgIHJldHVybiBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncylcblxuXG4pIHdpbmRvdy5qUXVlcnksIHdpbmRvd1xuXG4iXX0=