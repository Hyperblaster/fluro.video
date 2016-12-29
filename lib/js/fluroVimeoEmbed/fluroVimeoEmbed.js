'use strict';

angular.module('fluro.video').service('VimeoEmbedSettings', function($http) {

    var controller = {};

    /////////////////////////

    controller.getVideoInformation = function(vimeoID) {
        return $http.get('http://vimeo.com/api/v2/video/' + vimeoID + '.output');
    }

    /////////////////////////

    return controller;
});

angular.module('fluro.video').directive('vimeoVideo', function($compile, VimeoEmbedSettings) {
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
                if ($scope.videoId) {
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
                $scope.vimeoEmbedURL = '//player.vimeo.com/video/' + VideoID + '?player_id=' + VideoID + params;
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
});

angular.module('fluro.video').filter('trustVimeo', ['$sce',
    function($sce) {
        return function(val) {
            return $sce.trustAsResourceUrl(val);
        };
    }
]);