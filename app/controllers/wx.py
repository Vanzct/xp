# coding=utf-8
__author__ = 'Van.zx'

from flask import Blueprint, request, redirect, render_template,  jsonify, current_app
import json
import time
import hashlib
from ..mredis import RedisClient
from ..wechat.outh2 import ApiConfig, WechatApi  # 负责微信页面登陆
import traceback

api = Blueprint('wx', __name__, url_prefix="/api/wx")


def _get_wechat():
    url = "http://" + current_app.config.get('DOMAIN') + "/api/wx/auth"
    # url = "http://" + current_app.config.get('DOMAIN') + '/api/wx/auth'
    api_config = ApiConfig(
        appid=current_app.config.get("WECHAT_APP_ID"),
        app_secret=current_app.config.get("WECHAT_APP_SECRET"),
        redirect_uri=url,
        noncestr=current_app.config.get("WECHAT_NONCE")
    )
    wechat = WechatApi(api_config)
    return wechat


def create_signature(url):
    jsapi_token = RedisClient.get_wx_jsapi_ticket()
    wechat = _get_wechat()
    if not jsapi_token:
        access_token_dict = wechat.get_credential()
        access_token = access_token_dict["access_token"]
        jsapi_token_dict = wechat.get_jsapi_ticket(access_token)
        jsapi_token = jsapi_token_dict["ticket"]
        jsapi_ticket_expires_in = jsapi_token_dict["expires_in"]

        RedisClient.set_wx_jsapi_ticket(jsapi_token, jsapi_ticket_expires_in)
        RedisClient.set_wx_access_token(access_token, jsapi_ticket_expires_in)

    timestamp = int(time.time())

    signature = wechat.generate_jsapi_signature(jsapi_token, timestamp, url)

    r_d = {
        "code": 1,
        "app_id": current_app.config.get("WECHAT_APP_ID"),
        "timestamp": timestamp,
        "noncestr": current_app.config.get("WECHAT_NONCE"),
        "signature": signature,
        'qiniu_bucket_domain': current_app.config.get("QINIU_BUCKET_DOMAIN")
    }
    return r_d


@api.route('/get_tx_signature', methods=['GET', 'POST'])
def get_tx_signature():
    """
    微信JDK需要的签名
    """
    hashcode = request.args.get('hashcode', '')
    try:
        url = "http://" + current_app.config.get('DOMAIN') + "/" + hashcode
        print "JS_SDK url:", url
        r_d = create_signature(url)
        return json.dumps(r_d)
    except TypeError, e:
        current_app.logger.info(traceback.format_exc())
        current_app.logger.error(e)
        return json.dumps({"code": 0})


@api.route('/server_verify', methods=['GET', 'POST'])
def server_verify():
    """
    用于微信公众平台配置使用
    """
    try:
        signature = request.args.get("signature")
        token = current_app.config.get("WECHAT_TOKEN")
        print "token:", token
        timestamp = request.args.get("timestamp")
        nonce = request.args.get("nonce")

        echo_str = request.args.get("echostr")

        tmp_list = [token, timestamp, nonce]
        tmp_list.sort()
        tmp_str = "%s%s%s" % tuple(tmp_list)
        hash_sha1 = hashlib.sha1(tmp_str)
        value = hash_sha1.hexdigest()

        if value == signature:
            return echo_str
        else:
            return "error"
    except Exception, e:
        current_app.logger.error(e)
        return "error"


@api.route("/app_id", methods=['GET'])
def app_id():
    return jsonify({"app_id": current_app.config.get("WECHAT_APP_ID")})


@api.route("/auth", methods=['GET'])
def auth():
    try:
        code = request.args.get('code')
        # print code
        wechat = _get_wechat()
        # print wechat.__dict__
        open_id, access_token, refresh_token = wechat.code_to_access_token(code)
        # print "", open_id, access_token, refresh_token
        wechat.refresh_access_token(refresh_token)
        # user_wx = wechat.get_user_info(access_token, open_id)
        location = "/#/success?open_id=%s&token=%s" % (open_id, access_token)
        print "open_id:", open_id
        return redirect(location)
    except TypeError, e:
        import traceback
        current_app.logger.error(e.message)
        return jsonify({"code": 0})


@api.route("/login")
def login():
    """
    从前端直接跳转到微信授权页，此步骤可忽略
    """
    try:
        wechat = _get_wechat()
        url = "http://" + current_app.config.get('DOMAIN') + "/api/wx/auth"
        url = wechat.url_for_code(scope="snsapi_userinfo", url=url, state=1)
        # 跳转微信服务器授权页面
        print '跳转微信服务器授权页面', url
        return redirect(url)

    except TypeError, e:
        # 如果登陆发生问题，打印日志
        import traceback
        current_app.logger.error(e.message)
        return render_template("wechat_error.html")


@api.route("/create_menu", methods=['GET'])
def set_menu():
    try:
        wechat = _get_wechat()
        access_token = wechat.get_credential()
        domain = "http://"+current_app.config.get("DOMAIN")

        json_menu = {
            'button': [
                {
                    'name': '孩子',
                    'type': 'view',
                    'url': domain + '/#/'
                },
                {
                    'name': '班务',
                    'type': 'view',
                    'url': domain + '/#/class'
                }
            ]
        }
        r = wechat.set_menu(json_menu, access_token["access_token"])
        print r
        return jsonify({"code": 1})
    except TypeError, e:
        # 如果登陆发生问题，打印日志
        import traceback
        current_app.logger.error(e.message)
        return jsonify({"code": 0})


@api.route("/delete_menu", methods=['GET'])
def delete_menu():
    wechat = _get_wechat()
    access_token = wechat.get_credential()
    print "ac token:", access_token
    r = wechat.del_menu(access_token["access_token"])
    return jsonify({"code": 1})


@api.route("/refresh_menu", methods=['GET'])
def refresh_menu():
    delete_menu()
    set_menu()


@api.route("/is_token_expired", methods=['GET', 'POST'])
def is_token_expired():
    # 验证我们的token是否过期  北京市
    # 以及微信是否过期?
    access_token = request.args.get("token")
    user_id = request.args.get("user_id")
    if RedisClient.check_token(access_token, user_id):
        return jsonify({"code": 0})
    else:
        return jsonify({"code": 1})


# 微信授权登录
# 1、引导用户进入授权页面同意授权，获取code login()
# 2、通过code换取网页授权access_token（与基础支持中的access_token不同）
# 3、如果需要，开发者可以刷新网页授权access_token，避免过期
# 4、通过网页授权access_token和openid获取用户基本信息（支持UnionID机制）