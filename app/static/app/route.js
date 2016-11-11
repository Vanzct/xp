// 注册页面路径
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
    when('/add_child', {
        templateUrl: templates_root+'add_01.html',
        controller: 'AddController'
    })
    .when('/select_child', {
        templateUrl: templates_root+'select.html',
        controller: 'SelectController'
    })
    .when('/select_child_free', {
        templateUrl: templates_root+'select.html',
        controller: 'SelectController'
    })
    .when('/edit_child', {
        templateUrl: templates_root+'edit.html',
        controller: 'EditController'
    })
    .when('/children', {
        templateUrl: templates_root+'children.html',
        controller: 'ChildrenController'
    })
    .when('/score/:child_id', {
        templateUrl: templates_root+'score.html',
        controller: 'ScoreController'
    })
    .when('/score_share_free', {
        templateUrl: templates_root+'score.html',
        controller: 'ScoreController'
    })
    .when('/success', {
        templateUrl: templates_root + 'loading.html',
        controller: 'LoadingController'
    })
    .when('/class', {
        templateUrl: templates_root + 'class.html',
        controller: 'ClassController'
    })
    .when('/homework', {
        templateUrl: templates_root + 'homework.html',
        controller: 'HomeWorkController'
    })
    .when('/photos', {
        templateUrl: templates_root + 'photos.html',
        controller: 'BesPhotosController'
    })
    .when('/photos_share_free', {
        templateUrl: templates_root+'photos.html',
        controller: 'BesPhotosController'
    })
    .otherwise({
        templateUrl: templates_root+'children.html',
        controller: 'ChildrenController'
    });
  }]);