
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

