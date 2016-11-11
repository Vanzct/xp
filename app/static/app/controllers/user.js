var process = function(canvas_id, current, radius){
    //console.log("I am doing");
    var canvas = document.getElementById(canvas_id);
    var canvas_value = canvas.getAttribute("value");
    var process = canvas_value.substring(0, canvas_value.length-1);
    var oProcess = current;
    var context = canvas.getContext('2d');
    var scale = window.devicePixelRatio;
    var center = [radius*scale, radius*scale];
    canvas.style.width = radius*2 + "px";
    canvas.style.height = radius*2 + "px";
    canvas.width = radius*2*scale;
    canvas.height = radius*2*scale;

    //开始画一个灰色的圆
    context.beginPath();
    context.moveTo(center[0], center[1]);
    context.arc(center[0], center[1], center[0], 0, Math.PI * 2, false);
    context.closePath();
    context.fillStyle = '#e6e5e5';
    context.fill();

    // 画进度(红色)
    if(process != 0 && process != 100){
        context.beginPath();
        context.moveTo(center[0], center[1]);
        if(process <25){
            context.arc(center[0], center[1], center[0], Math.PI*1.5, Math.PI*(1.5+0.5*(process/25)), false);//设置圆弧的起始于终止点
        }
        else{
            context.arc(center[0], center[1], center[0], Math.PI*1.5, Math.PI*2* ((process / 100)-0.25), false);//设置圆弧的起始于终止点
        }
        context.closePath();
        context.fillStyle = '#a6d25d';
        context.fill();
    }
    else if(process == 100){
        context.beginPath();
        context.moveTo(center[0], center[1]);
        context.arc(center[0], center[1], center[0], 0, Math.PI*2, false);//设置圆弧的起始于终止点
        context.closePath();
        context.fillStyle = '#a6d25d';
        context.fill();
    }

    //画进度(橙色)
    if(oProcess != 0 && oProcess !=100){
        context.beginPath();
        context.moveTo(center[0], center[1]);
        context.arc(center[0], center[1], center[0], Math.PI*1.5,Math.PI*1.5-(oProcess/25)*Math.PI*0.5, true);//设置圆弧的起始于终止点
        context.closePath();
        context.fillStyle = '#dd3030';
        context.fill();
        //Math.PI*1.5-((oProcess+25)/100*Math.PI)
    }
    else if(oProcess == 100){
        context.beginPath();
        context.moveTo(center[0], center[1]);
        context.arc(center[0], center[1], center[0], 0,Math.PI*2, true);//设置圆弧的起始于终止点
        context.closePath();
        context.fillStyle = '#dd3030';
        context.fill();
    }

    // 画内部空白
    context.beginPath();
    context.moveTo(center[0], center[1]);
    context.arc(center[0], center[1], radius*2/3*scale, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = 'rgba(255,255,255, 1)';
    context.fill();
}

var userController = angular.module('userController', []);


userController.controller('AddController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){

    $scope.submit_status = "disable";
    if($routeParams.code){
        $scope.code = $routeParams.code;
        $scope.submit_status = "enable";
    }

    $scope.add = function(){
         $location.url("/select_child?code="+$scope.code);
    }

    $scope.input_change = function(){
//        if($scope.child.name_home && $scope.child.name_home.length >0 && $scope.child.code && $scope.child.code.length > 0){
//            $scope.submit_status = "enable";
//        }
        if($scope.code && $scope.code.length > 0){
            $scope.submit_status = "enable";
        }
    }

}]);


userController.controller('SelectController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){
    var code = $routeParams.code;

    $scope.load = function(){
        $http({
            url: "http://api.keji110.com/v2/child/studentListViaClassCode/format/json?code="+code,
            method: "GET",
            params: $scope.child
        }).then(function(response){
            //$location.path("/children");
            $scope.cs = response.data.data;
            if(!response.data.data || response.data.data.length<=0){
                $scope.tip = "y";
            }
            console.log(response.data.data);
        },function(e){
            //console.log(e);
            $scope.tip = "y";
        });
    };
    $scope.load();

    $scope.select = function(c){
        $rootScope.child = c;
        $location.url("/edit_child?student_id="+c.student_id);

    }
}]);

userController.controller('EditController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){
	$scope.child = $rootScope.child;
	if(!$scope.child){
	    $rootScope.back();
	}
	$scope.child.family_name = "爸爸";

    $scope.submit_status = "disable";
    $scope.add = function(){
        $scope.child.family_role = parseInt($scope.roles.indexOf($scope.child.family_name))+1;
        $scope.child.open_id = $rootScope.open_id;
        $http({
            url: "http://api.keji110.com/ios/child/createViaOpenid/format/json",
            method: "GET",
            params: {
                code: $scope.child.student_id,
                open_id: $rootScope.open_id,
                family_role: $scope.child.family_role,
                name_home: $scope.child.name_class
            }
        }).then(function(response){
            //$location.path("/children");
            if(response.data.error_code == 1){
                $scope.tip = "创建失败";
            }else{
                $location.path("/children");
            }
           console.log(response.data);
        },function(e){
            //console.log(e);
        });
    };
    $scope.change = function(){
        if($scope.child.name_class && $scope.child.name_class.length >0 && $scope.child.family_name && $scope.child.family_name.length > 0){
            $scope.submit_status = "enable";
        }

    };

    $scope.avatar_change = function(avatar_url){
        $scope.child.icon_home = "http://qn.keji110.com" + avatar_url;
    };
    $scope.avatar_picker_show = function(){
        $http({
            url: "http://api.keji110.com/ios/icon/list/format/json?slug=ICON_AVATAR",
            method: "GET"
        }).success(function(data){
            //console.log(data);
            var avatar_list = data.data;
            $scope.avatars = [];
            for(var i=0; i<avatar_list.length; i++){
                //console.log(avatar_list[i].icon);
                $scope.avatars.push(avatar_list[i].icon);
            }
            var dialog = ngDialog.open({ template: 'avatar',
                className: 'ngdialog-theme-plain avatar_picker',
                appendTo: '#edit',
                scope: $scope
            });
            dialog.closePromise.then(function (data){
                console.log(data.value);
                if(data.value!=undefined && data.value!="$document"){
                    $scope.child.icon_class =  data.value;
                }
            });
        }).error(function(){});
    };

    $scope.family_role_change = function(avatar_url){
        $scope.child.icon_home = "http://qn.keji110.com" + avatar_url;
    };
    $scope.roles = [
        "爸爸",
        "妈妈",
        "爷爷",
        "奶奶",
        "外公",
        "外婆",
        "叔叔",
        "阿姨",
        "其他"
    ];
    $scope.family_role_show = function(){

        var dialog = ngDialog.open({ template: 'relation_picker',
            className: 'ngdialog-theme-plain relation_picker',
            appendTo: '#edit',
            scope: $scope
        });
        dialog.closePromise.then(function (data){
            // console.log(data.value);
            if(data.value!=undefined && data.value!="$document"){
                $scope.child.family_name = data.value;
                $scope.change();
            }

        });

    }

}]);


userController.controller('ChildrenController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){
	var load = function(){
	    $http({
            url: "http://api.keji110.com/ios/child/listViaOpenid/format/json",
            method: "GET",
            params: {open_id: $rootScope.open_id}
        }).then(function(response){
            //console.log(response.data.data);
            $scope.children = response.data.data;
        },function(){
        });
	};

	load();


    $scope.del = function(child_id, $event){
        $event.stopPropagation();
        var dialog = ngDialog.open({ template: 'if_delete',
            className: 'ngdialog-theme-plain avatar_picker',
            appendTo: '#children',
            scope: $scope
        });
        dialog.closePromise.then(function (data){
            // 删除孩子
            if(data.value==1){
                $http({
                    // url: "http://api.keji110.com/app/child/deleteViaOpenid/format/json", 错误路径
                    url: "http://api.keji110.com/ios/child/deleteViaOpenid/format/json",
                    method: "GET",
                    params: {child_id: child_id}
                }).success(function(){
                    //fresh page
                    load();
                }).error(function(){
                    $rootScope.alert('删除操作失败');
                });
            }

        });
    };
    $scope.to_score = function(child_id, url){
        $rootScope.curr_child_head_url = url;
        $location.path("/score/" + child_id);
    }
}]);


userController.controller('ScoreController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){
    $scope.child_id = $routeParams.child_id;

    $scope.cur_subject = "全部";
    $scope.cur_dl = "本周";
    $scope.logo_url = "/static/app/img/oval237Copy@2x.png";

    $scope.action_type={
        "1": "积极点",
        "2": "消极点"
    };
    $scope.b_types={
        "1": "正常",
        "2": "迟到",
        "3": "旷课"
    };
    if($rootScope.curr_child_head_url){
        $scope.logo_url = $rootScope.curr_child_head_url;
    }

    $scope.load =function(dl){
        var pms = {child_id: $scope.child_id};
        if(dl){
            pms['date_limit'] = dl;
        }

        $http({
            url: "http://api.keji110.com/ios/class_report/listChild/format/json",
            method: "GET",
            params: pms
        }).then(function(response){
            //console.log(response.data);
            $scope.commits = [];
            $scope.positive_num = 0;
            $scope.negative_num = 0;
            $scope.f_commits = [];
            if(response.data.num_row > 0){
                $scope.positive_num = response.data.res_num[0].postiveNum;
                $scope.negative_num = response.data.res_num[1].negativeNum;

                process("score_canvas", $scope.negative_num/(parseInt($scope.positive_num)+parseInt($scope.negative_num))*100, 75);

                $scope.commits = response.data.data;

                $scope.subjects = ["全部"];
                for(var i=0; i<$scope.commits.length; i++){
                    if($scope.subjects.indexOf($scope.commits[i].class_subject_name) < 0){
                        $scope.subjects.push($scope.commits[i].class_subject_name);
                    }
                }

                if($scope.cur_subject == "全部"){
                    $scope.f_commits = $scope.commits;
                }else{
                    for(var i=0; i<$scope.commits.length; i++){
                        $scope.f_commits.push($scope.commits[i]);
                    }

                }

                if($scope.commits.length > 0){
                   // $scope.logo_url = "http://api.keji110.com/"+$scope.commits[0].student_icon;
                    var c = '积极行为点数：'+$scope.positive_num + ', 需要改进行为点数：' + $scope.negative_num;
                    $rootScope.share("score_share_free", "score_share_free?child_id="+$routeParams.child_id, $scope.commits[0].student_name+'在学校的表现', c, 'http://7xr4h2.com1.z0.glb.clouddn.com/xiaop.png');
                }
            }


        },function(){
        });
    };
    $scope.load(2);

    $scope.pin_chart = function(){
        var myChart = echarts.init(document.getElementById('score_chart'));
        // 绘制图表
        myChart.setOption({
            title: { text: '' },
            tooltip: {},
            series : [
                {
                    name: '访问来源',
                    type: 'pie',
                    legend: {
                        show: false
                    },
                    data:[
                        {value:335, name:'直接访问'},
                        {value:310, name:'邮件营销'}
                    ]
                }
            ]
        });
    };
    $scope.moment_show = function(dt){
        return moment(dt, "YYYY-MM-DD HH-mm-ss").fromNow();
    };
    $scope.dl = function(){
        var dialog = ngDialog.open({ template: 'date_limit',
            className: 'ngdialog-theme-plain date_limit_picker',
            appendTo: '#score',
            scope: $scope
        });
        dialog.closePromise.then(function (data){
            // console.log(data.value);
            if(data.value != undefined && data.value != '$document'){
                var dls = ["全部", "今天", "本周", "上周", "本月", "上月"];
                $scope.cur_dl = dls[data.value];
                $scope.load(data.value);
            }


        });
    };

    $scope.sbv = function(){
        var dialog = ngDialog.open({ template: 'subjectsmm',
            className: 'ngdialog-theme-plain date_limit_picker',
            appendTo: '#score',
            scope: $scope
        });
        dialog.closePromise.then(function (data){
            // console.log(data.value);
            if(data.value != undefined && data.value != '$document'){
                $scope.cur_subject = data.value;
                $scope.f_commits = [];
                if($scope.cur_subject == "全部"){
                    $scope.f_commits = $scope.commits;
                }else{
                    var good = 0;
                    var bad = 0;
                    for(var i=0; i<$scope.commits.length; i++){
                        if($scope.commits[i].class_subject_name == $scope.cur_subject){
                            if($scope.commits[i].bType == 1){
                                good += 1;
                            }else{
                                bad += 1;
                            }
                            $scope.f_commits.push($scope.commits[i]);
                        }
                    }

                    process("score_canvas", bad/(good+bad)*100, 75);

                }
            }
            //console.log($scope.f_commits);
        });
    }


}]);


userController.controller('LoadingController',
    ['$scope', '$location', '$routeParams', '$http', '$rootScope',
    function($scope, $location, $routeParams, $http, $rootScope){
    if($location.path() == "/success" ){
        $rootScope.open_id = $location.search().open_id;
        $rootScope.token = $location.search().token;
        localStorage.open_id = $rootScope.open_id;
        localStorage.token = $rootScope.token;
        // alert(localStorage.login_in_path);
        window.location = localStorage.login_in_path;
    }
}]);

userController.controller('ClassController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){

    $scope.loading = function(){
        $http({
            url: "http://api.keji110.com/ios/class_affair/listViaOpenid/format/json",
            method: "GET",
            params: {open_id: $rootScope.open_id, type: 1}
        }).then(function(response){
            //console.log(response.data);
            $scope.posts = response.data.data;
            $('.status_item > div > article img').width((window.screen.width-90)/3);

        },function(){

        });
    }
    $scope.loading();

    $scope.width = window.screen.width - 60;
    //console.log(window.screen.width);
    $scope.imgs = function(ims){
        return ims.split(',');
    }
    $scope.imagesStyle = function(imgs){
        if(!imgs){
            return {
                width: 0,
                height: 0
            }
        }else if(imgs.length==1){
            //console.log(imgs[0]);
            return {
                width: (window.screen.width-90)+'px',
                height: 'auto',
            }
        }else if(imgs.length==2){
            return {
                width: (window.screen.width-100)/2+'px',
                height: (window.screen.width-100)/2+'px'
            }
        }else{
            return {
                width: (window.screen.width-100)/3+'px',
                height: (window.screen.width-100)/3+'px'
            }
        }
    }
    $scope.isLike = function(v){
        if(v == "no"){
            return false;
        }else{
            return true;
        }
    }
    $scope.like = function(post){
        $http({
            url: "http://api.keji110.com/ios/class_affair/createLikeViaOpenid/format/json",
            method: "GET",
            params: {
                open_id: $rootScope.open_id,
                class_affair_id: post.class_affair_id
            }
        }).then(function(response){
            //console.log(response.data);
            if( response.data.error_code== 0){
                post.isLike = 'yes';
                post.like_num = parseInt(post.like_num) +1;
            }
        },function(){

        });
    }

    $scope.unlike = function(post){
        $http({
            url: "http://api.keji110.com/ios/class_affair/deleteLikeViaOpenid/format/json",
            method: "GET",
            params: {
                open_id: $rootScope.open_id,
                class_affair_id: post.class_affair_id,
                class_affair_like_id: post.class_affair_like_id
            }
        }).then(function(response){
            //console.log(response.data);
            if( response.data.error_code== 0){
                post.isLike = 'no';
                post.like_num = parseInt(post.like_num) - 1;
            }
        },function(){

        });
    }
    $scope.moment_show = function(dt){
        return moment(dt, "YYYY-MM-DD HH:mm:ss").fromNow();
    }
    $scope.to_homework = function(){
        $location.path("/homework/");
    }
    $scope.photo_show = function(post, img){
//        $rootScope.post = post;
//        $rootScope.curr_photo = img;
//        $rootScope.photos = post.images.split(',');
//        $rootScope.index = $rootScope.photos.indexOf(img);
        //console.log($rootScope.index);
//        $location.path('photos');
        $location.url('/photos?class_affair_id='+post.class_affair_id);
    }

}]);



userController.controller('HomeWorkController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){

    $scope.loading = function(){
        $http({
            url: "http://api.keji110.com/ios/class_affair/listViaOpenid/format/json",
            method: "GET",
            params: {open_id: $rootScope.open_id, type: 2}
        }).then(function(response){
            //console.log(response.data);
            $scope.posts = response.data.data;
            $('.status_item > div > article img').width((window.screen.width-90)/3);
        },function(){

        });
    }
    $scope.loading();

    $scope.width = window.screen.width - 60;
    $scope.imgs = function(ims){
        return ims.split(',');
    }
    $scope.imagesStyle = function(imgs){
        if(!imgs){
            return {
                width: 0,
                height: 0
            }
        }else if(imgs.length==1){
            //console.log(imgs[0]);
            return {
                width: (window.screen.width-90)+'px',
                height: 'auto',
            }
        }else if(imgs.length==2){
            return {
                width: (window.screen.width-100)/2+'px',
                height: (window.screen.width-100)/2+'px'
            }
        }else{
            return {
                width: (window.screen.width-110)/3+'px',
                height: (window.screen.width-110)/3+'px'
            }
        }
    };
    $scope.isCheck = function(v){
        if(v == "no"){
            return false;
        }else{
            return true;
        }
    };
    $scope.check = function(post){
        $http({
            url: "http://api.keji110.com/ios/class_affair/createCheckViaOpenid/format/json",
            method: "GET",
            params: {
                open_id: $rootScope.open_id,
                class_affair_id: post.class_affair_id
            }
        }).then(function(response){
            //console.log(response.data);
            if( response.data.error_code== 0){
                post.isCheck = 'yes';
                post.check_num = parseInt(post.like_num) +1;
            }
        },function(){

        });

    }

    $scope.moment_show = function(dt){
        return moment(dt, "YYYY-MM-DD HH:mm:ss").fromNow();
    }
    $scope.to_homework = function(){
        $location.path("/homework");
    }

    $scope.photo_show = function(post, img){
//        $rootScope.post = post;
//        $rootScope.curr_photo = img;
//        $rootScope.photos = post.images.split(',');
//        $rootScope.index = $rootScope.photos.indexOf(img);
        $location.url('/photos?class_affair_id='+post.class_affair_id);
    }
}]);


userController.controller('BesPhotosController',
	['$scope', '$rootScope', '$location', '$routeParams','$http', 'ngDialog',
	function($scope, $rootScope, $location, $routeParams, $http, ngDialog){


    var class_affair_id = $routeParams.class_affair_id;
    $scope.loading = function(){
        $http({
            url: "http://api.keji110.com/v2/class_affair/detail/format/json",
            method: "GET",
            params: {class_affair_id: class_affair_id}
        }).then(function(response){
            console.log(response.data);
            $scope.post = response.data.data;
            $scope.photos = $scope.post.images.split(',');
            var shareImage = 'http://7xr4h2.com1.z0.glb.clouddn.com/xiaop.png';
            if($scope.photos && $scope.photos.length > 0){
                shareImage = "http://qn.keji110.com/"+$scope.photos[0];
            }
            var content = $scope.post.content && $scope.post.content.length > 0 ? $scope.post.content : "来自校朋的动态"
            $rootScope.share("photos", 'photos_share_free?class_affair_id='+class_affair_id, "校朋动态", content, shareImage );

        },function(){

        });
    }
    $scope.loading();
//    var screenHeight = window.innerHeight,
//        screenWidth = window.innerWidth,
//        img = $("#img");
//
//    $("#img").hide();
//    $("#img").load(function(e){
//        $("#img").show();
//        var imgWidth = $("#img").width(),
//            imgHeight =  $("#img").height();
//        // 如果图片宽或高 >3/4， 让它拓展到 100%
//        var wp = imgWidth/screenWidth;  // 宽比列
//        var hp = imgHeight/screenHeight;  // 高比例
//
//        if(wp >= 0.75 || hp >= 0.75){
//            if(wp > hp){
//                imgWidth = screenWidth;
//                imgHeight = imgHeight/wp;
//            }
//            else{
//                imgHeight = screenHeight;
//                imgWidth = screenWidth/hp;
//            }
//        }
//
//        var paddingLeft = (w = (screenWidth - imgWidth)) > 0  ? w/2.0 : 0,
//            paddingTop = (h = (screenHeight - imgHeight)) > 0  ? h/2.0 : 0;
//
//        $("#curr").attr("style", "padding: "+paddingTop+"px "+paddingLeft+"px;");
//    });

//    $scope.prev = function(){
//        $("#img").hide();
//        $("#curr").attr("style", "padding: 0px;");
//        var len = $rootScope.photos.length;
//        if($rootScope.index-1 >= 0 ){
//            $rootScope.index = $rootScope.index-1;
//            $rootScope.curr_photo = $rootScope.photos[$rootScope.index];
//        }else{
//            $rootScope.index = len-1;
//            $rootScope.curr_photo = $rootScope.photos[$rootScope.index];
//        }
//    }
//    $scope.next = function(){
//        $("#img").hide();
//        $("#curr").attr("style", "padding: 0px;");
//        var len = $rootScope.photos.length;
//        if($rootScope.index+1 >= len ){
//            $rootScope.index = 0;
//            $rootScope.curr_photo = $rootScope.photos[$rootScope.index];
//        }else{
//            $rootScope.index += 1;
//            $rootScope.curr_photo = $rootScope.photos[$rootScope.index];
//        }
//    }
//    $scope.close = $rootScope.back;

}]);