/*
* Transcripts plugin for Azure Media Player - Microsoft Sample Code - Copyright (c) 2016 - Licensed MIT
*/

(function () {

    amp.plugin('transcriptsAmpPlugin', function(options) {
        var init;
        init = function () {
            var player = this;
            console.log('Player is initiated.', player, options);
        };

        this.addEventListener("loadeddata", init);
    });

}).call(this);
