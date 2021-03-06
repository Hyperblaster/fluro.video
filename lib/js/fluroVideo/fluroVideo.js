'use strict';



angular.module('fluro.video').directive('fluroVideo', function($compile, Fluro, FluroAsset) {

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
                        // controls: 0,
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


                $scope.poster = FluroAsset.posterUrl($scope.model._id, 1024, 768);

                ///////////////////////////

                var template;

                //Clear element
                $element.empty();

                switch ($scope.model.assetType) {
                    case 'youtube':
                        template = '<div class="embed-responsive embed-responsive-16by9"><youtube-video class="embed-responsive-item" video-url="model.external.youtube" player-vars="params"/></div>';
                        break;
                    case 'embed':
                        template = '<div class="embed-responsive embed-responsive-16by9">' + $scope.model.external.embed + '</div>';
                        break;
                    case 'vimeo':
                        template = '<div class="embed-responsive embed-responsive-16by9"><vimeo-video class="embed-responsive-item" video-url="model.external.vimeo" player-vars="params"/></div>';
                        break;
                    case 'upload':
                        $scope.playUrl = Fluro.apiURL + '/get/' + $scope.model._id;

                        if (Fluro.token) {
                            $scope.playUrl = $scope.playUrl + '?access_token=' + Fluro.token
                        }


                        template = '<div class="embed-responsive embed-responsive-16by9"><video class="embed-responsive-item" poster="{{poster}}" controls><source ng-src="{{playUrl | trustfluro}}" type="{{model.mimetype}}"></video></div>';
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
});


angular.module('fluro.video').filter('trustfluro', ['$sce',
    function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }
]);

/////////////////////////////////////////////////////

angular.module('fluro.video').controller('FluroVideoController', function($scope) {



    //console.log('Inline video', $scope.model)
    // var urlString = $fluro_url + '/get/' + $scope.id;

    //$scope.url = urlString;
});




angular.module('fluro.video').service('VideoTools', function($http) {

    var controller = {}


    var cache = {};

    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////

    controller.getVideoThumbnail = function(item) {

        if (!item || !item._id) {
            return;
        }

        if (cache[item._id]) {
            return cache[item._id];
        }

        switch (item.assetType) {
            case 'youtube':
                var details = controller.parseVideoURL(item.external.youtube);
                cache[item._id] = 'https://img.youtube.com/vi/' + details.id + '/mqdefault.jpg';
                break;
            case 'vimeo':
                var id = controller.getVimeoID(item.external.vimeo);
                return;
                /*
                $http.get("https://vimeo.com/api/v2/video/" + id + ".json", {
                    withCredentials: false
                }).then(function(res) {

                    if (String(res.status) == '200') {

                        if (res.data && res.data[0] && res.data[0] && res.data[0].thumbnail_small) {
                            cache[item._id] = res.data[0].thumbnail_small;
                        }
                    }
                })
                */

                break;
            case 'upload':
                return;
                break;
        }


        return cache[item._id]
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
});



////////////////////////////////////////////////////////////////////


angular.module('fluro.video').filter('videoDuration', function() {


    return function(inputSeconds) {
        if (!inputSeconds) {
            return '';
        }

        var sec_num = parseInt(inputSeconds, 10); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }

        if (hours == '00') {
            return minutes + ':' + seconds;
        } else {
            return hours + ':' + minutes + ':' + seconds;
        }
    }





});

////////////////////////////////////////////////////////////////////


angular.module('fluro.video').directive('videoThumbnail', function() {

    return {
        restrict: 'E',
        replace: true,
        // Replace the div with our template
        scope: {
            model: '=ngModel',
            params: '=ngParams',
        },
        template: '<span><img ng-src="{{thumbnailUrl}}"/></span>',
        controller: function($scope, $http, Fluro, VideoTools) {


            $scope.$watch('model', update);
            $scope.$watch('params', update, true);

            ////////////////////////////////////////////

            function update() {

                var params = $scope.params || {};

                ////////////////////////////////////////

                if (!$scope.model) {
                    return;
                }

                //Create the URL
                var url = Fluro.apiURL + '/get/' + $scope.model._id + '/poster';

                if(Fluro.token) {
                	params.access_token = Fluro.token;
                }

                ////////////////////////////////////////

                //Map each parameter as a query string variable
                var queryParams = _.map(params, function(v, k) {
                    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
                }).join('&');

                //If there are query string parameters append them to the url
                if (queryParams.length) {
                    url += '?' + queryParams;
                }


                $scope.thumbnailUrl = url;
            }


        }
    };
});