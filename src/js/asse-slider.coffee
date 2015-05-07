#
# Slider jQuery plugin
# Author: Thomas Klokosch <mail@thomasklokosch.com>
#
(($, window) ->

  # Define the plugin class
  class Slider

    iScroll: null
    numberOfSlides: null
    currentSlide: 0
    interval: null

    $slider: null
    $slideContainer: null
    $slides: null
    $sliderNavigation: null
    $sliderListeners: null
    $slidesInContainer: null

    defaults:
      autoscroll: true
      speed: 500
      interval: 5000
      debug: true
      snap: true

      # In this state, the slider instance should never forward events to
      # the iScroll component, e.g. when the slider is not visible (display:none)
      # and therefore iScroll can't get/scroll the slide elements
      disabled: false

      # Navigation element array
      # either 'index' for on-slider navigation, a jQuery selector for a thumbnail
      # navigation or another slider element for a slider acting as a synced remote
      # navigation to this slider instance
      navigation: ['index']

      # Index navigation default template
      indexNavigationTemplate: _.template('<ul class="sliderNavigation">
        <% _.each(slides, function(element,index){ %>
          <% if(!carousel || (index>=carousel && (index+1)<=slides.length-carousel)){ %>
            <li data-item_index="<%= index %>" class="slider_navigationItem fa fa-circle-o"></li>
          <% } %>
        <% }); %>
      </ul>')

      prevNextButtons: true
      prevNextButtonsTemplate: _.template('
                              <span class="prev fa fa-angle-left"></span>
                              <span class="next fa fa-angle-right"></span>')

      slideContainerSelector: '.slideContainer'
      slideSelector: 'ul.slides > li'

      # Opacity of slides other than the current
      # Only applicable if the slider element has overflow: visible
      # and inactive slides are shown next to the current
      inactiveSlideOpacity: null

      # Margin left and right of the slides in pixels
      slideMargin: 0

      # Width of the slide, defaults to auto, takes a 100% slider width
      slideWidth: 'auto'

      # Fake a carousel effect by showing the last slide next to the first
      # that can't be navigated to but forwards to the end of the slider
      # Number indicates number of slides padding left and right
      carousel: 0

      # Slide click callback function
      onSlideClick: (event)->
        #console.log $(event.currentTarget).index()

      onNextClick: (event)->
        #console.log 'Next'

      onPrevClick: (event)->
        #console.log 'Prev'


    debugTemplate: _.template('
      <div class="debug">
        <span>Slider: <%= slider_index %></span>
        <span># of slides: <%= number_of_slides %></span>
        <span>Current slide: <%= current_slide %></span>
        <span>Autoscroll: <%= autoscroll %></span>
        <span># of navigations: <%= number_of_navigations %></span>
        <span>Slider width: <%= slider_width %></span>
      </div>')


    # Constructor
    constructor: (el, options, index = null) ->

      self = @

      @options = $.extend({}, @defaults, options)

      @$slider = $(el)
      @$slider.data 'index', index
      @$slider.addClass 'slider_'+index
      @$sliderNavigation = []
      @$sliderListeners = []
      @$slidesInContainer = null

      @options.onSlideClick = (event)->
        self.goToSlide $(event.currentTarget).index()

      @$slideContainer = @$slider.find @options.slideContainerSelector
      @refreshSlides()

      if @options.carousel
        @addCarouselSlides()
        @refreshSlides()
        @currentSlide = @options.carousel

      # Enable slides trough CSS
      @enableSlides()

      @iScroll = new IScroll el,
        scrollX: true
        scrollY: false
        snap: @options.snap
        snapSpeed: 400
        tap: true
        momentum: false
        eventPassthrough: true
        preventDefault: false

      if @options.autoscroll
        @startAutoScroll()

      if @options.prevNextButtons
        @addPrevNextButtons()

      if _.size(@options.navigation)
        @renderNavigation()

      @resize()
      @goToSlide @currentSlide, false
      @bindEvents()
      @debug()
      @


    # Refresh slides
    refreshSlides: ->

      @$slides = @$slideContainer.find @options.slideSelector
      @numberOfSlides = @$slides.length


    # Enable slides via CSS
    enableSlides: ->

      @$slides.css
        display: 'block'


    # Add prev next buttons
    addPrevNextButtons: ->

      @$slider.append @options.prevNextButtonsTemplate()


    # Add navigation
    renderNavigation: ->

      self = @

      # Delete old slider navigation elements
      _.each @$sliderNavigation, (element, index)->
        if !element.data('Slider')
          $(element).remove()

      _.each @options.navigation, (element, index, list)=>

        if element == 'index'

          # Create a jQuery object directly from slider code
          newElement = @options.indexNavigationTemplate({'slides': @$slides, 'carousel': @options.carousel})
          @$sliderNavigation.push $(newElement)

          # Append it to slider element
          @$slider.append _.last(@$sliderNavigation)

          # Resize navigation
          _.last(@$sliderNavigation).css
            'margin-left': -(_.last(@$sliderNavigation).width() / 2)

        else if element.data('Slider')

          self.registerListener element

        else if element instanceof jQuery

          @$sliderNavigation.push element
          navigationItems = _.last(@$sliderNavigation).children()

          @$slides.each (index,slide)=>
            item = navigationItems.eq(index)
            if item
              item.data 'slider_index', @$slider.data 'index'
              item.data 'item_index', index+parseInt(self.options.carousel)
              item.addClass 'slider_navigationItem'
              item.on 'tap', (event)->
                event.stopPropagation()
                self.stopAutoScroll()
                self.goToSlide $(@).data('item_index')

      @updateNavigation()


    # Register listener
    registerListener: (listener)->

      @$sliderListeners.push listener


    # Update navigation status
    updateNavigation: ->

      self = @
      index = @currentSlide

      if !@options.disabled

        _.each @$sliderNavigation, (element)->

          if element instanceof jQuery

            $(element).find('.slider_navigationItem')
              .removeClass('active')
              .filter ()-> $(@).data('item_index') == index
              .addClass 'active'


    # Update slide properties to current slider state
    updateSlides: (animate=true)->

      # Fade inactive slides to a specific opacity value
      if @options.inactiveSlideOpacity && animate
        @setSlideOpacity 1, @options.inactiveSlideOpacity, true
      else
        @setSlideOpacity 1, @options.inactiveSlideOpacity, false

      @$slides.removeClass 'active'
      @$slides.eq(@currentSlide).addClass 'active'


    # Set slide opacity for active and inactive slides
    setSlideOpacity: (active, inactive, animate=true)->

      if animate
        @$slides.stop().animate
          opacity: inactive

        @$slides.eq(@currentSlide).stop().animate
          opacity: active
      else
        @$slides.stop().css
          opacity: inactive

        @$slides.eq(@currentSlide).stop().css
          opacity: active


    # Event callback on scroll end
    onScrollEnd: =>

      self = @

      # If Slider shows more than one slide per page
      # we need to check if the currentSlide is on the
      # last page and higher than the one snapped to
      if @slidesInContainer > 1
        if @iScroll.currentPage.pageX < @numberOfSlides - @slidesInContainer
          @currentSlide = @iScroll.currentPage.pageX
      else
        @currentSlide = @iScroll.currentPage.pageX

      if @options.carousel
        # If last slide, return to first
        if @currentSlide >= @numberOfSlides-@options.carousel
          @goToSlide @options.carousel, false
        # If first slide, move to last
        else if @currentSlide < @options.carousel
          @goToSlide @numberOfSlides - (@options.carousel+1), false

      _.each @$sliderListeners, (listener)->

        # Update remote slider
        listener.Slider 'stopAutoScroll'
        listener.Slider 'goToSlide', self.currentSlide - self.options.carousel

      @updateSlides()
      @updateNavigation()
      @debug()


    # User touches the screen but scrolling didn't start yet
    onBeforeScrollStart: =>

      @stopAutoScroll()


    # Resize slider
    resize: =>

      @stopAutoScroll()

      if @options.slideWidth == 'auto'
        @$slides.width @$slider.outerWidth()
      else
        @$slides.width parseInt(@options.slideWidth) + 'px'

      # Calculate container width
      # A possible margin left and right of the elements makes this
      # a little more tricky than it seems, we do not only need to
      # multiply all elements + their respective side margins left and
      # right, we also have to take into account that the first and last
      # element might have a different margin towards the beginning and
      # end of the slide container
      slideWidth = (@$slides.outerWidth() + (@options.slideMargin * 2))
      containerWidth =  slideWidth * @numberOfSlides

      # Remove last and first element border margins
      containerWidth -= @options.slideMargin * 2

      # Add whatever margin these two elements have
      containerWidth += parseFloat @$slides.first().css('margin-left')
      containerWidth += parseFloat @$slides.last().css('margin-right')

      # Determine the amount of slides that can fit inside the slide container
      # We need this for the onScrollEnd event, to check if the current slide
      # is already on the last page
      @slidesInContainer = Math.ceil @$slider.width() / slideWidth

      @$slideContainer.width containerWidth
      @$slideContainer.height @$slider.height()

      if @iScroll
        @iScroll.refresh()

      if @options.autoscroll
        @startAutoScroll()


    # Bind events
    bindEvents: ->

      self = @

      @iScroll.on 'scrollEnd', @onScrollEnd

      @iScroll.on 'beforeScrollStart', @onBeforeScrollStart

      @$slides.on 'tap', (event)->
        event.stopPropagation()
        self.stopAutoScroll()
        if typeof self.options.onSlideClick == 'function'
          self.options.onSlideClick.apply(@, [event,self])

      @$slider.on 'tap', 'span.next', (event)->
        event.stopPropagation()
        self.stopAutoScroll()
        self.nextSlide()

        if typeof self.options.onNextClick == 'function'
          self.options.onNextClick.apply(@, [event,self])

      @$slider.on 'tap', 'span.prev', (event)->
        event.stopPropagation()
        self.stopAutoScroll()
        self.prevSlide()

        if typeof self.options.onPrevClick == 'function'
          self.options.onPrevClick.apply(@, [event,self])

      @$slider.on 'tap', 'ul.sliderNavigation li', ->
        self.stopAutoScroll()
        self.goToSlide $(@).data('item_index')

      $(window).bind 'resize', ->
        self.resize()
        ###
        if @resizeTo
          clearTimeout @resizeTimeout
        @resizeTimeout = setTimeout ->
        , 200
        ###


    # Go to next slide
    nextSlide: =>

      self = @

      if @numberOfSlides > (@currentSlide+1)
        nextSlideIndex = (@currentSlide+1)
      else
        nextSlideIndex = 0

      @goToSlide nextSlideIndex


    # Go to previous slide
    prevSlide: =>

      self = @

      if @currentSlide-1 >= 0
        nextSlideIndex = @currentSlide-1
      else
        nextSlideIndex = @numberOfSlides-1

      @goToSlide nextSlideIndex


    # Go to slide index
    goToSlide: (index, animate=true)=>

      self = @

      if animate
        @iScroll?.goToPage index, 0, @options.speed
      else
        @iScroll?.goToPage index, 0, 0

      @currentSlide = index
      @updateSlides(animate)
      @updateNavigation()

      _.each @$sliderListeners, (listener)->

        # Update remote slider
        listener.Slider 'stopAutoScroll'
        listener.Slider 'goToSlide', index - self.options.carousel

      @debug()


    # Add fake carousel slides
    addCarouselSlides: ->

      @$startElements = @$slides.slice(-@options.carousel).clone()
      @$endElements = @$slides.slice(0,@options.carousel).clone()

      @$slides.parent().prepend @$startElements
      @$slides.parent().append @$endElements


    # Start autoscroll
    startAutoScroll: =>

      @interval = setInterval @nextSlide, @options.interval


    # Stop autoscroll
    stopAutoScroll: =>

      clearInterval @interval
      @interval = null


    # Add debug output to slider
    debug: =>

      if @options.debug
        @$slider.find('.debug').remove()
        @$slider.append @debugTemplate
          'slider_index': @$slider.data 'index'
          'number_of_slides': @numberOfSlides
          'current_slide': @iScroll.currentPage?.pageX
          'autoscroll': if @interval then 'enabled' else 'disabled'
          'number_of_navigations': @$sliderNavigation.length
          'slider_width': @$slider.width()


    # Print option to console
    # Can't just return the value to debug it because
    # it would break chaining with the jQuery object
    # Every method call returns a jQuery object
    get: (option) ->
      console.log 'option: '+option+' is '+@options[option]
      @options[option]


    # Set option to this instances options array
    set: (option, value) ->

      # Set options value
      @options[option] = value

      # If no interval is currently present, start autoscroll
      if option == 'autoscroll' && !@interval
        @startAutoScroll()

      # TODO: Update slide margin
      #if option == 'slideMargin'
        # cache slideMargin CSS on element?
        # what if the user wants to switch back

      if option == 'inactiveSlideOpacity' && @options.inactiveSlideOpacity
        @setSlideOpacity 1, @options.inactiveSlideOpacity

      if option == 'navigation'
        @renderNavigation()

      @debug()



  # Define the plugin
  $.fn.extend Slider: (option, args...) ->

    @each (index)->
      $this = $(@)
      data = $this.data('Slider')

      if !data
        $this.data 'Slider', (data = new Slider(@, option, index))

      if typeof option == 'string'
        return data[option].apply(data, args)


) window.jQuery, window

