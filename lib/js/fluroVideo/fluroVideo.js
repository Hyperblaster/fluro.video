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