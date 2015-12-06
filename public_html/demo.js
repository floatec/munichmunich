// 
// Here is how to define your module 
// has dependent on mobile-angular-ui
// 
var app = angular.module('MobileAngularUiExamples', [
    'ngRoute',
    'mobile-angular-ui',
    'uiGmapgoogle-maps',
    // touch/drag feature: this is from 'mobile-angular-ui.gestures.js'
    // it is at a very beginning stage, so please be careful if you like to use
    // in production. This is intended to provide a flexible, integrated and and 
    // easy to use alternative to other 3rd party libs like hammer.js, with the
    // final pourpose to integrate gestures into default ui interactions like 
    // opening sidebars, turning switches on/off ..
    'mobile-angular-ui.gestures'
]);
app.run(function ($transform) {
    window.$transform = $transform;
});
// 
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false' 
// in order to avoid unwanted routing.
// 
app.config(function ($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'home.html', reloadOnSearch: false});
    $routeProvider.when('/location', {templateUrl: 'location.html', reloadOnSearch: false});
    $routeProvider.when('/new', {templateUrl: 'new.html', reloadOnSearch: false});
    $routeProvider.when('/story', {templateUrl: 'story.html', reloadOnSearch: false});
});
// 
// `$touch example`
// 

app.directive('toucharea', ['$touch', function ($touch) {
        // Runs during compile
        return {
            restrict: 'C',
            link: function ($scope, elem) {
                $scope.touch = null;
                $touch.bind(elem, {
                    start: function (touch) {
                        $scope.touch = touch;
                        $scope.$apply();
                    },
                    cancel: function (touch) {
                        $scope.touch = touch;
                        $scope.$apply();
                    },
                    move: function (touch) {
                        $scope.touch = touch;
                        $scope.$apply();
                    },
                    end: function (touch) {
                        $scope.touch = touch;
                        $scope.$apply();
                    }
                });
            }
        };
    }]);
//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function ($drag, $parse, $timeout) {
    return {
        restrict: 'A',
        compile: function (elem, attrs) {
            var dismissFn = $parse(attrs.dragToDismiss);
            return function (scope, elem) {
                var dismiss = false;
                $drag.bind(elem, {
                    transform: $drag.TRANSLATE_RIGHT,
                    move: function (drag) {
                        if (drag.distanceX >= drag.rect.width / 4) {
                            dismiss = true;
                            elem.addClass('dismiss');
                        } else {
                            dismiss = false;
                            elem.removeClass('dismiss');
                        }
                    },
                    cancel: function () {
                        elem.removeClass('dismiss');
                    },
                    end: function (drag) {
                        if (dismiss) {
                            elem.addClass('dismitted');
                            $timeout(function () {
                                scope.$apply(function () {
                                    dismissFn(scope);
                                });
                            }, 300);
                        } else {
                            drag.reset();
                        }
                    }
                });
            };
        }
    };
});
//
// Another `$drag` usage example: this is how you could create 
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function () {
    return {
        restrict: 'C',
        scope: {},
        controller: function () {
            this.itemCount = 0;
            this.activeItem = null;
            this.addItem = function () {
                var newId = this.itemCount++;
                this.activeItem = this.itemCount === 1 ? newId : this.activeItem;
                return newId;
            };
            this.next = function () {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem === this.itemCount - 1 ? 0 : this.activeItem + 1;
            };
            this.prev = function () {
                this.activeItem = this.activeItem || 0;
                this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
            };
        }
    };
});
app.directive('carouselItem', function ($drag) {
    return {
        restrict: 'C',
        require: '^carousel',
        scope: {},
        transclude: true,
        template: '<div class="item"><div ng-transclude></div></div>',
        link: function (scope, elem, attrs, carousel) {
            scope.carousel = carousel;
            var id = carousel.addItem();
            var zIndex = function () {
                var res = 0;
                if (id === carousel.activeItem) {
                    res = 2000;
                } else if (carousel.activeItem < id) {
                    res = 2000 - (id - carousel.activeItem);
                } else {
                    res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
                }
                return res;
            };
            scope.$watch(function () {
                return carousel.activeItem;
            }, function () {
                elem[0].style.zIndex = zIndex();
            });
            $drag.bind(elem, {
                //
                // This is an example of custom transform function
                //
                transform: function (element, transform, touch) {
                    // 
                    // use translate both as basis for the new transform:
                    // 
                    var t = $drag.TRANSLATE_BOTH(element, transform, touch);
                    //
                    // Add rotation:
                    //
                    var Dx = touch.distanceX,
                            t0 = touch.startTransform,
                            sign = Dx < 0 ? -1 : 1,
                            angle = sign * Math.min((Math.abs(Dx) / 700) * 30, 30);
                    t.rotateZ = angle + (Math.round(t0.rotateZ));
                    return t;
                },
                move: function (drag) {
                    if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
                        elem.addClass('dismiss');
                    } else {
                        elem.removeClass('dismiss');
                    }
                },
                cancel: function () {
                    elem.removeClass('dismiss');
                },
                end: function (drag) {
                    elem.removeClass('dismiss');
                    if (Math.abs(drag.distanceX) >= drag.rect.width / 4) {
                        scope.$apply(function () {
                            carousel.next();
                        });
                    }
                    drag.reset();
                }
            });
        }
    };
});
app.directive('dragMe', ['$drag', function ($drag) {
        return {
            controller: function ($scope, $element) {
                $drag.bind($element,
                        {
                            //
                            // Here you can see how to limit movement 
                            // to an element
                            //
                            transform: $drag.TRANSLATE_INSIDE($element.parent()),
                            end: function (drag) {
                                // go back to initial position
                                drag.reset();
                            }
                        },
                        {// release touch when movement is outside bounduaries
                            sensitiveArea: $element.parent()
                        }
                );
            }
        };
    }]);
app.factory('DataFactory', function () {
    return {
        getStory: function (street) {
            var location = {"Rosenheimer Str. 145 Munich": [
                    {"id": "1", "title": "Einst war hier eine Munitionsfabrik ", 
                        "story": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mollis magna. Nam gravida urna non erat pretium, ut pulvinar lacus auctor. Sed nec orci libero. Nulla ut maximus urna. Sed tristique massa blandit orci commodo, vitae bibendum nunc molestie. Etiam non est in tortor dignissim varius eget ac sem. Sed ante ligula, imperdiet eget turpis vitae, varius sodales dolor. Quisque laoreet leo libero, sed aliquet ligula suscipit vitae. Nunc id dapibus sapien. Donec ac orci et lectus ullamcorper vehicula sit amet at leo. Cras ac eros volutpat, lobortis elit nec, interdum nulla. Quisque tortor urna, tristique eget sagittis sit amet, volutpat at elit. Aenean eu ex vel nisl posuere dictum. Suspendisse potenti. Donec euismod massa at enim tincidunt, sit amet pellentesque leo fringilla.\r\n\r\nDonec laoreet justo purus, vitae dignissim ex finibus quis. Ut fringilla ligula suscipit, ultrices mi accumsan, dignissim magna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc ut justo interdum, iaculis nulla a, congue ipsum. Etiam quam nulla, dictum vitae purus id, eleifend pharetra velit. Pellentesque gravida tristique tincidunt. Nam eget nisl non augue mattis varius. Phasellus sagittis accumsan justo a pretium. Aliquam mollis nibh et massa congue, quis imperdiet nunc hendrerit. Praesent a ante nec velit vestibulum lacinia eget eget felis. Nulla luctus magna nec dapibus elementum. Vivamus ullamcorper libero eget tortor consequat, ac pharetra justo tempus. Mauris maximus vitae erat non sodales. Cras eu euismod dui, et viverra diam. Sed sagittis nisi sed quam tincidunt pharetra.\r\n\r\nSuspendisse dapibus ligula et est pharetra, in vestibulum urna vehicula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam nec leo faucibus, fermentum lorem ac, ultricies libero. Maecenas posuere enim elementum venenatis egestas. Quisque faucibus felis nec lacus mollis molestie. Phasellus at nulla auctor, volutpat ipsum eu, blandit elit. Nam at sapien eget urna sollicitudin molestie quis eu nulla. Integer feugiat rhoncus quam quis vestibulum. Proin molestie urna ex, semper pulvinar mi venenatis a. Duis maximus malesuada porta. Nam interdum bibendum massa, eu tincidunt risus molestie et. Donec quis diam fringilla, varius sapien a, fringilla dolor. Integer et libero in risus efficitur vehicula ac id lectus. Integer rhoncus fermentum purus at porttitor. Ut sapien dui, commodo ut est sed, dictum condimentum dui. Sed massa ipsum, maximus non malesuada sed, mattis sed mauris.\r\n\r\nNullam eget lacus ut neque venenatis elementum. Integer eget posuere tellus, interdum porta magna. Proin tortor arcu, egestas quis ornare eu, fringilla at eros. Sed gravida pulvinar sodales. Sed tincidunt consequat volutpat. Aenean nec sem ac felis ornare facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\r\n\r\nNulla condimentum ultrices eros, vitae rutrum purus iaculis eget. Ut accumsan molestie velit, ac vulputate quam dignissim vitae. Sed condimentum, nunc quis euismod vehicula, mi eros porttitor nulla, at rhoncus dui est at justo. Nullam at quam eget elit fringilla convallis. Morbi et gravida sem. Ut tristique enim ac facilisis dapibus. Aenean bibendum, purus eu porta imperdiet, lacus elit rutrum elit, vel elementum neque nulla non elit. Fusce ullamcorper in neque vitae euismod. Vivamus ligula massa, ultrices vel gravida vitae, elementum in lectus.", "picture": "http:\/\/www.baupedia.de\/wordpress\/wp-content\/uploads\/2011\/12\/Medienbr%C3%BCcke-M%C3%BCnchen-.-Nord-Westseite-.-Eingang-Media-Works-Munich-.-Rosenheimer-Stra%C3%9Fe-145.jpg", "type": "1"}]};
            return location;
        }
    }
});
//
// For this trivial demo we have just a unique MainController 
// for everything
//
app.controller('MainController', function ($rootScope, $scope, $http, $location, DataFactory) {

    ///// own stuff
    $scope.map = {center: {latitude: 48.136, longitude: 11.5745}, zoom: 12};
    $scope.markers = [];
    $scope.locations = [
        {"Marienplatz": [{
                    id: "1",
                    name: "Marienplatz",
                    title: "Einst war hier eine Munitionsfabrik",
                    story: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mollis magna. Nam gravida urna non erat pretium, ut pulvinar lacus auctor. Sed nec orci libero. Nulla ut maximus urna. Sed tristique massa blandit orci commodo, vitae bibendum nunc molestie. Etiam non est in tortor dignissim varius eget ac sem. Sed ante ligula, imperdiet eget turpis vitae, varius sodales dolor. Quisque laoreet leo libero, sed aliquet ligula suscipit vitae. Nunc id dapibus sapien. Donec ac orci et lectus ullamcorper vehicula sit amet at leo. Cras ac eros volutpat, lobortis elit nec, interdum nulla. Quisque tortor urna, tristique eget sagittis sit amet, volutpat at elit. Aenean eu ex vel nisl posuere dictum. Suspendisse potenti. Donec euismod massa at enim tincidunt, sit amet pellentesque leo fringilla.\r\n\r\nDonec laoreet justo purus, vitae dignissim ex finibus quis. Ut fringilla ligula suscipit, ultrices mi accumsan, dignissim magna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc ut justo interdum, iaculis nulla a, congue ipsum. Etiam quam nulla, dictum vitae purus id, eleifend pharetra velit. Pellentesque gravida tristique tincidunt. Nam eget nisl non augue mattis varius. Phasellus sagittis accumsan justo a pretium. Aliquam mollis nibh et massa congue, quis imperdiet nunc hendrerit. Praesent a ante nec velit vestibulum lacinia eget eget felis. Nulla luctus magna nec dapibus elementum. Vivamus ullamcorper libero eget tortor consequat, ac pharetra justo tempus. Mauris maximus vitae erat non sodales. Cras eu euismod dui, et viverra diam. Sed sagittis nisi sed quam tincidunt pharetra.\r\n\r\nSuspendisse dapibus ligula et est pharetra, in vestibulum urna vehicula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam nec leo faucibus, fermentum lorem ac, ultricies libero. Maecenas posuere enim elementum venenatis egestas. Quisque faucibus felis nec lacus mollis molestie. Phasellus at nulla auctor, volutpat ipsum eu, blandit elit. Nam at sapien eget urna sollicitudin molestie quis eu nulla. Integer feugiat rhoncus quam quis vestibulum. Proin molestie urna ex, semper pulvinar mi venenatis a. Duis maximus malesuada porta. Nam interdum bibendum massa, eu tincidunt risus molestie et. Donec quis diam fringilla, varius sapien a, fringilla dolor. Integer et libero in risus efficitur vehicula ac id lectus. Integer rhoncus fermentum purus at porttitor. Ut sapien dui, commodo ut est sed, dictum condimentum dui. Sed massa ipsum, maximus non malesuada sed, mattis sed mauris.\r\n\r\nNullam eget lacus ut neque venenatis elementum. Integer eget posuere tellus, interdum porta magna. Proin tortor arcu, egestas quis ornare eu, fringilla at eros. Sed gravida pulvinar sodales. Sed tincidunt consequat volutpat. Aenean nec sem ac felis ornare facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\r\n\r\nNulla condimentum ultrices eros, vitae rutrum purus iaculis eget. Ut accumsan molestie velit, ac vulputate quam dignissim vitae. Sed condimentum, nunc quis euismod vehicula, mi eros porttitor nulla, at rhoncus dui est at justo. Nullam at quam eget elit fringilla convallis. Morbi et gravida sem. Ut tristique enim ac facilisis dapibus. Aenean bibendum, purus eu porta imperdiet, lacus elit rutrum elit, vel elementum neque nulla non elit. Fusce ullamcorper in neque vitae euismod. Vivamus ligula massa, ultrices vel gravida vitae, elementum in lectus.",
                    picture: "http:\/\/www.baupedia.de\/wordpress\/wp-content\/uploads\/2011\/12\/Medienbr%C3%BCcke-M%C3%BCnchen-.-Nord-Westseite-.-Eingang-Media-Works-Munich-.-Rosenheimer-Stra%C3%9Fe-145.jpg"
                }, {
                    id: "2",
                    name: "Marienplatz2",
                    title: "Test eins zwei drei",
                    story: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mollis magna. Nam gravida urna non erat pretium, ut pulvinar lacus auctor. Sed nec orci libero. Nulla ut maximus urna. Sed tristique massa blandit orci commodo, vitae bibendum nunc molestie. Etiam non est in tortor dignissim varius eget ac sem. Sed ante ligula, imperdiet eget turpis vitae, varius sodales dolor. Quisque laoreet leo libero, sed aliquet ligula suscipit vitae. Nunc id dapibus sapien. Donec ac orci et lectus ullamcorper vehicula sit amet at leo. Cras ac eros volutpat, lobortis elit nec, interdum nulla. Quisque tortor urna, tristique eget sagittis sit amet, volutpat at elit. Aenean eu ex vel nisl posuere dictum. Suspendisse potenti. Donec euismod massa at enim tincidunt, sit amet pellentesque leo fringilla.\r\n\r\nDonec laoreet justo purus, vitae dignissim ex finibus quis. Ut fringilla ligula suscipit, ultrices mi accumsan, dignissim magna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc ut justo interdum, iaculis nulla a, congue ipsum. Etiam quam nulla, dictum vitae purus id, eleifend pharetra velit. Pellentesque gravida tristique tincidunt. Nam eget nisl non augue mattis varius. Phasellus sagittis accumsan justo a pretium. Aliquam mollis nibh et massa congue, quis imperdiet nunc hendrerit. Praesent a ante nec velit vestibulum lacinia eget eget felis. Nulla luctus magna nec dapibus elementum. Vivamus ullamcorper libero eget tortor consequat, ac pharetra justo tempus. Mauris maximus vitae erat non sodales. Cras eu euismod dui, et viverra diam. Sed sagittis nisi sed quam tincidunt pharetra.\r\n\r\nSuspendisse dapibus ligula et est pharetra, in vestibulum urna vehicula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam nec leo faucibus, fermentum lorem ac, ultricies libero. Maecenas posuere enim elementum venenatis egestas. Quisque faucibus felis nec lacus mollis molestie. Phasellus at nulla auctor, volutpat ipsum eu, blandit elit. Nam at sapien eget urna sollicitudin molestie quis eu nulla. Integer feugiat rhoncus quam quis vestibulum. Proin molestie urna ex, semper pulvinar mi venenatis a. Duis maximus malesuada porta. Nam interdum bibendum massa, eu tincidunt risus molestie et. Donec quis diam fringilla, varius sapien a, fringilla dolor. Integer et libero in risus efficitur vehicula ac id lectus. Integer rhoncus fermentum purus at porttitor. Ut sapien dui, commodo ut est sed, dictum condimentum dui. Sed massa ipsum, maximus non malesuada sed, mattis sed mauris.\r\n\r\nNullam eget lacus ut neque venenatis elementum. Integer eget posuere tellus, interdum porta magna. Proin tortor arcu, egestas quis ornare eu, fringilla at eros. Sed gravida pulvinar sodales. Sed tincidunt consequat volutpat. Aenean nec sem ac felis ornare facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\r\n\r\nNulla condimentum ultrices eros, vitae rutrum purus iaculis eget. Ut accumsan molestie velit, ac vulputate quam dignissim vitae. Sed condimentum, nunc quis euismod vehicula, mi eros porttitor nulla, at rhoncus dui est at justo. Nullam at quam eget elit fringilla convallis. Morbi et gravida sem. Ut tristique enim ac facilisis dapibus. Aenean bibendum, purus eu porta imperdiet, lacus elit rutrum elit, vel elementum neque nulla non elit. Fusce ullamcorper in neque vitae euismod. Vivamus ligula massa, ultrices vel gravida vitae, elementum in lectus.",
                    picture: "http:\/\/www.baupedia.de\/wordpress\/wp-content\/uploads\/2011\/12\/Medienbr%C3%BCcke-M%C3%BCnchen-.-Nord-Westseite-.-Eingang-Media-Works-Munich-.-Rosenheimer-Stra%C3%9Fe-145.jpg"
                }]}
        , {"Marienplatz2": [{
                    id: "1",
                    name: "Marienplatz",
                    title: "Einst war hier eine Munitionsfabrik",
                    story: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mollis magna. Nam gravida urna non erat pretium, ut pulvinar lacus auctor. Sed nec orci libero. Nulla ut maximus urna. Sed tristique massa blandit orci commodo, vitae bibendum nunc molestie. Etiam non est in tortor dignissim varius eget ac sem. Sed ante ligula, imperdiet eget turpis vitae, varius sodales dolor. Quisque laoreet leo libero, sed aliquet ligula suscipit vitae. Nunc id dapibus sapien. Donec ac orci et lectus ullamcorper vehicula sit amet at leo. Cras ac eros volutpat, lobortis elit nec, interdum nulla. Quisque tortor urna, tristique eget sagittis sit amet, volutpat at elit. Aenean eu ex vel nisl posuere dictum. Suspendisse potenti. Donec euismod massa at enim tincidunt, sit amet pellentesque leo fringilla.\r\n\r\nDonec laoreet justo purus, vitae dignissim ex finibus quis. Ut fringilla ligula suscipit, ultrices mi accumsan, dignissim magna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc ut justo interdum, iaculis nulla a, congue ipsum. Etiam quam nulla, dictum vitae purus id, eleifend pharetra velit. Pellentesque gravida tristique tincidunt. Nam eget nisl non augue mattis varius. Phasellus sagittis accumsan justo a pretium. Aliquam mollis nibh et massa congue, quis imperdiet nunc hendrerit. Praesent a ante nec velit vestibulum lacinia eget eget felis. Nulla luctus magna nec dapibus elementum. Vivamus ullamcorper libero eget tortor consequat, ac pharetra justo tempus. Mauris maximus vitae erat non sodales. Cras eu euismod dui, et viverra diam. Sed sagittis nisi sed quam tincidunt pharetra.\r\n\r\nSuspendisse dapibus ligula et est pharetra, in vestibulum urna vehicula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam nec leo faucibus, fermentum lorem ac, ultricies libero. Maecenas posuere enim elementum venenatis egestas. Quisque faucibus felis nec lacus mollis molestie. Phasellus at nulla auctor, volutpat ipsum eu, blandit elit. Nam at sapien eget urna sollicitudin molestie quis eu nulla. Integer feugiat rhoncus quam quis vestibulum. Proin molestie urna ex, semper pulvinar mi venenatis a. Duis maximus malesuada porta. Nam interdum bibendum massa, eu tincidunt risus molestie et. Donec quis diam fringilla, varius sapien a, fringilla dolor. Integer et libero in risus efficitur vehicula ac id lectus. Integer rhoncus fermentum purus at porttitor. Ut sapien dui, commodo ut est sed, dictum condimentum dui. Sed massa ipsum, maximus non malesuada sed, mattis sed mauris.\r\n\r\nNullam eget lacus ut neque venenatis elementum. Integer eget posuere tellus, interdum porta magna. Proin tortor arcu, egestas quis ornare eu, fringilla at eros. Sed gravida pulvinar sodales. Sed tincidunt consequat volutpat. Aenean nec sem ac felis ornare facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\r\n\r\nNulla condimentum ultrices eros, vitae rutrum purus iaculis eget. Ut accumsan molestie velit, ac vulputate quam dignissim vitae. Sed condimentum, nunc quis euismod vehicula, mi eros porttitor nulla, at rhoncus dui est at justo. Nullam at quam eget elit fringilla convallis. Morbi et gravida sem. Ut tristique enim ac facilisis dapibus. Aenean bibendum, purus eu porta imperdiet, lacus elit rutrum elit, vel elementum neque nulla non elit. Fusce ullamcorper in neque vitae euismod. Vivamus ligula massa, ultrices vel gravida vitae, elementum in lectus.",
                    picture: "http:\/\/www.baupedia.de\/wordpress\/wp-content\/uploads\/2011\/12\/Medienbr%C3%BCcke-M%C3%BCnchen-.-Nord-Westseite-.-Eingang-Media-Works-Munich-.-Rosenheimer-Stra%C3%9Fe-145.jpg"
                }, {
                    id: "2",
                    name: "Marienplatz2",
                    title: "Test eins zwei drei",
                    story: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mollis magna. Nam gravida urna non erat pretium, ut pulvinar lacus auctor. Sed nec orci libero. Nulla ut maximus urna. Sed tristique massa blandit orci commodo, vitae bibendum nunc molestie. Etiam non est in tortor dignissim varius eget ac sem. Sed ante ligula, imperdiet eget turpis vitae, varius sodales dolor. Quisque laoreet leo libero, sed aliquet ligula suscipit vitae. Nunc id dapibus sapien. Donec ac orci et lectus ullamcorper vehicula sit amet at leo. Cras ac eros volutpat, lobortis elit nec, interdum nulla. Quisque tortor urna, tristique eget sagittis sit amet, volutpat at elit. Aenean eu ex vel nisl posuere dictum. Suspendisse potenti. Donec euismod massa at enim tincidunt, sit amet pellentesque leo fringilla.\r\n\r\nDonec laoreet justo purus, vitae dignissim ex finibus quis. Ut fringilla ligula suscipit, ultrices mi accumsan, dignissim magna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc ut justo interdum, iaculis nulla a, congue ipsum. Etiam quam nulla, dictum vitae purus id, eleifend pharetra velit. Pellentesque gravida tristique tincidunt. Nam eget nisl non augue mattis varius. Phasellus sagittis accumsan justo a pretium. Aliquam mollis nibh et massa congue, quis imperdiet nunc hendrerit. Praesent a ante nec velit vestibulum lacinia eget eget felis. Nulla luctus magna nec dapibus elementum. Vivamus ullamcorper libero eget tortor consequat, ac pharetra justo tempus. Mauris maximus vitae erat non sodales. Cras eu euismod dui, et viverra diam. Sed sagittis nisi sed quam tincidunt pharetra.\r\n\r\nSuspendisse dapibus ligula et est pharetra, in vestibulum urna vehicula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nullam nec leo faucibus, fermentum lorem ac, ultricies libero. Maecenas posuere enim elementum venenatis egestas. Quisque faucibus felis nec lacus mollis molestie. Phasellus at nulla auctor, volutpat ipsum eu, blandit elit. Nam at sapien eget urna sollicitudin molestie quis eu nulla. Integer feugiat rhoncus quam quis vestibulum. Proin molestie urna ex, semper pulvinar mi venenatis a. Duis maximus malesuada porta. Nam interdum bibendum massa, eu tincidunt risus molestie et. Donec quis diam fringilla, varius sapien a, fringilla dolor. Integer et libero in risus efficitur vehicula ac id lectus. Integer rhoncus fermentum purus at porttitor. Ut sapien dui, commodo ut est sed, dictum condimentum dui. Sed massa ipsum, maximus non malesuada sed, mattis sed mauris.\r\n\r\nNullam eget lacus ut neque venenatis elementum. Integer eget posuere tellus, interdum porta magna. Proin tortor arcu, egestas quis ornare eu, fringilla at eros. Sed gravida pulvinar sodales. Sed tincidunt consequat volutpat. Aenean nec sem ac felis ornare facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\r\n\r\nNulla condimentum ultrices eros, vitae rutrum purus iaculis eget. Ut accumsan molestie velit, ac vulputate quam dignissim vitae. Sed condimentum, nunc quis euismod vehicula, mi eros porttitor nulla, at rhoncus dui est at justo. Nullam at quam eget elit fringilla convallis. Morbi et gravida sem. Ut tristique enim ac facilisis dapibus. Aenean bibendum, purus eu porta imperdiet, lacus elit rutrum elit, vel elementum neque nulla non elit. Fusce ullamcorper in neque vitae euismod. Vivamus ligula massa, ultrices vel gravida vitae, elementum in lectus.",
                    picture: "http:\/\/www.baupedia.de\/wordpress\/wp-content\/uploads\/2011\/12\/Medienbr%C3%BCcke-M%C3%BCnchen-.-Nord-Westseite-.-Eingang-Media-Works-Munich-.-Rosenheimer-Stra%C3%9Fe-145.jpg"

                }]}];

    $scope.stories = [];
    $scope.locationName = "";
    $scope.story = {};

    $scope.goToStory = goToStory;
        $scope.goToHome = goToHome;
        $scope.goToNew = goToNew;
    $scope.getRandomDegree = getRandomDegree;


    initializeMarkers();
    function initializeMarkers() {
        var marker1 = {
            id: 0,
            coords: {
                latitude: 48.136,
                longitude: 11.5745
            },
            options: {},
            events: {
                click: function () {
                    $scope.locations = goToLocation("Marienplatz");
                }
            }
        };
        var marker2 = {
            id: 1,
            coords: {
                latitude: 48.146,
                longitude: 11.5745
            },
            options: {},
            events: {
                click: function () {
                    alert('hello');
                }
            }
        };
//        $http.jsonp("http://maps.googleapis.com/maps/api/geocode/json?address=Marienplatz&sensor=false").
//                success(function (data, status) {
//                    alert(data);
//                    var p = data.results[0].geometry.location;
//                    alert(p);
//                    marker1.coords.latitude = p.lat;
//                    marker1.coords.longitude = p.lng;
//
//                }).
//                error(function (data, status) {
//                    console.log(data || "Request failed");
//                });
        $scope.markers.push(marker1);
        $scope.markers.push(marker2);
    }
    function getRandomDegree() {
        var result = Math.floor(Math.random() * 70) + 1;
        return result;
    }
    function goToLocation(locationName) {
        //set location
        angular.forEach($scope.locations, function (value, key) {
            if (value[locationName] != null) {
                $scope.stories = value[locationName];
            }
        });
        console.log($scope.stories);
        $scope.locationName = locationName;
        $location.path("location");
    }

    function goToStory(storyId) {
        var stories = $scope.stories;
        angular.forEach(stories, function (value, key) {
            if (value.id == storyId)
                $scope.story = value;
        });
        $location.path("story");
    }

        function goToNew() {

            $location.path("new");
        }
        function goToHome() {

            $location.path("");
        }
    $scope.nextPicture = function(id) {
        alert('Swiped ' + id);
    };
    
    $scope.previousPicture = function(id) {
        alert('right Swiped ' + id);
    };
}
);