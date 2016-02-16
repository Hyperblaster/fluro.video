
//Create Fluro UI With dependencies
angular.module('fluro.video', [
	'fluro.config',
    'fluro.util',
    'youtube-embed'
	]);
'use strict';



angular.module('fluro.video')


.directive('fluroVideo', function($compile, Fluro) {

    return {
        restrict: 'E',
        replace: true,
        template: '<div class="fluro-video video-{{model.assetType}}"></div>',
        controller: 'FluroVideoController',
        scope: {
            model: '=ngModel',
            ngParams: '&',
        },
        link: function($scope, $element, $attrs) {


            $scope.$watch('model', function() {
                $scope.params = $scope.ngParams();

                if (!$scope.params) {
                    $scope.params = {
                        controls: 0,
                        autoplay: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        showinfo: 0,
                        theme: 'light',
                        byline: 0,
                        portrait: 0,
                        title: 0
                    }
                }



                ///////////////////////////

                var template;

                //Clear element
                $element.empty();

                switch ($scope.model.assetType) {
                    case 'youtube':
                        template = '<div class="embed-responsive embed-responsive-16by9"><youtube-video class="embed-responsive-item" video-url="model.external.youtube" player-vars="params"/></div>';
                        break;
                    case 'vimeo':
                        template = '<div class="embed-responsive embed-responsive-16by9"><vimeo-video class="embed-responsive-item" video-url="model.external.vimeo" player-vars="params"/></div>';
                        break;
                    case 'upload':
                        $scope.playUrl = Fluro.apiURL + '/get/' + $scope.model._id;
                        template = '<div class="embed-responsive embed-responsive-16by9"><video class="embed-responsive-item" controls><source ng-src="{{playUrl | trustfluro}}" type="{{model.mimetype}}"></video></div>';
                        break;
                }

                //Create the template
                if (template) {
                    var cTemplate = $compile(template)($scope);
                    $element.append(cTemplate);
                }

            })
        },


    };
})


.filter('trustfluro', ['$sce',
    function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }
])

/////////////////////////////////////////////////////

.controller('FluroVideoController', function($scope) {



    //console.log('Inline video', $scope.model)
    // var urlString = $fluro_url + '/get/' + $scope.id;

    //$scope.url = urlString;
})




.service('VideoTools', function($http) {

    var controller = {}



    /////////////////////////////////////////////////////
    

    var thumbCache = {};

    /////////////////////////////////////////////////////

    controller.getVideoThumbnail = function(item, done) {
        if(!done) {
            done = function() {

            }
        }
        if (!item || !item._id) {
            return done('No video specified');
        }


        if(thumbCache[item._id]) {
            return done(null, thumbCache[item._id]);
        }

        
        switch (item.assetType) {
            case 'youtube':
                var details = controller.parseVideoURL(item.external.youtube);
                thumbCache[item._id] = 'https://img.youtube.com/vi/' + details.id + '/mqdefault.jpg';

                return done(null, thumbCachethumbCache[item._id]);
                break;
            case 'vimeo':
                var id = controller.getVimeoID(item.external.vimeo);

                $http.get("https://vimeo.com/api/v2/video/" + id + ".json", {
                    withCredentials: false
                }).then(function(res) {
                    thumbCache[item._id] = res.data[0].thumbnail_small;
                    return done(null, thumbCachethumbCache[item._id]);
                })
                break;
            case 'upload':
                return done('No thumbnails available for uploaded videos');
                break;
        }
    }

    /////////////////////////////////////////////////////

    controller.getVimeoID = function(url) {
        //Vimeo RegExp
        var reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        var match = url.match(reg);
        if (match) {
            return match[3];
        }
    }

    /////////////////////////////////////////////////////

    controller.parseVideoURL = function(url) {

        function contains(str, substr) {
            return (str.indexOf(substr) > -1);
        }

        //////////////////////////////////////

        function getParm(url, base) {
            var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
            var matches = url.match(re);
            if (matches) {
                return (matches[2]);
            } else {
                return ("");
            }
        }

        //////////////////////////////////////

        var retVal = {};
        var matches;

        //////////////////////////////////////


        if (url.indexOf("youtube.com/watch") != -1) {
            retVal.provider = "youtube";
            retVal.id = getParm(url, "v");
        } else if (matches = url.match(/vimeo.com\/(\d+)/)) {
            retVal.provider = "vimeo";
            retVal.id = matches[1];
        } else {

            var youtubeRegexp = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;

            //Get the id
            var YoutubeID = url.replace(youtubeRegexp, '$1');

            if (contains(YoutubeID, ';')) {
                var pieces = YoutubeID.split(';');

                if (contains(pieces[1], '%')) {
                    // links like this:
                    // "http://www.youtube.com/attribution_link?a=pxa6goHqzaA&amp;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare"
                    // have the real query string URI encoded behind a ';'.
                    // at this point, `YoutubeID is 'pxa6goHqzaA;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare'
                    var uriComponent = decodeURIComponent(YoutubeID.split(';')[1]);
                    YoutubeID = ('http://youtube.com' + uriComponent)
                        .replace(youtubeRegexp, '$1');
                } else {
                    // https://www.youtube.com/watch?v=VbNF9X1waSc&amp;feature=youtu.be
                    // `YoutubeID` looks like 'VbNF9X1waSc;feature=youtu.be' currently.
                    // strip the ';feature=youtu.be'
                    YoutubeID = pieces[0];
                }
            } else if (contains(YoutubeID, '#')) {
                // YoutubeID might look like '93LvTKF_jW0#t=1'
                // and we want '93LvTKF_jW0'
                YoutubeID = YoutubeID.split('#')[0];
            }
            retVal.provider = "youtube";
            retVal.id = YoutubeID;
        }


        //console.log('Video thumb', url, retVal);
        return (retVal);
    }

    /////////////////////////////////////////////////////

    return controller;
})


.directive('videoThumbnail', function() {

    return {
        restrict: 'E',
        replace: true,
        // Replace the div with our template
        scope: {
            model: '=ngModel',
        },
        template: '<span><img ng-src="{{thumbnailUrl}}"/></span>',
        controller: function($scope, $http, VideoTools) {

            $scope.$watch('model', function(model) {

                if(model) {

                    VideoTools.getVideoThumbnail(model, function(err, url) {

                        console.log(err, url);

                        $scope.thumbnailUrl = url;
                    });
                    //model.thumbnailUrl = 
                }
            })
            
           
        }
    };
});
'use strict';

angular.module('fluro.video')
.service('VimeoEmbedSettings', function($http) {

    var controller = {};

    /////////////////////////

    controller.getVideoInformation = function(vimeoID) {
        return $http.get('http://vimeo.com/api/v2/video/'+vimeoID+'.output');
    }

    /////////////////////////

    return controller;
})
    .directive('vimeoVideo', function($compile, VimeoEmbedSettings) {
        return {
            restrict: 'E',
            scope: {
                videoId: '=',
                videoUrl: '=',
                playerVars: '='
            },
            link: function($scope, $element, $attrs) {

                /////////////////////////////////////

                $scope.getVideoInformation = function() {
                    if($scope.videoId) {
                        return VimeoEmbedSettings.getVideoInformation($scope.videoId);
                    }
                }

                /////////////////////////////////////

                function getVimeoID(url) {
                    //Vimeo RegExp
                    var reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
                    var match = url.match(reg);
                    if (match) {
                        return match[3];
                    }
                }

                /////////////////////////////////////

                //Listen for changes
                $scope.$watch('videoId + videoUrl + playerVars', function() {

                    
                    var VideoID;

                    if ($scope.videoId) {
                        VideoID = $scope.videoId;
                    } else if ($scope.videoUrl) {
                        VideoID = getVimeoID($scope.videoUrl);
                    }

                    //////////////////////////////
                   
                    //Parameters
                    var params = '';

                    if ($scope.playerVars) {
                        for (var key in $scope.playerVars) {
                            params += '&' + key + '=' + $scope.playerVars[key];
                        }
                    }

                    //Actual URL
                    $scope.vimeoEmbedURL = '//player.vimeo.com/video/'+ VideoID +'?player_id='+ VideoID + params;
                })


                /////////////////////////////////////

                //The template
                var template = '<iframe ng-src="{{vimeoEmbedURL | trustVimeo}}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';

                //Compile the goodness
                var cTemplate = $compile(template)($scope);

                //Replace the original tag with our embed
                $element.replaceWith(cTemplate);
            }
        };
    })

.filter('trustVimeo', ['$sce',
    function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }
])

