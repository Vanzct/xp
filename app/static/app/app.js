/* App Module */
templates_root = '/static/app/templates/';

var app = angular.module('app', [
  'ngRoute',
  'ngDialog',
  'userController'
]);

app.run(['$location', '$rootScope', '$http', '$routeParams',
    function($location, $rootScope, $http, $routeParams) {

    /************************************ 全局常亮定义区 **********************************/
    $rootScope.url_prefix = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/";
    $rootScope.templates_path =  $rootScope.url_prefix + "static/app/templates/";

    $rootScope.alert_url = $rootScope.templates_path + "alert.html";
    // 浏览器鉴别
    var ua = navigator.userAgent.toLowerCase();
    $rootScope.wx_client = ua.indexOf('micromessenger') != -1;

    // var isAndroid = ua.indexOf('android') != -1;
    $rootScope.isIos = (ua.indexOf('iphone') != -1) || (ua.indexOf('ipad') != -1);


    // 微信初始化
    if($rootScope.wx_client){
        // 检查是否微信登录好使
        $http({
            url: $rootScope.url_prefix + "api/wx/get_tx_signature",
            method: "GET",
        }).success(function(d){
            $rootScope.qiniu_bucket_domain = d.qiniu_bucket_domain;
            $rootScope.wx_ok = true;
            wx.config({
                debug: false,
                appId: d.app_id,
                timestamp: d.timestamp,
                nonceStr: d.noncestr,
                signature: d.signature,
                jsApiList: [
                  'checkJsApi',
                  'getLocation',
                  'hideMenuItems',
                  'onMenuShareTimeline',
                  'onMenuShareAppMessage',
                  'onMenuShareQQ',
                  'showMenuItems',
                ]
            });

            wx.ready(function(){

                wx.hideMenuItems({
                    menuList: [
                        'menuItem:share:timeline',
                        'menuItem:share:appMessage',
                        'menuItem:share:qq',
                        'menuItem:share:QZone',
                        'menuItem:openWithQQBrowser',
                        'menuItem:openWithSafari',
                        'menuItem:share:email'
                    ]
                });

            });
        }).error(function(data){
            // TODO 请求用户信息异常
        });
    }


    var url = window.location.toString();
    var pathWithoutHash = url.split("#")[0],
        hasQuery = pathWithoutHash.indexOf('?') > 0;
    //console.log(hasQuery);
    if(hasQuery) {
        var link = pathWithoutHash.split("?")[0] + "#" + url.split('#')[1];
        window.location = link;
    }
    // 页面跳转后
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        if($rootScope.wx_client){
            if($location.path().toString().indexOf("share") > 0){
                wx.showMenuItems({
                    menuList: [
                      'menuItem:share:timeline',
                        'menuItem:share:appMessage',
                        'menuItem:share:qq'
                    ]
                });
            }else{
                wx.hideMenuItems({
                    menuList: [
                        'menuItem:share:timeline',
                        'menuItem:share:appMessage',
                        'menuItem:share:qq',
                        'menuItem:share:QZone',
                        'menuItem:openWithQQBrowser',
                        'menuItem:openWithSafari',
                        'menuItem:share:email'
                    ]
                });
            }
        }

    });

    /**********************************************************************

        全局方法区

    ***********************************************************************/

    $rootScope.back = function(){
        // 返回 取出上一个path 存入当前path
        $rootScope.is_back = true;
        if($rootScope.back_path){
            //console.log("BACK TO:"+$rootScope.back_path);
            $location.path($rootScope.back_path);
        }else{
            window.history.back();
        }
    }
    // 对象存储
    $rootScope.putObject =function(key, value){
        localStorage.setItem(key, angular.toJson(value));
    };
    $rootScope.getObject =function(key){
        return angular.fromJson(localStorage.getItem(key))
    };

    $rootScope.download_alert = null;

    $rootScope.close_alert = function(){
        $rootScope.download_alert = "y";
    }

    /*
        这是用angular写但页面时设置微信title的黑魔法
        因为 document.title = title; 对于PC web好使，对于微信不起作用;
    */
    $rootScope.set_page_title = function(title){
        $rootScope.page_name = title;
        var body = document.getElementsByTagName('body')[0];
        document.title = title;
        var iframe = document.createElement("iframe");
        iframe.setAttribute("src", "/empty.png");

        iframe.addEventListener('load', function() {
          setTimeout(function() {
            //iframe.removeEventListener('load');
            document.body.removeChild(iframe);
          }, 0);
        });
        document.body.appendChild(iframe);
    };
    $rootScope.alert = function(args){
        $rootScope.alert_show = true;
        if(args){
            $rootScope.alert_str = args.data? args.data : args;
            $rootScope.alert_type = args.type || "error";

            setTimeout(function(){
                $rootScope.alert_show = null;
                $rootScope.$apply();
                }, 3000);
        }else{
            $rootScope.alert_str = "未知错误";
        }
    };



    var check_user = function(){
        $rootScope.open_id = localStorage.open_id;
        $rootScope.token = localStorage.token;
        return $rootScope.user_id;
    };
    alert($location.path().toString());
    if($location.path().toString().indexOf("/success") >= 0  &&  $location.path().indexOf('free') < 0){
         localStorage.login_in_path = window.location.toString();

         if(!check_user() ){
            if($rootScope.wx_client){
                window.location = "/api/wx/login";
            }else{
                $rootScope.open_id ='oQHvLwsNRtvDR_DYYq0D2JjV6nHc';
                $rootScope.token = 12;
            }
         }
        // 验证登录是否失效
        if($rootScope.wx_client){
            $http({
                url: $rootScope.url_prefix + "api/wx/is_token_expired",
                method: "POST",
                params: {
                    user_id: $rootScope.user_id,
                    token: $rootScope.token
                }
            }).success(function(data){
                if(data.code == 1 ){
                    var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
                    if (keys) {
                        for (var i = keys.length; i--;)
                            document.cookie=keys[i]+'=0;expires=' + new Date( 0).toUTCString()
                    }
                    localStorage.login_in_path = window.location;
                    window.location = "/api/wx/login";
                }
            }).error(function(d){
                // TODO login error
                $rootScope.alert('验证过期出现问题');
            });
        }
    }

    $rootScope.share = function(hashcode, path, title, desc, imgUrl){
        // 微信初始化
        if(!$rootScope.wx_client){
            return;
        }
        $http({
            url: $rootScope.url_prefix + "api/wx/get_tx_signature",
            method: "POST",
            params: {
                user_id: $rootScope.user_id,
                token: $rootScope.token,
                hashcode: hashcode
            }
        }).success(function(data){
            //console.log(data);
            if(data.code == 1 ){
                wx.config({
                    debug: false,
                    appId: data.app_id,
                    timestamp: data.timestamp,
                    nonceStr: data.noncestr,
                    signature: wx.signature,
                    jsApiList: [
                      'checkJsApi',
                      'onMenuShareTimeline',
                      'onMenuShareAppMessage',
                      'onMenuShareQQ',
                      'showMenuItems'
                    ]
                });

                wx.ready(function(){
                    wx.showMenuItems({
                        menuList: [
                            'menuItem:share:timeline',
                            'menuItem:share:appMessage',
                            'menuItem:share:qq',
                        ]
                    });
                    var link_url = window.location.href;
                    var base_url = 'http://weixin.keji110.com/#/'
                    wx.onMenuShareAppMessage({
                        title: title,
                        desc:  desc,
                        link: base_url+path,
                        imgUrl: imgUrl,
                        type: '',
                        dataUrl: '',
                        success: function () {
                            // 用户确认分享后执行的回调函数
                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数
                        }
                    });
                    wx.onMenuShareTimeline({
                        title: title, // 分享标题
                        link: base_url+path, // 分享链接
                        imgUrl: imgUrl, // 分享图标
                        success: function () {
                            // 用户确认分享后执行的回调函数
                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数
                        }
                    });

                    // QQ
                    wx.onMenuShareQQ({
                        title: title,
                        desc: desc,
                        link: base_url+path, // 分享链接
                        imgUrl: imgUrl, // 分享图标
                        success: function () {
                           // 用户确认分享后执行的回调函数
                        },
                        cancel: function () {
                           // 用户取消分享后执行的回调函数
                        }
                    });
                });
            }
        }).error(function(d){
            // TODO login error
            $rootScope.alert('验证过期出现问题');
        });

    }
}]);
