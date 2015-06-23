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
        onScrollEnd: function(event) {},
        onBeforeResize: function(event) {},
        onAfterResize: function(event) {}
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
        this.$slider.data('index', this.getSliderIndex(index));
        this.$slider.addClass(this.getSliderIndex(index));
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
          tap: false,
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

      Slider.prototype.getSliderIndex = function(index) {
        var idAttr;
        idAttr = this.$slider.attr('id');
        if (this.options.index) {
          return 'slider_' + this.options.index;
        } else if (typeof idAttr !== typeof void 0 && idAttr !== false) {
          return 'slider_' + idAttr;
        } else {
          return 'slider_' + index;
        }
      };

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
            self.options.onNextClick.apply(this, [event, self]);
          }
          return false;
        };
        handlePrevEvent = function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          self.prevSlide();
          if (typeof self.options.onPrevClick === 'function') {
            self.options.onPrevClick.apply(this, [event, self]);
          }
          return false;
        };
        if (this.options.prevButtonSelector) {
          $(this.options.prevButtonSelector + '[data-slider-prev=' + self.$slider.data('index') + ']').on('click', handlePrevEvent);
        }
        if (this.options.nextButtonSelector) {
          $(this.options.nextButtonSelector + '[data-slider-next=' + self.$slider.data('index') + ']').on('click', handleNextEvent);
        }
        if (this.options.prevNextButtons) {
          this.$slider.append(this.options.prevNextButtonsTemplate());
          this.$slider.on('click', 'span.prev', handlePrevEvent);
          return this.$slider.on('click', 'span.next', handleNextEvent);
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

      Slider.prototype.resize = function(event) {
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
          this.startAutoScroll();
        }
        if (typeof this.options.onAfterResize === 'function') {
          return this.options.onAfterResize.apply(this, [event]);
        }
      };

      Slider.prototype.bindEvents = function() {
        var self;
        self = this;
        this.iScroll.on('scrollEnd', this.onScrollEnd);
        this.iScroll.on('beforeScrollStart', this.onBeforeScrollStart);
        this.$slides.on('click', function(event) {
          event.stopPropagation();
          self.stopAutoScroll();
          if (typeof self.options.onSlideClick === 'function') {
            return self.options.onSlideClick.apply(self, [event]);
          }
        });
        this.$slider.on('click', 'ul.sliderNavigation li', function() {
          self.stopAutoScroll();
          return self.goToSlide($(this).data('item_index'));
        });
        return $(window).bind('resize', function(event) {
          if (typeof self.options.onBeforeResize === 'function') {
            self.options.onBeforeResize.apply(self, [event]);
          }
          return self.resize(event);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2Utc2xpZGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTtBQUFBLE1BQUE7b0JBQUE7O0FBQUEsRUFBQSxDQUFDLFNBQUMsQ0FBRCxFQUFJLE1BQUosR0FBQTtBQUdDLFFBQUEsTUFBQTtBQUFBLElBQU07QUFFSix1QkFBQSxPQUFBLEdBQVMsSUFBVCxDQUFBOztBQUFBLHVCQUNBLGNBQUEsR0FBZ0IsSUFEaEIsQ0FBQTs7QUFBQSx1QkFFQSxZQUFBLEdBQWMsQ0FGZCxDQUFBOztBQUFBLHVCQUdBLFFBQUEsR0FBVSxJQUhWLENBQUE7O0FBQUEsdUJBS0EsT0FBQSxHQUFTLElBTFQsQ0FBQTs7QUFBQSx1QkFNQSxlQUFBLEdBQWlCLElBTmpCLENBQUE7O0FBQUEsdUJBT0EsT0FBQSxHQUFTLElBUFQsQ0FBQTs7QUFBQSx1QkFRQSxpQkFBQSxHQUFtQixJQVJuQixDQUFBOztBQUFBLHVCQVNBLGdCQUFBLEdBQWtCLElBVGxCLENBQUE7O0FBQUEsdUJBVUEsa0JBQUEsR0FBb0IsSUFWcEIsQ0FBQTs7QUFBQSx1QkFZQSxRQUFBLEdBQ0U7QUFBQSxRQUFBLFVBQUEsRUFBWSxJQUFaO0FBQUEsUUFDQSxLQUFBLEVBQU8sR0FEUDtBQUFBLFFBRUEsUUFBQSxFQUFVLElBRlY7QUFBQSxRQUdBLEtBQUEsRUFBTyxJQUhQO0FBQUEsUUFJQSxJQUFBLEVBQU0sSUFKTjtBQUFBLFFBU0EsUUFBQSxFQUFVLEtBVFY7QUFBQSxRQWVBLFVBQUEsRUFBWSxDQUFDLE9BQUQsQ0FmWjtBQUFBLFFBa0JBLHVCQUFBLEVBQXlCLENBQUMsQ0FBQyxRQUFGLENBQVcsMFFBQVgsQ0FsQnpCO0FBQUEsUUEwQkEsZUFBQSxFQUFpQixJQTFCakI7QUFBQSxRQTJCQSx1QkFBQSxFQUF5QixDQUFDLENBQUMsUUFBRixDQUFXLDBGQUFYLENBM0J6QjtBQUFBLFFBaUNBLGtCQUFBLEVBQW9CLElBakNwQjtBQUFBLFFBa0NBLGtCQUFBLEVBQW9CLElBbENwQjtBQUFBLFFBb0NBLHNCQUFBLEVBQXdCLGlCQXBDeEI7QUFBQSxRQXFDQSxhQUFBLEVBQWUsZ0JBckNmO0FBQUEsUUEwQ0Esb0JBQUEsRUFBc0IsSUExQ3RCO0FBQUEsUUE2Q0EsV0FBQSxFQUFhLENBN0NiO0FBQUEsUUFnREEsVUFBQSxFQUFZLE1BaERaO0FBQUEsUUFxREEsUUFBQSxFQUFVLENBckRWO0FBQUEsUUF3REEsT0FBQSxFQUFTLFNBQUMsS0FBRCxHQUFBLENBeERUO0FBQUEsUUE0REEsWUFBQSxFQUFjLFNBQUMsS0FBRCxHQUFBO2lCQUNaLElBQUMsQ0FBQSxTQUFELENBQVcsQ0FBQSxDQUFFLEtBQUssQ0FBQyxhQUFSLENBQXNCLENBQUMsS0FBdkIsQ0FBQSxDQUFYLEVBRFk7UUFBQSxDQTVEZDtBQUFBLFFBZ0VBLFdBQUEsRUFBYSxTQUFDLEtBQUQsR0FBQSxDQWhFYjtBQUFBLFFBbUVBLFdBQUEsRUFBYSxTQUFDLEtBQUQsR0FBQSxDQW5FYjtBQUFBLFFBc0VBLFdBQUEsRUFBYSxTQUFDLEtBQUQsR0FBQSxDQXRFYjtBQUFBLFFBeUVBLGNBQUEsRUFBZ0IsU0FBQyxLQUFELEdBQUEsQ0F6RWhCO0FBQUEsUUE0RUEsYUFBQSxFQUFlLFNBQUMsS0FBRCxHQUFBLENBNUVmO09BYkYsQ0FBQTs7QUFBQSx1QkE2RkEsYUFBQSxHQUFlLENBQUMsQ0FBQyxRQUFGLENBQVcsOFRBQVgsQ0E3RmYsQ0FBQTs7QUF5R2EsTUFBQSxnQkFBQyxFQUFELEVBQUssT0FBTCxFQUFjLEtBQWQsR0FBQTtBQUVYLFlBQUEsSUFBQTs7VUFGeUIsUUFBUTtTQUVqQztBQUFBLDJDQUFBLENBQUE7QUFBQSw2REFBQSxDQUFBO0FBQUEsK0RBQUEsQ0FBQTtBQUFBLG1EQUFBLENBQUE7QUFBQSxtREFBQSxDQUFBO0FBQUEsbURBQUEsQ0FBQTtBQUFBLDZDQUFBLENBQUE7QUFBQSx1RUFBQSxDQUFBO0FBQUEsdURBQUEsQ0FBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUFBLFFBRUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLENBQUMsTUFBRixDQUFTLEVBQVQsRUFBYSxJQUFDLENBQUEsUUFBZCxFQUF3QixPQUF4QixDQUZYLENBQUE7QUFBQSxRQUlBLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBQSxDQUFFLEVBQUYsQ0FKWCxDQUFBO0FBQUEsUUFLQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxPQUFkLEVBQXVCLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLENBQXZCLENBTEEsQ0FBQTtBQUFBLFFBTUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULENBQWtCLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLENBQWxCLENBTkEsQ0FBQTtBQUFBLFFBT0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCLEVBUHJCLENBQUE7QUFBQSxRQVFBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixJQVJ0QixDQUFBO0FBQUEsUUFVQSxJQUFDLENBQUEsZUFBRCxHQUFtQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFDLENBQUEsT0FBTyxDQUFDLHNCQUF2QixDQVZuQixDQUFBO0FBQUEsUUFXQSxJQUFDLENBQUEsYUFBRCxDQUFBLENBWEEsQ0FBQTtBQWFBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVo7QUFFRSxVQUFBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUFULEdBQW9CLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxhQUEvQixDQUE2QyxDQUFDLE1BQXJFO0FBQ0UsWUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsR0FBb0IsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixJQUFDLENBQUEsT0FBTyxDQUFDLGFBQS9CLENBQTZDLENBQUMsTUFBbEUsQ0FERjtXQUFBO0FBQUEsVUFHQSxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUhBLENBQUE7QUFBQSxVQUlBLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FKQSxDQUFBO0FBQUEsVUFLQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLFFBTHpCLENBRkY7U0FiQTtBQUFBLFFBdUJBLElBQUMsQ0FBQSxZQUFELENBQUEsQ0F2QkEsQ0FBQTtBQUFBLFFBeUJBLElBQUMsQ0FBQSxPQUFELEdBQWUsSUFBQSxPQUFBLENBQVEsRUFBUixFQUNiO0FBQUEsVUFBQSxPQUFBLEVBQVMsSUFBVDtBQUFBLFVBQ0EsT0FBQSxFQUFTLEtBRFQ7QUFBQSxVQUVBLElBQUEsRUFBTSxJQUFDLENBQUEsT0FBTyxDQUFDLElBRmY7QUFBQSxVQUdBLFNBQUEsRUFBVyxHQUhYO0FBQUEsVUFJQSxHQUFBLEVBQUssS0FKTDtBQUFBLFVBS0EsUUFBQSxFQUFVLEtBTFY7QUFBQSxVQU1BLGdCQUFBLEVBQWtCLElBTmxCO0FBQUEsVUFPQSxjQUFBLEVBQWdCLEtBUGhCO1NBRGEsQ0F6QmYsQ0FBQTtBQW1DQSxRQUFBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFaO0FBQ0UsVUFBQSxJQUFDLENBQUEsZUFBRCxDQUFBLENBQUEsQ0FERjtTQW5DQTtBQUFBLFFBc0NBLElBQUMsQ0FBQSxrQkFBRCxDQUFBLENBdENBLENBQUE7QUF3Q0EsUUFBQSxJQUFHLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFoQixDQUFIO0FBQ0UsVUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFBLENBREY7U0F4Q0E7QUFBQSxRQTJDQSxJQUFDLENBQUEsTUFBRCxDQUFBLENBM0NBLENBQUE7QUFBQSxRQTRDQSxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUMsQ0FBQSxZQUFaLEVBQTBCLEtBQTFCLENBNUNBLENBQUE7QUFBQSxRQTZDQSxJQUFDLENBQUEsVUFBRCxDQUFBLENBN0NBLENBQUE7QUFBQSxRQThDQSxJQUFDLENBQUEsS0FBRCxDQUFBLENBOUNBLENBQUE7QUFnREEsUUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFXLENBQUMsT0FBTyxDQUFDLE9BQXBCLEtBQStCLFVBQWxDO0FBQ0UsVUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFyQixDQUEyQixJQUEzQixFQUE4QixFQUE5QixDQUFBLENBREY7U0FoREE7QUFBQSxRQW1EQSxJQW5EQSxDQUZXO01BQUEsQ0F6R2I7O0FBQUEsdUJBb0tBLGNBQUEsR0FBZ0IsU0FBQyxLQUFELEdBQUE7QUFFZCxZQUFBLE1BQUE7QUFBQSxRQUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQVQsQ0FBQTtBQUVBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVo7QUFDRSxpQkFBTyxTQUFBLEdBQVUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUExQixDQURGO1NBQUEsTUFFSyxJQUFHLE1BQUEsQ0FBQSxNQUFBLEtBQWlCLE1BQUEsQ0FBQSxNQUFqQixJQUFxQyxNQUFBLEtBQVUsS0FBbEQ7QUFDSCxpQkFBTyxTQUFBLEdBQVUsTUFBakIsQ0FERztTQUFBLE1BQUE7QUFHSCxpQkFBTyxTQUFBLEdBQVUsS0FBakIsQ0FIRztTQU5TO01BQUEsQ0FwS2hCLENBQUE7O0FBQUEsdUJBaUxBLGFBQUEsR0FBZSxTQUFBLEdBQUE7QUFFYixRQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLGVBQWUsQ0FBQyxJQUFqQixDQUFzQixJQUFDLENBQUEsT0FBTyxDQUFDLGFBQS9CLENBQVgsQ0FBQTtlQUNBLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQSxPQUFPLENBQUMsT0FIZDtNQUFBLENBakxmLENBQUE7O0FBQUEsdUJBd0xBLFlBQUEsR0FBYyxTQUFBLEdBQUE7ZUFFWixJQUFDLENBQUEsT0FBTyxDQUFDLEdBQVQsQ0FDRTtBQUFBLFVBQUEsT0FBQSxFQUFTLE9BQVQ7U0FERixFQUZZO01BQUEsQ0F4TGQsQ0FBQTs7QUFBQSx1QkErTEEsa0JBQUEsR0FBb0IsU0FBQSxHQUFBO0FBRWxCLFlBQUEsc0NBQUE7QUFBQSxRQUFBLElBQUEsR0FBTyxJQUFQLENBQUE7QUFBQSxRQUdBLGVBQUEsR0FBa0IsU0FBQyxLQUFELEdBQUE7QUFDaEIsVUFBQSxLQUFLLENBQUMsZUFBTixDQUFBLENBQUEsQ0FBQTtBQUFBLFVBQ0EsSUFBSSxDQUFDLGNBQUwsQ0FBQSxDQURBLENBQUE7QUFBQSxVQUVBLElBQUksQ0FBQyxTQUFMLENBQUEsQ0FGQSxDQUFBO0FBSUEsVUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFXLENBQUMsT0FBTyxDQUFDLFdBQXBCLEtBQW1DLFVBQXRDO0FBQ0UsWUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUF6QixDQUErQixJQUEvQixFQUFrQyxDQUFDLEtBQUQsRUFBTyxJQUFQLENBQWxDLENBQUEsQ0FERjtXQUpBO2lCQVFBLE1BVGdCO1FBQUEsQ0FIbEIsQ0FBQTtBQUFBLFFBZUEsZUFBQSxHQUFrQixTQUFDLEtBQUQsR0FBQTtBQUNoQixVQUFBLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBQSxDQUFBO0FBQUEsVUFDQSxJQUFJLENBQUMsY0FBTCxDQUFBLENBREEsQ0FBQTtBQUFBLFVBRUEsSUFBSSxDQUFDLFNBQUwsQ0FBQSxDQUZBLENBQUE7QUFJQSxVQUFBLElBQUcsTUFBQSxDQUFBLElBQVcsQ0FBQyxPQUFPLENBQUMsV0FBcEIsS0FBbUMsVUFBdEM7QUFDRSxZQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQXpCLENBQStCLElBQS9CLEVBQWtDLENBQUMsS0FBRCxFQUFPLElBQVAsQ0FBbEMsQ0FBQSxDQURGO1dBSkE7aUJBUUEsTUFUZ0I7UUFBQSxDQWZsQixDQUFBO0FBNEJBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLGtCQUFaO0FBQ0UsVUFBQSxDQUFBLENBQUUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxrQkFBVCxHQUE0QixvQkFBNUIsR0FBaUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFiLENBQWtCLE9BQWxCLENBQWpELEdBQTRFLEdBQTlFLENBQWtGLENBQUMsRUFBbkYsQ0FBc0YsT0FBdEYsRUFBK0YsZUFBL0YsQ0FBQSxDQURGO1NBNUJBO0FBK0JBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLGtCQUFaO0FBQ0UsVUFBQSxDQUFBLENBQUUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxrQkFBVCxHQUE0QixvQkFBNUIsR0FBaUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFiLENBQWtCLE9BQWxCLENBQWpELEdBQTRFLEdBQTlFLENBQWtGLENBQUMsRUFBbkYsQ0FBc0YsT0FBdEYsRUFBK0YsZUFBL0YsQ0FBQSxDQURGO1NBL0JBO0FBbUNBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLGVBQVo7QUFFRSxVQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLHVCQUFULENBQUEsQ0FBaEIsQ0FBQSxDQUFBO0FBQUEsVUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxPQUFaLEVBQXFCLFdBQXJCLEVBQWtDLGVBQWxDLENBRkEsQ0FBQTtpQkFHQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxPQUFaLEVBQXFCLFdBQXJCLEVBQWtDLGVBQWxDLEVBTEY7U0FyQ2tCO01BQUEsQ0EvTHBCLENBQUE7O0FBQUEsdUJBNk9BLGdCQUFBLEdBQWtCLFNBQUEsR0FBQTtBQUVoQixZQUFBLElBQUE7QUFBQSxRQUFBLElBQUEsR0FBTyxJQUFQLENBQUE7QUFBQSxRQUdBLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLGlCQUFSLEVBQTJCLFNBQUMsT0FBRCxFQUFVLEtBQVYsR0FBQTtBQUN6QixVQUFBLElBQUcsQ0FBQSxPQUFRLENBQUMsSUFBUixDQUFhLFFBQWIsQ0FBSjttQkFDRSxDQUFBLENBQUUsT0FBRixDQUFVLENBQUMsTUFBWCxDQUFBLEVBREY7V0FEeUI7UUFBQSxDQUEzQixDQUhBLENBQUE7QUFBQSxRQU9BLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFoQixFQUE0QixDQUFBLFNBQUEsS0FBQSxHQUFBO2lCQUFBLFNBQUMsT0FBRCxFQUFVLEtBQVYsRUFBaUIsSUFBakIsR0FBQTtBQUUxQixnQkFBQSwyQkFBQTtBQUFBLFlBQUEsSUFBRyxPQUFBLEtBQVcsT0FBZDtBQUdFLGNBQUEsVUFBQSxHQUFhLEtBQUMsQ0FBQSxPQUFPLENBQUMsdUJBQVQsQ0FBaUM7QUFBQSxnQkFBQyxRQUFBLEVBQVUsS0FBQyxDQUFBLE9BQVo7QUFBQSxnQkFBcUIsVUFBQSxFQUFZLEtBQUMsQ0FBQSxPQUFPLENBQUMsUUFBMUM7ZUFBakMsQ0FBYixDQUFBO0FBQUEsY0FDQSxLQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBbkIsQ0FBd0IsQ0FBQSxDQUFFLFVBQUYsQ0FBeEIsQ0FEQSxDQUFBO0FBQUEsY0FJQSxLQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFDLENBQUEsaUJBQVIsQ0FBaEIsQ0FKQSxDQUFBO3FCQU9BLENBQUMsQ0FBQyxJQUFGLENBQU8sS0FBQyxDQUFBLGlCQUFSLENBQTBCLENBQUMsR0FBM0IsQ0FDRTtBQUFBLGdCQUFBLGFBQUEsRUFBZSxDQUFBLENBQUUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFDLENBQUEsaUJBQVIsQ0FBMEIsQ0FBQyxLQUEzQixDQUFBLENBQUEsR0FBcUMsQ0FBdEMsQ0FBaEI7ZUFERixFQVZGO2FBQUEsTUFhSyxJQUFHLE9BQUEsWUFBbUIsTUFBdEI7QUFFSCxjQUFBLEtBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxJQUFuQixDQUF3QixPQUF4QixDQUFBLENBQUE7QUFBQSxjQUNBLGVBQUEsR0FBa0IsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFDLENBQUEsaUJBQVIsQ0FBMEIsQ0FBQyxRQUEzQixDQUFBLENBRGxCLENBQUE7cUJBR0EsS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsU0FBQyxLQUFELEVBQU8sS0FBUCxHQUFBO0FBQ1osb0JBQUEsSUFBQTtBQUFBLGdCQUFBLElBQUEsR0FBTyxlQUFlLENBQUMsRUFBaEIsQ0FBbUIsS0FBbkIsQ0FBUCxDQUFBO0FBQ0EsZ0JBQUEsSUFBRyxJQUFIO0FBQ0Usa0JBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxjQUFWLEVBQTBCLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLE9BQWQsQ0FBMUIsQ0FBQSxDQUFBO0FBQUEsa0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXdCLEtBQUEsR0FBTSxRQUFBLENBQVMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUF0QixDQUE5QixDQURBLENBQUE7QUFBQSxrQkFFQSxJQUFJLENBQUMsUUFBTCxDQUFjLHVCQUFkLENBRkEsQ0FBQTt5QkFHQSxJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBaUIsU0FBQyxLQUFELEdBQUE7QUFDZixvQkFBQSxJQUFJLENBQUMsY0FBTCxDQUFBLENBQUEsQ0FBQTsyQkFDQSxJQUFJLENBQUMsU0FBTCxDQUFlLENBQUEsQ0FBRSxJQUFGLENBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixDQUFmLEVBRmU7a0JBQUEsQ0FBakIsRUFKRjtpQkFGWTtjQUFBLENBQWQsRUFMRzthQWZxQjtVQUFBLEVBQUE7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVCLENBUEEsQ0FBQTtlQXFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxFQXZDZ0I7TUFBQSxDQTdPbEIsQ0FBQTs7QUFBQSx1QkF3UkEsZ0JBQUEsR0FBa0IsU0FBQSxHQUFBO0FBRWhCLFlBQUEsV0FBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUFBLFFBQ0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxZQURULENBQUE7QUFHQSxRQUFBLElBQUcsQ0FBQSxJQUFFLENBQUEsT0FBTyxDQUFDLFFBQWI7aUJBRUUsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsaUJBQVIsRUFBMkIsU0FBQyxPQUFELEdBQUE7QUFFekIsWUFBQSxJQUFHLE9BQUEsWUFBbUIsTUFBdEI7cUJBRUUsQ0FBQSxDQUFFLE9BQUYsQ0FBVSxDQUFDLElBQVgsQ0FBZ0Isd0JBQWhCLENBQ0UsQ0FBQyxXQURILENBQ2UsUUFEZixDQUVFLENBQUMsTUFGSCxDQUVVLFNBQUEsR0FBQTt1QkFBSyxDQUFBLENBQUUsSUFBRixDQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsQ0FBQSxLQUEyQixNQUFoQztjQUFBLENBRlYsQ0FHRSxDQUFDLFFBSEgsQ0FHWSxRQUhaLEVBRkY7YUFGeUI7VUFBQSxDQUEzQixFQUZGO1NBTGdCO01BQUEsQ0F4UmxCLENBQUE7O0FBQUEsdUJBMFNBLFlBQUEsR0FBYyxTQUFDLE9BQUQsR0FBQTs7VUFBQyxVQUFRO1NBR3JCO0FBQUEsUUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsb0JBQVQsSUFBaUMsT0FBcEM7QUFDRSxVQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCLEVBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsb0JBQTdCLEVBQW1ELElBQW5ELENBQUEsQ0FERjtTQUFBLE1BQUE7QUFHRSxVQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCLEVBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsb0JBQTdCLEVBQW1ELEtBQW5ELENBQUEsQ0FIRjtTQUFBO0FBQUEsUUFLQSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsUUFBckIsQ0FMQSxDQUFBO2VBTUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksSUFBQyxDQUFBLFlBQWIsQ0FBMEIsQ0FBQyxRQUEzQixDQUFvQyxRQUFwQyxFQVRZO01BQUEsQ0ExU2QsQ0FBQTs7QUFBQSx1QkF1VEEsZUFBQSxHQUFpQixTQUFDLE1BQUQsRUFBUyxRQUFULEVBQW1CLE9BQW5CLEdBQUE7O1VBQW1CLFVBQVE7U0FFMUM7QUFBQSxRQUFBLElBQUcsT0FBSDtBQUNFLFVBQUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQUEsQ0FBZSxDQUFDLE9BQWhCLENBQ0U7QUFBQSxZQUFBLE9BQUEsRUFBUyxRQUFUO1dBREYsQ0FBQSxDQUFBO2lCQUdBLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLElBQUMsQ0FBQSxZQUFiLENBQTBCLENBQUMsSUFBM0IsQ0FBQSxDQUFpQyxDQUFDLE9BQWxDLENBQ0U7QUFBQSxZQUFBLE9BQUEsRUFBUyxNQUFUO1dBREYsRUFKRjtTQUFBLE1BQUE7QUFPRSxVQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFBLENBQWUsQ0FBQyxHQUFoQixDQUNFO0FBQUEsWUFBQSxPQUFBLEVBQVMsUUFBVDtXQURGLENBQUEsQ0FBQTtpQkFHQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxJQUFDLENBQUEsWUFBYixDQUEwQixDQUFDLElBQTNCLENBQUEsQ0FBaUMsQ0FBQyxHQUFsQyxDQUNFO0FBQUEsWUFBQSxPQUFBLEVBQVMsTUFBVDtXQURGLEVBVkY7U0FGZTtNQUFBLENBdlRqQixDQUFBOztBQUFBLHVCQXdVQSxXQUFBLEdBQWEsU0FBQyxLQUFELEdBQUE7QUFFWCxZQUFBLElBQUE7QUFBQSxRQUFBLElBQUEsR0FBTyxJQUFQLENBQUE7QUFLQSxRQUFBLElBQUcsSUFBQyxDQUFBLGlCQUFELEdBQXFCLENBQXhCO0FBQ0UsVUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQXJCLEdBQTZCLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQSxpQkFBbkQ7QUFDRSxZQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQXJDLENBREY7V0FERjtTQUFBLE1BQUE7QUFJRSxVQUFBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQXJDLENBSkY7U0FMQTtBQVdBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVo7QUFFRSxVQUFBLElBQUcsSUFBQyxDQUFBLFlBQUQsSUFBaUIsSUFBQyxDQUFBLGNBQUQsR0FBZ0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUE3QztBQUNFLFlBQUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsR0FBb0IsQ0FBQyxJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLElBQUMsQ0FBQSxjQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBMUIsQ0FBakIsQ0FBL0IsRUFBc0YsS0FBdEYsRUFBNkYsS0FBN0YsQ0FBQSxDQURGO1dBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBNUI7QUFDSCxZQUFBLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBQyxDQUFBLGNBQUQsR0FBa0IsQ0FBQyxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsR0FBa0IsQ0FBbkIsQ0FBN0IsRUFBb0QsS0FBcEQsRUFBMkQsS0FBM0QsQ0FBQSxDQURHO1dBTFA7U0FYQTtBQW1CQSxRQUFBLElBQUcsTUFBQSxDQUFBLElBQVcsQ0FBQyxPQUFPLENBQUMsV0FBcEIsS0FBbUMsVUFBdEM7QUFDRSxVQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQXpCLENBQStCLElBQS9CLEVBQWtDLENBQUMsS0FBRCxFQUFPLElBQVAsQ0FBbEMsQ0FBQSxDQURGO1NBbkJBO0FBQUEsUUFzQkEsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQXRCQSxDQUFBO0FBQUEsUUF1QkEsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0F2QkEsQ0FBQTtlQXdCQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBMUJXO01BQUEsQ0F4VWIsQ0FBQTs7QUFBQSx1QkFzV0EsbUJBQUEsR0FBcUIsU0FBQSxHQUFBO2VBRW5CLElBQUMsQ0FBQSxjQUFELENBQUEsRUFGbUI7TUFBQSxDQXRXckIsQ0FBQTs7QUFBQSx1QkE0V0EsTUFBQSxHQUFRLFNBQUMsS0FBRCxHQUFBO0FBRU4sWUFBQSwwQkFBQTtBQUFBLFFBQUEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFBLENBQUE7QUFFQSxRQUFBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULEtBQXVCLE1BQTFCO0FBQ0UsVUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBZSxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBQSxDQUFmLENBQUEsQ0FERjtTQUFBLE1BQUE7QUFHRSxVQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFlLFFBQUEsQ0FBUyxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQWxCLENBQUEsR0FBZ0MsSUFBL0MsQ0FBQSxDQUhGO1NBRkE7QUFBQSxRQWNBLFVBQUEsR0FBYyxJQUFDLENBQUEsT0FBTyxDQUFDLFVBQVQsQ0FBQSxDQUFBLEdBQXdCLENBQUMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxXQUFULEdBQXVCLENBQXhCLENBZHRDLENBQUE7QUFBQSxRQWVBLGNBQUEsR0FBa0IsVUFBQSxHQUFhLElBQUMsQ0FBQSxjQWZoQyxDQUFBO0FBQUEsUUFrQkEsY0FBQSxJQUFrQixJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsR0FBdUIsQ0FsQnpDLENBQUE7QUFBQSxRQXFCQSxjQUFBLElBQWtCLFVBQUEsQ0FBVyxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBQSxDQUFnQixDQUFDLEdBQWpCLENBQXFCLGFBQXJCLENBQVgsQ0FyQmxCLENBQUE7QUFBQSxRQXNCQSxjQUFBLElBQWtCLFVBQUEsQ0FBVyxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBQSxDQUFlLENBQUMsR0FBaEIsQ0FBb0IsY0FBcEIsQ0FBWCxDQXRCbEIsQ0FBQTtBQUFBLFFBMkJBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBLENBQUEsR0FBbUIsVUFBN0IsQ0EzQnJCLENBQUE7QUFBQSxRQTZCQSxJQUFDLENBQUEsZUFBZSxDQUFDLEtBQWpCLENBQXVCLGNBQXZCLENBN0JBLENBQUE7QUFBQSxRQThCQSxJQUFDLENBQUEsZUFBZSxDQUFDLE1BQWpCLENBQXdCLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFBLENBQXhCLENBOUJBLENBQUE7QUFnQ0EsUUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFKO0FBQ0UsVUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLE9BQVQsQ0FBQSxDQUFBLENBREY7U0FoQ0E7QUFtQ0EsUUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsVUFBWjtBQUNFLFVBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFBLENBREY7U0FuQ0E7QUFzQ0EsUUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFRLENBQUEsT0FBTyxDQUFDLGFBQWhCLEtBQWlDLFVBQXBDO2lCQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQXZCLENBQTZCLElBQTdCLEVBQWdDLENBQUMsS0FBRCxDQUFoQyxFQURGO1NBeENNO01BQUEsQ0E1V1IsQ0FBQTs7QUFBQSx1QkF5WkEsVUFBQSxHQUFZLFNBQUEsR0FBQTtBQUVWLFlBQUEsSUFBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUFBLFFBRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksV0FBWixFQUF5QixJQUFDLENBQUEsV0FBMUIsQ0FGQSxDQUFBO0FBQUEsUUFJQSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxtQkFBWixFQUFpQyxJQUFDLENBQUEsbUJBQWxDLENBSkEsQ0FBQTtBQUFBLFFBTUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksT0FBWixFQUFxQixTQUFDLEtBQUQsR0FBQTtBQUNuQixVQUFBLEtBQUssQ0FBQyxlQUFOLENBQUEsQ0FBQSxDQUFBO0FBQUEsVUFDQSxJQUFJLENBQUMsY0FBTCxDQUFBLENBREEsQ0FBQTtBQUVBLFVBQUEsSUFBRyxNQUFBLENBQUEsSUFBVyxDQUFDLE9BQU8sQ0FBQyxZQUFwQixLQUFvQyxVQUF2QzttQkFDRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUExQixDQUFnQyxJQUFoQyxFQUFzQyxDQUFDLEtBQUQsQ0FBdEMsRUFERjtXQUhtQjtRQUFBLENBQXJCLENBTkEsQ0FBQTtBQUFBLFFBWUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksT0FBWixFQUFxQix3QkFBckIsRUFBK0MsU0FBQSxHQUFBO0FBQzdDLFVBQUEsSUFBSSxDQUFDLGNBQUwsQ0FBQSxDQUFBLENBQUE7aUJBQ0EsSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFBLENBQUUsSUFBRixDQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsQ0FBZixFQUY2QztRQUFBLENBQS9DLENBWkEsQ0FBQTtlQWdCQSxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsSUFBVixDQUFlLFFBQWYsRUFBeUIsU0FBQyxLQUFELEdBQUE7QUFFdkIsVUFBQSxJQUFHLE1BQUEsQ0FBQSxJQUFXLENBQUMsT0FBTyxDQUFDLGNBQXBCLEtBQXNDLFVBQXpDO0FBQ0UsWUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUE1QixDQUFrQyxJQUFsQyxFQUF3QyxDQUFDLEtBQUQsQ0FBeEMsQ0FBQSxDQURGO1dBQUE7aUJBR0EsSUFBSSxDQUFDLE1BQUwsQ0FBWSxLQUFaLEVBTHVCO1FBQUEsQ0FBekIsRUFsQlU7TUFBQSxDQXpaWixDQUFBOztBQUFBLHVCQW9iQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBRVQsWUFBQSxvQkFBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUVBLFFBQUEsSUFBRyxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFDLENBQUEsWUFBRCxHQUFjLENBQW5DO0FBQ0UsVUFBQSxjQUFBLEdBQWlCLElBQUMsQ0FBQSxZQUFELEdBQWMsQ0FBL0IsQ0FERjtTQUFBLE1BQUE7QUFHRSxVQUFBLGNBQUEsR0FBaUIsQ0FBakIsQ0FIRjtTQUZBO2VBT0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxjQUFYLEVBVFM7TUFBQSxDQXBiWCxDQUFBOztBQUFBLHVCQWljQSxTQUFBLEdBQVcsU0FBQSxHQUFBO0FBRVQsWUFBQSxvQkFBQTtBQUFBLFFBQUEsSUFBQSxHQUFPLElBQVAsQ0FBQTtBQUVBLFFBQUEsSUFBRyxJQUFDLENBQUEsWUFBRCxHQUFjLENBQWQsSUFBbUIsQ0FBdEI7QUFDRSxVQUFBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLFlBQUQsR0FBYyxDQUEvQixDQURGO1NBQUEsTUFBQTtBQUdFLFVBQUEsY0FBQSxHQUFpQixJQUFDLENBQUEsY0FBRCxHQUFnQixDQUFqQyxDQUhGO1NBRkE7ZUFPQSxJQUFDLENBQUEsU0FBRCxDQUFXLGNBQVgsRUFUUztNQUFBLENBamNYLENBQUE7O0FBQUEsdUJBOGNBLFNBQUEsR0FBVyxTQUFDLEtBQUQsRUFBUSxPQUFSLEVBQXNCLFlBQXRCLEdBQUE7QUFFVCxZQUFBLGVBQUE7O1VBRmlCLFVBQVE7U0FFekI7O1VBRitCLGVBQWE7U0FFNUM7QUFBQSxRQUFBLElBQUEsR0FBTyxJQUFQLENBQUE7QUFFQSxRQUFBLElBQUcsT0FBSDs7ZUFDVSxDQUFFLFFBQVYsQ0FBbUIsS0FBbkIsRUFBMEIsQ0FBMUIsRUFBNkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUF0QztXQURGO1NBQUEsTUFBQTs7Z0JBR1UsQ0FBRSxRQUFWLENBQW1CLEtBQW5CLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCO1dBSEY7U0FGQTtBQUFBLFFBT0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsS0FQaEIsQ0FBQTtBQUFBLFFBUUEsSUFBQyxDQUFBLFlBQUQsQ0FBYyxPQUFkLENBUkEsQ0FBQTtBQUFBLFFBU0EsSUFBQyxDQUFBLGdCQUFELENBQUEsQ0FUQSxDQUFBO0FBV0EsUUFBQSxJQUFHLFlBQUg7QUFDRSxVQUFBLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxPQUFWLENBQWtCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLE9BQWQsQ0FBQSxHQUF1QixZQUF6QyxFQUF1RCxLQUFBLEdBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUF4RSxDQUFBLENBREY7U0FYQTtlQWNBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFoQlM7TUFBQSxDQTljWCxDQUFBOztBQUFBLHVCQWtlQSxpQkFBQSxHQUFtQixTQUFBLEdBQUE7QUFFakIsUUFBQSxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBZSxDQUFBLElBQUUsQ0FBQSxPQUFPLENBQUMsUUFBekIsQ0FBa0MsQ0FBQyxLQUFuQyxDQUFBLENBQWxCLENBQUE7QUFBQSxRQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFlLENBQWYsRUFBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxRQUExQixDQUFtQyxDQUFDLEtBQXBDLENBQUEsQ0FEaEIsQ0FBQTtBQUFBLFFBR0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUEsQ0FBaUIsQ0FBQyxPQUFsQixDQUEwQixJQUFDLENBQUEsY0FBM0IsQ0FIQSxDQUFBO2VBSUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUEsQ0FBaUIsQ0FBQyxNQUFsQixDQUF5QixJQUFDLENBQUEsWUFBMUIsRUFOaUI7TUFBQSxDQWxlbkIsQ0FBQTs7QUFBQSx1QkE0ZUEsZUFBQSxHQUFpQixTQUFBLEdBQUE7ZUFFZixJQUFDLENBQUEsUUFBRCxHQUFZLFdBQUEsQ0FBWSxJQUFDLENBQUEsU0FBYixFQUF3QixJQUFDLENBQUEsT0FBTyxDQUFDLFFBQWpDLEVBRkc7TUFBQSxDQTVlakIsQ0FBQTs7QUFBQSx1QkFrZkEsY0FBQSxHQUFnQixTQUFBLEdBQUE7QUFFZCxRQUFBLGFBQUEsQ0FBYyxJQUFDLENBQUEsUUFBZixDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLEtBSEU7TUFBQSxDQWxmaEIsQ0FBQTs7QUFBQSx1QkEwZkEsUUFBQSxHQUFVLFNBQUMsS0FBRCxHQUFBO0FBRVIsWUFBQSxJQUFBO0FBQUEsUUFBQSxJQUFBLEdBQU8sSUFBUCxDQUFBO2VBRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBUyxDQUFDLEVBQVYsQ0FBYSxTQUFBLEdBQVUsS0FBVixHQUFnQixZQUE3QixFQUEyQyxTQUFDLEtBQUQsRUFBUSxLQUFSLEdBQUE7QUFDekMsVUFBQSxJQUFJLENBQUMsY0FBTCxDQUFBLENBQUEsQ0FBQTtpQkFDQSxJQUFJLENBQUMsU0FBTCxDQUFnQixLQUFBLEdBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFyQyxFQUFnRCxJQUFoRCxFQUFzRCxLQUF0RCxFQUZ5QztRQUFBLENBQTNDLEVBSlE7TUFBQSxDQTFmVixDQUFBOztBQUFBLHVCQW9nQkEsS0FBQSxHQUFPLFNBQUEsR0FBQTtBQUVMLFlBQUEsR0FBQTtBQUFBLFFBQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVo7QUFDRSxVQUFBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFFBQWQsQ0FBdUIsQ0FBQyxNQUF4QixDQUFBLENBQUEsQ0FBQTtpQkFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsSUFBQyxDQUFBLGFBQUQsQ0FDZDtBQUFBLFlBQUEsY0FBQSxFQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxPQUFkLENBQWhCO0FBQUEsWUFDQSxrQkFBQSxFQUFvQixJQUFDLENBQUEsY0FEckI7QUFBQSxZQUVBLGVBQUEsZ0RBQXFDLENBQUUsY0FGdkM7QUFBQSxZQUdBLFlBQUEsRUFBaUIsSUFBQyxDQUFBLFFBQUosR0FBa0IsU0FBbEIsR0FBaUMsVUFIL0M7QUFBQSxZQUlBLHVCQUFBLEVBQXlCLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxNQUo1QztBQUFBLFlBS0EsY0FBQSxFQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQVQsQ0FBQSxDQUxoQjtXQURjLENBQWhCLEVBRkY7U0FGSztNQUFBLENBcGdCUCxDQUFBOztBQUFBLHVCQXFoQkEsR0FBQSxHQUFLLFNBQUMsTUFBRCxHQUFBO0FBQ0gsUUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLFVBQUEsR0FBVyxNQUFYLEdBQWtCLE1BQWxCLEdBQXlCLElBQUMsQ0FBQSxPQUFRLENBQUEsTUFBQSxDQUE5QyxDQUFBLENBQUE7ZUFDQSxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQUEsRUFGTjtNQUFBLENBcmhCTCxDQUFBOztBQUFBLHVCQTJoQkEsR0FBQSxHQUFLLFNBQUMsTUFBRCxFQUFTLEtBQVQsR0FBQTtBQUdILFFBQUEsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFBLENBQVQsR0FBbUIsS0FBbkIsQ0FBQTtBQUdBLFFBQUEsSUFBRyxNQUFBLEtBQVUsWUFBVixJQUEwQixDQUFBLElBQUUsQ0FBQSxRQUEvQjtBQUNFLFVBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFBLENBREY7U0FIQTtBQVdBLFFBQUEsSUFBRyxNQUFBLEtBQVUsc0JBQVYsSUFBb0MsSUFBQyxDQUFBLE9BQU8sQ0FBQyxvQkFBaEQ7QUFDRSxVQUFBLElBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCLEVBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsb0JBQTdCLENBQUEsQ0FERjtTQVhBO0FBY0EsUUFBQSxJQUFHLE1BQUEsS0FBVSxZQUFiO0FBQ0UsVUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQSxDQUFBLENBREY7U0FkQTtBQWlCQSxRQUFBLElBQUcsTUFBQSxLQUFVLFVBQWI7QUFDRSxVQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixDQUFBLENBREY7U0FqQkE7ZUFvQkEsSUFBQyxDQUFBLEtBQUQsQ0FBQSxFQXZCRztNQUFBLENBM2hCTCxDQUFBOztvQkFBQTs7UUFGRixDQUFBO1dBeWpCQSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQUwsQ0FBWTtBQUFBLE1BQUEsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUVsQixZQUFBLFlBQUE7QUFBQSxRQUZtQix1QkFBUSw0REFFM0IsQ0FBQTtlQUFBLElBQUMsQ0FBQSxJQUFELENBQU0sU0FBQyxLQUFELEdBQUE7QUFDSixjQUFBLFdBQUE7QUFBQSxVQUFBLEtBQUEsR0FBUSxDQUFBLENBQUUsSUFBRixDQUFSLENBQUE7QUFBQSxVQUNBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLFFBQVgsQ0FEUCxDQUFBO0FBR0EsVUFBQSxJQUFHLENBQUEsSUFBSDtBQUNFLFlBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBQXFCLENBQUMsSUFBQSxHQUFXLElBQUEsTUFBQSxDQUFPLElBQVAsRUFBVSxNQUFWLEVBQWtCLEtBQWxCLENBQVosQ0FBckIsQ0FBQSxDQURGO1dBSEE7QUFNQSxVQUFBLElBQUcsTUFBQSxDQUFBLE1BQUEsS0FBaUIsUUFBcEI7QUFDRSxtQkFBTyxJQUFLLENBQUEsTUFBQSxDQUFPLENBQUMsS0FBYixDQUFtQixJQUFuQixFQUF5QixJQUF6QixDQUFQLENBREY7V0FQSTtRQUFBLENBQU4sRUFGa0I7TUFBQSxDQUFSO0tBQVosRUE1akJEO0VBQUEsQ0FBRCxDQUFBLENBeWtCRSxNQUFNLENBQUMsTUF6a0JULEVBeWtCaUIsTUF6a0JqQixDQUFBLENBQUE7QUFBQSIsImZpbGUiOiJhc3NlLXNsaWRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiNcbiMgU2xpZGVyIGpRdWVyeSBwbHVnaW5cbiMgQXV0aG9yOiBUaG9tYXMgS2xva29zY2ggPG1haWxAdGhvbWFza2xva29zY2guY29tPlxuI1xuKCgkLCB3aW5kb3cpIC0+XG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpbiBjbGFzc1xuICBjbGFzcyBTbGlkZXJcblxuICAgIGlTY3JvbGw6IG51bGxcbiAgICBudW1iZXJPZlNsaWRlczogbnVsbFxuICAgIGN1cnJlbnRTbGlkZTogMFxuICAgIGludGVydmFsOiBudWxsXG5cbiAgICAkc2xpZGVyOiBudWxsXG4gICAgJHNsaWRlQ29udGFpbmVyOiBudWxsXG4gICAgJHNsaWRlczogbnVsbFxuICAgICRzbGlkZXJOYXZpZ2F0aW9uOiBudWxsXG4gICAgJHNsaWRlckxpc3RlbmVyczogbnVsbFxuICAgICRzbGlkZXNJbkNvbnRhaW5lcjogbnVsbFxuXG4gICAgZGVmYXVsdHM6XG4gICAgICBhdXRvc2Nyb2xsOiB0cnVlXG4gICAgICBzcGVlZDogNTAwXG4gICAgICBpbnRlcnZhbDogNTAwMFxuICAgICAgZGVidWc6IHRydWVcbiAgICAgIHNuYXA6IHRydWVcblxuICAgICAgIyBJbiB0aGlzIHN0YXRlLCB0aGUgc2xpZGVyIGluc3RhbmNlIHNob3VsZCBuZXZlciBmb3J3YXJkIGV2ZW50cyB0b1xuICAgICAgIyB0aGUgaVNjcm9sbCBjb21wb25lbnQsIGUuZy4gd2hlbiB0aGUgc2xpZGVyIGlzIG5vdCB2aXNpYmxlIChkaXNwbGF5Om5vbmUpXG4gICAgICAjIGFuZCB0aGVyZWZvcmUgaVNjcm9sbCBjYW4ndCBnZXQvc2Nyb2xsIHRoZSBzbGlkZSBlbGVtZW50c1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlXG5cbiAgICAgICMgTmF2aWdhdGlvbiBlbGVtZW50IGFycmF5XG4gICAgICAjIGVpdGhlciAnaW5kZXgnIGZvciBvbi1zbGlkZXIgbmF2aWdhdGlvbiwgYSBqUXVlcnkgc2VsZWN0b3IgZm9yIGEgdGh1bWJuYWlsXG4gICAgICAjIG5hdmlnYXRpb24gb3IgYW5vdGhlciBzbGlkZXIgZWxlbWVudCBmb3IgYSBzbGlkZXIgYWN0aW5nIGFzIGEgc3luY2VkIHJlbW90ZVxuICAgICAgIyBuYXZpZ2F0aW9uIHRvIHRoaXMgc2xpZGVyIGluc3RhbmNlXG4gICAgICBuYXZpZ2F0aW9uOiBbJ2luZGV4J11cblxuICAgICAgIyBJbmRleCBuYXZpZ2F0aW9uIGRlZmF1bHQgdGVtcGxhdGVcbiAgICAgIGluZGV4TmF2aWdhdGlvblRlbXBsYXRlOiBfLnRlbXBsYXRlKCc8dWwgY2xhc3M9XCJzbGlkZXJOYXZpZ2F0aW9uXCI+XG4gICAgICAgIDwlIF8uZWFjaChzbGlkZXMsIGZ1bmN0aW9uKGVsZW1lbnQsaW5kZXgpeyAlPlxuICAgICAgICAgIDwlIGlmKCFjYXJvdXNlbCB8fCAoaW5kZXg+PWNhcm91c2VsICYmIChpbmRleCsxKTw9c2xpZGVzLmxlbmd0aC1jYXJvdXNlbCkpeyAlPlxuICAgICAgICAgICAgPGxpIGRhdGEtaXRlbV9pbmRleD1cIjwlPSBpbmRleCAlPlwiIGNsYXNzPVwic2xpZGVyX25hdmlnYXRpb25JdGVtIGZhIGZhLWNpcmNsZS1vXCI+PC9saT5cbiAgICAgICAgICA8JSB9ICU+XG4gICAgICAgIDwlIH0pOyAlPlxuICAgICAgPC91bD4nKVxuXG4gICAgICBwcmV2TmV4dEJ1dHRvbnM6IHRydWVcbiAgICAgIHByZXZOZXh0QnV0dG9uc1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJldiBmYSBmYS1hbmdsZS1sZWZ0XCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJuZXh0IGZhIGZhLWFuZ2xlLXJpZ2h0XCI+PC9zcGFuPicpXG5cbiAgICAgICMgSWYgb25lIG9mIHRoZXNlIHZhcmlhYmxlcyBpcyBhIGpRdWVyeSBzZWxlY3RvciwgdGhleSBhcmUgdXNlZCBpbnN0ZWFkXG4gICAgICAjIG9mIHJlbmRlcmluZyB0aGUgYWJvdmUgdGVtcGxhdGVcbiAgICAgIHByZXZCdXR0b25TZWxlY3RvcjogbnVsbFxuICAgICAgbmV4dEJ1dHRvblNlbGVjdG9yOiBudWxsXG5cbiAgICAgIHNsaWRlQ29udGFpbmVyU2VsZWN0b3I6ICcuc2xpZGVDb250YWluZXInXG4gICAgICBzbGlkZVNlbGVjdG9yOiAndWwuc2xpZGVzID4gbGknXG5cbiAgICAgICMgT3BhY2l0eSBvZiBzbGlkZXMgb3RoZXIgdGhhbiB0aGUgY3VycmVudFxuICAgICAgIyBPbmx5IGFwcGxpY2FibGUgaWYgdGhlIHNsaWRlciBlbGVtZW50IGhhcyBvdmVyZmxvdzogdmlzaWJsZVxuICAgICAgIyBhbmQgaW5hY3RpdmUgc2xpZGVzIGFyZSBzaG93biBuZXh0IHRvIHRoZSBjdXJyZW50XG4gICAgICBpbmFjdGl2ZVNsaWRlT3BhY2l0eTogbnVsbFxuXG4gICAgICAjIE1hcmdpbiBsZWZ0IGFuZCByaWdodCBvZiB0aGUgc2xpZGVzIGluIHBpeGVsc1xuICAgICAgc2xpZGVNYXJnaW46IDBcblxuICAgICAgIyBXaWR0aCBvZiB0aGUgc2xpZGUsIGRlZmF1bHRzIHRvIGF1dG8sIHRha2VzIGEgMTAwJSBzbGlkZXIgd2lkdGhcbiAgICAgIHNsaWRlV2lkdGg6ICdhdXRvJ1xuXG4gICAgICAjIEZha2UgYSBjYXJvdXNlbCBlZmZlY3QgYnkgc2hvd2luZyB0aGUgbGFzdCBzbGlkZSBuZXh0IHRvIHRoZSBmaXJzdFxuICAgICAgIyB0aGF0IGNhbid0IGJlIG5hdmlnYXRlZCB0byBidXQgZm9yd2FyZHMgdG8gdGhlIGVuZCBvZiB0aGUgc2xpZGVyXG4gICAgICAjIE51bWJlciBpbmRpY2F0ZXMgbnVtYmVyIG9mIHNsaWRlcyBwYWRkaW5nIGxlZnQgYW5kIHJpZ2h0XG4gICAgICBjYXJvdXNlbDogMFxuXG4gICAgICAjIENhbGxiYWNrIG9uIHNsaWRlciBpbml0aWFsaXphdGlvblxuICAgICAgb25TdGFydDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnU3RhcnQnXG5cbiAgICAgICMgU2xpZGUgY2xpY2sgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgIG9uU2xpZGVDbGljazogKGV2ZW50KS0+XG4gICAgICAgIEBnb1RvU2xpZGUgJChldmVudC5jdXJyZW50VGFyZ2V0KS5pbmRleCgpXG4gICAgICAgICNjb25zb2xlLmxvZyAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLmluZGV4KClcblxuICAgICAgb25OZXh0Q2xpY2s6IChldmVudCktPlxuICAgICAgICAjY29uc29sZS5sb2cgJ05leHQnXG5cbiAgICAgIG9uUHJldkNsaWNrOiAoZXZlbnQpLT5cbiAgICAgICAgI2NvbnNvbGUubG9nICdQcmV2J1xuXG4gICAgICBvblNjcm9sbEVuZDogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnRW5kJ1xuXG4gICAgICBvbkJlZm9yZVJlc2l6ZTogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnQmVmb3JlIFJlc2l6ZSdcblxuICAgICAgb25BZnRlclJlc2l6ZTogKGV2ZW50KS0+XG4gICAgICAgICNjb25zb2xlLmxvZyAnQWZ0ZXIgUmVzaXplJ1xuXG5cbiAgICBkZWJ1Z1RlbXBsYXRlOiBfLnRlbXBsYXRlKCdcbiAgICAgIDxkaXYgY2xhc3M9XCJkZWJ1Z1wiPlxuICAgICAgICA8c3Bhbj5TbGlkZXI6IDwlPSBzbGlkZXJfaW5kZXggJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPiMgb2Ygc2xpZGVzOiA8JT0gbnVtYmVyX29mX3NsaWRlcyAlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q3VycmVudCBzbGlkZTogPCU9IGN1cnJlbnRfc2xpZGUgJT48L3NwYW4+XG4gICAgICAgIDxzcGFuPkF1dG9zY3JvbGw6IDwlPSBhdXRvc2Nyb2xsICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj4jIG9mIG5hdmlnYXRpb25zOiA8JT0gbnVtYmVyX29mX25hdmlnYXRpb25zICU+PC9zcGFuPlxuICAgICAgICA8c3Bhbj5TbGlkZXIgd2lkdGg6IDwlPSBzbGlkZXJfd2lkdGggJT48L3NwYW4+XG4gICAgICA8L2Rpdj4nKVxuXG5cbiAgICAjIENvbnN0cnVjdG9yXG4gICAgY29uc3RydWN0b3I6IChlbCwgb3B0aW9ucywgaW5kZXggPSBudWxsKSAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBAZGVmYXVsdHMsIG9wdGlvbnMpXG5cbiAgICAgIEAkc2xpZGVyID0gJChlbClcbiAgICAgIEAkc2xpZGVyLmRhdGEgJ2luZGV4JywgQGdldFNsaWRlckluZGV4KGluZGV4KVxuICAgICAgQCRzbGlkZXIuYWRkQ2xhc3MgQGdldFNsaWRlckluZGV4KGluZGV4KVxuICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uID0gW11cbiAgICAgIEAkc2xpZGVzSW5Db250YWluZXIgPSBudWxsXG5cbiAgICAgIEAkc2xpZGVDb250YWluZXIgPSBAJHNsaWRlci5maW5kIEBvcHRpb25zLnNsaWRlQ29udGFpbmVyU2VsZWN0b3JcbiAgICAgIEByZWZyZXNoU2xpZGVzKClcblxuICAgICAgaWYgQG9wdGlvbnMuY2Fyb3VzZWxcblxuICAgICAgICBpZiBAb3B0aW9ucy5jYXJvdXNlbCA+IEAkc2xpZGVDb250YWluZXIuZmluZChAb3B0aW9ucy5zbGlkZVNlbGVjdG9yKS5sZW5ndGhcbiAgICAgICAgICBAb3B0aW9ucy5jYXJvdXNlbCA9IEAkc2xpZGVDb250YWluZXIuZmluZChAb3B0aW9ucy5zbGlkZVNlbGVjdG9yKS5sZW5ndGhcblxuICAgICAgICBAYWRkQ2Fyb3VzZWxTbGlkZXMoKVxuICAgICAgICBAcmVmcmVzaFNsaWRlcygpXG4gICAgICAgIEBjdXJyZW50U2xpZGUgPSBAb3B0aW9ucy5jYXJvdXNlbFxuXG4gICAgICAjIEVuYWJsZSBzbGlkZXMgdHJvdWdoIENTU1xuICAgICAgQGVuYWJsZVNsaWRlcygpXG5cbiAgICAgIEBpU2Nyb2xsID0gbmV3IElTY3JvbGwgZWwsXG4gICAgICAgIHNjcm9sbFg6IHRydWVcbiAgICAgICAgc2Nyb2xsWTogZmFsc2VcbiAgICAgICAgc25hcDogQG9wdGlvbnMuc25hcFxuICAgICAgICBzbmFwU3BlZWQ6IDQwMFxuICAgICAgICB0YXA6IGZhbHNlXG4gICAgICAgIG1vbWVudHVtOiBmYWxzZVxuICAgICAgICBldmVudFBhc3N0aHJvdWdoOiB0cnVlXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiBmYWxzZVxuXG4gICAgICBpZiBAb3B0aW9ucy5hdXRvc2Nyb2xsXG4gICAgICAgIEBzdGFydEF1dG9TY3JvbGwoKVxuXG4gICAgICBAYWRkUHJldk5leHRCdXR0b25zKClcblxuICAgICAgaWYgXy5zaXplKEBvcHRpb25zLm5hdmlnYXRpb24pXG4gICAgICAgIEByZW5kZXJOYXZpZ2F0aW9uKClcblxuICAgICAgQHJlc2l6ZSgpXG4gICAgICBAZ29Ub1NsaWRlIEBjdXJyZW50U2xpZGUsIGZhbHNlXG4gICAgICBAYmluZEV2ZW50cygpXG4gICAgICBAZGVidWcoKVxuXG4gICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU3RhcnQgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBzZWxmLm9wdGlvbnMub25TdGFydC5hcHBseShALCBbXSlcblxuICAgICAgQFxuXG5cbiAgICAjIEdldCB0aGUgdW5pcWUgc2xpZGVyIGluZGV4XG4gICAgIyBlaXRoZXIgc2V0IHZpYSBvcHRpb25zLCBieSBkb20gZWxlbWVudCBpZFxuICAgICMgb3IgbnVtZXJpYyBhdXRvLWluY3JlbWVudCBpZCBvZiBzbGlkZXIgaW5zdGFuY2VzXG4gICAgZ2V0U2xpZGVySW5kZXg6IChpbmRleCktPlxuXG4gICAgICBpZEF0dHIgPSBAJHNsaWRlci5hdHRyICdpZCdcblxuICAgICAgaWYgQG9wdGlvbnMuaW5kZXhcbiAgICAgICAgcmV0dXJuICdzbGlkZXJfJytAb3B0aW9ucy5pbmRleFxuICAgICAgZWxzZSBpZiB0eXBlb2YgaWRBdHRyICE9IHR5cGVvZiB1bmRlZmluZWQgJiYgaWRBdHRyICE9IGZhbHNlXG4gICAgICAgIHJldHVybiAnc2xpZGVyXycraWRBdHRyXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiAnc2xpZGVyXycraW5kZXhcblxuXG4gICAgIyBSZWZyZXNoIHNsaWRlc1xuICAgIHJlZnJlc2hTbGlkZXM6IC0+XG5cbiAgICAgIEAkc2xpZGVzID0gQCRzbGlkZUNvbnRhaW5lci5maW5kIEBvcHRpb25zLnNsaWRlU2VsZWN0b3JcbiAgICAgIEBudW1iZXJPZlNsaWRlcyA9IEAkc2xpZGVzLmxlbmd0aFxuXG5cbiAgICAjIEVuYWJsZSBzbGlkZXMgdmlhIENTU1xuICAgIGVuYWJsZVNsaWRlczogLT5cblxuICAgICAgQCRzbGlkZXMuY3NzXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaydcblxuXG4gICAgIyBBZGQgcHJldiBuZXh0IGJ1dHRvbnNcbiAgICBhZGRQcmV2TmV4dEJ1dHRvbnM6IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgTmV4dCBldmVudCBmdW5jdGlvblxuICAgICAgaGFuZGxlTmV4dEV2ZW50ID0gKGV2ZW50KS0+XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLm5leHRTbGlkZSgpXG5cbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vbk5leHRDbGljayA9PSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2VsZi5vcHRpb25zLm9uTmV4dENsaWNrLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgICAjIFJldHVybiBmYWxzZVxuICAgICAgICBmYWxzZVxuXG4gICAgICAjIFByZXYgZXZlbnQgZnVuY3Rpb25cbiAgICAgIGhhbmRsZVByZXZFdmVudCA9IChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5wcmV2U2xpZGUoKVxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25QcmV2Q2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblByZXZDbGljay5hcHBseShALCBbZXZlbnQsc2VsZl0pXG5cbiAgICAgICAgIyBSZXR1cm4gZmFsc2VcbiAgICAgICAgZmFsc2VcblxuICAgICAgIyBXZSBjYW4ndCB1c2UgdGhlIGN1c3RvbSAndGFwJyBldmVudCBvdXRzaWRlIG9mIHRoZSBpU2Nyb2xsIGVsZW1lbnRcbiAgICAgICMgVGhlcmVmb3JlIHdlIGhhdmUgdG8gYmluZCB0aGUgY2xpY2sgZXZlbnQgdG8gdGhlIGN1c3RvbSBlbGVtZW50XG4gICAgICBpZiBAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3JcbiAgICAgICAgJChAb3B0aW9ucy5wcmV2QnV0dG9uU2VsZWN0b3IrJ1tkYXRhLXNsaWRlci1wcmV2PScrc2VsZi4kc2xpZGVyLmRhdGEoJ2luZGV4JykrJ10nKS5vbiAnY2xpY2snLCBoYW5kbGVQcmV2RXZlbnRcblxuICAgICAgaWYgQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yXG4gICAgICAgICQoQG9wdGlvbnMubmV4dEJ1dHRvblNlbGVjdG9yKydbZGF0YS1zbGlkZXItbmV4dD0nK3NlbGYuJHNsaWRlci5kYXRhKCdpbmRleCcpKyddJykub24gJ2NsaWNrJywgaGFuZGxlTmV4dEV2ZW50XG5cbiAgICAgICMgSWYgcHJldk5leHRCdXR0b25zIG9wdGlvbiBpcyBzZXQsIGFkZCB0aGUgYnV0dG9ucyB0ZW1wbGF0ZSB0byB0aGUgcGFnZVxuICAgICAgaWYgQG9wdGlvbnMucHJldk5leHRCdXR0b25zXG5cbiAgICAgICAgQCRzbGlkZXIuYXBwZW5kIEBvcHRpb25zLnByZXZOZXh0QnV0dG9uc1RlbXBsYXRlKClcblxuICAgICAgICBAJHNsaWRlci5vbiAnY2xpY2snLCAnc3Bhbi5wcmV2JywgaGFuZGxlUHJldkV2ZW50XG4gICAgICAgIEAkc2xpZGVyLm9uICdjbGljaycsICdzcGFuLm5leHQnLCBoYW5kbGVOZXh0RXZlbnRcblxuXG4gICAgIyBBZGQgbmF2aWdhdGlvblxuICAgIHJlbmRlck5hdmlnYXRpb246IC0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICMgRGVsZXRlIG9sZCBzbGlkZXIgbmF2aWdhdGlvbiBlbGVtZW50c1xuICAgICAgXy5lYWNoIEAkc2xpZGVyTmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4KS0+XG4gICAgICAgIGlmICFlbGVtZW50LmRhdGEoJ1NsaWRlcicpXG4gICAgICAgICAgJChlbGVtZW50KS5yZW1vdmUoKVxuXG4gICAgICBfLmVhY2ggQG9wdGlvbnMubmF2aWdhdGlvbiwgKGVsZW1lbnQsIGluZGV4LCBsaXN0KT0+XG5cbiAgICAgICAgaWYgZWxlbWVudCA9PSAnaW5kZXgnXG5cbiAgICAgICAgICAjIENyZWF0ZSBhIGpRdWVyeSBvYmplY3QgZGlyZWN0bHkgZnJvbSBzbGlkZXIgY29kZVxuICAgICAgICAgIG5ld0VsZW1lbnQgPSBAb3B0aW9ucy5pbmRleE5hdmlnYXRpb25UZW1wbGF0ZSh7J3NsaWRlcyc6IEAkc2xpZGVzLCAnY2Fyb3VzZWwnOiBAb3B0aW9ucy5jYXJvdXNlbH0pXG4gICAgICAgICAgQCRzbGlkZXJOYXZpZ2F0aW9uLnB1c2ggJChuZXdFbGVtZW50KVxuXG4gICAgICAgICAgIyBBcHBlbmQgaXQgdG8gc2xpZGVyIGVsZW1lbnRcbiAgICAgICAgICBAJHNsaWRlci5hcHBlbmQgXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbilcblxuICAgICAgICAgICMgUmVzaXplIG5hdmlnYXRpb25cbiAgICAgICAgICBfLmxhc3QoQCRzbGlkZXJOYXZpZ2F0aW9uKS5jc3NcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6IC0oXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikud2lkdGgoKSAvIDIpXG5cbiAgICAgICAgZWxzZSBpZiBlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5XG5cbiAgICAgICAgICBAJHNsaWRlck5hdmlnYXRpb24ucHVzaCBlbGVtZW50XG4gICAgICAgICAgbmF2aWdhdGlvbkl0ZW1zID0gXy5sYXN0KEAkc2xpZGVyTmF2aWdhdGlvbikuY2hpbGRyZW4oKVxuXG4gICAgICAgICAgQCRzbGlkZXMuZWFjaCAoaW5kZXgsc2xpZGUpPT5cbiAgICAgICAgICAgIGl0ZW0gPSBuYXZpZ2F0aW9uSXRlbXMuZXEoaW5kZXgpXG4gICAgICAgICAgICBpZiBpdGVtXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnc2xpZGVyX2luZGV4JywgQCRzbGlkZXIuZGF0YSAnaW5kZXgnXG4gICAgICAgICAgICAgIGl0ZW0uZGF0YSAnaXRlbV9pbmRleCcsIGluZGV4K3BhcnNlSW50KHNlbGYub3B0aW9ucy5jYXJvdXNlbClcbiAgICAgICAgICAgICAgaXRlbS5hZGRDbGFzcyAnc2xpZGVyX25hdmlnYXRpb25JdGVtJ1xuICAgICAgICAgICAgICBpdGVtLm9uICdjbGljaycsIChldmVudCktPlxuICAgICAgICAgICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICAgICAgICAgIHNlbGYuZ29Ub1NsaWRlICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpXG5cbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuXG4gICAgIyBVcGRhdGUgbmF2aWdhdGlvbiBzdGF0dXNcbiAgICB1cGRhdGVOYXZpZ2F0aW9uOiAtPlxuXG4gICAgICBzZWxmID0gQFxuICAgICAgaW5kZXggPSBAY3VycmVudFNsaWRlXG5cbiAgICAgIGlmICFAb3B0aW9ucy5kaXNhYmxlZFxuXG4gICAgICAgIF8uZWFjaCBAJHNsaWRlck5hdmlnYXRpb24sIChlbGVtZW50KS0+XG5cbiAgICAgICAgICBpZiBlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5XG5cbiAgICAgICAgICAgICQoZWxlbWVudCkuZmluZCgnLnNsaWRlcl9uYXZpZ2F0aW9uSXRlbScpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgICAgICAgLmZpbHRlciAoKS0+ICQoQCkuZGF0YSgnaXRlbV9pbmRleCcpID09IGluZGV4XG4gICAgICAgICAgICAgIC5hZGRDbGFzcyAnYWN0aXZlJ1xuXG5cbiAgICAjIFVwZGF0ZSBzbGlkZSBwcm9wZXJ0aWVzIHRvIGN1cnJlbnQgc2xpZGVyIHN0YXRlXG4gICAgdXBkYXRlU2xpZGVzOiAoYW5pbWF0ZT10cnVlKS0+XG5cbiAgICAgICMgRmFkZSBpbmFjdGl2ZSBzbGlkZXMgdG8gYSBzcGVjaWZpYyBvcGFjaXR5IHZhbHVlXG4gICAgICBpZiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSAmJiBhbmltYXRlXG4gICAgICAgIEBzZXRTbGlkZU9wYWNpdHkgMSwgQG9wdGlvbnMuaW5hY3RpdmVTbGlkZU9wYWNpdHksIHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgQHNldFNsaWRlT3BhY2l0eSAxLCBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eSwgZmFsc2VcblxuICAgICAgQCRzbGlkZXMucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLmFkZENsYXNzICdhY3RpdmUnXG5cblxuICAgICMgU2V0IHNsaWRlIG9wYWNpdHkgZm9yIGFjdGl2ZSBhbmQgaW5hY3RpdmUgc2xpZGVzXG4gICAgc2V0U2xpZGVPcGFjaXR5OiAoYWN0aXZlLCBpbmFjdGl2ZSwgYW5pbWF0ZT10cnVlKS0+XG5cbiAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgQCRzbGlkZXMuc3RvcCgpLmFuaW1hdGVcbiAgICAgICAgICBvcGFjaXR5OiBpbmFjdGl2ZVxuXG4gICAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLnN0b3AoKS5hbmltYXRlXG4gICAgICAgICAgb3BhY2l0eTogYWN0aXZlXG4gICAgICBlbHNlXG4gICAgICAgIEAkc2xpZGVzLnN0b3AoKS5jc3NcbiAgICAgICAgICBvcGFjaXR5OiBpbmFjdGl2ZVxuXG4gICAgICAgIEAkc2xpZGVzLmVxKEBjdXJyZW50U2xpZGUpLnN0b3AoKS5jc3NcbiAgICAgICAgICBvcGFjaXR5OiBhY3RpdmVcblxuXG4gICAgIyBFdmVudCBjYWxsYmFjayBvbiBzY3JvbGwgZW5kXG4gICAgb25TY3JvbGxFbmQ6IChldmVudCk9PlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICAjIElmIFNsaWRlciBzaG93cyBtb3JlIHRoYW4gb25lIHNsaWRlIHBlciBwYWdlXG4gICAgICAjIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIGN1cnJlbnRTbGlkZSBpcyBvbiB0aGVcbiAgICAgICMgbGFzdCBwYWdlIGFuZCBoaWdoZXIgdGhhbiB0aGUgb25lIHNuYXBwZWQgdG9cbiAgICAgIGlmIEBzbGlkZXNJbkNvbnRhaW5lciA+IDFcbiAgICAgICAgaWYgQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVggPCBAbnVtYmVyT2ZTbGlkZXMgLSBAc2xpZGVzSW5Db250YWluZXJcbiAgICAgICAgICBAY3VycmVudFNsaWRlID0gQGlTY3JvbGwuY3VycmVudFBhZ2UucGFnZVhcbiAgICAgIGVsc2VcbiAgICAgICAgQGN1cnJlbnRTbGlkZSA9IEBpU2Nyb2xsLmN1cnJlbnRQYWdlLnBhZ2VYXG5cbiAgICAgIGlmIEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICMgSWYgbGFzdCBzbGlkZSwgcmV0dXJuIHRvIGZpcnN0XG4gICAgICAgIGlmIEBjdXJyZW50U2xpZGUgPj0gQG51bWJlck9mU2xpZGVzLUBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAb3B0aW9ucy5jYXJvdXNlbCArIChAY3VycmVudFNsaWRlIC0gKEBudW1iZXJPZlNsaWRlcy1Ab3B0aW9ucy5jYXJvdXNlbCkpLCBmYWxzZSwgZmFsc2VcbiAgICAgICAgIyBJZiBmaXJzdCBzbGlkZSwgbW92ZSB0byBsYXN0XG4gICAgICAgIGVsc2UgaWYgQGN1cnJlbnRTbGlkZSA8IEBvcHRpb25zLmNhcm91c2VsXG4gICAgICAgICAgQGdvVG9TbGlkZSBAbnVtYmVyT2ZTbGlkZXMgLSAoQG9wdGlvbnMuY2Fyb3VzZWwrMSksIGZhbHNlLCBmYWxzZVxuXG4gICAgICBpZiB0eXBlb2Ygc2VsZi5vcHRpb25zLm9uU2Nyb2xsRW5kID09ICdmdW5jdGlvbidcbiAgICAgICAgc2VsZi5vcHRpb25zLm9uU2Nyb2xsRW5kLmFwcGx5KEAsIFtldmVudCxzZWxmXSlcblxuICAgICAgQHVwZGF0ZVNsaWRlcygpXG4gICAgICBAdXBkYXRlTmF2aWdhdGlvbigpXG4gICAgICBAZGVidWcoKVxuXG5cbiAgICAjIFVzZXIgdG91Y2hlcyB0aGUgc2NyZWVuIGJ1dCBzY3JvbGxpbmcgZGlkbid0IHN0YXJ0IHlldFxuICAgIG9uQmVmb3JlU2Nyb2xsU3RhcnQ6ID0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cblxuICAgICMgUmVzaXplIHNsaWRlclxuICAgIHJlc2l6ZTogKGV2ZW50KT0+XG5cbiAgICAgIEBzdG9wQXV0b1Njcm9sbCgpXG5cbiAgICAgIGlmIEBvcHRpb25zLnNsaWRlV2lkdGggPT0gJ2F1dG8nXG4gICAgICAgIEAkc2xpZGVzLndpZHRoIEAkc2xpZGVyLm91dGVyV2lkdGgoKVxuICAgICAgZWxzZVxuICAgICAgICBAJHNsaWRlcy53aWR0aCBwYXJzZUludChAb3B0aW9ucy5zbGlkZVdpZHRoKSArICdweCdcblxuICAgICAgIyBDYWxjdWxhdGUgY29udGFpbmVyIHdpZHRoXG4gICAgICAjIEEgcG9zc2libGUgbWFyZ2luIGxlZnQgYW5kIHJpZ2h0IG9mIHRoZSBlbGVtZW50cyBtYWtlcyB0aGlzXG4gICAgICAjIGEgbGl0dGxlIG1vcmUgdHJpY2t5IHRoYW4gaXQgc2VlbXMsIHdlIGRvIG5vdCBvbmx5IG5lZWQgdG9cbiAgICAgICMgbXVsdGlwbHkgYWxsIGVsZW1lbnRzICsgdGhlaXIgcmVzcGVjdGl2ZSBzaWRlIG1hcmdpbnMgbGVmdCBhbmRcbiAgICAgICMgcmlnaHQsIHdlIGFsc28gaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCB0aGF0IHRoZSBmaXJzdCBhbmQgbGFzdFxuICAgICAgIyBlbGVtZW50IG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgbWFyZ2luIHRvd2FyZHMgdGhlIGJlZ2lubmluZyBhbmRcbiAgICAgICMgZW5kIG9mIHRoZSBzbGlkZSBjb250YWluZXJcbiAgICAgIHNsaWRlV2lkdGggPSAoQCRzbGlkZXMub3V0ZXJXaWR0aCgpICsgKEBvcHRpb25zLnNsaWRlTWFyZ2luICogMikpXG4gICAgICBjb250YWluZXJXaWR0aCA9ICBzbGlkZVdpZHRoICogQG51bWJlck9mU2xpZGVzXG5cbiAgICAgICMgUmVtb3ZlIGxhc3QgYW5kIGZpcnN0IGVsZW1lbnQgYm9yZGVyIG1hcmdpbnNcbiAgICAgIGNvbnRhaW5lcldpZHRoIC09IEBvcHRpb25zLnNsaWRlTWFyZ2luICogMlxuXG4gICAgICAjIEFkZCB3aGF0ZXZlciBtYXJnaW4gdGhlc2UgdHdvIGVsZW1lbnRzIGhhdmVcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMuZmlyc3QoKS5jc3MoJ21hcmdpbi1sZWZ0JylcbiAgICAgIGNvbnRhaW5lcldpZHRoICs9IHBhcnNlRmxvYXQgQCRzbGlkZXMubGFzdCgpLmNzcygnbWFyZ2luLXJpZ2h0JylcblxuICAgICAgIyBEZXRlcm1pbmUgdGhlIGFtb3VudCBvZiBzbGlkZXMgdGhhdCBjYW4gZml0IGluc2lkZSB0aGUgc2xpZGUgY29udGFpbmVyXG4gICAgICAjIFdlIG5lZWQgdGhpcyBmb3IgdGhlIG9uU2Nyb2xsRW5kIGV2ZW50LCB0byBjaGVjayBpZiB0aGUgY3VycmVudCBzbGlkZVxuICAgICAgIyBpcyBhbHJlYWR5IG9uIHRoZSBsYXN0IHBhZ2VcbiAgICAgIEBzbGlkZXNJbkNvbnRhaW5lciA9IE1hdGguY2VpbCBAJHNsaWRlci53aWR0aCgpIC8gc2xpZGVXaWR0aFxuXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLndpZHRoIGNvbnRhaW5lcldpZHRoXG4gICAgICBAJHNsaWRlQ29udGFpbmVyLmhlaWdodCBAJHNsaWRlci5oZWlnaHQoKVxuXG4gICAgICBpZiBAaVNjcm9sbFxuICAgICAgICBAaVNjcm9sbC5yZWZyZXNoKClcblxuICAgICAgaWYgQG9wdGlvbnMuYXV0b3Njcm9sbFxuICAgICAgICBAc3RhcnRBdXRvU2Nyb2xsKClcblxuICAgICAgaWYgdHlwZW9mIEBvcHRpb25zLm9uQWZ0ZXJSZXNpemUgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICBAb3B0aW9ucy5vbkFmdGVyUmVzaXplLmFwcGx5KEAsIFtldmVudF0pXG5cblxuICAgICMgQmluZCBldmVudHNcbiAgICBiaW5kRXZlbnRzOiAtPlxuXG4gICAgICBzZWxmID0gQFxuXG4gICAgICBAaVNjcm9sbC5vbiAnc2Nyb2xsRW5kJywgQG9uU2Nyb2xsRW5kXG5cbiAgICAgIEBpU2Nyb2xsLm9uICdiZWZvcmVTY3JvbGxTdGFydCcsIEBvbkJlZm9yZVNjcm9sbFN0YXJ0XG5cbiAgICAgIEAkc2xpZGVzLm9uICdjbGljaycsIChldmVudCktPlxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgaWYgdHlwZW9mIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2sgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vblNsaWRlQ2xpY2suYXBwbHkoc2VsZiwgW2V2ZW50XSlcblxuICAgICAgQCRzbGlkZXIub24gJ2NsaWNrJywgJ3VsLnNsaWRlck5hdmlnYXRpb24gbGknLCAtPlxuICAgICAgICBzZWxmLnN0b3BBdXRvU2Nyb2xsKClcbiAgICAgICAgc2VsZi5nb1RvU2xpZGUgJChAKS5kYXRhKCdpdGVtX2luZGV4JylcblxuICAgICAgJCh3aW5kb3cpLmJpbmQgJ3Jlc2l6ZScsIChldmVudCktPlxuXG4gICAgICAgIGlmIHR5cGVvZiBzZWxmLm9wdGlvbnMub25CZWZvcmVSZXNpemUgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIHNlbGYub3B0aW9ucy5vbkJlZm9yZVJlc2l6ZS5hcHBseShzZWxmLCBbZXZlbnRdKVxuXG4gICAgICAgIHNlbGYucmVzaXplIGV2ZW50XG5cblxuICAgICMgR28gdG8gbmV4dCBzbGlkZVxuICAgIG5leHRTbGlkZTogPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgQG51bWJlck9mU2xpZGVzID4gQGN1cnJlbnRTbGlkZSsxXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZSsxXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gMFxuXG4gICAgICBAZ29Ub1NsaWRlIG5leHRTbGlkZUluZGV4XG5cblxuICAgICMgR28gdG8gcHJldmlvdXMgc2xpZGVcbiAgICBwcmV2U2xpZGU6ID0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgIGlmIEBjdXJyZW50U2xpZGUtMSA+PSAwXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQGN1cnJlbnRTbGlkZS0xXG4gICAgICBlbHNlXG4gICAgICAgIG5leHRTbGlkZUluZGV4ID0gQG51bWJlck9mU2xpZGVzLTFcblxuICAgICAgQGdvVG9TbGlkZSBuZXh0U2xpZGVJbmRleFxuXG5cbiAgICAjIEdvIHRvIHNsaWRlIGluZGV4XG4gICAgZ29Ub1NsaWRlOiAoaW5kZXgsIGFuaW1hdGU9dHJ1ZSwgdHJpZ2dlckV2ZW50PXRydWUpPT5cblxuICAgICAgc2VsZiA9IEBcblxuICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICBAaVNjcm9sbD8uZ29Ub1BhZ2UgaW5kZXgsIDAsIEBvcHRpb25zLnNwZWVkXG4gICAgICBlbHNlXG4gICAgICAgIEBpU2Nyb2xsPy5nb1RvUGFnZSBpbmRleCwgMCwgMFxuXG4gICAgICBAY3VycmVudFNsaWRlID0gaW5kZXhcbiAgICAgIEB1cGRhdGVTbGlkZXMoYW5pbWF0ZSlcbiAgICAgIEB1cGRhdGVOYXZpZ2F0aW9uKClcblxuICAgICAgaWYgdHJpZ2dlckV2ZW50XG4gICAgICAgICQoJ2JvZHknKS50cmlnZ2VyIEAkc2xpZGVyLmRhdGEoJ2luZGV4JykrJyNnb1RvU2xpZGUnLCBpbmRleCAtIEBvcHRpb25zLmNhcm91c2VsXG5cbiAgICAgIEBkZWJ1ZygpXG5cblxuICAgICMgQWRkIGZha2UgY2Fyb3VzZWwgc2xpZGVzXG4gICAgYWRkQ2Fyb3VzZWxTbGlkZXM6IC0+XG5cbiAgICAgIEAkc3RhcnRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKC1Ab3B0aW9ucy5jYXJvdXNlbCkuY2xvbmUoKVxuICAgICAgQCRlbmRFbGVtZW50cyA9IEAkc2xpZGVzLnNsaWNlKDAsQG9wdGlvbnMuY2Fyb3VzZWwpLmNsb25lKClcblxuICAgICAgQCRzbGlkZXMucGFyZW50KCkucHJlcGVuZCBAJHN0YXJ0RWxlbWVudHNcbiAgICAgIEAkc2xpZGVzLnBhcmVudCgpLmFwcGVuZCBAJGVuZEVsZW1lbnRzXG5cblxuICAgICMgU3RhcnQgYXV0b3Njcm9sbFxuICAgIHN0YXJ0QXV0b1Njcm9sbDogPT5cblxuICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQG5leHRTbGlkZSwgQG9wdGlvbnMuaW50ZXJ2YWxcblxuXG4gICAgIyBTdG9wIGF1dG9zY3JvbGxcbiAgICBzdG9wQXV0b1Njcm9sbDogPT5cblxuICAgICAgY2xlYXJJbnRlcnZhbCBAaW50ZXJ2YWxcbiAgICAgIEBpbnRlcnZhbCA9IG51bGxcblxuXG4gICAgIyBMaXN0ZW4gdG8gYW5vdGhlciBzbGlkZXIgZm9yIG5hdmlnYXRpb25cbiAgICAjIFBhc3MgdGhlIHNsaWRlciBpbmRleCBmb3IgdGhlIGV2ZW50IGJpbmRpbmcgc2VsZWN0b3JcbiAgICBsaXN0ZW5UbzogKGluZGV4KS0+XG5cbiAgICAgIHNlbGYgPSBAXG5cbiAgICAgICQoJ2JvZHknKS5vbiAnc2xpZGVyXycraW5kZXgrJyNnb1RvU2xpZGUnLCAoZXZlbnQsIGluZGV4KS0+XG4gICAgICAgIHNlbGYuc3RvcEF1dG9TY3JvbGwoKVxuICAgICAgICBzZWxmLmdvVG9TbGlkZSAoaW5kZXggKyBzZWxmLm9wdGlvbnMuY2Fyb3VzZWwpLCB0cnVlLCBmYWxzZVxuXG5cbiAgICAjIEFkZCBkZWJ1ZyBvdXRwdXQgdG8gc2xpZGVyXG4gICAgZGVidWc6ID0+XG5cbiAgICAgIGlmIEBvcHRpb25zLmRlYnVnXG4gICAgICAgIEAkc2xpZGVyLmZpbmQoJy5kZWJ1ZycpLnJlbW92ZSgpXG4gICAgICAgIEAkc2xpZGVyLmFwcGVuZCBAZGVidWdUZW1wbGF0ZVxuICAgICAgICAgICdzbGlkZXJfaW5kZXgnOiBAJHNsaWRlci5kYXRhICdpbmRleCdcbiAgICAgICAgICAnbnVtYmVyX29mX3NsaWRlcyc6IEBudW1iZXJPZlNsaWRlc1xuICAgICAgICAgICdjdXJyZW50X3NsaWRlJzogQGlTY3JvbGwuY3VycmVudFBhZ2U/LnBhZ2VYXG4gICAgICAgICAgJ2F1dG9zY3JvbGwnOiBpZiBAaW50ZXJ2YWwgdGhlbiAnZW5hYmxlZCcgZWxzZSAnZGlzYWJsZWQnXG4gICAgICAgICAgJ251bWJlcl9vZl9uYXZpZ2F0aW9ucyc6IEAkc2xpZGVyTmF2aWdhdGlvbi5sZW5ndGhcbiAgICAgICAgICAnc2xpZGVyX3dpZHRoJzogQCRzbGlkZXIud2lkdGgoKVxuXG5cbiAgICAjIFByaW50IG9wdGlvbiB0byBjb25zb2xlXG4gICAgIyBDYW4ndCBqdXN0IHJldHVybiB0aGUgdmFsdWUgdG8gZGVidWcgaXQgYmVjYXVzZVxuICAgICMgaXQgd291bGQgYnJlYWsgY2hhaW5pbmcgd2l0aCB0aGUgalF1ZXJ5IG9iamVjdFxuICAgICMgRXZlcnkgbWV0aG9kIGNhbGwgcmV0dXJucyBhIGpRdWVyeSBvYmplY3RcbiAgICBnZXQ6IChvcHRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyAnb3B0aW9uOiAnK29wdGlvbisnIGlzICcrQG9wdGlvbnNbb3B0aW9uXVxuICAgICAgQG9wdGlvbnNbb3B0aW9uXVxuXG5cbiAgICAjIFNldCBvcHRpb24gdG8gdGhpcyBpbnN0YW5jZXMgb3B0aW9ucyBhcnJheVxuICAgIHNldDogKG9wdGlvbiwgdmFsdWUpIC0+XG5cbiAgICAgICMgU2V0IG9wdGlvbnMgdmFsdWVcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gPSB2YWx1ZVxuXG4gICAgICAjIElmIG5vIGludGVydmFsIGlzIGN1cnJlbnRseSBwcmVzZW50LCBzdGFydCBhdXRvc2Nyb2xsXG4gICAgICBpZiBvcHRpb24gPT0gJ2F1dG9zY3JvbGwnICYmICFAaW50ZXJ2YWxcbiAgICAgICAgQHN0YXJ0QXV0b1Njcm9sbCgpXG5cbiAgICAgICMgVE9ETzogVXBkYXRlIHNsaWRlIG1hcmdpblxuICAgICAgI2lmIG9wdGlvbiA9PSAnc2xpZGVNYXJnaW4nXG4gICAgICAgICMgY2FjaGUgc2xpZGVNYXJnaW4gQ1NTIG9uIGVsZW1lbnQ/XG4gICAgICAgICMgd2hhdCBpZiB0aGUgdXNlciB3YW50cyB0byBzd2l0Y2ggYmFja1xuXG4gICAgICBpZiBvcHRpb24gPT0gJ2luYWN0aXZlU2xpZGVPcGFjaXR5JyAmJiBAb3B0aW9ucy5pbmFjdGl2ZVNsaWRlT3BhY2l0eVxuICAgICAgICBAc2V0U2xpZGVPcGFjaXR5IDEsIEBvcHRpb25zLmluYWN0aXZlU2xpZGVPcGFjaXR5XG5cbiAgICAgIGlmIG9wdGlvbiA9PSAnbmF2aWdhdGlvbidcbiAgICAgICAgQHJlbmRlck5hdmlnYXRpb24oKVxuXG4gICAgICBpZiBvcHRpb24gPT0gJ2xpc3RlblRvJ1xuICAgICAgICBAbGlzdGVuVG8gdmFsdWVcblxuICAgICAgQGRlYnVnKClcblxuXG5cbiAgIyBEZWZpbmUgdGhlIHBsdWdpblxuICAkLmZuLmV4dGVuZCBTbGlkZXI6IChvcHRpb24sIGFyZ3MuLi4pIC0+XG5cbiAgICBAZWFjaCAoaW5kZXgpLT5cbiAgICAgICR0aGlzID0gJChAKVxuICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ1NsaWRlcicpXG5cbiAgICAgIGlmICFkYXRhXG4gICAgICAgICR0aGlzLmRhdGEgJ1NsaWRlcicsIChkYXRhID0gbmV3IFNsaWRlcihALCBvcHRpb24sIGluZGV4KSlcblxuICAgICAgaWYgdHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJ1xuICAgICAgICByZXR1cm4gZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpXG5cblxuKSB3aW5kb3cualF1ZXJ5LCB3aW5kb3dcblxuIl19