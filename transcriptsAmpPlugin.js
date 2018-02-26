// Copyright (c) Microsoft Corporation. All Rights Reserved.
// Licensed under the MIT license. See LICENSE file on the project webpage for details.

/* global _ amp gettext */

(function () {

    amp.plugin('transcriptsAmpPlugin', function(_options) {
        'use strict';
        var player = this;
        var timeHandler = null;
        var $vidParent = $(player.el());
        var transcriptCues = null;
        var $transcriptElement;

        this.addEventListener("loadeddata", function() {
            'use strict';
            var $transcriptButton;
            var $transcriptButtonMenu;
            var $vidAndTranscript = $vidParent.closest('.video');

            $vidParent.css('width', '');  // Clear fixed width to support responsive UX.

            $transcriptElement = $vidAndTranscript.find('.subtitles').first();
            if ($transcriptElement.length) {
                // Find and re-position button markup. This must be done
                // after AMP initializes built-in player controls.
                $transcriptButton = $transcriptElement.find('.toggleTranscript').first();
                $vidParent.find('.amp-controlbaricons-right').first().append($transcriptButton);

                $transcriptButtonMenu = $transcriptButton.find('.vjs-menu').first();
                $transcriptButton.on('mouseenter mouseleave', (function() {
                    $transcriptButtonMenu.toggle();
                }));

                $transcriptButtonMenu.on('click', '.vjs-menu-item', function(evt) {
                    var $target = $(evt.target);
                    $transcriptButtonMenu.find('.vjs-menu-item')
                        .removeClass('vjs-selected')
                        .attr('aria-selected', false);
                    $target
                        .addClass('vjs-selected')
                        .attr('aria-selected', true);

                    if ($.trim($target.html()) === 'Off') {
                        $vidAndTranscript.addClass('closed');
                    } else {
                        transcriptCues = initTranscript(
                            player, $transcriptElement
                        );
                        $vidAndTranscript.removeClass('closed');
                    }
                });
            }
        });
        this.addEventListener(amp.eventName.play, function(evt) {  // eslint-disable-line no-unused-vars
            'use strict';
            timeHandler = setInterval(function() {
                    syncTimer(player, transcriptCues, $transcriptElement);
                },
                100
            );
        });
        this.addEventListener(amp.eventName.pause, function(evt) {  // eslint-disable-line no-unused-vars
            'use strict';
            if (timeHandler !== null) {
                clearInterval(timeHandler);
            }
        });
        this.addEventListener(amp.eventName.ended, function(evt) {  // eslint-disable-line no-unused-vars
            'use strict';
            if (timeHandler !== null) {
                clearInterval(timeHandler);
            }
        });

    });

    /**
     * This is called regularly while the video plays
     * so that we can correctly highlight the transcript elements
     * based on the current position of the video playback
     * @param player
     * @param transcriptCues
     * @param $transcriptElement
     * @private
     */
    function syncTimer(player, transcriptCues, $transcriptElement) {
        'use strict';
        // Gather each transcript phrase (each pseudo-hyperlink in transcript).
        var cue;
        var isActive;
        var $targetElement;
        var scrollUpSize;
        var $transcriptItems = $transcriptElement.find('.azure-media-xblock-transcript-element');
        var currentTime = player.currentTime();

        if (transcriptCues === null || !$transcriptElement.length) {
            // no transcript - quick exit
            return;
        }

        // Simple linear search.
        for (var i = 0; i < transcriptCues.length; i++) {  // eslint-disable-line vars-on-top
            cue = transcriptCues[i];

            if (currentTime >= cue.startTime && currentTime < cue.endTime) {
                $targetElement = $transcriptItems.eq(i);

                isActive = $targetElement.hasClass('current');
                if (!isActive) {
                    // Highlight the correct one
                    $transcriptItems.removeClass('current');
                    $targetElement.addClass('current');

                    // Autoscroll.
                    scrollUpSize = Math.abs(
                        $transcriptElement.offset().top - $transcriptItems.first().offset().top
                    ) + (
                        $targetElement.offset().top - $transcriptElement.offset().top
                    );
                    $transcriptElement.scrollTo(scrollUpSize, 1000);
                }
                return;
            }
        }
    }


    /**
     * Transcripts creating.
     * @param player
     * @param transcript
     * @param $transcriptElement
     * @returns {Array}
     */
    function initTranscript(player, $transcriptElement) {
        'use strict';
        var cue;
        var html;
        var startTime;
        var $transcriptItems;
        var cues = player.textTracks()[0].cues;

        // Creates transcript markup.
        // TODO: use Backbone's client-side templating view (underscore)
        html = '<ol class="subtitles-menu" style="list-style:none;">';
        for (var i = 0; i < cues.length; i++) { // eslint-disable-line vars-on-top
            cue = cues[i];

            html += '<li role="link" tabindex="0"'
                + 'data-transcript-element-start-time="' + _.escape(cue.startTime)
                + '" class="azure-media-xblock-transcript-element" >'
                + _.escape(cue.text) + '</li>';
        }
        html += '</ol>';
        $transcriptElement.html(html);

        // Gather each transcript phrase (each pseudo-hyperlink in transcript).
        $transcriptItems = $transcriptElement.find('.azure-media-xblock-transcript-element');

        // Handle events when user clicks on transcripts
        $transcriptItems.on('click keypress', function(evt) {
            'use strict';
            var KeyCode = (evt.type === 'keydown' && evt.keyCode ? evt.keyCode : evt.which);
            if (evt.type !== 'click' && (KeyCode !== 32 && KeyCode !== 13)) {
                return;
            }
            if (KeyCode === 32) {
                evt.preventDefault();
            }

            // Clear all active
            $transcriptItems.removeClass('current');

            // Highlight the one the user clicked.
            $(evt.target).addClass('current');

            // Set the player to match the transcript time
            startTime = parseFloat($(evt.target).data('transcript-element-start-time'));
            player.currentTime(startTime);
        });

        return cues;
    }

}).call(this);
