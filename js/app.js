/*global angular, Firebase*/
var app = angular.module('LanPartyNinjaApp', ['firebase', 'smart-table', 'xeditable', 'ui.bootstrap']);

app.controller('MainController', ['$scope', '$filter', '$firebaseArray', function($scope, $filter, $firebaseArray) {
    var ref = new Firebase('https://lpn.firebaseio.com/');
    var gamesRef = ref.child('games');
    $scope.rowCollection = $firebaseArray(gamesRef);
    $scope.displayCollection = [].concat($scope.rowCollection);
    
    $scope.form = {};
    
    $scope.entry = {
        title: '',
        genre: '',
        maxPlayers: '',
        maxParty: '',
        isOnline: 'No',
        isOffline: 'No',
        isFree: 'No',
        platform: '',
        comments: ''
    };
    var blankEntry = angular.copy($scope.entry);
    
    
    var BUTTON_TEXT_ADD = 'Add Game';
    var BUTTON_TEXT_CLOSE = 'Close';
    $scope.addBtnTxt = BUTTON_TEXT_ADD;
    
    $scope.addGame = function() {
        if ($scope.addGameForm.$invalid) {
            return;
        }
        var entry = $scope.entry;
        gamesRef.push({
          title: entry.title,
          genre: entry.genre,
          maxPlayers: entry.maxPlayers,
          maxParty: entry.maxParty,
          online: entry.isOnline,
          offline: entry.isOffline,
          free: entry.isFree,
          platform: entry.platform,
          comments: entry.comments
        });
        clearAddForm();
    };
    
    $scope.toggleAddBtn = function() {
        $scope.addBtnTxt = $scope.addBtnTxt === BUTTON_TEXT_ADD ? BUTTON_TEXT_CLOSE : BUTTON_TEXT_ADD;
        clearAddForm();
    };
    
    var clearAddForm = function() {
        $scope.addGameForm.$setUntouched();
        angular.copy(blankEntry, $scope.entry);
    };
    
    $scope.saveNewTableVal = function(row) {
        $scope.rowCollection.$save(row);
    };
}]);

app.filter('unique', function() {
    return function (arr, field) {
        var o = {}, i, l = arr.length, r = [];
        for(i=0; i<l;i+=1) {
            o[arr[i][field]] = arr[i];
        }
        for(i in o) {
            r.push(o[i]);
        }
        return r;
    };
});

app.directive('stNumberRange', ['$timeout', function ($timeout) {
    return {
        restrict: 'E',
        require: '^stTable',
        scope: {
            lower: '=',
            higher: '='
        },
        templateUrl: 'components/stNumberRange.html',
        link: function(scope, element, attr, table) {
            var inputs = element.find('input');
            var inputLower = angular.element(inputs[1]);
            var inputHigher = angular.element(inputs[0]);
            var predicateName = attr.predicate;

            [inputLower, inputHigher].forEach(function (input, index) {

                input.bind('change', function () {
                    var query = {};

                    if (scope.lower) {
                        query.lower = scope.lower;
                    }

                    if (scope.higher) {
                        query.higher = scope.higher;
                    }

                    scope.$apply(function () {
                        table.search(query, predicateName)
                    });
                });
            });
        }
    };
}]);

app.filter('customFilter', ['$filter', function ($filter) {
    var filterFilter = $filter('filter');
    var standardComparator = function standardComparator(obj, text) {
        text = ('' + text).toLowerCase();
        return ('' + obj).toLowerCase().indexOf(text) > -1;
    };

    return function customFilter(array, expression) {
        function customComparator(actual, expected) {

            var isBeforeActivated = expected.before;
            var isAfterActivated = expected.after;
            var isLower = expected.lower;
            var isHigher = expected.higher;
            var higherLimit;
            var lowerLimit;
            var itemDate;
            var queryDate;


            if (angular.isObject(expected)) {
                //date range
                if (expected.before || expected.after) {
                    try {
                        if (isBeforeActivated) {
                            higherLimit = expected.before;

                            itemDate = new Date(actual);
                            queryDate = new Date(higherLimit);

                            if (itemDate > queryDate) {
                                return false;
                            }
                        }

                        if (isAfterActivated) {
                            lowerLimit = expected.after;


                            itemDate = new Date(actual);
                            queryDate = new Date(lowerLimit);

                            if (itemDate < queryDate) {
                                return false;
                            }
                        }

                        return true;
                    } catch (e) {
                        return false;
                    }

                } else if (isLower || isHigher) {
                    //number range
                    if (isLower) {
                        higherLimit = expected.lower;

                        if (actual > higherLimit) {
                            return false;
                        }
                    }

                    if (isHigher) {
                        lowerLimit = expected.higher;
                        if (actual < lowerLimit) {
                            return false;
                        }
                    }

                    return true;
                }
                //etc

                return true;

            }
            return standardComparator(actual, expected);
        }

        var output = filterFilter(array, expression, customComparator);
        return output;
    };
}]);